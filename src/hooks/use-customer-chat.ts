import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService, ChatMessage, ChatRoom } from '@/services/chat.service';
import { connectChatHub, onChat, disconnectChatHub, joinChatRoom, leaveChatRoom } from '@/services/signalr.service';
import { config } from '@/utils/config';
import { toast } from 'react-toastify';

interface UseChatOptions {
  autoConnect?: boolean;
  enableNotifications?: boolean;
  onDebug?: (event: string, data?: any) => void;
}

interface UseChatReturn {
  // Chat state
  isOpen: boolean;
  isMinimized: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  adminOnlineStatus: 'online' | 'offline' | 'away' | 'busy';
  chatRoom: ChatRoom | null;
  messages: ChatMessage[];
  unreadCount: number;
  isLoading: boolean;
  isSendingMessage: boolean;
  isTyping: boolean;
  isAiTyping: boolean;
  
  // Actions
  openChat: () => Promise<void>;
  closeChat: () => void;
  toggleMinimize: () => void;
  sendMessage: (content: string, messageType?: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  markAsRead: () => void;
  reconnect: () => Promise<void>;
  
  // Utilities
  scrollToBottom: () => void;
  getCurrentUser: () => any;
  formatTimestamp: (timestamp: string) => string;
  isMyMessage: (message: ChatMessage) => boolean;
  isAiMessage: (message: ChatMessage) => boolean;
  isAdminMessage: (message: ChatMessage) => boolean;
}

export const useCustomerChat = (options: UseChatOptions = {}): UseChatReturn => {
  const { autoConnect = false, enableNotifications = true, onDebug } = options;
  
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [adminOnlineStatus, setAdminOnlineStatus] = useState<'online' | 'offline' | 'away' | 'busy'>('offline');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [sentMessageIds, setSentMessageIds] = useState<Set<string>>(() => {
    // Try to restore sent message IDs from session storage
    try {
      const stored = sessionStorage.getItem('sentMessageIds');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }); // Track sent messages
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Use the correct ChatHub URL (port 5007) as backend is running there
  const chatHubUrl = 'http://localhost:5007/chatHub';
  const signalRSetupRef = useRef(false);

  // Get current user info with fallback
  const getCurrentUser = useCallback(() => {
    const debugUser = (account, source) => {
      console.log('[CUSTOMER CHAT DEBUG][getCurrentUser] Source:', source, '| User:', account);
      if (onDebug) onDebug('getCurrentUser', { source, account });
    };
    // Try to get from localStorage first
    let accountStr = localStorage.getItem('account');
    let account = accountStr ? JSON.parse(accountStr) : null;
    if (account) debugUser(account, 'localStorage');
    // If not found, try session storage as backup
    if (!account) {
      accountStr = sessionStorage.getItem('account');
      account = accountStr ? JSON.parse(accountStr) : null;
      if (account) debugUser(account, 'sessionStorage');
    }
    
    // If still not found, try to get from chat session storage
    if (!account) {
      accountStr = sessionStorage.getItem('chatUser');
      account = accountStr ? JSON.parse(accountStr) : null;
      if (account) debugUser(account, 'chatUser');
    }
    
    // Save to session storage for future use if found
    if (account && !sessionStorage.getItem('chatUser')) {
      sessionStorage.setItem('chatUser', JSON.stringify(account));
    }
    if (!account) debugUser(null, 'not found');
    return account;
  }, [onDebug]);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Check if message is from current user
  const isMyMessage = useCallback((message: ChatMessage) => {
    const currentUser = getCurrentUser();
    
    // Enhanced debug logging for this specific issue
    console.log('[CUSTOMER CHAT DEBUG] Message ownership check:', {
      messageId: message.messageId,
      messageSenderId: message.senderId,
      messageSenderName: message.senderName,
      messageContent: message.content,
      currentUserStructure: currentUser,
      keysInCurrentUser: currentUser ? Object.keys(currentUser) : 'null',
      userId: currentUser?.userId,
      accountId: currentUser?.accountId,
      id: currentUser?.id,
      username: currentUser?.username,
      fullName: currentUser?.fullName
    });
    
    // Use simple direct comparison like admin chatbox
    if (!currentUser) {
      console.log('[CUSTOMER CHAT DEBUG] No current user found');
      return false;
    }
    
    // Check if this message was sent by us using sent message tracking
    const wasMessageSentByMe = sentMessageIds.has(message.messageId);
    console.log('[CUSTOMER CHAT DEBUG] Sent message check:', {
      messageId: message.messageId,
      wasMessageSentByMe,
      sentMessageIdsSize: sentMessageIds.size
    });
    
    // If we have record of sending this message, it's definitely ours
    if (wasMessageSentByMe) {
      console.log('[CUSTOMER CHAT DEBUG] Message found in sent messages - definitely mine');
      return true;
    }
    
    // Try multiple possible ID matches
    const possibleMatches = [
      message.senderId === currentUser.userId,
      message.senderId === currentUser.accountId,
      message.senderId === currentUser.id,
      // Also check by username as backup
      message.senderName === currentUser.username,
      message.senderName === currentUser.fullName
    ];
    
    console.log('[CUSTOMER CHAT DEBUG] Possible matches:', {
      matchByUserId: possibleMatches[0],
      matchByAccountId: possibleMatches[1],
      matchById: possibleMatches[2],
      matchByUsername: possibleMatches[3],
      matchByFullName: possibleMatches[4]
    });
    
    // Message is from current user if any of the matches is true
    const isMyMsg = possibleMatches.some(match => match);
    
    console.log('[CUSTOMER CHAT DEBUG] Final result:', isMyMsg);
    
    return isMyMsg;
  }, [getCurrentUser, sentMessageIds]);

  // Check if message is from AI
  const isAiMessage = useCallback((message: ChatMessage) => {
    return message.senderName?.toLowerCase().includes('ai') || 
           message.senderName?.toLowerCase().includes('bot') ||
           message.senderId === 'ai-assistant';
  }, []);

  // Check if message is from admin
  const isAdminMessage = useCallback((message: ChatMessage) => {
    // Check if sender name contains 'admin'
    if (message.senderName?.toLowerCase().includes('admin')) {
      return true;
    }
    
    // Check if senderId is different from current user (likely admin)
    const currentUser = getCurrentUser();
    if (currentUser && message.senderId && 
        message.senderId !== currentUser.userId && 
        message.senderId !== currentUser.accountId && 
        message.senderId !== currentUser.id) {
      return true;
    }
    
    return false;
  }, [getCurrentUser]);

  // Show notification
  const showNotification = useCallback((message: ChatMessage) => {
    if (!enableNotifications || isOpen || isMyMessage(message)) return;
    
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Tin nhắn mới từ hỗ trợ khách hàng', {
          body: message.content,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      }
    } catch (error) {
      console.error('[useCustomerChat] Notification error:', error);
    }
  }, [enableNotifications, isOpen, isMyMessage]);

  // Initialize chat room with admin
  const initializeChatRoom = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[useCustomerChat] Initializing chat room with admin...');
      if (onDebug) onDebug('initializeChatRoom:start');
      
      const room = await chatService.createChatWithAdmin();
      console.log('[useCustomerChat] Chat room created/retrieved:', room);
      if (onDebug) onDebug('initializeChatRoom:room', room);
      setChatRoom(room);
      
      // Add participants to OnlineStatusContext for status tracking
      if (room.participants) {
        room.participants.forEach(participant => {
          if (participant.userId) {
            window.dispatchEvent(new CustomEvent('addUserToOnlineContext', {
              detail: {
                userId: participant.userId,
                username: participant.username || participant.fullName,
                isOnline: participant.isOnline || true,
                lastActiveAt: new Date().toISOString()
              }
            }));
            console.log('[useCustomerChat] ➕ Added participant to OnlineStatusContext:', participant.userId);
          }
        });
      }
      
      // Load messages
      const roomMessages = await chatService.getRoomMessages(room.roomId, 1, 50);
      if (onDebug) onDebug('initializeChatRoom:messages', roomMessages);
      setMessages(roomMessages);
      setUnreadCount(room.unreadCount || 0);
      setCurrentPage(1);
      setHasMoreMessages(roomMessages.length >= 50);
      if (onDebug) onDebug('initializeChatRoom:roomId', room.roomId);
      
      return room.roomId;
    } catch (error) {
      console.error('[useCustomerChat] Error initializing chat room:', error);
      toast.error('Không thể kết nối tới hỗ trợ. Vui lòng thử lại sau.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onDebug]);

  // Connect to SignalR
  const connectToSignalR = useCallback(async (roomId: string) => {
    try {
      setIsConnecting(true);
      const token = localStorage.getItem('access_token');
      const url = chatHubUrl;
      console.log('[useCustomerChat] Connecting to SignalR at:', url);
      if (onDebug) onDebug('connectToSignalR:start', { url, roomId });
      await connectChatHub(url, token || undefined);
      console.log('[useCustomerChat] Joining chat room:', roomId);
      if (onDebug) onDebug('connectToSignalR:joinRoom', { roomId });
      await joinChatRoom(roomId);
      setIsConnected(true);
      console.log('[useCustomerChat] SignalR connected and joined room');
      if (onDebug) onDebug('connectToSignalR:connected', { roomId });
    } catch (error) {
      console.error('[useCustomerChat] SignalR connection error:', error);
      if (onDebug) onDebug('connectToSignalR:error', error);
      toast.error('Kết nối realtime thất bại. Chat vẫn hoạt động nhưng không realtime.');
    } finally {
      setIsConnecting(false);
    }
  }, [chatHubUrl, onDebug]);

  // Setup SignalR event handlers
  const setupSignalREvents = useCallback(() => {
    if (signalRSetupRef.current) return;
    if (onDebug) onDebug('setupSignalREvents:start');
    
    // Listen for new messages (support both 'ReceiveMessage' and 'receivemessage')
    const handleReceiveMessage = (message: ChatMessage) => {
      console.log('[CUSTOMER CHAT SIGNALR] Received new message via SignalR:', message);
      if (onDebug) onDebug('ReceiveMessage', message);
      
      const currentUser = getCurrentUser();
      console.log('[CUSTOMER CHAT SIGNALR] Current user for comparison:', {
        userId: currentUser?.userId,
        accountId: currentUser?.accountId,
        username: currentUser?.username,
        fullName: currentUser?.fullName
      });
      if (onDebug) onDebug('ReceiveMessage:currentUser', currentUser);
      
      // If any critical field is missing, reload all messages for the room
      if (!message.senderName || !message.messageId || !message.content || !message.timestamp || !message.senderId || !message.roomId) {
        if (chatRoom?.roomId) {
          chatService.getRoomMessages(chatRoom.roomId, 1, 50).then(roomMessages => {
            setMessages(roomMessages);
          });
        }
        return;
      }
      setMessages(prev => {
        // Prevent duplicate messages
        const exists = prev.some(m => m.messageId === message.messageId);
        if (exists) {
          console.log('[CUSTOMER CHAT SIGNALR] Message already exists, skipping');
          return prev;
        }
        console.log('[CUSTOMER CHAT SIGNALR] Adding new message to list');
        return [...prev, message];
      });
      // Show notification
      showNotification(message);
      // Increase unread count if chat is minimized or closed
      if (isMinimized || !isOpen) {
        setUnreadCount(prev => prev + 1);
      }
      // Auto-scroll to bottom
      scrollToBottom();
    };
    onChat('ReceiveMessage', handleReceiveMessage);
    onChat('receivemessage', handleReceiveMessage);

    // Listen for message deleted
    onChat('MessageDeleted', ({ messageId }: { messageId: string }) => {
      console.log('[useCustomerChat] Message deleted via SignalR:', messageId);
      setMessages(prev => prev.map(msg => 
        msg.messageId === messageId 
          ? { ...msg, isDeleted: true, content: '[Tin nhắn đã bị xóa]' }
          : msg
      ));
    });

    // Listen for message updated
    onChat('MessageUpdated', (updatedMessage: ChatMessage) => {
      console.log('[useCustomerChat] Message updated via SignalR:', updatedMessage);
      setMessages(prev => prev.map(msg => 
        msg.messageId === updatedMessage.messageId ? updatedMessage : msg
      ));
    });

    // Listen for typing indicators
    onChat('UserTyping', ({ userId }: { userId: string }) => {
      const currentUser = getCurrentUser();
      if (userId !== currentUser?.id) {
        setIsTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    // Listen for AI typing
    onChat('AITyping', () => {
      setIsAiTyping(true);
    });

    onChat('AITypingStopped', () => {
      setIsAiTyping(false);
    });

    // Listen for connection status
    onChat('Connected', () => {
      console.log('[useCustomerChat] SignalR connected');
      setIsConnected(true);
      setAdminOnlineStatus('online'); // Admin available when connected
    });

    onChat('Disconnected', () => {
      console.log('[useCustomerChat] SignalR disconnected');
      setIsConnected(false);
      setAdminOnlineStatus('offline');
    });

    // Listen for admin status changes (if backend supports this)
    onChat('AdminStatusChanged', ({ status }: { status: 'online' | 'offline' | 'away' | 'busy' }) => {
      console.log('[useCustomerChat] Admin status changed:', status);
      setAdminOnlineStatus(status);
    });

    signalRSetupRef.current = true;
    console.log('[useCustomerChat] SignalR event handlers set up');
    if (onDebug) onDebug('setupSignalREvents:done');
  }, [isMinimized, isOpen, scrollToBottom, getCurrentUser, showNotification, onDebug]);

  // Open chat
  const openChat = useCallback(async () => {
    try {
      setIsOpen(true);
      setUnreadCount(0);

      if (!chatRoom) {
        const roomId = await initializeChatRoom();
        if (!signalRSetupRef.current) {
          setupSignalREvents();
        }
        await connectToSignalR(roomId);
      }

      setTimeout(scrollToBottom, 300);
    } catch (error) {
      console.error('[useCustomerChat] Error opening chat:', error);
    }
  }, [chatRoom, initializeChatRoom, connectToSignalR, setupSignalREvents, scrollToBottom]);

  // Close chat
  const closeChat = useCallback(async () => {
    setIsOpen(false);
    setIsMinimized(false);
    
    if (chatRoom?.roomId) {
      try {
        await leaveChatRoom(chatRoom.roomId);
      } catch (error) {
        console.error('[useCustomerChat] Error leaving chat room:', error);
      }
    }
  }, [chatRoom]);

  // Toggle minimize
  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => {
      const newMinimized = !prev;
      if (!newMinimized) {
        setUnreadCount(0);
        setTimeout(scrollToBottom, 300);
      }
      return newMinimized;
    });
  }, [scrollToBottom]);

  // Send message
  const sendMessage = useCallback(async (content: string, messageType: 'Text' | 'Image' | 'File' = 'Text') => {
    if (!content.trim() || !chatRoom || isSendingMessage) return;

    const messageContent = content.trim();
    
    try {
      setIsSendingMessage(true);

      console.log('[useCustomerChat] Sending message:', messageContent);
      
      const sentMessage = await chatService.sendMessage({
        roomId: chatRoom.roomId,
        content: messageContent,
        messageType
      });

      console.log('[useCustomerChat] Message sent successfully:', sentMessage);
      
      // Track this message as sent by us
      if (sentMessage && sentMessage.messageId) {
        setSentMessageIds(prev => new Set([...prev, sentMessage.messageId]));
      }
      
      // Message will be added via SignalR ReceiveMessage event
      scrollToBottom();
    } catch (error) {
      console.error('[useCustomerChat] Error sending message:', error);
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
      throw error;
    } finally {
      setIsSendingMessage(false);
    }
  }, [chatRoom, isSendingMessage, scrollToBottom, setSentMessageIds]);

  // Save sent message IDs to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem('sentMessageIds', JSON.stringify([...sentMessageIds]));
    } catch (error) {
      console.error('Error saving sent message IDs:', error);
    }
  }, [sentMessageIds]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!chatRoom || isLoading || !hasMoreMessages) return;

    try {
      setIsLoading(true);
      const nextPage = currentPage + 1;
      
      const moreMessages = await chatService.getRoomMessages(chatRoom.roomId, nextPage, 50);
      
      if (moreMessages.length === 0) {
        setHasMoreMessages(false);
      } else {
        setMessages(prev => [...moreMessages, ...prev]);
        setCurrentPage(nextPage);
        setHasMoreMessages(moreMessages.length >= 50);
      }
    } catch (error) {
      console.error('[useCustomerChat] Error loading more messages:', error);
      toast.error('Không thể tải thêm tin nhắn.');
    } finally {
      setIsLoading(false);
    }
  }, [chatRoom, isLoading, hasMoreMessages, currentPage]);

  // Mark messages as read
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Reconnect
  const reconnect = useCallback(async () => {
    if (chatRoom?.roomId) {
      await connectToSignalR(chatRoom.roomId);
    }
  }, [chatRoom, connectToSignalR]);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      
      // Check if timestamp is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return date.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else {
        return date.toLocaleDateString('vi-VN', { 
          day: '2-digit', 
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Unknown time';
    }
  }, []);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && !chatRoom) {
      openChat();
    }
  }, [autoConnect, chatRoom, openChat]);

  // Request notification permission
  useEffect(() => {
    if (enableNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [enableNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      disconnectChatHub();
    };
  }, []);

  return {
    // Chat state
    isOpen,
    isMinimized,
    isConnecting,
    isConnected,
    adminOnlineStatus,
    chatRoom,
    messages,
    unreadCount,
    isLoading,
    isSendingMessage,
    isTyping,
    isAiTyping,
    
    // Actions
    openChat,
    closeChat,
    toggleMinimize,
    sendMessage,
    loadMoreMessages,
    markAsRead,
    reconnect,
    
    // Utilities
    scrollToBottom,
    getCurrentUser,
    formatTimestamp,
    isMyMessage,
    isAiMessage,
    isAdminMessage
  };
};

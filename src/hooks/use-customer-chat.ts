import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService, ChatMessage, ChatRoom } from '@/services/chat.service';
import { connectChatHub, onChat, disconnectChatHub, joinChatRoom, leaveChatRoom } from '@/services/signalr.service';
import { config } from '@/utils/config';
import { toast } from 'react-toastify';

interface UseChatOptions {
  autoConnect?: boolean;
  enableNotifications?: boolean;
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
}

export const useCustomerChat = (options: UseChatOptions = {}): UseChatReturn => {
  const { autoConnect = false, enableNotifications = true } = options;
  
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
  const chatHubUrl = `${config.gatewayUrl}/chatHub`;
  const signalRSetupRef = useRef(false);

  // Get current user info with fallback
  const getCurrentUser = useCallback(() => {
    // Try to get from localStorage first
    let accountStr = localStorage.getItem('account');
    let account = accountStr ? JSON.parse(accountStr) : null;
    
    // If not found, try session storage as backup
    if (!account) {
      accountStr = sessionStorage.getItem('account');
      account = accountStr ? JSON.parse(accountStr) : null;
    }
    
    // If still not found, try to get from chat session storage
    if (!account) {
      accountStr = sessionStorage.getItem('chatUser');
      account = accountStr ? JSON.parse(accountStr) : null;
    }
    
    // Save to session storage for future use if found
    if (account && !sessionStorage.getItem('chatUser')) {
      sessionStorage.setItem('chatUser', JSON.stringify(account));
    }
    
    return account;
  }, []);

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
    console.log('[ENHANCED DEBUG] Message ownership check:', {
      messageId: message.messageId,
      messageSenderId: message.senderId,
      messageSenderName: message.senderName,
      currentUserStructure: currentUser,
      keysInCurrentUser: currentUser ? Object.keys(currentUser) : 'null',
      userId: currentUser?.userId,
      accountId: currentUser?.accountId,
      id: currentUser?.id,
      matchByUserId: message.senderId === currentUser?.userId,
      matchByAccountId: message.senderId === currentUser?.accountId,
      matchById: message.senderId === currentUser?.id
    });
    
    // Use debug utils for detailed logging
    const isMyMsg = (() => {
      // Check if we've tracked this message as sent by us
      if (sentMessageIds.has(message.messageId)) {
        return true;
      }
      
      // If no current user, assume false
      if (!currentUser) {
        return false;
      }
      
      // Check by senderId with various user ID fields
      if (message.senderId === currentUser.id || 
          message.senderId === currentUser.accountId ||
          message.senderId === currentUser.userId) {
        return true;
      }
      
      // Check by sender name if senderId doesn't match
      if (message.senderName === currentUser.name || 
          message.senderName === currentUser.fullName ||
          message.senderName === currentUser.displayName) {
        return true;
      }
      
      // Check if message has user role indicator
      if (message.senderName === 'Customer' || message.senderName === 'User') {
        return true;
      }
      
      // Additional check: if message doesn't have admin or AI indicators, and we have a current user, it might be ours
      const isAdminMessage = message.senderName?.toLowerCase().includes('admin');
      const isAIMessage = message.senderName?.toLowerCase().includes('ai') || 
                         message.senderName?.toLowerCase().includes('bot') ||
                         message.senderId === 'ai-assistant';
      
      // If it's not admin or AI, and we have current user, assume it's ours
      if (!isAdminMessage && !isAIMessage && (currentUser.id || currentUser.accountId)) {
        return true;
      }
      
      return false;
    })();
    
    return isMyMsg;
  }, [getCurrentUser, sentMessageIds]);

  // Check if message is from AI
  const isAiMessage = useCallback((message: ChatMessage) => {
    return message.senderName?.toLowerCase().includes('ai') || 
           message.senderName?.toLowerCase().includes('bot') ||
           message.senderId === 'ai-assistant';
  }, []);

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
      
      const room = await chatService.createChatWithAdmin();
      console.log('[useCustomerChat] Chat room created/retrieved:', room);
      
      setChatRoom(room);
      
      // Load messages
      const roomMessages = await chatService.getRoomMessages(room.roomId, 1, 50);
      console.log('[useCustomerChat] Messages loaded:', roomMessages);
      
      setMessages(roomMessages);
      setUnreadCount(room.unreadCount || 0);
      setCurrentPage(1);
      setHasMoreMessages(roomMessages.length >= 50);
      
      return room.roomId;
    } catch (error) {
      console.error('[useCustomerChat] Error initializing chat room:', error);
      toast.error('Không thể kết nối tới hỗ trợ. Vui lòng thử lại sau.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connect to SignalR
  const connectToSignalR = useCallback(async (roomId: string) => {
    try {
      setIsConnecting(true);
      const token = localStorage.getItem('access_token');
      
      console.log('[useCustomerChat] Connecting to SignalR...');
      await connectChatHub(chatHubUrl, token || undefined);
      
      console.log('[useCustomerChat] Joining chat room:', roomId);
      await joinChatRoom(roomId);
      
      setIsConnected(true);
      console.log('[useCustomerChat] SignalR connected and joined room');
    } catch (error) {
      console.error('[useCustomerChat] SignalR connection error:', error);
      toast.error('Kết nối realtime thất bại. Chat vẫn hoạt động nhưng không realtime.');
    } finally {
      setIsConnecting(false);
    }
  }, [chatHubUrl]);

  // Setup SignalR event handlers
  const setupSignalREvents = useCallback(() => {
    if (signalRSetupRef.current) return;
    
    // Listen for new messages
    onChat('ReceiveMessage', (message: ChatMessage) => {
      console.log('[useCustomerChat] Received new message via SignalR:', message);
      setMessages(prev => {
        // Prevent duplicate messages
        const exists = prev.some(m => m.messageId === message.messageId);
        if (exists) return prev;
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
    });

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
  }, [isMinimized, isOpen, scrollToBottom, getCurrentUser, showNotification]);

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
    isAiMessage
  };
};

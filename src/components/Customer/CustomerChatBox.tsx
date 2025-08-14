import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  MessageCircle,
  User,
  Users,
  Sparkles,
} from 'lucide-react';
import { FaRobot, FaUserFriends } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
import { UserStatusBadge } from '@/components/ui/user-status-badge';
import { chatService } from '@/services/chat.service';
import { useCustomerChat } from '@/hooks/use-customer-chat';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { getCurrentAccount } from '@/utils/account-utils';

// Chuẩn hóa message theo ChatMessageDto từ backend
interface UnifiedMessage {
  id: string;
  roomId: string;
  senderUserId: string;
  senderUserName: string;
  senderAvatarUrl?: string;
  content: string;
  type: number; // 0 = Text, 1 = Image, 2 = File
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  replyToMessageId?: string;
  replyToMessage?: UnifiedMessage;
  createdAt: string | Date;
  updatedAt: string | Date;
  isEdited?: boolean;
  isDeleted?: boolean;
  readByUserIds?: string[];
  mentionedUserIds?: string[];
  isUser: boolean;
  isStreaming?: boolean;
  isError?: boolean;
  isAI?: boolean;
  senderName?: string;
  sources?: string[]; // Nguồn tham khảo cho AI
}

interface UnifiedCustomerChatProps {
  className?: string;
}

const CustomerChatBoxInternal: React.FC<UnifiedCustomerChatProps> = ({ className = '' }) => {
  const { getThemeClass } = useThemeClasses();

  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  // messagesLocal: luôn là nguồn hiển thị, luôn merge/gộp từ server/local/stream
  const [messagesLocal, setMessagesLocal] = useState<UnifiedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [aiFailureCount, setAiFailureCount] = useState(0);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false); // Track mode switching state
  // localModeOverride chỉ dùng khi đang chuyển mode, không phải source of truth
  const [localModeOverride, setLocalModeOverride] = useState<'ai' | 'human' | null>(null);

  // Track current chat room id for mode switching
  const [roomId, setRoomId] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use customer chat hook for admin chat functionality
  const {
    isConnected,
    chatRoom,
    messages: adminMessages,
    openChat: openAdminChat,
    closeChat: closeAdminChat,
    currentChatMode, // Get the current chat mode from the hook
  } = useCustomerChat({ autoConnect: false });

  // Use the chat mode from the hook with smooth transition
  const chatMode = localModeOverride || currentChatMode;

  // Handle mode switching and synchronization
  useEffect(() => {
    // Reset mode switching state when server confirms the change
    if (isSwitchingMode && localModeOverride && currentChatMode === localModeOverride) {
      setIsSwitchingMode(false);
      setLocalModeOverride(null);
      
      // Save current mode to localStorage
      if (roomId) {
        try {
          const storageKey = `chat_history_${roomId}`;
          const storedData = localStorage.getItem(storageKey);
          if (storedData) {
            const data = JSON.parse(storedData);
            localStorage.setItem(storageKey, JSON.stringify({
              ...data,
              mode: currentChatMode,
              timestamp: new Date().getTime()
            }));
          }
        } catch (e) {
          console.warn('Failed to update chat mode in storage:', e);
        }
      }
    }
    
    // Clear override if switching is cancelled
    if (!isSwitchingMode && localModeOverride) {
      setLocalModeOverride(null);
    }
  }, [currentChatMode, isSwitchingMode, localModeOverride, roomId]);

  // Track chatRoom id for mode switching
  useEffect(() => {
    if (chatRoom?.roomId) {
      setRoomId(chatRoom.roomId);

      // Note: Mode syncing is now handled by useCustomerChat hook
    }
  }, [chatRoom, chatMode]);

  // Realtime: Mode change events are handled by useCustomerChat hook

  // Generate message ID
  const generateMessageId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9);
  }, []);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Add message to local state (chỉ dùng cho AI/local)
  const addLocalMessage = useCallback(
    (
      content: string,
      isUser: boolean,
      isError: boolean = false,
      isAI: boolean = false,
      senderName?: string,
      sources?: string[],
      replyToMessage?: UnifiedMessage
    ): string => {
      const messageId = generateMessageId();
      const now = new Date();
      // Lấy account thật từ localStorage hoặc util
      let realUserId = '';
      let realUserName = '';
      try {
        const accStr = localStorage.getItem('account');
        if (accStr) {
          const acc = JSON.parse(accStr);
          realUserId = acc.userId || acc.accountId || acc.id || '';
          realUserName = acc.username || acc.fullName || acc.name || '';
        }
      } catch {}
      // Lấy roomId thật nếu có
      let currentRoomId = roomId || '';
      const newMessage: UnifiedMessage = {
        id: messageId,
        roomId: currentRoomId,
        senderUserId: isUser ? realUserId : '',
        senderUserName: senderName || (isUser ? realUserName : isAI ? 'AI Assistant' : 'Support Agent'),
        content,
        type: 0,
        attachments: [],
        createdAt: now,
        updatedAt: now,
        isUser,
        isError,
        isAI,
        isEdited: false,
        isDeleted: false,
        readByUserIds: [],
        mentionedUserIds: [],
        replyToMessageId: replyToMessage?.id,
        replyToMessage,
        sources,
      };
      setMessagesLocal((prev) => {
        if (prev.some(m => m.id === messageId)) return prev;
        return [...prev, newMessage];
      });
      scrollToBottom();
      return messageId;
    },
    [generateMessageId, scrollToBottom]
  );

  // Quản lý lịch sử chat và đồng bộ hóa
  const getStorageKey = useCallback((rid: string) => `veezy_chat_history_${rid}`, []);
  
  // Lưu lịch sử vào localStorage
  const saveHistory = useCallback((messages: UnifiedMessage[]) => {
    if (!roomId) return;
    try {
      const storageKey = getStorageKey(roomId);
      localStorage.setItem(storageKey, JSON.stringify({
        messages,
        mode: chatMode,
        timestamp: new Date().getTime()
      }));
    } catch (e) {
      console.warn('Failed to save chat history:', e);
    }
  }, [roomId, chatMode, getStorageKey]);

  // Khôi phục lịch sử từ localStorage
  const restoreHistory = useCallback((): UnifiedMessage[] | null => {
    if (!roomId) return null;
    try {
      const storageKey = getStorageKey(roomId);
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const { messages, timestamp } = JSON.parse(storedData);
        const isRecent = (new Date().getTime() - timestamp) < 24 * 60 * 60 * 1000;
        if (isRecent && Array.isArray(messages) && messages.length > 0) {
          return messages;
        }
      }
    } catch (e) {
      console.warn('Failed to restore chat history:', e);
    }
    return null;
  }, [roomId, getStorageKey]);



  // Quản lý và đồng bộ lịch sử chat khi component mount hoặc room/mode thay đổi
  useEffect(() => {
    let isSubscribed = true;
    let lastSyncTimestamp = 0;

    const initializeChat = async () => {
      if (!roomId || !isSubscribed) return;

      try {
        // 1. Try to restore from localStorage first
        const storageKey = getStorageKey(roomId);
        let currentMessages: UnifiedMessage[] = [];
        
        try {
          const storedData = localStorage.getItem(storageKey);
          if (storedData) {
            const { messages, timestamp } = JSON.parse(storedData);
            const isRecent = (new Date().getTime() - timestamp) < 24 * 60 * 60 * 1000;
            if (isRecent && Array.isArray(messages)) {
              currentMessages = messages;
            }
          }
        } catch (e) {
          console.warn('Failed to restore from localStorage:', e);
        }

        // 2. Load messages from server
        if (isSubscribed) {
          const serverMessages = await chatService.getRoomMessages(roomId, 1, 50);
          
          if (Array.isArray(serverMessages) && serverMessages.length > 0) {
            const currentUserId = getCurrentAccount()?.userId || '';
            const messageMap = new Map(currentMessages.map(m => [m.id, m]));

            // Merge server messages with local messages
            for (const msg of serverMessages) {
              const localMsg = messageMap.get(msg.messageId);
              if (localMsg?.isUser === true) continue;

              const isUser = !!currentUserId && msg.senderId === currentUserId;
              messageMap.set(msg.messageId, {
                id: msg.messageId,
                roomId: msg.roomId || roomId,
                senderUserId: msg.senderId,
                senderUserName: msg.senderName,
                content: msg.content,
                type: 0,
                createdAt: msg.createdAt || msg.timestamp,
                updatedAt: msg.createdAt || msg.timestamp,
                isUser,
                isAI: msg.senderId === 'system-ai-bot',
                isError: false,
                isStreaming: false,
                isEdited: msg.isEdited || false,
                isDeleted: msg.isDeleted || false,
                senderName: msg.senderName,
                attachments: [],
                readByUserIds: [],
                mentionedUserIds: [],
                replyToMessageId: msg.replyToMessageId,
                replyToMessage: undefined
              });
            }

            const mergedMessages = Array.from(messageMap.values())
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            if (isSubscribed) {
              setMessagesLocal(mergedMessages);
              // Save to localStorage
              try {
                localStorage.setItem(storageKey, JSON.stringify({
                  messages: mergedMessages,
                  mode: chatMode,
                  timestamp: new Date().getTime()
                }));
              } catch (e) {
                console.warn('Failed to save to localStorage:', e);
              }
              lastSyncTimestamp = new Date().getTime();
            }
          }
        }

        // 3. Add welcome message for AI mode if no messages
        if (isSubscribed && currentMessages.length === 0 && chatMode === 'ai') {
          const welcomeMsg: UnifiedMessage = {
            id: generateMessageId(),
            roomId,
            senderUserId: 'system-ai-bot',
            senderUserName: 'AI Assistant',
            content: "Hello! I am Veezy's AI Assistant. I can help you learn about events, tickets, and answer your questions. Ask me anything!",
            type: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            isUser: false,
            isAI: true,
            isError: false,
            isStreaming: false,
            isEdited: false,
            isDeleted: false,
            senderName: 'AI Assistant',
            attachments: [],
            readByUserIds: [],
            mentionedUserIds: [],
          };
          setMessagesLocal([welcomeMsg]);
        }

        // 4. Scroll to bottom after initialization
        if (isSubscribed) {
          setTimeout(scrollToBottom, 400);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        if (isSubscribed) {
          addLocalMessage(
            'Failed to load chat history. Please try refreshing the page.',
            false,
            true,
            false,
            'System'
          );
        }
      }

      try {
        // 1. Khôi phục từ localStorage trước
        let currentMessages = restoreHistory() || [];
        
        // 2. Kiểm tra và thêm welcome message cho AI mode
        if (chatMode === 'ai' && currentMessages.length === 0) {
          const welcomeMsg = "Hello! I am Veezy's AI Assistant. I can help you learn about events, tickets, and answer your questions. Ask me anything!";
          currentMessages = [{
            id: generateMessageId(),
            roomId: roomId,
            senderUserId: 'system-ai-bot',
            senderUserName: 'AI Assistant',
            content: welcomeMsg,
            type: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            isUser: false,
            isAI: true,
            isError: false,
            isStreaming: false,
            isEdited: false,
            isDeleted: false,
            attachments: [],
            readByUserIds: [],
            mentionedUserIds: [],
            replyToMessageId: undefined,
            replyToMessage: undefined
          }, ...currentMessages];
        }
        
        // 3. Cập nhật state với tin nhắn local trước
        if (isSubscribed) {
          setMessagesLocal(currentMessages);
        }

        // 4. Load tin nhắn từ server và merge
        const serverHistory = await chatService.getRoomMessages(roomId, 1, 50);
        if (Array.isArray(serverHistory) && serverHistory.length > 0) {
          const currentUserId = getCurrentAccount()?.userId || '';
          const messageMap = new Map(currentMessages.map(m => [m.id, m]));

          // Merge tin nhắn server với local
          for (const msg of serverHistory) {
            // Bỏ qua nếu tin nhắn local đã có và đánh dấu là của user
            const localMsg = messageMap.get(msg.messageId);
            if (localMsg?.isUser === true) continue;

            const isUser = !!currentUserId && msg.senderId === currentUserId;
            messageMap.set(msg.messageId, {
              id: msg.messageId,
              roomId: msg.roomId || roomId,
              senderUserId: msg.senderId,
              senderUserName: msg.senderName,
              content: msg.content,
              type: 0,
              createdAt: msg.createdAt || msg.timestamp,
              updatedAt: msg.createdAt || msg.timestamp,
              isUser,
              isAI: msg.senderId === 'system-ai-bot',
              isError: false,
              isStreaming: false,
              isEdited: msg.isEdited || false,
              isDeleted: msg.isDeleted || false,
              senderName: msg.senderName,
              attachments: [],
              readByUserIds: [],
              mentionedUserIds: [],
              replyToMessageId: msg.replyToMessageId,
              replyToMessage: undefined
            });
          }

          const mergedMessages = Array.from(messageMap.values())
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          if (isSubscribed) {
            setMessagesLocal(mergedMessages);
            saveHistory(mergedMessages);
            lastSyncTimestamp = new Date().getTime();
          }
        }

        // 5. Scroll to bottom sau khi load xong
        if (isSubscribed) {
          setTimeout(scrollToBottom, 400);
        }

      } catch (error) {
        console.error('Error initializing chat:', error);
        if (isSubscribed) {
          addLocalMessage(
            'Failed to load chat history. Please try refreshing the page.',
            false,
            true,
            false,
            'System'
          );
        }
      }
    };

    // Khởi tạo chat ngay khi component mount hoặc room/mode thay đổi
    initializeChat();

    // Auto-sync mỗi 30 giây nếu đang ở mode human
    const syncInterval = setInterval(() => {
      if (chatMode === 'human' && roomId && new Date().getTime() - lastSyncTimestamp > 30000) {
        initializeChat();
      }
    }, 30000);

    return () => {
      isSubscribed = false;
      clearInterval(syncInterval);
      if (roomId) {
        saveHistory(messagesLocal);
      }
    };
  }, [roomId, chatMode, addLocalMessage, generateMessageId, scrollToBottom, saveHistory, restoreHistory]); // Chỉ chạy lại khi roomId thay đổi

  // Open chat - Khởi tạo và mở chat box
  const openChat = useCallback(async () => {
    setIsOpen(true);
    setLocalModeOverride(null);

    // Lấy history key
    const getStorageKey = (rid: string) => `veezy_chat_history_${rid}`;

    // Tạo chat room với admin khi user mở chat lần đầu
    if (!chatRoom && !roomId) {
      try {
        await openAdminChat();
      } catch (err) {
        console.warn('Failed to initialize chat:', err);
      }
    }

    // Xử lý tin nhắn khi mở lại chat
    if (roomId) {
      // 1. Thử lấy lịch sử từ localStorage
      try {
        const storageKey = getStorageKey(roomId);
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
          const { messages, timestamp } = JSON.parse(storedData);
          const isRecent = (new Date().getTime() - timestamp) < 24 * 60 * 60 * 1000;
          if (isRecent && Array.isArray(messages) && messages.length > 0) {
            setMessagesLocal(messages);
          }
        }
      } catch (e) {
        console.warn('Failed to restore chat history:', e);
      }

      // 2. Merge với tin nhắn server trong chế độ human
      if (chatMode === 'human') {
        const currentUserId = getCurrentAccount()?.userId || '';
        
        setMessagesLocal((prev) => {
          const map = new Map(prev.map(m => [m.id, m]));
          
          for (const msg of adminMessages) {
            const existed = map.get(msg.messageId);
            if (existed?.isUser === true) continue;
            
            map.set(msg.messageId, {
              id: msg.messageId,
              roomId: msg.roomId || roomId,
              senderUserId: msg.senderId,
              senderUserName: msg.senderName,
              content: msg.content,
              type: 0,
              createdAt: msg.createdAt || msg.timestamp,
              updatedAt: msg.createdAt || msg.timestamp,
              isUser: msg.senderId === currentUserId,
              isAI: msg.senderId === 'system-ai-bot',
              isError: false,
              isStreaming: false,
              isEdited: msg.isEdited || false,
              isDeleted: msg.isDeleted || false,
              senderName: msg.senderName,
              attachments: [],
              readByUserIds: [],
              mentionedUserIds: [],
              replyToMessageId: msg.replyToMessageId,
              replyToMessage: undefined
            });
          }

          const mergedMessages = Array.from(map.values());
          
          // Lưu vào localStorage sau khi merge
          try {
            const storageKey = getStorageKey(roomId);
            localStorage.setItem(storageKey, JSON.stringify({
              messages: mergedMessages,
              mode: chatMode,
              timestamp: new Date().getTime()
            }));
          } catch (e) {
            console.warn('Failed to save merged messages:', e);
          }

          return mergedMessages;
        });
      }
    }

    // Scroll to bottom after opening
    setTimeout(scrollToBottom, 400);
  }, [scrollToBottom, openAdminChat, chatRoom, roomId, addLocalMessage, chatMode, adminMessages]);

  // Close chat
  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setLocalModeOverride(null); // reset override khi đóng chat box
    // Chỉ reset messagesLocal nếu đang ở chế độ AI, còn human giữ nguyên để khi mở lại còn đồng bộ lại
    if (chatMode === 'ai') setMessagesLocal([]);
    // Abort any ongoing streaming
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Close admin chat if connected
    if (isConnected) {
      closeAdminChat();
    }
  }, [isConnected, closeAdminChat, chatMode]);

  // Toggle minimize
  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => {
      const newMinimized = !prev;
      if (!newMinimized) {
        setTimeout(scrollToBottom, 300);
      }
      return newMinimized;
    });
  }, [scrollToBottom]);

  // Update streaming message
  const updateStreamingMessage = useCallback(
    (messageId: string, content: string, isComplete: boolean = false) => {
      setMessagesLocal((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content, isStreaming: !isComplete } : msg
        )
      );

      if (isComplete) {
        setIsStreaming(false);
        setStreamingMessageId(null);
      }

      scrollToBottom();
    },
    [scrollToBottom]
  );

  // Auto-fallback to admin if AI fails multiple times
  const handleAIFailure = useCallback(() => {
    const newFailureCount = aiFailureCount + 1;
    setAiFailureCount(newFailureCount);
    if (newFailureCount >= 2) {
      console.warn('AI Assistant failure count:', newFailureCount);
    }
  }, [aiFailureCount]);

  // Send AI message (sử dụng endpoint /api/ChatMessage/ai-chat)
  const sendAIMessage = useCallback(
    async (messageContent: string) => {
      if (!roomId) {
        addLocalMessage(
          'Chat room not ready. Please try again in a moment.',
          false,
          true,
          false,
          'System'
        );
        return;
      }

      try {
        addLocalMessage(messageContent, true);
        const aiMessageId = addLocalMessage('', false, false, true);
        setIsStreaming(true);
        setStreamingMessageId(aiMessageId);
        abortControllerRef.current = new AbortController();

        // Gọi API AI với roomId thông qua endpoint /api/ChatMessage/ai-chat
        const aiResponse = await chatService.processAIChat(roomId, messageContent);

        let answer = '';
        let sources: string[] = [];

        if (typeof aiResponse === 'string') {
          // Thử parse nếu là JSON string
          try {
            const parsed = JSON.parse(aiResponse);
            answer = parsed.Answer || parsed.answer || '';
            sources = parsed.Sources || parsed.sources || [];
          } catch {
            answer = aiResponse;
          }
        } else if (typeof aiResponse === 'object' && aiResponse !== null) {
          const responseObj = aiResponse as Record<string, unknown>;
          answer = (responseObj.Answer as string) || (responseObj.answer as string) || '';
          sources = (responseObj.Sources as string[]) || (responseObj.sources as string[]) || [];
        }

        updateStreamingMessage(aiMessageId, answer, true);
        if (sources && sources.length > 0) {
          setMessagesLocal((prev) =>
            prev.map((msg) => (msg.id === aiMessageId ? { ...msg, sources } : msg))
          );
        }
        setAiFailureCount(0);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          if (streamingMessageId) {
            updateStreamingMessage(streamingMessageId, 'Đã hủy yêu cầu.', true);
          }
        } else {
          addLocalMessage(
            'Sorry, the AI Assistant is currently unable to respond.',
            false,
            true,
            true
          );
          handleAIFailure();
        }
        setIsStreaming(false);
        setStreamingMessageId(null);
      } finally {
        abortControllerRef.current = null;
      }
    },
    [roomId, addLocalMessage, updateStreamingMessage, streamingMessageId, handleAIFailure]
  );

  // Send message to human support (mode human)
  const sendHumanMessage = useCallback(
    async (messageContent: string) => {
      if (!roomId) {
        addLocalMessage(
          'Chat room not ready. Please try again in a moment.',
          false,
          true,
          false,
          'System'
        );
        return;
      }
      try {
        addLocalMessage(messageContent, true);
        // Gửi message qua API /api/ChatMessage
        await chatService.sendMessage({
          roomId,
          content: messageContent,
          messageType: 'Text',
        });
        // Tin nhắn sẽ được cập nhật qua SignalR hoặc reload lại nếu cần
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        addLocalMessage(
          'Failed to send message to support agent: ' + errorMessage,
          false,
          true,
          false,
          'System'
        );
      }
    },
    [roomId, addLocalMessage]
  );

  // Send admin message
  // Removed sendAdminMessageHandler (admin mode not used)

  // Main send message function
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || isStreaming) return;
    const messageContent = newMessage.trim();
    setNewMessage('');
    if (chatMode === 'ai') {
      await sendAIMessage(messageContent);
    } else {
      await sendHumanMessage(messageContent);
    }
  }, [newMessage, isStreaming, sendAIMessage, sendHumanMessage, chatMode]);

  // Handle key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: Date | string | number) => {
    try {
      let messageDate: Date;

      // Handle different timestamp formats
      if (timestamp instanceof Date) {
        messageDate = timestamp;
      } else if (typeof timestamp === 'string') {
        messageDate = new Date(timestamp);
      } else if (typeof timestamp === 'number') {
        messageDate = new Date(timestamp);
      } else {
        return new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }

      // Check if the date is valid
      if (isNaN(messageDate.getTime())) {
        return new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }

      const now = new Date();
      const isToday = messageDate.toDateString() === now.toDateString();

      if (isToday) {
        return messageDate.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        });
      } else {
        return messageDate.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      // Return current time as fallback
      return new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }, []);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messagesLocal, adminMessages, isOpen, isMinimized, scrollToBottom]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) {
        const target = event.target as HTMLElement;
        // Check if click is outside the modal and not on the toggle button
        const modal = document.querySelector('[data-chat-modal]') as HTMLElement;
        const toggleButton = document.querySelector('[data-chat-toggle]') as HTMLElement;

        if (modal && !modal.contains(target) && toggleButton && !toggleButton.contains(target)) {
          closeChat();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeChat]);

  // Xử lý realtime updates từ SignalR
  useEffect(() => {
    if (!roomId || chatMode !== 'human') return;

    // Debounce để tránh update quá nhiều
    const timeoutId = setTimeout(() => {
      const currentUserId = getCurrentAccount()?.userId || '';
      
      setMessagesLocal((prev) => {
        const messageMap = new Map(prev.map(m => [m.id, m]));
        let hasNewMessages = false;

        // Chỉ merge tin nhắn mới từ server
        for (const msg of adminMessages) {
          const localMsg = messageMap.get(msg.messageId);
          // Skip nếu tin nhắn đã có và được đánh dấu là của user
          if (localMsg?.isUser === true) continue;

          if (!messageMap.has(msg.messageId)) {
            hasNewMessages = true;
            const isUser = !!currentUserId && msg.senderId === currentUserId;
            messageMap.set(msg.messageId, {
              id: msg.messageId,
              roomId: msg.roomId || roomId,
              senderUserId: msg.senderId,
              senderUserName: msg.senderName,
              content: msg.content,
              type: 0,
              createdAt: msg.createdAt || msg.timestamp,
              updatedAt: msg.createdAt || msg.timestamp,
              isUser,
              isAI: msg.senderId === 'system-ai-bot',
              isError: false,
              isStreaming: false,
              isEdited: msg.isEdited || false,
              isDeleted: msg.isDeleted || false,
              senderName: msg.senderName,
              attachments: [],
              readByUserIds: [],
              mentionedUserIds: [],
              replyToMessageId: msg.replyToMessageId,
              replyToMessage: undefined
            });
          }
        }

        // Chỉ update state và lưu vào localStorage nếu có tin nhắn mới
        if (hasNewMessages) {
          const mergedMessages = Array.from(messageMap.values())
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          // Lưu vào localStorage
          try {
            const storageKey = getStorageKey(roomId);
            localStorage.setItem(storageKey, JSON.stringify({
              messages: mergedMessages,
              mode: chatMode,
              timestamp: new Date().getTime()
            }));
          } catch (e) {
            console.warn('Failed to save chat history:', e);
          }

          return mergedMessages;
        }

        return prev;
      });
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [adminMessages, chatMode, roomId, getStorageKey]);

  // Chỉ dùng messagesLocal (AI/local) khi chatMode là 'ai', còn lại dùng messagesLocal đã đồng bộ với adminMessages
  const displayMessages = useMemo(() => {
    // Lấy ID người dùng hiện tại một lần
    const currentUserId = (() => {
      try {
        const account = getCurrentAccount();
        return account?.userId || account?.accountId || account?.id || '';
      } catch {
        return '';
      }
    })();
    
    // Map và sắp xếp messages dựa trên ID người dùng
    const msgs = messagesLocal.map(msg => {
      // Nếu đã xác định isUser=true thì giữ nguyên
      if (msg.isUser === true) return msg;
      // Xác định isUser dựa trên ID người gửi
      const isUser = !!currentUserId && !!msg.senderUserId && msg.senderUserId === currentUserId;
      return { ...msg, isUser };
    });
    // Chuẩn hóa createdAt ISO, sort ổn định
    return msgs
      .map(m => ({ ...m, createdAt: new Date(m.createdAt).toISOString() }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messagesLocal]);

  return (
    <div className={`fixed bottom-4 right-4 z-[9998] ${className}`}>
      {/* Chat Toggle Button - Always visible, fixed position */}
      <div className="relative z-10">
        <Button
          onClick={openChat}
          data-chat-toggle
          className={cn(
            'h-14 w-14 rounded-full shadow-lg relative aspect-square flex items-center justify-center',
            getThemeClass(
              'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
              'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
            )
          )}
        >
          <MessageCircle className="h-6 w-6 text-white" />
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
            <div className="h-2 w-2 bg-white rounded-full" />
          </div>
        </Button>
      </div>

      {/* Chat Window - Higher z-index when chat is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'w-80 z-[9999] absolute bottom-0 right-0 rounded-2xl shadow-2xl border',
              getThemeClass('bg-white border-gray-200', 'bg-slate-800 border-slate-700')
            )}
            data-chat-modal
            style={{ pointerEvents: 'auto' }}
          >
            {/* Header */}
            <div
              className={cn(
                'flex items-center justify-between p-4 border-b rounded-t-2xl text-white',
                getThemeClass(
                  'bg-gradient-to-r from-blue-600 to-purple-600 border-blue-500',
                  'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-500'
                )
              )}
            >
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <div className="h-8 w-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    {chatMode === 'ai' ? (
                      <Bot className="h-5 w-5 text-white" />
                    ) : (
                      <Users className="h-5 w-5 text-white" />
                    )}
                  </div>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm flex items-center">
                    {chatMode === 'ai' ? (
                      <>
                        AI Assistant
                        <Sparkles className="h-3 w-3 ml-1" />
                      </>
                    ) : (
                      <>
                        Support Agent
                        <User className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </h3>
                  <p
                    className={cn(
                      'text-xs flex items-center',
                      getThemeClass('text-blue-100', 'text-purple-100')
                    )}
                  >
                    {chatMode === 'ai' ? 'Smart Assistant' : 'Human Support'}
                    {/* Mode indicator badge */}
                    <span
                      className={cn(
                        'ml-2 px-1.5 py-0.5 rounded text-xs font-medium border flex items-center gap-1',
                        chatMode === 'ai'
                          ? getThemeClass(
                              'bg-green-500/20 text-green-700 border-green-400/30',
                              'bg-green-500/20 text-green-200 border-green-400/30'
                            )
                          : getThemeClass(
                              'bg-blue-500/20 text-white border-blue-300',
                              'bg-purple-500/20 text-purple-200 border-purple-700'
                            )
                      )}
                    >
                      {chatMode === 'ai' ? (
                        <>
                          <FaRobot className="h-3 w-3" />
                          AI
                        </>
                      ) : (
                        <>
                          <FaUserFriends className="h-3 w-3" />
                          Human
                        </>
                      )}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMinimize}
                  className="h-8 w-8 p-0 text-white hover:bg-white hover:bg-opacity-20"
                >
                  {isMinimized ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeChat}
                  className="h-8 w-8 p-0 text-white hover:bg-white hover:bg-opacity-20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Content */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 500 }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                  onAnimationComplete={() => setTimeout(scrollToBottom, 100)}
                >
                  {/* Messages */}
                  {/* Always show chat UI, no selection mode */}
                  <ScrollArea className="h-[400px] pt-12 pb-2 px-3">
                    <div className="space-y-3">
                      {displayMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                          data-messageid={message.id}
                        >
                          <div
                            className={`flex items-start space-x-2 max-w-[85%] ${
                              message.isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                            }`}
                          >
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              {message.isUser ? (
                                <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <User className="h-3 w-3 text-white" />
                                </div>
                              ) : message.isAI ? (
                                <div className="h-6 w-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                  <Bot className="h-3 w-3 text-white" />
                                </div>
                              ) : (
                                <div className="h-6 w-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                  <Users className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </Avatar>
                            <Card
                              className={cn(
                                message.isUser
                                  ? getThemeClass(
                                      'bg-blue-500 text-white border-blue-500 opacity-95',
                                      'bg-blue-500 text-white border-blue-500 opacity-95'
                                    )
                                  : message.isError
                                  ? getThemeClass(
                                      'bg-red-50 text-red-800 border-red-200',
                                      'bg-red-900/20 text-red-200 border-red-700'
                                    )
                                  : message.isAI
                                  ? getThemeClass(
                                      'bg-gradient-to-r from-purple-50 to-blue-50 text-gray-800 border-purple-200',
                                      'bg-gradient-to-r from-purple-900/20 to-blue-900/20 text-purple-200 border-purple-700'
                                    )
                                  : getThemeClass(
                                      'bg-gray-50 text-gray-800 border-gray-200',
                                      'bg-slate-700 text-slate-200 border-slate-600'
                                    )
                              )}
                            >
                              <CardContent className="px-3 py-2">
                                {/* Sender info with status */}
                                <div
                                  className={`flex items-center justify-between mb-1 ${
                                    message.isUser ? 'flex-row-reverse' : 'flex-row'
                                  }`}
                                >
                                  <div
                                    className={`flex items-center gap-1 ${
                                      message.isUser ? 'flex-row-reverse' : 'flex-row'
                                    }`}
                                  >
                                    <span
                                      className={cn(
                                        'text-xs font-medium',
                                        message.isUser
                                          ? 'text-blue-100'
                                          : getThemeClass('text-gray-600', 'text-slate-400')
                                      )}
                                    >
                                      {message.isUser
                                        ? 'Bạn'
                                        : message.isAI
                                        ? 'AI Assistant'
                                        : message.senderName || 'Tư vấn viên'}
                                    </span>
                                    <UserStatusBadge
                                      userType={
                                        message.isUser ? 'customer' : message.isAI ? 'ai' : 'admin'
                                      }
                                      size="sm"
                                      showIcon={true}
                                      className={
                                        message.isUser
                                          ? 'bg-blue-500 text-white border-blue-400'
                                          : ''
                                      }
                                    />
                                  </div>
                                  <span
                                    className={cn(
                                      'text-xs',
                                      message.isUser
                                        ? 'text-blue-100'
                                        : getThemeClass('text-gray-500', 'text-slate-500')
                                    )}
                                  >
                                    {formatTimestamp(message.createdAt)}
                                  </span>
                                </div>

                                {/* Message content */}
                                <div className="text-sm break-words whitespace-pre-wrap">
                                  {/* Nếu là tin nhắn đã xóa */}
                                  {message.isDeleted ? (
                                    <span
                                      className={cn(
                                        'italic',
                                        getThemeClass('text-gray-400', 'text-slate-500')
                                      )}
                                    >
                                      [Message deleted]
                                    </span>
                                  ) : (
                                    <>
                                      {/* Nếu là reply */}
                                      {message.replyToMessage && (
                                        <div
                                          className={cn(
                                            'border-l-2 pl-2 mb-1 text-xs',
                                            getThemeClass(
                                              'border-blue-200 text-gray-500',
                                              'border-purple-700 text-slate-400'
                                            )
                                          )}
                                        >
                                          <span className="font-semibold">
                                            {message.replyToMessage.senderUserName || 'Anonymous'}:
                                          </span>{' '}
                                          {message.replyToMessage.content}
                                        </div>
                                      )}
                                      {message.content}
                                      {message.isStreaming && (
                                        <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse">
                                          |
                                        </span>
                                      )}
                                      {/* Nếu là tin nhắn đã sửa */}
                                      {message.isEdited && !message.isDeleted && (
                                        <span
                                          className={cn(
                                            'ml-2 text-xs italic',
                                            getThemeClass('text-gray-400', 'text-slate-500')
                                          )}
                                        >
                                          (edited)
                                        </span>
                                      )}
                                      {/* Nếu có file đính kèm */}
                                      {message.attachments && message.attachments.length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-2">
                                          {message.attachments.map((att) => (
                                            <a
                                              key={att.id}
                                              href={att.fileUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={cn(
                                                'text-xs underline',
                                                getThemeClass('text-blue-500', 'text-blue-400')
                                              )}
                                            >
                                              📎 {att.fileName}
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                      {/* Nếu là AI và có nguồn tham khảo */}
                                      {message.isAI &&
                                        message.sources &&
                                        message.sources.length > 0 && (
                                          <div
                                            className={cn(
                                              'mt-1 text-xs',
                                              getThemeClass('text-purple-500', 'text-purple-400')
                                            )}
                                          >
                                            <span className="font-semibold">Sources:</span>{' '}
                                            {message.sources.join(', ')}
                                          </div>
                                        )}
                                    </>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      ))}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div
                    className={cn(
                      'p-4 border-t',
                      getThemeClass('border-gray-200', 'border-slate-700')
                    )}
                  >
                    {/* Button to chat with admin, only show if AI mode */}
                    {(() => {
                      return chatMode === 'ai';
                    })() && (
                      <div className="flex justify-center mb-3">
                        <Button
                          variant="outline"
                          className={cn(
                            'font-semibold rounded-full px-4 py-1 text-sm shadow-sm',
                            getThemeClass(
                              'border-blue-500 text-blue-500 hover:bg-blue-50',
                              'border-purple-500 text-purple-400 hover:bg-purple-800/30'
                            )
                          )}
                          disabled={isSwitchingMode}
                          onClick={async () => {
                            if (!roomId) return;

                            setIsSwitchingMode(true);
                            setLocalModeOverride('human');
                            try {
                              await chatService.switchRoomMode(roomId, 'Human');
                            } catch (err) {
                              console.warn('Failed to switch chat mode:', err);
                              setIsSwitchingMode(false);
                              setLocalModeOverride(null);
                            }
                          }}
                        >
                          {isSwitchingMode ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                              Switching...
                            </>
                          ) : (
                            <>
                              <Users className="h-4 w-4 mr-2" />
                              Chat with support agent
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Show mode status for debugging */}
                    {chatMode === 'human' && (
                      <div className="flex justify-center mb-3">
                        <div
                          className={cn(
                            'px-3 py-1 rounded-full text-sm font-medium',
                            getThemeClass(
                              'bg-green-100 text-green-800',
                              'bg-green-900/20 text-green-200'
                            )
                          )}
                        >
                          <Users className="h-4 w-4 mr-2 inline" />
                          Connected to Human Support
                        </div>
                      </div>
                    )}
                    {isStreaming && (
                      <div
                        className={cn(
                          'flex items-center justify-between mb-2 p-2 rounded-lg',
                          getThemeClass(
                            'bg-gradient-to-r from-purple-50 to-blue-50',
                            'bg-gradient-to-r from-purple-900/20 to-blue-900/20'
                          )
                        )}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0.1s' }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0.2s' }}
                            ></div>
                          </div>
                          <span
                            className={cn(
                              'text-sm',
                              getThemeClass('text-gray-600', 'text-slate-300')
                            )}
                          >
                            {chatMode === 'ai' ? 'AI is typing...' : 'Sending...'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={stopStreaming}
                          className={cn(
                            'h-6 w-6 p-0',
                            getThemeClass(
                              'text-gray-500 hover:text-red-500',
                              'text-slate-400 hover:text-red-400'
                            )
                          )}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={
                          chatMode === 'ai' ? 'Ask AI Assistant...' : 'Message support agent...'
                        }
                        disabled={isStreaming}
                        className={cn(
                          'flex-1',
                          getThemeClass(
                            'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500',
                            'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500'
                          )
                        )}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isStreaming}
                        size="sm"
                        className={cn(
                          'px-3',
                          getThemeClass(
                            'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
                            'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                          )
                        )}
                      >
                        {isStreaming ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-center mt-2">
                      <p
                        className={cn(
                          'text-xs flex items-center',
                          getThemeClass('text-gray-500', 'text-slate-400')
                        )}
                      >
                        {chatMode === 'ai' ? (
                          <>
                            <Sparkles className="h-3 w-3 mr-1" />
                            Powered by AI
                          </>
                        ) : (
                          <>
                            <Users className="h-3 w-3 mr-1" />
                            Human Support Active
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Wrapper component with authentication and role checking
const AuthenticatedCustomerChatBox: React.FC<UnifiedCustomerChatProps> = (props) => {
  const [isVisible, setIsVisible] = useState(false);

  // Check authentication and role on mount and when auth changes
  const checkVisibility = useCallback(() => {
    const isAuthenticated = !!localStorage.getItem('access_token');
    const currentAccount = getCurrentAccount();
    
    // Only show chatbox for logged in users with Customer (role 1) or Event Manager (role 2) roles
    const shouldShow = isAuthenticated && currentAccount && (currentAccount.role === 1 || currentAccount.role === 2);
    setIsVisible(shouldShow);
  }, []);

  useEffect(() => {
    // Initial check
    checkVisibility();

    // Listen for auth changes
    const handleAuthChange = () => {
      checkVisibility();
    };

    window.addEventListener('authChanged', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('login', handleAuthChange);
    window.addEventListener('logout', handleAuthChange);

    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('login', handleAuthChange);
      window.removeEventListener('logout', handleAuthChange);
    };
  }, [checkVisibility]);

  if (!isVisible) {
    return null;
  }

  return <CustomerChatBoxInternal {...props} />;
};

// Export the wrapper as the default export
export default AuthenticatedCustomerChatBox;

// Also export the wrapper as a named export for consistency
export { AuthenticatedCustomerChatBox as CustomerChatBox };

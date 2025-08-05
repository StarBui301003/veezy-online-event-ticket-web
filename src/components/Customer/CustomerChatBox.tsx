import React, { useState, useRef, useCallback, useEffect } from 'react';
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

export const CustomerChatBox: React.FC<UnifiedCustomerChatProps> = ({ className = '' }) => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [aiFailureCount, setAiFailureCount] = useState(0);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false); // Track mode switching state
  const [localModeOverride, setLocalModeOverride] = useState<'ai' | 'human' | null>(null); // Local override for mode

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

  // Use the chat mode from the hook (updated by SignalR events) with local override
  const chatMode = localModeOverride || currentChatMode;

  // Debug: Log when chatMode changes
  useEffect(() => {
    // Reset switching state when mode changes successfully
    if (isSwitchingMode && chatMode === 'human') {
      setIsSwitchingMode(false);
    }

    // Clear local override if hook mode matches what we expected
    if (localModeOverride && currentChatMode === localModeOverride) {
      setLocalModeOverride(null);
    }

    // Force re-render by updating a dummy state to ensure UI reflects new mode
    setNewMessage((prev) => prev); // This will trigger a re-render without changing the actual message
  }, [chatMode, currentChatMode, isSwitchingMode, localModeOverride]);

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

  // Add message to local state (chuẩn hóa theo ChatMessageDto)
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
      const newMessage: UnifiedMessage = {
        id: messageId,
        roomId: '',
        senderUserId: isUser ? 'me' : '',
        senderUserName: senderName || (isUser ? 'You' : isAI ? 'AI Assistant' : 'Support Agent'),
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
      setMessages((prev) => [...prev, newMessage]);
      scrollToBottom();
      return messageId;
    },
    [generateMessageId, scrollToBottom]
  );

  // Khi mount: chỉ setup welcome message, KHÔNG tạo chat room ngay
  useEffect(() => {
    setMessages([]);
    addLocalMessage(
      "Hello! I am Veezy's AI Assistant. I can help you learn about events, tickets, and answer your questions. Ask me anything!",
      false,
      false,
      true
    );
    // KHÔNG gọi openAdminChat() ở đây nữa - sẽ gọi khi user mở chat
    // Ensure scroll to bottom after welcome message is added and chat is rendered
    setTimeout(() => {
      scrollToBottom();
    }, 400);
  }, [addLocalMessage, scrollToBottom]); // Bỏ openAdminChat khỏi dependencies

  // Open chat - Tạo chat room khi user mở chat box
  const openChat = useCallback(async () => {
    setIsOpen(true);

    // Tạo chat room với admin khi user mở chat lần đầu
    if (!chatRoom && !roomId) {
      try {
        await openAdminChat();
      } catch {
        addLocalMessage(
          'Failed to initialize chat. Please try again.',
          false,
          true,
          false,
          'System'
        );
      }
    }

    // Wait for chat window to render, then scroll
    setTimeout(() => {
      scrollToBottom();
    }, 400);
  }, [scrollToBottom, openAdminChat, chatRoom, roomId, addLocalMessage]);

  // Close chat
  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setMessages([]);
    // Abort any ongoing streaming
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Close admin chat if connected
    if (isConnected) {
      closeAdminChat();
    }
  }, [isConnected, closeAdminChat]);

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
      setMessages((prev) =>
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
    // Optionally, notify user if AI fails repeatedly
    if (newFailureCount >= 2) {
      addLocalMessage(
        'AI Assistant is currently unable to respond. Please try again later or contact a support agent.',
        false,
        false,
        false,
        'System'
      );
    }
  }, [aiFailureCount, addLocalMessage]);

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
          setMessages((prev) =>
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
  }, [messages, adminMessages, isOpen, isMinimized, scrollToBottom]);

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

  // Chuẩn hóa messages cho hiển thị (hỗ trợ reply, attachment, trạng thái, nguồn AI)
  // Always show AI messages (admin can join same room, but UI is unified)
  const displayMessages = messages;

  return (
    <div className={`fixed bottom-4 right-4 z-[9998] ${className}`}>
      {/* Chat Toggle Button - Always visible, fixed position */}
      <div className="relative z-10">
        <Button
          onClick={openChat}
          data-chat-toggle
          className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg relative aspect-square flex items-center justify-center"
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
            className="bg-white shadow-2xl border border-gray-200 w-80 z-[9999] absolute bottom-0 right-0 rounded-2xl"
            data-chat-modal
            style={{ pointerEvents: 'auto' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
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
                  <p className="text-xs text-blue-100 flex items-center">
                    {chatMode === 'ai' ? 'Smart Assistant' : 'Human Support'}
                    {/* Mode indicator badge */}
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
                        chatMode === 'ai'
                          ? 'bg-green-500/20 text-green-100 border border-green-400/30'
                          : 'bg-orange-500/20 text-orange-100 border border-orange-400/30'
                      }`}
                    >
                      {chatMode === 'ai' ? '🤖 AI' : '👤 Human'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Always show chat UI, no selection mode */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMessages([]);
                    if (isConnected) closeAdminChat();
                  }}
                  className="h-8 w-8 p-0 text-white hover:bg-white hover:bg-opacity-20"
                  title="Back to support type selection"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
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
                      {displayMessages.map((message, index) => (
                        <div
                          key={message.id || index}
                          className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
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
                              className={`${
                                message.isUser
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : message.isError
                                  ? 'bg-red-50 text-red-800 border-red-200'
                                  : message.isAI
                                  ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-gray-800 border-purple-200'
                                  : 'bg-gray-50 text-gray-800 border-gray-200'
                              }`}
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
                                      className={`text-xs font-medium ${
                                        message.isUser ? 'text-blue-100' : 'text-gray-600'
                                      }`}
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
                                    className={`text-xs ${
                                      message.isUser ? 'text-blue-100' : 'text-gray-500'
                                    }`}
                                  >
                                    {formatTimestamp(message.createdAt)}
                                  </span>
                                </div>

                                {/* Message content */}
                                <div className="text-sm break-words whitespace-pre-wrap">
                                  {/* Nếu là tin nhắn đã xóa */}
                                  {message.isDeleted ? (
                                    <span className="italic text-gray-400">[Message deleted]</span>
                                  ) : (
                                    <>
                                      {/* Nếu là reply */}
                                      {message.replyToMessage && (
                                        <div className="border-l-2 border-blue-200 pl-2 mb-1 text-xs text-gray-500">
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
                                        <span className="ml-2 text-xs italic text-gray-400">
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
                                              className="text-xs text-blue-600 underline"
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
                                          <div className="mt-1 text-xs text-purple-500">
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
                  <div className="p-4 border-t border-gray-200">
                    {/* Button to chat with admin, only show if AI mode */}
                    {(() => {
                      return chatMode === 'ai';
                    })() && (
                      <div className="flex justify-center mb-3">
                        <Button
                          variant="outline"
                          className="border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold rounded-full px-4 py-1 text-sm shadow-sm"
                          disabled={isSwitchingMode}
                          onClick={async () => {
                            if (!roomId) {
                              console.error(
                                '[CustomerChatBox] Room ID is null - cannot switch to human support'
                              );
                              alert('Chat room not ready. Please try again in a moment.');
                              return;
                            }

                            setIsSwitchingMode(true);

                            // Call backend to switch mode - UI will update via SignalR event
                            addLocalMessage(
                              'You have requested to chat with a support agent. Please wait for a human to join the conversation.',
                              false,
                              false,
                              false,
                              'System'
                            );

                            try {
                              const result = await chatService.switchRoomMode(roomId, 'Human');

                              // Update mode immediately after successful API call (like ChatboxAdmin)
                              if (result && result.mode !== undefined && result.mode !== null) {
                                // Handle mode from backend - might be string or number
                                let normalizedMode: 'ai' | 'human' = 'human';
                                if (typeof result.mode === 'string') {
                                  normalizedMode =
                                    result.mode.toLowerCase() === 'human' ? 'human' : 'ai';
                                } else if (typeof result.mode === 'number') {
                                  normalizedMode = result.mode === 1 ? 'human' : 'ai';
                                }
                                console.log(
                                  '[CustomerChatBox] Immediately updating mode to:',
                                  normalizedMode
                                );
                                setLocalModeOverride(normalizedMode);
                              } else {
                                // Fallback: assume switch to human mode was successful
                                setLocalModeOverride('human');
                              }

                              setIsSwitchingMode(false);
                            } catch (err: unknown) {
                              const errorMessage = err instanceof Error ? err.message : String(err);
                              console.error(
                                '[CustomerChatBox] Failed to switch to human support:',
                                err
                              );
                              alert('Failed to switch to human support: ' + errorMessage);
                              setIsSwitchingMode(false);
                              // Note: No need to revert UI - let SignalR handle mode updates
                            }
                          }}
                        >
                          {isSwitchingMode ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
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
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          <Users className="h-4 w-4 mr-2 inline" />
                          Connected to Human Support
                        </div>
                      </div>
                    )}
                    {isStreaming && (
                      <div className="flex items-center justify-between mb-2 p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
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
                          <span className="text-sm text-gray-600">
                            {chatMode === 'ai' ? 'AI is typing...' : 'Sending...'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={stopStreaming}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
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
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isStreaming}
                        size="sm"
                        className="px-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {isStreaming ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-center mt-2">
                      <p className="text-xs text-gray-500 flex items-center">
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

export default CustomerChatBox;

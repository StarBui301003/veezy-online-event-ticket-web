import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  Sparkles, 
  User, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Check 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { UserStatusBadge } from '@/components/ui/user-status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { chatService } from '@/services/chat.service';
import { connectChatHub, onChat, disconnectChatHub, joinChatRoom, leaveChatRoom } from '@/services/signalr.service';
import { toast } from 'react-toastify';
import OnlineStatusIndicator from '@/components/common/OnlineStatusIndicator';

interface AIMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date | string | number; // Support multiple timestamp formats
  isStreaming?: boolean;
  isError?: boolean;
}

interface AICustomerChatBoxProps {
  className?: string;
  onTransferToAdmin?: (adminRoomId: string) => void; // Callback khi user chuyển sang admin
  showTransferButton?: boolean; // Hiển thị nút chuyển sang admin
}

export const AICustomerChatBox: React.FC<AICustomerChatBoxProps> = ({ 
  className = '', 
  onTransferToAdmin, 
  showTransferButton = true 
}) => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<AIMessage | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // AI Integration state
  const [aiRoomId, setAiRoomId] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [hasTransferred, setHasTransferred] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize AI room when chat opens
  const initializeAIRoom = useCallback(async () => {
    try {
      const aiRoom = await chatService.createOrGetAIChatRoom();
      setAiRoomId(aiRoom.roomId);
      
      // Join SignalR room for real-time updates
      try {
        await joinChatRoom(aiRoom.roomId);
        console.log('Joined AI chat room:', aiRoom.roomId);
      } catch (signalRError) {
        console.error('Failed to join SignalR room:', signalRError);
      }
    } catch (error) {
      console.error('Failed to initialize AI room:', error);
    }
  }, []);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Open chat
  const openChat = useCallback(() => {
    setIsOpen(true);
    setTimeout(scrollToBottom, 300);
    // Initialize AI room when opening chat
    initializeAIRoom();
  }, [scrollToBottom, initializeAIRoom]);

  // Close chat
  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);

    // Abort any ongoing streaming
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

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

  // Generate message ID
  const generateMessageId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9);
  }, []);

  // Handle edit message
  const handleEdit = useCallback((message: AIMessage) => {
    setEditingMessage(message);
    setEditingContent(message.content);
    setIsEditing(false);
  }, []);

  // Save edited message
  const saveEditedMessage = useCallback(async () => {
    if (!editingMessage || !editingContent.trim()) return;

    try {
      setIsEditing(true);

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === editingMessage.id 
          ? { ...msg, content: editingContent.trim() }
          : msg
      ));

      setEditingMessage(null);
      setEditingContent('');
      toast.success('Tin nhắn đã được cập nhật');
    } catch (error: any) {
      console.error('❌ Error updating message:', error);
      toast.error('Không thể cập nhật tin nhắn');
    } finally {
      setIsEditing(false);
    }
  }, [editingMessage, editingContent]);

  // Cancel edit
  const cancelEdit = useCallback(() => {
    setEditingMessage(null);
    setEditingContent('');
    setIsEditing(false);
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    // Confirm deletion
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
      return;
    }

    try {
      // Update local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      toast.success('Tin nhắn đã được xóa');
    } catch (error: any) {
      console.error('❌ Error deleting message:', error);
      toast.error('Không thể xóa tin nhắn');
    }
  }, []);

  // Add message
  const addMessage = useCallback(
    (content: string, isUser: boolean, isError: boolean = false): string => {
      const messageId = generateMessageId();
      const newMessage: AIMessage = {
        id: messageId,
        content,
        isUser,
        timestamp: new Date(),
        isError,
      };

      setMessages((prev) => [...prev, newMessage]);
      scrollToBottom();
      return messageId;
    },
    [generateMessageId, scrollToBottom]
  );

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

  // Send message with streaming AI response
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || isStreaming) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      // Add user message
      addMessage(messageContent, true);

      // Add AI placeholder message
      const aiMessageId = addMessage('AI đang suy nghĩ...', false);
      setIsStreaming(true);
      setStreamingMessageId(aiMessageId);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      let aiResponse: string = '';

      // Kiểm tra nếu đã có AI room thì sử dụng AI room integration
      if (aiRoomId) {
        try {
          console.log('🤖 Sending AI message with room context:', aiRoomId);
          const response = await chatService.sendAIMessage(aiRoomId, messageContent);
          aiResponse = response.content || 'AI không thể trả lời lúc này.';
        } catch (roomError) {
          console.warn('⚠️ AI room integration failed, falling back to simple chat:', roomError);
          // Fallback to simple AI chat
          aiResponse = await chatService.processSimpleAIChat(messageContent);
        }
      } else {
        console.log('💬 Using simple AI chat (no room context)');
        // Fallback về simple AI chat (không có room context)
        aiResponse = await chatService.processSimpleAIChat(messageContent);
      }

      // Update AI message with response
      updateStreamingMessage(aiMessageId, aiResponse, true);

      // Mark streaming as complete
      setIsStreaming(false);
      setStreamingMessageId(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ [AICustomerChatBox] Error sending message:', error);

      if (error.name === 'AbortError') {
        // Request was aborted
        if (streamingMessageId) {
          updateStreamingMessage(streamingMessageId, 'Đã hủy yêu cầu.', true);
        }
      } else {
        // Add error message
        const errorMessage = error.message || 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.';
        if (streamingMessageId) {
          updateStreamingMessage(streamingMessageId, errorMessage, true);
        } else {
          addMessage(errorMessage, false, true);
        }
        toast.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
      }

      setIsStreaming(false);
      setStreamingMessageId(null);
    } finally {
      abortControllerRef.current = null;
    }
  }, [newMessage, isStreaming, addMessage, updateStreamingMessage, streamingMessageId, aiRoomId]);

  // Transfer to admin chat
  const handleTransferToAdmin = useCallback(async () => {
    if (!aiRoomId || isTransferring) return;
    
    try {
      setIsTransferring(true);
      
      // Create or get AI room first if not exists
      const aiRoom = await chatService.createOrGetAIChatRoom();
      setAiRoomId(aiRoom.roomId);
      
      // Transfer to admin
      const adminRoom = await chatService.transferAIToAdmin(aiRoom.roomId);
      
      setHasTransferred(true);
      toast.success('Đã chuyển sang chat với admin!');
      
      // Notify parent component
      if (onTransferToAdmin) {
        onTransferToAdmin(adminRoom.roomId);
      }
      
    } catch (error: any) {
      console.error('Transfer to admin failed:', error);
      toast.error('Không thể chuyển sang admin. Vui lòng thử lại.');
    } finally {
      setIsTransferring(false);
    }
  }, [aiRoomId, isTransferring, onTransferToAdmin]);

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
        console.warn('Invalid timestamp format:', timestamp);
        return new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }

      // Check if the date is valid
      if (isNaN(messageDate.getTime())) {
        console.warn('Invalid date created from timestamp:', timestamp);
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
    } catch (error) {
      console.error('Error formatting timestamp:', error, 'Original timestamp:', timestamp);
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
  }, [messages, isOpen, isMinimized, scrollToBottom]);

  // Helper function to get current user ID
  const getCurrentUserId = useCallback(() => {
    try {
      const accountStr = localStorage.getItem('account');
      if (accountStr) {
        const account = JSON.parse(accountStr);
        return account.userId;
      }
      return undefined;
    } catch (error) {
      console.error('Error parsing account from localStorage:', error);
      return undefined;
    }
  }, []);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addMessage(
        'Xin chào! Tôi là AI Assistant của Veezy. Tôi có thể giúp bạn tìm hiểu về các sự kiện, vé và trả lời các câu hỏi của bạn. Hãy hỏi tôi bất cứ điều gì!',
        false
      );
    }
  }, [messages.length, addMessage]);

  // SignalR connection and event handlers
  useEffect(() => {
    const setupSignalR = async () => {
      try {
        // Get proper access token
        const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
        
        // Connect to chat hub với đúng URL
        await connectChatHub(token);
        console.log('✅ Connected to Chat Hub');
        
        // Listen for AI messages
        onChat('ReceiveAIMessage', (message: any) => {
          console.log('📩 Received AI message:', message);
          addMessage(message.content, false);
        });

        // Listen for transfer notifications
        onChat('TransferToAdmin', () => {
          console.log('🔄 Transfer to admin notification received');
          setHasTransferred(true);
          toast.success('Cuộc trò chuyện đã được chuyển sang admin');
        });

        // Join AI room if exists
        if (aiRoomId) {
          await joinChatRoom(aiRoomId);
          console.log('🏠 Joined AI room:', aiRoomId);
        }
      } catch (error) {
        console.error('❌ Failed to setup SignalR:', error);
        // Don't block UI if SignalR fails
      }
    };

    if (isOpen) {
      setupSignalR();
    }

    // Cleanup on unmount
    return () => {
      try {
        if (aiRoomId) {
          leaveChatRoom(aiRoomId);
        }
        disconnectChatHub();
      } catch (error) {
        console.error('⚠️ Error during SignalR cleanup:', error);
      }
    };
  }, [isOpen, aiRoomId, addMessage]);

  return (
    <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
      {/* AI Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="relative"
          >
            <Button
              onClick={openChat}
              className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg relative"
            >
              <Bot className="h-6 w-6 text-white" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-2 w-2 text-white" />
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="bg-white rounded-lg shadow-2xl border border-gray-200 w-80"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <div className="h-8 w-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm flex items-center">
                    AI Assistant
                    <Sparkles className="h-3 w-3 ml-1" />
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-purple-100">Trợ lý thông minh</p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-200">Always Online</span>
                    </div>
                  </div>
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
                  animate={{ height: 400 }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  {/* Messages */}
                  <ScrollArea className="h-80 p-4">
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
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
                              ) : (
                                <div className="h-6 w-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                  <Bot className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </Avatar>
                            <Card
                              className={`${
                                message.isUser
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : message.isError
                                  ? 'bg-red-50 text-red-800 border-red-200'
                                  : 'bg-gradient-to-r from-purple-50 to-blue-50 text-gray-800 border-purple-200'
                              } relative group`}
                            >
                              <CardContent className="px-3 py-2">
                                {/* Sender info with status and actions */}
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
                                      {message.isUser ? 'Bạn' : 'AI Assistant'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <UserStatusBadge
                                        userType={message.isUser ? 'customer' : 'ai'}
                                        size="sm"
                                        showIcon={true}
                                        className={
                                          message.isUser
                                            ? 'bg-blue-500 text-white border-blue-400'
                                            : ''
                                        }
                                      />
                                      {message.isUser && (
                                        <OnlineStatusIndicator 
                                          userId={getCurrentUserId()}
                                          size="sm"
                                          showText={false}
                                        />
                                      )}
                                      {!message.isUser && (
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-xs ${
                                        message.isUser ? 'text-blue-100' : 'text-gray-500'
                                      }`}
                                    >
                                      {formatTimestamp(message.timestamp)}
                                    </span>
                                    
                                    {/* Actions dropdown - only for user messages */}
                                    {message.isUser && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 text-white hover:text-white hover:bg-blue-700 bg-black/20 backdrop-blur-sm rounded-full shadow-lg border border-white/30"
                                          >
                                            <MoreVertical className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleEdit(message)}>
                                            <Edit3 className="h-4 w-4 mr-2" />
                                            Chỉnh sửa
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            onClick={() => deleteMessage(message.id)}
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Xóa
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                </div>

                                {/* Message content */}
                                {editingMessage?.id === message.id ? (
                                  /* Edit mode */
                                  <div className="space-y-2">
                                    <Input
                                      value={editingContent}
                                      onChange={(e) => setEditingContent(e.target.value)}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          saveEditedMessage();
                                        }
                                        if (e.key === 'Escape') {
                                          cancelEdit();
                                        }
                                      }}
                                      className="text-sm bg-blue-500 text-white placeholder:text-blue-200 border-blue-400"
                                      placeholder="Chỉnh sửa tin nhắn..."
                                      autoFocus
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={saveEditedMessage}
                                        disabled={isEditing || !editingContent.trim()}
                                        className="h-6 px-2 text-xs bg-blue-700 hover:bg-blue-800"
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        Lưu
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={cancelEdit}
                                        className="h-6 px-2 text-xs text-blue-600 border-blue-400 hover:bg-blue-50"
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        Hủy
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Normal mode */
                                  <p className="text-sm break-words whitespace-pre-wrap">
                                    {message.content}
                                    {message.isStreaming && (
                                      <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse">
                                        |
                                      </span>
                                    )}
                                  </p>
                                )}
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
                    {/* Transfer to Admin Button */}
                    {showTransferButton && !hasTransferred && (
                      <div className="mb-3">
                        <Button
                          onClick={handleTransferToAdmin}
                          disabled={isTransferring}
                          size="sm"
                          variant="outline"
                          className="w-full text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          {isTransferring ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                              Đang chuyển...
                            </>
                          ) : (
                            <>
                              👤 Chuyển sang chat với Admin
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {hasTransferred && (
                      <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-700 text-center">
                          ✅ Đã chuyển sang chat với Admin. Bạn có thể tiếp tục chat với AI hoặc chờ Admin phản hồi.
                        </p>
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
                          <span className="text-sm text-gray-600">AI đang trả lời...</span>
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
                        placeholder="Hỏi AI Assistant..."
                        disabled={isStreaming}
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isStreaming}
                        size="sm"
                        className="px-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
                        <Sparkles className="h-3 w-3 mr-1" />
                        Được hỗ trợ bởi AI
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

export default AICustomerChatBox;

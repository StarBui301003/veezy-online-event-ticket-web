import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Bot, Send, X, Minimize2, Maximize2, MessageCircle, User, Users, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserStatusBadge } from '@/components/ui/user-status-badge';
import { chatService } from '@/services/chat.service';
import { useCustomerChat } from '@/hooks/use-customer-chat';
import { useChatMode } from '@/hooks/use-chat-mode';
import { toast } from 'react-toastify';

interface UnifiedMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date | string | number; // Support multiple timestamp formats
  isStreaming?: boolean;
  isError?: boolean;
  isAI?: boolean; // Phân biệt tin nhắn từ AI hay Admin
  senderName?: string;
}

interface UnifiedCustomerChatProps {
  className?: string;
}

export const UnifiedCustomerChat: React.FC<UnifiedCustomerChatProps> = ({ className = '' }) => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [aiFailureCount, setAiFailureCount] = useState(0);

  // Chat mode management
  const { chatMode, hasEverSelected, setChatMode, resetToSelection, markAsSelected } = useChatMode();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use customer chat hook for admin chat functionality
  const {
    isConnected,
    adminOnlineStatus,
    chatRoom,
    messages: adminMessages,
    sendMessage: sendAdminMessage,
    openChat: openAdminChat,
    closeChat: closeAdminChat,
    isMyMessage,
    isAiMessage
  } = useCustomerChat({ autoConnect: false });

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

  // Add message to local state
  const addLocalMessage = useCallback((content: string, isUser: boolean, isError: boolean = false, isAI: boolean = false, senderName?: string): string => {
    const messageId = generateMessageId();
    const newMessage: UnifiedMessage = {
      id: messageId,
      content,
      isUser,
      timestamp: new Date(),
      isError,
      isAI,
      senderName
    };
    
    setMessages(prev => [...prev, newMessage]);
    scrollToBottom();
    return messageId;
  }, [generateMessageId, scrollToBottom]);

  // Select chat mode
  const selectChatMode = useCallback((mode: 'ai' | 'admin') => {
    setChatMode(mode);
    markAsSelected(); // Remember that user has made a choice
    
    // Clear local messages when switching modes
    setMessages([]);
    
    if (mode === 'ai') {
      addLocalMessage(
        'Xin chào! Tôi là AI Assistant của Veezy. Tôi có thể giúp bạn tìm hiểu về các sự kiện, vé và trả lời các câu hỏi của bạn. Hãy hỏi tôi bất cứ điều gì!',
        false,
        false,
        true
      );
    } else {
      // Open admin chat - don't add local message, let adminMessages handle it
      openAdminChat();
    }
  }, [setChatMode, markAsSelected, addLocalMessage, openAdminChat]);

  // Open chat
  const openChat = useCallback(() => {
    setIsOpen(true);
    
    // If user has never selected a mode, show selection
    // If user has selected before, handle their saved preference
    if (hasEverSelected && chatMode === 'selection') {
      selectChatMode('ai');
    } else if (hasEverSelected && chatMode === 'admin') {
      // If user previously selected admin, connect to admin chat
      openAdminChat();
    }
    
    setTimeout(scrollToBottom, 300);
  }, [scrollToBottom, hasEverSelected, chatMode, selectChatMode, openAdminChat]);

  // Close chat
  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    resetToSelection();
    setMessages([]);
    
    // Abort any ongoing streaming
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Close admin chat if connected
    if (isConnected) {
      closeAdminChat();
    }
  }, [isConnected, closeAdminChat, resetToSelection]);

  // Toggle minimize
  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => {
      const newMinimized = !prev;
      if (!newMinimized) {
        setTimeout(scrollToBottom, 300);
      }
      return newMinimized;
    });
  }, [scrollToBottom]);

  // Update streaming message
  const updateStreamingMessage = useCallback((messageId: string, content: string, isComplete: boolean = false) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content, isStreaming: !isComplete }
        : msg
    ));
    
    if (isComplete) {
      setIsStreaming(false);
      setStreamingMessageId(null);
    }
    
    scrollToBottom();
  }, [scrollToBottom]);

  // Auto-fallback to admin if AI fails multiple times
  const handleAIFailure = useCallback(() => {
    const newFailureCount = aiFailureCount + 1;
    setAiFailureCount(newFailureCount);
    
    if (newFailureCount >= 2) {
      addLocalMessage(
        'AI Assistant hiện không thể phản hồi. Tôi sẽ chuyển bạn sang tư vấn viên để được hỗ trợ tốt hơn.',
        false,
        false,
        false,
        'Hệ thống'
      );
      
      setTimeout(() => {
        setChatMode('admin');
        openAdminChat();
        addLocalMessage(
          'Đã chuyển sang tư vấn viên. Vui lòng chờ trong giây lát.',
          false,
          false,
          false,
          'Hệ thống'
        );
      }, 2000);
    }
  }, [aiFailureCount, addLocalMessage, setChatMode, openAdminChat]);

  // Send AI message
  const sendAIMessage = useCallback(async (messageContent: string) => {
    try {
      // Add user message
      addLocalMessage(messageContent, true);
      
      // Add AI placeholder message
      const aiMessageId = addLocalMessage('', false, false, true);
      setIsStreaming(true);
      setStreamingMessageId(aiMessageId);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Call AI chat API
      const aiResponse = await chatService.processSimpleAIChat(messageContent);
      
      // Update AI message with response
      updateStreamingMessage(aiMessageId, aiResponse, true);
      
      // Reset failure count on success
      setAiFailureCount(0);
      
    } catch (error: any) {
      console.error('[UnifiedCustomerChat] Error sending AI message:', error);
      
      if (error.name === 'AbortError') {
        if (streamingMessageId) {
          updateStreamingMessage(streamingMessageId, 'Đã hủy yêu cầu.', true);
        }
      } else {
        // Add error message and handle AI failure
        addLocalMessage('Xin lỗi, AI Assistant hiện không thể phản hồi.', false, true, true);
        handleAIFailure();
      }
      
      setIsStreaming(false);
      setStreamingMessageId(null);
    } finally {
      abortControllerRef.current = null;
    }
  }, [addLocalMessage, updateStreamingMessage, streamingMessageId, handleAIFailure]);

  // Send admin message
  const sendAdminMessageHandler = useCallback(async (messageContent: string) => {
    try {
      if (!chatRoom) {
        toast.error('Chưa kết nối với tư vấn viên. Vui lòng thử lại.');
        return;
      }

      await sendAdminMessage(messageContent);
      
    } catch (error: any) {
      console.error('[UnifiedCustomerChat] Error sending admin message:', error);
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  }, [chatRoom, sendAdminMessage]);

  // Main send message function
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || isStreaming) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    
    if (chatMode === 'ai') {
      await sendAIMessage(messageContent);
    } else if (chatMode === 'admin') {
      await sendAdminMessageHandler(messageContent);
    }
  }, [newMessage, isStreaming, chatMode, sendAIMessage, sendAdminMessageHandler]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

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
          minute: '2-digit' 
        });
      }
      
      // Check if the date is valid
      if (isNaN(messageDate.getTime())) {
        console.warn('Invalid date created from timestamp:', timestamp);
        return new Date().toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      
      const now = new Date();
      const isToday = messageDate.toDateString() === now.toDateString();
      
      if (isToday) {
        return messageDate.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else {
        return messageDate.toLocaleDateString('vi-VN', { 
          day: '2-digit', 
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error, 'Original timestamp:', timestamp);
      // Return current time as fallback
      return new Date().toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
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

  // Combined messages for display - use adminMessages directly for admin mode
  const displayMessages = chatMode === 'admin' ? 
    adminMessages.map(msg => ({
      id: msg.messageId,
      content: msg.content,
      isUser: isMyMessage(msg),
      timestamp: msg.timestamp, // Keep original timestamp format for formatTimestamp to handle
      isAI: isAiMessage(msg),
      senderName: msg.senderName
    })) : messages;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Chat Toggle Button */}
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
              className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg relative"
            >
              <MessageCircle className="h-6 w-6 text-white" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-full" />
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="bg-white rounded-lg shadow-2xl border border-gray-200 w-80"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <div className="h-8 w-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    {chatMode === 'ai' ? (
                      <Bot className="h-5 w-5 text-white" />
                    ) : chatMode === 'admin' ? (
                      <Users className="h-5 w-5 text-white" />
                    ) : (
                      <MessageCircle className="h-5 w-5 text-white" />
                    )}
                  </div>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm flex items-center">
                    {chatMode === 'ai' && (
                      <>
                        AI Assistant
                        <Sparkles className="h-3 w-3 ml-1" />
                      </>
                    )}
                    {chatMode === 'admin' && 'Tư vấn viên'}
                    {chatMode === 'selection' && 'Hỗ trợ khách hàng'}
                  </h3>
                  <p className="text-xs text-blue-100 flex items-center">
                    {chatMode === 'ai' && 'Trợ lý thông minh'}
                    {chatMode === 'admin' && (
                      <>
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                          adminOnlineStatus === 'online' ? 'bg-green-400' :
                          adminOnlineStatus === 'away' ? 'bg-yellow-400' :
                          adminOnlineStatus === 'busy' ? 'bg-red-400' :
                          'bg-gray-400'
                        }`}></span>
                        {adminOnlineStatus === 'online' ? 'Đang trực tuyến' :
                         adminOnlineStatus === 'away' ? 'Tạm vắng' :
                         adminOnlineStatus === 'busy' ? 'Bận' :
                         'Offline'}
                      </>
                    )}
                    {chatMode === 'selection' && 'Chọn loại hỗ trợ'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {chatMode !== 'selection' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      resetToSelection();
                      setMessages([]);
                      if (isConnected) closeAdminChat();
                    }}
                    className="h-8 w-8 p-0 text-white hover:bg-white hover:bg-opacity-20"
                    title="Quay lại chọn loại hỗ trợ"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMinimize}
                  className="h-8 w-8 p-0 text-white hover:bg-white hover:bg-opacity-20"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
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
                  {/* Mode Selection */}
                  {chatMode === 'selection' && (
                    <div className="p-6 space-y-4">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Chọn loại hỗ trợ
                        </h3>
                        <p className="text-sm text-gray-600">
                          Bạn muốn được hỗ trợ bởi AI hay tư vấn viên?
                        </p>
                      </div>
                      
                      <Card 
                        className="cursor-pointer hover:shadow-md transition-shadow border-purple-200 hover:border-purple-400"
                        onClick={() => selectChatMode('ai')}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                              <Bot className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800 flex items-center">
                                AI Assistant
                                <Sparkles className="h-3 w-3 ml-1 text-purple-500" />
                              </h4>
                              <p className="text-sm text-gray-600">
                                Phản hồi nhanh, hỗ trợ 24/7
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              Nhanh
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card 
                        className="cursor-pointer hover:shadow-md transition-shadow border-blue-200 hover:border-blue-400"
                        onClick={() => selectChatMode('admin')}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">
                                Tư vấn viên
                              </h4>
                              <p className="text-sm text-gray-600">
                                Hỗ trợ chuyên sâu từ con người
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              Chuyên nghiệp
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Messages */}
                  {chatMode !== 'selection' && (
                    <>
                      <ScrollArea className="h-80 p-4">
                        <div className="space-y-3">
                          {displayMessages.map((message, index) => (
                            <div
                              key={message.id || index}
                              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`flex items-start space-x-2 max-w-[85%] ${
                                message.isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                              }`}>
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
                                <Card className={`${
                                  message.isUser
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : message.isError
                                    ? 'bg-red-50 text-red-800 border-red-200'
                                    : message.isAI
                                    ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-gray-800 border-purple-200'
                                    : 'bg-gray-50 text-gray-800 border-gray-200'
                                }`}>
                                  <CardContent className="px-3 py-2">
                                    {/* Sender info with status */}
                                    <div className={`flex items-center justify-between mb-1 ${
                                      message.isUser ? 'flex-row-reverse' : 'flex-row'
                                    }`}>
                                      <div className={`flex items-center gap-1 ${
                                        message.isUser ? 'flex-row-reverse' : 'flex-row'
                                      }`}>
                                        <span className={`text-xs font-medium ${
                                          message.isUser ? 'text-blue-100' : 'text-gray-600'
                                        }`}>
                                          {message.isUser ? 'Bạn' : 
                                           message.isAI ? 'AI Assistant' : 
                                           message.senderName || 'Tư vấn viên'}
                                        </span>
                                        <UserStatusBadge 
                                          userType={
                                            message.isUser ? 'customer' : 
                                            message.isAI ? 'ai' : 'admin'
                                          } 
                                          size="sm" 
                                          showIcon={true}
                                          className={message.isUser ? 'bg-blue-500 text-white border-blue-400' : ''}
                                        />
                                      </div>
                                      <span className={`text-xs ${
                                        message.isUser ? 'text-blue-100' : 'text-gray-500'
                                      }`}>
                                        {formatTimestamp(message.timestamp)}
                                      </span>
                                    </div>
                                    
                                    {/* Message content */}
                                    <p className="text-sm break-words whitespace-pre-wrap">
                                      {message.content}
                                      {message.isStreaming && (
                                        <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse">|</span>
                                      )}
                                    </p>
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
                        {isStreaming && (
                          <div className="flex items-center justify-between mb-2 p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                              <span className="text-sm text-gray-600">
                                {chatMode === 'ai' ? 'AI đang trả lời...' : 'Đang gửi...'}
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
                              chatMode === 'ai' ? 'Hỏi AI Assistant...' : 
                              chatMode === 'admin' ? 'Nhắn tin cho tư vấn viên...' : 
                              'Nhập tin nhắn...'
                            }
                            disabled={isStreaming || (chatMode === 'admin' && !isConnected)}
                            className="flex-1"
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || isStreaming || (chatMode === 'admin' && !isConnected)}
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
                            {chatMode === 'ai' && (
                              <>
                                <Sparkles className="h-3 w-3 mr-1" />
                                Được hỗ trợ bởi AI
                              </>
                            )}
                            {chatMode === 'admin' && (
                              <>
                                <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                  adminOnlineStatus === 'online' ? 'bg-green-500' :
                                  adminOnlineStatus === 'away' ? 'bg-yellow-500' :
                                  adminOnlineStatus === 'busy' ? 'bg-red-500' :
                                  'bg-gray-500'
                                }`}></span>
                                <Users className="h-3 w-3 mr-1" />
                                Tư vấn viên {adminOnlineStatus === 'online' ? 'đang trực tuyến' :
                                           adminOnlineStatus === 'away' ? 'tạm vắng' :
                                           adminOnlineStatus === 'busy' ? 'đang bận' :
                                           'không trực tuyến'}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnifiedCustomerChat;

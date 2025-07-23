import React, { useState, useRef, useCallback } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserStatusBadge } from '@/components/ui/user-status-badge';
import { useCustomerChat } from '@/hooks/use-customer-chat';

interface CustomerChatBoxProps {
  className?: string;
}

export const CustomerChatBox: React.FC<CustomerChatBoxProps> = ({ className = '' }) => {
  const [newMessage, setNewMessage] = useState('');
  
  // Use custom chat hook
  const {
    isOpen,
    isMinimized,
    isConnecting,
    isConnected,
    messages,
    unreadCount,
    isLoading,
    isSendingMessage,
    isTyping,
    isAiTyping,
    openChat,
    closeChat,
    toggleMinimize,
    sendMessage: sendChatMessage,
    formatTimestamp,
    isMyMessage,
    isAiMessage
  } = useCustomerChat({ enableNotifications: true });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || isSendingMessage) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    
    try {
      await sendChatMessage(messageContent);
    } catch (error) {
      // Restore message on error
      setNewMessage(messageContent);
    }
  }, [newMessage, isSendingMessage, sendChatMessage]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

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
              className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg relative"
            >
              <MessageCircle className="h-6 w-6 text-white" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
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
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/api/placeholder/32/32" />
                  <AvatarFallback className="bg-blue-500 text-white text-xs">
                    HT
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm">Hỗ trợ khách hàng</h3>
                  <p className="text-xs text-blue-100">
                    {isConnected ? 'Đang kết nối' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMinimize}
                  className="h-8 w-8 p-0 text-white hover:bg-blue-700"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeChat}
                  className="h-8 w-8 p-0 text-white hover:bg-blue-700"
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
                  {isLoading ? (
                    <div className="h-80 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Đang kết nối...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Messages */}
                      <ScrollArea className="h-80 p-4">
                        <div className="space-y-3">
                          {messages.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">Chào mừng bạn đến với hỗ trợ khách hàng!</p>
                              <p className="text-xs mt-1">Hãy gửi tin nhắn để bắt đầu cuộc trò chuyện.</p>
                            </div>
                          ) : (
                            messages.map((message) => (
                              <div
                                key={message.messageId}
                                className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`flex items-start space-x-2 max-w-[80%] ${
                                  isMyMessage(message) ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                                }`}>
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    {isAiMessage(message) ? (
                                      <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <Bot className="h-3 w-3 text-white" />
                                      </div>
                                    ) : isMyMessage(message) ? (
                                      <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                                        <User className="h-3 w-3 text-white" />
                                      </div>
                                    ) : (
                                      <AvatarFallback className="bg-gray-300 text-gray-600 text-xs">
                                        {message.senderName?.charAt(0) || 'A'}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div className={`rounded-lg px-3 py-2 ${
                                    isMyMessage(message)
                                      ? 'bg-blue-600 text-white'
                                      : isAiMessage(message)
                                      ? 'bg-green-100 text-green-800 border border-green-200'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {/* Sender info with admin status */}
                                    {!isMyMessage(message) && !isAiMessage(message) && (
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-gray-600">
                                          {message.senderName || 'Admin'}
                                        </span>
                                        <UserStatusBadge 
                                          userType="admin" 
                                          size="sm" 
                                          showIcon={true}
                                        />
                                      </div>
                                    )}
                                    {isAiMessage(message) && (
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-green-700">
                                          AI Assistant
                                        </span>
                                        <UserStatusBadge 
                                          userType="ai" 
                                          size="sm" 
                                          showIcon={true}
                                        />
                                      </div>
                                    )}
                                    {isMyMessage(message) && (
                                      <div className="flex items-center gap-2 mb-1 justify-end">
                                        <UserStatusBadge 
                                          userType="customer" 
                                          size="sm" 
                                          showIcon={true}
                                        />
                                        <span className="text-xs font-medium text-blue-100">
                                          Bạn
                                        </span>
                                      </div>
                                    )}
                                    
                                    <p className="text-sm break-words">
                                      {message.isDeleted ? (
                                        <em className="text-gray-500">[Tin nhắn đã bị xóa]</em>
                                      ) : (
                                        message.content
                                      )}
                                    </p>
                                    <p className={`text-xs mt-1 ${
                                      isMyMessage(message) ? 'text-blue-100' : 'text-gray-500'
                                    }`}>
                                      {formatTimestamp(message.timestamp)}
                                      {message.isEdited && ' (đã chỉnh sửa)'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                          
                          {/* Typing indicators */}
                          {(isTyping || isAiTyping) && (
                            <div className="flex justify-start">
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  {isAiTyping ? (
                                    <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                                      <Bot className="h-3 w-3 text-white" />
                                    </div>
                                  ) : (
                                    <AvatarFallback className="bg-gray-300 text-gray-600 text-xs">
                                      A
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="bg-gray-100 rounded-lg px-3 py-2">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>

                      {/* Input */}
                      <div className="p-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Nhập tin nhắn..."
                            disabled={isSendingMessage || !isConnected}
                            className="flex-1"
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || isSendingMessage || !isConnected}
                            size="sm"
                            className="px-3"
                          >
                            {isSendingMessage ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {isConnecting && (
                          <p className="text-xs text-gray-500 mt-2">Đang kết nối...</p>
                        )}
                        {!isConnected && !isConnecting && (
                          <p className="text-xs text-yellow-600 mt-2">Kết nối không ổn định</p>
                        )}
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

export default CustomerChatBox;

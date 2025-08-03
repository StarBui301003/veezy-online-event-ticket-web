import React, { useState } from 'react';
import { X, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EventChatAssistantProps {
  eventId?: string;
  eventName?: string;
  className?: string;
}

export const EventChatAssistant: React.FC<EventChatAssistantProps> = ({ 
  eventName, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openChat = () => {
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <div className={`${className}`}>
      {/* Inline Chat Section for Event Page */}
      <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <span>Hỏi AI về sự kiện này</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Có câu hỏi về{eventName ? ` "${eventName}"` : ' sự kiện này'}? 
              AI Assistant có thể giúp bạn tìm hiểu chi tiết về:
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-1 text-gray-500">
                <span>🎫</span>
                <span>Thông tin vé</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-500">
                <span>📍</span>
                <span>Địa điểm & thời gian</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-500">
                <span>💳</span>
                <span>Thanh toán</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-500">
                <span>❓</span>
                <span>Câu hỏi khác</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={openChat}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                size="sm"
              >
                <Bot className="h-4 w-4 mr-2" />
                Hỏi AI Assistant
              </Button>
            </div>

            {/* Sample Questions */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-700">Câu hỏi mẫu:</p>
              <div className="flex flex-wrap gap-1">
                {[
                  "Giá vé là bao nhiêu?",
                  "Sự kiện diễn ra khi nào?",
                  "Địa điểm ở đâu?",
                  "Có giảm giá không?"
                ].map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      openChat();
                      // You could pre-fill the question here
                    }}
                    className="text-xs bg-white border border-gray-200 rounded-full px-2 py-1 hover:bg-gray-50 text-gray-600"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating AI Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          >
            <div className="relative w-full max-w-md">
              <Button
                onClick={closeChat}
                variant="ghost"
                size="sm"
                className="absolute -top-10 right-0 text-white hover:bg-white hover:bg-opacity-20"
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5" />
                    <div>
                      <h3 className="font-semibold">AI Assistant</h3>
                      {eventName && (
                        <p className="text-xs text-blue-100">
                          Đang hỗ trợ: {eventName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chat Content */}
                <div className="h-96 flex items-center justify-center">
                  {/* Remove duplicate CustomerChatBox to prevent double API calls */}
                  <div className="text-center text-gray-500 p-4">
                    <Bot className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="mb-2">Chat đã được tích hợp trong layout chính</p>
                    <p className="text-sm">Vui lòng sử dụng chat box ở góc dưới bên phải màn hình</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventChatAssistant;

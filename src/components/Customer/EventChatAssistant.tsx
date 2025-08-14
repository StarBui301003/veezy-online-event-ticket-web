import React, { useState, useEffect, useCallback } from 'react';
import { X, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

interface EventChatAssistantProps {
  eventId?: string;
  eventName?: string;
  className?: string;
}

export const EventChatAssistant: React.FC<EventChatAssistantProps> = ({
  eventName,
  className = '',
}) => {
  const { getThemeClass } = useThemeClasses();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Check if user is EventManager (role 2) - if so, hide this component
  const checkVisibility = useCallback(() => {
    const isAuthenticated = !!localStorage.getItem('access_token');
    if (!isAuthenticated) {
      setIsVisible(false);
      return;
    }
    
    try {
      const accountStr = localStorage.getItem('account');
      if (accountStr) {
        const accountObj = JSON.parse(accountStr);
        // Hide for EventManager (role 2)
        const shouldShow = accountObj.role !== 2;
        setIsVisible(shouldShow);
      } else {
        setIsVisible(false);
      }
    } catch (error) {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    checkVisibility();
    
    // Listen for auth changes
    const handleAuthChange = () => checkVisibility();
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

  // Don't render if user is EventManager
  if (!isVisible) {
    return null;
  }

  const openChat = () => {
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <div className={`${className}`}>
      {/* Inline Chat Section for Event Page */}
      <Card
        className={cn(
          'border-2 shadow-lg',
          getThemeClass(
            'bg-white/95 border-blue-200 shadow-lg',
            'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-purple-700'
          )
        )}
      >
        <CardHeader className="pb-3">
          <CardTitle
            className={cn(
              'flex items-center space-x-2 text-lg',
              getThemeClass('text-gray-900', 'text-white')
            )}
          >
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center',
                getThemeClass(
                  'bg-gradient-to-r from-blue-500 to-purple-500',
                  'bg-gradient-to-r from-purple-500 to-pink-500'
                )
              )}
            >
              <Bot className="h-4 w-4 text-white" />
            </div>
            <span>Hỏi AI về sự kiện này</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className={cn('text-sm', getThemeClass('text-gray-600', 'text-slate-300'))}>
              Có câu hỏi về{eventName ? ` "${eventName}"` : ' sự kiện này'}? AI Assistant có thể
              giúp bạn tìm hiểu chi tiết về:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div
                className={cn(
                  'flex items-center space-x-1',
                  getThemeClass('text-gray-500', 'text-slate-400')
                )}
              >
                <span>🎫</span>
                <span>Thông tin vé</span>
              </div>
              <div
                className={cn(
                  'flex items-center space-x-1',
                  getThemeClass('text-gray-500', 'text-slate-400')
                )}
              >
                <span>📍</span>
                <span>Địa điểm & thời gian</span>
              </div>
              <div
                className={cn(
                  'flex items-center space-x-1',
                  getThemeClass('text-gray-500', 'text-slate-400')
                )}
              >
                <span>💳</span>
                <span>Thanh toán</span>
              </div>
              <div
                className={cn(
                  'flex items-center space-x-1',
                  getThemeClass('text-gray-500', 'text-slate-400')
                )}
              >
                <span>❓</span>
                <span>Câu hỏi khác</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={openChat}
                className={cn(
                  'flex-1 text-white',
                  getThemeClass(
                    'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
                    'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                  )
                )}
                size="sm"
              >
                <Bot className="h-4 w-4 mr-2" />
                Hỏi AI Assistant
              </Button>
            </div>

            {/* Sample Questions */}
            <div className="space-y-1">
              <p
                className={cn(
                  'text-xs font-medium',
                  getThemeClass('text-gray-700', 'text-slate-200')
                )}
              >
                Câu hỏi mẫu:
              </p>
              <div className="flex flex-wrap gap-1">
                {[
                  'Giá vé là bao nhiêu?',
                  'Sự kiện diễn ra khi nào?',
                  'Địa điểm ở đâu?',
                  'Có giảm giá không?',
                ].map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      openChat();
                      // You could pre-fill the question here
                    }}
                    className={cn(
                      'text-xs rounded-full px-2 py-1 hover:bg-gray-50',
                      getThemeClass(
                        'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
                        'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600'
                      )
                    )}
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

              <div
                className={cn(
                  'rounded-lg shadow-2xl overflow-hidden',
                  getThemeClass('bg-white', 'bg-slate-800')
                )}
              >
                {/* Chat Header */}
                <div
                  className={cn(
                    'text-white p-4',
                    getThemeClass(
                      'bg-gradient-to-r from-blue-500 to-purple-500',
                      'bg-gradient-to-r from-purple-500 to-pink-500'
                    )
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5" />
                    <div>
                      <h3 className="font-semibold">AI Assistant</h3>
                      {eventName && (
                        <p
                          className={cn(
                            'text-xs',
                            getThemeClass('text-blue-100', 'text-purple-100')
                          )}
                        >
                          Đang hỗ trợ: {eventName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chat Content */}
                <div className="h-96 flex items-center justify-center">
                  {/* Remove duplicate CustomerChatBox to prevent double API calls */}
                  <div
                    className={cn(
                      'text-center p-4',
                      getThemeClass('text-gray-500', 'text-slate-400')
                    )}
                  >
                    <Bot
                      className={cn(
                        'h-12 w-12 mx-auto mb-3',
                        getThemeClass('text-gray-400', 'text-slate-500')
                      )}
                    />
                    <p className="mb-2">Chat đã được tích hợp trong layout chính</p>
                    <p className="text-sm">
                      Vui lòng sử dụng chat box ở góc dưới bên phải màn hình
                    </p>
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

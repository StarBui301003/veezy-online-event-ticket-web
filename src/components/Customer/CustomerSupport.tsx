import React, { useState } from 'react';
import { MessageCircle, Bot, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CustomerChatBox } from './CustomerChatBox';
import { AICustomerChatBox } from './AICustomerChatBox';

interface CustomerSupportProps {
  className?: string;
  showAIChat?: boolean;
  showHumanChat?: boolean;
}

export const CustomerSupport: React.FC<CustomerSupportProps> = ({ 
  className = '',
  showAIChat = true,
  showHumanChat = true
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<'human' | 'ai' | null>(null);

  const openChatMenu = () => {
    setIsMenuOpen(true);
  };

  const closeChatMenu = () => {
    setIsMenuOpen(false);
    setSelectedChat(null);
  };

  const selectChat = (type: 'human' | 'ai') => {
    setSelectedChat(type);
    setIsMenuOpen(false);
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Show individual chat components when selected */}
      {selectedChat === 'human' && showHumanChat && (
        <CustomerChatBox />
      )}
      
      {selectedChat === 'ai' && showAIChat && (
        <AICustomerChatBox />
      )}

      {/* Chat Menu */}
      <AnimatePresence>
        {isMenuOpen && !selectedChat && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="mb-4"
          >
            <Card className="w-72 shadow-2xl border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-gray-800">Hỗ trợ khách hàng</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeChatMenu}
                    className="h-8 w-8 p-0"
                  >
                    ×
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {/* AI Chat Option */}
                  {showAIChat && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        onClick={() => selectChat('ai')}
                        className="w-full h-auto p-4 flex items-start space-x-3 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                      >
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-800">AI Assistant</h4>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                              Nhanh
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Trợ lý AI thông minh, trả lời ngay lập tức các câu hỏi về sự kiện và vé
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>• Phản hồi tức thì</span>
                            <span>• 24/7</span>
                            <span>• Đa ngôn ngữ</span>
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  )}

                  {/* Human Chat Option */}
                  {showHumanChat && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        onClick={() => selectChat('human')}
                        className="w-full h-auto p-4 flex items-start space-x-3 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                      >
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <MessageCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-800">Chat với nhân viên</h4>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                              Chuyên nghiệp
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Kết nối trực tiếp với đội ngũ hỗ trợ khách hàng chuyên nghiệp
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>• Hỗ trợ chuyên sâu</span>
                            <span>• Giải quyết phức tạp</span>
                            <span>• Cá nhân hóa</span>
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  )}
                </div>

                {/* Quick Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <HelpCircle className="h-4 w-4" />
                    <span className="font-medium">Gợi ý:</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Bắt đầu với AI Assistant để được hỗ trợ nhanh chóng. Chuyển sang chat với nhân viên nếu cần hỗ trợ chuyên sâu hơn.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Support Button */}
      <AnimatePresence>
        {!isMenuOpen && !selectedChat && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="relative"
          >
            <Button
              onClick={openChatMenu}
              className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg relative group"
            >
              <div className="relative">
                <MessageCircle className="h-7 w-7 text-white" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Hỗ trợ khách hàng
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Quick Access (when menu is closed and no chat selected) */}
      {!isMenuOpen && !selectedChat && showAIChat && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, x: -80 }}
          className="absolute top-2 right-0"
        >
          <Button
            onClick={() => selectChat('ai')}
            className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-md"
          >
            <Bot className="h-4 w-4 text-white" />
          </Button>
        </motion.div>
      )}

      {/* Back button when chat is selected */}
      <AnimatePresence>
        {selectedChat && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-2 left-2"
          >
            <Button
              onClick={() => setSelectedChat(null)}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-white shadow-md"
            >
              ←
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerSupport;

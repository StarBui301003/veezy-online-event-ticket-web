import React, { useState, useCallback } from 'react';
import { MessageCircle, Users, CheckCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Services
import { chatService } from '@/services/chat.service';
import { useEventManagerChat } from '@/hooks/use-event-manager-chat';

interface EventChatSupportButtonProps {
  eventId: string;
  eventName: string;
  className?: string;
  variant?: 'button' | 'card' | 'inline';
}

export const EventChatSupportButton: React.FC<EventChatSupportButtonProps> = ({
  eventId,
  eventName,
  className = '',
  variant = 'button'
}) => {
  const navigate = useNavigate();
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [showQuickPreview, setShowQuickPreview] = useState(false);

  // Chat hook for real-time data
  const {
    isConnected,
    chatRoom,
    onlineParticipants,
  } = useEventManagerChat({
    eventId,
    eventName,
    autoConnect: false,
    enableNotifications: false,
  });

  // Check access to event chat room
  const checkAccess = useCallback(async () => {
    if (hasAccess !== null) return hasAccess;

    try {
      setIsCheckingAccess(true);
      const access = await chatService.checkEventChatRoomAccess(eventId);
      setHasAccess(access);
      return access;
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
      return false;
    } finally {
      setIsCheckingAccess(false);
    }
  }, [eventId, hasAccess]);

  // Handle chat room access
  const handleChatAccess = useCallback(async () => {
    const access = await checkAccess();
    
    if (!access) {
      toast.error('Bạn không có quyền truy cập chat room của sự kiện này');
      return;
    }

    // Navigate to chat support page for this event
    navigate(`/event-manager/chat-support/${eventId}`);
  }, [eventId, navigate, checkAccess]);

  // Open in new tab/window
  const handleOpenInNewTab = useCallback(async () => {
    const access = await checkAccess();
    
    if (!access) {
      toast.error('Bạn không có quyền truy cập chat room của sự kiện này');
      return;
    }

    const url = `/event-manager/chat-support/${eventId}`;
    window.open(url, '_blank');
  }, [eventId, checkAccess]);

  // Get participant count
  const getParticipantInfo = () => {
    if (!chatRoom) return { total: 0, online: 0 };
    
    const total = chatRoom.participants.length;
    const online = onlineParticipants.length;
    return { total, online };
  };

  const participantInfo = getParticipantInfo();

  // Render based on variant
  if (variant === 'card') {
    return (
      <Card className={`cursor-pointer hover:shadow-md transition-shadow ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                {isConnected && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle className="h-2 w-2 text-white" />
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Hỗ trợ chat</h4>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>{participantInfo.total} thành viên</span>
                  {participantInfo.online > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-green-600">{participantInfo.online} online</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenInNewTab}
                      disabled={isCheckingAccess}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mở trong tab mới</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button
                onClick={handleChatAccess}
                disabled={isCheckingAccess}
                size="sm"
              >
                {isCheckingAccess ? 'Kiểm tra...' : 'Mở chat'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Dialog open={showQuickPreview} onOpenChange={setShowQuickPreview}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>Chat hỗ trợ</span>
              {participantInfo.online > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {participantInfo.online}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Chat hỗ trợ - {eventName}</DialogTitle>
              <DialogDescription>
                Quản lý chat hỗ trợ khách hàng cho sự kiện này
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Thành viên</span>
                </div>
                <Badge variant="outline">{participantInfo.total}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Đang online</span>
                </div>
                <Badge variant="outline" className="text-green-600">
                  {participantInfo.online}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-700">Trạng thái kết nối</span>
                </div>
                <Badge variant={isConnected ? 'default' : 'secondary'}>
                  {isConnected ? 'Đã kết nối' : 'Chưa kết nối'}
                </Badge>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleOpenInNewTab}
                  disabled={isCheckingAccess}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Tab mới
                </Button>
                <Button
                  onClick={handleChatAccess}
                  disabled={isCheckingAccess}
                  className="flex-1"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {isCheckingAccess ? 'Kiểm tra...' : 'Mở chat'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Default button variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={className}
          >
            <Button
              onClick={handleChatAccess}
              disabled={isCheckingAccess}
              variant="outline"
              size="sm"
              className="relative flex items-center space-x-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Hỗ trợ chat</span>
              
              {/* Online indicator */}
              {isConnected && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border border-white" />
              )}
              
              {/* Unread indicator */}
              {participantInfo.online > 0 && (
                <Badge variant="destructive" className="text-xs ml-1">
                  {participantInfo.online}
                </Badge>
              )}
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p>Chat hỗ trợ khách hàng</p>
            <p className="text-xs text-gray-500">
              {participantInfo.total} thành viên • {participantInfo.online} online
            </p>
            {isConnected && (
              <p className="text-xs text-green-500">✓ Đã kết nối</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default EventChatSupportButton;

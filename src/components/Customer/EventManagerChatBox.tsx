/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Send,
  MessageCircle,
  Users,
  Reply,
  MoreVertical,
  X,
  Minimize2,
  Maximize2,
  Edit3,
  Trash2,
  Check,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { connectChatHub, onChat, joinChatRoom, leaveChatRoom } from '@/services/signalr.service';
import { chatService, type ChatMessage, type ChatRoom } from '@/services/chat.service';

interface EventManagerChatBoxProps {
  eventId: string;
  eventName?: string;
  className?: string;
  onClose?: () => void;
}

interface ChatParticipant {
  userId: string;
  userName: string;
  avatarUrl?: string;
  isOnline: boolean;
  role: string;
}

interface DisplayMessage {
  id: string;
  content: string;
  senderName: string;
  senderId: string;
  createdAt: string;
  isMyMessage: boolean;
  isEventManager: boolean;
  replyToMessage?: DisplayMessage;
}

export const EventManagerChatBox: React.FC<EventManagerChatBoxProps> = ({
  eventId,
  eventName = 'Event',
  className = '',
  onClose,
}) => {
  // States
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [onlineParticipants, setOnlineParticipants] = useState<ChatParticipant[]>([]);
  const [replyingTo, setReplyingTo] = useState<DisplayMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<DisplayMessage | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatRoomRef = useRef<ChatRoom | null>(null);

  // Get current user
  const getCurrentUser = useCallback(() => {
    console.log('🔍 Getting current user from localStorage...');

    // Try 'user' first
    let userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('✅ Found user in localStorage:', user);
        return {
          id: user.id || user.userId || user.accountId,
          displayName: user.displayName || user.fullName || user.username,
        };
      } catch (e) {
        console.error('❌ Error parsing user from localStorage:', e);
      }
    }

    // Try 'account' as fallback
    userStr = localStorage.getItem('account');
    if (userStr) {
      try {
        const account = JSON.parse(userStr);
        console.log('✅ Found account in localStorage:', account);
        return {
          id: account.id || account.userId || account.accountId,
          displayName: account.displayName || account.fullName || account.username,
        };
      } catch (e) {
        console.error('❌ Error parsing account from localStorage:', e);
      }
    }

    console.error('❌ No user found in localStorage');
    return null;
  }, []);

  const currentUser = getCurrentUser();

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        });
      }, 100);
    }
  }, []);

  // Transform backend message to display message
  const transformMessage = useCallback(
    (message: ChatMessage): DisplayMessage => {
      const isMyMessage = message.senderId === currentUser?.id;
      const isEventManager =
        chatRoom?.participants.some(
          (p) => p.userId === message.senderId && p.role === 'EventManager'
        ) || false;

      return {
        id: message.messageId,
        content: message.content,
        senderName: message.senderName,
        senderId: message.senderId,
        createdAt: message.createdAt,
        isMyMessage,
        isEventManager,
        // Avoid infinite recursion for reply messages
        replyToMessage: message.replyToMessage
          ? {
              id: message.replyToMessage.messageId,
              content: message.replyToMessage.content,
              senderName: message.replyToMessage.senderName,
              senderId: message.replyToMessage.senderId,
              createdAt: message.replyToMessage.createdAt,
              isMyMessage: message.replyToMessage.senderId === currentUser?.id,
              isEventManager:
                chatRoom?.participants.some(
                  (p) => p.userId === message.replyToMessage?.senderId && p.role === 'EventManager'
                ) || false,
            }
          : undefined,
      };
    },
    [currentUser?.id, chatRoom?.participants]
  );

  // Initialize chat room
  const initializeChatRoom = useCallback(async () => {
    console.log('🚀 Initializing chat room...');
    console.log('Current user:', currentUser);
    console.log('Event ID:', eventId);

    if (!currentUser || !eventId) {
      console.error('❌ Missing current user or event ID');
      return;
    }

    try {
      setIsLoading(true);
      console.log('📞 Calling createUserEventManagerRoom API...');

      // Create or get existing chat room with event managers
      const room = await chatService.createUserEventManagerRoom(eventId);
      console.log('✅ Room created/retrieved:', room);
      setChatRoom(room);
      chatRoomRef.current = room;

      // Get messages for the room
      console.log('📨 Fetching room messages...');
      const messagesResponse = await chatService.getRoomMessages(room.roomId);
      console.log('📨 Messages response:', messagesResponse);
      const roomMessages = Array.isArray(messagesResponse)
        ? messagesResponse
        : (messagesResponse as any).items || [];
      const transformedMessages = roomMessages.map(transformMessage);
      console.log('🔄 Transformed messages:', transformedMessages);
      setMessages(transformedMessages);

      // Get participants
      console.log('👥 Setting up participants:', room.participants);
      setOnlineParticipants(
        room.participants.map((p) => ({
          userId: p.userId,
          userName: p.username || p.fullName,
          avatarUrl: p.avatar,
          isOnline: p.isOnline,
          role: p.role,
        })) || []
      );

      // Add participants to OnlineStatusContext for status tracking
      room.participants.forEach((participant) => {
        if (participant.userId) {
          window.dispatchEvent(
            new CustomEvent('addUserToOnlineContext', {
              detail: {
                userId: participant.userId,
                username: participant.username || participant.fullName,
                isOnline: participant.isOnline || true,
                lastActiveAt: new Date().toISOString(),
              },
            })
          );
          console.log('➕ Added participant to OnlineStatusContext:', participant.userId);
        }
      });

      // Connect to SignalR and join room
      console.log('🔌 Connecting to SignalR...');
      const token = localStorage.getItem('access_token');
      await connectChatHub('http://localhost:5007/chatHub', token || undefined);
      console.log('✅ SignalR connected');
      setIsConnected(true);

      console.log('🏠 Joining chat room:', room.roomId);
      await joinChatRoom(room.roomId);
      console.log('✅ Joined chat room successfully');

      toast.success(`Đã kết nối với nhóm quản lý sự kiện ${eventName}`);
      scrollToBottom();
    } catch (error: any) {
      console.error('❌ Error initializing chat room:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      toast.error('Không thể kết nối với nhóm quản lý sự kiện');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, eventId, eventName, transformMessage, scrollToBottom]);

  // Setup SignalR listeners
  useEffect(() => {
    if (!isConnected || !chatRoom) return;

    console.log('🎧 Setting up SignalR listeners for room:', chatRoom.roomId);

    // Listen for new messages
    const handleReceiveMessage = (messageDto: any) => {
      console.log('📩 Received SignalR message:', messageDto);

      if (messageDto.RoomId === chatRoom.roomId || messageDto.roomId === chatRoom.roomId) {
        const message: ChatMessage = {
          messageId: messageDto.Id || messageDto.id,
          roomId: messageDto.RoomId || messageDto.roomId,
          senderId: messageDto.SenderUserId || messageDto.senderUserId,
          senderName: messageDto.SenderUserName || messageDto.senderUserName,
          content: messageDto.Content || messageDto.content,
          timestamp: messageDto.CreatedAt || messageDto.createdAt,
          createdAt: messageDto.CreatedAt || messageDto.createdAt,
          isRead: false,
          messageType: 'Text',
          attachmentUrl: messageDto.AttachmentUrl || messageDto.attachmentUrl,
          isDeleted: messageDto.IsDeleted || messageDto.isDeleted || false,
          isEdited: messageDto.IsEdited || messageDto.isEdited || false,
          replyToMessageId: messageDto.ReplyToMessageId || messageDto.replyToMessageId,
          replyToMessage: messageDto.ReplyToMessage || messageDto.replyToMessage,
        };

        // Check if message already exists to prevent duplicates
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.messageId);
          if (exists) {
            console.log('⚠️ Message already exists, skipping:', message.messageId);
            return prev;
          }

          console.log('✅ Adding new message:', message.messageId);
          const transformedMessage = transformMessage(message);
          return [...prev, transformedMessage];
        });

        scrollToBottom();

        // Show notification if not from current user
        if (message.senderId !== currentUser?.id) {
          toast.info(`${message.senderName}: ${message.content.substring(0, 50)}...`);
        }
      }
    };

    // Listen for user online status
    const handleUserConnected = (userInfo: any) => {
      setOnlineParticipants((prev) =>
        prev.map((p) => (p.userId === userInfo.userId ? { ...p, isOnline: true } : p))
      );
    };

    const handleUserDisconnected = (userId: string) => {
      setOnlineParticipants((prev) =>
        prev.map((p) => (p.userId === userId ? { ...p, isOnline: false } : p))
      );
    };

    // Handle message updates
    const handleMessageUpdated = (messageDto: any) => {
      console.log('📝 Message updated:', messageDto);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === (messageDto.Id || messageDto.id)
            ? { ...msg, content: messageDto.Content || messageDto.content }
            : msg
        )
      );

      toast.info('Tin nhắn đã được cập nhật');
    };

    // Handle message deletions
    const handleMessageDeleted = (messageDto: any) => {
      console.log('🗑️ Message deleted:', messageDto);

      setMessages((prev) => prev.filter((msg) => msg.id !== (messageDto.Id || messageDto.id)));

      toast.info('Tin nhắn đã được xóa');
    };

    // Register listeners
    onChat('ReceiveMessage', handleReceiveMessage);
    onChat('UserConnected', handleUserConnected);
    onChat('UserDisconnected', handleUserDisconnected);
    onChat('MessageUpdated', handleMessageUpdated);
    onChat('MessageDeleted', handleMessageDeleted);

    return () => {
      console.log('🧹 Cleaning up SignalR listeners');
      // Cleanup will be handled by SignalR service
    };
  }, [chatRoom?.roomId, isConnected]); // Only depend on roomId and connection status

  // Open chat
  const openChat = useCallback(async () => {
    setIsOpen(true);
    setIsMinimized(false);

    if (!chatRoom) {
      await initializeChatRoom();
    }

    // Focus input after opening
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 300);
  }, [chatRoom, initializeChatRoom]);

  // Close chat
  const closeChat = useCallback(async () => {
    if (chatRoom && isConnected) {
      await leaveChatRoom(chatRoom.roomId);
    }
    setIsOpen(false);
    setIsMinimized(false);
    onClose?.();
  }, [chatRoom, isConnected, onClose]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, scrollToBottom]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) {
        const target = event.target as HTMLElement;
        // Check if click is outside the modal and not on the toggle button
        const modal = document.querySelector('[data-event-manager-chat-modal]') as HTMLElement;
        const toggleButton = document.querySelector(
          '[data-event-manager-chat-toggle]'
        ) as HTMLElement;

        console.log('🔍 Click outside check:', {
          target: target,
          modal: modal,
          toggleButton: toggleButton,
          modalContains: modal?.contains(target),
          toggleContains: toggleButton?.contains(target),
        });

        if (modal && !modal.contains(target) && toggleButton && !toggleButton.contains(target)) {
          console.log('✅ Closing chat - click outside detected');
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

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !chatRoom || isSending) return;

    const messageContent = newMessage.trim();

    console.log('📤 Sending message:', messageContent);
    setNewMessage('');
    setIsSending(true);

    try {
      // Send message via API (SignalR will handle the real-time update)
      const response = await chatService.sendMessage({
        roomId: chatRoom.roomId,
        content: messageContent,
        type: 0, // Text message
        replyToMessageId: replyingTo?.id,
      });

      console.log('✅ Message sent successfully:', response);
      setReplyingTo(null);
      scrollToBottom();
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      toast.error('Không thể gửi tin nhắn');
      setNewMessage(messageContent); // Restore message
    } finally {
      setIsSending(false);
    }
  }, [newMessage, chatRoom, isSending, replyingTo?.id, scrollToBottom]);

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

  // Handle reply
  const handleReply = useCallback((message: DisplayMessage) => {
    setReplyingTo(message);
    chatInputRef.current?.focus();
  }, []);

  // Cancel reply
  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Handle edit message
  const handleEdit = useCallback((message: DisplayMessage) => {
    setEditingMessage(message);
    setEditingContent(message.content);
  }, []);

  // Save edited message
  const saveEditedMessage = useCallback(async () => {
    if (!editingMessage || !editingContent.trim() || !chatRoom) return;

    try {
      // Call API to update message
      await chatService.updateMessage(editingMessage.id, editingContent.trim());

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === editingMessage.id ? { ...msg, content: editingContent.trim() } : msg
        )
      );

      setEditingMessage(null);
      setEditingContent('');
      toast.success('Tin nhắn đã được cập nhật');
    } catch (error: any) {
      console.error('❌ Error updating message:', error);
      toast.error('Không thể cập nhật tin nhắn');
    }
  }, [editingMessage, editingContent, chatRoom]);

  // Cancel edit
  const cancelEdit = useCallback(() => {
    setEditingMessage(null);
    setEditingContent('');
  }, []);

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!chatRoom) return;

      // Confirm deletion
      if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
        return;
      }

      try {
        // Call API to delete message
        await chatService.deleteMessage(messageId);

        // Update local state
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

        toast.success('Tin nhắn đã được xóa');
      } catch (error: any) {
        console.error('❌ Error deleting message:', error);
        toast.error('Không thể xóa tin nhắn');
      }
    },
    [chatRoom]
  );

  // Count online event managers
  const onlineManagersCount = onlineParticipants.filter(
    (p) => p.role === 'EventManager' && p.isOnline
  ).length;

  return (
    <div className={`fixed bottom-4 right-20 z-[9998] ${className}`}>
      {/* Chat Toggle Button - Always visible, fixed position */}
      <div className="relative z-10">
        <Button
          onClick={openChat}
          data-event-manager-chat-toggle
          className="rounded-full h-14 w-14 px-0 bg-green-600 hover:bg-green-700 text-white shadow-lg aspect-square flex items-center justify-center"
          size="lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        {onlineManagersCount > 0 && (
          <Badge className="absolute top-2 right-2 bg-orange-500 text-white min-w-[20px] h-5 rounded-full text-xs">
            {onlineManagersCount}
          </Badge>
        )}
      </div>

      {/* Chat Window - Higher z-index when chat is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white shadow-2xl border border-green-200 w-96 z-[9999] absolute bottom-0 right-0 rounded-2xl"
            data-event-manager-chat-modal
            style={{ pointerEvents: 'auto' }}
          >
            <Card
              className={`w-96 bg-white shadow-2xl border border-green-200 rounded-2xl ${
                isMinimized ? 'h-16' : 'h-[500px]'
              } transition-all duration-300`}
            >
              {/* Header */}
              <CardHeader className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-sm font-medium">Hỗ trợ sự kiện</CardTitle>
                      <p className="text-xs text-green-100 truncate max-w-[200px]">{eventName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isConnected ? 'bg-green-400' : 'bg-red-400'
                        }`}
                      />
                      <span className="text-xs text-green-100">{onlineManagersCount} online</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="text-white hover:bg-green-700 p-1 h-6 w-6"
                    >
                      {isMinimized ? (
                        <Maximize2 className="h-3 w-3" />
                      ) : (
                        <Minimize2 className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeChat}
                      className="text-white hover:bg-green-700 p-1 h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {!isMinimized && (
                <CardContent className="flex-1 p-0 flex flex-col h-[calc(600px-4rem)]">
                  {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Đang kết nối...</p>
                      </div>
                    </div>
                  ) : !isConnected ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center p-4">
                        <div className="text-red-500 mb-2">⚠️</div>
                        <p className="text-sm text-gray-600 mb-3">Không thể kết nối với server</p>
                        <Button
                          onClick={initializeChatRoom}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Thử lại
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Participants bar */}
                      <div className="p-3 bg-gray-50 border-b">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-xs text-gray-600">Nhóm quản lý:</span>
                          <div className="flex -space-x-1">
                            {onlineParticipants
                              .filter((p) => p.role === 'EventManager')
                              .slice(0, 3)
                              .map((participant) => (
                                <div key={participant.userId} className="relative">
                                  <Avatar className="h-6 w-6 border-2 border-white">
                                    <AvatarImage src={participant.avatarUrl} />
                                    <AvatarFallback className="text-xs">
                                      {participant.userName?.charAt(0) || 'M'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-0.5 -right-0.5">
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        participant.isOnline ? 'bg-green-400' : 'bg-gray-400'
                                      }`}
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                          {onlineParticipants.filter((p) => p.role === 'EventManager').length >
                            3 && (
                            <span className="text-xs text-gray-500">
                              +
                              {onlineParticipants.filter((p) => p.role === 'EventManager').length -
                                3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Messages */}
                      <ScrollArea className="flex-1 p-4">
                        <AnimatePresence>
                          {messages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3 }}
                              className={`mb-4 group ${
                                message.isMyMessage ? 'text-right' : 'text-left'
                              }`}
                            >
                              <div
                                className={`inline-flex items-start gap-2 max-w-[85%] ${
                                  message.isMyMessage ? 'flex-row-reverse' : 'flex-row'
                                }`}
                              >
                                <Avatar className="h-6 w-6 flex-shrink-0">
                                  <AvatarImage
                                    src={message.isEventManager ? '/admin-avatar.png' : undefined}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {message.senderName?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="relative">
                                  {/* Reply preview */}
                                  {message.replyToMessage && (
                                    <div className="mb-1 p-2 bg-gray-100 rounded-lg text-xs text-gray-600 max-w-[200px] truncate">
                                      <div className="font-medium text-gray-700">
                                        {message.replyToMessage.senderName}
                                      </div>
                                      {message.replyToMessage.content}
                                    </div>
                                  )}

                                  {/* Message content */}
                                  {editingMessage?.id === message.id ? (
                                    /* Edit mode */
                                    <div className="bg-white border-2 border-green-300 rounded-lg p-2 shadow-md">
                                      <Input
                                        value={editingContent}
                                        onChange={(e) => setEditingContent(e.target.value)}
                                        className="text-sm border-0 p-0 focus-visible:ring-0"
                                        autoFocus
                                      />
                                      <div className="flex gap-1 mt-2">
                                        <Button
                                          size="sm"
                                          onClick={saveEditedMessage}
                                          className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                                        >
                                          <Check className="h-3 w-3 mr-1" />
                                          Lưu
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={cancelEdit}
                                          className="h-6 px-2 text-xs"
                                        >
                                          <X className="h-3 w-3 mr-1" />
                                          Hủy
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Normal mode */
                                    <div
                                      className={`rounded-xl px-4 py-2 shadow-md ${
                                        message.isMyMessage
                                          ? 'bg-green-600 text-white shadow-green-200'
                                          : message.isEventManager
                                          ? 'bg-blue-200 text-blue-900 border-2 border-blue-400 shadow-blue-100'
                                          : 'bg-orange-100 text-orange-900 border-2 border-orange-300 shadow-orange-100'
                                      }`}
                                    >
                                      {message.content}
                                    </div>
                                  )}

                                  {/* Message actions */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`absolute opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 ${
                                          message.isMyMessage
                                            ? '-left-8 text-white hover:bg-green-700 hover:text-white'
                                            : '-right-8 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                                        } top-1 bg-black/20 backdrop-blur-sm rounded-full shadow-lg border border-white/30`}
                                      >
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align={message.isMyMessage ? 'end' : 'start'}
                                    >
                                      <DropdownMenuItem onClick={() => handleReply(message)}>
                                        <Reply className="h-4 w-4 mr-2" />
                                        Trả lời
                                      </DropdownMenuItem>

                                      {/* Edit option - only for own messages */}
                                      {message.isMyMessage && (
                                        <DropdownMenuItem onClick={() => handleEdit(message)}>
                                          <Edit3 className="h-4 w-4 mr-2" />
                                          Chỉnh sửa
                                        </DropdownMenuItem>
                                      )}

                                      {/* Delete option - only for own messages */}
                                      {message.isMyMessage && (
                                        <DropdownMenuItem
                                          onClick={() => deleteMessage(message.id)}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Xóa
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                      </ScrollArea>

                      {/* Message input */}
                      <Separator />
                      <div className="p-4 bg-slate-50 border-t border-slate-200">
                        {/* Reply preview */}
                        {replyingTo && (
                          <div className="mb-3 p-3 bg-green-100 rounded-lg border-l-4 border-green-500 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-green-800">
                                  Trả lời {replyingTo.senderName}
                                </div>
                                <div className="text-sm text-green-700 truncate">
                                  {replyingTo.content}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelReply}
                                className="p-1 h-6 w-6 text-green-700 hover:bg-green-200"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Input
                            ref={chatInputRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Nhập tin nhắn..."
                            className="flex-1 rounded-full border-2 border-green-300 bg-green-50 focus:bg-white focus:border-green-500 transition-colors text-gray-800 placeholder:text-gray-500"
                            disabled={isSending || !isConnected}
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || isSending || !isConnected}
                            size="sm"
                            className="rounded-full bg-green-600 hover:bg-green-700 px-4 shadow-md border-2 border-green-700"
                          >
                            {isSending ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {!isConnected && (
                          <p className="text-xs text-orange-500 mt-2 text-center">
                            Đang kết nối lại...
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventManagerChatBox;

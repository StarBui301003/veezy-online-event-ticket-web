/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  connectChatHub,
  onChat,
  disconnectChatHub,
  joinChatRoom,
  leaveChatRoom,
} from '@/services/signalr.service';
import {
  chatService,
  type ChatMessage,
  type ChatRoom,
} from '@/services/chat.service';

interface UseEventManagerChatOptions {
  eventId: string;
  eventName?: string;
  autoConnect?: boolean;
  enableNotifications?: boolean;
}

interface UseEventManagerChatReturn {
  // States
  isConnected: boolean;
  isLoading: boolean;
  chatRoom: ChatRoom | null;
  messages: ChatMessage[];
  onlineParticipants: any[];
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (content: string, replyToId?: string) => Promise<boolean>;
  joinRoom: () => Promise<void>;
  leaveRoom: () => Promise<void>;
  
  // Utilities
  isMyMessage: (message: ChatMessage) => boolean;
  isEventManager: (message: ChatMessage) => boolean;
  getOnlineManagersCount: () => number;
}

export const useEventManagerChat = ({
  eventId,
  eventName,
  autoConnect = false,
  enableNotifications = true,
}: UseEventManagerChatOptions): UseEventManagerChatReturn => {
  // States
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineParticipants, setOnlineParticipants] = useState<any[]>([]);

  // Refs
  const chatRoomRef = useRef<ChatRoom | null>(null);
  const currentUserRef = useRef<any>(null);

  // Get current user
  const getCurrentUser = useCallback(() => {
    if (currentUserRef.current) return currentUserRef.current;
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      currentUserRef.current = {
        id: user.id || user.userId,
        displayName: user.displayName || user.fullName || user.username,
      };
      return currentUserRef.current;
    }
    return null;
  }, []);

  // Connect to chat
  const connect = useCallback(async () => {
    if (!eventId || isConnected) return;

    try {
      setIsLoading(true);
      
      // Get or create chat room
      const room = await chatService.createUserEventManagerRoom(eventId);
      setChatRoom(room);
      chatRoomRef.current = room;

      // Get room messages
      const messagesResponse = await chatService.getRoomMessages(room.roomId);
      const roomMessages = Array.isArray(messagesResponse) ? messagesResponse : (messagesResponse as any).items || [];
      setMessages(roomMessages);

      // Set participants
      setOnlineParticipants(room.participants || []);

      // Connect to SignalR
              await connectChatHub('https://chat.vezzy.site/chatHub');
      setIsConnected(true);

      // Join room
      await joinChatRoom(room.roomId);

      if (enableNotifications) {
        toast.success(`Đã kết nối với nhóm quản lý sự kiện ${eventName || 'này'}`);
      }
    } catch (error: any) {
      console.error('Error connecting to event manager chat:', error);
      if (enableNotifications) {
        toast.error('Không thể kết nối với nhóm quản lý sự kiện');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [eventId, eventName, isConnected, enableNotifications]);

  // Disconnect from chat
  const disconnect = useCallback(async () => {
    if (!isConnected) return;

    try {
      if (chatRoomRef.current) {
        await leaveChatRoom(chatRoomRef.current.roomId);
      }
      await disconnectChatHub();
      setIsConnected(false);
      setChatRoom(null);
      chatRoomRef.current = null;
      setMessages([]);
      setOnlineParticipants([]);
    } catch (error: any) {
      console.error('Error disconnecting from chat:', error);
    }
  }, [isConnected]);

  // Join room
  const joinRoom = useCallback(async () => {
    if (!chatRoomRef.current || !isConnected) return;
    await joinChatRoom(chatRoomRef.current.roomId);
  }, [isConnected]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (!chatRoomRef.current || !isConnected) return;
    await leaveChatRoom(chatRoomRef.current.roomId);
  }, [isConnected]);

  // Send message
  const sendMessage = useCallback(async (content: string, replyToId?: string): Promise<boolean> => {
    if (!content.trim() || !chatRoomRef.current || !isConnected) return false;

    try {
      await chatService.sendMessage({
        roomId: chatRoomRef.current.roomId,
        content: content.trim(),
        type: 0, // Text message
        replyToMessageId: replyToId,
      });
      return true;
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (enableNotifications) {
        toast.error('Không thể gửi tin nhắn');
      }
      return false;
    }
  }, [isConnected, enableNotifications]);

  // Utility functions
  const isMyMessage = useCallback((message: ChatMessage): boolean => {
    const currentUser = getCurrentUser();
    return message.senderId === currentUser?.id;
  }, [getCurrentUser]);

  const isEventManager = useCallback((message: ChatMessage): boolean => {
    return chatRoom?.participants.some(
      p => p.userId === message.senderId && p.role === 'EventManager'
    ) || false;
  }, [chatRoom?.participants]);

  const getOnlineManagersCount = useCallback((): number => {
    return onlineParticipants.filter(
      p => p.role === 'EventManager' && p.isOnline
    ).length;
  }, [onlineParticipants]);

  // Setup SignalR listeners
  useEffect(() => {
    if (!isConnected || !chatRoomRef.current) return;

    const currentRoom = chatRoomRef.current;

    // Listen for new messages
    const handleReceiveMessage = (messageDto: any) => {
      if (messageDto.RoomId === currentRoom.roomId || messageDto.roomId === currentRoom.roomId) {
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

        setMessages(prev => [...prev, message]);

        // Show notification for messages from others
        const currentUser = getCurrentUser();
        if (message.senderId !== currentUser?.id && enableNotifications) {
          toast.info(`${message.senderName}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`);
        }
      }
    };

    // Listen for user online status
    const handleUserConnected = (userInfo: any) => {
      setOnlineParticipants(prev => prev.map(p => 
        p.userId === userInfo.userId ? { ...p, isOnline: true } : p
      ));
    };

    const handleUserDisconnected = (userId: string) => {
      setOnlineParticipants(prev => prev.map(p => 
        p.userId === userId ? { ...p, isOnline: false } : p
      ));
    };

    // Register listeners
    onChat('ReceiveMessage', handleReceiveMessage);
    onChat('UserConnected', handleUserConnected);
    onChat('UserDisconnected', handleUserDisconnected);

    // Cleanup is handled by the SignalR service
    return () => {
      // SignalR service handles cleanup
    };
  }, [isConnected, enableNotifications, getCurrentUser]);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && eventId && !isConnected) {
      connect();
    }
  }, [autoConnect, eventId, isConnected, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [isConnected, disconnect]);

  return {
    // States
    isConnected,
    isLoading,
    chatRoom,
    messages,
    onlineParticipants,

    // Actions
    connect,
    disconnect,
    sendMessage,
    joinRoom,
    leaveRoom,

    // Utilities
    isMyMessage,
    isEventManager,
    getOnlineManagersCount,
  };
};

export default useEventManagerChat;

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
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
  Search,
  Users,
  MessageCircle,
  Clock,
  AlertCircle,
  Trash2,
  Reply,
  Edit3,
  X,
  MoreVertical,
} from 'lucide-react';
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
  type ChatUser,
  type ChatMessage,
  type ChatRoom,
} from '@/services/chat.service';
import { motion, AnimatePresence } from 'framer-motion';
import { isCurrentUserAdmin } from '@/utils/admin-utils';
import OnlineStatusIndicator from '@/components/common/OnlineStatusIndicator';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import identityService from '@/services/identity.service';
import { MdRefresh } from 'react-icons/md';
import { getRoleDisplayName } from '@/utils/roleMapper';

const ChatboxAdmin = () => {
  const { getProfileInputClass, getCardClass, getTextClass, theme } = useThemeClasses();

  // Custom scrollbar styles - theme-aware
  const getScrollbarStyles = (isDark: boolean) => `
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: ${isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)'};
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: ${isDark ? 'rgba(156, 163, 175, 0.7)' : 'rgba(107, 114, 128, 0.7)'};
    }
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: ${
        isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)'
      } transparent;
    }
  `;

  const scrollbarStyles = getScrollbarStyles(theme === 'dark');

  // State for room mode (ai/human) and permission to switch
  const [roomMode, setRoomMode] = useState<'ai' | 'human'>('ai');
  const [canSwitchMode, setCanSwitchMode] = useState(false);

  // Debug: Log roomMode changes and force re-render counter
  const [forceRender, setForceRender] = useState(0);

  // States
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [allUsersFromIdentity, setAllUsersFromIdentity] = useState<
    Array<{
      userId: string;
      userName: string;
      fullName: string;
      email: string;
      role: string;
      avatar: string;
      isOnline: boolean;
      lastActiveAt: string;
    }>
  >([]);

  const onlineUsers = allUsersFromIdentity;
  const [isConnected, setIsConnected] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshingUsers, setRefreshingUsers] = useState(false);

  // Reply and Edit states
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Debug useEffect for roomMode and activeRoom changes
  useEffect(() => {
    console.log('🔧 [RoomModeDebug] roomMode state changed to:', roomMode);
    console.log('🔧 [RoomModeDebug] activeRoom mode:', activeRoom?.mode);
    console.log('🔧 [RoomModeDebug] Component should re-render now...');
    // Force re-render when roomMode changes
    setForceRender((prev) => {
      console.log('🔧 [RoomModeDebug] Force render counter:', prev, '->', prev + 1);
      return prev + 1;
    });
  }, [roomMode, activeRoom?.mode]); // Track both roomMode and activeRoom.mode

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const activeRoomRef = useRef<ChatRoom | null>(null);

  // Current admin user (từ localStorage account)
  const getCurrentUser = () => {
    const accountStr = localStorage.getItem('account');
    if (accountStr) {
      const account = JSON.parse(accountStr);
      return {
        userId: account.userId || 'admin-id',
        username: account.username || 'admin',
        fullName: account.fullName || 'Administrator',
        role: 'Admin' as const,
      };
    }

    return {
      userId: 'admin-id',
      username: 'admin',
      fullName: 'Administrator',
      role: 'Admin' as const,
    };
  };

  const currentUser = getCurrentUser();

  // Load all users from IdentityService
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await identityService.getAllUsersWithStatus();
        const transformedUsers = users.map((user) => ({
          userId: user.accountId,
          userName: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          avatar: user.avatarUrl || '',
          isOnline: user.isOnline,
          lastActiveAt: user.lastActiveAt,
        }));
        setAllUsersFromIdentity(transformedUsers);
      } catch (error) {
        console.error('[ChatboxAdmin] Error loading users:', error);
      }
    };

    setTimeout(loadUsers, 500);
  }, []);

  // Listen for mode changes from SignalR
  useEffect(() => {
    const handleModeChanged = (payload: any) => {
      console.log('🔄 [OnModeChanged] Received payload:', payload);
      console.log('🔄 [OnModeChanged] Current activeRoom:', activeRoom?.roomId);

      // CRITICAL DEBUG - Always log when this event is received
      console.log('🔥 [DEBUG] ADMIN OnModeChanged event received in admin chatbox!', payload);

      if (payload && payload.roomId && payload.mode) {
        const normalizedMode = payload.mode.toLowerCase();
        console.log('🔄 [OnModeChanged] Normalized mode:', normalizedMode);

        // Update mode for active room if it matches - THIS IS THE KEY FIX!
        if (activeRoom?.roomId === payload.roomId) {
          console.log('🔄 [OnModeChanged] Updating active room mode to:', normalizedMode);

          // Update roomMode state
          setRoomMode((prevMode) => {
            console.log(
              '🔄 [OnModeChanged] State setter called: prevMode =',
              prevMode,
              ', newMode =',
              normalizedMode
            );
            return normalizedMode;
          });

          // CRITICAL: Update activeRoom object to trigger component re-renders
          setActiveRoom((prevRoom) => {
            if (prevRoom && prevRoom.roomId === payload.roomId) {
              console.log('🔄 [OnModeChanged] Creating new activeRoom object with updated mode');
              const updatedRoom = { ...prevRoom, mode: normalizedMode };
              // Update the ref as well to keep it in sync
              activeRoomRef.current = updatedRoom;
              return updatedRoom;
            }
            return prevRoom;
          });

          // Force re-render by updating forceRender counter
          setForceRender((prev) => {
            console.log('🔄 [OnModeChanged] Force render counter updated:', prev, '->', prev + 1);
            return prev + 1;
          });
        }

        // Update mode for the room in chatRooms list
        setChatRooms((prevRooms) =>
          prevRooms.map((room) => {
            if (room.roomId === payload.roomId) {
              console.log(
                '🔄 [OnModeChanged] Updating room in list:',
                room.roomId,
                'from',
                room.mode,
                'to',
                normalizedMode
              );
              return { ...room, mode: normalizedMode };
            }
            return room;
          })
        );

        // Show toast notification
        toast.success(
          `Room mode changed to ${payload.mode === 'human' ? 'Human Support' : 'AI Support'} by ${
            payload.changedBy || 'Admin'
          }`
        );
      } else {
        console.warn('🔄 [OnModeChanged] Invalid payload received:', payload);
      }
    };

    console.log('🔧 [DEBUG] Setting up OnModeChanged listeners in useEffect...');
    // Register both cases for compatibility
    onChat('OnModeChanged', handleModeChanged);

    return () => {
      console.log('🔧 [DEBUG] Cleaning up OnModeChanged listener...');
      // Import offChat dynamically to avoid circular imports
      import('@/services/signalr.service')
        .then(({ offChat }) => {
          offChat('OnModeChanged', handleModeChanged);
        })
        .catch(() => {
          // Ignore if import fails
        });
    };
  }, [activeRoom?.roomId]);

  // Sync initial mode from activeRoom
  useEffect(() => {
    console.log('[ModeDebug] activeRoom changed:', activeRoom);
    if (activeRoom && activeRoom.mode) {
      console.log('[ModeDebug] Setting roomMode from activeRoom.mode:', activeRoom.mode);
      setRoomMode(activeRoom.mode);
      // Force re-render when activeRoom changes
      setForceRender((prev) => {
        console.log('[ModeDebug] activeRoom change force render:', prev, '->', prev + 1);
        return prev + 1;
      });
    }
    // Admin can always switch mode
    setCanSwitchMode(!!activeRoom);
  }, [activeRoom, activeRoom?.mode]); // Add activeRoom.mode to dependencies

  // Scroll to bottom of messages
  const scrollToBottom = (force: boolean = false) => {
    if (messagesEndRef.current) {
      // Use setTimeout to ensure DOM has fully updated
      setTimeout(() => {
        if (messagesEndRef.current) {
          const scrollContainer = messagesEndRef.current.parentElement?.parentElement;
          if (scrollContainer) {
            if (force) {
              // Force scroll to bottom regardless of current position
              messagesEndRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest',
              });
            } else {
              const isAtBottom =
                scrollContainer.scrollTop + scrollContainer.clientHeight >=
                scrollContainer.scrollHeight - 10;
              // Only auto-scroll if user is already near the bottom
              if (isAtBottom) {
                messagesEndRef.current.scrollIntoView({
                  behavior: 'smooth',
                  block: 'end',
                  inline: 'nearest',
                });
              }
            }
          }
        }
      }, 100);
    }
  };

  // Connect to SignalR Chat Hub
  useEffect(() => {
    const connectToChat = async () => {
      try {
        console.log('🔗 Attempting to connect to ChatHub...');
        const token = localStorage.getItem('access_token');
        console.log('🔑 Admin connecting with token:', token ? 'Present' : 'Missing');
        await connectChatHub('https://chat.vezzy.site/chatHub', token || undefined);
        setIsConnected(true);
        console.log('✅ Connected to ChatHub successfully');

        // Join admin group for receiving support requests
        onChat('JoinGroup', async (groupName: string) => {
          console.log(`📢 Joined group: ${groupName}`);
        });

        // Listen for new messages
        onChat('ReceiveMessage', (messageDto: any) => {
          console.log('📩 Received SignalR message:', messageDto);
          console.log('📩 Message DTO structure:', {
            id: messageDto.Id,
            roomId: messageDto.RoomId,
            senderUserId: messageDto.SenderUserId,
            senderUserName: messageDto.SenderUserName,
            content: messageDto.Content,
            createdAt: messageDto.CreatedAt,
          });

          // Transform backend DTO to frontend interface
          const senderId = messageDto.SenderUserId || messageDto.senderUserId;
          const senderName =
            senderId === 'system-ai-bot'
              ? 'AI Assistant'
              : messageDto.SenderUserName || messageDto.senderUserName || 'Unknown';

          const message: ChatMessage = {
            messageId: messageDto.Id || messageDto.id,
            senderId: senderId,
            senderName: senderName,
            content: messageDto.Content || messageDto.content,
            timestamp: messageDto.CreatedAt || messageDto.createdAt,
            createdAt: messageDto.CreatedAt || messageDto.createdAt,
            isRead: false,
            messageType: 'Text' as const,
            roomId: messageDto.RoomId || messageDto.roomId,
            isDeleted: messageDto.IsDeleted || messageDto.isDeleted || false,
            isEdited: messageDto.IsEdited || messageDto.isEdited || false,
            replyToMessageId: messageDto.ReplyToMessageId || messageDto.replyToMessageId,
            replyToMessage: messageDto.ReplyToMessage || messageDto.replyToMessage,
          };

          console.log('🔄 Transformed message:', message);

          // Add message to current room if it belongs to the active room
          setMessages((prev) => {
            // Use ref to get current active room to avoid stale closure
            const currentRoomId = activeRoomRef.current?.roomId;
            console.log(`🎯 Current room ID: ${currentRoomId}, Message room ID: ${message.roomId}`);
            if (currentRoomId && message.roomId === currentRoomId) {
              console.log('✅ Adding message to current room');
              return [...prev, message];
            }
            console.log('❌ Message not for current room, ignoring');
            return prev;
          });

          // Update last message in room list and unread count
          console.log('🔄 About to update chat rooms list with message:', {
            messageRoomId: message.roomId,
            messageContent: message.content,
            messageSenderId: message.senderId,
            currentUserId: currentUser.userId,
            activeRoomId: activeRoomRef.current?.roomId,
          });

          setChatRooms((prev) => {
            console.log(
              '🏠 Current chat rooms before update:',
              prev.map((r) => ({ id: r.roomId, lastMsg: r.lastMessage?.content }))
            );

            const updatedRooms = prev
              .map((room) =>
                room.roomId === message.roomId
                  ? {
                      ...room,
                      lastMessage: message,
                      lastMessageAt: message.createdAt, // Cập nhật lastMessageAt với thời gian tin nhắn mới
                      // Only increase unread count if it's not the active room and not from current user
                      unreadCount:
                        message.senderId !== currentUser.userId &&
                        room.roomId !== activeRoomRef.current?.roomId
                          ? room.unreadCount + 1
                          : room.unreadCount,
                    }
                  : room
              )
              // Sắp xếp lại theo thứ tự hoạt động gần nhất sau khi cập nhật
              .sort((a, b) => {
                const aTime = a.lastMessageAt || a.lastMessage?.createdAt || a.createdAt;
                const bTime = b.lastMessageAt || b.lastMessage?.createdAt || b.createdAt;
                return new Date(bTime).getTime() - new Date(aTime).getTime();
              });

            console.log(
              '🏠 Chat rooms after update and sort:',
              updatedRooms.map((r) => ({
                id: r.roomId,
                lastMsg: r.lastMessage?.content,
                lastMsgAt: r.lastMessageAt,
              }))
            );
            return updatedRooms;
          });

          // Show notification if message is not from current user
          if (message.senderId !== currentUser.userId) {
            toast.info(`New message from ${message.senderName}`);
          }
        });

        // Listen for message deleted
        onChat('MessageDeleted', (data: { messageId: string; deletedBy: string }) => {
          console.log('🗑️ Message deleted:', data);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.messageId === data.messageId
                ? { ...msg, isDeleted: true, content: '[Message deleted]' }
                : msg
            )
          );
        });

        // Listen for message updated
        onChat('MessageUpdated', (updatedMessageDto: any) => {
          console.log('✏️ Message updated:', updatedMessageDto);
          const senderId = updatedMessageDto.SenderUserId || updatedMessageDto.senderUserId;
          const senderName =
            senderId === 'system-ai-bot'
              ? 'AI Assistant'
              : updatedMessageDto.SenderUserName || updatedMessageDto.senderUserName || 'Unknown';

          const updatedMessage: ChatMessage = {
            messageId: updatedMessageDto.Id || updatedMessageDto.id,
            senderId: senderId,
            senderName: senderName,
            content: updatedMessageDto.Content || updatedMessageDto.content,
            timestamp: updatedMessageDto.CreatedAt || updatedMessageDto.createdAt,
            createdAt: updatedMessageDto.CreatedAt || updatedMessageDto.createdAt,
            isRead: false,
            messageType: 'Text' as const,
            roomId: updatedMessageDto.RoomId || updatedMessageDto.roomId,
            isDeleted: updatedMessageDto.IsDeleted || updatedMessageDto.isDeleted || false,
            isEdited: updatedMessageDto.IsEdited || updatedMessageDto.isEdited || true,
            replyToMessageId:
              updatedMessageDto.ReplyToMessageId || updatedMessageDto.replyToMessageId,
            replyToMessage: updatedMessageDto.ReplyToMessage || updatedMessageDto.replyToMessage,
          };

          setMessages((prev) =>
            prev.map((msg) => (msg.messageId === updatedMessage.messageId ? updatedMessage : msg))
          );
        });

        // Listen for user online status - OnlineStatusContext handles this automatically
        onChat('UserConnected', (user: ChatUser) => {
          console.log('👤 User connected via SignalR:', user);
          // OnlineStatusContext will handle this via Identity Hub events
        });

        onChat('UserDisconnected', (userId: string) => {
          console.log('👤 User disconnected via SignalR:', userId);
          // OnlineStatusContext will handle this via Identity Hub events
        });

        // Handle user joined room event
        onChat('UserJoinedRoom', (data: { userId: string; roomId: string; userName?: string }) => {
          console.log('👤 User joined room via SignalR:', data);
          // This is just for logging - no UI changes needed for admin view
        });

        // Handle user left room event
        onChat('UserLeftRoom', (data: { userId: string; roomId: string; userName?: string }) => {
          console.log('👤 User left room via SignalR:', data);
          // This is just for logging - no UI changes needed for admin view
        });

        // Listen for new chat room created (support requests)
        onChat('OnChatRoomCreated', (room: any) => {
          console.log('🏠 New chat room created via SignalR:', room);
          console.log('🏠 Room structure debug:', {
            roomId: room?.roomId,
            roomName: room?.roomName,
            participants: room?.participants,
            mode: room?.mode,
            allKeys: Object.keys(room || {}),
          });
          console.log('🏠 Admin is connected to ChatHub:', isConnected);

          // Transform backend room data to frontend format
          const transformedRoom: ChatRoom = {
            roomId: room.id, // Fix: backend sends 'id', not 'roomId'
            roomName: room.name || 'Unnamed Room',
            participants: (room.participants || []).map((p: any) => ({
              userId: p.userId,
              username: p.userName || p.username,
              fullName: p.userName || p.fullName || p.username || 'Unknown User',
              avatar: p.avatarUrl || p.avatar,
              isOnline: p.isOnline || false,
              role: (p.role as 'Customer' | 'EventManager' | 'Admin') || 'Customer',
            })),
            lastMessage: room.lastMessage,
            lastMessageAt: room.lastMessageAt,
            unreadCount: room.unreadCount || 0,
            roomType: room.type || 'Support',
            createdAt: room.createdAt,
            createdByUserId: room.createdByUserId,
            createdByUserName: room.createdByUserName,
            mode: room.mode === 1 ? 'human' : 'ai', // Transform numeric mode to string mode
          };

          setChatRooms((prev) => {
            // Check if room already exists to avoid duplicates
            const existingRoom = prev.find((r) => r.roomId === transformedRoom.roomId);
            if (existingRoom) {
              console.log('🏠 Room already exists, skipping add:', transformedRoom.roomId);
              return prev;
            }

            // Add new room and sort by latest activity
            const updatedRooms = [transformedRoom, ...prev].sort((a, b) => {
              const aTime = a.lastMessageAt || a.lastMessage?.createdAt || a.createdAt;
              const bTime = b.lastMessageAt || b.lastMessage?.createdAt || b.createdAt;
              return new Date(bTime).getTime() - new Date(aTime).getTime();
            });
            console.log(
              '🏠 Added new room to chat rooms list. Room ID:',
              transformedRoom.roomId,
              'Room Name:',
              transformedRoom.roomName
            );
            return updatedRooms;
          });
          toast.info(
            `New support request from ${transformedRoom.participants?.[0]?.fullName || 'User'}`
          );
        });

        // Add error handler for SignalR errors
        onChat('Error', (errorMessage: string) => {
          console.error('❌ SignalR Error:', errorMessage);
          toast.error(`Chat Error: ${errorMessage}`);
        });

        console.log('✅ Admin ChatHub event listeners setup complete');
      } catch (error) {
        console.error('Failed to connect to ChatHub:', error);
        setIsConnected(false);
        toast.error('Failed to connect to chat service');
      }
    };

    connectToChat();
    fetchChatRooms();
    // OnlineStatusContext handles online users automatically

    return () => {
      // Leave all rooms before disconnecting
      chatRooms.forEach(async (room) => {
        try {
          await leaveChatRoom(room.roomId);
          console.log(`Left SignalR room: ${room.roomId}`);
        } catch (error) {
          console.error(`Failed to leave SignalR room ${room.roomId}:`, error);
        }
      });
      disconnectChatHub();
    };
  }, []);

  // OnlineStatusContext handles refresh automatically
  // Removed periodic refresh as OnlineStatusContext manages online users via SignalR

  // OnlineStatusContext handles cleanup automatically
  // Removed cleanup effect as OnlineStatusContext manages online users

  // Auto scroll when new messages arrive
  useEffect(() => {
    // Always scroll to bottom when messages change
    if (messages.length > 0 && messagesEndRef.current) {
      // Use longer timeout to ensure all DOM updates are complete
      setTimeout(() => {
        scrollToBottom(true);
      }, 150);
    }
  }, [messages]); // Depend on entire messages array to catch all changes

  // Auto scroll when active room changes
  useEffect(() => {
    if (activeRoom && messages.length > 0) {
      // Scroll to bottom when switching rooms
      setTimeout(() => {
        scrollToBottom(true);
      }, 300);
    }
  }, [activeRoom?.roomId]);

  // Initial scroll to bottom when component mounts or messages first load
  useEffect(() => {
    if (messages.length > 0) {
      // Initial scroll with longer delay to ensure everything is rendered
      setTimeout(() => {
        scrollToBottom(true);
      }, 500);
    }
  }, [messages.length > 0]); // Only trigger when messages go from 0 to having content

  // Fetch chat rooms (support requests, etc.)
  const fetchChatRooms = async () => {
    try {
      setLoading(true);

      // Check if user is admin before fetching
      if (!isCurrentUserAdmin()) {
        console.warn('User is not admin, redirecting...');
        toast.error('Bạn không có quyền truy cập trang này');
        setChatRooms([]);
        return;
      }

      console.log('[ChatboxAdmin] Fetching admin chat rooms...');
      const rooms = await chatService.getAdminChatRooms();
      console.log('[ChatboxAdmin] Successfully fetched', rooms.length, 'chat rooms');
      console.log('[ChatboxAdmin] Raw rooms data:', rooms);

      // Validate and sanitize room data, and ensure mode is always normalized
      const validatedRooms = rooms
        .filter((room) => {
          const isValid = room && (room.roomId || (room as any).RoomId || (room as any).id);
          if (!isValid) {
            console.warn('[ChatboxAdmin] Filtering out invalid room:', room);
          }
          return isValid;
        })
        .map((room) => {
          // Support both string and numeric mode from backend
          let normalizedMode: 'ai' | 'human' = 'ai';
          if (typeof room.mode === 'string') {
            normalizedMode = room.mode.toLowerCase() === 'human' ? 'human' : 'ai';
          } else if (typeof room.mode === 'number') {
            normalizedMode = room.mode === 1 ? 'human' : 'ai';
          }

          // Get roomId from multiple sources
          const actualRoomId = room.roomId || (room as any).RoomId || (room as any).id;

          console.log('[ChatboxAdmin] Processing room:', room);
          console.log(
            '[ChatboxAdmin] Room fields - roomId:',
            room.roomId,
            'roomName:',
            room.roomName,
            'createdByUserName:',
            room.createdByUserName
          );

          return {
            ...room,
            roomId: actualRoomId,
            roomName:
              room.roomName || (room as any).RoomName || (room as any).name || 'Unnamed Room',
            createdByUserName: room.createdByUserName || 'Unknown User',
            participants: (room.participants || []).map((p: any) => {
              console.log('[ChatboxAdmin] Processing participant in processRoom:', p);
              console.log(
                '[ChatboxAdmin] Participant fields - userId:',
                p?.userId,
                'userName:',
                p?.userName,
                'fullName:',
                p?.fullName,
                'username:',
                p?.username,
                'isOnline:',
                p?.isOnline,
                'lastActiveAt:',
                p?.lastActiveAt
              );
              return {
                ...p,
                fullName: p?.fullName || p?.userName || p?.username || 'Unknown User',
              };
            }),
            lastMessage: room.lastMessage || null,
            unreadCount: room.unreadCount || 0,
            mode: normalizedMode,
          };
        })
        // Sắp xếp theo thứ tự hoạt động gần nhất
        .sort((a, b) => {
          const aTime = a.lastMessageAt || a.lastMessage?.createdAt || a.createdAt;
          const bTime = b.lastMessageAt || b.lastMessage?.createdAt || b.createdAt;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

      console.log('[ChatboxAdmin] Processed', validatedRooms.length, 'valid rooms');
      setChatRooms(validatedRooms);

      // Join all chat rooms via SignalR to receive real-time messages
      console.log('[ChatboxAdmin] Joining', validatedRooms.length, 'SignalR rooms...');
      for (const room of validatedRooms) {
        try {
          await joinChatRoom(room.roomId);
          console.log(`✅ Joined SignalR room: ${room.roomId}`);
        } catch (error) {
          console.error(`❌ Failed to join SignalR room ${room.roomId}:`, error);
        }
      }

      // ✅ Users từ IdentityService được load tự động trong OnlineStatusContext
      // Không cần add chat participants vào context nữa
    } catch (error: any) {
      console.error('Error fetching chat rooms:', error);

      // Handle different error types
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error('Bạn không có quyền truy cập');
      } else if (error.response?.status === 404) {
        toast.warn('Không tìm thấy phòng chat nào');
      } else {
        toast.error('Không thể tải danh sách phòng chat');
      }

      setChatRooms([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch online users
  // OnlineStatusContext handles online users automatically
  // Removed fetchOnlineUsers as OnlineStatusContext manages this

  // Fetch messages for a room
  const fetchMessages = async (roomId: string) => {
    try {
      setLoadingMessages(true);
      const messages = await chatService.getRoomMessages(roomId);
      // Debug: Log messages để kiểm tra cấu trúc
      console.log('Fetched messages:', messages);
      if (messages.length > 0) {
        console.log('First message structure:', JSON.stringify(messages[0], null, 2));
      }

      // Transform messages to display AI Assistant properly
      const transformedMessages = Array.isArray(messages)
        ? messages.map((msg) => ({
            ...msg,
            senderName: msg.senderId === 'system-ai-bot' ? 'AI Assistant' : msg.senderName,
          }))
        : [];

      setMessages(transformedMessages);

      // Force scroll to bottom when loading messages for a room
      setTimeout(() => {
        scrollToBottom(true);
      }, 200);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      setMessages([]); // Set empty array on error
    } finally {
      setLoadingMessages(false);
    }
  };

  // Select a chat room
  const selectRoom = async (room: ChatRoom) => {
    try {
      // Validate room and roomId
      if (!room || !room.roomId || room.roomId === 'undefined') {
        console.error('Invalid room or roomId:', room);
        toast.error('Invalid room selected');
        return;
      }

      // Set loading state for messages
      setLoadingMessages(true);

      // Always normalize mode when selecting room
      let normalizedMode: 'ai' | 'human' = 'ai';
      if (typeof room.mode === 'string') {
        normalizedMode = room.mode.toLowerCase() === 'human' ? 'human' : 'ai';
      } else if (typeof room.mode === 'number') {
        normalizedMode = room.mode === 1 ? 'human' : 'ai';
      }
      const normalizedRoom = { ...room, mode: normalizedMode };
      setActiveRoom(normalizedRoom);
      activeRoomRef.current = normalizedRoom; // Update ref for SignalR handlers

      // Note: We don't need to join/leave rooms since admin joins all rooms on load
      console.log(`Selected room: ${room.roomId} (already joined via SignalR)`);

      await fetchMessages(room.roomId);

      // Mark messages as read
      try {
        await chatService.markMessagesAsRead(room.roomId);
        setChatRooms((prev) =>
          prev.map((r) => (r.roomId === room.roomId ? { ...r, unreadCount: 0 } : r))
        );
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error selecting room:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom) return;

    const messageData = {
      roomId: activeRoom.roomId,
      content: newMessage,
      messageType: 'Text' as const,
      replyToMessageId: replyingTo?.messageId, // Add reply support
    };

    const messageContent = newMessage;
    setNewMessage('');
    setReplyingTo(null); // Clear reply after sending
    chatInputRef.current?.focus();

    try {
      const sentMessage = await chatService.sendMessage(messageData);
      // Message will be received via SignalR and added to UI automatically
      console.log('Message sent successfully:', sentMessage);

      // Force scroll to bottom for user's own message
      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Restore message content on error
      setNewMessage(messageContent);
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);

      // Update local state to mark message as deleted
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === messageId
            ? { ...msg, isDeleted: true, content: '[Message deleted]' }
            : msg
        )
      );

      toast.success('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Handle reply to message
  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyingTo(message);
    chatInputRef.current?.focus();
  };

  // Handle edit message
  const handleEditMessage = (message: ChatMessage) => {
    setEditingMessage(message);
    setEditingContent(message.content);
  };

  // Save edited message
  const saveEditedMessage = async () => {
    if (!editingMessage || !editingContent.trim()) return;

    try {
      const updatedMessage = await chatService.updateMessage(
        editingMessage.messageId,
        editingContent
      );

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === editingMessage.messageId
            ? { ...msg, content: updatedMessage.content, isEdited: true }
            : msg
        )
      );

      setEditingMessage(null);
      setEditingContent('');
      toast.success('Message updated successfully');
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingMessage(null);
    setEditingContent('');
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Filter chat rooms
  const filteredRooms = chatRooms
    .filter(
      (room) =>
        room.createdByUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.roomName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.participants?.some((p) =>
          p.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    )
    // Đảm bảo filteredRooms cũng được sắp xếp theo thứ tự hoạt động gần nhất
    .sort((a, b) => {
      const aTime = a.lastMessageAt || a.lastMessage?.createdAt || a.createdAt;
      const bTime = b.lastMessageAt || b.lastMessage?.createdAt || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  // Format timestamp
  const formatTime = (timestamp: string | undefined | null) => {
    // Kiểm tra timestamp có hợp lệ không
    if (!timestamp) {
      return 'Now';
    }

    const date = new Date(timestamp);

    // Kiểm tra xem date có hợp lệ không
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Refresh all users from IdentityService
  const refreshAllUsers = async () => {
    // Prevent multiple calls while already refreshing
    if (refreshingUsers) return;
    setRefreshingUsers(true);
    try {
      const users = await identityService.getAllUsersWithStatus();
      const transformedUsers = users.map((user) => ({
        userId: user.accountId,
        userName: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatarUrl || '',
        isOnline: user.isOnline,
        lastActiveAt: user.lastActiveAt,
      }));
      setAllUsersFromIdentity(transformedUsers);
      toast.success(`Refreshed ${transformedUsers.length} users`);
    } catch (error) {
      console.error('[ChatboxAdmin] Error refreshing users:', error);
      toast.error('Failed to refresh users');
    } finally {
      setRefreshingUsers(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] w-full flex gap-5 justify-center mt-8">
      <style>{scrollbarStyles}</style>
      <SpinnerOverlay show={loading} />
      {/* Left Sidebar - Chat Rooms */}
      <Card className={`w-80 flex flex-col rounded-2xl shadow-2xl border ${getCardClass()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={`flex items-center gap-2 ${getTextClass()}`}>
              <MessageCircle className="h-5 w-5" />
              Admin Chat
            </CardTitle>
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Search */}
          <div
            className="InputContainer relative"
            style={{
              width: 280,
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(to bottom, #c7eafd, #e0e7ff)',
              borderRadius: 30,
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: '2px 2px 10px rgba(0,0,0,0.075)',
              position: 'relative',
              marginTop: 16,
            }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className={`w-[260px] h-10 rounded-[30px] pl-8 pr-4 text-sm transition-colors ${getProfileInputClass()}`}
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-red-500 hover:text-red-600 focus:outline-none bg-white rounded-full"
                style={{
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  height: 24,
                  width: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => setSearchQuery('')}
                tabIndex={-1}
                type="button"
                aria-label="Clear search"
              >
                &#10005;
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1 max-h-[calc(100vh-16rem)] custom-scrollbar">
            {filteredRooms.length === 0 && !loading ? (
              <div className={`p-4 text-center ${getTextClass()}`}>No chat rooms found</div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredRooms.map((room, index) => (
                  <motion.div
                    key={room.roomId || `room-${index}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        activeRoom?.roomId === room.roomId
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => selectRoom(room)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10 border border-blue-200">
                            <AvatarImage src={room.participants[0]?.avatar} />
                            <AvatarFallback>
                              {(
                                room.createdByUserName ||
                                room.participants[0]?.fullName ||
                                'U'
                              )?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1">
                            <OnlineStatusIndicator
                              userId={room.participants[0]?.userId}
                              size="sm"
                              showText={false}
                            />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between min-w-0">
                            <div className="overflow-x-auto max-w-[200px]">
                              <p className={`font-medium truncate ${getTextClass()}`}>
                                {room.createdByUserName ||
                                  room.participants[0]?.fullName ||
                                  'Unknown User'}
                              </p>
                            </div>
                            {room.unreadCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="text-xs border border-blue-200 bg-white rounded-full ml-2"
                              >
                                {room.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge
                              variant="outline"
                              className="text-xs border border-blue-200 bg-white rounded-full dark:text-black"
                            >
                              {room.participants[0]?.role || 'User'}
                            </Badge>
                            {room.roomType === 'Support' && (
                              <Badge
                                variant="secondary"
                                className="text-xs text-gray-700 dark:text-white"
                              >
                                <AlertCircle className="h-3 w-3 mr-1 text-gray-700 dark:text-white" />
                                Support
                              </Badge>
                            )}
                          </div>
                          {room.lastMessage && (
                            <div className="overflow-x-auto max-w-[200px]">
                              <p
                                className={`text-sm truncate mt-1 ${getTextClass()}`}
                                title={room.lastMessage.content}
                              >
                                {room.lastMessage.content}
                              </p>
                            </div>
                          )}
                          <p className={`text-xs mt-1 truncate min-w-0 ${getTextClass()}`}>
                            {formatTime(room.lastMessage?.timestamp || room.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <Card className={`mb-4 rounded-2xl shadow-xl border ${getCardClass()}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activeRoom.participants[0]?.avatar} />
                      <AvatarFallback>
                        {(
                          activeRoom.createdByUserName ||
                          activeRoom.participants[0]?.fullName ||
                          'U'
                        )?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h3 className={`font-semibold ${getTextClass()}`}>
                        {activeRoom.createdByUserName ||
                          activeRoom.participants[0]?.fullName ||
                          'Unknown User'}
                      </h3>
                      <div className={`flex items-center gap-2 text-sm ${getTextClass()}`}>
                        <OnlineStatusIndicator
                          userId={activeRoom.participants[0]?.userId}
                          size="sm"
                          showText={true}
                        />
                        {activeRoom.participants[0]?.lastSeen &&
                          !activeRoom.participants[0]?.isOnline && (
                            <span>
                              • Last seen {formatTime(activeRoom.participants[0].lastSeen)}
                            </span>
                          )}
                        {/* Hiển thị trạng thái AI/human */}
                        <span
                          key={`mode-indicator-${activeRoom.roomId}-${activeRoom.mode}-${forceRender}`}
                          className={`text-xs px-2 py-1 rounded-full ${
                            activeRoom.mode === 'ai'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                          style={{
                            backgroundColor:
                              activeRoom.mode === 'ai'
                                ? '#dcfce7 !important'
                                : '#fef3c7 !important',
                            color:
                              activeRoom.mode === 'ai'
                                ? '#15803d !important'
                                : '#a16207 !important',
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderRadius: '99px',
                            border:
                              activeRoom.mode === 'ai' ? '2px solid #22c55e' : '2px solid #f59e0b',
                          }}
                        >
                          {activeRoom.mode === 'ai' ? `AI Support` : `Human Support`}
                          <span style={{ fontSize: 10, marginLeft: 4, color: '#888' }}>
                            ({activeRoom.mode})
                          </span>
                        </span>
                        {/* Mode switch button for admin */}
                        {canSwitchMode && (
                          <Button
                            key={`mode-button-${activeRoom.roomId}-${activeRoom.mode}-${forceRender}`}
                            size="sm"
                            variant="outline"
                            className="ml-2 text-xs rounded-full"
                            style={{
                              backgroundColor:
                                activeRoom.mode === 'ai'
                                  ? '#fef3c7 !important'
                                  : '#dcfce7 !important',
                              color:
                                activeRoom.mode === 'ai'
                                  ? '#a16207 !important'
                                  : '#15803d !important',
                              borderColor:
                                activeRoom.mode === 'ai'
                                  ? '#fbbf24 !important'
                                  : '#22c55e !important',
                              border:
                                activeRoom.mode === 'ai'
                                  ? '2px solid #f59e0b'
                                  : '2px solid #22c55e',
                            }}
                            onClick={async () => {
                              if (!activeRoom?.roomId) {
                                toast.error('No active room ID');
                                return;
                              }
                              const nextMode = activeRoom.mode === 'ai' ? 'Human' : 'AI';
                              try {
                                // Sử dụng chatService để chuyển mode
                                const data = await chatService.switchRoomMode(
                                  activeRoom.roomId,
                                  nextMode
                                );
                                if (data && data.mode !== undefined && data.mode !== null) {
                                  // Xử lý mode từ backend - có thể là string hoặc number
                                  let normalizedMode: 'ai' | 'human' = 'ai';
                                  if (typeof data.mode === 'string') {
                                    normalizedMode =
                                      data.mode.toLowerCase() === 'human' ? 'human' : 'ai';
                                  } else if (typeof data.mode === 'number') {
                                    normalizedMode = data.mode === 1 ? 'human' : 'ai';
                                  }
                                  setRoomMode(normalizedMode);
                                  setActiveRoom((prev) =>
                                    prev ? { ...prev, mode: normalizedMode } : prev
                                  );
                                  activeRoomRef.current = activeRoom
                                    ? { ...activeRoom, mode: normalizedMode }
                                    : null;
                                } else {
                                  const newMode =
                                    nextMode.toLowerCase() === 'human' ? 'human' : 'ai';
                                  setRoomMode(newMode);
                                  setActiveRoom((prev) =>
                                    prev ? { ...prev, mode: newMode } : prev
                                  );
                                  activeRoomRef.current = activeRoom
                                    ? { ...activeRoom, mode: newMode }
                                    : null;
                                }
                                // Toast sẽ được hiển thị từ SignalR event handler, không cần gửi ở đây
                              } catch (err: any) {
                                console.error('[ModeSwitch] Error switching mode:', err);
                                toast.error(
                                  err && err.message
                                    ? err.message
                                    : nextMode === 'Human'
                                    ? 'Failed to switch to human support'
                                    : 'Failed to switch to AI support'
                                );
                              }
                            }}
                          >
                            🔄{' '}
                            {activeRoom.mode === 'ai'
                              ? 'Switch to  Human Support'
                              : 'Switch to  AI Support'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-full border border-blue-200 bg-white dark:text-black"
                    >
                      {activeRoom.participants[0]?.role || 'User'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messages Area */}
            <Card className={`flex-1 flex flex-col rounded-2xl shadow-xl border ${getCardClass()}`}>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-20rem)] p-4 custom-scrollbar">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className={`text-sm ${getTextClass()}`}>Loading messages...</p>
                      </div>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {(Array.isArray(messages) ? messages : []).map((message, index) => {
                        const isOwnMessage = message.senderId === currentUser.userId;
                        const showAvatar =
                          index === 0 || messages[index - 1]?.senderId !== message.senderId;
                        const uniqueKey = message.messageId
                          ? `${message.messageId}-${index}`
                          : `msg-${index}-${Date.now()}`;

                        return (
                          <motion.div
                            key={uniqueKey}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`flex gap-3 mb-4 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                          >
                            {showAvatar && !isOwnMessage && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {message.senderId === 'system-ai-bot'
                                    ? '🤖'
                                    : message.senderName?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {!showAvatar && !isOwnMessage && <div className="w-8" />}

                            <div
                              className={`max-w-[70%] ${
                                isOwnMessage ? 'items-end' : 'items-start'
                              } flex flex-col group relative`}
                            >
                              {showAvatar && (
                                <div
                                  className={`flex items-center gap-2 mb-1 ${
                                    isOwnMessage ? 'flex-row-reverse' : ''
                                  }`}
                                >
                                  <span className={`text-sm font-medium ${getTextClass()}`}>
                                    {message.senderName}
                                  </span>
                                  <span className={`text-xs ${getTextClass()}`}>
                                    {formatTime(message.timestamp || (message as any).createdAt)}
                                  </span>
                                </div>
                              )}

                              {/* Show reply preview if this is a reply */}
                              {message.replyToMessage && (
                                <div
                                  className={`text-xs mb-2 p-2 rounded bg-blue-50 border-l-2 border-blue-200 ${
                                    isOwnMessage ? 'mr-2' : 'ml-2'
                                  }`}
                                >
                                  <div className="font-medium">
                                    {message.replyToMessage.senderName}
                                  </div>
                                  <div className="truncate opacity-70">
                                    {message.replyToMessage.content}
                                  </div>
                                </div>
                              )}

                              {editingMessage?.messageId === message.messageId ? (
                                /* Edit mode */
                                <div
                                  className={`w-full rounded-xl px-3 py-2 bg-background border ${
                                    isOwnMessage ? 'mr-2' : 'ml-2'
                                  }`}
                                >
                                  <Input
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        saveEditedMessage();
                                      } else if (e.key === 'Escape') {
                                        cancelEditing();
                                      }
                                    }}
                                    className="border-none p-0 focus-visible:ring-0 rounded-full"
                                    autoFocus
                                  />
                                  <div className="flex justify-end gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEditing}
                                      className="rounded-full"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={saveEditedMessage}
                                      className="rounded-full"
                                    >
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                /* Normal message display */
                                <div className="relative">
                                  <div
                                    className={`rounded-xl px-4 py-2 max-w-full break-words shadow ${
                                      message.isDeleted
                                        ? 'bg-gray-100 text-gray-400 italic'
                                        : message.senderId === 'system-ai-bot'
                                        ? 'bg-green-50 text-green-800 border border-green-200'
                                        : isOwnMessage
                                        ? 'bg-blue-100 text-blue-900'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {message.content}
                                    {message.isEdited && !message.isDeleted && (
                                      <span className={`text-xs opacity-70 ml-2 ${getTextClass()}`}>
                                        (edited)
                                      </span>
                                    )}
                                  </div>

                                  {/* Message options dropdown */}
                                  {!message.isDeleted && message.senderId !== 'system-ai-bot' && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className={`absolute opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 ${
                                            isOwnMessage ? '-left-8' : '-right-8'
                                          } top-1`}
                                        >
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align={isOwnMessage ? 'end' : 'start'}
                                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                      >
                                        <DropdownMenuItem
                                          onClick={() => handleReplyToMessage(message)}
                                          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                          <Reply className="h-4 w-4 mr-2 text-gray-900 dark:text-white" />
                                          Reply
                                        </DropdownMenuItem>
                                        {isOwnMessage && (
                                          <>
                                            <DropdownMenuItem
                                              onClick={() => handleEditMessage(message)}
                                              className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                              <Edit3 className="h-4 w-4 mr-2 text-gray-900 dark:text-white" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handleDeleteMessage(message.messageId)}
                                              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                              <Trash2 className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                                              Delete
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              )}

                              {isOwnMessage && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className={`text-xs ${getTextClass()}`}>
                                    {message.isRead ? 'Read' : 'Sent'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <Separator />
              <CardContent className="p-4">
                {/* Reply Preview */}
                {replyingTo && (
                  <div className="mb-3 p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${getTextClass()}`}>
                          Replying to {replyingTo.senderName}
                        </div>
                        <div className={`text-sm truncate ${getTextClass()}`}>
                          {replyingTo.content}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelReply}
                        className="p-1 h-6 w-6"
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
                    placeholder={
                      replyingTo ? `Reply to ${replyingTo.senderName}...` : 'Type your message...'
                    }
                    className={`flex-1 rounded-full shadow px-4 py-2 ${getProfileInputClass()}`}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                    className="rounded-full bg-blue-400 hover:bg-blue-500 text-white shadow"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {!isConnected && (
                  <p className="text-sm text-orange-500 dark:text-orange-400 mt-2">
                    Chat service is disconnected. Messages will be sent when connection is restored.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card
            className={`flex-1 flex items-center justify-center rounded-2xl shadow-xl border ${getCardClass()}`}
          >
            <CardContent className="text-center">
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className={`text-sm ${getTextClass()}`}>Loading chat rooms...</p>
                </div>
              ) : (
                <>
                  <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className={`text-lg font-semibold mb-2 ${getTextClass()}`}>
                    Select a conversation
                  </h3>
                  <p className={getTextClass()}>
                    Choose a chat room from the sidebar to start messaging
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Sidebar - Online Users */}
      <Card className={`w-64 rounded-2xl shadow-2xl border ${getCardClass()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={`flex items-center gap-2 ${getTextClass()}`}>
              <Users className="h-5 w-5" />
              Online Users ({onlineUsers.filter((u) => u.isOnline).length})
            </CardTitle>

            <Button
              size="sm"
              variant="outline"
              onClick={refreshAllUsers}
              disabled={refreshingUsers}
              className="text-xs h-6 w-6 p-0 border-none"
              title="Refresh users from IdentityService"
            >
              {refreshingUsers ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <MdRefresh />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-12rem)] custom-scrollbar">
            <div className="space-y-2 p-2">
              {onlineUsers
                .filter((user) => user.isOnline)
                .map((user, index) => (
                  <div
                    key={user.userId || `user-${index}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.fullName?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <OnlineStatusIndicator userId={user.userId} size="sm" showText={false} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${getTextClass()}`}>
                        {user.fullName}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-xs rounded-full border border-blue-200 bg-white dark:text-black"
                      >
                        {getRoleDisplayName(Number(user.role))}
                      </Badge>
                    </div>
                  </div>
                ))}

              {onlineUsers.filter((u) => u.isOnline).length === 0 && (
                <div className={`p-4 text-center text-sm ${getTextClass()}`}>
                  <div className="mb-2">No users online</div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatboxAdmin;

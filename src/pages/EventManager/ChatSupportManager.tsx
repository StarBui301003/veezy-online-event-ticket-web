import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, Users, Send, MoreVertical, Search, Paperclip, Smile } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { chatService, type ChatMessage, type ChatRoom } from '@/services/chat.service';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

// Remove unused interface EventChatSupportProps and fix function parameter usage

const ChatSupportManager: React.FC = () => {
  const { getThemeClass } = useThemeClasses();

  const [events, setEvents] = useState<any[]>([]); // List of events managed by event manager
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]); // Chatrooms of selected event
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Messages of selected chatroom
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'active'>('all');
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Helper: check if message is sent by current user
  // Get all possible user IDs (event manager/admin and customer)
  const getCurrentUserIds = () => {
    const ids = [];
    try {
      const accountStr = localStorage.getItem('account');
      if (accountStr) {
        const accountObj = JSON.parse(accountStr);
        if (accountObj.accountId) ids.push(accountObj.accountId);
      }
    } catch (e) {}
    const customerId = localStorage.getItem('customerId');
    if (customerId) ids.push(customerId);
    return ids;
  };
  const isMyMessage = (msg: ChatMessage) => {
    const currentUserIds = getCurrentUserIds();
    return currentUserIds.includes(msg.senderId);
  };

  // Load events managed by event manager using event.service
  const loadEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      // Use getMyApprovedEvents from event.service for consistency
      const { getMyApprovedEvents } = await import('@/services/Event Manager/event.service');
      const eventsRes = await getMyApprovedEvents(1, 100);
      // Map backend event properties to frontend expected keys
      const mappedEvents = (Array.isArray(eventsRes) ? eventsRes : eventsRes?.data || []).map(
        (ev) => ({
          id: ev.eventId || ev.id,
          name: ev.eventName || ev.name,
          description: ev.eventDescription || ev.description,
          avatar: ev.eventAvatar || ev.avatar,
          ...ev,
        })
      );
      setEvents(mappedEvents);
    } catch (error) {
      toast.error('Unable to load event list');
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);
  // SignalR: Real-time event updates
  useEffect(() => {
    let isMounted = true;
    const setupEventHub = async () => {
      try {
        const { connectHub, onHubEvent } = await import('@/services/signalr.service');
        // Connect to event hub (adjust URL as needed)
        await connectHub('event', 'https://event.vezzy.site/notificationHub');
        // Listen for real-time event updates
        onHubEvent('event', 'EventCreated', () => isMounted && loadEvents());
        onHubEvent('event', 'EventUpdated', () => isMounted && loadEvents());
        onHubEvent('event', 'EventDeleted', () => isMounted && loadEvents());
        onHubEvent('event', 'EventApproved', () => isMounted && loadEvents());
      } catch (err) {
        // Ignore if signalr.service not available
      }
    };
    setupEventHub();
    return () => {
      isMounted = false;
      import('@/services/signalr.service').then(({ disconnectHub }) => {
        disconnectHub('event');
      });
    };
  }, [loadEvents]);

  // Load chatrooms for selected event
  const loadChatRooms = useCallback(async (eventId: string) => {
    setIsLoadingRooms(true);
    try {
      const rooms = await chatService.getEventChatRooms(eventId);
      console.log('Fetched chat rooms:', rooms);
      if (rooms.length > 0) {
        console.log('First room structure:', JSON.stringify(rooms[0], null, 2));
      }

      // Transform rooms to handle backend field names
      const transformedRooms = Array.isArray(rooms)
        ? rooms
            .map((room: any) => ({
              ...room,
              // Handle both backend field names (PascalCase) and frontend (camelCase)
              roomId: room.roomId || room.id || room.Id,
              roomName: room.roomName || room.name || room.Name || 'Unnamed Room',
              participants: (room.participants || []).map((p: any) => ({
                userId: p.userId || p.UserId,
                username: p.username || p.userName || p.UserName,
                fullName: p.fullName || p.userName || p.UserName || p.username || 'Unknown User',
                avatar: p.avatar || p.avatarUrl || p.AvatarUrl,
                isOnline: p.isOnline || p.IsOnline || false,
                role: p.role || p.Role || 'Customer',
              })),
              lastMessage: room.lastMessage || room.LastMessage,
              lastMessageAt: room.lastMessageAt || room.LastMessageAt,
              unreadCount: room.unreadCount || room.UnreadCount || 0,
              roomType: room.roomType || room.type || room.Type || 'Support',
              createdAt: room.createdAt || room.CreatedAt,
              createdByUserId: room.createdByUserId || room.CreatedByUserId,
              createdByUserName: room.createdByUserName || room.CreatedByUserName,
              // Remove AI mode since this is customer-event manager chat only
            }))
            // Sort by latest activity
            .sort((a, b) => {
              const aTime = a.lastMessageAt || a.lastMessage?.createdAt || a.createdAt;
              const bTime = b.lastMessageAt || b.lastMessage?.createdAt || b.createdAt;
              return new Date(bTime).getTime() - new Date(aTime).getTime();
            })
        : [];

      setChatRooms(transformedRooms);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      toast.error('Unable to load chat room list');
      setChatRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  // Load messages for selected chatroom
  const loadMessages = useCallback(async (roomId: string) => {
    setIsLoadingMessages(true);
    try {
      const messages = await chatService.getRoomMessages(roomId);
      console.log('Fetched messages:', messages);
      if (messages.length > 0) {
        console.log('First message structure:', JSON.stringify(messages[0], null, 2));
      }

      // Transform messages to handle backend field names (no AI bot handling needed for customer-event manager chat)
      const transformedMessages = Array.isArray(messages)
        ? messages.map((msg: any) => ({
            ...msg,
            // Handle both backend field names (PascalCase) and frontend (camelCase)
            messageId: msg.messageId || msg.Id,
            senderId: msg.senderId || msg.SenderUserId,
            senderName: msg.senderName || msg.SenderUserName || 'Unknown User',
            content: msg.content || msg.Content,
            timestamp: msg.timestamp || msg.CreatedAt,
            createdAt: msg.createdAt || msg.CreatedAt,
            roomId: msg.roomId || msg.RoomId,
            isDeleted: msg.isDeleted || msg.IsDeleted || false,
            isEdited: msg.isEdited || msg.IsEdited || false,
            replyToMessageId: msg.replyToMessageId || msg.ReplyToMessageId,
            replyToMessage: msg.replyToMessage || msg.ReplyToMessage,
          }))
        : [];

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Unable to load messages');
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Initial load: get events
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [messages.length]);

  // When event selected, load chatrooms
  useEffect(() => {
    if (selectedEvent) {
      loadChatRooms(selectedEvent.id);
      setSelectedRoom(null);
      setMessages([]);
    }
  }, [selectedEvent, loadChatRooms]);

  // When chatroom selected, load messages and setup SignalR real-time updates
  useEffect(() => {
    let disconnectChatHub: (() => void) | null = null;
    let leaveGroup: (() => void) | null = null;
    let isMounted = true;
    let joinedRoomId: string | null = null;
    if (selectedRoom) {
      loadMessages(selectedRoom.roomId);
      (async () => {
        try {
          const { connectHub, onHubEvent, joinChatRoom, leaveChatRoom, disconnectHub } =
            await import('@/services/signalr.service');
          const token = localStorage.getItem('access_token');
          await connectHub('chat', 'https://chat.vezzy.site/chatHub', token || undefined);
          await joinChatRoom(selectedRoom.roomId);
          joinedRoomId = selectedRoom.roomId;
          leaveGroup = async () => {
            if (joinedRoomId) await leaveChatRoom(joinedRoomId);
          };
          // Listen for new messages (backend: ReceiveMessage)
          onHubEvent('chat', 'ReceiveMessage', async (messageDto) => {
            if (!isMounted) return;

            console.log('📩 Received SignalR message:', messageDto);
            console.log('📩 Message DTO structure:', {
              id: messageDto.Id,
              roomId: messageDto.RoomId,
              senderUserId: messageDto.SenderUserId,
              senderUserName: messageDto.SenderUserName,
              content: messageDto.Content,
              createdAt: messageDto.CreatedAt,
            });

            // Transform backend DTO to frontend interface (no AI bot handling for customer-event manager chat)
            const senderId = messageDto.SenderUserId || messageDto.senderUserId;
            const senderName =
              messageDto.SenderUserName || messageDto.senderUserName || 'Unknown User';

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
            if (message.roomId === selectedRoom.roomId) {
              setMessages((prev) => {
                if (prev.some((m) => m.messageId === message.messageId)) return prev;
                const newMessages = [...prev, message];
                // Scroll to bottom after adding new message
                setTimeout(() => {
                  if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
                return newMessages;
              });
            }
          });

          // Listen for message deleted
          onHubEvent('chat', 'MessageDeleted', (data: { messageId: string; deletedBy: string }) => {
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
          onHubEvent('chat', 'MessageUpdated', (updatedMessageDto: any) => {
            console.log('✏️ Message updated:', updatedMessageDto);
            const senderId = updatedMessageDto.SenderUserId || updatedMessageDto.senderUserId;
            const senderName =
              updatedMessageDto.SenderUserName ||
              updatedMessageDto.senderUserName ||
              'Unknown User';

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

          // Listen for user joined room (backend: UserJoinedRoom)
          onHubEvent('chat', 'UserJoinedRoom', (_connectionId, _roomId) => {
            // Optionally handle user join (e.g., show notification or update UI)
            // You may want to reload participants or set someone online
          });
          // Listen for user left room (backend: UserLeftRoom)
          onHubEvent('chat', 'UserLeftRoom', (_connectionId, _roomId) => {
            // Optionally handle user leave (e.g., show notification or update UI)
          });
          // Listen for user online status (backend: UserOnline)
          onHubEvent('chat', 'UserOnline', (userId) => {
            if (!isMounted) return;
            setChatRooms((prevRooms) =>
              prevRooms.map((room) =>
                room.roomId === selectedRoom.roomId
                  ? {
                      ...room,
                      participants: room.participants.map((p) =>
                        p.userId === userId ? { ...p, isOnline: true } : p
                      ),
                    }
                  : room
              )
            );
          });
          // Listen for user offline status (backend: UserOffline)
          onHubEvent('chat', 'UserOffline', (userId) => {
            if (!isMounted) return;
            setChatRooms((prevRooms) =>
              prevRooms.map((room) =>
                room.roomId === selectedRoom.roomId
                  ? {
                      ...room,
                      participants: room.participants.map((p) =>
                        p.userId === userId ? { ...p, isOnline: false } : p
                      ),
                    }
                  : room
              )
            );
          });
          disconnectChatHub = () => disconnectHub('chat');
        } catch {}
      })();
    } else {
      setMessages([]);
    }
    return () => {
      isMounted = false;
      if (leaveGroup) leaveGroup();
      if (disconnectChatHub) disconnectChatHub();
    };
  }, [selectedRoom, loadMessages]);

  // Send message handler
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedRoom) return;
    try {
      let messageData: any = {
        roomId: selectedRoom.roomId,
        content: newMessage.trim(),
        messageType: 'Text',
      };
      if (replyingTo) {
        messageData.replyToMessageId = replyingTo.messageId;
      }
      if (editingMessage) {
        // Edit message
        await chatService.updateMessage(editingMessage.messageId, editingContent.trim());
        setEditingMessage(null);
        setEditingContent('');
      } else {
        // Send new message
        await chatService.sendMessage(messageData);
      }
      setNewMessage('');
      setReplyingTo(null);
      // Reload messages after send/edit
      loadMessages(selectedRoom.roomId);
    } catch (error) {
      toast.error('Unable to send/edit message');
    }
  }, [newMessage, selectedRoom, replyingTo, editingMessage, editingContent, loadMessages]);

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      toast.success('Message deleted');
      if (selectedRoom) loadMessages(selectedRoom.roomId);
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  // Reply to message
  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyingTo(message);
    setNewMessage('');
  };

  // Edit message
  const handleEditMessage = (message: ChatMessage) => {
    setEditingMessage(message);
    setEditingContent(message.content);
    setNewMessage('');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingMessage(null);
    setEditingContent('');
    setNewMessage('');
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
    setNewMessage('');
  };

  // Filter chatrooms in selected event
  const getFilteredRooms = (rooms: ChatRoom[]) =>
    rooms.filter((room) => {
      const matchesSearch =
        room.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.participants.some((p) => p.username.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter =
        filterStatus === 'all' ||
        (filterStatus === 'unread' && room.unreadCount > 0) ||
        (filterStatus === 'active' && room.participants.some((p) => p.isOnline));
      return matchesSearch && matchesFilter;
    });

  // Get current messages to display
  const currentMessages = messages;

  // Get participant count
  const getParticipantInfo = (room: ChatRoom) => {
    const totalParticipants = room.participants.length;
    const onlineParticipants = room.participants.filter((p) => p.isOnline).length;
    return { total: totalParticipants, online: onlineParticipants };
  };

  // Format timestamp (similar to ChatboxAdmin)
  const formatTimestamp = (timestamp: string | undefined | null) => {
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
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
  };

  // Format time for messages (similar to ChatboxAdmin)
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
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <div
      className={cn(
        'min-h-screen p-4 md:p-8',
        getThemeClass(
          'bg-gradient-to-br from-blue-100 via-cyan-100 to-blue-200 text-gray-900',
          'bg-gradient-to-br from-[#2a1435] via-[#4a1ca8] to-[#ff4da6] text-white'
        )
      )}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <h1
            className={cn(
              'text-3xl md:text-4xl font-black text-transparent bg-clip-text',
              getThemeClass(
                'bg-gradient-to-r from-blue-600 to-cyan-600',
                'bg-gradient-to-r from-purple-300 to-pink-300'
              )
            )}
          >
            Chat Support Manager
          </h1>
        </div>

        {/* Main Content */}
        <div className="h-[calc(100vh-200px)] flex gap-4">
          {/* Sidebar: Event List */}
          <div
            className={cn(
              'w-1/4 backdrop-blur-sm border rounded-xl flex flex-col',
              getThemeClass('bg-white/80 border-gray-200', 'bg-white/10 border-white/20')
            )}
          >
            <div
              className={cn('p-4 border-b', getThemeClass('border-gray-200', 'border-white/20'))}
            >
              <h2
                className={cn(
                  'text-lg font-semibold',
                  getThemeClass('text-gray-900', 'text-white')
                )}
              >
                Event List
              </h2>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {isLoadingEvents ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'p-3 rounded-lg animate-pulse',
                          getThemeClass('bg-gray-100', 'bg-white/5')
                        )}
                      >
                        <div
                          className={cn(
                            'h-4 rounded mb-2',
                            getThemeClass('bg-gray-300', 'bg-white/20')
                          )}
                        ></div>
                        <div
                          className={cn(
                            'h-3 rounded w-2/3',
                            getThemeClass('bg-gray-300', 'bg-white/20')
                          )}
                        ></div>
                      </div>
                    ))}
                  </div>
                ) : events.length === 0 ? (
                  <div
                    className={cn(
                      'text-center py-8',
                      getThemeClass('text-gray-600', 'text-white/70')
                    )}
                  >
                    <MessageCircle
                      className={cn(
                        'h-12 w-12 mx-auto mb-4',
                        getThemeClass('text-gray-400', 'text-white/50')
                      )}
                    />
                    <p>No events available</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {events.map((event, idx) => {
                      // Calculate unread count from current chatRooms for this event
                      // Since we load chatRooms when an event is selected, only show unread for selected event
                      const eventUnreadCount =
                        selectedEvent?.id === event.id
                          ? chatRooms.reduce((total, room) => total + (room.unreadCount || 0), 0)
                          : 0;
                      const eventRoomCount = selectedEvent?.id === event.id ? chatRooms.length : 0;

                      return (
                        <Card
                          key={event.id || event.roomId || idx}
                          className={cn(
                            'cursor-pointer transition-all duration-200 backdrop-blur-sm border',
                            selectedEvent?.id === event.id
                              ? getThemeClass(
                                  'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-blue-400/50 shadow-md',
                                  'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400/50 shadow-md'
                                )
                              : getThemeClass(
                                  'bg-white/80 hover:bg-white/90 border-gray-200',
                                  'bg-white/5 hover:bg-white/10 border-white/10'
                                )
                          )}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <CardContent
                            className="p-3"
                            key={'event-content-' + (event.id || event.roomId || idx)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={event.avatar} />
                                  <AvatarFallback
                                    className={cn(
                                      getThemeClass(
                                        'bg-blue-100 text-blue-600',
                                        'bg-white/20 text-white'
                                      )
                                    )}
                                  >
                                    <Users className="h-5 w-5" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={cn(
                                      'font-medium truncate',
                                      getThemeClass('text-gray-900', 'text-white')
                                    )}
                                  >
                                    {event.name}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span
                                      className={cn(
                                        'text-xs',
                                        getThemeClass('text-gray-600', 'text-white/70')
                                      )}
                                    >
                                      {selectedEvent?.id === event.id
                                        ? `${eventRoomCount} chat rooms`
                                        : 'Click to view'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {eventUnreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs ml-2">
                                  {eventUnreadCount > 99 ? '99+' : eventUnreadCount}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Middle Panel: Chatroom List */}
          <div
            className={cn(
              'w-1/4 backdrop-blur-sm border rounded-xl flex flex-col',
              getThemeClass('bg-white/80 border-gray-200', 'bg-white/10 border-white/20')
            )}
          >
            <div
              className={cn('p-4 border-b', getThemeClass('border-gray-200', 'border-white/20'))}
            >
              <h2
                className={cn(
                  'text-lg font-semibold',
                  getThemeClass('text-gray-900', 'text-white')
                )}
              >
                Event Chat Rooms
              </h2>
              <div className="space-y-2 mt-2">
                <div className="relative">
                  <Search
                    className={cn(
                      'absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4',
                      getThemeClass('text-gray-400', 'text-white/50')
                    )}
                  />
                  <Input
                    placeholder="Search chat rooms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      'pl-10',
                      getThemeClass(
                        'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500',
                        'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400'
                      )
                    )}
                  />
                </div>
                <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
                  <TabsList
                    className={cn(
                      'grid w-full grid-cols-3',
                      getThemeClass('bg-gray-100', 'bg-white/10')
                    )}
                  >
                    <TabsTrigger
                      value="all"
                      className={cn(
                        getThemeClass(
                          'data-[state=active]:bg-blue-500 data-[state=active]:text-white',
                          'data-[state=active]:bg-purple-500 data-[state=active]:text-white'
                        )
                      )}
                    >
                      All
                    </TabsTrigger>
                    <TabsTrigger
                      value="unread"
                      className={cn(
                        getThemeClass(
                          'data-[state=active]:bg-blue-500 data-[state=active]:text-white',
                          'data-[state=active]:bg-purple-500 data-[state=active]:text-white'
                        )
                      )}
                    >
                      Unread
                    </TabsTrigger>
                    <TabsTrigger
                      value="active"
                      className={cn(
                        getThemeClass(
                          'data-[state=active]:bg-blue-500 data-[state=active]:text-white',
                          'data-[state=active]:bg-purple-500 data-[state=active]:text-white'
                        )
                      )}
                    >
                      Active
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {isLoadingRooms ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'p-3 rounded-lg animate-pulse',
                          getThemeClass('bg-gray-100', 'bg-white/5')
                        )}
                      >
                        <div
                          className={cn(
                            'h-4 rounded mb-2',
                            getThemeClass('bg-gray-300', 'bg-white/20')
                          )}
                        ></div>
                        <div
                          className={cn(
                            'h-3 rounded w-2/3',
                            getThemeClass('bg-gray-300', 'bg-white/20')
                          )}
                        ></div>
                      </div>
                    ))}
                  </div>
                ) : chatRooms.length === 0 ? (
                  <div
                    className={cn(
                      'text-center py-8',
                      getThemeClass('text-gray-600', 'text-white/70')
                    )}
                  >
                    <MessageCircle
                      className={cn(
                        'h-12 w-12 mx-auto mb-4',
                        getThemeClass('text-gray-400', 'text-white/50')
                      )}
                    />
                    <p>No chat rooms available</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getFilteredRooms(chatRooms).map((room, idx) => {
                      const participantInfo = getParticipantInfo(room);
                      const isSelected = selectedRoom?.roomId === room.roomId;
                      return (
                        <Card
                          key={room.roomId || idx}
                          className={cn(
                            'cursor-pointer transition-all duration-200 backdrop-blur-sm border',
                            isSelected
                              ? getThemeClass(
                                  'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-blue-400/50 shadow-md',
                                  'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400/50 shadow-md'
                                )
                              : getThemeClass(
                                  'bg-white/80 hover:bg-white/90 border-gray-200',
                                  'bg-white/5 hover:bg-white/10 border-white/10'
                                )
                          )}
                          onClick={() => setSelectedRoom(room)}
                        >
                          <CardContent className="p-3" key={'room-content-' + (room.roomId || idx)}>
                            <div className="flex items-start space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={room.participants[0]?.avatar} />
                                <AvatarFallback
                                  className={cn(
                                    getThemeClass(
                                      'bg-blue-100 text-blue-600',
                                      'bg-white/20 text-white'
                                    )
                                  )}
                                >
                                  <Users className="h-5 w-5" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p
                                    className={cn(
                                      'font-medium truncate',
                                      getThemeClass('text-gray-900', 'text-white')
                                    )}
                                  >
                                    {room.createdByUserName ||
                                      room.participants[0]?.fullName ||
                                      'Unknown Customer'}
                                  </p>
                                  {room.unreadCount > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {room.unreadCount > 99 ? '99+' : room.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <p
                                    className={cn(
                                      'text-sm truncate',
                                      getThemeClass('text-gray-600', 'text-white/70')
                                    )}
                                  >
                                    {room.lastMessage?.content || 'No messages yet'}
                                  </p>
                                  <span
                                    className={cn(
                                      'text-xs ml-2',
                                      getThemeClass('text-gray-500', 'text-white/50')
                                    )}
                                  >
                                    {formatTimestamp(
                                      room.lastMessageAt ||
                                        room.lastMessage?.timestamp ||
                                        room.lastMessage?.createdAt ||
                                        room.createdAt
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center mt-2 space-x-2">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-xs',
                                      getThemeClass(
                                        'border-gray-300 text-gray-700',
                                        'border-white/20 text-white/80'
                                      )
                                    )}
                                  >
                                    <Users className="h-3 w-3 mr-1" />
                                    {participantInfo.total}
                                  </Badge>
                                  {participantInfo.online > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-green-400 border-green-400/30"
                                    >
                                      {participantInfo.online} online
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main Panel: Chat Messages */}
          <div
            className={cn(
              'flex-1 flex flex-col rounded-xl border backdrop-blur-sm overflow-hidden',
              getThemeClass('bg-white/80 border-gray-200', 'bg-white/10 border-white/20')
            )}
          >
            {selectedRoom ? (
              <>
                <div
                  className={cn(
                    'backdrop-blur-sm border-b p-4 rounded-t-xl',
                    getThemeClass(
                      'bg-white/90 border-gray-200 shadow-sm',
                      'bg-gradient-to-r from-[#3a324e] to-[#4b3e65] border-gray-700/50'
                    )
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedRoom.participants[0]?.avatar} />
                        <AvatarFallback
                          className={cn(
                            getThemeClass('bg-blue-100 text-blue-600', 'bg-white/20 text-white')
                          )}
                        >
                          <Users className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3
                          className={cn(
                            'font-semibold',
                            getThemeClass('text-gray-900', 'text-white')
                          )}
                        >
                          {selectedRoom.createdByUserName ||
                            selectedRoom.participants[0]?.fullName ||
                            'Unknown Customer'}
                        </h3>
                        <div
                          className={cn(
                            'flex items-center space-x-2 text-sm',
                            getThemeClass('text-gray-600', 'text-white/70')
                          )}
                        >
                          <Users className="h-4 w-4" />
                          <span>{selectedRoom.participants.length} members</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          getThemeClass(
                            'border-gray-300 text-gray-700 hover:bg-gray-100',
                            'border-white/20 text-white hover:bg-white/10'
                          )
                        )}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Members
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              getThemeClass(
                                'text-gray-700 hover:bg-gray-100',
                                'text-white hover:bg-white/10'
                              )
                            )}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className={cn(
                            'backdrop-blur-sm',
                            getThemeClass('bg-white border-gray-200', 'bg-white/10 border-white/20')
                          )}
                        >
                          <DropdownMenuItem
                            className={cn(
                              getThemeClass(
                                'text-gray-700 hover:bg-gray-100',
                                'text-white hover:bg-white/10'
                              )
                            )}
                          >
                            Room Info
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={cn(
                              getThemeClass(
                                'text-gray-700 hover:bg-gray-100',
                                'text-white hover:bg-white/10'
                              )
                            )}
                          >
                            Chat History
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={cn(
                              getThemeClass(
                                'text-gray-700 hover:bg-gray-100',
                                'text-white hover:bg-white/10'
                              )
                            )}
                          >
                            Notification Settings
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
                <ScrollArea
                  className={cn(
                    'flex-1 p-4 backdrop-blur-sm',
                    getThemeClass('bg-white/95', 'bg-gradient-to-br from-[#1e1b2e] to-[#2c2a40]')
                  )}
                >
                  <div className="space-y-4">
                    {isLoadingMessages ? (
                      <div
                        className={cn(
                          'text-center py-8',
                          getThemeClass('text-gray-600', 'text-white/70')
                        )}
                      >
                        <MessageCircle
                          className={cn(
                            'h-12 w-12 mx-auto mb-4',
                            getThemeClass('text-gray-400', 'text-white/50')
                          )}
                        />
                        <p>Loading messages...</p>
                      </div>
                    ) : currentMessages.length === 0 ? (
                      <div
                        className={cn(
                          'text-center py-8',
                          getThemeClass('text-gray-600', 'text-white/70')
                        )}
                      >
                        <MessageCircle
                          className={cn(
                            'h-12 w-12 mx-auto mb-4',
                            getThemeClass('text-gray-400', 'text-white/50')
                          )}
                        />
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                      </div>
                    ) : (
                      currentMessages.map((message, index) => {
                        const isMyMsg = isMyMessage(message);
                        const isConsecutive =
                          index > 0 && currentMessages[index - 1].senderId === message.senderId;
                        // Regular sender name handling (no AI bot for customer-event manager chat)
                        const safeSenderName = message.senderName || 'Unknown User';

                        return (
                          <motion.div
                            key={message.messageId || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isMyMsg ? 'justify-end' : 'justify-start'} group`}
                          >
                            <div
                              className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                                isMyMsg ? 'flex-row-reverse space-x-reverse' : ''
                              }`}
                            >
                              {!isConsecutive && (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback
                                    className={cn(
                                      getThemeClass(
                                        'bg-blue-100 text-blue-600',
                                        'bg-white/20 text-white'
                                      )
                                    )}
                                  >
                                    {safeSenderName.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div
                                className={`${isConsecutive && !isMyMsg ? 'ml-10' : ''} ${
                                  isConsecutive && isMyMsg ? 'mr-10' : ''
                                }`}
                              >
                                {!isConsecutive && (
                                  <div
                                    className={`flex items-center gap-2 mb-1 ${
                                      isMyMsg ? 'flex-row-reverse' : ''
                                    }`}
                                  >
                                    <span
                                      className={cn(
                                        `text-xs ${isMyMsg ? 'text-right' : 'text-left'}`,
                                        getThemeClass('text-gray-600', 'text-white/70')
                                      )}
                                    >
                                      {safeSenderName}
                                    </span>
                                    <span
                                      className={cn(
                                        'text-xs',
                                        getThemeClass('text-gray-500', 'text-white/50')
                                      )}
                                    >
                                      {formatTime(message.timestamp || message.createdAt)}
                                    </span>
                                  </div>
                                )}
                                {/* Reply preview */}
                                {message.replyToMessage && (
                                  <div
                                    className={cn(
                                      'text-xs mb-2 p-2 rounded backdrop-blur-sm border-l-2',
                                      getThemeClass(
                                        'bg-gray-100 border-gray-300',
                                        'bg-white/10 border-white/30'
                                      )
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        'font-medium',
                                        getThemeClass('text-gray-900', 'text-white')
                                      )}
                                    >
                                      {message.replyToMessage.senderName}
                                    </div>
                                    <div
                                      className={cn(
                                        'truncate opacity-75',
                                        getThemeClass('text-gray-600', 'text-white/70')
                                      )}
                                    >
                                      {message.replyToMessage.content}
                                    </div>
                                  </div>
                                )}
                                {/* Edit mode */}
                                {editingMessage?.messageId === message.messageId ? (
                                  <div
                                    className={cn(
                                      'w-full rounded-xl px-3 py-2 backdrop-blur-sm border',
                                      getThemeClass(
                                        'bg-white border-gray-300',
                                        'bg-white/10 border-white/20'
                                      )
                                    )}
                                  >
                                    <Input
                                      value={editingContent}
                                      onChange={(e) => setEditingContent(e.target.value)}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleSendMessage();
                                        } else if (e.key === 'Escape') {
                                          cancelEditing();
                                        }
                                      }}
                                      className={cn(
                                        'bg-transparent border-none p-0 focus-visible:ring-0 rounded-full',
                                        getThemeClass(
                                          'text-gray-900 placeholder:text-gray-500',
                                          'text-white placeholder:text-white/50'
                                        )
                                      )}
                                      autoFocus
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={cancelEditing}
                                        className={cn(
                                          'rounded-full',
                                          getThemeClass(
                                            'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300',
                                            'bg-white/10 text-white hover:bg-white/20 border-white/20'
                                          )
                                        )}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={handleSendMessage}
                                        className={cn(
                                          'rounded-full',
                                          getThemeClass(
                                            'bg-blue-500 text-white hover:bg-blue-600',
                                            'bg-white/20 text-white hover:bg-white/30'
                                          )
                                        )}
                                      >
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <div
                                      className={cn(
                                        'rounded-xl px-4 py-2 max-w-full break-words shadow backdrop-blur-sm',
                                        message.isDeleted
                                          ? getThemeClass(
                                              'bg-gray-100 text-gray-400 italic',
                                              'bg-white/5 text-white/40 italic'
                                            )
                                          : isMyMsg
                                          ? getThemeClass(
                                              'bg-blue-500 text-white',
                                              'bg-white/20 text-white'
                                            )
                                          : getThemeClass(
                                              'bg-white text-gray-900',
                                              'bg-white/10 text-white'
                                            )
                                      )}
                                    >
                                      {message.content}
                                      {message.isEdited && !message.isDeleted && (
                                        <span
                                          className={cn(
                                            'text-xs opacity-70 ml-2',
                                            getThemeClass('text-gray-500', 'text-white/70')
                                          )}
                                        >
                                          (edited)
                                        </span>
                                      )}
                                    </div>
                                    {/* Message options dropdown */}
                                    {!message.isDeleted && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 -right-8 top-1 text-white hover:bg-white/20"
                                          >
                                            <MoreVertical className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                          align={isMyMsg ? 'end' : 'start'}
                                          className={cn(
                                            'backdrop-blur-md',
                                            getThemeClass(
                                              'bg-white border-gray-200',
                                              'bg-white/10 border-white/20'
                                            )
                                          )}
                                        >
                                          <DropdownMenuItem
                                            onClick={() => handleReplyToMessage(message)}
                                            className={cn(
                                              getThemeClass(
                                                'text-gray-700 hover:bg-gray-100',
                                                'text-white hover:bg-white/20'
                                              )
                                            )}
                                          >
                                            Reply
                                          </DropdownMenuItem>
                                          {isMyMsg && (
                                            <>
                                              <DropdownMenuItem
                                                onClick={() => handleEditMessage(message)}
                                                className={cn(
                                                  getThemeClass(
                                                    'text-gray-700 hover:bg-gray-100',
                                                    'text-white hover:bg-white/20'
                                                  )
                                                )}
                                              >
                                                Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() =>
                                                  handleDeleteMessage(message.messageId)
                                                }
                                                className={cn(
                                                  getThemeClass(
                                                    'text-red-600 hover:bg-red-100',
                                                    'text-red-300 hover:bg-red-500/20 hover:text-red-200'
                                                  )
                                                )}
                                              >
                                                Delete
                                              </DropdownMenuItem>
                                            </>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                {/* Message Input */}
                <div
                  className={cn(
                    'backdrop-blur-sm border-t p-4',
                    getThemeClass('bg-white border-gray-200', 'bg-white/5 border-white/20')
                  )}
                >
                  {replyingTo && (
                    <div
                      className={cn(
                        'mb-3 p-3 backdrop-blur-sm rounded-lg border-l-4',
                        getThemeClass('bg-gray-100 border-gray-400', 'bg-white/10 border-white/50')
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div
                            className={cn(
                              'text-sm font-medium',
                              getThemeClass('text-gray-900', 'text-white')
                            )}
                          >
                            Replying to {replyingTo.senderName}
                          </div>
                          <div
                            className={cn(
                              'text-sm truncate',
                              getThemeClass('text-gray-600', 'text-white/70')
                            )}
                          >
                            {replyingTo.content}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelReply}
                          className={cn(
                            'p-1 h-6 w-6',
                            getThemeClass(
                              'text-gray-600 hover:bg-gray-200',
                              'text-white hover:bg-white/20'
                            )
                          )}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        getThemeClass(
                          'text-gray-600 hover:bg-gray-200',
                          'text-white hover:bg-white/20'
                        )
                      )}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        getThemeClass(
                          'text-gray-600 hover:bg-gray-200',
                          'text-white hover:bg-white/20'
                        )
                      )}
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 flex space-x-2">
                      <Input
                        placeholder={
                          replyingTo
                            ? `Reply to ${replyingTo.senderName}...`
                            : editingMessage
                            ? 'Edit message...'
                            : 'Type a message...'
                        }
                        value={editingMessage ? editingContent : newMessage}
                        onChange={(e) =>
                          editingMessage
                            ? setEditingContent(e.target.value)
                            : setNewMessage(e.target.value)
                        }
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        className={cn(
                          'flex-1 backdrop-blur-sm',
                          getThemeClass(
                            'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500',
                            'bg-white/10 border-white/20 text-white placeholder:text-white/50'
                          )
                        )}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={editingMessage ? !editingContent.trim() : !newMessage.trim()}
                        className={cn(
                          'px-4',
                          getThemeClass(
                            'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500',
                            'bg-white/20 text-white hover:bg-white/30 disabled:bg-white/10 disabled:text-white/50'
                          )
                        )}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div
                className={cn(
                  'flex-1 flex items-center justify-center backdrop-blur-sm',
                  getThemeClass('bg-white/95', 'bg-gradient-to-br from-[#1e1b2e] to-[#2c2a40]')
                )}
              >
                <div className="text-center">
                  <MessageCircle
                    className={cn(
                      'h-16 w-16 mx-auto mb-4',
                      getThemeClass('text-gray-400', 'text-white/50')
                    )}
                  />
                  <h3
                    className={cn(
                      'text-lg font-medium mb-2',
                      getThemeClass('text-gray-900', 'text-white')
                    )}
                  >
                    Select a chat room to start
                  </h3>
                  <p className={cn(getThemeClass('text-gray-600', 'text-white/70'))}>
                    Choose a chat room from the list to view and reply to messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSupportManager;

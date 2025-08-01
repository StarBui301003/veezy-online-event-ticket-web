
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { chatService, type ChatMessage, type ChatRoom } from '@/services/chat.service';

// Remove unused interface EventChatSupportProps and fix function parameter usage

const ChatSupportManager: React.FC = () => {
  // ...existing code...
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
      const mappedEvents = (Array.isArray(eventsRes) ? eventsRes : (eventsRes?.data || [])).map(ev => ({
        id: ev.eventId || ev.id,
        name: ev.eventName || ev.name,
        description: ev.eventDescription || ev.description,
        avatar: ev.eventAvatar || ev.avatar,
        ...ev
      }));
      setEvents(mappedEvents);
    } catch (error) {
      toast.error('Không thể tải danh sách sự kiện');
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);
  // SignalR: Real-time event updates
  useEffect(() => {
    let isMounted = true;
    const setupEventHub = async () => {
      try {
        const { connectHub, onHubEvent, disconnectHub } = await import('@/services/signalr.service');
        // Connect to event hub (adjust URL as needed)
        await connectHub('event', 'http://localhost:5004/notificationHub');
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
      setChatRooms(rooms);
    } catch (error) {
      toast.error('Không thể tải danh sách phòng chat');
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  // Load messages for selected chatroom
  const loadMessages = useCallback(async (roomId: string) => {
    setIsLoadingMessages(true);
    try {
      const msgs = await chatService.getRoomMessages(roomId);
      setMessages(msgs);
    } catch (error) {
      toast.error('Không thể tải tin nhắn');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Initial load: get events
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);
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
          const { connectHub, onHubEvent, joinChatRoom, leaveChatRoom, disconnectHub } = await import('@/services/signalr.service');
          await connectHub('chat', 'http://localhost:5007/chatHub');
          await joinChatRoom(selectedRoom.roomId);
          joinedRoomId = selectedRoom.roomId;
          leaveGroup = async () => {
            if (joinedRoomId) await leaveChatRoom(joinedRoomId);
          };
          // Listen for new messages (backend: ReceiveMessage)
          onHubEvent('chat', 'ReceiveMessage', async (msg) => {
            if (!isMounted) return;
            if (msg && msg.roomId === selectedRoom.roomId) {
              // If any critical field is missing, reload all messages for the room
              if (!msg.senderName || !msg.messageId || !msg.content || !msg.timestamp || !msg.senderId) {
                await loadMessages(selectedRoom.roomId);
                return;
              }
              setMessages(prev => {
                if (prev.some(m => m.messageId === msg.messageId)) return prev;
                return [...prev, msg];
              });
            }
          });
          // Listen for user joined room (backend: UserJoinedRoom)
          onHubEvent('chat', 'UserJoinedRoom', (connectionId, roomId) => {
            // Optionally handle user join (e.g., show notification or update UI)
            // You may want to reload participants or set someone online
          });
          // Listen for user left room (backend: UserLeftRoom)
          onHubEvent('chat', 'UserLeftRoom', (connectionId, roomId) => {
            // Optionally handle user leave (e.g., show notification or update UI)
          });
          // Listen for user online status (backend: UserOnline)
          onHubEvent('chat', 'UserOnline', (userId) => {
            if (!isMounted) return;
            setChatRooms(prevRooms => prevRooms.map(room =>
              room.roomId === selectedRoom.roomId
                ? {
                    ...room,
                    participants: room.participants.map(p =>
                      p.userId === userId ? { ...p, isOnline: true } : p
                    )
                  }
                : room
            ));
          });
          // Listen for user offline status (backend: UserOffline)
          onHubEvent('chat', 'UserOffline', (userId) => {
            if (!isMounted) return;
            setChatRooms(prevRooms => prevRooms.map(room =>
              room.roomId === selectedRoom.roomId
                ? {
                    ...room,
                    participants: room.participants.map(p =>
                      p.userId === userId ? { ...p, isOnline: false } : p
                    )
                  }
                : room
            ));
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
      toast.error('Không thể gửi/chỉnh sửa tin nhắn');
    }
  }, [newMessage, selectedRoom, replyingTo, editingMessage, editingContent, loadMessages]);

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      toast.success('Đã xóa tin nhắn');
      if (selectedRoom) loadMessages(selectedRoom.roomId);
    } catch (error) {
      toast.error('Xóa tin nhắn thất bại');
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
    rooms.filter(room => {
      const matchesSearch = room.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.participants.some(p => p.username.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = filterStatus === 'all' ||
        (filterStatus === 'unread' && room.unreadCount > 0) ||
        (filterStatus === 'active' && room.participants.some(p => p.isOnline));
      return matchesSearch && matchesFilter;
    });

  // Get current messages to display
  const currentMessages = messages;

  // Get participant count
  const getParticipantInfo = (room: ChatRoom) => {
    const totalParticipants = room.participants.length;
    const onlineParticipants = room.participants.filter(p => p.isOnline).length;
    return { total: totalParticipants, online: onlineParticipants };
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Vừa xong';
    if (hours < 24) return `${hours}h trước`;
    if (hours < 48) return 'Hôm qua';
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar: Event List */}
      <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Danh sách sự kiện</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoadingEvents ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-100 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Không có sự kiện nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event, idx) => (
                  <Card
                    key={event.id || event.roomId || idx}
                    className={`cursor-pointer transition-all duration-200 ${selectedEvent?.id === event.id ? 'bg-blue-50 border-blue-200 shadow-md' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <CardContent className="p-3" key={"event-content-" + (event.id || event.roomId || idx)}>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={event.avatar} />
                          <AvatarFallback>
                            <Users className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{event.name}</p>
                          <p className="text-sm text-gray-500 truncate">{event.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Middle Panel: Chatroom List */}
      <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Phòng chat sự kiện</h2>
          <div className="space-y-2 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm phòng chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="unread">Chưa đọc</TabsTrigger>
                <TabsTrigger value="active">Đang hoạt động</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoadingRooms ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-100 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : chatRooms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Không có phòng chat nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {getFilteredRooms(chatRooms).map((room, idx) => {
                  const participantInfo = getParticipantInfo(room);
                  const isSelected = selectedRoom?.roomId === room.roomId;
                  return (
                    <Card
                      key={room.roomId || idx}
                      className={`cursor-pointer transition-all duration-200 ${isSelected ? 'bg-blue-50 border-blue-200 shadow-md' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
                      onClick={() => setSelectedRoom(room)}
                    >
                      <CardContent className="p-3" key={"room-content-" + (room.roomId || idx)}>
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={room.participants[0]?.avatar} />
                            <AvatarFallback>
                              <Users className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900 truncate">{room.roomName}</p>
                              {room.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {room.unreadCount > 99 ? '99+' : room.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-sm text-gray-500 truncate">{room.lastMessage?.content || 'Chưa có tin nhắn'}</p>
                              <span className="text-xs text-gray-400 ml-2">{room.lastMessage ? formatTimestamp(room.lastMessage.timestamp) : ''}</span>
                            </div>
                            <div className="flex items-center mt-2 space-x-2">
                              <Badge variant="outline" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {participantInfo.total}
                              </Badge>
                              {participantInfo.online > 0 && (
                                <Badge variant="outline" className="text-xs text-green-600">{participantInfo.online} online</Badge>
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
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedRoom.participants[0]?.avatar} />
                    <AvatarFallback>
                      <Users className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedRoom.roomName}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{selectedRoom.participants.length} thành viên</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Thành viên
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Thông tin phòng</DropdownMenuItem>
                      <DropdownMenuItem>Lịch sử chat</DropdownMenuItem>
                      <DropdownMenuItem>Cài đặt thông báo</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {isLoadingMessages ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Đang tải tin nhắn...</p>
                  </div>
                ) : currentMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Chưa có tin nhắn nào</p>
                    <p className="text-sm">Hãy bắt đầu cuộc trò chuyện!</p>
                  </div>
                ) : (
                  currentMessages.map((message, index) => {
                    const isMyMsg = isMyMessage(message);
                    const isConsecutive = index > 0 && currentMessages[index - 1].senderId === message.senderId;
                    // Fallback for senderName
                    const safeSenderName = message.senderName || 'U';
                    return (
                      <motion.div
                        key={message.messageId || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMyMsg ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isMyMsg ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {!isConsecutive && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {safeSenderName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`${isConsecutive && !isMyMsg ? 'ml-10' : ''} ${isConsecutive && isMyMsg ? 'mr-10' : ''}`}>
                            {!isConsecutive && (
                              <p className={`text-xs text-gray-500 mb-1 ${isMyMsg ? 'text-right' : 'text-left'}`}>
                                {safeSenderName}
                              </p>
                            )}
                            {/* Reply preview */}
                            {message.replyToMessage && (
                              <div className="text-xs mb-2 p-2 rounded bg-blue-50 border-l-2 border-blue-200">
                                <div className="font-medium">{message.replyToMessage.senderName}</div>
                                <div className="truncate opacity-70">{message.replyToMessage.content}</div>
                              </div>
                            )}
                            {/* Edit mode */}
                            {editingMessage?.messageId === message.messageId ? (
                              <div className="w-full rounded-xl px-3 py-2 bg-background border">
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
                                  className="border-none p-0 focus-visible:ring-0 rounded-full"
                                  autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                  <Button size="sm" variant="outline" onClick={cancelEditing} className="rounded-full">Cancel</Button>
                                  <Button size="sm" onClick={handleSendMessage} className="rounded-full">Save</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative">
                                <div className={`rounded-xl px-4 py-2 max-w-full break-words shadow ${message.isDeleted ? 'bg-gray-100 text-gray-400 italic' : isMyMsg ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-800'}`}>
                                  {message.content}
                                  {message.isEdited && !message.isDeleted && (
                                    <span className="text-xs opacity-70 ml-2">(edited)</span>
                                  )}
                                </div>
                                {/* Message options dropdown */}
                                {!message.isDeleted && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="absolute opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 -right-8 top-1">
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align={isMyMsg ? 'end' : 'start'}>
                                      <DropdownMenuItem onClick={() => handleReplyToMessage(message)}>
                                        Reply
                                      </DropdownMenuItem>
                                      {isMyMsg && (
                                        <>
                                          <DropdownMenuItem onClick={() => handleEditMessage(message)}>
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleDeleteMessage(message.messageId)} className="text-destructive">
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
            <div className="bg-white border-t border-gray-200 p-4">
              {replyingTo && (
                <div className="mb-3 p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Replying to {replyingTo.senderName}</div>
                      <div className="text-sm text-muted-foreground truncate">{replyingTo.content}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={cancelReply} className="p-1 h-6 w-6">Cancel</Button>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
                <div className="flex-1 flex space-x-2">
                  <Input
                    placeholder={replyingTo ? `Reply to ${replyingTo.senderName}...` : editingMessage ? 'Edit message...' : 'Nhập tin nhắn...'}
                    value={editingMessage ? editingContent : newMessage}
                    onChange={(e) => editingMessage ? setEditingContent(e.target.value) : setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={editingMessage ? !editingContent.trim() : !newMessage.trim()}
                    className="px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chọn phòng chat để bắt đầu</h3>
              <p className="text-gray-500">Chọn một phòng chat từ danh sách để xem và trả lời tin nhắn</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSupportManager;

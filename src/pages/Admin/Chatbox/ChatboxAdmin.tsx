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
  Settings,
  Trash2,
  Reply,
  Edit3,
  X,
  MoreVertical
} from 'lucide-react';
import { toast } from 'react-toastify';
import { connectChatHub, onChat, disconnectChatHub, joinChatRoom, leaveChatRoom } from '@/services/signalr.service';
import { 
  chatService, 
  type ChatUser, 
  type ChatMessage, 
  type ChatRoom 
} from '@/services/chat.service';
import { motion, AnimatePresence } from 'framer-motion';

export const ChatboxAdmin = () => {
  // States
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Reply and Edit states
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editingContent, setEditingContent] = useState('');
  
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
        role: 'Admin' as const
      };
    }
    
    // Fallback if no account found
    return {
      userId: 'admin-id',
      username: 'admin',
      fullName: 'Administrator',
      role: 'Admin' as const
    };
  };
  
  const currentUser = getCurrentUser();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Use setTimeout to ensure DOM has fully updated
      setTimeout(() => {
        if (messagesEndRef.current) {
          const scrollContainer = messagesEndRef.current.parentElement?.parentElement;
          if (scrollContainer) {
            const isAtBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 10;
            // Only auto-scroll if user is already near the bottom
            if (isAtBottom) {
              messagesEndRef.current.scrollIntoView({ 
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest'
              });
            }
          }
        }
      }, 50);
    }
  };

  // Connect to SignalR Chat Hub
  useEffect(() => {
    const connectToChat = async () => {
      try {
        console.log('Attempting to connect to ChatHub...');
        await connectChatHub('http://localhost:5007/chatHub');
        setIsConnected(true);
        console.log('✅ Connected to ChatHub successfully');

        // Join admin group for receiving support requests
        onChat('JoinGroup', async (groupName: string) => {
          console.log(`📢 Joined group: ${groupName}`);
        });

        // Listen for new messages
        onChat('ReceiveMessage', (messageDto: any) => {
          console.log('📩 Received SignalR message:', messageDto);
          
          // Transform backend DTO to frontend interface
          const message: ChatMessage = {
            messageId: messageDto.Id || messageDto.id,
            senderId: messageDto.SenderUserId || messageDto.senderUserId,
            senderName: messageDto.SenderUserName || messageDto.senderUserName || 'Unknown',
            content: messageDto.Content || messageDto.content,
            timestamp: messageDto.CreatedAt || messageDto.createdAt,
            createdAt: messageDto.CreatedAt || messageDto.createdAt,
            isRead: false,
            messageType: 'Text' as const,
            roomId: messageDto.RoomId || messageDto.roomId,
            isDeleted: messageDto.IsDeleted || messageDto.isDeleted || false,
            isEdited: messageDto.IsEdited || messageDto.isEdited || false,
            replyToMessageId: messageDto.ReplyToMessageId || messageDto.replyToMessageId,
            replyToMessage: messageDto.ReplyToMessage || messageDto.replyToMessage
          };
          
          console.log('🔄 Transformed message:', message);
          
          // Add message to current room if it belongs to the active room
          setMessages(prev => {
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
          
          // Update last message in room list
          setChatRooms(prev => prev.map(room => 
            room.roomId === message.roomId 
              ? { ...room, lastMessage: message, unreadCount: room.unreadCount + 1 }
              : room
          ));
          
          // Show notification if message is not from current user
          if (message.senderId !== currentUser.userId) {
            toast.info(`New message from ${message.senderName}`);
          }
        });

        // Listen for message deleted
        onChat('MessageDeleted', (data: { messageId: string, deletedBy: string }) => {
          console.log('🗑️ Message deleted:', data);
          setMessages(prev => prev.map(msg => 
            msg.messageId === data.messageId 
              ? { ...msg, isDeleted: true, content: '[Message deleted]' }
              : msg
          ));
        });

        // Listen for message updated
        onChat('MessageUpdated', (updatedMessageDto: any) => {
          console.log('✏️ Message updated:', updatedMessageDto);
          const updatedMessage: ChatMessage = {
            messageId: updatedMessageDto.Id || updatedMessageDto.id,
            senderId: updatedMessageDto.SenderUserId || updatedMessageDto.senderUserId,
            senderName: updatedMessageDto.SenderUserName || updatedMessageDto.senderUserName || 'Unknown',
            content: updatedMessageDto.Content || updatedMessageDto.content,
            timestamp: updatedMessageDto.CreatedAt || updatedMessageDto.createdAt,
            createdAt: updatedMessageDto.CreatedAt || updatedMessageDto.createdAt,
            isRead: false,
            messageType: 'Text' as const,
            roomId: updatedMessageDto.RoomId || updatedMessageDto.roomId,
            isDeleted: updatedMessageDto.IsDeleted || updatedMessageDto.isDeleted || false,
            isEdited: updatedMessageDto.IsEdited || updatedMessageDto.isEdited || true,
            replyToMessageId: updatedMessageDto.ReplyToMessageId || updatedMessageDto.replyToMessageId,
            replyToMessage: updatedMessageDto.ReplyToMessage || updatedMessageDto.replyToMessage
          };
          
          setMessages(prev => prev.map(msg => 
            msg.messageId === updatedMessage.messageId ? updatedMessage : msg
          ));
        });

        // Listen for user online status
        onChat('UserConnected', (user: ChatUser) => {
          setOnlineUsers(prev => {
            const filtered = prev.filter(u => u.userId !== user.userId);
            return [...filtered, { ...user, isOnline: true }];
          });
        });

        onChat('UserDisconnected', (userId: string) => {
          setOnlineUsers(prev => prev.map(user => 
            user.userId === userId ? { ...user, isOnline: false } : user
          ));
        });

        // Listen for new chat room created (support requests)
        onChat('NewChatRoomCreated', (room: ChatRoom) => {
          setChatRooms(prev => [room, ...prev]);
          toast.info(`New support request from ${room.participants[0]?.fullName}`);
        });

      } catch (error) {
        console.error('Failed to connect to ChatHub:', error);
        setIsConnected(false);
        toast.error('Failed to connect to chat service');
      }
    };

    connectToChat();
    fetchChatRooms();
    fetchOnlineUsers();

    return () => {
      disconnectChatHub();
    };
  }, []);

  // Auto scroll when new messages arrive
  useEffect(() => {
    // Only scroll if we have messages and the scroll container exists
    if (messages.length > 0 && messagesEndRef.current) {
      scrollToBottom();
    }
  }, [messages.length]); // Only depend on messages length, not the entire array

  // Fetch chat rooms (support requests, etc.)
  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      const rooms = await chatService.getAdminChatRooms();
      // Validate and sanitize room data
      const validatedRooms = rooms.filter(room => room && room.roomId).map(room => ({
        ...room,
        roomName: room.roomName || 'Unnamed Room',
        createdByUserName: room.createdByUserName || 'Unknown User',
        participants: (room.participants || []).map(p => ({
          ...p,
          fullName: p?.fullName || 'Unknown User'
        })),
        lastMessage: room.lastMessage || null,
        unreadCount: room.unreadCount || 0
      }));
      setChatRooms(validatedRooms);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      toast.error('Failed to load chat rooms');
      setChatRooms([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch online users
  const fetchOnlineUsers = async () => {
    try {
      const users = await chatService.getOnlineUsers();
      // Validate and sanitize user data
      const validatedUsers = (users || []).map(user => ({
        ...user,
        fullName: user?.fullName || 'Unknown User'
      }));
      setOnlineUsers(validatedUsers);
    } catch (error) {
      console.error('Error fetching online users:', error);
      setOnlineUsers([]); // Set empty array on error
    }
  };

  // Fetch messages for a room
  const fetchMessages = async (roomId: string) => {
    try {
      const messages = await chatService.getRoomMessages(roomId);
      // Debug: Log messages để kiểm tra cấu trúc
      console.log('Fetched messages:', messages);
      if (messages.length > 0) {
        console.log('First message structure:', JSON.stringify(messages[0], null, 2));
      }
      // Đảm bảo messages luôn là array
      setMessages(Array.isArray(messages) ? messages : []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      setMessages([]); // Set empty array on error
    }
  };

  // Select a chat room
  const selectRoom = async (room: ChatRoom) => {
    try {
      // Leave previous room if any
      if (activeRoom) {
        await leaveChatRoom(activeRoom.roomId);
      }
      
      setActiveRoom(room);
      activeRoomRef.current = room; // Update ref for SignalR handlers
      
      // Join the new room via SignalR
      await joinChatRoom(room.roomId);
      console.log(`Joined SignalR room: ${room.roomId}`);
      
      await fetchMessages(room.roomId);
      
      // Mark messages as read
      try {
        await chatService.markMessagesAsRead(room.roomId);
        setChatRooms(prev => prev.map(r => 
          r.roomId === room.roomId ? { ...r, unreadCount: 0 } : r
        ));
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error selecting room:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom) return;

    const messageData = {
      roomId: activeRoom.roomId,
      content: newMessage,
      messageType: 'Text' as const,
      replyToMessageId: replyingTo?.messageId // Add reply support
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
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest'
          });
        }
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
      setMessages(prev => prev.map(msg => 
        msg.messageId === messageId 
          ? { ...msg, isDeleted: true, content: '[Message deleted]' }
          : msg
      ));
      
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
      const updatedMessage = await chatService.updateMessage(editingMessage.messageId, editingContent);
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.messageId === editingMessage.messageId 
          ? { ...msg, content: updatedMessage.content, isEdited: true }
          : msg
      ));
      
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
  const filteredRooms = chatRooms.filter(room =>
    room.createdByUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.roomName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.participants?.some(p => p.fullName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Sidebar - Chat Rooms */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Admin Chat
            </CardTitle>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading chat rooms...
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No chat rooms found
              </div>
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
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={room.participants[0]?.avatar} />
                            <AvatarFallback>
                              {(room.createdByUserName || room.participants[0]?.fullName || 'U')?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {room.participants[0]?.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">
                              {room.createdByUserName || room.participants[0]?.fullName || 'Unknown User'}
                            </p>
                            {room.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {room.unreadCount}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {room.participants[0]?.role || 'User'}
                            </Badge>
                            {room.roomType === 'Support' && (
                              <Badge variant="secondary" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Support
                              </Badge>
                            )}
                          </div>
                          
                          {room.lastMessage && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {room.lastMessage.content}
                            </p>
                          )}
                          
                          <p className="text-xs text-muted-foreground mt-1">
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
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activeRoom.participants[0]?.avatar} />
                      <AvatarFallback>
                        {(activeRoom.createdByUserName || activeRoom.participants[0]?.fullName || 'U')?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-semibold">
                        {activeRoom.createdByUserName || activeRoom.participants[0]?.fullName || 'Unknown User'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className={`w-2 h-2 rounded-full ${
                          activeRoom.participants[0]?.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        {activeRoom.participants[0]?.isOnline ? 'Online' : 'Offline'}
                        {activeRoom.participants[0]?.lastSeen && !activeRoom.participants[0]?.isOnline && (
                          <span>• Last seen {formatTime(activeRoom.participants[0].lastSeen)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {activeRoom.participants[0]?.role || 'User'}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messages Area */}
            <Card className="flex-1 flex flex-col">
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-20rem)] p-4">
                  <AnimatePresence>
                    {(Array.isArray(messages) ? messages : []).map((message, index) => {
                      const isOwnMessage = message.senderId === currentUser.userId;
                      const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId;
                      // Tạo key duy nhất - kết hợp messageId và index để đảm bảo không duplicate
                      const uniqueKey = message.messageId ? `${message.messageId}-${index}` : `msg-${index}-${Date.now()}`;
                      
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
                                {message.senderName?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!showAvatar && !isOwnMessage && <div className="w-8" />}
                          
                          <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col group relative`}>
                            {showAvatar && (
                              <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                                <span className="text-sm font-medium">{message.senderName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(message.timestamp || (message as any).createdAt)}
                                </span>
                              </div>
                            )}
                            
                            {/* Show reply preview if this is a reply */}
                            {message.replyToMessage && (
                              <div className={`text-xs mb-2 p-2 rounded bg-muted/50 border-l-2 border-muted-foreground/30 ${
                                isOwnMessage ? 'mr-2' : 'ml-2'
                              }`}>
                                <div className="font-medium">{message.replyToMessage.senderName}</div>
                                <div className="truncate opacity-70">{message.replyToMessage.content}</div>
                              </div>
                            )}
                            
                            {editingMessage?.messageId === message.messageId ? (
                              /* Edit mode */
                              <div className={`w-full rounded-lg px-3 py-2 bg-background border ${
                                isOwnMessage ? 'mr-2' : 'ml-2'
                              }`}>
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
                                  className="border-none p-0 focus-visible:ring-0"
                                  autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                                    Cancel
                                  </Button>
                                  <Button size="sm" onClick={saveEditedMessage}>
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              /* Normal message display */
                              <div className="relative">
                                <div
                                  className={`rounded-lg px-3 py-2 max-w-full break-words ${
                                    message.isDeleted 
                                      ? 'bg-muted/50 text-muted-foreground italic'
                                      : isOwnMessage
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                  }`}
                                >
                                  {message.content}
                                  {message.isEdited && !message.isDeleted && (
                                    <span className="text-xs opacity-70 ml-2">(edited)</span>
                                  )}
                                </div>
                                
                                {/* Message options dropdown */}
                                {!message.isDeleted && (
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
                                    <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                                      <DropdownMenuItem onClick={() => handleReplyToMessage(message)}>
                                        <Reply className="h-4 w-4 mr-2" />
                                        Reply
                                      </DropdownMenuItem>
                                      {isOwnMessage && (
                                        <>
                                          <DropdownMenuItem onClick={() => handleEditMessage(message)}>
                                            <Edit3 className="h-4 w-4 mr-2" />
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            onClick={() => handleDeleteMessage(message.messageId)}
                                            className="text-destructive"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
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
                                <span className="text-xs text-muted-foreground">
                                  {message.isRead ? 'Read' : 'Sent'}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
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
                        <div className="text-sm font-medium">Replying to {replyingTo.senderName}</div>
                        <div className="text-sm text-muted-foreground truncate">{replyingTo.content}</div>
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
                    placeholder={replyingTo ? `Reply to ${replyingTo.senderName}...` : "Type your message..."}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {!isConnected && (
                  <p className="text-sm text-orange-500 mt-2">
                    Chat service is disconnected. Messages will be sent when connection is restored.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <CardContent className="text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a chat room from the sidebar to start messaging
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Sidebar - Online Users */}
      <Card className="w-64">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Online Users ({onlineUsers.filter(u => u.isOnline).length})
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="space-y-2 p-2">
              {onlineUsers.filter(user => user.isOnline).map((user, index) => (
                <div
                  key={user.userId || `user-${index}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.fullName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.fullName}</p>
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {onlineUsers.filter(u => u.isOnline).length === 0 && (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No users online
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

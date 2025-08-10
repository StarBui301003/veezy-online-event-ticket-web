

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from './axios.customize';
import { isCurrentUserAdmin } from '@/utils/admin-utils';

// Types
export interface ChatUser {
  userId: string;
  username: string;
  fullName: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
  role: 'Customer' | 'EventManager' | 'Admin';
}

export interface ChatMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  createdAt: string; // Backend field name
  isRead: boolean;
  messageType: 'Text' | 'Image' | 'File';
  attachmentUrl?: string;
  roomId?: string; // Add roomId for SignalR messages
  isDeleted?: boolean; // For soft delete
  isEdited?: boolean; // For edited messages
  replyToMessageId?: string; // For reply functionality
  replyToMessage?: ChatMessage; // The message being replied to
}

export interface ChatRoom {
  roomId: string;
  roomName: string;
  participants: ChatUser[];
  lastMessage?: ChatMessage;
  lastMessageAt?: string; // Thêm field để sắp xếp theo hoạt động gần nhất
  unreadCount: number;
  roomType: 'Direct' | 'Group' | 'Support';
  createdAt: string;
  createdByUserId?: string;
  createdByUserName?: string;
  mode?: 'ai' | 'human'; // Add mode for AI/Human support
}

// Backend DTO interface for mapping
interface ChatRoomResponseDto {
  id: string;
  name: string;
  participants: ChatParticipantDto[];
  lastMessage?: ChatMessage;
  lastMessageAt?: string; // Thêm field cho backend
  unreadCount: number;
  type: 'Direct' | 'Group' | 'Support';
  createdAt: string;
  createdByUserId: string;
  createdByUserName: string;
  mode?: string | number; // Support cả string và number từ backend
}

// DTO interface for admin chat rooms
interface ChatRoomWithUserRoleDto {
  roomId: string;
  roomName: string;
  participants: ChatParticipantWithRoleDto[];
  description?: string;
  createdAt: string;
  updatedAt: string;
  mode: string | number;
}

interface ChatParticipantWithRoleDto {
  userId: string;
  userName: string;
  avatarUrl?: string;
  role: string;
}

interface ChatParticipantDto {
  userId: string;
  userName: string;
  avatarUrl?: string;
  joinedAt: string;
  isOnline: boolean;
  role: string;
}

export interface CreateMessageRequest {
  roomId: string;
  content: string;
  type?: number; // Backend expects 'Type' as integer (0 = Text, 1 = Image, 2 = File)
  messageType?: 'Text' | 'Image' | 'File'; // Frontend convenience field
  attachmentUrl?: string;
  mentionedUserIds?: string[];
  attachments?: any[];
  replyToMessageId?: string;
}

export interface CreateRoomRequest {
  roomName: string;
  roomType: 'Direct' | 'Group' | 'Support';
  participantIds: string[];
}

// API Service
// Chỉ giữ lại 1 class ChatService duy nhất bên dưới (dòng 191 trở đi)

// ...existing code...

// XÓA đoạn duplicate phía trên, chỉ giữ lại class ChatService từ dòng 191 trở đi

// Types
export interface ChatUser {
  userId: string;
  username: string;
  fullName: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
  role: 'Customer' | 'EventManager' | 'Admin';
}

export interface ChatMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  createdAt: string; // Backend field name
  isRead: boolean;
  messageType: 'Text' | 'Image' | 'File';
  attachmentUrl?: string;
  roomId?: string; // Add roomId for SignalR messages
  isDeleted?: boolean; // For soft delete
  isEdited?: boolean; // For edited messages
  replyToMessageId?: string; // For reply functionality
  replyToMessage?: ChatMessage; // The message being replied to
}

export interface ChatRoom {
  roomId: string;
  roomName: string;
  participants: ChatUser[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  roomType: 'Direct' | 'Group' | 'Support';
  createdAt: string;
  createdByUserId?: string;
  createdByUserName?: string;
}

// Backend DTO interface for mapping
interface ChatRoomResponseDto {
  id: string;
  name: string;
  participants: ChatParticipantDto[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  type: 'Direct' | 'Group' | 'Support';
  createdAt: string;
  createdByUserId: string;
  createdByUserName: string;
}

interface ChatParticipantDto {
  userId: string;
  userName: string;
  avatarUrl?: string;
  joinedAt: string;
  isOnline: boolean;
  role: string;
}

export interface CreateMessageRequest {
  roomId: string;
  content: string;
  type?: number; // Backend expects 'Type' as integer (0 = Text, 1 = Image, 2 = File)
  messageType?: 'Text' | 'Image' | 'File'; // Frontend convenience field
  attachmentUrl?: string;
  mentionedUserIds?: string[];
  attachments?: any[];
  replyToMessageId?: string;
}

export interface CreateRoomRequest {
  roomName: string;
  roomType: 'Direct' | 'Group' | 'Support';
  participantIds: string[];
}

// API Service
class ChatService {
  // Chuyển mode phòng chat (AI/Human)
  async switchRoomMode(roomId: string, mode: 'AI' | 'Human'): Promise<any> {
    try {
      // ONLY use HTTP API - SignalR broadcast will be handled by backend controller
      console.log('[ChatService] Switching room mode via HTTP API:', roomId, mode);
      const response = await axios.put(`/api/ChatRoom/${roomId}/mode`, JSON.stringify(mode), {
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log('[ChatService] Room mode switch successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[ChatService] Error switching room mode:', error);
      // Ưu tiên trả về message rõ ràng nếu có
      const msg = error?.response?.data?.message || error?.message || 'Failed to switch mode';
      throw new Error(msg);
    }
  }
  // Sử dụng Gateway thay vì gọi trực tiếp tới ChatService
  // Chỉ SignalR mới gọi trực tiếp tới service (port 5007)

  // Transform backend DTO to frontend interface
  private transformChatRoom(dto: ChatRoomResponseDto): ChatRoom {
    // Xử lý mode từ backend - có thể là string hoặc number
    let mode: 'ai' | 'human' = 'ai';
    if (dto.mode !== undefined && dto.mode !== null) {
      if (typeof dto.mode === 'string') {
        mode = dto.mode.toLowerCase() === 'human' ? 'human' : 'ai';
      } else if (typeof dto.mode === 'number') {
        mode = dto.mode === 1 ? 'human' : 'ai';
      }
    }
    
    return {
      roomId: dto.id, // Fix: Always use dto.id as roomId (backend returns id field)
      roomName: dto.name,
      participants: dto.participants.map(p => ({
        userId: p.userId,
        username: p.userName,
        fullName: p.userName, // Use userName as fullName if not available
        avatarUrl: p.avatarUrl,
        isOnline: p.isOnline,
        role: (p.role as 'Customer' | 'EventManager' | 'Admin') || 'Customer'
      })),
      lastMessage: dto.lastMessage,
      lastMessageAt: dto.lastMessageAt, // Map LastMessageAt từ backend
      unreadCount: dto.unreadCount,
      roomType: dto.type,
      createdAt: dto.createdAt,
      createdByUserId: dto.createdByUserId,
      createdByUserName: dto.createdByUserName,
      mode: mode,
    };
  }

  // Transform ChatRoomWithUserRoleDto (for admin rooms) to frontend interface
  private transformAdminChatRoom(dto: ChatRoomWithUserRoleDto): ChatRoom {
    // Xử lý mode từ backend - có thể là string hoặc number
    let mode: 'ai' | 'human' = 'ai';
    if (dto.mode !== undefined && dto.mode !== null) {
      if (typeof dto.mode === 'string') {
        mode = dto.mode.toLowerCase() === 'human' ? 'human' : 'ai';
      } else if (typeof dto.mode === 'number') {
        mode = dto.mode === 1 ? 'human' : 'ai';
      }
    }
    
    console.log('[transformAdminChatRoom] DTO:', dto);
    
    const transformedParticipants = dto.participants.map(p => ({
      userId: p.userId,
      username: p.userName,
      fullName: p.userName, // Use userName as fullName
      avatarUrl: p.avatarUrl,
      isOnline: false, // Admin rooms don't have real-time online status
      role: (p.role as 'Customer' | 'EventManager' | 'Admin') || 'Customer'
    }));
    
    const createdByUserName = transformedParticipants.find(p => p.role !== 'Admin')?.fullName || 
                             transformedParticipants[0]?.fullName || 
                             undefined;
    
    console.log('[transformAdminChatRoom] createdByUserName:', createdByUserName);
    
    return {
      roomId: dto.roomId, // Use roomId field from ChatRoomWithUserRoleDto
      roomName: dto.roomName, // Use roomName field from ChatRoomWithUserRoleDto
      participants: transformedParticipants,
      lastMessage: undefined, // Admin rooms don't return lastMessage initially
      lastMessageAt: undefined, // Admin rooms don't return lastMessageAt initially
      unreadCount: 0, // Admin rooms don't return unreadCount initially
      roomType: 'Support', // Admin rooms are always Support type
      createdAt: dto.createdAt,
      createdByUserId: undefined, // Not provided in ChatRoomWithUserRoleDto
      // Try to get user name from first non-admin participant or fallback to first participant
      createdByUserName: createdByUserName,
      mode: mode,
    };
  }

  // Create chat with admin (for customers)
  async createChatWithAdmin(): Promise<ChatRoom> {
    try {
      console.log('[ChatService] Creating chat with admin - API call starting...');
      const response = await axios.post('/api/ChatRoom/admin-chat');
      console.log('[ChatService] Chat with admin created successfully:', response.data);
      return this.transformChatRoom(response.data);
    } catch (error) {
      console.error('[ChatService] Error creating chat with admin:', error);
      throw error;
    }
  }

  // Get admin chat rooms (admin only)
  async getAdminChatRooms(): Promise<ChatRoom[]> {
    try {
      // Check if user is admin before making the call
      if (!isCurrentUserAdmin()) {
        console.warn('User is not admin, cannot fetch admin chat rooms');
        return [];
      }

      console.log('[ChatService] Fetching admin chat rooms from /api/ChatRoom/admin/user-admin-rooms');
      const response = await axios.get('/api/ChatRoom/admin/user-admin-rooms');
      console.log('[ChatService] Successfully fetched admin chat rooms:', response.data?.length || 0, 'rooms');
      
      const rooms: ChatRoomWithUserRoleDto[] = response.data;
      
      return rooms.map(room => this.transformAdminChatRoom(room));
    } catch (error: any) {
      console.error('Error fetching admin chat rooms:', error);
      
      // If 404 or 403, it means user doesn't have permission
      if (error.response?.status === 404 || error.response?.status === 403) {
        console.warn('Access denied to admin chat rooms - user may not be admin');
        return [];
      }
      
      throw error;
    }
  }

  // Get all chat rooms for current user
  async getChatRooms(userId: string): Promise<ChatRoom[]> {
    try {
      const response = await axios.get(`/api/ChatRoom/user/${userId}`);
      const rooms: ChatRoomResponseDto[] = response.data;
      return rooms.map(room => this.transformChatRoom(room));
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      throw error;
    }
  }

  // Get messages for a specific room
  async getRoomMessages(roomId: string, page: number = 1, limit: number = 50): Promise<ChatMessage[]> {
    try {
      console.log('Fetching messages for roomId:', roomId);
      
      if (!roomId || roomId === 'undefined') {
        console.error('Invalid roomId provided to getRoomMessages:', roomId);
        throw new Error('Room ID is required');
      }
      
      const response = await axios.get(`/api/ChatMessage/room/${roomId}`, {
        params: { page, pageSize: limit }
      });

      // Debug: Log raw response
      console.log('Raw API response:', response.data);

      // Backend trả về PaginatedResponseDto với Items property
      const items = response.data.items || response.data.Items || [];

      // Map backend DTO to frontend interface
      const messages = items.map((item: any) => ({
        messageId: item.id || item.Id,
        senderId: item.senderUserId || item.SenderUserId,
        senderName: item.senderUserName || item.SenderUserName || 'Unknown',
        content: item.content || item.Content || '',
        timestamp: item.createdAt || item.CreatedAt,
        createdAt: item.createdAt || item.CreatedAt,
        isRead: false, // Tạm thời set false
        messageType: 'Text' as const,
        attachmentUrl: undefined,
        isDeleted: item.isDeleted || item.IsDeleted || false,
        isEdited: item.isEdited || item.IsEdited || false,
        replyToMessageId: item.replyToMessageId || item.ReplyToMessageId,
        replyToMessage: item.replyToMessage || item.ReplyToMessage
      }));

      console.log('Mapped messages:', messages);
      return messages;
    } catch (error) {
      console.error('Error fetching room messages:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(messageData: CreateMessageRequest): Promise<ChatMessage> {
    try {
      // Transform frontend request to backend DTO format
      const backendDto = {
        roomId: messageData.roomId,
        content: messageData.content,
        type: this.getMessageTypeAsNumber(messageData.messageType || 'Text'),
        mentionedUserIds: messageData.mentionedUserIds || [],
        attachments: messageData.attachments || [],
        replyToMessageId: messageData.replyToMessageId || undefined
        // SenderUserId will be set by the backend from JWT token
      };

      console.log('Sending message with payload:', backendDto);
      const response = await axios.post('/api/ChatMessage', backendDto);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Helper method to convert message type to number
  private getMessageTypeAsNumber(messageType: 'Text' | 'Image' | 'File'): number {
    switch (messageType) {
      case 'Text': return 0;
      case 'Image': return 1;
      case 'File': return 2;
      default: return 0;
    }
  }

  // Create a new chat room
  async createChatRoom(roomData: CreateRoomRequest): Promise<ChatRoom> {
    try {
      const response = await axios.post('/api/chat/rooms', roomData);
      return response.data;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  // Get online users (admin only)
  async getOnlineUsers(): Promise<ChatUser[]> {
    try {
      // Check if user is admin before making the call
      if (!isCurrentUserAdmin()) {
        console.warn('User is not admin, cannot fetch online users');
        return [];
      }

      const response = await axios.get('/api/chat/admin/online-users');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching online users:', error);
      
      // If 404 or 403, it means user doesn't have permission
      if (error.response?.status === 404 || error.response?.status === 403) {
        console.warn('Access denied to online users - user may not be admin');
        return [];
      }
      
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(roomId: string): Promise<void> {
    try {
      // Validate roomId before making request
      if (!roomId || roomId === 'undefined') {
        console.warn('Invalid roomId provided to markMessagesAsRead:', roomId);
        return;
      }
      
      await axios.post(`/api/chat/rooms/${roomId}/mark-read`);
      console.log('Messages marked as read for room:', roomId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      // Don't throw error - this is not critical for chat functionality
    }
  }

  // Get chat room by ID
  async getChatRoom(roomId: string): Promise<ChatRoom> {
    try {
      const response = await axios.get(`/api/ChatRoom/${roomId}`);
      return this.transformChatRoom(response.data);
    } catch (error) {
      console.error('Error fetching chat room:', error);
      throw error;
    }
  }

  // Search users (for creating new chat rooms) - TODO: Implement endpoint
  async searchUsers(_query: string): Promise<ChatUser[]> {
    try {
      // Temporarily return empty array until endpoint is implemented
      console.warn('Search users endpoint not yet implemented');
      return [];
      // const response = await axios.get('/api/chat/users/search', {
      //   params: { query }
      // });
      // return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Delete a message (admin only)
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await axios.delete(`/api/ChatMessage/${messageId}`);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Update a message
  async updateMessage(messageId: string, content: string): Promise<ChatMessage> {
    try {
      const response = await axios.put(`/api/ChatMessage/${messageId}`, {
        content: content
      });
      return response.data;
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }

  // AI Chat functions
  async processAIChat(roomId: string, message: string, eventId?: string): Promise<any> {
    try {
      const response = await axios.post('/api/ChatMessage/ai-chat', { 
        question: message, // Backend expects 'Question' field
        roomId: roomId,    // Backend expects 'RoomId' field
        eventId: eventId   // Backend expects 'EventId' field (optional)
      });
      return response.data;
    } catch (error) {
      console.error('Error processing AI chat:', error);
      throw error;
    }
  }

  // Process AI chat stream
  async processAIChatStream(roomId: string, message: string, eventId?: string): Promise<Response> {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${axios.defaults.baseURL}/api/ChatMessage/ai-chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          question: message, // Backend expects 'Question' field
          roomId: roomId,    // Backend expects 'RoomId' field
          eventId: eventId   // Backend expects 'EventId' field (optional)
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error('Error processing AI chat stream:', error);
      throw error;
    }
  }

  // Simple AI chat for customer support (no roomId)
  async processSimpleAIChat(message: string, eventId?: string): Promise<string> {
    try {
      console.log('💬 Processing simple AI chat:', message, eventId ? `(eventId: ${eventId})` : '');
      
      const response = await axios.get('/api/AiChat/simple-chat', {
        params: {
          question: message,
          eventId: eventId
        }
      });

      console.log('✅ Simple AI chat response:', response.data);

      const aiResponse = response.data.response || response.data.content || response.data.message || response.data.answer;
      
      if (!aiResponse) {
        console.warn('⚠️ No valid AI response found in:', response.data);
        return 'Xin lỗi, tôi không thể trả lời câu hỏi này lúc này.';
      }

      return aiResponse;
    } catch (error: any) {
      console.error('❌ Error processing simple AI chat:', error);
      console.error('Response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(errorMessage || 'Không thể kết nối tới AI Assistant. Vui lòng thử lại sau.');
    }
  }

  // AI Chat Integration Methods




  // Helper methods for data transformation
  private transformBackendRoomToFrontend(backendRoom: any): ChatRoom {
    // Xử lý mode từ backend - có thể là string hoặc number
    let mode: 'ai' | 'human' = 'ai';
    if (backendRoom.mode !== undefined && backendRoom.mode !== null) {
      if (typeof backendRoom.mode === 'string') {
        mode = backendRoom.mode.toLowerCase() === 'human' ? 'human' : 'ai';
      } else if (typeof backendRoom.mode === 'number') {
        mode = backendRoom.mode === 1 ? 'human' : 'ai';
      }
    }
    
    return {
      roomId: backendRoom.id, // Fix: Always use id field from backend
      roomName: backendRoom.name,
      participants: (backendRoom.participants || []).map((p: any) => ({
        userId: p.userId,
        username: p.userName || p.username,
        fullName: p.userName || p.fullName || p.username,
        avatar: p.avatarUrl || p.avatar,
        isOnline: p.isOnline || false,
        role: (p.role as 'Customer' | 'EventManager' | 'Admin') || 'Customer'
      })),
      lastMessage: backendRoom.lastMessage,
      lastMessageAt: backendRoom.lastMessageAt, // Map LastMessageAt từ backend
      unreadCount: backendRoom.unreadCount || 0,
      roomType: backendRoom.type || backendRoom.roomType || 'Support',
      createdAt: backendRoom.createdAt,
      createdByUserId: backendRoom.createdByUserId,
      createdByUserName: backendRoom.createdByUserName,
      mode: mode
    };
  }

  // Note: This method was used for backend message transformation but is currently unused
  // private transformBackendMessageToFrontend(backendMessage: any): ChatMessage {
  //   return {
  //     messageId: backendMessage.id || backendMessage.messageId,
  //     senderId: backendMessage.senderUserId || backendMessage.senderId,
  //     senderName: backendMessage.senderName || 'AI Assistant',
  //     content: backendMessage.content,
  //     timestamp: backendMessage.createdAt || backendMessage.timestamp,
  //     createdAt: backendMessage.createdAt,
  //     isRead: backendMessage.isRead || false,
  //     messageType: backendMessage.type || 'Text',
  //     attachmentUrl: backendMessage.attachmentUrl,
  //     roomId: backendMessage.roomId,
  //     isDeleted: backendMessage.isDeleted || false,
  //     isEdited: backendMessage.isEdited || false,
  //     replyToMessageId: backendMessage.replyToMessageId
  //   };
  // }

  // Get chat statistics (admin only)
  async getChatStatistics(): Promise<any> {
    try {
      const response = await axios.get('/api/chat/admin/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching chat statistics:', error);
      throw error;
    }
  }

  // Upload attachment
  async uploadAttachment(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.url;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  }

  // Create user-event manager chat room
  async createUserEventManagerRoom(eventId: string): Promise<ChatRoom> {
    try {
      const response = await axios.post(`/api/chatroom/User-EventManager`, { eventId });
      console.log('Raw backend response:', response.data);
      
      return this.transformBackendRoomToFrontend(response.data);
    } catch (error) {
      console.error('Error creating user-event manager room:', error);
      throw error;
    }
  }

  // Get event manager chat rooms
  async getEventManagerChatRooms(): Promise<ChatRoom[]> {
    try {
      const response = await axios.get('/api/ChatRoom/eventmanager/rooms');
      const rooms = response.data;
      
      return rooms.map((room: any) => ({
        roomId: room.roomId,
        roomName: room.roomName,
        participants: room.participants.map((p: any) => ({
          userId: p.userId,
          username: p.userName,
          fullName: p.userName,
          avatarUrl: p.avatarUrl,
          isOnline: false, // Will be updated via SignalR
          role: p.role as 'Customer' | 'EventManager' | 'Admin'
        })),
        lastMessage: undefined, // Will be loaded separately
        unreadCount: 0, // Will be calculated
        roomType: 'Support' as const,
        createdAt: room.createdAt,
        createdByUserId: room.participants[0]?.userId,
        createdByUserName: room.participants[0]?.userName
      }));
    } catch (error) {
      console.error('Error fetching event manager chat rooms:', error);
      throw error;
    }
  }

  // Get all event chat rooms (for specific event)
  async getEventChatRooms(eventId: string): Promise<ChatRoom[]> {
    try {
      const response = await axios.get(`/api/ChatRoom/event/${eventId}`);
      // Support multiple response shapes: direct array, { data: [...] }, { items: [...] }, ApiResponse wrapper
      const raw = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.items)
        ? response.data.items
        : Array.isArray(response.data?.data?.items)
        ? response.data.data.items
        : [];

      // Use robust transformer that tolerates varying backend field names
      return raw.map((room: any) => this.transformBackendRoomToFrontend(room));
    } catch (error) {
      console.error('Error fetching event chat rooms:', error);
      // Fallback: if backend validation or environment causes failure, try global EM rooms
      try {
        const fallbackResp = await axios.get(`/api/ChatRoom/event/event-manager-global`);
        const raw = Array.isArray(fallbackResp.data)
          ? fallbackResp.data
          : Array.isArray(fallbackResp.data?.data)
          ? fallbackResp.data.data
          : Array.isArray(fallbackResp.data?.items)
          ? fallbackResp.data.items
          : Array.isArray(fallbackResp.data?.data?.items)
          ? fallbackResp.data.data.items
          : [];
        return raw.map((room: any) => this.transformBackendRoomToFrontend(room));
      } catch (fallbackErr) {
        console.error('Fallback load of event-manager-global rooms also failed:', fallbackErr);
        throw error;
      }
    }
  }

  // Get event chat room (for specific event) - legacy method for backward compatibility
  async getEventChatRoom(eventId: string): Promise<ChatRoom[]> {
    return this.getEventChatRooms(eventId);
  }

  // Check access to event chat room
  async checkEventChatRoomAccess(eventId: string): Promise<boolean> {
    try {
      const response = await axios.get(`/api/ChatRoom/event/${eventId}/access`);
      return response.data;
    } catch (error) {
      console.error('Error checking event chat room access:', error);
      return false;
    }
  }
}


export const chatService = new ChatService();
export default chatService;

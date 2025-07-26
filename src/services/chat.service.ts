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
  // Sử dụng Gateway thay vì gọi trực tiếp tới ChatService
  // Chỉ SignalR mới gọi trực tiếp tới service (port 5007)

  // Transform backend DTO to frontend interface
  private transformChatRoom(dto: ChatRoomResponseDto): ChatRoom {
    return {
      roomId: dto.id,
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
      unreadCount: dto.unreadCount,
      roomType: dto.type,
      createdAt: dto.createdAt,
      createdByUserId: dto.createdByUserId,
      createdByUserName: dto.createdByUserName
    };
  }

  // Create chat with admin (for customers)
  async createChatWithAdmin(): Promise<ChatRoom> {
    try {
      const response = await axios.post('/api/ChatRoom/admin-chat');
      return this.transformChatRoom(response.data);
    } catch (error) {
      console.error('Error creating chat with admin:', error);
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

      const response = await axios.get('/api/chat/admin/rooms');
      const rooms: ChatRoomResponseDto[] = response.data;
      return rooms.map(room => this.transformChatRoom(room));
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
      
      if (!roomId) {
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
  async createOrGetAIChatRoom(): Promise<{ roomId: string; isNewRoom: boolean }> {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
      console.log('🔑 Creating AI chat room with token:', token ? 'Present' : 'Missing');
      
      const response = await axios.post('/api/AiChat/create-room', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      console.log('✅ AI room created/retrieved:', response.data);
      
      return {
        roomId: response.data.roomId || response.data.id,
        isNewRoom: response.data.isNewRoom !== undefined ? response.data.isNewRoom : true
      };
    } catch (error: any) {
      console.error('❌ Error creating AI chat room:', error);
      console.error('Response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Không thể tạo phòng chat AI.');
    }
  }

  async sendAIMessage(roomId: string, message: string): Promise<{ content: string; messageId: string }> {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
      console.log('🤖 Sending AI message to room:', roomId, 'Message:', message);
      
      const response = await axios.post('/api/AiChat/send-message', {
        roomId: roomId,
        message: message
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      console.log('✅ AI message sent, response:', response.data);

      return {
        content: response.data.content || response.data.message || response.data.response || 'AI response received',
        messageId: response.data.messageId || response.data.id || Date.now().toString()
      };
    } catch (error: any) {
      console.error('❌ Error sending AI message:', error);
      console.error('Response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Không thể gửi tin nhắn tới AI.');
    }
  }

  async transferAIToAdmin(aiRoomId: string): Promise<{ roomId: string; adminRoomId: string }> {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
      console.log('🔄 Transferring AI to admin, roomId:', aiRoomId);
      
      const response = await axios.post(`/api/AiChat/transfer-to-admin/${aiRoomId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      console.log('✅ Transfer to admin successful:', response.data);

      return {
        roomId: response.data.roomId || aiRoomId,
        adminRoomId: response.data.adminRoomId || response.data.roomId
      };
    } catch (error: any) {
      console.error('❌ Error transferring AI to admin:', error);
      console.error('Response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Không thể chuyển chat sang admin.');
    }
  }

  async getLinkedAdminRoom(aiRoomId: string): Promise<ChatRoom | null> {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`/api/ChatRoom/ai/linked-admin-room/${aiRoomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      return response.data ? this.transformBackendRoomToFrontend(response.data) : null;
    } catch (error) {
      console.error('Error getting linked admin room:', error);
      return null;
    }
  }

  // Helper methods for data transformation
  private transformBackendRoomToFrontend(backendRoom: any): ChatRoom {
    return {
      roomId: backendRoom.id || backendRoom.roomId,
      roomName: backendRoom.name || backendRoom.roomName,
      participants: (backendRoom.participants || []).map((p: any) => ({
        userId: p.userId,
        username: p.userName || p.username,
        fullName: p.userName || p.fullName || p.username,
        avatar: p.avatarUrl || p.avatar,
        isOnline: p.isOnline || false,
        role: (p.role as 'Customer' | 'EventManager' | 'Admin') || 'Customer'
      })),
      lastMessage: backendRoom.lastMessage,
      unreadCount: backendRoom.unreadCount || 0,
      roomType: backendRoom.type || backendRoom.roomType || 'Support',
      createdAt: backendRoom.createdAt,
      createdByUserId: backendRoom.createdByUserId,
      createdByUserName: backendRoom.createdByUserName
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
}

export const chatService = new ChatService();
export default chatService;

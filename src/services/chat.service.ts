/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from './axios.customize';

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

  // Get admin chat rooms
  async getAdminChatRooms(): Promise<ChatRoom[]> {
    try {
      const response = await axios.get('/api/chat/admin/rooms');
      const rooms: ChatRoomResponseDto[] = response.data;
      return rooms.map(room => this.transformChatRoom(room));
    } catch (error) {
      console.error('Error fetching admin chat rooms:', error);
      throw error;
    }
  }

  // Get all chat rooms for current user
  async getChatRooms(): Promise<ChatRoom[]> {
    try {
      const response = await axios.get('/api/chat/rooms');
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
      const response = await axios.get(`/api/chat/rooms/${roomId}/messages`, {
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
        RoomId: messageData.roomId,
        Content: messageData.content,
        Type: this.getMessageTypeAsNumber(messageData.messageType || 'Text'),
        MentionedUserIds: messageData.mentionedUserIds || [],
        Attachments: messageData.attachments || [],
        ReplyToMessageId: messageData.replyToMessageId || null
        // SenderUserId will be set by the backend from JWT token
      };

      console.log('Sending message with payload:', backendDto);
      const response = await axios.post('/api/chat/messages', backendDto);
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
      const response = await axios.get('/api/chat/admin/online-users');
      return response.data;
    } catch (error) {
      console.error('Error fetching online users:', error);
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
      const response = await axios.get(`/api/chat/rooms/${roomId}`);
      return response.data;
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
      await axios.delete(`/api/chat/messages/${messageId}`);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Update a message
  async updateMessage(messageId: string, content: string): Promise<ChatMessage> {
    try {
      const response = await axios.put(`/api/chat/messages/${messageId}`, {
        content: content
      });
      return response.data;
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }

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
}

export const chatService = new ChatService();
export default chatService;

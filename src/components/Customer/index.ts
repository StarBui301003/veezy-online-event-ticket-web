// Customer Chat Components
export { CustomerChatBox } from './CustomerChatBox';

// Custom hooks
export { useCustomerChat } from '../../hooks/use-customer-chat';

// Re-export chat service types for convenience
export type { 
  ChatMessage, 
  ChatRoom, 
  CreateMessageRequest,
  CreateRoomRequest,
  ChatUser 
} from '../../services/chat.service';

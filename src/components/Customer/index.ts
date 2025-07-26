// Customer Chat Components
export { CustomerChatBox } from './CustomerChatBox';
export { AICustomerChatBox } from './AICustomerChatBox';
export { CustomerSupport } from './CustomerSupport';
export { UnifiedCustomerChat } from './UnifiedCustomerChat';
export { EventChatAssistant } from './EventChatAssistant';
export { EventManagerChatBox } from './EventManagerChatBox';

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

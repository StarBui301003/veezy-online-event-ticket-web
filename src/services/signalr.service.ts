/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';

export let connections: Record<string, HubConnection | null> = {
  notification: null,
  event: null,
  ticket: null,
  feedback: null,
  identity: null,
  news: null,
  comment: null,
  analytics: null, // Thêm analytics
  fund: null, // Thêm fund để fix lỗi kết nối FundHub
  chat: null, // Thêm chat hub
  order: null, // Thêm order hub
  payment: null, // Thêm payment hub
};

export function connectHub(hubType: keyof typeof connections, hubUrl: string, accessToken?: string) {
  if (!hubUrl) {
    return Promise.reject(new Error('The "url" argument is required for connectHub'));
  }
  
  // Check if connection already exists and is connected
  if (connections[hubType]) {
    const currentState = connections[hubType]?.state;
    if (currentState === 'Connected') {
      console.log(`[SignalR] ${hubType} hub already connected`);
      return Promise.resolve();
    }
    if (currentState === 'Connecting') {
      console.log(`[SignalR] ${hubType} hub already connecting, waiting...`);
      // Return a promise that resolves when connection is established
      return new Promise((resolve, reject) => {
        const connection = connections[hubType];
        if (!connection) {
          reject(new Error('Connection lost during wait'));
          return;
        }
        
        const onConnected = () => {
          connection.off('onconnect', onConnected);
          connection.off('onclose', onError);
          resolve(undefined);
        };
        
        const onError = (error?: Error) => {
          connection.off('onconnect', onConnected);
          connection.off('onclose', onError);
          reject(error || new Error('Connection failed'));
        };
        
        connection.on('onconnect', onConnected);
        connection.on('onclose', onError);
        
        // Check if already connected (race condition)
        if (connection.state === 'Connected') {
          onConnected();
        }
      });
    }
    // If connection exists but not connected, disconnect and reconnect
    console.log(`[SignalR] ${hubType} hub in state ${currentState}, reconnecting...`);
    connections[hubType]?.stop();
    connections[hubType] = null;
  }
  
  console.log(`[SignalR] Creating new ${hubType} hub connection...`);
  
  // For ChatHub, use query string for token (required by backend configuration)
  let finalUrl = hubUrl;
  let connectionOptions: any = undefined;
  
  if (accessToken) {
    if (hubType === 'chat' || hubType === 'notification') {
      // ChatHub and NotificationHub require token in query string (configured in backend)
      const separator = hubUrl.includes('?') ? '&' : '?';
      finalUrl = `${hubUrl}${separator}access_token=${encodeURIComponent(accessToken)}`;
      console.log(`[SignalR] ${hubType} hub URL with token: ${finalUrl}`);
    } else {
      // Other hubs use Authorization header
      connectionOptions = { accessTokenFactory: () => accessToken };
      console.log(`[SignalR] ${hubType} hub using Authorization header with token`);
    }
  } else {
    console.log(`[SignalR] No access token provided for ${hubType} hub`);
  }
  
  const connection = new HubConnectionBuilder()
    .withUrl(finalUrl, connectionOptions)
    .configureLogging(LogLevel.Information)
    .withAutomaticReconnect()
    .build();
    
  // Add debug logging for all incoming messages (for chat and notification hubs)
  if (hubType === 'chat' || hubType === 'notification') {
    const originalOnMethod = connection.on.bind(connection);
    connection.on = function(methodName: string, callback: (...args: any[]) => void) {
      console.log(`[SignalR DEBUG] Registering handler for method: ${methodName} on ${hubType} hub`);
      const wrappedCallback = (...args: any[]) => {
        console.log(`[SignalR DEBUG] Received ${methodName} event on ${hubType} hub with args:`, args);
        return callback(...args);
      };
      return originalOnMethod(methodName, wrappedCallback);
    };
  }
    
  connections[hubType] = connection;
  
  return connection.start().then(() => {
    console.log(`[SignalR] ${hubType} hub connected successfully`);
  }).catch((error) => {
    console.error(`[SignalR] ${hubType} hub connection failed:`, error);
    connections[hubType] = null;
    throw error;
  });
}


export function onHubEvent(hubType: keyof typeof connections, event: string, callback: (...args: any[]) => void) {
  console.log(`[SignalR DEBUG] Setting up listener for event '${event}' on ${hubType} hub`);
  connections[hubType]?.on(event, callback);
}

export function offHubEvent(hubType: keyof typeof connections, event: string, callback: (...args: any[]) => void) {
  connections[hubType]?.off(event, callback);
}

export function disconnectHub(hubType: keyof typeof connections) {
  connections[hubType]?.stop();
  connections[hubType] = null;
}

// Hàm tiện dụng cho từng loại hub
// ChatHub
export const leaveChatRoom = async (roomId: string) => {
  const chatConnection = connections['chat'];
  if (!chatConnection) {
    throw new Error('ChatHub not initialized');
  }
  
  if (chatConnection.state !== 'Connected') {
    console.warn(`[SignalR] Cannot leave room, connection state: ${chatConnection.state}`);
    return Promise.resolve(); // Don't throw error for leave operations
  }
  
  return chatConnection.invoke('LeaveRoom', roomId);
};
export const joinChatRoom = async (roomId: string) => {
  const chatConnection = connections['chat'];
  if (!chatConnection) {
    throw new Error('ChatHub not initialized');
  }
  
  // Wait for connection to be ready if it's still connecting
  if (chatConnection.state === 'Connecting') {
    console.log('[SignalR] Chat connection is connecting, waiting...');
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000); // 10 second timeout
      
      const checkConnection = () => {
        if (chatConnection.state === 'Connected') {
          clearTimeout(timeout);
          resolve();
        } else if (chatConnection.state === 'Disconnected') {
          clearTimeout(timeout);
          reject(new Error('Connection failed'));
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      
      checkConnection();
    });
  }
  
  if (chatConnection.state !== 'Connected') {
    throw new Error(`ChatHub not in Connected state (current: ${chatConnection.state})`);
  }
  
  console.log('[SignalR] Invoking JoinRoom for roomId:', roomId);
  return chatConnection.invoke('JoinRoom', roomId);
};

// Switch chat room mode (AI/Human)
export const switchChatRoomMode = async (roomId: string, mode: 'AI' | 'Human') => {
  const chatConnection = connections['chat'];
  if (!chatConnection) {
    throw new Error('ChatHub not initialized');
  }
  
  if (chatConnection.state !== 'Connected') {
    throw new Error(`ChatHub not in Connected state (current: ${chatConnection.state})`);
  }
  
  console.log('[SignalR] Invoking SwitchRoomMode for roomId:', roomId, 'mode:', mode);
  return chatConnection.invoke('SwitchRoomMode', roomId, mode);
};

export const connectChatHub = (url: string, token?: string) => connectHub('chat', url, token);
export const onChat = (event: string, cb: (...args: any[]) => void) => onHubEvent('chat', event, cb);
export const offChat = (event: string, cb: (...args: any[]) => void) => offHubEvent('chat', event, cb);
export const disconnectChatHub = () => disconnectHub('chat');
// FundHub
export const connectFundHub = (url: string, token?: string) => connectHub('fund', url, token);
export const onFund = (event: string, cb: (...args: any[]) => void) => onHubEvent('fund', event, cb);
export const disconnectFundHub = () => disconnectHub('fund');
export const connectNotificationHub = (url: string, token?: string) => connectHub('notification', url, token);
export const onNotification = (event: string, cb: (...args: any[]) => void) => onHubEvent('notification', event, cb);
export const offNotification = (event: string, cb: (...args: any[]) => void) => offHubEvent('notification', event, cb);
export const disconnectNotificationHub = () => disconnectHub('notification');

// Join admin group for receiving admin notifications
export const joinAdminGroup = async () => {
  const notificationConnection = connections['notification'];
  if (!notificationConnection) {
    throw new Error('NotificationHub not initialized');
  }
  
  if (notificationConnection.state !== 'Connected') {
    throw new Error(`NotificationHub not connected (current: ${notificationConnection.state})`);
  }
  
  console.log('[SignalR] Invoking JoinAdminGroup');
  return notificationConnection.invoke('JoinAdminGroup');
};

export const connectEventHub = (url: string, token?: string) => connectHub('event', url, token);
export const onEvent = (event: string, cb: (...args: any[]) => void) => onHubEvent('event', event, cb);
export const disconnectEventHub = () => disconnectHub('event');

export const connectTicketHub = (url: string, token?: string) => connectHub('ticket', url, token);
export const onTicket = (event: string, cb: (...args: any[]) => void) => onHubEvent('ticket', event, cb);
export const disconnectTicketHub = () => disconnectHub('ticket');

export const connectFeedbackHub = (url: string, token?: string) => connectHub('feedback', url, token);
export const onFeedback = (event: string, cb: (...args: any[]) => void) => onHubEvent('feedback', event, cb);
export const disconnectFeedbackHub = () => disconnectHub('feedback');

export const connectIdentityHub = (url: string, token?: string) => connectHub('identity', url, token);
export const onIdentity = (event: string, cb: (...args: any[]) => void) => onHubEvent('identity', event, cb);
export const disconnectIdentityHub = () => disconnectHub('identity');

export const connectNewsHub = (url: string, token?: string) => connectHub('news', url, token);
export const onNews = (event: string, cb: (...args: any[]) => void) => onHubEvent('news', event, cb);
export const offNews = (event: string, cb: (...args: any[]) => void) => offHubEvent('news', event, cb);
export const disconnectNewsHub = () => disconnectHub('news');

export const connectCommentHub = (url: string, token?: string) => connectHub('comment', url, token);
export const onComment = (event: string, cb: (...args: any[]) => void) => onHubEvent('comment', event, cb);
export const disconnectCommentHub = () => disconnectHub('comment');

export const connectAnalyticsHub = (url: string, token?: string) => connectHub('analytics', url, token);
export const onAnalytics = (event: string, cb: (...args: any[]) => void) => onHubEvent('analytics', event, cb);
export const offAnalytics = (event: string, cb: (...args: any[]) => void) => offHubEvent('analytics', event, cb);
export const disconnectAnalyticsHub = () => {
  if (connections.analytics) {
    connections.analytics.stop();
    connections.analytics = null;
  }
};
// OrderHub
export const connectOrderHub = (url: string, token?: string) => connectHub('order', url, token);
export const onOrder = (event: string, cb: (...args: any[]) => void) => onHubEvent('order', event, cb);
export const disconnectOrderHub = () => disconnectHub('order');
// PaymentHub
export const connectPaymentHub = (url: string, token?: string) => connectHub('payment', url, token);
export const onPayment = (event: string, cb: (...args: any[]) => void) => onHubEvent('payment', event, cb);
export const disconnectPaymentHub = () => disconnectHub('payment');
export interface News {
  eventLocation: string;
  newsId: string;
  eventId: string;
  newsDescription: string;
  newsTitle: string;
  newsContent: string;
  authorId: string;
  imageUrl: string;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

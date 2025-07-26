/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';

let connections: Record<string, HubConnection | null> = {
  notification: null,
  event: null,
  ticket: null,
  feedback: null,
  identity: null,
  news: null,
  comment: null,
  analytics: null,
  chat: null,
  fund: null,
  payment: null,
  report: null,
  system: null,
  faceRecognition: null,
  follow: null,
};

export function connectHub(hubType: keyof typeof connections, hubUrl: string, accessToken?: string) {
  if (connections[hubType]) {
    return Promise.resolve(); // Đã kết nối
  }
  
  const connectionBuilder = new HubConnectionBuilder()
    .configureLogging(LogLevel.Warning) // Only log Warning and above to reduce noise
    .withAutomaticReconnect();
    
  // If token is provided, add it to query string
  if (accessToken) {
    connectionBuilder.withUrl(`${hubUrl}?access_token=${accessToken}`);
  } else {
    connectionBuilder.withUrl(hubUrl);
  }
  
  const connection = connectionBuilder.build();
  connections[hubType] = connection;
  return connection.start();
}

export function onHubEvent(hubType: keyof typeof connections, event: string, callback: (...args: any[]) => void) {
  connections[hubType]?.on(event, callback);
}

export function disconnectHub(hubType: keyof typeof connections) {
  connections[hubType]?.stop();
  connections[hubType] = null;
}

// Fixed URL hub connections - connect directly to services
export const connectNotificationHub = (token?: string) => connectHub('notification', 'http://localhost:5003/hubs/notifications', token);
export const connectEventHub = (token?: string) => connectHub('event', 'http://localhost:5004/notificationHub', token);
export const connectTicketHub = (token?: string) => connectHub('ticket', 'http://localhost:5005/notificationHub', token);
export const connectIdentityHub = (token?: string) => connectHub('identity', 'http://localhost:5001/hubs/notifications', token);
export const connectNewsHub = (token?: string) => connectHub('news', 'http://localhost:5004/newsHub', token);
export const connectCommentHub = (token?: string) => connectHub('comment', 'http://localhost:5004/commentHub', token);
export const connectAnalyticsHub = (token?: string) => connectHub('analytics', 'http://localhost:5006/analyticsHub', token);
export const connectChatHub = (token?: string) => connectHub('chat', 'http://localhost:5007/chatHub', token);
export const connectFundHub = (token?: string) => connectHub('fund', 'http://localhost:5005/fundHub', token);
export const connectFeedbackHub = (token?: string) => connectHub('feedback', 'http://localhost:5008/notificationHub', token);
export const connectReportHub = (token?: string) => connectHub('report', 'http://localhost:5008/notificationHub', token);
export const connectPaymentHub = (token?: string) => connectHub('payment', 'http://localhost:5005/notificationHub', token);
export const connectSystemHub = (token?: string) => connectHub('system', 'http://localhost:5003/hubs/notifications', token);
export const connectFaceRecognitionHub = (token?: string) => connectHub('faceRecognition', 'http://localhost:5001/hubs/notifications', token);
export const connectFollowHub = (token?: string) => connectHub('follow', 'http://localhost:5001/hubs/notifications', token);

// Event handler functions
export const onNotification = (event: string, cb: (...args: any[]) => void) => onHubEvent('notification', event, cb);
export const onEvent = (event: string, cb: (...args: any[]) => void) => onHubEvent('event', event, cb);
export const onTicket = (event: string, cb: (...args: any[]) => void) => onHubEvent('ticket', event, cb);
export const onFeedback = (event: string, cb: (...args: any[]) => void) => onHubEvent('feedback', event, cb);
export const onIdentity = (event: string, cb: (...args: any[]) => void) => onHubEvent('identity', event, cb);
export const onNews = (event: string, cb: (...args: any[]) => void) => onHubEvent('news', event, cb);
export const onComment = (event: string, cb: (...args: any[]) => void) => onHubEvent('comment', event, cb);
export const onAnalytics = (event: string, cb: (...args: any[]) => void) => onHubEvent('analytics', event, cb);
export const onChat = (event: string, cb: (...args: any[]) => void) => onHubEvent('chat', event, cb);
export const onFund = (event: string, cb: (...args: any[]) => void) => onHubEvent('fund', event, cb);
export const onPayment = (event: string, cb: (...args: any[]) => void) => onHubEvent('payment', event, cb);
export const onReport = (event: string, cb: (...args: any[]) => void) => onHubEvent('report', event, cb);
export const onSystem = (event: string, cb: (...args: any[]) => void) => onHubEvent('system', event, cb);
export const onFaceRecognition = (event: string, cb: (...args: any[]) => void) => onHubEvent('faceRecognition', event, cb);
export const onFollow = (event: string, cb: (...args: any[]) => void) => onHubEvent('follow', event, cb);

// Disconnect functions
export const disconnectNotificationHub = () => disconnectHub('notification');
export const disconnectEventHub = () => disconnectHub('event');
export const disconnectTicketHub = () => disconnectHub('ticket');
export const disconnectFeedbackHub = () => disconnectHub('feedback');
export const disconnectIdentityHub = () => disconnectHub('identity');
export const disconnectNewsHub = () => disconnectHub('news');
export const disconnectCommentHub = () => disconnectHub('comment');
export const disconnectAnalyticsHub = () => disconnectHub('analytics');
export const disconnectChatHub = () => disconnectHub('chat');
export const disconnectFundHub = () => disconnectHub('fund');
export const disconnectPaymentHub = () => disconnectHub('payment');
export const disconnectReportHub = () => disconnectHub('report');
export const disconnectSystemHub = () => disconnectHub('system');
export const disconnectFaceRecognitionHub = () => disconnectHub('faceRecognition');
export const disconnectFollowHub = () => disconnectHub('follow');

// Chat room utility functions
export const joinChatRoom = async (roomId: string) => {
  const connection = connections['chat'];
  if (connection && connection.state === 'Connected') {
    try {
      await connection.invoke('JoinRoom', roomId);
      console.log(`Joined chat room: ${roomId}`);
    } catch (error) {
      console.error(`Failed to join chat room ${roomId}:`, error);
    }
  } else {
    console.error('Chat hub not connected');
  }
};

export const leaveChatRoom = async (roomId: string) => {
  const connection = connections['chat'];
  if (connection && connection.state === 'Connected') {
    try {
      await connection.invoke('LeaveRoom', roomId);
      console.log(`Left chat room: ${roomId}`);
    } catch (error) {
      console.error(`Failed to leave chat room ${roomId}:`, error);
    }
  } else {
    console.error('Chat hub not connected');
  }
};

// Common utility functions for SignalR
export const isHubConnected = (hubType: keyof typeof connections): boolean => {
  return connections[hubType]?.state === 'Connected';
};

export const getHubConnectionState = (hubType: keyof typeof connections): string => {
  return connections[hubType]?.state || 'Disconnected';
};

export const disconnectAllHubs = () => {
  Object.keys(connections).forEach(hubType => {
    disconnectHub(hubType as keyof typeof connections);
  });
};

// Error handling utility
export const onHubError = (hubType: keyof typeof connections, callback: (error: Error) => void) => {
  connections[hubType]?.onclose(callback);
};

// Reconnection utility
export const onHubReconnected = (hubType: keyof typeof connections, callback: () => void) => {
  connections[hubType]?.onreconnected(callback);
};

export const onHubReconnecting = (hubType: keyof typeof connections, callback: () => void) => {
  connections[hubType]?.onreconnecting(callback);
};

// Join admin group for admin notifications
export const joinAdminGroup = async () => {
  // Check if user is admin (role = 0)
  const accountStr = localStorage.getItem('account');
  const account = accountStr ? JSON.parse(accountStr) : null;
  
  if (!account || account.role !== 0) {
    return;
  }

  const connection = connections['notification'];
  if (connection && connection.state === 'Connected') {
    try {
      await connection.invoke('JoinAdminGroup');
    } catch (error) {
      console.error('Failed to join Admin group:', error);
    }
  }
};

export const leaveAdminGroup = async () => {
  const connection = connections['notification'];
  if (connection && connection.state === 'Connected') {
    try {
      await connection.invoke('LeaveAdminGroup');
      console.log('Successfully left Admin group');
    } catch (error) {
      console.error('Failed to leave Admin group:', error);
    }
  }
};
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
  analytics: null, // Thêm analytics
  chat: null, // Thêm chat
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

// Hàm tiện dụng cho từng loại hub
export const connectNotificationHub = (url: string, token?: string) => connectHub('notification', url, token);
export const onNotification = (event: string, cb: (...args: any[]) => void) => onHubEvent('notification', event, cb);
export const disconnectNotificationHub = () => disconnectHub('notification');

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
export const disconnectNewsHub = () => disconnectHub('news');

export const connectCommentHub = (url: string, token?: string) => connectHub('comment', url, token);
export const onComment = (event: string, cb: (...args: any[]) => void) => onHubEvent('comment', event, cb);
export const disconnectCommentHub = () => disconnectHub('comment');

export const connectAnalyticsHub = (url: string, token?: string) => connectHub('analytics', url, token);
export const onAnalytics = (event: string, cb: (...args: any[]) => void) => onHubEvent('analytics', event, cb);
export const disconnectAnalyticsHub = () => {
  if (connections.analytics) {
    connections.analytics.stop();
    connections.analytics = null;
  }
};

export const connectChatHub = (url: string, token?: string) => connectHub('chat', url, token);
export const onChat = (event: string, cb: (...args: any[]) => void) => onHubEvent('chat', event, cb);
export const disconnectChatHub = () => disconnectHub('chat');

// Join a specific chat room
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

// Leave a specific chat room
export const leaveChatRoom = async (roomId: string) => {
  const connection = connections['chat'];
  if (connection && connection.state === 'Connected') {
    try {
      await connection.invoke('LeaveRoom', roomId);
      console.log(`Left chat room: ${roomId}`);
    } catch (error) {
      console.error(`Failed to leave chat room ${roomId}:`, error);
    }
  }
};

// Join admin group for admin notifications
export const joinAdminGroup = async () => {
  // Check if user is admin (role = 0)
  const accountStr = localStorage.getItem('account');
  const account = accountStr ? JSON.parse(accountStr) : null;
  
  if (!account || account.role !== 0) {
    console.log('User is not admin, skipping admin group join');
    return;
  }

  const connection = connections['notification'];
  if (connection && connection.state === 'Connected') {
    try {
      await connection.invoke('JoinAdminGroup');
      console.log('Successfully joined Admin group');
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
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';

let connections: Record<string, HubConnection | null> = {
  notification: null,
  event: null,
  ticket: null,
  feedback: null,
  identity: null,
  news: null,
  comment: null,
};

export function connectHub(hubType: keyof typeof connections, hubUrl: string, accessToken?: string) {
  if (connections[hubType]) {
    return Promise.resolve(); // Đã kết nối
  }
  const connection = new HubConnectionBuilder()
    .withUrl(hubUrl, accessToken ? { accessTokenFactory: () => accessToken } : undefined)
    .configureLogging(LogLevel.Information)
    .withAutomaticReconnect()
    .build();
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
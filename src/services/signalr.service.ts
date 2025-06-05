// import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';

// let connection: HubConnection | null = null;

// export function createSignalRConnection(hubUrl: string) {
//   // Nếu dùng Ocelot hoặc API Gateway, hubUrl nên là: http://gateway-domain/notificationHub (nếu dùng HTTP)
//   // Ví dụ: http://localhost:5000/notificationHub
//   connection = new HubConnectionBuilder()
//     .withUrl(hubUrl)
//     .configureLogging(LogLevel.Information)
//     .withAutomaticReconnect()
//     .build();
//   return connection;
// }

// export function getSignalRConnection() {
//   return connection;
// }
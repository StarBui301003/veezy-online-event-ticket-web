import React from 'react';
import { CustomerSupport } from '@/components/Customer';

/**
 * Demo component để test các tính năng chat
 * Có thể được sử dụng trong trang Customer hoặc làm standalone page
 */
export const ChatDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Chat Demo - Veezy Customer Support
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Features Overview */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              🤖 AI Assistant Features
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li>• Trả lời tức thì 24/7</li>
              <li>• Streaming response cho trải nghiệm tự nhiên</li>
              <li>• Hỗ trợ đa ngôn ngữ</li>
              <li>• Hiểu context về events và tickets</li>
              <li>• Giao diện thân thiện với gradients</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              💬 Human Chat Features
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li>• Kết nối realtime với SignalR</li>
              <li>• Chat với admin/support staff</li>
              <li>• Thông báo tin nhắn mới</li>
              <li>• Typing indicators</li>
              <li>• Message read status</li>
            </ul>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            📖 How to Test
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">1. AI Chat Testing</h3>
              <p className="text-gray-600 text-sm mb-2">
                Click vào nút AI (màu tím) để test AI Assistant:
              </p>
              <ul className="text-sm text-gray-500 space-y-1 ml-4">
                <li>• "Tôi muốn tìm sự kiện âm nhạc"</li>
                <li>• "Làm sao để mua vé?"</li>
                <li>• "Chính sách hoàn tiền như thế nào?"</li>
                <li>• "Tôi cần hỗ trợ về tài khoản"</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">2. Human Chat Testing</h3>
              <p className="text-gray-600 text-sm mb-2">
                Click vào nút Chat (màu xanh) để test human support:
              </p>
              <ul className="text-sm text-gray-500 space-y-1 ml-4">
                <li>• Cần login để chat với admin</li>
                <li>• Messages được lưu trong database</li>
                <li>• Realtime notifications</li>
                <li>• Admin có thể reply từ admin panel</li>
              </ul>
            </div>
          </div>
        </div>

        {/* API Endpoints Info */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            🔌 API Integration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Chat Service Endpoints</h3>
              <div className="text-sm space-y-1 font-mono text-gray-600">
                <div>POST /api/ChatRoom/admin-chat</div>
                <div>GET /api/ChatRoom/user/{'{userId}'}</div>
                <div>GET /api/ChatMessage/room/{'{roomId}'}</div>
                <div>POST /api/ChatMessage</div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">AI Chat Endpoints</h3>
              <div className="text-sm space-y-1 font-mono text-gray-600">
                <div>POST /api/ChatMessage/ai-chat</div>
                <div>POST /api/ChatMessage/ai-chat-stream</div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Connection Info */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            🔄 Real-time Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">WS</span>
              </div>
              <h3 className="font-medium text-blue-800">SignalR Hub</h3>
              <p className="text-sm text-blue-600">Gateway:5000/chatHub</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">🔔</span>
              </div>
              <h3 className="font-medium text-blue-800">Notifications</h3>
              <p className="text-sm text-blue-600">Browser push notifications</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">⚡</span>
              </div>
              <h3 className="font-medium text-blue-800">Live Updates</h3>
              <p className="text-sm text-blue-600">Real-time message sync</p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-8">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">⚠️</span>
            <span className="font-medium text-yellow-800">Important Notes</span>
          </div>
          <ul className="text-sm text-yellow-700 mt-2 space-y-1 ml-6">
            <li>• Đảm bảo backend services đang chạy (Gateway:5000, ChatService:5007)</li>
            <li>• Cần authentication token để chat với admin</li>
            <li>• AI features cần Gemini API key được cấu hình</li>
            <li>• SignalR connection yêu cầu CORS được setup đúng</li>
          </ul>
        </div>
      </div>

      {/* Chat Components - positioned fixed */}
      <CustomerSupport />
    </div>
  );
};

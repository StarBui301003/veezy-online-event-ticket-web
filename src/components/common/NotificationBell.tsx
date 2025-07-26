import React from 'react';
import { Bell } from 'lucide-react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

interface NotificationBellProps {
  className?: string;
  onClick?: () => void;
  title?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className = "flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-200/30 transition-all relative",
  onClick,
  title = "Thông báo"
}) => {
  const { unreadCount } = useRealtimeNotifications();

  return (
    <button
      className={className}
      onClick={onClick}
      title={title}
    >
      <Bell className="text-purple-500 text-xl" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse">
          {/* Show number if more than 9 */}
          {unreadCount > 9 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;

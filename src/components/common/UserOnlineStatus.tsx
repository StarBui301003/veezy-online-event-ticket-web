import React from 'react';
import { useOnlineStatus } from '@/contexts/OnlineStatusContext';
import OnlineStatusIndicator from './OnlineStatusIndicator';
import { Users, Circle } from 'lucide-react';

interface UserOnlineStatusProps {
  userId: string;
  userName: string;
  avatarUrl?: string;
  showAvatar?: boolean;
  showName?: boolean;
  showOnlineIndicator?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UserOnlineStatus: React.FC<UserOnlineStatusProps> = ({
  userId,
  userName,
  avatarUrl,
  showAvatar = true,
  showName = true,
  showOnlineIndicator = true,
  size = 'md',
  className = ''
}) => {
  const { isUserOnline } = useOnlineStatus();
  const isOnline = isUserOnline(userId);

  const sizeClasses = {
    sm: {
      avatar: 'w-6 h-6',
      text: 'text-xs',
      gap: 'gap-1'
    },
    md: {
      avatar: 'w-8 h-8',
      text: 'text-sm',
      gap: 'gap-2'
    },
    lg: {
      avatar: 'w-10 h-10',
      text: 'text-base',
      gap: 'gap-3'
    }
  };

  return (
    <div className={`flex items-center ${sizeClasses[size].gap} ${className}`}>
      {showAvatar && (
        <div className="relative">
          <div className={`${sizeClasses[size].avatar} rounded-full bg-gray-200 flex items-center justify-center overflow-hidden`}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Users className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} text-gray-500`} />
            )}
          </div>
          {showOnlineIndicator && (
            <div className="absolute -bottom-0.5 -right-0.5">
              <OnlineStatusIndicator 
                userId={userId}
                size="sm"
                showText={false}
              />
            </div>
          )}
        </div>
      )}
      
      {showName && (
        <div className="flex flex-col">
          <span className={`${sizeClasses[size].text} font-medium truncate`}>
            {userName}
          </span>
          {showOnlineIndicator && !showAvatar && (
            <div className="flex items-center gap-1">
              <Circle className={`w-2 h-2 ${isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
              <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          )}
        </div>
      )}
      
      {!showName && !showAvatar && showOnlineIndicator && (
        <OnlineStatusIndicator 
          userId={userId}
          size={size}
          showText={true}
        />
      )}
    </div>
  );
};

export default UserOnlineStatus;

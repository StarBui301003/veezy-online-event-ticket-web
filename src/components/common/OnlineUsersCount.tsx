import React from 'react';
import { useOnlineStatus } from '@/contexts/OnlineStatusContext';
import { Users, Circle } from 'lucide-react';

interface OnlineUsersCountProps {
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const OnlineUsersCount: React.FC<OnlineUsersCountProps> = ({
  className = '',
  showIcon = true,
  size = 'md'
}) => {
  const { totalOnlineUsers } = useOnlineStatus();

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <div className="relative">
          <Users className={`${iconSizes[size]} text-green-600`} />
          <Circle className="w-2 h-2 absolute -top-1 -right-1 fill-green-500 text-green-500 animate-pulse" />
        </div>
      )}
      <span className={`${sizeClasses[size]} font-medium text-green-600`}>
        {totalOnlineUsers} online
      </span>
    </div>
  );
};

export default OnlineUsersCount;

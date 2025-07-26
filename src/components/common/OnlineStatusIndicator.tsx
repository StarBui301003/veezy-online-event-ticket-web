import React, { useState, useEffect } from 'react';
import { Circle } from 'lucide-react';
import { useOnlineStatus } from '@/contexts/OnlineStatusContext';

interface OnlineStatusIndicatorProps {
  userId?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({
  userId,
  showText = false,
  size = 'md',
  className = ''
}) => {
  const { isUserOnline, getUserLastSeen, refreshUserStatus } = useOnlineStatus();
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>('');

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  useEffect(() => {
    if (!userId) return;

    // Get status from context
    const online = isUserOnline(userId);
    const lastSeenDate = getUserLastSeen(userId);
    
    console.log(`🔍 OnlineStatusIndicator for user ${userId}: online=${online}, lastSeen=${lastSeenDate}`);
    console.log(`🔍 OnlineStatusIndicator context check - userId: ${userId}, found in context: ${!!online || !!lastSeenDate}`);
    
    setIsOnline(online);
    setLastSeen(lastSeenDate || '');

    // Refresh user status from server - with error handling
    const refreshStatus = async () => {
      try {
        await refreshUserStatus(userId);
        // Get updated status after refresh
        const updatedOnline = isUserOnline(userId);
        const updatedLastSeen = getUserLastSeen(userId);
        console.log(`🔄 After refresh - user ${userId}: online=${updatedOnline}, lastSeen=${updatedLastSeen}`);
      } catch (error) {
        console.warn('Failed to refresh user status from server:', error);
        // Continue with context data
      }
    };
    
    refreshStatus();

    // Set up polling every 60 seconds for this specific user
    const interval = setInterval(() => {
      refreshStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, [userId, isUserOnline, getUserLastSeen, refreshUserStatus]);

  // Update local state when context changes
  useEffect(() => {
    if (!userId) return;
    
    const online = isUserOnline(userId);
    const lastSeenDate = getUserLastSeen(userId);
    
    setIsOnline(online);
    setLastSeen(lastSeenDate || '');
  }, [userId, isUserOnline, getUserLastSeen]);

  const formatLastSeen = (lastSeenDate: string): string => {
    if (!lastSeenDate) return '';
    
    const now = new Date();
    const lastSeenTime = new Date(lastSeenDate);
    const diffMs = now.getTime() - lastSeenTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastSeenTime.toLocaleDateString();
  };

  if (!userId) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="relative">
        <Circle 
          className={`${sizeClasses[size]} ${
            isOnline 
              ? 'fill-green-500 text-green-500' 
              : 'fill-gray-400 text-gray-400'
          }`}
        />
        {isOnline && (
          <div className={`absolute inset-0 ${sizeClasses[size]} bg-green-500 rounded-full animate-ping opacity-75`} />
        )}
      </div>
      
      {showText && (
        <span className={`${textSizeClasses[size]} ${
          isOnline ? 'text-green-600' : 'text-gray-500'
        }`}>
          {isOnline ? 'Online' : lastSeen ? formatLastSeen(lastSeen) : 'Offline'}
        </span>
      )}
    </div>
  );
};

export default OnlineStatusIndicator;

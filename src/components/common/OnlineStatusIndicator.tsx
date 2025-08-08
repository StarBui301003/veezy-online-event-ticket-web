import React, { useState, useEffect } from 'react';
import { Circle } from 'lucide-react';
import identityService from '@/services/identity.service';

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
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>('');
  const [loading, setLoading] = useState(true);

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

  // ✅ Load user status từ IdentityService (supports both online and offline users)
  const loadUserStatus = async (targetUserId: string) => {
    try {
      console.log(`[OnlineStatusIndicator] Loading status for user ${targetUserId} from IdentityService...`);
      
      // Get all users with their online status (this includes both online and offline users)
      const allUsers = await identityService.getAllUsersWithStatus();
      
      // Find user by accountId (primary identifier) or userId
      let user = allUsers.find(u => u.accountId === targetUserId || u.userId === targetUserId);
      
      // If not found by accountId/userId, try to find by other potential ID fields for compatibility
      if (!user) {
        user = allUsers.find(u => 
          u.username === targetUserId ||
          u.email === targetUserId
        );
      }
      
      if (user) {
        console.log(`[OnlineStatusIndicator] Found user ${targetUserId} in users list:`, user);
        setIsOnline(user.isOnline);
        setLastSeen(user.lastActiveAt);
      } else {
        console.log(`[OnlineStatusIndicator] User ${targetUserId} not found in users list, setting offline`);
        setIsOnline(false);
        setLastSeen('');
      }
    } catch (error) {
      console.error(`[OnlineStatusIndicator] Error loading status for user ${targetUserId}:`, error);
      setIsOnline(false);
      setLastSeen('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    console.log(`[OnlineStatusIndicator] Starting status check for user ${userId}`);
    setLoading(true);
    loadUserStatus(userId);

    // Set up polling every 30 seconds for this specific user
    const interval = setInterval(() => {
      console.log(`[OnlineStatusIndicator] Polling status for user ${userId}`);
      loadUserStatus(userId);
    }, 30000);

    return () => {
      console.log(`[OnlineStatusIndicator] Cleanup for user ${userId}`);
      clearInterval(interval);
    };
  }, [userId]);

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
            loading 
              ? 'fill-gray-300 text-gray-300 animate-pulse'
              : isOnline 
              ? 'fill-green-500 text-green-500' 
              : 'fill-gray-400 text-gray-400'
          }`}
        />
        {isOnline && !loading && (
          <div className={`absolute inset-0 ${sizeClasses[size]} bg-green-500 rounded-full animate-ping opacity-75`} />
        )}
      </div>
      
      {showText && (
        <span className={`${textSizeClasses[size]} ${
          loading
            ? 'text-gray-400'
            : isOnline ? 'text-green-600' : 'text-gray-500'
        }`}>
          {loading 
            ? 'Loading...' 
            : isOnline ? 'Online' : lastSeen ? formatLastSeen(lastSeen) : 'Offline'
          }
        </span>
      )}
    </div>
  );
};

export default OnlineStatusIndicator;

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onChat } from '@/services/signalr.service';

interface OnlineUser {
  userId: string;
  username: string;
  isOnline: boolean;
  lastActiveAt: string;
}

interface OnlineStatusContextType {
  onlineUsers: Map<string, OnlineUser>;
  isUserOnline: (userId: string) => boolean;
  getUserLastSeen: (userId: string) => string | null;
  refreshUserStatus: (userId: string) => Promise<void>;
  totalOnlineUsers: number;
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined);

interface OnlineStatusProviderProps {
  children: ReactNode;
}

export const OnlineStatusProvider: React.FC<OnlineStatusProviderProps> = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map());

  useEffect(() => {
    // Listen to SignalR events for real-time online status updates
    const handleUserConnected = (data: { userId: string; username: string }) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(data.userId, {
          userId: data.userId,
          username: data.username,
          isOnline: true,
          lastActiveAt: new Date().toISOString()
        });
        return newMap;
      });
      console.log('🟢 User connected:', data.username);
    };

    const handleUserDisconnected = (data: { userId: string; username: string }) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        const user = newMap.get(data.userId);
        if (user) {
          newMap.set(data.userId, {
            ...user,
            isOnline: false,
            lastActiveAt: new Date().toISOString()
          });
        }
        return newMap;
      });
      console.log('🔴 User disconnected:', data.username);
    };

    // Listen to user activity updates
    const handleUserActivityUpdated = (event: CustomEvent) => {
      const { timestamp } = event.detail;
      const accStr = localStorage.getItem('account');
      let currentUserId = '';
      
      try {
        if (accStr) {
          const accObj = JSON.parse(accStr);
          currentUserId = accObj.userId;
        }
      } catch (error) {
        console.warn('Failed to parse account info:', error);
      }

      if (currentUserId) {
        setOnlineUsers(prev => {
          const newMap = new Map(prev);
          const existingUser = newMap.get(currentUserId);
          newMap.set(currentUserId, {
            userId: currentUserId,
            username: existingUser?.username || 'Current User',
            isOnline: true,
            lastActiveAt: new Date(timestamp).toISOString()
          });
          return newMap;
        });
      }
    };

    // Listen to add user to context event
    const handleAddUserToContext = (event: CustomEvent) => {
      const { userId, username, isOnline, lastActiveAt } = event.detail;
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, {
          userId,
          username,
          isOnline,
          lastActiveAt
        });
        return newMap;
      });
      console.log('➕ Added user to context from event:', userId);
    };

    // Setup SignalR listeners
    onChat('UserConnected', handleUserConnected);
    onChat('UserDisconnected', handleUserDisconnected);

    // Setup custom event listener for user activity updates
    window.addEventListener('userActivityUpdated', handleUserActivityUpdated as EventListener);
    window.addEventListener('addUserToOnlineContext', handleAddUserToContext as EventListener);

    // Load initial online users
    loadOnlineUsers();

    // Add current user to context if logged in
    const addCurrentUserToContext = () => {
      const accStr = localStorage.getItem('account');
      const token = localStorage.getItem('access_token');
      
      if (accStr && token) {
        try {
          const accObj = JSON.parse(accStr);
          const currentUserId = accObj.userId;
          
          if (currentUserId) {
            setOnlineUsers(prev => {
              const newMap = new Map(prev);
              if (!newMap.has(currentUserId)) {
                newMap.set(currentUserId, {
                  userId: currentUserId,
                  username: accObj.username || 'Current User',
                  isOnline: true,
                  lastActiveAt: new Date().toISOString()
                });
              }
              return newMap;
            });
          }
        } catch (error) {
          console.warn('Failed to parse account info for context:', error);
        }
      }
    };

    addCurrentUserToContext();

    return () => {
      // Cleanup listeners
      window.removeEventListener('userActivityUpdated', handleUserActivityUpdated as EventListener);
      window.removeEventListener('addUserToOnlineContext', handleAddUserToContext as EventListener);
    };
  }, []);

  const loadOnlineUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // Sử dụng ChatService Admin API endpoint để lấy online users
      try {
        const response = await fetch('/api/chat/admin/online-users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const users: OnlineUser[] = await response.json();
            const userMap = new Map<string, OnlineUser>();
            users.forEach(user => {
              userMap.set(user.userId, user);
            });
            setOnlineUsers(userMap);
          } else {
            console.warn('Chat Admin API returned non-JSON response, using SignalR only');
          }
        } else if (response.status === 404) {
          console.warn('Chat Admin API not available, using SignalR only');
          // Continue with empty map, will be populated by SignalR events
        } else if (response.status === 403) {
          console.warn('Not authorized for admin online users, using SignalR only');
          // Continue with empty map, will be populated by SignalR events
        }
      } catch (apiError) {
        console.warn('Chat Admin API not available:', apiError);
        // Continue with empty map, will be populated by SignalR events
      }
    } catch (error) {
      console.error('Failed to load online users:', error);
    }
  };

  const isUserOnline = (userId: string): boolean => {
    const user = onlineUsers.get(userId);
    const online = user?.isOnline || false;
    console.log(`🔍 isUserOnline(${userId}): ${online}, user data:`, user);
    console.log(`🔍 Context has user IDs: [${Array.from(onlineUsers.keys()).join(', ')}]`);
    console.log(`🔍 All users in onlineUsers Map:`, Array.from(onlineUsers.entries()));
    return online;
  };

  const getUserLastSeen = (userId: string): string | null => {
    const user = onlineUsers.get(userId);
    return user?.lastActiveAt || null;
  };

  const refreshUserStatus = async (userId: string): Promise<void> => {
    try {
      // Backend OnlineStatusService không có public API endpoint cho individual user check
      // Thay vào đó, dựa vào SignalR events và middleware để track status
      // Chỉ cần update local state từ SignalR events
      console.debug(`User status refresh for ${userId} handled by SignalR events`);
      
      // Nếu cần thiết, có thể call Account API để trigger middleware update
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          await fetch('/api/Account/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          // Ignore API errors - chỉ là để trigger middleware
        }
      }
    } catch (error) {
      console.warn('Failed to refresh user status:', error);
      // Don't throw error, just continue with existing state
    }
  };

  const contextValue: OnlineStatusContextType = {
    onlineUsers,
    isUserOnline,
    getUserLastSeen,
    refreshUserStatus,
    totalOnlineUsers: Array.from(onlineUsers.values()).filter(user => user.isOnline).length
  };

  return (
    <OnlineStatusContext.Provider value={contextValue}>
      {children}
    </OnlineStatusContext.Provider>
  );
};

export const useOnlineStatus = (): OnlineStatusContextType => {
  const context = useContext(OnlineStatusContext);
  if (!context) {
    throw new Error('useOnlineStatus must be used within an OnlineStatusProvider');
  }
  return context;
};

export default OnlineStatusProvider;

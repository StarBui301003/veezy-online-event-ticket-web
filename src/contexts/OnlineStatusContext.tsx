import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { connectIdentityHub, onIdentity } from '@/services/signalr.service';
import identityService from '@/services/identity.service';

interface OnlineUser {
  userId: string;
  username: string;
  fullName?: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastActiveAt: string;
}

interface OnlineStatusContextType {
  onlineUsers: Map<string, OnlineUser>;
  allUsers: Map<string, OnlineUser>; // ✅ Thêm allUsers để lưu tất cả users từ IdentityService
  isUserOnline: (userId: string) => boolean;
  getUserLastSeen: (userId: string) => string | null;
  refreshUserStatus: (userId: string) => Promise<void>;
  loadAllOnlineUsers: () => Promise<void>; // ✅ Method để load tất cả users từ IdentityService
  refreshAllUsers: () => Promise<void>; // ✅ Method để refresh tất cả users
  totalOnlineUsers: number;
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined);

interface OnlineStatusProviderProps {
  children: ReactNode;
}

export const OnlineStatusProvider: React.FC<OnlineStatusProviderProps> = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map());
  const [allUsers, setAllUsers] = useState<Map<string, OnlineUser>>(new Map()); // ✅ State để lưu tất cả users

  // ✅ Method để load tất cả online users từ IdentityService
  const loadAllOnlineUsers = async () => {
    try {
      const users = await identityService.getOnlineUsers();

      const newAllUsers = new Map<string, OnlineUser>();
      users.forEach((user) => {
        newAllUsers.set(user.accountId, {
          userId: user.accountId,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          isOnline: user.isOnline,
          lastActiveAt: user.lastActiveAt,
        });
      });

      setAllUsers(newAllUsers);
    } catch (error) {
      // Error loading online users
    }
  };

  // ✅ Method để refresh tất cả users
  const refreshAllUsers = async () => {
    await loadAllOnlineUsers();
  };

  useEffect(() => {
    // Connect to Identity Hub for online status events
    const initializeConnection = async () => {
              try {
          const token = localStorage.getItem('access_token');
          if (token) {
            await connectIdentityHub('https://identity.vezzy.site/hubs/notifications', token);
          }
        } catch (error) {
          // Failed to connect to Identity Hub
        }
    };

    initializeConnection();

    // Listen to SignalR events for real-time online status updates
    const handleUserOnline = (accountId: string) => {
      setOnlineUsers((prev) => {
        const newMap = new Map(prev);
        const existingUser = newMap.get(accountId);
        newMap.set(accountId, {
          userId: accountId,
          username: existingUser?.username || 'Unknown',
          isOnline: true,
          lastActiveAt: new Date().toISOString(),
        });
        return newMap;
      });
    };

    const handleUserOffline = (accountId: string) => {
      setOnlineUsers((prev) => {
        const newMap = new Map(prev);
        const existingUser = newMap.get(accountId);
        if (existingUser) {
          newMap.set(accountId, {
            ...existingUser,
            isOnline: false,
            lastActiveAt: new Date().toISOString(),
          });
        }
        return newMap;
      });
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
        // Failed to parse account info
      }

      if (currentUserId) {
        setOnlineUsers((prev) => {
          const newMap = new Map(prev);
          const existingUser = newMap.get(currentUserId);
          newMap.set(currentUserId, {
            userId: currentUserId,
            username: existingUser?.username || 'Current User',
            isOnline: true,
            lastActiveAt: new Date(timestamp).toISOString(),
          });
          return newMap;
        });
      }
    };

    // Listen to add user to context event
    const handleAddUserToContext = (event: CustomEvent) => {
      const { userId, username, isOnline, lastActiveAt } = event.detail;
      setOnlineUsers((prev) => {
        const newMap = new Map(prev);
        const existingUser = newMap.get(userId);

        // Only update if user doesn't exist or if we have more recent data
        if (!existingUser) {
          newMap.set(userId, {
            userId,
            username,
            isOnline,
            lastActiveAt,
          });
        } else {
          // For existing users, prefer real-time SignalR status over static data
          // Don't override if existing user has more recent activity
          const existingTime = new Date(existingUser.lastActiveAt).getTime();
          const newTime = new Date(lastActiveAt).getTime();

          if (newTime > existingTime) {
            newMap.set(userId, {
              userId,
              username: username || existingUser.username,
              isOnline,
              lastActiveAt,
            });
          }
        }

        return newMap;
      });
    };

    // Setup SignalR listeners for Identity Hub events
    onIdentity('UserOnline', handleUserOnline);
    onIdentity('UserOffline', handleUserOffline);

    // Also listen to lowercase versions (backend might send these)
    onIdentity('useronline', handleUserOnline);
    onIdentity('useroffline', handleUserOffline);

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
            setOnlineUsers((prev) => {
              const newMap = new Map(prev);
              if (!newMap.has(currentUserId)) {
                newMap.set(currentUserId, {
                  userId: currentUserId,
                  username: accObj.username || 'Current User',
                  isOnline: true,
                  lastActiveAt: new Date().toISOString(),
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

      // Skip API call for online users - rely on SignalR events only
      try {
        // Try to get online users from account API
        const response = await fetch('/api/Account/online-users', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.flag && Array.isArray(data.data)) {
            const userMap = new Map<string, OnlineUser>();
            data.data.forEach(
              (user: {
                accountId?: string;
                userId?: string;
                username: string;
                isOnline: boolean;
                lastActiveAt?: string;
              }) => {
                userMap.set(user.accountId || user.userId, {
                  userId: user.accountId || user.userId,
                  username: user.username,
                  isOnline: user.isOnline,
                  lastActiveAt: user.lastActiveAt || new Date().toISOString(),
                });
              }
            );
            setOnlineUsers(userMap);
          }
        }
      } catch {
        // Ignore API errors - we'll rely on SignalR events for real-time status
      }
    } catch (error) {
      // Failed to load online users
    }
  };

  const isUserOnline = (userId: string): boolean => {
    const user = onlineUsers.get(userId);
    const online = user?.isOnline || false;
    return online;
  };

  const getUserLastSeen = (userId: string): string | null => {
    const user = onlineUsers.get(userId);
    return user?.lastActiveAt || null;
  };

  const refreshUserStatus = async (): Promise<void> => {
    try {
      // Backend OnlineStatusService không có public API endpoint cho individual user check
      // Thay vào đó, dựa vào SignalR events và middleware để track status
      // Chỉ cần update local state từ SignalR events

      // Nếu cần thiết, có thể call Account API để trigger middleware update
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          await fetch('/api/Account/profile', {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch {
          // Ignore API errors - chỉ là để trigger middleware
        }
      }
    } catch (error) {
      // Failed to refresh user status
      // Don't throw error, just continue with existing state
    }
  };

  const contextValue: OnlineStatusContextType = {
    onlineUsers,
    allUsers, // ✅ Thêm allUsers
    isUserOnline,
    getUserLastSeen,
    refreshUserStatus,
    loadAllOnlineUsers, // ✅ Thêm loadAllOnlineUsers
    refreshAllUsers, // ✅ Thêm refreshAllUsers
    totalOnlineUsers: Array.from(onlineUsers.values()).filter((user) => user.isOnline).length,
  };

  return (
    <OnlineStatusContext.Provider value={contextValue}>{children}</OnlineStatusContext.Provider>
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

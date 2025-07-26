import React from 'react';
import { useOnlineStatus } from '@/contexts/OnlineStatusContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Circle, Activity } from 'lucide-react';
import OnlineStatusIndicator from './OnlineStatusIndicator';

interface OnlineUsersSummaryProps {
  className?: string;
  showUserList?: boolean;
  maxUsers?: number;
}

const OnlineUsersSummary: React.FC<OnlineUsersSummaryProps> = ({
  className = '',
  showUserList = true,
  maxUsers = 10
}) => {
  const { onlineUsers, totalOnlineUsers } = useOnlineStatus();
  
  const onlineUsersList = Array.from(onlineUsers.values())
    .filter(user => user.isOnline)
    .slice(0, maxUsers);

  return (
    <Card className={`bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-700">
          <div className="relative">
            <Users className="w-5 h-5" />
            <Circle className="w-2 h-2 absolute -top-1 -right-1 fill-green-500 text-green-500 animate-pulse" />
          </div>
          Online Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Total count */}
          <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Total Online</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-green-600">{totalOnlineUsers}</span>
              <Circle className="w-3 h-3 fill-green-500 text-green-500 animate-pulse" />
            </div>
          </div>

          {/* User list */}
          {showUserList && onlineUsersList.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-green-700 border-b border-green-200 pb-1">
                Currently Online
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {onlineUsersList.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-2 bg-white/80 rounded-lg hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-green-700">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-800">
                          {user.username}
                        </span>
                      </div>
                    </div>
                    <OnlineStatusIndicator 
                      userId={user.userId}
                      size="sm"
                      showText={false}
                    />
                  </div>
                ))}
              </div>
              
              {totalOnlineUsers > maxUsers && (
                <div className="text-center py-2">
                  <span className="text-xs text-green-600">
                    +{totalOnlineUsers - maxUsers} more users online
                  </span>
                </div>
              )}
            </div>
          )}

          {showUserList && onlineUsersList.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No users currently online</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OnlineUsersSummary;

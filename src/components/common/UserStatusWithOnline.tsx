import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Bot, User } from 'lucide-react';
import OnlineStatusIndicator from '@/components/common/OnlineStatusIndicator';

interface UserStatusWithOnlineProps {
  userType: 'admin' | 'user' | 'ai' | 'customer';
  userId?: string;
  showOnlineStatus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  showIcon?: boolean;
  className?: string;
}

export const UserStatusWithOnline: React.FC<UserStatusWithOnlineProps> = ({
  userType,
  userId,
  showOnlineStatus = true,
  size = 'sm',
  variant = 'outline',
  showIcon = true,
  className = ''
}) => {
  const getConfig = () => {
    switch (userType) {
      case 'admin':
        return {
          label: 'Admin',
          icon: Crown,
          colorClass: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
          iconColor: 'text-red-600'
        };
      case 'ai':
        return {
          label: 'AI',
          icon: Bot,
          colorClass: 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-300 hover:from-purple-200 hover:to-blue-200',
          iconColor: 'text-purple-600'
        };
      case 'user':
      case 'customer':
        return {
          label: 'You',
          icon: User,
          colorClass: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
          iconColor: 'text-blue-600'
        };
      default:
        return {
          label: 'User',
          icon: User,
          colorClass: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200',
          iconColor: 'text-gray-600'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs py-0.5 px-1.5',
    md: 'text-sm py-1 px-2',
    lg: 'text-base py-1.5 px-3'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant={variant}
        className={`
          ${sizeClasses[size]} 
          ${config.colorClass}
          inline-flex items-center gap-1 
          font-medium transition-colors duration-200
        `}
      >
        {showIcon && <Icon className={`${iconSizes[size]} ${config.iconColor}`} />}
        {config.label}
      </Badge>
      
      {showOnlineStatus && userId && userType !== 'ai' && (
        <OnlineStatusIndicator 
          userId={userId}
          size={size}
          showText={false}
        />
      )}
    </div>
  );
};

export default UserStatusWithOnline;

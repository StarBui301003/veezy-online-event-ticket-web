import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

interface NotificationProviderWrapperProps {
  children: React.ReactNode;
}

const NotificationProviderWrapper: React.FC<NotificationProviderWrapperProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Get userId from current user context
  const userId = user?.userId || user?.accountId || '';

  return (
    <NotificationProvider userId={userId}>
      {children}
    </NotificationProvider>
  );
};

export default NotificationProviderWrapper;

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AdminList } from './AdminList';
import { CustomerList } from './CustomerList';
import { CollaboratorList } from './CollaboratorList';
import { EventManagerList } from './EventManagerList';
import { FaUserShield, FaUser, FaUsers, FaUserTie } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { connectIdentityHub, onIdentity, disconnectIdentityHub } from '@/services/signalr.service';

export default function UserListTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);

  // Nếu chưa có param tab, set mặc định là admin
  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'admin' }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setup SignalR cho realtime user updates
  useEffect(() => {
          connectIdentityHub('https://identity.vezzy.site/hubs/notifications');

    // Lắng nghe realtime SignalR cho user events
    const handleUserUpdates = () => {
      setRefreshKey((prev) => prev + 1); // Trigger refresh cho tất cả user lists
    };

    // Events từ AccountController
    onIdentity('AdminCreated', handleUserUpdates);
    onIdentity('CollaboratorCreated', handleUserUpdates);
    onIdentity('UserProfileUpdated', handleUserUpdates);
    onIdentity('UserPasswordChanged', handleUserUpdates);
    onIdentity('UserVerifiedEmail', handleUserUpdates);

    // Events từ UserController (EditUserModal)
    onIdentity('UserUpdated', handleUserUpdates);
    onIdentity('UserAvatarUpdated', handleUserUpdates);

    // Cleanup function
    return () => {
      disconnectIdentityHub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ưu tiên tab từ param, nếu không có thì mặc định là 'admin'
  const getInitialTab = () => {
    const tab = searchParams.get('tab');
    if (['admin', 'customer', 'collaborator', 'eventmanager'].includes(tab || '')) return tab!;
    return 'admin';
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [loadedTabs, setLoadedTabs] = useState<string[]>([getInitialTab()]);

  // Khi đổi tab, update query param
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Khi URL query param thay đổi (ví dụ reload, hoặc back/forward), update tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (
      tab &&
      tab !== activeTab &&
      ['admin', 'customer', 'collaborator', 'eventmanager'].includes(tab)
    ) {
      setActiveTab(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!loadedTabs.includes(activeTab)) {
      setLoadedTabs((prev) => [...prev, activeTab]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="p-6  min-h-screen">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex w-[600px] items-center rounded-[99px] py-4 gap-2 m-2 bg-white dark:bg-gray-800 shadow-[0_0_1px_0_rgba(24,94,224,0.15),_0_6px_12px_0_rgba(24,94,224,0.15)] dark:shadow-gray-900/20">
          <TabsTrigger
            value="admin"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-[0.8rem] font-medium !rounded-[99px] transition-all duration-150 ease-in',
              activeTab === 'admin'
                ? '!text-white bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 text-center'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            <FaUserShield className="w-4 h-4" />
            <span>Admin</span>
          </TabsTrigger>
          <TabsTrigger
            value="customer"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-[0.8rem] font-medium !rounded-[99px] transition-all duration-150 ease-in',
              activeTab === 'customer'
                ? '!text-white bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 text-center'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            <FaUser className="w-4 h-4" />
            <span>Customer</span>
          </TabsTrigger>
          <TabsTrigger
            value="collaborator"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-[0.8rem] font-medium !rounded-[99px] transition-all duration-150 ease-in',
              activeTab === 'collaborator'
                ? '!text-white bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-lg text-sm px-5 text-center'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            <FaUsers className="w-4 h-4" />
            <span>Collaborator</span>
          </TabsTrigger>
          <TabsTrigger
            value="eventmanager"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-[0.8rem] font-medium !rounded-[99px] transition-all duration-150 ease-in',
              activeTab === 'eventmanager'
                ? '!text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 text-center'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            <FaUserTie className="w-4 h-4" />
            <span>Event Manager</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="admin" className="mt-0">
          {loadedTabs.includes('admin') && <AdminList key={`admin-${refreshKey}`} />}
        </TabsContent>
        <TabsContent value="customer" className="mt-0">
          {loadedTabs.includes('customer') && <CustomerList key={`customer-${refreshKey}`} />}
        </TabsContent>
        <TabsContent value="collaborator" className="mt-0">
          {loadedTabs.includes('collaborator') && (
            <CollaboratorList key={`collaborator-${refreshKey}`} />
          )}
        </TabsContent>
        <TabsContent value="eventmanager" className="mt-0">
          {loadedTabs.includes('eventmanager') && (
            <EventManagerList key={`eventmanager-${refreshKey}`} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

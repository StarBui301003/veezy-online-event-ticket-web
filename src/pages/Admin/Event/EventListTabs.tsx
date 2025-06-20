import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ApprovedEventList } from './ApprovedEventList';
import { PendingEventList } from './PendingEventList';
import { RejectedEventList } from './RejectedEventList';
import { FiCheckCircle, FiClock, FiX } from 'react-icons/fi';
import { getPendingEvents } from '@/services/Admin/event.service';
import { cn } from '@/lib/utils';
// import './EventTabs.css';

export default function EventListTabs() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Ưu tiên tab từ param, nếu không có thì mặc định là 'pending'
  const getInitialTab = () => {
    const tab = searchParams.get('tab');
    if (tab === 'pending' || tab === 'approved' || tab === 'rejected') return tab;
    return 'pending';
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [loadedTabs, setLoadedTabs] = useState<string[]>([getInitialTab()]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Fetch pending count
    getPendingEvents()
      .then((res) => {
        setPendingCount(res.data?.items?.length || 0);
      })
      .catch(() => setPendingCount(0));
  }, []);

  // Khi đổi tab, update query param
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Khi URL query param thay đổi (ví dụ reload, hoặc back/forward), update tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab && ['pending', 'approved', 'rejected'].includes(tab)) {
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
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex w-[500px] items-center rounded-[99px] py-4 gap-2 m-2 bg-white shadow-[0_0_1px_0_rgba(24,94,224,0.15),_0_6px_12px_0_rgba(24,94,224,0.15)]">
          <TabsTrigger
            value="pending"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-[0.8rem] font-medium !rounded-[99px] transition-all duration-150 ease-in pr-6',
              activeTab === 'pending'
                ? '!text-white bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-yellow-300 dark:focus:ring-yellow-600 shadow-lg shadow-yellow-500/50 dark:shadow-lg dark:shadow-yellow-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center '
                : 'hover:bg-gray-200 text-gray-600'
            )}
          >
            <FiClock className="w-4 h-4" />
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className="absolute flex items-center justify-center w-[0.8rem] h-[0.8rem] text-[10px] text-white rounded-full bg-red-500 -right-1 top-0 mb-2">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-[0.8rem] font-medium !rounded-[99px] transition-all duration-150 ease-in',
              activeTab === 'approved'
                ? '!text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 text-center'
                : 'hover:bg-gray-200 text-gray-600'
            )}
          >
            <FiCheckCircle className="w-4 h-4" />
            <span>Approved</span>
          </TabsTrigger>

          <TabsTrigger
            value="rejected"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-[0.8rem] font-medium !rounded-[99px] transition-all duration-150 ease-in',
              activeTab === 'rejected'
                ? '!text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 shadow-lg shadow-red-500/50 dark:shadow-lg dark:shadow-red-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center '
                : 'hover:bg-gray-200 text-gray-600'
            )}
          >
            <FiX className="w-4 h-4" />
            <span>Rejected</span>
          </TabsTrigger>
        </TabsList>

        <div>
          <TabsContent value="approved">
            {loadedTabs.includes('approved') && <ApprovedEventList />}
          </TabsContent>
          <TabsContent value="pending">
            {loadedTabs.includes('pending') && <PendingEventList />}
          </TabsContent>
          <TabsContent value="rejected">
            {loadedTabs.includes('rejected') && <RejectedEventList />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

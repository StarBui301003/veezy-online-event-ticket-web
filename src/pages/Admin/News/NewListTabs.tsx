import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import NewsOwnList from './NewsOwnList';
import { PendingNewsList } from '@/pages/Admin/News/PendingNewsList';
import { cn } from '@/lib/utils';
import { FaUser } from 'react-icons/fa';
import { FiCheckCircle, FiX } from 'react-icons/fi';
import { RejectedNewsList } from './RejectedNewsList';
import { ApprovedNewsList } from './ApprovedNewsList';
import { connectNewsHub, onNews, offNews } from '@/services/signalr.service';

export function NewsListTabs() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Ưu tiên tab từ param, nếu không có thì mặc định là 'pending'
  const getInitialTab = () => {
    const tab = searchParams.get('tab');
    if (tab === 'pending' || tab === 'approved' || tab === 'rejected' || tab === 'own') return tab;
    return 'pending';
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [loadedTabs, setLoadedTabs] = useState<string[]>([getInitialTab()]);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = () => {
    import('@/services/Admin/news.service').then(({ getPendingNews }) => {
      getPendingNews({ page: 1, pageSize: 1 })
        .then((res) => {
          setPendingCount(res.data?.totalItems || 0);
        })
        .catch(() => setPendingCount(0));
    });
  };

  useEffect(() => {
    const NEWS_HUB_URL = (import.meta.env.VITE_NEWS_HUB_URL as string) || '/newsHub';
    connectNewsHub(NEWS_HUB_URL);
    // Lắng nghe realtime SignalR cho news
    const reloadNews = () => fetchPendingCount();
    onNews('OnNewsCreated', reloadNews);
    onNews('OnNewsUpdated', reloadNews);
    onNews('OnNewsDeleted', reloadNews);
    onNews('OnNewsApproved', reloadNews);
    onNews('OnNewsRejected', reloadNews);
    onNews('OnNewsHidden', reloadNews);
    onNews('OnNewsUnhidden', reloadNews);

    // Initial fetch pending count
    fetchPendingCount();
    return () => {
      offNews('OnNewsCreated', reloadNews);
      offNews('OnNewsUpdated', reloadNews);
      offNews('OnNewsDeleted', reloadNews);
      offNews('OnNewsApproved', reloadNews);
      offNews('OnNewsRejected', reloadNews);
      offNews('OnNewsHidden', reloadNews);
      offNews('OnNewsUnhidden', reloadNews);
    };
  }, []);

  // Khi đổi tab, update query param
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Khi URL query param thay đổi (ví dụ reload, hoặc back/forward), update tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab && ['pending', 'approved', 'rejected', 'own'].includes(tab)) {
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

  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'pending' }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 min-h-screen">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full p-0">
        <TabsList className="flex w-[500px] items-center rounded-[99px] py-4 gap-2 m-2 bg-white dark:bg-gray-800 shadow-[0_0_1px_0_rgba(24,94,224,0.15),_0_6px_12px_0_rgba(24,94,224,0.15)] dark:shadow-gray-900/20">
          <TabsTrigger
            value="pending"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-[0.8rem] font-medium !rounded-[99px] transition-all duration-150 ease-in pr-6',
              activeTab === 'pending'
                ? '!text-white bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-yellow-300 shadow-lg shadow-yellow-500/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            <span className="w-4 h-4 flex items-center justify-center">
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
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
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
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
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            <FiX className="w-4 h-4" />
            <span>Rejected</span>
          </TabsTrigger>
          <TabsTrigger
            value="own"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-[0.8rem] font-medium !rounded-[99px] transition-all duration-150 ease-in',
              activeTab === 'own'
                ? '!text-white bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 shadow-lg shadow-blue-500/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            <FaUser className="w-4 h-4" />
            <span>My News</span>
          </TabsTrigger>
        </TabsList>
        <div>
          <TabsContent value="pending">
            {loadedTabs.includes('pending') && (
              <PendingNewsList onChangePending={fetchPendingCount} activeTab={activeTab} />
            )}
          </TabsContent>
          <TabsContent value="approved">
            {loadedTabs.includes('approved') && <ApprovedNewsList activeTab={activeTab} />}
          </TabsContent>
          <TabsContent value="rejected">
            {loadedTabs.includes('rejected') && <RejectedNewsList activeTab={activeTab} />}
          </TabsContent>
          <TabsContent value="own">
            {loadedTabs.includes('own') && <NewsOwnList activeTab={activeTab} />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

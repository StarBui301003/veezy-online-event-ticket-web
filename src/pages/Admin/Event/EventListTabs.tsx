import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ApprovedEventList } from './ApprovedEventList';
import { PendingEventList } from './PendingEventList';
import { RejectedEventList } from './RejectedEventList';
import { CanceledEventList } from './CanceledEventList';
import { CompletedEventList } from './CompletedEventList';
import { FiCheckCircle, FiClock, FiX, FiSlash, FiCheckSquare } from 'react-icons/fi';
import { getPendingEvents } from '@/services/Admin/event.service';
import { cn } from '@/lib/utils';
import { connectEventHub, onEvent } from '@/services/signalr.service';

// import './EventTabs.css';

export default function EventListTabs() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Ưu tiên tab từ param, nếu không có thì mặc định là 'pending'
  const getInitialTab = () => {
    const tab = searchParams.get('tab');
    if (
      tab === 'pending' ||
      tab === 'approved' ||
      tab === 'rejected' ||
      tab === 'canceled' ||
      tab === 'completed'
    )
      return tab;
    return 'pending';
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [loadedTabs, setLoadedTabs] = useState<string[]>([getInitialTab()]);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(5);
  const [approvedPage, setApprovedPage] = useState(1);
  const [approvedPageSize, setApprovedPageSize] = useState(5);
  const [rejectedPage, setRejectedPage] = useState(1);
  const [rejectedPageSize, setRejectedPageSize] = useState(5);
  const [canceledPage, setCanceledPage] = useState(1);
  const [canceledPageSize, setCanceledPageSize] = useState(5);
  const [completedPage, setCompletedPage] = useState(1);
  const [completedPageSize, setCompletedPageSize] = useState(5);

  const fetchPendingCount = () => {
    getPendingEvents()
      .then((res) => {
        setPendingCount(res.data?.items?.length || 0);
      })
      .catch(() => setPendingCount(0));
  };

  useEffect(() => {
    connectEventHub('http://localhost:5004/notificationHub');
    // Lắng nghe realtime SignalR cho event
    const reloadEvent = () => fetchPendingCount();
    onEvent('OnEventCreated', reloadEvent);
    onEvent('OnEventUpdated', reloadEvent);
    onEvent('OnEventDeleted', reloadEvent);
    onEvent('OnEventApproved', reloadEvent);
    onEvent('OnEventCancelled', reloadEvent);
    onEvent('OnEventHidden', reloadEvent);
    onEvent('OnEventShown', reloadEvent);
  }, []);

  useEffect(() => {
    fetchPendingCount();
  }, []);

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
      ['pending', 'approved', 'rejected', 'canceled', 'completed'].includes(tab)
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
  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'pending' }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 min-h-screen">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex w-[650px] items-center rounded-[99px] py-4 gap-2 m-2 bg-white dark:bg-gray-800 shadow-[0_0_1px_0_rgba(24,94,224,0.15),_0_6px_12px_0_rgba(24,94,224,0.15)] dark:shadow-gray-900/20">
          <TabsTrigger
            value="pending"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-[0.8rem] font-medium !rounded-[99px] transition-all duration-150 ease-in pr-6',
              activeTab === 'pending'
                ? '!text-white bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-yellow-300 dark:focus:ring-yellow-600 shadow-lg shadow-yellow-500/50 dark:shadow-lg dark:shadow-yellow-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center '
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
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
            value="canceled"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-[0.8rem] font-medium !rounded-[99px] transition-all duration-150 ease-in',
              activeTab === 'canceled'
                ? '!text-white bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center '
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            <FiSlash className="w-4 h-4" />
            <span>Canceled</span>
          </TabsTrigger>

          <TabsTrigger
            value="completed"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-[0.8rem] font-medium !rounded-[99px] transition-all duration-150 ease-in',
              activeTab === 'completed'
                ? '!text-white bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 shadow-lg shadow-blue-500/50 dark:shadow-lg dark:shadow-blue-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center '
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            <FiCheckSquare className="w-4 h-4" />
            <span>Completed</span>
          </TabsTrigger>
        </TabsList>

        <div>
          <TabsContent value="approved">
            {loadedTabs.includes('approved') && (
              <ApprovedEventList
                page={approvedPage}
                pageSize={approvedPageSize}
                setPage={setApprovedPage}
                setPageSize={setApprovedPageSize}
              />
            )}
          </TabsContent>
          <TabsContent value="pending">
            {loadedTabs.includes('pending') && (
              <PendingEventList
                page={pendingPage}
                pageSize={pendingPageSize}
                setPage={setPendingPage}
                setPageSize={setPendingPageSize}
                onTotalChange={setPendingCount}
              />
            )}
          </TabsContent>
          <TabsContent value="rejected">
            {loadedTabs.includes('rejected') && (
              <RejectedEventList
                page={rejectedPage}
                pageSize={rejectedPageSize}
                setPage={setRejectedPage}
                setPageSize={setRejectedPageSize}
              />
            )}
          </TabsContent>
          <TabsContent value="canceled">
            {loadedTabs.includes('canceled') && (
              <CanceledEventList
                page={canceledPage}
                pageSize={canceledPageSize}
                setPage={setCanceledPage}
                setPageSize={setCanceledPageSize}
              />
            )}
          </TabsContent>
          <TabsContent value="completed">
            {loadedTabs.includes('completed') && (
              <CompletedEventList
                page={completedPage}
                pageSize={completedPageSize}
                setPage={setCompletedPage}
                setPageSize={setCompletedPageSize}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

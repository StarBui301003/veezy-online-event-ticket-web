import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PendingWithdrawList } from './PendingWithdrawList';
import { ProcessingWithdrawList } from './ProcessingWithdrawList';
import { SuccessfulWithdrawList } from './SuccessfulWithdrawList';
import { AllWithdrawRequests } from './AllWithdrawRequests';
import { RejectedWithdrawList } from './RejectedWithdrawList';
import { FaClock, FaCog, FaCheckCircle, FaList, FaTimesCircle } from 'react-icons/fa';
import { getPendingWithdrawals } from '@/services/Admin/fund.service';
import { connectFundHub, onFund } from '@/services/signalr.service';

const TABS = [
  { label: 'All', value: 'all', icon: <FaList className="w-4 h-4" /> },
  { label: 'Pending', value: 'pending', icon: <FaClock className="w-4 h-4" /> },
  { label: 'Processing', value: 'processing', icon: <FaCog className="w-4 h-4" /> },
  { label: 'Successful', value: 'successful', icon: <FaCheckCircle className="w-4 h-4" /> },
  { label: 'Rejected', value: 'rejected', icon: <FaTimesCircle className="w-4 h-4" /> },
];

export function FundTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const getInitialTab = () => {
    const tab = searchParams.get('tab');
    if (TABS.some((t) => t.value === tab)) return tab as string;
    return 'all';
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [loadedTabs, setLoadedTabs] = useState<string[]>([getInitialTab()]);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending count
  const fetchPendingCount = () => {
    getPendingWithdrawals({ Page: 1, PageSize: 1 })
      .then((res) => {
        setPendingCount(res.data?.data?.totalItems || 0);
      })
      .catch(() => setPendingCount(0));
  };

  // Hàm này sẽ được truyền xuống các tab con
  const handlePendingChanged = () => {
    fetchPendingCount();
  };

  useEffect(() => {
    // Luôn truyền token khi connectFundHub
    const token = localStorage.getItem('access_token');
    connectFundHub('https://ticket.vezzy.site/fundHub', token);

    // Listen for fund-related events
    const reloadPendingCount = () => {
      console.log('Fund event received, refreshing pending count...');
      fetchPendingCount();
    };

    onFund('OnWithdrawalRequested', reloadPendingCount);
    onFund('OnWithdrawalStatusChanged', reloadPendingCount);
    onFund('OnWithdrawalApproved', reloadPendingCount);
    onFund('OnWithdrawalRejected', reloadPendingCount);
    onFund('OnPaymentConfirmed', reloadPendingCount);
    onFund('OnFundCreated', reloadPendingCount);
    onFund('OnBalanceUpdated', reloadPendingCount);

    // Cleanup function
    return () => {
      // Note: We don't disconnect the hub here as it might be used by other components
    };
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
    if (tab && tab !== activeTab && TABS.some((t) => t.value === tab)) {
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
      setSearchParams({ tab: 'all' }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 min-h-screen">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full p-0">
        <TabsList className="flex w-[700px] items-center rounded-[99px] py-4 gap-2 bg-white dark:bg-gray-800 shadow-[0_0_1px_0_rgba(24,94,224,0.15),_0_6px_12px_0_rgba(24,94,224,0.15)] dark:shadow-gray-900/20 border dark:border-gray-700">
          {TABS.map((t) => {
            let activeClass = '';
            let hoverClass = '';
            if (t.value === 'pending') {
              activeClass =
                '!text-white bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-yellow-300 dark:focus:ring-yellow-600 shadow-lg shadow-yellow-500/50 dark:shadow-lg dark:shadow-yellow-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center border border-yellow-500';
              hoverClass =
                'hover:bg-yellow-100 dark:hover:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-transparent';
            } else if (t.value === 'processing') {
              activeClass =
                '!text-white bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 shadow-lg shadow-blue-500/50 dark:shadow-lg dark:shadow-blue-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center border border-blue-600';
              hoverClass =
                'hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-transparent';
            } else if (t.value === 'successful') {
              activeClass =
                '!text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 shadow-lg shadow-green-500/50 dark:shadow-lg dark:shadow-green-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center border border-green-600';
              hoverClass =
                'hover:bg-green-100 dark:hover:bg-green-900/20 text-green-700 dark:text-green-300 border border-transparent';
            } else if (t.value === 'rejected') {
              activeClass =
                '!text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 shadow-lg shadow-red-500/50 dark:shadow-lg dark:shadow-red-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center border border-red-600';
              hoverClass =
                'hover:bg-red-100 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300 border border-transparent';
            } else if (t.value === 'all') {
              activeClass =
                '!text-white bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center border border-gray-600';
              hoverClass =
                'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-transparent';
            }
            return (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className={`relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-[0.8rem] font-medium !rounded-[99px] transition-all duration-150 ease-in
                  ${activeTab === t.value ? activeClass : hoverClass}
                `}
              >
                {t.icon}
                <span>{t.label}</span>
                {t.value === 'pending' && pendingCount > 0 && (
                  <span className="absolute flex items-center justify-center w-[0.8rem] h-[0.8rem] text-[10px] text-white rounded-full bg-red-500 -right-1 top-0 mb-2">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
        <div>
          <TabsContent value="all">
            {loadedTabs.includes('all') && (
              <AllWithdrawRequests onPendingChanged={handlePendingChanged} />
            )}
          </TabsContent>
          <TabsContent value="pending">
            {loadedTabs.includes('pending') && (
              <PendingWithdrawList onPendingChanged={handlePendingChanged} />
            )}
          </TabsContent>
          <TabsContent value="processing">
            {loadedTabs.includes('processing') && (
              <ProcessingWithdrawList onProcessingChanged={handlePendingChanged} />
            )}
          </TabsContent>
          <TabsContent value="successful">
            {loadedTabs.includes('successful') && <SuccessfulWithdrawList />}
          </TabsContent>
          <TabsContent value="rejected">
            {loadedTabs.includes('rejected') && (
              <RejectedWithdrawList onRejectedChanged={handlePendingChanged} />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

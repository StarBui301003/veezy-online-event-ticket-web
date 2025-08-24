import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { FaMoneyBillWave, FaUsers, FaRegNewspaper, FaUser } from 'react-icons/fa';
import { RiDashboard2Fill } from 'react-icons/ri';
import { useSearchParams } from 'react-router-dom';

import { OverviewTabs } from './OverviewTabs';
import UserTabs from './UserTabs';
import FinancialTabs from './FinancialTabs';
import EventTabs from './EventTabs';
import NewsTabs from './NewsTabs';

export default function DashboardTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');
  const overviewBadge = 0;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  return (
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex w-[700px] items-center rounded-[99px] py-4 gap-2 m-2 bg-white dark:bg-gray-800 shadow-[0_0_1px_0_rgba(24,94,224,0.15),_0_6px_12px_0_rgba(24,94,224,0.15)] dark:shadow-gray-900/20">
          <TabsTrigger
            value="overview"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-sm font-medium !rounded-[99px] transition-all duration-150 ease-in px-5',
              activeTab === 'overview'
                ? '!text-white bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 text-center'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            <RiDashboard2Fill className="w-4 h-4" /> Overview
            {overviewBadge > 0 && (
              <span className="absolute flex items-center justify-center w-[0.8rem] h-[0.8rem] text-[10px] text-white rounded-full bg-red-500 -right-1 top-0 mb-2">
                {overviewBadge}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="user"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-sm font-medium !rounded-[99px] transition-all duration-150 ease-in px-5',
              activeTab === 'user'
                ? '!text-white bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-pink-300 font-medium rounded-lg text-sm px-5 text-center'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            <FaUser className="w-4 h-4" /> User
          </TabsTrigger>
          <TabsTrigger
            value="revenue"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-sm font-medium !rounded-[99px] transition-all duration-150 ease-in px-5',
              activeTab === 'revenue'
                ? '!text-white bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-lg text-sm px-5 text-center'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            <FaMoneyBillWave className="w-4 h-4" /> Financial
          </TabsTrigger>
          <TabsTrigger
            value="event"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-sm font-medium !rounded-[99px] transition-all duration-150 ease-in px-5',
              activeTab === 'event'
                ? '!text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 text-center'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            <FaUsers className="w-4 h-4" /> Event
          </TabsTrigger>
          <TabsTrigger
            value="news"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-sm font-medium !rounded-[99px] transition-all duration-150 ease-in px-5',
              activeTab === 'news'
                ? '!text-white bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 text-center'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            <FaRegNewspaper className="w-4 h-4" /> News
          </TabsTrigger>
        </TabsList>
        <div>
          <TabsContent value="overview">{activeTab === 'overview' && <OverviewTabs />}</TabsContent>
          <TabsContent value="user">{activeTab === 'user' && <UserTabs isActive />}</TabsContent>
          <TabsContent value="revenue">
            {activeTab === 'revenue' && <FinancialTabs isActive />}
          </TabsContent>
          <TabsContent value="event">{activeTab === 'event' && <EventTabs isActive />}</TabsContent>
          <TabsContent value="news">{activeTab === 'news' && <NewsTabs />}</TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

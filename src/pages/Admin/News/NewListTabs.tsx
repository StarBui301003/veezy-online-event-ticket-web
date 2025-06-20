import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FaListAlt, FaUser } from 'react-icons/fa';
import NewsOwnList from './NewsOwnList';
import NewsList from './NewsList';
import { cn } from '@/lib/utils';

export function NewsListTabs() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Ưu tiên tab từ param, nếu không có thì mặc định là 'all'
  const getInitialTab = () => {
    const tab = searchParams.get('tab');
    if (tab === 'all' || tab === 'own') return tab;
    return 'all';
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
    if (tab && tab !== activeTab && ['all', 'own'].includes(tab)) {
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
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full p-0">
        <TabsList className="flex w-[350px] items-center rounded-[99px] py-4 gap-2 bg-white shadow-[0_0_1px_0_rgba(24,94,224,0.15),_0_6px_12px_0_rgba(24,94,224,0.15)]">
          <TabsTrigger
            value="all"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-[0.8rem] font-medium !rounded-[99px] transition-all duration-150 ease-in',
              activeTab === 'all'
                ? '!text-white bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 shadow-lg shadow-blue-500/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center'
                : 'hover:bg-gray-200 text-gray-600'
            )}
          >
            <FaListAlt className="w-4 h-4" />
            <span>All News</span>
          </TabsTrigger>
          <TabsTrigger
            value="own"
            className={cn(
              'relative flex items-center justify-center gap-2 h-[30px] flex-1 min-w-[50px] text-[0.8rem] font-medium !rounded-[99px] transition-all duration-150 ease-in',
              activeTab === 'own'
                ? '!text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 shadow-lg shadow-green-500/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center'
                : 'hover:bg-gray-200 text-gray-600'
            )}
          >
            <FaUser className="w-4 h-4" />
            <span>My News</span>
          </TabsTrigger>
        </TabsList>
        <div>
          <TabsContent value="all">{loadedTabs.includes('all') && <NewsList />}</TabsContent>
          <TabsContent value="own">{loadedTabs.includes('own') && <NewsOwnList />}</TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

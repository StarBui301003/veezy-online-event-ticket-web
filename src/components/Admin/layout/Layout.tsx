import { Outlet, useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { AppSidebar } from '@/components/Admin/Sidebar/components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import ScrollToTop from '@/components/common/ScrollToTop';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { updateUserConfig, getUserConfig } from '@/services/userConfig.service';
import { toast } from 'react-toastify';
import ThemeToggle from '@/components/Admin/ThemeToggle';
import { ThemeProvider } from '@/contexts/ThemeContext';
// Helper: get userId from localStorage
const getUserId = () => {
  const accStr = typeof window !== 'undefined' ? localStorage.getItem('account') : null;
  if (!accStr) return null;
  try {
    const acc = JSON.parse(accStr);
    return acc.userId || acc.accountId || null;
  } catch {
    return null;
  }
};

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

function isId(segment: string) {
  // Kiểm tra là số hoặc uuid
  return (
    /^\d+$/.test(segment) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(segment)
  );
}

// Replace this with your actual global loading state logic
const useGlobalLoading = () => {
  // return true if loading, false otherwise
  return false;
};

export function AdminLayout() {
  const { t, i18n: i18nInstance } = useTranslation();
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

  // Helper: update language in user config
  const handleChangeLanguage = async (lang: 'vi' | 'en') => {
    try {
      // Change i18n language immediately for UI responsiveness
      i18n.changeLanguage(lang);

      const userId = getUserId();
      if (!userId) {
        console.warn('No userId found, language changed locally only');
        return;
      }

      // Get current user config
      const res = await getUserConfig(userId);
      if (res?.data) {
        const newConfig = {
          ...res.data,
          language: lang === 'vi' ? 1 : 0,
        };

        // Update user config via API
        await updateUserConfig(userId, newConfig);

        // Save to localStorage
        localStorage.setItem('user_config', JSON.stringify(newConfig));

        // Show success toast using translation
        toast.success(t('languageChangedSuccessfully'));
      } else {
        console.error('Failed to get user config');
        toast.error(t('languageChangeFailed'));
      }
    } catch (error) {
      console.error('Error updating language:', error);
      toast.error(t('languageChangeFailed'));
    }
  };

  // Load language from localStorage on mount
  useEffect(() => {
    const loadLanguageFromStorage = () => {
      try {
        const userConfigStr = localStorage.getItem('user_config');
        if (userConfigStr) {
          const userConfig = JSON.parse(userConfigStr);
          if (userConfig.language !== undefined) {
            const languageCode = userConfig.language === 1 ? 'vi' : 'en';
            if (i18nInstance.language !== languageCode) {
              i18nInstance.changeLanguage(languageCode);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load language from localStorage:', error);
      }
    };

    loadLanguageFromStorage();
  }, [i18nInstance]);

  // Đặt PAGE_TITLES vào trong component để dùng được t()
  const PAGE_TITLES: Record<string, string> = {
    dashboard: 'Dashboard',
    users: t('users'),
    events: t('events'),
    'order-list': t('ordersList'),
    'user-list': t('usersList'),
    'payment-list': t('paymentsList'),
    'category-list': t('categoriesList'),
    'discountCode-list': t('discountCodesList'),
    'event-list': t('eventsList'),
    'report-list': t('reportsList'),
    'comment-list': t('commentsList'),
    'news-list': t('newsList'),
    'news-own-list': t('myNewsList'),
    chatbox: 'Chatbox',
  };

  // Thêm state và effect cho nút go to top
  const [showGoTop, setShowGoTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowGoTop(window.scrollY > 100);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleGoTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loading = useGlobalLoading();

  return (
    <ThemeProvider>
      <ScrollToTop />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 justify-between">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {/* Dashboard luôn ở đầu */}
                  <BreadcrumbItem>
                    {pathnames.length === 1 && pathnames[0] === 'admin' ? (
                      <BreadcrumbPage className="font-bold dark:text-white text-black">
                        {t('adminDashboard')}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to="/admin" className="dark:text-white text-black">
                          {t('adminDashboard')}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {pathnames.length > 1 &&
                    pathnames.slice(1).map((name, idx) => {
                      let title = t(
                        PAGE_TITLES[name] || name.charAt(0).toUpperCase() + name.slice(1)
                      );
                      // Custom cho detail nếu cần
                      if (isId(name)) {
                        if (pathnames[idx] === 'users') title = t('userDetail');
                        if (pathnames[idx] === 'events') title = t('eventDetail');
                        if (pathnames[idx] === 'order') title = t('orderDetail');
                      }
                      const to = '/admin/' + pathnames.slice(1, idx + 2).join('/');
                      const isLast = idx === pathnames.length - 2;
                      return (
                        <div className="flex items-center gap-2" key={to}>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            {isLast ? (
                              <BreadcrumbPage className="dark:text-white text-black">
                                {title}
                              </BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink asChild>
                                <Link to={to} className="dark:text-white text-black">
                                  {title}
                                </Link>
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                        </div>
                      );
                    })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Dropdown EN/VN đẹp ở góc phải header */}
            <div className="flex items-center pr-6 gap-4">
              <ThemeToggle className="scale-75" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#e9e6e6] dark:bg-gray-500 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-semibold shadow hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500">
                    <Globe className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    {i18nInstance.language === 'vi' ? t('vn') : t('en')}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-lg shadow-xl bg-white dark:bg-gray-800 p-2 min-w-[140px] border border-gray-200 dark:border-gray-600"
                >
                  <DropdownMenuItem
                    onClick={() => handleChangeLanguage('vi')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-150 font-semibold ${
                      i18nInstance.language === 'vi'
                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-lg">🇻🇳</span> {t('tiengViet')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleChangeLanguage('en')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-150 font-semibold ${
                      i18nInstance.language === 'en'
                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-lg">🇬🇧</span> {t('english')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="morphing-gradient-bg flex flex-1 flex-col p-4 pt-0 relative dark:bg-gray-900">
            <SpinnerOverlay show={loading} />
            <Outlet />
          </div>
          {showGoTop && (
            <button
              onClick={handleGoTop}
              className="fixed bottom-6 right-6 z-50 size-10 rounded-full bg-white dark:bg-gray-800 text-black dark:text-white shadow-lg hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition"
              aria-label={t('goToTop')}
            >
              ↑
            </button>
          )}
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

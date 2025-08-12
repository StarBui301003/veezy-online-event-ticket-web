/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { useTheme } from '@/contexts/ThemeContext';
import { updateUserConfigAndTriggerUpdate } from '@/utils/account-utils';
import { getCurrentUserId } from '@/utils/account-utils';

// Custom scrollbar styles - will be updated dynamically based on theme

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

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

// ✅ Component wrapper để đảm bảo theme context sẵn sàng
function AdminLayoutContent() {
  const { t, i18n: i18nInstance } = useTranslation();

  // ✅ Sử dụng hooks một cách an toàn
  const themeClasses = useThemeClasses();
  const themeContext = useTheme();

  // ✅ Kiểm tra xem theme context có sẵn sàng không - chỉ check một lần
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    // ✅ Chỉ set theme ready một lần khi component mount, không reset khi theme thay đổi
    if (themeContext && themeClasses && !isThemeReady) {
      setIsThemeReady(true);
    }
  }, [themeContext, themeClasses, isThemeReady]);

  const { getThemeClass } = themeClasses || {
    getThemeClass: (lightClass: string, _darkClass: string) => lightClass,
  };
  const { resetThemeForNewUser } = themeContext || {
    resetThemeForNewUser: () => {},
  };

  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

  // Check and reset theme when admin layout mounts
  // This is still needed as a fallback for cases where login event might not fire
  useEffect(() => {
    if (resetThemeForNewUser && !isThemeReady) {
      console.log('Admin layout mounted, resetting theme for new user');
      resetThemeForNewUser();
    }
  }, [resetThemeForNewUser, isThemeReady]);

  // Check and update theme when user changes (login/logout)
  useEffect(() => {
    if (!resetThemeForNewUser || !isThemeReady) return;

    const checkUserAndUpdateTheme = () => {
      console.log('User changed, updating theme');
      resetThemeForNewUser();
    };

    // Listen for user changes
    window.addEventListener('authChanged', checkUserAndUpdateTheme);
    window.addEventListener('user-updated', checkUserAndUpdateTheme);
    window.addEventListener('login', checkUserAndUpdateTheme);

    return () => {
      window.removeEventListener('authChanged', checkUserAndUpdateTheme);
      window.removeEventListener('user-updated', checkUserAndUpdateTheme);
      window.removeEventListener('login', checkUserAndUpdateTheme);
    };
  }, [resetThemeForNewUser, isThemeReady]);

  // Helper: update language in user config
  const [isLanguageLoading, setIsLanguageLoading] = useState(false);

  const handleChangeLanguage = async (lang: 'vi' | 'en') => {
    // ✅ Prevent multiple rapid clicks
    if (isLanguageLoading) {
      return;
    }

    // ✅ Kiểm tra xem language có thực sự thay đổi không
    if (i18nInstance.language === lang) {
      console.log('Language already matches, skipping update:', lang);
      return;
    }

    setIsLanguageLoading(true);

    try {
      // Change i18n language immediately for UI responsiveness
      i18n.changeLanguage(lang);

      const userId = getCurrentUserId();
      if (!userId) {
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

        // Save to localStorage with proper event triggering
        updateUserConfigAndTriggerUpdate(newConfig);

        // Show success toast using translation
        toast.success(t('languageChangedSuccessfully'));
      } else {
        toast.error(t('languageChangeFailed'));
      }
    } catch (error) {
      toast.error(t('languageChangeFailed'));
    } finally {
      setIsLanguageLoading(false);
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
            // ✅ Chỉ thay đổi language nếu thực sự khác biệt
            if (i18nInstance.language !== languageCode) {
              console.log('Loading language from localStorage:', languageCode);
              i18nInstance.changeLanguage(languageCode);
            }
          }
        }
      } catch (error) {
        // Silent error handling
      }
    };

    // ✅ Chỉ load language một lần khi component mount
    loadLanguageFromStorage();
  }, []); // ✅ Bỏ i18nInstance dependency để tránh vòng lặp

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

  // ✅ Hiển thị loading khi theme chưa sẵn sàng
  if (!isThemeReady) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center transition-all duration-300 ease-in-out">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
            Loading theme...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header
            className={cn(
              'flex h-14 shrink-0 items-center gap-2 border-b justify-between transition-all duration-300 ease-in-out',
              getThemeClass(
                'border-gray-200 bg-white',
                'border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600'
              )
            )}
          >
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger
                className={cn(
                  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-6 w-6 -ml-1',
                  getThemeClass('text-gray-900', 'text-black dark:text-white')
                )}
              />
              <Separator orientation="vertical" className="mr-2 h-3" />
              <Breadcrumb>
                <BreadcrumbList>
                  {/* Dashboard luôn ở đầu */}
                  <BreadcrumbItem>
                    {pathnames.length === 1 && pathnames[0] === 'admin' ? (
                      <BreadcrumbPage
                        className={cn(
                          'font-bold transition-colors duration-300 ease-in-out',
                          getThemeClass('text-gray-900', 'dark:text-white text-black')
                        )}
                      >
                        {t('adminDashboard')}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link
                          to="/admin"
                          className={cn(
                            'transition-colors duration-300 ease-in-out',
                            getThemeClass('text-gray-900', 'dark:text-white text-black')
                          )}
                        >
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
                              <BreadcrumbPage className="dark:text-white text-black transition-colors duration-300 ease-in-out">
                                {title}
                              </BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink asChild>
                                <Link
                                  to={to}
                                  className="dark:text-white text-black transition-colors duration-300 ease-in-out"
                                >
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
            <div className="flex items-center pr-6 gap-3">
              <ThemeToggle className="scale-[70%]" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[#e9e6e6] dark:bg-gray-500 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-semibold shadow hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 text-sm">
                    <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    {i18nInstance.language === 'vi' ? t('vn') : t('en')}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-lg shadow-xl bg-white dark:bg-gray-800 p-2 min-w-[140px] border border-gray-200 dark:border-gray-600 transition-all duration-300 ease-in-out"
                >
                  <DropdownMenuItem
                    onClick={() => handleChangeLanguage('vi')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-300 ease-in-out font-semibold text-gray-900 dark:text-white ${
                      i18nInstance.language === 'vi'
                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-lg">🇻🇳</span> {t('tiengViet')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleChangeLanguage('en')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-300 ease-in-out font-semibold text-gray-900 dark:text-white ${
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
          <div
            className={cn(
              'morphing-gradient-bg dark:morphing-gradient-bg-dark flex flex-1 flex-col p-4 pt-0 relative transition-all duration-300 ease-in-out',
              getThemeClass(
                'bg-gradient-to-br from-blue-50 to-indigo-100',
                'bg-gray-50 dark:bg-gray-900'
              )
            )}
          >
            <SpinnerOverlay show={loading} fullScreen={false} />
            <Outlet />
          </div>
          {showGoTop && (
            <button
              onClick={handleGoTop}
              className="fixed bottom-6 right-6 z-50 size-10 rounded-full bg-white dark:bg-gray-800 text-black dark:text-white shadow-lg hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all duration-300 ease-in-out"
              aria-label={t('goToTop')}
            >
              ↑
            </button>
          )}
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}

// ✅ Main component với error boundary
export function AdminLayout() {
  return <AdminLayoutContent />;
}

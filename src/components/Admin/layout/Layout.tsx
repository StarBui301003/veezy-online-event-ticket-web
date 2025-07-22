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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
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

  // Đặt PAGE_TITLES vào trong component để dùng được t()
  const PAGE_TITLES: Record<string, string> = {
    users: t('users'),
    events: t('events'),
    'approved-events-list': t('approvedEventsList'),
    'rejected-events-list': t('rejectedEventsList'),
    'pending-events-list': t('pendingEventsList'),
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
    <>
      <ScrollToTop />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-300 bg-white justify-between">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {/* Dashboard luôn ở đầu */}
                  <BreadcrumbItem>
                    {pathnames.length === 1 && pathnames[0] === 'admin' ? (
                      <BreadcrumbPage className="font-bold">{t('adminDashboard')}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to="/admin">{t('adminDashboard')}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {pathnames.length > 1 &&
                    pathnames.slice(1).map((name, idx) => {
                      let title = t(PAGE_TITLES[name] || name.charAt(0).toUpperCase() + name.slice(1));
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
                              <BreadcrumbPage>{title}</BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink asChild>
                                <Link to={to}>{title}</Link>
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
            <div className="flex items-center pr-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-800 font-semibold shadow hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                    <Globe className="w-5 h-5 text-gray-500" />
                    {i18nInstance.language === 'vi' ? t('vn') : t('en')}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-lg shadow-xl bg-white p-2 min-w-[140px] border border-gray-200">
                  <DropdownMenuItem
                    onClick={() => i18n.changeLanguage('vi')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-150 font-semibold ${
                      i18nInstance.language === 'vi'
                        ? 'bg-gray-200 text-gray-900'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">🇻🇳</span> {t('tiengViet')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => i18n.changeLanguage('en')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-150 font-semibold ${
                      i18nInstance.language === 'en'
                        ? 'bg-gray-200 text-gray-900'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">🇬🇧</span> {t('english')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="morphing-gradient-bg flex flex-1 flex-col p-4 pt-0 relative">
            <SpinnerOverlay show={loading} />
            <Outlet />
          </div>
          {showGoTop && (
            <button
              onClick={handleGoTop}
              className="fixed bottom-6 right-6 z-50 size-10 rounded-full bg-white text-black shadow-lg hover:bg-black hover:text-white transition"
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

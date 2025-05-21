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

const PAGE_TITLES: Record<string, string> = {
  users: 'Users',
  events: 'Events',
  'approved-events-list': 'Approved Events',
  // Thêm các path khác nếu có
};

function isId(segment: string) {
  // Kiểm tra là số hoặc uuid
  return (
    /^\d+$/.test(segment) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(segment)
  );
}

export function AdminLayout() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {/* Dashboard luôn ở đầu */}
                <BreadcrumbItem>
                  {pathnames.length === 1 && pathnames[0] === 'admin' ? (
                    <BreadcrumbPage className="font-bold">Dashboard</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to="/admin">Dashboard</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {pathnames.length > 1 &&
                  pathnames.slice(1).map((name, idx) => {
                    let title = PAGE_TITLES[name] || name.charAt(0).toUpperCase() + name.slice(1);
                    // Custom cho detail nếu cần
                    if (isId(name)) {
                      if (pathnames[idx] === 'users') title = 'User Detail';
                      if (pathnames[idx] === 'events') title = 'Event Detail';
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
        </header>
        <div className="flex flex-1 flex-col p-4 pt-0">
          <Outlet />
        </div>
        {showGoTop && (
          <button
            onClick={handleGoTop}
            className="fixed bottom-6 right-6 z-50 size-10 rounded-full bg-white text-black shadow-lg hover:bg-black hover:text-white transition"
            aria-label="Go to top"
          >
            ↑
          </button>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

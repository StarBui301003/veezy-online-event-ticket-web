import { Outlet } from 'react-router-dom';
import { Header } from '@/components/User/layout/Header';
import { Footer } from '@/components/User/layout/Footer';
import { useEffect, useState } from 'react';
import ScrollToTop from '@/components/common/ScrollToTop';
import { UnifiedCustomerChat } from '@/components/Customer';

export function Layout() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Nếu đã đăng nhập thì chuyển hướng theo role
    const accStr = localStorage.getItem('account');
    const accessToken = localStorage.getItem('access_token');
    if (accStr && accessToken) {
      try {
        const accObj = JSON.parse(accStr);
        if (accObj && typeof accObj.role === 'number') {
          if (accObj.role === 0) {
            // Nếu là admin, luôn chuyển hướng về /admin khi vào trang chủ
            if (window.location.pathname === '/') {
              window.location.replace('/admin');
              return;
            }
          }
          // Không ép role 2 về /event-manager, cho phép họ ở lại Home
          if (accObj.role === 2 && window.location.pathname === '/') {
            return; // Nếu đang ở Home, không chuyển hướng
          }
          if (accObj.role === 2) {
            window.location.replace('/event-manager');
            return;
          }
        }
      } catch {
        localStorage.removeItem('account');
      }
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setShow(window.scrollY > 100);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleGoTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <ScrollToTop />
      <Header />
      <Outlet />
      <Footer />
      
      {/* Unified Customer Chat - Available on all customer pages */}
      <UnifiedCustomerChat />
      
      {show && (
        <button
          onClick={handleGoTop}
          className="fixed bottom-6 left-6 z-40 rounded-full bg-primary text-primary-foreground shadow-lg p-3 hover:bg-primary/90 transition"
          aria-label="Go to top"
        >
          ↑
        </button>
      )}
    </>
  );
}

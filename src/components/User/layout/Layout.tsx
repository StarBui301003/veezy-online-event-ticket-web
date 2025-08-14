import { Outlet } from 'react-router-dom';
import { Header } from '@/components/User/layout/Header';
import { Footer } from '@/components/User/layout/Footer';
import { useEffect } from 'react';
import ScrollToTop from '@/components/common/ScrollToTop';
import { CustomerChatBox } from '@/components/Customer';
import { useTheme } from '@/contexts/ThemeContext';

export function Layout() {
  const { resetThemeForNewUser, theme, setTheme } = useTheme();

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

    // Check and reset theme when user layout mounts
    // This is still needed as a fallback for cases where login event might not fire
    resetThemeForNewUser();
  }, []); // Remove resetThemeForNewUser from dependencies to avoid infinite loop

  // Check and update theme when user changes (login/logout)
  useEffect(() => {
    const checkUserAndUpdateTheme = () => {
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
  }, []); // Empty dependency array - only run once on mount

  // Handle theme changes for guest users
  useEffect(() => {
    const handleThemeChange = () => {
      // Nếu là guest user (chưa đăng nhập), lưu theme vào localStorage
      const accStr = localStorage.getItem('account');
      const accessToken = localStorage.getItem('access_token');

      if (!accStr || !accessToken) {
        // Guest user - save theme to localStorage
        if (theme) {
          localStorage.setItem('guest_theme', theme);
          console.log('🎨 Guest theme saved to localStorage:', theme);
        }
      }
    };

    // Lắng nghe sự kiện thay đổi theme
    window.addEventListener('themeChanged', handleThemeChange);

    // Lắng nghe sự kiện từ ThemeContext
    const handleThemeUpdate = () => {
      handleThemeChange();
    };

    window.addEventListener('userConfigUpdated', handleThemeUpdate);

    return () => {
      window.removeEventListener('themeChanged', handleThemeUpdate);
      window.removeEventListener('userConfigUpdated', handleThemeUpdate);
    };
  }, [theme]);

  // Load guest theme when component mounts (for returning guests)
  useEffect(() => {
    const accStr = localStorage.getItem('account');
    const accessToken = localStorage.getItem('access_token');

    // Chỉ áp dụng guest theme nếu chưa đăng nhập
    if (!accStr || !accessToken) {
      const guestTheme = localStorage.getItem('guest_theme');
      if (guestTheme && (guestTheme === 'light' || guestTheme === 'dark') && guestTheme !== theme) {
        console.log('🎨 Loading guest theme from localStorage:', guestTheme);
        setTheme(guestTheme as 'light' | 'dark');
      }
    }
  }, []); // Chỉ chạy 1 lần khi mount

  return (
    <>
      <ScrollToTop />
      <Header />
      <div className="pt-[60px] sm:pt-[80px]">
        <Outlet />
      </div>
      <Footer />

      {/* Customer Chat Box - Available on all customer pages */}
      <CustomerChatBox />
    </>
  );
}

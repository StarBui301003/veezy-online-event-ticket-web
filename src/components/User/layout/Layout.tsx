import { Outlet } from 'react-router-dom';
import { Header } from '@/components/User/layout/Header';
import { Footer } from '@/components/User/layout/Footer';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Layout() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

   useEffect(() => {
    // Nếu đã đăng nhập thì chuyển hướng theo role
    const accStr = localStorage.getItem('account');
    const accessToken = localStorage.getItem('access_token');
    if (accStr && accessToken) {
      try {
        const accObj = JSON.parse(accStr);
        if (accObj && typeof accObj.role === 'number') {
          if (accObj.role === 0) {
            navigate('/admin');
            return;
          }
          // Không ép role 2 về /event-manager, cho phép họ ở lại Home
          if (accObj.role === 2 && window.location.pathname === '/') {
            return; // Nếu đang ở Home, không chuyển hướng
          }
          if (accObj.role === 2) {
            navigate('/event-manager');
            return;
          }
        }
      } catch {
        localStorage.removeItem('account');
      }
    }
  }, [navigate]);

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
    <div>
      <Header />
      <Outlet />
      <Footer />
      {show && (
        <button
          onClick={handleGoTop}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-primary text-primary-foreground shadow-lg p-3 hover:bg-primary/90 transition"
          aria-label="Go to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}

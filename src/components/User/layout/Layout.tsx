import { Outlet } from 'react-router-dom';
import { Header } from '@/components/User/layout/Header';
import { Footer } from '@/components/User/layout/Footer';
import { useEffect, useState } from 'react';

export function Layout() {
  const [show, setShow] = useState(false);

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

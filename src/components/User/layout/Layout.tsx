import { Outlet } from 'react-router-dom';
import { Header } from '@/components/User/layout/Header';
import { Footer } from '@/components/User/layout/Footer';

export function Layout() {
  return (
    <div>
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}

import { createRoot } from 'react-dom/client';
import './index.css';
import App from '@/App.tsx';
import './i18n';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Lấy userId từ localStorage (nếu có)
const accStr = localStorage.getItem('account');
const userId = accStr ? JSON.parse(accStr).userId : undefined;

createRoot(document.getElementById('root')!).render(
  <NotificationProvider userId={userId}>
    <App />
  </NotificationProvider>
);
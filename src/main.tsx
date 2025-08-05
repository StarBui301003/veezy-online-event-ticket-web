import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/theme.css';
import App from '@/App.tsx';
import './i18n';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Load theme immediately to prevent flashing
const loadInitialTheme = () => {
  try {
    const userConfigStr = localStorage.getItem('user_config');
    if (userConfigStr) {
      const userConfig = JSON.parse(userConfigStr);
      if (userConfig.theme !== undefined) {
        const themeMode = userConfig.theme === 1 ? 'dark' : 'light';
        const root = document.documentElement;

        if (themeMode === 'dark') {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.add('light');
          root.classList.remove('dark');
        }
      }
    }
  } catch (error) {
    console.error('Failed to load initial theme:', error);
  }
};

// Apply theme immediately
loadInitialTheme();

// Lấy userId từ localStorage (nếu có)
const accStr = localStorage.getItem('account');
const userId = accStr ? JSON.parse(accStr).userId : undefined;

createRoot(document.getElementById('root')!).render(
  <NotificationProvider userId={userId}>
    <App />
  </NotificationProvider>
);

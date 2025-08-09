import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { AuthModalContext } from '@/contexts/AuthModalContext';

import { useNavigate, useLocation } from 'react-router-dom';

export function useRequireLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const ctx = useContext(AuthContext) as unknown;
  const user = (ctx as { user?: unknown }).user;
  const login = (ctx as { login?: unknown }).login;
  // Dùng context modal toàn cục
  const authModalCtx = useContext(AuthModalContext);

  function requireLogin(actionCallback?: () => void) {
    if (!user) {
      // Mở modal login toàn cục qua context
      if (authModalCtx && typeof authModalCtx.setShowLoginModal === 'function') {
        authModalCtx.setShowLoginModal(true);
      } else if (window.__setShowLoginModal) {
        window.__setShowLoginModal(true);
      }
    } else {
      actionCallback?.();
    }
  }

  function handleLoginSuccess() {
    // Đóng modal login toàn cục
    if (authModalCtx && typeof authModalCtx.setShowLoginModal === 'function') {
      authModalCtx.setShowLoginModal(false);
    } else if (window.__setShowLoginModal) {
      window.__setShowLoginModal(false);
    }
    if (typeof login === 'function') {
      login(); // Update global login state
      window.dispatchEvent(new Event('authChanged'));
      // Trigger login event for theme update
      window.dispatchEvent(new Event('login'));
    }

    // NEW: Wait for theme to be applied before navigation
    const waitForThemeAndNavigate = async () => {
      await new Promise((resolve) => {
        const checkThemeApplied = () => {
          const root = document.documentElement;
          const hasThemeClass = root.classList.contains('light') || root.classList.contains('dark');

          if (hasThemeClass) {
            resolve(true);
          } else {
            setTimeout(checkThemeApplied, 50);
          }
        };

        setTimeout(checkThemeApplied, 100);
      });

      // Now navigate with theme already applied
      const accStr = localStorage.getItem('account');
      let role = null;
      if (accStr) {
        try {
          const accObj = JSON.parse(accStr);
          role = accObj.role;
        } catch {
          /* empty */
        }
      }

      // Đảm bảo modal đóng xong mới chuyển trang tuyệt đối cho admin
      if (role === 0) {
        setTimeout(() => {
          window.location.replace('/admin');
        }, 0);
      } else if (role === 2) {
        navigate('/', { replace: true }); // Event manager về home customer
      } else {
        navigate(location.pathname + location.search);
      }
    };

    // Execute theme loading and navigation
    waitForThemeAndNavigate();
  }

  return {
    requireLogin,
    handleLoginSuccess,
  };
}

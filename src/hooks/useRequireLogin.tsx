import { useContext, useCallback, useRef, useEffect } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { AuthModalContext } from '@/contexts/AuthModalContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Store pending actions in memory with a cleanup function
let pendingAction: (() => Promise<void> | void) | null = null;
let cleanupPendingAction: (() => void) | null = null;

export function useRequireLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const ctx = useContext(AuthContext) as unknown;
  const user = (ctx as { user?: unknown }).user;
  const login = (ctx as { login?: unknown }).login;
  const authModalCtx = useContext(AuthModalContext);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      // Clear any pending actions on unmount
      pendingAction = null;
      cleanupPendingAction?.();
      cleanupPendingAction = null;
    };
  }, []);

  const requireLogin = useCallback(async (actionCallback?: () => Promise<void> | void) => {
    if (!user) {
      // Clear any existing pending action
      cleanupPendingAction?.();
      cleanupPendingAction = null;
      
      // Store the new action to be executed after login
      if (actionCallback) {
        pendingAction = actionCallback;
        // Set a cleanup function that can be called if the component unmounts
        cleanupPendingAction = () => {
          pendingAction = null;
        };
      }
      
      // Open global login modal via context
      if (authModalCtx?.setShowLoginModal) {
        authModalCtx.setShowLoginModal(true);
      } else if (window.__setShowLoginModal) {
        window.__setShowLoginModal(true);
      }
    } else {
      // User is already logged in, execute immediately
      try {
        await actionCallback?.();
      } catch (error) {
        console.error('Error executing action:', error);
        throw error;
      }
    }
  }, [user, authModalCtx]);

  const executePendingAction = useCallback(async () => {
    if (!pendingAction) return;

    try {
      await pendingAction();
    } catch (error) {
      console.error('Error executing pending action after login:', error);
      // Optionally show error to user
    } finally {
      // Always clear the pending action
      pendingAction = null;
      cleanupPendingAction?.();
      cleanupPendingAction = null;
    }
  }, []);

  const handleLoginSuccess = useCallback(async () => {
    if (!isMounted.current) return;

    // Close global login modal
    if (authModalCtx?.setShowLoginModal) {
      authModalCtx.setShowLoginModal(false);
    } else if (window.__setShowLoginModal) {
      window.__setShowLoginModal(false);
    }
    
    // Update global login state
    if (typeof login === 'function') {
      login();
      window.dispatchEvent(new Event('authChanged'));
      window.dispatchEvent(new Event('login'));
    }
    
    // Wait for theme to be applied
    await new Promise((resolve) => {
      const checkThemeApplied = () => {
        if (!isMounted.current) return;
        
        const root = document.documentElement;
        const hasThemeClass = root.classList.contains('light') || root.classList.contains('dark');

        if (hasThemeClass) {
          resolve(true);
        } else {
          setTimeout(checkThemeApplied, 100);
        }
      };

      checkThemeApplied();
    });

    // Execute any pending action after successful login
    await executePendingAction();

    // Handle navigation based on user role
    const accStr = localStorage.getItem('account');
    let role = null;
    
    if (accStr) {
      try {
        const accObj = JSON.parse(accStr);
        role = accObj.role;
      } catch {
        // Ignore parse errors
      }
    }

    if (!isMounted.current) return;

    // Navigate based on role
    if (role === 0) {
      // Admin
      window.location.replace('/admin');
    } else if (role === 2) {
      // Event manager
      navigate('/', { replace: true });
    } else {
      // Regular user
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [authModalCtx, executePendingAction, login, navigate, location.pathname, location.search]);

  return {
    requireLogin,
    handleLoginSuccess,
    clearPendingAction: useCallback(() => {
      pendingAction = null;
      cleanupPendingAction?.();
      cleanupPendingAction = null;
    }, []),
  };
}
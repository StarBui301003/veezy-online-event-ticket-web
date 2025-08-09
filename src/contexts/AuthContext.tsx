import React, { createContext, useState, useEffect, useCallback } from 'react';
import { setAccountAndUpdateTheme, removeAccountAndUpdateTheme } from '@/utils/account-utils';

interface AuthContextType {
  isLoggedIn: boolean;
  user: any | null;
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any | null>(null);

  // Check login state and user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
    const accStr = localStorage.getItem('account');
    if (accStr) {
      try {
        setUser(JSON.parse(accStr));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  // Listen for 'storage' event to force update login state and user info (for modal login and cross-tab sync)
  useEffect(() => {
    const syncUserState = () => {
      const token = localStorage.getItem('access_token');
      setIsLoggedIn(!!token);
      const accStr = localStorage.getItem('account');
      if (accStr) {
        try {
          setUser(JSON.parse(accStr));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    window.addEventListener('storage', syncUserState);
    window.addEventListener('authChanged', syncUserState);
    return () => {
      window.removeEventListener('storage', syncUserState);
      window.removeEventListener('authChanged', syncUserState);
    };
  }, []);

  // Listen for login/logout changes
  const login = useCallback(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
    const accStr = localStorage.getItem('account');
    if (accStr) {
      try {
        setUser(JSON.parse(accStr));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    // Always force update from localStorage for customerId
    const customerId = localStorage.getItem('customerId');
    if (customerId && accStr) {
      try {
        const accObj = JSON.parse(accStr);
        if (!accObj.userId || accObj.userId !== customerId) {
          accObj.userId = customerId;
          setAccountAndUpdateTheme(accObj);
          setUser(accObj);
        }
      } catch {}
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    removeAccountAndUpdateTheme();
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

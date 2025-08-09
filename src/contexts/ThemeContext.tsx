import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserConfig, updateUserConfig } from '@/services/userConfig.service';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  resetThemeForNewUser: () => void; // Thêm function để reset theme cho user mới
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

// Helper function to get current user ID from localStorage
const getCurrentUserId = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const accStr = localStorage.getItem('account');
    if (accStr) {
      const acc = JSON.parse(accStr);
      return acc.userId || acc.accountId || null;
    }
  } catch (error) {
    // Failed to parse account
  }
  return null;
};

// Helper function to get initial theme from localStorage
const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';

  try {
    const userConfigStr = localStorage.getItem('user_config');
    if (userConfigStr) {
      const userConfig = JSON.parse(userConfigStr);
      // Check if userConfig belongs to current user
      const currentUserId = getCurrentUserId();
      if (
        userConfig.userId &&
        userConfig.userId === currentUserId &&
        userConfig.theme !== undefined
      ) {
        return userConfig.theme === 1 ? 'dark' : 'light';
      }
    }
  } catch (error) {
    // Failed to load theme from localStorage
  }

  // Default to light theme if no valid user config
  return 'light';
};

// Helper function to apply theme to document
const applyTheme = (newTheme: 'light' | 'dark') => {
  const root = document.documentElement;

  if (newTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
};

// Helper function to save theme to localStorage AND database
const saveThemeToStorage = (newTheme: 'light' | 'dark') => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return; // Don't save if no user logged in

    const userConfigStr = localStorage.getItem('user_config');
    const userConfig = userConfigStr ? JSON.parse(userConfigStr) : {};

    // Update userConfig with current user ID and theme
    const updatedConfig = {
      ...userConfig,
      userId: currentUserId,
      theme: newTheme === 'dark' ? 1 : 0,
    };

    // Save to localStorage
    localStorage.setItem('user_config', JSON.stringify(updatedConfig));

    // Also save to database via API (fire and forget)
    (async () => {
      try {
        // Get current user config from API first
        const res = await getUserConfig(currentUserId);
        if (res?.data) {
          const newConfig = {
            ...res.data,
            userId: currentUserId,
            theme: newTheme === 'dark' ? 1 : 0,
          };

          // Update user config via API
          await updateUserConfig(currentUserId, newConfig);
        }
      } catch (error) {
        console.error('Failed to save theme to database:', error);
        // Don't show error toast here as it might be too intrusive
      }
    })();
  } catch (error) {
    // Failed to save theme to localStorage
  }
};

// Helper function to load theme from user config (localStorage)
const loadThemeFromUserConfig = (userId: string): 'light' | 'dark' => {
  try {
    const userConfigStr = localStorage.getItem('user_config');
    if (userConfigStr) {
      const userConfig = JSON.parse(userConfigStr);
      if (userConfig.userId === userId && userConfig.theme !== undefined) {
        return userConfig.theme === 1 ? 'dark' : 'light';
      }
    }
  } catch (error) {
    // Failed to load theme from user config
  }
  return 'light'; // Default to light theme
};

// Helper function to load theme from database (API)
const loadThemeFromDatabase = async (userId: string): Promise<'light' | 'dark'> => {
  try {
    const res = await getUserConfig(userId);
    if (res?.data && res.data.theme !== undefined) {
      return res.data.theme === 1 ? 'dark' : 'light';
    }
  } catch (error) {
    console.error('Failed to load theme from database:', error);
  }
  return 'light'; // Default to light theme
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme immediately from localStorage to prevent flashing
  const [theme, setThemeState] = useState<'light' | 'dark'>(getInitialTheme);
  const [lastUserId, setLastUserId] = useState<string | null>(getCurrentUserId());

  // Apply theme immediately on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);

    // Add theme-loaded class after initial theme is applied
    const timer = setTimeout(() => {
      document.documentElement.classList.add('theme-loaded');
    }, 100);

    return () => clearTimeout(timer);
  }, [theme]); // Add theme as dependency

  // Check for user changes and reset theme if needed
  useEffect(() => {
    const checkUserAndResetTheme = () => {
      const currentUserId = getCurrentUserId();

      // If user changed, reset theme
      if (currentUserId !== lastUserId) {
        setLastUserId(currentUserId);

        if (currentUserId) {
          // New user logged in, load their theme immediately
          const userTheme = loadThemeFromUserConfig(currentUserId);
          if (userTheme !== theme) {
            setThemeState(userTheme);
          }
        } else {
          // User logged out, reset to light theme
          if (theme !== 'light') {
            setThemeState('light');
          }
          localStorage.removeItem('user_config');
        }
      }
    };

    // Check immediately
    checkUserAndResetTheme();

    // Listen for account changes (login/logout)
    const handleAccountChange = () => {
      setTimeout(checkUserAndResetTheme, 100); // Small delay to ensure localStorage is updated
    };

    // Listen for storage changes (when localStorage is updated from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'account' || e.key === 'user_config') {
        setTimeout(checkUserAndResetTheme, 100);
      }
    };

    // Listen for custom account update events
    const handleAccountUpdated = (e: CustomEvent) => {
      setTimeout(checkUserAndResetTheme, 100);
    };

    // Listen for user config changes
    const handleUserConfigChange = () => {
      setTimeout(() => {
        const currentUserId = getCurrentUserId();
        if (currentUserId === lastUserId) {
          // Same user, check if theme changed in config
          const userTheme = loadThemeFromUserConfig(currentUserId);
          if (userTheme !== theme) {
            setThemeState(userTheme);
          }
        }
      }, 100);
    };

    // Listen for login events specifically
    const handleLogin = () => {
      setTimeout(checkUserAndResetTheme, 100);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChanged', handleAccountChange);
    window.addEventListener('user-updated', handleAccountChange);
    window.addEventListener('accountUpdated', handleAccountUpdated as EventListener);
    window.addEventListener('userConfigUpdated', handleUserConfigChange);
    window.addEventListener('login', handleLogin);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChanged', handleAccountChange);
      window.removeEventListener('user-updated', handleAccountChange);
      window.removeEventListener('accountUpdated', handleAccountUpdated as EventListener);
      window.removeEventListener('userConfigUpdated', handleUserConfigChange);
      window.removeEventListener('login', handleLogin);
    };
  }, [theme, lastUserId]);

  // Separate effect to handle immediate theme loading on login
  useEffect(() => {
    const handleImmediateLogin = async () => {
      const currentUserId = getCurrentUserId();
      if (currentUserId) {
        // Try to load theme from database first (most up-to-date)
        const userTheme = await loadThemeFromDatabase(currentUserId);
        if (userTheme !== theme) {
          setThemeState(userTheme);
        }

        // Also update localStorage with the theme from database
        try {
          const res = await getUserConfig(currentUserId);
          if (res?.data) {
            const userConfig = {
              ...res.data,
              userId: currentUserId,
            };
            localStorage.setItem('user_config', JSON.stringify(userConfig));
          }
        } catch (error) {
          console.error('Failed to update localStorage with database config:', error);
        }

        // Update lastUserId to prevent duplicate processing
        if (currentUserId !== lastUserId) {
          setLastUserId(currentUserId);
        }
      }
    };

    window.addEventListener('login', handleImmediateLogin);
    return () => {
      window.removeEventListener('login', handleImmediateLogin);
    };
  }, [theme, lastUserId]);

  // Function to reset theme for new user (called from layout)
  const resetThemeForNewUser = () => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId) {
      setThemeState('light');
      localStorage.removeItem('user_config');
      setLastUserId(null);
      return;
    }

    // Load theme from user config
    const userTheme = loadThemeFromUserConfig(currentUserId);
    setThemeState(userTheme);
    setLastUserId(currentUserId);
  };

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    applyTheme(newTheme);
    saveThemeToStorage(newTheme);
  };

  // Set specific theme
  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    saveThemeToStorage(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
    resetThemeForNewUser,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Custom hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

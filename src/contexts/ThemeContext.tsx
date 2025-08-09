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
    const currentUserId = getCurrentUserId();

    if (currentUserId) {
      // Logged in user - try to load from user_config
      const userConfigStr = localStorage.getItem('user_config');
      if (userConfigStr) {
        const userConfig = JSON.parse(userConfigStr);
        if (
          userConfig.userId &&
          userConfig.userId === currentUserId &&
          userConfig.theme !== undefined
        ) {
          return userConfig.theme === 1 ? 'dark' : 'light';
        }
      }
    } else {
      // Guest user - try to load from guest_userconfig
      const guestConfigStr = localStorage.getItem('guest_userconfig');
      if (guestConfigStr) {
        const guestConfig = JSON.parse(guestConfigStr);
        if (guestConfig.theme !== undefined) {
          return guestConfig.theme === 1 ? 'dark' : 'light';
        }
      }
    }
  } catch (error) {
    // Failed to load theme from localStorage
  }

  // Default to light theme if no valid config
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

    if (currentUserId) {
      // Logged in user - save to both localStorage and database
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

      // Remove guest config if it exists (user is now logged in)
      localStorage.removeItem('guest_userconfig');
    } else {
      // Guest user - save to guest_userconfig
      const guestConfig = {
        theme: newTheme === 'dark' ? 1 : 0,
        timestamp: Date.now(),
      };
      localStorage.setItem('guest_userconfig', JSON.stringify(guestConfig));
      console.log('🎨 Guest theme saved to localStorage:', newTheme);
    }
  } catch (error) {
    console.error('Failed to save theme:', error);
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

  // Check and load theme immediately when component mounts
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      // First load from localStorage to avoid flashing, then update from database
      const initialTheme = getInitialTheme();
      if (initialTheme !== theme) {
        setThemeState(initialTheme);
      }

      // Then load from database (most up-to-date)
      (async () => {
        try {
          const userTheme = await loadThemeFromDatabase(currentUserId);
          if (userTheme !== theme) {
            setThemeState(userTheme);
          }

          // Also update localStorage with the latest config from database
          const res = await getUserConfig(currentUserId);
          if (res?.data) {
            const userConfig = {
              ...res.data,
              userId: currentUserId,
            };
            localStorage.setItem('user_config', JSON.stringify(userConfig));
          }
        } catch (error) {
          console.error('Failed to load theme from database on mount:', error);
          // localStorage already loaded above, so no need to fallback
        }
      })();
    }
  }, []); // Empty dependency array - only run once on mount

  // Check for user changes and reset theme if needed
  useEffect(() => {
    const checkUserAndResetTheme = async () => {
      const currentUserId = getCurrentUserId();

      // If user changed, reset theme
      if (currentUserId !== lastUserId) {
        setLastUserId(currentUserId);

        if (currentUserId) {
          // New user logged in, load their theme from database immediately
          try {
            const userTheme = await loadThemeFromDatabase(currentUserId);
            if (userTheme !== theme) {
              setThemeState(userTheme);
            }

            // Also update localStorage with the latest config from database
            const res = await getUserConfig(currentUserId);
            if (res?.data) {
              const userConfig = {
                ...res.data,
                userId: currentUserId,
              };
              localStorage.setItem('user_config', JSON.stringify(userConfig));
            }
          } catch (error) {
            console.error('Failed to load theme from database:', error);
            // Fallback to localStorage if database fails
            const userTheme = loadThemeFromUserConfig(currentUserId);
            if (userTheme !== theme) {
              setThemeState(userTheme);
            }
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
      checkUserAndResetTheme(); // Remove delay, check immediately
    };

    // Listen for storage changes (when localStorage is updated from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'account' || e.key === 'user_config') {
        checkUserAndResetTheme(); // Remove delay, check immediately
      }
    };

    // Listen for custom account update events
    const handleAccountUpdated = (_: CustomEvent) => {
      checkUserAndResetTheme(); // Remove delay, check immediately
    };

    // Listen for user config changes
    const handleUserConfigChange = () => {
      const currentUserId = getCurrentUserId();
      if (currentUserId === lastUserId) {
        // Same user, check if theme changed in config
        const userTheme = loadThemeFromUserConfig(currentUserId);
        if (userTheme !== theme) {
          console.log('Theme changed in userConfig, updating from:', theme, 'to:', userTheme);
          setThemeState(userTheme);
        }
      }
    };

    // Listen for login events specifically
    const handleLogin = () => {
      checkUserAndResetTheme(); // Remove delay, check immediately
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

  // Function to reset theme for new user (called from layout)
  const resetThemeForNewUser = async () => {
    const currentUserId = getCurrentUserId();
    console.log(
      'resetThemeForNewUser called, currentUserId:',
      currentUserId,
      'lastUserId:',
      lastUserId
    );

    if (!currentUserId) {
      console.log('No current user, checking if guest theme exists');

      // Check if guest theme exists before resetting
      const guestConfigStr = localStorage.getItem('guest_userconfig');
      if (guestConfigStr) {
        try {
          const guestConfig = JSON.parse(guestConfigStr);
          if (guestConfig.theme !== undefined) {
            console.log(
              '🎨 Guest theme found, applying:',
              guestConfig.theme === 1 ? 'dark' : 'light'
            );
            setThemeState(guestConfig.theme === 1 ? 'dark' : 'light');
            setLastUserId(null);
            return;
          }
        } catch (error) {
          console.error('Failed to parse guest config:', error);
        }
      }

      // No guest theme, reset to light
      console.log('No guest theme found, resetting to light theme');
      setThemeState('light');
      localStorage.removeItem('user_config');
      localStorage.removeItem('guest_userconfig');
      setLastUserId(null);
      return;
    }

    // User is logged in, remove guest config if it exists
    localStorage.removeItem('guest_userconfig');

    // Load theme from database first, then fallback to localStorage
    try {
      const userTheme = await loadThemeFromDatabase(currentUserId);
      console.log('Theme loaded from database:', userTheme, 'current theme:', theme);
      if (userTheme !== theme) {
        console.log('Updating theme from database:', theme, '->', userTheme);
        setThemeState(userTheme);
      }

      // Also update localStorage with the latest config from database
      const res = await getUserConfig(currentUserId);
      if (res?.data) {
        const userConfig = {
          ...res.data,
          userId: currentUserId,
        };
        localStorage.setItem('user_config', JSON.stringify(userConfig));
        console.log('Updated localStorage with userConfig:', userConfig);
      }
    } catch (error) {
      console.error('Failed to load theme from database in resetThemeForNewUser:', error);
      // Fallback to localStorage if database fails
      const userTheme = loadThemeFromUserConfig(currentUserId);
      console.log('Fallback to localStorage theme:', userTheme, 'current theme:', theme);
      if (userTheme !== theme) {
        console.log('Updating theme from localStorage:', theme, '->', userTheme);
        setThemeState(userTheme);
      }
    }

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

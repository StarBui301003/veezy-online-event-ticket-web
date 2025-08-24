import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { getUserConfig, updateUserConfig } from '@/services/userConfig.service';
import type { UserConfig } from '@/services/userConfig.service';

interface ThemeContextSetOptions {
  skipApi?: boolean;
  userConfig?: Partial<{
    language: number;
    receiveEmail: boolean;
    receiveNotify: boolean;
    userId?: string;
  }>;
}

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark', options?: ThemeContextSetOptions) => void;
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
  } catch {
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
        // Prefer exact match on userId if available
        if (userConfig.userId === currentUserId && userConfig.theme !== undefined) {
          return userConfig.theme === 1 ? 'dark' : 'light';
        }
        // Fallback: if theme exists but userId missing/mismatch, still use theme to prevent unwanted reset
        if (userConfig.theme !== undefined) {
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

      // Fallback: support legacy guest theme key
      const guestTheme = localStorage.getItem('guest_theme');
      if (guestTheme === 'light' || guestTheme === 'dark') {
        return guestTheme;
      }
    }
  } catch {
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

// Helper function to save theme to localStorage AND database (optional)
const saveThemeToStorage = (newTheme: 'light' | 'dark', options?: ThemeContextSetOptions) => {
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
      const mergedLocalConfig = {
        ...updatedConfig,
        ...(options?.userConfig || {}),
        theme: newTheme === 'dark' ? 1 : 0,
        userId: currentUserId,
      };
      localStorage.setItem('user_config', JSON.stringify(mergedLocalConfig));

      // Optionally save to database via API if not already updated by caller
      if (!options?.skipApi) {
        (async () => {
          try {
            // Build full config from localStorage without re-fetching
            const finalConfig = {
              language: mergedLocalConfig.language ?? 0,
              theme: mergedLocalConfig.theme ?? (newTheme === 'dark' ? 1 : 0),
              receiveEmail: mergedLocalConfig.receiveEmail ?? false,
              receiveNotify: mergedLocalConfig.receiveNotify ?? false,
            };
            await updateUserConfig(currentUserId, finalConfig);
          } catch (error) {
            console.error('Failed to save theme to database:', error);
          }
        })();
      }

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
// Returns null when not available to avoid overriding current theme
const loadThemeFromUserConfig = (userId: string): 'light' | 'dark' | null => {
  try {
    const userConfigStr = localStorage.getItem('user_config');
    if (userConfigStr) {
      const userConfig = JSON.parse(userConfigStr);
      // Prefer exact match on userId if available
      if (userConfig.userId === userId && userConfig.theme !== undefined) {
        return userConfig.theme === 1 ? 'dark' : 'light';
      }
      // Fallback: if theme exists but userId missing/mismatch, still use theme to prevent unwanted reset
      if (userConfig.theme !== undefined) {
        return userConfig.theme === 1 ? 'dark' : 'light';
      }
    }
  } catch {
    // Failed to load theme from user config
  }
  return null;
};

// Helper function to load theme from database (API) with in-memory cache + in-flight dedup
// Returns null when not available to avoid overriding local preference incorrectly
const USERCONFIG_CACHE_TTL_MS = 60 * 1000; // 60s TTL to prevent repeated calls on quick navigations

type UserConfigCache = { userId: string; data: UserConfig; fetchedAt: number };

const loadThemeFromDatabase = async (
  userId: string,
  cacheRef?: React.MutableRefObject<UserConfigCache | null>,
  inFlightRef?: React.MutableRefObject<Record<string, Promise<UserConfig | null> | undefined>>
): Promise<'light' | 'dark' | null> => {
  try {
    // Use cache if still fresh
    if (cacheRef?.current && cacheRef.current.userId === userId) {
      const age = Date.now() - cacheRef.current.fetchedAt;
      if (age < USERCONFIG_CACHE_TTL_MS) {
        const cachedData = cacheRef.current.data;
        if (cachedData && cachedData.theme !== undefined) {
          return cachedData.theme === 1 ? 'dark' : 'light';
        }
      }
    }

    // Deduplicate concurrent requests per userId
    if (inFlightRef) {
      if (!inFlightRef.current[userId]) {
        inFlightRef.current[userId] = (async () => {
          const res = await getUserConfig(userId);
          return res?.data || null;
        })();
      }
      const data = await inFlightRef.current[userId];
      delete inFlightRef.current[userId];
      if (data && cacheRef) {
        cacheRef.current = { userId, data, fetchedAt: Date.now() };
      }
      if (data && data.theme !== undefined) {
        return data.theme === 1 ? 'dark' : 'light';
      }
      return null;
    }

    // Fallback (without inFlightRef)
    const res = await getUserConfig(userId);
    if (res?.data && cacheRef) {
      cacheRef.current = { userId, data: res.data, fetchedAt: Date.now() };
    }
    if (res?.data && res.data.theme !== undefined) {
      return res.data.theme === 1 ? 'dark' : 'light';
    }
    return null;
  } catch {
    console.error('Failed to load theme from database');
    return null;
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme immediately from localStorage to prevent flashing
  const [theme, setThemeState] = useState<'light' | 'dark'>(getInitialTheme);
  const [lastUserId, setLastUserId] = useState<string | null>(getCurrentUserId());
  const [isProcessingTheme, setIsProcessingTheme] = useState(false); // Add flag to prevent multiple simultaneous calls
  const userConfigCacheRef = useRef<UserConfigCache | null>(null);
  const inFlightUserConfigRef = useRef<Record<string, Promise<UserConfig | null> | undefined>>({});

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
          const userTheme = await loadThemeFromDatabase(
            currentUserId,
            userConfigCacheRef,
            inFlightUserConfigRef
          );
          if (userTheme && userTheme !== theme) {
            setThemeState(userTheme);
          }

          // Also update localStorage with the latest config from database (from cache)
          const cached = userConfigCacheRef.current;
          if (cached && cached.userId === currentUserId) {
            const userConfig = {
              ...cached.data,
              userId: currentUserId,
            };
            localStorage.setItem('user_config', JSON.stringify(userConfig));
          }
        } catch {
          console.error('Failed to load theme from database on mount');
          // localStorage already loaded above, so no need to fallback
        }
      })();
    }
  }, []); // Empty dependency array - only run once on mount

  // Check for user changes and reset theme if needed
  useEffect(() => {
    const checkUserAndResetTheme = async () => {
      // Prevent multiple simultaneous calls
      if (isProcessingTheme) {
        return;
      }

      const currentUserId = getCurrentUserId();

      // If user changed, reset theme
      if (currentUserId !== lastUserId) {
        setIsProcessingTheme(true);
        try {
          setLastUserId(currentUserId);

          if (currentUserId) {
            // New user logged in, load their theme from database immediately
            try {
              const userTheme = await loadThemeFromDatabase(
                currentUserId,
                userConfigCacheRef,
                inFlightUserConfigRef
              );
              // Only update if theme is actually different to prevent unnecessary re-renders
              if (userTheme && userTheme !== theme) {
                setThemeState(userTheme);
              }

              // Also update localStorage with the latest config from database (from cache)
              const cached = userConfigCacheRef.current;
              if (cached && cached.userId === currentUserId) {
                const userConfig = {
                  ...cached.data,
                  userId: currentUserId,
                };
                localStorage.setItem('user_config', JSON.stringify(userConfig));
              }
            } catch {
              console.error('Failed to load theme from database');
              // Fallback to localStorage if database fails
              const userTheme = loadThemeFromUserConfig(currentUserId);
              if (userTheme && userTheme !== theme) {
                setThemeState(userTheme);
              }
            }
          } else {
            // User logged out, kiểm tra xem có đang logout không
            const isLoggingOut = localStorage.getItem('is_logging_out') === 'true';
            if (!isLoggingOut) {
              // Chỉ reset theme nếu thực sự cần thiết
              if (theme !== 'light') {
                console.log('🎨 Resetting theme to light after logout');
                setThemeState('light');
              } else {
                console.log('🎨 Theme already light, no change needed');
              }

              // Xóa user_config sau khi đã xử lý theme
              localStorage.removeItem('user_config');
              console.log('🗑️ user_config removed after theme processing');
            } else {
              console.log('🔄 Still logging out, skipping theme reset');
            }
          }
        } finally {
          setIsProcessingTheme(false);
        }
      }
    };

    // Check immediately
    checkUserAndResetTheme();

    // Debounced event handlers to prevent excessive calls
    let timeoutId: NodeJS.Timeout;

    const debouncedCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!isProcessingTheme) {
          checkUserAndResetTheme();
        }
      }, 100); // 100ms debounce
    };

    // Listen for account changes (login/logout)
    const handleAccountChange = () => {
      debouncedCheck();
    };

    // Listen for storage changes (when localStorage is updated from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'account' || e.key === 'user_config') {
        debouncedCheck();
      }
    };

    // Listen for custom account update events
    const handleAccountUpdated = () => {
      debouncedCheck();
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
      debouncedCheck();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChanged', handleAccountChange);
    window.addEventListener('user-updated', handleAccountChange);
    window.addEventListener('accountUpdated', handleAccountUpdated);
    window.addEventListener('userConfigUpdated', handleUserConfigChange);
    window.addEventListener('login', handleLogin);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChanged', handleAccountChange);
      window.removeEventListener('user-updated', handleAccountChange);
      window.removeEventListener('accountUpdated', handleAccountUpdated);
      window.removeEventListener('userConfigUpdated', handleUserConfigChange);
      window.removeEventListener('login', handleLogin);
    };
  }, [lastUserId, isProcessingTheme]); // Add isProcessingTheme to dependencies

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

      // Fallback: legacy guest theme key
      const guestTheme = localStorage.getItem('guest_theme');
      if (guestTheme === 'light' || guestTheme === 'dark') {
        console.log('🎨 Legacy guest theme found, applying:', guestTheme);
        setThemeState(guestTheme);
        setLastUserId(null);
        return;
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
    // Prefer local theme immediately to avoid flicker, then sync from API if available
    const localUserTheme = loadThemeFromUserConfig(currentUserId);
    if (localUserTheme && localUserTheme !== theme) {
      console.log('Applying local user theme:', localUserTheme);
      setThemeState(localUserTheme);
    }

    try {
      const userTheme = await loadThemeFromDatabase(
        currentUserId,
        userConfigCacheRef,
        inFlightUserConfigRef
      );
      console.log('Theme loaded from database:', userTheme, 'current theme:', theme);
      if (userTheme && userTheme !== theme) {
        console.log('Updating theme from database:', theme, '->', userTheme);
        setThemeState(userTheme);
      }

      // Also update localStorage with the latest config from database (from cache)
      const cached = userConfigCacheRef.current;
      if (cached && cached.userId === currentUserId) {
        const userConfig = {
          ...cached.data,
          userId: currentUserId,
        };
        localStorage.setItem('user_config', JSON.stringify(userConfig));
        console.log('Updated localStorage with userConfig:', userConfig);
      }
    } catch (error) {
      console.error('Failed to load theme from database in resetThemeForNewUser:', error);
      // Fallback already applied via localUserTheme
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
  const setTheme = (newTheme: 'light' | 'dark', options?: ThemeContextSetOptions) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    saveThemeToStorage(newTheme, options);
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

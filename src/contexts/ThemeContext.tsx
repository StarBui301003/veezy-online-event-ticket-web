import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

// Helper function to get initial theme from localStorage
const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';

  try {
    const userConfigStr = localStorage.getItem('user_config');
    if (userConfigStr) {
      const userConfig = JSON.parse(userConfigStr);
      if (userConfig.theme !== undefined) {
        return userConfig.theme === 1 ? 'dark' : 'light';
      }
    }
  } catch (error) {
    // Failed to load theme from localStorage
  }

  // Default to light theme
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

// Helper function to save theme to localStorage
const saveThemeToStorage = (newTheme: 'light' | 'dark') => {
  try {
    const userConfigStr = localStorage.getItem('user_config');
    const userConfig = userConfigStr ? JSON.parse(userConfigStr) : {};

    // Save theme as number: 0 for light, 1 for dark
    userConfig.theme = newTheme === 'dark' ? 1 : 0;

    localStorage.setItem('user_config', JSON.stringify(userConfig));
  } catch (error) {
    // Failed to save theme to localStorage
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme immediately from localStorage to prevent flashing
  const [theme, setThemeState] = useState<'light' | 'dark'>(getInitialTheme);

  // Apply theme immediately on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);

    // Add theme-loaded class after initial theme is applied
    const timer = setTimeout(() => {
      document.documentElement.classList.add('theme-loaded');
    }, 100);

    return () => clearTimeout(timer);
  }, [theme]); // Add theme as dependency

  // Ensure theme is applied on mount and reload when needed
  useEffect(() => {
    const currentTheme = getInitialTheme();
    if (currentTheme !== theme) {
      setThemeState(currentTheme);
    }
  }, []); // Run only once on mount

  // Listen for account changes and storage changes
  useEffect(() => {
    const checkAndReloadTheme = () => {
      const currentTheme = getInitialTheme();
      if (currentTheme !== theme) {
        setThemeState(currentTheme);
      }
    };

    // Check immediately
    checkAndReloadTheme();

    // Listen for account changes
    const handleAccountChange = () => {
      setTimeout(checkAndReloadTheme, 100); // Small delay to ensure localStorage is updated
    };

    window.addEventListener('storage', handleAccountChange);
    window.addEventListener('user-updated', handleAccountChange);

    return () => {
      window.removeEventListener('storage', handleAccountChange);
      window.removeEventListener('user-updated', handleAccountChange);
    };
  }, [theme]);

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

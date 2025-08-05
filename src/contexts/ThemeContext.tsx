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
    console.error('Failed to load theme from localStorage:', error);
  }

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

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme immediately from localStorage to prevent flashing
  const [theme, setThemeState] = useState<'light' | 'dark'>(getInitialTheme);

  // Apply theme immediately on mount to prevent flashing
  useEffect(() => {
    applyTheme(theme);

    // Add theme-loaded class after initial theme is applied
    const timer = setTimeout(() => {
      document.documentElement.classList.add('theme-loaded');
    }, 100);

    return () => clearTimeout(timer);
  }, []); // Empty dependency array to run only once on mount

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  // Set specific theme
  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  // Apply theme when theme changes (for subsequent changes)
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

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

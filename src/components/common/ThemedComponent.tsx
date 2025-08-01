import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedComponentProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'card' | 'button' | 'input' | 'table' | 'modal' | 'sidebar' | 'nav';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

const ThemedComponent: React.FC<ThemedComponentProps> = ({
  children,
  className = '',
  variant = 'card',
  size = 'md',
  color = 'primary',
}) => {
  const { theme } = useTheme();

  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return 'card';
      case 'button':
        return `button-${color}`;
      case 'input':
        return 'input';
      case 'table':
        return 'table';
      case 'modal':
        return 'modal';
      case 'sidebar':
        return 'sidebar';
      case 'nav':
        return 'nav';
      default:
        return 'card';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm px-2 py-1';
      case 'md':
        return 'text-base px-4 py-2';
      case 'lg':
        return 'text-lg px-6 py-3';
      default:
        return 'text-base px-4 py-2';
    }
  };

  const baseClasses = getVariantClasses();
  const sizeClasses = getSizeClasses();
  const themeClasses = `theme-${theme} theme-transition`;

  return (
    <div className={`${baseClasses} ${sizeClasses} ${themeClasses} ${className}`}>{children}</div>
  );
};

export default ThemedComponent;

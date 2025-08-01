import { useTheme } from '@/contexts/ThemeContext';

export const useThemeClasses = () => {
    const { theme } = useTheme();

    const getThemeClass = (baseClass: string, darkClass?: string) => {
        if (theme === 'dark' && darkClass) {
            return `${baseClass} ${darkClass}`;
        }
        return baseClass;
    };

    const getBgClass = () => {
        return theme === 'dark' ? 'bg-gray-900' : 'bg-white';
    };

    const getTextClass = () => {
        return theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
    };

    const getBorderClass = () => {
        return theme === 'dark' ? 'border-gray-700' : 'border-gray-300';
    };

    const getCardClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-gray-100'
            : 'bg-white border-gray-300 text-gray-900';
    };

    const getInputClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';
    };

    const getButtonClass = (variant: 'primary' | 'secondary' | 'danger' = 'primary') => {
        const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors duration-200';

        switch (variant) {
            case 'primary':
                return theme === 'dark'
                    ? `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white`
                    : `${baseClasses} bg-blue-500 hover:bg-blue-600 text-white`;
            case 'secondary':
                return theme === 'dark'
                    ? `${baseClasses} bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600`
                    : `${baseClasses} bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300`;
            case 'danger':
                return theme === 'dark'
                    ? `${baseClasses} bg-red-600 hover:bg-red-700 text-white`
                    : `${baseClasses} bg-red-500 hover:bg-red-600 text-white`;
            default:
                return getButtonClass('primary');
        }
    };

    const getTableClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-gray-100'
            : 'bg-white border-gray-300 text-gray-900';
    };

    const getModalClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-gray-100'
            : 'bg-white border-gray-300 text-gray-900';
    };

    const getSidebarClass = () => {
        return theme === 'dark'
            ? 'bg-gray-900 border-gray-700 text-gray-100'
            : 'bg-gray-50 border-gray-300 text-gray-900';
    };

    const getNavClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-gray-100'
            : 'bg-white border-gray-300 text-gray-900';
    };

    const getStatusClass = (status: 'success' | 'warning' | 'error' | 'info') => {
        const baseClasses = 'px-2 py-1 rounded text-xs font-medium';

        switch (status) {
            case 'success':
                return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
            case 'warning':
                return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
            case 'error':
                return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
            case 'info':
                return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
            default:
                return getStatusClass('info');
        }
    };

    return {
        theme,
        getThemeClass,
        getBgClass,
        getTextClass,
        getBorderClass,
        getCardClass,
        getInputClass,
        getButtonClass,
        getTableClass,
        getModalClass,
        getSidebarClass,
        getNavClass,
        getStatusClass,
    };
}; 
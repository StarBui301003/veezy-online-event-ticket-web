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

    const getProfileCardClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-gray-200'
            : 'bg-white border-gray-300 text-gray-900';
    };

    const getInputClass = () => {
        return theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';
    };

    const getProfileInputClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-400 focus:border-gray-600'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400';
    };

    const getSelectClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-gray-200'
            : 'bg-white border-gray-300 text-gray-900';
    };

    // AdminList specific classes
    const getAdminListContainerClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-gray-100'
            : 'bg-white border-gray-300 text-gray-900';
    };

    const getAdminListCardClass = () => {
        return theme === 'dark'
            ? 'bg-gray-900 rounded-xl shadow'
            : 'bg-white rounded-xl shadow';
    };

    const getAdminListTableClass = () => {
        return theme === 'dark'
            ? 'bg-gray-900'
            : 'bg-white';
    };

    const getAdminListTableHeaderClass = () => {
        return theme === 'dark'
            ? 'bg-blue-900 hover:bg-blue-900'
            : 'bg-blue-200 hover:bg-blue-200';
    };

    const getAdminListTableRowClass = () => {
        return theme === 'dark'
            ? 'hover:bg-gray-800 bg-gray-900'
            : 'hover:bg-blue-50 bg-white';
    };

    const getAdminListTableCellClass = () => {
        return theme === 'dark'
            ? 'text-gray-100'
            : 'text-gray-900';
    };

    const getAdminListDropdownClass = () => {
        return theme === 'dark'
            ? 'bg-gray-900 border-gray-700'
            : 'bg-white border-blue-100';
    };

    const getAdminListDropdownItemClass = () => {
        return theme === 'dark'
            ? 'focus:bg-gray-800 focus:text-white hover:bg-gray-800 transition rounded-md text-white dark:bg-transparent'
            : 'focus:bg-blue-100 focus:text-blue-900 hover:bg-blue-50 transition rounded-md text-gray-900';
    };

    const getAdminListPaginationClass = () => {
        return theme === 'dark'
            ? 'text-gray-100 hover:text-white'
            : 'text-gray-700 hover:text-gray-900';
    };

    const getAdminListPageSizeSelectClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 text-gray-100 border-gray-700'
            : 'bg-white text-gray-900 border-gray-200';
    };

    // Table border classes for better dark theme
    const getAdminListTableBorderClass = () => {
        return theme === 'dark'
            ? 'border-gray-700'
            : 'border-gray-300';
    };

    const getAdminListTableCellBorderClass = () => {
        return theme === 'dark'
            ? 'border-gray-700'
            : 'border-gray-200';
    };

    const getAdminListTableHeaderBorderClass = () => {
        return theme === 'dark'
            ? 'border-gray-600'
            : 'border-gray-300';
    };

    // EventList specific classes (similar to AdminList but for events)
    const getEventListCardClass = () => {
        return theme === 'dark'
            ? 'bg-gray-900 rounded-xl shadow'
            : 'bg-white rounded-xl shadow';
    };

    const getEventListTableClass = () => {
        return theme === 'dark'
            ? 'bg-gray-900'
            : 'bg-white';
    };

    const getEventListTableHeaderClass = () => {
        return theme === 'dark'
            ? 'bg-blue-900 hover:bg-blue-900'
            : 'bg-blue-200 hover:bg-blue-200';
    };

    const getEventListTableRowClass = () => {
        return theme === 'dark'
            ? 'hover:bg-gray-800 bg-gray-900'
            : 'hover:bg-blue-50 bg-white';
    };

    const getEventListTableCellClass = () => {
        return theme === 'dark'
            ? 'text-gray-100'
            : 'text-gray-900';
    };

    const getEventListDropdownClass = () => {
        return theme === 'dark'
            ? 'bg-gray-900 border-gray-700'
            : 'bg-white border-blue-100';
    };

    const getEventListDropdownItemClass = () => {
        return theme === 'dark'
            ? 'focus:bg-gray-800 focus:text-white hover:bg-gray-800 transition rounded-md text-white dark:bg-transparent'
            : 'focus:bg-blue-100 focus:text-blue-900 hover:bg-blue-50 transition rounded-md text-gray-900';
    };

    const getEventListPaginationClass = () => {
        return theme === 'dark'
            ? 'text-gray-100 hover:text-white'
            : 'text-gray-700 hover:text-gray-900';
    };

    const getEventListPageSizeSelectClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 text-gray-100 border-gray-700'
            : 'bg-white text-gray-900 border-gray-200';
    };

    const getEventListTableBorderClass = () => {
        return theme === 'dark'
            ? 'border-gray-700'
            : 'border-gray-300';
    };

    const getEventListTableCellBorderClass = () => {
        return theme === 'dark'
            ? 'border-gray-700'
            : 'border-gray-200';
    };

    const getEventListTableHeaderBorderClass = () => {
        return theme === 'dark'
            ? 'border-gray-600'
            : 'border-gray-300';
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
        getProfileCardClass,
        getInputClass,
        getProfileInputClass,
        getSelectClass,
        getAdminListContainerClass,
        getAdminListCardClass,
        getAdminListTableClass,
        getAdminListTableHeaderClass,
        getAdminListTableRowClass,
        getAdminListTableCellClass,
        getAdminListDropdownClass,
        getAdminListDropdownItemClass,
        getAdminListPaginationClass,
        getAdminListPageSizeSelectClass,
        getAdminListTableBorderClass,
        getAdminListTableCellBorderClass,
        getAdminListTableHeaderBorderClass,
        getEventListCardClass,
        getEventListTableClass,
        getEventListTableHeaderClass,
        getEventListTableRowClass,
        getEventListTableCellClass,
        getEventListDropdownClass,
        getEventListDropdownItemClass,
        getEventListPaginationClass,
        getEventListPageSizeSelectClass,
        getEventListTableBorderClass,
        getEventListTableCellBorderClass,
        getEventListTableHeaderBorderClass,
        getButtonClass,
        getTableClass,
        getModalClass,
        getSidebarClass,
        getNavClass,
        getStatusClass,
    };
}; 
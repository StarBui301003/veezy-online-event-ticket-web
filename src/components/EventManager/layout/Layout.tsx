import { useState, useEffect, useRef } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import {
  FaHome,
  FaCalendarAlt,
  FaPlus,
  FaClock,
  FaCheckCircle,
  FaTicketAlt,
  FaPercent,
  FaUsers,
  FaChartBar,
  FaNewspaper,
  FaUserCircle,
  FaComments,
  FaEye,
  FaChevronDown,
  FaChevronRight,
  FaDollarSign,
  FaBell,
} from 'react-icons/fa';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import ScrollToTop from '@/components/common/ScrollToTop';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { updateUserConfig, getUserConfig } from '@/services/userConfig.service';
import { toast } from 'react-toastify';
import ThemeToggle from '@/components/Admin/ThemeToggle';
import { CustomerChatBox } from '@/components/Customer';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { updateUserConfigAndTriggerUpdate } from '@/utils/account-utils';
import { getCurrentUserId } from '@/utils/account-utils';

// Custom scrollbar styles - will be updated dynamically based on theme
const getScrollbarStyles = (isDark: boolean) => `
  /* Webkit browsers (Chrome, Safari, Edge) */
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  ::-webkit-scrollbar-track {
    background: ${isDark ? 'rgba(15, 12, 26, 0.8)' : 'rgba(243, 244, 246, 0.8)'};
    border-radius: 12px;
    margin: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: ${
      isDark
        ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
        : 'linear-gradient(135deg, #6366f1, #8b5cf6)'
    };
    border-radius: 12px;
    border: 2px solid ${isDark ? 'rgba(15, 12, 26, 0.8)' : 'rgba(243, 244, 246, 0.8)'};
    transition: all 0.3s ease;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${
      isDark
        ? 'linear-gradient(135deg, #7c3aed, #db2777)'
        : 'linear-gradient(135deg, #4f46e5, #7c3aed)'
    };
    transform: scale(1.05);
    box-shadow: 0 0 10px ${isDark ? 'rgba(139, 92, 246, 0.5)' : 'rgba(99, 102, 241, 0.5)'};
  }

  ::-webkit-scrollbar-corner {
    background: transparent;
  }

  /* Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: ${
      isDark ? '#8b5cf6 rgba(15, 12, 26, 0.8)' : '#6366f1 rgba(243, 244, 246, 0.8)'
    };
  }

  /* Custom scrollbar for specific elements */
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
    border-radius: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: ${
      isDark
        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
        : 'linear-gradient(135deg, #4f46e5, #6366f1)'
    };
    border-radius: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: ${
      isDark
        ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
        : 'linear-gradient(135deg, #3730a3, #4f46e5)'
    };
  }
`;

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function EventManagerLayout() {
  const { t } = useTranslation();
  const { theme, resetThemeForNewUser } = useTheme();
  const { getThemeClass } = useThemeClasses();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isLanguageLoading, setIsLanguageLoading] = useState(false);
  const [i18nInstance] = useState(i18n);
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    events: true,
    tickets: false,
    analytics: false,
    content: false,
    chatSupport: false,
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check and reset theme when EventManager layout mounts
  // This is still needed as a fallback for cases where login event might not fire
  useEffect(() => {
    resetThemeForNewUser();
  }, []); // Remove resetThemeForNewUser from dependencies to avoid infinite loop

  // Check and update theme when user changes (login/logout)
  useEffect(() => {
    const checkUserAndUpdateTheme = () => {
      resetThemeForNewUser();
    };

    // Listen for user changes
    window.addEventListener('authChanged', checkUserAndUpdateTheme);
    window.addEventListener('user-updated', checkUserAndUpdateTheme);
    window.addEventListener('login', checkUserAndUpdateTheme);

    return () => {
      window.removeEventListener('authChanged', checkUserAndUpdateTheme);
      window.removeEventListener('user-updated', checkUserAndUpdateTheme);
      window.removeEventListener('login', checkUserAndUpdateTheme);
    };
  }, []); // Empty dependency array - only run once on mount

  // Helper: update language in user config
  const handleChangeLanguage = async (lang: 'vi' | 'en') => {
    // Prevent multiple rapid clicks
    if (isLanguageLoading) {
      return;
    }

    setIsLanguageLoading(true);

    try {
      // Change i18n language immediately for UI responsiveness
      i18n.changeLanguage(lang);

      const userId = getCurrentUserId();
      if (!userId) {
        console.warn('No userId found, language changed locally only');
        return;
      }

      // Get current user config
      const res = await getUserConfig(userId);
      if (res?.data) {
        const newConfig = {
          ...res.data,
          language: lang === 'vi' ? 1 : 0,
        };

        // Update user config via API
        await updateUserConfig(userId, newConfig);

        // Save to localStorage with proper event triggering
        updateUserConfigAndTriggerUpdate(newConfig);

        // Show success toast using translation
        toast.success(t('languageChangedSuccessfully'));
      } else {
        console.error('Failed to get user config');
        toast.error(t('languageChangeFailed'));
      }
    } catch (error) {
      console.error('Error updating language:', error);
      toast.error(t('languageChangeFailed'));
    } finally {
      setIsLanguageLoading(false);
    }
  };

  // Load language from localStorage on mount
  useEffect(() => {
    const loadLanguageFromStorage = () => {
      try {
        const userConfigStr = localStorage.getItem('user_config');
        if (userConfigStr) {
          const userConfig = JSON.parse(userConfigStr);
          if (userConfig.language !== undefined) {
            const languageCode = userConfig.language === 1 ? 'vi' : 'en';
            if (i18nInstance.language !== languageCode) {
              i18nInstance.changeLanguage(languageCode);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load language from localStorage:', error);
      }
    };

    loadLanguageFromStorage();
  }, [i18nInstance]);

  const handleLogout = () => {
    // Xóa tất cả localStorage
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    // Dispatch sự kiện để các tab khác cập nhật trạng thái đăng nhập
    window.dispatchEvent(new Event('authChanged'));
    // Chuyển hướng về trang login
    navigate('/login');
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ví dụ: gọi API khi mount layout hoặc khi cần loading
  useEffect(() => {
    setLoading(true);
    // Giả lập gọi API, thay thế bằng API thực tế nếu cần
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  // Lấy avatar từ localStorage/account và cập nhật khi user-updated
  useEffect(() => {
    const updateAvatar = () => {
      try {
        const accStr = localStorage.getItem('account');
        if (accStr) {
          const acc = JSON.parse(accStr);
          // Chỉ đọc avatar field, không đọc avatarUrl
          setAvatar(acc.avatar || '');
        }
      } catch {
        setAvatar(null);
      }
    };
    updateAvatar();
    window.addEventListener('user-updated', updateAvatar);
    window.addEventListener('storage', updateAvatar);
    return () => {
      window.removeEventListener('user-updated', updateAvatar);
      window.removeEventListener('storage', updateAvatar);
    };
  }, []);

  const NavItem = ({
    to,
    icon: Icon,
    children,
    isActive = false,
  }: {
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    isActive?: boolean;
  }) => (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 transform hover:scale-105',
        getThemeClass(
          isActive
            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 shadow-lg border border-blue-500/30 hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]'
            : 'hover:bg-blue-50 hover:text-blue-600',
          isActive
            ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 shadow-lg border border-pink-500/30 hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]'
            : 'hover:bg-white/5 hover:text-pink-400'
        )
      )}
    >
      <Icon className="text-sm" />
      <span className="text-sm font-medium">{children}</span>
    </Link>
  );

  const SectionHeader = ({
    section,
    icon: Icon,
    title,
  }: {
    section: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-2 text-xs font-semibold uppercase tracking-wide rounded-md transition-colors',
        getThemeClass(
          'text-gray-700 bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 border border-blue-200',
          'text-white bg-gradient-to-r from-[#32235a] to-[#5c357a] hover:from-[#6d28d9] hover:to-[#ec4899]'
        )
      )}
    >
      <Icon className="text-xs" />
      <span>{title}</span>
      {expandedSections[section] ? (
        <FaChevronDown className="ml-auto text-xs" />
      ) : (
        <FaChevronRight className="ml-auto text-xs" />
      )}
    </button>
  );

  return (
    <>
      <ScrollToTop />
      <style>{getScrollbarStyles(theme === 'dark')}</style>
      {loading && <SpinnerOverlay show={loading} />}
      <SidebarProvider>
        <div
          className={cn(
            'flex h-screen w-screen overflow-hidden',
            getThemeClass(
              'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 text-gray-900',
              'bg-gradient-to-br from-[#0f0c1a] to-[#1c1429] text-white'
            )
          )}
        >
          {/* Sidebar */}
          <aside
            className={cn(
              'w-72 shadow-2xl flex flex-col',
              getThemeClass(
                'bg-white/95 border-r border-gray-200 shadow-lg',
                'bg-gradient-to-br from-[#1e1b2e] to-[#2c2a40]'
              )
            )}
          >
            <div
              className={cn(
                'p-6',
                getThemeClass('border-b border-gray-200', 'border-b border-gray-700/50')
              )}
            >
              <div className="flex items-center justify-between">
                <h1
                  className={cn(
                    'text-2xl font-bold text-transparent bg-clip-text drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]',
                    getThemeClass(
                      'bg-gradient-to-r from-blue-600 to-purple-600',
                      'bg-gradient-to-r from-pink-500 to-purple-500'
                    )
                  )}
                >
                  Veezy Manager
                </h1>
              </div>
              <p className={cn('text-xs mt-1', getThemeClass('text-gray-600', 'text-gray-400'))}>
                {t('eventManagement')}
              </p>
              <br />
              {/* Theme and Language controls */}
              <div className="flex items-center mb-2 ml-[-30px]">
                <ThemeToggle className="scale-50" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-full font-semibold shadow-sm transition-all duration-200 focus:outline-none text-xs h-7 min-w-[48px]',
                        getThemeClass(
                          'bg-white/90 hover:bg-white border-gray-300 shadow-md text-gray-700 hover:text-gray-900 focus:ring-2 focus:ring-blue-200',
                          'bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 text-white hover:from-gray-600 hover:to-gray-700 focus:ring-2 focus:ring-purple-200'
                        ),
                        isLanguageLoading ? 'opacity-70 cursor-not-allowed' : ''
                      )}
                      style={{ lineHeight: '1.1', height: '28px' }}
                      disabled={isLanguageLoading}
                    >
                      <Globe
                        className={cn('w-4 h-4', getThemeClass('text-blue-600', 'text-purple-300'))}
                        style={{ marginBottom: '1px' }}
                      />
                      <span className="font-bold text-xs" style={{ marginTop: '1px' }}>
                        {i18nInstance.language === 'vi' ? 'VN' : 'EN'}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className={cn(
                      'rounded-xl shadow-xl p-1 min-w-[90px]',
                      getThemeClass(
                        'bg-white border border-gray-200 shadow-lg',
                        'bg-gray-800 border border-gray-600'
                      )
                    )}
                  >
                    <DropdownMenuItem
                      onClick={() => handleChangeLanguage('vi')}
                      disabled={isLanguageLoading}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded font-semibold text-xs transition-all duration-150',
                        getThemeClass(
                          i18nInstance.language === 'vi'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100',
                          i18nInstance.language === 'vi'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        ),
                        isLanguageLoading ? 'opacity-70 cursor-not-allowed' : ''
                      )}
                    >
                      <span className="text-base">🇻🇳</span> VN
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleChangeLanguage('en')}
                      disabled={isLanguageLoading}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded font-semibold text-xs transition-all duration-150',
                        getThemeClass(
                          i18nInstance.language === 'en'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100',
                          i18nInstance.language === 'en'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        ),
                        isLanguageLoading ? 'opacity-70 cursor-not-allowed' : ''
                      )}
                    >
                      <span className="text-base">🇬🇧</span> EN
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* Home button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shadow transition-all duration-200',
                    getThemeClass(
                      'bg-blue-600 hover:bg-blue-700 text-white',
                      'bg-blue-600 hover:bg-blue-700 text-white'
                    )
                  )}
                  title={t('home')}
                >
                  <FaHome className="text-sm" />
                  {t('home')}
                </button>
              </div>
            </div>
            {/* Navigation */}
            <nav
              className={cn(
                'flex-1 px-4 py-6 overflow-y-auto space-y-6 custom-scrollbar',
                getThemeClass('', '')
              )}
            >
              <div>
                <NavItem to="" icon={FaHome} isActive={isActiveRoute('/event-manager')}>
                  {t('dashboard')}
                </NavItem>
              </div>
              {/* Event Management */}
              <div>
                <SectionHeader section="events" icon={FaCalendarAlt} title={t('eventManagement')} />
                {expandedSections.events && (
                  <div className="ml-4 space-y-1 mt-2">
                    <NavItem
                      to="create-event"
                      icon={FaPlus}
                      isActive={isActiveRoute('/event-manager/create-event')}
                    >
                      {t('createEvent')}
                    </NavItem>
                    <NavItem
                      to="pending-events"
                      icon={FaClock}
                      isActive={isActiveRoute('/event-manager/pending-events')}
                    >
                      {t('pendingEvents')}
                    </NavItem>
                    <NavItem
                      to="approved-events"
                      icon={FaCheckCircle}
                      isActive={isActiveRoute('/event-manager/approved-events')}
                    >
                      {t('approvedEvents')}
                    </NavItem>
                    <NavItem
                      to="collaborators"
                      icon={FaUsers}
                      isActive={isActiveRoute('/event-manager/collaborators')}
                    >
                      {t('collaborators')}
                    </NavItem>
                  </div>
                )}
              </div>
              {/* Ticket Management */}
              <div>
                <SectionHeader section="tickets" icon={FaTicketAlt} title={t('ticketManagement')} />
                {expandedSections.tickets && (
                  <div className="ml-4 space-y-1 mt-2">
                    <NavItem
                      to="tickets/manage"
                      icon={FaTicketAlt}
                      isActive={isActiveRoute('/event-manager/tickets/manage')}
                    >
                      {t('ticketManagement')}
                    </NavItem>
                    <NavItem
                      to="discount-codes"
                      icon={FaPercent}
                      isActive={isActiveRoute('/event-manager/discount-codes')}
                    >
                      {t('discountCodes')}
                    </NavItem>
                    <NavItem
                      to="ticket-sales"
                      icon={FaChartBar}
                      isActive={isActiveRoute('/event-manager/ticket-sales')}
                    >
                      {t('ticketSales')}
                    </NavItem>
                    <NavItem
                      to="check-ins"
                      icon={FaCheckCircle}
                      isActive={isActiveRoute('/event-manager/check-ins')}
                    >
                      {t('listcheckins')}
                    </NavItem>
                  </div>
                )}
              </div>
              {/* Analytics */}
              <div>
                <SectionHeader section="analytics" icon={FaChartBar} title={t('analytics')} />
                {expandedSections.analytics && (
                  <div className="ml-4 space-y-1 mt-2">
                    <NavItem
                      to="analytics/sentiment"
                      icon={FaEye}
                      isActive={isActiveRoute('/event-manager/analytics/sentiment')}
                    >
                      {t('sentimentanalysis')}
                    </NavItem>
                    <NavItem
                      to="analytics/predictions"
                      icon={FaChartBar}
                      isActive={isActiveRoute('/event-manager/analytics/predictions')}
                    >
                      {t('aiattendancepredictor')}
                    </NavItem>
                    <NavItem
                      to="fund-management"
                      icon={FaDollarSign}
                      isActive={isActiveRoute('/event-manager/fund-management')}
                    >
                      {t('fundManagement')}
                    </NavItem>
                  </div>
                )}
              </div>
              {/* Content & Communication */}
              <div>
                <SectionHeader
                  section="content"
                  icon={FaNewspaper}
                  title={t('contentCommunication')}
                />
                {expandedSections.content && (
                  <div className="ml-4 space-y-1 mt-2">
                    <NavItem
                      to="news"
                      icon={FaNewspaper}
                      isActive={isActiveRoute('/event-manager/news')}
                    >
                      {t('newsManagement')}
                    </NavItem>
                    {/* Direct Chat Support navigation */}
                    <NavItem
                      to="chat-support"
                      icon={FaComments}
                      isActive={isActiveRoute('/event-manager/chat-support')}
                    >
                      {t('chatSupport')}
                    </NavItem>
                    <NavItem
                      to="notification-manager"
                      icon={FaBell}
                      isActive={isActiveRoute('/event-manager/notification-manager')}
                    >
                      Notification Center
                    </NavItem>
                  </div>
                )}
              </div>
            </nav>
            {/* User Account */}
            <div
              className={cn(
                'p-4',
                getThemeClass('border-t border-gray-200', 'border-t border-gray-700/50')
              )}
            >
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!isDropdownOpen)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-300 rounded-lg',
                    getThemeClass(
                      'text-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-blue-200',
                      'text-white bg-gradient-to-r from-[#3a324e] to-[#4b3e65] hover:from-[#4b3e65] hover:to-[#5c4d7a] hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] border border-purple-500/20'
                    )
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center shadow-lg overflow-hidden',
                      getThemeClass(
                        'bg-gradient-to-r from-blue-500 to-purple-500',
                        'bg-gradient-to-r from-pink-500 to-purple-500'
                      )
                    )}
                  >
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="avatar"
                        className="object-cover w-full h-full rounded-full"
                      />
                    ) : (
                      <FaUserCircle className="text-lg text-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div
                      className={cn('font-medium', getThemeClass('text-gray-800', 'text-white'))}
                    >
                      Event Manager
                    </div>
                    <div className={cn('text-xs', getThemeClass('text-gray-600', 'text-gray-300'))}>
                      {t('accountManagement')}
                    </div>
                  </div>
                  <FaChevronDown
                    className={cn(
                      'transition-transform duration-200',
                      getThemeClass('text-gray-500', 'text-gray-400'),
                      isDropdownOpen ? 'rotate-180' : 'rotate-0'
                    )}
                  />
                </button>
                {isDropdownOpen && (
                  <div
                    className={cn(
                      'absolute left-0 bottom-full mb-2 w-full rounded-lg shadow-2xl backdrop-blur-sm z-20 overflow-hidden',
                      getThemeClass(
                        'bg-white border border-gray-200 shadow-lg',
                        'bg-[#2a243b] border border-purple-500/30'
                      )
                    )}
                  >
                    <Link
                      to="profile"
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 transition-all duration-200',
                        getThemeClass(
                          'text-gray-700 hover:bg-blue-50',
                          'text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20'
                        )
                      )}
                    >
                      <FaUserCircle
                        className={cn(getThemeClass('text-gray-500', 'text-gray-400'))}
                      />
                      <span>{t('personalProfile')}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 rounded-lg',
                        getThemeClass(
                          'bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-500 hover:to-red-600 text-white',
                          'bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-500 hover:to-red-600 text-white'
                        )
                      )}
                    >
                      <svg
                        className="w-4 h-4 text-gray-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </aside>
          {/* Main Content */}
          <main
            className={cn(
              'flex-1 h-screen overflow-y-auto custom-scrollbar',
              getThemeClass(
                'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
                'bg-gradient-to-br from-[#0f0c1a] to-[#1c1429]'
              )
            )}
          >
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
      {/* Add CustomerChatBox for Event Managers to communicate with admin */}
      <CustomerChatBox />
    </>
  );
}

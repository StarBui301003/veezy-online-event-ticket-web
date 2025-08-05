/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import NotificationDropdown from '@/components/common/NotificationDropdown';
import { CiSearch } from 'react-icons/ci';
import { Button } from '../../ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { AVATAR, LOGO } from '@/assets/img';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { IoIosArrowDown } from 'react-icons/io';
import { Input } from '../../ui/input';
import { LogoutAPI, getUserAPI } from '@/services/auth.service';
import { Loader2 } from 'lucide-react';
import { Account } from '@/types/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FiUser } from 'react-icons/fi';
import { LogOut } from 'lucide-react';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { updateUserConfig, getUserConfig } from '@/services/userConfig.service';
import ThemeToggle from '@/components/User/ThemeToggle';
import { toast } from 'react-toastify';

// Helper: get userId from localStorage
const getUserId = () => {
  const accStr = typeof window !== 'undefined' ? localStorage.getItem('account') : null;
  if (!accStr) return null;
  try {
    const acc = JSON.parse(accStr);
    return acc.userId || acc.accountId || null;
  } catch {
    return null;
  }
};

export const Header = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const [blur, setBlur] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [user, setUser] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | undefined>(undefined); // Thêm state avatar
  const [loadingLogout, setLoadingLogout] = useState(false);
  const navigate = useNavigate();
  const [notifDropdown, setNotifDropdown] = useState(false);
  const accountStr = typeof window !== 'undefined' ? localStorage.getItem('account') : null;
  const accountObj = accountStr ? JSON.parse(accountStr) : null;
  const userId = accountObj?.userId || accountObj?.accountId;
  const { unreadCount } = useRealtimeNotifications();

  // Helper: update language in user config
  const handleChangeLanguage = async (lang: 'vi' | 'en') => {
    try {
      // Change i18n language immediately for UI responsiveness
      i18n.changeLanguage(lang);

      const userId = getUserId();
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

        // Save to localStorage
        localStorage.setItem('user_config', JSON.stringify(newConfig));

        // Show success toast using translation
        toast.success(t('languageChangedSuccessfully'));
      } else {
        console.error('Failed to get user config');
        toast.error(t('languageChangeFailed'));
      }
    } catch (error) {
      console.error('Error updating language:', error);
      toast.error(t('languageChangeFailed'));
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string;
      name: string;
      description: string;
      type: string;
      imageUrl: string;
      date: string;
    }>
  >([]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    // Navigate to search results page with the search term
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
    }
  }, [searchTerm]);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', changeBlur);

    const fetchAccountAndUser = () => {
      const accStr = localStorage.getItem('account');
      if (accStr) {
        try {
          const acc = JSON.parse(accStr);
          setAccount(acc);
          // Logic giống nav-user: chỉ đọc avatar field
          const avatarUrl = acc.avatar || '';
          setAvatar(avatarUrl || undefined);

          // Gọi API lấy user
          if (acc.userId) {
            getUserAPI(acc.userId)
              .then((userData) => setUser(userData))
              .catch(() => setUser(null));
          }
        } catch {
          setAccount(null);
          setAvatar(undefined);
        }
      } else {
        setAccount(null);
        setAvatar(undefined);
      }
    };

    fetchAccountAndUser();

    const handleAvatarUpdate = (event: CustomEvent) => {
      if (event.detail?.avatarUrl !== undefined) {
        console.log('Header - Avatar Updated:', event.detail.avatarUrl);
        setAvatar(event.detail.avatarUrl);
      }
    };

    window.addEventListener('user-updated', fetchAccountAndUser);
    window.addEventListener('storage', fetchAccountAndUser);
    window.addEventListener('avatar-updated', handleAvatarUpdate as EventListener);

    return () => {
      window.removeEventListener('scroll', changeBlur);
      window.removeEventListener('user-updated', fetchAccountAndUser);
      window.removeEventListener('storage', fetchAccountAndUser);
      window.removeEventListener('avatar-updated', handleAvatarUpdate as EventListener);
    };
  }, []);

  const changeBlur = () => {
    setBlur(window.scrollY > 0);
  };

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await LogoutAPI();
      localStorage.removeItem('access_token');
      localStorage.removeItem('account');
      localStorage.removeItem('customerId');
      localStorage.removeItem('user_config');
      document.cookie = 'refresh_token=; Max-Age=0; path=/;';
      setAccount(null);
      navigate('/login');
    } finally {
      setLoadingLogout(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'fixed top-0 w-full pl-[10px] sm:pl-0 pr-[14px] sm:pr-0 items-center z-20 bg-black',
          {
            'backdrop-blur': blur,
          }
        )}
      >
        <div className="sm:wrapper flex sm:h-[100px] h-[57px] items-center justify-between px-7 pr-10">
          {/* Left side - Logo */}
          <Link to={'/'} className="block shrink-0">
            <img className="sm:h-10 sm:w-[115px] w-[92px] h-[32px]" src={LOGO} alt="Logo" />
          </Link>

          {/* Center - Search bar */}
          <div className="search-container flex w-full max-w-sm items-center min-w-70 border border-white/20 bg-white/10 rounded-[46px] relative mx-auto">
            <CiSearch className="size-5 text-white ml-[17px]" strokeWidth={1.2} />
            <Input
              type="text"
              placeholder={t('search_placeholder')}
              className="body-medium-14 border-none truncate-placeholder ml-0 my-[2px] text-white placeholder:text-white/70 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                {searchResults.map((item) => (
                  <Link
                    key={item.id}
                    to={`/event/${item.id}`}
                    className="block p-3 text-white border-b border-gray-700 last:border-b-0"
                    onClick={() => setSearchResults([])}
                  >
                    <div className="flex items-center">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded mr-3"
                        />
                      )}
                      <div>
                        <div className="font-medium text-white">{item.name}</div>
                        <div className="text-sm text-gray-300">
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Navigation and controls */}
          <div className="flex items-center gap-4">
            {/* Navigation */}
            <div className="sm:flex sm:gap-x-8 hidden items-center">
              <Link
                to="/"
                className="body-bold-16 text-white whitespace-nowrap border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
              >
                {t('Home')}
              </Link>
              <Link
                to="/events"
                className="body-bold-16 text-white whitespace-nowrap border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
              >
                {t('Event')}
              </Link>
              <Link
                to="/news"
                className="body-bold-16 text-white whitespace-nowrap border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
              >
                {t('News')}
              </Link>
              <Link
                to="/terms-of-use"
                className="body-bold-16 text-white whitespace-nowrap border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
              >
                {t('Terms of Use')}
              </Link>
            </div>

            {/* Theme Toggle */}
            <div className="hidden sm:block">
              <ThemeToggle className="scale-75 mt-3" />
            </div>
            {/* Language Dropdown */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="body-medium-16 px-[6px] hidden sm:flex bg-transparent text-white transition duration-300 hover:scale-110 hover:shadow hover:bg-white/10"
                >
                  {i18nInstance.language === 'vi' ? 'VN' : 'EN'}
                  <IoIosArrowDown className="text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-32 !bg-gray-900 border-none rounded-md shadow-lg">
                <DropdownMenuItem
                  onClick={() => handleChangeLanguage('vi')}
                  className="!bg-gray-900 text-white cursor-pointer hover:!bg-gray-800 focus:!bg-gray-800 focus:text-white data-[highlighted]:!bg-gray-800 data-[highlighted]:text-white"
                >
                  VN
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleChangeLanguage('en')}
                  className="!bg-gray-900 text-white cursor-pointer hover:!bg-gray-800 focus:!bg-gray-800 focus:text-white data-[highlighted]:!bg-gray-800 data-[highlighted]:text-white"
                >
                  EN
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex gap-x-6 ml-0 items-center">
            {/* Nút chuyển sang event manager chỉ hiện với role 2 */}
            {account?.role === 2 && (
              <Button
                className="bg-gradient-to-r from-[#ff00cc] to-[#3333ff] text-white px-5 py-2 font-bold rounded-lg shadow hover:scale-105 transition-transform duration-200 mr-2"
                onClick={() => navigate('/event-manager')}
              >
                {t('eventManager')}
              </Button>
            )}
            {!account ? (
              <>
                <Link
                  to="/login"
                  className="body-bold-16 text-white border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="body-bold-16 text-white border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
                >
                  {t('signUp')}
                </Link>
              </>
            ) : (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-3 bg-transparent hover:bg-white/10"
                    style={{ minWidth: 0 }}
                  >
                    <Avatar className="w-8 h-8 border border-white/30 rounded-full">
                      <AvatarImage src={avatar || AVATAR} alt="avatar" />
                      <AvatarFallback className="bg-white/10 text-white">
                        {user?.fullName?.[0]?.toUpperCase() ||
                          account.fullname?.[0]?.toUpperCase() ||
                          account.username?.[0]?.toUpperCase() ||
                          'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline whitespace-nowrap text-white">
                      {user?.fullName || account.fullname || account.username}
                    </span>
                    <IoIosArrowDown className="text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-60 rounded-lg !bg-gray-900 border-gray-700 text-white"
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 pl-2 py-2">
                      <Avatar className="h-10 w-10 rounded-full border border-white/30">
                        <AvatarImage src={avatar || AVATAR} alt="avatar" />
                        <AvatarFallback className="rounded-full bg-white/10 text-white">
                          {user?.fullName?.[0]?.toUpperCase() ||
                            account.fullname?.[0]?.toUpperCase() ||
                            account.username?.[0]?.toUpperCase() ||
                            'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col justify-center">
                        <span className="font-semibold text-sm text-white truncate max-w-[140px]">
                          {user?.username || account.username || account.fullname}
                        </span>
                        <span className="text-xs text-gray-300 truncate max-w-[180px]">
                          {user?.email || account.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    className="!bg-gray-900 text-white hover:!bg-gray-800 focus:!bg-gray-800 focus:text-white pl-5"
                    onClick={() => navigate('/profile')}
                  >
                    <FiUser className="mr-2" />
                    {t('profile')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={loadingLogout}
                    className="!bg-gray-900 text-white hover:!bg-gray-800 focus:!bg-gray-800 focus:text-white pl-5"
                  >
                    <LogOut className="mr-2" />
                    {loadingLogout ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('logging_out')}
                      </>
                    ) : (
                      t('logout')
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* Notification Bell */}
            {account && (
              <div className="relative">
                <button
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-all relative"
                  onClick={() => setNotifDropdown((v) => !v)}
                  title={t('notification')}
                >
                  <Bell className="text-white text-xl" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-800 animate-pulse"></span>
                  )}
                </button>
                {notifDropdown && (
                  <NotificationDropdown
                    userId={userId}
                    userRole={1}
                    onViewAll={() => {
                      setNotifDropdown(false);
                      navigate('/notifications');
                    }}
                    t={t}
                    onRedirect={(url) => {
                      navigate(url);
                      setNotifDropdown(false);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

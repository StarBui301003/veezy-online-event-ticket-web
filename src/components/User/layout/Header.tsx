/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import NotificationDropdown from '@/components/common/NotificationDropdown';
import { CiSearch } from 'react-icons/ci';
import { Button } from '../../ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { AVATAR, LOGO } from '@/assets/img';
import { useEffect, useState, useContext } from 'react';
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
import { LogoutAPI } from '@/services/auth.service';
import { Loader2 } from 'lucide-react';
// import { Account } from '@/types/auth';
import { AuthContext } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FiUser } from 'react-icons/fi';
import { LogOut } from 'lucide-react';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { updateUserConfig, getUserConfig } from '@/services/userConfig.service';
import ThemeToggle from '@/components/User/ThemeToggle';
import { toast } from 'react-toastify';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { updateUserConfigAndTriggerUpdate, getCurrentUserId } from '@/utils/account-utils';

export const Header = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const { getThemeClass, getTextClass } = useThemeClasses();
  const [blur, setBlur] = useState(false);
  // Remove local user state, always use AuthContext's user
  const [avatar, setAvatar] = useState<string | undefined>(undefined); // Thêm state avatar
  const [loadingLogout, setLoadingLogout] = useState(false);
  const navigate = useNavigate();
  const [notifDropdown, setNotifDropdown] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const userId = user?.userId || user?.accountId;
  const { unreadCount } = useRealtimeNotifications();

  // Helper: update language in user config
  const handleChangeLanguage = async (lang: 'vi' | 'en') => {
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
        toast.error(t('languageChangeFailed'));
      }
    } catch (error) {
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
    setAvatar(user?.avatar || undefined);
    return () => {
      window.removeEventListener('scroll', changeBlur);
    };
  }, [user]);

  const changeBlur = () => {
    setBlur(window.scrollY > 0);
  };

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await LogoutAPI();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.warning(t('logout_failed'));
    } finally {
      logout(); // Always update global login state
      navigate('/login');
      setLoadingLogout(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'fixed top-0 w-full pl-[10px] sm:pl-0 pr-[14px] sm:pr-0 items-center z-20',
          getThemeClass(
            'bg-gradient-to-r from-blue-100 to-indigo-200 border-b border-gray-300',
            'bg-[linear-gradient(to_bottom_right,#0B1736,#091D4B,#0B1736)]'
          ),
          {
            'backdrop-blur': blur,
          }
        )}
        style={{
          background: getThemeClass(
            'linear-gradient(to right, #dbeafe, #c7d2fe)',
            'linear-gradient(to bottom right, #0B1736, #091D4B, #0B1736)'
          ),
        }}
      >
        <div className="sm:wrapper flex sm:h-[80px] h-[40px] items-center justify-between px-7 pr-10">
          {/* Left side - Logo */}
          <Link to={'/'} className="block shrink-0">
            <img
              className={cn(
                'sm:h-8 sm:w-[92px] w-[74px] h-[26px]',
                getThemeClass('', 'invert brightness-0')
              )}
              src={LOGO}
              alt="Logo"
            />
          </Link>

          {/* Center - Search bar */}
          <div
            className={cn(
              'search-container flex w-full max-w-96 items-center min-w-60 border rounded-full relative',
              getThemeClass(
                'border-blue-300 bg-white/90 backdrop-blur-sm shadow-sm',
                'border-white/20 bg-white/10'
              )
            )}
          >
            <CiSearch className={cn('size-5 ml-[17px]', getTextClass())} strokeWidth={1.2} />
            <Input
              type="text"
              placeholder={t('search_placeholder')}
              className={cn(
                'body-medium-14 border-none truncate-placeholder ml-0 my-[2px] bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
                getThemeClass(
                  'text-gray-900 placeholder:text-gray-500',
                  ' placeholder:text-gray-500 text-gray-100'
                )
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            {searchResults.length > 0 && (
              <div
                className={cn(
                  'absolute top-full left-0 right-0 mt-1 border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto',
                  getThemeClass('bg-white border-gray-300', 'bg-gray-900 border-gray-700')
                )}
              >
                {searchResults.map((item) => (
                  <Link
                    key={item.id}
                    to={`/event/${item.id}`}
                    className={cn(
                      'block p-3 border-b last:border-b-0',
                      getThemeClass('text-gray-900 border-gray-300', 'text-white border-gray-700')
                    )}
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
                        <div className={cn('font-medium', getTextClass())}>{item.name}</div>
                        <div
                          className={cn('text-sm', getThemeClass('text-gray-600', 'text-gray-300'))}
                        >
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
                className={cn(
                  'body-bold-16 whitespace-nowrap transition-colors select-none',
                  getThemeClass(
                    'text-blue-900 hover:text-blue-700 border-b border-b-transparent hover:border-blue-700 ',
                    'text-white hover:text-white border-b border-b-transparent hover:border-neutral-100 '
                  )
                )}
              >
                {t('Home')}
              </Link>
              <Link
                to="/events"
                className={cn(
                  'body-bold-16 whitespace-nowrap transition-colors select-none',
                  getThemeClass(
                    'text-blue-900 hover:text-blue-700 border-b border-b-transparent hover:border-blue-700 ',
                    'text-white hover:text-white border-b border-b-transparent hover:border-neutral-100 '
                  )
                )}
              >
                {t('Event')}
              </Link>
              <Link
                to="/news"
                className={cn(
                  'body-bold-16 whitespace-nowrap transition-colors select-none',
                  getThemeClass(
                    'text-blue-900 hover:text-blue-700 border-b border-b-transparent hover:border-blue-700 ',
                    'text-white hover:text-white border-b border-b-transparent hover:border-neutral-100 '
                  )
                )}
              >
                {t('newss')}
              </Link>
              <Link
                to="/terms-of-use"
                className={cn(
                  'body-bold-16 whitespace-nowrap transition-colors select-none',
                  getThemeClass(
                    'text-blue-900 hover:text-blue-700 border-b border-b-transparent hover:border-blue-700 ',
                    'text-white hover:text-white border-b border-b-transparent hover:border-neutral-100 '
                  )
                )}
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
                  className={cn(
                    'body-medium-16 px-[6px] rounded-xl hidden sm:flex bg-transparent light:text-blue-700 hover:text-white transition duration-300 hover:scale-110 hover:shadow',
                    getThemeClass(
                      'text-black hover:text-black hover:bg-gray-100',
                      'text-white hover:bg-white/10'
                    )
                  )}
                >
                  {i18nInstance.language === 'vi' ? 'VN' : 'EN'}
                  <IoIosArrowDown className={getTextClass()} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className={cn(
                  'w-32 rounded-md shadow-lg',
                  getThemeClass('!bg-white border-gray-200', '!bg-gray-900 border-none')
                )}
              >
                <DropdownMenuItem
                  onClick={() => handleChangeLanguage('vi')}
                  className={cn(
                    'cursor-pointer',
                    getThemeClass(
                      '!bg-white text-gray-900 hover:!bg-gray-100 focus:!bg-gray-100 focus:text-gray-900 data-[highlighted]:!bg-gray-100 data-[highlighted]:text-gray-900',
                      '!bg-gray-900 text-white hover:!bg-gray-800 focus:!bg-gray-800 focus:text-white data-[highlighted]:!bg-gray-800 data-[highlighted]:text-white'
                    )
                  )}
                >
                  VN
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleChangeLanguage('en')}
                  className={cn(
                    'cursor-pointer',
                    getThemeClass(
                      '!bg-white text-gray-900 hover:!bg-gray-100 focus:!bg-gray-100 focus:text-gray-900 data-[highlighted]:!bg-gray-100 data-[highlighted]:text-gray-900',
                      '!bg-gray-900 text-white hover:!bg-gray-800 focus:!bg-gray-800 focus:text-white data-[highlighted]:!bg-gray-800 data-[highlighted]:text-white'
                    )
                  )}
                >
                  EN
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex gap-x-6 ml-0 items-center">
            {/* Nút chuyển sang event manager chỉ hiện với role 2 */}
            {user?.role === 2 && (
              <Button
                className="bg-gradient-to-r from-[#ff00cc] to-[#3333ff] text-white px-5 py-2 font-bold rounded-full shadow hover:scale-105 transition-transform duration-200 my-2 ml-2"
                onClick={() => navigate('/event-manager')}
              >
                {t('eventManager')}
              </Button>
            )}
            {!user ? (
              <>
                <Link
                  to="/login"
                  className={cn(
                    'body-bold-16 whitespace-nowrap transition-colors select-none ml-2',
                    getThemeClass(
                      'text-blue-900 hover:text-blue-700 border-b border-b-transparent hover:border-blue-700 ',
                      'text-white hover:text-white border-b border-b-transparent hover:border-neutral-100 '
                    )
                  )}
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className={cn(
                    'body-bold-16 whitespace-nowrap transition-colors select-none',
                    getThemeClass(
                      'text-blue-900 hover:text-blue-700 border-b border-b-transparent hover:border-blue-700 ',
                      'text-white hover:text-white border-b border-b-transparent hover:border-neutral-100 '
                    )
                  )}
                >
                  {t('signUp')}
                </Link>
              </>
            ) : (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      'body-medium-16 px-[6px] rounded-xl hidden sm:flex bg-transparent light:text-blue-700 hover:text-white transition duration-300 hover:shadow',
                      getThemeClass(
                        'text-black hover:text-black hover:bg-gray-100',
                        'text-white hover:bg-white/10'
                      )
                    )}
                    style={{ minWidth: 0 }}
                  >
                    <Avatar
                      className={cn(
                        'w-8 h-8 border rounded-full',
                        getThemeClass('border-gray-300', 'border-white/30')
                      )}
                    >
                      <AvatarImage src={avatar || AVATAR} alt="avatar" />
                      <AvatarFallback
                        className={cn('text-white', getThemeClass('bg-gray-100', 'bg-white/10'))}
                      >
                        {user?.fullName?.[0]?.toUpperCase() ||
                          user?.fullname?.[0]?.toUpperCase() ||
                          user?.username?.[0]?.toUpperCase() ||
                          'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className={cn('hidden sm:inline whitespace-nowrap', getTextClass())}>
                      {user?.fullName || user?.fullname || user?.username}
                    </span>
                    <IoIosArrowDown className={getTextClass()} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className={cn(
                    'w-60 rounded-lg',
                    getThemeClass(
                      '!bg-white border-gray-200 text-gray-900',
                      '!bg-gray-900 border-gray-700 text-white'
                    )
                  )}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 pl-2 py-2">
                      <Avatar
                        className={cn(
                          'h-10 w-10 rounded-full border',
                          getThemeClass('border-gray-300', 'border-white/30')
                        )}
                      >
                        <AvatarImage src={avatar || AVATAR} alt="avatar" />
                        <AvatarFallback
                          className={cn(
                            'rounded-full text-white',
                            getThemeClass('bg-gray-100', 'bg-white/10')
                          )}
                        >
                          {user?.fullName?.[0]?.toUpperCase() ||
                            user?.fullname?.[0]?.toUpperCase() ||
                            user?.username?.[0]?.toUpperCase() ||
                            'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col justify-center">
                        <span
                          className={cn(
                            'font-semibold text-sm truncate max-w-[140px]',
                            getTextClass()
                          )}
                        >
                          {user?.username || user?.fullname}
                        </span>
                        <span
                          className={cn(
                            'text-xs truncate max-w-[180px]',
                            getThemeClass('text-gray-600', 'text-gray-300')
                          )}
                        >
                          {user?.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className={getThemeClass('bg-gray-300', 'bg-gray-700')} />
                  <DropdownMenuItem
                    className={cn(
                      'pl-5',
                      getThemeClass(
                        '!bg-white text-gray-900 hover:!bg-gray-100 focus:!bg-gray-100 focus:text-gray-900 data-[highlighted]:!bg-gray-100 data-[highlighted]:text-gray-900',
                        '!bg-gray-900 text-white hover:!bg-gray-800 focus:!bg-gray-800 focus:text-white data-[highlighted]:!bg-gray-800 data-[highlighted]:text-white'
                      )
                    )}
                    onClick={() => {
                      if (user?.role === 2) {
                        navigate('/event-manager/profile');
                      } else {
                        navigate('/profile');
                      }
                    }}
                  >
                    <FiUser className="mr-2" />
                    {t('profile')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={getThemeClass('bg-gray-300', 'bg-gray-700')} />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={loadingLogout}
                    className={cn(
                      'pl-5',
                      getThemeClass(
                        '!bg-white text-gray-900 hover:!bg-gray-100 focus:!bg-gray-100 focus:text-gray-900',
                        '!bg-gray-900 text-white hover:!bg-gray-800 focus:!bg-gray-800 focus:text-white'
                      )
                    )}
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
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full transition-all relative',
                    getThemeClass('hover:bg-gray-100', 'hover:bg-white/10')
                  )}
                  onClick={() => setNotifDropdown((v) => !v)}
                  title={t('notification')}
                >
                  <Bell className={cn('text-xl', getTextClass())} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-800 animate-pulse"></span>
                  )}
                </button>
                {notifDropdown && (
                  <NotificationDropdown
                    userId={userId}
                    onViewAll={() => {
                      setNotifDropdown(false);
                      navigate('/notifications');
                    }}
                    onRedirect={(url) => {
                      navigate(url);
                      setNotifDropdown(false);
                    }}
                    t={t}
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

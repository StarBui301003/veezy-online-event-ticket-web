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
import { Loader2, Menu, X } from 'lucide-react';
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
  const { t } = useTranslation();
  const { getThemeClass, getTextClass } = useThemeClasses();
  const [blur, setBlur] = useState(false);
  // Remove local user state, always use AuthContext's user
  const [avatar, setAvatar] = useState<string | undefined>(undefined); // Thêm state avatar
  const [loadingLogout, setLoadingLogout] = useState(false);
  const navigate = useNavigate();
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const userId = user?.userId || user?.accountId;
  const { unreadCount } = useRealtimeNotifications();

  // Khóa scroll nền khi mở sidebar/search trên mobile
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    if (mobileMenuOpen) {
      const previousOverflow = body.style.overflow;
      const previousHtmlOverflow = html.style.overflow;
      const previousPaddingRight = body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        body.style.overflow = previousOverflow;
        html.style.overflow = previousHtmlOverflow;
        body.style.paddingRight = previousPaddingRight;
      };
    }
    // Ensure reset when both are closed
    body.style.overflow = '';
    html.style.overflow = '';
    body.style.paddingRight = '';
  }, [mobileMenuOpen]);

  // Helper: update language in user config
  const handleChangeLanguage = async (e: React.MouseEvent, lang: 'vi' | 'en') => {
    // Prevent the default behavior of the click event
    e.preventDefault();

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
      console.error('Error changing language:', error);
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
            if (i18n.language !== languageCode) {
              i18n.changeLanguage(languageCode);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load language from localStorage:', error);
      }
    };

    loadLanguageFromStorage();
  }, []);

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
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
        <div className="sm:wrapper flex sm:h-[70px] h-[50px] items-center justify-between px-4 sm:px-7 sm:pr-10">
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

          {/* Center - Search bar - Hidden on mobile */}
          <div
            className={cn(
              'search-container hidden sm:flex w-full max-w-96 items-center min-w-60 border rounded-full relative',
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
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Navigation */}
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
                    'text-white hover:text-white border-b border-b-transparent hover:border-blue-700 '
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
                    'body-medium-16 px-[6px] rounded-xl hidden sm:flex bg-transparent light:text-blue-700 hover:text-white transition duration-300 hover:shadow',
                    getThemeClass(
                      'text-black hover:text-black hover:bg-gray-100',
                      'text-white hover:bg-white/10'
                    )
                  )}
                >
                  {i18n.language === 'vi' ? 'VN' : 'EN'}
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
                  onClick={(e) => handleChangeLanguage(e, 'vi')}
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
                  onClick={(e) => handleChangeLanguage(e, 'en')}
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
          <div className="flex gap-x-4 ml-0 items-center">
            {/* Nút chuyển sang event manager chỉ hiện với role 2 và chỉ trên desktop */}
            {user?.role === 2 && (
              <Button
                className="hidden sm:block bg-gradient-to-r from-[#ff00cc] to-[#3333ff] text-white px-5 py-2 font-bold rounded-full shadow hover:scale-105 transition-transform duration-200 my-2 ml-2"
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

                {/* Hamburger at far right on mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="sm:hidden rounded-full ml-2"
                  onClick={toggleMobileMenu}
                  aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                  title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                  {mobileMenuOpen ? (
                    <X className={cn('w-9 h-9', getTextClass())} />
                  ) : (
                    <Menu className={cn('w-9 h-9', getTextClass())} />
                  )}
                </Button>
              </>
            ) : (
              <>
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
                    <DropdownMenuSeparator
                      className={getThemeClass('bg-gray-300', 'bg-gray-700')}
                    />
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
                    <DropdownMenuSeparator
                      className={getThemeClass('bg-gray-300', 'bg-gray-700')}
                    />
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

                {/* Hamburger menu for logged-in users on mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="sm:hidden p-3 rounded-full ml-2"
                  onClick={toggleMobileMenu}
                  aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                  title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                  {mobileMenuOpen ? (
                    <X className={cn('w-9 h-10', getTextClass())} />
                  ) : (
                    <Menu className={cn('w-9 h-9', getTextClass())} />
                  )}
                </Button>
              </>
            )}
            {/* Notification Bell - Hidden for Event Management role */}
            {user && user.role !== 2 && (
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
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold border-2 border-white shadow-sm">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifDropdown && (
                  <NotificationDropdown
                    userId={userId}
                    t={t}
                    onViewAll={() => {
                      setNotifDropdown(false);
                      navigate('/notifications');
                    }}
                    onRedirect={(url) => {
                      navigate(url);
                      setNotifDropdown(false);
                    }}
                    onClose={() => {
                      setNotifDropdown(false);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 sm:hidden transition-all duration-300 ease-in-out',
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            'fixed inset-0 backdrop-blur-sm transition-all duration-300 ease-in-out',
            mobileMenuOpen ? 'bg-black/50' : 'bg-black/0'
          )}
          onClick={closeMobileMenu}
        />

        {/* Menu Content */}
        <div
          className={cn(
            'fixed top-0 right-0 h-full w-80 max-w-[85vw] shadow-xl transform transition-all duration-300 ease-in-out flex flex-col',
            getThemeClass(
              'bg-white border-l border-gray-200',
              'bg-gray-900 border-l border-gray-700'
            ),
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          {/* Mobile Menu Header - Fixed */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className={cn('text-lg font-semibold', getTextClass())}>{t('menu')}</h2>
            <div className="flex items-center gap-2">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={closeMobileMenu}
                className="p-2 rounded-full"
                aria-label="Close menu"
              >
                <X className={cn('w-6 h-6', getTextClass())} />
              </Button>
            </div>
          </div>

          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6">
            {/* Mobile Search */}
            <div>
              <div
                className={cn(
                  'flex items-center w-full border rounded-full relative',
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
                          getThemeClass(
                            'text-gray-900 border-gray-300',
                            'text-white border-gray-700'
                          )
                        )}
                        onClick={() => {
                          setSearchResults([]);
                          closeMobileMenu();
                        }}
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
                              className={cn(
                                'text-sm',
                                getThemeClass('text-gray-600', 'text-gray-300')
                              )}
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
            </div>

            {/* Mobile Navigation */}
            <nav className="space-y-4">
              <Link
                to="/"
                className={cn(
                  'block py-3 px-4 rounded-lg transition-colors',
                  getThemeClass('text-gray-900 hover:bg-gray-100', 'text-white hover:bg-gray-800')
                )}
                onClick={closeMobileMenu}
              >
                {t('Home')}
              </Link>
              <Link
                to="/events"
                className={cn(
                  'block py-3 px-4 rounded-lg transition-colors',
                  getThemeClass('text-gray-900 hover:bg-gray-100', 'text-white hover:bg-gray-800')
                )}
                onClick={closeMobileMenu}
              >
                {t('Event')}
              </Link>
              <Link
                to="/news"
                className={cn(
                  'block py-3 px-4 rounded-lg transition-colors',
                  getThemeClass('text-gray-900 hover:bg-gray-100', 'text-white hover:bg-gray-800')
                )}
                onClick={closeMobileMenu}
              >
                {t('newss')}
              </Link>
              <Link
                to="/terms-of-use"
                className={cn(
                  'block py-3 px-4 rounded-lg transition-colors',
                  getThemeClass('text-gray-900 hover:bg-gray-100', 'text-white hover:bg-gray-800')
                )}
                onClick={closeMobileMenu}
              >
                {t('Terms of Use')}
              </Link>
            </nav>

            {/* Mobile Theme Toggle */}
            <div>
              <ThemeToggle />
            </div>

            {/* Mobile Language Toggle */}
            <div>
              <div
                className={cn(
                  'flex rounded-lg border overflow-hidden',
                  getThemeClass('border-gray-300', 'border-gray-600')
                )}
              >
                <button
                  onClick={(e) => {
                    handleChangeLanguage(e, 'vi');
                    closeMobileMenu();
                  }}
                  className={cn(
                    'flex-1 py-2 px-4 text-sm font-medium transition-colors',
                    i18n.language === 'vi'
                      ? getThemeClass('bg-blue-600 text-white', 'bg-blue-600 text-white')
                      : getThemeClass(
                          'text-gray-700 hover:bg-gray-100',
                          'text-gray-300 hover:bg-gray-800'
                        )
                  )}
                >
                  VN
                </button>
                <button
                  onClick={(e) => {
                    handleChangeLanguage(e, 'en');
                    closeMobileMenu();
                  }}
                  className={cn(
                    'flex-1 py-2 px-4 text-sm font-medium transition-colors',
                    i18n.language === 'en'
                      ? getThemeClass('bg-blue-600 text-white', 'bg-blue-600 text-white')
                      : getThemeClass(
                          'text-gray-700 hover:bg-gray-100',
                          'text-gray-300 hover:bg-gray-800'
                        )
                  )}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Mobile Auth Section */}
            {!user ? (
              <div className="space-y-3">
                <Link
                  to="/login"
                  className={cn(
                    'block w-full py-3 px-4 text-center rounded-lg font-medium transition-colors',
                    getThemeClass(
                      'bg-blue-600 text-white hover:bg-blue-700',
                      'bg-blue-600 text-white hover:bg-blue-700'
                    )
                  )}
                  onClick={closeMobileMenu}
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className={cn(
                    'block w-full py-3 px-4 text-center rounded-lg font-medium transition-colors border',
                    getThemeClass(
                      'border-blue-600 text-blue-600 hover:bg-blue-50',
                      'border-blue-400 text-blue-400 hover:bg-blue-900/20'
                    )
                  )}
                  onClick={closeMobileMenu}
                >
                  {t('signUp')}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg',
                    getThemeClass('bg-gray-50', 'bg-gray-800')
                  )}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={avatar || AVATAR} alt="avatar" />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {user?.fullName?.[0]?.toUpperCase() ||
                        user?.fullname?.[0]?.toUpperCase() ||
                        user?.username?.[0]?.toUpperCase() ||
                        'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className={cn('font-medium', getTextClass())}>
                      {user?.fullName || user?.fullname || user?.username}
                    </div>
                    <div className={cn('text-sm', getThemeClass('text-gray-600', 'text-gray-400'))}>
                      {user?.email}
                    </div>
                  </div>
                </div>

                <Link
                  to={user?.role === 2 ? '/event-manager/profile' : '/profile'}
                  className={cn(
                    'block w-full py-3 px-4 text-center rounded-lg font-medium transition-colors border',
                    getThemeClass(
                      'border-gray-300 text-gray-700 hover:bg-gray-50',
                      'border-gray-600 text-gray-300 hover:bg-gray-800'
                    )
                  )}
                  onClick={closeMobileMenu}
                >
                  <FiUser className="inline mr-2" />
                  {t('profile')}
                </Link>

                <Button
                  variant="outline"
                  className="w-full py-3 border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  disabled={loadingLogout}
                >
                  <LogOut className="inline mr-2 w-4 h-4" />
                  {loadingLogout ? (
                    <>
                      <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                      {t('logging_out')}
                    </>
                  ) : (
                    t('logout')
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
import { CiSearch } from 'react-icons/ci';
import { Button } from '../../ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { AVATAR, LOGO } from '@/assets/img';
import { useEffect, useState, useRef } from 'react';
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
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/notification.service';

export const Header = () => {
  const [blur, setBlur] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [user, setUser] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | undefined>(undefined); // Thêm state avatar
  const [loadingLogout, setLoadingLogout] = useState(false);
  const navigate = useNavigate();
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifHasUnread, setNotifHasUnread] = useState(false);
  const [notifPage, setNotifPage] = useState(1);
  const [notifHasMore, setNotifHasMore] = useState(true);

  useEffect(() => {
    window.addEventListener('scroll', changeBlur);

    const fetchAccountAndUser = () => {
      const accStr = localStorage.getItem('account');
      if (accStr) {
        try {
          const acc = JSON.parse(accStr);
          setAccount(acc);
          // Ưu tiên avatar từ localStorage (avatar, avatarUrl)
          setAvatar(
            acc.avatar && acc.avatar.trim() !== ''
              ? acc.avatar
              : acc.avatarUrl && acc.avatarUrl.trim() !== ''
              ? acc.avatarUrl
              : undefined
          );
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

    window.addEventListener('user-updated', fetchAccountAndUser);
    window.addEventListener('storage', fetchAccountAndUser);

    // Fetch notifications if logged in
    if (account?.userId) {
      getUserNotifications(account.userId, 1, 5).then((res) => {
        const items = res.data?.data?.items || [];
        setNotifications(items);
        setNotifHasUnread(items.some((n: any) => !n.isRead));
      });
    }

    return () => {
      window.removeEventListener('scroll', changeBlur);
      window.removeEventListener('user-updated', fetchAccountAndUser);
      window.removeEventListener('storage', fetchAccountAndUser);
    };
  }, []);

  useEffect(() => {
    if (!notifDropdown || !account?.userId) return;
    setNotifLoading(true);
    getUserNotifications(account.userId, 1, 5)
      .then((res) => {
        const items = res.data?.data?.items || [];
        setNotifications(items);
        setNotifHasUnread(items.some((n: any) => !n.isRead));
        setNotifPage(1);
        setNotifHasMore(res.data?.data?.hasNextPage ?? false);
      })
      .finally(() => setNotifLoading(false));
  }, [notifDropdown, account?.userId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdown(false);
      }
    };
    if (notifDropdown) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifDropdown]);

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

  const handleReadNotification = async (notification: any) => {
    if (!notification.isRead && account?.userId) {
      await markNotificationRead(notification.notificationId, account.userId);
    }
    // Refetch notifications
    if (account?.userId) {
      const res = await getUserNotifications(account.userId, 1, notifPage * 5);
      const items = res.data?.data?.items || [];
      setNotifications(items);
      setNotifHasUnread(items.some((n: any) => !n.isRead));
      setNotifHasMore(res.data?.data?.hasNextPage ?? false);
    }
    // Redirect if needed
    if (notification.redirectUrl) {
      navigate(notification.redirectUrl);
      setNotifDropdown(false);
    }
  };

  const handleReadAll = async () => {
    if (account?.userId) {
      await markAllNotificationsRead(account.userId);
      const res = await getUserNotifications(account.userId, 1, notifPage * 5);
      const items = res.data?.data?.items || [];
      setNotifications(items);
      setNotifHasUnread(false);
      setNotifHasMore(res.data?.data?.hasNextPage ?? false);
    }
  };

  const handleLoadMore = async () => {
    if (!account?.userId || notifLoading || !notifHasMore) return;
    setNotifLoading(true);
    const nextPage = notifPage + 1;
    const res = await getUserNotifications(account.userId, nextPage, 5);
    const items = res.data?.data?.items || [];
    setNotifications((prev) => [...prev, ...items]);
    setNotifPage(nextPage);
    setNotifHasMore(res.data?.data?.hasNextPage ?? false);
    setNotifLoading(false);
  };

  return (
    <>
      <div
        className={cn('fixed top-0 w-full pl-[10px] sm:pl-0 pr-[14px] sm:pr-0 items-center z-20', {
          'backdrop-blur': blur,
        })}
      >
        <div className="sm:wrapper flex sm:h-[100px] h-[57px] items-center justify-between px-7 pr-10">
          <div></div>
          {/* Logo */}
          <Link to={'/'} className="block shrink-0">
            <img className="sm:h-10 sm:w-[115px] w-[92px] h-[32px]" src={LOGO} alt="Logo" />
          </Link>
          {/* Navigation */}
          <div className="sm:flex sm:gap-x-12 hidden">
            <Link
              to="/"
              className="body-bold-16 text-dark-blue-primary border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
            >
              Home
            </Link>
            <Link
              to="/"
              className="body-bold-16 text-dark-blue-primary border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
            >
              Category
            </Link>
            <Link
              to="/"
              className="body-bold-16 text-dark-blue-primary border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
            >
              Shows
            </Link>
            <Link
              to="/"
              className="body-bold-16 text-dark-blue-primary border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
            >
              About
            </Link>
            <Link
              to="/"
              className="body-bold-16 text-dark-blue-primary border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
            >
              Contact
            </Link>
          </div>
          {/* desktop search bar */}
          <div className="flex w-full max-w-sm items-center min-w-70 border bg-white rounded-[46px] ml-16">
            <CiSearch className="size-5 text-neutral-60 ml-[17px]" strokeWidth={1.2} />
            <Input
              type="text"
              placeholder="Search something here!"
              className="body-medium-14 border-none truncate-placeholder ml-0 my-[2px] text-neutral-40 shadow-none"
            />
          </div>

          <div className="mr-14 flex items-center gap-4 relative">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="body-medium-16 px-[6px] hidden sm:flex bg-transparent transition duration-300 hover:scale-110 hover:shadow"
                >
                  EN
                  <IoIosArrowDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuSeparator />
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
                Quản lý sự kiện
              </Button>
            )}
            {!account ? (
              <>
                <Link
                  to="/login"
                  className="body-bold-16 text-dark-blue-primary border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="body-bold-16 text-dark-blue-primary border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-3 bg-transparent"
                    style={{ minWidth: 0 }}
                  >
                    <Avatar className="w-8 h-8 border border-zinc-500 rounded-full">
                      <AvatarImage src={avatar || AVATAR} alt="avatar" />
                      <AvatarFallback>
                        {user?.fullName?.[0]?.toUpperCase() ||
                          account.fullname?.[0]?.toUpperCase() ||
                          account.username?.[0]?.toUpperCase() ||
                          'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline whitespace-nowrap">
                      {user?.fullName || account.fullname || account.username}
                    </span>
                    <IoIosArrowDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-60 rounded-lg bg-white dark:bg-zinc-900"
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 pl-2 py-2">
                      <Avatar className="h-10 w-10 rounded-full border border-zinc-500 dark:border-zinc-700">
                        <AvatarImage src={avatar || AVATAR} alt="avatar" />
                        <AvatarFallback className="rounded-full">
                          {user?.fullName?.[0]?.toUpperCase() ||
                            account.fullname?.[0]?.toUpperCase() ||
                            account.username?.[0]?.toUpperCase() ||
                            'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col justify-center">
                        <span className="font-semibold text-sm truncate max-w-[140px]">
                          {user?.username || account.username || account.fullname}
                        </span>
                        <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {user?.email || account.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="hover:bg-blue-50 pl-5"
                    onClick={() => navigate('/profile')}
                  >
                    <FiUser className="mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={loadingLogout}
                    className="hover:bg-blue-50 pl-5"
                  >
                    <LogOut className="mr-2" />
                    {loadingLogout ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging out...
                      </>
                    ) : (
                      'Logout'
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* Notification Bell */}
            {account && (
              <div className="relative" ref={notifRef}>
                <button
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-200/30 transition-all relative"
                  onClick={() => setNotifDropdown((v) => !v)}
                  title="Thông báo"
                >
                  <Bell className="text-purple-500 text-xl" />
                  {notifHasUnread && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </button>
                {notifDropdown && (
                  <div className="absolute right-0 z-30 mt-2 w-80 bg-white text-gray-900 rounded-xl shadow-2xl border border-purple-400/30 overflow-hidden animate-fadeIn">
                    <div className="flex items-center justify-between p-4 border-b font-bold text-purple-600 gap-2">
                      <span className="flex items-center gap-2">
                        <Bell className="text-purple-400" /> Thông báo mới
                      </span>
                      <button
                        className="text-xs text-purple-500 hover:underline font-semibold px-2 py-1 rounded hover:bg-purple-100 transition"
                        onClick={handleReadAll}
                        disabled={
                          notifications.length === 0 || notifications.every((n) => n.isRead)
                        }
                      >
                        Đánh dấu tất cả đã đọc
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifLoading && notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-400">Đang tải...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-400">Không có thông báo mới</div>
                      ) : (
                        <>
                          {notifications.map((n) => (
                            <button
                              key={n.notificationId}
                              className={`w-full text-left px-4 py-3 border-b last:border-b-0 ${
                                n.isRead ? 'bg-white' : 'bg-purple-50 hover:bg-purple-100'
                              } transition`}
                              onClick={() => handleReadNotification(n)}
                            >
                              <div className="font-semibold text-sm text-purple-700 truncate">
                                {n.notificationTitle}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {n.notificationMessage}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-1">
                                {n.createdAtVietnam || n.createdAt}
                              </div>
                            </button>
                          ))}
                          {notifications.length > 0 && notifHasMore && (
                            <button
                              className="w-full py-3 text-center text-purple-600 font-semibold hover:bg-purple-50 border-t border-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={handleLoadMore}
                              disabled={notifLoading || !notifHasMore}
                            >
                              {notifLoading ? 'Đang tải...' : 'Xem thêm'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

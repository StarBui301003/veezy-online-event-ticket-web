'use client';

import { useEffect, useState } from 'react';
import { ChevronsUpDown, LogOut } from 'lucide-react';
import { FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { LogoutAPI } from '@/services/auth.service';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function NavUser() {
  const { isMobile } = useSidebar();
  const [user, setUser] = useState<{
    name: string;
    username: string;
    email: string;
    avatar: string;
  } | null>(null);
  const [loadingLogout, setLoadingLogout] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_avatarLoaded, setAvatarLoaded] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUser = () => {
      const accStr = localStorage.getItem('account');
      if (!accStr) return;
      try {
        const acc = JSON.parse(accStr);
        const avatarUrl = acc.avatar || '';
        setUser({
          name: acc.fullName || acc.username || '',
          username: acc.username || '',
          email: acc.email || '',
          avatar: avatarUrl,
        });
        setAvatarLoaded(false);
      } catch {
        // ignore
      }
    };

    const handleAvatarUpdate = (event: CustomEvent) => {
      if (event.detail?.avatarUrl !== undefined) {
        setUser((prev) => (prev ? { ...prev, avatar: event.detail.avatarUrl } : null));
        setAvatarLoaded(false);
      }
    };

    fetchUser();

    window.addEventListener('user-updated', fetchUser);
    window.addEventListener('storage', fetchUser);
    window.addEventListener('avatar-updated', handleAvatarUpdate as EventListener);
    return () => {
      window.removeEventListener('user-updated', fetchUser);
      window.removeEventListener('storage', fetchUser);
      window.removeEventListener('avatar-updated', handleAvatarUpdate as EventListener);
    };
  }, []);

  // Khi avatar thay đổi, reset trạng thái loaded
  useEffect(() => {
    if (!user?.avatar || user.avatar.trim() === '') {
      setAvatarLoaded(true);
      return;
    }

    setAvatarLoaded(false);
    let cancelled = false;
    const img = new window.Image();
    img.src = user.avatar;
    img.onload = () => {
      if (!cancelled) {
        setAvatarLoaded(true);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setAvatarLoaded(true);
        // Nếu avatar load lỗi, reset về fallback
        setUser((prev) => (prev ? { ...prev, avatar: '' } : null));
      }
    };
    return () => {
      cancelled = true;
    };
  }, [user?.avatar]);

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await LogoutAPI();
      localStorage.removeItem('access_token');
      localStorage.removeItem('customerId');
      localStorage.removeItem('account');
      localStorage.removeItem('user_config');
      localStorage.removeItem('admin-event-tab');
      document.cookie = 'refresh_token=; Max-Age=0; path=/;';
      toast.success('Logged out successfully!');
      setTimeout(() => {
        window.location.href = '/login';
      }, 600); // Đợi toast hiển thị
    } finally {
      setLoadingLogout(false);
    }
  };

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-blue-50 dark:hover:bg-gray-700 transition"
            >
              <div className="relative">
                {user.avatar && user.avatar.trim() !== '' ? (
                  <div className="h-9 w-9 rounded-full border-2 border-blue-400 shadow overflow-hidden">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onLoad={() => {}}
                      onError={(e) => {
                        // Nếu avatar load lỗi, ẩn img để hiển thị fallback
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-full rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                ) : (
                  <div className="h-9 w-9 rounded-full border-2 border-blue-400 shadow bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                <span className="truncate font-semibold text-blue-900">{user.name}</span>
                <span className="truncate text-xs text-blue-500">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-blue-400" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl shadow-2xl bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-600 p-2 z-[9999]"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-2 py-2 text-left text-sm">
                {user.avatar && user.avatar.trim() !== '' ? (
                  <div className="h-10 w-10 rounded-full border-2 border-blue-400 shadow overflow-hidden">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onLoad={() => {}}
                      onError={(e) => {
                        // Nếu avatar load lỗi, ẩn img để hiển thị fallback
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-full rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full border-2 border-blue-400 shadow bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-blue-900 dark:text-white">
                    {user.username}
                  </span>
                  <span className="truncate text-xs text-blue-500 dark:text-blue-300">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="focus:bg-blue-100 dark:focus:bg-gray-700 focus:text-blue-900 dark:focus:text-white hover:bg-blue-50 dark:hover:bg-gray-700 transition rounded-md text-gray-900 dark:text-white dark:bg-transparent"
                onClick={() => navigate('/admin/profile')}
              >
                <FiUser className="mr-2 text-blue-500 dark:text-blue-400" />
                <span className="font-medium">{t('profile')}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={loadingLogout}
              className="focus:bg-red-100 dark:focus:bg-red-700 focus:text-red-700 dark:focus:text-white hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-white transition rounded-md text-gray-900 dark:text-white dark:bg-transparent"
            >
              <LogOut className="mr-2 text-red-500 dark:text-red-400" />
              <span className="font-medium">{loadingLogout ? t('loggingOut') : t('logOut')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

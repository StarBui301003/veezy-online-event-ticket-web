'use client';

import { useEffect, useState } from 'react';
import { ChevronsUpDown, LogOut } from 'lucide-react';
import { FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
        setUser({
          name: acc.fullName || acc.username || '',
          username: acc.username || '',
          email: acc.email || '',
          avatar: acc.avatar || '',
        });
        setAvatarLoaded(false);
      } catch {
        // ignore
      }
    };

    fetchUser();

    window.addEventListener('user-updated', fetchUser);
    window.addEventListener('storage', fetchUser);
    return () => {
      window.removeEventListener('user-updated', fetchUser);
      window.removeEventListener('storage', fetchUser);
    };
  }, []);

  // Khi avatar thay đổi, reset trạng thái loaded
  useEffect(() => {
    setAvatarLoaded(true);
    // Nếu không có avatar hoặc avatar là chuỗi rỗng/null thì coi như đã load xong (không hiện spinner)
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
      if (!cancelled) setAvatarLoaded(true);
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
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-blue-50 transition"
            >
              <div className="relative">
                {user.avatar && (
                  <Avatar className="h-9 w-9 rounded-full border-2 border-blue-400 shadow">
                    <AvatarImage src={user.avatar} alt={user.name} />
                  </Avatar>
                )}
                {!user.avatar && (
                  <Avatar className="h-9 w-9 rounded-full border-2 border-blue-400 shadow">
                    <AvatarFallback className="rounded-full bg-blue-100 text-blue-700 font-bold">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
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
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl shadow-2xl bg-white/95 border border-blue-100 p-2 z-[9999]"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-2 py-2 text-left text-sm">
                <Avatar className="h-10 w-10 rounded-full border-2 border-blue-400 shadow">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-full bg-blue-100 text-blue-700 font-bold">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-blue-900">{user.username}</span>
                  <span className="truncate text-xs text-blue-500">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="focus:bg-blue-100 focus:text-blue-900 hover:bg-blue-50 transition rounded-md"
                onClick={() => navigate('/admin/profile')}
              >
                <FiUser className="mr-2 text-blue-500" />
                <span className="font-medium">{t('profile')}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={loadingLogout}
              className="focus:bg-red-100 focus:text-red-700 hover:bg-red-50 transition rounded-md"
            >
              <LogOut className="mr-2 text-red-500" />
              <span className="font-medium">{loadingLogout ? t('loggingOut') : t('logOut')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

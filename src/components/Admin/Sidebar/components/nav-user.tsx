'use client';

import { useEffect, useState } from 'react';
import { ChevronsUpDown, LogOut } from 'lucide-react';
import { FiUser } from 'react-icons/fi';

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
import { getUserAPI, LogoutAPI } from '@/services/auth.service';
import { useNavigate } from 'react-router-dom';

export function NavUser() {
  const { isMobile } = useSidebar();
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(null);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const accStr = localStorage.getItem('account');
    if (!accStr) return;
    try {
      const acc = JSON.parse(accStr);
      getUserAPI(acc.userId).then((userData) => {
        setUser({
          name: userData.fullName || acc.fullname || acc.username,
          email: userData.email || acc.email,
          avatar: userData.avatar || acc.avatar || '',
        });
      });
    } catch {
      // ignore
    }
  }, []);

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await LogoutAPI();
      localStorage.removeItem('access_token');
      localStorage.removeItem('account');
      document.cookie = 'refresh_token=; Max-Age=0; path=/;';
      navigate('/login');
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
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-full">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-full">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <FiUser />
                Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={loadingLogout}>
              <LogOut />
              {loadingLogout ? 'Logging out...' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

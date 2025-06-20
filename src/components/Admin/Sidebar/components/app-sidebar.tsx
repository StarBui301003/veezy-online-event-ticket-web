'use client';

import * as React from 'react';
import { Frame, Map, PieChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MdEvent } from 'react-icons/md';
import { FaShoppingCart } from 'react-icons/fa';
import { NavMain } from '@/components/Admin/Sidebar/components/nav-main';
import { NavProjects } from '@/components/Admin/Sidebar/components/nav-projects';
import { NavUser } from '@/components/Admin/Sidebar/components/nav-user';
import { FaUserFriends } from 'react-icons/fa';
import { BiCategory } from 'react-icons/bi';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { LOGO_RECTANGLE } from '@/assets/img';
import { MdOutlinePayment } from 'react-icons/md';
import { RiCoupon2Line } from 'react-icons/ri';
import { FaUserTie } from 'react-icons/fa';
import { MdReportGmailerrorred } from 'react-icons/md';

const data = {
  navMain: [
    {
      title: 'Users',
      url: '/admin/user-list',
      icon: FaUserFriends,
    },
    {
      title: 'Admins',
      url: '/admin/admin-list',
      icon: FaUserTie,
    },
    {
      title: 'Events',
      url: '/admin/event-list',
      icon: MdEvent,
    },
    {
      title: 'Orders',
      url: '/admin/order-list',
      icon: FaShoppingCart,
    },

    {
      title: 'Payments',
      url: '/admin/payment-list',
      icon: MdOutlinePayment,
    },
    {
      title: 'Categories',
      url: '/admin/category-list',
      icon: BiCategory,
    },
    {
      title: 'Discount Codes',
      url: '/admin/discountCode-list',
      icon: RiCoupon2Line,
    },
    {
      title: 'Reports',
      url: '/admin/report-list',
      icon: MdReportGmailerrorred,
    },
  ],

  projects: [
    {
      name: 'Design Engineering',
      url: '#',
      icon: Frame,
    },
    {
      name: 'Sales & Marketing',
      url: '#',
      icon: PieChart,
    },
    {
      name: 'Travel',
      url: '#',
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/admin">
                <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <img src={LOGO_RECTANGLE} alt="Logo" className="h-8 w-8 object-contain" />
                </div>
                <div className="grid flex-1 text-left text-base leading-tight ml-2">
                  <span className="truncate font-bold text-lg">Vezzy</span>
                  <span className="truncate text-xs">Admin</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

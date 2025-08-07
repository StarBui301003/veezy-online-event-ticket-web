'use client';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { MdEvent } from 'react-icons/md';
import { FaRegCommentDots, FaShoppingCart } from 'react-icons/fa';
import { NavMain } from '@/components/Admin/Sidebar/components/nav-main';
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
import { MdReportGmailerrorred } from 'react-icons/md';
import { FaRegNewspaper } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import { IoChatboxEllipsesOutline } from 'react-icons/io5';
import { PiHandWithdraw } from 'react-icons/pi';
import { MdDashboard } from 'react-icons/md';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const data = {
    navMain: [
      {
        title: t('users'),
        url: '/admin/user-list',
        icon: FaUserFriends,
      },
      {
        title: t('events'),
        url: '/admin/event-list',
        icon: MdEvent,
      },
      {
        title: t('news'),
        url: '/admin/news-list',
        icon: FaRegNewspaper,
      },
      {
        title: t('orders'),
        url: '/admin/order-list',
        icon: FaShoppingCart,
      },
      {
        title: t('payments'),
        url: '/admin/payment-list',
        icon: MdOutlinePayment,
      },
      {
        title: t('categories'),
        url: '/admin/category-list',
        icon: BiCategory,
      },
      {
        title: t('discountCodes'),
        url: '/admin/discountCode-list',
        icon: RiCoupon2Line,
      },
      {
        title: t('comments'),
        url: '/admin/comment-list',
        icon: FaRegCommentDots,
      },
      {
        title: t('reports'),
        url: '/admin/report-list',
        icon: MdReportGmailerrorred,
      },
      {
        title: 'Withdraw',
        url: '/admin/withdraw',
        icon: PiHandWithdraw,
      },
      {
        title: 'Chatbox',
        url: '/admin/chatbox',
        icon: IoChatboxEllipsesOutline,
      },
    ],
  };
  return (
    <Sidebar
      variant="sidebar"
      className="bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600  [&_[data-sidebar=sidebar]]:bg-white [&_[data-sidebar=sidebar]]:dark:bg-gray-800"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className=" dark:hover:bg-gray-700 " size="lg" asChild>
              <Link to="/admin">
                <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <img src={LOGO_RECTANGLE} alt="Logo" className="h-8 w-8 object-contain" />
                </div>
                <div className="grid flex-1 text-left text-base leading-tight ml-2">
                  <span className="truncate font-bold text-lg text-gray-900 dark:text-white">
                    {t('vezzy')}
                  </span>
                  <span className="truncate text-xs text-gray-600 dark:text-gray-300">
                    {t('admin')}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link to="/admin">
                <MdDashboard className="mr-2 text-xl" />
                <span>{t('dashboard')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* Optional: Add a separator for clarity */}
        {/* <SidebarSeparator /> */}
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

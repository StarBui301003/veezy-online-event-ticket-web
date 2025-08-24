/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bell, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getPersonalNotifications,
  markPersonalNotificationAsRead,
  getPersonalUnreadCount,
  markAllPersonalNotificationsAsRead,
} from '@/services/Admin/notification.service';
import { PersonalNotificationType, PersonalNotification } from '@/types/Admin/notification';
import { onNotification } from '@/services/signalr.service';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { RingLoader } from 'react-spinners';
import { useThemeClasses } from '@/hooks/useThemeClasses';

interface PersonalNotificationListProps {
  className?: string;
  onUnreadCountChange?: (count: number) => void;
}

const getNotificationTypeName = (type: PersonalNotificationType) => {
  switch (type) {
    case PersonalNotificationType.EventApproved:
      return 'Event Approved';
    case PersonalNotificationType.PayoutProcessed:
      return 'Payout Processed';
    case PersonalNotificationType.OrderSuccess:
      return 'Order Success';
    case PersonalNotificationType.EventManagerNewEvent:
      return 'New Event (Manager)';
    case PersonalNotificationType.EventManagerUpdateEvent:
      return 'Event Updated (Manager)';
    case PersonalNotificationType.EventManagerNewPost:
      return 'New Post (Manager)';
    case PersonalNotificationType.AdminNewEvent:
      return 'New Event (Admin)';
    case PersonalNotificationType.EventApprovedByAdmin:
      return 'Event Approved by Admin';
    case PersonalNotificationType.EventRejectedByAdmin:
      return 'Event Rejected by Admin';
    case PersonalNotificationType.AdminNewReport:
      return 'New Report (Admin)';
    case PersonalNotificationType.WithdrawalRequested:
      return 'Withdrawal Requested';
    case PersonalNotificationType.WithdrawalApproved:
      return 'Withdrawal Approved';
    case PersonalNotificationType.WithdrawalRejected:
      return 'Withdrawal Rejected';
    case PersonalNotificationType.AdminWithdrawalRequest:
      return 'Withdrawal Request (Admin)';
    case PersonalNotificationType.ReportResolved:
      return 'Report Resolved';
    case PersonalNotificationType.ReportRejected:
      return 'Report Rejected';
    case PersonalNotificationType.Assigned:
      return 'Assigned';
    case PersonalNotificationType.RemovedAssigned:
      return 'Removed Assignment';
    case PersonalNotificationType.Welcome:
      return 'Welcome';
    case PersonalNotificationType.NewsApproved:
      return 'News Approved';
    case PersonalNotificationType.NewsRejected:
      return 'News Rejected';
    case PersonalNotificationType.ChatMessage:
      return 'Chat Message';
    case PersonalNotificationType.Other:
      return 'Other';
    default:
      return 'Notification';
  }
};

const getNotificationIcon = (type: PersonalNotificationType) => {
  switch (type) {
    case PersonalNotificationType.EventApproved:
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case PersonalNotificationType.PayoutProcessed:
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    case PersonalNotificationType.OrderSuccess:
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case PersonalNotificationType.WithdrawalRejected:
    case PersonalNotificationType.NewsRejected:
    case PersonalNotificationType.EventRejectedByAdmin:
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case PersonalNotificationType.WithdrawalApproved:
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case PersonalNotificationType.Welcome:
      return <Bell className="h-4 w-4 text-purple-500" />;
    case PersonalNotificationType.ChatMessage:
      return <Bell className="h-4 w-4 text-blue-500" />;
    case PersonalNotificationType.ReportResolved:
      return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    case PersonalNotificationType.ReportRejected:
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case PersonalNotificationType.Assigned:
      return <CheckCircle className="h-4 w-4 text-cyan-500" />;
    case PersonalNotificationType.RemovedAssigned:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
    case PersonalNotificationType.NewsApproved:
      return <CheckCircle className="h-4 w-4 text-blue-600" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getNotificationBadgeColor = (type: PersonalNotificationType) => {
  switch (type) {
    case PersonalNotificationType.EventApproved:
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800';
    case PersonalNotificationType.PayoutProcessed:
      return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800';
    case PersonalNotificationType.OrderSuccess:
      return 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800';
    case PersonalNotificationType.WithdrawalRejected:
    case PersonalNotificationType.NewsRejected:
    case PersonalNotificationType.EventRejectedByAdmin:
      return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800';
    case PersonalNotificationType.WithdrawalApproved:
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800';
    case PersonalNotificationType.Welcome:
      return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800';
    case PersonalNotificationType.ChatMessage:
      return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800';
    case PersonalNotificationType.ReportResolved:
      return 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800';
    case PersonalNotificationType.ReportRejected:
      return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800';
    case PersonalNotificationType.Assigned:
      return 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 hover:bg-cyan-200 dark:hover:bg-cyan-800';
    case PersonalNotificationType.RemovedAssigned:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600';
    case PersonalNotificationType.NewsApproved:
      return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

export const PersonalNotificationList: React.FC<PersonalNotificationListProps> = ({
  className,
}) => {
  const { getCardClass, getBorderClass, getTextClass } = useThemeClasses();
  const [notifications, setNotifications] = useState<PersonalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSizeOptions = [5, 10, 20, 50];
  const [pageSize, setPageSize] = useState(5); // Mặc định 5, cho chọn
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Lấy userId từ localStorage
      const account = localStorage.getItem('account');
      const userId = account ? JSON.parse(account).userId : '';
      if (!userId) {
        setNotifications([]);
        setTotalPages(1);
        setTotalItems(0);
        setLoading(false);
        return;
      }
      const response = await getPersonalNotifications(userId, page, pageSize);
      if (
        response.flag &&
        response.data &&
        typeof response.data === 'object' &&
        Array.isArray(response.data.items)
      ) {
        setNotifications(response.data.items);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.totalItems);
      } else {
        setNotifications([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    const account = localStorage.getItem('account');
    const userId = account ? JSON.parse(account).userId : '';
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    const count = await getPersonalUnreadCount(userId);
    setUnreadCount(count);
  };

  // Không có API đếm unread cho cá nhân, có thể bỏ hoặc tính thủ công nếu muốn

  useEffect(() => {
    console.log('PersonalNotificationList: Component mounted, setting up event listeners...');

    // Don't create separate connection, use the global one from App.tsx
    // connectNotificationHub('http://localhost:5003/hubs/notifications');

    // Load initial data
    fetchNotifications();
    fetchUnreadCount();

    // Listen for realtime notifications
    const reloadNotifications = () => {
      console.log('PersonalNotificationList: Reloading notifications...');
      fetchNotifications();
      fetchUnreadCount();
    };

    // Listen for personal notifications (correct event name)
    onNotification('ReceiveNotification', (data) => {
      console.log('PersonalNotificationList: Received ReceiveNotification', data);
      // Check if this notification is for the current user
      const account = localStorage.getItem('account');
      const currentUserId = account ? JSON.parse(account).userId : '';
      if (data && data.userId === currentUserId) {
        console.log('PersonalNotificationList: Notification is for current user, reloading...');
        reloadNotifications();
      } else {
        console.log('PersonalNotificationList: Notification is not for current user, ignoring...');
      }
    });

    // Don't cleanup global connection on unmount
    // return () => {
    //   disconnectNotificationHub();
    // };
  }, []);

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const account = localStorage.getItem('account');
      const userId = account ? JSON.parse(account).userId : '';
      const response = await markPersonalNotificationAsRead(notificationId, userId);
      if (response.flag) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.notificationId === notificationId
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        );
        fetchUnreadCount();
        toast.success('Notification marked as read');
      }
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const account = localStorage.getItem('account');
      const userId = account ? JSON.parse(account).userId : '';
      const response = await markAllPersonalNotificationsAsRead(userId);
      if (response.flag) {
        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: new Date().toISOString(),
          }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch {
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Card className={`${className} ${getCardClass()} shadow-lg`}>
        <CardHeader className={`border-b ${getBorderClass()}`}>
          <CardTitle className={`flex items-center gap-2 ${getTextClass()}`}>
            <Bell className="h-5 w-5 text-blue-500" />
            Personal Notifications
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="h-5 w-5 flex items-center justify-center rounded-full font-mono tabular-nums bg-red-500 hover:bg-red-600 text-white p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <div className="flex items-center justify-center" style={{ minHeight: 600 }}>
            <RingLoader color="#3B82F6" size={64} />
          </div>
        </CardContent>
      </Card>
    );
  }

  const startIdx = notifications.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = notifications.length === 0 ? 0 : Math.min(page * pageSize, totalItems);

  return (
    <Card
      className={
        className +
        ' h-[700px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg dark:shadow-gray-900/20'
      }
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Bell className="h-5 w-5 text-blue-500" />
            Personal Notifications
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="h-5 w-5 flex items-center justify-center rounded-full font-mono tabular-nums bg-red-500 hover:bg-red-600 text-white p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="flex justify-center gap-2 items-center text-sm bg-gray-200 dark:bg-gray-700 backdrop-blur-md font-medium isolation-auto border border-gray-200 dark:border-gray-600 before:absolute before:w-full before:transition-all before:duration-700 before:hover:w-full before:-left-full before:hover:left-0 before:rounded-full before:bg-emerald-500 before:-z-10 before:aspect-square before:hover:scale-150 before:hover:duration-700 relative z-10 px-3 py-1.5 overflow-hidden rounded-full group text-gray-900 dark:text-gray-100 hover:text-white"
                  >
                    Mark all read
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-900 dark:text-gray-100">Mark all notifications as read</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {/* Filter trạng thái */}
        <div className="flex items-center gap-2">{/* Removed filter status */}</div>
      </CardHeader>
      <CardContent className="rounded-b-xl h-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>No notifications</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[530px]">
              <div className="space-y-2">
                {notifications.map((notification, index) => (
                  <div key={notification.notificationId}>
                    <div
                      className={`p-4 rounded-[8px] border transition-all duration-200 cursor-pointer ${
                        notification.isRead
                          ? 'bg-gray-200 dark:bg-gray-700 border-gray-300/40 dark:border-gray-600/40 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-md'
                          : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-600 shadow-sm hover:bg-blue-50 dark:hover:bg-gray-700 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.notificationType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4
                                  className={`font-medium text-sm ${
                                    notification.isRead
                                      ? 'text-gray-600 dark:text-gray-300'
                                      : 'text-gray-900 dark:text-gray-100'
                                  }`}
                                >
                                  {notification.notificationTitle}
                                </h4>
                                <Badge
                                  variant="secondary"
                                  className={`text-xs rounded-full ${getNotificationBadgeColor(
                                    notification.notificationType
                                  )}`}
                                >
                                  {getNotificationTypeName(notification.notificationType)}
                                </Badge>
                              </div>
                              <p
                                className={`text-sm ${
                                  notification.isRead
                                    ? 'text-gray-500 dark:text-gray-400'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {notification.notificationMessage}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(notification.createdAt)}
                                </div>
                                {notification.isRead && notification.readAt && (
                                  <div className="flex items-center gap-1 text-xs text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    Read
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {!notification.isRead && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMarkAsRead(notification.notificationId);
                                        }}
                                        className="h-8 w-8 p-0 dark:text-white"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                                      <p className="text-gray-900 dark:text-gray-100">
                                        Mark this notification as read
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {/* Removed delete button */}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
            {/* Luôn hiển thị pagination nếu có dữ liệu */}
            {notifications.length > 0 && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-2 py-2 mt-2">
                <div className="flex-1 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          aria-disabled={page === 1}
                          className={`${
                            page === 1
                              ? 'pointer-events-none opacity-50 cursor-not-allowed'
                              : 'cursor-pointer'
                          } text-gray-700 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white`}
                        />
                      </PaginationItem>
                      {(() => {
                        const pages = [];

                        if (totalPages <= 3) {
                          // Hiển thị tất cả trang nếu tổng số trang <= 3
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Chỉ hiển thị: trang đầu, trang hiện tại, trang cuối
                          pages.push(1);
                          if (page > 2) {
                            pages.push('...');
                          }
                          if (page !== 1 && page !== totalPages) {
                            pages.push(page);
                          }
                          if (page < totalPages - 1) {
                            pages.push('...');
                          }
                          pages.push(totalPages);
                        }

                        return pages.map((item, index) => (
                          <PaginationItem key={index}>
                            {item === '...' ? (
                              <span className="px-2 py-1 text-gray-500 dark:text-gray-400">
                                ...
                              </span>
                            ) : (
                              <PaginationLink
                                isActive={item === page}
                                onClick={() => setPage(item as number)}
                                className={`transition-colors rounded-[8px]
                                  ${
                                    item === page
                                      ? 'bg-blue-500 text-white border hover:bg-blue-700 hover:text-white'
                                      : 'text-gray-700 dark:text-gray-100 hover:bg-slate-200 dark:hover:bg-gray-600 hover:text-black dark:hover:text-white'
                                  }
                                  px-2 py-1 mx-0.5`}
                                style={{
                                  minWidth: 32,
                                  textAlign: 'center',
                                  fontWeight: item === page ? 700 : 400,
                                  cursor: item === page ? 'default' : 'pointer',
                                }}
                              >
                                {item}
                              </PaginationLink>
                            )}
                          </PaginationItem>
                        ));
                      })()}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          aria-disabled={page === totalPages}
                          className={`${
                            page === totalPages
                              ? 'pointer-events-none opacity-50 cursor-not-allowed'
                              : 'cursor-pointer'
                          } text-gray-700 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
                <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                  <span className="text-sm text-gray-700 dark:text-gray-100">
                    {notifications.length === 0
                      ? '0 of 0'
                      : `${startIdx}-${endIdx} of ${totalItems}`}
                  </span>

                  <select
                    className="border rounded-[8px] px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    {pageSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      {/* Removed CreateNotificationModal */}
    </Card>
  );
};

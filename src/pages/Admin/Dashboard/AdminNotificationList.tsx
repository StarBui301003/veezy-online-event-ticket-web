/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bell, CheckCircle, Trash2, Eye, AlertCircle, Calendar, Clock, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification,
  getAdminUnreadCount,
} from '@/services/Admin/notification.service';
import { AdminNotificationType, AdminNotification } from '@/types/Admin/notification';
import { CreateNotificationModal } from './CreateNotificationModal';
import { onNotification } from '@/services/signalr.service';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { RingLoader } from 'react-spinners';

interface AdminNotificationListProps {
  className?: string;
  onUnreadCountChange?: (count: number) => void;
}

const getNotificationTypeName = (type: AdminNotificationType) => {
  switch (type) {
    case AdminNotificationType.NewEvent:
      return 'New Event';
    case AdminNotificationType.NewPost:
      return 'New Post';
    case AdminNotificationType.NewReport:
      return 'New Report';
    case AdminNotificationType.PaymentIssue:
      return 'Payment Issue';
    case AdminNotificationType.SystemAlert:
      return 'System Alert';
    case AdminNotificationType.NewUser:
      return 'New User';
    case AdminNotificationType.EventApproval:
      return 'Event Approval';
    case AdminNotificationType.EventRejection:
      return 'Event Rejection';
    case AdminNotificationType.UserReport:
      return 'User Report';
    case AdminNotificationType.ContentReport:
      return 'Content Report';
    case AdminNotificationType.Other:
      return 'Other';
    default:
      return 'Unknown';
  }
};

const getNotificationIcon = (type: AdminNotificationType) => {
  switch (type) {
    case AdminNotificationType.NewEvent:
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case AdminNotificationType.NewPost:
      return <Eye className="h-4 w-4 text-green-500" />;
    case AdminNotificationType.NewReport:
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case AdminNotificationType.PaymentIssue:
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case AdminNotificationType.SystemAlert:
      return <Bell className="h-4 w-4 text-purple-500" />;
    case AdminNotificationType.NewUser:
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case AdminNotificationType.EventApproval:
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case AdminNotificationType.EventRejection:
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case AdminNotificationType.UserReport:
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case AdminNotificationType.ContentReport:
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case AdminNotificationType.Other:
      return <Bell className="h-4 w-4 text-gray-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getNotificationBadgeColor = (type: AdminNotificationType) => {
  switch (type) {
    case AdminNotificationType.NewEvent:
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case AdminNotificationType.NewPost:
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case AdminNotificationType.NewReport:
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case AdminNotificationType.PaymentIssue:
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    case AdminNotificationType.SystemAlert:
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case AdminNotificationType.NewUser:
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case AdminNotificationType.EventApproval:
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case AdminNotificationType.EventRejection:
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case AdminNotificationType.UserReport:
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    case AdminNotificationType.ContentReport:
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case AdminNotificationType.Other:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
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

export const AdminNotificationList: React.FC<AdminNotificationListProps> = ({
  className,
  onUnreadCountChange,
}) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSizeOptions = [5, 10, 20, 50];
  const [pageSize, setPageSize] = useState(5); // Mặc định 5, cho chọn
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [status, setStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let isReadParam: boolean | undefined = undefined;
      if (status === 'unread') isReadParam = false;
      else if (status === 'read') isReadParam = true;
      const response = await getAdminNotifications(page, pageSize, isReadParam);
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
    try {
      const response = await getAdminUnreadCount();
      setUnreadCount(response);
      onUnreadCountChange?.(response);
    } catch {
      console.error('Failed to fetch unread count');
    }
  };

  useEffect(() => {
    console.log('AdminNotificationList: Component mounted, setting up event listeners...');

    // Don't create separate connection, use the global one from App.tsx
    // connectNotificationHub('http://localhost:5003/hubs/notifications');

    // Load initial data
    fetchNotifications();
    fetchUnreadCount();

    // Listen for realtime notifications
    const reloadNotifications = () => {
      console.log('AdminNotificationList: Reloading notifications...');
      fetchNotifications();
      fetchUnreadCount();
    };

    // Listen for admin notifications
    onNotification('ReceiveAdminNotification', (data) => {
      console.log('AdminNotificationList: Received ReceiveAdminNotification', data);
      reloadNotifications();
    });
    onNotification('AdminNotificationRead', (data) => {
      console.log('AdminNotificationList: Received AdminNotificationRead', data);
      reloadNotifications();
    });
    onNotification('AdminAllNotificationsRead', () => {
      console.log('AdminNotificationList: Received AdminAllNotificationsRead');
      reloadNotifications();
    });
    onNotification('AdminNotificationDeleted', (data) => {
      console.log('AdminNotificationList: Received AdminNotificationDeleted', data);
      reloadNotifications();
    });

    // Don't cleanup global connection on unmount
    // return () => {
    //   disconnectNotificationHub();
    // };
  }, []);

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, pageSize]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await markAdminNotificationAsRead(notificationId);
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
      const response = await markAllAdminNotificationsAsRead();
      if (response.flag) {
        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: new Date().toISOString(),
          }))
        );
        setUnreadCount(0);
        onUnreadCountChange?.(0);
        toast.success('All notifications marked as read');
      }
    } catch {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await deleteAdminNotification(notificationId);
      if (response.flag) {
        setNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
        fetchUnreadCount();
        toast.success('Notification deleted');
      }
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Admins Notifications
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
        <CardContent>
          <div className="flex items-center justify-center" style={{ minHeight: 600 }}>
            <RingLoader color="#2563EB" size={64} />
          </div>
        </CardContent>
      </Card>
    );
  }

  const startIdx = notifications.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = notifications.length === 0 ? 0 : Math.min(page * pageSize, totalItems);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Admins Notifications
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="h-5 w-5 flex items-center justify-center rounded-full font-mono tabular-nums bg-red-500 hover:bg-red-600 text-white p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {/* Filter trạng thái */}
          <div className="flex items-center gap-2">
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as 'all' | 'unread' | 'read');
                setPage(1);
              }}
            >
              <SelectTrigger className="border-gray-200 w-32 border px-3 py-2 rounded text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              className="flex gap-2 items-center border-2 border-green-500 bg-green-500 rounded-[0.9em] cursor-pointer px-5 py-1 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-green-600 hover:text-white hover:border-green-500"
              onClick={() => setOpenCreateModal(true)}
            >
              <Plus className="w-4 h-4" />
              Create Notification
            </button>
          </div>
          {unreadCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="flex justify-center gap-2 items-center text-sm bg-gray-200 backdrop-blur-md font-medium isolation-auto border-1 border-gray-300 before:absolute before:w-full before:transition-all before:duration-700 before:hover:w-full before:-left-full before:hover:left-0 before:rounded-full before:bg-emerald-500 hover:text-gray-50 before:-z-10 before:aspect-square before:hover:scale-150 before:hover:duration-700 relative z-10 px-3 py-1.5 overflow-hidden rounded-full group"
                  >
                    Mark all read
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark all notifications as read</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No notifications</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {notifications.map((notification, index) => (
                  <div key={notification.notificationId}>
                    <div
                      className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                        notification.isRead
                          ? 'bg-gray-200 border-gray-300/40 shadow-sm hover:bg-gray-100 hover:shadow-md'
                          : 'bg-white border-blue-200 shadow-sm hover:bg-blue-50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4
                                  className={`font-medium text-sm ${
                                    notification.isRead ? 'text-gray-600' : 'text-gray-900'
                                  }`}
                                >
                                  {notification.title}
                                </h4>
                                <Badge
                                  variant="secondary"
                                  className={`text-xs rounded-full ${getNotificationBadgeColor(
                                    notification.type
                                  )}`}
                                >
                                  {getNotificationTypeName(notification.type)}
                                </Badge>
                              </div>
                              <p
                                className={`text-sm ${
                                  notification.isRead ? 'text-gray-500' : 'text-gray-700'
                                }`}
                              >
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1 text-xs text-gray-400">
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
                                        onClick={() =>
                                          handleMarkAsRead(notification.notificationId)
                                        }
                                        className="h-8 w-8 p-0"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Mark this notification as read</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteNotification(notification.notificationId)
                                      }
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete this notification</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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
                          className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 7;

                        if (totalPages <= maxVisiblePages) {
                          // Hiển thị tất cả trang nếu tổng số trang <= 7
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Logic hiển thị trang với dấu "..."
                          if (page <= 4) {
                            // Trang hiện tại ở đầu
                            for (let i = 1; i <= 5; i++) {
                              pages.push(i);
                            }
                            pages.push('...');
                            pages.push(totalPages);
                          } else if (page >= totalPages - 3) {
                            // Trang hiện tại ở cuối
                            pages.push(1);
                            pages.push('...');
                            for (let i = totalPages - 4; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            // Trang hiện tại ở giữa
                            pages.push(1);
                            pages.push('...');
                            for (let i = page - 1; i <= page + 1; i++) {
                              pages.push(i);
                            }
                            pages.push('...');
                            pages.push(totalPages);
                          }
                        }

                        return pages.map((item, index) => (
                          <PaginationItem key={index}>
                            {item === '...' ? (
                              <span className="px-2 py-1 text-gray-500">...</span>
                            ) : (
                              <PaginationLink
                                isActive={item === page}
                                onClick={() => setPage(item as number)}
                                className={`transition-colors rounded 
                                  ${
                                    item === page
                                      ? 'bg-blue-500 text-white border hover:bg-blue-700 hover:text-white'
                                      : 'text-gray-700 hover:bg-slate-200 hover:text-black'
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
                          className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
                <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                  <span className="text-sm text-gray-700">
                    {notifications.length === 0
                      ? '0 of 0'
                      : `${startIdx}-${endIdx} of ${totalItems}`}
                  </span>
                  <span className="text-sm text-gray-700">Rows per page</span>
                  <select
                    className="border rounded px-2 py-1 text-sm bg-white"
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

      <CreateNotificationModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onCreated={fetchNotifications}
      />
    </Card>
  );
};

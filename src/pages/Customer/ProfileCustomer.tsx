/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { DatePickerProfile } from '@/components/ui/day-picker-profile';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import {
  getUserByIdAPI,
  editUserAPI,
  uploadUserAvatarAPI,
  updateFaceAPI,
} from '@/services/Admin/user.service';
import { useFaceAuthStatus } from '@/hooks/use-face-auth-status';
import { NO_AVATAR } from '@/assets/img';
import FaceCapture from '@/components/common/FaceCapture';
import { toast } from 'react-toastify';
import { Switch } from '@/components/ui/switch';
import {
  parseBackendErrors,
  getFieldError,
  hasFieldError,
  type FieldErrors,
  validateDateOfBirth,
} from '@/utils/validation';
import { getOrderHistoryByCustomerId } from '@/services/order.service';
import { getTicketsByOrderId, getMyAttendances } from '@/services/ticketIssued.service';
import OrderHistory from '@/components/Customer/OrderHistory';
import MyTickets from '@/components/Customer/MyTickets';
import AttendanceHistory from '@/components/Customer/AttendanceHistory';
import ChangePasswordModal from '@/pages/Customer/ChangePasswordModal';
import { updateUserConfigAPI, getUserConfigAPI } from '@/services/Admin/user.service';
import type { User } from '@/types/auth';
import type { AdminOrder } from '@/types/Admin/order';
import type { Attendance } from '@/types/attendance';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'info', label: 'Thông tin cá nhân' },
  { key: 'settings', label: 'Cài đặt chung' },
  { key: 'orders', label: 'Lịch sử mua vé' },
  { key: 'attendances', label: 'Lịch sử tham dự' },
];

const ProfileCustomer = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { getThemeClass } = useThemeClasses();
  const [account, setAccount] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<User> | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [facePassword, setFacePassword] = useState('');
  const [faceError, setFaceError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [tab, setTab] = useState('info');

  // User config state
  const [userConfig, setUserConfig] = useState({
    language: 0, // 0: English, 1: Vietnamese
    theme: 0, // 0: Light, 1: Dark
    receiveEmail: false, // Default to false, will be updated by API
    receiveNotify: false, // Default to false, will be updated by API
  });

  // Loading states for theme and language changes
  const [isThemeLoading, setIsThemeLoading] = useState(false);
  const [isLanguageLoading, setIsLanguageLoading] = useState(false);

  const { hasFaceAuth, refetch: refetchFaceAuth } = useFaceAuthStatus();

  // Load user config from API
  const loadUserConfig = async (userId: string) => {
    try {
      const response = await getUserConfigAPI(userId);

      if (response.data) {
        const configData = response.data;

        const newConfig = {
          language: configData.language || 0,
          theme: configData.theme || 0,
          receiveEmail: configData.receiveEmail !== undefined ? configData.receiveEmail : false,
          receiveNotify: configData.receiveNotify !== undefined ? configData.receiveNotify : false,
        };

        setUserConfig(newConfig);

        // Save to localStorage
        localStorage.setItem('user_config', JSON.stringify(newConfig));

        // Sync theme with ThemeContext
        const themeMode = newConfig.theme === 1 ? 'dark' : 'light';
        if (theme !== themeMode) {
          setTheme(themeMode);
        }
      }
    } catch (error) {
      console.error('Failed to load user config:', error);
      // Keep default values if API fails
    }
  };

  // Save user config to localStorage
  const saveUserConfigToLocalStorage = (config: any) => {
    try {
      localStorage.setItem('user_config', JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save user config to localStorage:', error);
    }
  };

  // Lịch sử mua vé
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);

  // Vé của tôi
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState('');

  // Lịch sử tham dự
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [attendancesLoading, setAttendancesLoading] = useState(false);
  const [attendancesError, setAttendancesError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load user config when component mounts
  useEffect(() => {
    const accStr = localStorage.getItem('account');
    if (accStr) {
      try {
        const accountData = JSON.parse(accStr);
        const userId = accountData.userId;
        if (userId) {
          loadUserConfig(userId);
        }
      } catch (error) {
        console.error('Failed to parse account data:', error);
      }
    }
  }, []);

  // Listen for language changes from header
  useEffect(() => {
    const handleLanguageChange = () => {
      // Update userConfig state to reflect current i18n language
      const currentLanguage = i18n.language;
      const languageNumber = currentLanguage === 'vi' ? 1 : 0;

      setUserConfig((prev) => ({
        ...prev,
        language: languageNumber,
      }));
    };

    // Listen for i18n language changes
    i18n.on('languageChanged', handleLanguageChange);

    // Initial sync
    handleLanguageChange();

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Listen for theme changes from header
  useEffect(() => {
    const handleThemeChange = () => {
      // Update userConfig state to reflect current theme
      const themeNumber = theme === 'dark' ? 1 : 0;

      setUserConfig((prev) => ({
        ...prev,
        theme: themeNumber,
      }));
    };

    // Initial sync
    handleThemeChange();
  }, [theme]);

  // Connect to SignalR hubs for real-time updates
  useEffect(() => {
    const accStr = localStorage.getItem('account');
    const accountObj = accStr ? JSON.parse(accStr) : null;
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');

    if (accountObj?.userId) {
      const setupRealtimeUpdates = async () => {
        try {
          const { 
            connectTicketHub, 
            onTicket, 
            connectNotificationHub, 
            onNotification,
            connectEventHub,
            onEvent
          } = await import('@/services/signalr.service');

          // Connect to Ticket Hub for order and ticket updates
          await connectTicketHub('http://localhost:5005/notificationHub', token || undefined);
          
          onTicket('OrderCreated', (data: any) => {
            if (data.customerId === accountObj.userId) {
              console.log('Order created:', data);
              loadOrderHistory(accountObj.userId);
              toast.info(t('newOrderCreated'));
            }
          });

          onTicket('OrderStatusChanged', (data: any) => {
            if (data.customerId === accountObj.userId) {
              console.log('Order status changed:', data);
              loadOrderHistory(accountObj.userId);
              
              // Show specific status notifications
              if (data.status === 'Confirmed' || data.status === 'Completed') {
                toast.success(t('orderConfirmed'));
              } else if (data.status === 'Failed' || data.status === 'Cancelled') {
                toast.error(t('orderCancelled'));
              } else {
                toast.info(t('orderStatusChanged'));
              }
            }
          });

          onTicket('TicketIssued', (data: any) => {
            if (data.customerId === accountObj.userId) {
              console.log('Ticket issued:', data);
              loadTicketsAndAttendances();
              toast.success(t('ticketIssued'));
            }
          });

          onTicket('TicketGenerated', (data: any) => {
            if (data.customerId === accountObj.userId) {
              console.log('Ticket generated:', data);
              loadTicketsAndAttendances();
              toast.success(t('ticketGenerated'));
            }
          });

          onTicket('AttendanceCheckedIn', (data: any) => {
            if (data.customerId === accountObj.userId) {
              console.log('Attendance checked in:', data);
              loadTicketsAndAttendances();
              toast.success(t('checkedInSuccessfully'));
            }
          });

          onTicket('AttendanceUpdated', (data: any) => {
            if (data.customerId === accountObj.userId) {
              console.log('Attendance updated:', data);
              loadTicketsAndAttendances();
              toast.info(t('attendanceUpdated'));
            }
          });

          // Connect to Event Hub for event updates that affect user's tickets
          await connectEventHub('http://localhost:5004/notificationHub');

          onEvent('OnEventCancelled', (data: any) => {
            const eventId = data.eventId || data.EventId;
            // Check if user has tickets for this event
            const hasTicketsForEvent = orders.some(order => 
              order.items?.some(item => item.ticketId && item.ticketId.includes(eventId))
            );
            
            if (hasTicketsForEvent) {
              console.log('Event cancelled - user has tickets:', data);
              toast.warning(t('eventCancelledRefundProcessing'));
              loadOrderHistory(accountObj.userId);
            }
          });

          onEvent('OnEventUpdated', (data: any) => {
            const eventId = data.eventId || data.EventId;
            // Check if user has tickets for this event
            const hasTicketsForEvent = orders.some(order => 
              order.items?.some(item => item.ticketId && item.ticketId.includes(eventId))
            );
            
            if (hasTicketsForEvent) {
              console.log('Event updated - user has tickets:', data);
              toast.info(t('eventUpdatedCheckDetails'));
            }
          });

          // Connect to Notification Hub for general notifications
          if (token) {
            await connectNotificationHub('http://localhost:5003/hubs/notifications', token);
            
            onNotification('ReceiveNotification', (notification: any) => {
              // Filter notifications relevant to profile page
              if (notification.type === 'OrderUpdate' || 
                  notification.type === 'TicketIssue' || 
                  notification.type === 'EventUpdate' ||
                  notification.type === 'PaymentUpdate') {
                console.log('Profile-relevant notification:', notification);
                toast.info(notification.message || notification.title);
              }
            });

            // Listen for payment status changes
            onNotification('PaymentStatusChanged', (data: any) => {
              if (data.userId === accountObj.userId || data.customerId === accountObj.userId) {
                console.log('Payment status changed:', data);
                if (data.status === 'Success' || data.status === 'Completed') {
                  toast.success(t('paymentSuccessful'));
                } else if (data.status === 'Failed') {
                  toast.error(t('paymentFailed'));
                } else if (data.status === 'Refunded') {
                  toast.info(t('paymentRefunded'));
                }
                loadOrderHistory(accountObj.userId);
              }
            });
          }

        } catch (error) {
          console.error('Failed to setup realtime updates:', error);
        }
      };

      setupRealtimeUpdates();
    }
  }, [orders, t]);

  // Load order history function
  const loadOrderHistory = async (userId: string) => {
    setOrdersLoading(true);
    try {
      const orders = await getOrderHistoryByCustomerId(userId);
      setOrders(orders || []);
    } catch {
      setOrdersError('Failed to load order history');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Load tickets and attendances function
  const loadTicketsAndAttendances = async () => {
    setAttendancesLoading(true);
    try {
      const attendanceData = await getMyAttendances();
      setAttendances(attendanceData || []);
    } catch {
      setAttendancesError('Failed to load attendance history');
    } finally {
      setAttendancesLoading(false);
    }
  };

  useEffect(() => {
    const accStr = localStorage.getItem('account');
    let userId = '';
    if (accStr) {
      try {
        const accObj = JSON.parse(accStr);
        userId = accObj.userId;
      } catch {
        // Ignore error
      }
    }
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getUserByIdAPI(userId)
      .then((user) => {
        setAccount(user);
        setForm({ ...user });
        setPreviewUrl(user.avatarUrl || '');

        // Cập nhật localStorage với avatarUrl từ API
        const accStr = localStorage.getItem('account');
        if (accStr && user.avatarUrl) {
          try {
            const acc = JSON.parse(accStr);
            acc.avatar = user.avatarUrl; // Lưu avatarUrl vào avatar field
            // Xóa avatarUrl field để chỉ sử dụng avatar
            delete acc.avatarUrl;
            localStorage.setItem('account', JSON.stringify(acc));
          } catch (error) {
            console.error('Error updating localStorage:', error);
          }
        }
      })
      .catch((error) => {
        console.error('ProfileCustomer - Failed to load user:', error);
        setAccount(null);
        setForm(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch order history when tab changes to 'orders'
  useEffect(() => {
    if (tab === 'orders' && account?.userId) {
      setOrdersLoading(true);
      setOrdersError('');
      getOrderHistoryByCustomerId(account.userId, ordersPage, 10)
        .then((res) => {
          setOrders(res.data?.items || []);
          setOrdersTotalPages(res.data?.totalPages || 1);
        })
        .catch(() => setOrdersError('Không thể tải lịch sử mua vé.'))
        .finally(() => setOrdersLoading(false));
    }
  }, [tab, account?.userId, ordersPage]);

  // Fetch tickets for selected order
  useEffect(() => {
    if (tab === 'orders' && selectedOrder?.orderId) {
      setTicketsLoading(true);
      setTicketsError('');
      getTicketsByOrderId(selectedOrder.orderId)
        .then((res) => setTickets(res.data || []))
        .catch(() => setTicketsError('Không thể tải vé.'))
        .finally(() => setTicketsLoading(false));
    }
  }, [tab, selectedOrder]);

  // Fetch attendances
  useEffect(() => {
    if (tab === 'attendances') {
      setAttendancesLoading(true);
      setAttendancesError('');
      getMyAttendances()
        .then((res) => setAttendances(res.data || []))
        .catch(() => setAttendancesError('Không thể tải lịch sử tham dự.'))
        .finally(() => setAttendancesLoading(false));
    }
  }, [tab]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev: Partial<User> | null) => ({
      ...(prev || {}),
      [name]: name === 'gender' ? Number(value) : value,
    }));

    if (hasFieldError(fieldErrors, name)) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSelectOrder = (order: AdminOrder) => {
    setSelectedOrder(order);
  };

  // User config handlers
  const handleLanguageChange = async (language: string) => {
    if (!account?.userId) {
      console.error('ProfileCustomer - No account or userId found');
      toast.error('Account not loaded yet');
      return;
    }

    // Prevent multiple rapid clicks
    if (isLanguageLoading) {
      return;
    }

    setIsLanguageLoading(true);

    try {
      const languageNumber = parseInt(language);
      const languageCode = languageNumber === 0 ? 'en' : 'vi';

      // Update language in i18n
      await i18n.changeLanguage(languageCode);

      // Update user config - only send the language field
      await updateUserConfigAPI(account.userId, {
        language: languageNumber,
      });

      // Update local state
      const newConfig = {
        ...userConfig,
        language: languageNumber,
      };
      setUserConfig(newConfig);

      // Save to localStorage
      saveUserConfigToLocalStorage(newConfig);

      toast.success(t('languageChangedSuccessfully'));
    } catch (error) {
      console.error('ProfileCustomer - Failed to update language:', error);
      toast.error(t('languageChangeFailed'));
    } finally {
      setIsLanguageLoading(false);
    }
  };

  const handleEmailNotificationsChange = async (checked: boolean) => {
    try {
      // Update user config - only send the receiveEmail field
      await updateUserConfigAPI(account.userId, {
        receiveEmail: checked,
      });

      // Update local state
      const newConfig = {
        ...userConfig,
        receiveEmail: checked,
      };
      setUserConfig(newConfig);

      // Save to localStorage
      saveUserConfigToLocalStorage(newConfig);

      toast.success(checked ? t('emailNotificationsEnabled') : t('emailNotificationsDisabled'));
    } catch (error) {
      console.error('Failed to update email notifications:', error);
      toast.error(t('emailNotificationsUpdateFailed'));
    }
  };

  const handleThemeChange = async (theme: string) => {
    // Prevent multiple rapid clicks
    if (isThemeLoading) {
      return;
    }

    setIsThemeLoading(true);

    try {
      const themeNumber = parseInt(theme);
      const themeMode = themeNumber === 1 ? 'dark' : 'light';

      // Update user config via API first
      await updateUserConfigAPI(account.userId, {
        theme: themeNumber,
      });

      // Only update UI after successful API call
      setTheme(themeMode);

      // Update local state
      const newConfig = {
        ...userConfig,
        theme: themeNumber,
      };
      setUserConfig(newConfig);

      // Save to localStorage
      saveUserConfigToLocalStorage(newConfig);

      toast.success(themeNumber === 0 ? t('lightThemeEnabled') : t('darkThemeEnabled'));
    } catch (error) {
      console.error('Failed to update theme:', error);
      toast.error(t('themeUpdateFailed'));
    } finally {
      setIsThemeLoading(false);
    }
  };

  const handleSave = async () => {
    setFieldErrors({});
    const newFieldErrors: FieldErrors = {};
    if (!form.fullName?.trim()) newFieldErrors.fullname = ['Full name is required!'];
    if (!form.email?.trim()) newFieldErrors.email = ['Email is required!'];
    if (!form.phone?.trim()) newFieldErrors.phone = ['Phone number is required!'];
    if (form.dob) {
      const dobValidation = validateDateOfBirth(form.dob);
      if (!dobValidation.isValid) newFieldErrors.dob = [dobValidation.errorMessage!];
    }
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }
    setLoading(true);
    try {
      let avatarUrl = form.avatarUrl;
      if (avatarFile instanceof File) {
        const res = await uploadUserAvatarAPI(form.userId, avatarFile);
        avatarUrl = res.data?.avatarUrl || avatarUrl;

        // Cập nhật avatar URL trong form ngay lập tức
        setForm((prev) => ({ ...prev, avatar: avatarUrl }));
        setPreviewUrl(avatarUrl);

        // Ghi đè lên trường avatar trong localStorage
        const accStr = localStorage.getItem('account');
        if (accStr) {
          const acc = JSON.parse(accStr);
          acc.avatar = avatarUrl;
          localStorage.setItem('account', JSON.stringify(acc));
        }

        // Dispatch avatar-updated event ngay lập tức sau khi upload thành công
        window.dispatchEvent(
          new CustomEvent('avatar-updated', {
            detail: { avatarUrl },
          })
        );
      }
      await editUserAPI(form.userId, {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        location: form.location,
        dob: form.dob,
        gender: Number(form.gender),
      });
      // Lấy lại thông tin user mới nhất từ backend và ghi đè trường avatar
      const updatedUser = await getUserByIdAPI(form.userId);
      if (updatedUser) {
        const accStr = localStorage.getItem('account');
        let acc: any = {};
        if (accStr) {
          acc = JSON.parse(accStr);
        }
        // Sử dụng avatarUrl từ updatedUser nếu có, nếu không thì dùng từ upload
        const finalAvatarUrl = updatedUser.avatarUrl || avatarUrl;

        const newAccount = {
          ...acc,
          ...updatedUser,
          avatar: finalAvatarUrl, // Sử dụng avatarUrl từ updatedUser hoặc upload
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          username: updatedUser.username || acc.username,
        };
        // Xóa avatarUrl field để chỉ sử dụng avatar
        delete newAccount.avatarUrl;
        localStorage.setItem('account', JSON.stringify(newAccount));
      }

      // Sử dụng avatarUrl từ updatedUser nếu có, nếu không thì dùng từ upload
      const finalAvatarUrl = updatedUser?.avatarUrl || avatarUrl;
      setAccount({
        userId: form.userId || '',
        accountId: form.accountId || '',
        fullName: form.fullName || '',
        phone: form.phone || '',
        email: form.email || '',
        avatarUrl: finalAvatarUrl || '',
        gender: form.gender ?? 0,
        dob: form.dob || '',
        location: form.location || '',
        createdAt: form.createdAt || '',
      });
      setAvatarFile(null);

      // Dispatch event để cập nhật layout ngay lập tức
      window.dispatchEvent(new Event('user-updated'));
      setFieldErrors({});

      toast.success('Profile updated successfully!');
    } catch (error: unknown) {
      const { fieldErrors: backendFieldErrors, generalErrors } = parseBackendErrors(error);
      setFieldErrors(backendFieldErrors);
      if (generalErrors.length > 0) {
        toast.error(generalErrors[0]);
      } else if (Object.keys(backendFieldErrors).length === 0) {
        toast.error('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <div
          className={cn(
            'fixed inset-0 z-[-1] w-full h-full',
            getThemeClass('bg-gradient-to-r from-blue-500 to-cyan-400', 'bg-[#091D4B]')
          )}
        />
        <div
          className={cn(
            'w-full min-h-screen flex flex-col items-center justify-center',
            getThemeClass('text-gray-900', 'text-white')
          )}
        >
          <SpinnerOverlay show={true} />
        </div>
      </>
    );
  }

  if (!account) {
    return (
      <>
        <div
          className={cn(
            'fixed inset-0 z-[-1] w-full h-full',
            getThemeClass('bg-gradient-to-r from-blue-500 to-cyan-400', 'bg-[#091D4B]')
          )}
        />
        <div
          className={cn(
            'w-full min-h-screen flex flex-col items-center justify-center',
            getThemeClass('text-gray-900', 'text-white')
          )}
        >
          <div
            className={cn(
              'backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center max-w-md mx-4',
              getThemeClass('bg-white/80', 'bg-white/10')
            )}
          >
            <div
              className={cn(
                'text-2xl font-bold mb-4',
                getThemeClass('text-red-600', 'text-red-400')
              )}
            >
              Unable to load account information
            </div>
            <div className={cn('mb-6', getThemeClass('text-gray-500', 'text-gray-300'))}>
              Please try again or contact administrator.
            </div>
            <Button
              className={cn(
                'bg-gradient-to-r hover:brightness-110 transition rounded-full px-6 py-2 font-semibold',
                getThemeClass(
                  'from-blue-500 to-indigo-600 text-white',
                  'from-blue-500 to-indigo-600 text-white'
                )
              )}
              onClick={() => (window.location.href = '/')}
            >
              Go to Homepage
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Map ticket info with order items to get ticketName
  const getMappedTickets = () => {
    if (!selectedOrder || !selectedOrder.items) return [];
    return tickets.map((t, idx) => {
      const orderItem = selectedOrder.items.find((item: any) => item.ticketId === t.ticketId);
      return {
        ...t, // Spread all existing ticket properties
        ticketId: t.ticketId,
        ticketName: orderItem?.ticketName || '---',
        qrCode: t.qrCode, // Make sure qrCode is included from the original ticket
        qrCodeUrl: t.qrCodeUrl,
        createdAt: t.createdAt,
        status: t.used ? 'Đã sử dụng' : 'Chưa sử dụng',
        key: t.ticketId || `${t.eventId}-${orderItem?.ticketName || idx}`,
      };
    });
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[-1] w-full h-full',
          getThemeClass('bg-gradient-to-r from-blue-500 to-cyan-400', 'bg-[#091D4B]')
        )}
      />
      <div
        className={cn(
          'min-h-screen flex items-start justify-center',
          getThemeClass(
            'bg-gradient-to-br from-blue-100 via-cyan-100 to-blue-200',
            'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900'
          )
        )}
      >
        <div
          className={cn(
            'w-full max-w-5xl mx-auto rounded-[2.5rem] shadow-[0_8px_32px_rgba(80,0,160,0.25)] border backdrop-blur-xl flex flex-row overflow-hidden mt-32 mb-16 p-0',
            getThemeClass('bg-white/80 border-gray-200/40', 'bg-white/10 border-white/10')
          )}
        >
          <aside
            className={cn(
              'w-32 md:w-36 flex flex-col gap-2 border-r justify-start py-6 px-4',
              getThemeClass(
                'bg-gradient-to-b from-blue-200/90 to-cyan-100/90 border-blue-200/40',
                'bg-gradient-to-b from-indigo-800/90 to-slate-800/90 border-indigo-700/30'
              )
            )}
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                className={cn(
                  'w-full text-left pl-3 py-2 rounded-xl font-semibold transition-all text-xs mb-2',
                  tab === t.key
                    ? getThemeClass(
                        'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow',
                        'bg-gradient-to-br from-pink-500 to-indigo-500 text-white shadow'
                      )
                    : getThemeClass(
                        'text-blue-900 hover:bg-blue-200/60',
                        'text-indigo-100 hover:bg-indigo-700/30'
                      )
                )}
                onClick={() => {
                  setTab(t.key);
                  setSelectedOrder(null); // reset khi chuyển tab
                }}
              >
                {t.label}
              </button>
            ))}
          </aside>
          <main
            className={cn(
              'flex-1 p-10 pt-12 flex flex-col justify-start min-h-[600px]',
              getThemeClass('text-gray-900', 'text-white')
            )}
          >
            {tab === 'info' && (
              <div className="flex flex-col items-center justify-center w-full">
                {/* Avatar Section */}
                <div className="w-full flex flex-col items-center mb-4">
                  <div className="w-28 h-28 rounded-full border-4 border-blue-400 bg-white/10 flex items-center justify-center overflow-hidden shadow-lg mb-3">
                    {previewUrl ? (
                      <img src={previewUrl} alt="avatar" className="object-cover w-full h-full" />
                    ) : (
                      <img src={NO_AVATAR} alt="no avatar" className="object-cover w-full h-full" />
                    )}
                  </div>
                  <input
                    id="edit-avatar-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:brightness-110 transition rounded-full px-4 py-1.5 text-sm text-white font-semibold shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                      onClick={() => document.getElementById('edit-avatar-input')?.click()}
                    >
                      {t('changeAvatar')}
                    </Button>
                    <Button
                      type="button"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition rounded-full px-4 py-1.5 text-sm text-white font-semibold shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                      onClick={() => setShowChangePasswordModal(true)}
                    >
                      {t('changePassword')}
                    </Button>
                  </div>
                </div>
                {/* Personal Information */}
                <div className="w-full flex flex-col items-center justify-center">
                  <div className="w-full flex flex-col mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      {/* Full Name */}
                      <div className="w-full">
                        <label className="block text-xs text-white/50 ml-1 mb-1">
                          {t('fullName')}
                        </label>
                        <Input
                          name="fullName"
                          value={form.fullName || ''}
                          onChange={handleInputChange}
                          placeholder={t('enterFullName')}
                          className={cn(
                            'w-full justify-start text-left font-normal rounded-full border transition-all py-2 px-3 h-auto text-sm shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:transition-all duration-200',
                            !form.fullName && getThemeClass('text-gray-500', 'text-slate-400'),
                            hasFieldError(fieldErrors, 'fullname')
                              ? getThemeClass(
                                  'border-red-500 bg-red-50 text-red-700 focus:ring-red-500/20',
                                  'border-red-500 bg-red-900/20 text-red-300 focus:ring-red-500/20'
                                )
                              : getThemeClass(
                                  'border-blue-300 bg-blue-50/75 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50',
                                  'border-purple-700 bg-slate-700/60 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:bg-slate-700/80'
                                )
                          )}
                        />
                        {getFieldError(fieldErrors, 'fullname') && (
                          <div className="text-red-400 text-xs mt-1 ml-2">
                            {getFieldError(fieldErrors, 'fullname')}
                          </div>
                        )}
                      </div>
                      {/* Email */}
                      <div className="w-full">
                        <label className="block text-xs text-white/50 ml-1 mb-1">
                          {t('emailAddress')}
                        </label>
                        <Input
                          name="email"
                          value={form.email || ''}
                          disabled={true}
                          placeholder={t('yourEmailAddress')}
                          className={cn(
                            'w-full justify-start text-left font-normal rounded-full border transition-all py-2 px-3 h-auto text-sm shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:transition-all duration-200 opacity-70',
                            !form.email && getThemeClass('text-gray-500', 'text-slate-400'),
                            hasFieldError(fieldErrors, 'email')
                              ? getThemeClass(
                                  'border-red-500 bg-red-50 text-red-700 focus:ring-red-500/20',
                                  'border-red-500 bg-red-900/20 text-red-300 focus:ring-red-500/20'
                                )
                              : getThemeClass(
                                  'border-gray-300 bg-gray-100 text-gray-600 focus:ring-2 focus:ring-gray-500 focus:border-gray-500',
                                  'border-gray-600 bg-slate-800 text-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-gray-500'
                                )
                          )}
                        />
                        {getFieldError(fieldErrors, 'email') && (
                          <div className="text-red-400 text-xs mt-1 ml-2">
                            {getFieldError(fieldErrors, 'email')}
                          </div>
                        )}
                      </div>
                      {/* Phone */}
                      <div className="w-full">
                        <label className="block text-xs text-white/50 ml-1 mb-1">
                          {t('phoneNumber')}
                        </label>
                        <Input
                          name="phone"
                          value={form.phone || ''}
                          onChange={handleInputChange}
                          placeholder={t('enterPhoneNumber')}
                          className={cn(
                            'w-full justify-start text-left font-normal rounded-full border transition-all py-2 px-3 h-auto text-sm shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:transition-all duration-200',
                            !form.phone && getThemeClass('text-gray-500', 'text-slate-400'),
                            hasFieldError(fieldErrors, 'phone')
                              ? getThemeClass(
                                  'border-red-500 bg-red-50 text-red-700 focus:ring-red-500/20',
                                  'border-red-500 bg-red-900/20 text-red-300 focus:ring-red-500/20'
                                )
                              : getThemeClass(
                                  'border-blue-300 bg-blue-50/75 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50',
                                  'border-purple-700 bg-slate-700/60 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:bg-slate-700/80'
                                )
                          )}
                        />
                        {getFieldError(fieldErrors, 'phone') && (
                          <div className="text-red-400 text-xs mt-1 ml-2">
                            {getFieldError(fieldErrors, 'phone')}
                          </div>
                        )}
                      </div>
                      {/* Gender */}
                      <div className="w-full">
                        <label className="block text-xs text-white/50 ml-1 mb-1">
                          {t('gender')}
                        </label>
                        <Select
                          value={String(form.gender || '0')}
                          onValueChange={(val) => {
                            setForm((prev: Partial<User> | null) => ({
                              ...(prev || {}),
                              gender: Number(val),
                            }));
                            if (hasFieldError(fieldErrors, 'gender')) {
                              setFieldErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.gender;
                                return newErrors;
                              });
                            }
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              'w-full justify-start text-left font-normal rounded-full border transition-all py-2 px-3 h-auto text-sm shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:transition-all duration-200',
                              !form.gender && getThemeClass('text-gray-500', 'text-slate-400'),
                              hasFieldError(fieldErrors, 'gender')
                                ? getThemeClass(
                                    'border-red-500 bg-red-50 text-red-700 focus:ring-red-500/20',
                                    'border-red-500 bg-red-900/20 text-red-300 focus:ring-red-500/20'
                                  )
                                : getThemeClass(
                                    'border-blue-300 bg-blue-50/75 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50',
                                    'border-purple-700 bg-slate-700/60 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:bg-slate-700/80'
                                  )
                            )}
                          >
                            <SelectValue
                              placeholder={t('selectGender')}
                              className="text-[#A1A1AA] placeholder:text-[#A1A1AA]"
                            />
                          </SelectTrigger>
                          <SelectContent
                            className={cn(
                              'rounded-lg border',
                              getThemeClass(
                                'bg-white border-blue-200 shadow-lg',
                                'bg-slate-700 border-purple-600'
                              )
                            )}
                          >
                            <SelectItem
                              value="0"
                              className={cn(
                                getThemeClass(
                                  'text-gray-900 hover:bg-blue-50 focus:bg-blue-50',
                                  'text-white hover:bg-slate-600 focus:bg-slate-600'
                                )
                              )}
                            >
                              {t('male')}
                            </SelectItem>
                            <SelectItem
                              value="1"
                              className={cn(
                                getThemeClass(
                                  'text-gray-900 hover:bg-blue-50 focus:bg-blue-50',
                                  'text-white hover:bg-slate-600 focus:bg-slate-600'
                                )
                              )}
                            >
                              {t('female')}
                            </SelectItem>
                            <SelectItem
                              value="2"
                              className={cn(
                                getThemeClass(
                                  'text-gray-900 hover:bg-blue-50 focus:bg-blue-50',
                                  'text-white hover:bg-slate-600 focus:bg-slate-600'
                                )
                              )}
                            >
                              {t('other')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {getFieldError(fieldErrors, 'gender') && (
                          <div className="text-red-400 text-xs mt-1 ml-2">
                            {getFieldError(fieldErrors, 'gender')}
                          </div>
                        )}
                      </div>
                      {/* Location */}
                      <div className="w-full">
                        <label className="block text-xs text-white/50 ml-1 mb-1">
                          {t('location')}
                        </label>
                        <Input
                          name="location"
                          value={form.location || ''}
                          onChange={handleInputChange}
                          placeholder={t('enterLocation')}
                          className={cn(
                            'w-full justify-start text-left font-normal rounded-full border transition-all py-2 px-3 h-auto text-sm shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:transition-all duration-200',
                            !form.location && getThemeClass('text-gray-500', 'text-slate-400'),
                            hasFieldError(fieldErrors, 'location')
                              ? getThemeClass(
                                  'border-red-500 bg-red-50 text-red-700 focus:ring-red-500/20',
                                  'border-red-500 bg-red-900/20 text-red-300 focus:ring-red-500/20'
                                )
                              : getThemeClass(
                                  'border-blue-300 bg-blue-50/75 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50',
                                  'border-purple-700 bg-slate-700/60 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:bg-slate-700/80'
                                )
                          )}
                        />
                        {getFieldError(fieldErrors, 'location') && (
                          <div className="text-red-400 text-xs mt-1 ml-2">
                            {getFieldError(fieldErrors, 'location')}
                          </div>
                        )}
                      </div>
                      {/* Date of Birth */}
                      <div className="w-full">
                        <label className="block text-xs text-white/50 ml-1 mb-1">
                          {t('dayOfBirth')}
                        </label>
                        <DatePickerProfile
                          selectedDate={form.dob ? new Date(form.dob) : undefined}
                          onDateChange={(date) => {
                            const dateString = date ? date.toISOString().split('T')[0] : '';
                            setForm((f: Partial<User> | null) => ({
                              ...(f || {}),
                              dob: dateString,
                            }));
                            if (hasFieldError(fieldErrors, 'dob')) {
                              setFieldErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.dob;
                                return newErrors;
                              });
                            }
                            if (dateString) {
                              const dobValidation = validateDateOfBirth(dateString);
                              if (!dobValidation.isValid) {
                                setFieldErrors((prev) => ({
                                  ...prev,
                                  dob: [dobValidation.errorMessage!],
                                }));
                              }
                            }
                          }}
                          error={getFieldError(fieldErrors, 'dob')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="w-full flex flex-col gap-3 mt-2">
                  <Button
                    type="button"
                    className="bg-gradient-to-r text-white from-blue-500 to-indigo-600 hover:brightness-110 transition rounded-full w-full py-2.5 text-base font-semibold shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? t('saving') : t('saveChanges')}
                  </Button>
                  {/* Nút riêng Cập nhật khuôn mặt */}
                  <Button
                    type="button"
                    className="bg-gradient-to-r text-white from-purple-500 to-pink-500 hover:brightness-110 transition rounded-full w-full py-2.5 text-base font-semibold shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                    onClick={() => setShowFaceModal(true)}
                  >
                    {account.avatarUrl ? t('updateFace') : t('registerFace')}
                  </Button>
                </div>
              </div>
            )}

            {tab === 'settings' && (
              <div className="flex flex-col items-center justify-center w-full">
                <div className="w-full max-w-2xl">
                  <h2
                    className={cn(
                      'text-3xl font-bold mb-8 text-center',
                      getThemeClass('text-gray-900', 'text-white')
                    )}
                  >
                    {t('userConfig')}
                  </h2>

                  <div
                    className={cn(
                      'space-y-6 p-6 rounded-2xl shadow-xl border',
                      getThemeClass(
                        'bg-white/95 border-gray-200 shadow-lg',
                        'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-purple-700'
                      )
                    )}
                  >
                    {/* Language Selection */}
                    <div
                      className={cn(
                        'p-4 rounded-xl border transition-all duration-200',
                        getThemeClass(
                          'bg-blue-50/50 border-blue-200 hover:bg-blue-50',
                          'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                        )
                      )}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            getThemeClass('bg-blue-100', 'bg-slate-600')
                          )}
                        >
                          <span className="text-xl">🌐</span>
                        </div>
                        <div>
                          <label
                            className={cn(
                              'block text-sm font-semibold',
                              getThemeClass('text-gray-700', 'text-gray-300')
                            )}
                          >
                            {t('language')}
                          </label>
                          <p
                            className={cn(
                              'text-xs',
                              getThemeClass('text-gray-500', 'text-gray-400')
                            )}
                          >
                            {t('languageDescription') || 'Chọn ngôn ngữ hiển thị'}
                          </p>
                        </div>
                      </div>
                      <Select
                        value={String(userConfig.language)}
                        onValueChange={handleLanguageChange}
                      >
                        <SelectTrigger
                          className={cn(
                            'w-full justify-start text-left font-normal rounded-lg border transition-all duration-200 py-3 px-4 h-auto text-sm shadow-sm',
                            getThemeClass(
                              'border-blue-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50',
                              'border-purple-700 bg-slate-700/60 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:bg-slate-700/80'
                            )
                          )}
                        >
                          <SelectValue placeholder={t('selectLanguage')} />
                        </SelectTrigger>
                        <SelectContent
                          className={cn(
                            'rounded-lg border shadow-lg',
                            getThemeClass(
                              'bg-white border-blue-200',
                              'bg-slate-700 border-purple-600'
                            )
                          )}
                        >
                          <SelectItem
                            value="0"
                            className={cn(
                              getThemeClass(
                                'text-gray-900 hover:bg-blue-50 focus:bg-blue-50',
                                'text-white hover:bg-slate-600 focus:bg-slate-600'
                              )
                            )}
                          >
                            🇺🇸 {t('english')}
                          </SelectItem>
                          <SelectItem
                            value="1"
                            className={cn(
                              getThemeClass(
                                'text-gray-900 hover:bg-blue-50 focus:bg-blue-50',
                                'text-white hover:bg-slate-600 focus:bg-slate-600'
                              )
                            )}
                          >
                            🇻🇳 {t('vietnamese')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Theme Selection */}
                    <div
                      className={cn(
                        'p-4 rounded-xl border transition-all duration-200',
                        getThemeClass(
                          'bg-purple-50/50 border-purple-200 hover:bg-purple-50',
                          'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                        )
                      )}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            getThemeClass('bg-purple-100', 'bg-slate-600')
                          )}
                        >
                          <span className="text-xl">🎨</span>
                        </div>
                        <div>
                          <label
                            className={cn(
                              'block text-sm font-semibold',
                              getThemeClass('text-gray-700', 'text-gray-300')
                            )}
                          >
                            {t('theme')}
                          </label>
                          <p
                            className={cn(
                              'text-xs',
                              getThemeClass('text-gray-500', 'text-gray-400')
                            )}
                          >
                            {t('themeDescription') || 'Chọn giao diện sáng hoặc tối'}
                          </p>
                        </div>
                      </div>
                      <Select value={String(userConfig.theme)} onValueChange={handleThemeChange}>
                        <SelectTrigger
                          className={cn(
                            'w-full justify-start text-left font-normal rounded-lg border transition-all duration-200 py-3 px-4 h-auto text-sm shadow-sm',
                            getThemeClass(
                              'border-purple-300 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:bg-purple-50',
                              'border-purple-700 bg-slate-700/60 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:bg-slate-700/80'
                            )
                          )}
                        >
                          <SelectValue placeholder={t('selectTheme')} />
                        </SelectTrigger>
                        <SelectContent
                          className={cn(
                            'rounded-lg border shadow-lg',
                            getThemeClass(
                              'bg-white border-purple-200',
                              'bg-slate-700 border-purple-600'
                            )
                          )}
                        >
                          <SelectItem
                            value="0"
                            className={cn(
                              getThemeClass(
                                'text-gray-900 hover:bg-purple-50 focus:bg-purple-50',
                                'text-white hover:bg-slate-600 focus:bg-slate-600'
                              )
                            )}
                          >
                            ☀️ {t('light')}
                          </SelectItem>
                          <SelectItem
                            value="1"
                            className={cn(
                              getThemeClass(
                                'text-gray-900 hover:bg-purple-50 focus:bg-purple-50',
                                'text-white hover:bg-slate-600 focus:bg-slate-600'
                              )
                            )}
                          >
                            🌙 {t('dark')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Email Notifications Toggle */}
                    <div
                      className={cn(
                        'p-4 rounded-xl border transition-all duration-200',
                        getThemeClass(
                          'bg-green-50/50 border-green-200 hover:bg-green-50',
                          'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                        )
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center',
                              getThemeClass('bg-green-100', 'bg-slate-600')
                            )}
                          >
                            <span className="text-xl">📧</span>
                          </div>
                          <div>
                            <label
                              className={cn(
                                'block text-sm font-semibold',
                                getThemeClass('text-gray-700', 'text-gray-300')
                              )}
                            >
                              {t('emailNotifications')}
                            </label>
                            <p
                              className={cn(
                                'text-xs',
                                getThemeClass('text-gray-500', 'text-gray-400')
                              )}
                            >
                              {t('emailNotificationsDescription') || 'Nhận thông báo qua email'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Switch
                            id="receive-email-switch"
                            checked={userConfig.receiveEmail}
                            onCheckedChange={handleEmailNotificationsChange}
                            className={
                              userConfig.receiveEmail
                                ? '!bg-green-500 !border-green-500'
                                : '!bg-red-400 !border-red-400'
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {tab === 'orders' &&
              (selectedOrder ? (
                <MyTickets
                  tickets={getMappedTickets()}
                  loading={ticketsLoading}
                  error={ticketsError}
                  selectedOrder={selectedOrder}
                  onBack={() => setSelectedOrder(null)}
                />
              ) : (
                <OrderHistory
                  orders={orders}
                  loading={ordersLoading}
                  error={ordersError}
                  page={ordersPage}
                  totalPages={ordersTotalPages}
                  onPageChange={setOrdersPage}
                  onSelectOrder={handleSelectOrder}
                />
              ))}
            {tab === 'attendances' && (
              <AttendanceHistory
                attendances={attendances}
                loading={attendancesLoading}
                error={attendancesError}
              />
            )}
          </main>
        </div>
      </div>
      {/* Face Modal */}
      {showFaceModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative mx-4">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowFaceModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
              {account.avatarUrl ? t('updateFace') : t('registerFace')}
            </h2>
            <input
              type="password"
              placeholder={t('enterAccountPassword')}
              value={facePassword}
              onChange={(e) => setFacePassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {faceError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-center">
                {faceError}
              </div>
            )}
            <FaceCapture
              onCapture={async ({ image }) => {
                setFaceError('');
                try {
                  const file = new File([image], 'face.jpg', { type: image.type || 'image/jpeg' });
                  await updateFaceAPI(account.accountId, file, [0], undefined, hasFaceAuth);
                  toast.success('Face updated successfully!');
                  setShowFaceModal(false);
                  await refetchFaceAuth();
                } catch (e: unknown) {
                  console.error('Face update error:', e);

                  let msg = 'Face update failed!';
                  if (
                    typeof e === 'object' &&
                    e &&
                    'response' in e &&
                    typeof (e as { response?: { data?: { message?: string } } }).response?.data
                      ?.message === 'string'
                  ) {
                    const m = (e as { response: { data: { message: string } } }).response.data
                      .message;

                    // Check for all possible face authentication errors
                    if (
                      m.includes('This face is already registered to another account') ||
                      m.includes('already registered') ||
                      m.includes('Liveness check failed') ||
                      m.includes('No face detected') ||
                      m.includes('Multiple faces detected') ||
                      m.includes('Fake detected') ||
                      m.includes('Face too small') ||
                      m.includes('Face too blurry') ||
                      m.includes('Invalid face angle') ||
                      m.includes('Poor image quality') ||
                      m.includes('Only accept JPG, JPEG or PNG') ||
                      m.includes('Must smaller than 5MB') ||
                      m.includes('Face image is required') ||
                      m.includes('AI service not response') ||
                      m.includes('An error occurred while processing the face image') ||
                      m.includes('Face embedding is null') ||
                      m.includes('Invalid token') ||
                      m.includes('Account not found')
                    ) {
                      msg = m;
                    }
                  }
                  setFaceError(msg);
                  toast.error(msg);
                }
              }}
              onError={(err) => {
                setFaceError(err);
              }}
              onCancel={() => {
                setShowFaceModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </>
  );
};

export default ProfileCustomer;

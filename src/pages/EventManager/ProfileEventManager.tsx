// Fetch following events when the tab is selected

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

import {
  getUserByIdAPI,
  editUserAPI,
  uploadUserAvatarAPI,
  updateFaceAPI,
} from '@/services/Admin/user.service';
import { useFaceAuthStatus } from '@/hooks/use-face-auth-status';
import { getMyApprovedEvents } from '@/services/Event Manager/event.service';
import type { User } from '@/types/auth';

// Extend User type for event followers to include eventName
type EventFollower = User & { eventName?: string };
import { NO_AVATAR } from '@/assets/img';
import FaceCapture from '@/components/common/FaceCapture';
import { toast } from 'react-toastify';
import instance from '@/services/axios.customize';
import { useTranslation } from 'react-i18next';
import { DatePickerProfile } from '@/components/ui/day-picker-profile';
import {
  parseBackendErrors,
  getFieldError,
  hasFieldError,
  type FieldErrors,
  validateDateOfBirth,
} from '@/utils/validation';
import { updateUserConfig, getUserConfig } from '@/services/userConfig.service';
import { updateUserConfigAPI, getUserConfigAPI } from '@/services/Admin/user.service';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import GeneralSettings from '@/components/EventManager/GeneralSettings';
import {
  setAccountAndUpdateTheme,
  updateUserConfigAndTriggerUpdate,
  getCurrentUserId,
} from '@/utils/account-utils';

const TABS = [
  { key: 'profile', label: 'Thông tin cá nhân' },
  { key: 'settings', label: 'Cài đặt chung' },
  { key: 'followers', label: 'Người theo dõi event của bạn' },
  { key: 'managerFollowers', label: 'Người theo dõi bạn' },
];

export default function ProfileEventManager() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { getThemeClass } = useThemeClasses();
  const [account, setAccount] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  const [form, setForm] = useState<Partial<User> | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [facePassword, setFacePassword] = useState('');
  const [faceError, setFaceError] = useState('');
  const [tab, setTab] = useState<
    'profile' | 'settings' | 'followers' | 'managerFollowers' | 'followingEvents'
  >('profile');
  const [eventFollowers, setEventFollowers] = useState<EventFollower[]>([]);
  const [loadingEventFollowers, setLoadingEventFollowers] = useState(false);
  const [managerFollowers, setManagerFollowers] = useState<User[]>([]);
  const [loadingManagerFollowers, setLoadingManagerFollowers] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
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
          userId: userId, // Thêm userId để updateUserConfigAndTriggerUpdate hoạt động đúng
        };

        setUserConfig(newConfig);

        // Save to localStorage with userId
        updateUserConfigAndTriggerUpdate(newConfig);

        // Sync theme with ThemeContext
        const themeMode = newConfig.theme === 1 ? 'dark' : 'light';
        if (theme !== themeMode) {
          setTheme(themeMode);
        }
      }
    } catch (error) {
      // Failed to load user config
      // Keep default values if API fails
    }
  };

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
        // Failed to parse account data
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

  // Load user config from localStorage on mount
  useEffect(() => {
    const loadUserConfig = async () => {
      try {
        const userId = getCurrentUserId();
        if (!userId) return;

        const res = await getUserConfig(userId);
        if (res?.data) {
          const newConfig = { ...res.data };
          await updateUserConfig(userId, newConfig);
          updateUserConfigAndTriggerUpdate(newConfig);
        }
      } catch (error) {
        console.error('Failed to load user config:', error);
      }
    };

    loadUserConfig();
  }, []);

  useEffect(() => {
    const accStr = localStorage.getItem('account');
    let userId = '';
    if (accStr) {
      try {
        const accObj = JSON.parse(accStr);
        userId = accObj.userId;
      } catch {
        /* empty */
      }
    }
    if (!userId) {
      setLoading(false);
      return;
    }

    // Note: Identity realtime updates not available
    // No IdentityHub implemented yet

    setLoading(true);
    getUserByIdAPI(userId)
      .then((user) => {
        setAccount(user);
        setForm({ ...user });
        setPreviewUrl(user.avatar || user.avatarUrl || '');
      })
      .catch(() => {
        setAccount(null);
        setForm(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const fetchEventFollowers = async () => {
      setLoadingEventFollowers(true);
      try {
        // 1. Lấy danh sách event mà user này quản lý
        const eventsRes = await getMyApprovedEvents();
        const events = Array.isArray(eventsRes) ? eventsRes : eventsRes?.data?.items || [];
        // 2. Lấy followers cho từng event
        const allFollowers = [];
        for (const event of events) {
          try {
            const res = await instance.get('/api/Follow/getFollowersByEvent', {
              params: { eventId: event.eventId, page: 1, pageSize: 1000 },
            });
            const items = Array.isArray(res.data?.data?.items) ? res.data.data.items : [];
            // Gắn thêm tên event vào từng follower để hiển thị, đồng thời chuẩn hóa dữ liệu
            items.forEach((f) => {
              // Chuẩn hóa dữ liệu theo API mới: userId, userName, eventName, createdAt
              f.userId = f.userId || '';
              f.fullName = f.fullName || f.userName || '';
              f.email = f.email || '';
              f.phone = f.phone || '';
              f.avatarUrl = f.avatarUrl || '';
              f.eventName = f.eventName || event.eventName || '';
            });
            allFollowers.push(...items);
          } catch {
            /* empty */
          }
        }
        setEventFollowers(Array.isArray(allFollowers) ? allFollowers : []);
      } catch {
        setEventFollowers([]);
      } finally {
        setLoadingEventFollowers(false);
      }
    };
    if (tab === 'followers' && account?.userId) {
      fetchEventFollowers();
    }
    if (tab === 'managerFollowers') {
      setLoadingManagerFollowers(true);
      instance
        .get('/api/Follow/followers')
        .then((res) => {
          // API returns { data: { items: [...] } }
          const items = res.data?.data?.items || [];
          // Map to unified structure for table rendering
          setManagerFollowers(
            Array.isArray(items)
              ? items.map((item) => ({
                  userId: item.followerId,
                  accountId: '',
                  fullName: item.followerFullName,
                  phone: item.followerPhone || '',
                  email: item.followerEmail || '',
                  avatarUrl: item.followerAvatar,
                  gender: 0,
                  dob: '',
                  location: '',
                  createdAt: item.createdAt || '',
                  userName: item.followerUsername,
                }))
              : []
          );
        })
        .catch(() => setManagerFollowers([]))
        .finally(() => setLoadingManagerFollowers(false));
    }
  }, [tab, account?.userId]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev: Partial<User>) => ({
      ...prev,
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

  // User config handlers
  const handleLanguageChange = async (language: string) => {
    if (!account?.userId) {
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
        userId: account.userId, // Thêm userId
      };
      setUserConfig(newConfig);

      // Save to localStorage
      updateUserConfigAndTriggerUpdate(newConfig);

      toast.success(t('languageChangedSuccessfully'));
    } catch (error) {
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
        userId: account.userId, // Thêm userId
      };
      setUserConfig(newConfig);

      // Save to localStorage
      updateUserConfigAndTriggerUpdate(newConfig);

      toast.success(checked ? t('emailNotificationsEnabled') : t('emailNotificationsDisabled'));
    } catch (error) {
      toast.error(t('emailNotificationsUpdateFailed'));
    }
  };

  const handleThemeChange = async (themeValue: string) => {
    // Prevent multiple rapid clicks
    if (isThemeLoading) {
      return;
    }

    setIsThemeLoading(true);

    try {
      const themeNumber = parseInt(themeValue);
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
        userId: account.userId, // Thêm userId
      };
      setUserConfig(newConfig);

      // Save to localStorage
      updateUserConfigAndTriggerUpdate(newConfig);

      toast.success(themeNumber === 0 ? t('lightThemeEnabled') : t('darkThemeEnabled'));
    } catch (error) {
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

        // Cập nhật preview URL ngay lập tức
        setPreviewUrl(avatarUrl);

        // Cập nhật avatar trong form ngay lập tức
        setForm((prev: any) => ({ ...prev, avatarUrl: avatarUrl }));

        // Ghi đè lên trường avatar trong localStorage
        const accStr = localStorage.getItem('account');
        if (accStr) {
          const acc = JSON.parse(accStr);
          acc.avatar = avatarUrl;
          setAccountAndUpdateTheme(acc);
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
        setAccountAndUpdateTheme(newAccount);
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

      // Update user config
      try {
        const userId = getCurrentUserId();
        if (userId) {
          const res = await getUserConfig(userId);
          if (res?.data) {
            const newConfig = { ...res.data };
            await updateUserConfig(userId, newConfig);
            updateUserConfigAndTriggerUpdate(newConfig);
          }
        }
      } catch (error) {
        // Failed to update user config
      }

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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        </div>
      </>
    );
  }

  if (!account) return null;

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
            'w-full max-w-5xl rounded-[2.5rem] shadow-[0_8px_32px_rgba(80,0,160,0.25)] border backdrop-blur-xl flex flex-col overflow-hidden mt-4 mb-8 mx-8',
            getThemeClass('bg-white/80 border-gray-200/40', 'bg-white/10 border-white/10')
          )}
        >
          {/* Tabs horizontal full width on top, bo tròn hai góc dưới */}
          <div
            className={cn(
              'flex flex-row gap-2 w-full px-0 pt-0 pb-0 bg-transparent justify-start border-b rounded-b-[2.5rem] overflow-hidden',
              getThemeClass('border-blue-200/30', 'border-indigo-700/30')
            )}
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                className={cn(
                  'flex-1 px-0 py-4 rounded-none font-semibold transition-all text-base text-center',
                  tab === t.key
                    ? getThemeClass(
                        'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-none',
                        'bg-gradient-to-br from-pink-500 to-indigo-500 text-white shadow-none'
                      )
                    : getThemeClass(
                        'text-blue-900 hover:bg-blue-200/30',
                        'text-indigo-100 hover:bg-indigo-700/30'
                      )
                )}
                style={{ minWidth: 0 }}
                onClick={() =>
                  setTab(t.key as 'profile' | 'settings' | 'followers' | 'managerFollowers')
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* Main content: full width, no extra padding top/bottom */}
          <main
            className={cn(
              'flex-1 w-full px-10 py-8 flex flex-col justify-start min-h-[600px]',
              getThemeClass('text-gray-900', 'text-white')
            )}
          >
            {tab === 'profile' && (
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
                  <Button
                    type="button"
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:brightness-110 transition rounded-full px-4 py-1.5 text-sm text-white font-semibold shadow-[0_4px_4px_rgba(0,0,0,0.25)] mb-2"
                    onClick={() => document.getElementById('edit-avatar-input')?.click()}
                  >
                    {t('Change Avatar')}
                  </Button>
                </div>
                {/* Personal Information */}
                <div className="w-full flex flex-col items-center justify-center">
                  <div className="w-full flex flex-col mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      {/* Full Name */}
                      <div className="w-full">
                        <label
                          className={cn(
                            'block text-xs ml-1 mb-1',
                            getThemeClass('text-gray-600', 'text-white/50')
                          )}
                        >
                          {t('Full Name')}
                        </label>
                        <Input
                          name="fullName"
                          value={form.fullName || ''}
                          onChange={handleInputChange}
                          placeholder={t('Enter your full name')}
                          className={cn(
                            'rounded-full border transition-all duration-200 py-2 px-3 w-full h-auto text-sm',
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
                        <label
                          className={cn(
                            'block text-xs ml-1 mb-1',
                            getThemeClass('text-gray-600', 'text-white/50')
                          )}
                        >
                          {t('Email Address')}
                        </label>
                        <Input
                          name="email"
                          value={form.email || ''}
                          disabled={true}
                          placeholder={t('Your email address')}
                          className={cn(
                            'rounded-full border transition-all duration-200 py-2 px-3 w-full h-auto text-sm opacity-70',
                            !form.email && getThemeClass('text-gray-500', 'text-slate-400'),
                            hasFieldError(fieldErrors, 'email')
                              ? getThemeClass(
                                  'border-red-500 bg-red-50 text-red-700 focus:ring-red-500/20',
                                  'border-red-500 bg-red-900/20 text-red-300 focus:ring-red-500/20'
                                )
                              : getThemeClass(
                                  'border-gray-300 bg-gray-100 text-gray-600 focus:ring-2 focus:ring-gray-500 focus:border-gray-500',
                                  'border-purple-700 bg-slate-700/60 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:bg-slate-700/80'
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
                        <label
                          className={cn(
                            'block text-xs ml-1 mb-1',
                            getThemeClass('text-gray-600', 'text-white/50')
                          )}
                        >
                          {t('Phone Number')}
                        </label>
                        <Input
                          name="phone"
                          value={form.phone || ''}
                          onChange={handleInputChange}
                          placeholder={t('Enter your phone number')}
                          className={cn(
                            'rounded-full border transition-all duration-200 py-2 px-3 w-full h-auto text-sm',
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
                        <label
                          className={cn(
                            'block text-xs ml-1 mb-1',
                            getThemeClass('text-gray-600', 'text-white/50')
                          )}
                        >
                          {t('Gender')}
                        </label>
                        <Select
                          value={String(form.gender || '0')}
                          onValueChange={(val) => {
                            setForm((prev: Partial<User>) => ({ ...prev, gender: Number(val) }));
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
                              'rounded-full border transition-all duration-200 py-2 px-3 w-full h-auto text-sm',
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
                              placeholder={t('Select your gender')}
                              className={cn(
                                getThemeClass('text-gray-500', 'text-[#A1A1AA]'),
                                getThemeClass(
                                  'placeholder:text-gray-500',
                                  'placeholder:text-[#A1A1AA]'
                                )
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent
                            className={cn(
                              'border rounded-lg',
                              getThemeClass(
                                'bg-white border-gray-200',
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
                              {t('Male')}
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
                              {t('Female')}
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
                              {t('Other')}
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
                        <label
                          className={cn(
                            'block text-xs ml-1 mb-1',
                            getThemeClass('text-gray-600', 'text-white/50')
                          )}
                        >
                          {t('Location')}
                        </label>
                        <Input
                          name="location"
                          value={form.location || ''}
                          onChange={handleInputChange}
                          placeholder={t('Enter your location')}
                          className={cn(
                            'rounded-full border transition-all duration-200 py-2 px-3 w-full h-auto text-sm',
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
                        <label
                          className={cn(
                            'block text-xs ml-1 mb-1',
                            getThemeClass('text-gray-600', 'text-white/50')
                          )}
                        >
                          {t('Day of Birth')}
                        </label>
                        <DatePickerProfile
                          selectedDate={form.dob ? new Date(form.dob) : undefined}
                          onDateChange={(date) => {
                            const dateString = date ? date.toISOString().split('T')[0] : '';
                            setForm((f: Partial<User>) => ({
                              ...f,
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
                          disabled={false}
                          className="w-full"
                        />
                        {getFieldError(fieldErrors, 'dob') && (
                          <div className="text-red-400 text-xs mt-1 ml-2">
                            {getFieldError(fieldErrors, 'dob')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="w-full flex flex-row gap-3 mt-2 flex-wrap">
                  <Button
                    type="button"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-110 transition rounded-full flex-1 min-w-[140px] py-2.5 text-base font-semibold shadow text-white"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? t('Saving...') : t('Save Changes')}
                  </Button>
                  <Button
                    type="button"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition rounded-full flex-1 min-w-[140px] py-2 text-base font-semibold shadow text-white"
                    onClick={() => setShowFaceModal(true)}
                  >
                    {account.avatarUrl ? t('Update Face') : t('Register Face')}
                  </Button>
                </div>
              </div>
            )}
            {tab === 'settings' && (
              <GeneralSettings
                userConfig={userConfig}
                onLanguageChange={handleLanguageChange}
                onThemeChange={handleThemeChange}
                onEmailNotificationsChange={handleEmailNotificationsChange}
                isLanguageLoading={isLanguageLoading}
                isThemeLoading={isThemeLoading}
              />
            )}
            {tab === 'followers' && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2
                    className={cn(
                      'text-2xl font-bold bg-clip-text text-transparent',
                      getThemeClass(
                        'bg-gradient-to-r from-blue-600 to-cyan-600',
                        'bg-gradient-to-r from-purple-400 to-pink-400'
                      )
                    )}
                  >
                    👥 {t('Người theo dõi event của bạn')}
                  </h2>
                  <div
                    className={cn(
                      'px-4 py-2 rounded-full border',
                      getThemeClass(
                        'bg-blue-100 border-blue-300',
                        'bg-purple-600/20 border-purple-500/30'
                      )
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm font-medium',
                        getThemeClass('text-blue-700', 'text-purple-300')
                      )}
                    >
                      {eventFollowers.length} {t('người')}
                    </span>
                  </div>
                </div>
                {loadingEventFollowers ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                  </div>
                ) : !Array.isArray(eventFollowers) || eventFollowers.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🤷‍♂️</div>
                    <div className="text-gray-400 text-lg mb-2">
                      {t('Chưa có ai theo dõi event của bạn')}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {t('Chưa có người dùng nào follow event của bạn')}
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'overflow-x-auto rounded-xl shadow border',
                      getThemeClass(
                        'border-gray-200 bg-white',
                        'border-slate-700/40 bg-slate-900/60'
                      )
                    )}
                  >
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr
                          className={cn(
                            getThemeClass(
                              'bg-gray-50 text-gray-700',
                              'bg-slate-800/80 text-purple-300'
                            )
                          )}
                        >
                          <th className="px-4 py-3 font-semibold">{t('Avatar')}</th>
                          <th className="px-4 py-3 font-semibold">{t('Tên')}</th>
                          <th className="px-4 py-3 font-semibold">{t('Tên sự kiện')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(eventFollowers) &&
                          eventFollowers.map((f, idx) => (
                            <tr
                              key={
                                (f.userId || idx) + '-' + ((f as EventFollower).eventName || idx)
                              }
                              className={cn(
                                'border-b transition',
                                getThemeClass(
                                  'border-gray-200 hover:bg-gray-50',
                                  'border-slate-700/30 hover:bg-slate-800/60'
                                )
                              )}
                            >
                              <td className="px-4 py-2">
                                <img
                                  src={f.avatarUrl || NO_AVATAR}
                                  alt={f.fullName || ''}
                                  className={cn(
                                    'w-10 h-10 rounded-full object-cover border',
                                    getThemeClass('border-gray-300', 'border-slate-700')
                                  )}
                                />
                              </td>
                              <td
                                className={cn(
                                  'px-4 py-2 font-medium',
                                  getThemeClass('text-gray-900', 'text-white')
                                )}
                              >
                                {f.fullName || ''}
                              </td>
                              <td
                                className={cn(
                                  'px-4 py-2',
                                  getThemeClass('text-gray-600', 'text-slate-300')
                                )}
                              >
                                {(f as EventFollower).eventName || ''}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {tab === 'managerFollowers' && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2
                    className={cn(
                      'text-2xl font-bold bg-clip-text text-transparent',
                      getThemeClass(
                        'bg-gradient-to-r from-blue-600 to-cyan-600',
                        'bg-gradient-to-r from-purple-400 to-pink-400'
                      )
                    )}
                  >
                    👤 {t('Người theo dõi event manager')}
                  </h2>
                  <div
                    className={cn(
                      'px-4 py-2 rounded-full border',
                      getThemeClass(
                        'bg-blue-100 border-blue-300',
                        'bg-purple-600/20 border-purple-500/30'
                      )
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm font-medium',
                        getThemeClass('text-blue-700', 'text-purple-300')
                      )}
                    >
                      {managerFollowers.length} {t('người')}
                    </span>
                  </div>
                </div>
                {loadingManagerFollowers ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                  </div>
                ) : managerFollowers.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🤷‍♂️</div>
                    <div className="text-gray-400 text-lg mb-2">
                      {t('Chưa có ai theo dõi event manager này')}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {t('Chưa có người dùng nào follow event manager này')}
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'overflow-x-auto rounded-xl shadow border',
                      getThemeClass(
                        'border-gray-200 bg-white',
                        'border-slate-700/40 bg-slate-900/60'
                      )
                    )}
                  >
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr
                          className={cn(
                            getThemeClass(
                              'bg-gray-50 text-gray-700',
                              'bg-slate-800/80 text-purple-300'
                            )
                          )}
                        >
                          <th className="px-4 py-3 font-semibold">{t('Avatar')}</th>
                          <th className="px-4 py-3 font-semibold">{t('Tên')}</th>
                          <th className="px-4 py-3 font-semibold">{t('Username')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {managerFollowers.map((f, idx) => (
                          <tr
                            key={f.userId || idx}
                            className={cn(
                              'border-b transition',
                              getThemeClass(
                                'border-gray-200 hover:bg-gray-50',
                                'border-slate-700/30 hover:bg-slate-800/60'
                              )
                            )}
                          >
                            <td className="px-4 py-2">
                              <img
                                src={f.avatarUrl || NO_AVATAR}
                                alt={f.fullName}
                                className={cn(
                                  'w-10 h-10 rounded-full object-cover border',
                                  getThemeClass('border-gray-300', 'border-slate-700')
                                )}
                              />
                            </td>
                            <td
                              className={cn(
                                'px-4 py-2 font-medium',
                                getThemeClass('text-gray-900', 'text-white')
                              )}
                            >
                              {f.fullName}
                            </td>
                            <td
                              className={cn(
                                'px-4 py-2',
                                getThemeClass('text-gray-600', 'text-slate-300')
                              )}
                            >
                              {(f as any).userName || ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
      {/* Face Modal giữ nguyên như cũ */}
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
              {account.avatarUrl ? t('Update Face') : t('Register Face')}
            </h2>
            <input
              type="password"
              placeholder={t('Enter account password')}
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
                  toast.success(t('Face updated successfully!'));
                  setShowFaceModal(false);
                  // Refetch face auth status after successful update
                  await refetchFaceAuth();
                } catch (e: unknown) {
                  let msg = t('Face update failed!');
                  if ((e as any)?.response?.data?.message) {
                    const m = (e as any).response.data.message;

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
              onError={(err) => setFaceError(err)}
              onCancel={() => setShowFaceModal(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

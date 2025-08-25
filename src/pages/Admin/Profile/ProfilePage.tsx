/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, ChangeEvent } from 'react';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import {
  getUserByIdAPI,
  editUserAPI,
  uploadUserAvatarAPI,
  updateFaceAPI,
  updateUserConfigAPI,
  getUserConfigAPI,
  getUserInfoAPI,
} from '@/services/Admin/user.service';
import { useFaceAuthStatus } from '@/hooks/use-face-auth-status';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { NO_AVATAR } from '@/assets/img';
import FaceCapture from '@/components/common/FaceCapture';
import ChangePasswordModal from '@/pages/Admin/Profile/ChangePasswordModal';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  validateProfileUpdate,
  parseBackendErrors,
  FieldErrors,
  validateDateOfBirth,
} from '@/utils/validation';
import { useTheme } from '@/contexts/ThemeContext';
import { setAccountAndUpdateTheme, updateUserConfigAndTriggerUpdate } from '@/utils/account-utils';

const ProfilePage = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [faceError, setFaceError] = useState('');
  const [validationErrors, setValidationErrors] = useState<FieldErrors>({});

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

  const { t, i18n } = useTranslation();
  const { hasFaceAuth, refetch: refetchFaceAuth } = useFaceAuthStatus();
  const { theme, setTheme } = useTheme();

  // Debug logging for face auth status
  console.log('[ProfilePage] useFaceAuthStatus hook result:', {
    hasFaceAuth,
    refetch: refetchFaceAuth,
  });

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);

      // Get userId from localStorage
      const accStr = localStorage.getItem('account');
      console.log('ProfilePage - localStorage account:', accStr);

      if (accStr) {
        try {
          const accountData = JSON.parse(accStr);
          const userId = accountData.userId;

          console.log('ProfilePage - Loading initial data for userId:', userId);

          // Load all data simultaneously using Promise.all to avoid multiple refresh token calls
          const [userInfoResponse, userConfigResponse] = await Promise.all([
            getUserInfoAPI(userId),
            getUserConfigAPI(userId),
          ]);

          // Process user info
          if (userInfoResponse.data) {
            const userData = userInfoResponse.data;
            setAccount(userData);
            setForm({
              ...userData,
            });
            setPreviewUrl(userData.avatar || userData.avatarUrl || '');
          }

          // Process user config
          if (userConfigResponse.data) {
            const configData = userConfigResponse.data;
            console.log('Config data from API:', configData);
            console.log('receiveEmail from API:', configData.receiveEmail);

            const newConfig = {
              language: configData.language || 0,
              theme: configData.theme || 0,
              receiveEmail: configData.receiveEmail !== undefined ? configData.receiveEmail : false,
              receiveNotify:
                configData.receiveNotify !== undefined ? configData.receiveNotify : false,
              userId: userId,
            };

            setUserConfig(newConfig);

            // Save to localStorage
            updateUserConfigAndTriggerUpdate(newConfig);

            // Sync theme with ThemeContext
            const themeMode = newConfig.theme === 1 ? 'dark' : 'light';
            if (theme !== themeMode) {
              setTheme(themeMode);
            }

            console.log('Updated userConfig.receiveEmail:', configData.receiveEmail);
          }

          console.log('ProfilePage - Initial data loaded successfully');
        } catch (error) {
          console.error('ProfilePage - Failed to load initial data:', error);
          // Fallback to localStorage if API fails
          const accStr = localStorage.getItem('account');
          if (accStr) {
            const accountData = JSON.parse(accStr);
            setAccount(accountData);
            setForm({
              ...accountData,
            });
            setPreviewUrl(accountData.avatar || accountData.avatarUrl || '');
          }
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }

      // Note: Identity and FaceRecognition realtime updates not available
      // No IdentityHub or FaceRecognitionHub implemented yet
    };

    loadInitialData();
  }, []); // Removed refetchFaceAuth from dependencies to prevent infinite loop

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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({
      ...prev,
      [name]: name === 'gender' ? Number(value) : value, // Ép kiểu gender về number
    }));
  };

  const handleLanguageChange = async (language: string) => {
    // Prevent multiple rapid clicks
    if (isLanguageLoading) {
      return;
    }

    const languageNumber = parseInt(language);

    // ✅ Kiểm tra xem language có thực sự thay đổi không
    if (userConfig.language === languageNumber) {
      console.log('Language already matches, skipping update:', languageNumber);
      return;
    }

    setIsLanguageLoading(true);

    try {
      const languageCode = languageNumber === 0 ? 'en' : 'vi';

      // Update language in i18n
      await i18n.changeLanguage(languageCode);

      // ✅ Chỉ gọi API một lần - update user config
      await updateUserConfigAPI(account.userId, {
        language: languageNumber,
      });

      // ✅ Update local state
      const newConfig = {
        ...userConfig,
        language: languageNumber,
        userId: account.userId,
      };
      setUserConfig(newConfig);

      // ✅ KHÔNG gọi updateUserConfigAndTriggerUpdate để tránh vòng lặp
      // updateUserConfigAndTriggerUpdate(newConfig);

      toast.success(t('languageChangedSuccessfully'));
    } catch (error) {
      console.error('Failed to update language:', error);
      toast.error(t('languageChangeFailed'));
    } finally {
      setIsLanguageLoading(false);
    }
  };

  const handleEmailNotificationsChange = async (checked: boolean) => {
    console.log('Switch clicked! New value:', checked);

    // ✅ Kiểm tra xem email notifications có thực sự thay đổi không
    if (userConfig.receiveEmail === checked) {
      console.log('Email notifications already match, skipping update:', checked);
      return;
    }

    try {
      // ✅ Chỉ gọi API một lần - update user config
      await updateUserConfigAPI(account.userId, {
        receiveEmail: checked,
      });

      // ✅ Update local state
      const newConfig = {
        ...userConfig,
        receiveEmail: checked,
        userId: account.userId,
      };
      setUserConfig(newConfig);

      // ✅ KHÔNG gọi updateUserConfigAndTriggerUpdate để tránh vòng lặp
      // updateUserConfigAndTriggerUpdate(newConfig);

      console.log('Email notifications updated successfully:', checked);
      toast.success(checked ? t('emailNotificationsEnabled') : t('emailNotificationsDisabled'));
    } catch (error) {
      console.error('Failed to update email notifications:', error);
      toast.error(t('emailNotificationsUpdateFailed'));
    }
  };

  const handleThemeChange = async (themeValue: string) => {
    // Prevent multiple rapid clicks
    if (isThemeLoading) {
      return;
    }

    const themeNumber = parseInt(themeValue);

    // ✅ Kiểm tra xem theme có thực sự thay đổi không
    if (userConfig.theme === themeNumber) {
      console.log('Theme already matches, skipping update:', themeNumber);
      return;
    }

    setIsThemeLoading(true);

    try {
      const themeMode = themeNumber === 1 ? 'dark' : 'light';

      // ✅ Chỉ gọi API một lần - update user config
      await updateUserConfigAPI(account.userId, {
        theme: themeNumber,
      });

      // ✅ Update local state trước
      const newConfig = {
        ...userConfig,
        theme: themeNumber,
        userId: account.userId,
      };
      setUserConfig(newConfig);

      // ✅ Update theme context từ payload đã có, KHÔNG gọi lại API
      setTheme(themeMode, { skipApi: true, userConfig: newConfig });

      // ✅ KHÔNG gọi updateUserConfigAndTriggerUpdate để tránh vòng lặp
      // updateUserConfigAndTriggerUpdate(newConfig);

      console.log('Theme updated successfully:', themeNumber);
      toast.success(themeNumber === 0 ? t('lightThemeEnabled') : t('darkThemeEnabled'));
    } catch (error) {
      console.error('Failed to update theme:', error);
      toast.error(t('themeUpdateFailed'));
    } finally {
      setIsThemeLoading(false);
    }
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Cập nhật avatar trong form ngay lập tức để preview
      setForm((prev) => ({ ...prev, avatar: url }));

      // KHÔNG dispatch event tạm thời để tránh cập nhật layout khi chưa lưu
      // window.dispatchEvent(new CustomEvent('avatar-updated', {
      //   detail: { avatarUrl: url }
      // }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setValidationErrors({});

    try {
      // Validate form data
      const errors = validateProfileUpdate(form.fullName, form.email, form.phone, form.dob);

      if (errors.length > 0) {
        const fieldErrors: FieldErrors = {};
        errors.forEach((error) => {
          // Map error messages to field names
          if (error.toLowerCase().includes('full name')) {
            fieldErrors.fullName = [error];
          } else if (error.toLowerCase().includes('email')) {
            fieldErrors.email = [error];
          } else if (error.toLowerCase().includes('phone')) {
            fieldErrors.phone = [error];
          } else if (
            error.toLowerCase().includes('date of birth') ||
            error.toLowerCase().includes('age')
          ) {
            fieldErrors.dob = [error];
          }
        });
        setValidationErrors(fieldErrors);
        toast.error(t('pleaseFixValidationErrors'));
        return;
      }

      let avatarUrl = form.avatar || form.avatarUrl;
      let updatedUser = null;

      // Try to update via API first
      try {
        if (avatarFile instanceof File) {
          const res = await uploadUserAvatarAPI(form.userId, avatarFile);
          avatarUrl = res.data?.avatarUrl || avatarUrl;
        }

        await editUserAPI(form.userId, {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          location: form.location,
          dob: form.dob,
          gender: Number(form.gender),
        });

        // Try to get updated user from API
        updatedUser = await getUserByIdAPI(form.userId);
      } catch (apiError) {
        console.error('API update failed, updating localStorage only:', apiError);
        // If API fails, just update localStorage
        updatedUser = null;
      }

      // Update localStorage with new data
      const accStr = localStorage.getItem('account');
      let acc: any = {};
      if (accStr) {
        acc = JSON.parse(accStr);
      }

      const finalAvatarUrl = updatedUser?.avatarUrl || avatarUrl || acc.avatar;
      const newAccount = {
        ...acc,
        ...form,
        avatar: finalAvatarUrl,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        location: form.location,
        dob: form.dob,
        gender: Number(form.gender),
      };

      setAccountAndUpdateTheme(newAccount);

      // Update state
      setAccount({ ...form, avatar: finalAvatarUrl });
      setAvatarFile(null);
      setPreviewUrl(finalAvatarUrl);

      // Dispatch events to update layout
      window.dispatchEvent(new Event('user-updated'));
      window.dispatchEvent(
        new CustomEvent('avatar-updated', {
          detail: { avatarUrl: finalAvatarUrl },
        })
      );

      toast.success(t('profileUpdatedSuccessfully'));
    } catch (error: any) {
      console.error('Error updating profile:', error);

      // Parse backend errors
      const backendErrors = parseBackendErrors(error);
      if (Object.keys(backendErrors.fieldErrors).length > 0) {
        setValidationErrors(backendErrors.fieldErrors);
        toast.error(t('pleaseFixValidationErrors'));
      } else if (backendErrors.generalErrors.length > 0) {
        toast.error(backendErrors.generalErrors[0]);
      } else {
        toast.error(error?.response?.data?.message || t('updateProfileFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center">
        <SpinnerOverlay show={true} fullScreen={false} />
        <span className="mt-6 text-lg text-purple-200 animate-pulse">{t('pleaseWait')}</span>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-br">
        <div className="bg-white dark:bg-gray-800 rounded-[12px] shadow-lg p-8 text-center">
          <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">
            {t('cannotLoadAccountInfo')}
          </div>
          <div className="text-gray-700 dark:text-gray-300 mb-6">
            {t('pleaseTryAgainOrContactAdmin')}
          </div>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-[6px] font-semibold hover:bg-blue-700 transition"
            onClick={() => (window.location.href = '/')}
          >
            {t('backToHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex justify-center mt-5">
      <SpinnerOverlay show={loading} />
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Info Section - Takes 2/3 */}
          <div className="lg:col-span-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              {t('personalInfo')}
            </h2>

            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="w-20 h-20 rounded-full border-4 border-blue-400 bg-gray-100 flex items-center justify-center overflow-hidden shadow">
                {previewUrl ? (
                  <img src={previewUrl} alt="avatar" className="object-cover w-full h-full" />
                ) : (
                  <img src={NO_AVATAR} alt="no avatar" className="object-cover w-full h-full" />
                )}
              </div>
              {/* Avatar edit button */}
              <input
                id="edit-avatar-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div className="flex flex-col gap-1 mt-1 w-full justify-center items-center">
                <button
                  type="button"
                  className="w-[100px] h-[35px] rounded-[6px] bg-[#f3f7fe] text-[#3b82f6] border-none cursor-pointer font-medium text-sm transition duration-300 hover:bg-[#3b82f6] hover:text-white hover:shadow-[0_0_0_5px_#3b83f65f]"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('edit-avatar-input')?.click();
                  }}
                >
                  Edit Avatar
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="w-[150px] h-[35px] rounded-[6px] bg-gradient-to-r from-blue-600 to-green-500 text-white font-medium text-sm transition duration-300 hover:from-blue-700 hover:to-green-600 shadow"
                    onClick={() => setShowFaceModal(true)}
                  >
                    {t('updateFace')}
                  </button>
                  <button
                    type="button"
                    className="w-[150px] h-[35px] rounded-[6px] bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium text-sm transition duration-300 hover:from-purple-700 hover:to-pink-600 shadow"
                    onClick={() => setShowChangePasswordModal(true)}
                  >
                    {t('changePassword')}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Responsive 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('fullName')}
                  </label>
                  <Input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleInputChange}
                    className={`border rounded px-2 py-1 w-full shadow-none focus:ring-0 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${
                      validationErrors.fullName
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-gray-300 dark:focus:border-gray-500'
                    }`}
                  />
                  {validationErrors.fullName && (
                    <div className="text-red-500 text-sm mt-1">{validationErrors.fullName[0]}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('email')}
                  </label>
                  <Input
                    name="email"
                    value={form.email}
                    disabled
                    className={`border rounded px-2 py-1 w-full shadow-none focus:ring-0 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${
                      validationErrors.email
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-gray-300 dark:focus:border-gray-500'
                    }`}
                  />
                  {validationErrors.email && (
                    <div className="text-red-500 text-sm mt-1">{validationErrors.email[0]}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('phone')}
                  </label>
                  <Input
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    className={`border rounded px-2 py-1 w-full shadow-none focus:ring-0 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${
                      validationErrors.phone
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-gray-300 dark:focus:border-gray-500'
                    }`}
                  />
                  {validationErrors.phone && (
                    <div className="text-red-500 text-sm mt-1">{validationErrors.phone[0]}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('gender')}
                  </label>
                  <Select
                    value={String(form.gender)}
                    onValueChange={(val) =>
                      setForm((prev: any) => ({ ...prev, gender: Number(val) }))
                    }
                  >
                    <SelectTrigger className="border border-gray-200 dark:border-gray-600 rounded px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300 dark:focus:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <SelectValue placeholder={t('selectGender')} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                      <SelectItem
                        value="0"
                        className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        {t('male')}
                      </SelectItem>
                      <SelectItem
                        value="1"
                        className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        {t('female')}
                      </SelectItem>
                      <SelectItem
                        value="2"
                        className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        {t('other')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Additional fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('location')}
                  </label>
                  <Input
                    name="location"
                    value={form.location || ''}
                    onChange={handleInputChange}
                    className="border border-gray-200 dark:border-gray-600 rounded px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300 dark:focus:border-gray-500 dark:bg-gray-700 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t('dateOfBirth')}
                  </label>
                  <DatePicker
                    selectedDate={form.dob ? new Date(form.dob) : undefined}
                    onDateChange={(date) => {
                      const dobString = date?.toISOString().split('T')[0] || '';
                      setForm((prev: any) => ({
                        ...prev,
                        dob: dobString,
                      }));

                      // Real-time validation for date of birth
                      if (dobString) {
                        const dobValidation = validateDateOfBirth(dobString);
                        if (!dobValidation.isValid) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            dob: [dobValidation.errorMessage!],
                          }));
                        } else {
                          setValidationErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.dob;
                            return newErrors;
                          });
                        }
                      } else {
                        setValidationErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.dob;
                          return newErrors;
                        });
                      }
                    }}
                    onMonthChange={(_month) => {
                      // eslint-disable-line @typescript-eslint/no-unused-vars
                      // Clear date of birth error when month changes
                      if (validationErrors.dob) {
                        setValidationErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.dob;
                          return newErrors;
                        });
                      }
                    }}
                    onYearChange={(_year) => {
                      // eslint-disable-line @typescript-eslint/no-unused-vars
                      // Clear date of birth error when year changes
                      if (validationErrors.dob) {
                        setValidationErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.dob;
                          return newErrors;
                        });
                      }
                    }}
                    error={validationErrors.dob?.[0]}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-4 py-1.5 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
                onClick={() => {
                  setForm(account);
                  setAvatarFile(null);
                  setPreviewUrl(account.avatar || account.avatarUrl || '');

                  // Reset avatar trong layout về trạng thái ban đầu
                  window.dispatchEvent(
                    new CustomEvent('avatar-updated', {
                      detail: { avatarUrl: account.avatar || account.avatarUrl || '' },
                    })
                  );
                }}
                disabled={loading}
                type="button"
              >
                <span>{t('cancel')}</span>
              </button>
              <button
                className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-4 py-1.5 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-[#0071e2]"
                onClick={handleSave}
                disabled={loading}
                type="button"
              >
                <span>{t('save')}</span>
              </button>
            </div>
          </div>

          {/* User Config Section - Takes 1/3 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              {t('userConfig')}
            </h2>

            <div className="space-y-4">
              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('language')}
                </label>
                <Select value={String(userConfig.language)} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="border border-gray-200 dark:border-gray-600 rounded px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300 dark:focus:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <SelectValue placeholder={t('selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                    <SelectItem
                      value="0"
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      {t('english')}
                    </SelectItem>
                    <SelectItem
                      value="1"
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      {t('vietnamese')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('theme')}
                </label>
                <Select value={String(userConfig.theme)} onValueChange={handleThemeChange}>
                  <SelectTrigger className="border border-gray-200 dark:border-gray-600 rounded px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300 dark:focus:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <SelectValue placeholder={t('selectTheme')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                    <SelectItem
                      value="0"
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      {t('light')}
                    </SelectItem>
                    <SelectItem
                      value="1"
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      {t('dark')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email Notifications Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('emailNotifications')}
                </label>
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
                  <label
                    htmlFor="receive-email-switch"
                    className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                  >
                    {t('receiveEmailNotifications')}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Face Modal */}
      {showFaceModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xl"
              onClick={() => setShowFaceModal(false)}
              aria-label={t('close')}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-center text-black dark:text-white">
              {t('updateFace')}
            </h2>
            {faceError && <div className="text-red-500 text-center mb-2">{faceError}</div>}
            <FaceCapture
              onCapture={async ({ image }) => {
                setFaceError('');
                try {
                  const file = new File([image], 'face.jpg', {
                    type: image.type || 'image/jpeg',
                  });
                  await updateFaceAPI(account.accountId, file, [0], undefined, hasFaceAuth);
                  toast.success(t('updateFaceSuccess'));
                  setShowFaceModal(false);
                  // Refetch face auth status after successful update
                  await refetchFaceAuth();
                } catch (e: any) {
                  console.error('Face update error:', e);

                  let msg = t('updateFaceFailed');
                  if (e?.response?.data?.message) {
                    const m = e.response.data.message;

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

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
};

export default ProfilePage;

import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { updateUserConfig, getUserConfig } from '@/services/userConfig.service';
import { useTheme } from '@/contexts/ThemeContext';
import { getCurrentUserId } from '@/utils/account-utils';
import { updateUserConfigAndTriggerUpdate } from '@/utils/account-utils';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  
  // ✅ Sử dụng ref để tránh vòng lặp API calls
  const lastThemeUpdate = useRef<string>('');
  const isUpdating = useRef(false);

  const handleThemeToggle = useCallback(async () => {
    // ✅ Prevent multiple rapid clicks và vòng lặp
    if (isLoading || isUpdating.current) {
      return;
    }

    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    // ✅ Kiểm tra xem theme có thực sự thay đổi không
    if (lastThemeUpdate.current === newTheme) {
      return;
    }

    // ✅ Đánh dấu đang update để tránh duplicate calls
    isUpdating.current = true;
    setIsLoading(true);

    try {
      const themeNumber = newTheme === 'dark' ? 1 : 0;
      const userId = getCurrentUserId();
      
      if (!userId) {
        // Update theme locally if no userId
        setTheme(newTheme);
        lastThemeUpdate.current = newTheme;
        return;
      }

      // ✅ Chỉ gọi API nếu thực sự cần thiết
      const res = await getUserConfig(userId);
      if (res?.data) {
        const currentThemeNumber = res.data.theme || 0;
        
        // ✅ Kiểm tra xem theme có thực sự khác biệt không
        if (currentThemeNumber === themeNumber) {
          console.log('Theme already matches, skipping API update');
          setTheme(newTheme);
          lastThemeUpdate.current = newTheme;
          return;
        }

        const newConfig = {
          ...res.data,
          userId: userId,
          theme: themeNumber,
        };

        // Update user config via API first
        await updateUserConfig(userId, newConfig);

        // ✅ Cập nhật theme context và ref
        setTheme(newTheme);
        lastThemeUpdate.current = newTheme;

        // ✅ Save to localStorage với userId và trigger update event
        updateUserConfigAndTriggerUpdate(newConfig);

        // Show success toast using translation
        toast.success(themeNumber === 0 ? t('lightThemeEnabled') : t('darkThemeEnabled'));
      } else {
        toast.error(t('themeUpdateFailed'));
      }
    } catch (error) {
      console.error('Theme toggle error:', error);
      toast.error(t('themeUpdateFailed'));
    } finally {
      setIsLoading(false);
      isUpdating.current = false;
    }
  }, [theme, setTheme, isLoading, t]);

  // ✅ Sync với theme context khi component mount
  React.useEffect(() => {
    if (theme && lastThemeUpdate.current !== theme) {
      lastThemeUpdate.current = theme;
    }
  }, [theme]);

  return (
    <label
      className={`inline-flex items-center relative ${className} ${
        isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
      } transition-all duration-300 ease-in-out`}
    >
      <input
        className="peer hidden"
        id="toggle"
        type="checkbox"
        checked={theme === 'dark'}
        onChange={handleThemeToggle}
        disabled={isLoading}
      />
      <div
        className={`relative w-[110px] h-[50px] bg-[#e9e6e6] peer-checked:bg-zinc-500 border border-gray-300 dark:border-gray-600 rounded-full after:absolute after:content-[''] after:w-[40px] after:h-[40px] after:bg-gradient-to-r from-orange-500 to-yellow-400 peer-checked:after:from-zinc-900 peer-checked:after:to-zinc-900 after:rounded-full after:top-[5px] after:left-[5px] active:after:w-[50px] peer-checked:after:left-[105px] peer-checked:after:translate-x-[-100%] shadow-sm transition-all duration-500 ease-in-out after:transition-all after:duration-500 after:ease-in-out after:shadow-md ${
          isLoading ? 'opacity-70' : ''
        }`}
      ></div>

      {/* ✅ Sun icon với smooth transitions */}
      <svg
        height="0"
        width="100"
        viewBox="0 0 24 24"
        data-name="Layer 1"
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        className={`fill-white peer-checked:opacity-60 absolute w-6 h-6 left-[13px] transition-all duration-500 ease-in-out ${
          isLoading ? 'animate-pulse' : ''
        }`}
      >
        <path d="M12,17c-2.76,0-5-2.24-5-5s2.24-5,5-5,5,2.24,5,5-2.24,5-5,5ZM13,0h-2V5h2V0Zm0,19h-2v5h2v-5ZM5,11H0v2H5v-2Zm19,0h-5v2h5v-2Zm-2.81-6.78l-1.41-1.41-3.54,3.54,1.41,1.41,3.54-3.54ZM7.76,17.66l-1.41-1.41-3.54,3.54,1.41,1.41,3.54-3.54Zm0-11.31l-3.54-3.54-1.41,1.41,3.54,3.54,1.41-1.41Zm13.44,13.44l-3.54-3.54-1.41,1.41,3.54,3.54,1.41-1.41Z"></path>
      </svg>

      {/* ✅ Moon icon với smooth transitions */}
      <svg
        height="512"
        width="512"
        viewBox="0 0 24 24"
        data-name="Layer 1"
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        className={`fill-black opacity-60 peer-checked:opacity-70 peer-checked:fill-white absolute w-6 h-6 right-[13px] transition-all duration-500 ease-in-out ${
          isLoading ? 'animate-pulse' : ''
        }`}
      >
        <path d="M12.009,24A12.067,12.067,0,0,1,.075,10.725,12.121,12.121,0,0,1,10.1.152a13,13,0,0,1,5.03.206,2.5,2.5,0,0,1,1.8,1.8,2.47,2.47,0,0,1-.7,2.425c-4.559,4.168-4.165,10.645.807,14.412h0a2.5,2.5,0,0,1-.7,4.319A13.875,13.875,0,0,1,12.009,24Zm.074-22a10.776,10.776,0,0,0-1.675.127,10.1,10.1,0,0,0-8.344,8.8A9.928,9.928,0,0,0,4.581,18.7a10.473,10.473,0,0,0,11.093,2.734.5.5,0,0,0,.138-.856h0C9.883,16.1,9.417,8.087,14.865,3.124a.459.459,0,0,0,.127-.465.491.491,0,0,0-.356-.362A10.68,10.68,0,0,0,12.083,2ZM20.5,12a1,1,0,0,1-.97-.757l-.358-1.43L17.74,9.428a1,1,0,0,1,.035-1.94l1.4-.325.351-1.406a1,1,0,0,1,1.94,0l.355,1.418,1.418.355a1,1,0,0,1,0,1.94l-1.418.355-.355,1.418A1,1,0,0,1,20.5,12ZM16,14a1,1,0,0,0,2,0A1,1,0,0,0,16,14Zm6,4a1,1,0,0,0,2,0A1,1,0,0,0,22,18Z"></path>
      </svg>

      {/* ✅ Loading indicator khi đang update theme */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full transition-all duration-300 ease-in-out">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </label>
  );
};

export default ThemeToggle;

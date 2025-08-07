import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GeneralSettingsProps {
  userConfig: {
    language: number;
    theme: number;
    receiveEmail: boolean;
    receiveNotify: boolean;
  };
  onLanguageChange: (language: string) => void;
  onThemeChange: (theme: string) => void;
  onEmailNotificationsChange: (checked: boolean) => void;
  isLanguageLoading?: boolean;
  isThemeLoading?: boolean;
}

export default function GeneralSettings({
  userConfig,
  onLanguageChange,
  onThemeChange,
  onEmailNotificationsChange,
  isLanguageLoading = false,
  isThemeLoading = false,
}: GeneralSettingsProps) {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const navigate = useNavigate();

  const handleViewAllNotifications = () => {
    navigate('/event-manager/notifications');
  };

  return (
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
                <p className={cn('text-xs', getThemeClass('text-gray-500', 'text-gray-400'))}>
                  {t('languageDescription') || 'Chọn ngôn ngữ hiển thị'}
                </p>
              </div>
            </div>
            <Select
              value={String(userConfig.language)}
              onValueChange={onLanguageChange}
              disabled={isLanguageLoading}
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
                  getThemeClass('bg-white border-blue-200', 'bg-slate-700 border-purple-600')
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
                <p className={cn('text-xs', getThemeClass('text-gray-500', 'text-gray-400'))}>
                  {t('themeDescription') || 'Chọn giao diện sáng hoặc tối'}
                </p>
              </div>
            </div>
            <Select
              value={String(userConfig.theme)}
              onValueChange={onThemeChange}
              disabled={isThemeLoading}
            >
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
                  getThemeClass('bg-white border-purple-200', 'bg-slate-700 border-purple-600')
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
                  <p className={cn('text-xs', getThemeClass('text-gray-500', 'text-gray-400'))}>
                    {t('emailNotificationsDescription') || 'Nhận thông báo qua email'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Switch
                  id="receive-email-switch"
                  checked={userConfig.receiveEmail}
                  onCheckedChange={onEmailNotificationsChange}
                  className={
                    userConfig.receiveEmail
                      ? '!bg-green-500 !border-green-500'
                      : '!bg-red-400 !border-red-400'
                  }
                />
              </div>
            </div>
          </div>

          {/* View All Notifications Button */}
          <div
            className={cn(
              'p-4 rounded-xl border transition-all duration-200',
              getThemeClass(
                'bg-orange-50/50 border-orange-200 hover:bg-orange-50',
                'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
              )
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    getThemeClass('bg-orange-100', 'bg-slate-600')
                  )}
                >
                  <Bell
                    className={cn('w-5 h-5', getThemeClass('text-orange-600', 'text-orange-400'))}
                  />
                </div>
                <div>
                  <label
                    className={cn(
                      'block text-sm font-semibold',
                      getThemeClass('text-gray-700', 'text-gray-300')
                    )}
                  >
                    {t('notifications') || 'Thông báo'}
                  </label>
                  <p className={cn('text-xs', getThemeClass('text-gray-500', 'text-gray-400'))}>
                    {t('viewAllNotificationsDescription') || 'Xem tất cả thông báo của bạn'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleViewAllNotifications}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2',
                  getThemeClass(
                    'bg-orange-600 hover:bg-orange-700 text-white shadow-md',
                    'bg-orange-600 hover:bg-orange-700 text-white shadow-md'
                  )
                )}
              >
                {t('viewAll') || 'Xem tất cả'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

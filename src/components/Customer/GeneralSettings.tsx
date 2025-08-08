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

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">{t('userConfig')}</h2>

        <div className="space-y-6">
          {/* Language Selection */}
          <div>
            <label
              className={cn(
                'block text-xs text-white/50 ml-1 mb-1',
                getThemeClass('text-gray-600', 'text-slate-400')
              )}
            >
              {t('language')}
            </label>
            <Select
              value={String(userConfig.language)}
              onValueChange={onLanguageChange}
              disabled={isLanguageLoading}
            >
              <SelectTrigger
                className={cn(
                  'w-full justify-start text-left font-normal rounded-full border transition-all duration-200 py-2 px-3 h-auto text-sm shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:transition-all duration-200',
                  getThemeClass(
                    'border-blue-300 bg-blue-50/75 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50',
                    'border-purple-700 bg-slate-700/60 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:bg-slate-700/80'
                  )
                )}
              >
                <SelectValue placeholder={t('selectLanguage')} />
              </SelectTrigger>
              <SelectContent
                className={cn(
                  'border rounded-lg',
                  getThemeClass('bg-white border-gray-200', 'bg-slate-700 border-purple-600')
                )}
              >
                <SelectItem
                  value="0"
                  className={getThemeClass(
                    'text-gray-900 hover:bg-gray-100 focus:bg-gray-100',
                    'text-white hover:bg-slate-600 focus:bg-slate-600'
                  )}
                >
                  🇺🇸 {t('english')}
                </SelectItem>
                <SelectItem
                  value="1"
                  className={getThemeClass(
                    'text-gray-900 hover:bg-gray-100 focus:bg-gray-100',
                    'text-white hover:bg-slate-600 focus:bg-slate-600'
                  )}
                >
                  🇻🇳 {t('vietnamese')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Theme Selection */}
          <div>
            <label
              className={cn(
                'block text-xs text-white/50 ml-1 mb-1',
                getThemeClass('text-gray-600', 'text-slate-400')
              )}
            >
              {t('theme')}
            </label>
            <Select
              value={String(userConfig.theme)}
              onValueChange={onThemeChange}
              disabled={isThemeLoading}
            >
              <SelectTrigger
                className={cn(
                  'w-full justify-start text-left font-normal rounded-full border transition-all duration-200 py-2 px-3 h-auto text-sm shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:transition-all duration-200',
                  getThemeClass(
                    'border-blue-300 bg-blue-50/75 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50',
                    'border-purple-700 bg-slate-700/60 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:bg-slate-700/80'
                  )
                )}
              >
                <SelectValue placeholder={t('selectTheme')} />
              </SelectTrigger>
              <SelectContent
                className={cn(
                  'border rounded-lg',
                  getThemeClass('bg-white border-gray-200', 'bg-slate-700 border-purple-600')
                )}
              >
                <SelectItem
                  value="0"
                  className={getThemeClass(
                    'text-gray-900 hover:bg-gray-100 focus:bg-gray-100',
                    'text-white hover:bg-slate-600 focus:bg-slate-600'
                  )}
                >
                  ☀️ {t('light')}
                </SelectItem>
                <SelectItem
                  value="1"
                  className={getThemeClass(
                    'text-gray-900 hover:bg-gray-100 focus:bg-gray-100',
                    'text-white hover:bg-slate-600 focus:bg-slate-600'
                  )}
                >
                  🌙 {t('dark')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email Notifications Toggle */}
          <div>
            <label
              className={cn(
                'block text-xs text-white/50 ml-1 mb-1',
                getThemeClass('text-gray-600', 'text-slate-400')
              )}
            >
              {t('emailNotifications')}
            </label>
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
              <label
                htmlFor="receive-email-switch"
                className="text-sm text-gray-300 cursor-pointer"
              >
                {t('receiveEmailNotifications')}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

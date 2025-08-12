import React from 'react';
import { useTranslation } from 'react-i18next';
import { Frown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeClasses } from '@/hooks/useThemeClasses';

const NoResults: React.FC = () => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();

  return (
    <div className={cn('text-center py-16 px-6 rounded-lg', getThemeClass('bg-gray-100', 'bg-gray-800/50'))}>
      <Frown className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className={cn('mt-4 text-lg font-medium', getThemeClass('text-gray-900', 'text-white'))}>
        {t('allEvents.noEventsFound')}
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {t('allEvents.noEventsDescription')}
      </p>
    </div>
  );
};

export default NoResults;
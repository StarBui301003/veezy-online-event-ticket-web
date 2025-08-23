import React from 'react';
import { cn } from '@/lib/utils';
import { useThemeClasses } from '@/hooks/useThemeClasses';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  const { getThemeClass } = useThemeClasses();
  return (
    <div className="text-center sm:pt-24 pt-6 pb-12">
      <h1
        className={cn(
          'text-4xl md:text-5xl font-extrabold tracking-tight mb-4',
          getThemeClass('text-gray-900', 'text-white')
        )}
      >
        {title}
      </h1>
      <p
        className={cn('text-lg max-w-2xl mx-auto', getThemeClass('text-gray-600', 'text-gray-300'))}
      >
        {subtitle}
      </p>
    </div>
  );
};

export default PageHeader;

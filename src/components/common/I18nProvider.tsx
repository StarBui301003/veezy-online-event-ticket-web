import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
    useTranslation(); // Initialize i18n
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkI18nReady = () => {
      if (i18n.isInitialized && i18n.language) {
        setIsReady(true);
      } else {
        // Wait a bit and check again
        setTimeout(checkI18nReady, 100);
      }
    };

    checkI18nReady();
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default I18nProvider;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './locales/vi.json';
import en from './locales/en.json';

// Check localStorage for language preference
const getInitialLanguage = () => {
  try {
    if (typeof window !== 'undefined') {
      const userConfigStr = localStorage.getItem('user_config');
      if (userConfigStr) {
        const userConfig = JSON.parse(userConfigStr);
        if (userConfig.language !== undefined) {
          return userConfig.language === 1 ? 'vi' : 'en';
        }
      }
    }
  } catch (error) {
    console.error('Error reading language from localStorage:', error);
  }
     return 'en'; // Default to English
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    lng: getInitialLanguage(), // Set initial language from localStorage or default to English
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { LOGO_RECTANGLE } from '@/assets/img';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export const Footer = () => {
  const { getThemeClass } = useThemeClasses();
  const { t } = useTranslation();

  return (
    <footer
      className={cn(
        'w-full',
        getThemeClass(
          'bg-gradient-to-r from-blue-100 to-indigo-200 text-gray-900 border-t border-gray-300',
          'bg-[linear-gradient(to_bottom_right,#0B1736,#091D4B,#0B1736)] text-white'
        )
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          {/* Brand */}
          <div className="text-center lg:text-left">
            <img src={LOGO_RECTANGLE} alt="Logo" className="h-20 sm:h-24 lg:h-28 mx-auto lg:mx-0" />
            <p
              className={cn(
                'mt-4 text-sm lg:text-base',
                getThemeClass('text-gray-800', 'text-white/80')
              )}
            >
              {t('footer.tagline')}
            </p>
          </div>

          {/* Contact */}
          <div className="lg:col-span-2">
            <h4
              className={cn(
                'text-xl font-semibold text-center lg:text-left mb-6',
                getThemeClass('text-gray-900', 'text-white')
              )}
            >
              {t('footer.contact')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              <div className="flex items-start gap-3 justify-start mx-20 sm:mx-0">
                <FaMapMarkerAlt
                  className={cn(
                    'mt-1 text-lg flex-shrink-0',
                    getThemeClass('text-gray-700', 'text-white')
                  )}
                />
                <div className="text-left">
                  <p
                    className={cn(
                      'font-semibold mb-2',
                      getThemeClass('text-gray-900', 'text-white')
                    )}
                  >
                    {t('footer.address')}
                  </p>
                  <p
                    className={cn(
                      'text-sm leading-relaxed',
                      getThemeClass('text-gray-800', 'text-white/80')
                    )}
                  >
                    {t('footer.addressValue')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 justify-start mx-20 sm:mx-0">
                <FaEnvelope
                  className={cn(
                    'mt-1 text-lg flex-shrink-0',
                    getThemeClass('text-gray-700', 'text-white')
                  )}
                />
                <div className="text-left">
                  <p
                    className={cn(
                      'font-semibold mb-2',
                      getThemeClass('text-gray-900', 'text-white')
                    )}
                  >
                    {t('footer.email')}
                  </p>
                  <p className={cn('text-sm', getThemeClass('text-gray-800', 'text-white/80'))}>
                    {t('footer.emailValue')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 mb-8">
          <Separator className={getThemeClass('bg-gray-400', 'bg-white/20')} />
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p
            className={cn(
              'text-sm text-center sm:text-left',
              getThemeClass('text-gray-700', 'text-white/70')
            )}
          >
            {t('footer.copyright')}
          </p>

          <nav className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 lg:gap-x-8 gap-y-2 text-sm font-medium">
            <Link
              to="/"
              className={cn(
                'hover:underline transition-colors',
                getThemeClass('text-gray-800 hover:text-gray-900', 'text-white hover:text-white/80')
              )}
            >
              {t('footer.home')}
            </Link>
            <Link
              to="/events"
              className={cn(
                'hover:underline transition-colors',
                getThemeClass('text-gray-800 hover:text-gray-900', 'text-white hover:text-white/80')
              )}
            >
              {t('footer.event')}
            </Link>
            <Link
              to="/news"
              className={cn(
                'hover:underline transition-colors',
                getThemeClass('text-gray-800 hover:text-gray-900', 'text-white hover:text-white/80')
              )}
            >
              {t('footer.news')}
            </Link>
            <Link
              to="/terms-of-use"
              className={cn(
                'hover:underline transition-colors',
                getThemeClass('text-gray-800 hover:text-gray-900', 'text-white hover:text-white/80')
              )}
            >
              {t('footer.termsOfUse')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

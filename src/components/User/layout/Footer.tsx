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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Brand */}
          <div className="hidden sm:block text-center lg:text-left">
            <img src={LOGO_RECTANGLE} alt="Logo" className="h-16 sm:h-20 lg:h-24 mx-auto lg:mx-0" />
            <p
              className={cn(
                'mt-3 text-sm lg:text-sm',
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
                'text-lg font-semibold text-center lg:text-left mb-3',
                getThemeClass('text-gray-900', 'text-white')
              )}
            >
              {t('footer.contact')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
              <div className="flex items-start gap-3 justify-start">
                <FaMapMarkerAlt
                  className={cn(
                    'mt-0.5 text-base flex-shrink-0',
                    getThemeClass('text-gray-700', 'text-white')
                  )}
                />
                <div className="text-left">
                  <p
                    className={cn(
                      'font-semibold mb-1',
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

              <div className="flex items-start gap-3 justify-start">
                <FaEnvelope
                  className={cn(
                    'mt-0.5 text-base flex-shrink-0',
                    getThemeClass('text-gray-700', 'text-white')
                  )}
                />
                <div className="text-left">
                  <p
                    className={cn(
                      'font-semibold mb-1',
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
        <div className="mt-6 mb-6 ">
          <Separator className={getThemeClass('bg-gray-400', 'bg-white/20')} />
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p
            className={cn(
              'text-xs sm:text-sm text-center sm:text-left order-2 sm:order-1',
              getThemeClass('text-gray-700', 'text-white/70')
            )}
          >
            {t('footer.copyright')}
          </p>

          <nav className="order-1 sm:order-2 flex flex-wrap items-center justify-center sm:justify-end gap-x-4 lg:gap-x-6 gap-y-2 text-xs sm:text-sm font-medium">
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

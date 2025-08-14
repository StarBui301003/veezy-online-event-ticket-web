import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { LOGO_RECTANGLE } from '@/assets/img';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

export const Footer = () => {
  const { getThemeClass } = useThemeClasses();

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Brand */}
          <div className="text-center md:text-left">
            <img src={LOGO_RECTANGLE} alt="Logo" className="h-20 sm:h-24 md:h-28 mx-auto md:mx-0" />
            <p className={cn('mt-3 text-sm', getThemeClass('text-gray-800', 'text-white/80'))}>
              Vezzy – Tap. Book. Rock On.
            </p>
          </div>

          {/* Contact */}
          <div className="md:col-span-2">
            <h4
              className={cn(
                'text-xl font-semibold text-center md:text-left',
                getThemeClass('text-gray-900', 'text-white')
              )}
            >
              Contact
            </h4>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3 justify-center sm:justify-start">
                <FaMapMarkerAlt
                  className={cn('mt-1 text-lg', getThemeClass('text-gray-700', 'text-white'))}
                />
                <div>
                  <p className={cn('font-semibold', getThemeClass('text-gray-900', 'text-white'))}>
                    Address
                  </p>
                  <p
                    className={cn(
                      'text-sm leading-6',
                      getThemeClass('text-gray-800', 'text-white/80')
                    )}
                  >
                    600 Nguyen Van Cu Noi Dai Street, Binh Thuy Ward, Can Tho City
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 justify-center sm:justify-start">
                <FaEnvelope
                  className={cn('mt-1 text-lg', getThemeClass('text-gray-700', 'text-white'))}
                />
                <div>
                  <p className={cn('font-semibold', getThemeClass('text-gray-900', 'text-white'))}>
                    Email
                  </p>
                  <p className={cn('text-sm', getThemeClass('text-gray-800', 'text-white/80'))}>
                    support@vezzy.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-8">
            <Separator className={getThemeClass('bg-gray-400', 'bg-white/20')} />
          </div>

          {/* Bottom */}
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className={cn('text-xs', getThemeClass('text-gray-700', 'text-white/70'))}>
              © 2025 VEZZY. All rights reserved.
            </p>

            <nav className="flex flex-wrap items-center gap-x-6 sm:gap-x-10 gap-y-3 text-sm font-medium">
              <Link
                to="/"
                className={cn(
                  'hover:underline',
                  getThemeClass(
                    'text-gray-800 hover:text-gray-900',
                    'text-white hover:text-white/80'
                  )
                )}
              >
                Home
              </Link>
              <Link
                to="/events"
                className={cn(
                  'hover:underline',
                  getThemeClass(
                    'text-gray-800 hover:text-gray-900',
                    'text-white hover:text-white/80'
                  )
                )}
              >
                Event
              </Link>
              <Link
                to="/news"
                className={cn(
                  'hover:underline',
                  getThemeClass(
                    'text-gray-800 hover:text-gray-900',
                    'text-white hover:text-white/80'
                  )
                )}
              >
                News
              </Link>
              <Link
                to="/terms-of-use"
                className={cn(
                  'hover:underline',
                  getThemeClass(
                    'text-gray-800 hover:text-gray-900',
                    'text-white hover:text-white/80'
                  )
                )}
              >
                Terms of Use
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

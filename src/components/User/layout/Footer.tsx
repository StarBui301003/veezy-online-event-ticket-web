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
        'text-center',
        getThemeClass(
          'bg-gradient-to-r from-blue-100 to-indigo-200 text-gray-900 border-t border-gray-300',
          'bg-[linear-gradient(to_bottom_right,#0B1736,#091D4B,#0B1736)] text-white'
        )
      )}
    >
      <div className="wrapper mx-16 sm:px-0 pt-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-x-16 items-center text-left mb-6 gap-y-6 ml-20 mt-2">
          <div className="sm:max-w-[320px]">
            <img src={LOGO_RECTANGLE} alt="Logo" className="h-32 mb-3" />
            <p className={cn('text-sm', getThemeClass('text-gray-800', 'text-white/80'))}>
              Vezzy – Tap. Book. Rock On.
            </p>
          </div>
          <div
            className={cn(
              'text-left text-base max-w-xl',
              getThemeClass('text-gray-800', 'text-white/80')
            )}
          >
            <h4
              className={cn(
                'text-lg font-semibold mb-5',
                getThemeClass('text-gray-900', 'text-white')
              )}
            >
              Contact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-10">
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt
                  className={cn('mt-1 text-lg', getThemeClass('text-gray-700', 'text-white'))}
                />
                <div>
                  <p className={cn('font-semibold', getThemeClass('text-gray-900', 'text-white'))}>
                    Address
                  </p>
                  <p className="text-sm">
                    600 Nguyen Van Cu Noi Dai Street, Binh Thuy Ward, Can Tho City
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FaEnvelope
                  className={cn('mt-1 text-lg', getThemeClass('text-gray-700', 'text-white'))}
                />
                <div>
                  <p className={cn('font-semibold', getThemeClass('text-gray-900', 'text-white'))}>
                    Email
                  </p>
                  <p className="text-sm">support@vezzy.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

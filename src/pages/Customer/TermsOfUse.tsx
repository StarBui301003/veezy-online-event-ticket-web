import { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Brain,
  FileText,
  Lock,
  AlertCircle,
  Mail,
  MapPin,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

const TermsOfUse = () => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [scrollY, setScrollY] = useState(0);
  const [hoveredSection, setHoveredSection] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const sections = [
    {
      icon: Shield,
      title: t('acceptanceTitle'),
      content: t('acceptanceContent'),
      gradient: 'from-emerald-400 via-cyan-500 to-blue-600',
    },
    {
      icon: FileText,
      title: t('definitionsTitle'),
      content: t('definitionsContent'),
      gradient: 'from-amber-400 via-orange-500 to-red-500',
    },
    {
      icon: Users,
      title: t('userRightsTitle'),
      content: t('userRightsContent'),
      gradient: 'from-violet-400 via-purple-500 to-indigo-600',
    },
    {
      icon: Lock,
      title: t('accountSecurityTitle'),
      content: t('accountSecurityContent'),
      gradient: 'from-rose-400 via-pink-500 to-red-600',
    },
    {
      icon: Brain,
      title: t('faceRecognitionTitle'),
      content: t('faceRecognitionContent'),
      gradient: 'from-teal-400 via-cyan-500 to-blue-600',
    },
    {
      icon: AlertCircle,
      title: t('disputeResolutionTitle'),
      content: t('disputeResolutionContent'),
      gradient: 'from-orange-400 via-red-500 to-pink-600',
    },
  ];

  const Section = ({ icon: Icon, title, content, gradient, index }) => (
    <div
      className="group relative"
      onMouseEnter={() => setHoveredSection(index)}
      onMouseLeave={() => setHoveredSection(null)}
      style={{
        transform: `translateY(${scrollY * 0.015 * (index % 2 === 0 ? 1 : -1)}px) translateX(${
          Math.sin(scrollY * 0.001 + index) * 5
        }px)`,
      }}
    >
      {/* Floating glow effect */}
      <div
        className={cn(
          `absolute -inset-4 rounded-3xl blur-3xl transition-all duration-1000`,
          getThemeClass('opacity-0 group-hover:opacity-30', 'opacity-0 group-hover:opacity-20'),
          `bg-gradient-to-r ${gradient}`
        )}
        style={{
          transform: hoveredSection === index ? 'scale(1.1)' : 'scale(1)',
        }}
      ></div>

      {/* Card */}
      <div
        className={cn(
          'relative backdrop-blur-2xl border rounded-3xl p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl',
          getThemeClass(
            'bg-white/90 border-gray-200/60 hover:bg-white/95 hover:border-gray-300/80',
            'bg-gray-900/60 border-gray-700/40 hover:bg-gray-900/80 hover:border-gray-600/60'
          )
        )}
      >
        {/* Animated border */}
        <div
          className={cn(
            'absolute inset-0 rounded-3xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500',
            getThemeClass(
              'bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-emerald-400/20',
              'bg-gradient-to-r from-gray-700/40 to-gray-600/40'
            ),
            'p-2'
          )}
          style={{ padding: '2px', zIndex: -1 }}
        >
          <div
            className={cn(
              'w-full h-full backdrop-blur-2xl rounded-3xl',
              getThemeClass('bg-white/90', 'bg-gray-900/60')
            )}
          ></div>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Icon */}
          <div className="flex-shrink-0 relative">
            <div
              className={cn(
                'w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300',
                getThemeClass(
                  'bg-gradient-to-br from-blue-500 to-cyan-600',
                  'bg-gradient-to-br from-gray-800 to-gray-700'
                )
              )}
            >
              <Icon
                className={cn(
                  'w-10 h-10 drop-shadow-lg',
                  getThemeClass('text-white', 'text-white')
                )}
              />
            </div>
            {/* Floating sparkles */}
            <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-cyan-400 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <h3
                className={cn(
                  'text-2xl lg:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent',
                  getThemeClass(
                    'bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600',
                    'bg-gradient-to-r from-white via-cyan-200 to-emerald-200'
                  )
                )}
              >
                {title}
              </h3>
              <ArrowRight
                className={cn(
                  'w-6 h-6 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all duration-300',
                  getThemeClass('text-gray-600 group-hover:text-blue-600', 'text-gray-400')
                )}
              />
            </div>
            <p
              className={cn(
                'leading-relaxed text-lg whitespace-pre-line font-light transition-colors duration-300',
                getThemeClass(
                  'text-gray-700 group-hover:text-gray-800',
                  'text-gray-300 group-hover:text-gray-200'
                )
              )}
            >
              {content}
            </p>
          </div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div
            className={cn(
              'absolute top-4 right-4 w-2 h-2 rounded-full opacity-0 group-hover:opacity-60 animate-ping',
              getThemeClass('bg-blue-400', 'bg-gray-700')
            )}
          ></div>
          <div
            className={cn(
              'absolute bottom-6 left-6 w-1 h-1 rounded-full opacity-0 group-hover:opacity-80 animate-ping delay-300',
              getThemeClass('bg-cyan-400', 'bg-gray-700')
            )}
          ></div>
          <div
            className={cn(
              'absolute top-1/2 right-8 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-70 animate-ping delay-700',
              getThemeClass('bg-emerald-400', 'bg-gray-700')
            )}
          ></div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className={cn('min-h-screen', getThemeClass('bg-gray-100', 'bg-gray-900'))}
    >
      <div className="relative z-10 pt-16 pb-16">
        <div className="container mx-auto px-6 py-12">
          {/* Title Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-24"
          >
            <div className="relative inline-block">
              <motion.h2
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className={cn(
                  'text-4xl lg:text-7xl font-black mb-8 leading-tight',
                  getThemeClass(
                    'bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent',
                    'bg-gradient-to-r from-white via-cyan-200 to-emerald-200 bg-clip-text text-transparent'
                  )
                )}
              >
                {t('termsOfUse')}
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.6 }}
                className={cn(
                  'absolute -inset-8 blur-3xl animate-pulse',
                  getThemeClass(
                    'bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-emerald-400/20',
                    'bg-gradient-to-r from-emerald-400/10 via-cyan-400/10 to-blue-500/10'
                  )
                )}
              ></motion.div>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className={cn(
                'text-xl lg:text-2xl max-w-6xl mx-auto leading-relaxed font-light',
                getThemeClass('text-gray-700', 'text-gray-300')
              )}
            >
              {t('termsSubtitle')}
            </motion.p>
          </motion.div>

          {/* Main Content Container */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="max-w-7xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 1.2 }}
              className={cn(
                'backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden relative z-20',
                getThemeClass(
                  'bg-white/80 border border-gray-200/60',
                  'bg-gray-900/40 border border-gray-700/40'
                )
              )}
            >
              {/* Terms Sections */}
              <div className="p-8 lg:p-12 space-y-12">
                <AnimatePresence>
                  {sections.map((section, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.8,
                        delay: 1.5 + index * 0.2,
                        type: 'spring',
                        stiffness: 100,
                      }}
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.3 },
                      }}
                    >
                      <Section {...section} index={index} />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Contact Section */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 2.5 }}
                  className="relative group mt-16"
                >
                  <div className="absolute -inset-4 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 opacity-0 group-hover:opacity-20 blur-3xl transition-all duration-1000 rounded-3xl"></div>

                  <div
                    className={cn(
                      'relative backdrop-blur-2xl rounded-3xl p-10 group-hover:border-cyan-500/40 transition-all duration-500',
                      getThemeClass(
                        'bg-white/90 border border-gray-200/60',
                        'bg-gray-900/80 border border-gray-700/60'
                      )
                    )}
                  >
                    <div className="flex items-center justify-center mb-8">
                      <Mail className="w-8 h-8 text-cyan-400 mr-4" />
                      <h3 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                        {t('contactTitle')}
                      </h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                      <div
                        className={cn(
                          'flex flex-col items-center space-y-4 p-6 rounded-2xl backdrop-blur-sm hover:scale-105 transition-all duration-300',
                          getThemeClass(
                            'bg-gray-50/80 hover:bg-gray-100/90 border border-gray-200/60',
                            'bg-gray-800/60 hover:bg-gray-800/80 border border-gray-700/40'
                          )
                        )}
                      >
                        <Mail className="w-10 h-10 text-cyan-400" />
                        <div className="text-center">
                          <p
                            className={cn(
                              'text-sm mb-1',
                              getThemeClass('text-gray-600', 'text-gray-400')
                            )}
                          >
                            {t('email')}
                          </p>
                          <p
                            className={cn(
                              'font-medium text-lg',
                              getThemeClass('text-gray-800', 'text-gray-200')
                            )}
                          >
                            support@veezy.vn
                          </p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'flex flex-col items-center space-y-4 p-6 rounded-2xl backdrop-blur-sm hover:scale-105 transition-all duration-300',
                          getThemeClass(
                            'bg-gray-50/80 hover:bg-gray-100/90 border border-gray-200/60',
                            'bg-gray-800/60 hover:bg-gray-800/80 border border-gray-700/40'
                          )
                        )}
                      >
                        <div className="w-10 h-10 text-emerald-400 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2a10 10 0 110 20 10 10 0 010-20z" />
                            <path d="M12 6a6 6 0 100 12 6 6 0 000-12zm0 2a4 4 0 110 8 4 4 0 010-8z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p
                            className={cn(
                              'text-sm mb-1',
                              getThemeClass('text-gray-600', 'text-gray-400')
                            )}
                          >
                            {t('website')}
                          </p>
                          <p
                            className={cn(
                              'font-medium text-lg',
                              getThemeClass('text-gray-800', 'text-gray-200')
                            )}
                          >
                            wwww.vezzy.site
                          </p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'flex flex-col items-center space-y-4 p-6 rounded-2xl backdrop-blur-sm hover:scale-105 transition-all duration-300',
                          getThemeClass(
                            'bg-gray-50/80 hover:bg-gray-100/90 border border-gray-200/60',
                            'bg-gray-800/60 hover:bg-gray-800/80 border border-gray-700/40'
                          )
                        )}
                      >
                        <MapPin className="w-10 h-10 text-blue-400" />
                        <div className="text-center">
                          <p
                            className={cn(
                              'text-sm mb-1',
                              getThemeClass('text-gray-600', 'text-gray-400')
                            )}
                          >
                            {t('address')}
                          </p>
                          <p
                            className={cn(
                              'font-medium text-lg',
                              getThemeClass('text-gray-800', 'text-gray-200')
                            )}
                          >
                            {t('hoChiMinhCity')}, {t('vietnam')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Footer Note */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 3 }}
                  className={cn(
                    'text-center pt-8 border-t',
                    getThemeClass('border-gray-200/60', 'border-gray-700/50')
                  )}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 3.2 }}
                    className="flex items-center justify-center mb-4"
                  >
                    <Sparkles className="w-6 h-6 text-cyan-400 mr-3 animate-pulse" />
                    <Sparkles className="w-4 h-4 text-emerald-400 mr-3 animate-pulse delay-100" />
                    <Sparkles className="w-6 h-6 text-blue-400 animate-pulse delay-200" />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 3.4 }}
                    className={cn(
                      'italic text-lg leading-relaxed font-light max-w-4xl mx-auto',
                      getThemeClass('text-gray-600', 'text-gray-400')
                    )}
                  >
                    {t('footerNote')}
                  </motion.p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default TermsOfUse;

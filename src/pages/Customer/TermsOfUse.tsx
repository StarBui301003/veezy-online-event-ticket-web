import React, { useState, useEffect } from 'react';
import { Users, Shield, Brain, FileText, Lock, AlertCircle, Mail, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TermsOfUse = () => {
  const { t } = useTranslation();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [hoveredSection, setHoveredSection] = useState(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const sections = [
    {
      icon: Shield,
      title: t('acceptanceTitle'),
      content: t('acceptanceContent'),
      gradient: 'from-emerald-400 via-cyan-500 to-blue-600',
      shadowColor: 'shadow-emerald-500/25'
    },
    {
      icon: FileText,
      title: t('definitionsTitle'),
      content: t('definitionsContent'),
      gradient: 'from-amber-400 via-orange-500 to-red-500',
      shadowColor: 'shadow-amber-500/25'
    },
    {
      icon: Users,
      title: t('userRightsTitle'),
      content: t('userRightsContent'),
      gradient: 'from-violet-400 via-purple-500 to-indigo-600',
      shadowColor: 'shadow-violet-500/25'
    },
    {
      icon: Lock,
      title: t('accountSecurityTitle'),
      content: t('accountSecurityContent'),
      gradient: 'from-rose-400 via-pink-500 to-red-600',
      shadowColor: 'shadow-rose-500/25'
    },
    {
      icon: Brain,
      title: t('faceRecognitionTitle'),
      content: t('faceRecognitionContent'),
      gradient: 'from-teal-400 via-cyan-500 to-blue-600',
      shadowColor: 'shadow-teal-500/25'
    },
    {
      icon: AlertCircle,
      title: t('disputeResolutionTitle'),
      content: t('disputeResolutionContent'),
      gradient: 'from-orange-400 via-red-500 to-pink-600',
      shadowColor: 'shadow-orange-500/25'
    }
  ];

  const Section = ({ icon: Icon, title, content, gradient, shadowColor, index }) => (
    <div 
      className="group relative"
      onMouseEnter={() => setHoveredSection(index)}
      onMouseLeave={() => setHoveredSection(null)}
      style={{
        transform: `translateY(${scrollY * 0.015 * (index % 2 === 0 ? 1 : -1)}px) translateX(${Math.sin(scrollY * 0.001 + index) * 5}px)`
      }}
    >
      {/* Floating glow effect */}
      <div 
        className={`absolute -inset-4 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-20 blur-3xl transition-all duration-1000 rounded-3xl`}
        style={{
          transform: hoveredSection === index ? 'scale(1.1)' : 'scale(1)'
        }}
      ></div>
      
      {/* Card */}
      <div className={`relative bg-gray-900/60 backdrop-blur-2xl border border-gray-700/40 rounded-3xl p-8 transition-all duration-500 hover:bg-gray-900/80 hover:border-gray-600/60 hover:scale-[1.02] hover:${shadowColor} hover:shadow-2xl`}>
        {/* Animated border */}
        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
             style={{ padding: '2px', zIndex: -1 }}>
          <div className="w-full h-full bg-gray-900/60 backdrop-blur-2xl rounded-3xl"></div>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Icon */}
          <div className="flex-shrink-0 relative">
            <div className={`w-20 h-20 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
              <Icon className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            {/* Floating sparkles */}
            <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-cyan-400 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <h3 className={`text-2xl lg:text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                {title}
              </h3>
              <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all duration-300" />
            </div>
            <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-line font-light group-hover:text-gray-200 transition-colors duration-300">
              {content}
            </p>
          </div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className={`absolute top-4 right-4 w-2 h-2 bg-gradient-to-r ${gradient} rounded-full opacity-0 group-hover:opacity-60 animate-ping`}></div>
          <div className={`absolute bottom-6 left-6 w-1 h-1 bg-gradient-to-r ${gradient} rounded-full opacity-0 group-hover:opacity-80 animate-ping delay-300`}></div>
          <div className={`absolute top-1/2 right-8 w-1.5 h-1.5 bg-gradient-to-r ${gradient} rounded-full opacity-0 group-hover:opacity-70 animate-ping delay-700`}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Dynamic background with mouse tracking */}
      <div className="fixed inset-0">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-gray-900/40 via-slate-900/40 to-black/60"
          style={{
            transform: `translate(${mousePosition.x * 0.008}px, ${mousePosition.y * 0.008}px)`
          }}
        ></div>
        <div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(6,182,212,0.1)_0%,_transparent_70%)]"
          style={{
            transform: `translate(${-mousePosition.x * 0.005}px, ${-mousePosition.y * 0.005}px)`
          }}
        ></div>
      </div>

      {/* Animated floating orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute w-[500px] h-[500px] bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            top: '5%',
            left: '70%',
            transform: `translate(${mousePosition.x * 0.02}px, ${scrollY * 0.1}px) rotate(${scrollY * 0.05}deg)`
          }}
        ></div>
        <div 
          className="absolute w-[400px] h-[400px] bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-red-500/15 rounded-full blur-3xl animate-pulse delay-1000"
          style={{
            top: '60%',
            left: '5%',
            transform: `translate(${-mousePosition.x * 0.015}px, ${-scrollY * 0.08}px) rotate(${-scrollY * 0.03}deg)`
          }}
        ></div>
        <div 
          className="absolute w-[350px] h-[350px] bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-indigo-500/20 rounded-full blur-3xl animate-pulse delay-500"
          style={{
            top: '25%',
            left: '40%',
            transform: `translate(${mousePosition.x * 0.01}px, ${scrollY * 0.12}px) rotate(${scrollY * 0.02}deg)`
          }}
        ></div>
      </div>

      <div className="relative z-10 pt-16">
        <div className="container mx-auto px-6 py-12">
          {/* Title Section */}
          <div className="text-center mb-24">
            <div className="relative inline-block">
              <h2 className="text-4xl lg:text-7xl font-black mb-8 bg-gradient-to-r from-white via-cyan-200 to-emerald-200 bg-clip-text text-transparent leading-tight">
                {t('termsOfUse')}
              </h2>
              <div className="absolute -inset-8 bg-gradient-to-r from-emerald-400/10 via-cyan-400/10 to-blue-500/10 blur-3xl animate-pulse"></div>
            </div>
            <p className="text-xl lg:text-2xl text-gray-300 max-w-6xl mx-auto leading-relaxed font-light">
              {t('termsSubtitle')}
            </p>
          </div>

          {/* Main Content Container */}
          <div className="max-w-7xl mx-auto">
            <div className="bg-gray-900/40 backdrop-blur-2xl rounded-3xl border border-gray-700/40 shadow-2xl overflow-hidden">
              
              {/* Terms Sections */}
              <div className="p-8 lg:p-12 space-y-12">
                {sections.map((section, index) => (
                  <Section key={index} {...section} index={index} />
                ))}

                {/* Contact Section */}
                <div className="relative group mt-16">
                  <div className="absolute -inset-4 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 opacity-0 group-hover:opacity-20 blur-3xl transition-all duration-1000 rounded-3xl"></div>
                  
                  <div className="relative bg-gray-900/80 backdrop-blur-2xl border border-gray-700/60 rounded-3xl p-10 group-hover:border-cyan-500/40 transition-all duration-500">
                    <div className="flex items-center justify-center mb-8">
                      <Mail className="w-8 h-8 text-cyan-400 mr-4" />
                      <h3 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                        {t('contactTitle')}
                      </h3>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="flex flex-col items-center space-y-4 p-6 rounded-2xl bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/80 transition-all duration-300 hover:scale-105 border border-gray-700/40">
                        <Mail className="w-10 h-10 text-cyan-400" />
                        <div className="text-center">
                          <p className="text-gray-400 text-sm mb-1">{t('email')}</p>
                          <p className="text-gray-200 font-medium text-lg">support@veezy.vn</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-4 p-6 rounded-2xl bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/80 transition-all duration-300 hover:scale-105 border border-gray-700/40">
                        <div className="w-10 h-10 text-emerald-400 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2a10 10 0 110 20 10 10 0 010-20z"/>
                            <path d="M12 6a6 6 0 100 12 6 6 0 000-12zm0 2a4 4 0 110 8 4 4 0 010-8z"/>
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 text-sm mb-1">{t('website')}</p>
                          <p className="text-gray-200 font-medium text-lg">www.veezy.vn</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-4 p-6 rounded-2xl bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/80 transition-all duration-300 hover:scale-105 border border-gray-700/40">
                        <MapPin className="w-10 h-10 text-blue-400" />
                        <div className="text-center">
                          <p className="text-gray-400 text-sm mb-1">{t('address')}</p>
                          <p className="text-gray-200 font-medium text-lg">{t('hoChiMinhCity')}, {t('vietnam')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="text-center pt-8 border-t border-gray-700/50">
                  <div className="flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-cyan-400 mr-3 animate-pulse" />
                    <Sparkles className="w-4 h-4 text-emerald-400 mr-3 animate-pulse delay-100" />
                    <Sparkles className="w-6 h-6 text-blue-400 animate-pulse delay-200" />
                  </div>
                  <p className="text-gray-400 italic text-lg leading-relaxed font-light max-w-4xl mx-auto">
                    {t('footerNote')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
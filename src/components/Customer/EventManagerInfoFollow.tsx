import { useEffect, useState } from 'react';
import { getUserByIdAPI } from '@/services/Admin/user.service';
import {
  followEventManager,
  unfollowEventManager,
  checkFollowEventManager,
} from '@/services/follow.service';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LoginModal } from '@/components/common/LoginModal';
import { RegisterModal } from '@/components/RegisterModal';
import { NO_AVATAR } from '@/assets/img';
import type { User } from '@/types/auth';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

interface EventManagerInfoFollowProps {
  eventManagerId: string; // Có thể là userId hoặc accountId truyền vào, nhưng sẽ fetch info để lấy accountId
}

const EventManagerInfoFollow: React.FC<EventManagerInfoFollowProps> = ({ eventManagerId }) => {
  // Thêm hook kiểm tra đăng nhập
  // Use local state for login modal
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [pendingFollow, setPendingFollow] = useState(false);
  const [info, setInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();

  useEffect(() => {
    if (!eventManagerId) {
      return;
    }
    setLoading(true);

    getUserByIdAPI(eventManagerId)
      .then((userInfo) => {
        setInfo(userInfo);
      })
      .catch(() => {
        setInfo(null);
      })
      .finally(() => setLoading(false));
  }, [eventManagerId]);

  useEffect(() => {
    if (!info?.accountId) {
      return;
    }

    checkFollowEventManager(info.accountId)
      .then((res) => {
        setIsFollowing(!!res);
      })
      .catch(() => {
        setIsFollowing(false);
      });
  }, [info?.accountId]);

  const handleFollow = async () => {
    // Only run follow logic if logged in, otherwise show login modal
    const accStr = localStorage.getItem('account');
    let isLoggedIn = false;
    if (accStr) {
      try {
        const accObj = JSON.parse(accStr);
        isLoggedIn = !!(accObj?.userId || accObj?.account?.userId);
      } catch {
        isLoggedIn = false;
      }
    }
    if (!isLoggedIn) {
      setPendingFollow(true);
      setShowLoginModal(true);
      return;
    }
    if (!info?.accountId) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowEventManager(info.accountId);
        setIsFollowing(false);
      } else {
        await followEventManager(info.accountId);
        setIsFollowing(true);
      }
    } catch {
      /* empty */
    } finally {
      setFollowLoading(false);
    }
  };

  const handleNavigateToProfile = () => {
    if (!info) {
      return;
    }

    // Try to use userId first, fallback to accountId if needed
    const userId = info.userId || info.accountId || eventManagerId;

    if (!userId) {
      return;
    }

    navigate(`/event-manager/${userId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading || !info) return null;

  return (
    <div className="relative mt-6 mb-4 group">
      {/* Animated Background Gradient */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl opacity-75 blur-sm group-hover:opacity-100 group-hover:blur-none transition-all duration-500 animate-pulse',
          getThemeClass(
            'bg-gradient-to-r from-blue-500 to-cyan-400',
            'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600'
          )
        )}
      ></div>
      {/* Main Card */}
      <div
        className={cn(
          'relative rounded-2xl p-3 sm:p-4 md:p-6 shadow-2xl backdrop-blur-sm transform hover:scale-[1.02] transition-all duration-300 ease-out',
          getThemeClass(
            'bg-white/95 border border-gray-200/60',
            'bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50'
          )
        )}
      >
        {/* Header Label */}
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div
            className={cn(
              'w-2 h-2 rounded-full animate-pulse',
              getThemeClass(
                'bg-gradient-to-r from-blue-400 to-cyan-400',
                'bg-gradient-to-r from-purple-400 to-pink-400'
              )
            )}
          ></div>
          <span
            className={cn(
              'text-xs sm:text-sm font-medium text-transparent bg-clip-text uppercase tracking-wider',
              getThemeClass(
                'bg-gradient-to-r from-blue-600 to-cyan-600',
                'bg-gradient-to-r from-purple-400 to-pink-400'
              )
            )}
          >
            {t('eventManager')}
          </span>
          <div
            className={cn(
              'flex-1 h-px',
              getThemeClass(
                'bg-gradient-to-r from-blue-400/30 to-transparent',
                'bg-gradient-to-r from-purple-400/30 to-transparent'
              )
            )}
          ></div>
        </div>
        {/* Content */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
          {/* Avatar Container */}
          <div className="relative group/avatar">
            <div
              className={cn(
                'absolute inset-0 rounded-full animate-spin-slow opacity-75 blur-sm group-hover/avatar:opacity-100 transition-opacity duration-300',
                getThemeClass(
                  'bg-gradient-to-r from-blue-400 to-cyan-400',
                  'bg-gradient-to-r from-purple-400 to-pink-400'
                )
              )}
            ></div>
            <img
              src={info.avatarUrl || NO_AVATAR}
              alt={info.fullName || 'avatar'}
              className={cn(
                'relative w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover cursor-pointer border-2 backdrop-blur-sm transform hover:scale-110 transition-all duration-300 shadow-xl',
                getThemeClass('border-white/20', 'border-white/20')
              )}
              onClick={handleNavigateToProfile}
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300"></div>
          </div>
          {/* Info Section */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div
              className={cn(
                'font-bold text-base sm:text-lg cursor-pointer transition-all duration-300 transform hover:scale-105 break-words',
                getThemeClass(
                  'text-gray-800 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600',
                  'text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-purple-400 hover:to-pink-400'
                )
              )}
              onClick={handleNavigateToProfile}
            >
              {info.fullName || 'Event Manager'}
            </div>
            <div
              className={cn(
                'text-xs sm:text-sm mt-1 opacity-0 animate-fade-in-up',
                getThemeClass('text-gray-700', 'text-slate-400')
              )}
            >
              {t('clickToViewDetails')}
            </div>
          </div>
          {/* Follow Button */}
          <div className="relative w-full sm:w-auto">
            <Button
              variant={isFollowing ? 'secondary' : 'default'}
              className={cn(
                'w-full sm:min-w-[120px] relative overflow-hidden font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4',
                isFollowing
                  ? getThemeClass(
                      'bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-700 border-gray-400',
                      'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white border-slate-500'
                    )
                  : getThemeClass(
                      'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-blue-500 shadow-lg hover:shadow-blue-500/25',
                      'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-purple-500 shadow-lg hover:shadow-purple-500/25'
                    )
              )}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {/* Button Background Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              {/* Button Content */}
              <span className="relative z-10">
                {followLoading ? (
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-xs sm:text-sm">{t('processing')}</span>
                  </div>
                ) : isFollowing ? (
                  <span className="text-xs sm:text-sm">{t('unfo')}</span>
                ) : (
                  <span className="text-xs sm:text-sm">{t('eventDetail.followevent')}</span>
                )}
              </span>
            </Button>
          </div>
        </div>
        {/* Decorative Elements */}
        <div
          className={cn(
            'absolute top-2 right-2 w-2 h-2 rounded-full animate-ping',
            getThemeClass(
              'bg-gradient-to-r from-blue-400 to-cyan-400',
              'bg-gradient-to-r from-purple-400 to-pink-400'
            )
          )}
        ></div>
        <div
          className={cn(
            'absolute bottom-2 left-2 w-1 h-1 rounded-full animate-pulse',
            getThemeClass('bg-blue-400', 'bg-blue-400')
          )}
        ></div>
      </div>
      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out 0.5s forwards;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
      {/* Modal đăng nhập */}
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={async () => {
          setShowLoginModal(false);
          if (pendingFollow && info?.accountId) {
            setPendingFollow(false);
            setFollowLoading(true);
            try {
              await followEventManager(info.accountId);
              setIsFollowing(true);
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
              // empty
            } finally {
              setFollowLoading(false);
            }
          }
        }}
        onRegisterRedirect={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />
      {showRegisterModal && (
        <RegisterModal
          open={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onRegisterSuccess={() => setShowRegisterModal(false)}
          onLoginRedirect={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      )}
    </div>
  );
};

export default EventManagerInfoFollow;

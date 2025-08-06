import { useEffect, useState } from 'react';
import { getUserByIdAPI } from '@/services/Admin/user.service';
import { followEventManager, unfollowEventManager, checkFollowEventManager } from '@/services/follow.service';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useRequireLogin } from '@/hooks/useRequireLogin';
import { LoginModal } from '@/components/common/LoginModal';
import { NO_AVATAR } from '@/assets/img';
import type { User } from '@/types/auth';
import { useTranslation } from 'react-i18next';

interface EventManagerInfoFollowProps {
  eventManagerId: string; // Có thể là userId hoặc accountId truyền vào, nhưng sẽ fetch info để lấy accountId
}

const EventManagerInfoFollow: React.FC<EventManagerInfoFollowProps> = ({ eventManagerId }) => {
  // Thêm hook kiểm tra đăng nhập
  const { showLoginModal, setShowLoginModal } = useRequireLogin();
  const [info, setInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!eventManagerId) {
      console.error('No eventManagerId provided to EventManagerInfoFollow');
      return;
    }
    setLoading(true);
    console.log('Fetching user info for ID:', eventManagerId);
    
    getUserByIdAPI(eventManagerId)
      .then(userInfo => {
        console.log('Fetched user info:', userInfo);
        setInfo(userInfo);
      })
      .catch(error => {
        console.error('Error fetching user info:', error);
        setInfo(null);
      })
      .finally(() => setLoading(false));
  }, [eventManagerId]);

  useEffect(() => {
    if (!info?.accountId) {
      console.log('No accountId available for follow check');
      return;
    }
    console.log('Checking follow status for accountId:', info.accountId);
    
    checkFollowEventManager(info.accountId)
      .then(res => {
        console.log('Follow status:', res);
        setIsFollowing(!!res);
      })
      .catch(error => {
        console.error('Error checking follow status:', error);
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
    } catch (error) {
      console.error('Error handling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleNavigateToProfile = () => {
    if (!info) {
      console.error('User info is not available');
      return;
    }
    
    // Try to use userId first, fallback to accountId if needed
    const userId = info.userId || info.accountId || eventManagerId;
    
    if (!userId) {
      console.error('No valid user ID available for navigation');
      console.log('Available user info:', info);
      return;
    }
    
    console.log('Navigating to profile with ID:', userId);
    navigate(`/event-manager/${userId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading || !info) return null;

  return (
    <div className="relative mt-6 mb-4 group">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl opacity-75 blur-sm group-hover:opacity-100 group-hover:blur-none transition-all duration-500 animate-pulse"></div>
      {/* Main Card */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700/50 backdrop-blur-sm transform hover:scale-[1.02] transition-all duration-300 ease-out">
        {/* Header Label */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase tracking-wider">
            {t('eventManager')}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-purple-400/30 to-transparent"></div>
        </div>
        {/* Content */}
        <div className="flex items-center gap-4">
          {/* Avatar Container */}
          <div className="relative group/avatar">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-spin-slow opacity-75 blur-sm group-hover/avatar:opacity-100 transition-opacity duration-300"></div>
            <img
              src={info.avatarUrl || NO_AVATAR}
              alt={info.fullName || 'avatar'}
              className="relative w-16 h-16 rounded-full object-cover cursor-pointer border-2 border-white/20 backdrop-blur-sm transform hover:scale-110 transition-all duration-300 shadow-xl"
              onClick={handleNavigateToProfile}
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300"></div>
          </div>
          {/* Info Section */}
          <div className="flex-1 min-w-0">
            <div
              className="font-bold text-lg text-white cursor-pointer truncate hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-purple-400 hover:to-pink-400 transition-all duration-300 transform hover:scale-105"
              onClick={handleNavigateToProfile}
            >
              {info.fullName || 'Event Manager'}
            </div>
            <div className="text-sm text-slate-400 mt-1 opacity-0 animate-fade-in-up">
              {t('clickToViewDetails')}
            </div>
          </div>
          {/* Follow Button */}
          <div className="relative">
            <Button
              variant={isFollowing ? 'secondary' : 'default'}
              className={
                `min-w-[120px] relative overflow-hidden font-medium transition-all duration-300
                ${isFollowing 
                  ? 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white border-slate-500' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-purple-500 shadow-lg hover:shadow-purple-500/25'
                }
                transform hover:scale-105 active:scale-95`
              }
              onClick={handleFollow}
              disabled={followLoading}
            >
              {/* Button Background Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              {/* Button Content */}
              <span className="relative z-10">
                {followLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{t('processing')}</span>
                  </div>
                ) : (
                  isFollowing ? t('unfollow') : t('follow')
                )}
              </span>
            </Button>
          </div>
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-2 left-2 w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
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
          // After login, perform follow action only if not following
          if (!isFollowing && info?.accountId) {
            setFollowLoading(true);
            try {
              await followEventManager(info.accountId);
              setIsFollowing(true);
            } catch (error) {
              console.error('Error handling follow after login:', error);
            } finally {
              setFollowLoading(false);
            }
          }
        }}
      />
    </div>
  );
}

export default EventManagerInfoFollow;
import { LOGO } from '@/assets/img';
import wallpaperLogin from '@/assets/img/wallpaper_login.jpg';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { loginAPI } from '@/services/auth.service';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { IoReturnUpBackOutline } from 'react-icons/io5';
import {
  validateUsername,
  validatePassword,
  parseBackendErrors,
  getFieldError,
  hasFieldError,
  type FieldErrors,
} from '@/utils/validation';
import { FiCamera } from 'react-icons/fi';
import FaceCapture from '@/components/common/FaceCapture';
import { loginByFaceAPI } from '@/services/auth.service';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import { getHomeEvents } from '@/services/Event Manager/event.service';
import SpinnerOverlay from '@/components/SpinnerOverlay';

interface EventData {
  eventId: string;
  eventName: string;
  eventCoverImageUrl: string;
}

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [faceError, setFaceError] = useState('');
  const navigate = useNavigate();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventData[]>([]);
  const [eventLoading, setEventLoading] = useState(true);

  useEffect(() => {
    // Đặt kiểm tra này ở đầu useEffect để tránh render UI khi đã đăng nhập
    const accStr = localStorage.getItem('account');
    const accessToken = localStorage.getItem('access_token');
    if (accStr && accessToken) {
      try {
        const accObj = JSON.parse(accStr);
        if (accObj && typeof accObj.role === 'number') {
          if (accObj.role === 0) {
            navigate('/admin');
            return;
          }
          if (accObj.role === 2) {
            navigate('/');
            return;
          }

          navigate('/');
          return;
        }
      } catch {
        localStorage.removeItem('account');
      }
    }
    // ...các logic khác như remembered username...
    const remembered = localStorage.getItem('remembered_username');
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    } else {
      setRememberMe(false);
      // Nếu không có remembered_username thì xóa khỏi localStorage (phòng trường hợp user đã xóa trước đó)
      localStorage.removeItem('remembered_username');
    }
  }, [navigate]);

  useEffect(() => {
    async function fetchEvents() {
      setEventLoading(true);
      try {
        const fetchedEvents = await getHomeEvents();
        if (Array.isArray(fetchedEvents)) {
          setEvents(
            fetchedEvents.map((e) => ({
              eventId: e.eventId,
              eventName: e.eventName,
              eventCoverImageUrl: e.eventCoverImageUrl,
            }))
          );
        } else {
          setEvents([]);
        }
      } finally {
        setEventLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const handleLogin = async () => {
    // Clear previous errors
    setFieldErrors({});

    // Frontend validation
    const newFieldErrors: FieldErrors = {};

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      newFieldErrors.username = [usernameValidation.errorMessage!];
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newFieldErrors.password = [passwordValidation.errorMessage!];
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setLoading(true);
    try {
      const data = { username, password };
      const apiResult = await loginAPI(data);

      if (!apiResult.data || !apiResult.data.accessToken) {
        toast.error('Login failed: No access token received!', { position: 'top-right' });
        setLoading(false);
        return;
      }

      localStorage.setItem('access_token', apiResult.data.accessToken);
      localStorage.setItem('customerId', apiResult.data.account.userId);
      // Set refresh token cookie (remove secure flag for development)
      document.cookie = `refresh_token=${
        apiResult.data.refreshToken
      }; path=/; samesite=lax; max-age=${7 * 24 * 60 * 60}`;

      const {
        userConfig,
        accountId,
        avatar,
        email,
        gender,
        phone,
        role,
        userId,
        username: accountUsername,
      } = apiResult.data.account;

      if (userConfig !== undefined) {
        localStorage.setItem('user_config', JSON.stringify(userConfig));
      } else {
        localStorage.removeItem('user_config');
      }
      const minimalAccount = {
        accountId,
        avatar,
        email,
        gender,
        phone,
        role,
        userId,
        username: accountUsername,
      };
      localStorage.setItem('account', JSON.stringify(minimalAccount));

      if (rememberMe) {
        localStorage.setItem('remembered_username', username);
      } else {
        localStorage.removeItem('remembered_username');
      }

      // Thông báo và điều hướng theo role
      let welcomeMsg = `Welcome ${accountUsername}!`;
      let redirectPath = '/';
      if (role === 0) {
        welcomeMsg = `Welcome admin ${accountUsername}!`;
        redirectPath = '/admin';
      } else if (role === 2) {
        welcomeMsg = `Welcome event manager ${accountUsername}!`;
        redirectPath = '/event-manager';
      }
      toast.success(welcomeMsg, { position: 'top-right' });
      navigate(redirectPath, { replace: true });
    } catch (error: unknown) {
      // Parse backend errors
      const { fieldErrors: backendFieldErrors, generalErrors: backendGeneralErrors } =
        parseBackendErrors(error);

      // Set errors to display inline
      setFieldErrors(backendFieldErrors);

      // Show toast for general errors
      if (backendGeneralErrors.length > 0) {
        toast.error(backendGeneralErrors[0], { position: 'top-right' });
      } else if (Object.keys(backendFieldErrors).length > 0) {
        toast.error('Please check your input fields', { position: 'top-right' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLogin = async ({ image }: { image: Blob }) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('FaceImage', image, 'face.jpg');
      const apiResult = await loginByFaceAPI(formData);

      if (!apiResult.data || !apiResult.data.accessToken) {
        toast.error('Face login failed: No access token received!', { position: 'top-right' });
        setLoading(false);
        return;
      }

      localStorage.setItem('access_token', apiResult.data.accessToken);
      localStorage.setItem('customerId', apiResult.data.account.userId);
      document.cookie = `refresh_token=${apiResult.data.refreshToken}; path=/; secure; samesite=strict`;

      const {
        userConfig,
        accountId,
        avatar,
        email,
        gender,
        phone,
        role,
        userId,
        username: accountUsername,
      } = apiResult.data.account;

      if (userConfig !== undefined) {
        localStorage.setItem('user_config', JSON.stringify(userConfig));
      } else {
        localStorage.removeItem('user_config');
      }
      const minimalAccount = {
        accountId,
        avatar,
        email,
        gender,
        phone,
        role,
        userId,
        username: accountUsername,
      };
      localStorage.setItem('account', JSON.stringify(minimalAccount));

      if (rememberMe) {
        localStorage.setItem('remembered_username', username);
      } else {
        localStorage.removeItem('remembered_username');
      }

      // Thông báo và điều hướng theo role
      let welcomeMsg = `Welcome ${accountUsername}!`;
      let redirectPath = '/';
      if (role === 0) {
        welcomeMsg = `Welcome admin ${accountUsername}!`;
        redirectPath = '/admin';
      } else if (role === 2) {
        welcomeMsg = `Welcome event manager ${accountUsername}!`;
        redirectPath = '/event-manager';
      }
      toast.success(welcomeMsg, { position: 'top-right' });
      navigate(redirectPath, { replace: true });
    } catch (error: unknown) {
      let errorMessage = 'Face login failed.';
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: unknown }).response === 'object' &&
        (error as { response: { data?: unknown } }).response?.data &&
        typeof (error as { response: { data?: unknown } }).response.data === 'object'
      ) {
        const data = (error as { response: { data: Record<string, unknown> } }).response.data;
        if (data.errors && typeof data.errors === 'object') {
          errorMessage = Object.values(data.errors).flat().join('\n');
        } else if (typeof data.message === 'string') {
          errorMessage = data.message;
        }
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        errorMessage = (error as { message: string }).message;
      }
      toast.error(errorMessage, { position: 'top-right' });
    } finally {
      setLoading(false);
      setShowFaceCapture(false);
    }
  };

  if (eventLoading) {
    return <SpinnerOverlay show={true} />;
  }

  return (
    <>
      <div className="absolute inset-0 -z-10  bg-gradient-to-br from-[#193c8f] via-[#1e4a9e] to-[#0f2d5f] min-h-screen w-full" />
      {/* Back to Home button */}
      <div
        className="fixed top-6 left-6 z-20 flex items-center gap-2 bg-white text-[#091D4B] px-4 py-2 rounded-full shadow cursor-pointer hover:bg-blue-50 transition"
        onClick={() => navigate('/')}
        style={{ userSelect: 'none' }}
      >
        <IoReturnUpBackOutline className="w-6 h-6" />
        <span className="font-semibold text-[16px]">Back to Home</span>
      </div>
      <div className="min-h-screen text-white flex relative">
        {/* Left Side - Welcome Section */}
        <div className="flex-1 relative overflow-hidden">
          {/* Swiper Background */}
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            slidesPerView={1}
            loop={events.length > 1}
            pagination={{ clickable: true }}
            navigation={true}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            className="absolute inset-0 w-full h-full z-30"
          >
            {events.length > 0 ? (
              events.slice(0, 5).map((event) => (
                <SwiperSlide key={event.eventId}>
                  <div className="w-full h-full relative">
                    {/* Ảnh nền */}
                    <div
                      className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${event.eventCoverImageUrl})` }}
                    />
                    {/* Overlay đen + gradient */}
                    <div className="absolute inset-0 bg-black/60" />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40" />
                    {/* Tên event */}
                    <div className="absolute bottom-8 left-8 bg-black/60 px-6 py-3 rounded-xl shadow-lg z-10">
                      <div className="text-2xl font-bold text-white drop-shadow-lg">
                        {event.eventName}
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))
            ) : (
              <SwiperSlide>
                <div className="w-full h-full relative">
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${wallpaperLogin})` }}
                  />
                  <div className="absolute inset-0 bg-black/60" />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40" />
                </div>
              </SwiperSlide>
            )}
          </Swiper>

          {/* Content */}
          <div className="relative h-full flex flex-col justify-center items-start px-16 py-20 z-30">
            {/* Main Content */}
            <div className="max-w-md">
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                Hello,
                <br />
                welcome!
              </h1>

              <p className="text-white/70 text-lg mb-8 leading-relaxed">
                Join thousands of event organizers and attendees. Create unforgettable experiences
                and discover amazing events near you.
              </p>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
            <div className="absolute bottom-40 right-40 w-20 h-20 bg-purple-500/10 rounded-full blur-lg"></div>
            <div className="absolute top-1/2 right-10 w-16 h-16 bg-blue-500/10 rounded-full blur-md"></div>
          </div>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-[380px]">
              <img src={LOGO} alt="Logo" className="w-full h-auto invert brightness-0" />
            </div>

            <div className="mt-6 flex flex-col gap-4 items-center">
              <div className="w-[380px] text-[#A1A1AA] text-[24px]">
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    // Clear field error when user starts typing
                    if (hasFieldError(fieldErrors, 'username')) {
                      setFieldErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.username;
                        return newErrors;
                      });
                    }
                  }}
                  className={`rounded-full border border-transparent focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-white/5 text-white/50 shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-5 placeholder:text-white/50 text-lg ${
                    hasFieldError(fieldErrors, 'username') ? 'border-red-500' : ''
                  }`}
                  autoComplete="username"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLogin();
                  }}
                />
                {getFieldError(fieldErrors, 'username') && (
                  <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                    {getFieldError(fieldErrors, 'username')}
                  </div>
                )}
              </div>
              <div className="mt-4 w-[380px] text-[#A1A1AA] text-[24px]">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      // Clear field error when user starts typing
                      if (hasFieldError(fieldErrors, 'password')) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.password;
                          return newErrors;
                        });
                      }
                    }}
                    className={`rounded-full border border-transparent focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-white/5 text-white/50 shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-5 pr-12 placeholder:text-white/50 text-lg ${
                      hasFieldError(fieldErrors, 'password') ? 'border-red-500' : ''
                    }`}
                    autoComplete="current-password"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLogin();
                    }}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent outline-none focus:outline-none border-none z-10"
                    style={{ isolation: 'isolate' }}
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-[#A1A1AA]" />
                    ) : (
                      <Eye className="w-5 h-5 text-[#A1A1AA]" />
                    )}
                  </button>
                </div>
                {getFieldError(fieldErrors, 'password') && (
                  <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                    {getFieldError(fieldErrors, 'password')}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center gap-4 mt-6 ">
              <div className="flex gap-x-2 items-center pl-3">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="border-none focus:outline-none rounded-none bg-white/5 text-[#A1A1AA]"
                />
                <div>{t('rememberMe')}</div>
              </div>
              <Link to="/reset-password" className="text-[#60A5FA] hover:underline">
                {t('forgotPassword')}
              </Link>
            </div>
            <Button
              onClick={handleLogin}
              className="bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white px-6 w-[380px] rounded-full py-6 text-[20px] mt-12 shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin w-6 h-6" />
                  {t('loggingIn')}
                </span>
              ) : (
                t('login')
              )}
            </Button>
            {/* OR Divider */}
            <div className="flex items-center w-[380px] my-4">
              <div className="flex-grow h-px bg-gray-300" />
              <span className="mx-4 text-gray-400 font-semibold text-lg select-none">
                {t('or')}
              </span>
              <div className="flex-grow h-px bg-gray-300" />
            </div>
            <Button
              onClick={() => setShowFaceCapture(true)}
              className="w-[380px] flex items-center justify-center gap-3 py-6 rounded-full font-semibold text-white text-lg bg-gradient-to-r from-[#7B8FFF] to-[#6A5ACD] shadow-md hover:from-[#6A5ACD] hover:to-[#7B8FFF] transition-all duration-200 border-0 mt-0"
              style={{ boxShadow: '0 4px 16px 0 rgba(122, 144, 255, 0.15)' }}
            >
              <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <FiCamera className="text-[#6A5ACD] text-lg" />
              </span>
              <span>Login with Face</span>
            </Button>
            {faceError && (
              <div className="text-red-500 mt-3 text-center text-base font-medium">{faceError}</div>
            )}
            {showFaceCapture && (
              <FaceCapture
                onCapture={handleFaceLogin}
                onError={setFaceError}
                onCancel={() => setShowFaceCapture(false)}
              />
            )}
            <div className="mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#60A5FA] hover:underline">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
      <SpinnerOverlay show={loading} />
    </>
  );
};

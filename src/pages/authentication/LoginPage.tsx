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

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const navigate = useNavigate();

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

  return (
    <>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,_#091D4B_50%,_#0B1736_50%)] min-h-screen w-full" />
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
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${wallpaperLogin})`,
            }}
          ></div>
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/60"></div>
          {/* Blue Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40"></div>

          {/* Content */}
          <div className="relative h-full flex flex-col justify-center items-start px-16 py-20">
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
                  className={`rounded-full border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-5 ${
                    hasFieldError(fieldErrors, 'username') ? 'border-red-500 border-2' : ''
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
                    className={`rounded-full border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-5 pr-12 ${
                      hasFieldError(fieldErrors, 'password') ? 'border-red-500 border-2' : ''
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
                <div>Remember me</div>
              </div>
              <Link to="/reset-password" className="text-[#60A5FA] hover:underline">
                Forgot password?
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
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
            </Button>
            {/* <div className="w-full flex justify-center">
              <div className="flex items-center text-gray-400 text-sm my-6">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 text-[#60A5FA] ">or</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
            </div>
            <Button className="bg-[#D9D9D9] hover:bg-[#bdbdbd] text-black font-normal px-6 w-[380px] rounded-[8px] py-6 text-[20px] mt-2 transition-colors">
              <div className="flex gap-4 items-center">
                <img src={GG_ICON} alt="Google Icon" className="w-6 h-6" />
                <div>Login with Google</div>
              </div>
            </Button> */}
            <div className="mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#60A5FA] hover:underline">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

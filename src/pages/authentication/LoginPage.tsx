import { LOGO } from '@/assets/img';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { loginAPI } from '@/services/auth.service';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    try {
      const data = { username, password };
      const apiResult = await loginAPI(data);

      if (!apiResult.data || !apiResult.data.accessToken) {
        toast.error('Đăng nhập thất bại, không nhận được access token!');
        setLoading(false);
        return;
      }

      localStorage.setItem('access_token', apiResult.data.accessToken);
      localStorage.setItem('customerId', apiResult.data.account.userId);
      document.cookie = `refresh_token=${apiResult.data.refreshToken}; path=/; secure; samesite=strict`;

      // Tách userConfig, account
      const {
        userConfig,
        accountId,
        avatar,
        email,
        gender,
        phone,
        role,
        userId,
        username: accountUsername, // Đổi tên để tránh conflict
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

      // Nếu là admin thì chuyển sang trang admin
      if (role === 0) {
        toast.success(`Welcome admin ${accountUsername}!`, {
          position: 'top-right',
        });
        navigate('/admin', { replace: true });
        return;
      }
      // Nếu là Event Manager thì chuyển sang dashboard Event Manager
      if (role === 2) {
        toast.success(`Welcome ${accountUsername}!`, {
          position: 'top-right',
        });
        navigate('/event-manager', { replace: true });
        return;
      }
      toast.success(`Welcome ${accountUsername}!`, {
        position: 'top-right',
      });
      navigate('/', { replace: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      let errorMessage = 'Invalid username or password.';
      if (
        error &&
        error.response &&
        error.response.data &&
        typeof error.response.data.message === 'string'
      ) {
        errorMessage = error.response.data.message;
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string'
      ) {
        errorMessage = error.message;
      }
      toast.error(errorMessage, {
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,_#091D4B_50%,_#0B1736_50%)] min-h-screen w-full" />
      <div className="min-h-screen text-white flex relative">
        <div className="flex-1"></div>
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-[380px] invert brightness-0">
              <img src={LOGO} alt="Logo" className="w-full h-auto" />
            </div>
            <div className="mt-6 flex flex-col gap-4 items-center">
              <div className="w-[380px] text-[#A1A1AA] text-[24px]">
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-3"
                  autoComplete="username"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLogin();
                  }}
                />
              </div>
              <div className="mt-4 w-[380px] text-[#A1A1AA] text-[24px] relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-3 pr-12"
                  autoComplete="current-password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLogin();
                  }}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] bg-transparent outline-none focus:outline-none border-none "
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center gap-4 mt-6 ">
              <div className="flex gap-x-2 items-center ">
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
              className="bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white px-6 w-[380px] rounded-[8px] py-6 text-[20px] mt-[46px]"
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

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useEffect, useState } from 'react';
import { format } from 'date-fns-tz';
import { Link, useNavigate } from 'react-router-dom';
import { AiOutlineCalendar } from 'react-icons/ai';
import { Eye, EyeOff } from 'lucide-react';
import { RegisterAPI } from '@/services/auth.service';
import { toast } from 'react-toastify';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

export const Register = () => {
  const [date, setDate] = useState<Date>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!username || !fullName || !email || !password || !confirmPassword || !date) {
      toast.error('Please fill all fields!');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    setLoading(true);
    try {
      const dateOfBirth = format(date, 'yyyy-MM-dd', { timeZone: 'Asia/Ho_Chi_Minh' });
      const response = await RegisterAPI({
        username,
        fullName,
        email,
        phone,
        password,
        dateOfBirth,
        role: 1,
      });
      sessionStorage.setItem('registerEmail', email);

      if (response && response.flag && response.code === 200) {
        toast.success('Register successful! Please verify your email.');
        navigate('/verify-email');
      } else {
        toast.error(response?.message || 'Register failed!');
      }
    } catch {
      toast.error('Register failed!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const accStr = localStorage.getItem('account');
    if (accStr) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,_#091D4B_50%,_#0B1736_50%)] min-h-screen w-full" />
      <div className="min-h-screen text-white flex relative">
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="text-[38px] text-bold pb-6">Create Your Veezy Account</div>
            <div className="mt-6 flex flex-col gap-4 items-center">
              <div className="w-[380px] text-[#A1A1AA] text-[24px]">
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-3"
                />
              </div>
              <div className="mt-4 w-[380px] text-[#A1A1AA] text-[24px]">
                <Input
                  type="text"
                  placeholder="Fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-3"
                />
              </div>
              <div className="mt-4 w-[380px] text-[#A1A1AA] text-[24px]">
                <Input
                  type="text"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-3"
                />
              </div>
              <div className="mt-4 w-[380px] text-[#A1A1AA] text-[24px]">
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-3"
                />
              </div>
              <div className="mt-4 w-[380px] text-[#A1A1AA] text-[24px] relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-3 pr-12"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] bg-transparent outline-none focus:outline-none border-none"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-4 w-[380px] text-[#A1A1AA] text-[24px] relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-3 pr-12"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] bg-transparent outline-none focus:outline-none border-none"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="mt-4 w-[380px] text-[#A1A1AA] text-[24px]">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative w-full">
                      <Input
                        readOnly
                        value={date ? format(date, 'dd/MM/yyyy') : ''}
                        placeholder="Day of Birth"
                        className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-3 pr-12 text-left cursor-pointer"
                      />
                      <AiOutlineCalendar
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#A1A1AA] pointer-events-none"
                        size={24}
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    sideOffset={30}
                    className="w-auto p-0 bg-white text-black rounded-md shadow-md"
                  >
                    <DayPicker
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      captionLayout="dropdown"
                      fromYear={1950}
                      toYear={2025}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button
              onClick={handleRegister}
              disabled={loading}
              className="bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white px-6 w-[380px] rounded-[8px] py-6 text-[20px] mt-[46px]"
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </Button>

            <div className="mt-6 text-start w-[380px] mx-auto">
              Already have an account?{' '}
              <Link to="/login" className="text-[#60A5FA] hover:underline">
                Login
              </Link>
            </div>
          </div>
        </div>
        <div className="flex-1"></div>
      </div>
    </>
  );
};

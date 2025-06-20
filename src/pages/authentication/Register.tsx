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
import RegisterChooseRoleModal from '@/components/Admin/Modal/RegisterChooseRoleModal';

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
  const [role, setRole] = useState<number | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(true);

  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!role) {
      setShowRoleModal(true);
      toast.error('Please choose your role!');
      return;
    }
    if (!username || !fullName || !email || !password || !confirmPassword || !date) {
      toast.error('Please fill in all fields!');
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
        role,
      });
      sessionStorage.setItem('registerEmail', email);

      if (response && response.flag && response.code === 200) {
        toast.success('Registration successful! Please verify your email.');
        navigate('/verify-email');
      } else {
        // Xử lý lỗi trả về từ backend (bao gồm errors object)
        if (response?.errors && typeof response.errors === 'object') {
          Object.entries(response.errors).forEach(([messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach((msg) => toast.error(msg));
            }
          });
        } else {
          toast.error(response?.message || 'Registration failed!');
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // Xử lý lỗi trả về từ backend (bao gồm errors object)
      const errors = err?.errors || err?.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        Object.entries(errors).forEach(([messages]) => {
          if (Array.isArray(messages)) {
            messages.forEach((msg) => toast.error(msg));
          }
        });
      } else {
        toast.error('Registration failed!');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const accStr = localStorage.getItem('account');
    if (accStr) {
      navigate('/');
    }
    // Không lấy giá trị từ sessionStorage khi vào trang Register
  }, [navigate]);

  return (
    <>
      <RegisterChooseRoleModal
        open={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onChooseRole={(r) => {
          setRole(r);
          setShowRoleModal(false);
        }}
      />
      <div className="absolute inset-0 -z-10 bg-[#091D4B] min-h-screen w-full " />
      <div className="min-h-screen text-white flex items-center justify-center relative">
        <div className="bg-white/10 rounded-2xl shadow-lg p-10 w-[800px] max-w-full flex flex-col md:flex-row gap-8 items-center justify-center">
          {/* Left: Form fields */}
          <div className="flex-1 flex flex-col gap-4 items-center justify-center">
            <div className="text-[38px] font-bold pb-6 text-center w-full text-white">
              Create Your Veezy Account
            </div>
            <div className="flex flex-col gap-4 w-full items-center justify-center">
              <div className="w-[70%] text-[#A1A1AA] text-[20px]">
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-4 px-3"
                />
              </div>
              <div className="w-[70%] text-[#A1A1AA] text-[20px]">
                <Input
                  type="text"
                  placeholder="Fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-4 px-3"
                />
              </div>
              <div className="w-[70%] text-[#A1A1AA] text-[20px]">
                <Input
                  type="text"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-4 px-3"
                />
              </div>
              <div className="w-[70%] text-[#A1A1AA] text-[20px]">
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-4 px-3"
                />
              </div>
              <div className="w-[70%] text-[#A1A1AA] text-[20px] relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-4 px-3 pr-12"
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
              <div className="w-[70%] text-[#A1A1AA] text-[20px] relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-4 px-3 pr-12"
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
              <div className="w-[70%] text-[#A1A1AA] text-[20px]">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative w-full">
                      <Input
                        readOnly
                        value={date ? format(date, 'dd/MM/yyyy') : ''}
                        placeholder="Day of Birth"
                        className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-4 px-3 pr-12 text-left cursor-pointer"
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
              {/* Đưa nút và link vào giữa */}
              <div className="flex flex-col items-center justify-center w-full mt-4">
                <Button
                  onClick={handleRegister}
                  disabled={loading}
                  className="bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white px-6 w-2/3 rounded-[8px] py-4 text-[20px] mb-4"
                >
                  {loading ? 'Signing Up...' : 'Sign Up'}
                </Button>
                <div className="text-center w-full">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#60A5FA] hover:underline">
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

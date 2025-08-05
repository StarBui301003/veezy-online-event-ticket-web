import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePickerRegister } from '@/components/ui/date-picker-register';
import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns-tz';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { RegisterAPI } from '@/services/auth.service';
import { toast } from 'react-toastify';
import RegisterChooseRoleModal from '@/pages/authentication/RegisterChooseRoleModal';
import {
  parseBackendErrors,
  getFieldError,
  hasFieldError,
  type FieldErrors,
  validateDateOfBirth,
} from '@/utils/validation';
import FaceCapture from '@/components/common/FaceCapture';
import { registerWithFaceAPI } from '@/services/auth.service';

export const Register = () => {
  // Restore from sessionStorage if available
  const [date, setDate] = useState<Date | undefined>(() => {
    const saved = sessionStorage.getItem('register_date');
    return saved ? new Date(saved) : undefined;
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState(() => sessionStorage.getItem('register_username') || '');
  const [fullName, setFullName] = useState(() => sessionStorage.getItem('register_fullName') || '');
  const [phone, setPhone] = useState(() => sessionStorage.getItem('register_phone') || '');
  const [email, setEmail] = useState(() => sessionStorage.getItem('register_email') || '');
  const [password, setPassword] = useState(() => sessionStorage.getItem('register_password') || '');
  const [confirmPassword, setConfirmPassword] = useState(() => sessionStorage.getItem('register_confirmPassword') || '');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('register_role');
    return saved ? Number(saved) : null;
  });
  const [showRoleModal, setShowRoleModal] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showFaceModal, setShowFaceModal] = useState(false);
  // Đã thay bằng faceRegisteringRef, không cần faceRegistering state nữa
  const faceRegisteringRef = useRef(false);

  const navigate = useNavigate();

  // Save to sessionStorage on change
  useEffect(() => { sessionStorage.setItem('register_username', username); }, [username]);
  useEffect(() => { sessionStorage.setItem('register_fullName', fullName); }, [fullName]);
  useEffect(() => { sessionStorage.setItem('register_phone', phone); }, [phone]);
  useEffect(() => { sessionStorage.setItem('register_email', email); }, [email]);
  useEffect(() => { sessionStorage.setItem('register_password', password); }, [password]);
  useEffect(() => { sessionStorage.setItem('register_confirmPassword', confirmPassword); }, [confirmPassword]);
  useEffect(() => { sessionStorage.setItem('register_role', role !== null ? String(role) : ''); }, [role]);
  useEffect(() => { if (date) sessionStorage.setItem('register_date', date.toISOString()); }, [date]);

  const handleRegister = async () => {
    // Clear previous errors
    setFieldErrors({});

    // Validate all required fields
    const newFieldErrors: FieldErrors = {};

    if (!username.trim()) {
      newFieldErrors.username = ['Username is required!'];
    }

    if (!fullName.trim()) {
      newFieldErrors.fullname = ['Full name is required!'];
    }

    if (!email.trim()) {
      newFieldErrors.email = ['Email is required!'];
    }

    if (!phone.trim()) {
      newFieldErrors.phone = ['Phone number is required!'];
    }

    if (!password.trim()) {
      newFieldErrors.password = ['Password is required!'];
    }

    if (!confirmPassword.trim()) {
      newFieldErrors.confirmpassword = ['Confirm password is required!'];
    } else if (password !== confirmPassword) {
      newFieldErrors.confirmpassword = ['Passwords do not match!'];
    }

    if (!date) {
      newFieldErrors.dateofbirth = ['Please select your date of birth!'];
    } else {
      const dateOfBirth = format(date, 'yyyy-MM-dd', { timeZone: 'Asia/Ho_Chi_Minh' });
      const dateValidation = validateDateOfBirth(dateOfBirth);
      if (!dateValidation.isValid) {
        newFieldErrors.dateofbirth = [dateValidation.errorMessage!];
      }
    }

    // If there are validation errors, show them and return
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    // Check role after field validation
    if (!role) {
      setShowRoleModal(true);
      toast.error('Please choose your role!');
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
      // Clear form data from sessionStorage after successful register
      sessionStorage.removeItem('register_username');
      sessionStorage.removeItem('register_fullName');
      sessionStorage.removeItem('register_phone');
      sessionStorage.removeItem('register_email');
      sessionStorage.removeItem('register_password');
      sessionStorage.removeItem('register_confirmPassword');
      sessionStorage.removeItem('register_role');
      sessionStorage.removeItem('register_date');

      if (response && response.flag && response.code === 200) {
        toast.success('Registration successful! Please verify your email.');
        setTimeout(() => {
          navigate('/verify-email', { replace: true });
        }, 500);
      } else {
        // Handle non-200 response
        toast.error(response?.message || 'Registration failed!');
      }
    } catch (error: unknown) {
      // Parse backend errors for field-specific display
      const { fieldErrors: backendFieldErrors, generalErrors } = parseBackendErrors(error);

      // Set field errors for inline display
      setFieldErrors(backendFieldErrors);

      // Show toast only for general errors that couldn't be mapped to fields
      if (generalErrors.length > 0) {
        toast.error(generalErrors[0]);
      } else if (Object.keys(backendFieldErrors).length > 0) {
        // If we have field errors, show a general message
        toast.error('Please check your input fields');
      } else {
        // Fallback error
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWithFace = async (faceFile?: File) => {
    if (faceRegisteringRef.current) return; // Chặn double submit bằng ref
    faceRegisteringRef.current = true;
    if (!role) {
      setShowRoleModal(true);
      toast.error('Please choose your role!');
      faceRegisteringRef.current = false;
      return;
    }
    if (!username || !fullName || !email || !password || !confirmPassword || !date) {
      toast.error('Please fill in all fields!');
      faceRegisteringRef.current = false;
      return;
    }
    const file = faceFile;
    if (!file) {
      toast.error('Please capture your face!');
      faceRegisteringRef.current = false;
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match!');
      faceRegisteringRef.current = false;
      return;
    }
    setLoading(true);
    try {
      const dateOfBirth = format(date, 'yyyy-MM-dd', { timeZone: 'Asia/Ho_Chi_Minh' });
      const formData = new FormData();
      formData.append('Username', username);
      formData.append('FullName', fullName);
      formData.append('Email', email);
      formData.append('Phone', phone);
      formData.append('Password', password);
      formData.append('Role', String(role));
      formData.append('Gender', '0'); // hoặc lấy từ form nếu có
      formData.append('DateOfBirth', dateOfBirth);
      formData.append('FaceEmbedding', '0'); // Gửi số bất kỳ, backend sẽ tự xử lý từ ảnh
      formData.append('FaceImage', file);
      // Các trường khác nếu cần
      console.log('RegisterWithFace - file:', file);
      const response = await registerWithFaceAPI(formData);
      if (response && response.flag && response.code === 200) {
        toast.success('Registration successful! Please verify your email.');
        sessionStorage.setItem('registerEmail', email);
        localStorage.setItem('registerEmail', email); // Lưu vào localStorage để bền hơn
        setTimeout(() => {
          navigate('/verify-email', { replace: true });
        }, 500);
      } else {
        toast.error(response?.message || 'Registration failed!');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        toast.error((err as { message?: string }).message || 'Registration failed!');
      } else {
        toast.error('Registration failed!');
      }
    } finally {
      setLoading(false);
      faceRegisteringRef.current = false;
    }
  };

  useEffect(() => {
    const accStr = localStorage.getItem('account');
    if (accStr) {
      navigate('/');
      return;
    }
    // Nếu đã đăng ký xong, đang chờ verify, thì chuyển sang verify luôn
    const registerEmail =
      sessionStorage.getItem('registerEmail') || localStorage.getItem('registerEmail');
    if (registerEmail) {
      navigate('/verify-email', { replace: true });
      return;
    }
  }, [navigate]);

  return (
    <>
      {/* Chỉ render modal chọn role nếu chưa đăng ký xong */}
      {!sessionStorage.getItem('registerEmail') && (
        <RegisterChooseRoleModal
          open={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          onChooseRole={(r) => {
            setRole(r);
            setShowRoleModal(false);
          }}
        />
      )}

      <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-[#193c8f] via-[#1e4a9e] to-[#0f2d5f] w-full h-full" />

      <div className="text-white flex items-center justify-center relative min-h-screen py-8">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl mx-4 p-6 md:p-8 lg:p-10 w-full max-w-2xl flex flex-col items-center justify-center">
          <div className="text-3xl font-bold mb-6 text-center w-full">
            Create Your Veezy Account
          </div>

          <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full flex flex-col mb-6">
              <div className="text-2xl font-semibold text-white mb-4">Account Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {/* Username */}
                <div className="w-full">
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (hasFieldError(fieldErrors, 'username')) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.username;
                          return newErrors;
                        });
                      }
                    }}
                    className={`rounded-full border border-transparent focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-white/5 text-[#A1A1AA] placeholder:text-white/50 shadow-[0_4px_4px_rgba(0,0,0,0.25)]
                       py-2 px-3 w-full ${
                         hasFieldError(fieldErrors, 'username') ? 'border-red-500' : ''
                       }`}
                  />
                  {getFieldError(fieldErrors, 'username') && (
                    <div className="text-red-400 text-sm mt-1 ml-2">
                      {getFieldError(fieldErrors, 'username')}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="w-full">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (hasFieldError(fieldErrors, 'email')) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.email;
                          return newErrors;
                        });
                      }
                    }}
                    className={`rounded-full border border-transparent focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-2 px-3 w-full placeholder:text-white/50 ${
                      hasFieldError(fieldErrors, 'email') ? 'border-red-500' : ''
                    }`}
                  />
                  {getFieldError(fieldErrors, 'email') && (
                    <div className="text-red-400 text-sm mt-1 ml-2">
                      {getFieldError(fieldErrors, 'email')}
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="w-full">
                  <div className="relative flex items-center">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (
                          hasFieldError(fieldErrors, 'password') ||
                          hasFieldError(fieldErrors, 'confirmpassword')
                        ) {
                          setFieldErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.password;
                            delete newErrors.confirmpassword;
                            return newErrors;
                          });
                        }
                      }}
                      className={`rounded-full border border-transparent focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-white/5 text-[#A1A1AA] placeholder:text-white/50 shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-2 px-3 pr-10 w-full ${
                        hasFieldError(fieldErrors, 'password') ? 'border-red-500' : ''
                      }`}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] p-0 m-0"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      style={{ lineHeight: 0 }}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {getFieldError(fieldErrors, 'password') && (
                    <div className="text-red-400 text-sm mt-1 ml-2">
                      {getFieldError(fieldErrors, 'password')}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="w-full">
                  <div className="relative flex items-center">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (hasFieldError(fieldErrors, 'confirmpassword')) {
                          setFieldErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.confirmpassword;
                            return newErrors;
                          });
                        }
                      }}
                      className={`rounded-full border border-transparent focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-white/5 text-[#A1A1AA] placeholder:text-white/50 shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-2 px-3 pr-10 w-full ${
                        hasFieldError(fieldErrors, 'confirmpassword') ? 'border-red-500' : ''
                      }`}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] p-0 m-0"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      tabIndex={-1}
                      style={{ lineHeight: 0 }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {getFieldError(fieldErrors, 'confirmpassword') && (
                    <div className="text-red-400 text-sm mt-1 ml-2">
                      {getFieldError(fieldErrors, 'confirmpassword')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="w-full flex flex-col">
              <div className="text-2xl font-semibold text-white mb-4">Personal Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {/* Full Name */}
                <div className="w-full">
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (hasFieldError(fieldErrors, 'fullname')) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.fullname;
                          return newErrors;
                        });
                      }
                    }}
                    className={`rounded-full border border-transparent focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-white/5 text-[#A1A1AA] placeholder:text-white/50 shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-2 px-3 w-full ${
                      hasFieldError(fieldErrors, 'fullname') ? 'border-red-500' : ''
                    }`}
                  />
                  {getFieldError(fieldErrors, 'fullname') && (
                    <div className="text-red-400 text-sm mt-1 ml-2">
                      {getFieldError(fieldErrors, 'fullname')}
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <div className="w-full">
                  <Input
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (hasFieldError(fieldErrors, 'phone')) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.phone;
                          return newErrors;
                        });
                      }
                    }}
                    className={`rounded-full border border-transparent focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-white/5 text-[#A1A1AA] placeholder:text-white/50 shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-2 px-3 w-full ${
                      hasFieldError(fieldErrors, 'phone') ? 'border-red-500' : ''
                    }`}
                  />
                  {getFieldError(fieldErrors, 'phone') && (
                    <div className="text-red-400 text-sm mt-1 ml-2">
                      {getFieldError(fieldErrors, 'phone')}
                    </div>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="w-full">
                  <label className="block text-xs text-white/50 ml-1 mb-1">Date of Birth</label>
                  <DatePickerRegister
                    selectedDate={date}
                    onDateChange={(selectedDate) => {
                      setDate(selectedDate);
                      if (hasFieldError(fieldErrors, 'dateofbirth')) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.dateofbirth;
                          return newErrors;
                        });
                      }
                    }}
                    error={getFieldError(fieldErrors, 'dateofbirth')}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Submit buttons */}
            <div className="w-full mt-6">
              <Button
                onClick={handleRegister}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-110 transition rounded-full w-full py-3 text-lg font-semibold shadow-[0_4px_4px_rgba(0,0,0,0.25)] mb-4"
              >
                {loading ? 'Signing Up...' : 'Sign Up'}
              </Button>

              <Button
                onClick={() => setShowFaceModal(true)}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:brightness-110 transition rounded-full w-full py-3 text-lg font-semibold shadow-[0_4px_4px_rgba(0,0,0,0.25)] mb-4"
              >
                Face Registration
              </Button>

              <div className="text-center text-sm mt-4">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-300 hover:underline font-medium">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFaceModal && (
        <FaceCapture
          onCapture={({ image }) => {
            if (faceRegisteringRef.current) return; // Chặn double callback bằng ref
            setShowFaceModal(false);
            handleRegisterWithFace(
              new File([image], 'face.jpg', { type: image.type || 'image/jpeg' })
            );
          }}
          onCancel={() => setShowFaceModal(false)}
        />
      )}
    </>
  );
};

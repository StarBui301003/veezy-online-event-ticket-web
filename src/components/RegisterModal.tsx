import React, { useState, useRef } from 'react';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import { FiCamera } from 'react-icons/fi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RegisterAPI, registerWithFaceAPI } from '@/services/auth.service';
import { toast } from 'react-toastify';
import { VerifyRegisterModal } from './VerifyRegisterModal';
// Usage example:
// import { RegisterModal } from '@/components/RegisterModal';
// <RegisterModal
//   open={showRegisterModal}
//   onClose={() => setShowRegisterModal(false)}
//   onRegisterSuccess={(email) => {
//     // handle success, e.g. navigate('/verify-email')
//   }}
//   onLoginRedirect={() => setShowLoginModal(true)}
// />
//
// For modal switching, use AuthModals.tsx as provided.
import {
  validateUsername,
  validatePassword,
  validateEmail,
  validateDateOfBirth,
  parseBackendErrors,
  getFieldError,
  hasFieldError,
  type FieldErrors,
} from '@/utils/validation';
import FaceCapture from '@/components/common/FaceCapture';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  onRegisterSuccess: (email: string) => void;
  onLoginRedirect?: () => void;
}

interface RegisterChooseRoleModalProps {
  open: boolean;
  onClose: () => void;
  onChooseRole: (role: number) => void;
}

const RegisterChooseRoleModal: React.FC<RegisterChooseRoleModalProps> = ({
  open,
  onClose,
  onChooseRole,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-lg mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Role</h2>
          <p className="text-gray-600">What type of account would you like to create?</p>
        </div>
        
        <div className="flex gap-6 justify-center">
          <button
            onClick={() => {
              onChooseRole(1); // Customer
              onClose();
            }}
            className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-semibold text-gray-800">Customer</span>
            <span className="text-sm text-gray-500 text-center mt-1">Join events and activities</span>
          </button>
          
          <button
            onClick={() => {
              onChooseRole(2); // Event Manager
              onClose();
            }}
            className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-semibold text-gray-800">Event Manager</span>
            <span className="text-sm text-gray-500 text-center mt-1">Create and manage events</span>
          </button>
        </div>
        
        <div className="text-center mt-6">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export const RegisterModal: React.FC<RegisterModalProps> = ({ 
  open, 
  onClose, 
  onRegisterSuccess,
  onLoginRedirect 
}) => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [role, setRole] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const faceRegisteringRef = useRef(false);
  const { t } = useTranslation();

  // Khi mở RegisterModal, kiểm tra nếu có email chưa verify và còn thời gian thì hiện lại modal verify
  React.useEffect(() => {
    if (open) {
      const pendingEmail = sessionStorage.getItem('registerEmail');
      const countdown = Number(sessionStorage.getItem('verificationCountdown') || '0');
      if (pendingEmail && countdown > 0) {
        setEmail(pendingEmail);
        setShowVerifyModal(true);
      }
    }
  }, [open]);

  if (!open) return null;

  const validateForm = () => {
    const newFieldErrors: FieldErrors = {};

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      newFieldErrors.username = [usernameValidation.errorMessage!];
    }

    if (!fullName.trim()) {
      newFieldErrors.fullname = ['Full name is required!'];
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      newFieldErrors.email = [emailValidation.errorMessage!];
    }

    if (!phone.trim()) {
      newFieldErrors.phone = ['Phone number is required!'];
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newFieldErrors.password = [passwordValidation.errorMessage!];
    }

    if (!confirmPassword.trim()) {
      newFieldErrors.confirmpassword = ['Confirm password is required!'];
    } else if (password !== confirmPassword) {
      newFieldErrors.confirmpassword = ['Passwords do not match!'];
    }

    if (!dateOfBirth) {
      newFieldErrors.dateofbirth = ['Date of birth is required!'];
    } else {
      const dateValidation = validateDateOfBirth(dateOfBirth);
      if (!dateValidation.isValid) {
        newFieldErrors.dateofbirth = [dateValidation.errorMessage!];
      }
    }

    return newFieldErrors;
  };

  const handleRegister = async () => {
    setFieldErrors({});
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }
    if (!role) {
      setShowRoleModal(true);
      toast.error('Please choose your role!');
      return;
    }
    setLoading(true);
    try {
      const response = await RegisterAPI({
        username,
        fullName,
        email,
        phone,
        password,
        dateOfBirth,
        role,
      });
      if (response && response.flag && response.code === 200) {
        toast.success('Registration successful! Please verify your email.');
        sessionStorage.setItem('registerEmail', email);
        sessionStorage.setItem('verificationCountdown', '1'); // Đặt lại thời gian verify (ví dụ 1 phút)
        setShowVerifyModal(true);
      } else {
        toast.error(response?.message || 'Registration failed!');
      }
    } catch (error: unknown) {
      const { fieldErrors: backendFieldErrors, generalErrors } = parseBackendErrors(error);
      setFieldErrors(backendFieldErrors);
      if (generalErrors.length > 0) {
        toast.error(generalErrors[0]);
      } else if (Object.keys(backendFieldErrors).length > 0) {
        toast.error('Please check your input fields');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWithFace = async (faceFile?: File) => {
    if (faceRegisteringRef.current) return;
    faceRegisteringRef.current = true;
    
    setFieldErrors({});
    
    const validationErrors = validateForm();
    if (!faceFile) {
      validationErrors.face = ['Please capture your face!'];
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      faceRegisteringRef.current = false;
      return;
    }

    if (!role) {
      setShowRoleModal(true);
      toast.error('Please choose your role!');
      faceRegisteringRef.current = false;
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('Username', username);
      formData.append('FullName', fullName);
      formData.append('Email', email);
      formData.append('Phone', phone);
      formData.append('Password', password);
      formData.append('Role', String(role));
      formData.append('Gender', '0');
      formData.append('DateOfBirth', dateOfBirth);
      formData.append('FaceEmbedding', '0');
      formData.append('FaceImage', faceFile);

      const response = await registerWithFaceAPI(formData);
      
      if (response && response.flag && response.code === 200) {
        toast.success('Face registration successful! Please verify your email.');
        onClose();
        onRegisterSuccess(email);
      } else {
        toast.error(response?.message || 'Face registration failed!');
      }
    } catch (err: unknown) {
      const { fieldErrors: backendFieldErrors, generalErrors } = parseBackendErrors(err);
      
      // Handle face-specific errors
      let hasFaceError = false;
      let faceErrorMessage = '';
      
      // Type guard for error object with response
      type ErrorWithResponse = { response?: { data?: { message?: unknown } } };
      const errorObj = err as ErrorWithResponse;
      const backendMessage = errorObj.response?.data?.message;
      if (typeof backendMessage === 'string' && (
        backendMessage.includes('face') || 
        backendMessage.includes('Liveness') ||
        backendMessage.includes('detected') ||
        backendMessage.includes('Fake')
      )) {
        hasFaceError = true;
        faceErrorMessage = backendMessage;
      }

      const finalFieldErrors = { ...backendFieldErrors };
      if (hasFaceError) {
        finalFieldErrors.face = [faceErrorMessage];
      }
      
      setFieldErrors(finalFieldErrors);

      if (hasFaceError) {
        toast.error(faceErrorMessage);
      } else if (generalErrors.length > 0) {
        toast.error(generalErrors[0]);
      } else {
        toast.error('Face registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
      faceRegisteringRef.current = false;
    }
  };

  const handleLoginClick = () => {
    onClose();
    if (onLoginRedirect) {
      onLoginRedirect();
    }
  };

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Modal Content */}
        <div 
          className="relative bg-gradient-to-br from-[#193c8f] via-[#1e4a9e] to-[#0f2d5f] p-8 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 text-white max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Create Your Account</h2>
            <p className="text-white/70">Join us today and get started</p>
          </div>

          {/* Registration Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Account Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Account Information</h3>
              
              {/* Username */}
              <div>
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
                  className={`w-full rounded-xl border-0 bg-white/10 text-white placeholder:text-white/50 py-3 px-4 text-base focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all ${
                    hasFieldError(fieldErrors, 'username') ? 'ring-2 ring-red-400' : ''
                  }`}
                  autoComplete="username"
                />
                {getFieldError(fieldErrors, 'username') && (
                  <div className="text-red-300 text-sm mt-1 ml-2">
                    {getFieldError(fieldErrors, 'username')}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
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
                  className={`w-full rounded-xl border-0 bg-white/10 text-white placeholder:text-white/50 py-3 px-4 text-base focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all ${
                    hasFieldError(fieldErrors, 'email') ? 'ring-2 ring-red-400' : ''
                  }`}
                  autoComplete="email"
                />
                {getFieldError(fieldErrors, 'email') && (
                  <div className="text-red-300 text-sm mt-1 ml-2">
                    {getFieldError(fieldErrors, 'email')}
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (hasFieldError(fieldErrors, 'password')) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.password;
                          return newErrors;
                        });
                      }
                    }}
                    className={`w-full rounded-xl border-0 bg-white/10 text-white placeholder:text-white/50 py-3 px-4 pr-12 text-base focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all ${
                      hasFieldError(fieldErrors, 'password') ? 'ring-2 ring-red-400' : ''
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {getFieldError(fieldErrors, 'password') && (
                  <div className="text-red-300 text-sm mt-1 ml-2">
                    {getFieldError(fieldErrors, 'password')}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <div className="relative">
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
                    className={`w-full rounded-xl border-0 bg-white/10 text-white placeholder:text-white/50 py-3 px-4 pr-12 text-base focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all ${
                      hasFieldError(fieldErrors, 'confirmpassword') ? 'ring-2 ring-red-400' : ''
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {getFieldError(fieldErrors, 'confirmpassword') && (
                  <div className="text-red-300 text-sm mt-1 ml-2">
                    {getFieldError(fieldErrors, 'confirmpassword')}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Personal Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Personal Information</h3>
              
              {/* Full Name */}
              <div>
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
                  className={`w-full rounded-xl border-0 bg-white/10 text-white placeholder:text-white/50 py-3 px-4 text-base focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all ${
                    hasFieldError(fieldErrors, 'fullname') ? 'ring-2 ring-red-400' : ''
                  }`}
                  autoComplete="name"
                />
                {getFieldError(fieldErrors, 'fullname') && (
                  <div className="text-red-300 text-sm mt-1 ml-2">
                    {getFieldError(fieldErrors, 'fullname')}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
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
                  className={`w-full rounded-xl border-0 bg-white/10 text-white placeholder:text-white/50 py-3 px-4 text-base focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all ${
                    hasFieldError(fieldErrors, 'phone') ? 'ring-2 ring-red-400' : ''
                  }`}
                  autoComplete="tel"
                />
                {getFieldError(fieldErrors, 'phone') && (
                  <div className="text-red-300 text-sm mt-1 ml-2">
                    {getFieldError(fieldErrors, 'phone')}
                  </div>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <div className="relative">
                  <DatePicker
                    selected={dateOfBirth ? new Date(dateOfBirth) : null}
                    onChange={(date: Date | null) => {
                      setDateOfBirth(date ? date.toISOString().slice(0, 10) : '');
                      if (hasFieldError(fieldErrors, 'dateofbirth')) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.dateofbirth;
                          return newErrors;
                        });
                      }
                    }}
                    dateFormat="yyyy-MM-dd"
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                    placeholderText="Date of Birth"
                    className={`w-full rounded-xl border-0 bg-white/10 text-white placeholder:text-white/50 py-3 px-4 text-base focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all ${
                      hasFieldError(fieldErrors, 'dateofbirth') ? 'ring-2 ring-red-400' : ''
                    }`}
                    maxDate={new Date()}
                    wrapperClassName="w-full"
                  />
                </div>
                {getFieldError(fieldErrors, 'dateofbirth') && (
                  <div className="text-red-300 text-sm mt-1 ml-2">
                    {getFieldError(fieldErrors, 'dateofbirth')}
                  </div>
                )}
              </div>

              {/* Role Selection Button */}
              <div>
                <Button
                  type="button"
                  onClick={() => setShowRoleModal(true)}
                  className={`w-full rounded-xl bg-white/10 hover:bg-white/20 text-white py-3 px-4 text-base border-0 transition-all ${
                    role ? 'bg-blue-500/30' : ''
                  }`}
                >
                  {role === 1 ? 'Customer Selected' : role === 2 ? 'Event Manager Selected' : 'Choose Your Role'}
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-4">
            <Button
              onClick={handleRegister}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-xl font-semibold text-base transition-all shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" />
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/60 text-sm font-medium">{t('or')}</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Face Registration Button */}
            <Button
              onClick={() => {
                if (hasFieldError(fieldErrors, 'face')) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.face;
                    return newErrors;
                  });
                }
                setShowFaceCapture(true);
              }}
              className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 transition-all shadow-lg ${
                hasFieldError(fieldErrors, 'face') ? 'ring-2 ring-red-400' : ''
              }`}
              disabled={loading}
            >
              <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <FiCamera className="text-green-600 text-sm" />
              </span>
              <span>Register with Face</span>
            </Button>

            {getFieldError(fieldErrors, 'face') && (
              <div className="text-red-300 text-center text-sm font-medium">
                {getFieldError(fieldErrors, 'face')}
              </div>
            )}

            {/* Login Link */}
            <div className="text-center pt-4">
              <span className="text-white/70">Already have an account? </span>
              <button 
                onClick={handleLoginClick}
                className="text-blue-300 hover:text-blue-200 font-semibold transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection Modal */}
      <RegisterChooseRoleModal
        open={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onChooseRole={(selectedRole) => {
          setRole(selectedRole);
          setShowRoleModal(false);
        }}
      />

      {/* Face Capture Modal */}
      {showFaceCapture && (
        <FaceCapture
          onCapture={({ image }) => {
            if (faceRegisteringRef.current) return;
            
            if (hasFieldError(fieldErrors, 'face')) {
              setFieldErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.face;
                return newErrors;
              });
            }
            
            setShowFaceCapture(false);
            handleRegisterWithFace(
              new File([image], 'face.jpg', { type: image.type || 'image/jpeg' })
            );
          }}
          onCancel={() => setShowFaceCapture(false)}
        />
      )}

      {/* Verify Register Modal */}
      {showVerifyModal && (
        <VerifyRegisterModal
          open={showVerifyModal}
          email={email}
          onClose={() => {
            setShowVerifyModal(false);
            sessionStorage.removeItem('registerEmail');
            sessionStorage.removeItem('verificationCountdown');
            onClose();
          }}
        />
      )}
    </>
  );
};

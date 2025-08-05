import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { resetPasswordWithCode } from '@/services/auth.service';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoKey, IoLockClosed, IoEye, IoEyeOff, IoCheckmarkCircle, IoAlertCircle, IoShield } from 'react-icons/io5';

export const ResetNewPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const accStr = localStorage.getItem('account');
    if (accStr) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('resetEmail');
    if (!savedEmail) {
      setError('Email not found. Please request password reset again.');
      setTimeout(() => {
        navigate('/reset-request');
      }, 2000);
    } else {
      setEmail(savedEmail);
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const response = await resetPasswordWithCode(email, code, newPassword);
      if (response.code === 200) {
        setIsSuccess(true);
        localStorage.removeItem('resetEmail');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.message || 'Failed to reset password. Please check your code and try again.');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // Ưu tiên message từ backend nếu có
      const backendMsg = err?.response?.data?.message;
      setError(backendMsg || 'Failed to reset password. Please check your code and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Success animation component
  const SuccessAnimation = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <IoCheckmarkCircle size={32} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Password Reset!</h3>
        <p className="text-gray-600 mb-4">Your password has been updated successfully</p>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { level: 0, text: '', color: '' };
    if (password.length < 6) return { level: 1, text: 'Too short', color: 'text-red-500' };
    if (password.length < 8) return { level: 2, text: 'Weak', color: 'text-orange-500' };
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { level: 4, text: 'Strong', color: 'text-green-500' };
    }
    return { level: 3, text: 'Good', color: 'text-blue-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <>
      {isSuccess && <SuccessAnimation />}
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4 relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Fixed Back button */}
        <button
          type="button"
          className="fixed top-6 left-6 z-10 flex items-center gap-2 text-white/80 hover:text-white transition-all duration-200 group"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <IoArrowBack size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md">
            {/* Main card */}
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20">
              {/* Header with icon */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-3 shadow-lg">
                  <IoShield size={24} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Your Password</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Enter the verification code and
                  <br />
                  create your new secure password
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  For: <span className="font-medium text-blue-600">{email}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Verification Code */}
                <div className="space-y-2">
                  <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700">
                    Verification Code
                  </label>
                  <div className="relative">
                    <IoKey size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      id="verification-code"
                      type="text"
                      className="w-full h-11 pl-10 pr-4 text-center font-mono tracking-wider border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
                      placeholder="Enter code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <IoLockClosed size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      className="w-full h-11 pl-10 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {newPassword && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`w-6 h-1.5 rounded-full ${
                              level <= passwordStrength.level
                                ? passwordStrength.level === 1
                                  ? 'bg-red-400'
                                  : passwordStrength.level === 2
                                  ? 'bg-orange-400'
                                  : passwordStrength.level === 3
                                  ? 'bg-blue-400'
                                  : 'bg-green-400'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={passwordStrength.color}>{passwordStrength.text}</span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <IoLockClosed size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`w-full h-11 pl-10 pr-12 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 ${
                        confirmPassword && newPassword !== confirmPassword
                          ? 'border-red-300 focus:border-red-500'
                          : confirmPassword && newPassword === confirmPassword
                          ? 'border-green-300 focus:border-green-500'
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <p className={`text-xs ${
                      newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                {/* Error display */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                    <IoAlertCircle size={18} className="text-red-500 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !code.trim() || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Resetting...
                    </div>
                  ) : (
                    'Reset Password'
                  )}
                </Button>

                {/* Login link */}
                <div className="text-center pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Remember your password?{' '}
                    <a
                      href="/login"
                      className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    >
                      Sign In
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
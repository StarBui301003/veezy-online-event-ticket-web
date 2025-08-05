import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { requestResetPassword } from '@/services/auth.service';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoMail, IoLockClosed, IoCheckmarkCircle, IoAlertCircle } from 'react-icons/io5';

export const ResetRequestForm = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!validateEmail(email)) {
      setMessage('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      await requestResetPassword(email);
      localStorage.setItem('resetEmail', email);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/new-password');
      }, 2000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Ưu tiên message từ backend nếu có
      const backendMsg = error?.response?.data?.message;
      setMessage(backendMsg || 'Failed to send reset email. Please try again.');
      console.error(error);
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

  const isError = message && !isSuccess;

  // Success animation component
  const SuccessAnimation = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <IoCheckmarkCircle size={32} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Email Sent!</h3>
        <p className="text-gray-600 mb-4">Check your inbox for reset instructions</p>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );

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
                  <IoLockClosed size={24} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Enter your email address and we'll send you
                  <br />
                  instructions to reset your password
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Check your spam folder if you don't see the email
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email input */}
                <div className="space-y-2">
                  <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <IoMail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      id="reset-email"
                      type="email"
                      className="w-full h-11 pl-10 pr-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Message display */}
                {isError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                    <IoAlertCircle size={18} className="text-red-500 flex-shrink-0" />
                    <p className="text-sm font-medium">{message}</p>
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !email.trim()}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Instructions'
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

                {/* Additional help */}
                <div className="text-center">
                  <p className="text-xs text-gray-400">
                    Need help?{' '}
                    <a
                      href="/contact"
                      className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
                    >
                      Contact Support
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
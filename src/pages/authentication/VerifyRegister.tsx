/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { verifyEmailRegisterAPI, resendVerifyEmailRegisterAPI } from '@/services/auth.service';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoMail, IoCheckmarkCircle, IoAlertCircle } from 'react-icons/io5';

export const VerifyRegister = () => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [checkedEmail, setCheckedEmail] = useState(false);
  
  // Initialize countdown from sessionStorage or default to 30 seconds
  const [countdown, setCountdown] = useState(() => {
    const storedCountdown = sessionStorage.getItem('verificationCountdown');
    if (storedCountdown) {
      const minutesLeft = parseInt(storedCountdown, 10);
      // Convert minutes to seconds
      const secondsLeft = minutesLeft * 60;
      // Clear the stored countdown after reading it
      sessionStorage.removeItem('verificationCountdown');
      return secondsLeft;
    }
    return 30; // Default 30 seconds
  });
  
  const [canResend, setCanResend] = useState(true);
  const navigate = useNavigate();
  const email = sessionStorage.getItem('registerEmail') || '';

  useEffect(() => {
    if (!checkedEmail) {
      if (!email) {
        setMessage('No registration email found. Please register again.');
        setTimeout(() => {
          navigate('/register');
        }, 1500);
      }
      setCheckedEmail(true);
    }
  }, [checkedEmail, email, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      setCanResend(false);
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!code.trim()) {
      setMessage('Please enter the verification code.');
      setLoading(false);
      return;
    }

    try {
      const res = await verifyEmailRegisterAPI({ email, verificationCode: code });
      if (res.flag !== false && res.code !== 400) {
        setIsSuccess(true);
        sessionStorage.removeItem('registerEmail');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(res.message || 'Verification failed. Please try again.');
      }
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setMessage('');
    setCountdown(30);
    setCanResend(false);
    try {
      const res = await resendVerifyEmailRegisterAPI(email);
      if (res.flag === true && res.code === 0) {
        setMessage(res.message || 'Verification code resent! Please check your email.');
      } else {
        setMessage(res.message || 'Failed to resend code. Please try again.');
      }
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to resend code. Please try again.'
      );
    }
  };

  function formatCountdown(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }


  const SuccessAnimation = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <IoCheckmarkCircle size={32} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Email Verified!</h3>
        <p className="text-gray-600 mb-4">Taking you to login page...</p>
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
          onClick={() => {
            sessionStorage.removeItem('registerEmail');
            localStorage.removeItem('registerEmail');
            navigate('/register');
          }}
          aria-label="Back to register"
        >
          <IoArrowBack size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="text-sm font-medium">Back to Register</span>
        </button>

        <div className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
              {/* Header with icon */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                  <IoMail size={28} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
                <p className="text-gray-600 leading-relaxed">
                  We've sent a verification code to
                  <br />
                  <span className="font-semibold text-blue-600 break-all">{email}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Code input */}
                <div className="space-y-2">
                  <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700">
                    Verification Code
                  </label>
                  <Input
                    id="verification-code"
                    type="text"
                    className="w-full h-12 text-center text-lg font-mono tracking-widest border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder="Enter code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                  />
                </div>

                {/* Message display */}
                {message && (
                  <div className={`flex items-center gap-2 p-4 rounded-xl ${
                    isSuccess 
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    {isSuccess ? (
                      <IoCheckmarkCircle size={20} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <IoAlertCircle size={20} className="text-red-500 flex-shrink-0" />
                    )}
                    <p className="text-sm font-medium">{message}</p>
                  </div>
                )}

                {/* Verify button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || code.length < 6}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Verifying...
                    </div>
                  ) : (
                    'Verify Email'
                  )}
                </Button>

                {/* Resend section */}
                <div className="flex flex-col items-center gap-3 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Didn't receive the code?</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-6 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                    disabled={!canResend}
                    onClick={handleResend}
                  >
                    {canResend ? (
                      'Resend Code'
                    ) : (
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        Resend in {formatCountdown(countdown)}
                      </span>
                    )}
                  </Button>
                </div>

                {/* Login link */}
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500">
                    Already verified?{' '}
                    <a
                      href="/login"
                      className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
                      onClick={() => {
                        sessionStorage.removeItem('registerEmail');
                        localStorage.removeItem('registerEmail');
                      }}
                    >
                      Sign In
                    </a>
                  </p>
                </div>
              </form>
            </div>

            {/* Help text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-white/70">
                Check your spam folder if you don't see the email
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

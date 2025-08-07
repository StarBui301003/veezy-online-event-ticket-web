import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { verifyEmailRegisterAPI, resendVerifyEmailRegisterAPI } from '@/services/auth.service';
import { IoMail, IoCheckmarkCircle, IoAlertCircle } from 'react-icons/io5';

interface VerifyRegisterModalProps {
  open: boolean;
  email: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const VerifyRegisterModal: React.FC<VerifyRegisterModalProps> = ({ open, email, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(true);

  React.useEffect(() => {
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
        setTimeout(() => {
          setIsSuccess(false);
          onSuccess?.();
          onClose();
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-md mx-4 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <IoMail size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
          <p className="text-gray-600 leading-relaxed">
            We've sent a verification code to<br />
            <span className="font-semibold text-blue-600 break-all">{email}</span>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="text"
            className="w-full h-12 text-center text-lg font-mono tracking-widest border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            maxLength={6}
            required
          />
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
        </form>
      </div>
    </div>
  );
};

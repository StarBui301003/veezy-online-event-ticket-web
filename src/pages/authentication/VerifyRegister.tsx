/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { verifyEmailRegisterAPI, resendVerifyEmailRegisterAPI } from '@/services/auth.service';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';

export const VerifyRegister = () => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkedEmail, setCheckedEmail] = useState(false);
  const [countdown, setCountdown] = useState(30);
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
        setMessage('Email verified successfully! Redirecting to login...');
        sessionStorage.removeItem('registerEmail');
        setTimeout(() => {
          navigate('/login');
        }, 1200);
      } else {
        setMessage(res.message || 'Verification failed. Please try again.');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setMessage('');
    setCountdown(5);
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
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center  bg-gradient-to-br from-[#193c8f] via-[#1e4a9e] to-[#0f2d5f]">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-16 rounded-lg shadow-lg w-full max-w-3xl min-h-[400px] space-y-4 relative"
      >
        {/* Nút back về register ở góc trên bên trái */}
        <button
          type="button"
          className="absolute top-6 left-6 text-blue-600 hover:text-blue-800 transition-colors bg-transparent"
          onClick={() => {
            sessionStorage.removeItem('registerEmail');
            localStorage.removeItem('registerEmail');
            navigate('/register');
          }}
          aria-label="Back"
        >
          <IoArrowBack size={28} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800">Verify Your Email</h2>
        <p className="text-gray-600 text-left">
          Enter the verification code sent to <span className="font-semibold">{email}</span>
        </p>

        <Input
          type="text"
          className="border-2 border-gray-300 rounded-md p-2 text-gray-800 focus:border-blue-500 focus:outline-none placeholder:text-white/50"
          placeholder="Enter verification code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />

        {message && (
          <p
            className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}
          >
            {message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:bg-gradient-to-l btn-rs-pw"
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </Button>

        <div className="flex justify-between items-center mt-2">
          <Button
            type="button"
            variant="outline"
            className="text-blue-600 border-blue-500"
            disabled={!canResend}
            onClick={handleResend}
          >
            {canResend ? 'Resend code' : `Resend in ${formatCountdown(countdown)}`}
          </Button>
        </div>

        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <a
            href="/login"
            className="text-blue-600"
            onClick={() => {
              sessionStorage.removeItem('registerEmail');
              localStorage.removeItem('registerEmail');
            }}
          >
            Log in
          </a>
        </p>
      </form>
    </div>
  );
};

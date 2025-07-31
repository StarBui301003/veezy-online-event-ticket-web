import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { resetPasswordWithCode } from '@/services/auth.service';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';

export const ResetNewPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      navigate('/reset-request');
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
        setMessage('Password reset successfully. Redirecting to login...');
        localStorage.removeItem('resetEmail');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError('Failed to reset password. Please check your code and try again.');
      }
    } catch (err) {
      setError('Failed to reset password. Please check your code and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center  bg-gradient-to-br from-[#193c8f] via-[#1e4a9e] to-[#0f2d5f]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-16 rounded-2xl shadow-lg w-full max-w-3xl min-h-[400px] space-y-4 relative"
      >
        {/* Icon back ở góc trên bên trái form */}
        <button
          type="button"
          className="absolute top-6 left-6 z-10 text-blue-600 hover:text-blue-800 transition-colors bg-transparent"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <IoArrowBack size={28} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800">Reset Your Password</h2>
        <p className="text-gray-600 text-left">
          Enter the verification code and your new password.
        </p>

        <Input
          type="text"
          className="border-2 border-gray-300 rounded-md p-2 text-gray-800 focus:border-blue-500 focus:outline-none placeholder:text-white/50"
          placeholder="Verification code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <Input
          type="password"
          className="border-2 border-gray-300 rounded-md p-2 text-gray-800 focus:border-blue-500 focus:outline-none placeholder:text-white/50"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <Input
          type="password"
          className="border-2 border-gray-300 rounded-md p-2 text-gray-800 focus:border-blue-500 focus:outline-none placeholder:text-white/50"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && (
          <div className="rounded-lg bg-red-100 border border-red-400 text-red-800 px-4 py-2 text-sm shadow-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-lg bg-green-100 border border-green-400 text-green-800 px-4 py-2 text-sm shadow-sm">
            {message}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:bg-gradient-to-l"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Reset Password'}
        </Button>

        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
};

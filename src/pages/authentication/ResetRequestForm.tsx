import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { requestResetPassword } from '@/services/auth.service';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';

export const ResetRequestForm = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
      setMessage('Verification code sent to your email.');
      setTimeout(() => {
        navigate('/new-password');
      }, 100);
    } catch (error) {
      setMessage('Failed to send reset email. Please try again.');
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

  return (
    <div className="fixed inset-0 flex items-center justify-center  bg-gradient-to-br from-[#193c8f] via-[#1e4a9e] to-[#0f2d5f]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-16 rounded-2xl shadow-lg w-full max-w-3xl min-h-[300px] space-y-4 relative"
      >
        {/* Icon*/}
        <button
          type="button"
          className="absolute top-6 left-6 text-blue-600 hover:text-blue-800 transition-colors bg-transparent"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <IoArrowBack size={28} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
        <p className="text-gray-600 text-left">Enter your email to reset your password</p>

        <Input
          type="email"
          className="border-2 border-gray-300 rounded-md p-2 text-gray-800 focus:border-blue-500 focus:outline-none placeholder:text-white/50"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {message && <p className="text-sm text-green-600">{message}</p>}

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:bg-gradient-to-l"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Submit'}
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

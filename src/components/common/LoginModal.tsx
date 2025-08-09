import React, { useState, useContext } from 'react';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import { FiCamera } from 'react-icons/fi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { loginAPI, loginByFaceAPI } from '@/services/auth.service';
import { toast } from 'react-toastify';

import {
  validateUsername,
  validatePassword,
  parseBackendErrors,
  getFieldError,
  hasFieldError,
  type FieldErrors,
} from '@/utils/validation';
import FaceCapture from '@/components/common/FaceCapture';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '@/contexts/AuthContext';
import { setAccountAndUpdateTheme, updateUserConfigAndTriggerUpdate } from '@/utils/account-utils';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onRegisterRedirect?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  open,
  onClose,
  onLoginSuccess,
  onRegisterRedirect,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [faceError, setFaceError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { t } = useTranslation();
  const ctx = useContext(AuthContext);

  if (!open) return null;

  const handleLogin = async () => {
    // Clear previous errors
    setFieldErrors({});

    // Frontend validation
    const newFieldErrors: FieldErrors = {};

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      newFieldErrors.username = [usernameValidation.errorMessage!];
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newFieldErrors.password = [passwordValidation.errorMessage!];
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setLoading(true);
    try {
      const data = { username, password };
      const apiResult = await loginAPI(data);

      if (!apiResult.data || !apiResult.data.accessToken) {
        toast.error('Login failed: No access token received!', { position: 'top-right' });
        setLoading(false);
        return;
      }

      localStorage.setItem('access_token', apiResult.data.accessToken);
      localStorage.setItem('customerId', apiResult.data.account.userId);
      // Set refresh token cookie (remove secure flag for development)
      document.cookie = `refresh_token=${
        apiResult.data.refreshToken
      }; path=/; samesite=lax; max-age=${7 * 24 * 60 * 60}`;

      const {
        userConfig,
        accountId,
        avatar,
        email,
        gender,
        phone,
        role,
        userId,
        username: accountUsername,
      } = apiResult.data.account;

      if (userConfig !== undefined) {
        updateUserConfigAndTriggerUpdate(userConfig);
      } else {
        localStorage.removeItem('user_config');
      }
      // Always set role to 1 for customer accounts
      let finalRole = typeof role === 'number' ? role : 1;
      // If role is not admin (0) or event manager (2), force to customer (1)
      if (finalRole !== 0 && finalRole !== 2) {
        finalRole = 1;
      }
      const minimalAccount = {
        accountId,
        avatar,
        email,
        gender,
        phone,
        role: finalRole,
        userId,
        username: accountUsername,
      };
      setAccountAndUpdateTheme(minimalAccount);

      // Force AuthContext to update user state immediately
      window.dispatchEvent(new Event('authChanged'));
      // Trigger login event for theme update
      window.dispatchEvent(new Event('login'));
      // Gọi login() từ AuthContext nếu có
      if (ctx && typeof ctx.login === 'function') {
        ctx.login();
      }

      if (rememberMe) {
        localStorage.setItem('remembered_username', username);
      } else {
        localStorage.removeItem('remembered_username');
      }

      // Success notification
      let welcomeMsg = `Welcome ${accountUsername}!`;
      if (role === 0) {
        welcomeMsg = `Welcome admin ${accountUsername}!`;
      } else if (role === 2) {
        welcomeMsg = `Welcome event manager ${accountUsername}!`;
      }
      toast.success(welcomeMsg, { position: 'top-right' });

      // Close modal and trigger success callback
      onClose();
      onLoginSuccess();
    } catch (error: unknown) {
      // Parse backend errors
      const { fieldErrors: backendFieldErrors, generalErrors: backendGeneralErrors } =
        parseBackendErrors(error);

      // Set errors to display inline
      setFieldErrors(backendFieldErrors);

      // Show toast for general errors
      if (backendGeneralErrors.length > 0) {
        toast.error(backendGeneralErrors[0], { position: 'top-right' });
      } else if (Object.keys(backendFieldErrors).length > 0) {
        toast.error('Please check your input fields', { position: 'top-right' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLogin = async ({ image }: { image: Blob }) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('FaceImage', image, 'face.jpg');
      const apiResult = await loginByFaceAPI(formData);

      if (!apiResult.data || !apiResult.data.accessToken) {
        toast.error('Face login failed: No access token received!', { position: 'top-right' });
        setLoading(false);
        return;
      }

      localStorage.setItem('access_token', apiResult.data.accessToken);
      localStorage.setItem('customerId', apiResult.data.account.userId);
      document.cookie = `refresh_token=${apiResult.data.refreshToken}; path=/; secure; samesite=strict`;

      const {
        userConfig,
        accountId,
        avatar,
        email,
        gender,
        phone,
        role,
        userId,
        username: accountUsername,
      } = apiResult.data.account;

      if (userConfig !== undefined) {
        updateUserConfigAndTriggerUpdate(userConfig);
      } else {
        localStorage.removeItem('user_config');
      }
      const minimalAccount = {
        accountId,
        avatar,
        email,
        gender,
        phone,
        role,
        userId,
        username: accountUsername,
      };
      setAccountAndUpdateTheme(minimalAccount);

      // Gọi login() từ AuthContext nếu có
      if (ctx && typeof ctx.login === 'function') {
        ctx.login();
      }

      // Trigger login event for theme update
      window.dispatchEvent(new Event('login'));

      if (rememberMe) {
        localStorage.setItem('remembered_username', username);
      } else {
        localStorage.removeItem('remembered_username');
      }

      // Success notification
      let welcomeMsg = `Welcome ${accountUsername}!`;
      if (role === 0) {
        welcomeMsg = `Welcome admin ${accountUsername}!`;
      } else if (role === 2) {
        welcomeMsg = `Welcome event manager ${accountUsername}!`;
      }
      toast.success(welcomeMsg, { position: 'top-right' });

      // Close modal and trigger success callback
      onClose();
      onLoginSuccess();
    } catch (error: unknown) {
      let errorMessage = 'Face login failed.';
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: unknown }).response === 'object' &&
        (error as { response: { data?: unknown } }).response?.data &&
        typeof (error as { response: { data?: unknown } }).response.data === 'object'
      ) {
        const data = (error as { response: { data: Record<string, unknown> } }).response.data;
        if (data.errors && typeof data.errors === 'object') {
          errorMessage = Object.values(data.errors).flat().join('\n');
        } else if (typeof data.message === 'string') {
          errorMessage = data.message;
        }
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        errorMessage = (error as { message: string }).message;
      }
      toast.error(errorMessage, { position: 'top-right' });
    } finally {
      setLoading(false);
      setShowFaceCapture(false);
    }
  };

  const handleRegisterClick = () => {
    onClose();
    if (onRegisterRedirect) {
      onRegisterRedirect();
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
          className="relative bg-gradient-to-br from-[#193c8f] via-[#1e4a9e] to-[#0f2d5f] p-8 rounded-2xl shadow-2xl w-full max-w-md mx-4 text-white"
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
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back!</h2>
            <p className="text-white/70">Sign in to continue</p>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            {/* Username Field */}
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLogin();
                }}
              />
              {getFieldError(fieldErrors, 'username') && (
                <div className="text-red-300 text-sm mt-1 ml-2">
                  {getFieldError(fieldErrors, 'username')}
                </div>
              )}
            </div>

            {/* Password Field */}
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
                  autoComplete="current-password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLogin();
                  }}
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

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="border-white/30 bg-white/10 text-white"
                />
                <span className="text-white/80 text-sm">{t('rememberMe')}</span>
              </div>
              <button className="text-blue-300 hover:text-blue-200 text-sm transition-colors">
                {t('forgotPassword')}
              </button>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-xl font-semibold text-base transition-all shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" />
                  {t('loggingIn')}
                </span>
              ) : (
                t('login')
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/60 text-sm font-medium">{t('or')}</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Face Login Button */}
            <Button
              onClick={() => setShowFaceCapture(true)}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg"
            >
              <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <FiCamera className="text-purple-600 text-sm" />
              </span>
              <span>Login with Face</span>
            </Button>

            {faceError && (
              <div className="text-red-300 text-center text-sm font-medium">{faceError}</div>
            )}

            {/* Register Link */}
            <div className="text-center pt-4">
              <span className="text-white/70">Don't have an account? </span>
              <button
                onClick={handleRegisterClick}
                className="text-blue-300 hover:text-blue-200 font-semibold transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Face Capture Modal */}
      {showFaceCapture && (
        <FaceCapture
          onCapture={handleFaceLogin}
          onError={setFaceError}
          onCancel={() => setShowFaceCapture(false)}
        />
      )}
    </>
  );
};

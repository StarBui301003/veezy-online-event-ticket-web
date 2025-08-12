import { useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { changePasswordAPI } from '@/services/Admin/auth.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { safeLogout } from '@/utils/auth';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = t('profileCustomer.currentPasswordRequired');
    }

    if (!formData.newPassword) {
      newErrors.newPassword = t('profileCustomer.newPasswordRequired');
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = t('profileCustomer.passwordMinLength');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('profileCustomer.confirmPasswordRequired');
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('profileCustomer.passwordsDoNotMatch');
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = t('profileCustomer.newPasswordMustBeDifferent');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await changePasswordAPI(formData.currentPassword, formData.newPassword);

      if (response.flag) {
        toast.success(t('profileCustomer.passwordChangedLoginRequired'));

        // Clear form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setErrors({});

        // Close modal
        onClose();

        // Wait 3 seconds then logout and redirect to login
        setTimeout(() => {
          safeLogout();
          navigate('/login');
        }, 3000);
      } else {
        toast.error(response.message || t('profileCustomer.changePasswordFailed'));
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Change password error:', error);

      const errorMessage = error?.response?.data?.message;
      if (errorMessage) {
        if (errorMessage.includes('Current password is incorrect')) {
          setErrors((prev) => ({ ...prev, currentPassword: t('profileCustomer.currentPasswordIncorrect') }));
        } else if (errorMessage.includes('validation')) {
          setErrors((prev) => ({ ...prev, newPassword: errorMessage }));
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error(t('profileCustomer.changePasswordFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center',
        getThemeClass('bg-black/50', 'bg-black/70')
      )}
    >
      <div
        className={cn(
          'rounded-2xl shadow-2xl p-8 w-full max-w-md relative mx-4 border',
          getThemeClass(
            'bg-white/95 border border-gray-200 shadow-lg',
            'bg-gradient-to-br from-slate-800 to-purple-900 border-purple-500/20'
          )
        )}
      >
        <button
          className={cn(
            'absolute top-4 right-4 text-2xl font-bold transition-colors',
            getThemeClass('text-gray-500 hover:text-gray-700', 'text-gray-400 hover:text-white')
          )}
          onClick={handleClose}
          aria-label={t('close')}
        >
          ×
        </button>

        <h2
          className={cn(
            'text-2xl font-bold mb-6 text-center',
            getThemeClass('text-gray-900', 'text-white')
          )}
        >
          {t('profileCustomer.changePassword')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className={cn(
                'block text-sm font-medium mb-2',
                getThemeClass('text-gray-700', 'text-gray-300')
              )}
            >
              {t('profileCustomer.currentPassword')}
            </label>
            <div className="relative">
              <Input
                type={showPasswords.currentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className={cn(
                  'rounded-full border transition-all duration-200 py-2 px-3 pr-10 w-full h-auto text-sm',
                  getThemeClass(
                    'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
                    'bg-slate-700/60 placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500 text-white border-purple-700'
                  ),
                  errors.currentPassword && 'border-red-500'
                )}
                placeholder={t('profileCustomer.enterCurrentPassword')}
                disabled={loading}
              />
              <button
                type="button"
                className={cn(
                  'absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors',
                  getThemeClass(
                    'text-gray-400 hover:text-gray-600',
                    'text-gray-400 hover:text-white'
                  )
                )}
                onClick={() =>
                  setShowPasswords((prev) => ({ ...prev, currentPassword: !prev.currentPassword }))
                }
                disabled={loading}
              >
                {showPasswords.currentPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-xs mt-1 ml-2">{errors.currentPassword}</p>
            )}
          </div>

          <div>
            <label
              className={cn(
                'block text-sm font-medium mb-2',
                getThemeClass('text-gray-700', 'text-gray-300')
              )}
            >
              {t('profileCustomer.newPassword')}
            </label>
            <div className="relative">
              <Input
                type={showPasswords.newPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className={cn(
                  'rounded-full border transition-all duration-200 py-2 px-3 pr-10 w-full h-auto text-sm',
                  getThemeClass(
                    'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
                    'bg-slate-700/60 placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500 text-white border-purple-700'
                  ),
                  errors.newPassword && 'border-red-500'
                )}
                placeholder={t('profileCustomer.enterNewPassword')}
                disabled={loading}
              />
              <button
                type="button"
                className={cn(
                  'absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors',
                  getThemeClass(
                    'text-gray-400 hover:text-gray-600',
                    'text-gray-400 hover:text-white'
                  )
                )}
                onClick={() =>
                  setShowPasswords((prev) => ({ ...prev, newPassword: !prev.newPassword }))
                }
                disabled={loading}
              >
                {showPasswords.newPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1 ml-2">{errors.newPassword}</p>
            )}
          </div>

          <div>
            <label
              className={cn(
                'block text-sm font-medium mb-2',
                getThemeClass('text-gray-700', 'text-gray-300')
              )}
            >
              {t('profileCustomer.confirmPassword')}
            </label>
            <div className="relative">
              <Input
                type={showPasswords.confirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={cn(
                  'rounded-full border transition-all duration-200 py-2 px-3 pr-10 w-full h-auto text-sm',
                  getThemeClass(
                    'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
                    'bg-slate-700/60 placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500 text-white border-purple-700'
                  ),
                  errors.confirmPassword && 'border-red-500'
                )}
                placeholder={t('profileCustomer.confirmNewPassword')}
                disabled={loading}
              />
              <button
                type="button"
                className={cn(
                  'absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors',
                  getThemeClass(
                    'text-gray-400 hover:text-gray-600',
                    'text-gray-400 hover:text-white'
                  )
                )}
                onClick={() =>
                  setShowPasswords((prev) => ({ ...prev, confirmPassword: !prev.confirmPassword }))
                }
                disabled={loading}
              >
                {showPasswords.confirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1 ml-2">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              className={cn(
                'rounded-full px-4 py-2 font-semibold transition-all duration-200',
                getThemeClass(
                  'bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-300',
                  'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white'
                )
              )}
              onClick={handleClose}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                'rounded-full px-4 py-2 font-semibold transition-all duration-200',
                getThemeClass(
                  'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white',
                  'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
                )
              )}
            >
              {loading ? t('common.changing') : t('profileCustomer.changePassword')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;

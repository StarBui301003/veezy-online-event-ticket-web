import { useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { changePasswordAPI } from '@/services/Admin/auth.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';
import { validatePassword } from '@/utils/validation';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const { t } = useTranslation();
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

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

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
      newErrors.currentPassword = t('currentPasswordRequired');
    }

    if (!formData.newPassword) {
      newErrors.newPassword = t('newPasswordRequired');
    } else {
      const newPasswordValidation = validatePassword(formData.newPassword);
      if (!newPasswordValidation.isValid) {
        let errorMessage = t('newPasswordRequired');
        if (newPasswordValidation.errorMessage) {
          if (newPasswordValidation.errorMessage.includes('8 characters')) {
            errorMessage = t('passwordMinLength');
          } else if (newPasswordValidation.errorMessage.includes('128 characters')) {
            errorMessage = t('passwordMaxLength');
          } else if (
            newPasswordValidation.errorMessage.includes('uppercase') ||
            newPasswordValidation.errorMessage.includes('lowercase') ||
            newPasswordValidation.errorMessage.includes('number') ||
            newPasswordValidation.errorMessage.includes('special character')
          ) {
            errorMessage = t('passwordComplexity');
          }
        }
        newErrors.newPassword = errorMessage;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('confirmPasswordRequired');
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordsDoNotMatch');
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = t('newPasswordMustBeDifferent');
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
      await changePasswordAPI(formData.currentPassword, formData.newPassword);

      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setErrors({});

      // Close modal
      onClose();

      // Show single success message about password change and login requirement
      toast.success(
        t('passwordChangedLoginRequired') ||
          'Password changed successfully. Please login again with your new password.'
      );

      // Wait 3 seconds before redirecting to login page
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (error: unknown) {
      console.error('Change password error:', error);

      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      if (errorMessage) {
        if (errorMessage.includes('Current password is incorrect')) {
          setErrors((prev) => ({ ...prev, currentPassword: t('currentPasswordIncorrect') }));
        } else if (errorMessage.includes('validation')) {
          setErrors((prev) => ({ ...prev, newPassword: errorMessage }));
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error(t('changePasswordFailed'));
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} modal={true}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-800 p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t('changePassword')}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto p-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('currentPassword')}
            </label>
            <div className="relative">
              <input
                type={showPasswords.currentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className={`border px-3 py-2 rounded w-full pr-10 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${
                  errors.currentPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                }`}
                placeholder={t('enterCurrentPassword')}
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => togglePasswordVisibility('currentPassword')}
                disabled={loading}
              >
                {showPasswords.currentPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            {errors.currentPassword && (
              <div className="text-red-400 text-sm mt-1 ml-2">{errors.currentPassword}</div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('newPassword')}
            </label>
            <div className="relative">
              <input
                type={showPasswords.newPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className={`border px-3 py-2 rounded w-full pr-10 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${
                  errors.newPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                }`}
                placeholder={t('enterNewPassword')}
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => togglePasswordVisibility('newPassword')}
                disabled={loading}
              >
                {showPasswords.newPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            {errors.newPassword && (
              <div className="text-red-400 text-sm mt-1 ml-2">{errors.newPassword}</div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('confirmPassword')}
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`border px-3 py-2 rounded w-full pr-10 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                }`}
                placeholder={t('confirmNewPassword')}
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => togglePasswordVisibility('confirmPassword')}
                disabled={loading}
              >
                {showPasswords.confirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="text-red-400 text-sm mt-1 ml-2">{errors.confirmPassword}</div>
            )}
          </div>
        </div>
        <div className="p-4 flex justify-end gap-2">
          <DialogFooter>
            <button
              className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
              onClick={handleClose}
              disabled={loading}
              type="button"
            >
              {t('cancel')}
            </button>
            <button
              className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
              onClick={handleSubmit}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  {t('changing')}
                </div>
              ) : (
                t('changePassword')
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordModal;

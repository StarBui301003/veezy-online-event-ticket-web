/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { createAdminAPI } from '@/services/Admin/user.service';
import { toast } from 'react-toastify';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import type { CreateAdminRequest } from '@/types/Admin/user';
import { FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';
import { validateCreateAdminForm } from '@/utils/validation';
import {
  useAdminValidation,
  createFieldChangeHandler,
  createCustomChangeHandler,
} from '@/hooks/use-admin-validation';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateAdminModal = ({ open, onClose, onCreated }: Props) => {
  const { t } = useTranslation();
  const { getProfileInputClass, getSelectClass } = useThemeClasses();
  const GENDER_OPTIONS = [
    { value: 0, label: t('male') },
    { value: 1, label: t('female') },
  ];
  const [form, setForm] = useState<CreateAdminRequest>({
    username: '',
    email: '',
    phone: '', // Required field
    password: '',
    gender: 0,
    fullName: '',
    dateOfBirth: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Use validation hook
  const { handleApiError, getFieldError, getErrorClass, clearFieldError, setFieldErrors } =
    useAdminValidation({
      showToastOnValidation: false, // Only show inline errors, no toast for validation
      showToastOnApiError: true, // Keep toast for API errors
    });

  // Field change handlers with error clearing
  const handleUsernameChange = createFieldChangeHandler(
    'username',
    (value: string) => {
      setForm((prev) => ({ ...prev, username: value }));
    },
    clearFieldError
  );

  const handleEmailChange = createFieldChangeHandler(
    'email',
    (value: string) => {
      setForm((prev) => ({ ...prev, email: value }));
    },
    clearFieldError
  );

  const handlePhoneChange = createFieldChangeHandler(
    'phone',
    (value: string) => {
      setForm((prev) => ({ ...prev, phone: value }));
    },
    clearFieldError
  );

  const handlePasswordChange = createFieldChangeHandler(
    'password',
    (value: string) => {
      setForm((prev) => ({ ...prev, password: value }));
    },
    clearFieldError
  );

  const handleFullNameChange = createFieldChangeHandler(
    'fullName',
    (value: string) => {
      setForm((prev) => ({ ...prev, fullName: value }));
    },
    clearFieldError
  );

  const handleGenderChange = createCustomChangeHandler(
    'gender',
    (value: string) => {
      setForm((prev) => ({ ...prev, gender: Number(value) as 0 | 1 }));
    },
    clearFieldError
  );

  const handleCreate = async () => {
    // Validate form using comprehensive validation
    const errors = validateCreateAdminForm(form);
    const hasErrors = Object.keys(errors).length > 0;

    if (hasErrors) {
      // Set all validation errors at once
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      // Phone is now required, so no need to convert to undefined
      await createAdminAPI(form);
      toast.success(t('adminAccountCreatedSuccessfully') || 'Admin account created successfully!');
      setForm({
        username: '',
        email: '',
        phone: '',
        password: '',
        gender: 0,
        fullName: '',
        dateOfBirth: '',
      });
      onClose();
      if (onCreated) onCreated();
    } catch (error: unknown) {
      // Handle API error with custom message
      if (error instanceof Error) {
        handleApiError(error, error.message);
      } else {
        handleApiError(
          error,
          t('createAdminFailed') || 'Failed to create admin account. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-800 p-0 shadow-lg rounded-xl border-0 dark:border-0">
        <div className="p-6 border-b border-gray-200 dark:border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {t('createAdmin')}
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t('username')}
            </label>
            <input
              className={getErrorClass(
                'username',
                `border rounded px-3 py-2 w-full transition-colors ${getProfileInputClass()}`
              )}
              value={form.username}
              onChange={handleUsernameChange}
              disabled={loading}
              placeholder={t('enterUsername')}
            />
            {getFieldError('username') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('username')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t('email')}
            </label>
            <input
              className={getErrorClass(
                'email',
                `border rounded px-3 py-2 w-full transition-colors ${getProfileInputClass()}`
              )}
              type="email"
              value={form.email}
              onChange={handleEmailChange}
              disabled={loading}
              placeholder={t('enterEmail')}
            />
            {getFieldError('email') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('email')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t('phone')}
            </label>
            <input
              className={getErrorClass(
                'phone',
                `border rounded px-3 py-2 w-full transition-colors ${getProfileInputClass()}`
              )}
              value={form.phone}
              onChange={handlePhoneChange}
              disabled={loading}
              placeholder={t('enterPhone')}
            />
            {getFieldError('phone') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('phone')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t('password')}
            </label>
            <div className="relative">
              <input
                className={getErrorClass(
                  'password',
                  `border rounded px-3 py-2 w-full pr-10 transition-colors ${getProfileInputClass()}`
                )}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handlePasswordChange}
                disabled={loading}
                placeholder={t('enterPassword')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            {getFieldError('password') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('password')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t('fullName')}
            </label>
            <input
              className={getErrorClass(
                'fullName',
                `border rounded px-3 py-2 w-full transition-colors ${getProfileInputClass()}`
              )}
              value={form.fullName}
              onChange={handleFullNameChange}
              disabled={loading}
              placeholder={t('enterFullName')}
            />
            {getFieldError('fullName') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('fullName')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t('gender')}
            </label>
            <select
              className={getErrorClass(
                'gender',
                `border rounded px-3 py-2 w-full transition-colors ${getSelectClass()}`
              )}
              value={form.gender}
              onChange={(e) => handleGenderChange(e.target.value)}
              disabled={loading}
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {getFieldError('gender') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('gender')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t('dateOfBirth')}
            </label>
            <input
              className={getErrorClass(
                'dateOfBirth',
                `border rounded px-3 py-2 w-full transition-colors ${getProfileInputClass()}`
              )}
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
              disabled={loading}
              placeholder={t('enterDateOfBirth')}
            />
            {getFieldError('dateOfBirth') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('dateOfBirth')}
              </div>
            )}
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-0 flex justify-end gap-3">
          <button
            className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            {t('cancel')}
          </button>
          <button
            className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-[#0071e2] flex items-center justify-center gap-2"
            onClick={handleCreate}
            disabled={loading}
            type="button"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                {t('creating')}
              </>
            ) : (
              t('create')
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAdminModal;

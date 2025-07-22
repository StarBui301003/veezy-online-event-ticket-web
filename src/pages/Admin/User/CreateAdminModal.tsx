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
import type { CreateAdminRequest } from '@/types/Admin/user';
import { FaSpinner } from 'react-icons/fa';
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
  const GENDER_OPTIONS = [
    { value: 0, label: t('male') },
    { value: 1, label: t('female') },
  ];
  const [form, setForm] = useState<CreateAdminRequest>({
    username: '',
    email: '',
    phone: '',
    password: '',
    gender: 0,
    fullName: '',
    dateOfBirth: '',
  });
  const [loading, setLoading] = useState(false);

  // Use validation hook
  const { validateForm, handleApiError, getFieldError, getErrorClass, clearFieldError } =
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
    const isValid = validateForm(form, validateCreateAdminForm);

    if (!isValid) {
      return;
    }

    setLoading(true);
    try {
      await createAdminAPI(form);
      toast.success(t('adminAccountCreatedSuccessfully'));
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
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>{t('createAdmin')}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('username')}</label>
            <input
              className={getErrorClass('username', 'border px-3 py-2 rounded w-full')}
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
            <label className="block text-xs text-gray-500 mb-1">{t('email')}</label>
            <input
              className={getErrorClass('email', 'border px-3 py-2 rounded w-full')}
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
            <label className="block text-xs text-gray-500 mb-1">{t('phone')}</label>
            <input
              className={getErrorClass('phone', 'border px-3 py-2 rounded w-full')}
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
            <label className="block text-xs text-gray-500 mb-1">{t('password')}</label>
            <input
              className={getErrorClass('password', 'border px-3 py-2 rounded w-full')}
              type="password"
              value={form.password}
              onChange={handlePasswordChange}
              disabled={loading}
              placeholder={t('enterPassword')}
            />
            {getFieldError('password') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('password')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('fullName')}</label>
            <input
              className={getErrorClass('fullName', 'border px-3 py-2 rounded w-full')}
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
            <label className="block text-xs text-gray-500 mb-1">{t('gender')}</label>
            <select
              className={getErrorClass('gender', 'border px-3 py-2 rounded w-full')}
              value={form.gender}
              onChange={e => handleGenderChange(e.target.value)}
              disabled={loading}
            >
              {GENDER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {getFieldError('gender') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('gender')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('dateOfBirth')}</label>
            <input
              className={getErrorClass('dateOfBirth', 'border px-3 py-2 rounded w-full')}
              type="date"
              value={form.dateOfBirth}
              onChange={e => setForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
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
        <div className="p-4 flex justify-end gap-2">
          <DialogFooter>
            <button
              className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
              onClick={onClose}
              disabled={loading}
              type="button"
            >
              {t('cancel')}
            </button>
            <button
              className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2] flex items-center justify-center gap-2"
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
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAdminModal;

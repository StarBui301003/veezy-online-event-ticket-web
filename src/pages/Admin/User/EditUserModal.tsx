import { useState, ChangeEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { User } from '@/types/auth';
import type { UserAccountResponse } from '@/types/Admin/user';
import { editUserAPI, uploadUserAvatarAPI } from '@/services/Admin/user.service';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { FaSpinner } from 'react-icons/fa';
import { NO_AVATAR } from '@/assets/img';
import { useTranslation } from 'react-i18next';
import { validateEditUserForm } from '@/utils/validation';
import {
  useAdminValidation,
  createFieldChangeHandler,
  createCustomChangeHandler,
} from '@/hooks/use-admin-validation';

interface Props {
  user: User | UserAccountResponse;
  onClose: () => void;
  onUpdated?: (user: User | UserAccountResponse) => void;
  disableEmail?: boolean; // Cho phép disable email input nếu cần
  title?: string;
}

export const EditUserModal = ({ user, onClose, onUpdated, disableEmail = false }: Props) => {
  // Check if user is UserAccountResponse (has accountId property)
  const isUserAccountResponse = 'accountId' in user;

  // Convert UserAccountResponse to User format for editing
  const userForEdit: User = isUserAccountResponse
    ? {
        userId: user.userId,
        accountId: user.accountId,
        fullName: user.fullName,
        phone: user.phone || '',
        email: user.email,
        avatarUrl: user.avatarUrl || '',
        gender: typeof user.gender === 'string' ? parseInt(user.gender) : user.gender,
        dob: user.dob || '',
        location: user.location || '',
        createdAt: user.createdAt,
      }
    : user;

  const [form, setForm] = useState<User>({ ...userForEdit });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(user.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  // Use validation hook
  const { validateForm, handleApiError, getFieldError, clearFieldError } = useAdminValidation({
    showToastOnValidation: false, // Only show inline errors, no toast for validation
    showToastOnApiError: true, // Keep toast for API errors
  });

  // Field change handlers with error clearing
  const handleFullNameChange = createFieldChangeHandler(
    'fullName',
    (value: string) => {
      setForm((prev) => ({ ...prev, fullName: value }));
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

  const handleGenderChange = createCustomChangeHandler(
    'gender',
    (value: string) => {
      setForm((prev) => ({ ...prev, gender: Number(value) as 0 | 1 | 2 }));
    },
    clearFieldError
  );

  const handleDobChange = createFieldChangeHandler(
    'dob',
    (value: string) => {
      setForm((prev) => ({ ...prev, dob: value }));
    },
    clearFieldError
  );

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEdit = async () => {
    // Validate form using comprehensive validation
    const isValid = validateForm(form, validateEditUserForm);

    if (!isValid) {
      return;
    }

    setLoading(true);
    try {
      await editUserAPI(form.userId, {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        location: form.location,
        dob: form.dob,
        gender: form.gender,
      });
      if (avatarFile instanceof File) {
        await uploadUserAvatarAPI(form.userId, avatarFile);
      }
      if (onUpdated) {
        if (isUserAccountResponse) {
          // Convert back to UserAccountResponse format
          const updatedUserAccount: UserAccountResponse = {
            ...(user as UserAccountResponse),
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            location: form.location,
            dob: form.dob,
            gender: form.gender.toString(),
            avatarUrl: avatarFile ? previewUrl : user.avatarUrl,
          };
          onUpdated(updatedUserAccount);
        } else {
          onUpdated(form);
        }
      }
      onClose();
      setAvatarFile(null);
    } catch (error: unknown) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>{t('editUser')}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto p-4">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="w-20 h-20 rounded-full border-4 border-blue-400 bg-gray-100 flex items-center justify-center overflow-hidden shadow">
              {previewUrl ? (
                <img src={previewUrl} alt="avatar" className="object-cover w-full h-full" />
              ) : (
                <img src={NO_AVATAR} alt="no avatar" className="object-cover w-full h-full" />
              )}
            </div>
            <input
              id="edit-avatar-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              className="mt-2 w-[100px] h-[38px] rounded-[8px] bg-[#f3f7fe] text-[#3b82f6] border-none cursor-pointer font-medium text-base transition duration-300 hover:bg-[#3b82f6] hover:text-white hover:shadow-[0_0_0_5px_#3b83f65f]"
              onClick={() => document.getElementById('edit-avatar-input')?.click()}
              tabIndex={-1}
            >
              {t('editAvatar')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {t('fullName')}
              </label>
              <input
                name="fullName"
                className="border border-gray-200 rounded px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300"
                value={form.fullName}
                onChange={handleFullNameChange}
              />
              {getFieldError('fullName') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('fullName')}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('email')}</label>
              <input
                name="email"
                className="border border-gray-200 rounded px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300"
                value={form.email}
                onChange={handleEmailChange}
                disabled={disableEmail}
              />
              {getFieldError('email') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('email')}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('phone')}</label>
              <input
                name="phone"
                className="border border-gray-200 rounded px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300"
                value={form.phone}
                onChange={handlePhoneChange}
              />
              {getFieldError('phone') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('phone')}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('gender')}</label>
              <Select value={String(form.gender)} onValueChange={handleGenderChange}>
                <SelectTrigger className="border border-gray-200 rounded px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t('male')}</SelectItem>
                  <SelectItem value="1">{t('female')}</SelectItem>
                  <SelectItem value="2">{t('other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {t('dateOfBirth')}
              </label>
              <input
                name="dob"
                type="date"
                className="border border-gray-200 rounded px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300"
                value={form.dob ? form.dob.slice(0, 10) : ''}
                onChange={handleDobChange}
              />
              {getFieldError('dob') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('dob')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 flex justify-end gap-2">
          <DialogFooter>
            <button
              className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500 mr-2"
              onClick={onClose}
              disabled={loading}
              type="button"
            >
              {t('cancel')}
            </button>
            <button
              className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
              onClick={handleEdit}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  {t('editing')}
                </div>
              ) : (
                t('edit')
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;

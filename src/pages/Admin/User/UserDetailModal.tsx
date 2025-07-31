import { NO_AVATAR } from '@/assets/img';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { User } from '@/types/auth';
import type { UserAccountResponse } from '@/types/Admin/user';
import { useTranslation } from 'react-i18next';

interface Props {
  user: User | UserAccountResponse;
  onClose: () => void;
}

export const UserDetailModal = ({ user, onClose }: Props) => {
  const { t } = useTranslation();

  // Check if user is UserAccountResponse (has accountId property)
  const isUserAccountResponse = 'accountId' in user;

  const genderLabel = (gender: number | string) => {
    if (typeof gender === 'number') {
      return gender === 0 ? t('male') : gender === 1 ? t('female') : t('other');
    }
    return gender === '0' ? t('male') : gender === '1' ? t('female') : t('other');
  };

  const getGenderValue = () => {
    if (isUserAccountResponse) {
      return genderLabel(user.gender);
    }
    return genderLabel((user as User).gender);
  };

  const getDobValue = () => {
    if (isUserAccountResponse) {
      return user.dob ? new Date(user.dob).toLocaleDateString() : '';
    }
    return (user as User).dob ? new Date((user as User).dob).toLocaleDateString() : '';
  };

  const getCreatedAtValue = () => {
    if (isUserAccountResponse) {
      return new Date(user.createdAt).toLocaleDateString();
    }
    return '';
  };

  const getLastActiveValue = () => {
    if (isUserAccountResponse) {
      return new Date((user as UserAccountResponse).lastActiveAt).toLocaleDateString();
    }
    return '';
  };

  const getLastLoginValue = () => {
    if (isUserAccountResponse) {
      return new Date((user as UserAccountResponse).lastLogin).toLocaleDateString();
    }
    return '';
  };

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>{t('userDetails')}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto p-4 pt-0 flex flex-col items-center">
          <div className="flex flex-col items-start gap-3 mb-6 w-full">
            <div className="w-20 h-20 rounded-full border-4 border-blue-400 bg-gray-100 flex items-center justify-center overflow-hidden shadow mx-auto">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="object-cover w-full h-full" />
              ) : (
                <img src={NO_AVATAR} alt="no avatar" className="object-cover w-full h-full" />
              )}
            </div>
            <div className="w-full">
              <label className="block text-xs text-gray-500 mb-1">{t('fullName')}</label>
              <input
                className="text-lg text-gray-800 bg-gray-200 border rounded px-2 py-1 w-full mb-1 text-left"
                value={user.fullName}
                readOnly
              />
            </div>
            <div className="w-full">
              <label className="block text-xs text-gray-500 mb-1">{t('email')}</label>
              <input
                className="text-gray-600 bg-gray-200 border rounded px-2 py-1 w-full mb-1 text-left"
                value={user.email}
                readOnly
              />
            </div>
            <div className="w-full">
              <label className="block text-xs text-gray-500 mb-1">{t('phone')}</label>
              <input
                className="text-gray-600 bg-gray-200 border rounded px-2 py-1 w-full text-left"
                value={user.phone || ''}
                readOnly
                placeholder={t('nA')}
              />
            </div>

            {/* Account information for UserAccountResponse */}
            {isUserAccountResponse && (
              <>
                <div className="w-full">
                  <label className="block text-xs text-gray-500 mb-1">Username</label>
                  <input
                    className="text-gray-600 bg-gray-200 border rounded px-2 py-1 w-full text-left"
                    value={(user as UserAccountResponse).username}
                    readOnly
                  />
                </div>
                <div className="w-full">
                  <label className="block text-xs text-gray-500 mb-1">Role</label>
                  <input
                    className="text-gray-600 bg-gray-200 border rounded px-2 py-1 w-full text-left"
                    value={(user as UserAccountResponse).role}
                    readOnly
                  />
                </div>
                <div className="w-full">
                  <label className="block text-xs text-gray-500 mb-1">Status</label>
                  <input
                    className={`text-gray-600 bg-gray-200 border rounded px-2 py-1 w-full text-left ${
                      (user as UserAccountResponse).isActive ? 'text-green-600' : 'text-red-600'
                    }`}
                    value={(user as UserAccountResponse).isActive ? 'Active' : 'Inactive'}
                    readOnly
                  />
                </div>
                <div className="w-full">
                  <label className="block text-xs text-gray-500 mb-1">Online Status</label>
                  <input
                    className={`text-gray-600 bg-gray-200 border rounded px-2 py-1 w-full text-left ${
                      (user as UserAccountResponse).isOnline ? 'text-blue-600' : 'text-gray-600'
                    }`}
                    value={(user as UserAccountResponse).isOnline ? 'Online' : 'Offline'}
                    readOnly
                  />
                </div>
                <div className="w-full">
                  <label className="block text-xs text-gray-500 mb-1">Email Verified</label>
                  <input
                    className={`text-gray-600 bg-gray-200 border rounded px-2 py-1 w-full text-left ${
                      (user as UserAccountResponse).isEmailVerified
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    }`}
                    value={
                      (user as UserAccountResponse).isEmailVerified ? 'Verified' : 'Not Verified'
                    }
                    readOnly
                  />
                </div>
                <div className="w-full">
                  <label className="block text-xs text-gray-500 mb-1">Last Active</label>
                  <input
                    className="text-gray-600 bg-gray-200 border rounded px-2 py-1 w-full text-left"
                    value={getLastActiveValue()}
                    readOnly
                  />
                </div>
                <div className="w-full">
                  <label className="block text-xs text-gray-500 mb-1">Last Login</label>
                  <input
                    className="text-gray-600 bg-gray-200 border rounded px-2 py-1 w-full text-left"
                    value={getLastLoginValue()}
                    readOnly
                  />
                </div>
                <div className="w-full">
                  <label className="block text-xs text-gray-500 mb-1">Created At</label>
                  <input
                    className="text-gray-600 bg-gray-200 border rounded px-2 py-1 w-full text-left"
                    value={getCreatedAtValue()}
                    readOnly
                  />
                </div>
              </>
            )}

            {/* Gender and Date of Birth on the same row */}
            <div className="flex flex-row gap-4 w-full mb-0">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">{t('gender')}</label>
                <input
                  className="bg-gray-200 border rounded px-2 py-1 w-full text-left"
                  value={getGenderValue()}
                  readOnly
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">{t('dateOfBirth')}</label>
                <input
                  className="bg-gray-200 border rounded px-2 py-1 w-full text-left"
                  value={getDobValue()}
                  readOnly
                  placeholder={t('nA')}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <DialogFooter>
            <button
              className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
              onClick={onClose}
              type="button"
            >
              {t('close')}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;

import { NO_AVATAR } from '@/assets/img';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { User } from '@/types/auth';

interface Props {
  user: User;
  onClose: () => void;
}

export const UserDetailModal = ({ user, onClose }: Props) => {
  const genderLabel = (gender: number) =>
    gender === 0 ? 'Male' : gender === 1 ? 'Female' : 'Other';

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
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
              <label className="block text-xs text-gray-500 mb-1">Full Name</label>
              <input
                className="text-lg text-gray-800 bg-gray-200 border rounded px-2 py-1 w-full mb-1 text-left"
                value={user.fullName}
                readOnly
              />
            </div>
            <div className="w-full">
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                className="text-gray-600 bg-gray-200 border rounded px-2 py-1 w-full mb-1 text-left"
                value={user.email}
                readOnly
              />
            </div>
            <div className="w-full">
              <label className="block text-xs text-gray-500 mb-1">Phone</label>
              <input
                className="text-gray-600 bg-gray-200 border rounded px-2 py-1 w-full text-left"
                value={user.phone || ''}
                readOnly
                placeholder="N/A"
              />
            </div>
            {/* Gender and Date of Birth on the same row */}
            <div className="flex flex-row gap-4 w-full mb-0">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Gender</label>
                <input
                  className="bg-gray-200 border rounded px-2 py-1 w-full text-left"
                  value={genderLabel(user.gender)}
                  readOnly
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Date of Birth</label>
                <input
                  className="bg-gray-200 border rounded px-2 py-1 w-full text-left"
                  value={user.dob ? new Date(user.dob).toLocaleDateString() : ''}
                  readOnly
                  placeholder="N/A"
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
              Close
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;

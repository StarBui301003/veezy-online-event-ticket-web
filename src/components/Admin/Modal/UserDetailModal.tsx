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
        <div className="border-b-2 border-gray-400 pb-4 p-4">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto p-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border bg-gray-100 flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="object-cover w-full h-full" />
              ) : (
                <span className="text-gray-400">No Avatar</span>
              )}
            </div>
            <div>
              <div>
                <b>Full Name:</b> {user.fullName}
              </div>
              <div>
                <b>Email:</b> {user.email}
              </div>
              <div>
                <b>Phone:</b> {user.phone || <span className="text-gray-400">N/A</span>}
              </div>
            </div>
          </div>
          <div>
            <b>Gender:</b> {genderLabel(user.gender)}
          </div>
          <div>
            <b>Date of Birth:</b>{' '}
            {user.dob ? (
              new Date(user.dob).toLocaleDateString()
            ) : (
              <span className="text-gray-400">N/A</span>
            )}
          </div>
          <div>
            <b>Hobbies:</b>{' '}
            {user.categories && user.categories.length > 0 ? (
              user.categories.map((cat) => cat.categoryName).join(', ')
            ) : (
              <span className="text-gray-400">N/A</span>
            )}
          </div>
        </div>
        <div className="p-4 border-t-2 border-gray-400">
          <DialogFooter>
            <button
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              onClick={onClose}
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Comment } from '@/types/Admin/comment';

interface Props {
  comment: Comment;
  userName?: string;
  eventName?: string;
  onClose: () => void;
}

const CommentDetailModal = ({ comment, userName, eventName, onClose }: Props) => {
  return (
    <Dialog open={!!comment} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Comment Details</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Comment ID</label>
              <input
                value={comment.commentId}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">User</label>
              <input
                value={userName || comment.userId || 'unknown'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Event</label>
              <input
                value={eventName || comment.eventId || 'unknown'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <input
                value={comment.isActive ? 'Active' : 'Inactive'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Content</label>
              <div className="bg-gray-100 border rounded px-2 py-1 w-full mb-1 min-h-[40px] max-h-[120px] overflow-y-auto">
                {comment.content ? (
                  <span>{comment.content}</span>
                ) : (
                  <span className="text-gray-400">No content</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Created At</label>
              <input
                value={
                  comment.createdAt
                    ? new Date(comment.createdAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'unknown'
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Updated At</label>
              <input
                value={
                  comment.updatedAt
                    ? new Date(comment.updatedAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'unknown'
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
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

export default CommentDetailModal;

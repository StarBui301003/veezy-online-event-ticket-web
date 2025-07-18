import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Comment } from '@/types/Admin/comment';
import { deleteComment } from '@/services/Admin/comment.service';
import { toast } from 'react-toastify';
import { FaRegTrashAlt } from 'react-icons/fa';
import { useState } from 'react';

interface Props {
  comment: Comment;
  eventName?: string;
  onClose: () => void;
  onDelete: () => void;
}

const CommentDetailModal = ({ comment, eventName, onClose, onDelete }: Props) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    setIsDeleting(true);
    try {
      const res = await deleteComment(comment.commentId);
      if (res?.flag) {
        toast.success('Comment deleted successfully!');
        onDelete(); // Refresh the list
        onClose(); // Close modal
      } else {
        toast.error(res?.message || 'Cannot delete this comment!');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.message || 'Cannot delete this comment!');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={!!comment} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <img
                src={comment.avatarUrl || '/src/assets/img/avatar_default.png'}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/src/assets/img/avatar_default.png';
                }}
              />
              <div>
                <h3 className="text-lg font-semibold">Comment Details</h3>
                <p className="text-sm text-gray-600">{comment.fullName || 'Unknown User'}</p>
              </div>
            </DialogTitle>
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
                value={comment.fullName || 'Unknown User'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Event</label>
              <input
                value={eventName || comment.eventId || 'Unknown Event'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Content</label>
              <div className="bg-gray-100 border rounded px-3 py-2 w-full mb-1 min-h-[60px] max-h-[200px] overflow-y-auto">
                {comment.content ? (
                  <span className="whitespace-pre-wrap">{comment.content}</span>
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
                    : 'Unknown'
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
                    : 'Not updated'
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
          </div>
        </div>
        <div className="p-4">
          <DialogFooter className="flex justify-between">
            <button
              className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={handleDelete}
              disabled={isDeleting}
              type="button"
            >
              <FaRegTrashAlt className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete Comment'}
            </button>
            <button
              className="border-2 border-gray-400 bg-gray-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-gray-500 hover:border-gray-400"
              onClick={onClose}
              disabled={isDeleting}
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

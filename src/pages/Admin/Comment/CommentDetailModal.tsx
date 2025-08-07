import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

      // Debug: Log response để hiểu cấu trúc
      console.log('Delete response:', res);

      // Kiểm tra response một cách linh hoạt hơn
      // API có thể trả về Comment object, boolean, hoặc response khác
      const isSuccess =
        res &&
        (res.commentId || // Nếu trả về Comment object
          (typeof res === 'object' && res !== null) || // Nếu trả về object khác
          (typeof res === 'boolean' && res === true) || // Nếu trả về boolean true
          (typeof res === 'string' && (res as string).toLowerCase() === 'success')); // Nếu trả về string

      if (isSuccess) {
        toast.success('Comment deleted successfully!');
        onDelete(); // Refresh the list
        onClose(); // Close modal
      } else {
        // Nếu response là false hoặc không có dữ liệu mong đợi
        console.warn('Delete response indicates failure:', res);
        toast.error('Failed to delete comment!');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Delete comment error:', err);
      toast.error(err?.message || 'Cannot delete this comment!');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={!!comment} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 p-0 shadow-lg rounded-xl border-0 dark:border-0">
        <div className="p-6 border-b border-gray-200 dark:border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
              <img
                src={comment.avatarUrl || '/src/assets/img/avatar_default.png'}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/src/assets/img/avatar_default.png';
                }}
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Comment Details
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {comment.fullName || 'Unknown User'}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                User
              </label>
              <input
                value={comment.fullName || 'Unknown User'}
                readOnly
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Event
              </label>
              <input
                value={eventName || comment.eventId || 'Unknown Event'}
                readOnly
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Content
              </label>
              <div className="bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 w-full min-h-[60px] max-h-[200px] overflow-y-auto">
                {comment.content ? (
                  <span className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                    {comment.content}
                  </span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">No content</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Created At
              </label>
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
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Updated At
              </label>
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
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-0 flex justify-between">
          <button
            className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleDelete}
            disabled={isDeleting}
            type="button"
          >
            <FaRegTrashAlt className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete Comment'}
          </button>
          <button
            className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
            onClick={onClose}
            disabled={isDeleting}
            type="button"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentDetailModal;

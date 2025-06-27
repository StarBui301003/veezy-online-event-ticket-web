import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { News } from '@/types/Admin/news';
import { NO_IMAGE } from '@/assets/img';

interface Props {
  news: News | null;
  authorName?: string;
  onClose: () => void;
}

export const RejectedNewsDetailModal = ({ news, authorName, onClose }: Props) => {
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = NO_IMAGE;
  };

  if (!news) return null;

  return (
    <Dialog open={!!news} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Rejected News Details</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">News ID</label>
              <input
                value={news.newsId ?? 'unknown'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Author Name</label>
              <input
                value={authorName || 'unknown'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Title</label>
              <input
                value={news.newsTitle ?? 'unknown'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <input
                value="Rejected"
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Created At</label>
              <input
                value={
                  news.createdAt ? new Date(news.createdAt).toLocaleString('vi-VN') : 'unknown'
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Updated At</label>
              <input
                value={
                  news.updatedAt ? new Date(news.updatedAt).toLocaleString('vi-VN') : 'unknown'
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea
              value={news.newsDescription ?? 'unknown'}
              readOnly
              className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Content</label>
            <div
              className="bg-gray-100 border rounded px-2 py-2 w-full mb-1 prose"
              dangerouslySetInnerHTML={{ __html: news.newsContent ?? '' }}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Image</label>
            <img
              src={news.imageUrl || NO_IMAGE}
              alt="news"
              className="h-32 w-32 object-cover rounded border"
              onError={handleImgError}
            />
          </div>
        </div>
        <div className="p-4">
          <DialogFooter>
            <button
              className="border-2 border-red-500 bg-white rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500"
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

export default RejectedNewsDetailModal;

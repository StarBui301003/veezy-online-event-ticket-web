import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { News } from '@/types/Admin/news';
import { NO_IMAGE } from '@/assets/img';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  news: News;
  authorName?: string;
  onClose: () => void;
}

const NewsOwnDetailModal = ({ news, onClose }: Props) => {
  const [imgLoading, setImgLoading] = useState(!!news.imageUrl);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = NO_IMAGE;
    setImgLoading(false);
  };

  // Render content HTML giữ nguyên thẻ p, b, strong, ...
  function renderHtmlContent(html: string) {
    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <Dialog open={!!news} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>News Details</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto p-4">
          {/* Cover Image */}
          <div className="flex flex-col items-center mb-4">
            <div className="w- h-48 rounded border bg-gray-100 flex items-center justify-center overflow-hidden mt-1 relative">
              {imgLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
                </div>
              )}
              <img
                src={news.imageUrl || NO_IMAGE}
                alt="news"
                className="object-contain w-full h-full"
                style={imgLoading ? { opacity: 0 } : { opacity: 1, transition: 'opacity 0.2s' }}
                onLoad={() => setImgLoading(false)}
                onError={handleImgError}
              />
            </div>
          </div>
          {/* Info fields as input/textarea (style giống approvedeventdetail) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* <div>
              <label className="block text-xs text-gray-500 mb-1">News ID</label>
              <input
                value={news.newsId ?? 'unknown'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div> */}
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
                value={news.status ? 'Active' : 'Inactive'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Created At</label>
              <input
                value={
                  news.createdAt
                    ? new Date(news.createdAt).toLocaleString('vi-VN', {
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
                  news.updatedAt
                    ? new Date(news.updatedAt).toLocaleString('vi-VN', {
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
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <div className="bg-gray-100 border rounded px-2 py-1 w-full mb-1 min-h-[40px] max-h-[120px] overflow-y-auto">
              {news.newsDescription ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: news.newsDescription }}
                />
              ) : (
                <span className="text-gray-400">No description</span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Content</label>
            <div className="bg-gray-100 border rounded px-2 py-1 w-full mb-1 min-h-[60px]">
              {news.newsContent ? (
                renderHtmlContent(news.newsContent)
              ) : (
                <span className="text-gray-400">No content</span>
              )}
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

export default NewsOwnDetailModal;

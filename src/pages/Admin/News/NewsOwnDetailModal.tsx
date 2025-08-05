import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { News } from '@/types/Admin/news';
import { NO_IMAGE } from '@/assets/img';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getApprovedEvents } from '@/services/Admin/event.service';

// Utility function to decode HTML entities
const decodeHtmlEntities = (html: string): string => {
  if (typeof window === 'undefined') return html; // Server-side rendering
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

interface Props {
  news: News;
  onClose: () => void;
}

const NewsOwnDetailModal = ({ news, onClose }: Props) => {
  const [imgLoading, setImgLoading] = useState(!!news.imageUrl);
  const [eventName, setEventName] = useState<string>('unknown');
  const [loadingEvent, setLoadingEvent] = useState(false);

  useEffect(() => {
    if (news?.eventId) {
      setLoadingEvent(true);
      getApprovedEvents()
        .then((res) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const found = res.data?.items?.find((ev: any) => ev.eventId === news.eventId);
          setEventName(found?.eventName || news.eventId || 'unknown');
        })
        .catch(() => setEventName(news.eventId || 'unknown'))
        .finally(() => setLoadingEvent(false));
    }
  }, [news?.eventId]);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = NO_IMAGE;
    setImgLoading(false);
  };

  // Render content HTML với format layout bài báo và giải mã thẻ HTML
  function renderHtmlContent(html: string) {
    const decodedHtml = decodeHtmlEntities(html);

    return (
      <div
        className="prose prose-sm max-w-none text-gray-800 dark:text-white leading-relaxed prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-800 dark:prose-p:text-white prose-strong:text-gray-900 dark:prose-strong:text-white prose-em:text-gray-800 dark:prose-em:text-white prose-ul:text-gray-800 dark:prose-ul:text-white prose-ol:text-gray-800 dark:prose-ol:text-white prose-li:text-gray-800 dark:prose-li:text-white prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300 prose-code:text-gray-800 dark:prose-code:text-white prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-h5:text-sm prose-h6:text-xs prose-h1:font-bold prose-h2:font-bold prose-h3:font-semibold prose-h4:font-semibold prose-h5:font-medium prose-h6:font-medium prose-h1:mb-4 prose-h2:mb-3 prose-h3:mb-2 prose-h4:mb-2 prose-h5:mb-1 prose-h6:mb-1 prose-p:mb-3 prose-ul:mb-3 prose-ol:mb-3 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-3 prose-pre:rounded prose-pre:overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: decodedHtml }}
        style={{
          lineHeight: '1.6',
          fontSize: '14px',
        }}
      />
    );
  }

  return (
    <Dialog open={!!news} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 p-0 shadow-lg rounded-xl border-0 dark:border-0">
        <div className="p-6 border-b border-gray-200 dark:border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
              News Details
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
          {/* Cover Image */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-full h-48 rounded border bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden mt-1 relative">
              {imgLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 dark:bg-gray-800/60">
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
            {/* Event Name/ID */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Event
              </label>
              <input
                value={loadingEvent ? 'Loading...' : eventName}
                readOnly
                tabIndex={0}
                className="bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left text-gray-600 dark:text-gray-300 cursor-text select-all focus:outline-none"
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Title
              </label>
              <input
                value={news.newsTitle ?? 'unknown'}
                readOnly
                className="bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left text-gray-600 dark:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Status
              </label>
              <input
                value={news.status ? 'Active' : 'Inactive'}
                readOnly
                className="bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left text-gray-600 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Created At
              </label>
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
                className="bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left text-gray-600 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Updated At
              </label>
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
                className="bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left text-gray-600 dark:text-gray-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Description
            </label>
            <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full min-h-[60px] max-h-[150px] overflow-y-auto">
              {news.newsDescription ? (
                <div
                  className="prose prose-sm max-w-none text-gray-800 dark:text-white leading-relaxed prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-800 dark:prose-p:text-white prose-strong:text-gray-900 dark:prose-strong:text-white prose-em:text-gray-800 dark:prose-em:text-white prose-ul:text-gray-800 dark:prose-ul:text-white prose-ol:text-gray-800 dark:prose-ol:text-white prose-li:text-gray-800 dark:prose-li:text-white prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300 prose-code:text-gray-800 dark:prose-code:text-white prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-h5:text-sm prose-h6:text-xs prose-h1:font-bold prose-h2:font-bold prose-h3:font-semibold prose-h4:font-semibold prose-h5:font-medium prose-h6:font-medium prose-h1:mb-4 prose-h2:mb-3 prose-h3:mb-2 prose-h4:mb-2 prose-h5:mb-1 prose-h6:mb-1 prose-p:mb-3 prose-ul:mb-3 prose-ol:mb-3 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-3 prose-pre:rounded prose-pre:overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(news.newsDescription) }}
                  style={{
                    lineHeight: '1.5',
                    fontSize: '13px',
                  }}
                />
              ) : (
                <span className="text-gray-400 dark:text-gray-500">No description</span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Content
            </label>
            <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full min-h-[120px] max-h-[300px] overflow-y-auto">
              {news.newsContent ? (
                <div className="prose prose-sm max-w-none">
                  {renderHtmlContent(news.newsContent)}
                </div>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">No content</span>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-0 flex justify-end gap-3">
          <button
            className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewsOwnDetailModal;

/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { News } from '@/types/Admin/news';
import { ApprovedNews, RejectedNews } from '@/services/Admin/news.service';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import { NO_IMAGE } from '@/assets/img';
import { useTranslation } from 'react-i18next';

interface Props {
  news: News | null;
  authorName?: string;
  onClose: () => void;
  onActionDone?: () => void;
}

export const PendingNewsDetailModal = ({ news, authorName, onClose, onActionDone }: Props) => {
  const [loading, setLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { t } = useTranslation();

  if (!news) return null;

  const handleApprove = async () => {
    setApproveLoading(true);
    setLoading(true);
    try {
      await ApprovedNews(news.newsId);
      toast.success('Approve news successfully!');
      onClose();
      onActionDone && onActionDone();
    } catch {
      toast.error('Approve news failed!');
    } finally {
      setApproveLoading(false);
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason!');
      return;
    }
    setRejectLoading(true);
    setLoading(true);
    try {
      await RejectedNews(news.newsId, rejectionReason);
      toast.success('Reject news successfully!');
      onClose();
      onActionDone && onActionDone();
    } catch {
      toast.error('Reject news failed!');
    } finally {
      setRejectLoading(false);
      setLoading(false);
    }
  };

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = NO_IMAGE;
  };

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
            <div className="w-full h-48 rounded border bg-gray-100 flex items-center justify-center overflow-hidden mt-1 relative">
              <img
                src={news.imageUrl || NO_IMAGE}
                alt="news"
                className="object-contain w-full h-full"
                onError={handleImgError}
              />
            </div>
          </div>
          {/* Info fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('title')}</label>
              <input
                value={news.newsTitle ?? t('unknown')}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('authorName')}</label>
              <input
                value={authorName || t('unknown')}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('status')}</label>
              <input
                value={news.status ? t('active') : t('inactive')}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('createdAt')}</label>
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
                    : t('unknown')
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
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: news.newsContent }}
                />
              ) : (
                <span className="text-gray-400">No content</span>
              )}
            </div>
          </div>
        </div>
        <div className="p-4">
          <DialogFooter>
            {showRejectInput ? (
              <>
                <input
                  className="border px-2 py-1 rounded w-full mb-2"
                  placeholder="Enter rejection reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  disabled={loading}
                />
                <button
                  className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-red-600 hover:text-white hover:border-red-500 mr-2 flex items-center justify-center"
                  onClick={handleReject}
                  disabled={loading || rejectLoading}
                  type="button"
                >
                  {rejectLoading && <FaSpinner className="animate-spin mr-2" />}
                  Submit
                </button>
                <button
                  className="border-2 border-[#24b4fb] bg-white rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-[#24b4fb] hover:bg-[#24b4fb] hover:text-white hover:border-[#24b4fb]"
                  onClick={() => setShowRejectInput(false)}
                  disabled={loading || rejectLoading}
                  type="button"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  className="flex gap-2 items-center border-2 border-green-500 bg-green-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-green-600 hover:text-white hover:border-green-500"
                  style={{ boxSizing: 'border-box' }}
                  onClick={handleApprove}
                  disabled={loading || approveLoading}
                  type="button"
                >
                  {approveLoading && <FaSpinner className="animate-spin mr-2" />}
                  Approve
                </button>
                <button
                  className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-red-600 hover:text-white-500 hover:border-red-500"
                  style={{ boxSizing: 'border-box' }}
                  onClick={() => setShowRejectInput(true)}
                  disabled={loading || approveLoading}
                  type="button"
                >
                  Reject
                </button>
                <button
                  className="border-2 border-red-500 bg-white rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500"
                  onClick={onClose}
                  disabled={loading || approveLoading}
                  type="button"
                >
                  Close
                </button>
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PendingNewsDetailModal;

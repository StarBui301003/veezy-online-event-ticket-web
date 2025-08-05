/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { updateNews } from '@/services/Admin/news.service';
import { getApprovedEvents } from '@/services/Admin/event.service';
import type { News } from '@/types/Admin/news';
import { RichTextEditor } from '@/components/RichTextEditor';
import { useThemeClasses } from '@/hooks/useThemeClasses';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { FaSpinner, FaUpload } from 'react-icons/fa';
import { NO_IMAGE } from '@/assets/img';

const initialLexicalValue = ''; // TipTap dùng HTML string

interface Props {
  news: (News & { newsId: string }) | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export const EditNewsModal = ({ news, onClose, onUpdated }: Props) => {
  const { getProfileInputClass, getSelectClass } = useThemeClasses();
  const [form, setForm] = useState({
    eventId: '',
    newsDescription: '',
    newsTitle: '',
    newsContent: initialLexicalValue,
    authorId: '',
    imageUrl: '',
    status: true,
  });
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<{ eventId: string; eventName: string }[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (news) {
      setForm({
        eventId: news.eventId || '',
        newsDescription: news.newsDescription || '',
        newsTitle: news.newsTitle || '',
        newsContent: typeof news.newsContent === 'string' ? news.newsContent : initialLexicalValue,
        authorId: news.authorId || '',
        imageUrl: news.imageUrl || '',
        status: news.status ?? true,
      });
    }
  }, [news]);

  useEffect(() => {
    if (news) {
      getApprovedEvents()
        .then((res) => {
          setEvents(res.data.items || []);
        })
        .catch(() => setEvents([]));
    }
  }, [news]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imageUrl: url }));
  };

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = NO_IMAGE;
  };

  const handleEdit = async () => {
    if (!form.newsTitle.trim()) {
      alert('Title is required!');
      return;
    }
    if (!form.newsDescription.trim()) {
      alert('Description is required!');
      return;
    }
    if (!form.eventId) {
      alert('Event is required!');
      return;
    }
    setLoading(true);
    try {
      await updateNews(news.newsId, {
        ...form,
        newsContent: form.newsContent,
      });
      onUpdated && onUpdated();
      setLoading(false); // Đặt loading về false trước khi đóng modal
      onClose();
    } catch {
      setLoading(false); // Đảm bảo loading về false khi có lỗi
    }
  };

  return (
    <Dialog open={!!news} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 p-0 shadow-lg rounded-xl border-0 dark:border-0">
        <div className="p-6 border-b border-gray-200 dark:border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Edit News
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Event
            </label>
            <Select
              value={form.eventId}
              onValueChange={(value) => setForm((prev) => ({ ...prev, eventId: value }))}
              disabled={loading}
            >
              <SelectTrigger
                className={`border rounded px-3 py-2 w-full transition-colors ${getSelectClass()}`}
              >
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                {events.map((ev) => (
                  <SelectItem key={ev.eventId} value={ev.eventId} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                    {ev.eventName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Title
            </label>
            <input
              className={`border rounded px-3 py-2 w-full transition-colors ${getProfileInputClass()}`}
              name="newsTitle"
              value={form.newsTitle}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Enter news title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Description
            </label>
            <textarea
              className={`border rounded px-3 py-2 w-full transition-colors ${getProfileInputClass()}`}
              name="newsDescription"
              value={form.newsDescription}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Enter description"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Content
            </label>
            <RichTextEditor
              value={form.newsContent}
              onChange={(val: string) => setForm((prev) => ({ ...prev, newsContent: val }))}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Image
            </label>
            <div className="flex items-center gap-2 mb-2">
              <label
                className="flex gap-2 items-center border-2 border-blue-500 bg-blue-500 rounded-[0.9em] cursor-pointer px-4 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-blue-600 hover:text-white hover:border-blue-500"
                style={{ marginBottom: 0 }}
              >
                <FaUpload />
                Import
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={loading}
                  className="hidden m-0"
                />
              </label>
              <div className="flex items-center gap-2">
                <img
                  src={form.imageUrl || NO_IMAGE}
                  alt="Preview"
                  className="h-12 w-12 object-cover rounded border"
                  onError={handleImgError}
                />
                {imageFile && (
                  <span className="text-xs text-gray-700 max-w-[120px] truncate block">
                    {imageFile.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-0 flex justify-end gap-3">
          <button
            className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            Cancel
          </button>
          <button
            className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-[#0071e2]"
            onClick={handleEdit}
            disabled={loading}
            type="button"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <FaSpinner className="animate-spin" />
                Editing...
              </div>
            ) : (
              'Edit'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditNewsModal;

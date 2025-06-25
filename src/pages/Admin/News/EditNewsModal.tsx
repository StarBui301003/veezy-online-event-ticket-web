/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { updateNews } from '@/services/Admin/news.service';
import { getApprovedEvents } from '@/services/Admin/event.service';
import type { News } from '@/types/Admin/news';
import { SerializedEditorState } from 'lexical';
import { Editor } from '@/components/blocks/editor-00/editor';
import { lexicalStateToHtml } from '@/utils/lexicalToHtml';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { FaSpinner } from 'react-icons/fa';

const initialLexicalValue = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
} as unknown as SerializedEditorState;

interface Props {
  news: (News & { newsId: string }) | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export const EditNewsModal = ({ news, onClose, onUpdated }: Props) => {
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
        newsContent: news.newsContent
          ? typeof news.newsContent === 'object'
            ? news.newsContent
            : initialLexicalValue
          : initialLexicalValue,
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
      const htmlContent = lexicalStateToHtml(form.newsContent);
      await updateNews(news.newsId, {
        ...form,
        newsContent: htmlContent,
      });
      onUpdated && onUpdated();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!news} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Edit News</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 p-4 pt-0">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Event</label>
            <Select
              value={form.eventId}
              onValueChange={(value) => setForm((prev) => ({ ...prev, eventId: value }))}
              disabled={loading}
            >
              <SelectTrigger className="border-gray-200 border rounded px-2 py-1 w-full">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((ev) => (
                  <SelectItem key={ev.eventId} value={ev.eventId}>
                    {ev.eventName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Title</label>
            <input
              className="border rounded px-2 py-1 w-full"
              name="newsTitle"
              value={form.newsTitle}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Enter news title"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea
              className="border rounded px-2 py-1 w-full"
              name="newsDescription"
              value={form.newsDescription}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Enter description"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Content</label>
            <Editor
              editorSerializedState={form.newsContent}
              onSerializedChange={(val) => setForm((prev) => ({ ...prev, newsContent: val }))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Image</label>
            <div className="flex items-center gap-2 mb-2">
              <label
                className="flex gap-2 items-center border-2 border-blue-500 bg-blue-500 rounded-[0.9em] cursor-pointer px-4 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-blue-600 hover:text-white hover:border-blue-500"
                style={{ marginBottom: 0 }}
              >
                <FaSpinner />
                Import
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={loading}
                  className="hidden m-0"
                />
              </label>
              {(form.imageUrl || imageFile) && (
                <div className="flex items-center gap-2">
                  {form.imageUrl && (
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="h-12 w-12 object-cover rounded border"
                    />
                  )}
                  {imageFile && (
                    <span className="text-xs text-gray-700 max-w-[120px] truncate block">
                      {imageFile.name}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <Select
              value={form.status ? 'true' : 'false'}
              onValueChange={(value) => setForm((prev) => ({ ...prev, status: value === 'true' }))}
              disabled={loading}
            >
              <SelectTrigger className="border-gray-200 border rounded px-2 py-1 w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="p-4">
          <DialogFooter>
            <button
              className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500 mr-2"
              onClick={onClose}
              disabled={loading}
              type="button"
            >
              Cancel
            </button>
            <button
              className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
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
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditNewsModal;

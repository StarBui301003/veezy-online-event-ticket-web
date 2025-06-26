/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { createNews } from '@/services/Admin/news.service';
import { getApprovedEvents } from '@/services/Admin/event.service';
import { toast } from 'react-toastify';
import type { CreateNewsRequest } from '@/types/Admin/news';
import { FaUpload, FaSpinner } from 'react-icons/fa';
import RichTextEditor from '@/components/RichTextEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const initialLexicalValue = ''; // TipTap dùng HTML string

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  authorId: string;
}

export const CreateNewsModal = ({ open, onClose, onCreated, authorId }: Props) => {
  const [form, setForm] = useState<
    Omit<CreateNewsRequest, 'newsContent'> & { newsContent: string }
  >({
    eventId: '',
    newsDescription: '',
    newsTitle: '',
    newsContent: initialLexicalValue,
    authorId,
    imageUrl: '',
    status: true,
  });
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<{ eventId: string; eventName: string }[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      getApprovedEvents()
        .then((res) => {
          setEvents(res.data.items || []);
        })
        .catch(() => setEvents([]));
    }
  }, [open]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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

    // Nếu có API upload ảnh, upload tại đây và lấy url trả về
    // const url = await uploadImageAPI(file);
    // setForm((prev) => ({ ...prev, imageUrl: url }));

    // Nếu chỉ lấy local url để preview:
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imageUrl: url }));
  };

  const handleCreate = async () => {
    if (!form.newsTitle.trim()) {
      toast.error('Title is required!');
      return;
    }
    if (!form.newsDescription.trim()) {
      toast.error('Description is required!');
      return;
    }
    if (!form.eventId) {
      toast.error('Event is required!');
      return;
    }
    setLoading(true);
    try {
      await createNews({ ...form, newsContent: form.newsContent, authorId });

      toast.success('News created successfully!');
      setForm({
        eventId: '',
        newsDescription: '',
        newsTitle: '',
        newsContent: initialLexicalValue,
        authorId,
        imageUrl: '',
        status: true,
      });
      onClose();
      if (onCreated) onCreated();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create news!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Create News</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Event</label>
            <Select
              value={form.eventId}
              onValueChange={(value) => setForm((prev) => ({ ...prev, eventId: value }))}
              disabled={loading}
            >
              <SelectTrigger className="border-gray-200 border px-3 py-2 rounded w-full">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                <SelectValue placeholder="Select event" />
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
              className="border px-3 py-2 rounded w-full"
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
              className="border px-3 py-2 rounded w-full"
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
            <RichTextEditor
              value={form.newsContent}
              onChange={(val: string) => setForm((prev) => ({ ...prev, newsContent: val }))}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Image</label>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
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
                {/* Hiển thị preview ảnh và tên file nếu đã chọn */}
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
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <Select
              value={form.status ? 'true' : 'false'}
              onValueChange={(value) => setForm((prev) => ({ ...prev, status: value === 'true' }))}
              disabled={loading}
            >
              <SelectTrigger className="border-gray-200 border px-3 py-2 rounded w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 flex justify-end gap-2">
          <DialogFooter>
            <button
              className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
              onClick={onClose}
              disabled={loading}
              type="button"
            >
              Cancel
            </button>
            <button
              className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2] flex items-center justify-center gap-2"
              onClick={handleCreate}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNewsModal;

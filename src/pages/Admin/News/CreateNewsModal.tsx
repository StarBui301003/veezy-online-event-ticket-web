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
import { FaUpload, FaSpinner } from 'react-icons/fa';
import { validateCreateNewsForm } from '@/utils/validation';
import {
  useAdminValidation,
  createFieldChangeHandler,
  createCustomChangeHandler,
} from '@/hooks/use-admin-validation';
import { useTranslation } from 'react-i18next';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/RichTextEditor';

const initialLexicalValue = ''; // TipTap dùng HTML string

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  authorId: string;
}

interface CreateNewsFormData {
  eventId: string;
  newsDescription: string;
  newsTitle: string;
  newsContent: string;
  authorId: string;
  imageUrl: string;
  status: boolean;
}

export const CreateNewsModal = ({ open, onClose, onCreated, authorId }: Props) => {
  const [form, setForm] = useState<CreateNewsFormData>({
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

  const { t } = useTranslation();

  // Use validation hook
  const { validateForm, handleApiError, getFieldError, getErrorClass, clearFieldError } =
    useAdminValidation({
      showToastOnValidation: false, // Only show inline errors, no toast for validation
      showToastOnApiError: true, // Keep toast for API errors
    });

  useEffect(() => {
    if (open) {
      getApprovedEvents()
        .then((res) => {
          setEvents(res.data.items || []);
        })
        .catch(() => setEvents([]));
    }
  }, [open]);

  // Field change handlers with error clearing
  const handleEventChange = createCustomChangeHandler(
    'eventId',
    (value: string) => {
      setForm((prev) => ({ ...prev, eventId: value === '__no_event__' ? '' : value }));
    },
    clearFieldError
  );

  const handleTitleChange = createFieldChangeHandler(
    'newsTitle',
    (value: string) => {
      setForm((prev) => ({ ...prev, newsTitle: value }));
    },
    clearFieldError
  );

  const handleDescriptionChange = createFieldChangeHandler(
    'newsDescription',
    (value: string) => {
      setForm((prev) => ({ ...prev, newsDescription: value }));
    },
    clearFieldError
  );

  const handleContentChange = (val: string) => {
    setForm((prev) => ({ ...prev, newsContent: val }));
    clearFieldError('newsContent');
  };

  const handleStatusChange = createCustomChangeHandler(
    'status',
    (value: string) => {
      setForm((prev) => ({ ...prev, status: value === 'true' }));
    },
    clearFieldError
  );

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    clearFieldError('imageUrl');

    // Nếu có API upload ảnh, upload tại đây và lấy url trả về
    // const url = await uploadImageAPI(file);
    // setForm((prev) => ({ ...prev, imageUrl: url }));

    // Nếu chỉ lấy local url để preview:
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imageUrl: url }));
  };

  const handleCreate = async () => {
    // Validate form using comprehensive validation
    const isValid = validateForm(form, validateCreateNewsForm);

    if (!isValid) {
      return;
    }

    setLoading(true);
    try {
      await createNews({
        ...form,
        eventId: form.eventId ? form.eventId : null, // Truyền null nếu không chọn event
        newsContent: form.newsContent,
        authorId,
      });

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
      setImageFile(null);
      onClose();
      if (onCreated) onCreated();
    } catch (error: unknown) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>{t('createNews')}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('event')}</label>
            <Select
              value={form.eventId || '__no_event__'}
              onValueChange={handleEventChange}
              disabled={loading}
            >
              <SelectTrigger
                className={getErrorClass(
                  'eventId',
                  'border-gray-200 border px-3 py-2 rounded w-full'
                )}
              >
                <SelectValue placeholder={t('selectEvent')} />
              </SelectTrigger>
              <SelectContent>
                {events.length === 0 ? (
                  <SelectItem value="__no_event__" disabled>
                    {t('noEventFound')}
                  </SelectItem>
                ) : (
                  <>
                    <SelectItem value="__no_event__">{t('noEvent')}</SelectItem>
                    {events.map((ev) => (
                      <SelectItem key={ev.eventId} value={ev.eventId}>
                        {ev.eventName}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            {getFieldError('eventId') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('eventId')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('newsTitle')}</label>
            <input
              className={getErrorClass('newsTitle', 'border px-3 py-2 rounded w-full')}
              value={form.newsTitle}
              onChange={handleTitleChange}
              disabled={loading}
              placeholder={t('enterNewsTitle')}
            />
            {getFieldError('newsTitle') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('newsTitle')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('newsDescription')}</label>
            <textarea
              className={getErrorClass('newsDescription', 'border px-3 py-2 rounded w-full')}
              value={form.newsDescription}
              onChange={(e) => handleDescriptionChange(e)}
              disabled={loading}
              placeholder={t('enterNewsDescription')}
              rows={3}
            />
            {getFieldError('newsDescription') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('newsDescription')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Content</label>
            <RichTextEditor
              value={form.newsContent}
              onChange={handleContentChange}
              disabled={loading}
            />
            {getFieldError('newsContent') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('newsContent')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Image</label>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                <label
                  className={`flex gap-2 items-center border-2 border-blue-500 bg-blue-500 rounded-[0.9em] cursor-pointer px-4 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-blue-600 hover:text-white hover:border-blue-500 ${
                    getFieldError('imageUrl') ? 'border-red-500 bg-red-500 hover:bg-red-600' : ''
                  }`}
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
            {getFieldError('imageUrl') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('imageUrl')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <Select
              value={form.status ? 'true' : 'false'}
              onValueChange={handleStatusChange}
              disabled={loading}
            >
              <SelectTrigger
                className={getErrorClass(
                  'status',
                  'border-gray-200 border px-3 py-2 rounded w-full'
                )}
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {getFieldError('status') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('status')}
              </div>
            )}
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
              {t('cancel')}
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
                  {t('creating')}
                </>
              ) : (
                t('create')
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNewsModal;

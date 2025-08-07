/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useThemeClasses } from '@/hooks/useThemeClasses';

import Select from 'react-select';
import {
  Select as UISelect,
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
  const { getProfileInputClass, getSelectClass } = useThemeClasses();
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);
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
      <DialogContent className="max-w-3xl bg-white dark:bg-gray-800 p-0 shadow-lg rounded-xl border-0 dark:border-0">
        <div className="p-6 border-b border-gray-200 dark:border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {t('createNews')}
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t('event')}
            </label>
            <Select
              options={[
                { value: '__no_event__', label: t('noEvent') },
                ...events.map((ev) => ({
                  value: ev.eventId,
                  label: ev.eventName,
                })),
              ]}
              value={[
                { value: '__no_event__', label: t('noEvent') },
                ...events.map((ev) => ({
                  value: ev.eventId,
                  label: ev.eventName,
                })),
              ].find((option) => option.value === (form.eventId || '__no_event__'))}
              onChange={(selectedOption) => {
                handleEventChange(selectedOption?.value || '');
              }}
              placeholder={t('selectEvent')}
              isDisabled={loading}
              isSearchable={true}
              className={getErrorClass('eventId', '')}
              classNamePrefix="react-select"
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  borderColor: getFieldError('eventId')
                    ? '#ef4444'
                    : state.isFocused
                    ? '#3b82f6'
                    : isDarkMode
                    ? '#4b5563'
                    : '#d1d5db',
                  '&:hover': {
                    borderColor: getFieldError('eventId')
                      ? '#ef4444'
                      : isDarkMode
                      ? '#6b7280'
                      : '#9ca3af',
                  },
                  minHeight: '40px',
                  borderRadius: '6px',
                  boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                }),
                menu: (provided) => ({
                  ...provided,
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
                  borderRadius: '6px',
                  boxShadow:
                    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  zIndex: 9999,
                }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isSelected
                    ? '#3b82f6'
                    : state.isFocused
                    ? isDarkMode
                      ? '#374151'
                      : '#f3f4f6'
                    : 'transparent',
                  color: state.isSelected ? 'white' : isDarkMode ? '#f9fafb' : '#111827',
                  '&:hover': {
                    backgroundColor: state.isSelected
                      ? '#3b82f6'
                      : isDarkMode
                      ? '#374151'
                      : '#f3f4f6',
                  },
                }),
                singleValue: (provided) => ({
                  ...provided,
                  color: isDarkMode ? '#f9fafb' : '#111827',
                }),
                input: (provided) => ({
                  ...provided,
                  color: isDarkMode ? '#f9fafb' : '#111827',
                }),
                placeholder: (provided) => ({
                  ...provided,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                }),
                menuList: (provided) => ({
                  ...provided,
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                }),
                noOptionsMessage: (provided) => ({
                  ...provided,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                }),
                loadingMessage: (provided) => ({
                  ...provided,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                }),
              }}
            />
            {getFieldError('eventId') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('eventId')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t('newsTitle')}
            </label>
            <input
              className={getErrorClass(
                'newsTitle',
                `border rounded px-3 py-2 w-full transition-colors ${getProfileInputClass()}`
              )}
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t('newsDescription')}
            </label>
            <textarea
              className={getErrorClass(
                'newsDescription',
                `border rounded px-3 py-2 w-full transition-colors ${getProfileInputClass()}`
              )}
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Content
            </label>
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Image
            </label>
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Status
            </label>
            <UISelect
              value={form.status ? 'true' : 'false'}
              onValueChange={handleStatusChange}
              disabled={loading}
            >
              <SelectTrigger
                className={getErrorClass(
                  'status',
                  `border rounded px-3 py-2 w-full transition-colors ${getSelectClass()}`
                )}
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                <SelectItem
                  value="true"
                  className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Active
                </SelectItem>
                <SelectItem
                  value="false"
                  className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Inactive
                </SelectItem>
              </SelectContent>
            </UISelect>
            {getFieldError('status') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('status')}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-0 flex justify-end gap-3">
          <button
            className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            {t('cancel')}
          </button>
          <button
            className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-[#0071e2] flex items-center justify-center gap-2"
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNewsModal;

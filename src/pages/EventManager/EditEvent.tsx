// Helper to format ISO string to yyyy-MM-ddTHH:mm for datetime-local input (like EditTicket)
function toInputDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getEventById,
  updateEvent,
  uploadImage,
  deleteEventImage,
  getAllCategories,
} from '@/services/Event Manager/event.service';
import { onEvent } from '@/services/signalr.service';
import { CreateEventData, Category, Content } from '@/types/event';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import Select from 'react-select';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';
import type { StylesConfig } from 'react-select';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

const contentTypeOptions = [
  { value: 'description', label: 'Description Only' },
  { value: 'image', label: 'Image Only' },
];

type ContentType = 'description' | 'image';

interface EnhancedContent extends Content {
  contentType?: ContentType;
}

// Validation functions
const validateField = (name: string, value: any, formData?: any): string => {
  switch (name) {
    case 'eventName':
      if (!value || value.trim() === '') return 'Tên sự kiện là bắt buộc';
      if (value.length < 3) return 'Tên sự kiện phải có ít nhất 3 ký tự';
      if (value.length > 100) return 'Tên sự kiện không được quá 100 ký tự';
      break;

    case 'eventLocation':
      if (value && value.length > 200) return 'Địa điểm không được quá 200 ký tự';
      break;

    case 'startAt':
      if (!value) return 'Thời gian bắt đầu là bắt buộc';
      if (new Date(value) <= new Date()) return 'Thời gian bắt đầu phải sau thời điểm hiện tại';
      break;

    case 'endAt':
      if (!value) return 'Thời gian kết thúc là bắt buộc';
      if (formData?.startAt && new Date(value) <= new Date(formData.startAt)) {
        return 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }
      break;

    case 'bankAccount':
      if (value && !/^[0-9]{8,20}$/.test(value)) {
        return 'Số tài khoản phải từ 8-20 chữ số';
      }
      break;

    case 'bankAccountName':
      if (value && (value.length < 2 || value.length > 50)) {
        return 'Tên tài khoản phải từ 2-50 ký tự';
      }
      break;

    case 'bankName':
      if (value && (value.length < 2 || value.length > 50)) {
        return 'Tên ngân hàng phải từ 2-50 ký tự';
      }
      break;
  }
  return '';
};

function getContentType(content: EnhancedContent): ContentType {
  if (content.description && !content.imageUrl) return 'description';
  if (!content.description && content.imageUrl) return 'image';
  return 'description';
}

// FormField Component với inline error
const FormField: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}> = ({ label, error, children, required = false, className = '' }) => {
  const { getThemeClass } = useThemeClasses();

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        className={cn(
          'block text-sm font-medium',
          getThemeClass('text-gray-700', 'text-slate-300')
        )}
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <div className="flex items-center space-x-2 text-red-400 text-sm animate-shake">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// InputField Component với error styling
const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { error?: string }> = ({
  error,
  className = '',
  ...props
}) => {
  const { getThemeClass } = useThemeClasses();

  const baseClass = cn(
    'w-full p-4 rounded-xl border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200',
    getThemeClass(
      'bg-white/90 text-gray-900 placeholder-gray-500 border-gray-300',
      'bg-slate-700/60 text-white placeholder-slate-400 border-purple-700'
    )
  );
  const errorClass = error ? 'border-red-500 focus:ring-red-500' : '';

  return <input className={`${baseClass} ${errorClass} ${className}`} {...props} />;
};

// Hàm loại bỏ HTML tags và trả về plain text
function stripHtmlTags(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

// Hàm loại bỏ <p></p> và <p><br></p> rỗng ở đầu/cuối hoặc toàn bộ
function cleanHtml(html: string) {
  const cleaned = html
    .replace(/<p><br><\/p>/g, '')
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/^\s+|\s+$/g, '');
  // Nếu chỉ còn lại chuỗi rỗng hoặc toàn dấu cách thì trả về plain text
  const plainText = stripHtmlTags(cleaned);
  return plainText.trim() === '' ? '' : plainText;
}

export default function EditEvent() {
  const { getThemeClass, theme } = useThemeClasses();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingContentImage, setUploadingContentImage] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState<CreateEventData>({
    eventName: '',
    eventDescription: '',
    eventCoverImageUrl: '',
    eventLocation: '',
    startAt: '',
    endAt: '',
    tags: [],
    categoryIds: [],
    contents: [],
    bankAccount: '',
    bankAccountName: '',
    bankName: '',
  });

  const [contents, setContents] = useState<EnhancedContent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { quill, quillRef } = useQuill();

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const categories: Category[] = await getAllCategories();
      setCategoryOptions(
        categories.map((cat) => ({
          value: cat.categoryId,
          label: cat.categoryName,
        }))
      );
    } catch {
      setCategoryOptions([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    const fetchEventAndCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const event = await getEventById(eventId!);
        const eventData = {
          eventName: event.eventName || '',
          eventDescription: event.eventDescription || '',
          eventCoverImageUrl: event.eventCoverImageUrl || '',
          eventLocation: event.eventLocation || '',
          startAt: toInputDate(event.startAt || ''),
          endAt: toInputDate(event.endAt || ''),
          tags: event.tags || [],
          categoryIds: event.categoryIds || [],
          contents: event.contents || [],
          bankAccount: event.bankAccount || '',
          bankAccountName: event.bankAccountName || '',
          bankName: event.bankName || '',
        };
        setFormData(eventData);
        setTagInput(eventData.tags.join(', '));

        // Convert contents to EnhancedContent with contentType
        setContents(
          (event.contents || []).map((c: Content) => ({
            ...c,
            contentType: getContentType(c),
          }))
        );

        const categoryData = await getAllCategories();
        setCategoryOptions(
          categoryData.map((cat) => ({
            value: cat.categoryId,
            label: cat.categoryName,
          }))
        );
      } catch (err) {
        setError('Không thể tải dữ liệu sự kiện hoặc danh mục!');
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndCategories();

    // Setup Event Hub listeners using global connections
    // Event hub connection is managed globally in App.tsx
    onEvent('OnCategoryCreated', fetchCategories);
    onEvent('OnCategoryUpdated', fetchCategories);
    onEvent('OnCategoryDeleted', fetchCategories);
  }, [eventId, fetchCategories]);

  useEffect(() => {
    if (quill) {
      const isDark = theme === 'dark';
      const themeClass = isDark ? 'dark' : 'light';
      document.body.classList.remove('light', 'dark');
      document.body.classList.add(themeClass);

      // Set initial content when quill is ready and we have description data
      if (formData.eventDescription) {
        quill.root.innerHTML = formData.eventDescription;
      }

      quill.on('text-change', () => {
        const description = cleanHtml(quill.root.innerHTML);
        setFormData((prev) => ({
          ...prev,
          eventDescription: description,
        }));
      });
    }
  }, [quill, theme, formData.eventDescription]);

  // Validation helpers

  // File upload handlers
  const onDropCover = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Chỉ chấp nhận file hình ảnh');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      alert('Kích thước file không được vượt quá 10MB');
      return;
    }

    setUploadingCover(true);
    try {
      const url = await uploadImage(file);
      setFormData((prev) => ({
        ...prev,
        eventCoverImageUrl: url,
      }));
    } catch {
      alert('Upload ảnh bìa thất bại.');
    } finally {
      setUploadingCover(false);
    }
  }, []);

  const {
    getRootProps: getCoverRootProps,
    getInputProps: getCoverInputProps,
    isDragActive: isCoverDragActive,
  } = useDropzone({
    onDrop: onDropCover,
    accept: { 'image/*': [] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const handleCoverImageDelete = async () => {
    if (!formData.eventCoverImageUrl) return;

    // Optimistically update the UI
    const oldImageUrl = formData.eventCoverImageUrl;
    setFormData((prev) => ({ ...prev, eventCoverImageUrl: '' }));

    // Try to delete from server in the background
    try {
      await deleteEventImage(oldImageUrl);
    } catch (error) {
      console.warn('Background image deletion failed:', error);
      // Don't revert or show error - the image is already removed from UI
    }
  };

  const handleContentImageDrop = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    setUploadingContentImage((prev) => ({ ...prev, [index]: true }));

    try {
      const url = await uploadImage(file);
      const newContents = [...contents];
      newContents[index].imageUrl = url;
      setContents(newContents);
    } catch {
    } finally {
      setUploadingContentImage((prev) => ({ ...prev, [index]: false }));
    }
  };

  // Form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoriesChange = (selected: { value: string; label: string }[]) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: selected.map((option) => option.value),
    }));
  };

  const handleContentChange =
    (index: number, field: 'description' | 'imageUrl') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newContents = [...contents];
      newContents[index] = { ...newContents[index], [field]: e.target.value };
      setContents(newContents);
    };

  const handleContentTypeChange = (index: number, contentType: ContentType) => {
    const newContents = [...contents];
    newContents[index] = {
      ...newContents[index],
      contentType,
      description: contentType === 'image' ? '' : newContents[index].description,
      imageUrl: contentType === 'description' ? '' : newContents[index].imageUrl,
    };
    setContents(newContents);
  };

  const handleRemoveContent = (index: number) => {
    setContents((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((content, i) => ({
          ...content,
          position: i + 1,
        }))
    );
  };

  const handleAddContent = () => {
    setContents((prev) => [
      ...prev,
      {
        position: prev.length + 1,
        contentType: 'description',
        description: '',
        imageUrl: '',
      },
    ]);
  };

  const handleContentImageDelete = async (idx: number) => {
    const imageUrl = contents[idx]?.imageUrl;
    if (!imageUrl) {
      console.warn('No image URL found for deletion at index:', idx);
      return;
    }

    try {
      // Show confirmation dialog
      if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này không?')) {
        return;
      }

      console.log('Attempting to delete image:', imageUrl);

      // Optimistically update UI
      const oldContents = [...contents];
      const newContents = [...contents];
      newContents[idx] = {
        ...newContents[idx],
        imageUrl: '',
        // Reset to description type if it was an image-only content
        ...(newContents[idx].contentType === 'image' && {
          contentType: 'description' as const,
          description: '',
        }),
      };
      setContents(newContents);

      try {
        await deleteEventImage(imageUrl);
        console.log('Successfully deleted image');
      } catch (error) {
        // Revert on error
        console.error('Failed to delete content image:', error);
        setContents(oldContents);
        alert(error.message || 'Không thể xóa ảnh. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error in handleContentImageDelete:', error);
      alert('Đã xảy ra lỗi khi xử lý yêu cầu xóa ảnh.');
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    let hasError = false;

    // Validate main form fields
    Object.keys(formData).forEach((key) => {
      if (key !== 'contents') {
        const error = validateField(key, (formData as any)[key], formData);
        if (error) {
          newErrors.push(error);
          hasError = true;
        }
      }
    });

    // Validate categories
    if (formData.categoryIds.length === 0) {
      newErrors.push('Vui lòng chọn ít nhất một danh mục');
      hasError = true;
    }

    // Validate contents
    contents.forEach((content, index) => {
      if (content.contentType === 'description' && !content.description?.trim()) {
        newErrors.push(`Section #${index + 1}: Mô tả là bắt buộc.`);
        hasError = true;
      } else if (content.contentType === 'image' && !content.imageUrl?.trim()) {
        newErrors.push(`Section #${index + 1}: Ảnh là bắt buộc.`);
        hasError = true;
      }
    });

    return !hasError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Validate form
    if (!validateForm()) {
      // Scroll to first error
      setTimeout(() => {
        const firstErrorElement = document.querySelector('.animate-shake');
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    if (!eventId) {
      setError('Không tìm thấy sự kiện!');
      return;
    }

    setSubmitting(true);
    try {
      const updatedData: CreateEventData = {
        ...formData,
        eventDescription: cleanHtml(formData.eventDescription),
        contents: contents.map((c, idx) => ({
          position: Number(c.position) || idx + 1,
          description: c.contentType === 'image' ? '' : c.description,
          imageUrl: c.contentType === 'description' ? '' : c.imageUrl,
        })),
      };

      await updateEvent(eventId, updatedData);
      alert('Cập nhật sự kiện thành công!');
      if (location.state?.from) {
        navigate(location.state.from);
      } else {
        navigate('/event-manager/pending-events');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Cập nhật sự kiện thất bại';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const selectStyles: StylesConfig = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: theme === 'dark' ? '#27272a' : '#ffffff',
      borderColor: state.isFocused
        ? '#a21caf'
        : '#3f3f46',
      color: theme === 'dark' ? '#ffffff' : '#374151',
      borderRadius: 12,
      minHeight: 48,
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#a21caf',
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff',
      border: `1px solid ${theme === 'dark' ? '#a21caf' : '#d1d5db'}`,
      zIndex: 9999,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#a21caf' : theme === 'dark' ? '#18181b' : '#ffffff',
      color: theme === 'dark' ? '#fff' : '#374151',
      '&:hover': {
        backgroundColor: '#a21caf',
        color: '#fff',
      },
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#a21caf',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#fff',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#fff',
      '&:hover': {
        backgroundColor: '#ef4444',
        color: '#fff',
      },
    }),
    input: (provided) => ({
      ...provided,
      color: theme === 'dark' ? '#fff' : '#374151',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: theme === 'dark' ? '#a3a3a3' : '#6b7280',
    }),
  };

  if (loading) {
    return (
      <div
        className={cn(
          'flex justify-center items-center w-full min-h-screen',
          getThemeClass(
            'bg-gradient-to-br from-blue-50 to-indigo-100',
            'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
          )
        )}
      >
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-t-transparent rounded-full mx-auto mb-4">
            <div
              className={cn(
                'animate-spin h-12 w-12 border-4 border-t-transparent rounded-full mx-auto mb-4',
                getThemeClass(
                  'border-blue-500',
                  'border-purple-500'
                )
              )}
            />
          </div>
          <span className={cn('text-xl', getThemeClass('text-blue-600', 'text-purple-300'))}>
            Đang tải...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full min-h-screen p-0 m-0',
        getThemeClass(
          'bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900',
          'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white'
        )
      )}
    >
      <style>
        {`
        /* Light theme styles */
        .light .ql-toolbar {
          background: #f8fafc !important;
          border-radius: 0.75rem 0.75rem 0 0 !important;
          border-color: #3b82f6 !important;
        }
        .light .ql-toolbar button {
          color: #374151 !important;
          opacity: 0.8;
          transition: opacity 0.2s;
          border-radius: 0.25rem;
          padding: 0.25rem 0.5rem;
          margin: 0 0.125rem;
        }
        .light .ql-toolbar button:hover {
          opacity: 1;
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
        .light .ql-container {
          background: #ffffff !important;
          color: #374151 !important;
          border-radius: 0 0 0.75rem 0.75rem !important;
          border-color: #3b82f6 !important;
          min-height: 200px !important;
        }
        .light .ql-editor {
          background: #ffffff !important;
          color: #374151 !important;
          min-height: 200px !important;
        }
        .light .ql-picker {
          color: #374151 !important;
        }
        .light .ql-picker-label {
          color: #374151 !important;
          border: 1px solid #3b82f6 !important;
          background: #ffffff !important;
        }
        .light .ql-picker-options {
          background: #ffffff !important;
          border: 1px solid #3b82f6 !important;
          color: #374151 !important;
        }
        .light .ql-picker-item {
          color: #374151 !important;
        }
        .light .ql-picker-item:hover {
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
        .light .ql-picker-item.ql-selected {
          background-color: rgba(59, 130, 246, 0.2) !important;
        }

        /* Dark theme styles */
        .dark .ql-toolbar {
          background: #18181b !important;
          border-radius: 0.75rem 0.75rem 0 0 !important;
          border-color: #a21caf !important;
        }
        .dark .ql-toolbar button {
          color: #fff !important;
          opacity: 0.8;
          transition: opacity 0.2s;
          border-radius: 0.25rem;
          padding: 0.25rem 0.5rem;
          margin: 0 0.125rem;
        }
        .dark .ql-toolbar button:hover {
          opacity: 1;
          background-color: rgba(162, 28, 175, 0.2) !important;
        }
        .dark .ql-container {
          background: #27272a !important;
          color: #fff !important;
          border-radius: 0 0 0.75rem 0.75rem !important;
          border-color: #a21caf !important;
          min-height: 200px !important;
        }
        .dark .ql-editor {
          background: #27272a !important;
          color: #fff !important;
          min-height: 200px !important;
        }
        .dark .ql-picker {
          color: #fff !important;
        }
        .dark .ql-picker-label {
          color: #fff !important;
          border: 1px solid #a21caf !important;
          background: #27272a !important;
        }
        .dark .ql-picker-options {
          background: #27272a !important;
          border: 1px solid #a21caf !important;
          color: #fff !important;
        }
        .dark .ql-picker-item {
          color: #fff !important;
        }
        .dark .ql-picker-item:hover {
          background-color: rgba(162, 28, 175, 0.2) !important;
        }
        .dark .ql-picker-item.ql-selected {
          background-color: rgba(162, 28, 175, 0.4) !important;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        `}
      </style>

      <div className="w-full h-full p-6">
        {/* Back Button */}
        <div className="flex justify-start mb-6">
          <button
            type="button"
            onClick={() => navigate(location.state?.from || '/event-manager')}
            className={cn(
              'px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-200 flex items-center space-x-2',
              getThemeClass(
                'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white',
                'bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 text-white'
              )
            )}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Quay lại</span>
          </button>
        </div>

        {/* Main Form */}
        <form
          onSubmit={handleSubmit}
          className={cn(
            'space-y-8 p-8 rounded-3xl shadow-2xl w-full max-w-[1200px] mx-auto',
            getThemeClass(
              'bg-white/90 backdrop-blur-md border-blue-200',
              'bg-slate-800/90 backdrop-blur-md border-purple-700/40'
            )
          )}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 drop-shadow">
              Chỉnh sửa sự kiện
            </h2>
            <p className={cn('text-lg', getThemeClass('text-gray-600', 'text-slate-400'))}>
              Cập nhật thông tin sự kiện của bạn
            </p>
          </div>

          {/* Basic Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FormField label="Tên sự kiện" required>
              <InputField
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                placeholder="Nhập tên sự kiện"
              />
            </FormField>

            <FormField label="Ảnh bìa sự kiện">
              <div
                {...getCoverRootProps()}
                className={`w-full h-48 flex items-center justify-center bg-slate-700/30 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 overflow-hidden ${
                  isCoverDragActive
                    ? 'border-purple-400 bg-purple-400/10'
                    : 'border-purple-400/50 hover:border-purple-400'
                }`}
              >
                <input {...getCoverInputProps()} />
                {uploadingCover ? (
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className={cn('', getThemeClass('text-gray-500', 'text-slate-400'))}>
                      Đang tải ảnh...
                    </p>
                  </div>
                ) : formData.eventCoverImageUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={formData.eventCoverImageUrl}
                      alt="Cover"
                      className="h-full w-full object-cover rounded-xl"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <div className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          />
                        </svg>
                        Uploaded
                      </div>
                      <button
                        type="button"
                        onClick={handleCoverImageDelete}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg text-xs transition-all duration-200"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-5xl mb-3">📷</div>
                    <p className={cn('mb-1', getThemeClass('text-gray-500', 'text-slate-400'))}>
                      {isCoverDragActive ? 'Thả ảnh vào đây' : 'Nhấp hoặc kéo ảnh vào đây'}
                    </p>
                    <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
            </FormField>

            <FormField label="Địa điểm tổ chức">
              <InputField
                type="text"
                name="eventLocation"
                value={formData.eventLocation}
                onChange={handleChange}
                placeholder="Nhập địa điểm"
              />
            </FormField>

            <FormField label="Thời gian bắt đầu" required>
              <InputField
                type="datetime-local"
                name="startAt"
                value={formData.startAt}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Thời gian kết thúc" required>
              <InputField
                type="datetime-local"
                name="endAt"
                value={formData.endAt}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Chọn danh mục" required>
              <Select
                isMulti
                options={categoryOptions}
                value={categoryOptions.filter((option) =>
                  formData.categoryIds.includes(option.value)
                )}
                onChange={handleCategoriesChange}
                isLoading={loadingCategories}
                styles={selectStyles}
                placeholder="Chọn danh mục"
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </FormField>
          </div>

          {/* Bank Information Section */}
          <div
            className={cn(
              'p-6 rounded-2xl border-2 mb-8',
              getThemeClass(
                'bg-white/95 border-blue-200',
                'bg-[#2d0036]/80 border-pink-500/30'
              )
            )}
          >
            <h3 className="text-xl font-semibold text-purple-300 mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              Thông tin ngân hàng (Tùy chọn)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="Số tài khoản">
                <InputField
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleChange}
                  placeholder="Nhập số tài khoản"
                />
              </FormField>

              <FormField label="Tên chủ tài khoản">
                <InputField
                  type="text"
                  name="bankAccountName"
                  value={formData.bankAccountName}
                  onChange={handleChange}
                  placeholder="Nhập tên chủ tài khoản"
                />
              </FormField>

              <FormField label="Tên ngân hàng">
                <InputField
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="Nhập tên ngân hàng"
                />
              </FormField>
            </div>
          </div>

          {/* Tags */}
          <FormField label="Tags">
            <InputField
              type="text"
              value={tagInput}
              onChange={(e) => {
                const raw = e.target.value;
                setTagInput(raw);
                const tags = raw
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter((tag) => tag !== '');
                setFormData((prev) => ({ ...prev, tags }));
              }}
              placeholder="Ví dụ: game, workshop, offline"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-600/80 text-white text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className={cn('text-xs mt-1', getThemeClass('text-gray-500', 'text-slate-400'))}>
              Phân tách các tag bằng dấu phẩy
            </p>
          </FormField>

          {/* Event Description */}
          <FormField label="Mô tả sự kiện">
            <div className="rounded-xl border border-purple-700 bg-[#27272a] overflow-hidden">
              <div ref={quillRef} style={{ minHeight: 160, color: '#fff' }} />
            </div>
          </FormField>

          {/* Event Contents Section */}
          <div
            className={cn(
              'p-6 rounded-2xl border-2',
              getThemeClass(
                'bg-white/95 border-blue-200',
                'bg-[#2d0036]/80 border-pink-500/30'
              )
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center">
                <svg
                  className="w-6 h-6 mr-2 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Các phần nội dung (section)
              </h3>
              <Button
                type="button"
                onClick={handleAddContent}
                disabled={contents.length >= 5}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Thêm section</span>
              </Button>
            </div>

            {contents.length === 0 && (
              <div
                className={cn(
                  'text-center py-12',
                  getThemeClass('text-gray-500', 'text-slate-400')
                )}
              >
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-lg">Chưa có phần nội dung nào</p>
                <p className="text-sm">Thêm nội dung để làm phong phú thêm sự kiện của bạn</p>
              </div>
            )}

            <div className="space-y-6">
              {contents.map((content, index) => (
                <div
                  key={index}
                  className={cn(
                    'relative p-6 rounded-xl shadow-lg border-2',
                    getThemeClass(
                      'bg-white border-blue-200',
                      'bg-[#2d0036]/80 border-pink-500/30'
                    )
                  )}
                >
                  {/* Content Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="text-lg font-medium text-purple-300">
                        Content {index + 1}
                      </span>
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleRemoveContent(index)}
                      className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm flex items-center space-x-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span>Xóa</span>
                    </Button>
                  </div>

                  {/* Content Type Selection */}
                  <div className="mb-4">
                    <label
                      className={cn(
                        'block text-sm font-medium',
                        getThemeClass('text-gray-700', 'text-slate-300')
                      )}
                    >
                      Loại nội dung
                    </label>
                    <div className="flex gap-3">
                      {contentTypeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            handleContentTypeChange(index, option.value as ContentType)
                          }
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                            content.contentType === option.value
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
                              : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600 hover:scale-105'
                          }`}
                        >
                          {option.value === 'description' ? (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2m0 0h.01"
                              />
                            </svg>
                          )}
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content Input */}
                  {content.contentType === 'description' && (
                    <div className="space-y-2">
                      <label
                        className={cn(
                          'block text-sm font-medium',
                          getThemeClass('text-gray-700', 'text-slate-300')
                        )}
                      >
                        Mô tả (Bắt buộc) <span className="text-red-400">*</span>
                      </label>
                      <InputField
                        type="text"
                        value={content.description}
                        onChange={handleContentChange(index, 'description')}
                        placeholder="Nhập mô tả nội dung"
                      />
                    </div>
                  )}

                  {content.contentType === 'image' && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-300">
                        Tải lên hình ảnh (Bắt buộc) <span className="text-red-400">*</span>
                      </label>

                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files?.[0] && handleContentImageDrop(index, e.target.files[0])
                          }
                          className={`w-full p-4 rounded-xl bg-slate-600/50 border text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 transition-all duration-200`}
                        />

                        {uploadingContentImage[index] && (
                          <div className="absolute inset-0 bg-slate-800/80 rounded-xl flex items-center justify-center">
                            <div className="flex items-center space-x-3">
                              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                              <p className="text-sm text-slate-300">Đang tải ảnh...</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {content.imageUrl && !uploadingContentImage[index] && (
                        <div className="mt-4">
                          <div className="relative">
                            <img
                              src={content.imageUrl}
                              alt={`content-${index}`}
                              className="h-48 w-full object-cover rounded-xl border border-purple-700 shadow-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleContentImageDelete(index)}
                              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg text-xs transition-all duration-200"
                            >
                              Xóa ảnh
                            </button>
                          </div>
                          <div className="flex items-center justify-center mt-3">
                            <div className="flex items-center space-x-2 text-green-400 text-sm bg-green-400/10 px-3 py-2 rounded-lg">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                />
                              </svg>
                              <span>Hình ảnh đã được tải lên thành công</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-red-400">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full p-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Đang lưu...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                  <span>Lưu thay đổi</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

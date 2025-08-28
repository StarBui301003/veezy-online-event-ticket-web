/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback, lazy, Suspense, forwardRef, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { createNews, uploadNewsImage } from '@/services/Event Manager/event.service';
import { NewsPayload } from '@/types/event';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useThemeClasses } from '@/hooks/useThemeClasses'; // Import hook theme
import 'react-quill/dist/quill.snow.css';

// --- BẮT ĐẦU: CÁC THÀNH PHẦN VÀ TIỆN ÍCH TỪ CREATEEVENT ---

// Định nghĩa props cho ReactQuill
type ReactQuillProps = {
  value: string;
  onChange: (content: string, delta: any, source: any, editor: any) => void;
  modules?: any;
  formats?: string[];
  placeholder?: string;
  className?: string;
  theme?: string;
};

// Định nghĩa ref cho trình soạn thảo
interface QuillEditorRef {
  getEditor: () => any;
  focus: () => void;
  blur: () => void;
}

// Sử dụng React.lazy để tải ReactQuill chỉ ở phía client
const ReactQuill = lazy(() => import('react-quill'));

// Component wrapper để xử lý trạng thái tải
const QuillEditor = forwardRef<QuillEditorRef, ReactQuillProps>((props, ref) => {
  const { t } = useTranslation();
  const quillRef = useRef<any>(null);

  React.useImperativeHandle(ref, () => ({
    getEditor: () => quillRef.current?.getEditor(),
    focus: () => quillRef.current?.focus(),
    blur: () => quillRef.current?.blur(),
  }));

  return (
    <Suspense
      fallback={
        <div className="h-[300px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <p>{t('common.loadingEditor')}</p>
        </div>
      }
    >
      <ReactQuill
        ref={quillRef}
        theme={props.theme || 'snow'}
        value={props.value}
        onChange={props.onChange}
        modules={props.modules}
        formats={props.formats}
        placeholder={props.placeholder}
        className={cn('h-[300px]', props.className)}
      />
    </Suspense>
  );
});

QuillEditor.displayName = 'QuillEditor';

// Hàm loại bỏ HTML tags và trả về plain text
function stripHtmlTags(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

// Hàm làm sạch các thẻ <p> rỗng
function cleanHtml(html: string) {
  if (!html) return '';
  const cleaned = html
    .replace(/<p><br><\/p>/g, '')
    .replace(/<p>\s*<\/p>/g, '')
    .trim();
  const plainText = stripHtmlTags(cleaned);
  return plainText.trim() === '' ? '' : cleaned;
}

// --- KẾT THÚC: CÁC THÀNH PHẦN VÀ TIỆN ÍCH TỪ CREATEEVENT ---

const CreateNews: React.FC = () => {
  const { t } = useTranslation();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { getThemeClass } = useThemeClasses(); // Sử dụng hook theme

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newsPayload, setNewsPayload] = useState<NewsPayload>({
    eventId: eventId || '',
    newsTitle: '',
    newsDescription: '',
    newsContent: '',
    imageUrl: '',
    authorId: '',
    status: true,
  });

  // Lấy thông tin người dùng
  useEffect(() => {
    const accountStr = localStorage.getItem('account');
    let authorId = '';
    if (accountStr) {
      try {
        const account = JSON.parse(accountStr);
        if (account && typeof account.userId === 'string') {
          authorId = account.userId;
        }
      } catch {
        /* Bỏ qua lỗi parse */
      }
    }
    if (!authorId) {
      const customerId = localStorage.getItem('customerId');
      if (customerId) authorId = customerId;
    }
    if (authorId) {
      setNewsPayload((prev) => ({ ...prev, authorId }));
    } else {
      toast.error(t('loginRequiredCreateNews'));
      navigate('/login');
    }
  }, [navigate, t]);

  // Xử lý upload ảnh
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setIsUploading(true);
      setImagePreview(URL.createObjectURL(file));
      try {
        const imageUrl = await uploadNewsImage(file);
        setNewsPayload((prev) => ({ ...prev, imageUrl }));
        toast.success(t('eventManagerCreateNews.imageUploaded'));
      } catch (error) {
        console.error('Image upload failed:', error);
        toast.error(t('eventManagerCreateNews.imageUploadFailed'));
        setImagePreview(null);
      } finally {
        setIsUploading(false);
      }
    }
  }, [t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setNewsPayload((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Cập nhật nội dung từ trình soạn thảo
  const handleEditorChange = (content: string) => {
    setNewsPayload((prev) => ({
      ...prev,
      newsContent: content,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedContent = cleanHtml(newsPayload.newsContent);

    // Validate form
    if (!newsPayload.newsTitle.trim()) {
              toast.error(t('eventManagerCreateNews.newsTitleRequired'));
      return;
    }
    if (!newsPayload.newsDescription.trim()) {
              toast.error(t('eventManagerCreateNews.descriptionRequired'));
      return;
    }
    if (!cleanedContent) {
              toast.error(t('eventManagerCreateNews.contentRequired'));
      return;
    }
    if (!newsPayload.imageUrl) {
              toast.error(t('eventManagerCreateNews.imageRequired'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...newsPayload,
        newsContent: cleanedContent,
      };

      await createNews(payload);
              toast.success(t('eventManagerCreateNews.newsCreated'));
      navigate('/event-manager/news');
    } catch (error) {
      console.error('Error creating news:', error);
              toast.error(t('eventManagerCreateNews.errorCreatingNews'));
    } finally {
      setLoading(false);
    }
  };

  // Cấu hình toolbar cho Quill
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'link', 'image'
  ];

  return (
    <div
      className={cn(
        'min-h-screen py-12 px-4 sm:px-6 lg:px-8',
        getThemeClass(
          'bg-gradient-to-br from-blue-50 to-indigo-100',
          'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
        )
      )}
    >
      <style>
        {`
        /* Styles cho ReactQuill */
        .quill-editor .ql-toolbar {
          border-radius: 0.75rem 0.75rem 0 0 !important;
          border-width: 1px !important;
          padding: 8px !important;
        }
        .quill-editor .ql-container {
          border-radius: 0 0 0.75rem 0.75rem !important;
          border-width: 1px !important;
          min-height: 250px; /* Chiều cao tối thiểu */
        }
        .quill-editor .ql-editor {
          padding: 12px !important;
        }
        .quill-editor .ql-toolbar .ql-formats button {
           margin-right: 4px;
        }

        /* Light Theme */
        .light .quill-editor .ql-toolbar {
          background: #f9fafb !important;
          border-color: #d1d5db !important;
        }
        .light .quill-editor .ql-container {
          background: #ffffff !important;
          border-color: #d1d5db !important;
        }
        .light .quill-editor .ql-editor {
          color: #111827 !important;
        }
        .light .quill-editor .ql-editor.ql-blank::before {
          color: #6b7280 !important;
        }
        .light .quill-editor .ql-stroke {
           stroke: #4b5563 !important;
        }
        .light .quill-editor .ql-picker-label {
           color: #4b5563 !important;
        }

        /* Dark Theme */
        .dark .quill-editor .ql-toolbar {
          background: #1f2937 !important;
          border-color: #4b5563 !important;
        }
        .dark .quill-editor .ql-container {
          background: #374151 !important;
          border-color: #4b5563 !important;
        }
        .dark .quill-editor .ql-editor {
          color: #f3f4f6 !important;
        }
        .dark .quill-editor .ql-editor.ql-blank::before {
          color: #9ca3af !important;
        }
         .dark .quill-editor .ql-stroke {
           stroke: #d1d5db !important;
        }
        .dark .quill-editor .ql-fill {
           fill: #d1d5db !important;
        }
        .dark .quill-editor .ql-picker-label {
           color: #d1d5db !important;
        }
        
        /* Toggle Switch Styles */
        .toggle-checkbox:checked {
          transform: translateX(1rem);
          border-color: #ffffff;
        }
        `}
      </style>

      <div className="max-w-5xl mx-auto">
        <div
          className={cn(
            'rounded-3xl shadow-2xl overflow-hidden',
            getThemeClass(
              'bg-white/90 backdrop-blur-sm border border-blue-200',
              'bg-slate-800/90 backdrop-blur-sm border border-purple-700/40'
            )
          )}
        >
          {/* Header */}
          <div
            className={cn(
              'p-6 border-b',
              getThemeClass('border-blue-200', 'border-purple-700/40')
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {t('eventManagerCreateNews.title')}
                </h1>
                <p className={cn('mt-1 text-sm', getThemeClass('text-gray-600', 'text-slate-400'))}>
                  {t('eventManagerCreateNews.subtitle')}
                </p>
              </div>
              <button
                onClick={() => navigate('/event-manager/news')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 flex items-center gap-2',
                  getThemeClass(
                    'text-blue-700 hover:text-white bg-blue-100/50 hover:bg-blue-600 border-blue-300',
                    'text-purple-200 hover:text-white bg-purple-900/30 hover:bg-purple-800/50 border-purple-500/30'
                  )
                )}
              >
                {/* Back Icon */}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {t('eventManagerCreateNews.backToNews')}
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Image Upload & Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <label className={cn('block text-sm font-medium mb-2', getThemeClass('text-gray-700', 'text-purple-300'))}>
                    {t('eventManagerCreateNews.newsImage')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div
                    {...getRootProps()}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 min-h-[200px] flex flex-col items-center justify-center',
                      getThemeClass(
                        'border-blue-400 hover:border-blue-500 hover:bg-blue-50/50',
                        'border-purple-500/50 hover:border-purple-400 hover:bg-purple-500/10'
                      ),
                      isDragActive && getThemeClass('bg-blue-100', 'bg-purple-500/20')
                    )}
                  >
                    <input {...getInputProps()} />
                    {isUploading ? (
                      <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className={getThemeClass('text-gray-600', 'text-slate-400')}>{t('uploadingCover')}</p>
                      </div>
                    ) : imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="mx-auto max-h-40 rounded-lg object-contain" />
                    ) : (
                      <div className="text-center">
                        <div className="text-5xl mb-3">📷</div>
                        <p className={cn('mb-1', getThemeClass('text-gray-600', 'text-slate-400'))}>
                          {isDragActive ? t('dropImageHere') : t('clickOrDragImage')}
                        </p>
                        <p className={cn('text-xs', getThemeClass('text-gray-500', 'text-slate-500'))}>PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  {/* News Title */}
                  <div>
                    <label htmlFor="newsTitle" className={cn('block text-sm font-medium mb-2', getThemeClass('text-gray-700', 'text-purple-300'))}>
                      {t('eventManagerCreateNews.newsTitle')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      id="newsTitle"
                      name="newsTitle"
                      value={newsPayload.newsTitle}
                      onChange={handleChange}
                      className={cn(
                        'w-full p-3 rounded-xl border focus:ring-2 focus:border-transparent transition-all duration-200',
                         getThemeClass(
                           'bg-white text-gray-900 placeholder-gray-500 border-gray-300 focus:ring-purple-500',
                           'bg-slate-700/80 text-white placeholder-slate-400 border-purple-700 focus:ring-purple-500'
                         )
                      )}
                      placeholder={t('eventManagerCreateNews.newsTitlePlaceholder')}
                      required
                    />
                  </div>

                  {/* News Description */}
                  <div>
                    <label htmlFor="newsDescription" className={cn('block text-sm font-medium mb-2', getThemeClass('text-gray-700', 'text-purple-300'))}>
                      {t('eventManagerCreateNews.shortDescription')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      id="newsDescription"
                      name="newsDescription"
                      value={newsPayload.newsDescription}
                      onChange={handleChange}
                      rows={4}
                      className={cn(
                        'w-full p-3 rounded-xl border focus:ring-2 focus:border-transparent transition-all duration-200 resize-none',
                        getThemeClass(
                           'bg-white text-gray-900 placeholder-gray-500 border-gray-300 focus:ring-purple-500',
                           'bg-slate-700/80 text-white placeholder-slate-400 border-purple-700 focus:ring-purple-500'
                         )
                      )}
                      placeholder={t('eventManagerCreateNews.shortDescriptionPlaceholder')}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Rich Text Editor */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', getThemeClass('text-gray-700', 'text-purple-300'))}>
                  {t('eventManagerCreateNews.newsContent')}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className={cn(
                    'rounded-xl overflow-hidden', 
                    getThemeClass('light', 'dark')
                )}>
                  <QuillEditor
                    value={newsPayload.newsContent}
                    onChange={handleEditorChange}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder={t('enterNewsContent') || 'Nhập nội dung tin tức...'}
                    className="quill-editor"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-purple-500/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center">
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        id="status"
                        name="status"
                        checked={newsPayload.status}
                        onChange={handleChange}
                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                      />
                      <label
                        htmlFor="status"
                        className={cn('toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out',
                          newsPayload.status ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gray-600'
                        )}
                      ></label>
                    </div>
                    <label htmlFor="status" className={cn('text-sm font-medium', getThemeClass('text-gray-700', 'text-pink-200'))}>
                      {newsPayload.status ? t('eventManagerCreateNews.newsStatusActive') : t('eventManagerCreateNews.newsStatusInactive')}
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => navigate('/event-manager/news')}
                      className={cn(
                        'px-6 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto hover:shadow-md',
                        getThemeClass(
                          'text-gray-700 hover:text-gray-900 bg-gray-100/50 hover:bg-gray-200/60 border-gray-300 hover:shadow-gray-500/20',
                          'text-pink-100 hover:text-white bg-pink-900/40 hover:bg-pink-800/60 border-pink-500/40 hover:shadow-pink-500/20'
                        )
                      )}
                    >
                      {/* Cancel Icon */}
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {t('eventManagerCreateNews.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 text-sm font-semibold text-white rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {loading ? (
                        <>
                           <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                           <span>{t('creatingEvent')}</span>
                        </>
                      ) : (
                        <>
                          {/* Create Icon */}
                           <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          {t('eventManagerCreateNews.createNews')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNews;
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback, lazy, Suspense, forwardRef, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { getNewsDetail, updateNews, uploadNewsImage } from '@/services/Event Manager/event.service';
import { NewsPayload } from '@/types/event';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import 'react-quill/dist/quill.snow.css';

// --- BẮT ĐẦU: CÁC THÀNH PHẦN VÀ TIỆN ÍCH CHUNG ---

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
  if (!html) return '';
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

// --- KẾT THÚC: CÁC THÀNH PHẦN VÀ TIỆN ÍCH CHUNG ---

const EditNews: React.FC = () => {
  const { t } = useTranslation();
  const { newsId } = useParams<{ newsId: string }>();
  const navigate = useNavigate();
  const { getThemeClass } = useThemeClasses();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true); // Bắt đầu với trạng thái tải dữ liệu

  const [newsPayload, setNewsPayload] = useState<NewsPayload>({
    eventId: '',
    newsTitle: '',
    newsDescription: '',
    newsContent: '',
    imageUrl: '',
    authorId: '',
    status: true,
  });

  // Tìm nạp dữ liệu tin tức khi component được mount
  useEffect(() => {
    if (!newsId) {
      toast.error('News ID is missing.');
      navigate('/event-manager/news');
      return;
    }
    
    const fetchNews = async () => {
      try {
        const res = await getNewsDetail(newsId);
        const data = res.data?.data;
        if (data) {
          setNewsPayload({
            eventId: data.eventId,
            newsTitle: data.newsTitle,
            newsDescription: data.newsDescription,
            newsContent: data.newsContent,
            imageUrl: data.imageUrl,
            authorId: data.authorId,
            status: data.status,
          });
          setImagePreview(data.imageUrl || null);
        } else {
          toast.error(t('error.newsNotFound'));
          navigate('/event-manager/news');
        }
      } catch (error) {
        console.error('Error fetching news detail:', error);
        toast.error(t('error.fetchingNewsFailed'));
        navigate('/event-manager/news');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [newsId, navigate, t]);

  // Xử lý upload ảnh
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setIsUploading(true);
      setImagePreview(URL.createObjectURL(file));
      try {
        const imageUrl = await uploadNewsImage(file);
        setNewsPayload((prev) => ({ ...prev, imageUrl }));
        toast.success(t('createNews.imageUploaded'));
      } catch (error) {
        console.error('Image upload failed:', error);
        toast.error(t('createNews.imageUploadFailed'));
        // Nếu upload lỗi, quay lại ảnh cũ
        setImagePreview(newsPayload.imageUrl);
      } finally {
        setIsUploading(false);
      }
    }
  }, [t, newsPayload.imageUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] },
    maxSize: 10 * 1024 * 1024,
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

  const handleEditorChange = (content: string) => {
    setNewsPayload((prev) => ({
      ...prev,
      newsContent: content,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newsId) return;

    const cleanedContent = cleanHtml(newsPayload.newsContent);

    if (!newsPayload.newsTitle.trim()) {
      toast.error(t('createNews.newsTitleRequired'));
      return;
    }
    if (!cleanedContent) {
      toast.error(t('createNews.contentRequired'));
      return;
    }

    setLoading(true);
    try {
      const payloadToUpdate: NewsPayload = {
        ...newsPayload,
        newsContent: cleanedContent,
      };

      await updateNews(newsId, payloadToUpdate);
      toast.success(t('editNews.newsUpdated'));
      navigate('/event-manager/news');
    } catch (error) {
      console.error('Error updating news:', error);
      toast.error(t('editNews.errorUpdatingNews'));
    } finally {
      setLoading(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'link', 'image'
  ];

  if (loading && !newsPayload.newsTitle) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
      </div>
    );
  }

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
      <style>{/* Style block from CreateNews can be placed here */ `
        .quill-editor .ql-toolbar { border-radius: 0.75rem 0.75rem 0 0 !important; border-width: 1px !important; padding: 8px !important; }
        .quill-editor .ql-container { border-radius: 0 0 0.75rem 0.75rem !important; border-width: 1px !important; min-height: 250px; }
        .light .quill-editor .ql-toolbar { background: #f9fafb !important; border-color: #d1d5db !important; }
        .light .quill-editor .ql-container { background: #ffffff !important; border-color: #d1d5db !important; }
        .dark .quill-editor .ql-toolbar { background: #1f2937 !important; border-color: #4b5563 !important; }
        .dark .quill-editor .ql-container { background: #374151 !important; border-color: #4b5563 !important; }
        .dark .quill-editor .ql-editor { color: #f3f4f6 !important; }
        .dark .quill-editor .ql-editor.ql-blank::before { color: #9ca3af !important; }
        .toggle-checkbox:checked { transform: translateX(1rem); border-color: #ffffff; }
      `}</style>

      <div className="max-w-5xl mx-auto">
        <div
          className={cn(
            'rounded-3xl shadow-2xl overflow-hidden',
            getThemeClass('bg-white/90 border-blue-200', 'bg-slate-800/90 border-purple-700/40')
          )}
        >
          <div className={cn('p-6 border-b', getThemeClass('border-blue-200', 'border-purple-700/40'))}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {t('editNews.title')}
                </h1>
                <p className={cn('mt-1 text-sm', getThemeClass('text-gray-600', 'text-slate-400'))}>
                  {t('editNews.subtitle')}
                </p>
              </div>
              <button onClick={() => navigate('/event-manager/news')}
                className={cn('px-4 py-2 text-sm font-medium rounded-lg border transition-all', getThemeClass('hover:bg-blue-600 hover:text-white', 'hover:bg-purple-800/50'))}
              >
                {t('createNews.backToNews')}
              </button>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <label className={cn('block text-sm font-medium mb-2', getThemeClass('text-gray-700', 'text-purple-300'))}>
                    {t('createNews.newsImage')} <span className="text-red-500">*</span>
                  </label>
                  <div {...getRootProps()}
                    className={cn('border-2 border-dashed rounded-xl p-6 text-center cursor-pointer min-h-[200px] flex items-center justify-center', getThemeClass('border-blue-400', 'border-purple-500/50'), isDragActive && getThemeClass('bg-blue-100', 'bg-purple-500/20'))}>
                    <input {...getInputProps()} />
                    {isUploading ? (
                      <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                    ) : imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="mx-auto max-h-40 rounded-lg object-contain" />
                    ) : (
                      <div className="text-center text-5xl">📷</div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div>
                    <label htmlFor="newsTitle" className={cn('block text-sm font-medium mb-2', getThemeClass('text-gray-700', 'text-purple-300'))}>
                      {t('createNews.newsTitle')} <span className="text-red-500">*</span>
                    </label>
                    <input type="text" id="newsTitle" name="newsTitle" value={newsPayload.newsTitle} onChange={handleChange}
                      className={cn('w-full p-3 rounded-xl border focus:ring-2', getThemeClass('border-gray-300', 'bg-slate-700/80 border-purple-700'))}
                      placeholder={t('createNews.newsTitlePlaceholder')} required />
                  </div>
                  <div>
                    <label htmlFor="newsDescription" className={cn('block text-sm font-medium mb-2', getThemeClass('text-gray-700', 'text-purple-300'))}>
                      {t('createNews.shortDescription')} <span className="text-red-500">*</span>
                    </label>
                    <textarea id="newsDescription" name="newsDescription" value={newsPayload.newsDescription} onChange={handleChange} rows={4}
                      className={cn('w-full p-3 rounded-xl border focus:ring-2 resize-none', getThemeClass('border-gray-300', 'bg-slate-700/80 border-purple-700'))}
                      placeholder={t('createNews.shortDescriptionPlaceholder')} required />
                  </div>
                </div>
              </div>

              <div>
                <label className={cn('block text-sm font-medium mb-2', getThemeClass('text-gray-700', 'text-purple-300'))}>
                  {t('createNews.newsContent')} <span className="text-red-500">*</span>
                </label>
                <div className={cn('rounded-xl overflow-hidden', getThemeClass('light', 'dark'))}>
                  <QuillEditor value={newsPayload.newsContent} onChange={handleEditorChange} modules={quillModules} formats={quillFormats}
                    placeholder={t('enterNewsContent') || 'Nhập nội dung tin tức...'} className="quill-editor" />
                </div>
              </div>

              <div className="pt-6 border-t border-purple-500/30">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center">
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input type="checkbox" id="status" name="status" checked={newsPayload.status} onChange={handleChange}
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                            <label htmlFor="status"
                                className={cn('toggle-label block h-6 rounded-full cursor-pointer', newsPayload.status ? 'bg-green-500' : 'bg-gray-600')}>
                            </label>
                        </div>
                        <label htmlFor="status" className={cn('text-sm font-medium', getThemeClass('text-gray-700', 'text-pink-200'))}>
                            {newsPayload.status ? t('createNews.newsStatusActive') : t('createNews.newsStatusInactive')}
                        </label>
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={() => navigate('/event-manager/news')}
                            className={cn('px-6 py-2.5 rounded-xl border', getThemeClass('border-gray-300', 'border-pink-500/40 hover:bg-pink-800/60'))}>
                            {t('createNews.cancel')}
                        </button>
                        <button type="submit" disabled={loading}
                            className="px-6 py-3 font-semibold text-white rounded-xl shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-70">
                            {loading ? t('editNews.updating') : t('editNews.updateNews')}
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

export default EditNews;
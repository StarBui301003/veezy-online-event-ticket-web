import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { createNews, uploadNewsImage } from '@/services/Event Manager/event.service';
import { NewsPayload } from '@/types/event';
import { toast } from 'react-toastify';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

const CreateNews: React.FC = () => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
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

  // State cho nội dung rich text
  const [newsContent, setNewsContent] = useState('');
  const { quill, quillRef } = useQuill();

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
        /* ignore parse error */
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

    // Note: News realtime updates not available in current backend
    // No NewsHub implemented yet
  }, [navigate, t]);

  useEffect(() => {
    if (quill) {
      quill.clipboard.dangerouslyPasteHTML(newsContent || '');
      quill.on('text-change', () => {
        setNewsContent(quill.root.innerHTML);
      });

      // Add theme class to body for CSS targeting
      const isDark = document.body.classList.contains('dark');
      const themeClass = isDark ? 'dark' : 'light';
      
      // Remove existing theme classes and add current one
      document.body.classList.remove('light', 'dark');
      document.body.classList.add(themeClass);

      // Set editor container styles
      const editorContainer = quill.container.firstChild as HTMLElement;
      if (editorContainer) {
        editorContainer.style.minHeight = '300px';
        editorContainer.style.color = getThemeClass('#374151', '#fff');
        editorContainer.style.border = 'none';
        editorContainer.style.borderRadius = '0.5rem';
      }

      // Set toolbar styles
      const toolbar = quill.getModule('toolbar') as { container: HTMLElement };
      if (toolbar && toolbar.container) {
        const toolbarElement = toolbar.container as HTMLElement;
        toolbarElement.style.border = 'none';
        toolbarElement.style.borderBottom = getThemeClass(
          '1px solid rgba(59, 130, 246, 0.3)',
          '1px solid rgba(236, 72, 153, 0.3)'
        );
        toolbarElement.style.borderRadius = '0.5rem 0.5rem 0 0';
        toolbarElement.style.backgroundColor = getThemeClass('#f8fafc', '#1a0022');
        toolbarElement.style.padding = '0.5rem';

        // Style all buttons in the toolbar
        const buttons = toolbarElement.querySelectorAll('button');
        buttons.forEach((button) => {
          button.style.color = getThemeClass('#374151', '#ffffff');
          button.style.opacity = '0.8';
          button.style.transition = 'opacity 0.2s';
          button.style.borderRadius = '0.25rem';
          button.style.padding = '0.25rem 0.5rem';
          button.style.margin = '0 0.125rem';

          button.addEventListener('mouseenter', () => {
            button.style.opacity = '1';
            button.style.backgroundColor = getThemeClass(
              'rgba(59, 130, 246, 0.2)',
              'rgba(236, 72, 153, 0.2)'
            );
          });

          button.addEventListener('mouseleave', () => {
            button.style.opacity = '0.8';
            button.style.backgroundColor = 'transparent';
          });
        });

        // Style dropdowns and other elements
        const dropdowns = toolbarElement.querySelectorAll('select');
        dropdowns.forEach((dropdown) => {
          if (isDark) {
            dropdown.style.color = '#fff';
            dropdown.style.backgroundColor = '#27272a';
            dropdown.style.border = '1px solid #a21caf';
          } else {
            dropdown.style.color = '#374151';
            dropdown.style.backgroundColor = '#fff';
            dropdown.style.border = '1px solid #d1d5db';
          }
        });

        // Style spans and other text elements
        const textElements = toolbarElement.querySelectorAll('span');
        textElements.forEach((element) => {
          element.style.color = getThemeClass('#374151', '#ffffff');
        });
      }
    }
  }, [quill, getThemeClass]);

  useEffect(() => {
    if (quill && newsContent !== quill.root.innerHTML) {
      quill.clipboard.dangerouslyPasteHTML(newsContent || '');
    }
  }, [newsContent, quill]);

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
        setImagePreview(null);
      } finally {
        setIsUploading(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setNewsPayload((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!newsPayload.newsTitle.trim()) {
      toast.error(t('createNews.newsTitleRequired'));
      return;
    }

    if (!newsPayload.newsDescription.trim()) {
      toast.error(t('createNews.descriptionRequired'));
      return;
    }

    if (!newsContent || newsContent === '<p><br></p>') {
      toast.error(t('createNews.contentRequired'));
      return;
    }

    if (!newsPayload.imageUrl) {
      toast.error(t('createNews.imageRequired'));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...newsPayload,
        newsContent,
        eventId: eventId,
        authorId: newsPayload.authorId,
      };

      await createNews(payload);
      toast.success(t('createNews.newsCreated'));
      navigate('/event-manager/news');
    } catch (error) {
      console.error('Error creating news:', error);
      toast.error(t('createNews.errorCreatingNews'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'min-h-screen py-12 px-4 sm:px-6 lg:px-8',
        getThemeClass(
          'bg-gradient-to-br from-blue-50 to-indigo-100',
          'bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e]'
        )
      )}
    >
      <div className="max-w-5xl mx-auto">
        <div
          className={cn(
            'rounded-3xl shadow-2xl border-2 overflow-hidden',
            getThemeClass(
              'bg-white/90 backdrop-blur-sm border-blue-200',
              'bg-gradient-to-br from-[#2d0036]/90 via-[#3a0ca3]/90 to-[#ff008e]/90 border-pink-500/30'
            )
          )}
        >
          {/* Header */}
          <div
            className={cn(
              'p-6 border-b',
              getThemeClass(
                'bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border-blue-200',
                'bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-blue-600/20 border-pink-500/30'
              )
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className={cn(
                    'text-3xl font-extrabold',
                    getThemeClass(
                      'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent',
                      'bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent'
                    )
                  )}
                >
                  {t('createNews.title')}
                </h1>
                <p
                  className={cn('mt-1 text-sm', getThemeClass('text-gray-600', 'text-pink-200/80'))}
                >
                  {t('createNews.subtitle')}
                </p>
              </div>
              <button
                onClick={() => navigate('/event-manager/news')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 flex items-center gap-2',
                  getThemeClass(
                    'text-blue-700 hover:text-blue-900 bg-blue-100/50 hover:bg-blue-200/50 border-blue-300',
                    'text-pink-200 hover:text-white bg-pink-900/30 hover:bg-pink-800/50 border-pink-500/30'
                  )
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                {t('createNews.backToNews')}
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div
            className={cn(
              'p-6',
              getThemeClass(
                'bg-white',
                'bg-gradient-to-br from-[#2d0036]/90 via-[#3a0ca3]/90 to-[#ff008e]/90'
              )
            )}
          >
            <form onSubmit={handleSubmit}>
              {/* Image Upload */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-1">
                  <label
                    className={cn(
                      'block text-sm font-medium mb-2',
                      getThemeClass('text-gray-700', 'text-pink-300')
                    )}
                  >
                    {t('createNews.newsImage')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div
                    {...getRootProps()}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 min-h-[200px] flex flex-col items-center justify-center',
                      getThemeClass(
                        isDragActive
                          ? 'border-blue-400 bg-blue-500/10'
                          : 'border-blue-300 hover:border-blue-400 hover:bg-blue-500/10',
                        isDragActive
                          ? 'border-yellow-400 bg-yellow-500/10'
                          : 'border-pink-500/30 hover:border-pink-400 hover:bg-pink-500/10'
                      )
                    )}
                  >
                    <input {...getInputProps()} />
                    {isUploading ? (
                      <div className="space-y-2">
                        <div
                          className={cn(
                            'animate-spin rounded-full h-10 w-10 border-b-2 mx-auto',
                            getThemeClass('border-blue-400', 'border-pink-400')
                          )}
                        ></div>
                        <p className={cn('', getThemeClass('text-blue-600', 'text-pink-300'))}>
                          {t('createNews.updating')}...
                        </p>
                      </div>
                    ) : imagePreview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="mx-auto max-h-40 rounded-lg object-contain"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <span
                            className={cn(
                              'text-sm text-white px-3 py-1 rounded-lg',
                              getThemeClass('bg-blue-600/80', 'bg-pink-600/80')
                            )}
                          >
                            {t('editNews.changeImage')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4">
                        <div
                          className={cn(
                            'mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-2',
                            getThemeClass('bg-blue-500/10', 'bg-pink-500/10')
                          )}
                        >
                          <svg
                            className={cn(
                              'h-6 w-6',
                              getThemeClass('text-blue-400', 'text-pink-400')
                            )}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <p
                          className={cn('text-sm', getThemeClass('text-gray-600', 'text-pink-300'))}
                        >
                          <span
                            className={cn(
                              'font-medium',
                              getThemeClass('text-blue-600', 'text-pink-200')
                            )}
                          >
                            {t('createNews.clickToUpload')}
                          </span>
                        </p>
                        <p
                          className={cn(
                            'text-xs mt-1',
                            getThemeClass('text-gray-500', 'text-pink-400/80')
                          )}
                        >
                          {t('createNews.orDragAndDrop')}
                        </p>
                        <p
                          className={cn(
                            'text-xs mt-1',
                            getThemeClass('text-gray-400', 'text-pink-400/60')
                          )}
                        >
                          {t('createNews.imageFormatHint')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  {/* News Title */}
                  <div>
                    <label
                      htmlFor="newsTitle"
                      className={cn(
                        'block text-sm font-medium mb-2',
                        getThemeClass('text-gray-700', 'text-pink-300')
                      )}
                    >
                      {t('createNews.newsTitle')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      id="newsTitle"
                      name="newsTitle"
                      value={newsPayload.newsTitle}
                      onChange={handleChange}
                      className={cn(
                        'w-full px-4 py-3 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200',
                        getThemeClass(
                          'bg-white border-2 border-blue-300 text-gray-900 placeholder-blue-400/60 focus:ring-blue-500',
                          'bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400/60 focus:ring-pink-500'
                        )
                      )}
                      placeholder={t('createNews.newsTitlePlaceholder')}
                      required
                    />
                  </div>

                  {/* News Description */}
                  <div>
                    <label
                      htmlFor="newsDescription"
                      className={cn(
                        'block text-sm font-medium mb-2',
                        getThemeClass('text-gray-700', 'text-pink-300')
                      )}
                    >
                      {t('createNews.shortDescription')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      id="newsDescription"
                      name="newsDescription"
                      value={newsPayload.newsDescription}
                      onChange={handleChange}
                      rows={3}
                      className={cn(
                        'w-full p-4 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 resize-none',
                        getThemeClass(
                          'bg-white border-2 border-blue-300 text-gray-900 placeholder-blue-400/60 focus:ring-blue-500',
                          'bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400/60 focus:ring-pink-500'
                        )
                      )}
                      placeholder={t('createNews.shortDescriptionPlaceholder')}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Rich Text Editor */}
              <div className="mb-6">
                <label
                  className={cn(
                    'block text-sm font-medium mb-2',
                    getThemeClass('text-gray-700', 'text-pink-300')
                  )}
                >
                  {t('createNews.newsContent')}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div
                  className={cn(
                    'rounded-xl overflow-hidden border-2',
                    getThemeClass('bg-white border-blue-300', 'border-pink-500/30 bg-[#1a0022]')
                  )}
                >
                  <div className="h-[300px] overflow-auto" ref={quillRef} />
                </div>
                {!newsContent && (
                  <p className="mt-1 text-xs text-red-400">{t('createNews.contentRequired')}</p>
                )}
              </div>

              {/* Footer with gradient matching the header */}
              <div className="mt-8 pt-6 border-t border-pink-500/30">
                <div
                  className={cn(
                    'rounded-xl p-6',
                    getThemeClass(
                      'bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20',
                      'bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-blue-600/20'
                    )
                  )}
                >
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
                          className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${
                            newsPayload.status
                              ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                              : 'bg-gray-600'
                          }`}
                        ></label>
                      </div>
                      <label
                        htmlFor="status"
                        className={cn(
                          'text-sm font-medium',
                          getThemeClass('text-gray-700', 'text-pink-200')
                        )}
                      >
                        {newsPayload.status
                          ? t('createNews.newsStatusActive')
                          : t('createNews.newsStatusInactive')}
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        {t('createNews.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                          'px-6 py-2.5 text-sm font-medium text-white rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed',
                          getThemeClass(
                            'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/30',
                            'bg-gradient-to-r from-pink-600 to-yellow-500 hover:from-pink-700 hover:to-yellow-600 hover:shadow-pink-500/30'
                          )
                        )}
                      >
                        {loading ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            {t('createNews.updating')}...
                          </>
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            {t('createNews.createNews')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

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
          background-color: rgba(59, 130, 246, 0.2) !important;
        }
        .light .ql-container {
          background: #ffffff !important;
          color: #374151 !important;
          border-radius: 0 0 0.75rem 0.75rem !important;
          border-color: #3b82f6 !important;
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
          border: 1px solid #d1d5db !important;
          background: #ffffff !important;
        }
        .light .ql-picker-options {
          background: #ffffff !important;
          border: 1px solid #d1d5db !important;
          color: #374151 !important;
        }
        .light .ql-picker-item {
          color: #374151 !important;
        }
        .light .ql-picker-item:hover {
          background-color: rgba(59, 130, 246, 0.2) !important;
        }
        .light .ql-picker-item.ql-selected {
          background-color: rgba(59, 130, 246, 0.4) !important;
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
        `}
      </style>
    </div>
  );
};

export default CreateNews;

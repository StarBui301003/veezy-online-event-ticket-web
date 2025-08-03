import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { getNewsDetail, updateNews, uploadNewsImage } from "@/services/Event Manager/event.service";
import { NewsPayload } from "@/types/event";
import { toast } from "react-toastify";
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';
import { useTranslation } from 'react-i18next';

const EditNews: React.FC = () => {
  const { t } = useTranslation();
  const { newsId } = useParams<{ newsId: string }>();
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newsPayload, setNewsPayload] = useState<NewsPayload>({
    eventId: "",
    newsTitle: "",
    newsDescription: "",
    newsContent: "",
    imageUrl: "",
    authorId: "",
    status: true,
  });
  const [newsContent, setNewsContent] = useState('');
  const { quill, quillRef } = useQuill();

  // Fetch news detail on mount
  useEffect(() => {
    if (!newsId) return;
    setLoading(true);
    getNewsDetail(newsId)
      .then(res => {
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
          setNewsContent(data.newsContent || '');
          setImagePreview(data.imageUrl || null);
        } else {
          toast.error(t('editNews.newsNotFound'));
          navigate('/event-manager/news');
        }
      })
      .catch(() => {
        toast.error(t('editNews.errorLoadingNews'));
        navigate('/event-manager/news');
      })
      .finally(() => setLoading(false));

    // Note: News realtime updates not available in current backend  
    // No NewsHub implemented yet
    // eslint-disable-next-line
  }, [newsId]);

  // Initialize Quill editor
  useEffect(() => {
    if (quill) {
      quill.clipboard.dangerouslyPasteHTML(newsContent || '');
      quill.on('text-change', () => {
        setNewsContent(quill.root.innerHTML);
      });
      
      // Set editor container styles
      const editorContainer = quill.container.firstChild as HTMLElement;
      if (editorContainer) {
        editorContainer.style.minHeight = '300px';
        editorContainer.style.color = '#fff';
        editorContainer.style.border = 'none';
        editorContainer.style.borderRadius = '0.5rem';
      }

      // Set toolbar styles
      const toolbar = quill.getModule('toolbar');
      if (toolbar && toolbar.container) {
        const toolbarElement = toolbar.container as HTMLElement;
        toolbarElement.style.border = 'none';
        toolbarElement.style.borderBottom = '1px solid rgba(236, 72, 153, 0.3)';
        toolbarElement.style.borderRadius = '0.5rem 0.5rem 0 0';
        toolbarElement.style.backgroundColor = '#1a0022';
        toolbarElement.style.padding = '0.5rem';
        
        // Style all buttons in the toolbar
        const buttons = toolbarElement.querySelectorAll('button');
        buttons.forEach(button => {
          button.style.color = '#fff';
          button.style.opacity = '0.8';
          button.style.transition = 'opacity 0.2s';
          button.style.borderRadius = '0.25rem';
          button.style.padding = '0.25rem 0.5rem';
          button.style.margin = '0 0.125rem';
          
          button.addEventListener('mouseenter', () => {
            button.style.opacity = '1';
            button.style.backgroundColor = 'rgba(236, 72, 153, 0.2)';
          });
          
          button.addEventListener('mouseleave', () => {
            button.style.opacity = '0.8';
            button.style.backgroundColor = 'transparent';
          });
        });
      }
    }
  }, [quill]);

  // Update content when newsContent changes from props
  useEffect(() => {
    if (quill && newsContent !== quill.root.innerHTML) {
      quill.clipboard.dangerouslyPasteHTML(newsContent || '');
    }
  }, [newsContent, quill]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setIsUploading(true);
        setImagePreview(URL.createObjectURL(file));
        try {
          const imageUrl = await uploadNewsImage(file);
          setNewsPayload((prev) => ({ ...prev, imageUrl }));
          toast.success(t('editNews.imageUploaded'));
        } catch (error) {
          toast.error(t('editNews.errorUploadingImage'));
          setImagePreview(null);
        } finally {
          setIsUploading(false);
        }
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setNewsPayload((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!newsPayload.newsTitle.trim()) {
      toast.error(t('editNews.newsTitleRequired'));
      return;
    }
    
    if (!newsPayload.newsDescription.trim()) {
      toast.error(t('editNews.descriptionRequired'));
      return;
    }
    
    if (!newsContent || newsContent === '<p><br></p>') {
      toast.error(t('editNews.contentRequired'));
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = {
        ...newsPayload,
        newsContent,
      };
      
      await updateNews(newsId, payload);
      toast.success(t('editNews.newsUpdated'));
      navigate('/event-manager/news');
    } catch (error) {
      console.error('Error updating news:', error);
      toast.error(t('editNews.errorUpdatingNews'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <span className="text-lg text-gray-500">{t('editNews.loading')}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-[#2d0036]/90 via-[#3a0ca3]/90 to-[#ff008e]/90 rounded-3xl shadow-2xl border-2 border-pink-500/30 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-blue-600/20 p-6 border-b border-pink-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
                  {t('editNews.title')}
                </h1>
                <p className="mt-1 text-sm text-pink-200/80">
                  {t('editNews.subtitle')}
                </p>
              </div>
              <button
                onClick={() => navigate('/event-manager/news')}
                className="px-4 py-2 text-sm font-medium text-pink-200 hover:text-white bg-pink-900/30 hover:bg-pink-800/50 rounded-lg border border-pink-500/30 transition-all duration-200 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {t('editNews.backToNews')}
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 bg-gradient-to-br from-[#2d0036]/90 via-[#3a0ca3]/90 to-[#ff008e]/90">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Image Upload */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-pink-300 mb-2">
                      {t('editNews.newsImage')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 min-h-[200px] flex flex-col items-center justify-center ${
                        isDragActive 
                          ? "border-yellow-400 bg-yellow-500/10" 
                          : "border-pink-500/30 hover:border-pink-400 hover:bg-pink-500/10"
                      }`}
                    >
                      <input {...getInputProps()} />
                      {isUploading ? (
                        <div className="space-y-2">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-400 mx-auto"></div>
                          <p className="text-pink-300">{t('editNews.updating')}...</p>
                        </div>
                      ) : imagePreview ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="mx-auto max-h-40 rounded-lg object-contain" 
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <span className="text-sm bg-pink-600/80 text-white px-3 py-1 rounded-lg">
                              {t('editNews.changeImage')}
                            </span>
                          </div>
                        </div>
                      ) : newsPayload.imageUrl ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={newsPayload.imageUrl} 
                            alt="Current" 
                            className="mx-auto max-h-40 rounded-lg object-contain" 
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <span className="text-sm bg-pink-600/80 text-white px-3 py-1 rounded-lg">
                              {t('editNews.changeImage')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/10 mb-2">
                            <svg className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-pink-300">
                            <span className="font-medium text-pink-200">{t('editNews.clickToUpload')}</span>
                          </p>
                          <p className="text-xs text-pink-400/80 mt-1">
                            {t('editNews.orDragAndDrop')}
                          </p>
                          <p className="text-xs text-pink-400/60 mt-1">
                            {t('editNews.imageFormatHint')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-6">
                    {/* News Title */}
                    <div>
                      <label htmlFor="newsTitle" className="block text-sm font-medium text-pink-300 mb-2">
                        {t('editNews.newsTitle')}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        id="newsTitle"
                        name="newsTitle"
                        value={newsPayload.newsTitle}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400/60 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                        placeholder={t('editNews.newsTitlePlaceholder')}
                        required
                      />
                    </div>

                    {/* News Description */}
                    <div>
                      <label htmlFor="newsDescription" className="block text-sm font-medium text-pink-300 mb-2">
                        {t('editNews.shortDescription')}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <textarea
                        id="newsDescription"
                        name="newsDescription"
                        value={newsPayload.newsDescription}
                        onChange={handleChange}
                        rows={3}
                        className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400/60 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder={t('editNews.shortDescriptionPlaceholder')}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Rich Text Editor */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-pink-300 mb-2">
                    {t('editNews.newsContent')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="rounded-xl overflow-hidden border-2 border-pink-500/30 bg-[#1a0022]">
                    <div className="h-[300px] overflow-auto" ref={quillRef} />
                  </div>
                  {!newsContent && (
                    <p className="mt-1 text-xs text-red-400">
                      {t('editNews.contentRequired')}
                    </p>
                  )}
                </div>

                {/* Footer with gradient matching the header */}
                <div className="mt-8 pt-6 border-t border-pink-500/30">
                  <div className="bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-blue-600/20 rounded-xl p-6">
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
                              newsPayload.status ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gray-600'
                            }`}
                          ></label>
                        </div>
                        <label htmlFor="status" className="text-sm font-medium text-pink-200">
                          {newsPayload.status ? t('editNews.newsStatusActive') : t('editNews.newsStatusInactive')}
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => navigate('/event-manager/news')}
                          className="px-6 py-2.5 text-sm font-medium text-pink-100 hover:text-white bg-pink-900/40 hover:bg-pink-800/60 rounded-xl border border-pink-500/40 transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto hover:shadow-pink-500/20 hover:shadow-md"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {t('editNews.cancel')}
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-pink-600 to-yellow-500 hover:from-pink-700 hover:to-yellow-600 rounded-xl shadow-lg hover:shadow-pink-500/30 transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {t('editNews.updating')}...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {t('editNews.updateNews')}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditNews;
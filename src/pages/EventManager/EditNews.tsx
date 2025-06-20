import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { getNewsDetail, updateNews, uploadNewsImage } from "@/services/Event Manager/event.service";
import { NewsPayload } from "@/types/event";
import { toast } from "react-toastify";
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';

const EditNews: React.FC = () => {
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
          toast.error('Không tìm thấy tin tức!');
          navigate('/event-manager/news');
        }
      })
      .catch(() => {
        toast.error('Lỗi khi tải tin tức!');
        navigate('/event-manager/news');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [newsId]);

  // Đảm bảo quill editor luôn sync với newsContent khi fetch xong
  useEffect(() => {
    if (quill && newsContent !== undefined) {
      quill.root.innerHTML = newsContent || '';
    }
  }, [quill, newsContent]);

  useEffect(() => {
    if (quill) {
      quill.root.setAttribute('style', 'background:#27272a;color:#fff;min-height:160px;');
      quill.on('text-change', () => {
        setNewsContent(quill.root.innerHTML);
      });
    }
  }, [quill]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setIsUploading(true);
        setImagePreview(URL.createObjectURL(file));
        try {
          const imageUrl = await uploadNewsImage(file);
          setNewsPayload((prev) => ({ ...prev, imageUrl }));
          toast.success("Tải ảnh lên thành công!");
        } catch (error) {
          toast.error("Tải ảnh lên thất bại!");
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
    if (!newsPayload.newsTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề tin tức!");
      return;
    }
    if (!newsPayload.newsDescription.trim()) {
      toast.error("Vui lòng nhập mô tả tin tức!");
      return;
    }
    if (!newsContent || !newsContent.trim() || newsContent === '<p><br></p>') {
      toast.error("Vui lòng nhập nội dung tin tức!");
      return;
    }
    if (!newsPayload.authorId) {
      toast.error("Thông tin tác giả bị thiếu. Vui lòng đăng nhập lại!");
      return;
    }
    if (!newsPayload.imageUrl) {
      toast.error("Vui lòng tải lên ảnh tin tức!");
      return;
    }
    if (!newsPayload.eventId) {
      toast.error("Thiếu ID sự kiện!");
      return;
    }
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(newsPayload.eventId)) {
      toast.error("ID sự kiện không hợp lệ!");
      return;
    }
    if (!uuidRegex.test(newsPayload.authorId)) {
      toast.error("ID tác giả không hợp lệ!");
      return;
    }
    try {
      const payloadToSend = { ...newsPayload, newsContent };
      const response = await updateNews(newsId!, payloadToSend);
      if (response && response.flag !== false) {
        toast.success("Cập nhật tin tức thành công!");
        setTimeout(() => {
          navigate(`/event-manager/news`);
        }, 1000);
      } else {
        toast.error(response?.message || "Cập nhật tin tức thất bại!");
      }
    } catch {
      toast.error("Cập nhật tin tức thất bại!");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <span className="text-lg text-gray-500">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] py-0 px-0 pt-20">
      <div className="w-full flex justify-center items-center">
        <div className="w-full max-w-5xl bg-gradient-to-br from-[#2d0036] via-[#3a0ca3]/80 to-[#ff008e]/80 rounded-3xl shadow-2xl border-2 border-pink-500/30 p-16 space-y-10 animate-fade-in my-12 mx-4">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent tracking-wide uppercase text-center">
            Chỉnh sửa tin tức
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload Dropzone */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 w-full md:w-64 pt-4 md:pt-8">
                <label className="block text-sm font-bold text-pink-300 mb-2">Ảnh tin tức</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-4 md:p-8 text-center cursor-pointer transition-all duration-200 min-h-[170px] bg-[#1a0022]/80 ${
                    isDragActive ? "border-yellow-400" : "border-pink-500/30 hover:border-pink-400"
                  }`}>
                  <input {...getInputProps()} />
                  {isUploading ? (
                    <p className="text-pink-300">Đang tải lên...</p>
                  ) : imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="mx-auto h-40 rounded-lg object-contain" />
                  ) : (
                    <p className="text-pink-300">Kéo thả ảnh vào đây hoặc click để chọn</p>
                  )}
                </div>
              </div>
              <div className="flex-1 w-full">
                {/* News Description */}
                <label htmlFor="newsDescription" className="block text-sm font-bold text-pink-300 mb-2 text-left">Mô tả ngắn</label>
                <textarea
                  id="newsDescription"
                  name="newsDescription"
                  value={newsPayload.newsDescription}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-left resize-none"
                  placeholder="Nhập mô tả ngắn về tin tức"
                  required
                  style={{ textAlign: 'left' }}
                />
              </div>
            </div>
            {/* News Title */}
            <div>
              <label htmlFor="newsTitle" className="block text-sm font-bold text-pink-300">Tiêu đề tin tức</label>
              <input
                type="text"
                id="newsTitle"
                name="newsTitle"
                value={newsPayload.newsTitle}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                placeholder="Nhập tiêu đề tin tức"
                required
              />
            </div>
            {/* News Content - Rich Text Editor (useQuill) */}
            <div>
              <label htmlFor="newsContent" className="block text-sm font-bold text-pink-300 mb-2">Nội dung chi tiết</label>
              <div className="rounded-xl border border-pink-500 bg-[#27272a] p-2">
                <div ref={quillRef} style={{ minHeight: 160, color: '#fff' }} />
              </div>
            </div>
            {/* Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="status"
                name="status"
                checked={newsPayload.status}
                onChange={handleChange}
                className="w-5 h-5 accent-pink-500 rounded"
              />
              <label htmlFor="status" className="font-bold text-pink-300">
                Tin tức đang hoạt động
              </label>
            </div>
            <div className="flex justify-end space-x-4">
              <button 
                type="button" 
                onClick={() => navigate('/event-manager/news')} 
                className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-500 transition-all duration-200 font-bold"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500 text-white rounded-xl font-bold transition-all duration-200" 
                disabled={isUploading}
              >
                {isUploading ? "Đang tải..." : "Cập nhật tin tức"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditNews; 
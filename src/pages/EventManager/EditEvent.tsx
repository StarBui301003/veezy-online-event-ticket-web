/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getEventById,
  updateEvent,
  uploadImage,
  deleteEventImage,
  getAllCategories,
} from '@/services/Event Manager/event.service';
import { CreateEventData, Category, Content } from '@/types/event';
import { validateEventForm } from '@/utils/validation';

const MAX_SECTIONS = 5;
const contentTypeOptions = [
  { value: 'description', label: 'Description Only' },
  { value: 'image', label: 'Image Only' },
  { value: 'both', label: 'Both' },
];

type ContentType = 'description' | 'image' | 'both';
interface EnhancedContent extends Content {
  contentType?: ContentType;
}

function getContentType(content: EnhancedContent): ContentType {
  if (content.description && content.imageUrl) return 'both';
  if (content.description && !content.imageUrl) return 'description';
  if (!content.description && content.imageUrl) return 'image';
  return 'both';
}

function validateSections(contents: EnhancedContent[]): string[] {
  const errors: string[] = [];
  if (contents.length > MAX_SECTIONS) {
    errors.push(`Tối đa ${MAX_SECTIONS} section.`);
  }
  const positions = contents.map((c) => c.position);
  const uniquePositions = new Set(positions);
  if (uniquePositions.size !== positions.length) {
    errors.push('Các section phải có vị trí (position) không trùng nhau.');
  }
  if (positions.some((pos) => pos < 1 || pos > MAX_SECTIONS)) {
    errors.push(`Position của section phải từ 1 đến ${MAX_SECTIONS}.`);
  }
  contents.forEach((content, idx) => {
    const type = content.contentType || getContentType(content);
    if (type === 'description' && !content.description?.trim()) {
      errors.push(`Section #${idx + 1}: Mô tả là bắt buộc.`);
    }
    if (type === 'image' && !content.imageUrl) {
      errors.push(`Section #${idx + 1}: Ảnh là bắt buộc.`);
    }
    if (type === 'both' && !content.description?.trim() && !content.imageUrl) {
      errors.push(`Section #${idx + 1}: Phải có mô tả hoặc ảnh.`);
    }
  });
  return errors;
}

const EditEvent = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
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
  });
  const [contents, setContents] = useState<EnhancedContent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingContentImage, setUploadingContentImage] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    const fetchEventAndCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const event = await getEventById(eventId!);
        setFormData({
          eventName: event.eventName || '',
          eventDescription: event.eventDescription || '',
          eventCoverImageUrl: event.eventCoverImageUrl || '',
          eventLocation: event.eventLocation || '',
          startAt: event.startAt ? new Date(event.startAt).toISOString().slice(0, 16) : '',
          endAt: event.endAt ? new Date(event.endAt).toISOString().slice(0, 16) : '',
          tags: event.tags || [],
          categoryIds:
            event.categoryIds && event.categoryIds.length > 0
              ? event.categoryIds
              : event.categoryId
              ? [event.categoryId]
              : [],
          contents: [],
          bankAccount: event.bankAccount || '',
        });
        // Convert contents to EnhancedContent with contentType
        setContents(
          (event.contents || []).map((c: Content) => ({
            ...c,
            contentType: getContentType(c),
          }))
        );
        const categoryData = await getAllCategories();
        setCategories(categoryData);
      } catch (err) {
        setError('Không thể tải dữ liệu sự kiện hoặc danh mục!');
      } finally {
        setLoading(false);
      }
    };
    fetchEventAndCategories();
    // eslint-disable-next-line
  }, [eventId]);

  // Cover image handlers
  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingCover(true);
      try {
        const url = await uploadImage(file);
        setFormData((prev) => ({ ...prev, eventCoverImageUrl: url }));
      } catch {
        alert('Upload cover image failed!');
      } finally {
        setUploadingCover(false);
      }
    }
  };

  const handleCoverImageDelete = async () => {
    if (!formData.eventCoverImageUrl) return;
    try {
      await deleteEventImage(formData.eventCoverImageUrl);
      setFormData((prev) => ({ ...prev, eventCoverImageUrl: '' }));
    } catch {
      alert('Xóa ảnh thất bại!');
    }
  };

  // Tag handlers
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()],
        }));
      }
      setTagInput('');
    }
  };
  const handleTagRemove = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== idx),
    }));
  };

  // Section (contents) handlers
  const handleContentChange = (idx: number, field: keyof EnhancedContent, value: any) => {
    setContents((prev) => {
      const newContents = [...prev];
      newContents[idx] = { ...newContents[idx], [field]: value };
      return newContents;
    });
  };

  const handleContentTypeChange = (idx: number, type: ContentType) => {
    setContents((prev) => {
      const newContents = [...prev];
      newContents[idx] = {
        ...newContents[idx],
        contentType: type,
        description: type === 'image' ? '' : newContents[idx].description,
        imageUrl: type === 'description' ? '' : newContents[idx].imageUrl,
      };
      return newContents;
    });
  };

  const handleContentImageChange = async (idx: number, file: File) => {
    setUploadingContentImage(true);
    try {
      const url = await uploadImage(file);
      setContents((prev) => {
        const newContents = [...prev];
        newContents[idx].imageUrl = url;
        return newContents;
      });
    } finally {
      setUploadingContentImage(false);
    }
  };

  const handleContentImageDelete = async (idx: number) => {
    const imageUrl = contents[idx].imageUrl;
    if (imageUrl) {
      await deleteEventImage(imageUrl);
      setContents((prev) => {
        const newContents = [...prev];
        newContents[idx].imageUrl = '';
        return newContents;
      });
    }
  };

  const handleContentRemove = (idx: number) => {
    setContents((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddContent = () => {
    if (contents.length >= MAX_SECTIONS) {
      setValidationErrors(['Tối đa 5 section.']);
      return;
    }
    setContents((prev) => [
      ...prev,
      {
        position: prev.length + 1,
        contentType: 'both',
        description: '',
        imageUrl: '',
      },
    ]);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, categoryIds: [e.target.value] }));
  };

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validate
    const errors = validateEventForm(formData) || [];
    if (!formData.categoryIds || !formData.categoryIds[0]) {
      errors.push('Vui lòng chọn danh mục.');
    }
    if (!formData.eventName.trim()) {
      errors.push('Tên sự kiện không được để trống.');
    }
    if (!formData.startAt || !formData.endAt) {
      errors.push('Vui lòng nhập thời gian bắt đầu và kết thúc.');
    }
    if (formData.startAt && formData.endAt && formData.startAt >= formData.endAt) {
      errors.push('Thời gian kết thúc phải sau thời gian bắt đầu.');
    }
    errors.push(...validateSections(contents));
    if (errors.length > 0) {
      setValidationErrors(errors);
      setSubmitting(false);
      return;
    }
    setValidationErrors([]);

    if (!eventId) {
      setError('Không tìm thấy sự kiện!');
      setSubmitting(false);
      return;
    }

    try {
      const updatedData: CreateEventData = {
        ...formData,
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
        navigate('/event-manager/pending');
      }
    } catch (err) {
      setError('Cập nhật sự kiện thất bại!');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full" />
        <span className="ml-3 text-pink-500">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-0 m-0">
      <div className="w-full h-full p-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-8 bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-6xl mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Chỉnh sửa sự kiện
            </h2>
            <p className="text-slate-400">Cập nhật thông tin sự kiện của bạn</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Tên sự kiện</label>
              <input
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleInputChange}
                className="w-full p-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Nhập tên sự kiện"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Ảnh bìa sự kiện</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  id="cover-upload"
                  onChange={handleCoverImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="cover-upload"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-all duration-200"
                >
                  {uploadingCover ? 'Đang tải...' : 'Chọn ảnh'}
                </label>
                {formData.eventCoverImageUrl && (
                  <>
                    <img
                      src={formData.eventCoverImageUrl}
                      alt="Cover"
                      className="h-20 w-32 object-cover rounded-lg border border-slate-600"
                    />
                    <button
                      type="button"
                      onClick={handleCoverImageDelete}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-all duration-200 ml-2"
                    >
                      Xóa ảnh
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Địa điểm tổ chức</label>
              <input
                type="text"
                name="eventLocation"
                value={formData.eventLocation}
                onChange={handleInputChange}
                className="w-full p-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Nhập địa điểm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Số tài khoản ngân hàng
              </label>
              <input
                type="text"
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleInputChange}
                className="w-full p-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Nhập số tài khoản"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Thời gian bắt đầu</label>
              <input
                type="datetime-local"
                name="startAt"
                value={formData.startAt}
                onChange={handleInputChange}
                className="w-full p-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Thời gian kết thúc</label>
              <input
                type="datetime-local"
                name="endAt"
                value={formData.endAt}
                onChange={handleInputChange}
                className="w-full p-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-pink-600 text-white px-2 py-1 rounded-full flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    className="ml-1 text-xs"
                    onClick={() => handleTagRemove(idx)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              ref={tagInputRef}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Nhập tag và nhấn Enter"
              className="w-full p-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Danh mục</label>
            <select
              id="categoryId"
              name="categoryIds"
              value={formData.categoryIds[0] || ''}
              onChange={handleCategoryChange}
              required
              className="w-full p-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Chọn danh mục</option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Mô tả sự kiện</label>
            <textarea
              name="eventDescription"
              value={formData.eventDescription}
              onChange={handleInputChange}
              className="w-full p-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 min-h-[120px]"
              placeholder="Nhập mô tả sự kiện"
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Các phần nội dung (section)
              </h3>
              <button
                type="button"
                onClick={handleAddContent}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg transition-all duration-200"
              >
                ➕ Thêm section
              </button>
            </div>
            {contents.map((content, idx) => (
              <div
                key={idx}
                className="p-6 border border-slate-600/50 rounded-xl space-y-4 bg-slate-700/30 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-purple-300">Content #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleContentRemove(idx)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    🗑️ Remove
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Content Type</label>
                  <div className="flex gap-3 flex-wrap">
                    {contentTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleContentTypeChange(idx, option.value as ContentType)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          (content.contentType || getContentType(content)) === option.value
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                            : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 mb-2">
                  <input
                    type="number"
                    min={1}
                    max={MAX_SECTIONS}
                    value={content.position}
                    onChange={(e) => handleContentChange(idx, 'position', Number(e.target.value))}
                    className="w-16 rounded bg-slate-700 border-slate-600 text-white"
                    placeholder="Vị trí"
                  />
                </div>
                {(content.contentType === 'description' ||
                  (!content.contentType && getContentType(content) === 'description') ||
                  content.contentType === 'both' ||
                  (!content.contentType && getContentType(content) === 'both')) && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Description{' '}
                      {content.contentType === 'description' ||
                      (!content.contentType && getContentType(content) === 'description')
                        ? '(required)'
                        : '(optional)'}
                    </label>
                    <input
                      type="text"
                      value={content.description}
                      onChange={(e) => handleContentChange(idx, 'description', e.target.value)}
                      className="w-full p-4 rounded-xl bg-slate-600/50 border border-slate-500 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter content description"
                      required={
                        content.contentType === 'description' ||
                        (!content.contentType && getContentType(content) === 'description')
                      }
                    />
                  </div>
                )}
                {(content.contentType === 'image' ||
                  (!content.contentType && getContentType(content) === 'image') ||
                  content.contentType === 'both' ||
                  (!content.contentType && getContentType(content) === 'both')) && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Upload Image{' '}
                      {content.contentType === 'image' ||
                      (!content.contentType && getContentType(content) === 'image')
                        ? '(required)'
                        : '(optional)'}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        id={`content-image-${idx}`}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) await handleContentImageChange(idx, file);
                        }}
                      />
                      <label
                        htmlFor={`content-image-${idx}`}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-all duration-200"
                      >
                        {uploadingContentImage ? 'Đang tải...' : 'Chọn ảnh'}
                      </label>
                      {content.imageUrl && (
                        <>
                          <img
                            src={content.imageUrl}
                            alt=""
                            className="h-16 w-24 object-cover rounded border border-slate-600"
                          />
                          <button
                            type="button"
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-all duration-200 ml-2"
                            onClick={() => handleContentImageDelete(idx)}
                          >
                            Xóa ảnh
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && <div className="text-red-400 text-center font-semibold">{error}</div>}

          {validationErrors.length > 0 && (
            <div className="bg-red-100 text-red-700 rounded-lg px-4 py-3 mt-6">
              <ul className="list-disc pl-5">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full p-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Đang lưu...</span>
                </div>
              ) : (
                '💾 Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEvent;

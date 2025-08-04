/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createEvent, getAllCategories, uploadImage } from '@/services/Event Manager/event.service';
import { connectEventHub, onEvent } from '@/services/signalr.service';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import Select from 'react-select';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';
import { Category, CreateEventData } from '@/types/event';
import { useNavigate } from 'react-router-dom';
import type { StylesConfig } from 'react-select';
import { useTranslation } from 'react-i18next';

// Định nghĩa type cho EnhancedContent
interface EnhancedContent {
  position: number;
  contentType: "description" | "image";
  description: string;
  imageUrl: string;
}

// Định nghĩa type cho EnhancedCreateEventData
interface EnhancedCreateEventData extends CreateEventData {
  contents: EnhancedContent[];
}

// Validation errors interface
interface ValidationErrors {
  [key: string]: string;
}

const contentTypeOptions = [
  { value: "description", label: "Description Only" },
  { value: "image", label: "Image Only" }
];

// FormField Component với inline error
const FormField: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}> = ({ label, error, children, required = false, className = "" }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <div className="flex items-center space-x-2 text-red-400 text-sm animate-shake">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// InputField Component với error styling
const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { error?: string }> = ({ 
  error, className = "", ...props 
}) => {
  const baseClass = `w-full p-4 rounded-xl bg-slate-700/60 border text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`;
  const errorClass = error ? "border-red-500 focus:ring-red-500" : "border-purple-700";
  
  return (
    <input
      className={`${baseClass} ${errorClass} ${className}`}
      {...props}
    />
  );
};

// Hàm loại bỏ HTML tags và trả về plain text
function stripHtmlTags(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

// Hàm loại bỏ <p></p> và <p><br></p> rỗng ở đầu/cuối hoặc toàn bộ
function cleanHtml(html: string) {
  const cleaned = html
    .replace(/<p><br><\/p>/g, "")
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/^\s+|\s+$/g, "");
  // Nếu chỉ còn lại chuỗi rỗng hoặc toàn dấu cách thì trả về plain text
  const plainText = stripHtmlTags(cleaned);
  return plainText.trim() === "" ? "" : plainText;
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

export default function CreateEventForm() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingContentImage, setUploadingContentImage] = useState<{ [key: number]: boolean }>({});
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [contentErrors, setContentErrors] = useState<{ [key: number]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [formData, setFormData] = useState<EnhancedCreateEventData>({
    eventName: '',
    eventDescription: '',
    eventCoverImageUrl: '',
    eventLocation: '',
    startAt: '',
    endAt: '',
    tags: [],
    categoryIds: [],
    contents: [{ position: 1, contentType: "description", description: "", imageUrl: "" }],
    bankAccount: "",
    bankAccountName: "",
    bankName: "",
  });

  const { quill, quillRef } = useQuill();
  const navigate = useNavigate();

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
    fetchCategories();
    
    // Connect to EventHub and listen for category changes
    connectEventHub();
    onEvent('OnCategoryCreated', () => {
      fetchCategories();
    });
    onEvent('OnCategoryUpdated', () => {
      fetchCategories();
    });
    onEvent('OnCategoryDeleted', () => {
      fetchCategories();
    });
  }, [fetchCategories]);

  useEffect(() => {
    if (quill) {
      quill.root.setAttribute('style', 'background:#27272a;color:#fff;min-height:160px;');
      quill.on('text-change', () => {
        const description = cleanHtml(quill.root.innerHTML);
        setFormData((prev) => ({
          ...prev,
          eventDescription: description,
        }));
      });
    }
  }, [quill]);

  // Validation helpers
  const validateSingleField = (name: string, value: any) => {
    const error = validateField(name, value, formData);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
    return !error;
  };

  const clearError = (fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  // File upload handlers
  const onDropCover = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Chỉ chấp nhận file hình ảnh');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
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
    multiple: false
  });

  const handleContentImageDrop = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      setContentErrors(prev => ({
        ...prev,
        [index]: 'Chỉ chấp nhận file hình ảnh'
      }));
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setContentErrors(prev => ({
        ...prev,
        [index]: 'Kích thước file không được vượt quá 10MB'
      }));
      return;
    }

    setUploadingContentImage(prev => ({ ...prev, [index]: true }));
    setContentErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });

    try {
      const url = await uploadImage(file);
      const newContents = [...formData.contents];
      newContents[index].imageUrl = url;
      setFormData((prev) => ({ ...prev, contents: newContents }));
    } catch {
      setContentErrors(prev => ({
        ...prev,
        [index]: 'Upload hình ảnh thất bại'
      }));
    } finally {
      setUploadingContentImage(prev => ({ ...prev, [index]: false }));
    }
  };

  // Form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      clearError(name);
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    validateSingleField(fieldName, formData[fieldName as keyof EnhancedCreateEventData]);
  };

  const handleCategoriesChange = (selected: { value: string; label: string }[]) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: selected.map((option) => option.value),
    }));
  };

  const handleContentChange = (index: number, field: 'description' | 'imageUrl') => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newContents = [...formData.contents];
      newContents[index] = { ...newContents[index], [field]: e.target.value };
      setFormData((prev) => ({ ...prev, contents: newContents }));
      
      // Clear content error
      if (contentErrors[index]) {
        setContentErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[index];
          return newErrors;
        });
      }
    };

  const handleContentTypeChange = (index: number, contentType: "description" | "image") => {
    const newContents = [...formData.contents];
    newContents[index] = {
      ...newContents[index],
      contentType,
      description: contentType === 'image' ? '' : newContents[index].description,
      imageUrl: contentType === 'description' ? '' : newContents[index].imageUrl,
    };
    setFormData((prev) => ({ ...prev, contents: newContents }));
    
    // Clear content error
    if (contentErrors[index]) {
      setContentErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  const handleRemoveContent = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      contents: prev.contents.filter((_, i) => i !== index).map((content, i) => ({
        ...content,
        position: i + 1
      })),
    }));
    
    // Clear error for removed content
    if (contentErrors[index]) {
      setContentErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  const handleAddContent = () => {
    if (formData.contents.length < 5) {
      setFormData((prev) => ({
        ...prev,
        contents: [
          ...prev.contents,
          { 
            position: prev.contents.length + 1, 
            contentType: "description", 
            description: "", 
            imageUrl: "" 
          },
        ],
      }));
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    const newContentErrors: { [key: number]: string } = {};
    let hasError = false;

    // Validate main form fields
    Object.keys(formData).forEach(key => {
      if (key !== 'contents') {
        const error = validateField(key, (formData as any)[key], formData);
        if (error) {
          newErrors[key] = error;
          hasError = true;
        }
      }
    });

    // Validate categories
    if (formData.categoryIds.length === 0) {
      newErrors['categoryIds'] = 'Vui lòng chọn ít nhất một danh mục';
      hasError = true;
    }

    // Validate contents
    formData.contents.forEach((content, index) => {
      if (content.contentType === "description" && !content.description.trim()) {
        newContentErrors[index] = "Mô tả không được để trống";
        hasError = true;
      } else if (content.contentType === "image" && !content.imageUrl.trim()) {
        newContentErrors[index] = "Hình ảnh không được để trống";
        hasError = true;
      }
    });

    setErrors(newErrors);
    setContentErrors(newContentErrors);
    
    return !hasError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

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

    setLoading(true);
    try {
      const apiData = {
        eventName: formData.eventName,
        eventDescription: cleanHtml(formData.eventDescription),
        eventCoverImageUrl: formData.eventCoverImageUrl,
        eventLocation: formData.eventLocation,
        startAt: formData.startAt,
        endAt: formData.endAt,
        tags: formData.tags,
        categoryIds: formData.categoryIds,
        contents: formData.contents.map((content) => ({
          position: content.position,
          description: content.description,
          imageUrl: content.imageUrl,
        })),
        bankAccount: formData.bankAccount,
        bankAccountName: formData.bankAccountName,
        bankName: formData.bankName,
      };
      
      await createEvent(apiData);
      navigate('/event-manager/pending-events');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Tạo sự kiện thất bại';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectStyles: StylesConfig = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: '#27272a',
      borderColor: state.isFocused ? '#a21caf' : (errors.categoryIds ? '#ef4444' : '#3f3f46'),
      color: '#ffffff',
      borderRadius: 12,
      minHeight: 48,
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#a21caf',
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#18181b',
      border: '1px solid #a21caf',
      zIndex: 9999,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#a21caf' : '#18181b',
      color: '#fff',
      '&:hover': {
        backgroundColor: '#a21caf',
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
      color: '#fff',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#a3a3a3',
    }),
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-0 m-0">
      <style>
        {`
        .ql-toolbar {
          background: #18181b !important;
          border-radius: 0.75rem 0.75rem 0 0 !important;
          border-color: #a21caf !important;
        }
        .ql-container {
          background: #27272a !important;
          color: #fff !important;
          border-radius: 0 0 0.75rem 0.75rem !important;
          border-color: #a21caf !important;
          min-height: 160px;
        }
        .ql-editor {
          color: #fff !important;
        }
        .ql-picker {
          color: #fff !important;
        }
        .ql-picker-options {
          background: #27272a !important;
          color: #fff !important;
          border: 1px solid #a21caf !important;
          z-index: 9999 !important;
        }
        .ql-picker-item {
          color: #fff !important;
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
            onClick={() => navigate('/event-manager')}
            className="bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t('backToDashboard')}</span>
          </button>
        </div>
        
        {/* Main Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-8 bg-slate-800/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-purple-700/40 w-full max-w-[1200px] mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 drop-shadow">
              {t('createNewEvent')}
            </h2>
            <p className="text-slate-400 text-lg">{t('fillEventDetails')}</p>
          </div>

          {/* Basic Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FormField label={t('eventName')} error={errors.eventName} required>
              <InputField
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                onBlur={() => handleBlur('eventName')}
                placeholder={t('enterEventName')}
                error={errors.eventName}
              />
            </FormField>

            <FormField label={t('coverImage')}>
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
                    <p className="text-slate-400">{t('uploadingCover')}</p>
                  </div>
                ) : formData.eventCoverImageUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={formData.eventCoverImageUrl}
                      alt="Cover"
                      className="h-full w-full object-cover rounded-xl"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-lg text-xs flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Uploaded
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-5xl mb-3">📷</div>
                    <p className="text-slate-400 mb-1">
                      {isCoverDragActive ? t('dropImageHere') : t('clickOrDragImage')}
                    </p>
                    <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
            </FormField>

            <FormField label={t('location')} error={errors.eventLocation}>
              <InputField
                type="text"
                name="eventLocation"
                value={formData.eventLocation}
                onChange={handleChange}
                onBlur={() => handleBlur('eventLocation')}
                placeholder={t('enterEventLocation')}
                error={errors.eventLocation}
              />
            </FormField>

            <FormField label={t('startTime')} error={errors.startAt} required>
              <InputField
                type="datetime-local"
                name="startAt"
                value={formData.startAt}
                onChange={handleChange}
                onBlur={() => handleBlur('startAt')}
                error={errors.startAt}
              />
            </FormField>

            <FormField label={t('endTime')} error={errors.endAt} required>
              <InputField
                type="datetime-local"
                name="endAt"
                value={formData.endAt}
                onChange={handleChange}
                onBlur={() => handleBlur('endAt')}
                error={errors.endAt}
              />
            </FormField>

            <FormField label={t('selectCategories')} error={errors.categoryIds} required>
              <Select
                isMulti
                options={categoryOptions}
                onChange={handleCategoriesChange}
                isLoading={loadingCategories}
                styles={selectStyles}
                placeholder={t('selectCategories')}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </FormField>
          </div>

          {/* Bank Information Section */}
          <div className="bg-slate-700/30 p-6 rounded-2xl border border-slate-600/50">
            <h3 className="text-xl font-semibold text-purple-300 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Thông tin ngân hàng (Tùy chọn)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label={t('bankAccount')} error={errors.bankAccount}>
                <InputField
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleChange}
                  onBlur={() => handleBlur('bankAccount')}
                  placeholder={t('enterBankAccount')}
                  error={errors.bankAccount}
                />
              </FormField>

              <FormField label={t('bankAccountName')} error={errors.bankAccountName}>
                <InputField
                  type="text"
                  name="bankAccountName"
                  value={formData.bankAccountName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('bankAccountName')}
                  placeholder={t('enterBankAccountName')}
                  error={errors.bankAccountName}
                />
              </FormField>

              <FormField label={t('bankName')} error={errors.bankName}>
                <InputField
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('bankName')}
                  placeholder={t('enterBankName')}
                  error={errors.bankName}
                />
              </FormField>
            </div>
          </div>

          {/* Tags */}
          <FormField label={t('tags')}>
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
              placeholder={t('eGGameWorkshopOffline')}
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
            <p className="text-xs text-slate-400 mt-1">{t('separateTagsWithCommas')}</p>
          </FormField>

          {/* Event Description */}
          <FormField label={t('eventDescription')}>
            <div className="rounded-xl border border-purple-700 bg-[#27272a] overflow-hidden">
              <div ref={quillRef} style={{ minHeight: 160, color: '#fff' }} />
            </div>
          </FormField>

          {/* Event Contents Section */}
          <div className="bg-slate-700/30 p-6 rounded-2xl border border-slate-600/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center">
                <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {t('eventContents')}
              </h3>
              <Button
                type="button"
                onClick={handleAddContent}
                disabled={formData.contents.length >= 5}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{t('addContent')}</span>
              </Button>
            </div>
            
            {formData.contents.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg">{t('noContentSectionsYet')}</p>
                <p className="text-sm">Thêm nội dung để làm phong phú thêm sự kiện của bạn</p>
              </div>
            )}
            
            <div className="space-y-6">
              {formData.contents.map((content, index) => (
                <div
                  key={index}
                  className="relative p-6 border border-purple-700/40 rounded-xl bg-slate-800/60 backdrop-blur-sm shadow-lg"
                >
                  {/* Content Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="text-lg font-medium text-purple-300">
                        {t('content')} {index + 1}
                      </span>
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleRemoveContent(index)}
                      className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>{t('remove')}</span>
                    </Button>
                  </div>
                  
                  {/* Content Type Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-3">{t('contentType')}</label>
                    <div className="flex gap-3">
                      {contentTypeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleContentTypeChange(index, option.value as "description" | "image")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                            content.contentType === option.value
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
                              : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600 hover:scale-105'
                          }`}
                        >
                          {option.value === 'description' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Content Input */}
                  {content.contentType === "description" && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">
                        {t('descriptionRequired')} <span className="text-red-400">*</span>
                      </label>
                      <InputField
                        type="text"
                        value={content.description}
                        onChange={handleContentChange(index, "description")}
                        placeholder={t('enterContentDescription')}
                        error={contentErrors[index]}
                      />
                      {contentErrors[index] && (
                        <div className="flex items-center space-x-2 text-red-400 text-sm animate-shake">
                          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{contentErrors[index]}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {content.contentType === "image" && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-300">
                        {t('uploadImageRequired')} <span className="text-red-400">*</span>
                      </label>
                      
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files?.[0] && handleContentImageDrop(index, e.target.files[0])
                          }
                          className={`w-full p-4 rounded-xl bg-slate-600/50 border text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 transition-all duration-200 ${
                            contentErrors[index] ? 'border-red-500' : 'border-purple-700'
                          }`}
                        />
                        
                        {uploadingContentImage[index] && (
                          <div className="absolute inset-0 bg-slate-800/80 rounded-xl flex items-center justify-center">
                            <div className="flex items-center space-x-3">
                              <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                              <p className="text-sm text-slate-300">{t('uploadingImage')}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {contentErrors[index] && (
                        <div className="flex items-center space-x-2 text-red-400 text-sm animate-shake">
                          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{contentErrors[index]}</span>
                        </div>
                      )}
                      
                      {content.imageUrl && !uploadingContentImage[index] && (
                        <div className="mt-4">
                          <img
                            src={content.imageUrl}
                            alt={`content-${index}`}
                            className="h-48 w-full object-cover rounded-xl border border-purple-700 shadow-lg"
                          />
                          <div className="flex items-center justify-center mt-3">
                            <div className="flex items-center space-x-2 text-green-400 text-sm bg-green-400/10 px-3 py-2 rounded-lg">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="w-full p-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>{t('creatingEvent')}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{t('createEvent')}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
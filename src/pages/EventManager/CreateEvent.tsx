/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createEvent, getAllCategories, uploadImage } from '@/services/Event Manager/event.service';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import Select from 'react-select';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';
import { Category, CreateEventData } from '@/types/event';

interface EnhancedContent {
  position: number;
  contentType: 'description' | 'image' | 'both';
  description: string;
  imageUrl: string;
}

interface EnhancedCreateEventData extends Omit<CreateEventData, 'contents'> {
  contents: EnhancedContent[];
}

const contentTypeOptions = [
  { value: 'description', label: 'Description Only' },
  { value: 'image', label: 'Image Only' },
  { value: 'both', label: 'Both' },
];

// Hàm loại bỏ <p></p> và <p><br></p> rỗng ở đầu/cuối hoặc toàn bộ
function cleanHtml(html: string) {
  const cleaned = html
    .replace(/<p><br><\/p>/g, '')
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/^\s+|\s+$/g, '');
  // Nếu chỉ còn lại chuỗi rỗng hoặc toàn dấu cách thì trả về ""
  return cleaned.trim() === '' ? '' : cleaned;
}

export default function CreateEventForm() {
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingContentImage, setUploadingContentImage] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState<EnhancedCreateEventData>({
    eventName: '',
    eventDescription: '',
    eventCoverImageUrl: '',
    eventLocation: '',
    startAt: '',
    endAt: '',
    tags: [],
    categoryIds: [],
    contents: [{ position: 1, contentType: 'both', description: '', imageUrl: '' }],
    bankAccount: '',
  });

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
    } catch (err) {
      setCategoryOptions([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (quill) {
      quill.root.setAttribute('style', 'background:#27272a;color:#fff;min-height:160px;');
      quill.on('text-change', () => {
        setFormData((prev) => ({
          ...prev,
          eventDescription: cleanHtml(quill.root.innerHTML),
        }));
      });
    }
  }, [quill]);

  const onDropCover = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setUploadingCover(true);
    try {
      const url = await uploadImage(file);
      setFormData((prev) => ({
        ...prev,
        eventCoverImageUrl: url,
      }));
    } catch (err) {
      alert('Upload cover image failed.');
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
  });

  const handleContentImageDrop = async (index: number, file: File) => {
    setUploadingContentImage(true);
    try {
      const url = await uploadImage(file);
      const newContents = [...formData.contents];
      newContents[index].imageUrl = url;
      setFormData((prev) => ({ ...prev, contents: newContents }));
    } catch (err) {
      alert('Upload content image failed.');
    } finally {
      setUploadingContentImage(false);
    }
  };

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
      const newContents = [...formData.contents];
      newContents[index] = { ...newContents[index], [field]: e.target.value };
      setFormData((prev) => ({ ...prev, contents: newContents }));
    };

  const handleContentTypeChange = (
    index: number,
    contentType: 'description' | 'image' | 'both'
  ) => {
    const newContents = [...formData.contents];
    newContents[index] = {
      ...newContents[index],
      contentType,
      description: contentType === 'image' ? '' : newContents[index].description,
      imageUrl: contentType === 'description' ? '' : newContents[index].imageUrl,
    };
    setFormData((prev) => ({ ...prev, contents: newContents }));
  };

  const handleRemoveContent = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      contents: prev.contents.filter((_, i) => i !== index),
    }));
  };

  const handleAddContent = () => {
    if (formData.contents.length < 5) {
      setFormData((prev) => ({
        ...prev,
        contents: [
          ...prev.contents,
          {
            position: prev.contents.length + 1,
            contentType: 'both',
            description: '',
            imageUrl: '',
          },
        ],
      }));
    } else {
      alert('Maximum 5 sections allowed.');
    }
  };

  const validateContents = (contents: EnhancedContent[]) => {
    const positions = contents.map((content) => content.position);
    const uniquePositions = new Set(positions);

    if (
      contents.length > 5 ||
      uniquePositions.size !== contents.length ||
      positions.some((pos) => pos < 1 || pos > 5)
    ) {
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateContents(formData.contents)) {
      alert(
        'Invalid event contents. Maximum 5 sections allowed and positions must be unique between 1-5.'
      );
      return;
    }

    setLoading(true);
    try {
      const apiData: CreateEventData = {
        ...formData,
        eventDescription: cleanHtml(formData.eventDescription),
        contents: formData.contents.map((content) => ({
          position: content.position,
          description: content.description,
          imageUrl: content.imageUrl,
        })),
      };
      await createEvent(apiData);
      alert('Event created successfully!');
    } catch (error) {
      alert('Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  const selectStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: '#27272a',
      borderColor: '#3f3f46',
      color: '#ffffff',
      borderRadius: 12,
      minHeight: 48,
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#a21caf',
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: '#18181b',
      border: '1px solid #a21caf',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#a21caf' : '#18181b',
      color: '#fff',
      '&:hover': {
        backgroundColor: '#a21caf',
      },
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: '#a21caf',
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: '#fff',
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: '#fff',
      '&:hover': {
        backgroundColor: '#ef4444',
        color: '#fff',
      },
    }),
    input: (provided: any) => ({
      ...provided,
      color: '#fff',
    }),
    placeholder: (provided: any) => ({
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
        `}
      </style>
      <div className="w-full h-full p-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-8 bg-slate-800/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-purple-700/40 w-full max-w-[1100px] mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 drop-shadow">
              Create New Event
            </h2>
            <p className="text-slate-400">Fill in the details below to create your event</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Event Name</label>
              <input
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-slate-700/60 border border-purple-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter event name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Cover Image</label>
              <div
                {...getCoverRootProps()}
                className="w-full h-40 flex items-center justify-center bg-slate-700/30 border-2 border-dashed border-purple-400/50 rounded-xl cursor-pointer hover:border-purple-400 transition-all duration-200 overflow-hidden"
              >
                <input {...getCoverInputProps()} />
                {uploadingCover ? (
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-slate-400">Uploading...</p>
                  </div>
                ) : formData.eventCoverImageUrl ? (
                  <img
                    src={formData.eventCoverImageUrl}
                    alt="Cover"
                    className="h-full w-full object-cover rounded-xl border border-purple-700"
                  />
                ) : isCoverDragActive ? (
                  <p className="text-purple-400">Drop the image here...</p>
                ) : (
                  <div className="text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-slate-400">Click or drag image here</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Location</label>
              <input
                type="text"
                name="eventLocation"
                value={formData.eventLocation}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-slate-700/60 border border-purple-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter event location"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Bank Account</label>
              <input
                type="text"
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-slate-700/60 border border-purple-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter bank account"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Start Time</label>
              <input
                type="datetime-local"
                name="startAt"
                value={formData.startAt}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-slate-700/60 border border-purple-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">End Time</label>
              <input
                type="datetime-local"
                name="endAt"
                value={formData.endAt}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-slate-700/60 border border-purple-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Tags</label>
            <input
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
              placeholder="e.g. game, workshop, offline"
              className="w-full p-4 rounded-xl bg-slate-700/60 border border-purple-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
            <p className="text-xs text-slate-400">Separate tags with commas</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Categories</label>
            <Select
              isMulti
              options={categoryOptions}
              onChange={handleCategoriesChange}
              isLoading={loadingCategories}
              styles={selectStyles}
              placeholder="Select categories..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Event Description</label>
            <div className="rounded-xl border border-purple-700 bg-[#27272a] p-2">
              <div ref={quillRef} style={{ minHeight: 160, color: '#fff' }} />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Event Contents
            </h3>
            {formData.contents.map((content, index) => (
              <div
                key={index}
                className="p-6 border border-purple-700/40 rounded-xl space-y-4 bg-slate-700/40 backdrop-blur-sm mb-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-purple-300">Content {index + 1}</span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveContent(index)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    Remove
                  </Button>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Content Type</label>
                  <div className="flex gap-3 flex-wrap">
                    {contentTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          handleContentTypeChange(
                            index,
                            option.value as 'description' | 'image' | 'both'
                          )
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          content.contentType === option.value
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                            : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                {(content.contentType === 'description' || content.contentType === 'both') && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Description{' '}
                      {content.contentType === 'description' ? '(required)' : '(optional)'}
                    </label>
                    <input
                      type="text"
                      value={content.description}
                      onChange={handleContentChange(index, 'description')}
                      className="w-full p-4 rounded-xl bg-slate-600/50 border border-purple-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500
                      focus:border-transparent transition-all duration-200"
                      placeholder="Enter content description"
                      required={content.contentType === 'description'}
                    />
                  </div>
                )}
                {(content.contentType === 'image' || content.contentType === 'both') && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Upload Image {content.contentType === 'image' ? '(required)' : '(optional)'}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] && handleContentImageDrop(index, e.target.files[0])
                      }
                      className="w-full p-3 rounded-xl bg-slate-600/50 border border-purple-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 transition-all duration-200"
                      required={content.contentType === 'image' && !content.imageUrl}
                    />
                    {uploadingContentImage && (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                        <p className="text-sm text-slate-400">Uploading image...</p>
                      </div>
                    )}
                    {content.imageUrl && !uploadingContentImage && (
                      <img
                        src={content.imageUrl}
                        alt={`content-${index}`}
                        className="mt-3 h-40 w-full object-cover rounded-xl border border-purple-700"
                      />
                    )}
                  </div>
                )}
                {/* Nút Add Content chỉ hiện ở section cuối */}
                {index === formData.contents.length - 1 && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleAddContent}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg transition-all duration-200"
                    >
                      Add Content
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="w-full p-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Creating Event...</span>
                </div>
              ) : (
                ' Create Event'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

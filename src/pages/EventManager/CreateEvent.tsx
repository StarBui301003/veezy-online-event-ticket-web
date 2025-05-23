'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createEvent, getAllCategories } from '@/services/Event Manager/event.service';
import { uploadImage } from '@/services/Event Manager/event.service';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import Select from 'react-select';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';
import { Category, CreateEventData } from '@/types/event';

export default function CreateEventForm() {
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingContentImage, setUploadingContentImage] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [contentType, setContentType] = useState<'text' | 'image' | ''>('');
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
    contents: [
      {
        position: 0,
        description: '',
        imageUrl: '',
      },
    ],
    bankAccount: '',
  });

  const { quill, quillRef } = useQuill();

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const categories: Category[] = await getAllCategories();
      if (!Array.isArray(categories)) {
        throw new Error('Expected an array of categories');
      }
      setCategoryOptions(
        categories.map((cat) => ({
          value: cat.categoryId,
          label: cat.categoryName,
        }))
      );
    } catch (err) {
      console.error('Failed to fetch categories', err);
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
      quill.on('text-change', () => {
        setFormData((prev) => ({
          ...prev,
          eventDescription: quill.root.innerHTML,
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
      console.error('Cover image upload failed', err);
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
      console.error('Content image upload failed', err);
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
      newContents[index] = {
        ...newContents[index],
        [field]: e.target.value,
      };
      setFormData((prev) => ({
        ...prev,
        contents: newContents,
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createEvent(formData);
      alert('Event created successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-zinc-950 text-white p-0 overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 p-4 shadow-xl w-full h-full">
        <h2 className="text-2xl font-bold mb-4">Create New Event</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm">Event Name</label>
            <input
              type="text"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
              className="w-full p-3 rounded bg-zinc-800 text-white"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Cover Image (Drag here)</label>
            <div
              {...getCoverRootProps()}
              className="w-full h-32 flex items-center justify-center bg-zinc-800 border-2 border-dashed rounded cursor-pointer"
            >
              <input {...getCoverInputProps()} />
              {uploadingCover ? (
                <p>Uploading cover image...</p>
              ) : formData.eventCoverImageUrl ? (
                <img
                  src={formData.eventCoverImageUrl}
                  alt="Cover"
                  className="h-full object-cover"
                />
              ) : isCoverDragActive ? (
                <p>Drop the image here...</p>
              ) : (
                <p>Click or drag image here</p>
              )}
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm">Location</label>
            <input
              type="text"
              name="eventLocation"
              value={formData.eventLocation}
              onChange={handleChange}
              className="w-full p-3 rounded bg-zinc-800 text-white"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Bank Account</label>
            <input
              type="text"
              name="bankAccount"
              value={formData.bankAccount}
              onChange={handleChange}
              className="w-full p-3 rounded bg-zinc-800 text-white"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Start Time</label>
            <input
              type="datetime-local"
              name="startAt"
              value={formData.startAt}
              onChange={handleChange}
              className="w-full p-3 rounded bg-zinc-800 text-white"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">End Time</label>
            <input
              type="datetime-local"
              name="endAt"
              value={formData.endAt}
              onChange={handleChange}
              className="w-full p-3 rounded bg-zinc-800 text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm">Tags (comma-separated)</label>
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

              setFormData((prev) => ({
                ...prev,
                tags,
              }));
            }}
            placeholder="e.g. game, workshop, offline"
            className="w-full p-3 rounded bg-zinc-800 text-white"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Categories</label>
          <Select
            isMulti
            options={categoryOptions}
            onChange={handleCategoriesChange}
            isLoading={loadingCategories}
            className="text-black"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Event Description</label>
          <div ref={quillRef} className="bg-white text-black rounded" />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold">Select Content Type</label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="contentType"
                value="text"
                checked={contentType === 'text'}
                onChange={() => {
                  setContentType('text');
                  setFormData((prev) => ({
                    ...prev,
                    contents: [
                      {
                        position: 1,
                        description: '',
                        imageUrl: '',
                      },
                    ],
                  }));
                }}
              />
              <span>Content Description</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="contentType"
                value="image"
                checked={contentType === 'image'}
                onChange={() => {
                  setContentType('image');
                  setFormData((prev) => ({
                    ...prev,
                    contents: [
                      {
                        position: 1,
                        description: '',
                        imageUrl: '',
                      },
                    ],
                  }));
                }}
              />
              <span>Image</span>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-lg font-semibold">Event Contents</p>

          {contentType === '' && <p className="text-red-500">Please select a content type.</p>}

          {contentType === 'text' && (
            <>
              {formData.contents.map((content, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm">Content Description</label>
                    <input
                      type="text"
                      value={content.description}
                      onChange={handleContentChange(index, 'description')}
                      className="w-full p-3 rounded bg-zinc-800 text-white"
                    />
                  </div>
                </div>
              ))}
              {formData.contents.length < 5 && (
                <Button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      contents: [
                        ...prev.contents,
                        {
                          position: prev.contents.length + 1,
                          description: '',
                          imageUrl: '',
                        },
                      ],
                    }))
                  }
                  className="bg-green-600 hover:bg-green-500"
                >
                  + Add More Text
                </Button>
              )}
            </>
          )}

          {contentType === 'image' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block mb-1 text-sm">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && handleContentImageDrop(0, e.target.files[0])
                  }
                  className="w-full p-2 rounded bg-zinc-800 text-white"
                />
                {uploadingContentImage ? (
                  <p className="text-sm text-gray-400">Uploading...</p>
                ) : (
                  formData.contents[0].imageUrl && (
                    <img
                      src={formData.contents[0].imageUrl}
                      alt="content-0"
                      className="mt-2 h-32 object-cover rounded"
                    />
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="bg-pink-600 hover:bg-pink-500 w-full text-white font-semibold py-3"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Event'}
        </Button>
      </form>
    </div>
  );
}

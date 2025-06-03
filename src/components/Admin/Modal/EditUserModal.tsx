import { useState, ChangeEvent, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { User } from '@/types/auth';
import { editUserAPI, uploadUserAvatarAPI } from '@/services/Admin/user.service';
import { getAllCategory } from '@/services/Admin/event.service';
import { Category } from '@/types/event';

interface Props {
  user: User;
  onClose: () => void;
  onUpdated?: (user: User) => void;
}

export const EditUserModal = ({ user, onClose, onUpdated }: Props) => {
  const [form, setForm] = useState<User>({ ...user });
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(user.avatarUrl || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAllCategory().then(setAllCategories);
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEdit = async () => {
    setLoading(true);
    try {
      await editUserAPI(form.userId, {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        location: form.location,
        dob: form.dob,
        gender: form.gender,
        categories: form.categories?.map((c) => ({
          categoryId: c.categoryId,
          categoryName: c.categoryName,
          categoryDescription: c.categoryDescription,
        })) || [],
      });
      if (avatarFile instanceof File) {
        await uploadUserAvatarAPI(form.userId, avatarFile);
      }
      if (onUpdated) onUpdated(form);
      onClose();
      setAvatarFile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="border-b-2 border-gray-400 pb-4 p-4">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto p-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full border bg-gray-100 flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="avatar" className="object-cover w-full h-full" />
              ) : (
                <span className="text-gray-400">No Avatar</span>
              )}
            </div>
            <input
              id="edit-avatar-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              className="mt-2 px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 text-sm"
              onClick={() => document.getElementById('edit-avatar-input')?.click()}
              tabIndex={-1}
            >
              Edit Avatar
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input
              name="fullName"
              className="border rounded px-2 py-1 w-full"
              value={form.fullName}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              name="email"
              className="border rounded px-2 py-1 w-full"
              value={form.email}
              onChange={handleInputChange}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input
              name="phone"
              className="border rounded px-2 py-1 w-full"
              value={form.phone}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Gender</label>
            <select
              name="gender"
              className="border rounded px-2 py-1 w-full"
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: Number(e.target.value) }))}
            >
              <option value={0}>Male</option>
              <option value={1}>Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Date of Birth</label>
            <input
              name="dob"
              type="date"
              className="border rounded px-2 py-1 w-full"
              value={form.dob ? form.dob.slice(0, 10) : ''}
              onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Hobbies</label>
            <div className="flex flex-wrap gap-3 py-2">
              {allCategories.map((cat) => {
                const checked = !!form.categories?.some((c) => c.categoryId === cat.categoryId);
                return (
                  <label key={cat.categoryId} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setForm((prev) => ({
                          ...prev,
                          categories: checked
                            ? prev.categories.filter((c) => c.categoryId !== cat.categoryId)
                            : [...(prev.categories || []), cat],
                        }));
                      }}
                    />
                    <span>{cat.categoryName}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <div className="p-4 border-t-2 border-gray-400">
          <DialogFooter>
            <button
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 mr-2"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              onClick={handleEdit}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Edit'}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default EditUserModal;

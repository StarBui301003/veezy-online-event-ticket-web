/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, ChangeEvent } from 'react';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { getUserByIdAPI, editUserAPI, uploadUserAvatarAPI } from '@/services/Admin/user.service';
import { getAllCategory } from '@/services/Admin/event.service';
import type { Category } from '@/types/event';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

const ProfilePage = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [editMode, setEditMode] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    // Lấy userId từ localStorage
    const accStr = localStorage.getItem('account');
    let userId = '';
    if (accStr) {
      try {
        const accObj = JSON.parse(accStr);
        userId = accObj.userId;
      } catch {
        /* empty */
      }
    }
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getUserByIdAPI(userId), getAllCategory()])
      .then(([user, categories]) => {
        setAccount(user);
        setForm({
          ...user,
          categories: user.categories || [],
        });
        setAllCategories(categories);
        setPreviewUrl(user.avatar || user.avatarUrl || '');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({
      ...prev,
      [name]: name === 'gender' ? Number(value) : value, // Ép kiểu gender về number
    }));
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCategoryCheckbox = (cat: Category) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checked = !!form.categories?.some((c: any) => c.categoryId === cat.categoryId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setForm((prev: any) => ({
      ...prev,
      categories: checked
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prev.categories.filter((c: any) => c.categoryId !== cat.categoryId)
        : [...(prev.categories || []), cat],
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let avatarUrl = form.avatar || form.avatarUrl;
      if (avatarFile instanceof File) {
        const res = await uploadUserAvatarAPI(form.userId, avatarFile);
        avatarUrl = res.data?.avatarUrl || avatarUrl;
        // Ghi đè lên trường avatar trong localStorage
        const accStr = localStorage.getItem('account');
        if (accStr) {
          const acc = JSON.parse(accStr);
          acc.avatar = avatarUrl;
          localStorage.setItem('account', JSON.stringify(acc));
        }
      }
      await editUserAPI(form.userId, {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        location: form.location,
        dob: form.dob,
        gender: Number(form.gender),
        categories:
          form.categories?.map((c: any) => ({
            categoryId: c.categoryId,
            categoryName: c.categoryName,
            categoryDescription: c.categoryDescription,
          })) || [],
      });
      // Lấy lại thông tin user mới nhất từ backend và ghi đè trường avatar
      const updatedUser = await getUserByIdAPI(form.userId);
      if (updatedUser) {
        const accStr = localStorage.getItem('account');
        let acc: any = {};
        if (accStr) {
          acc = JSON.parse(accStr);
        }
        const newAccount = {
          ...acc,
          ...updatedUser,
          avatar: updatedUser.avatar, // luôn ghi đè avatar
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          username: updatedUser.username || acc.username,
        };
        localStorage.setItem('account', JSON.stringify(newAccount));
      }
      setAccount({ ...form, avatar: avatarUrl });
      setEditMode(false);
      setAvatarFile(null);
      window.dispatchEvent(new Event('user-updated'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <SpinnerOverlay show={true} />
      </div>
    );
  }

  if (!account) return null;

  // Lấy danh sách category của user (nếu cần lấy thông tin chi tiết từ allCategories)
  const userCategories = allCategories.filter((cat) =>
    (editMode ? form.categories : account.categories)?.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => c.categoryId === cat.categoryId
    )
  );

  return (
    <div className="p-6">
      <SpinnerOverlay show={loading} />
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow max-w-lg mx-auto">
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="w-24 h-24 rounded-full border-4 border-blue-400 bg-gray-100 flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="avatar" className="object-cover w-full h-full" />
              ) : (
                <span className="text-gray-400 text-3xl">
                  {(editMode ? form.fullName : account.fullName)?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            {editMode && (
              <>
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
                >
                  Edit Avatar
                </button>
              </>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Full Name</label>
              {editMode ? (
                <Input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleInputChange}
                  className="border border-gray-200 rounded px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300"
                />
              ) : (
                <div className="border rounded px-2 py-1 w-full bg-gray-50">{account.fullName}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              {editMode ? (
                <Input
                  name="email"
                  value={form.email}
                  disabled
                  className="border border-gray-200 rounded px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300"
                />
              ) : (
                <div className="border rounded px-2 py-1 w-full bg-gray-50">{account.email}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Phone</label>
              {editMode ? (
                <Input
                  name="phone"
                  value={form.phone}
                  onChange={handleInputChange}
                  className="border border-gray-200 rounded px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300"
                />
              ) : (
                <div className="border rounded px-2 py-1 w-full bg-gray-50">{account.phone}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Gender</label>
              {editMode ? (
                <Select
                  value={String(form.gender)}
                  onValueChange={(val) =>
                    setForm((prev: any) => ({ ...prev, gender: Number(val) }))
                  }
                >
                  <SelectTrigger className="border border-gray-200 rounded px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Male</SelectItem>
                    <SelectItem value="1">Female</SelectItem>
                    <SelectItem value="2">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="border rounded px-2 py-1 w-full bg-gray-50">
                  {account.gender === 0 ? 'Male' : account.gender === 1 ? 'Female' : 'Other'}
                </div>
              )}
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-600">Date of Birth</label>
              {editMode ? (
                <input
                  type="date"
                  name="dob"
                  className="border rounded px-2 py-1 w-full"
                  value={form.dob ? form.dob.slice(0, 10) : ''}
                  onChange={handleInputChange}
                />
              ) : (
                <div className="border rounded px-2 py-1 w-full bg-gray-50">
                  {account.dob ? account.dob.slice(0, 10) : ''}
                </div>
              )}
            </div> */}

            <div>
              <label className="block text-sm font-medium text-gray-600">Hobbies</label>
              {editMode ? (
                <div className="flex flex-wrap gap-3 py-2">
                  {allCategories.map((cat) => {
                    const checked = !!form.categories?.some(
                      (c: any) => c.categoryId === cat.categoryId
                    );
                    return (
                      <label
                        key={cat.categoryId}
                        className={`flex items-center gap-2 px-3 py-1 rounded-lg cursor-pointer border transition
                          ${
                            checked
                              ? 'bg-blue-100 border-blue-400 text-blue-700 font-semibold shadow'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleCategoryCheckbox(cat)}
                          className="accent-blue-500 w-4 h-4 rounded border border-gray-300"
                        />
                        <span>{cat.categoryName}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 border border-gray-200 rounded px-2 py-2 w-full bg-gray-50 min-h-[36px]">
                  {userCategories.length > 0 ? (
                    userCategories.map((cat) => (
                      <span
                        key={cat.categoryId}
                        className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-100 to-pink-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold shadow border border-blue-200"
                      >
                        <svg
                          className="w-3 h-3 text-blue-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <circle cx="10" cy="10" r="10" />
                        </svg>
                        {cat.categoryName}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            {editMode ? (
              <>
                <button
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                  onClick={() => {
                    setEditMode(false);
                    setForm(account);
                    setPreviewUrl(account.avatar || '');
                    setAvatarFile(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
                  onClick={handleSave}
                  disabled={loading}
                >
                  Save
                </button>
              </>
            ) : (
              <button
                className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
                onClick={() => setEditMode(true)}
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

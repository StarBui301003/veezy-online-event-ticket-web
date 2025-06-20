/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, ChangeEvent } from 'react';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { getUserByIdAPI, editUserAPI, uploadUserAvatarAPI } from '@/services/User/user.service';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { NO_AVATAR } from '@/assets/img';

const ProfilePage = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
    getUserByIdAPI(userId)
      .then((user) => {
        setAccount(user);
        setForm({
          ...user,
        });
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
          avatar: updatedUser.avatar,
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

  return (
    <div className="p-6 flex justify-center">
      <SpinnerOverlay show={loading} />
      <div className="w-full max-w-2xl">
        <div className="p-6 bg-white rounded-xl shadow-lg mx-auto">
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="w-28 h-28 rounded-full border-4 border-blue-400 bg-gray-100 flex items-center justify-center overflow-hidden shadow">
              {previewUrl ? (
                <img src={previewUrl} alt="avatar" className="object-cover w-full h-full" />
              ) : (
                <img src={NO_AVATAR} alt="no avatar" className="object-cover w-full h-full" />
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
                  className="mt-2 w-[100px] h-[45px] rounded-[8px] bg-[#f3f7fe] text-[#3b82f6] border-none cursor-pointer font-medium text-base transition duration-300 hover:bg-[#3b82f6] hover:text-white hover:shadow-[0_0_0_5px_#3b83f65f]"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('edit-avatar-input')?.click();
                  }}
                >
                  Edit Avatar
                </button>
              </>
            )}
          </div>
          <div className="space-y-4">
            {/* Responsive 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                {editMode ? (
                  <Input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleInputChange}
                    className="border border-gray-200 rounded px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300"
                  />
                ) : (
                  <div className="border rounded px-2 py-1 w-full bg-gray-50">
                    {account.fullName}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
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
                <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
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
                <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                {editMode ? (
                  <Select
                    value={String(form.gender)}
                    onValueChange={(val) =>
                      setForm((prev: any) => ({ ...prev, gender: Number(val) }))
                    }
                  >
                    <SelectTrigger className="border border-gray-200 rounded px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300 bg-white">
                      <SelectValue placeholder="Select gender" />
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
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-8">
            {editMode ? (
              <>
                <button
                  className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
                  onClick={() => {
                    setEditMode(false);
                    setForm(account);
                    setAvatarFile(null);
                    setPreviewUrl(account.avatar || account.avatarUrl || '');
                  }}
                  disabled={loading}
                  type="button"
                >
                  <span>Cancel</span>
                </button>
                <button
                  className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
                  onClick={handleSave}
                  disabled={loading}
                  type="button"
                >
                  <span>Save</span>
                </button>
              </>
            ) : (
              <button
                className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
                onClick={() => setEditMode(true)}
                type="button"
              >
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

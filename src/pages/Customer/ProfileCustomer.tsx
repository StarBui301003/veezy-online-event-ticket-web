/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { getUserByIdAPI, editUserAPI, uploadUserAvatarAPI } from '@/services/Admin/user.service';
import { NO_AVATAR } from '@/assets/img';

const ProfileCustomer = () => {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
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
        setForm({ ...user });
        setPreviewUrl(user.avatar || user.avatarUrl || '');
      })
      .catch(() => {
        setAccount(null);
        setForm(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({
      ...prev,
      [name]: name === 'gender' ? Number(value) : value,
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
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <SpinnerOverlay show={true} />
      </div>
    );
  }

  if (!account) return null;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-0 m-0 flex items-center justify-center">
      <div className="w-full max-w-[600px] bg-slate-800/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-purple-700/40">
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-full border-4 border-purple-400 bg-gray-100 flex items-center justify-center overflow-hidden shadow mb-4">
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
              <Button
                type="button"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg transition-all duration-200"
                onClick={() => document.getElementById('edit-avatar-input')?.click()}
              >
                Edit Avatar
              </Button>
            </>
          )}
        </div>
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Full Name</label>
            <Input
              name="fullName"
              value={form.fullName}
              onChange={handleInputChange}
              disabled={!editMode}
              className="w-full p-4 rounded-xl bg-slate-700/60 border border-purple-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Email</label>
            <Input
              name="email"
              value={form.email}
              disabled
              className="w-full p-4 rounded-xl bg-slate-700/60 border border-purple-700 text-white placeholder-slate-400"
              placeholder="Email"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Phone</label>
            <Input
              name="phone"
              value={form.phone}
              onChange={handleInputChange}
              disabled={!editMode}
              className="w-full p-4 rounded-xl bg-slate-700/60 border border-purple-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your phone"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Gender</label>
            <Select
              value={String(form.gender)}
              onValueChange={(val) => setForm((prev: any) => ({ ...prev, gender: Number(val) }))}
              disabled={!editMode}
            >
              <SelectTrigger
                className="w-full h-9 rounded-xl border !border-purple-700 !text-white !bg-slate-700/60 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                disabled={!editMode}
              >
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Male</SelectItem>
                <SelectItem value="1">Female</SelectItem>
                <SelectItem value="2">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Location</label>
            <Input
              name="location"
              value={form.location ?? ''}
              onChange={handleInputChange}
              disabled={!editMode}
              className="w-full p-4 rounded-xl bg-slate-700/60 border border-purple-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter location"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Date of Birth</label>
            <div className="relative">
              <input
                name="dob"
                type="date"
                className="border border-purple-700 rounded-xl px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300 bg-slate-700/60 text-white"
                value={form.dob ? form.dob.slice(0, 10) : ''}
                onChange={(e) => setForm((f: any) => ({ ...f, dob: e.target.value }))}
                disabled={!editMode}
                placeholder="Date of birth"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            {editMode ? (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                  onClick={() => {
                    setEditMode(false);
                    setForm(account);
                    setAvatarFile(null);
                    setPreviewUrl(account.avatar || account.avatarUrl || '');
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg"
                onClick={() => setEditMode(true)}
              >
                Edit
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCustomer;

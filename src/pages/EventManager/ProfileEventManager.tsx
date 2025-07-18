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
import { getUserByIdAPI, editUserAPI, uploadUserAvatarAPI, updateFaceAPI } from '@/services/Admin/user.service';
import { getEventFollowersByUserId } from '@/services/follow.service';
import type { User } from '@/types/auth';
import { NO_AVATAR } from '@/assets/img';
import FaceCapture from '@/components/common/FaceCapture';
import { toast } from 'react-toastify';
import instance from '@/services/axios.customize';

const TABS = [
  { key: 'profile', label: 'Thông tin cá nhân' },
  { key: 'followers', label: 'Người theo dõi sự kiện' },
  { key: 'managerFollowers', label: 'Người theo dõi bạn' },
];

const ProfileEventManager = () => {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [facePassword, setFacePassword] = useState('');
  const [faceError, setFaceError] = useState('');
  const [tab, setTab] = useState<'profile' | 'followers' | 'managerFollowers'>('profile');
  const [followers, setFollowers] = useState<User[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [managerFollowers, setManagerFollowers] = useState<User[]>([]);
  const [loadingManagerFollowers, setLoadingManagerFollowers] = useState(false);

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

  useEffect(() => {
    if (tab === 'followers' && account?.userId) {
      setLoadingFollowers(true);
      getEventFollowersByUserId(account.userId)
        .then((res) => setFollowers(res || []))
        .catch(() => setFollowers([]))
        .finally(() => setLoadingFollowers(false));
    }
    if (tab === 'managerFollowers') {
      setLoadingManagerFollowers(true);
      instance.get('/api/Follow/followers')
        .then((res) => {
          const data = res.data?.data;
          setManagerFollowers(Array.isArray(data) ? data : []);
        })
        .catch(() => setManagerFollowers([]))
        .finally(() => setLoadingManagerFollowers(false));
    }
  }, [tab, account?.userId]);

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
    } catch (err: any) {
      if (err?.response?.status === 403) {
        alert('You do not have permission to update this profile.');
      } else if (err?.response?.status === 404) {
        alert('User not found.');
      } else {
        alert('Failed to update profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="fixed inset-0 z-[-1] bg-[#091D4B] w-full h-full" />
        <div className="w-full min-h-screen flex flex-col items-center justify-center text-white">
          <SpinnerOverlay show={true} />
        </div>
      </>
    );
  }

  if (!account) return null;

  return (
    <>
      <div className="fixed inset-0 z-[-1] bg-[#091D4B] w-full h-full" />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-start justify-center">
        <div className="w-full max-w-7xl mx-auto rounded-[2.5rem] shadow-[0_8px_32px_rgba(80,0,160,0.25)] border border-white/10 bg-white/10 backdrop-blur-xl flex flex-col overflow-hidden mt-24 mb-8 p-0">
          {/* Tabs horizontal full width on top, bo tròn hai góc dưới */}
          <div className="flex flex-row gap-2 w-full px-0 pt-0 pb-0 bg-transparent justify-start border-b border-indigo-700/30 rounded-b-[2.5rem] overflow-hidden">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`flex-1 px-0 py-4 rounded-none font-semibold transition-all text-base text-center
                  ${tab === t.key
                    ? 'bg-gradient-to-br from-pink-500 to-indigo-500 text-white shadow-none'
                    : 'text-indigo-100 hover:bg-indigo-700/30'}
                `}
                style={{ minWidth: 0 }}
                onClick={() => setTab(t.key as 'profile' | 'followers' | 'managerFollowers')}
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* Main content: full width, no extra padding top/bottom */}
          <main className="flex-1 w-full px-10 py-8 flex flex-col justify-start min-h-[600px]">
            {tab === 'profile' && (
              <div className="flex flex-col items-center justify-center w-full">
                {/* Avatar Section */}
                <div className="w-full flex flex-col items-center mb-4">
                  <div className="w-28 h-28 rounded-full border-4 border-blue-400 bg-white/10 flex items-center justify-center overflow-hidden shadow-lg mb-3">
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
                        className="bg-gradient-to-r from-green-500 to-blue-500 hover:brightness-110 transition rounded-full px-4 py-1.5 text-sm text-white font-semibold shadow-[0_4px_4px_rgba(0,0,0,0.25)] mb-2"
                        onClick={() => document.getElementById('edit-avatar-input')?.click()}
                      >
                        Change Avatar
                      </Button>
                    </>
                  )}
                </div>
                {/* Personal Information */}
                <div className="w-full flex flex-col items-center justify-center">
                  <div className="w-full flex flex-col mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      {/* Full Name */}
                      <div className="w-full">
                        <label className="block text-xs text-white/50 ml-1 mb-1">Full Name</label>
                        <Input
                          name="fullName"
                          value={form.fullName || ''}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          placeholder="Enter your full name"
                          className="rounded-full border !bg-slate-700/60 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 py-2 px-3 w-full disabled:opacity-70 h-auto text-sm"
                        />
                      </div>
                      {/* Email */}
                      <div className="w-full">
                        <label className="block text-xs text-white/50 ml-1 mb-1">Email Address</label>
                        <Input
                          name="email"
                          value={form.email || ''}
                          disabled={true}
                          placeholder="Your email address"
                          className="rounded-full border !bg-slate-700/60 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 py-2 px-3 w-full opacity-70 h-auto text-sm"
                        />
                      </div>
                      {/* Phone */}
                      <div className="w-full">
                        <label className="block text-xs text-white/50 ml-1 mb-1">Phone Number</label>
                        <Input
                          name="phone"
                          value={form.phone || ''}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          placeholder="Enter your phone number"
                          className="rounded-full border !bg-slate-700/60 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 py-2 px-3 w-full disabled:opacity-70 h-auto text-sm"
                        />
                      </div>
                      {/* Gender */}
                      <div className="w-full">
                        <label className="block text-xs text-white/50 ml-1 mb-1">Gender</label>
                        <Select
                          value={String(form.gender || '0')}
                          onValueChange={(val) => setForm((prev: any) => ({ ...prev, gender: Number(val) }))}
                          disabled={!editMode}
                        >
                          <SelectTrigger
                            className="rounded-full border !bg-slate-700/60 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 py-2 px-3 w-full disabled:opacity-70 h-auto text-sm"
                          >
                            <SelectValue placeholder="Select your gender" className="text-[#A1A1AA] placeholder:text-[#A1A1AA]" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border border-purple-600 rounded-lg">
                            <SelectItem value="0" className="text-white hover:bg-slate-600 focus:bg-slate-600 focus:text-white">Male</SelectItem>
                            <SelectItem value="1" className="text-white hover:bg-slate-600 focus:bg-slate-600 focus:text-white">Female</SelectItem>
                            <SelectItem value="2" className="text-white hover:bg-slate-600 focus:bg-slate-600 focus:text-white">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Location */}
                      <div className="w-full">
                        <label className="block text-xs text-white/50 ml-1 mb-1">Location</label>
                        <Input
                          name="location"
                          value={form.location || ''}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          placeholder="Enter your location"
                          className="rounded-full border !bg-slate-700/60 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 py-2 px-3 w-full disabled:opacity-70 h-auto text-sm"
                        />
                      </div>
                      {/* Date of Birth */}
                      <div className="w-full">
                        <label className="block text-xs text-white/50 ml-1 mb-1">Day of Birth</label>
                        <input
                          name="dob"
                          type="date"
                          value={form.dob ? form.dob.slice(0, 10) : ''}
                          onChange={(e) => setForm((f: any) => ({ ...f, dob: e.target.value }))}
                          disabled={!editMode}
                          className="rounded-full border !bg-slate-700/60 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 py-2 px-3 w-full disabled:opacity-70 h-auto text-sm"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Action Buttons */}
                {editMode ? (
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:brightness-110 transition rounded-full flex-1 py-2.5 text-base font-semibold shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
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
                      type="button"
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-110 transition rounded-full flex-1 py-2.5 text-base font-semibold shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                      onClick={handleSave}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                ) : (
                  <div className="w-full flex flex-row gap-3 mt-2 flex-wrap">
                    <Button
                      type="button"
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-110 transition rounded-full flex-1 min-w-[140px] py-2.5 text-base font-semibold shadow"
                      onClick={() => setEditMode(true)}
                    >
                      Edit Profile
                    </Button>
                    <Button
                      type="button"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition rounded-full flex-1 min-w-[140px] py-2 text-base font-semibold shadow"
                      onClick={() => setShowFaceModal(true)}
                    >
                      {account.faceImageUrl ? 'Update Face' : 'Register Face'}
                    </Button>
                  </div>
                )}
              </div>
            )}
            {tab === 'followers' && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    👥 Người theo dõi sự kiện
                  </h2>
                  <div className="bg-purple-600/20 px-4 py-2 rounded-full border border-purple-500/30">
                    <span className="text-purple-300 text-sm font-medium">
                      {followers.length} người
                    </span>
                  </div>
                </div>
                {loadingFollowers ? (
                  <SpinnerOverlay show={true} />
                ) : followers.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🤷‍♂️</div>
                    <div className="text-gray-400 text-lg mb-2">Chưa có ai theo dõi sự kiện nào</div>
                    <div className="text-gray-500 text-sm">Chưa có người dùng nào follow sự kiện của bạn</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl shadow border border-slate-700/40 bg-slate-900/60">
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr className="bg-slate-800/80 text-purple-300">
                          <th className="px-4 py-3 font-semibold">Avatar</th>
                          <th className="px-4 py-3 font-semibold">Tên</th>
                          <th className="px-4 py-3 font-semibold">Email</th>
                          <th className="px-4 py-3 font-semibold">SĐT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {followers.map((f, idx) => (
                          <tr key={f.userId || idx} className="border-b border-slate-700/30 hover:bg-slate-800/60 transition">
                            <td className="px-4 py-2">
                              <img src={f.avatarUrl || NO_AVATAR} alt={f.fullName} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                            </td>
                            <td className="px-4 py-2 font-medium text-white">{f.fullName}</td>
                            <td className="px-4 py-2 text-slate-300">{f.email}</td>
                            <td className="px-4 py-2 text-slate-300">{f.phone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {tab === 'managerFollowers' && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    👤 Người theo dõi event manager
                  </h2>
                  <div className="bg-purple-600/20 px-4 py-2 rounded-full border border-purple-500/30">
                    <span className="text-purple-300 text-sm font-medium">
                      {managerFollowers.length} người
                    </span>
                  </div>
                </div>
                {loadingManagerFollowers ? (
                  <SpinnerOverlay show={true} />
                ) : managerFollowers.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🤷‍♂️</div>
                    <div className="text-gray-400 text-lg mb-2">Chưa có ai theo dõi event manager này</div>
                    <div className="text-gray-500 text-sm">Chưa có người dùng nào follow event manager này</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl shadow border border-slate-700/40 bg-slate-900/60">
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr className="bg-slate-800/80 text-purple-300">
                          <th className="px-4 py-3 font-semibold">Avatar</th>
                          <th className="px-4 py-3 font-semibold">Tên</th>
                          <th className="px-4 py-3 font-semibold">Email</th>
                          <th className="px-4 py-3 font-semibold">SĐT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {managerFollowers.map((f, idx) => (
                          <tr key={f.userId || idx} className="border-b border-slate-700/30 hover:bg-slate-800/60 transition">
                            <td className="px-4 py-2">
                              <img src={f.avatarUrl || NO_AVATAR} alt={f.fullName} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                            </td>
                            <td className="px-4 py-2 font-medium text-white">{f.fullName}</td>
                            <td className="px-4 py-2 text-slate-300">{f.email}</td>
                            <td className="px-4 py-2 text-slate-300">{f.phone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
      {/* Face Modal giữ nguyên như cũ */}
      {showFaceModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative mx-4">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowFaceModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
              {account.faceImageUrl ? 'Update Face' : 'Register Face'}
            </h2>
            <input
              type="password"
              placeholder="Nhập mật khẩu tài khoản"
              value={facePassword}
              onChange={(e) => setFacePassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {faceError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-center">
                {faceError}
              </div>
            )}
            <FaceCapture
              onCapture={async ({ image }) => {
                setFaceError('');
                try {
                  const file = new File([image], 'face.jpg', { type: image.type || 'image/jpeg' });
                  await updateFaceAPI(account.userId, file, [0]);
                  toast.success('Face updated successfully!');
                  setShowFaceModal(false);
                } catch (e: any) {
                  let msg = 'Face update failed!';
                  if (e?.response?.data?.message) {
                    const m = e.response.data.message;
                    if (
                      m.includes('already been registered') ||
                      m.includes('Liveness check failed') ||
                      m.includes('No face could be detected') ||
                      m.includes('Multiple faces detected')
                    ) {
                      msg = m;
                    }
                  }
                  setFaceError(msg);
                  toast.error(msg);
                }
              }}
              onError={(err) => setFaceError(err)}
              onCancel={() => setShowFaceModal(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileEventManager;

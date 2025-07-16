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
import { NO_AVATAR } from '@/assets/img';
import FaceCapture from '@/components/common/FaceCapture';
import { toast } from 'react-toastify';

const ProfileCustomer = () => {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [facePassword, setFacePassword] = useState('');
  const [faceError, setFaceError] = useState('');

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
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <SpinnerOverlay show={true} />
        <span className="mt-6 text-lg text-purple-200 animate-pulse">Vui lòng chờ trong giây lát...</span>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-3xl font-bold text-red-600 mb-4">Không thể tải thông tin tài khoản</div>
          <div className="text-gray-700 mb-6">Vui lòng thử lại hoặc liên hệ quản trị viên.</div>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            onClick={() => window.location.href = '/'}
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

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
          <button
            type="button"
            className="mb-2 w-[180px] h-[45px] rounded-[8px] bg-gradient-to-r from-purple-600 to-green-500 text-white font-medium text-base transition duration-300 hover:from-purple-700 hover:to-green-600 shadow"
            onClick={() => setShowFaceModal(true)}
          >
            Cập nhật khuôn mặt
          </button>
          {showFaceModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
              <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                  onClick={() => setShowFaceModal(false)}
                  aria-label="Đóng"
                >×</button>
                <h2 className="text-xl font-bold mb-4 text-center text-black">Cập nhật khuôn mặt</h2>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu tài khoản"
                  value={facePassword}
                  onChange={e => setFacePassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {faceError && <div className="text-red-500 text-center mb-2">{faceError}</div>}
                <FaceCapture
                  onCapture={async ({ image }) => {
                    setFaceError('');
                    try {
                      const file = new File([image], 'face.jpg', { type: image.type || 'image/jpeg' });
                      await updateFaceAPI(account.userId, file, [0]);
                      toast.success('Cập nhật khuôn mặt thành công!');
                      setShowFaceModal(false);
                    } catch (e: any) {
                      let msg = 'Cập nhật khuôn mặt thất bại!';
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
          {/* Thêm nút đăng ký bằng khuôn mặt nếu user chưa có face (hoặc luôn hiển thị khi editMode) */}
          {(account.faceImageUrl === null || editMode) && (
            <Button
              type="button"
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-lg mt-2"
              onClick={() => setShowFaceModal(true)}
            >
              {account.faceImageUrl ? 'Cập nhật khuôn mặt' : 'Đăng ký khuôn mặt'}
            </Button>
          )}
          {showFaceModal && (
            <FaceCapture
              onCapture={async ({ image }) => {
                // Convert Blob to File
                const file = new File([image], 'face.jpg', { type: image.type || 'image/jpeg' });
                setShowFaceModal(false);
                setTimeout(async () => {
                  try {
                    await updateFaceAPI(account.userId, file, [0]);
                    toast.success('Cập nhật khuôn mặt thành công!');
                  } catch (e) {
                    console.log('API error', e);
                    toast.error('Cập nhật khuôn mặt thất bại!');
                  }
                }, 100);
              }}
              onCancel={() => setShowFaceModal(false)}
            />
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

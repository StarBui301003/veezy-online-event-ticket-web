/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, ChangeEvent } from 'react';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import {
  getUserByIdAPI,
  editUserAPI,
  uploadUserAvatarAPI,
  updateFaceAPI,
} from '@/services/Admin/user.service';
import { useFaceAuthStatus } from '@/hooks/use-face-auth-status';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { NO_AVATAR } from '@/assets/img';
import FaceCapture from '@/components/common/FaceCapture';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const ProfilePage = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceError, setFaceError] = useState('');
  const { t } = useTranslation();
  const { hasFaceAuth, refetch: refetchFaceAuth } = useFaceAuthStatus();

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

    // Note: Identity and FaceRecognition realtime updates not available
    // No IdentityHub or FaceRecognitionHub implemented yet
  }, [refetchFaceAuth]);

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
      {
        setTimeout(() => setLoading(false), 500);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <SpinnerOverlay show={true} />
        <span className="mt-6 text-lg text-purple-200 animate-pulse">{t('pleaseWait')}</span>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-3xl font-bold text-red-600 mb-4">{t('cannotLoadAccountInfo')}</div>
          <div className="text-gray-700 mb-6">{t('pleaseTryAgainOrContactAdmin')}</div>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            onClick={() => (window.location.href = '/')}
          >
            {t('backToHome')}
          </button>
        </div>
      </div>
    );
  }

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
            <button
              type="button"
              className="mt-2 w-[160px] h-[45px] rounded-[8px] bg-gradient-to-r from-blue-600 to-green-500 text-white font-medium text-base transition duration-300 hover:from-blue-700 hover:to-green-600 shadow"
              onClick={() => setShowFaceModal(true)}
            >
              {t('updateFace')}
            </button>
            {showFaceModal && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                    onClick={() => setShowFaceModal(false)}
                    aria-label={t('close')}
                  >
                    ×
                  </button>
                  <h2 className="text-xl font-bold mb-4 text-center text-black">
                    {t('updateFace')}
                  </h2>
                  {faceError && <div className="text-red-500 text-center mb-2">{faceError}</div>}
                  <FaceCapture
                    onCapture={async ({ image }) => {
                      setFaceError('');
                      try {
                        const file = new File([image], 'face.jpg', {
                          type: image.type || 'image/jpeg',
                        });
                        await updateFaceAPI(account.userId, file, [0], undefined, hasFaceAuth);
                        toast.success(t('updateFaceSuccess'));
                        setShowFaceModal(false);
                        // Refetch face auth status after successful update
                        await refetchFaceAuth();
                      } catch (e: any) {
                        let msg = t('updateFaceFailed');
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
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {t('fullName')}
                </label>
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
                <label className="block text-sm font-medium text-gray-600 mb-1">{t('email')}</label>
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
                <label className="block text-sm font-medium text-gray-600 mb-1">{t('phone')}</label>
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
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {t('gender')}
                </label>
                {editMode ? (
                  <Select
                    value={String(form.gender)}
                    onValueChange={(val) =>
                      setForm((prev: any) => ({ ...prev, gender: Number(val) }))
                    }
                  >
                    <SelectTrigger className="border border-gray-200 rounded px-2 py-1 w-full shadow-none focus:ring-0 focus:border-gray-300 bg-white">
                      <SelectValue placeholder={t('selectGender')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{t('male')}</SelectItem>
                      <SelectItem value="1">{t('female')}</SelectItem>
                      <SelectItem value="2">{t('other')}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="border rounded px-2 py-1 w-full bg-gray-50">
                    {account.gender === 0
                      ? t('male')
                      : account.gender === 1
                      ? t('female')
                      : t('other')}
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
                  <span>{t('cancel')}</span>
                </button>
                <button
                  className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
                  onClick={handleSave}
                  disabled={loading}
                  type="button"
                >
                  <span>{t('save')}</span>
                </button>
              </>
            ) : (
              <button
                className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
                onClick={() => setEditMode(true)}
                type="button"
              >
                <span>{t('edit')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

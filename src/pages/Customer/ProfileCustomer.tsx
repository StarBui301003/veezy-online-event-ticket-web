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
import {
  getUserByIdAPI,
  editUserAPI,
  uploadUserAvatarAPI,
  updateFaceAPI,
} from '@/services/Admin/user.service';
import { NO_AVATAR } from '@/assets/img';
import FaceCapture from '@/components/common/FaceCapture';
import { toast } from 'react-toastify';
import {
  parseBackendErrors,
  getFieldError,
  hasFieldError,
  type FieldErrors,
  validateDateOfBirth,
} from '@/utils/validation';

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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

    // Clear errors when user types
    if (hasFieldError(fieldErrors, name)) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    // Clear previous errors
    setFieldErrors({});

    // Validate all required fields
    const newFieldErrors: FieldErrors = {};

    if (!form.fullName?.trim()) {
      newFieldErrors.fullname = ['Full name is required!'];
    }

    if (!form.email?.trim()) {
      newFieldErrors.email = ['Email is required!'];
    }

    if (!form.phone?.trim()) {
      newFieldErrors.phone = ['Phone number is required!'];
    }

    // Validate date of birth (dob)
    if (form.dob) {
      const dobValidation = validateDateOfBirth(form.dob);
      if (!dobValidation.isValid) {
        newFieldErrors.dob = [dobValidation.errorMessage!];
      }
    }

    // If there are validation errors, show them and return (NO TOAST for validation errors)
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

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
      setFieldErrors({});
      window.dispatchEvent(new Event('user-updated'));
      toast.success('Profile updated successfully!');
    } catch (error: unknown) {
      // Parse backend errors for field-specific display
      const { fieldErrors: backendFieldErrors, generalErrors } = parseBackendErrors(error);

      // Set field errors for inline display (NO TOAST for field errors by default)
      setFieldErrors(backendFieldErrors);

      // Show toast ONLY for general errors that couldn't be mapped to fields
      if (generalErrors.length > 0) {
        toast.error(generalErrors[0]);
      } else if (Object.keys(backendFieldErrors).length === 0) {
        // Fallback error only if no field errors
        toast.error('Failed to update profile. Please try again.');
      }
      // No toast for field errors - only inline red display
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

  if (!account) {
    return (
      <>
        <div className="fixed inset-0 z-[-1] bg-[#091D4B] w-full h-full" />
        <div className="w-full min-h-screen flex flex-col items-center justify-center text-white">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center max-w-md mx-4">
            <div className="text-2xl font-bold text-red-400 mb-4">
              Unable to load account information
            </div>
            <div className="text-gray-300 mb-6">Please try again or contact administrator.</div>
            <Button
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-110 transition rounded-full px-6 py-2 text-white font-semibold"
              onClick={() => (window.location.href = '/')}
            >
              Go to Homepage
            </Button>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="fixed inset-0 z-[-1] bg-[#091D4B] w-full h-full" />

      <div className="text-white flex items-center justify-center relative min-h-screen py-6 mt-8">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl mx-4 p-4 md:p-6 lg:p-8 w-full max-w-xl flex flex-col items-center justify-center">
          {/* Avatar Section */}
          <div className="w-full flex flex-col items-center mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-blue-400 bg-white/10 flex items-center justify-center overflow-hidden shadow-lg mb-3">
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

          <div className="w-full flex flex-col items-center justify-center">
            {/* Personal Information */}
            <div className="w-full flex flex-col mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {/* Full Name */}
                <div className="w-full">
                  <label className="block text-xs text-white/50 ml-1 mb-1">Full Name</label>
                  <Input
                    name="fullName"
                    value={form.fullName || ''}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    placeholder="Enter your full name"
                    className={`rounded-full border !bg-slate-700/60 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 py-2 px-3 w-full disabled:opacity-70 h-auto text-sm ${
                      hasFieldError(fieldErrors, 'fullname')
                        ? '!border-red-500 !text-white'
                        : '!border-purple-700 !text-white'
                    }`}
                  />
                  {getFieldError(fieldErrors, 'fullname') && (
                    <div className="text-red-400 text-xs mt-1 ml-2">
                      {getFieldError(fieldErrors, 'fullname')}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="w-full">
                  <label className="block text-xs text-white/50 ml-1 mb-1">Email Address</label>
                  <Input
                    name="email"
                    value={form.email || ''}
                    disabled={true}
                    placeholder="Your email address"
                    className={`rounded-full border !bg-slate-700/60 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 py-2 px-3 w-full opacity-70 h-auto text-sm ${
                      hasFieldError(fieldErrors, 'email')
                        ? '!border-red-500 !text-white'
                        : '!border-purple-700 !text-white'
                    }`}
                  />
                  {getFieldError(fieldErrors, 'email') && (
                    <div className="text-red-400 text-xs mt-1 ml-2">
                      {getFieldError(fieldErrors, 'email')}
                    </div>
                  )}
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
                    className={`rounded-full border !bg-slate-700/60 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 py-2 px-3 w-full disabled:opacity-70 h-auto text-sm ${
                      hasFieldError(fieldErrors, 'phone')
                        ? '!border-red-500 !text-white'
                        : '!border-purple-700 !text-white'
                    }`}
                  />
                  {getFieldError(fieldErrors, 'phone') && (
                    <div className="text-red-400 text-xs mt-1 ml-2">
                      {getFieldError(fieldErrors, 'phone')}
                    </div>
                  )}
                </div>

                {/* Gender */}
                <div className="w-full">
                  <label className="block text-xs text-white/50 ml-1 mb-1">Gender</label>
                  <Select
                    value={String(form.gender || '0')}
                    onValueChange={(val) => {
                      setForm((prev: any) => ({ ...prev, gender: Number(val) }));
                      // Clear errors when user selects
                      if (hasFieldError(fieldErrors, 'gender')) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.gender;
                          return newErrors;
                        });
                      }
                    }}
                    disabled={!editMode}
                  >
                    <SelectTrigger
                      className={`rounded-full border !bg-slate-700/60 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 py-2 px-3 w-full disabled:opacity-70 h-auto text-sm ${
                        hasFieldError(fieldErrors, 'gender')
                          ? '!border-red-500 !text-white'
                          : '!border-purple-700 !text-white'
                      }`}
                    >
                      <SelectValue
                        placeholder="Select your gender"
                        className="text-[#A1A1AA] placeholder:text-[#A1A1AA]"
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border border-purple-600 rounded-lg">
                      <SelectItem
                        value="0"
                        className="text-white hover:bg-slate-600 focus:bg-slate-600 focus:text-white"
                      >
                        Male
                      </SelectItem>
                      <SelectItem
                        value="1"
                        className="text-white hover:bg-slate-600 focus:bg-slate-600 focus:text-white"
                      >
                        Female
                      </SelectItem>
                      <SelectItem
                        value="2"
                        className="text-white hover:bg-slate-600 focus:bg-slate-600 focus:text-white"
                      >
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {getFieldError(fieldErrors, 'gender') && (
                    <div className="text-red-400 text-xs mt-1 ml-2">
                      {getFieldError(fieldErrors, 'gender')}
                    </div>
                  )}
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
                    className={`rounded-full border !bg-slate-700/60 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 py-2 px-3 w-full disabled:opacity-70 h-auto text-sm ${
                      hasFieldError(fieldErrors, 'location')
                        ? '!border-red-500 !text-white'
                        : '!border-purple-700 !text-white'
                    }`}
                  />
                  {getFieldError(fieldErrors, 'location') && (
                    <div className="text-red-400 text-xs mt-1 ml-2">
                      {getFieldError(fieldErrors, 'location')}
                    </div>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="w-full">
                  <label className="block text-xs text-white/50 ml-1 mb-1">Day of Birth</label>
                  <input
                    name="dob"
                    type="date"
                    value={form.dob ? form.dob.slice(0, 10) : ''}
                    onChange={(e) => {
                      setForm((f: any) => ({ ...f, dob: e.target.value }));
                      // Clear errors when user changes date
                      if (hasFieldError(fieldErrors, 'dob')) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.dob;
                          return newErrors;
                        });
                      }
                      // Validate ngay khi user chọn ngày mới
                      if (e.target.value) {
                        const dobValidation = validateDateOfBirth(e.target.value);
                        if (!dobValidation.isValid) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            dob: [dobValidation.errorMessage!],
                          }));
                        }
                      }
                    }}
                    disabled={!editMode}
                    className={`rounded-full border !bg-slate-700/60 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 py-2 px-3 w-full disabled:opacity-70 h-auto text-sm ${
                      hasFieldError(fieldErrors, 'dob')
                        ? '!border-red-500 !text-white'
                        : '!border-purple-700 !text-white'
                    }`}
                    style={{
                      colorScheme: 'dark',
                    }}
                  />
                  {getFieldError(fieldErrors, 'dob') && (
                    <div className="text-red-400 text-xs mt-1 ml-2">
                      {getFieldError(fieldErrors, 'dob')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-3">
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
                      setFieldErrors({});
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
                <Button
                  type="button"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-110 transition rounded-full w-full py-2.5 text-base font-semibold shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                  onClick={() => {
                    setEditMode(true);
                    setFieldErrors({});
                  }}
                >
                  Edit Profile
                </Button>
              )}

              {/* Nút riêng Cập nhật khuôn mặt */}
              <Button
                type="button"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition rounded-full w-full py-2.5 text-base font-semibold shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                onClick={() => setShowFaceModal(true)}
              >
                {account.faceImageUrl ? 'Update Face' : 'Register Face'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Face Modal */}
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
export default ProfileCustomer;

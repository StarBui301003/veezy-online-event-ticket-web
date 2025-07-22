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
import { getOrderHistoryByCustomerId } from '@/services/order.service';
import { getTicketsByOrderId, getMyAttendances } from '@/services/ticketIssued.service';
import OrderHistory from '@/components/Customer/OrderHistory';
import MyTickets from '@/components/Customer/MyTickets';
import AttendanceHistory from '@/components/Customer/AttendanceHistory';
import type { User } from '@/types/auth';
import type { AdminOrder } from '@/types/Admin/order';
import type { TicketPayload } from '@/types/event';
import type { Attendance } from '@/types/attendance';
import { useTranslation } from 'react-i18next';

const TABS = [
  { key: 'info', label: 'Thông tin cá nhân' },
  { key: 'orders', label: 'Lịch sử mua vé' },
  { key: 'tickets', label: 'Vé của tôi' },
  { key: 'attendances', label: 'Lịch sử tham dự' },
];

const ProfileCustomer = () => {
  const { t } = useTranslation();
  const [account, setAccount] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<User> | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [facePassword, setFacePassword] = useState('');
  const [faceError, setFaceError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [tab, setTab] = useState('info');

  // Lịch sử mua vé
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);

  // Vé của tôi
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [tickets, setTickets] = useState<TicketPayload[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState('');

  // Lịch sử tham dự
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [attendancesLoading, setAttendancesLoading] = useState(false);
  const [attendancesError, setAttendancesError] = useState('');

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
        setPreviewUrl(user.avatarUrl || '');
      })
      .catch(() => {
        setAccount(null);
        setForm(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch order history when tab changes to 'orders'
  useEffect(() => {
    if (tab === 'orders' && account?.userId) {
      setOrdersLoading(true);
      setOrdersError('');
      getOrderHistoryByCustomerId(account.userId, ordersPage, 10)
        .then((res) => {
          setOrders(res.data?.items || []);
          setOrdersTotalPages(res.data?.totalPages || 1);
        })
        .catch(() => setOrdersError('Không thể tải lịch sử mua vé.'))
        .finally(() => setOrdersLoading(false));
    }
    // eslint-disable-next-line
  }, [tab, account?.userId, ordersPage]);

  // Fetch tickets for selected order
  useEffect(() => {
    if (tab === 'tickets' && selectedOrder?.orderId) {
      setTicketsLoading(true);
      setTicketsError('');
      getTicketsByOrderId(selectedOrder.orderId)
        .then((res) => setTickets(res.data || []))
        .catch(() => setTicketsError('Không thể tải vé.'))
        .finally(() => setTicketsLoading(false));
    }
  }, [tab, selectedOrder]);

  // Fetch attendances
  useEffect(() => {
    if (tab === 'attendances') {
      setAttendancesLoading(true);
      setAttendancesError('');
      getMyAttendances()
        .then((res) => setAttendances(res.data || []))
        .catch(() => setAttendancesError('Không thể tải lịch sử tham dự.'))
        .finally(() => setAttendancesLoading(false));
    }
  }, [tab]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev: Partial<User> | null) => ({
      ...(prev || {}),
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
      let avatarUrl = form.avatarUrl;
      if (avatarFile instanceof File) {
        const res = await uploadUserAvatarAPI(form.userId, avatarFile);
        avatarUrl = res.data?.avatarUrl || avatarUrl;
        const accStr = localStorage.getItem('account');
        if (accStr) {
          const acc = JSON.parse(accStr);
          acc.avatarUrl = avatarUrl;
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
        let acc: Partial<User> = {};
        if (accStr) {
          acc = JSON.parse(accStr);
        }
        const newAccount = {
          ...acc,
          ...updatedUser,
          avatarUrl: updatedUser.avatarUrl,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
        };
        localStorage.setItem('account', JSON.stringify(newAccount));
      }
      setAccount({
        userId: form.userId,
        accountId: form.accountId,
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        avatarUrl: avatarUrl,
        gender: form.gender,
        dob: form.dob,
        location: form.location,
        createdAt: form.createdAt,
      });
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-start justify-center">
        <div className="w-full max-w-7xl mx-auto rounded-[2.5rem] shadow-[0_8px_32px_rgba(80,0,160,0.25)] border border-white/10 bg-white/10 backdrop-blur-xl flex flex-row overflow-hidden mt-32 mb-16 p-0">
          {/* Sidebar inside card, flush left/top, no border radius left */}
          <aside className="w-32 md:w-36 bg-gradient-to-b from-indigo-800/90 to-slate-800/90 flex flex-col gap-2 border-r border-indigo-700/30 justify-start py-6 px-4">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`w-full text-left py-2 rounded-xl font-semibold transition-all text-xs mb-2
                  ${tab === t.key
                    ? 'bg-gradient-to-br from-pink-500 to-indigo-500 text-white shadow'
                    : 'text-indigo-100 hover:bg-indigo-700/30'}
                `}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </aside>
          {/* Main content: only right side has padding, more top padding for header */}
          <main className="flex-1 p-10 pt-12 flex flex-col justify-start min-h-[600px]">
            {tab === 'info' && (
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
                        {t('changeAvatar')}
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
                        <label className="block text-xs text-white/50 ml-1 mb-1">{t('fullName')}</label>
                        <Input
                          name="fullName"
                          value={form.fullName || ''}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          placeholder={t('enterFullName')}
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
                        <label className="block text-xs text-white/50 ml-1 mb-1">{t('emailAddress')}</label>
                        <Input
                          name="email"
                          value={form.email || ''}
                          disabled={true}
                          placeholder={t('yourEmailAddress')}
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
                        <label className="block text-xs text-white/50 ml-1 mb-1">{t('phoneNumber')}</label>
                        <Input
                          name="phone"
                          value={form.phone || ''}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          placeholder={t('enterPhoneNumber')}
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
                        <label className="block text-xs text-white/50 ml-1 mb-1">{t('gender')}</label>
                        <Select
                          value={String(form.gender || '0')}
                          onValueChange={(val) => {
                            setForm((prev: Partial<User> | null) => ({ ...(prev || {}), gender: Number(val) }));
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
                              placeholder={t('selectGender')}
                              className="text-[#A1A1AA] placeholder:text-[#A1A1AA]"
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border border-purple-600 rounded-lg">
                            <SelectItem
                              value="0"
                              className="text-white hover:bg-slate-600 focus:bg-slate-600 focus:text-white"
                            >
                              {t('male')}
                            </SelectItem>
                            <SelectItem
                              value="1"
                              className="text-white hover:bg-slate-600 focus:bg-slate-600 focus:text-white"
                            >
                              {t('female')}
                            </SelectItem>
                            <SelectItem
                              value="2"
                              className="text-white hover:bg-slate-600 focus:bg-slate-600 focus:text-white"
                            >
                              {t('other')}
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
                        <label className="block text-xs text-white/50 ml-1 mb-1">{t('location')}</label>
                        <Input
                          name="location"
                          value={form.location || ''}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          placeholder={t('enterLocation')}
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
                        <label className="block text-xs text-white/50 ml-1 mb-1">{t('dayOfBirth')}</label>
                        <input
                          name="dob"
                          type="date"
                          value={form.dob ? form.dob.slice(0, 10) : ''}
                          onChange={(e) => {
                            setForm((f: Partial<User> | null) => ({ ...(f || {}), dob: e.target.value }));
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
                </div>
                {/* Action Buttons */}
                <div className="w-full flex flex-col gap-3 mt-2">
                  {editMode ? (
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:brightness-110 transition rounded-full flex-1 py-2.5 text-base font-semibold shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                        onClick={() => {
                          setEditMode(false);
                          setForm(account);
                          setAvatarFile(null);
                          setPreviewUrl(account.avatarUrl || '');
                          setFieldErrors({});
                        }}
                        disabled={loading}
                      >
                        {t('cancel')}
                      </Button>
                      <Button
                        type="button"
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-110 transition rounded-full flex-1 py-2.5 text-base font-semibold shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                        onClick={handleSave}
                        disabled={loading}
                      >
                        {loading ? t('saving') : t('saveChanges')}
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
                      {t('editProfile')}
                    </Button>
                  )}
                  {/* Nút riêng Cập nhật khuôn mặt */}
                  <Button
                    type="button"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition rounded-full w-full py-2.5 text-base font-semibold shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                    onClick={() => setShowFaceModal(true)}
                  >
                    {account.avatarUrl ? t('updateFace') : t('registerFace')}
                  </Button>
                </div>
              </div>
            )}
            {tab === 'orders' && (
              <OrderHistory
                orders={orders}
                loading={ordersLoading}
                error={ordersError}
                page={ordersPage}
                totalPages={ordersTotalPages}
                onPageChange={setOrdersPage}
                onSelectOrder={setSelectedOrder}
              />
            )}
            {tab === 'tickets' && (
              <MyTickets
                tickets={tickets.map((t, idx) => ({
                  ticketName: t.ticketName,
                  key: `${t.eventId}-${t.ticketName}-${idx}`,
                }))}
                loading={ticketsLoading}
                error={ticketsError}
                selectedOrder={selectedOrder}
                onBack={() => { setTab('orders'); setSelectedOrder(null); }}
              />
            )}
            {tab === 'attendances' && (
              <AttendanceHistory
                attendances={attendances}
                loading={attendancesLoading}
                error={attendancesError}
              />
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
              {account.avatarUrl ? t('updateFace') : t('registerFace')}
            </h2>
            <input
              type="password"
              placeholder={t('enterAccountPassword')}
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
                } catch (e: unknown) {
                  let msg = 'Face update failed!';
                  if (typeof e === 'object' && e && 'response' in e && typeof (e as { response?: { data?: { message?: string } } }).response?.data?.message === 'string') {
                    const m = (e as { response: { data: { message: string } } }).response.data.message;
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

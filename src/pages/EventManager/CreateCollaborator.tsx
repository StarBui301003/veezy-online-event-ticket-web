import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  createCollaboratorAccount,
  addCollaborator,
  getEventById,
} from '@/services/Event Manager/event.service';
import { toast } from 'react-toastify';
import { FaUsers, FaSave } from 'react-icons/fa';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

interface Event {
  eventId: string;
  eventName: string;
  startAt: string;
  endAt: string;
}

interface CollaboratorFormData {
  username: string;
  email: string;
  phone: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
}

export default function CreateCollaborator() {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const { eventId } = useParams<{ eventId?: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserAccountId, setCurrentUserAccountId] = useState<string>('');
  const [formData, setFormData] = useState<CollaboratorFormData>({
    username: '',
    email: '',
    phone: '',
    password: '',
    fullName: '',
    dateOfBirth: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Get current user's accountId for emId field
  useEffect(() => {
    try {
      const accountStr = localStorage.getItem('account');
      if (accountStr) {
        const account = JSON.parse(accountStr);
        setCurrentUserAccountId(account.accountId || '');
      }
    } catch (error) {
      console.error('Failed to get current user account:', error);
    }
  }, []);

  // Get event details if eventId is present
  useEffect(() => {
    if (eventId) {
      setLoading(true);
      getEventById(eventId)
        .then((data) => {
          setEvent(data);
        })
        .catch((error) => {
          console.error('Failed to fetch event:', error);
          toast.error(t('error_createFailed'));
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [eventId, t]);

  // Simple validation function
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    // Required field validation
    if (!value.trim()) {
      newErrors[name] = t('validation_required');
    } else {
      delete newErrors[name];

      // Email format validation
      if (name === 'email' && !/^\S+@\S+\.\S+$/.test(value)) {
        newErrors[name] = t('validation_invalidEmail');
      }

      // Phone format validation (simple check for digits only)
      if (name === 'phone' && !/^\d+$/.test(value)) {
        newErrors[name] = t('validation_invalidPhone');
      }

      // Password length check
      if (name === 'password' && value.length < 6) {
        newErrors[name] = t('validation_passwordMinLength', { min: 6 });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CollaboratorFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Validate on change
    validateField(field, value);
  };

  const handleBlur = (field: keyof CollaboratorFormData) => {
    validateField(field, formData[field]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    let isValid = true;
    Object.entries(formData).forEach(([field, value]) => {
      if (!validateField(field, value)) {
        isValid = false;
      }
    });

    if (!isValid) {
      toast.error(t('validation_fixErrors'));
      return;
    }

    if (!currentUserAccountId) {
      toast.error(t('validation_noEventManager'));
      return;
    }

    setIsSubmitting(true);

    try {
      const accountData = {
        ...formData,
        emId: currentUserAccountId,
      };

      const accountResult = await createCollaboratorAccount(accountData);

      if (!accountResult.flag) {
        throw new Error(accountResult.message || t('error_createFailed'));
      }

      if (eventId) {
        const addResult = await addCollaborator(eventId, accountResult.data.accountId);
        if (!addResult.flag) {
          toast.warn(t('warning_accountCreatedButNotAdded', { message: addResult.message }));
        } else {
          toast.success(t('success_collaboratorAdded'));
        }
      } else {
        toast.success(t('success_collaboratorCreated'));
      }

      navigate('/event-manager/collaborators');
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || t('error_unknownError');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className={cn(
          'min-h-screen flex items-center justify-center',
          getThemeClass(
            'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
            'bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e]'
          )
        )}
      >
        <div className={cn('text-xl', getThemeClass('text-blue-600', 'text-white'))}>
          {t('createCollaborator_loading')}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-screen py-8 px-4',
        getThemeClass(
          'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
          'bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e]'
        )
      )}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <FaUsers className={cn('text-4xl', getThemeClass('text-blue-600', 'text-pink-400'))} />
            <div>
              <h1
                className={cn(
                  'text-3xl font-bold text-transparent bg-clip-text',
                  getThemeClass(
                    'bg-gradient-to-r from-blue-600 to-purple-600',
                    'bg-gradient-to-r from-pink-400 to-yellow-400'
                  )
                )}
              >
                {t('createCollaborator_title')}
              </h1>
              {event && (
                <p className={cn('mt-2', getThemeClass('text-gray-600', 'text-slate-300'))}>
                  {t('createCollaborator_createAccountAndAddToEvent')}:{' '}
                  <span
                    className={cn(
                      'font-semibold',
                      getThemeClass('text-blue-600', 'text-yellow-300')
                    )}
                  >
                    {event.eventName}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <div
          className={cn(
            'rounded-2xl shadow-2xl p-8 border-2',
            getThemeClass(
              'bg-white/95 border-blue-200 shadow-lg',
              'bg-[#2d0036]/80 border-pink-500/30'
            )
          )}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div>
                <label
                  className={cn(
                    'block text-sm font-bold mb-2',
                    getThemeClass('text-blue-600', 'text-pink-300')
                  )}
                >
                  {t('createCollaborator_username')} *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  onBlur={() => handleBlur('username')}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                    getThemeClass(
                      'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                      'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                    ),
                    errors.username ? 'border-red-500' : ''
                  )}
                  placeholder={t('createCollaborator_enterUsername')}
                />
                {errors.username && (
                  <div
                    className={cn('text-xs mt-1', getThemeClass('text-red-600', 'text-red-400'))}
                  >
                    {errors.username}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  className={cn(
                    'block text-sm font-bold mb-2',
                    getThemeClass('text-blue-600', 'text-pink-300')
                  )}
                >
                  {t('createCollaborator_email')} *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                    getThemeClass(
                      'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                      'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                    ),
                    errors.email ? 'border-red-500' : ''
                  )}
                  placeholder={t('createCollaborator_emailPlaceholder')}
                />
                {errors.email && (
                  <div
                    className={cn('text-xs mt-1', getThemeClass('text-red-600', 'text-red-400'))}
                  >
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label
                  className={cn(
                    'block text-sm font-bold mb-2',
                    getThemeClass('text-blue-600', 'text-pink-300')
                  )}
                >
                  {t('createCollaborator_phone')} *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                    getThemeClass(
                      'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                      'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                    ),
                    errors.phone ? 'border-red-500' : ''
                  )}
                  placeholder={t('createCollaborator_phonePlaceholder')}
                />
                {errors.phone && (
                  <div
                    className={cn('text-xs mt-1', getThemeClass('text-red-600', 'text-red-400'))}
                  >
                    {errors.phone}
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  className={cn(
                    'block text-sm font-bold mb-2',
                    getThemeClass('text-blue-600', 'text-pink-300')
                  )}
                >
                  {t('createCollaborator_password')} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 focus:ring-2 focus:border-transparent transition-all duration-200 pr-12',
                      getThemeClass(
                        'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                        'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                      ),
                      errors.password ? 'border-red-500' : ''
                    )}
                    placeholder={t('createCollaborator_enterPassword')}
                  />
                  <button
                    type="button"
                    className={cn(
                      'absolute top-1/2 right-4 -translate-y-1/2 focus:outline-none',
                      getThemeClass(
                        'text-blue-500 hover:text-blue-600',
                        'text-pink-300 hover:text-pink-400'
                      )
                    )}
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && (
                  <div
                    className={cn('text-xs mt-1', getThemeClass('text-red-600', 'text-red-400'))}
                  >
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label
                  className={cn(
                    'block text-sm font-bold mb-2',
                    getThemeClass('text-blue-600', 'text-pink-300')
                  )}
                >
                  {t('createCollaborator_fullName')} *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  onBlur={() => handleBlur('fullName')}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                    getThemeClass(
                      'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                      'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                    ),
                    errors.fullName ? 'border-red-500' : ''
                  )}
                  placeholder={t('createCollaborator_fullNamePlaceholder')}
                />
                {errors.fullName && (
                  <div
                    className={cn('text-xs mt-1', getThemeClass('text-red-600', 'text-red-400'))}
                  >
                    {errors.fullName}
                  </div>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label
                  className={cn(
                    'block text-sm font-bold mb-2',
                    getThemeClass('text-blue-600', 'text-pink-300')
                  )}
                >
                  {t('createCollaborator_dateOfBirth')} *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  onBlur={() => handleBlur('dateOfBirth')}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                    getThemeClass(
                      'bg-white border-blue-300 text-gray-900 focus:ring-blue-500',
                      'bg-[#1a0022]/80 border-pink-500/30 text-white focus:ring-pink-500'
                    ),
                    errors.dateOfBirth ? 'border-red-500' : ''
                  )}
                />
                {errors.dateOfBirth && (
                  <div
                    className={cn('text-xs mt-1', getThemeClass('text-red-600', 'text-red-400'))}
                  >
                    {errors.dateOfBirth}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/event-manager/collaborators')}
                className={cn(
                  'px-8 py-4 rounded-xl transition-all duration-200 font-bold',
                  getThemeClass(
                    'bg-gray-500 text-white hover:bg-gray-600',
                    'bg-gray-600 text-white hover:bg-gray-500'
                  )
                )}
              >
                {t('createCollaborator_cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'px-8 py-4 text-white rounded-xl font-bold transition-all duration-200 flex items-center gap-2 disabled:opacity-50',
                  getThemeClass(
                    'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
                    'bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500'
                  )
                )}
              >
                <FaSave />
                {isSubmitting
                  ? t('createCollaborator_creating')
                  : t('createCollaborator_createCollaborator')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

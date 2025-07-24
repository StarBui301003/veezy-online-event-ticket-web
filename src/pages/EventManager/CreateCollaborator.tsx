import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createCollaboratorAccount, addCollaborator, getEventById } from '@/services/Event Manager/event.service';
import { toast } from 'react-toastify';
import { FaUsers, FaSave } from "react-icons/fa";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { validateFields, collaboratorValidationConfig } from '@/lib/formValidation';
import { useTranslation } from 'react-i18next';

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
  const { eventId } = useParams<{ eventId?: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserAccountId, setCurrentUserAccountId] = useState<string>("");
  const [formData, setFormData] = useState<CollaboratorFormData>({
    username: "",
    email: "",
    phone: "",
    password: "",
    fullName: "",
    dateOfBirth: ""
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CollaboratorFormData, string[]>>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Get current user's accountId for emId field
  useEffect(() => {
    try {
      const accountStr = localStorage.getItem('account');
      if (accountStr) {
        const account = JSON.parse(accountStr);
        setCurrentUserAccountId(account.accountId || "");
      }
    } catch (error) {
      console.error("Failed to get current user account:", error);
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
          console.error("Failed to fetch event:", error);
          toast.error(t("event_manager.create_collaborator.errorLoadingEvent"));
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [eventId, t]);

  // Validate form using shared logic
  const validateForm = () => {
    // Convert formData to Record<string, string> for validateFields
    const data: Record<string, string> = Object.fromEntries(Object.entries(formData));
    const errors = validateFields(data, collaboratorValidationConfig, t);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserAccountId) {
      toast.warn(t("event_manager.create_collaborator.errorNoEventManager"));
      return;
    }
    if (!validateForm()) {
      toast.warn(t("event_manager.create_collaborator.errorFillAllFields"));
      return;
    }
    setIsSubmitting(true);
    try {
      const accountData = {
        ...formData,
        emId: currentUserAccountId
      };
      const accountResult = await createCollaboratorAccount(accountData);
      if (accountResult.flag && accountResult.data?.accountId) {
        if (eventId) {
          const addResult = await addCollaborator(eventId, accountResult.data.accountId);
          if (addResult.flag) {
            toast.success(t("event_manager.create_collaborator.successCreateAndAddCollaborator"));
            navigate('/event-manager/collaborators');
          } else {
            toast.warn(`${t("event_manager.create_collaborator.accountCreated")}, ${t("event_manager.create_collaborator.errorAddingToEvent")}: ${addResult.message}`);
            navigate('/event-manager/collaborators');
          }
        } else {
          toast.success(t("event_manager.create_collaborator.successCreateCollaborator"));
          navigate('/event-manager/collaborators');
        }
      } else {
        toast.error(accountResult.message || t("event_manager.create_collaborator.errorCreateCollaborator"));
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || t("event_manager.create_collaborator.errorOccurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CollaboratorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] flex items-center justify-center">
        <div className="text-white text-xl">{t("event_manager.create_collaborator.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <FaUsers className="text-4xl text-pink-400" />
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-400">
                {t("event_manager.create_collaborator.createNewCollaborator")}
              </h1>
              {event && (
                <p className="text-slate-300 mt-2">
                  {t("event_manager.create_collaborator.createAccountAndAddToEvent")}: <span className="text-yellow-300 font-semibold">{event.eventName}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-[#2d0036]/80 rounded-2xl shadow-2xl p-8 border-2 border-pink-500/30">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-bold text-pink-300 mb-2">
                  {t("event_manager.create_collaborator.username")} *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-white placeholder-pink-400 ${formErrors.username?.length ? 'border-red-500' : 'border-pink-500/30'}`}
                  placeholder={t("event_manager.create_collaborator.enterUsername")}
                />
                {formErrors.username && Array.isArray(formErrors.username) && formErrors.username.map((msg, idx) => (
                  <div className="text-red-400 text-xs mt-1" key={idx}>{msg}</div>
                ))}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-pink-300 mb-2">
                  {t("event_manager.create_collaborator.email")} *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-white placeholder-pink-400 ${formErrors.email?.length ? 'border-red-500' : 'border-pink-500/30'}`}
                  placeholder={t("event_manager.create_collaborator.emailPlaceholder")}
                />
                {formErrors.email && Array.isArray(formErrors.email) && formErrors.email.map((msg, idx) => (
                  <div className="text-red-400 text-xs mt-1" key={idx}>{msg}</div>
                ))}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-pink-300 mb-2">
                  {t("event_manager.create_collaborator.phone")} *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-white placeholder-pink-400 ${formErrors.phone?.length ? 'border-red-500' : 'border-pink-500/30'}`}
                  placeholder={t("event_manager.create_collaborator.phonePlaceholder")}
                />
                {formErrors.phone && Array.isArray(formErrors.phone) && formErrors.phone.map((msg, idx) => (
                  <div className="text-red-400 text-xs mt-1" key={idx}>{msg}</div>
                ))}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-pink-300 mb-2">
                  {t("event_manager.create_collaborator.password")} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 pr-12 text-white placeholder-pink-400 ${formErrors.password?.length ? 'border-red-500' : 'border-pink-500/30'}`}
                    placeholder={t("event_manager.create_collaborator.enterPassword")}
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-pink-300 hover:text-pink-400 focus:outline-none"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {formErrors.password && Array.isArray(formErrors.password) && formErrors.password.map((msg, idx) => (
                  <div className="text-red-400 text-xs mt-1" key={idx}>{msg}</div>
                ))}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-pink-300 mb-2">
                  {t("event_manager.create_collaborator.fullName")} *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-white placeholder-pink-400 ${formErrors.fullName?.length ? 'border-red-500' : 'border-pink-500/30'}`}
                  placeholder={t("event_manager.create_collaborator.fullNamePlaceholder")}
                />
                {formErrors.fullName && Array.isArray(formErrors.fullName) && formErrors.fullName.map((msg, idx) => (
                  <div className="text-red-400 text-xs mt-1" key={idx}>{msg}</div>
                ))}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-bold text-pink-300 mb-2">
                  {t("event_manager.create_collaborator.dateOfBirth")} *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={`w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-white placeholder-pink-400 ${formErrors.dateOfBirth?.length ? 'border-red-500' : 'border-pink-500/30'}`}
                />
                {formErrors.dateOfBirth && Array.isArray(formErrors.dateOfBirth) && formErrors.dateOfBirth.map((msg, idx) => (
                  <div className="text-red-400 text-xs mt-1" key={idx}>{msg}</div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/event-manager/collaborators')}
                className="px-8 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-500 transition-all duration-200 font-bold"
              >
                {t("event_manager.create_collaborator.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500 text-white rounded-xl font-bold transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                <FaSave />
                {isSubmitting ? t("event_manager.create_collaborator.creating") : t("event_manager.create_collaborator.createCollaborator")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
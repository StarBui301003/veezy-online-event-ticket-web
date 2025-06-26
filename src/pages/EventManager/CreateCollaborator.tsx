import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createCollaboratorAccount, addCollaborator, getEventById } from '@/services/Event Manager/event.service';
import { toast } from 'react-toastify';
import { FaUsers, FaSave } from "react-icons/fa";

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

const CreateCollaborator = () => {
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
          toast.error("Không thể tải thông tin sự kiện!");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserAccountId) {
      toast.warn('Không thể xác định người quản lý sự kiện. Vui lòng đăng nhập lại.');
      return;
    }

    // Validate form data
    if (!formData.username || !formData.email || !formData.phone || !formData.password || !formData.fullName || !formData.dateOfBirth) {
      toast.warn('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Create collaborator account
      const accountData = {
        ...formData,
        emId: currentUserAccountId
      };
      
      const accountResult = await createCollaboratorAccount(accountData);
      
      if (accountResult.flag && accountResult.data?.accountId) {
        // If an eventId was provided, proceed to add them to the event
        if (eventId) {
          const addResult = await addCollaborator(eventId, accountResult.data.accountId);
          if (addResult.flag) {
            toast.success('Tạo và thêm cộng tác viên vào sự kiện thành công!');
            navigate('/event-manager/collaborators');
          } else {
            toast.warn(`Tài khoản đã được tạo, nhưng không thể thêm vào sự kiện: ${addResult.message}`);
            navigate('/event-manager/collaborators');
          }
        } else {
          // If no eventId, the job is done
          toast.success('Tạo tài khoản cộng tác viên thành công!');
          navigate('/event-manager/collaborators');
        }
      } else {
        toast.error(accountResult.message || 'Tạo tài khoản cộng tác viên thất bại.');
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra.');
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
        <div className="text-white text-xl">Đang tải...</div>
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
                Tạo Cộng Tác Viên Mới
              </h1>
              {event && (
                <p className="text-slate-300 mt-2">
                  Tạo tài khoản và thêm vào sự kiện: <span className="text-yellow-300 font-semibold">{event.eventName}</span>
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
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-pink-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                  placeholder="email@example.com"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-pink-300 mb-2">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                  placeholder="0123456789"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-pink-300 mb-2">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-pink-300 mb-2">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                  placeholder="Họ và tên đầy đủ"
                  required
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-bold text-pink-300 mb-2">
                  Ngày sinh *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/event-manager/collaborators')}
                className="px-8 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-500 transition-all duration-200 font-bold"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500 text-white rounded-xl font-bold transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                <FaSave />
                {isSubmitting ? "Đang tạo..." : "Tạo cộng tác viên"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCollaborator; 
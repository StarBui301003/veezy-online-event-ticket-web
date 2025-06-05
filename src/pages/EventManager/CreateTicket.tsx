import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createTicket } from "@/services/Event Manager/event.service";
import { FaTicketAlt, FaImage, FaMoneyBill, FaHashtag, FaCalendarAlt, FaSortNumericUp, FaExchangeAlt } from "react-icons/fa";

const defaultTicket = {
  name: "",
  description: "",
  price: 0,
  quantity: 1,
  saleStartTime: "",
  saleEndTime: "",
  maxTicketsPerOrder: 1,
  isTransferable: false,
  imageUrl: "",
};

export default function CreateTicket() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...defaultTicket });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = URL.createObjectURL(file); // Sử dụng URL.createObjectURL để tạo URL tạm
      setForm((prev) => ({ ...prev, imageUrl: url }));
    } finally {
      setUploading(false);
    }
  };

        const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
    
      // Validate dữ liệu đầu vào
      if (!form.name.trim()) return setError("Tên vé không được để trống!");
      if (!form.quantity || form.quantity < 1 || form.quantity > 2147483647) {
        return setError("Số lượng vé phải nằm trong khoảng từ 1 đến 2147483647!");
      }
      if (!form.description.trim()) return setError("Mô tả vé không được để trống!");
      if (!form.price || form.price < 0) return setError("Giá vé phải >= 0!");
      if (!form.saleStartTime || !form.saleEndTime) {
        return setError("Chọn thời gian mở bán và kết thúc!");
      }
      if (form.saleStartTime >= form.saleEndTime) {
        return setError("Thời gian kết thúc phải sau thời gian mở bán!");
      }
      if (!eventId) return setError("Không tìm thấy sự kiện!");
    
      try {
        const payload = {
          eventId,
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          quantity: Number(form.quantity),
          saleStartTime: new Date(form.saleStartTime).toISOString(),
          saleEndTime: new Date(form.saleEndTime).toISOString(),
          maxTicketsPerOrder: Number(form.maxTicketsPerOrder),
          isTransferable: form.isTransferable,
          imageUrl: form.imageUrl || null,
        };
    
        const response = await createTicket(payload);
    
        if (response.status === 200) {
          setSuccess("Tạo vé thành công!");
          setTimeout(() => navigate(-1), 1200); // Quay lại trang trước đó sau 1.2 giây
        } else {
          setError("Tạo vé thất bại! Vui lòng thử lại.");
        }
      } catch (err: any) {
        // Hiển thị lỗi từ API nếu có
        const apiErrors = err?.response?.data?.errors;
        if (apiErrors) {
          if (apiErrors.Name) setError(apiErrors.Name[0]);
          else if (apiErrors.Quantity) setError(apiErrors.Quantity[0]);
          else if (apiErrors.Description) setError(apiErrors.Description[0]);
          else setError("Tạo vé thất bại! Vui lòng thử lại.");
        } else {
          setError(err?.response?.data?.message || "Tạo vé thất bại!");
        }
      }
    };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] py-0 px-0">
      <div className="w-full flex justify-center items-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-5xl bg-gradient-to-br from-[#2d0036] via-[#3a0ca3]/80 to-[#ff008e]/80 rounded-3xl shadow-2xl border-2 border-pink-500/30 p-16 space-y-10 animate-fade-in my-12 mx-4"
          style={{ boxShadow: "0 0 80px 0 #ff008e88" }}
        >
          <div className="flex items-center gap-3 mb-8">
            <FaTicketAlt className="text-4xl text-pink-400 drop-shadow-glow" />
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent tracking-wide uppercase">
              Tạo loại vé mới
            </h2>
          </div>

          {/* Tên vé */}
          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaHashtag /> Tên vé
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              placeholder="Nhập tên vé (VD: Vé VIP, Vé thường...)"
              required
            />
          </div>

          {/* Mô tả vé */}
          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaTicketAlt /> Mô tả vé
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              placeholder="Nhập mô tả vé"
              required
            />
          </div>

          {/* Giá vé */}
          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaMoneyBill /> Giá vé (VNĐ)
            </label>
            <input
              name="price"
              type="number"
              min={0}
              value={form.price}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              placeholder="Nhập giá vé"
              required
            />
          </div>

          {/* Số lượng vé */}
          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaSortNumericUp /> Số lượng vé
            </label>
            <input
              name="quantity"
              type="number"
              min={1}
              value={form.quantity}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              placeholder="Nhập số lượng vé"
              required
            />
          </div>

          {/* Thời gian mở bán */}
          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaCalendarAlt /> Thời gian mở bán
            </label>
            <input
              name="saleStartTime"
              type="datetime-local"
              value={form.saleStartTime}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          {/* Thời gian kết thúc bán */}
          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaCalendarAlt /> Thời gian kết thúc bán
            </label>
            <input
              name="saleEndTime"
              type="datetime-local"
              value={form.saleEndTime}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          {/* Số vé tối đa mỗi đơn */}
          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaExchangeAlt /> Số vé tối đa mỗi đơn
            </label>
            <input
              name="maxTicketsPerOrder"
              type="number"
              min={1}
              value={form.maxTicketsPerOrder}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              placeholder="Số vé tối đa mỗi đơn"
              required
            />
          </div>

          {/* Vé có thể chuyển nhượng */}
          <div className="flex items-center gap-3">
            <input
              name="isTransferable"
              type="checkbox"
              checked={form.isTransferable}
              onChange={handleChange}
              id="isTransferable"
              className="w-5 h-5 accent-pink-500 rounded"
            />
            <label htmlFor="isTransferable" className="font-bold text-pink-300 flex items-center gap-2">
              Vé có thể chuyển nhượng
            </label>
          </div>

          {/* Ảnh minh họa */}
          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaImage /> Ảnh minh họa (tùy chọn)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                id="ticket-image"
                className="hidden"
                onChange={handleImageChange}
              />
              <label
                htmlFor="ticket-image"
                className="bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500 text-white px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 font-bold shadow-lg"
              >
                {uploading ? "Đang tải..." : "Chọn ảnh"}
              </label>
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="ticket"
                  className="h-16 w-24 object-cover rounded-xl border-2 border-pink-400 shadow-lg"
                />
              )}
            </div>
          </div>

          {/* Hiển thị lỗi hoặc thành công */}
          {error && (
            <div className="bg-red-100 text-red-700 rounded-lg px-4 py-3 font-bold text-center shadow-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 text-green-700 rounded-lg px-4 py-3 font-bold text-center shadow-lg">
              {success}
            </div>
          )}

          {/* Nút tạo vé */}
          <button
            type="submit"
            className="w-full py-4 mt-4 text-xl font-extrabold bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500 text-white rounded-2xl shadow-xl transition-all duration-200 tracking-widest uppercase drop-shadow-glow"
          >
            <FaTicketAlt className="inline mr-2" />
            Tạo vé ngay!
          </button>
        </form>
      </div>
    </div>
  );
}
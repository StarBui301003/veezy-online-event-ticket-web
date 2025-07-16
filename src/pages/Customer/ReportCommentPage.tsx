import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportComment } from '@/services/Admin/report.service';
import { toast } from 'react-toastify';

export default function ReportCommentPage() {
  const { commentId } = useParams<{ commentId: string }>();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentId) return;
    setLoading(true);
    try {
      await reportComment(commentId, reason, description);
      toast.success('Báo cáo thành công!');
      navigate(-1); // Quay lại trang trước
    } catch {
      toast.error('Báo cáo thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-red-600">Báo cáo bình luận</h2>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Lý do <span className="text-red-500">*</span></label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
            placeholder="Nhập lý do báo cáo"
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Mô tả chi tiết</label>
          <textarea
            className="border rounded px-2 py-1 w-full"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Mô tả chi tiết (không bắt buộc)"
            disabled={loading}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-300 rounded"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || !reason.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition"
          >
            {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
          </button>
        </div>
      </form>
    </div>
  );
} 
import { useState, useEffect } from 'react';
import SimpleModal from '../common/SimpleModal';
import { Button } from '@/components/ui/button';
import { reportComment, reportEvent, reportNews } from '@/services/Admin/report.service';
import { toast } from 'react-toastify';

const REASONS = [
  'Nội dung không phù hợp',
  'Spam/quảng cáo',
  'Ngôn từ thù địch',
  'Thông tin sai sự thật',
  'Khác',
];

type TargetType = 'event' | 'news' | 'comment';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: TargetType;
  targetId: string;
}

export default function ReportModal({ open, onClose, targetType, targetId }: ReportModalProps) {
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason(REASONS[0]);
      setDescription('');
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (targetType === 'comment') {
        await reportComment(targetId, reason, description);
      } else if (targetType === 'event') {
        await reportEvent(targetId, reason, description);
      } else if (targetType === 'news') {
        await reportNews(targetId, reason, description);
      }
      toast.success('Báo cáo thành công!');
      onClose();
    } catch (err: unknown) {
      let msg = 'Báo cáo thất bại!';
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: unknown }).response === 'object' &&
        (err as { response?: { data?: unknown } }).response !== null &&
        'data' in (err as { response: { data?: unknown } }).response &&
        typeof ((err as { response: { data?: unknown } }).response as { data?: unknown }).data === 'object' &&
        ((err as { response: { data: { message?: unknown } } }).response.data !== null) &&
        'message' in (err as { response: { data: { message?: unknown } } }).response.data &&
        typeof ((err as { response: { data: { message?: unknown } } }).response.data as { message?: unknown }).message === 'string'
      ) {
        msg = ((err as { response: { data: { message: string } } }).response.data.message);
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SimpleModal open={open} onClose={onClose}>
      <div className="text-white max-w-md w-full rounded-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">
          {targetType === 'event' ? 'Báo cáo sự kiện' : targetType === 'news' ? 'Báo cáo tin tức' : 'Báo cáo bình luận'}
        </h2>
        <div className="text-slate-200 mb-4">
          Vui lòng chọn lý do và mô tả chi tiết nếu cần để gửi báo cáo này tới quản trị viên.
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 font-semibold text-purple-200">Lý do</label>
            <select
              className="w-full rounded-lg px-3 py-2 bg-slate-800 text-white border border-purple-700 focus:ring-2 focus:ring-purple-400 outline-none transition"
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
            >
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold text-purple-200">Mô tả chi tiết</label>
            <textarea
              className="w-full rounded-lg px-3 py-2 min-h-[80px] bg-slate-800 text-white border border-purple-700 focus:ring-2 focus:ring-purple-400 outline-none transition"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Nhập mô tả chi tiết (tuỳ chọn)"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading} className="bg-slate-700 text-white hover:bg-slate-600 border border-slate-600">Huỷ</Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-700 hover:to-indigo-700 shadow-lg">
              {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
            </Button>
          </div>
        </form>
      </div>
    </SimpleModal>
  );
} 
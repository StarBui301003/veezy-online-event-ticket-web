import { useState, useEffect } from 'react';
import SimpleModal from '../common/SimpleModal';
import { Button } from '@/components/ui/button';
import { reportComment, reportEvent, reportNews, reportEventManager } from '@/services/Admin/report.service';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

const REASONS = [
  'Nội dung không phù hợp',
  'Spam/quảng cáo',
  'Ngôn từ thù địch',
  'Thông tin sai sự thật',
  'Khác',
];

type TargetType = 'event' | 'news' | 'comment' | 'eventmanager';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: TargetType;
  targetId: string;
}

export default function ReportModal({ open, onClose, targetType, targetId }: ReportModalProps) {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
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
      } else if (targetType === 'eventmanager') {
        await reportEventManager(targetId, reason, description);
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
        typeof ((err as { response: { data?: unknown } }).response as { data?: unknown }).data ===
          'object' &&
        (err as { response: { data: { message?: unknown } } }).response.data !== null &&
        'message' in (err as { response: { data: { message?: unknown } } }).response.data &&
        typeof (
          (err as { response: { data: { message?: unknown } } }).response.data as {
            message?: unknown;
          }
        ).message === 'string'
      ) {
        msg = (err as { response: { data: { message: string } } }).response.data.message;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getTargetName = () => {
    const names = {
      event: 'Sự kiện',
      news: 'Tin tức',
      comment: 'Bình luận',
      eventmanager: 'Quản lý sự kiện'
    };
    return names[targetType] || 'Nội dung';
  };

  return (
    <SimpleModal open={open} onClose={onClose}>
      <div className={cn(
        'max-w-xs w-full rounded-xl',
        getThemeClass(
          'bg-white/95 border border-gray-200 shadow-lg',
          'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-purple-700'
        )
      )}>
        <div className="p-3">
          <h2 className={cn('text-xl font-bold mb-3', getThemeClass('text-gray-900', 'text-white'))}>
            Báo cáo {getTargetName()}
          </h2>
          
          <div className={cn('mb-4 p-3 rounded-lg text-sm', getThemeClass('bg-yellow-50 text-yellow-800', 'bg-yellow-900/20 text-yellow-300'))}>
            <strong>Lưu ý:</strong> Vui lòng chọn lý do phù hợp và mô tả chi tiết để chúng tôi có thể xử lý báo cáo một cách hiệu quả nhất.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={cn('block mb-2 text-sm font-semibold', getThemeClass('text-gray-700', 'text-purple-200'))}>
                Lý do báo cáo <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {REASONS.map((r) => (
                  <label
                    key={r}
                    className={cn(
                      'flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-colors',
                      reason === r
                        ? getThemeClass(
                            'border-blue-500 bg-blue-50 text-blue-900',
                            'border-purple-500 bg-purple-900/30 text-purple-100'
                          )
                        : getThemeClass(
                            'border-gray-200 hover:border-gray-300 text-gray-700',
                            'border-slate-700 hover:border-slate-600 text-slate-300'
                          )
                    )}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                      className={cn(
                        'w-4 h-4',
                        getThemeClass('text-blue-600', 'text-purple-500')
                      )}
                    />
                    <span className="text-xs">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={cn('block mb-2 text-sm font-semibold', getThemeClass('text-gray-700', 'text-purple-200'))}>
                Mô tả chi tiết (không bắt buộc)
              </label>
              <textarea
                className={cn(
                  'w-full rounded-lg px-2 py-1 min-h-[50px] border focus:ring-2 outline-none transition resize-none text-xs',
                  getThemeClass(
                    'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
                    'bg-slate-800 text-white border-purple-700 placeholder-slate-400 focus:ring-purple-400'
                  )
                )}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Vui lòng mô tả cụ thể vấn đề bạn gặp phải..."
                maxLength={500}
              />
              <div className={cn('text-xs text-right mt-1', getThemeClass('text-gray-400', 'text-slate-500'))}>
                {description.length}/500 ký tự
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                className={cn(
                  'flex-1 font-semibold transition-colors',
                  getThemeClass(
                    'bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-300',
                    'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600'
                  )
                )}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  'flex-1 font-semibold shadow-lg transition-colors',
                  getThemeClass(
                    'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700',
                    'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                  )
                )}
              >
                {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </SimpleModal>
  );
}
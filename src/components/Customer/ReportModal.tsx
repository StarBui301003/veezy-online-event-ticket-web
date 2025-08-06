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

  return (
    <SimpleModal open={open} onClose={onClose}>
      <div className={cn(
          'max-w-md w-full rounded-2xl',
          getThemeClass(
            'bg-white/95 border border-gray-200 shadow-lg',
            'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-purple-700'
          )
        )}>
        <h2 className={cn('text-2xl font-bold mb-2', getThemeClass('text-gray-900', 'text-white'))}>
          {targetType === 'event'
            ? t('reportEvent') 
            : targetType === 'news' 
              ? t('reportNews') 
              : targetType === 'eventmanager'
                ? t('reportEventManager')
                : t('reportComment')}
        </h2>
        <div className={cn('mb-4', getThemeClass('text-gray-600', 'text-slate-200'))}>
          Vui lòng chọn lý do và mô tả chi tiết nếu cần để gửi báo cáo này tới quản trị viên.
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className={cn(
                'block mb-1 font-semibold',
                getThemeClass('text-gray-700', 'text-purple-200')
              )}
            >
              {t('reportReason')}
            </label>
            <select
              className={cn(
                'w-full rounded-lg px-3 py-2 border focus:ring-2 outline-none transition',
                getThemeClass(
                  'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500',
                  'bg-slate-800 text-white border-purple-700 focus:ring-purple-400'
                )
              )}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className={cn(
                'block mb-1 font-semibold',
                getThemeClass('text-gray-700', 'text-purple-200')
              )}
            >
              {t('reportDescription')}
            </label>
            <textarea
              className={cn(
                'w-full rounded-lg px-3 py-2 min-h-[80px] border focus:ring-2 outline-none transition',
                getThemeClass(
                  'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
                  'bg-slate-800 text-white border-purple-700 placeholder-slate-400 focus:ring-purple-400'
                )
              )}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('reportDescriptionPlaceholder')}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className={cn(
                'font-semibold transition-colors',
                getThemeClass(
                  'bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-300',
                  'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600'
                )
              )}
            >
              {t('reportCancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                'font-semibold shadow-lg transition-colors',
                getThemeClass(
                  'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700',
                  'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                )
              )}
            >
              {loading ? t('reportSending') : t('reportSend')}
            </Button>
          </div>
        </form>
      </div>
    </SimpleModal>
  );
}

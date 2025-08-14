// Component: ReportModal.tsx

import { useState, useEffect, FormEvent } from 'react';
import SimpleModal from '../common/SimpleModal';
import { Button } from '@/components/ui/button';
import {
  reportComment,
  reportEvent,
  reportNews,
  reportEventManager,
} from '@/services/Event Manager/report.service';
import { toast } from 'react-toastify';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

type ReportTarget = 'event' | 'news' | 'comment' | 'eventmanager';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: ReportTarget;
  targetId: string;
  onLoginRequired?: () => void;
}

// Interface này khớp với tài liệu API
interface ReportDto {
  reason: string;
  description: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  open,
  onClose,
  targetType,
  targetId,
  onLoginRequired,
}) => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Get reasons from translation
  const reasons = t('reportModal.reasons', { returnObjects: true }) as string[];

  useEffect(() => {
    if (!open) {
      setReason(reasons[0] || '');
      setDescription('');
      setLoading(false);
    }
  }, [open, reasons]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accStr = localStorage.getItem('account');
      if (!accStr) {
        onLoginRequired?.();
        setLoading(false);
        return;
      }

      // Tạo đối tượng phẳng (flat object) đúng như API yêu cầu
      const reportData: ReportDto = {
        reason,
        description: description || reason, // Sử dụng reason làm mặc định nếu description rỗng
      };

      let response;
      switch (targetType) {
        case 'event':
          response = await reportEvent(targetId, reportData);
          break;
        case 'news':
          response = await reportNews(targetId, reportData);
          break;
        case 'comment':
          // Đảm bảo gọi đúng API endpoint cho báo cáo bình luận
          response = await reportComment(targetId, reportData);
          break;
        case 'eventmanager':
          response = await reportEventManager(targetId, reportData);
          break;
        default:
          throw new Error('Invalid report target type');
      }

      if (response) {
        toast.success(t('reportModal.success'));
        onClose();
      }
    } catch (error: unknown) {
      console.error('Error submitting report:', error);

      if (typeof error === 'object' && error !== null) {
        const err = error as { response?: { status?: number; data?: { message?: string } } };

        if (err.response?.status === 401) {
          onLoginRequired?.();
        } else {
          const errorMessage = err.response?.data?.message || t('reportModal.error');
          toast.error(errorMessage);
        }
      } else {
        toast.error(t('reportModal.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const getTargetName = (): string => {
    const names: Record<ReportTarget, string> = {
      event: t('Event'),
      news: t('newss'),
      comment: t('commentDiscussion'),
      eventmanager: t('reportEventManager'),
    };
    return names[targetType] || t('content');
  };

  const targetName = getTargetName();

  return (
    <SimpleModal open={open} onClose={onClose}>
      <div
        className={cn(
          'max-w-xs w-full rounded-xl',
          getThemeClass(
            'bg-white/95 border border-gray-200 shadow-lg',
            'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-purple-700'
          )
        )}
        role="dialog"
        aria-labelledby="report-modal-title"
        aria-describedby="report-modal-description"
      >
        <div className="p-3">
          <h2
            id="report-modal-title"
            className={cn('text-xl font-bold mb-3', getThemeClass('text-gray-900', 'text-white'))}
          >
            {t('reportModal.title', { target: targetName })}
          </h2>

          <div
            id="report-modal-description"
            className={cn(
              'mb-4 p-3 rounded-lg text-sm',
              getThemeClass('bg-yellow-50 text-yellow-800', 'bg-yellow-900/20 text-yellow-300')
            )}
            dangerouslySetInnerHTML={{ __html: t('reportModal.note') }}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset>
              <legend
                className={cn(
                  'block mb-2 text-sm font-semibold',
                  getThemeClass('text-gray-700', 'text-purple-200')
                )}
                dangerouslySetInnerHTML={{ __html: t('reportModal.reasonLabel') }}
              />
              <div className="space-y-2">
                {reasons.map((r) => (
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
                      onChange={() => setReason(r)}
                      className={cn('w-4 h-4', getThemeClass('text-blue-600', 'text-purple-500'))}
                      aria-label={`${t('reportModal.reasonLabel')}: ${r}`}
                    />
                    <span className="text-xs">{r}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="report-description"
                className={cn(
                  'block mb-2 text-sm font-semibold',
                  getThemeClass('text-gray-700', 'text-purple-200')
                )}
              >
                {t('reportModal.descriptionLabel')}
              </label>
              <textarea
                id="report-description"
                className={cn(
                  'w-full rounded-lg px-2 py-1 min-h-[50px] border focus:ring-2 outline-none transition resize-none text-xs',
                  getThemeClass(
                    'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
                    'bg-slate-800 text-white border-purple-700 placeholder-slate-400 focus:ring-purple-400'
                  )
                )}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('reportModal.descriptionPlaceholder')}
                maxLength={500}
                aria-describedby="char-count"
              />
              <div
                id="char-count"
                className={cn(
                  'text-xs text-right mt-1',
                  getThemeClass('text-gray-400', 'text-slate-500')
                )}
              >
                {t('reportModal.charCount', { count: description.length })}
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
                aria-label={t('reportModal.cancelButton')}
              >
                {t('reportModal.cancelButton')}
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
                aria-label={t('reportModal.submitButton')}
                aria-busy={loading}
              >
                {loading ? t('reportModal.submitting') : t('reportModal.submitButton')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </SimpleModal>
  );
};

export default ReportModal;

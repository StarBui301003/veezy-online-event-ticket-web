import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportComment } from '@/services/Admin/report.service';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

export default function ReportCommentPage() {
  const { commentId } = useParams<{ commentId: string }>();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // No realtime connection needed for this page
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentId) return;
    setLoading(true);
    try {
      await reportComment(commentId, reason, description);
      toast.success(t('reportSuccess'));
      navigate(-1); // Quay lại trang trước
    } catch {
      toast.error(t('reportFailure'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-red-600">{t('reportComment')}</h2>
        <div className="mb-4">
          <label className="block mb-1 font-medium">{t('reason')} <span className="text-red-500">*</span></label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
            placeholder={t('enterReportReason')}
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">{t('detailedDescription')}</label>
          <textarea
            className="border rounded px-2 py-1 w-full"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder={t('detailedDescriptionPlaceholder')}
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
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={loading || !reason.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition"
          >
            {loading ? t('sending') : t('sendReport')}
          </button>
        </div>
      </form>
    </div>
  );
} 
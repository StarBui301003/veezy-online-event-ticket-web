import { useState } from 'react';
import {
  exportAnalyticsExcel,
  getEventManagerDashboard,
} from '@/services/Event Manager/event.service';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export default function ExportButtons() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      // Export mặc định: dashboard, ThisMonth, default language
      const period = 3; // ThisMonth
      const groupBy = 1; // Day
      const dash = await getEventManagerDashboard({ period, groupBy });
      const blob = await exportAnalyticsExcel('dashboard', dash.data, { period, groupBy }, 0);
      const today = format(new Date(), 'yyyyMMdd');
      const fileName = `event-analytics-dashboard-${today}.csv`;
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-0">
      <button
        type="button"
        disabled={loading}
        className="flex gap-2 items-center border-2 border-green-500 bg-green-500 rounded-full cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-green-600 hover:text-white hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleExportExcel}
      >
        <Download className="w-4 h-4" />
        {loading ? 'Exporting...' : t('exportExcel')}
      </button>
    </div>
  );
}

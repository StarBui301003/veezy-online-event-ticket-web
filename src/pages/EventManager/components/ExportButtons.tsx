import { useState } from 'react';
import { exportAnalyticsExcel, getEventManagerDashboard } from '@/services/Event Manager/event.service';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

export default function ExportButtons() {
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
      <Button
        onClick={handleExportExcel}
        disabled={loading}
        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 text-base rounded-full min-h-0 min-w-0 flex items-center"
        style={{ height: 44 }} // Đảm bảo bằng với chuông (w-11 h-11 = 44px)
      >
        <Download className="mr-2" size={20} /> Xuất Excel
      </Button>
    </div>
  );
} 
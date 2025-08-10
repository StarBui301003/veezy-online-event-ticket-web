import { useState, memo } from 'react';
import { exportAnalyticsExcel } from '@/services/Event Manager/event.service';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export interface ExportButtonsProps {
  period?: number;
  groupBy?: number;
  startDate?: string;
  endDate?: string;
  dashboardData?: any; // Pass the dashboard data if already loaded
}

const ExportButtons = memo(({ 
  period = 3, // Default to ThisMonth
  groupBy = 1, // Default to Day
  startDate = '',
  endDate = '',
  dashboardData = null
}: ExportButtonsProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportExcel = async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // If we already have the dashboard data, use it directly
      if (dashboardData) {
        await exportData(dashboardData);
        return;
      }
      
      // Otherwise, fetch the data first
      const { getEventManagerDashboard } = await import('@/services/Event Manager/event.service');
      const response = await getEventManagerDashboard({
        period,
        groupBy,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      
      if (response && response.data) {
        await exportData(response.data);
      } else {
        throw new Error('Invalid dashboard data');
      }
    } catch (err) {
      console.error('Export failed:', err);
      setError(t('exportFailed') || 'Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (data: any) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const periodText = 
      period === 1 ? 'day' : 
      period === 2 ? 'week' : 
      period === 3 ? 'month' : 'custom';
      
    let fileName = `event-analytics-${periodText}-${today}`;
    
    // Add date range if it's a custom period
    if (startDate && endDate) {
      const start = format(new Date(startDate), 'yyyyMMdd');
      const end = format(new Date(endDate), 'yyyyMMdd');
      fileName = `event-analytics-${start}-to-${end}`;
    }
    
    fileName += '.csv';
    
    const blob = await exportAnalyticsExcel(
      'dashboard', 
      data, 
      { 
        period, 
        groupBy,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      }, 
      0 // language code
    );
    
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="mb-0">
      <button
        type="button"
        disabled={loading}
        className={[
          'flex gap-2 items-center border-2 border-green-500 rounded-full cursor-pointer px-5 py-2',
          'transition-all duration-200 text-[16px] font-semibold',
          loading 
            ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed' 
            : 'bg-green-500 text-white hover:bg-green-600 hover:border-green-600',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        ].join(' ')}
        onClick={handleExportExcel}
      >
        <Download className="w-4 h-4" />
        {loading ? t('exporting') || 'Exporting...' : t('exportExcel') || 'Export Excel'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
});

ExportButtons.displayName = 'ExportButtons';

export default ExportButtons;

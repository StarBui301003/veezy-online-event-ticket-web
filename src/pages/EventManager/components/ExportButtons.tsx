import { useState, memo } from 'react';
import instance from '@/services/axios.customize';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export interface ExportButtonsProps {
  period?: number;
  startDate?: string;
  endDate?: string;
}

const ExportButtons = memo(({ 
  period = 3, // Default to ThisMonth
  startDate = '',
  endDate = ''
}: ExportButtonsProps) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportExcel = async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await exportData();
    } catch (err) {
      console.error('Export failed:', err);
      setError(t('exportFailed') || 'Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
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
    
    fileName += '.xlsx';

    // Map i18n language to API language parameter
    // 0: Vietnamese (vi), 1: English (en)
    const languageMap: { [key: string]: number } = {
      'vi': 0,
      'en': 1
    };
    
    const languageParam = languageMap[i18n.language] || 0; // Default to Vietnamese if language not found

    // Call the GET endpoint with language parameter
    const response = await instance.get('/api/analytics/eventManager/analytics/export/excel', {
      params: {
        language: languageParam
      },
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
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

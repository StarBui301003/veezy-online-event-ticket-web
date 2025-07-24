import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useTranslation } from 'react-i18next';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface CompareDataPoint {
  label: string;
  current: number;
  previous: number;
}



export default function PerformanceCompareChart({ filter }: { filter?: { CustomStartDate: string; CustomEndDate: string; GroupBy: number } }) {
  const { t } = useTranslation();
  const [dataPoints, setDataPoints] = useState<CompareDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!filter) return;
    setLoading(true);
    const res = await fetch(`/api/analytics/eventManager/performance/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
      body: JSON.stringify({
        currentPeriod: filter.GroupBy,
        comparisonPeriod: filter.GroupBy === 1 ? 2 : 1
      })
    });
    const data = await res.json();
    setDataPoints((data.data?.points || []).slice(0, 10));
    setLoading(false);
  };

  useEffect(() => {
    if (!filter) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter?.CustomStartDate, filter?.CustomEndDate, filter?.GroupBy]);

  if (!filter) return <div className="mb-10">{t('loadingPerformanceChart')}</div>;
  if (loading) return <div className="mb-10">{t('loadingPerformanceChart')}</div>;
  if (dataPoints.length === 0) return <div className="mb-10">{t('noPerformanceData')}</div>;

  const chartData = {
    labels: dataPoints.map(p => p.label),
    datasets: [
      {
        label: t('currentPeriod'),
        data: dataPoints.map(p => p.current),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
      },
      {
        label: t('previousPeriod'),
        data: dataPoints.map(p => p.previous),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#fff' } },
      title: { display: true, text: t('performanceCompareChart'), color: '#fff', font: { size: 18 } },
      tooltip: { callbacks: { label: (ctx: import('chart.js').TooltipItem<'line'>) => `${ctx.dataset.label}: ${ctx.parsed.y}` } }
    },
    scales: {
      x: { ticks: { color: '#fff' } },
      y: { ticks: { color: '#fff' }, beginAtZero: true }
    }
  };

  return (
    <div className="mb-10 bg-gradient-to-br from-[#2d0036]/80 to-[#3a0ca3]/80 rounded-2xl p-6 border-2 border-green-500/30 shadow-2xl">
      <Line data={chartData} options={options} />
    </div>
  );
} 
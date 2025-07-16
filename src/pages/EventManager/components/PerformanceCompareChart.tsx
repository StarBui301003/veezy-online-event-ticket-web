import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { comparePerformance } from '@/services/Event Manager/event.service';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface CompareDataPoint {
  label: string;
  current: number;
  previous: number;
}

export default function PerformanceCompareChart() {
  const [dataPoints, setDataPoints] = useState<CompareDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    // So sánh hiệu suất tuần này (3) với tuần trước (4)
    const res = await comparePerformance(3, 4);
    // Giả sử API trả về dạng: { data: { points: [{ label, current, previous }] } }
    setDataPoints(res.data?.points || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="mb-10">Đang tải biểu đồ so sánh hiệu suất...</div>;
  if (dataPoints.length === 0) return <div className="mb-10">Không có dữ liệu so sánh hiệu suất.</div>;

  const chartData = {
    labels: dataPoints.map(p => p.label),
    datasets: [
      {
        label: 'Kỳ hiện tại',
        data: dataPoints.map(p => p.current),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Kỳ trước',
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
      title: { display: true, text: 'So sánh hiệu suất', color: '#fff', font: { size: 18 } },
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
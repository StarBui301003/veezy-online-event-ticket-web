/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { getEventManagerDashboard } from '@/services/Event Manager/event.service';
import { useTranslation } from 'react-i18next';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

export default function RevenueChartSection() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<{ eventName: string; revenue: number }[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    const dash = await getEventManagerDashboard();
    const revenueByEvent = dash.data?.financial?.revenueByEvent || [];
    setEvents(revenueByEvent.map((e: any) => ({ eventName: e.eventName, revenue: e.revenue })));
    setTimeline(dash.data?.financial?.revenueTimeline || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="mb-10">{t('loadingRevenueChart')}</div>;
  if (events.length === 0 && timeline.length === 0) return <div className="mb-10">{t('noRevenueData')}</div>;

  // Biểu đồ doanh thu từng sự kiện
  const data = {
    labels: events.map(e => e.eventName),
    datasets: [
      {
        label: t('revenue'),
        data: events.map(e => e.revenue),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: t('revenueByEvent'), color: '#fff', font: { size: 18 } },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('vi-VN')}₫` } }
    },
    scales: {
      x: { ticks: { color: '#fff' } },
      y: { ticks: { color: '#fff' }, beginAtZero: true }
    }
  };


  const timelineData = {
    labels: timeline.map(item => item.periodLabel),
    datasets: [
      {
        label: t('revenue'),
        data: timeline.map(item => item.revenue),
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: t('transactionCount'),
        data: timeline.map(item => item.transactionCount),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
        tension: 0.4,
        yAxisID: 'y1',
      }
    ]
  };

  const timelineOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: "#fff" } },
      title: {
        display: true,
        text: t('revenueTimeline'),
        color: "#fff",
        font: { size: 18 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.formattedValue} VNĐ`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#fff" },
      },
      y: {
        ticks: { color: "#fff" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="mb-10">
      {events.length > 0 && (
        <div className="mb-10 bg-gradient-to-br from-[#2d0036]/80 to-[#3a0ca3]/80 rounded-2xl p-6 border-2 border-blue-500/30 shadow-2xl">
          <Bar data={data} options={options} />
        </div>
      )}
      {timeline.length > 0 && (
        <div className="mb-10 bg-gradient-to-br from-yellow-400/30 to-blue-200/30 rounded-2xl p-6 border-2 border-yellow-400/30 shadow-2xl">
          <Line data={timelineData} options={timelineOptions} />
        </div>
      )}
    </div>
  );
} 
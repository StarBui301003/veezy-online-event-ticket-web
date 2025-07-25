import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, TooltipItem } from 'chart.js';
import { useTranslation } from 'react-i18next';
import { getEventManagerTicketStats } from '@/services/Event Manager/event.service';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function TicketStatsSection({ filter }: { filter: { CustomStartDate: string; CustomEndDate: string; GroupBy: number } }) {
  const { t } = useTranslation();
  const [events, setEvents] = useState<{ eventName: string; ticketsSold: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Gọi service đã customize, dùng instance chuẩn
      const res = await getEventManagerTicketStats({
        groupBy: filter.GroupBy,
        customStartDate: filter.CustomStartDate,
        customEndDate: filter.CustomEndDate,
      });
      // Tuỳ backend trả về, có thể là res.data?.ticketStats hoặc res.data
      const ticketStats = res.data?.ticketStats || res.data?.revenueByEvent || res.data || [];
      const sorted = ticketStats.sort((a: any, b: any) => b.ticketsSold - a.ticketsSold).slice(0, 10);
      setEvents(sorted);
      setLoading(false);
    }
    fetchData();
  }, [filter]);

  if (loading) return <div className="mb-10">{t('loadingTicketChart')}</div>;
  if (events.length === 0) return <div className="mb-10">{t('noTicketEvent')}</div>;

  const data = {
    labels: events.map(e => e.eventName),
    datasets: [
      {
        label: t('ticketsSold'),
        data: events.map(e => e.ticketsSold),
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: t('ticketsSoldByEvent'), color: '#fff', font: { size: 18 } },
      tooltip: { callbacks: { label: (tooltipItem: TooltipItem<'bar'>) => `${tooltipItem.dataset.label}: ${tooltipItem.parsed.y}` } }
    },
    scales: {
      x: { ticks: { color: '#fff', maxRotation: 45, minRotation: 45 } },
      y: { ticks: { color: '#fff' }, beginAtZero: true }
    }
  };

  return (
    <div className="mb-10 overflow-x-auto min-w-[700px]">
      <Bar data={data} options={options} />
    </div>
  );
}
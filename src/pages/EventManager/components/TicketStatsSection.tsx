import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, TooltipItem } from 'chart.js';
import { useTranslation } from 'react-i18next';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


export default function TicketStatsSection({ filter }: { filter: { CustomStartDate: string; CustomEndDate: string; GroupBy: number } }) {
  const { t } = useTranslation();
  const [events, setEvents] = useState<{ eventName: string; ticketsSold: number }[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    // Call ticket stats API with filter
    // Use revenueByEvent for event ticket stats
    const revenueRes = await fetch(`/api/analytics/eventManager/revenue?CustomStartDate=${filter.CustomStartDate}&CustomEndDate=${filter.CustomEndDate}&GroupBy=${filter.GroupBy}`, {
      headers: { 'accept': '*/*' }
    });
    const revenueData = await revenueRes.json();
    const revenueByEvent = revenueData.data?.revenueByEvent || [];
    // Sort by ticketsSold descending and take top 10
    type Event = { eventName: string; ticketsSold: number };
    const sorted = (revenueByEvent as Event[]).sort((a, b) => b.ticketsSold - a.ticketsSold).slice(0, 10);
    setEvents(sorted.map((e) => ({ eventName: e.eventName, ticketsSold: e.ticketsSold })));
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.CustomStartDate, filter.CustomEndDate, filter.GroupBy]);

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
import { useEffect, useState } from 'react';
import { getEventManagerDashboard } from '@/services/Event Manager/event.service';
import { useTranslation } from 'react-i18next';

interface UpcomingEvent {
  eventId: string;
  eventName: string;
  startAt: string;
  eventLocation: string;
  status?: string;
}

export default function UpcomingEventsTable() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const dash = await getEventManagerDashboard();
    setEvents(dash.data?.upcomingEvents || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="mb-10">{t('loadingUpcomingEvents')}</div>;
  if (events.length === 0) return <div className="mb-10">{t('noUpcomingEvents')}</div>;

  return (
    <div className="mb-10 bg-gradient-to-br from-[#2d0036]/80 to-[#3a0ca3]/80 rounded-2xl p-6 border-2 border-cyan-500/30 shadow-2xl">
      <h2 className="text-2xl font-bold text-cyan-300 mb-4">{t('upcomingEvents')}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-white">
          <thead>
            <tr className="border-b border-cyan-500/30">
              <th className="p-3 text-left">{t('eventName')}</th>
              <th className="p-3 text-left">{t('startTime')}</th>
              <th className="p-3 text-left">{t('eventLocation')}</th>
              <th className="p-3 text-left">{t('status')}</th>
            </tr>
          </thead>
          <tbody>
            {events.map(ev => (
              <tr key={ev.eventId} className="border-b border-cyan-500/10">
                <td className="p-3 font-semibold">{ev.eventName}</td>
                <td className="p-3">{ev.startAt ? new Date(ev.startAt).toLocaleString('vi-VN') : ''}</td>
                <td className="p-3">{ev.eventLocation}</td>
                <td className="p-3">{ev.status || t('upcoming')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
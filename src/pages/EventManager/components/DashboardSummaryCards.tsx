import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Ticket, Users, Calendar } from 'lucide-react';
// import { getEventManagerDashboard } from '@/services/Event Manager/event.service';
import { useTranslation } from 'react-i18next';

interface DashboardStats {
  totalEvents: number;
  totalRevenue: number;
  totalTicketsSold: number;
  totalAttendees: number;
}

interface DashboardSummaryCardsProps {
  filter: {
    CustomStartDate: string;
    CustomEndDate: string;
    GroupBy: number;
  };
}


export default function DashboardSummaryCards({ filter }: DashboardSummaryCardsProps) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    // Call API directly for summary
    const res = await fetch(`/api/analytics/eventManager/dashboard?CustomStartDate=${filter.CustomStartDate}&CustomEndDate=${filter.CustomEndDate}&GroupBy=${filter.GroupBy}`, {
      headers: { 'accept': '*/*' }
    });
    const dash = await res.json();
    const overview = dash.data?.overview || {};
    setStats({
      totalEvents: overview.totalEvents || 0,
      totalRevenue: overview.totalRevenue || 0,
      totalTicketsSold: overview.totalTicketsSold || 0,
      totalAttendees: overview.totalAttendees || 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.CustomStartDate, filter.CustomEndDate, filter.GroupBy]);

  if (loading || !stats) return <div>{t('loadingDashboard')}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Calendar className="text-purple-400" size={40} />
          <div>
            <div className="text-sm text-purple-300">{t('totalEvents')}</div>
            <div className="text-3xl font-bold text-purple-400">{stats.totalEvents}</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <DollarSign className="text-green-400" size={40} />
          <div>
            <div className="text-sm text-green-300">{t('totalRevenue')}</div>
            <div className="text-3xl font-bold text-green-400">{(typeof stats.totalRevenue === 'number' ? stats.totalRevenue : 0).toLocaleString('vi-VN')}₫</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Ticket className="text-blue-400" size={40} />
          <div>
            <div className="text-sm text-blue-300">{t('totalTicketsSold')}</div>
            <div className="text-3xl font-bold text-blue-400">{stats.totalTicketsSold}</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Users className="text-yellow-400" size={40} />
          <div>
            <div className="text-sm text-yellow-300">{t('totalAttendees')}</div>
            <div className="text-3xl font-bold text-yellow-400">{stats.totalAttendees}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
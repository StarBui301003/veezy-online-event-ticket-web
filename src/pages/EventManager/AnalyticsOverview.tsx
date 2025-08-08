import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Calendar, Download, Filter, Ticket, Users, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { getMyApprovedEvents, getEventFund } from '@/services/Event Manager/event.service';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  onAnalytics,
  onTicket,
  onEvent,
} from '@/services/signalr.service';

interface AnalyticsData {
  totalEvents: number;
  totalRevenue: number;
  revenueGrowth: number;
  ticketsSold: number | null;
  totalParticipants: number | null;
  totalComments: number | null;
}

export default function AnalyticsOverview() {
  const { t } = useTranslation();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
    
    // Setup enhanced realtime analytics listeners using global connections
    const setupRealtimeAnalytics = async () => {
      try {
        // SignalR connections are managed globally in App.tsx
        
        onAnalytics('OnEventManagerRealtimeOverview', (data) => {
          console.log('Realtime analytics overview:', data);
          if (data && typeof data === 'object') {
            setAnalyticsData((prev) => ({ 
              ...prev, 
              ...data,
              // Preserve existing data if new data doesn't include all fields
              totalEvents: data.totalEvents ?? prev?.totalEvents ?? 0,
              totalRevenue: data.totalRevenue ?? prev?.totalRevenue ?? 0,
              revenueGrowth: data.revenueGrowth ?? prev?.revenueGrowth ?? 0,
              ticketsSold: data.ticketsSold ?? prev?.ticketsSold,
              totalParticipants: data.totalParticipants ?? prev?.totalParticipants,
              totalComments: data.totalComments ?? prev?.totalComments
            }));
          }
        });

        onAnalytics('OnEventManagerPerformanceComparison', (data) => {
          console.log('Performance comparison update:', data);
          // Update performance-related metrics
          if (data?.revenueGrowth !== undefined) {
            setAnalyticsData(prev => prev ? { ...prev, revenueGrowth: data.revenueGrowth } : prev);
          }
        });

        onAnalytics('OnRevenueUpdate', (data) => {
          console.log('Revenue analytics update:', data);
          if (data?.totalRevenue !== undefined) {
            setAnalyticsData(prev => prev ? { ...prev, totalRevenue: data.totalRevenue } : prev);
          }
        });

        onTicket('OnTicketSoldIncremented', (data) => {
          console.log('Ticket sold - analytics update:', data);
          setAnalyticsData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              ticketsSold: (prev.ticketsSold || 0) + (data.quantity || 1),
              totalRevenue: prev.totalRevenue + (data.totalAmount || data.ticketPrice || 0)
            };
          });
        });

        onTicket('OrderCreated', (data) => {
          console.log('Order created - analytics update:', data);
          setAnalyticsData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              totalRevenue: prev.totalRevenue + (data.totalAmount || 0)
            };
          });
        });

        onTicket('AttendanceCheckedIn', (data) => {
          console.log('Attendance check-in - analytics update:', data);
          setAnalyticsData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              totalParticipants: (prev.totalParticipants || 0) + 1
            };
          });
        });

        // Event Hub listeners using global connections

        const accountStr = localStorage.getItem('account');
        const accountObj = accountStr ? JSON.parse(accountStr) : null;
        const userId = accountObj?.userId || accountObj?.accountId;

        onEvent('OnEventApproved', (data) => {
          if (data.createdBy === userId || data.CreatedBy === userId) {
            console.log('Event approved - analytics update:', data);
            setAnalyticsData(prev => {
              if (!prev) return prev;
              return { ...prev, totalEvents: prev.totalEvents + 1 };
            });
            toast.success(t('eventApprovedAnalyticsUpdated'));
          }
        });

        onEvent('OnEventCancelled', (data) => {
          if (data.createdBy === userId || data.CreatedBy === userId) {
            console.log('Event cancelled - analytics update:', data);
            setAnalyticsData(prev => {
              if (!prev) return prev;
              return { ...prev, totalEvents: Math.max(0, prev.totalEvents - 1) };
            });
            toast.warning(t('eventCancelledAnalyticsUpdated'));
          }
        });

        // No cleanup needed - global connections are managed in App.tsx
        return () => {
          // SignalR connections are handled globally
        };

      } catch (error) {
        console.error('Failed to setup realtime analytics:', error);
      }
    };

    const cleanup = setupRealtimeAnalytics();
    
    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, [t]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const events = await getMyApprovedEvents(1, 100);
      
      const fundResults = await Promise.all(
        events.map(ev => getEventFund(ev.eventId))
      );
      
      const funds = fundResults.map(res => res.data || res);

      const totalEvents = events.length;
      const totalRevenue = funds.reduce((sum, f) => sum + (f?.totalRevenue || 0), 0);

      const realAnalytics: AnalyticsData = {
        totalEvents,
        totalRevenue,
        revenueGrowth: 15.2, // This is still mock data
        ticketsSold: null, // TODO: Need API to get total tickets sold
        totalParticipants: null, // TODO: Need API to get total participants
        totalComments: null, // TODO: Need API to get total comments
      };
      
      setAnalyticsData(realAnalytics);

    } catch {
      toast.error(t('cannotLoadAnalyticsData'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthColor = (value: number) => {
    return value >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? TrendingUp : null;
  };

  if (loading || !analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-xl text-purple-300">{t('loadingAnalyticsData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white p-8">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
              {t('analyticsOverview')}
            </h1>
            <p className="text-lg text-gray-300">{t('analyticsOverviewDescription')}</p>
          </div>
          
          <div className="flex gap-4">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl">
              <Download className="mr-2" size={20} />
              {t('exportReport')}
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl">
              <Filter className="mr-2" size={20} />
              {t('filterData')}
            </Button>
          </div>
        </div>

        {/* Period Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-[#2d0036]/60 rounded-xl p-2 border border-purple-500/30">
            {['week', 'month', 'quarter', 'year'].map((period) => (
              <Button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all mx-1 ${
                  selectedPeriod === period
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-transparent text-gray-300 hover:bg-purple-600/20'
                }`}
              >
                {period === 'week' && t('week')}
                {period === 'month' && t('month')}
                {period === 'quarter' && t('quarter')}
                {period === 'year' && t('year')}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-purple-500/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-semibold">{t('totalEvents')}</p>
                  <p className="text-3xl font-bold text-purple-400">{analyticsData.totalEvents}</p>
                   {analyticsData.revenueGrowth && (
                    <div className="flex items-center mt-2">
                      {React.createElement(getGrowthIcon(analyticsData.revenueGrowth), {
                        className: `${getGrowthColor(analyticsData.revenueGrowth)} mr-1`,
                        size: 16
                      })}
                      <span className={`text-sm ${getGrowthColor(analyticsData.revenueGrowth)}`}>
                        {formatPercentage(analyticsData.revenueGrowth)} {t('revenueGrowth')}
                      </span>
                    </div>
                  )}
                </div>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Calendar className="text-purple-400" size={40} />
                </motion.div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-green-500/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-semibold">{t('totalRevenue')}</p>
                  <p className="text-3xl font-bold text-green-400">{formatCurrency(analyticsData.totalRevenue)}</p>
                  {analyticsData.revenueGrowth && (
                    <div className="flex items-center mt-2">
                      {React.createElement(getGrowthIcon(analyticsData.revenueGrowth), {
                        className: `${getGrowthColor(analyticsData.revenueGrowth)} mr-1`,
                        size: 16
                      })}
                      <span className={`text-sm ${getGrowthColor(analyticsData.revenueGrowth)}`}>
                        {formatPercentage(analyticsData.revenueGrowth)} {t('revenueGrowth')}
                      </span>
                    </div>
                  )}
                </div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <DollarSign className="text-green-400" size={40} />
                </motion.div>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Sold */}
          <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-blue-500/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-semibold">{t('ticketsSold')}</p>
                  <p className="text-3xl font-bold text-blue-400">{analyticsData.ticketsSold ?? t('na')}</p>
                  <span className="text-sm text-gray-500">{t('unknown')}</span>
                </div>
                <motion.div>
                  <Ticket className="text-blue-400" size={40} />
                </motion.div>
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-yellow-500/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-300 text-sm font-semibold">{t('totalParticipants')}</p>
                  <p className="text-3xl font-bold text-yellow-400">{analyticsData.totalParticipants ?? t('na')}</p>
                  <span className="text-sm text-gray-500">{t('unknown')}</span>
                </div>
                <motion.div>
                  <Users className="text-yellow-400" size={40} />
                </motion.div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-cyan-500/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-semibold">{t('totalComments')}</p>
                  <p className="text-3xl font-bold text-cyan-400">{analyticsData.totalComments ?? t('na')}</p>
                  <span className="text-sm text-gray-500">{t('unknown')}</span>
                </div>
                <motion.div>
                  <MessageSquare className="text-cyan-400" size={40} />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Events and Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Chart */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 rounded-2xl p-6 border-2 border-blue-500/30 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-blue-300 mb-6">{t('performanceTrend')}</h2>
            <div className="h-64 bg-[#1a0022]/40 rounded-xl border border-blue-500/20 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="text-blue-400 mx-auto mb-4" size={48} />
                <p className="text-blue-300">{t('chartTrend')}</p>
                <p className="text-gray-400 text-sm">{t('integratedWithChartJsOrRecharts')}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 
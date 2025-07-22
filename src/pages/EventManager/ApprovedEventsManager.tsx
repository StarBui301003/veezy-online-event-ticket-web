import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { getMyApprovedEvents, cancelEvent } from '@/services/Event Manager/event.service';
import { useNavigate } from 'react-router-dom';
import { onEvent, connectEventHub } from '@/services/signalr.service';
import { useTranslation } from 'react-i18next';

const EVENTS_PER_PAGE = 5;

const ApprovedEventsManager = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  // Xóa dòng khai báo hoặc gán giá trị cho location nếu không sử dụng

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const approvedEvents = await getMyApprovedEvents();
      setEvents(Array.isArray(approvedEvents) ? approvedEvents : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch approved events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    connectEventHub('http://localhost:5004/notificationHub');
    fetchEvents();
    // Lắng nghe realtime SignalR
    const reload = () => fetchEvents();
    onEvent('OnEventCreated', reload);
    onEvent('OnEventDeleted', reload);
    onEvent('OnEventUpdated', reload);
    onEvent('OnEventApproved', reload);
    onEvent('OnEventCancelled', reload);
    // Cleanup: không cần offEvent vì signalr.service chưa hỗ trợ
  }, []);

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(events.length / EVENTS_PER_PAGE));
  const pagedEvents = events.slice((page - 1) * EVENTS_PER_PAGE, page * EVENTS_PER_PAGE);

  // Reset về trang 1 khi danh sách thay đổi
  useEffect(() => {
    setPage(1);
  }, [events.length]);

  const handleCancelEvent = async (eventId) => {
    setActionLoading((prev) => ({ ...prev, [eventId]: 'canceling' }));
    try {
      await cancelEvent(eventId);
      await fetchEvents();
    } catch {
      alert('Hủy sự kiện thất bại!');
    } finally {
      setActionLoading((prev) => ({ ...prev, [eventId]: null }));
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (isApproved) => {
    if (isApproved === 1) {
      return 'bg-green-50 text-green-800 border border-green-300';
    } else if (isApproved === 2) {
      return 'bg-red-50 text-red-800 border border-red-300';
    } else {
      return 'bg-yellow-50 text-yellow-800 border border-yellow-300';
    }
  };

  const getStatusIcon = (isApproved) => {
    if (isApproved === 1) {
      return <CheckCircle className="w-4 h-4 mr-1" />;
    } else if (isApproved === 2) {
      return <AlertCircle className="w-4 h-4 mr-1" />;
    } else {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center w-full min-h-screen bg-gradient-to-br from-[#18122B] to-[#251749]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        <span className="ml-3 text-pink-500">Đang tải sự kiện...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#18122B] to-[#251749]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-red-900 mb-2">Có lỗi xảy ra</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchEvents}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-colors flex items-center justify-center mx-auto font-semibold shadow"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#18122B] to-[#251749]">
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-green-900 mb-2">Không có sự kiện đã duyệt</h3>
          <p className="text-green-700 mb-4">Hiện không có sự kiện nào đã được phê duyệt.</p>
          <button
            onClick={fetchEvents}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-colors flex items-center justify-center mx-auto font-semibold shadow"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Làm mới
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#18122B] to-[#251749] py-8 px-2">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-green-400">{t('approvedEventsTitle')}</h1>
          <button
            onClick={fetchEvents}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors flex items-center font-semibold shadow"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            {t('refresh')}
          </button>
        </div>

        <div className="space-y-4">
          {pagedEvents.map((event) => (
            <div key={event.eventId} className="bg-[#20143a] shadow-sm rounded-lg p-6 border-l-4 border-green-400">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-500">{event.eventName || t('noTitle')}</h3>
                <div className={`px-3 py-1 rounded-full text-sm flex items-center ${getStatusColor(event.isApproved)}`}>
                  {getStatusIcon(event.isApproved)}
                  <span className="ml-1 font-bold uppercase tracking-wide">
                    {event.isApproved === 0 ? t('pending') : event.isApproved === 1 ? t('approved') : event.isApproved === 2 ? t('rejected') : t('unknown')}
                  </span>
                </div>
              </div>
              <p className="text-gray-300 mb-4">{event.eventDescription || t('noDescription')}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">{t('startDate')}</p>
                  <p className="font-medium text-white">{formatDate(event.startAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">{t('endDate')}</p>
                  <p className="font-medium text-white">{formatDate(event.endAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">{t('status')}</p>
                  <p className="font-medium text-white">
                    {event.isApproved === 0
                      ? t('pendingApproval')
                      : event.isApproved === 1
                      ? t('approved')
                      : event.isApproved === 2
                      ? t('rejected')
                      : t('unknownStatus')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/event-manager/edit-event/${event.eventId}`)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  {t('edit')}
                </button>
                <button
                  onClick={() => handleCancelEvent(event.eventId)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  disabled={actionLoading[event.eventId]}
                >
                  {actionLoading[event.eventId] ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2 inline" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('canceling')}
                    </>
                  ) : (
                    t('cancelEvent')
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* PHÂN TRANG */}
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            disabled={page === 1}
          >
            {t('prev')}
          </button>
          <span className="text-green-200 font-bold">
            {t('page')} {page}/{totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            disabled={page === totalPages}
          >
            {t('next')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovedEventsManager;
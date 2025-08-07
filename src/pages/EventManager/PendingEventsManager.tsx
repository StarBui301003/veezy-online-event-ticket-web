import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  X,
  Calendar,
  MapPin,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { getMyPendingEvents, cancelEvent } from '@/services/Event Manager/event.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { onEvent, connectEventHub } from '@/services/signalr.service';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

// CancelEventConfirmation mockup modal
function CancelEventConfirmation({ event, open, onClose, onConfirm, isConfirming }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center animate-pulse">
            <AlertTriangle size={40} className="text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
          ⚠️ Xác nhận hủy sự kiện
        </h2>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
          <p className="text-red-800 font-medium">Bạn có chắc chắn muốn hủy sự kiện này không?</p>
          <p className="text-red-600 text-sm mt-1">
            ⚠️ Hành động này không thể hoàn tác và sẽ thông báo đến tất cả người tham gia.
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 mb-6 border-l-4 border-red-500">
          <h3 className="font-semibold text-gray-800 text-lg mb-3 flex items-center gap-2">
            🎉 {event?.eventName || 'Tên sự kiện'}
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-red-500" />
              <span>
                {event?.startAt
                  ? new Date(event.startAt).toLocaleDateString('vi-VN')
                  : '--/--/----'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-red-500" />
              <span>
                {event?.startAt
                  ? new Date(event.startAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '--:--'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-red-500" />
              <span>{event?.eventLocation || 'Địa điểm chưa cập nhật'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-red-500" />
              <span>{event?.attendees || 0} người tham gia</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none transition-all duration-300 flex items-center gap-2 min-w-[140px] justify-center"
          >
            {isConfirming ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang hủy...
              </>
            ) : (
              <>
                <AlertTriangle size={18} />
                Xác nhận hủy
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none transition-all duration-300 min-w-[140px]"
          >
            Giữ sự kiện
          </button>
        </div>
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            💡 Lưu ý: Email thông báo hủy sẽ được gửi tự động đến tất cả người tham gia
          </p>
        </div>
      </div>
    </div>
  );
}

const EVENTS_PER_PAGE = 5;

const PendingEventsManager = () => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const allEvents = await getMyPendingEvents(1, 100); // lấy tối đa 100 sự kiện
      setEvents(Array.isArray(allEvents) ? allEvents : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
          connectEventHub('https://event.vezzy.site/notificationHub');
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

  const handleEditEvent = (eventId) => {
    navigate(`/event-manager/edit/${eventId}`, { state: { from: location.pathname } });
  };

  // Modal state for cancel event
  const [cancelModal, setCancelModal] = useState({ open: false, event: null, isConfirming: false });

  const handleCancelEvent = (event) => {
    setCancelModal({ open: true, event, isConfirming: false });
  };

  const handleConfirmCancel = async () => {
    setCancelModal((prev) => ({ ...prev, isConfirming: true }));
    try {
      await cancelEvent(cancelModal.event.eventId);
      await fetchEvents();
      setCancelModal({ open: false, event: null, isConfirming: false });
    } catch {
      setCancelModal((prev) => ({ ...prev, isConfirming: false }));
      alert('Hủy sự kiện thất bại!');
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  // Màu trạng thái: Pending vàng, Approved xanh lá, Rejected đỏ
  const getStatusColor = (isApproved) => {
    switch (isApproved) {
      case 0:
        return 'bg-yellow-50 text-yellow-800 border border-yellow-300';
      case 1:
        return 'bg-green-50 text-green-800 border border-green-300';
      case 2:
        return 'bg-red-50 text-red-800 border border-red-300';
      default:
        return 'bg-gray-50 text-gray-800 border border-gray-300';
    }
  };

  // Icon trạng thái: Pending vàng, Approved xanh lá, Rejected đỏ
  const getStatusIcon = (isApproved) => {
    switch (isApproved) {
      case 0:
        return <Clock className="w-4 h-4 mr-1 text-yellow-500" />;
      case 1:
        return <CheckCircle className="w-4 h-4 mr-1 text-green-500" />;
      case 2:
        return <XCircle className="w-4 h-4 mr-1 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 mr-1" />;
    }
  };

  if (loading) {
    return (
      <div
        className={cn(
          'flex justify-center items-center w-full min-h-screen',
          getThemeClass(
            'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
            'bg-gradient-to-br from-[#18122B] to-[#251749]'
          )
        )}
      >
        <div
          className={cn(
            'animate-spin rounded-full h-12 w-12 border-b-2',
            getThemeClass('border-blue-500', 'border-pink-500')
          )}
        ></div>
        <span className={cn('ml-3', getThemeClass('text-blue-600', 'text-pink-500'))}>
          Đang tải sự kiện...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'w-full min-h-screen flex items-center justify-center',
          getThemeClass(
            'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
            'bg-gradient-to-br from-[#18122B] to-[#251749]'
          )
        )}
      >
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
      <div
        className={cn(
          'w-full min-h-screen flex items-center justify-center',
          getThemeClass(
            'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
            'bg-gradient-to-br from-[#18122B] to-[#251749]'
          )
        )}
      >
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-pink-900 mb-2">Không có sự kiện đang chờ</h3>
          <p className="text-pink-700 mb-4">Hiện không có sự kiện nào đang chờ phê duyệt.</p>
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
    <div
      className={cn(
        'w-full min-h-screen py-8 px-2',
        getThemeClass(
          'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
          'bg-gradient-to-br from-[#18122B] to-[#251749]'
        )
      )}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1
            className={cn(
              'text-2xl md:text-3xl font-bold',
              getThemeClass('text-blue-600', 'text-yellow-400')
            )}
          >
            {t('pendingEventsTitle')}
          </h1>
          <button
            onClick={fetchEvents}
            className={cn(
              'px-6 py-2 rounded-lg transition-colors flex items-center font-semibold shadow',
              getThemeClass(
                'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600',
                'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
              )
            )}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            {t('refresh')}
          </button>
        </div>

        <div className="space-y-4">
          {pagedEvents.map((event) => (
            <div
              key={event.eventId}
              className={cn(
                'shadow-sm rounded-lg p-6 border-l-4',
                getThemeClass(
                  'bg-white border-l-blue-400 shadow-lg',
                  'bg-[#20143a] border-l-yellow-400'
                )
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className={cn(
                    'text-lg font-semibold',
                    getThemeClass('text-blue-600', 'text-yellow-500')
                  )}
                >
                  {event.eventName || t('noTitle')}
                </h3>
                <div
                  className={`px-3 py-1 rounded-full text-sm flex items-center ${getStatusColor(
                    event.isApproved
                  )}`}
                >
                  {getStatusIcon(event.isApproved)}
                  <span className="ml-1 font-bold uppercase tracking-wide">
                    {event.isApproved === 0
                      ? t('pending')
                      : event.isApproved === 1
                      ? t('approved')
                      : event.isApproved === 2
                      ? t('rejected')
                      : t('unknown')}
                  </span>
                </div>
              </div>
              <p className={cn('mb-4', getThemeClass('text-gray-600', 'text-gray-300'))}>
                {event.eventDescription || t('noDescription')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className={cn('text-sm', getThemeClass('text-gray-500', 'text-gray-400'))}>
                    {t('startDate')}
                  </p>
                  <p className={cn('font-medium', getThemeClass('text-gray-800', 'text-white'))}>
                    {formatDate(event.startAt)}
                  </p>
                </div>
                <div>
                  <p className={cn('text-sm', getThemeClass('text-gray-500', 'text-gray-400'))}>
                    {t('endDate')}
                  </p>
                  <p className={cn('font-medium', getThemeClass('text-gray-800', 'text-white'))}>
                    {formatDate(event.endAt)}
                  </p>
                </div>
                <div>
                  <p className={cn('text-sm', getThemeClass('text-gray-500', 'text-gray-400'))}>
                    {t('status')}
                  </p>
                  <p className={cn('font-medium', getThemeClass('text-gray-800', 'text-white'))}>
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
              <div className="flex flex-wrap justify-end gap-2 mt-4">
                <button
                  onClick={() => handleEditEvent(event.eventId)}
                  className={cn(
                    'px-4 py-2 rounded-lg transition-colors',
                    getThemeClass(
                      'bg-blue-100 text-blue-700 hover:bg-blue-200',
                      'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    )
                  )}
                >
                  {t('edit')}
                </button>
                <button
                  onClick={() => handleCancelEvent(event)}
                  className={cn(
                    'px-4 py-2 rounded-lg transition-colors flex items-center',
                    getThemeClass(
                      'bg-red-500 text-white hover:bg-red-600',
                      'bg-red-500 text-white hover:bg-red-600'
                    )
                  )}
                >
                  {t('cancelEvent')}
                </button>
                {/* Cancel Event Modal */}
                <CancelEventConfirmation
                  event={cancelModal.event}
                  open={cancelModal.open}
                  onClose={() => setCancelModal({ open: false, event: null, isConfirming: false })}
                  onConfirm={handleConfirmCancel}
                  isConfirming={cancelModal.isConfirming}
                />
              </div>
            </div>
          ))}
        </div>

        {/* PHÂN TRANG */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              className={cn(
                'p-2 rounded-full disabled:opacity-50',
                getThemeClass(
                  'bg-blue-500 text-white disabled:opacity-50',
                  'bg-yellow-400 text-yellow-900 disabled:opacity-50'
                )
              )}
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              &lt;
            </button>
            <span className={cn('font-bold', getThemeClass('text-blue-600', 'text-yellow-200'))}>
              {t('page')} {page}/{totalPages}
            </span>
            <button
              className={cn(
                'p-2 rounded-full disabled:opacity-50',
                getThemeClass(
                  'bg-blue-500 text-white disabled:opacity-50',
                  'bg-yellow-400 text-yellow-900 disabled:opacity-50'
                )
              )}
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingEventsManager;

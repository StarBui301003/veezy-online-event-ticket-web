import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { getMyPendingEvents,  cancelEvent } from '@/services/Event Manager/event.service';
import { useNavigate, useLocation } from 'react-router-dom';

const EVENTS_PER_PAGE = 5;

const PendingEventsManager = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
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
    fetchEvents();
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

  // Màu trạng thái: Pending vàng, Approved xanh lá, Rejected đỏ
  const getStatusColor = (isApproved) => {
    switch (isApproved) {
      case 0: return 'bg-yellow-50 text-yellow-800 border border-yellow-300';
      case 1: return 'bg-green-50 text-green-800 border border-green-300';
      case 2: return 'bg-red-50 text-red-800 border border-red-300';
      default: return 'bg-gray-50 text-gray-800 border border-gray-300';
    }
  };

  // Icon trạng thái: Pending vàng, Approved xanh lá, Rejected đỏ
  const getStatusIcon = (isApproved) => {
    switch (isApproved) {
      case 0: return <Clock className="w-4 h-4 mr-1 text-yellow-500" />;
      case 1: return <CheckCircle className="w-4 h-4 mr-1 text-green-500" />;
      case 2: return <XCircle className="w-4 h-4 mr-1 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 mr-1" />;
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
    <div className="w-full min-h-screen bg-gradient-to-br from-[#18122B] to-[#251749] py-8 px-2">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">Sự kiện đang chờ phê duyệt</h1>
          <button
            onClick={fetchEvents}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-colors flex items-center font-semibold shadow"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Làm mới
          </button>
        </div>

        <div className="space-y-4">
          {pagedEvents.map((event) => (
            <div key={event.eventId} className="bg-[#20143a] shadow-sm rounded-lg p-6 border-l-4 border-yellow-400">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-yellow-500">{event.eventName || 'Không có tiêu đề'}</h3>
                <div className={`px-3 py-1 rounded-full text-sm flex items-center ${getStatusColor(event.isApproved)}`}>
                  {getStatusIcon(event.isApproved)}
                  <span className="ml-1 font-bold uppercase tracking-wide">
                    {event.isApproved === 0 ? 'Pending' : event.isApproved === 1 ? 'Approved' : event.isApproved === 2 ? 'Rejected' : 'Unknown'}
                  </span>
                </div>
              </div>
              <p className="text-gray-300 mb-4">{event.eventDescription || 'Không có mô tả'}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Ngày bắt đầu</p>
                  <p className="font-medium text-white">{formatDate(event.startAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Ngày kết thúc</p>
                  <p className="font-medium text-white">{formatDate(event.endAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Trạng thái</p>
                  <p className="font-medium text-white">
                    {event.isApproved === 0
                      ? 'Đang chờ duyệt'
                      : event.isApproved === 1
                      ? 'Đã duyệt'
                      : event.isApproved === 2
                      ? 'Bị từ chối'
                      : 'Không xác định'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 mt-4">
                <button
                  onClick={() => handleEditEvent(event.eventId)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => handleCancelEvent(event.eventId)}
                  disabled={actionLoading[event.eventId] === 'canceling'}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:bg-red-300 flex items-center"
                >
                  {actionLoading[event.eventId] === 'canceling' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang hủy...
                    </>
                  ) : (
                    'Hủy sự kiện'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* PHÂN TRANG */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              className="p-2 rounded-full bg-yellow-400 text-yellow-900 disabled:opacity-50"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              &lt;
            </button>
            <span className="text-yellow-200 font-bold">
              Trang {page}/{totalPages}
            </span>
            <button
              className="p-2 rounded-full bg-yellow-400 text-yellow-900 disabled:opacity-50"
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
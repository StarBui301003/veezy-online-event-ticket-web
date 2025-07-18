import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserByIdAPI } from '@/services/Admin/user.service';
import { getAllEvents } from '@/services/Event Manager/event.service';
import { NO_AVATAR } from '@/assets/img';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import ReportModal from '@/components/Customer/ReportModal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreVertical, Flag } from 'lucide-react';
import type { User } from '@/types/auth';
import instance from '@/services/axios.customize';

const TABS = [
  { key: 'info', label: 'Thông tin cá nhân' },
  { key: 'events', label: 'Sự kiện đang tổ chức' },
  { key: 'news', label: 'Tin tức' },
];
const EVENTS_PER_PAGE = 6;

// Define a type for event items (minimal, based on usage)
type EventItem = {
  eventId: string;
  eventName: string;
  startAt: string;
  endAt: string;
  eventLocation: string;
  createdBy: string;
  isApproved: number;
  isCancelled: boolean;
};

type News = {
  newsId: string;
  eventId: string;
  newsDescription: string;
  newsTitle: string;
  newsContent: string;
  authorId: string;
  authorName: string;
  imageUrl: string;
  status: boolean;
  isApprove: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason: string;
};

const EventManagerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [info, setInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [reportModal, setReportModal] = useState(false);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'info' | 'events' | 'news'>('info');
  const [news, setNews] = useState<News[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getUserByIdAPI(id)
      .then(setInfo)
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
    setLoadingEvents(true);
    getAllEvents(1, 100)
      .then((all) => {
        setEvents((all || []).filter((ev: EventItem) => ev.createdBy === id && ev.isApproved === 1 && !ev.isCancelled));
      })
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, [id]);

  useEffect(() => {
    if (tab === 'news' && id) {
      setLoadingNews(true);
      instance.get(`/api/News/byAuthor`, { params: { authorId: id, page: 1, pageSize: 20 } })
        .then((res) => {
          const items = res.data?.data?.items;
          setNews(Array.isArray(items) ? items : []);
        })
        .catch(() => setNews([]))
        .finally(() => setLoadingNews(false));
    }
  }, [tab, id]);

  const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE);
  const pagedEvents = events.slice((page - 1) * EVENTS_PER_PAGE, page * EVENTS_PER_PAGE);

  if (loading) return <SpinnerOverlay show={true} />;
  if (!info) return <div className="text-center text-red-500 py-20">Không tìm thấy thông tin Event Manager.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white pt-24 pb-12">
      <div className="max-w-6xl mx-auto flex gap-8 px-4">
        {/* Sidebar Tabs */}
        <aside className="w-64 bg-slate-800/80 rounded-2xl shadow-xl p-6 flex flex-col gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`text-left px-4 py-2 rounded-lg font-semibold transition-all ${tab === t.key ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : 'text-purple-200 hover:bg-slate-700'}`}
              onClick={() => setTab(t.key as 'info' | 'events' | 'news')}
            >
              {t.label}
            </button>
          ))}
        </aside>
        {/* Main content */}
        <main className="flex-1 bg-slate-800/70 rounded-2xl shadow-xl p-8 min-h-[500px]">
          {tab === 'info' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Thông tin cá nhân</h2>
                {/* Nút ... báo cáo */}
                <div className="relative z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 border border-slate-600 shadow-lg">
                        <MoreVertical className="w-5 h-5 text-white" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={e => {
                          e.preventDefault();
                          setTimeout(() => setReportModal(true), 10);
                        }}
                        className="flex items-center gap-2 text-red-600 font-semibold cursor-pointer hover:bg-red-50 rounded px-3 py-2"
                      >
                        <Flag className="w-4 h-4" /> Báo cáo Event Manager
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                <div className="relative">
                  <img
                    src={info.avatarUrl || NO_AVATAR}
                    alt={info.fullName || 'avatar'}
                    className="w-32 h-32 rounded-full object-cover border-4 border-purple-400 shadow-lg"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-slate-800"></div>
                </div>
                <div className="flex-1 min-w-0 text-center md:text-left">
                  <div className="font-bold text-3xl md:text-4xl mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {info.fullName || 'Event Manager'}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-300">📧 Email:</span>
                      <span className="text-white truncate">{info.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-300">📱 SĐT:</span>
                      <span className="text-white">{info.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-300">📍 Địa chỉ:</span>
                      <span className="text-white truncate">{info.location}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Có thể bổ sung thêm các trường khác nếu cần */}
            </div>
          )}
          {tab === 'events' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  🎉 Sự kiện đang tổ chức
                </h2>
                <div className="bg-purple-600/20 px-4 py-2 rounded-full border border-purple-500/30">
                  <span className="text-purple-300 text-sm font-medium">
                    {events.length} sự kiện
                  </span>
                </div>
              </div>
              {loadingEvents ? (
                <SpinnerOverlay show={true} />
              ) : events.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🎪</div>
                  <div className="text-gray-400 text-lg mb-2">Chưa có sự kiện nào</div>
                  <div className="text-gray-500 text-sm">Event Manager này chưa tổ chức sự kiện nào</div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pagedEvents.map((event: EventItem) => (
                      <div
                        key={event.eventId}
                        className="group bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl p-6 shadow-lg border border-purple-700/30 hover:border-purple-500/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden relative"
                        onClick={() => navigate(`/event/${event.eventId}`)}
                      >
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-xl"></div>
                        {/* Event Title */}
                        <div className="relative z-10 mb-4">
                          <h3 className="font-bold text-xl text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                            {event.eventName}
                          </h3>
                          <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                        </div>
                        {/* Event Details */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-start gap-3">
                            <div className="text-purple-400 text-sm mt-1">📅</div>
                            <div className="text-sm text-gray-300">
                              <div className="font-medium">Bắt đầu:</div>
                              <div className="text-purple-300">{new Date(event.startAt).toLocaleString('vi-VN')}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="text-pink-400 text-sm mt-1">🏁</div>
                            <div className="text-sm text-gray-300">
                              <div className="font-medium">Kết thúc:</div>
                              <div className="text-pink-300">{new Date(event.endAt).toLocaleString('vi-VN')}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="text-yellow-400 text-sm mt-1">📍</div>
                            <div className="text-sm text-gray-300">
                              <div className="font-medium">Địa điểm:</div>
                              <div className="text-yellow-300 line-clamp-2">{event.eventLocation}</div>
                            </div>
                          </div>
                        </div>
                        {/* Event Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-400 text-xs font-medium">Đang diễn ra</span>
                          </div>
                          <div className="text-purple-400 group-hover:text-purple-300 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                      </div>
                    ))}
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-8 gap-2">
                      <button
                        className="px-4 py-2 rounded-full bg-slate-700 text-white font-semibold disabled:opacity-50"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        &lt; Trước
                      </button>
                      <span className="px-4 py-2 text-purple-300 font-bold">{page} / {totalPages}</span>
                      <button
                        className="px-4 py-2 rounded-full bg-slate-700 text-white font-semibold disabled:opacity-50"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        Tiếp &gt;
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {tab === 'news' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  📰 Tin tức từ Event Manager
                </h2>
                <div className="bg-purple-600/20 px-4 py-2 rounded-full border border-purple-500/30">
                  <span className="text-purple-300 text-sm font-medium">
                    {news.length} tin
                  </span>
                </div>
              </div>
              {loadingNews ? (
                <SpinnerOverlay show={true} />
              ) : news.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📰</div>
                  <div className="text-gray-400 text-lg mb-2">Chưa có tin tức nào</div>
                  <div className="text-gray-500 text-sm">Event Manager này chưa đăng tin tức nào</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {news.map((n, idx) => (
                    <div key={n.newsId || idx} className="bg-slate-800/80 rounded-xl p-6 shadow border border-purple-700/30">
                      {n.imageUrl && <img src={n.imageUrl} alt={n.newsTitle} className="w-full h-40 object-cover rounded mb-3" />}
                      <div className="font-bold text-lg text-white mb-2 line-clamp-2">{n.newsTitle || 'Không có tiêu đề'}</div>
                      <div className="text-slate-300 text-sm mb-2 line-clamp-3">{n.newsDescription || n.newsContent?.slice(0, 100) + '...' || 'Không có mô tả'}</div>
                      <div className="text-xs text-purple-400 mb-1">{n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}</div>
                      <a href={`/news/${n.newsId}`} className="text-blue-400 hover:underline text-sm">Xem chi tiết</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
        {reportModal && info?.accountId && (
          <ReportModal
            key={info.accountId}
            open={reportModal}
            targetType="event"
            targetId={info.accountId}
            onClose={() => setReportModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default EventManagerProfile;
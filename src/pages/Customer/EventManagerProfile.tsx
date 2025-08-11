import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserByIdAPI } from '@/services/Admin/user.service';
import { getAllEvents } from '@/services/Event Manager/event.service';

import { NO_AVATAR } from '@/assets/img';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import ReportModal from '@/components/Customer/ReportModal';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Flag } from 'lucide-react';
import type { User } from '@/types/auth';
import instance from '@/services/axios.customize';
import { useTranslation } from 'react-i18next';
import OnlineStatusIndicator from '@/components/common/OnlineStatusIndicator';
import { useRequireLogin } from '@/hooks/useRequireLogin';
import { LoginModal } from '@/components/common/LoginModal';
import { RegisterModal } from '@/components/RegisterModal';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

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
  // Fix: useRequireLogin may not provide showLoginModal/setShowLoginModal, fallback to local state
  // Remove destructuring from useRequireLogin
  useRequireLogin();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { id } = useParams<{ id: string }>();
  const [info, setInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [reportTarget, setReportTarget] = useState<{
    type: 'eventmanager' | 'news';
    id: string;
  } | null>(null);
  const [pendingReportTarget, setPendingReportTarget] = useState<{
    type: 'eventmanager' | 'news';
    id: string;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'info' | 'events' | 'news'>('info');
  const [news, setNews] = useState<News[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const TABS = [
    { key: 'info', label: t('personalInfo') },
    { key: 'events', label: t('ongoingEvents') },
    { key: 'news', label: t('news') },
  ];

  // Function to reload profile data
  const reloadProfileData = () => {
    if (!id) return;
    setLoading(true);
    getUserByIdAPI(id)
      .then(setInfo)
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));

    setLoadingEvents(true);
    getAllEvents(1, 100)
      .then((all) => {
        setEvents(
          (all || []).filter(
            (ev: EventItem) => ev.createdBy === id && ev.isApproved === 1 && !ev.isCancelled
          )
        );
      })
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  };

  // Initial data load
  useEffect(() => {
    reloadProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (tab === 'news' && id) {
      setLoadingNews(true);
      instance
        .get(`/api/News/byAuthorPublic`, { params: { authorId: id, page: 1, pageSize: 20 } })
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
  if (!info)
    return <div className="text-center text-red-500 py-20">{t('eventManagerNotFound')}</div>;

  const { getThemeClass } = useThemeClasses();

  return (
    <div
      className={cn(
        'min-h-screen pt-24 pb-12',
        getThemeClass(
          'bg-gradient-to-r from-blue-500 to-cyan-400 text-gray-900',
          'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white'
        )
      )}
    >
      <div className="max-w-6xl mx-auto flex gap-8 px-4">
        {/* Sidebar Tabs */}
        <aside
          className={cn(
            'w-64 rounded-2xl shadow-xl p-6 flex flex-col gap-2',
            getThemeClass('bg-white/90 border border-blue-200', 'bg-slate-800/80')
          )}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              className={cn(
                'text-left px-4 py-2 rounded-lg font-semibold transition-all',
                getThemeClass(
                  tab === t.key
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow'
                    : 'text-blue-900 hover:bg-blue-100',
                  tab === t.key
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                    : 'text-purple-200 hover:bg-slate-700'
                )
              )}
              onClick={() => setTab(t.key as 'info' | 'events' | 'news')}
            >
              {t.label}
            </button>
          ))}
        </aside>
        {/* Main content */}
        <main
          className={cn(
            'flex-1 rounded-2xl shadow-xl p-8 min-h-[500px]',
            getThemeClass(
              'bg-white/90 border border-gray-200 text-gray-900',
              'bg-slate-800/70 text-white'
            )
          )}
        >
          {tab === 'info' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={cn('text-2xl font-bold', getThemeClass('text-gray-900', 'text-white'))}
                >
                  {t('personalInfo')}
                </h2>
                {/* Nút ... báo cáo event manager */}
                <div className="relative z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          'p-2 rounded-full border shadow-lg',
                          getThemeClass(
                            'bg-white hover:bg-gray-100 border-gray-300',
                            'bg-slate-700 hover:bg-slate-600 border-slate-600'
                          )
                        )}
                      >
                        <MoreVertical
                          className={cn('w-5 h-5', getThemeClass('text-gray-700', 'text-white'))}
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          const token = localStorage.getItem('access_token');
                          if (!token || token === 'null' || token === 'undefined') {
                            setPendingReportTarget({
                              type: 'eventmanager',
                              id: info?.userId || '',
                            });
                            setShowLoginModal(true);
                          } else {
                            setReportTarget({ type: 'eventmanager', id: info?.userId || '' });
                          }
                        }}
                        className="flex items-center gap-2 text-red-600 font-semibold cursor-pointer hover:bg-red-50 rounded px-3 py-2"
                      >
                        <Flag className="w-4 h-4" /> {t('reportEventManager')}
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
                  <div className="absolute -bottom-2 -right-2">
                    <OnlineStatusIndicator userId={info.userId} size="lg" showText={false} />
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-center md:text-left">
                  <div
                    className={cn(
                      'font-bold text-3xl md:text-4xl mb-3',
                      getThemeClass(
                        'text-gray-900',
                        'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'
                      )
                    )}
                  >
                    {info.fullName || 'Event Manager'}
                  </div>

                  {/* Online Status */}
                  <div className="mb-4">
                    <OnlineStatusIndicator
                      userId={info.userId}
                      size="md"
                      showText={true}
                      className="justify-center md:justify-start"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn(getThemeClass('text-blue-700', 'text-purple-300'))}>
                        📧 {t('email')}:
                      </span>
                      <span
                        className={cn('truncate', getThemeClass('text-gray-900', 'text-white'))}
                      >
                        {info.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(getThemeClass('text-blue-700', 'text-purple-300'))}>
                        📱 {t('phone')}:
                      </span>
                      <span className={cn(getThemeClass('text-gray-900', 'text-white'))}>
                        {info.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(getThemeClass('text-blue-700', 'text-purple-300'))}>
                        📍 {t('location')}:
                      </span>
                      <span
                        className={cn('truncate', getThemeClass('text-gray-900', 'text-white'))}
                      >
                        {info.location}
                      </span>
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
                <h2
                  className={cn(
                    'text-2xl font-bold bg-clip-text text-transparent',
                    getThemeClass(
                      'bg-gradient-to-r from-blue-600 to-cyan-600',
                      'bg-gradient-to-r from-purple-400 to-pink-400'
                    )
                  )}
                >
                  🎉 {t('ongoingEvents')}
                </h2>
                <div
                  className={cn(
                    'px-4 py-2 rounded-full border',
                    getThemeClass(
                      'bg-blue-100 border-blue-300',
                      'bg-purple-600/20 border-purple-500/30'
                    )
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-medium',
                      getThemeClass('text-blue-700', 'text-purple-300')
                    )}
                  >
                    {events.length} {t('eventCount')}
                  </span>
                </div>
              </div>
              {loadingEvents ? (
                <SpinnerOverlay show={true} />
              ) : events.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🎪</div>
                  <div
                    className={cn('text-lg mb-2', getThemeClass('text-gray-600', 'text-gray-400'))}
                  >
                    {t('noEventsYet')}
                  </div>
                  <div className={cn('text-sm', getThemeClass('text-gray-500', 'text-gray-500'))}>
                    {t('eventManagerNoEvents')}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pagedEvents.map((event: EventItem) => (
                      <div
                        key={event.eventId}
                        className={cn(
                          'group rounded-2xl p-6 shadow-lg border hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden relative',
                          getThemeClass(
                            'bg-white border-gray-200',
                            'bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-purple-700/30 hover:border-purple-500/50'
                          )
                        )}
                        onClick={() => navigate(`/event/${event.eventId}`)}
                      >
                        {/* Background decoration */}
                        <div
                          className={cn(
                            'absolute top-0 right-0 w-20 h-20 rounded-full blur-xl',
                            getThemeClass(
                              'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
                              'bg-gradient-to-br from-purple-500/10 to-pink-500/10'
                            )
                          )}
                        ></div>
                        {/* Event Title */}
                        <div className="relative z-10 mb-4">
                          <h3
                            className={cn(
                              'font-bold text-xl mb-2 line-clamp-2 transition-colors',
                              getThemeClass(
                                'text-gray-900 group-hover:text-blue-700',
                                'text-white group-hover:text-purple-300'
                              )
                            )}
                          >
                            {event.eventName}
                          </h3>
                          <div
                            className={cn(
                              'w-12 h-1 rounded-full',
                              getThemeClass(
                                'bg-gradient-to-r from-blue-600 to-cyan-600',
                                'bg-gradient-to-r from-purple-500 to-pink-500'
                              )
                            )}
                          ></div>
                        </div>
                        {/* Event Details */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'text-sm mt-1',
                                getThemeClass('text-blue-600', 'text-purple-400')
                              )}
                            >
                              📅
                            </div>
                            <div
                              className={cn(
                                'text-sm',
                                getThemeClass('text-gray-700', 'text-gray-300')
                              )}
                            >
                              <div className="font-medium">{t('startAt')}:</div>
                              <div className={getThemeClass('text-blue-700', 'text-purple-300')}>
                                {new Date(event.startAt).toLocaleString('vi-VN')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'text-sm mt-1',
                                getThemeClass('text-pink-600', 'text-pink-400')
                              )}
                            >
                              🏁
                            </div>
                            <div
                              className={cn(
                                'text-sm',
                                getThemeClass('text-gray-700', 'text-gray-300')
                              )}
                            >
                              <div className="font-medium">{t('endAt')}:</div>
                              <div className={getThemeClass('text-pink-700', 'text-pink-300')}>
                                {new Date(event.endAt).toLocaleString('vi-VN')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'text-sm mt-1',
                                getThemeClass('text-yellow-600', 'text-yellow-400')
                              )}
                            >
                              📍
                            </div>
                            <div
                              className={cn(
                                'text-sm',
                                getThemeClass('text-gray-700', 'text-gray-300')
                              )}
                            >
                              <div className="font-medium">{t('eventLocation')}:</div>
                              <div
                                className={cn(
                                  'line-clamp-2',
                                  getThemeClass('text-yellow-700', 'text-yellow-300')
                                )}
                              >
                                {event.eventLocation}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Event Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-600 text-xs font-medium dark:text-green-400">
                              {t('ongoing')}
                            </span>
                          </div>
                          <div
                            className={cn(
                              'transition-colors',
                              getThemeClass(
                                'text-blue-600 group-hover:text-blue-700',
                                'text-purple-400 group-hover:text-purple-300'
                              )
                            )}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                        {/* Hover effect overlay */}
                        <div
                          className={cn(
                            'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl',
                            getThemeClass(
                              'bg-gradient-to-r from-blue-600/5 to-cyan-600/5',
                              'bg-gradient-to-r from-purple-600/5 to-pink-600/5'
                            )
                          )}
                        ></div>
                      </div>
                    ))}
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-8 gap-2">
                      <button
                        className={cn(
                          'px-4 py-2 rounded-full font-semibold disabled:opacity-50',
                          getThemeClass('bg-blue-600 text-white', 'bg-slate-700 text-white')
                        )}
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        &lt; {t('previous')}
                      </button>
                      <span
                        className={cn(
                          'px-4 py-2 font-bold',
                          getThemeClass('text-blue-700', 'text-purple-300')
                        )}
                      >
                        {page} / {totalPages}
                      </span>
                      <button
                        className={cn(
                          'px-4 py-2 rounded-full font-semibold disabled:opacity-50',
                          getThemeClass('bg-blue-600 text-white', 'bg-slate-700 text-white')
                        )}
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        {t('next')} &gt;
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
                <h2
                  className={cn(
                    'text-2xl font-bold bg-clip-text text-transparent',
                    getThemeClass(
                      'bg-gradient-to-r from-blue-600 to-cyan-600',
                      'bg-gradient-to-r from-purple-400 to-pink-400'
                    )
                  )}
                >
                  📰 {t('newsFromEventManager')}
                </h2>
                <div
                  className={cn(
                    'px-4 py-2 rounded-full border',
                    getThemeClass(
                      'bg-blue-100 border-blue-300',
                      'bg-purple-600/20 border-purple-500/30'
                    )
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-medium',
                      getThemeClass('text-blue-700', 'text-purple-300')
                    )}
                  >
                    {news.length} {t('newsCount')}
                  </span>
                </div>
              </div>
              {loadingNews ? (
                <SpinnerOverlay show={true} />
              ) : news.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📰</div>
                  <div
                    className={cn('text-lg mb-2', getThemeClass('text-gray-600', 'text-gray-400'))}
                  >
                    {t('noNewsYet')}
                  </div>
                  <div className={cn('text-sm', getThemeClass('text-gray-500', 'text-gray-500'))}>
                    {t('eventManagerNoNews')}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {news.map((n, idx) => (
                    <div
                      key={n.newsId || idx}
                      className={cn(
                        'rounded-xl p-6 shadow border relative group',
                        getThemeClass(
                          'bg-white border-gray-200',
                          'bg-slate-800/80 border-purple-700/30'
                        )
                      )}
                    >
                      {/* Report dropdown */}
                      <div className="absolute top-3 right-3 z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn(
                                'p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none',
                                getThemeClass(
                                  'bg-white/80 hover:bg-gray-100 border border-gray-300',
                                  'bg-slate-700/80 hover:bg-slate-600/80'
                                )
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical
                                className={cn(
                                  'w-4 h-4',
                                  getThemeClass('text-gray-700', 'text-gray-300')
                                )}
                              />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                const token = localStorage.getItem('access_token');
                                if (!token || token === 'null' || token === 'undefined') {
                                  setPendingReportTarget({ type: 'news', id: n.newsId });
                                  setShowLoginModal(true);
                                } else {
                                  setReportTarget({ type: 'news', id: n.newsId });
                                }
                              }}
                              className="flex items-center gap-2 text-red-600 font-semibold cursor-pointer hover:bg-red-50 rounded px-3 py-2"
                            >
                              <Flag className="w-4 h-4" /> {t('reportNews')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {n.imageUrl && (
                        <img
                          src={n.imageUrl}
                          alt={n.newsTitle}
                          className="w-full h-40 object-cover rounded mb-3"
                        />
                      )}
                      <div
                        className={cn(
                          'font-bold text-lg mb-2 line-clamp-2',
                          getThemeClass('text-gray-900', 'text-white')
                        )}
                      >
                        {n.newsTitle || t('noTitle')}
                      </div>
                      <div
                        className={cn(
                          'text-sm mb-2 line-clamp-3',
                          getThemeClass('text-gray-700', 'text-slate-300')
                        )}
                      >
                        {n.newsDescription ||
                          n.newsContent?.slice(0, 100) + '...' ||
                          t('noDescription')}
                      </div>
                      <div
                        className={cn(
                          'text-xs mb-1',
                          getThemeClass('text-blue-700', 'text-purple-400')
                        )}
                      >
                        {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}
                      </div>
                      <a
                        href={`/news/${n.newsId}`}
                        className={cn(
                          'text-sm',
                          getThemeClass(
                            'text-blue-600 hover:underline',
                            'text-blue-400 hover:underline'
                          )
                        )}
                      >
                        {t('viewDetails')}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
        {reportTarget && (
          <ReportModal
            key={reportTarget.id}
            open={!!reportTarget}
            targetType={reportTarget.type}
            targetId={reportTarget.id}
            onClose={() => setReportTarget(null)}
          />
        )}
        {/* Hiển thị modal đăng nhập nếu chưa đăng nhập */}
        {showLoginModal && (
          <LoginModal
            open={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={() => {
              setShowLoginModal(false);
              if (pendingReportTarget) {
                setReportTarget(pendingReportTarget);
                setPendingReportTarget(null);
              }
            }}
            onRegisterRedirect={() => {
              setShowLoginModal(false);
              setShowRegisterModal(true);
            }}
          />
        )}
        {showRegisterModal && (
          <RegisterModal
            open={showRegisterModal}
            onClose={() => setShowRegisterModal(false)}
            onRegisterSuccess={() => setShowRegisterModal(false)}
            onLoginRedirect={() => {
              setShowRegisterModal(false);
              setShowLoginModal(true);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default EventManagerProfile;

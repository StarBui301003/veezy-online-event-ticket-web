import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { getHomeEvents, getAllNewsHome } from '@/services/Event Manager/event.service';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import './Home.css';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { NO_IMAGE } from '@/assets/img';
import { onEvent } from '@/services/signalr.service';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

interface EventData {
  eventId: string;
  eventName: string;
  eventCoverImageUrl: string;
  eventDescription: string;
  startAt: string;
  endAt: string;
  tags: string[];
  categoryIds: string[];
  eventLocation: string;
  isApproved: number; // 0 = pending, 1 = approved
  isCancelled: boolean;
  isActive: boolean;
}

interface News {
  newsId: string;
  newsTitle: string;
  newsDescription: string;
  imageUrl: string;
  createdAt?: string;
}

export const HomePage = () => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [events, setEvents] = useState<EventData[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch events
    setLoadingEvents(true);
    getHomeEvents()
      .then((fetchedEvents) => {
        // Chỉ lấy sự kiện isActive === true
        const activeEvents = (fetchedEvents || []).filter(
          (event: EventData) => event.isActive === true
        );
        setEvents(activeEvents);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));

    // Fetch news
    setLoadingNews(true);
    getAllNewsHome() // Sử dụng API mới
      .then((response) => {
        setNews(response.data?.data?.items || []);
      })
      .catch(() => setNews([]))
      .finally(() => setLoadingNews(false));

    // Setup realtime listeners - News events are handled by Event hub
    const reloadNews = () => {
      setLoadingNews(true);
      getAllNewsHome()
        .then((response) => {
          setNews(response.data?.data?.items || []);
        })
        .catch(() => setNews([]))
        .finally(() => setLoadingNews(false));
    };

    const reloadEvents = () => {
      setLoadingEvents(true);
      getHomeEvents()
        .then((fetchedEvents) => {
          const activeEvents = (fetchedEvents || []).filter((event) => event.isActive === true);
          setEvents(activeEvents);
        })
        .catch(() => setEvents([]))
        .finally(() => setLoadingEvents(false));
    };

    // Listen for news events (news are events, so use event listeners)
    onEvent('OnNewsCreated', reloadNews);
    onEvent('OnNewsUpdated', reloadNews);
    onEvent('OnNewsDeleted', reloadNews);
    onEvent('OnNewsApproved', reloadNews);
    onEvent('OnNewsUnhidden', reloadNews);

    // Listen for event updates
    onEvent('OnEventCreated', reloadEvents);
    onEvent('OnEventUpdated', reloadEvents);
    onEvent('OnEventDeleted', reloadEvents);
    onEvent('OnEventApproved', reloadEvents);
    onEvent('OnEventCancelled', reloadEvents);
    onEvent('OnEventShown', reloadEvents);
    onEvent('OnEventHidden', reloadEvents);
  }, []);

  // Swiper settings
  const swiperModules = [Autoplay, Pagination, Navigation];

  // Force Swiper reinitialization when events change
  useEffect(() => {
    if (events.length > 0) {
      // Trigger a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [events.length]);

  // Xử lý fallback ảnh: chỉ hiện NO_IMAGE nếu không có hoặc lỗi
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, globalThis.Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = NO_IMAGE;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'min-h-screen sm:pt-20 pt-8 sm:pb-12 pb-2',
        getThemeClass(
          'bg-gradient-to-r from-blue-500 to-cyan-400',
          'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900'
        )
      )}
    >
      {/* Spinner overlay cho loading event hoặc news */}
      <SpinnerOverlay show={loadingEvents || loadingNews} fullScreen={true} />
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        {/* Carousel */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full mb-12 relative"
        >
          {loadingEvents ? (
            <div className="flex justify-center items-center h-60">
              <Loader2
                className={cn(
                  'animate-spin w-10 h-10',
                  getThemeClass('text-blue-600', 'text-indigo-600')
                )}
              />
            </div>
          ) : events.length === 0 ? (
            <div
              className={cn(
                'text-center text-lg font-medium',
                getThemeClass('text-gray-700', 'text-slate-300')
              )}
            >
              {t('noApprovedEvents')}
            </div>
          ) : events.length > 0 ? (
            <Swiper
              key={events.length}
              modules={swiperModules}
              slidesPerView={1}
              loop={events.length > 1}
              pagination={{ clickable: true }}
              navigation={true}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
                waitForTransition: false,
              }}
              speed={800}
              effect="slide"
              grabCursor={true}
              className="w-full rounded-[16px]"
            >
              {events.slice(0, 5).map((event) => (
                <SwiperSlide key={event.eventId}>
                  <Link to={`/event/${event.eventId}`}>
                    <div className="relative sm:h-[400px] h-[300px] w-full overflow-hidden rounded-[16px] shadow-2xl">
                      <img
                        src={event.eventCoverImageUrl ? event.eventCoverImageUrl : NO_IMAGE}
                        alt={event.eventName}
                        className="object-cover w-full h-full opacity-90 hover:opacity-100 transition-opacity duration-300"
                        loading="lazy"
                        onError={handleImgError}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : null}
        </motion.div>

        {/* Sự kiện nổi bật + Tin tức */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Sự kiện nổi bật (2/3 bên trái) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className={cn(
              'lg:col-span-2 flex flex-col gap-4 p-6 md:p-8 rounded-xl shadow-xl',
              getThemeClass(
                'bg-white/95 border border-gray-200',
                'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border border-slate-700'
              )
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className={cn('text-2xl font-bold', getThemeClass('text-gray-900', 'text-white'))}
              >
                {t('featuredEvents')}
              </h2>
              <button
                type="button"
                onClick={() => navigate('/events')}
                className={cn(
                  'flex justify-center gap-2 items-center px-4 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105',
                  getThemeClass(
                    'bg-blue-600 text-white hover:bg-blue-700 shadow-lg',
                    'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'
                  )
                )}
              >
                {t('viewMore')}
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.slice(0, 6).map((event, idx) => (
                <motion.div
                  key={event.eventId}
                  className={cn(
                    'group backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden relative transition-all duration-400 hover:scale-[1.02]',
                    getThemeClass(
                      'bg-white/90 border border-gray-200 hover:shadow-lg hover:border-gray-300',
                      'bg-slate-700/80 border border-slate-600 hover:shadow-purple-500/30 hover:border-slate-500'
                    )
                  )}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  whileHover={{
                    boxShadow: getThemeClass(
                      '0 8px 32px 0 rgba(0,0,0,0.1)',
                      '0 8px 32px 0 rgba(139, 92, 246, 0.25)'
                    ),
                  }}
                  onClick={() => navigate(`/event/${event.eventId}`)}
                >
                  <Link to={`/event/${event.eventId}`} className="block">
                    {/* Image */}
                    <div className="relative w-full h-48 sm:h-52 md:h-60 overflow-hidden">
                      <img
                        src={
                          event.eventCoverImageUrl ||
                          'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                        }
                        alt={event.eventName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                        onError={handleImgError}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3
                        className={cn(
                          'text-lg font-bold mb-2 group-hover:transition-colors duration-200 line-clamp-2',
                          getThemeClass(
                            'text-gray-900 group-hover:text-blue-700',
                            'text-white group-hover:text-purple-300'
                          )
                        )}
                      >
                        {event.eventName}
                      </h3>
                      <p
                        className={cn(
                          'text-sm mb-3 line-clamp-2',
                          getThemeClass('text-gray-700', 'text-slate-300')
                        )}
                      >
                        {event.eventDescription}
                      </p>
                      <div
                        className={cn(
                          'flex items-center gap-2 text-sm',
                          getThemeClass('text-gray-500', 'text-slate-400')
                        )}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={cn(
                            'h-4 w-4 flex-shrink-0',
                            getThemeClass('text-blue-600', 'text-purple-400')
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          {new Date(event.startAt).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-2 text-sm mt-1',
                          getThemeClass('text-gray-500', 'text-slate-400')
                        )}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={cn(
                            'h-4 w-4 flex-shrink-0',
                            getThemeClass('text-blue-600', 'text-purple-400')
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="truncate">{event.eventLocation || t('tba')}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Tin tức (1/3 bên phải) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className={cn(
              'lg:col-span-1 p-6 md:p-8 rounded-xl shadow-xl',
              getThemeClass(
                'bg-white/95 border border-gray-200',
                'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border border-slate-700'
              )
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className={cn('text-2xl font-bold', getThemeClass('text-gray-900', 'text-white'))}
              >
                {t('latestNews')}
              </h2>
              <button
                type="button"
                onClick={() => navigate('/news')}
                className={cn(
                  'flex justify-center gap-2 items-center px-4 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105',
                  getThemeClass(
                    'bg-blue-600 text-white hover:bg-blue-700 shadow-lg',
                    'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'
                  )
                )}
              >
                {t('viewMore')}
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {loadingNews ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2
                    className={cn(
                      'animate-spin w-8 h-8',
                      getThemeClass('text-blue-600', 'text-indigo-600')
                    )}
                  />
                </div>
              ) : news.length === 0 ? (
                <div
                  className={cn(
                    'text-center py-8',
                    getThemeClass('text-gray-700', 'text-slate-300')
                  )}
                >
                  {t('noNews')}
                </div>
              ) : (
                news.slice(0, 6).map((item) => (
                  <Link
                    key={item.newsId}
                    to={`/news/${item.newsId}`}
                    className={cn(
                      'group block rounded-xl overflow-hidden transition-all duration-300',
                      getThemeClass(
                        'bg-white/90 border border-gray-200 hover:border-gray-300',
                        'bg-slate-700/80 border border-slate-600 hover:border-slate-500'
                      )
                    )}
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative h-32 sm:h-auto sm:w-1/3 flex-shrink-0">
                        <img
                          src={item.imageUrl || NO_IMAGE}
                          alt={item.newsTitle}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                          onError={handleImgError}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-black/60" />
                      </div>
                      <div className="p-4 sm:w-2/3">
                        <h3
                          className={cn(
                            'font-bold mb-2 group-hover:transition-colors duration-200 line-clamp-2',
                            getThemeClass(
                              'text-gray-900 group-hover:text-blue-700',
                              'text-white group-hover:text-purple-300'
                            )
                          )}
                        >
                          {item.newsTitle}
                        </h3>
                        <p
                          className={cn(
                            'text-sm line-clamp-2',
                            getThemeClass('text-gray-700', 'text-slate-300')
                          )}
                        >
                          {item.newsDescription}
                        </p>
                        {item.createdAt && (
                          <div
                            className={cn(
                              'mt-2 text-xs',
                              getThemeClass('text-gray-500', 'text-slate-400')
                            )}
                          >
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default HomePage;

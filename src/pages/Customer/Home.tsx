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
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { NO_IMAGE } from '@/assets/img';
import { connectNewsHub, onNews, connectEventHub, onEvent } from '@/services/signalr.service';
import { useTranslation } from 'react-i18next';

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

    // Kết nối SignalR hub
    connectNewsHub('http://localhost:5004/newsHub');
    connectEventHub('http://localhost:5004/notificationHub');
    // Lắng nghe realtime news
    const reloadNews = () => {
      setLoadingNews(true);
      getAllNewsHome()
        .then((response) => {
          setNews(response.data?.data?.items || []);
        })
        .catch(() => setNews([]))
        .finally(() => setLoadingNews(false));
    };
    onNews('OnNewsCreated', reloadNews);
    onNews('OnNewsUpdated', reloadNews);
    onNews('OnNewsDeleted', reloadNews);
    onNews('OnNewsApproved', reloadNews);
    onNews('OnNewsRejected', reloadNews);
    // Lắng nghe realtime event
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
    onEvent('OnEventCreated', reloadEvents);
    onEvent('OnEventUpdated', reloadEvents);
    onEvent('OnEventDeleted', reloadEvents);
    onEvent('OnEventApproved', reloadEvents);
    onEvent('OnEventCancelled', reloadEvents);
  }, []);

  // Swiper settings
  const swiperModules = [Autoplay, Pagination, Navigation];

  // Xử lý fallback ảnh: chỉ hiện NO_IMAGE nếu không có hoặc lỗi
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, globalThis.Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = NO_IMAGE;
  };

  return (
    <div
      className="relative min-h-screen bg-black pt-20"
      style={{
        backgroundColor: '#000000',
        minHeight: '100vh',
      }}
    >
      {/* Spinner overlay cho loading event hoặc news */}
      <SpinnerOverlay show={loadingEvents || loadingNews} />
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 pb-8"
        style={{ backgroundColor: '#000000' }}
      >
        {/* Carousel */}
        <div className="w-full mb-12 relative">
          {loadingEvents ? (
            <div className="flex justify-center items-center h-60">
              <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center text-lg text-gray-200">{t('noApprovedEvents')}</div>
          ) : (
            <Swiper
              modules={swiperModules}
              slidesPerView={1}
              loop={events.length > 1}
              pagination={{ clickable: true, dynamicBullets: true }}
              navigation={true}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              className="w-full"
            >
              {events.slice(0, 5).map((event) => (
                <SwiperSlide key={event.eventId}>
                  <Link to={`/event/${event.eventId}`}>
                    <div className="relative h-[400px] w-full overflow-hidden rounded-2xl shadow-lg">
                      <img
                        src={event.eventCoverImageUrl ? event.eventCoverImageUrl : NO_IMAGE}
                        alt={event.eventName}
                        className="object-cover w-full h-full opacity-90 hover:opacity-100 transition-opacity duration-300"
                        loading="lazy"
                        onError={handleImgError}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
        {/* Sự kiện nổi bật + Tin tức */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Sự kiện nổi bật (2/3 bên trái) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white">{t('featuredEvents')}</h2>
              <button
                className="text-blue-400 font-semibold hover:text-blue-300 hover:underline px-2 py-1 rounded transition"
                onClick={() => navigate('/events')}
              >
                {t('viewMore')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.slice(0, 3).map((event, idx) => (
                <motion.div
                  key={event.eventId}
                  className="group bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl overflow-hidden relative transition-all duration-400 hover:scale-[1.02] hover:shadow-2xl hover:border-white/40"
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  whileHover={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }}
                  onClick={() => navigate(`/event/${event.eventId}`)}
                >
                  <Link to={`/event/${event.eventId}`} className="block">
                    {/* Image */}
                    <div className="relative w-full h-48 sm:h-52 md:h-60 overflow-hidden">
                      <img
                        src={event.eventCoverImageUrl || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                        alt={event.eventName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                        onError={handleImgError}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors duration-200 line-clamp-2">
                        {event.eventName}
                      </h3>
                      <p className="text-gray-200 text-sm mb-3 line-clamp-2">
                        {event.eventDescription}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {new Date(event.startAt).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{event.eventLocation || t('tba')}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tin tức (1/3 bên phải) */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white">{t('latestNews')}</h2>
              <button
                className="text-blue-400 font-semibold hover:text-blue-300 hover:underline px-2 py-1 rounded transition"
                onClick={() => navigate('/news')}
              >
                {t('viewMore')}
              </button>
            </div>
            <div className="space-y-4">
              {loadingNews ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
                </div>
              ) : news.length === 0 ? (
                <div className="text-center text-gray-400 py-8">{t('noNews')}</div>
              ) : (
                news.slice(0, 3).map((item) => (
                  <Link
                    key={item.newsId}
                    to={`/news/${item.newsId}`}
                    className="group block rounded-xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-blue-500 transition-all duration-300"
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
                        <h3 className="font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                          {item.newsTitle}
                        </h3>
                        <p className="text-sm text-gray-300 line-clamp-2">{item.newsDescription}</p>
                        {item.createdAt && (
                          <div className="mt-2 text-xs text-gray-400">
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

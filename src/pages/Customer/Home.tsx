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
    <div className="relative min-h-screen bg-gray-50 pt-20">
      {/* Spinner overlay cho loading event hoặc news */}
      <SpinnerOverlay show={loadingEvents || loadingNews} />
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Carousel */}
        <div className="w-full mb-12 relative">
          {loadingEvents ? (
            <div className="flex justify-center items-center h-60">
              <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center text-lg text-gray-400">{t('noApprovedEvents')}</div>
          ) : (
            <Swiper
              modules={swiperModules}
              slidesPerView={1}
              loop={events.length > 1}
              pagination={{ clickable: true }}
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
                        className="object-cover w-full h-full"
                        loading="lazy"
                        onError={handleImgError}
                      />
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
              <h2 className="text-xl font-bold text-gray-800">{t('featuredEvents')}</h2>
              <button
                className="text-blue-600 font-semibold hover:underline px-2 py-1 rounded transition"
                onClick={() => navigate('/events')}
              >
                {t('viewMore')}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {events.slice(0, 3).map((event) => (
                <motion.div
                  key={event.eventId}
                  className="group relative rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-100 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                  whileHover={{ scale: 1.04 }}
                >
                  <Link to={`/event/${event.eventId}`}>
                    <div className="relative h-40 w-full overflow-hidden">
                      <img
                        src={event.eventCoverImageUrl ? event.eventCoverImageUrl : NO_IMAGE}
                        alt={event.eventName}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        onError={handleImgError}
                      />
                      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white/90 to-transparent" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors duration-200 line-clamp-1">
                        {event.eventName}
                      </h3>
                      <div className="flex flex-col gap-0.5 text-xs text-gray-400">
                        <span>
                          <b>{t('startAt')}:</b>{' '}
                          {new Date(event.startAt).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
          {/* Tin tức (1/3 bên phải) */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-800">{t('news')}</h2>
              <button
                className="text-blue-600 font-semibold hover:underline px-2 py-1 rounded transition"
                onClick={() => navigate('/news/all')}
              >
                {t('viewMore')}
              </button>
            </div>
            {loadingNews ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
              </div>
            ) : news.length === 0 ? (
              <div className="text-center text-lg text-gray-400">{t('noNews')}</div>
            ) : (
              news.slice(0, 3).map((item) => (
                <div
                  key={item.newsId}
                  className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
                  onClick={() => navigate(`/news/${item.newsId}`)}
                >
                  <img
                    src={item.imageUrl ? item.imageUrl : NO_IMAGE}
                    alt={item.newsTitle}
                    className="w-20 h-20 object-cover rounded-md"
                    onError={handleImgError}
                  />
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-2">
                      {item.newsTitle}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { getAllEvents, getAllNews } from '@/services/Event Manager/event.service';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import SpinnerOverlay from '@/components/SpinnerOverlay';

interface Event {
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
}

interface News {
  newsId: string;
  newsTitle: string;
  newsDescription: string;
  imageUrl: string;
  createdAt?: string;
}

export const HomePage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch events
    setLoadingEvents(true);
    getAllEvents()
      .then((fetchedEvents) => {
        // Filter for approved and non-canceled events
        const approvedEvents = fetchedEvents.filter(
          (event) => event.isApproved === 1 && !event.isCancelled
        );
        setEvents(approvedEvents);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));

    // Fetch news
    setLoadingNews(true);
    getAllNews(1, 10) // Get first page with 10 items
      .then((response) => {
        setNews(response.data?.data?.items || []);
      })
      .catch(() => setNews([]))
      .finally(() => setLoadingNews(false));
  }, []);

  const sliderSettings = {
    dots: true,
    infinite: events.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 4000,
    className: 'w-full',
  };

  return (
    <div className="relative min-h-screen bg-gray-50 pt-20">
      {/* Spinner overlay cho loading event hoặc news */}
      <SpinnerOverlay show={loadingEvents || loadingNews} />
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Carousel */}
        <div className="w-full mb-12">
          {loadingEvents ? (
            <div className="flex justify-center items-center h-60">
              <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center text-lg text-gray-400">
              Không có sự kiện nào được phê duyệt.
            </div>
          ) : (
            <Slider {...sliderSettings}>
              {events.slice(0, 5).map((event) => (
                <div key={event.eventId} className="px-2">
                  <Link to={`/event/${event.eventId}`}>
                    <div className="relative h-[400px] w-full overflow-hidden rounded-2xl shadow-lg">
                      <img
                        src={event.eventCoverImageUrl}
                        alt={event.eventName}
                        className="object-cover w-full h-full"
                        loading="lazy"
                      />
                    </div>
                  </Link>
                </div>
              ))}
            </Slider>
          )}
        </div>
        {/* Sự kiện nổi bật + Tin tức */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Sự kiện nổi bật (2/3 bên trái) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-800">Sự kiện nổi bật</h2>
              <button
                className="text-blue-600 font-semibold hover:underline px-2 py-1 rounded transition"
                onClick={() => navigate('/events')}
              >
                Xem thêm
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
                        src={event.eventCoverImageUrl}
                        alt={event.eventName}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white/90 to-transparent" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors duration-200 line-clamp-1">
                        {event.eventName}
                      </h3>
                      <div className="flex flex-col gap-0.5 text-xs text-gray-400">
                        <span>
                          <b>Bắt đầu:</b>{' '}
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
              <h2 className="text-xl font-bold text-gray-800">Tin tức</h2>
              <button
                className="text-blue-600 font-semibold hover:underline px-2 py-1 rounded transition"
                onClick={() => navigate('/news')}
              >
                Xem thêm
              </button>
            </div>
            {loadingNews ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
              </div>
            ) : news.length === 0 ? (
              <div className="text-center text-lg text-gray-400">Không có tin tức nào.</div>
            ) : (
              news.slice(0, 3).map((item) => (
                <div
                  key={item.newsId}
                  className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
                  onClick={() => navigate(`/news/${item.newsId}`)}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.newsTitle}
                    className="w-20 h-20 object-cover rounded-md"
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

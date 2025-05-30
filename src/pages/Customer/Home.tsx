import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { getAllEvents } from '@/services/Event Manager/event.service';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

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
}

export const HomePage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getAllEvents()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
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
    <div className="relative min-h-screen bg-gray-50">
      <div className="relative z-10 pt-32 max-w-7xl mx-auto px-4">
        {/* Banner */}
        <div className="w-full flex justify-center mb-10">
          <div className="w-full max-w-3xl h-36 md:h-44 rounded-2xl bg-white flex flex-col items-center justify-center shadow-md border border-gray-200">
            <span className="text-2xl md:text-4xl font-extrabold text-gray-800 mb-2 text-center">
              Đặt vé sự kiện, trải nghiệm cực đỉnh!
            </span>
            <span className="text-gray-500 text-base text-center">
              Khám phá và tham gia các sự kiện hấp dẫn nhất hôm nay.
            </span>
          </div>
        </div>

        {/* Layout 2 cột: Carousel + Grid */}
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {/* Carousel bên trái (chiếm 2/3 trên desktop) */}
          <div className="w-full lg:w-2/3">
            {loading ? (
              <div className="flex justify-center items-center h-60">
                <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center text-lg text-gray-400">Không có sự kiện nào.</div>
            ) : (
              <Slider {...sliderSettings}>
                {events.slice(0, 5).map((event) => (
                  <div key={event.eventId} className="px-2">
                    <div className="group relative rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-100 hover:shadow-2xl transition-all duration-300 cursor-pointer">
                      <Link to={`/event/${event.eventId}`}>
                        <div className="relative h-60 w-full overflow-hidden">
                          <img
                            src={event.eventCoverImageUrl}
                            alt={event.eventName}
                            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white/90 to-transparent" />
                        </div>
                        <div className="p-5">
                          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors duration-200 line-clamp-1">
                            {event.eventName}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <svg
                              className="w-4 h-4 text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 0c-3.314 0-6 2.686-6 6 0 1.657 1.343 3 3 3h6c1.657 0 3-1.343 3-3 0-3.314-2.686-6-6-6z"
                              />
                            </svg>
                            <span className="truncate">{event.eventLocation}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {event.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-semibold"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex flex-col gap-1 text-xs text-gray-400">
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
                            <span>
                              <b>Kết thúc:</b>{' '}
                              {new Date(event.endAt).toLocaleString('vi-VN', {
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
                    </div>
                  </div>
                ))}
              </Slider>
            )}
          </div>
          {/* Grid 3 sự kiện nổi bật bên phải (chiếm 1/3 trên desktop) */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-800">Sự kiện nổi bật</h2>
              <button
                className="text-blue-600 font-semibold hover:underline px-2 py-1 rounded transition"
                onClick={() => navigate('/events')}
              >
                Xem thêm
              </button>
            </div>
            {events.slice(0, 3).map((event) => (
              <motion.div
                key={event.eventId}
                className="group relative rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-100 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                whileHover={{ scale: 1.04 }}
              >
                <Link to={`/event/${event.eventId}`}>
                  <div className="relative h-32 w-full overflow-hidden">
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
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <svg
                        className="w-3 h-3 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 0c-3.314 0-6 2.686-6 6 0 1.657 1.343 3 3 3h6c1.657 0 3-1.343 3-3 0-3.314-2.686-6-6-6z"
                        />
                      </svg>
                      <span className="truncate">{event.eventLocation}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {event.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs font-semibold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
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
      </div>
    </div>
  );
};

export default HomePage;

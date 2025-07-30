import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHomeEvents } from '@/services/Event Manager/event.service';
import { connectEventHub, onEvent } from '@/services/signalr.service';
import { StageBackground } from '@/components/StageBackground';
import { useTranslation } from 'react-i18next';

export interface Event {
  eventId: string;
  eventName: string;
  eventCoverImageUrl: string;
  startAt: string;
  endAt: string;
  eventLocation: string;
  isApproved: number;
  isCancelled: boolean;
  isActive: boolean; // Thêm trường này để khớp dữ liệu API
}

const AllEventsPage = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to reload events
  const reloadEvents = () => {
    setLoading(true);
    getHomeEvents()
      .then((fetchedEvents) => {
        const activeEvents = (fetchedEvents || []).filter(
          (event) => event.isActive !== false && !event.isCancelled
        );
        setEvents(activeEvents);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  // Connect to EventHub for real-time updates
  useEffect(() => {
    connectEventHub('http://localhost:5004/notificationHub');
    
    // Listen for real-time event updates
    onEvent('EventCreated', (data: any) => {
      // ...removed log...
      reloadEvents();
    });
    
    onEvent('EventUpdated', (data: any) => {
      // ...removed log...
      reloadEvents();
    });
    
    onEvent('EventApproved', (data: any) => {
      // ...removed log...
      reloadEvents();
    });
    
    onEvent('EventCancelled', (data: any) => {
      // ...removed log...
      reloadEvents();
    });

    // Initial data load
    reloadEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      }}
    >
      <StageBackground />
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center pt-40 pb-10 overflow-visible">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.2] py-4 font-sans bg-gradient-to-r from-pink-400 via-cyan-400 to-yellow-200 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] animate-titleGlow mb-4 overflow-visible">
            {t('allEventsTitle')}
          </h1>
          <p className="text-xl text-gray-200 mb-8 animate-fadeInUp">
            Sân khấu của những trải nghiệm đáng nhớ ✨
          </p>
          {/* Music Visualizer */}
          <div className="flex justify-center gap-1 mb-8 music-visualizer">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`bar bg-gradient-to-t from-pink-400 to-cyan-400 rounded animate-musicBar`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
        {/* Events Grid */}
        <div className="events-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 px-4 pb-20 max-w-7xl mx-auto">
          {loading ? (
            <div className="col-span-full text-center text-2xl text-pink-400 py-20 animate-pulse">
              {t('loadingEvents')}
            </div>
          ) : events.length === 0 ? (
            <div className="col-span-full text-center text-lg text-gray-400 py-20">
              {t('noApprovedEvents')}
            </div>
          ) : (
            events.map((event, idx) => (
              <div
                key={event.eventId}
                className="event-card bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl overflow-hidden relative transition-all duration-400 hover:scale-105 hover:shadow-2xl hover:border-white/40 animate-cardFloat"
                style={{ animationDelay: `${idx % 2 === 0 ? 0 : 4}s` }}
              >
                <div
                  className="event-image w-full h-52 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${event.eventCoverImageUrl})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
                <div className="event-content p-6">
                  <div className="event-header flex justify-between items-start mb-2">
                    <div className="genre-badge bg-gradient-to-r from-pink-400 to-cyan-400 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {t('eventBadge')}
                    </div>
                  </div>
                  <h3 className="event-title text-xl font-bold text-white mb-2">
                    {event.eventName}
                  </h3>
                  <div className="event-meta flex flex-col gap-1 mb-3 text-cyan-300 text-sm">
                    <div className="meta-item flex items-center gap-2">
                      <svg className="meta-icon w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                      </svg>
                      {new Date(event.startAt).toLocaleString('vi-VN')}
                    </div>
                    <div className="meta-item flex items-center gap-2">
                      <svg className="meta-icon w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      {event.eventLocation}
                    </div>
                  </div>
                  <div className="event-actions flex gap-3 mt-4">
                    <button
                      className="btn-primary flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-extrabold py-3 rounded-full shadow hover:scale-105 hover:brightness-125 transition relative overflow-hidden tracking-wide drop-shadow-lg"
                      onClick={() => navigate(`/event/${event.eventId}`)}
                    >
                      {t('bookTickets')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Custom CSS for animation */}
      <style>{`
        @keyframes titleGlow {
          0% { filter: drop-shadow(0 0 10px rgba(255,107,107,0.7)); }
          50% { filter: drop-shadow(0 0 20px rgba(78,205,196,0.7)); }
          100% { filter: drop-shadow(0 0 15px rgba(69,183,209,0.7)); }
        }
        .animate-titleGlow { animation: titleGlow 4s ease-in-out infinite alternate; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fadeInUp { animation: fadeInUp 1s ease-out 0.5s both;}
        @keyframes musicBar {
          0% { height: 10px; opacity: 0.6;}
          100% { height: 60px; opacity: 1;}
        }
        .music-visualizer .bar { width: 4px; border-radius: 2px; animation: musicBar 1s ease-in-out infinite alternate;}
        @keyframes cardFloat {
          0%,100% { transform: translateY(0px);}
          50% { transform: translateY(-15px);}
        }
        .animate-cardFloat { animation: cardFloat 8s ease-in-out infinite;}
        .event-card:hover .play-overlay { opacity: 1;}
        .play-icon { width: 0; height: 0; border-left: 15px solid white; border-top: 10px solid transparent; border-bottom: 10px solid transparent; margin-left: 3px;}
      `}</style>
    </div>
  );
};

export default AllEventsPage;

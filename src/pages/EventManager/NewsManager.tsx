import React, { useEffect, useState } from "react";
import { getMyApprovedEvents, getMyNews, deleteNews } from "@/services/Event Manager/event.service";
import { News } from "@/types/event";
import { FaPlus, FaChevronLeft, FaChevronRight, FaTrash, FaNewspaper } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { connectEventHub, onEvent } from '@/services/signalr.service';
import { connectNewsHub, onNews } from '@/services/signalr.service';
import { useTranslation } from 'react-i18next';

interface Event {
  eventId: string;
  eventName: string;
  startAt: string;
  endAt: string;
  isApproved: number;
  isCancelled: boolean;
  creatorId?: string;
}

const EVENTS_PER_PAGE = 3;

const NewsManager: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchEvent, setSearchEvent] = useState("");
  const [eventPage, setEventPage] = useState(1);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [searchNews, setSearchNews] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    connectEventHub('http://localhost:5004/notificationHub');
    connectNewsHub('http://localhost:5004/newsHub');
    (async () => {
      setLoadingEvents(true);
      try {
        const data = await getMyApprovedEvents(1, 100);
        setEvents(data);
        setFilteredEvents(data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
        toast.error("Không thể tải danh sách sự kiện!");
      } finally {
        setLoadingEvents(false);
      }
    })();
    // Lắng nghe realtime SignalR
    const reload = async () => {
      try {
        const data = await getMyApprovedEvents(1, 100);
        setEvents(data);
        setFilteredEvents(data);
      } catch {}
    };
    onEvent('OnEventCreated', reload);
    onEvent('OnEventUpdated', reload);
    onEvent('OnEventDeleted', reload);
    onEvent('OnEventCancelled', reload);
    onEvent('OnEventApproved', reload);
    // Lắng nghe realtime SignalR cho news
    const reloadNews = () => {
      if (selectedEvent) fetchNewsForEvent(selectedEvent.eventId);
    };
    onNews('OnNewsCreated', reloadNews);
    onNews('OnNewsUpdated', reloadNews);
    onNews('OnNewsDeleted', reloadNews);
    onNews('OnNewsApproved', reloadNews);
    onNews('OnNewsRejected', reloadNews);
    // Cleanup: không cần offEvent vì signalr.service chưa hỗ trợ
  }, []);

  useEffect(() => {
    if (!searchEvent.trim()) {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(
        events.filter(ev =>
          ev.eventName.toLowerCase().includes(searchEvent.trim().toLowerCase())
        )
      );
      setEventPage(1);
    }
  }, [searchEvent, events]);

  const totalEventPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PER_PAGE));
  const pagedEvents = filteredEvents.slice(
    (eventPage - 1) * EVENTS_PER_PAGE,
    eventPage * EVENTS_PER_PAGE
  );

  const fetchNewsForEvent = async (eventId: string) => {
    setLoadingNews(true);
    try {
      // Lấy tất cả news của user, sau đó lọc theo eventId
      const response = await getMyNews(1, 100);
      const newsItems = response.data?.data?.items || [];
      const activeNews = newsItems.filter((news: News) => news.status && news.eventId === eventId);
      setNewsList(activeNews);
    } catch (error) {
      toast.error("Không thể tải tin tức!");
      setNewsList([]);
    } finally {
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      fetchNewsForEvent(selectedEvent.eventId);
    } else {
      setNewsList([]);
    }
  }, [selectedEvent, window.location.pathname]);

  const handleDelete = async (newsId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tin tức này?")) {
      try {
        await deleteNews(newsId);
        toast.success("Xóa tin tức thành công!");
        if (selectedEvent) {
          fetchNewsForEvent(selectedEvent.eventId); // Refresh the list
        }
      } catch (error) {
        console.error("Failed to delete news:", error);
        toast.error("Xóa tin tức thất bại!");
      }
    }
  };

  useEffect(() => {
    if (eventPage > totalEventPages) setEventPage(1);
  }, [totalEventPages, eventPage]);

  // Lọc news theo searchNews
  const filteredNewsList = searchNews.trim()
    ? newsList.filter(news =>
        news.newsTitle.toLowerCase().includes(searchNews.trim().toLowerCase()) ||
        news.newsDescription.toLowerCase().includes(searchNews.trim().toLowerCase())
      )
    : newsList;

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] py-0 px-0">
      <div className="w-full max-w-7xl mx-auto bg-[#2d0036]/80 rounded-2xl shadow-2xl p-8 mt-10 mb-10 flex flex-col md:flex-row gap-10">
        {/* Event List */}
        <div className="w-full md:w-1/3">
          <div className="flex items-center gap-3 mb-6">
            <FaNewspaper className="text-3xl text-pink-400" />
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent uppercase tracking-wide">
              {t('yourEvents')}
            </h2>
          </div>
          <input
            type="text"
            value={searchEvent}
            onChange={e => setSearchEvent(e.target.value)}
            placeholder={t('searchEvent')}
            className="w-full p-3 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 text-base focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 mb-4"
          />
          {loadingEvents ? (
            <div className="text-pink-400 text-base text-center">{t('loading')}</div>
          ) : (
            <div className="space-y-4">
              {pagedEvents.length === 0 && (
                <div className="text-slate-300 text-center text-base">{t('noEventsFound')}</div>
              )}
              {pagedEvents.map((event) => (
                <div
                  key={event.eventId}
                  className={`cursor-pointer bg-gradient-to-r from-[#3a0ca3]/60 to-[#ff008e]/60 rounded-xl p-5 shadow-xl border-2 border-pink-500/20
                    ${selectedEvent?.eventId === event.eventId ? "ring-4 ring-yellow-400/60 scale-105" : "hover:ring-2 hover:ring-pink-400/60 hover:scale-105"} transition-all duration-200`}
                  onClick={() => setSelectedEvent(event)}
                  style={{ minHeight: 90 }}
                >
                  <div className="text-base font-bold text-pink-200 mb-1">{event.eventName}</div>
                  <div className="text-slate-300 text-xs mb-1">
                    {event.startAt?.slice(0, 10)} - {event.endAt?.slice(0, 10)}
                  </div>
                  <button
                    className="mt-2 w-full bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-500 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg uppercase tracking-wider transition-all duration-200 text-base"
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                      navigate(`/event-manager/news/create/${event.eventId}`);
                    }}
                    disabled={!event}
                  >
                    <FaPlus className="inline mr-2" /> {t('createNews')}
                  </button>
                </div>
              ))}
              {/* Pagination */}
              {totalEventPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button
                    className="p-2 rounded-full bg-pink-500 text-white disabled:opacity-50 hover:bg-pink-600 transition-colors"
                    disabled={eventPage === 1}
                    onClick={() => setEventPage(p => Math.max(1, p - 1))}
                  >
                    <FaChevronLeft />
                  </button>
                  <span className="text-white font-bold">
                    {t('page')} {eventPage}/{totalEventPages}
                  </span>
                  <button
                    className="p-2 rounded-full bg-pink-500 text-white disabled:opacity-50 hover:bg-pink-600 transition-colors"
                    disabled={eventPage === totalEventPages}
                    onClick={() => setEventPage(p => Math.min(totalEventPages, p + 1))}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {/* News List */}
        <div className="w-full md:w-2/3">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-yellow-300 mb-2">
              {selectedEvent ? `${t('newsFor')} "${selectedEvent.eventName}"` : t('selectEventToViewNews')}
            </h2>
            {selectedEvent && (
              <input
                type="text"
                placeholder={t('searchNews')}
                className="w-full md:w-72 p-3 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 text-base focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                value={searchNews}
                onChange={e => setSearchNews(e.target.value)}
              />
            )}
          </div>
          {!selectedEvent ? (
            <div className="text-slate-300 text-center text-lg mt-10">
              {t('pleaseSelectAnEventToViewAndManageNews')}
            </div>
          ) : (
            <>
              {loadingNews ? (
                <div className="text-pink-400 text-base text-center">{t('loadingNews')}</div>
              ) : (
                <div className="space-y-6">
                  {newsList.length === 0 ? (
                    <div className="text-slate-300 text-center text-lg bg-[#1a0022]/40 rounded-xl p-8">
                      <FaNewspaper className="mx-auto text-4xl text-pink-400 mb-4" />
                      <p className="mb-4">
                        {loadingNews ? t('loadingNews') : 
                         t('noNewsFoundForThisEventOrYouDoNotHavePermission')}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {filteredNewsList.map((news) => (
                        <div key={news.newsId} className="bg-[#1a0022]/60 rounded-xl p-6 border-2 border-pink-500/20 hover:border-pink-400/40 transition-all duration-200">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-pink-200 mb-1">{news.newsTitle}</h3>
                              <p className="text-slate-300 text-sm mb-1 line-clamp-2">{news.newsDescription}</p>
                              <div className="text-xs text-slate-400">
                                {t('createdAt')}: {news.createdAt ? new Date(news.createdAt).toLocaleString('vi-VN') : t('na')}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2 md:mt-0">
                              <button
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                                onClick={() => navigate(`/event-manager/news/edit/${news.newsId}`)}
                                title={t('editNews')}
                              >
                                <span className="hidden md:inline">{t('edit')}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" /></svg>
                              </button>
                              <button
                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1"
                                onClick={() => handleDelete(news.newsId)}
                                title={t('deleteNews')}
                              >
                                <span className="hidden md:inline">{t('delete')}</span>
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsManager;
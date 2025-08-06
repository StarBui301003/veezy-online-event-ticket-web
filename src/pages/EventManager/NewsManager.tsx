import React, { useEffect, useState } from "react";
import { getMyApprovedEvents, getMyNews, deleteNews } from "@/services/Event Manager/event.service";
import { News } from "@/types/event";
import { FaPlus, FaChevronLeft, FaChevronRight, FaTrash, FaNewspaper } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { connectEventHub, onEvent, connectNewsHub, onNews, disconnectEventHub, disconnectNewsHub } from '@/services/signalr.service';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

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

const DeleteNewsConfirmation = ({ news, open, onClose, onConfirm, isConfirming }) => {
  const { t } = useTranslation();
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          disabled={isConfirming}
        >
          <X size={24} />
        </button>
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center animate-pulse">
            <FaTrash size={32} className="text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center mb-4">
          {t('newsManager.deleteConfirmationTitle')}
        </h2>
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
          <p className="text-red-800 dark:text-red-200 font-medium">
            {t('newsManager.deleteConfirmationMessage')}
          </p>
          <p className="text-red-600 dark:text-red-300 text-sm mt-1">
            {t('newsManager.deleteConfirmationWarning')}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6 border-l-4 border-red-500">
          <h3 className="font-semibold text-gray-800 dark:text-white text-lg mb-2">
            {news?.newsTitle || t('newsManager.notAvailable')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {news?.newsDescription || t('newsManager.notAvailable')}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none transition-all duration-300 flex items-center gap-2 min-w-[140px] justify-center"
          >
            {isConfirming ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('newsManager.deleting')}
              </>
            ) : (
              <>
                <FaTrash size={16} />
                {t('newsManager.deleteButton')}
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none transition-all duration-300 min-w-[140px]"
          >
            {t('newsManager.cancelButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

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

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    news: null as News | null,
    isConfirming: false,
  });

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
        toast.error(t('newsManager.errorFetchingEvents'));
      } finally {
        setLoadingEvents(false);
      }
    })();
    
    // Lắng nghe realtime SignalR cho events
    const reloadEvents = async () => {
      try {
        const data = await getMyApprovedEvents(1, 100);
        setEvents(data);
        setFilteredEvents(data);
      } catch {}
    };
    onEvent('OnEventCreated', reloadEvents);
    onEvent('OnEventUpdated', reloadEvents);
    onEvent('OnEventDeleted', reloadEvents);
    onEvent('OnEventCancelled', reloadEvents);
    onEvent('OnEventApproved', reloadEvents);
    onEvent('OnEventHidden', reloadEvents);
    onEvent('OnEventShown', reloadEvents);
    
    // Lắng nghe realtime SignalR cho news
    const reloadNews = () => {
      if (selectedEvent) fetchNewsForEvent(selectedEvent.eventId);
    };
    onNews('OnNewsCreated', reloadNews);
    onNews('OnNewsUpdated', reloadNews);
    onNews('OnNewsDeleted', reloadNews);
    onNews('OnNewsApproved', reloadNews);
    onNews('OnNewsRejected', reloadNews);
    onNews('OnNewsHidden', reloadNews);
    onNews('OnNewsUnhidden', reloadNews);
    
    // Cleanup
    return () => {
      disconnectEventHub();
      disconnectNewsHub();
    };
  }, [selectedEvent]);

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
      toast.error(t('newsManager.errorFetchingNews'));
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

  const handleDeleteNews = (news: News) => {
    setDeleteModal({
      open: true,
      news,
      isConfirming: false,
    });
  };

  const confirmDeleteNews = async () => {
    if (!deleteModal.news) return;
    
    setDeleteModal(prev => ({ ...prev, isConfirming: true }));
    
    try {
      await deleteNews(deleteModal.news.newsId);
      // Refresh the news list after successful deletion
      if (selectedEvent) {
        fetchNewsForEvent(selectedEvent.eventId); // Refresh the list
      }
      toast.success(t('newsManager.newsDeletedSuccessfully'));
    } catch (error) {
      console.error('Error deleting news:', error);
      toast.error(t('newsManager.errorDeletingNews'));
    } finally {
      setDeleteModal({
        open: false,
        news: null,
        isConfirming: false,
      });
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
              {t('newsManager.yourEvents')}
            </h2>
          </div>
          <input
            type="text"
            value={searchEvent}
            onChange={e => setSearchEvent(e.target.value)}
            placeholder={t('newsManager.searchEvents')}
            className="w-full p-3 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 text-base focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 mb-4"
          />
          {loadingEvents ? (
            <div className="text-pink-400 text-base text-center">
              {t('newsManager.loading')}
            </div>
          ) : (
            <div className="space-y-4">
              {pagedEvents.length === 0 && (
                <div className="text-slate-300 text-center text-base">
                  {t('newsManager.noEventsFound')}
                </div>
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
                    <FaPlus className="inline mr-2" /> {t('newsManager.createNews')}
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
                    aria-label={t('newsManager.previousPage')}
                  >
                    <FaChevronLeft />
                  </button>
                  <span className="text-white font-bold">
                    {t('newsManager.page')} {eventPage}/{totalEventPages}
                  </span>
                  <button
                    className="p-2 rounded-full bg-pink-500 text-white disabled:opacity-50 hover:bg-pink-600 transition-colors"
                    disabled={eventPage === totalEventPages}
                    onClick={() => setEventPage(p => Math.min(totalEventPages, p + 1))}
                    aria-label={t('newsManager.nextPage')}
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
              {selectedEvent ? `${t('newsManager.newsFor')} "${selectedEvent.eventName}"` : t('newsManager.selectEventToViewNews')}
            </h2>
            {selectedEvent && (
              <input
                type="text"
                placeholder={t('newsManager.searchNews')}
                className="w-full md:w-72 p-3 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 text-base focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                value={searchNews}
                onChange={e => setSearchNews(e.target.value)}
              />
            )}
          </div>
          {!selectedEvent ? (
            <div className="text-slate-300 text-center text-lg mt-10">
              {t('newsManager.pleaseSelectAnEventToViewAndManageNews')}
            </div>
          ) : (
            <>
              {loadingNews ? (
                <div className="text-pink-400 text-base text-center">
                  {t('newsManager.loadingNews')}
                </div>
              ) : (
                <div className="space-y-6">
                  {newsList.length === 0 ? (
                    <div className="text-slate-300 text-center text-lg bg-[#1a0022]/40 rounded-xl p-8">
                      <FaNewspaper className="mx-auto text-4xl text-pink-400 mb-4" />
                      <p className="mb-4">
                        {loadingNews ? t('newsManager.loadingNews') : t('newsManager.noNewsFoundForThisEvent')}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {filteredNewsList.map((news) => (
                        <div key={news.newsId} className="bg-[#1a0022]/60 rounded-xl p-6 border-2 border-pink-500/20 hover:border-pink-400/40 transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/10">
                          <div className="flex flex-col">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-pink-200 mb-2">{news.newsTitle}</h3>
                              <p className="text-slate-300 text-sm mb-3 line-clamp-2">{news.newsDescription}</p>
                              <div className="flex items-center text-xs text-slate-400 mb-4">
                                <span className="bg-[#2d0036] px-2 py-1 rounded-md border border-pink-500/30">
                                  {news.createdAt ? new Date(news.createdAt).toLocaleString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  }).replace(',', '') : t('newsManager.notAvailable')}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-2">
                              <button
                                className="group relative px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 flex items-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/event-manager/news/edit/${news.newsId}`);
                                }}
                                title={t('newsManager.editNews')}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" />
                                </svg>
                                <span className="hidden md:inline">{t('newsManager.edit')}</span>
                              </button>
                              <button
                                className="group relative px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 flex items-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNews(news);
                                }}
                                title={t('newsManager.deleteNews')}
                              >
                                <FaTrash className="w-4 h-4" />
                                <span className="hidden md:inline">{t('newsManager.delete')}</span>
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
      <DeleteNewsConfirmation
        news={deleteModal.news}
        open={deleteModal.open}
        onClose={() => setDeleteModal(prev => ({ ...prev, open: false }))}
        onConfirm={confirmDeleteNews}
        isConfirming={deleteModal.isConfirming}
      />
    </div>
  );
};

export default NewsManager;
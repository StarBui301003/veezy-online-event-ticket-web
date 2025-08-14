import { useEffect, useState, useCallback } from 'react';
import {
  getMyApprovedEvents,
  getTicketsByEvent,
  deleteTicket,
} from '@/services/Event Manager/event.service';
import { FaEdit, FaTrash, FaSearch, FaPlus, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { onEvent, onTicket } from '@/services/signalr.service';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

interface Event {
  eventId: string;
  eventName: string;
  startAt?: string;
  endAt?: string;
  isApproved?: number;
}

interface Ticket {
  ticketId: string;
  eventId: string;
  ticketName: string;
  ticketDescription: string;
  ticketPrice: number;
  quantityAvailable: number;
  startSellAt: string;
  endSellAt: string;
  maxTicketsPerOrder: number;
  isTransferable: boolean;
  imageUrl?: string;
  status?: string;
}

const EVENTS_PER_PAGE = 3;

export default function EventListWithTicketManager() {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchEvent, setSearchEvent] = useState('');
  const [searchTicket, setSearchTicket] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [eventPage, setEventPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalEventPages, setTotalEventPages] = useState(1);
  const navigate = useNavigate();

  // Optimized load events function
  const loadEvents = useCallback(async (page: number = 1) => {
    if (loadingEvents) return; // Prevent concurrent requests
    
    setLoadingEvents(true);
    try {
      const data = await getMyApprovedEvents(page, EVENTS_PER_PAGE);
      
      setEvents(data?.items || []);
      setTotalEvents(data?.totalCount || 0);
      setTotalEventPages(Math.max(1, Math.ceil((data?.totalCount || 0) / EVENTS_PER_PAGE)));
      setEventPage(page);
      
      console.log('Loaded events:', {
        page,
        totalEvents: data?.totalCount,
        eventsCount: data?.items?.length,
        totalPages: Math.ceil((data?.totalCount || 0) / EVENTS_PER_PAGE)
      });
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
      setTotalEvents(0);
      setTotalEventPages(1);
    } finally {
      setLoadingEvents(false);
    }
  }, [loadingEvents]);

  // Load tickets for selected event
  const loadTicketsForEvent = useCallback(async (eventId: string) => {
    setLoadingTickets(true);
    try {
      const data = await getTicketsByEvent(eventId);
      setTickets(data);
      setFilteredTickets(data);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setTickets([]);
      setFilteredTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadEvents(1);
  }, []);

  // SignalR real-time updates
  useEffect(() => {
    // Event updates
    onEvent('OnEventCreated', () => {
      loadEvents(1); // Go to first page when new event created
    });

    onEvent('OnEventUpdated', () => {
      loadEvents(eventPage); // Reload current page
    });

    onEvent('OnEventDeleted', () => {
      loadEvents(eventPage);
    });

    onEvent('OnEventApproved', () => {
      loadEvents(1); // Go to first page for new approved events
    });

    // Ticket updates
    onTicket('TicketCreated', () => {
      if (selectedEvent) {
        loadTicketsForEvent(selectedEvent.eventId);
      }
    });

    onTicket('TicketUpdated', () => {
      if (selectedEvent) {
        loadTicketsForEvent(selectedEvent.eventId);
      }
    });

    onTicket('TicketDeleted', () => {
      if (selectedEvent) {
        loadTicketsForEvent(selectedEvent.eventId);
      }
    });

    onTicket('TicketIssued', () => {
      if (selectedEvent) {
        loadTicketsForEvent(selectedEvent.eventId);
      }
    });
  }, [eventPage, selectedEvent, loadEvents, loadTicketsForEvent]);

  // Search events (client-side filtering of current page)
  const filteredEvents = searchEvent.trim()
    ? events.filter((ev) =>
        ev.eventName.toLowerCase().includes(searchEvent.trim().toLowerCase())
      )
    : events;

  // Load tickets when event selected
  useEffect(() => {
    if (!selectedEvent) {
      setTickets([]);
      setFilteredTickets([]);
      return;
    }
    loadTicketsForEvent(selectedEvent.eventId);
  }, [selectedEvent, loadTicketsForEvent]);

  // Search tickets (client-side filtering)
  useEffect(() => {
    if (!searchTicket.trim()) {
      setFilteredTickets(tickets);
    } else {
      setFilteredTickets(
        tickets.filter(
          (t) =>
            t.ticketName.toLowerCase().includes(searchTicket.trim().toLowerCase()) ||
            t.ticketDescription.toLowerCase().includes(searchTicket.trim().toLowerCase())
        )
      );
    }
  }, [searchTicket, tickets]);

  // Delete ticket handler
  const handleDelete = async (ticketId: string) => {
    if (!window.confirm(t('eventListWithTicketManager.confirmDeleteTicket'))) return;
    
    try {
      await deleteTicket(ticketId);
      if (selectedEvent) {
        await loadTicketsForEvent(selectedEvent.eventId);
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  // Page change handler
  const handlePageChange = async (newPage: number) => {
    if (newPage === eventPage || loadingEvents) return;
    if (newPage < 1 || newPage > totalEventPages) return;
    
    // Reset search when changing page
    setSearchEvent('');
    await loadEvents(newPage);
  };

  return (
    <div
      className={cn(
        'w-full min-h-screen flex items-center justify-center py-0 px-0',
        getThemeClass(
          'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
          'bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e]'
        )
      )}
    >
      <div
        className={cn(
          'w-full max-w-7xl mx-auto rounded-2xl shadow-2xl p-8 mt-10 mb-10 flex flex-col md:flex-row gap-10',
          getThemeClass('bg-white/95 border border-gray-200 shadow-lg', 'bg-[#2d0036]/80')
        )}
      >
        {/* Left Column: Event List */}
        <div className="w-full md:w-1/3">
          <h2
            className={cn(
              'text-2xl font-extrabold bg-clip-text text-transparent mb-6 uppercase tracking-wide text-center',
              getThemeClass(
                'bg-gradient-to-r from-blue-600 to-purple-600',
                'bg-gradient-to-r from-pink-400 to-yellow-400'
              )
            )}
          >
            {t('eventListWithTicketManager.yourEvents')}
          </h2>
          
          {/* Search Input */}
          <input
            type="text"
            value={searchEvent}
            onChange={(e) => setSearchEvent(e.target.value)}
            placeholder={t('eventListWithTicketManager.searchEvents')}
            className={cn(
              'w-full p-3 rounded-xl text-base focus:ring-2 focus:border-transparent transition-all duration-200 mb-4',
              getThemeClass(
                'bg-white border-2 border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                'bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
              )
            )}
          />

          {/* Loading State */}
          {loadingEvents && (
            <div
              className={cn(
                'text-base text-center py-4',
                getThemeClass('text-blue-600', 'text-pink-400')
              )}
            >
              {t('eventListWithTicketManager.loadingEvents')}...
            </div>
          )}

          {/* Events List */}
          {!loadingEvents && (
            <div className="space-y-4">
              {filteredEvents.length === 0 && (
                <div
                  className={cn(
                    'text-center text-base py-4',
                    getThemeClass('text-gray-600', 'text-slate-300')
                  )}
                >
                  {searchEvent.trim() ? t('eventListWithTicketManager.noEventsFound') : t('eventListWithTicketManager.noEventsFound')}
                </div>
              )}
              
              {filteredEvents.map((event) => (
                <div
                  key={event.eventId}
                  className={cn(
                    'cursor-pointer rounded-xl p-5 shadow-xl border-2 transition-all duration-200',
                    selectedEvent?.eventId === event.eventId
                      ? getThemeClass(
                          'bg-gradient-to-r from-blue-500/60 to-purple-500/60 border-blue-400 ring-4 ring-blue-400/60 scale-105',
                          'bg-gradient-to-r from-[#3a0ca3]/60 to-[#ff008e]/60 border-pink-500/20 ring-4 ring-yellow-400/60 scale-105'
                        )
                      : getThemeClass(
                          'bg-gradient-to-r from-blue-100/60 to-purple-100/60 border-blue-200 hover:ring-2 hover:ring-blue-400/60 hover:scale-105',
                          'bg-gradient-to-r from-[#3a0ca3]/60 to-[#ff008e]/60 border-pink-500/20 hover:ring-2 hover:ring-pink-400/60 hover:scale-105'
                        )
                  )}
                  onClick={() => {
                    setSelectedEvent(event);
                    setSearchTicket('');
                  }}
                  style={{ minHeight: 90 }}
                >
                  <div
                    className={cn(
                      'text-base font-bold mb-1',
                      getThemeClass('text-blue-600', 'text-pink-200')
                    )}
                  >
                    {event.eventName}
                  </div>
                  <div
                    className={cn('text-xs mb-1', getThemeClass('text-gray-600', 'text-slate-300'))}
                  >
                    {event.startAt?.slice(0, 10)} - {event.endAt?.slice(0, 10)}
                  </div>
                  <button
                    className={cn(
                      'mt-2 w-full text-white px-4 py-2 rounded-xl font-bold shadow-lg uppercase tracking-wider transition-all duration-200 text-base',
                      getThemeClass(
                        'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
                        'bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500'
                      )
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                      setSearchTicket('');
                    }}
                  >
                    <FaSearch className="inline mr-2" /> {t('eventListWithTicketManager.viewTickets')}
                  </button>
                  <button
                    className={cn(
                      'mt-2 w-full text-white px-4 py-2 rounded-xl font-bold shadow-lg uppercase tracking-wider transition-all duration-200 text-base',
                      getThemeClass(
                        'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600',
                        'bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-500 hover:to-pink-600'
                      )
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/event-manager/tickets/create/${event.eventId}`);
                    }}
                  >
                    <FaPlus className="inline mr-2" /> {t('eventListWithTicketManager.createNewTicket')}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!loadingEvents && !searchEvent.trim() && totalEventPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                className={cn(
                  'p-3 rounded-full text-white disabled:opacity-50 transition-all',
                  getThemeClass(
                    'bg-blue-500 hover:bg-blue-600',
                    'bg-pink-500 hover:bg-pink-600'
                  )
                )}
                disabled={eventPage === 1 || loadingEvents}
                onClick={() => handlePageChange(eventPage - 1)}
              >
                <FaChevronLeft />
              </button>
              
              <div className={cn('px-4 py-2 font-bold text-center min-w-[120px]', getThemeClass('text-blue-600', 'text-white'))}>
                <div>{t('eventListWithTicketManager.page')} {eventPage} / {totalEventPages}</div>
                <div className="text-xs opacity-70">
                  {t('eventListWithTicketManager.total')}: {totalEvents} {t('eventListWithTicketManager.events')}
                </div>
              </div>
              
              <button
                className={cn(
                  'p-3 rounded-full text-white disabled:opacity-50 transition-all',
                  getThemeClass(
                    'bg-blue-500 hover:bg-blue-600',
                    'bg-pink-500 hover:bg-pink-600'
                  )
                )}
                disabled={eventPage === totalEventPages || loadingEvents}
                onClick={() => handlePageChange(eventPage + 1)}
              >
                <FaChevronRight />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Ticket List */}
        <div className="w-full md:w-2/3">
          {selectedEvent ? (
            <>
              <h3
                className={cn(
                  'text-2xl font-bold mb-5 text-center md:text-left',
                  getThemeClass('text-blue-600', 'text-yellow-300')
                )}
              >
                {t('eventListWithTicketManager.ticketsForEvent')}:{' '}
                <span className={cn(getThemeClass('text-purple-600', 'text-pink-200'))}>
                  {selectedEvent.eventName}
                </span>
              </h3>
              
              {/* Ticket Search */}
              <input
                type="text"
                value={searchTicket}
                onChange={(e) => setSearchTicket(e.target.value)}
                placeholder={t('eventListWithTicketManager.searchTicketsByNameOrDescription')}
                className={cn(
                  'w-full p-3 rounded-xl text-base focus:ring-2 focus:border-transparent transition-all duration-200 mb-5',
                  getThemeClass(
                    'bg-white border-2 border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                    'bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                  )
                )}
              />
              
              {loadingTickets ? (
                <div
                  className={cn(
                    'text-base text-center py-8',
                    getThemeClass('text-blue-600', 'text-pink-400')
                  )}
                >
                  {t('eventListWithTicketManager.loadingTickets')}...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.ticketId}
                      className={cn(
                        'rounded-2xl p-6 shadow-2xl border-2 flex flex-col justify-between min-h-[230px] relative',
                        getThemeClass(
                          'bg-gradient-to-br from-blue-50/80 to-purple-50/80 border-blue-300/30',
                          'bg-gradient-to-br from-[#3a0ca3]/80 to-[#ff008e]/80 border-pink-500/30'
                        )
                      )}
                    >
                      <div>
                        <div
                          className={cn(
                            'text-lg font-bold mb-2',
                            getThemeClass('text-blue-600', 'text-yellow-200')
                          )}
                        >
                          {ticket.ticketName}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span
                            className={cn(
                              'text-base',
                              getThemeClass('text-gray-700', 'text-slate-200')
                            )}
                          >
                            <span className="font-semibold">{t('eventListWithTicketManager.price')}:</span>{' '}
                            <span
                              className={cn(
                                'font-bold',
                                getThemeClass('text-purple-600', 'text-pink-200')
                              )}
                            >
                              {ticket.ticketPrice?.toLocaleString()}₫
                            </span>
                          </span>
                          <span
                            className={cn(
                              'text-base',
                              getThemeClass('text-gray-700', 'text-slate-200')
                            )}
                          >
                            <span className="font-semibold">{t('eventListWithTicketManager.available')}:</span>{' '}
                            <span
                              className={cn(
                                'font-bold',
                                getThemeClass('text-blue-600', 'text-yellow-300')
                              )}
                            >
                              {ticket.quantityAvailable}
                            </span>
                          </span>
                        </div>
                        <div
                          className={cn(
                            'text-sm mb-2',
                            getThemeClass('text-gray-600', 'text-slate-200')
                          )}
                        >
                          <span className="font-semibold block">{t('eventListWithTicketManager.sale_time')}:</span>
                          <span
                            className={cn(
                              'font-bold block',
                              getThemeClass('text-gray-900', 'text-white')
                            )}
                          >
                            {new Date(ticket.startSellAt).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                          <span
                            className={cn(
                              'font-bold block',
                              getThemeClass('text-gray-900', 'text-white')
                            )}
                          >
                            {new Date(ticket.endSellAt).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span
                            className={cn(
                              'font-semibold',
                              getThemeClass('text-gray-700', 'text-slate-200')
                            )}
                          >
                            {t('eventListWithTicketManager.status')}:
                          </span>{' '}
                          {ticket.quantityAvailable > 0 ? (
                            <span
                              className={cn(
                                'font-bold',
                                getThemeClass('text-green-600', 'text-green-400')
                              )}
                            >
                              {t('eventListWithTicketManager.availableTickets')}
                            </span>
                          ) : (
                            <span
                              className={cn(
                                'font-bold',
                                getThemeClass('text-red-600', 'text-red-400')
                              )}
                            >
                              {t('eventListWithTicketManager.soldOutTickets')}
                            </span>
                          )}
                        </div>
                        <div
                          className={cn(
                            'text-xs mb-1 italic',
                            getThemeClass('text-gray-500', 'text-slate-400')
                          )}
                        >
                          {t('eventListWithTicketManager.description')}: {ticket.ticketDescription}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          className={cn(
                            'text-white px-4 py-2 rounded-lg shadow transition-all text-base flex items-center gap-1',
                            getThemeClass(
                              'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
                              'bg-gradient-to-r from-yellow-400 to-pink-400 hover:from-yellow-500 hover:to-pink-500'
                            )
                          )}
                          onClick={() =>
                            navigate(
                              `/event-manager/tickets/edit/${selectedEvent.eventId}/${ticket.ticketId}`
                            )
                          }
                        >
                          <FaEdit /> {t('eventListWithTicketManager.edit')}
                        </button>
                        <button
                          className={cn(
                            'text-white px-4 py-2 rounded-lg shadow transition-all text-base flex items-center gap-1',
                            getThemeClass(
                              'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600',
                              'bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500'
                            )
                          )}
                          onClick={() => handleDelete(ticket.ticketId)}
                        >
                          <FaTrash /> {t('eventListWithTicketManager.delete')}
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredTickets.length === 0 && (
                    <div
                      className={cn(
                        'col-span-2 text-center py-8 text-base',
                        getThemeClass('text-gray-600', 'text-slate-300')
                      )}
                    >
                      {t('eventListWithTicketManager.no_tickets_for_this_event')}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div
              className={cn(
                'text-center text-lg mt-10',
                getThemeClass('text-gray-600', 'text-slate-300')
              )}
            >
              {t('eventListWithTicketManager.please_select_an_event_to_view_tickets')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
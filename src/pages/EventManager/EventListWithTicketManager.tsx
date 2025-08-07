import { useEffect, useState } from 'react';
import {
  getMyEvents,
  getTicketsByEvent,
  deleteTicket,
} from '@/services/Event Manager/event.service';
import { FaEdit, FaTrash, FaSearch, FaPlus, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { connectEventHub, onEvent, connectTicketHub, onTicket } from '@/services/signalr.service';
import EventChatSupportButton from '@/components/EventManager/EventChatSupportButton';
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
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchEvent, setSearchEvent] = useState('');
  const [searchTicket, setSearchTicket] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [eventPage, setEventPage] = useState(1);
  const navigate = useNavigate();

  // Load events
  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const data = await getMyEvents(1, 100);
      const items = Array.isArray(data?.items) ? data.items : [];
      const approved = items.filter((ev) => ev.isApproved === 1);
      setEvents(approved);
      setFilteredEvents(approved);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Load tickets for selected event
  const loadTicketsForEvent = async (eventId: string) => {
    setLoadingTickets(true);
    try {
      const data = await getTicketsByEvent(eventId);
      setTickets(data);
      setFilteredTickets(data);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // SignalR real-time updates
  useEffect(() => {
          connectEventHub('https://event.vezzy.site/notificationHub');
          connectTicketHub('https://ticket.vezzy.site/notificationHub');

    // Listen for real-time event updates
    onEvent('EventCreated', () => {
      loadEvents();
    });

    onEvent('EventUpdated', () => {
      loadEvents();
    });

    onEvent('EventDeleted', () => {
      loadEvents();
    });

    onEvent('EventApproved', () => {
      loadEvents();
    });

    // Listen for real-time ticket updates
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
  }, [selectedEvent]);

  // Tìm kiếm sự kiện realtime
  useEffect(() => {
    if (!searchEvent.trim()) {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter((ev) =>
        ev.eventName.toLowerCase().includes(searchEvent.trim().toLowerCase())
      );
      setFilteredEvents(filtered);
      setEventPage(1); // reset về trang 1 khi search khác
    }
  }, [searchEvent, events]);

  // Phân trang sự kiện
  const totalEventPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PER_PAGE));
  const pagedEvents = filteredEvents.slice(
    (eventPage - 1) * EVENTS_PER_PAGE,
    eventPage * EVENTS_PER_PAGE
  );

  // Log số lượng sự kiện
  // Pagination logging removed for production

  // Load tickets when event selected
  useEffect(() => {
    if (!selectedEvent) {
      setTickets([]);
      setFilteredTickets([]);
      return;
    }
    (async () => {
      setLoadingTickets(true);
      try {
        const data = await getTicketsByEvent(selectedEvent.eventId);
        setTickets(data);
        setFilteredTickets(data);
      } finally {
        setLoadingTickets(false);
      }
    })();
  }, [selectedEvent]);

  // Tìm kiếm vé realtime
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

  // Delete ticket
  const handleDelete = async (ticketId: string) => {
    if (!window.confirm(t('confirm_delete_ticket'))) return;
    await deleteTicket(ticketId);
    if (selectedEvent) {
      const data = await getTicketsByEvent(selectedEvent.eventId);
      setTickets(data);
      setFilteredTickets(data);
    }
  };

  // Nếu chuyển trang mà không còn sự kiện, về trang 1
  useEffect(() => {
    if (eventPage > totalEventPages) setEventPage(1);
  }, [totalEventPages, eventPage]);

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
        {/* Cột trái: Danh sách sự kiện */}
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
            {t('yourEvents')}
          </h2>
          <input
            type="text"
            value={searchEvent}
            onChange={(e) => setSearchEvent(e.target.value)}
            placeholder={t('searchEvents')}
            className={cn(
              'w-full p-3 rounded-xl text-base focus:ring-2 focus:border-transparent transition-all duration-200 mb-4',
              getThemeClass(
                'bg-white border-2 border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                'bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
              )
            )}
          />
          {loadingEvents ? (
            <div
              className={cn(
                'text-base text-center',
                getThemeClass('text-blue-600', 'text-pink-400')
              )}
            >
              {t('loadingEvents')}
            </div>
          ) : (
            <div className="space-y-4">
              {pagedEvents.length === 0 && (
                <div
                  className={cn(
                    'text-center text-base',
                    getThemeClass('text-gray-600', 'text-slate-300')
                  )}
                >
                  {t('noEventsFound')}
                </div>
              )}
              {pagedEvents.map((event) => (
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
                    <FaSearch className="inline mr-2" /> {t('viewTickets')}
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
                    <FaPlus className="inline mr-2" /> {t('createNewTicket')}
                  </button>

                  {/* Chat Support Button */}
                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <EventChatSupportButton
                      eventId={event.eventId}
                      eventName={event.eventName}
                      variant="inline"
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
              {/* Phân trang sự kiện */}
              {totalEventPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button
                    className={cn(
                      'p-2 rounded-full text-white disabled:opacity-50',
                      getThemeClass(
                        'bg-blue-500 hover:bg-blue-600',
                        'bg-pink-500 hover:bg-pink-600'
                      )
                    )}
                    disabled={eventPage === 1}
                    onClick={() => setEventPage((p) => Math.max(1, p - 1))}
                  >
                    <FaChevronLeft />
                  </button>
                  <span className={cn('font-bold', getThemeClass('text-blue-600', 'text-white'))}>
                    {t('page')} {eventPage}/{totalEventPages}
                  </span>
                  <button
                    className={cn(
                      'p-2 rounded-full text-white disabled:opacity-50',
                      getThemeClass(
                        'bg-blue-500 hover:bg-blue-600',
                        'bg-pink-500 hover:bg-pink-600'
                      )
                    )}
                    disabled={eventPage === totalEventPages}
                    onClick={() => setEventPage((p) => Math.min(totalEventPages, p + 1))}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cột phải: Danh sách vé */}
        <div className="w-full md:w-2/3">
          {selectedEvent ? (
            <>
              <h3
                className={cn(
                  'text-2xl font-bold mb-5 text-center md:text-left',
                  getThemeClass('text-blue-600', 'text-yellow-300')
                )}
              >
                {t('ticketsForEvent')}:{' '}
                <span className={cn(getThemeClass('text-purple-600', 'text-pink-200'))}>
                  {selectedEvent.eventName}
                </span>
              </h3>
              {/* Tìm kiếm vé */}
              <input
                type="text"
                value={searchTicket}
                onChange={(e) => setSearchTicket(e.target.value)}
                placeholder={t('searchTicketsByNameOrDescription')}
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
                    'text-base text-center',
                    getThemeClass('text-blue-600', 'text-pink-400')
                  )}
                >
                  {t('loadingTickets')}
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
                            <span className="font-semibold">{t('price')}:</span>{' '}
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
                            <span className="font-semibold">{t('available')}:</span>{' '}
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
                          <span className="font-semibold block">{t('sale_time')}:</span>
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
                          <span className="font-bold block text-center"></span>
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
                            {t('status')}:
                          </span>{' '}
                          {ticket.quantityAvailable > 0 ? (
                            <span
                              className={cn(
                                'font-bold',
                                getThemeClass('text-green-600', 'text-green-400')
                              )}
                            >
                              {t('availableTickets')}
                            </span>
                          ) : (
                            <span
                              className={cn(
                                'font-bold',
                                getThemeClass('text-red-600', 'text-red-400')
                              )}
                            >
                              {t('soldOutTickets')}
                            </span>
                          )}
                        </div>
                        <div
                          className={cn(
                            'text-xs mb-1 italic',
                            getThemeClass('text-gray-500', 'text-slate-400')
                          )}
                        >
                          {t('description')}: {ticket.ticketDescription}
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
                          <FaEdit /> {t('edit')}
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
                          <FaTrash /> {t('delete')}
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
                      {t('no_tickets_for_this_event')}
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
              {t('please_select_an_event_to_view_tickets')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

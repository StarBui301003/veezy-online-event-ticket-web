import { useEffect, useState } from "react";
import { getMyEvents, getTicketsByEvent, deleteTicket } from "@/services/Event Manager/event.service";
import { FaEdit, FaTrash, FaSearch, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { connectEventHub, onEvent, connectTicketHub, onTicket } from "@/services/signalr.service";

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
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchEvent, setSearchEvent] = useState("");
  const [searchTicket, setSearchTicket] = useState("");
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
      const approved = items.filter(ev => ev.isApproved === 1);
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
    connectEventHub('http://localhost:5004/notificationHub');
    connectTicketHub('http://localhost:5003/notificationHub');

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
      const filtered = events.filter(ev =>
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
  console.log("Tổng sự kiện:", filteredEvents.length, "Sự kiện trang này:", pagedEvents.length, "Trang:", eventPage, "/", totalEventPages);

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
          t =>
            t.ticketName.toLowerCase().includes(searchTicket.trim().toLowerCase()) ||
            t.ticketDescription.toLowerCase().includes(searchTicket.trim().toLowerCase())
        )
      );
    }
  }, [searchTicket, tickets]);

  // Delete ticket
  const handleDelete = async (ticketId: string) => {
    if (!window.confirm(t("confirm_delete_ticket"))) return;
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
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] py-0 px-0">
      <div className="w-full max-w-7xl mx-auto bg-[#2d0036]/80 rounded-2xl shadow-2xl p-8 mt-10 mb-10 flex flex-col md:flex-row gap-10">
        {/* Cột trái: Danh sách sự kiện */}
        <div className="w-full md:w-1/3">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent mb-6 uppercase tracking-wide text-center">
            {t("yourEvents")}
          </h2>
          <input
            type="text"
            value={searchEvent}
            onChange={e => setSearchEvent(e.target.value)}
            placeholder={t("searchEvents")}
            className="w-full p-3 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 text-base focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 mb-4"
          />
          {loadingEvents ? (
            <div className="text-pink-400 text-base text-center">{t("loadingEvents")}</div>
          ) : (
            <div className="space-y-4">
              {pagedEvents.length === 0 && (
                <div className="text-slate-300 text-center text-base">{t("noEventsFound")}</div>
              )}
              {pagedEvents.map((event) => (
                <div
                  key={event.eventId}
                  className={`cursor-pointer bg-gradient-to-r from-[#3a0ca3]/60 to-[#ff008e]/60 rounded-xl p-5 shadow-xl border-2 border-pink-500/20
                    ${selectedEvent?.eventId === event.eventId ? "ring-4 ring-yellow-400/60 scale-105" : "hover:ring-2 hover:ring-pink-400/60 hover:scale-105"} transition-all duration-200`}
                  onClick={() => {
                    setSelectedEvent(event);
                    setSearchTicket("");
                  }}
                  style={{ minHeight: 90 }}
                >
                  <div className="text-base font-bold text-pink-200 mb-1">{event.eventName}</div>
                  <div className="text-slate-300 text-xs mb-1">
                    {event.startAt?.slice(0, 10)} - {event.endAt?.slice(0, 10)}
                  </div>
                  <button
                    className="mt-2 w-full bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg uppercase tracking-wider transition-all duration-200 text-base"
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                      setSearchTicket("");
                    }}
                  >
                    <FaSearch className="inline mr-2" /> {t("viewTickets")}
                  </button>
                  <button
                    className="mt-2 w-full bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-500 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg uppercase tracking-wider transition-all duration-200 text-base"
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`/event-manager/tickets/create/${event.eventId}`);
                    }}
                  >
                    <FaPlus className="inline mr-2" /> {t("createNewTicket")}
                  </button>
                </div>
              ))}
              {/* Phân trang sự kiện */}
              {totalEventPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button
                    className="p-2 rounded-full bg-pink-500 text-white disabled:opacity-50"
                    disabled={eventPage === 1}
                    onClick={() => setEventPage(p => Math.max(1, p - 1))}
                  >
                    <FaChevronLeft />
                  </button>
                  <span className="text-white font-bold">
                    {t("page")} {eventPage}/{totalEventPages}
                  </span>
                  <button
                    className="p-2 rounded-full bg-pink-500 text-white disabled:opacity-50"
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

        {/* Cột phải: Danh sách vé */}
        <div className="w-full md:w-2/3">
          {selectedEvent ? (
            <>
              <h3 className="text-2xl font-bold text-yellow-300 mb-5 text-center md:text-left">
                {t("ticketsForEvent")}: <span className="text-pink-200">{selectedEvent.eventName}</span>
              </h3>
              {/* Tìm kiếm vé */}
              <input
                type="text"
                value={searchTicket}
                onChange={e => setSearchTicket(e.target.value)}
                placeholder={t("searchTicketsByNameOrDescription")}
                className="w-full p-3 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 text-base focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 mb-5"
              />
              {loadingTickets ? (
                <div className="text-pink-400 text-base text-center">{t("loadingTickets")}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                       {filteredTickets.map((ticket) => (
                                      <div
                                        key={ticket.ticketId}
                                        className="bg-gradient-to-br from-[#3a0ca3]/80 to-[#ff008e]/80 rounded-2xl p-6 shadow-2xl border-2 border-pink-500/30 flex flex-col justify-between min-h-[230px] relative"
                                      >
                                        <div>
                                          <div className="text-lg font-bold text-yellow-200 mb-2">{ticket.ticketName}</div>
                                          <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <span className="text-slate-200 text-base">
                                              <span className="font-semibold">{t("price")}:</span>{" "}
                                              <span className="font-bold text-pink-200">{ticket.ticketPrice?.toLocaleString()}₫</span>
                                            </span>
                                            <span className="text-slate-200 text-base">
                                              <span className="font-semibold">{t("available")}:</span>{" "}
                                              <span className="font-bold text-yellow-300">{ticket.quantityAvailable}</span>
                                            </span>
                                          </div>
                                                                                    <div className="text-slate-200 text-sm mb-2">
                                            <span className="font-semibold block">{t("sale_time")}:</span>
                                            <span className="font-bold text-white block">
                                              {new Date(ticket.startSellAt).toLocaleString("vi-VN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                              })}
                                            </span>
                                            <span className="font-bold text-white block text-center"></span>
                                            <span className="font-bold text-white block">
                                              {new Date(ticket.endSellAt).toLocaleString("vi-VN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                              })}
                                            </span>
                                          </div>
                                          <div className="mb-2">
                                            <span className="font-semibold text-slate-200">{t("status")}:</span>{" "}
                                            {ticket.quantityAvailable > 0 ? (
                                              <span className="text-green-400 font-bold">{t("availableTickets")}</span>
                                            ) : (
                                              <span className="text-red-400 font-bold">{t("soldOutTickets")}</span>
                                            )}
                                          </div>
                                          <div className="text-slate-400 text-xs mb-1 italic">{t("description")}: {ticket.ticketDescription}</div>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                          <button
                                            className="bg-gradient-to-r from-yellow-400 to-pink-400 hover:from-yellow-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg shadow transition-all text-base flex items-center gap-1"
                                            onClick={() => navigate(`/event-manager/tickets/edit/${selectedEvent.eventId}/${ticket.ticketId}`)}
                                          >
                                            <FaEdit /> {t("edit")}
                                          </button>
                                          <button
                                            className="bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500 text-white px-4 py-2 rounded-lg shadow transition-all text-base flex items-center gap-1"
                                            onClick={() => handleDelete(ticket.ticketId)}
                                          >
                                            <FaTrash /> {t("delete")}
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                  {filteredTickets.length === 0 && (
                    <div className="col-span-2 text-center text-slate-300 py-8 text-base">
                      {t("no_tickets_for_this_event")}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-slate-300 text-center text-lg mt-10">
              {t("please_select_an_event_to_view_tickets")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
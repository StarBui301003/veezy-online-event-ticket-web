import { useEffect, useState } from "react";
import { getMyApprovedEvents } from "@/services/Event Manager/event.service";
import { getDiscountCodesByEvent } from "@/services/Event Manager/event.service";
import { FaChevronLeft, FaChevronRight, FaPlus, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import instance from "@/services/axios.customize";
import { AxiosError } from "axios";
import { connectEventHub, onEvent } from '@/services/signalr.service';

interface Event {
  eventId: string;
  eventName: string;
  startAt?: string;
  endAt?: string;
}

interface DiscountCode {
  id: string;
  code: string;
  discountType: number;
  value: number;
  minimum: number;
  maximum: number;
  maxUsage: number;
  expiredAt: string;
  eventId: string;
  eventName: string;
}

const EVENTS_PER_PAGE = 3;

export default function ManagerDiscountCode() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [searchEvent, setSearchEvent] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingDiscountCodes, setLoadingDiscountCodes] = useState(false);
  const [eventPage, setEventPage] = useState(1);
  const navigate = useNavigate();

  // Load events
  useEffect(() => {
    connectEventHub('http://localhost:5004/notificationHub');
    (async () => {
      setLoadingEvents(true);
      try {
        const data = await getMyApprovedEvents();
        setEvents(data);
        setFilteredEvents(data);
      } catch (err) {
        console.error("Failed to load events:", err);
        toast.error("Failed to load events");
      } finally {
        setLoadingEvents(false);
      }
    })();
    // Lắng nghe realtime SignalR
    const reload = async () => {
      try {
        const data = await getMyApprovedEvents();
        setEvents(data);
        setFilteredEvents(data);
      } catch {}
    };
    onEvent('OnEventCreated', reload);
    onEvent('OnEventUpdated', reload);
    onEvent('OnEventDeleted', reload);
    onEvent('OnEventCancelled', reload);
    onEvent('OnEventApproved', reload);
    // Cleanup: không cần offEvent vì signalr.service chưa hỗ trợ
  }, []);

  // Search events
  useEffect(() => {
    if (!searchEvent.trim()) {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter((ev) =>
        ev.eventName.toLowerCase().includes(searchEvent.trim().toLowerCase())
      );
      setFilteredEvents(filtered);
      setEventPage(1);
    }
  }, [searchEvent, events]);

  // Pagination
  const totalEventPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PER_PAGE));
  const pagedEvents = filteredEvents.slice(
    (eventPage - 1) * EVENTS_PER_PAGE,
    eventPage * EVENTS_PER_PAGE
  );

  // Load discount codes when event selected
  useEffect(() => {
    if (!selectedEvent) {
      setDiscountCodes([]);
      return;
    }

    const fetchDiscountCodes = async () => {
      setLoadingDiscountCodes(true);
      try {
        const data = await getDiscountCodesByEvent(selectedEvent.eventId);
        setDiscountCodes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load discount codes:", err);
        if (err instanceof AxiosError) {
          if (err.response?.status === 404) {
            
            setDiscountCodes([]);
          } else {
            toast.error("Failed to load discount codes");
          }
        } else {
          toast.error("An unexpected error occurred");
        }
      } finally {
        setLoadingDiscountCodes(false);
      }
    };

    fetchDiscountCodes();
  }, [selectedEvent]);

  const handleDeleteCode = async (codeId: string) => {
    if (!window.confirm("Are you sure you want to delete this discount code?")) return;
    
    try {
      await instance.delete(`/api/DiscountCode/${codeId}`);
      toast.success("Discount code deleted successfully");
      // Refresh discount codes list
      if (selectedEvent) {
        const data = await getDiscountCodesByEvent(selectedEvent.eventId);
        setDiscountCodes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to delete discount code:", err);
      toast.error("Failed to delete discount code");
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] py-0 px-0">
      <div className="w-full max-w-7xl mx-auto bg-[#2d0036]/80 rounded-2xl shadow-2xl p-8 mt-10 mb-10 flex flex-col md:flex-row gap-10">
        {/* Left column: Events list */}
        <div className="w-full md:w-1/3">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent mb-6 uppercase tracking-wide text-center">
            Sự kiện của tôi
          </h2>
          <input
            type="text"
            value={searchEvent}
            onChange={(e) => setSearchEvent(e.target.value)}
            placeholder="Search events..."
            className="w-full p-3 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 text-base focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 mb-4"
          />
          {loadingEvents ? (
            <div className="text-pink-400 text-base text-center">Loading...</div>
          ) : (
            <div className="space-y-4">
              {pagedEvents.length === 0 && (
                <div className="text-slate-300 text-center text-base">
                  No events found.
                </div>
              )}
              {pagedEvents.map((event) => (
                <div
                  key={event.eventId}
                  className={`cursor-pointer bg-gradient-to-r from-[#3a0ca3]/60 to-[#ff008e]/60 rounded-xl p-5 shadow-xl border-2 border-pink-500/20
                    ${
                      selectedEvent?.eventId === event.eventId
                        ? "ring-4 ring-yellow-400/60 scale-105"
                        : "hover:ring-2 hover:ring-pink-400/60 hover:scale-105"
                    } transition-all duration-200`}
                  onClick={() => setSelectedEvent(event)}
                  style={{ minHeight: 90 }}
                >
                  <div className="text-base font-bold text-pink-200 mb-1">
                    {event.eventName}
                  </div>
                  <div className="text-slate-300 text-xs mb-1">
                    {event.startAt?.slice(0, 10)} - {event.endAt?.slice(0, 10)}
                  </div>
                  <button
                    className="mt-2 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg uppercase tracking-wider transition-all duration-200 text-base"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/event-manager/discount-codes/create/${event.eventId}`);
                    }}
                  >
                    <FaPlus className="inline mr-2" /> Create Discount Code
                  </button>
                </div>
              ))}
              {/* Event pagination */}
              {totalEventPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button
                    className="p-2 rounded-full bg-pink-500 text-white disabled:opacity-50"
                    disabled={eventPage === 1}
                    onClick={() => setEventPage((p) => Math.max(1, p - 1))}
                  >
                    <FaChevronLeft />
                  </button>
                  <span className="text-white font-bold">
                    Page {eventPage}/{totalEventPages}
                  </span>
                  <button
                    className="p-2 rounded-full bg-pink-500 text-white disabled:opacity-50"
                    disabled={eventPage === totalEventPages}
                    onClick={() =>
                      setEventPage((p) => Math.min(totalEventPages, p + 1))
                    }
                  >
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Discount codes */}
        <div className="w-full md:w-2/3">
          {selectedEvent ? (
            <>
              <h3 className="text-2xl font-bold text-yellow-300 mb-5 text-center md:text-left">
                Discount Codes for:{" "}
                <span className="text-pink-200">{selectedEvent.eventName}</span>
              </h3>

              {/* Discount codes list */}
              {loadingDiscountCodes ? (
                <div className="text-pink-400 text-base text-center">
                  Loading discount codes...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {discountCodes.map((code) => (
                    <div
                      key={code.id}
                      className="bg-gradient-to-br from-[#3a0ca3]/80 to-[#ff008e]/80 rounded-2xl p-6 shadow-2xl border-2 border-pink-500/30 relative group"
                    >
                      <button
                        onClick={() => handleDeleteCode(code.id)}
                        className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="Delete discount code"
                      >
                        <FaTrash />
                      </button>
                      <div className="text-lg font-bold text-yellow-200 mb-2">
                        {code.code}
                      </div>
                      <div className="text-slate-200 text-base mb-2">
                        <span className="font-semibold">Discount Type:</span>{" "}
                        <span className="font-bold text-pink-200">
                          {code.discountType === 0 ? "Percentage" : "Fixed Amount"}
                        </span>
                      </div>
                      <div className="text-slate-200 text-base mb-2">
                        <span className="font-semibold">Value:</span>{" "}
                        <span className="font-bold text-pink-200">
                          {code.discountType === 0 ? `${code.value}%` : `${code.value.toLocaleString()}₫`}
                        </span>
                      </div>
                      <div className="text-slate-200 text-sm mb-2">
                        <span className="font-semibold">Minimum Order:</span>{" "}
                        <span className="font-bold text-white">
                          {code.minimum.toLocaleString()}₫
                        </span>
                      </div>
                      <div className="text-slate-200 text-sm mb-2">
                        <span className="font-semibold">Maximum Discount:</span>{" "}
                        <span className="font-bold text-white">
                          {code.maximum.toLocaleString()}₫
                        </span>
                      </div>
                      <div className="text-slate-200 text-sm mb-2">
                        <span className="font-semibold">Max Usage:</span>{" "}
                        <span className="font-bold text-white">
                          {code.maxUsage === 2147483647 ? "Unlimited" : code.maxUsage}
                        </span>
                      </div>
                      <div className="text-slate-200 text-sm">
                        <span className="font-semibold">Expires at:</span>{" "}
                        <span className="font-bold text-white">
                          {format(new Date(code.expiredAt), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                    </div>
                  ))}
                  {discountCodes.length === 0 && (
                    <div className="col-span-2 text-center text-slate-300 py-8 text-base">
                      No discount codes for this event.
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-slate-300 text-center text-lg mt-10">
              Please select an event to manage discount codes!
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
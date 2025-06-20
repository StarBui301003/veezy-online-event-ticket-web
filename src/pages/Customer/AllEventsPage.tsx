import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllEvents } from "@/services/Event Manager/event.service";
import { Loader2, CalendarDays, MapPin } from "lucide-react";

interface Event {
  eventId: string;
  eventName: string;
  eventCoverImageUrl: string;
  startAt: string;
  endAt: string;
  eventLocation: string;
  isApproved: number;
  isCancelled: boolean;
}

const AllEventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAllEvents(1, 100) // lấy 100 sự kiện, có thể thêm phân trang nếu muốn
      .then((fetchedEvents) => {
        const approvedEvents = fetchedEvents.filter(
          (event) => event.isApproved === 1 && !event.isCancelled
        );
        setEvents(approvedEvents);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-purple-700">Tất cả sự kiện</h1>
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-lg text-gray-400">
            Không có sự kiện nào được phê duyệt.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {events.map((event) => (
              <Link to={`/event/${event.eventId}`} key={event.eventId}>
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition overflow-hidden group">
                  <div className="h-48 w-full overflow-hidden">
                    <img
                      src={event.eventCoverImageUrl}
                      alt={event.eventName}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors duration-200 line-clamp-1">
                      {event.eventName}
                    </h2>
                    <div className="flex items-center text-gray-500 text-sm mb-1">
                      <CalendarDays className="w-4 h-4 mr-1" />
                      {new Date(event.startAt).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      {event.eventLocation}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllEventsPage;

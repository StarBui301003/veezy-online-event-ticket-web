import { useState, useEffect } from 'react';
import { getMyApprovedEvents, getCollaboratorsByEventManager, addCollaborator, getCollaboratorsForEvent, removeCollaborator } from '@/services/Event Manager/event.service';
import { toast } from 'react-toastify';
import { FaCalendarAlt } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import noPicture from '@/assets/img/no-picture-available.png';

interface Event {
  eventId: string;
  eventName: string;
  startAt: string;
  endAt: string;
  isApproved: number;
  isCancelled: boolean;
}

interface Collaborator {
  accountId: string;
  fullName: string;
  email: string;
  avatar: string;
}

const CollaboratorManager = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loadingCollabs, setLoadingCollabs] = useState(true);
  const [searchCollaborator, setSearchCollaborator] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [searchEvent, setSearchEvent] = useState("");

  const [assignedCollaborators, setAssignedCollaborators] = useState<Collaborator[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const COLLABS_PER_PAGE = 6;

  const navigate = useNavigate();

  useEffect(() => {
    setLoadingCollabs(true);
    getCollaboratorsByEventManager()
      .then((data) => setCollaborators(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Không thể tải danh sách cộng tác viên!'))
      .finally(() => setLoadingCollabs(false));
  }, []);

  useEffect(() => {
    setLoadingEvents(true);
    getMyApprovedEvents(1, 100)
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Không thể tải danh sách sự kiện!'))
      .finally(() => setLoadingEvents(false));
  }, []);

  useEffect(() => {
    if (!selectedEvent) {
      setAssignedCollaborators([]);
      return;
    }
    getCollaboratorsForEvent(selectedEvent.eventId)
      .then((data) => setAssignedCollaborators(Array.isArray(data) ? data : []))
      .catch(() => setAssignedCollaborators([]));
  }, [selectedEvent]);

  const filteredCollaborators = searchCollaborator.trim()
    ? collaborators.filter(collab =>
        collab.fullName.toLowerCase().includes(searchCollaborator.trim().toLowerCase()) ||
        collab.email.toLowerCase().includes(searchCollaborator.trim().toLowerCase())
      )
    : collaborators;

  const filteredEvents = searchEvent.trim()
    ? events.filter(ev =>
        ev.eventName.toLowerCase().includes(searchEvent.trim().toLowerCase())
      )
    : events;

  const handleAssign = async (collaborator: Collaborator) => {
    if (!selectedEvent) {
      toast.warn('Vui lòng chọn sự kiện trước!');
      return;
    }
    try {
      const result = await addCollaborator(selectedEvent.eventId, collaborator.accountId);
      if (result.flag) {
        toast.success('Thêm cộng tác viên vào sự kiện thành công!');
        // Reload lại danh sách assigned ngay
        const data = await getCollaboratorsForEvent(selectedEvent.eventId);
        setAssignedCollaborators(Array.isArray(data) ? data : []);
      } else {
        toast.error(result.message || 'Thêm cộng tác viên thất bại.');
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi thêm.');
    }
  };

  const handleRemove = async (collaborator: Collaborator) => {
    if (!selectedEvent) return;
    if (!window.confirm('Bạn có chắc chắn muốn xoá cộng tác viên này khỏi sự kiện?')) return;
    try {
      await removeCollaborator(selectedEvent.eventId, collaborator.accountId);
      toast.success('Đã xoá cộng tác viên khỏi sự kiện!');
      // Reload lại danh sách assigned
      const data = await getCollaboratorsForEvent(selectedEvent.eventId);
      setAssignedCollaborators(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Xoá thất bại!');
    }
  };

  // Phân trang collaborator
  const pagedCollaborators = filteredCollaborators.slice((currentPage-1)*COLLABS_PER_PAGE, currentPage*COLLABS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(filteredCollaborators.length / COLLABS_PER_PAGE));

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] py-10 px-4">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-0">
        {/* Left: Events */}
        <div className="w-full md:w-1/2 bg-[#2d0036]/80 rounded-l-2xl rounded-r-none shadow-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <FaCalendarAlt className="text-yellow-400" />
            <h2 className="text-2xl font-bold text-yellow-300">Danh sách sự kiện</h2>
          </div>
          {/* Hướng dẫn chọn sự kiện */}
          <div className="mb-2 text-pink-200 text-sm italic">Hãy chọn sự kiện để thêm cộng tác viên vào sự kiện đó.</div>
          <input
            type="text"
            placeholder="Tìm kiếm sự kiện..."
            className="w-full p-3 rounded-xl bg-[#1a0022]/80 border-2 border-yellow-500/30 text-white placeholder-yellow-400 text-base focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 mb-4"
            value={searchEvent}
            onChange={e => setSearchEvent(e.target.value)}
          />
          {loadingEvents ? (
            <div className="text-yellow-400 text-base text-center">Đang tải...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-slate-300 text-center text-base">Không có sự kiện nào.</div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map(event => (
                <div
                  key={event.eventId}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${selectedEvent?.eventId === event.eventId ? 'border-pink-400 bg-[#ff008e]/10 scale-105' : 'border-yellow-500/20 hover:border-yellow-400/40 hover:bg-[#ff008e]/5'}`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div>
                    <h3 className="text-lg font-bold text-yellow-200">{event.eventName}</h3>
                    <p className="text-slate-300 text-sm">{event.startAt?.slice(0, 10)} - {event.endAt?.slice(0, 10)}</p>
                  </div>
                  {selectedEvent?.eventId === event.eventId && (
                    <span className="text-xs px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full font-bold">Đang chọn</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Right: Collaborators */}
        <div className="w-full md:w-1/2 bg-[#2d0036]/80 rounded-r-2xl rounded-l-none shadow-2xl p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-yellow-400" />
              <span className="text-lg font-bold text-yellow-300">Danh sách cộng tác viên</span>
            </div>
            {/* Nút tạo cộng tác viên mới */}
            <button
              className="px-5 py-3 bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500 text-white rounded-xl font-bold shadow transition-all duration-200 text-base"
              onClick={() => {
                if (selectedEvent) {
                  navigate(`/event-manager/collaborators/create/${selectedEvent.eventId}`);
                } else {
                  navigate('/event-manager/collaborators/create');
                }
              }}
              type="button"
            >
              + Tạo cộng tác viên mới
            </button>
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm cộng tác viên..."
            className="w-full p-3 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 text-base focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 mb-4"
            value={searchCollaborator}
            onChange={e => setSearchCollaborator(e.target.value)}
          />
          {loadingCollabs ? (
            <div className="text-pink-400 text-base text-center">Đang tải...</div>
          ) : filteredCollaborators.length === 0 ? (
            <div className="text-slate-300 text-center text-base">Không có cộng tác viên nào.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-transparent">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-pink-300">Ảnh</th>
                    <th className="px-4 py-2 text-left text-pink-300">Họ tên</th>
                    <th className="px-4 py-2 text-left text-pink-300">Email</th>
                    <th className="px-4 py-2 text-center text-pink-300">{selectedEvent ? 'Thao tác' : ''}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedCollaborators.map(collab => {
                    const isSelected = assignedCollaborators.some((c) => c.accountId === collab.accountId);
                    return (
                      <tr key={collab.accountId} className={`border-b border-pink-500/10 transition-all ${isSelected ? 'bg-green-100/10' : 'hover:bg-[#3a0ca3]/10'}`}>
                        <td className="px-4 py-2">
                          <img
                            src={collab.avatar || noPicture}
                            alt={collab.fullName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-pink-400"
                          />
                        </td>
                        <td className="px-4 py-2 font-bold text-pink-200">{collab.fullName}</td>
                        <td className="px-4 py-2 text-slate-300">{collab.email}</td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => !isSelected && selectedEvent && handleAssign(collab)}
                              disabled={isSelected || !selectedEvent}
                              className={`px-4 py-2 rounded-lg font-bold text-sm shadow transition-all ${isSelected ? 'bg-green-500/80 text-white cursor-default' : 'bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-500 hover:to-pink-600 text-white'} ${!selectedEvent ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {isSelected ? 'Đã thêm' : 'Thêm'}
                            </button>
                            <button
                              onClick={() => selectedEvent && handleRemove(collab)}
                              disabled={!selectedEvent}
                              className={`px-4 py-2 rounded-lg font-bold text-sm shadow transition-all bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500 text-white ${!selectedEvent ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Xoá
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button
                    className="p-2 rounded-full bg-pink-500 text-white disabled:opacity-50"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    &lt;
                  </button>
                  <span className="text-white font-bold">
                    Trang {currentPage}/{totalPages}
                  </span>
                  <button
                    className="p-2 rounded-full bg-pink-500 text-white disabled:opacity-50"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    &gt;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaboratorManager; 
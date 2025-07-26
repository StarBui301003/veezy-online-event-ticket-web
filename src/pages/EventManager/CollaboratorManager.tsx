import { useState, useEffect } from 'react';
import { getMyApprovedEvents, getCollaboratorsByEventManager, addCollaborator, getCollaboratorsForEvent, removeCollaborator } from '@/services/Event Manager/event.service';
import { toast } from 'react-toastify';
import { FaCalendarAlt } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import noPicture from '@/assets/img/no-picture-available.png';
import { useTranslation } from 'react-i18next';
import { connectIdentityHub, onIdentity, connectEventHub, onEvent } from "@/services/signalr.service";

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

export default function CollaboratorManager() {
  const { t } = useTranslation();
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

  // Load functions
  const loadCollaborators = async () => {
    setLoadingCollabs(true);
    try {
      const data = await getCollaboratorsByEventManager();
      setCollaborators(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t('errorLoadingCollaborators'));
    } finally {
      setLoadingCollabs(false);
    }
  };

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const data = await getMyApprovedEvents(1, 100);
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t('errorLoadingEvents'));
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadAssignedCollaborators = async (eventId: string) => {
    try {
      const data = await getCollaboratorsForEvent(eventId);
      setAssignedCollaborators(Array.isArray(data) ? data : []);
    } catch {
      setAssignedCollaborators([]);
    }
  };

  useEffect(() => {
    loadCollaborators();
  }, []);

  useEffect(() => {
    loadEvents();
  }, []);

  // SignalR real-time updates
  useEffect(() => {
    connectIdentityHub('http://localhost:5001/notificationHub');
    connectEventHub('http://localhost:5004/notificationHub');

    // Listen for collaborator updates
    onIdentity('UserRegistered', () => {
      loadCollaborators();
    });

    onIdentity('UserUpdated', () => {
      loadCollaborators();
    });

    onIdentity('CollaboratorAdded', () => {
      loadCollaborators();
      if (selectedEvent) {
        loadAssignedCollaborators(selectedEvent.eventId);
      }
    });

    onIdentity('CollaboratorRemoved', () => {
      loadCollaborators();
      if (selectedEvent) {
        loadAssignedCollaborators(selectedEvent.eventId);
      }
    });

    // Listen for event updates
    onEvent('EventCreated', () => {
      loadEvents();
    });

    onEvent('EventUpdated', () => {
      loadEvents();
    });

    onEvent('EventApproved', () => {
      loadEvents();
    });
  }, [selectedEvent]);

  useEffect(() => {
    if (!selectedEvent) {
      setAssignedCollaborators([]);
      return;
    }
    loadAssignedCollaborators(selectedEvent.eventId);
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
      toast.warn(t('warningSelectEventBeforeAdd'));
      return;
    }
    try {
      const result = await addCollaborator(selectedEvent.eventId, collaborator.accountId);
      if (result.flag) {
        toast.success(t('successAddCollaboratorToEvent'));
        // Reload lại danh sách assigned ngay
        const data = await getCollaboratorsForEvent(selectedEvent.eventId);
        setAssignedCollaborators(Array.isArray(data) ? data : []);
      } else {
        toast.error(result.message || t('errorAddCollaboratorFailed'));
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || t('errorAddCollaboratorFailed'));
    }
  };

  const handleRemove = async (collaborator: Collaborator) => {
    if (!selectedEvent) return;
    if (!window.confirm(t('confirm.remove_collaborator'))) return;
    try {
      await removeCollaborator(selectedEvent.eventId, collaborator.accountId);
      toast.success(t('success.remove_collaborator_from_event'));
      // Reload lại danh sách assigned
      const data = await getCollaboratorsForEvent(selectedEvent.eventId);
      setAssignedCollaborators(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t('error.remove_collaborator_failed'));
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
            <h2 className="text-2xl font-bold text-yellow-300">{t('eventListTitle')}</h2>
          </div>
          {/* Hướng dẫn chọn sự kiện */}
          <div className="mb-2 text-pink-200 text-sm italic">{t('eventListSelectEventHint')}</div>
          <input
            type="text"
            placeholder={t('eventListSearchEventPlaceholder')}
            className="w-full p-3 rounded-xl bg-[#1a0022]/80 border-2 border-yellow-500/30 text-white placeholder-yellow-400 text-base focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 mb-4"
            value={searchEvent}
            onChange={e => setSearchEvent(e.target.value)}
          />
          {loadingEvents ? (
            <div className="text-yellow-400 text-base text-center">{t('loading.loading_events')}</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-slate-300 text-center text-base">{t('eventList.no_events')}</div>
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
                    <span className="text-xs px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full font-bold">{t('eventList.selected_event')}</span>
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
              <span className="text-lg font-bold text-yellow-300">{t('collaboratorListTitle')}</span>
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
              {t('collaboratorListCreateNewCollaborator')}
            </button>
          </div>
          <input
            type="text"
            placeholder={t('collaboratorListSearchCollaboratorPlaceholder')}
            className="w-full p-3 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 text-base focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 mb-4"
            value={searchCollaborator}
            onChange={e => setSearchCollaborator(e.target.value)}
          />
          {loadingCollabs ? (
            <div className="text-pink-400 text-base text-center">{t('loading.loading_collaborators')}</div>
          ) : filteredCollaborators.length === 0 ? (
            <div className="text-slate-300 text-center text-base">{t('collaboratorListNoCollaborators')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-transparent">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-pink-300">{t('collaboratorList.image')}</th>
                    <th className="px-4 py-2 text-left text-pink-300">{t('collaboratorList.full_name')}</th>
                    <th className="px-4 py-2 text-left text-pink-300">{t('collaboratorList.email')}</th>
                    <th className="px-4 py-2 text-center text-pink-300">{selectedEvent ? t('collaboratorList.actions') : ''}</th>
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
                              {isSelected ? t('collaboratorList.added') : t('collaboratorList.add')}
                            </button>
                            <button
                              onClick={() => selectedEvent && handleRemove(collab)}
                              disabled={!selectedEvent}
                              className={`px-4 py-2 rounded-lg font-bold text-sm shadow transition-all bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500 text-white ${!selectedEvent ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {t('collaboratorList.remove')}
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
                    {t('collaboratorList.page_info', { current: currentPage, total: totalPages })}
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
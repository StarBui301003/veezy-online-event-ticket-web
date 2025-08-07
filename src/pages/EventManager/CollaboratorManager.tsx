import { useState, useEffect } from 'react';
import {
  getMyApprovedEvents,
  getCollaboratorsByEventManager,
  addCollaborator,
  getCollaboratorsForEvent,
  removeCollaborator,
} from '@/services/Event Manager/event.service';
import { toast } from 'react-toastify';
import { FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import noPicture from '@/assets/img/no-picture-available.png';
import { useTranslation } from 'react-i18next';
import {
  connectIdentityHub,
  onIdentity,
  connectEventHub,
  onEvent,
} from '@/services/signalr.service';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

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
  const { getThemeClass } = useThemeClasses();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loadingCollabs, setLoadingCollabs] = useState(true);
  const [searchCollaborator, setSearchCollaborator] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [searchEvent, setSearchEvent] = useState('');

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
    connectIdentityHub('http://localhost:5001/hubs/notifications');
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
    ? collaborators.filter(
        (collab) =>
          collab.fullName.toLowerCase().includes(searchCollaborator.trim().toLowerCase()) ||
          collab.email.toLowerCase().includes(searchCollaborator.trim().toLowerCase())
      )
    : collaborators;

  const filteredEvents = searchEvent.trim()
    ? events.filter((ev) => ev.eventName.toLowerCase().includes(searchEvent.trim().toLowerCase()))
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
  const pagedCollaborators = filteredCollaborators.slice(
    (currentPage - 1) * COLLABS_PER_PAGE,
    currentPage * COLLABS_PER_PAGE
  );
  const totalPages = Math.max(1, Math.ceil(filteredCollaborators.length / COLLABS_PER_PAGE));

  return (
    <div
      className={cn(
        'w-full min-h-screen flex items-center justify-center py-10 px-4',
        getThemeClass(
          'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
          'bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e]'
        )
      )}
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-0">
        {/* Left: Events */}
        <div
          className={cn(
            'w-full md:w-2/5 rounded-l-2xl rounded-r-none shadow-2xl p-8',
            getThemeClass('bg-white/95 border border-gray-200 shadow-lg', 'bg-[#2d0036]/80')
          )}
        >
          <div className="flex items-center gap-2 mb-6">
            <FaCalendarAlt className={cn(getThemeClass('text-blue-600', 'text-yellow-400'))} />
            <h2
              className={cn(
                'text-2xl font-bold',
                getThemeClass('text-blue-600', 'text-yellow-300')
              )}
            >
              {t('eventListTitle')}
            </h2>
          </div>
          {/* Hướng dẫn chọn sự kiện */}
          <div
            className={cn('mb-2 text-sm italic', getThemeClass('text-blue-600', 'text-pink-200'))}
          >
            {t('eventListSelectEventHint')}
          </div>
          <input
            type="text"
            placeholder={t('eventListSearchEventPlaceholder')}
            className={cn(
              'w-full p-3 rounded-xl text-base focus:ring-2 focus:border-transparent transition-all duration-200 mb-4',
              getThemeClass(
                'bg-white border-2 border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                'bg-[#1a0022]/80 border-2 border-yellow-500/30 text-white placeholder-yellow-400 focus:ring-yellow-500'
              )
            )}
            value={searchEvent}
            onChange={(e) => setSearchEvent(e.target.value)}
          />
          {loadingEvents ? (
            <div
              className={cn(
                'text-base text-center',
                getThemeClass('text-blue-600', 'text-yellow-400')
              )}
            >
              {t('loading.loading_events')}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div
              className={cn(
                'text-center text-base',
                getThemeClass('text-gray-600', 'text-slate-300')
              )}
            >
              {t('eventList.no_events')}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.eventId}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                    selectedEvent?.eventId === event.eventId
                      ? getThemeClass(
                          'border-blue-400 bg-blue-50 scale-105',
                          'border-pink-400 bg-[#ff008e]/10 scale-105'
                        )
                      : getThemeClass(
                          'border-blue-200 hover:border-blue-300 hover:bg-blue-50',
                          'border-yellow-500/20 hover:border-yellow-400/40 hover:bg-[#ff008e]/5'
                        )
                  )}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div>
                    <h3
                      className={cn(
                        'text-lg font-bold',
                        getThemeClass('text-blue-600', 'text-yellow-200')
                      )}
                    >
                      {event.eventName}
                    </h3>
                    <p className={cn('text-sm', getThemeClass('text-gray-600', 'text-slate-300'))}>
                      {event.startAt?.slice(0, 10)} - {event.endAt?.slice(0, 10)}
                    </p>
                  </div>
                  {selectedEvent?.eventId === event.eventId && (
                    <span
                      className={cn(
                        'text-xs px-3 py-1 rounded-full font-bold',
                        getThemeClass(
                          'bg-blue-500/20 text-blue-600',
                          'bg-pink-500/20 text-pink-300'
                        )
                      )}
                    >
                      {t('eventList.selected_event')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Right: Collaborators */}
        <div
          className={cn(
            'w-full md:w-3/5 rounded-r-2xl rounded-l-none shadow-2xl p-8',
            getThemeClass('bg-white/95 border border-gray-200 shadow-lg', 'bg-[#2d0036]/80')
          )}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className={cn(getThemeClass('text-blue-600', 'text-yellow-400'))} />
              <span
                className={cn(
                  'text-lg font-bold',
                  getThemeClass('text-blue-600', 'text-yellow-300')
                )}
              >
                {t('collaboratorListTitle')}
              </span>
            </div>
            {/* Nút tạo cộng tác viên mới */}
            <button
              className={cn(
                'px-5 py-3 text-white rounded-xl font-bold shadow transition-all duration-200 text-base',
                getThemeClass(
                  'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
                  'bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500'
                )
              )}
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
            className={cn(
              'w-full p-3 rounded-xl text-base focus:ring-2 focus:border-transparent transition-all duration-200 mb-4',
              getThemeClass(
                'bg-white border-2 border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                'bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
              )
            )}
            value={searchCollaborator}
            onChange={(e) => setSearchCollaborator(e.target.value)}
          />
          {loadingCollabs ? (
            <div
              className={cn(
                'text-base text-center',
                getThemeClass('text-blue-600', 'text-pink-400')
              )}
            >
              {t('loading.loading_collaborators')}
            </div>
          ) : filteredCollaborators.length === 0 ? (
            <div
              className={cn(
                'text-center text-base',
                getThemeClass('text-gray-600', 'text-slate-300')
              )}
            >
              {t('collaboratorListNoCollaborators')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-transparent">
                <thead>
                  <tr>
                    <th
                      className={cn(
                        'px-4 py-2 text-left',
                        getThemeClass('text-blue-600', 'text-pink-300')
                      )}
                    >
                      {t('collaboratorList.image')}
                    </th>
                    <th
                      className={cn(
                        'px-4 py-2 text-left',
                        getThemeClass('text-blue-600', 'text-pink-300')
                      )}
                    >
                      {t('collaboratorList.full_name')}
                    </th>
                    <th
                      className={cn(
                        'px-4 py-2 text-left',
                        getThemeClass('text-blue-600', 'text-pink-300')
                      )}
                    >
                      {t('collaboratorList.email')}
                    </th>
                    <th
                      className={cn(
                        'px-4 py-2 text-center',
                        getThemeClass('text-blue-600', 'text-pink-300')
                      )}
                    >
                      {selectedEvent ? t('collaboratorList.actions') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagedCollaborators.map((collab) => {
                    const isSelected = assignedCollaborators.some(
                      (c) => c.accountId === collab.accountId
                    );
                    return (
                      <tr
                        key={collab.accountId}
                        className={cn(
                          'border-b transition-all',
                          isSelected
                            ? getThemeClass('bg-green-50', 'bg-green-100/10')
                            : getThemeClass('hover:bg-blue-50', 'hover:bg-[#3a0ca3]/10'),
                          getThemeClass('border-blue-200', 'border-pink-500/10')
                        )}
                      >
                        <td className="px-4 py-2">
                          <img
                            src={collab.avatar || noPicture}
                            alt={collab.fullName}
                            className={cn(
                              'w-10 h-10 rounded-full object-cover border-2',
                              getThemeClass('border-blue-400', 'border-pink-400')
                            )}
                          />
                        </td>
                        <td
                          className={cn(
                            'px-4 py-2 font-bold',
                            getThemeClass('text-blue-600', 'text-pink-200')
                          )}
                        >
                          {collab.fullName}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-2',
                            getThemeClass('text-gray-600', 'text-slate-300')
                          )}
                        >
                          {collab.email}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => !isSelected && selectedEvent && handleAssign(collab)}
                              disabled={isSelected || !selectedEvent}
                              className={cn(
                                'px-4 py-2 rounded-lg font-bold text-sm shadow transition-all',
                                isSelected
                                  ? getThemeClass(
                                      'bg-green-500/80 text-white cursor-default',
                                      'bg-green-500/80 text-white cursor-default'
                                    )
                                  : getThemeClass(
                                      'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white',
                                      'bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-500 hover:to-pink-600 text-white'
                                    ),
                                !selectedEvent && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              {isSelected ? t('collaboratorList.added') : t('collaboratorList.add')}
                            </button>
                            <button
                              onClick={() => selectedEvent && handleRemove(collab)}
                              disabled={!selectedEvent}
                              className={cn(
                                'px-4 py-2 rounded-lg font-bold text-sm shadow transition-all text-white',
                                getThemeClass(
                                  'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600',
                                  'bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500'
                                ),
                                !selectedEvent && 'opacity-50 cursor-not-allowed'
                              )}
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
                    className={cn(
                      'p-2 rounded-full text-white disabled:opacity-50',
                      getThemeClass(
                        'bg-blue-500 hover:bg-blue-600',
                        'bg-pink-500 hover:bg-pink-600'
                      )
                    )}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    &lt;
                  </button>
                  <span className={cn('font-bold', getThemeClass('text-blue-600', 'text-white'))}>
                    {t('collaboratorList.page_info', { current: currentPage, total: totalPages })}
                  </span>
                  <button
                    className={cn(
                      'p-2 rounded-full text-white disabled:opacity-50',
                      getThemeClass(
                        'bg-blue-500 hover:bg-blue-600',
                        'bg-pink-500 hover:bg-pink-600'
                      )
                    )}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
}

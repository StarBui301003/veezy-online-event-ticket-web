import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Download, Clock, Search, RefreshCw } from 'lucide-react';
import { exportAttendanceCheckin } from '@/services/Event Manager/attendance.service';
import { getMyApprovedEvents } from '@/services/Event Manager/event.service';
import { getAttendanceByEvent } from '@/services/Event Manager/attendance.service';
import { toast } from 'react-toastify';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

const AttendanceListPage = () => {
  // Định nghĩa đúng kiểu cho events
  interface Event {
    eventId: string;
    eventName: string;
    eventManagerId?: string;
  }
  const [events, setEvents] = useState<Event[]>([]); // All events managed by this event manager
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  // Removed unused searchTerm/setSearchTerm
  const [eventSearch, setEventSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [_eventManagerId, setEventManagerId] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10); // pageSize fixed, not changing
  // Removed unused totalItems state
  const [totalPages, setTotalPages] = useState(1);

  // Add translation hook
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();

  // Get eventManagerId from localStorage.account (like NotificationManager)
  useEffect(() => {
    const accStr = localStorage.getItem('account');
    if (accStr) {
      try {
        const accObj = JSON.parse(accStr);
        if (accObj?.userId) setEventManagerId(accObj.userId);
      } catch {
        /* ignore parse error */
      }
    }
  }, []);

  // Connect to TicketHub for real-time attendance updates
  useEffect(() => {
    const setupRealtimeAttendance = async () => {
      try {
        const { onTicket, onNotification } = await import('@/services/signalr.service');

        // Listen for real-time attendance updates using global connections
        onTicket('AttendanceCheckedIn', (data: any) => {
          console.log('Attendance checked in:', data);
          loadAttendances();
          toast.success(
            t('attendanceCheckedInRealtime', {
              customerName: data.customerName || data.userName || 'Customer',
            })
          );
        });

        onTicket('AttendanceUpdated', (data: any) => {
          console.log('Attendance updated:', data);
          loadAttendances();
          toast.info(t('attendanceUpdatedRealtime'));
        });

        onTicket('TicketIssued', (data: any) => {
          console.log('Ticket issued:', data);
          loadAttendances();
          toast.success(t('ticketIssuedRealtime'));
        });

        onTicket('TicketGenerated', (data: any) => {
          console.log('Ticket generated:', data);
          loadAttendances();
          toast.info(t('ticketGeneratedRealtime'));
        });

        onTicket('TicketValidated', (data: any) => {
          console.log('Ticket validated:', data);
          if (selectedEvent && data.eventId === selectedEvent) {
            loadAttendances();
            toast.success(t('ticketValidatedRealtime'));
          }
        });

        // Listen for attendance-related notifications using global connections

        onNotification('ReceiveNotification', (notification: any) => {
          // Handle attendance-related notifications
          if (
            notification.type === 'AttendanceUpdate' ||
            notification.type === 'CheckIn' ||
            notification.type === 'TicketValidation'
          ) {
            console.log('Attendance notification:', notification);
            loadAttendances();
          }
        });
      } catch (error) {
        console.error('Failed to setup real-time attendance:', error);
      }
    };

    setupRealtimeAttendance();
  }, [selectedEvent, t]);

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Lấy tất cả events với pageSize lớn để có đủ dữ liệu cho search
        const eventsData = await getMyApprovedEvents(1, 100);
        let events = [];
        if (eventsData && typeof eventsData === 'object' && 'items' in eventsData) {
          events = eventsData.items || [];
        } else if (Array.isArray(eventsData)) {
          events = eventsData;
        } else if (eventsData?.items) {
          events = Array.isArray(eventsData.items) ? eventsData.items : [];
        }
        setEvents(events);
      } catch (error) {
        console.error('Failed to load events:', error);
        toast.error(t('failedToLoadEvents'));
      }
    };

    loadEvents();
  }, [t]);

  // Map role string to numeric value for the UI
  const mapRoleToNumeric = (roleString) => {
    switch(roleString?.toLowerCase()) {
      case 'eventmanager': return 2;
      case 'collaborator': return 3;
      case 'customer': 
      default: return 1;
    }
  };

  // Load attendances when event is selected
  const loadAttendances = useCallback(async () => {
    if (!selectedEvent) return;

    setLoading(true);
    console.log('Loading attendances for event:', selectedEvent);
    try {
      const response = await getAttendanceByEvent(selectedEvent, pageNumber, pageSize);
      console.log('API Response:', response);
      
      if (response?.success && response.data) {
        const { items = [], totalItems = 0, totalPages = 1 } = response.data;
        console.log('Processed data:', { items, totalItems, totalPages });
        
        // Map the API response to match the expected format
        const formattedItems = items.map(item => ({
          ...item,
          customerName: item.fullName || t('unknownCustomer'),
          email: item.email || '-',
          phone: item.phone || '-',
          role: mapRoleToNumeric(item.role),
          checkInTime: item.joinedAt, // Using joinedAt as checkInTime
          // Add any other required fields with defaults
          id: item.id || `attendee-${Math.random().toString(36).substr(2, 9)}`
        }));
        
        setAttendances(formattedItems);
        setTotalAttendees(totalItems);
        setTotalPages(totalPages);
      } else {
        console.warn('Unexpected API response format:', response);
        setAttendances([]);
        setTotalAttendees(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Failed to load attendances:', error);
      toast.error(t('failedToLoadAttendances'));
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, pageNumber, pageSize, t]);

  useEffect(() => {
    loadAttendances();
  }, [loadAttendances]);

  // Filter events based on search
  const filteredEvents = events.filter((event) =>
    event.eventName.toLowerCase().includes(eventSearch.toLowerCase())
  );

  // Handle event selection
  const handleEventSelect = (eventId: string) => {
    setSelectedEvent(eventId);
    setPageNumber(1); // Reset to first page when changing event
  };

  // Handle export
  const handleExportAttendance = async () => {
    if (!selectedEvent) {
      toast.error(t('pleaseSelectEvent'));
      return;
    }

    setExportLoading(true);
    try {
      const blob = await exportAttendanceCheckin(selectedEvent);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_${selectedEvent}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t('attendanceExportedSuccessfully'));
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('exportFailed'));
    } finally {
      setExportLoading(false);
    }
  };

  // Helper functions
  const getRoleText = (role) => {
    switch (role) {
      case 1:
        return t('customer');
      case 2:
        return t('eventManager');
      case 3:
        return t('collaborator');
      default:
        return t('unknown');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 1:
        return getThemeClass('bg-blue-100 text-blue-800', 'bg-blue-100 text-blue-800');
      case 2:
        return getThemeClass('bg-green-100 text-green-800', 'bg-green-100 text-green-800');
      case 3:
        return getThemeClass('bg-red-100 text-red-800', 'bg-red-100 text-red-800');
      default:
        return getThemeClass('bg-gray-100 text-gray-800', 'bg-gray-100 text-gray-800');
    }
  };

  const { i18n } = useTranslation();
  
  const formatDateTime = (dateString) => {
    if (!dateString) return t('notAvailable');
    return new Date(dateString).toLocaleString(i18n.language);
  };

  return (
    <div
      className={cn(
        'min-h-screen p-6',
        getThemeClass(
          'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 text-gray-900',
          'bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white'
        )
      )}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className={cn('text-3xl font-bold mb-2', getThemeClass('text-blue-600', 'text-white'))}
          >
            {t('attendanceList')}
          </h1>
          <p className={cn('text-lg', getThemeClass('text-gray-600', 'text-gray-300'))}>
            {t('manageEventAttendance')}
          </p>
        </div>

        {/* Event Selection */}
        <div
          className={cn(
            'mb-6 p-6 rounded-xl shadow-lg',
            getThemeClass(
              'bg-white/95 border border-gray-200',
              'bg-[#2d0036]/80 border border-purple-500/30'
            )
          )}
        >
          <h2
            className={cn(
              'text-xl font-semibold mb-4',
              getThemeClass('text-blue-600', 'text-purple-300')
            )}
          >
            {t('selectEvent')}
          </h2>

          {/* Search */}
          <div className="relative mb-4">
            <Search
              className={cn(
                'absolute left-3 top-1/2 transform -translate-y-1/2',
                getThemeClass('text-gray-400', 'text-gray-400')
              )}
              size={20}
            />
            <input
              type="text"
              placeholder={t('searchEvents')}
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2',
                getThemeClass(
                  'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-purple-500/30 text-white placeholder-gray-400 focus:ring-purple-500'
                )
              )}
            />
          </div>

          {/* Event List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => (
              <div
                key={event.eventId}
                className={cn(
                  'p-4 rounded-lg cursor-pointer transition-all duration-200 border-2',
                  selectedEvent === event.eventId
                    ? getThemeClass(
                        'bg-blue-50 border-blue-400 shadow-md',
                        'bg-purple-900/50 border-purple-400 shadow-md'
                      )
                    : getThemeClass(
                        'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md',
                        'bg-[#1a0022]/60 border-purple-500/20 hover:border-purple-400 hover:shadow-md'
                      )
                )}
                onClick={() => handleEventSelect(event.eventId)}
              >
                <h3
                  className={cn('font-semibold mb-2', getThemeClass('text-gray-900', 'text-white'))}
                >
                  {event.eventName}
                </h3>
                <p className={cn('text-sm', getThemeClass('text-gray-600', 'text-gray-300'))}>
                  ID: {event.eventId}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance List */}
        {selectedEvent && (
          <div
            className={cn(
              'p-6 rounded-xl shadow-lg',
              getThemeClass(
                'bg-white/95 border border-gray-200',
                'bg-[#2d0036]/80 border border-purple-500/30'
              )
            )}
          >
            <div className="flex justify-between items-center mb-6">
              <h2
                className={cn(
                  'text-xl font-semibold',
                  getThemeClass('text-blue-600', 'text-purple-300')
                )}
              >
                {t('attendanceList')} - {events.find((e) => e.eventId === selectedEvent)?.eventName}
              </h2>

              <button
                onClick={handleExportAttendance}
                disabled={exportLoading}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                  getThemeClass(
                    'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50',
                    'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50'
                  )
                )}
              >
                <Download size={20} />
                {exportLoading ? t('exporting') : t('exportAttendance')}
              </button>
            </div>

            {/* Stats */}
            <div
              className={cn(
                'mb-6 p-4 rounded-lg',
                getThemeClass(
                  'bg-blue-50 border border-blue-200',
                  'bg-purple-900/30 border border-purple-500/30'
                )
              )}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={cn("p-4 rounded-lg", getThemeClass("bg-white/50 border border-gray-200", "bg-purple-900/30 border border-purple-500/30"))}>
                  <div className="flex items-center gap-3">
                    <div className={cn("p-3 rounded-full", getThemeClass("bg-blue-100 text-blue-600", "bg-purple-900/50 text-purple-300"))}>
                      <Users size={24} />
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium", getThemeClass("text-gray-500", "text-gray-300"))}>
                        {t('totalAttendees')}
                      </p>
                      <p className={cn("text-2xl font-bold", getThemeClass("text-gray-800", "text-white"))}>
                        {totalAttendees}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex justify-center items-center py-8">
                <RefreshCw
                  className={cn('animate-spin', getThemeClass('text-blue-600', 'text-purple-400'))}
                  size={32}
                />
              </div>
            )}

            {/* Attendance Table */}
            {!loading && attendances.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={cn(getThemeClass('bg-gray-50', 'bg-purple-900/50'))}>
                    <tr>
                      <th
                        className={cn(
                          'px-4 py-3 text-left text-sm font-medium',
                          getThemeClass('text-gray-700', 'text-purple-200')
                        )}
                      >
                        {t('customerName')}
                      </th>
                      <th
                        className={cn(
                          'px-4 py-3 text-left text-sm font-medium',
                          getThemeClass('text-gray-700', 'text-purple-200')
                        )}
                      >
                        {t('role')}
                      </th>
                      <th
                        className={cn(
                          'px-4 py-3 text-left text-sm font-medium',
                          getThemeClass('text-gray-700', 'text-purple-200')
                        )}
                      >
                        {t('checkInTime')}
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={cn(
                      'divide-y',
                      getThemeClass('divide-gray-200', 'divide-purple-500/20')
                    )}
                  >
                    {attendances.map((attendance, index) => (
                      <tr
                        key={attendance.attendanceId || index}
                        className={cn(
                          'transition-colors',
                          getThemeClass('hover:bg-gray-50', 'hover:bg-purple-900/20')
                        )}
                      >
                        <td
                          className={cn('px-4 py-3', getThemeClass('text-gray-900', 'text-white'))}
                        >
                          {attendance.customerName}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'px-2 py-1 text-xs font-medium rounded-full',
                              getRoleBadgeColor(attendance.role)
                            )}
                          >
                            {getRoleText(attendance.role)}
                          </span>
                        </td>
                        <td
                          className={cn(
                            'px-4 py-3',
                            getThemeClass('text-gray-600', 'text-gray-300')
                          )}
                        >
                          {attendance.checkInTime ? formatDateTime(attendance.checkInTime) : t('notAvailable')}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty State */}
            {!loading && attendances.length === 0 && (
              <div
                className={cn('text-center py-8', getThemeClass('text-gray-500', 'text-gray-400'))}
              >
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>{t('noAttendancesFound')}</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={pageNumber === 1}
                  className={cn(
                    'px-3 py-1 rounded border transition-all',
                    getThemeClass(
                      'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50',
                      'bg-[#1a0022]/80 border-purple-500/30 text-white hover:bg-purple-900/30 disabled:opacity-50'
                    )
                  )}
                >
                  {t('previous')}
                </button>

                <span className={cn('px-3 py-1', getThemeClass('text-gray-700', 'text-white'))}>
                  {t('page')} {pageNumber} {t('of')} {totalPages}
                </span>

                <button
                  onClick={() => setPageNumber(Math.min(totalPages, pageNumber + 1))}
                  disabled={pageNumber === totalPages}
                  className={cn(
                    'px-3 py-1 rounded border transition-all',
                    getThemeClass(
                      'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50',
                      'bg-[#1a0022]/80 border-purple-500/30 text-white hover:bg-purple-900/30 disabled:opacity-50'
                    )
                  )}
                >
                  {t('next')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* No Event Selected */}
        {!selectedEvent && (
          <div className={cn('text-center py-12', getThemeClass('text-gray-500', 'text-gray-400'))}>
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>{t('pleaseSelectEventToViewAttendance')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceListPage;

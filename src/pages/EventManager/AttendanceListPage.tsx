import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Download, Calendar, Clock, UserCheck, Search, Filter, RefreshCw } from 'lucide-react';
import { exportAttendanceCheckin } from '@/services/Event Manager/attendance.service';
import { getMyApprovedEvents } from '@/services/Event Manager/event.service';
import { getAttendanceByEvent } from '@/services/Event Manager/attendance.service';
import { connectTicketHub, onTicket } from '@/services/signalr.service';


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
  const [searchActiveIndex, setSearchActiveIndex] = useState(-1);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [eventManagerId, setEventManagerId] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10); // pageSize fixed, not changing
  // Removed unused totalItems state
  const [totalPages, setTotalPages] = useState(1);

  // Get eventManagerId from localStorage.account (like NotificationManager)
  useEffect(() => {
    const accStr = localStorage.getItem('account');
    if (accStr) {
      try {
        const accObj = JSON.parse(accStr);
        if (accObj?.userId) setEventManagerId(accObj.userId);
      } catch { /* ignore parse error */ }
    }
  }, []);

  // Connect to TicketHub for real-time attendance updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      connectTicketHub('http://localhost:5005/notificationHub', token);
      
      // Listen for real-time attendance updates
      onTicket('AttendanceCheckedIn', (data: any) => {
        console.log('✅ Attendance checked in:', data);
        loadAttendances();
      });
      
      onTicket('AttendanceUpdated', (data: any) => {
        console.log('📝 Attendance updated:', data);
        loadAttendances();
      });
      
      onTicket('TicketIssued', (data: any) => {
        console.log('🎫 Ticket issued:', data);
        loadAttendances();
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only define loadAttendances once
  // Load both events and attendances
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadAttendances = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get all events managed by this event manager
      const eventsRes = await getMyApprovedEvents();
      const myEvents = Array.isArray(eventsRes) ? eventsRes : (eventsRes?.data || []);
      setEvents(myEvents);

      // 2. Default select first event if none selected
      if (myEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(myEvents[0].eventId);
        setEventSearch(myEvents[0].eventName);
        setLoading(false);
        return;
      }

      // 3. Get attendances for selected event (with pagination)
      if (selectedEvent) {
        const res = await getAttendanceByEvent(selectedEvent, pageNumber, pageSize);
        const data = res?.data || {};
        setAttendances(data.items || []);
        // setTotalItems removed
        setTotalPages(data.totalPages || 1);
        setTotalAttendees(data.totalItems || 0);
        setCheckedInCount(0); // API mới không có checkedInAt
      } else {
        setAttendances([]);
        // setTotalItems removed
        setTotalPages(1);
        setTotalAttendees(0);
        setCheckedInCount(0);
      }
    } catch {
      setAttendances([]);
      // setTotalItems removed
      setTotalPages(1);
      setTotalAttendees(0);
      setCheckedInCount(0);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, pageNumber, pageSize]);

  useEffect(() => {
    if (eventManagerId) loadAttendances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventManagerId, selectedEvent, pageNumber, pageSize]);

  // Xoá hàm loadAttendances bị trùng
  // const loadAttendances = async () => { ... }
  // Định nghĩa đúng kiểu cho events
  interface Event {
    eventId: string;
    eventName: string;
  }
  // Đã khai báo ở đầu file

  const handleExportAttendance = async () => {
    if (!selectedEvent) return;
    setExportLoading(true);
    try {
      const blob = await exportAttendanceCheckin(selectedEvent);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `attendance-${selectedEvent}-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      alert('Xuất file thành công!');
    } catch {
      alert('Có lỗi xảy ra khi xuất file!');
    } finally {
      setExportLoading(false);
    }
  };

  
  // 0: Admin, 1: Customer, 2: Event Manager
  const { t } = useTranslation();
  const getRoleText = (role) => {
    if (!role) return t('Unknown');
    if (role === 'Admin') return t('Admin');
    if (role === 'Customer') return t('Customer');
    if (role === 'EventManager') return t('Event Manager');
    return role;
  };
  const getRoleBadgeColor = (role) => {
    if (role === 'Admin') return 'bg-purple-100 text-purple-700 border border-purple-300';
    if (role === 'Customer') return 'bg-blue-100 text-blue-700 border border-blue-300';
    if (role === 'EventManager') return 'bg-green-100 text-green-700 border border-green-300';
    return 'bg-gray-100 text-gray-800 border border-gray-300';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleString('vi-VN');
  };


  // Only show attendances for events managed by current event manager
  const filteredAttendances = attendances;

  const selectedEventData = events.find(e => e.eventId === selectedEvent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                <Users className="text-green-400" />
                {t('Attendance Management')}
              </h1>
              <p className="text-lg text-gray-200 mt-2">{t('Track And Export Event Attendees')}</p>
            </div>
            <button
              onClick={loadAttendances}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-semibold shadow-lg transition-all"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {t('Refresh')}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-green-500/30 shadow-2xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-semibold">Tổng số người đăng ký</p>
                <p className="text-3xl font-bold text-green-400">{totalAttendees}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-blue-500/30 shadow-2xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-semibold">Đã check-in</p>
                <p className="text-3xl font-bold text-blue-400">{checkedInCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-purple-500/30 shadow-2xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-semibold">Tỷ lệ tham gia</p>
                <p className="text-3xl font-bold text-purple-400">
                  {totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Export - Notification style event search */}
        <div className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 rounded-xl shadow-2xl border-2 border-blue-500/30 mb-8">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t('Search Event')}
                      value={eventSearch}
                      onChange={e => {
                        setEventSearch(e.target.value);
                        setSearchActiveIndex(-1);
                      }}
                      onKeyDown={e => {
                        const filtered = events.filter(ev =>
                          typeof ev.eventName === 'string' &&
                          ev.eventName.toLowerCase().includes(eventSearch.toLowerCase())
                        );
                        if (e.key === 'Enter') {
                          if (searchActiveIndex >= 0 && filtered[searchActiveIndex]) {
                            setSelectedEvent(filtered[searchActiveIndex].eventId);
                            setEventSearch(filtered[searchActiveIndex].eventName);
                          } else if (filtered.length > 0) {
                            setSelectedEvent(filtered[0].eventId);
                            setEventSearch(filtered[0].eventName);
                          }
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setSearchActiveIndex(idx => Math.min(idx + 1, filtered.length - 1));
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setSearchActiveIndex(idx => Math.max(idx - 1, 0));
                        } else if (e.key === 'Escape') {
                          setSearchActiveIndex(-1);
                        }
                      }}
                      className="pl-10 pr-8 py-2 w-full rounded-xl bg-[#2d0036]/80 text-white border-2 border-green-500/30 focus:outline-none focus:border-green-400 placeholder:text-green-200"
                      autoComplete="off"
                    />
                    {/* X button to clear search */}
                    {eventSearch && (
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white focus:outline-none"
                        onClick={() => {
                          setEventSearch('');
                          setSearchActiveIndex(-1);
                        }}
                        tabIndex={-1}
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {/* Suggestion dropdown: chỉ hiện khi search khác selectedEvent */}
                  {eventSearch && eventSearch !== (selectedEventData?.eventName || '') && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-[#2d0036] border border-green-500/30 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {events.filter(ev =>
                        typeof ev.eventName === 'string' &&
                        ev.eventName.toLowerCase().includes(eventSearch.toLowerCase())
                      ).map((ev, idx) => (
                        <div
                          key={ev.eventId}
                          className={`px-4 py-2 cursor-pointer hover:bg-green-700/30 ${selectedEvent === ev.eventId ? 'bg-green-700/40' : ''} ${searchActiveIndex === idx ? 'bg-green-800/60' : ''}`}
                          onClick={() => {
                            setSelectedEvent(ev.eventId);
                            setEventSearch(ev.eventName);
                          }}
                          onMouseEnter={() => setSearchActiveIndex(idx)}
                        >
                          {ev.eventName}
                        </div>
                      ))}
                      {events.filter(ev =>
                        typeof ev.eventName === 'string' &&
                        ev.eventName.toLowerCase().includes(eventSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-4 py-2 text-gray-400">{t('No Event Found')}</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="relative w-full sm:w-80">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-200 w-5 h-5" />
                  <select
                    value={selectedEvent}
                    onChange={e => {
                      const event = events.find(ev => ev.eventId === e.target.value);
                      setSelectedEvent(e.target.value);
                      setEventSearch(event ? event.eventName : '');
                    }}
                    className="pl-10 pr-8 py-2 w-full rounded-xl bg-[#2d0036]/80 text-white border-2 border-green-500/30 focus:outline-none focus:border-green-400 appearance-none"
                  >
                    {/* No 'All Events' option */}
                    {events.filter(ev =>
                      typeof ev.eventName === 'string' &&
                      ev.eventName.toLowerCase().includes(eventSearch.toLowerCase())
                    ).map(event => (
                      <option key={event.eventId} value={event.eventId} className="bg-[#2d0036] text-white">
                        {event.eventName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleExportAttendance}
                disabled={exportLoading || !selectedEvent}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg
                  ${selectedEvent && !exportLoading
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                `}
              >
                {exportLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    {t('Exporting')}
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    {t('Export List')}
                  </>
                )}
              </button>
            </div>
            {selectedEventData && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-900/60 to-blue-900/60 rounded-xl border-2 border-green-500/30">
                <p className="text-sm text-green-200">
                  <strong className="text-green-300">{t('Selected Event')}:</strong> {selectedEventData.eventName}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Attendance List */}
        <div className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 rounded-xl shadow-2xl border-2 border-blue-500/30">
          <div className="p-6 border-b border-blue-500/30">
            <h2 className="text-xl font-bold text-blue-300">
              {t('Attendance List')} ({filteredAttendances.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-green-400" />
                <span className="ml-3 text-green-200">{t('Loading Data')}</span>
              </div>
            ) : filteredAttendances.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{t('No Data')}</h3>
                <p className="text-gray-300">{t('No One Has Registered For This Event Yet')}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#1a0022]/60">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-green-300 uppercase tracking-wider">{t('Attendee')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-green-300 uppercase tracking-wider">{t('Event')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-green-300 uppercase tracking-wider">{t('Role')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-green-300 uppercase tracking-wider">{t('Registration Time')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-green-300 uppercase tracking-wider">{t('Check-In')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendances.map((attendance, idx) => (
                    <tr key={attendance.index || idx} className="hover:bg-green-400/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold">
                            {attendance.fullName?.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-white">
                              {attendance.fullName}
                            </div>
                            <div className="text-sm text-green-200">
                              {attendance.email}
                            </div>
                            <div className="text-sm text-green-200">
                              {attendance.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white font-semibold">{selectedEventData?.eventName || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${getRoleBadgeColor(attendance.role)}`} style={{minWidth: 90, justifyContent: 'center'}}>
                          {getRoleText(attendance.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-green-300 mr-2" />
                          {formatDateTime(attendance.joinedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* API mới không có checkedInAt, để trống hoặc custom nếu có field */}
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                          <span className="text-sm text-green-200">{t('Not Checked In Yet')}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-4">
              <button
                className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                disabled={pageNumber === 1}
              >
                {t('Previous')}
              </button>
              <span className="text-green-200">{t('Page')} {pageNumber} / {totalPages}</span>
              <button
                className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
                disabled={pageNumber === totalPages}
              >
                {t('Next')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceListPage;

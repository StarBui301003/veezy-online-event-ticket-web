import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Users, Heart, Bell, CheckCircle, XCircle, Loader } from 'lucide-react';
import {
  sendAttendanceNotification,
  sendWishlistNotification,
  sendFollowersNotification,
} from '@/services/notification.service';
import { getMyApprovedEvents } from '@/services/Event Manager/event.service';
import { connectNotificationHub, onNotification } from '@/services/signalr.service';

const NotificationManager = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { t } = useTranslation();

  // Event list state
  const [myEvents, setMyEvents] = useState([]);
  const [attendanceForm, setAttendanceForm] = useState({
    eventId: '',
    eventName: '',
    title: '',
    message: '',
    roles: [],
    sendEmail: true
  });

  const [wishlistForm, setWishlistForm] = useState({
    eventId: '',
    eventName: '',
    title: '',
    message: '',
    sendEmail: true
  });

  const [attendanceEventSearch, setAttendanceEventSearch] = useState('');
  const [wishlistEventSearch, setWishlistEventSearch] = useState('');

  // Fetch events on mount
  useEffect(() => {
    async function fetchEvents() {
      const events = await getMyApprovedEvents();
      setMyEvents(events || []);
    }
    fetchEvents();
  }, []);

  // Connect to NotificationHub for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    connectNotificationHub(token || undefined);
    
    // Listen for notification status updates
    onNotification('NotificationSent', (data: any) => {
      showMessage('success', t('Notification sent successfully'));
    });

    onNotification('NotificationFailed', (data: any) => {
      showMessage('error', t('Failed to send notification'));
    });
  }, [t]);

  // Get eventManagerId from localStorage.account
  const [eventManagerId, setEventManagerId] = useState('');
  useEffect(() => {
    const accStr = localStorage.getItem('account');
    if (accStr) {
      try {
        const accObj = JSON.parse(accStr);
        if (accObj?.userId) setEventManagerId(accObj.userId);
      } catch { /* ignore parse error */ }
    }
  }, []);

  const [followersForm, setFollowersForm] = useState({
    eventManagerId: '',
    title: '',
    message: '',
    sendEmail: true
  });

  const roleOptions = [
    { value: 2, label: t('Manager'), color: 'text-blue-800' },
    { value: 1, label: t('User'), color: 'text-green-800' },
    { value: 3, label: t('Collaborator'), color: 'text-orange-800' }
  ];

  const tabs = [
    { 
      id: 'attendance', 
      label: t('Event Attendance'), 
      icon: Users, 
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      description: t('Send Notifications To Event Attendees By Role')
    },
    { 
      id: 'wishlist', 
      label: t('Event Wishlist'), 
      icon: Heart, 
      color: 'pink',
      gradient: 'from-pink-500 to-rose-600',
      description: t('Notify Users Who Added Your Event To Wishlist')
    },
    { 
      id: 'followers', 
      label: t('Event Followers'), 
      icon: Bell, 
      color: 'emerald',
      gradient: 'from-emerald-500 to-green-600',
      description: t('Send Notifications To Followers Of Event Managers')
    }
  ];

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Validation function
  const validateForm = (apiType) => {
    switch (apiType) {
      case 'attendance':
        if (!attendanceForm.eventId) {
          showMessage('error', t('Please Select An Event For Attendance Notification'));
          return false;
        }
        if (!attendanceForm.title.trim()) {
          showMessage('error', t('Title cannot be empty'));
          return false;
        }
        if (!attendanceForm.message.trim()) {
          showMessage('error', t('Message cannot be empty'));
          return false;
        }
        break;
      case 'wishlist':
        if (!wishlistForm.eventId) {
          showMessage('error', t('Please Select An Event For Wishlist Notification'));
          return false;
        }
        if (!wishlistForm.title.trim()) {
          showMessage('error', t('Title cannot be empty'));
          return false;
        }
        if (!wishlistForm.message.trim()) {
          showMessage('error', t('Message cannot be empty'));
          return false;
        }
        break;
      case 'followers':
        if (!followersForm.title.trim()) {
          showMessage('error', t('Title cannot be empty'));
          return false;
        }
        if (!followersForm.message.trim()) {
          showMessage('error', t('Message cannot be empty'));
          return false;
        }
        break;
      default:
        return false;
    }
    return true;
  };

  const handleSubmit = async (apiType) => {
    // Validate form before submission
    if (!validateForm(apiType)) {
      return;
    }

    setLoading(true);
    try {
      let result;
      switch (apiType) {
        case 'attendance': {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { eventName, ...body } = attendanceForm;
          result = (await sendAttendanceNotification(body)).data;
          break;
        }
        case 'wishlist': {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { eventName, ...body } = wishlistForm;
          result = (await sendWishlistNotification(body)).data;
          break;
        }
        case 'followers': {
          // Always use eventManagerId from localStorage
          const body = { ...followersForm, eventManagerId: eventManagerId };
          result = (await sendFollowersNotification(body)).data;
          break;
        }
        default:
          result = { flag: false, message: 'Unknown notification type' };
      }
      if (result.flag) {
        showMessage('success', t('Notification Sent Successfully', { type: tabs.find(t => t.id === apiType).label }))
        // Reset form
        if (apiType === 'attendance') {
          setAttendanceForm({ eventId: '', eventName: '', title: '', message: '', roles: [], sendEmail: true });
          setAttendanceEventSearch('');
        }
        if (apiType === 'wishlist') {
          setWishlistForm({ eventId: '', eventName: '', title: '', message: '', sendEmail: true });
          setWishlistEventSearch('');
        }
        if (apiType === 'followers') setFollowersForm({ eventManagerId: '', title: '', message: '', sendEmail: true });
      } else {
        showMessage('error', result.message || t('Failed To Send Notification'));
      }
    } catch {
      showMessage('error', t('Network Error Occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (roleValue) => {
    const updatedRoles = attendanceForm.roles.includes(roleValue)
      ? attendanceForm.roles.filter(r => r !== roleValue)
      : [...attendanceForm.roles, roleValue];
    
    setAttendanceForm({ ...attendanceForm, roles: updatedRoles });
  };

  const handleEventSearchKeyDown = (e, formType) => {
    if (e.key === 'Enter') {
      const value = e.target.value;
      const filtered = myEvents.filter(ev =>
        typeof ev.eventName === 'string' &&
        ev.eventName.toLowerCase().includes(value.toLowerCase())
      );
      
      if (filtered.length > 0) {
        const selectedEvent = filtered[0];
        if (formType === 'attendance') {
          setAttendanceForm({
            ...attendanceForm,
            eventId: selectedEvent.eventId,
            eventName: selectedEvent.eventName
          });
          setAttendanceEventSearch(selectedEvent.eventName); // Show full event name
        } else if (formType === 'wishlist') {
          setWishlistForm({
            ...wishlistForm,
            eventId: selectedEvent.eventId,
            eventName: selectedEvent.eventName
          });
          setWishlistEventSearch(selectedEvent.eventName); // Show full event name
        }
        
        // Clear any existing error messages
        if (message.type === 'error') {
          setMessage({ type: '', text: '' });
        }
      }
    }
  };

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="w-full bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] min-h-full">
      <div className="max-w-6xl w-full mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#3a0ca3] to-[#ff008e] rounded-xl mb-3 shadow-lg">
            <Bell className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            {t('Notification Center')}
          </h1>
        </div>

        {/* Status Message */}
        {message.text && (
          <div className={`mb-4 mx-auto max-w-2xl transform transition-all duration-300 ${
            message.type === 'success' 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800' 
              : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-800'
          } p-3 rounded-xl flex items-center gap-3 shadow-lg`}>
            <div className={`p-1.5 rounded-full ${
              message.type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{message.text}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl p-1.5 shadow-xl mb-4 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative overflow-hidden rounded-xl p-4 transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-2xl`
                      : 'text-gray-600 hover:bg-white/80 hover:shadow-lg'
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={`p-2 rounded-xl ${
                      isActive ? 'bg-white/20' : `bg-${tab.color}-100`
                    }`}>
                      <IconComponent size={20} className={isActive ? 'text-white' : `text-${tab.color}-600`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{tab.label}</h3>
                      <p className={`text-xs mt-1 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                        {tab.description}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Forms Container */}
        <div className="bg-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          {/* Form Header */}
          <div className={`bg-gradient-to-r ${currentTab.gradient} p-4 text-white rounded-t-2xl`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <currentTab.icon size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">{currentTab.label}</h2>
                <p className="text-white/90 text-sm mt-0.5">{currentTab.description}</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Attendance Form - Compact Version */}
            {activeTab === 'attendance' && (
              <div className="space-y-4">
                {/* Event Selection */}
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                  <label className="block text-xs font-semibold text-blue-900 mb-1.5">{t('Select Event')}</label>
                  <input
                    type="text"
                    value={attendanceEventSearch}
                    onChange={e => setAttendanceEventSearch(e.target.value)}
                    onKeyDown={e => handleEventSearchKeyDown(e, 'attendance')}
                    placeholder={t('Search Event')}
                    className="w-full mb-2 px-3 py-1.5 border-2 border-blue-400 rounded-lg text-sm bg-white text-blue-900 placeholder-blue-500 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 font-semibold shadow-sm"
                    style={{ letterSpacing: '0.01em' }}
                  />
                  {attendanceForm.eventName && (
                    <div className="mb-2 p-2 bg-blue-100 border border-blue-300 rounded-lg">
                      <span className="text-sm font-semibold text-blue-800">
                        {t('Selected Event')}: {attendanceForm.eventName}
                      </span>
                    </div>
                  )}
                  <select
                    className="w-full px-3 py-2 border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 text-blue-900 bg-white text-sm font-semibold shadow-sm"
                    style={{ letterSpacing: '0.01em' }}
                    value={attendanceForm.eventId}
                    onChange={e => {
                      const event = myEvents.find(ev => ev.eventId === e.target.value);
                      if (!e.target.value) {
                        setAttendanceForm({
                          ...attendanceForm,
                          eventId: '',
                          eventName: ''
                        });
                        setAttendanceEventSearch('');
                      } else {
                        setAttendanceForm({
                          ...attendanceForm,
                          eventId: e.target.value,
                          eventName: event ? event.eventName : ''
                        });
                        setAttendanceEventSearch(event ? event.eventName : '');
                        // Clear error messages
                        if (message.type === 'error') {
                          setMessage({ type: '', text: '' });
                        }
                      }
                    }}
                  >
                    {(() => {
                      const filtered = myEvents.filter(ev =>
                        typeof ev.eventName === 'string' &&
                        ev.eventName.toLowerCase().includes(attendanceEventSearch.toLowerCase())
                      );
                      if (attendanceEventSearch.trim() === '') {
                        return [
                          <option value="" key="default">-- {t('Select Event')} --</option>,
                          ...filtered.length === 0
                            ? []
                            : filtered.map(ev => (
                                <option key={ev.eventId} value={ev.eventId} className="text-blue-900 bg-blue-100 font-semibold">{ev.eventName}</option>
                              ))
                        ];
                      } else {
                        if (filtered.length === 0) {
                          return <option value="" disabled className="text-blue-700 bg-white font-semibold">{t('No events found')}</option>;
                        }
                        return filtered.map(ev => (
                          <option key={ev.eventId} value={ev.eventId} className="text-blue-900 bg-blue-100 font-semibold">{ev.eventName}</option>
                        ));
                      }
                    })()}
                  </select>
                </div>

                {/* Form Fields in 3 columns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-900 mb-1.5">{t('Notification Title')} *</label>
                    <input
                      type="text"
                      value={attendanceForm.title}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, title: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-blue-900 bg-white placeholder-blue-400 text-sm"
                      placeholder={t('Enter Notification Title')}
                    />
                  </div>

                  {/* Target Roles - More Compact */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-900 mb-1.5">{t('Target Roles')}</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {roleOptions.map((role) => (
                        <label key={role.value} className="cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attendanceForm.roles.includes(role.value)}
                            onChange={() => handleRoleChange(role.value)}
                            className="sr-only"
                          />
                          <div className={`p-1.5 rounded-md border-2 transition-all text-center ${
                            attendanceForm.roles.includes(role.value)
                              ? 'border-blue-500 bg-blue-100 text-blue-800'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}>
                            <span className="font-medium text-xs">{role.label}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-900 mb-1.5">{t('Message Content')} *</label>
                    <textarea
                      value={attendanceForm.message}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, message: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-blue-900 bg-white placeholder-blue-400 text-sm"
                      placeholder={t('Write Your Notification Message Here')}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attendanceForm.sendEmail}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, sendEmail: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-2 border-blue-300 rounded focus:ring-blue-500"
                    />
                    <span className="font-medium text-blue-900 text-sm">
                      {t('Send Email Notification')}
                    </span>
                  </label>

                  <button
                    onClick={() => handleSubmit('attendance')}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg text-sm"
                  >
                    {loading ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
                    {t('Send Notification')}
                  </button>
                </div>
              </div>
            )}

            {/* Wishlist Form */}
            {activeTab === 'wishlist' && (
              <div className="space-y-4">
                <div className="bg-pink-50 rounded-xl p-3 border border-pink-200">
                  <label className="block text-xs font-semibold text-pink-900 mb-1.5">{t('Select Event')}</label>
                  <input
                    type="text"
                    value={wishlistEventSearch}
                    onChange={e => setWishlistEventSearch(e.target.value)}
                    onKeyDown={e => handleEventSearchKeyDown(e, 'wishlist')}
                    placeholder={t('Search Event')}
                    className="w-full mb-2 px-3 py-1.5 border-2 border-pink-400 rounded-lg text-sm bg-white text-pink-900 placeholder-pink-500 focus:ring-2 focus:ring-pink-400 focus:border-pink-500 font-semibold shadow-sm"
                    style={{ letterSpacing: '0.01em' }}
                  />
                  {wishlistForm.eventName && (
                    <div className="mb-2 p-2 bg-pink-100 border border-pink-300 rounded-lg">
                      <span className="text-sm font-semibold text-pink-800">
                        {t('Selected Event')}: {wishlistForm.eventName}
                      </span>
                    </div>
                  )}
                  <select
                    className="w-full px-3 py-2 border-2 border-pink-400 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-500 text-pink-900 bg-white text-sm font-semibold shadow-sm"
                    style={{ letterSpacing: '0.01em' }}
                    value={wishlistForm.eventId}
                    onChange={e => {
                      const event = myEvents.find(ev => ev.eventId === e.target.value);
                      if (!e.target.value) {
                        setWishlistForm({
                          ...wishlistForm,
                          eventId: '',
                          eventName: ''
                        });
                        setWishlistEventSearch('');
                      } else {
                        setWishlistForm({
                          ...wishlistForm,
                          eventId: e.target.value,
                          eventName: event ? event.eventName : ''
                        });
                        setWishlistEventSearch(event ? event.eventName : '');
                        // Clear error messages
                        if (message.type === 'error') {
                          setMessage({ type: '', text: '' });
                        }
                      }
                    }}
                  >
                    {(() => {
                      const filtered = myEvents.filter(ev =>
                        typeof ev.eventName === 'string' &&
                        ev.eventName.toLowerCase().includes(wishlistEventSearch.toLowerCase())
                      );
                      if (wishlistEventSearch.trim() === '') {
                        return [
                          <option value="" key="default">-- {t('Select Event')} --</option>,
                          ...filtered.length === 0
                            ? []
                            : filtered.map(ev => (
                                <option key={ev.eventId} value={ev.eventId} className="text-pink-900 bg-pink-100 font-semibold">{ev.eventName}</option>
                              ))
                        ];
                      } else {
                        if (filtered.length === 0) {
                          return <option value="" disabled className="text-pink-700 bg-white font-semibold">{t('No events found')}</option>;
                        }
                        return filtered.map(ev => (
                          <option key={ev.eventId} value={ev.eventId} className="text-pink-900 bg-pink-100 font-semibold">{ev.eventName}</option>
                        ));
                      }
                    })()}
                  </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-pink-900 mb-1.5">{t('Notification Title')} *</label>
                    <input
                      type="text"
                      value={wishlistForm.title}
                      onChange={(e) => setWishlistForm({ ...wishlistForm, title: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 text-pink-900 bg-white placeholder-pink-400 text-sm"
                      placeholder={t('Enter Notification Title')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-pink-900 mb-1.5">{t('Message Content')} *</label>
                    <textarea
                      value={wishlistForm.message}
                      onChange={(e) => setWishlistForm({ ...wishlistForm, message: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border-2 border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 resize-none text-pink-900 bg-white placeholder-pink-400 text-sm"
                      placeholder={t('Write Your Notification Message Here')}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-pink-200">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wishlistForm.sendEmail}
                      onChange={(e) => setWishlistForm({ ...wishlistForm, sendEmail: e.target.checked })}
                      className="w-4 h-4 text-pink-600 border-2 border-pink-300 rounded focus:ring-pink-500"
                    />
                    <span className="font-medium text-pink-900 text-sm">
                      {t('Send Email Notification')}
                    </span>
                  </label>

                  <button
                    onClick={() => handleSubmit('wishlist')}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-700 text-white font-semibold rounded-lg hover:from-pink-700 hover:to-rose-800 focus:ring-4 focus:ring-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg text-sm"
                  >
                    {loading ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
                    {t('Send Notification')}
                  </button>
                </div>
              </div>
            )}

            {/* Followers Form */}
            {activeTab === 'followers' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                    <label className="block text-sm font-semibold text-emerald-800 mb-3">{t('Notification Title')} *</label>
                      <input
                        type="text"
                        value={followersForm.title}
                        onChange={(e) => setFollowersForm({ ...followersForm, title: e.target.value })}
                        className="w-full px-6 py-4 border-2 border-emerald-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 text-lg text-emerald-900 bg-white placeholder-emerald-400"
                        placeholder={t('Enter Notification Title')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-emerald-800 mb-3">{t('Message Content')} *</label>
                    <textarea
                      value={followersForm.message}
                      onChange={(e) => setFollowersForm({ ...followersForm, message: e.target.value })}
                      rows={8}
                      className="w-full px-6 py-4 border-2 border-emerald-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 text-lg resize-none text-emerald-900 bg-white placeholder-emerald-400"
                      placeholder={t('Write Your Notification Message Here')}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-emerald-200">
                  <label className="flex items-center space-x-4 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={followersForm.sendEmail}
                      onChange={(e) => setFollowersForm({ ...followersForm, sendEmail: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 border-2 border-emerald-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-lg font-medium text-emerald-800 group-hover:text-emerald-600 transition-colors">
                      {t('Send Email Notification')}
                    </span>
                  </label>

                  <button
                    onClick={() => handleSubmit('followers')}
                    disabled={loading}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-700 text-white text-lg font-semibold rounded-2xl hover:from-emerald-700 hover:to-green-800 focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-xl"
                  >
                    {loading ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
                    {t('Send Notification')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationManager;
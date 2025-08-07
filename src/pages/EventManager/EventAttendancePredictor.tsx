import { useState, useEffect } from 'react';
import { Users, Calendar, MapPin, Clock, Sparkles, RefreshCw, CheckCircle, Search, Filter, Brain, Zap, Activity, BarChart3, Target, Cpu, Database, Globe } from 'lucide-react';
import { getEventAttendancePrediction } from '@/services/Event Manager/attendancePrediction.service';
import { getMyApprovedEvents } from '@/services/Event Manager/event.service';
import { connectAnalyticsHub, onAnalytics, connectEventHub, onEvent } from "@/services/signalr.service";

const EventAttendancePredictor = () => {
  const [events, setEvents] = useState([]);
  const [eventSearch, setEventSearch] = useState('');
  // Removed unused searchActiveIndex state
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedEventData, setSelectedEventData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  // Removed unused animateCards state

  // Load events function
  const loadEvents = async () => {
    try {
      const res = await getMyApprovedEvents();
      let myEvents = [];
      if (Array.isArray(res)) {
        myEvents = res;
      } else if (Array.isArray(res?.data?.items)) {
        myEvents = res.data.items;
      } else if (Array.isArray(res?.data)) {
        myEvents = res.data;
      }
      setEvents(myEvents);
    } catch {
      setEvents([]);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // SignalR real-time updates
  useEffect(() => {
            connectAnalyticsHub('https://analytics.vezzy.site/analyticsHub');
            connectEventHub('https://event.vezzy.site/notificationHub');

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
  }, []);

  useEffect(() => {
    setSelectedEventData(events.find(e => e.eventId === selectedEvent));
  }, [selectedEvent, events]);

  const handlePredict = async () => {
    if (!selectedEvent) return;
    setIsLoading(true);
    setPrediction(null);
    // setAnimateCards removed
    try {
      const res = await getEventAttendancePrediction(selectedEvent);
      setPrediction(res.data);
    } catch {
      setPrediction(null);
    } finally {
      setIsLoading(false);
      // setAnimateCards removed
    }
  };

  // SignalR real-time updates for predictions
  useEffect(() => {
            connectAnalyticsHub('https://analytics.vezzy.site/analyticsHub');
            connectEventHub('https://event.vezzy.site/notificationHub');

    // Listen for analytics updates
    onAnalytics('PredictionUpdated', () => {
      if (selectedEvent) {
        handlePredict();
      }
    });

    onAnalytics('AnalyticsUpdated', () => {
      if (selectedEvent) {
        handlePredict();
      }
    });

    // Listen for event updates
    onEvent('EventCreated', () => {
      loadEvents();
    });

    onEvent('EventUpdated', () => {
      loadEvents();
      if (selectedEvent) {
        handlePredict();
      }
    });

    onEvent('EventApproved', () => {
      loadEvents();
    });
  }, [selectedEvent]);

  const formatNumber = (num) => {
    return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0';
  };

  const filteredEvents = events.filter(ev =>
    typeof ev.eventName === 'string' &&
    ev.eventName.toLowerCase().includes(eventSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      {/* <div className="absolute inset-0 bg-gradient-to-r from-purple-800/20 to-pink-800/20 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-pink-500/20 rounded-full blur-xl animate-bounce delay-300"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-cyan-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </div> */}

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 mb-8 border border-purple-500/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                AI Attendance Predictor
              </h1>
              <p className="text-slate-300 text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Dự đoán số người tham dự 
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Neural Network Online
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Real-time Processing
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Big Data Analytics
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Advanced Algorithms
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-8 border border-blue-500/30">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search Input */}
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm sự kiện..."
                    value={eventSearch}
                    onChange={e => {
                      const value = e.target.value;
                      setEventSearch(value);
                      // setSearchActiveIndex removed
                      // Chỉ auto-select nếu chưa chọn hoặc chọn event không còn trong filtered list
                      const filtered = events.filter(ev =>
                        typeof ev.eventName === 'string' &&
                        ev.eventName.toLowerCase().includes(value.toLowerCase())
                      );
                      if (filtered.length === 0) {
                        setSelectedEvent('');
                      } else if (!filtered.some(ev => ev.eventId === selectedEvent)) {
                        setSelectedEvent(filtered[0].eventId);
                      }
                    }}
                    className="pl-10 pr-8 py-3 w-full rounded-xl bg-[#2d0036]/80 text-white border-2 border-cyan-500/30 focus:outline-none focus:border-cyan-400 placeholder:text-cyan-200 transition-all duration-300"
                    autoComplete="off"
                  />
                  {eventSearch && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white focus:outline-none text-xl"
                      onClick={() => {
                        setEventSearch('');
                        // setSearchActiveIndex removed
                        setSelectedEvent('');
                        setSelectedEventData(null);
                      }}
                      tabIndex={-1}
                    >
                      ×
                    </button>
                  )}
                </div>
                {/* Đã bỏ dropdown gợi ý dưới input, chỉ gợi ý bên select */}
              </div>
              {/* Filter Select */}
              <div className="relative w-full sm:w-80">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-200 w-5 h-5" />
                <select
                  value={selectedEvent}
                  onChange={e => {
                    const event = events.find(ev => ev.eventId === e.target.value);
                    setSelectedEvent(e.target.value);
                    setEventSearch(event ? event.eventName : '');
                  }}
                  className="pl-10 pr-8 py-3 w-full rounded-xl bg-[#2d0036]/80 text-white border-2 border-cyan-500/30 focus:outline-none focus:border-cyan-400 appearance-none transition-all duration-300"
                  style={{ maxHeight: '13.5rem', overflowY: 'auto' }}
                >
                  <option value="" className="bg-[#2d0036] text-white">-- Chọn sự kiện --</option>
                  {filteredEvents.map(event => (
                    <option key={event.eventId} value={event.eventId} className="bg-[#2d0036] text-white">
                      {event.eventName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* AI Analyze Button */}
            <button
              onClick={handlePredict}
              disabled={!selectedEvent || isLoading}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl font-semibold transition-all shadow-lg text-lg
                ${selectedEvent && !isLoading
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 hover:scale-105 shadow-purple-500/25'
                  : 'bg-gray-600 text-gray-300 cursor-not-allowed'}
              `}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  AI Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Predict with AI
                </>
              )}
            </button>
          </div>
          {/* Selected Event Info */}
          {selectedEventData && (
            <div className="mt-4 p-4 bg-gradient-to-r from-cyan-900/60 to-blue-900/60 rounded-xl border-2 border-cyan-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-200 text-sm mb-1">Selected Event:</p>
                  <p className="text-white font-bold text-lg">{selectedEventData.eventName}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-cyan-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedEventData.startAt ? `Bắt đầu: ${new Date(selectedEventData.startAt).toLocaleString('vi-VN')}` : '--'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedEventData.endAt ? `Kết thúc: ${new Date(selectedEventData.endAt).toLocaleString('vi-VN')}` : '--'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedEventData.eventLocation || '--'}
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30">
                  {selectedEventData.category || ''}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-xl rounded-2xl shadow-2xl p-16 border border-purple-500/30">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="animate-spin rounded-full h-24 w-24 border-4 border-purple-500 border-t-transparent mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="w-10 h-10 text-purple-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">AI Neural Network Processing</h3>
              <p className="text-slate-300 text-lg mb-6">Analyzing historical data, market trends, and behavioral patterns...</p>
              <div className="flex justify-center items-center gap-6 text-sm text-slate-400 mb-8">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Data Mining
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Pattern Recognition
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Predictive Modeling
                </div>
              </div>
              <div className="flex justify-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Results */}
        {prediction && (
          <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 mb-8 border border-green-500/30">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">AI Prediction Complete</h3>
              <p className="text-slate-300 text-lg">Advanced machine learning analysis results</p>
            </div>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-10 text-white text-center mb-8 relative overflow-hidden">
              {/* Tắt hiệu ứng nhấp nháy */}
              {/* <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 animate-pulse"></div> */}
              <div className="relative z-10">
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <Users className="w-10 h-10" />
                  <span className="text-2xl font-medium">Predicted Attendance</span>
                </div>
                <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                  {formatNumber(prediction.suggested_quantity)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Initial State */}
        {!prediction && !isLoading && (
          <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-xl rounded-2xl shadow-2xl p-16 border border-blue-500/30">
            <div className="text-center">
              <div className="p-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                <Brain className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-6">
                Ready for AI Analysis
              </h3>
              <p className="text-slate-300 text-xl max-w-3xl mx-auto mb-8">
                Select an event above to unleash the power of artificial intelligence. Our advanced neural networks will analyze historical data, market trends, and behavioral patterns to provide precise attendance predictions.
              </p>
              <div className="flex justify-center items-center gap-6 text-slate-400">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  <span className="text-lg">Powered by Machine Learning</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventAttendancePredictor;

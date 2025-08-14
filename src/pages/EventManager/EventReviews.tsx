import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Brain,
  Zap,
  Sparkles,
  Activity,
  Eye,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { getMyApprovedEvents } from '@/services/Event Manager/event.service';
import { analyzeEventSentiment } from '@/services/Event Manager/sentiment.service';
import { onAnalytics } from '@/services/signalr.service';
import { toast } from 'react-toastify';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

const EventReviews = () => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [events, setEvents] = useState([]);
  const [eventSearch, setEventSearch] = useState('');
  const [searchActiveIndex, setSearchActiveIndex] = useState(-1);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedEventData, setSelectedEventData] = useState(null);
  const [sentimentData, setSentimentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [, setAnimateCards] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Lấy tất cả events với pageSize lớn để có đủ dữ liệu cho search
        const res = await getMyApprovedEvents(1, 100);
        let myEvents = [];
        if (res && typeof res === 'object' && 'items' in res) {
          myEvents = res.items || [];
        } else if (Array.isArray(res)) {
          myEvents = res;
        } else if (res?.items) {
          myEvents = Array.isArray(res.items) ? res.items : [];
        }
        setEvents(myEvents);
      } catch {
        setEvents([]);
      }
    };
    fetchEvents();

    // Listen for analytics updates using global connections
    onAnalytics('SentimentAnalyzed', (data: { eventId: string }) => {
      if (data.eventId === selectedEvent) {
        toast.success(t('eventReviews.sentimentAnalysisUpdated'));
        // Optionally refresh the sentiment data
      }
    });
  }, [selectedEvent]);

  const analyzeSentiment = useCallback(async () => {
    if (!selectedEvent) return;
    setLoading(true);
    setSentimentData(null);
    setComments([]);
    setAnimateCards(false);
    try {
      const res = await analyzeEventSentiment(selectedEvent);
      const api = res.data || {};
      const overall = api.overall_sentiment || {};
      // Map negative reviews with score
      const negativeReviews = (api.negative_reviews || []).map((item, idx) => ({
        id: 'neg-' + idx,
        text: item.text || '',
        score: item.socre ?? item.score ?? 0,
      }));
      
      // Calculate total comments
      const totalComments = (api.negative_reviews || []).length + 
                           (api.positive_reviews || []).length + 
                           (api.neutral_reviews || []).length;
      
      const mapped = {
        data: {
          positivePercentage:
            typeof overall.positive_percentage === 'number' ? overall.positive_percentage : 0,
          neutralPercentage:
            typeof overall.neutral_percentage === 'number' ? overall.neutral_percentage : 0,
          negativePercentage:
            typeof overall.negative_percentage === 'number' ? overall.negative_percentage : 0,
          overallSentiment:
            overall.positive_percentage >= 50
              ? 'positive'
              : overall.negative_percentage >= 50
              ? 'negative'
              : 'neutral',
          comments: negativeReviews,
          aspectSentiments: api.aspect_sentiments || [],
          topKeywords: api.top_keywords || {},
          totalComments: totalComments,
        },
      };
      setSentimentData(mapped);
      setComments(mapped.data.comments);
      setAnimateCards(true);
      
      // Show notification if no comments found
      if (totalComments === 0) {
        toast.info(t('eventReviews.noCommentsToAnalyze'));
      }
    } catch (error) {
      console.error('[DEBUG] analyzeSentiment error:', error);
      setSentimentData(null);
      
      // Xử lý trường hợp không tìm thấy bình luận
      if (error?.response?.data?.message?.includes('No comments found')) {
        setSentimentData({
          data: {
            totalComments: 0,
            positivePercentage: 0,
            neutralPercentage: 0,
            negativePercentage: 0,
            overallSentiment: 'neutral',
            comments: []
          }
        });
      } else {
        toast.error(t('eventReviews.errorAnalyzingSentiment'));
      }
    } finally {
      setLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    setSelectedEventData(events.find((e) => e.eventId === selectedEvent));
  }, [selectedEvent, events]);

  const getSentimentGradient = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'from-emerald-400 to-green-600';
      case 'negative':
        return 'from-red-400 to-rose-600';
      default:
        return 'from-amber-400 to-yellow-600';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return <CheckCircle className="w-5 h-5" />;
      case 'negative':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Minus className="w-5 h-5" />;
    }
  };

  const filteredEvents = events.filter(
    (ev) =>
      typeof ev.eventName === 'string' &&
      ev.eventName.toLowerCase().includes(eventSearch.toLowerCase())
  );

  return (
    <div
      className={cn(
        'min-h-screen p-6 relative overflow-hidden',
        getThemeClass(
          'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
          'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
        )
      )}
    >
      <div
        className={cn(
          'absolute inset-0 animate-pulse',
          getThemeClass(
            'bg-gradient-to-r from-blue-800/10 to-purple-800/10',
            'bg-gradient-to-r from-purple-800/20 to-pink-800/20'
          )
        )}
      ></div>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none">
        <div
          className={cn(
            'absolute top-10 left-10 w-20 h-20 rounded-full blur-xl animate-bounce',
            getThemeClass('bg-blue-500/10', 'bg-blue-500/20')
          )}
        ></div>
        <div
          className={cn(
            'absolute top-40 right-20 w-32 h-32 rounded-full blur-xl animate-pulse',
            getThemeClass('bg-purple-500/10', 'bg-purple-500/20')
          )}
        ></div>
        <div
          className={cn(
            'absolute bottom-20 left-1/3 w-24 h-24 rounded-full blur-xl animate-bounce delay-300',
            getThemeClass('bg-pink-500/10', 'bg-pink-500/20')
          )}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div
          className={cn(
            'backdrop-blur-xl rounded-2xl shadow-2xl p-8 mb-8',
            getThemeClass(
              'bg-white/90 border border-blue-200',
              'bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-purple-500/30'
            )
          )}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className={cn(
                'p-3 rounded-2xl',
                getThemeClass(
                  'bg-gradient-to-r from-blue-500 to-purple-600',
                  'bg-gradient-to-r from-blue-500 to-purple-600'
                )
              )}
            >
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1
                className={cn(
                  'text-4xl font-bold bg-clip-text text-transparent mb-2',
                  getThemeClass(
                    'bg-gradient-to-r from-blue-600 to-purple-600',
                    'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400'
                  )
                )}
              >
                {t('eventReviews.title')}
              </h1>
              <p
                className={cn(
                  'text-lg flex items-center gap-2',
                  getThemeClass('text-gray-600', 'text-slate-300')
                )}
              >
                <Sparkles
                  className={cn('w-5 h-5', getThemeClass('text-blue-500', 'text-yellow-400'))}
                />
                {t('eventReviews.subtitle')}
              </p>
            </div>
          </div>
          <div
            className={cn(
              'flex items-center gap-6 text-sm',
              getThemeClass('text-gray-500', 'text-slate-400')
            )}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              {t('eventReviews.aiSystemOnline')}
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {t('eventReviews.realTimeProcessing')}
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {t('eventReviews.deepLearningAnalysis')}
            </div>
          </div>
        </div>

        {/* Controls Section with fixed z-index */}
        <div
          className={cn(
            'backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-8 relative z-30',
            getThemeClass(
              'bg-white/80 border border-blue-200',
              'bg-gradient-to-r from-slate-800/60 to-slate-700/60 border border-blue-500/30'
            )
          )}
        >
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search Input with high z-index dropdown */}
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('eventReviews.searchEvent')}
                    value={eventSearch}
                    onChange={(e) => {
                      setEventSearch(e.target.value);
                      setSearchActiveIndex(-1);
                    }}
                    onKeyDown={(e) => {
                      if (!filteredEvents.length) return;
                      if (e.key === 'Enter') {
                        if (searchActiveIndex >= 0 && filteredEvents[searchActiveIndex]) {
                          setSelectedEvent(filteredEvents[searchActiveIndex].eventId);
                          setEventSearch(filteredEvents[searchActiveIndex].eventName);
                        } else if (filteredEvents.length > 0) {
                          setSelectedEvent(filteredEvents[0].eventId);
                          setEventSearch(filteredEvents[0].eventName);
                        }
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setSearchActiveIndex((idx) => Math.min(idx + 1, filteredEvents.length - 1));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSearchActiveIndex((idx) => Math.max(idx - 1, 0));
                      } else if (e.key === 'Escape') {
                        setSearchActiveIndex(-1);
                      }
                    }}
                    className={cn(
                      'pl-10 pr-8 py-2 w-full rounded-xl border-2 focus:outline-none',
                      getThemeClass(
                        'bg-white text-gray-900 border-blue-300 focus:border-blue-500 placeholder:text-gray-500',
                        'bg-[#2d0036]/80 text-white border-green-500/30 focus:border-green-400 placeholder:text-green-200'
                      )
                    )}
                    autoComplete="off"
                  />
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
                {/* Dropdown with highest z-index */}
                {eventSearch && eventSearch !== (selectedEventData?.eventName || '') && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-[#2d0036] border border-green-500/30 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {filteredEvents.map((ev, idx) => (
                      <div
                        key={ev.eventId}
                        className={`px-4 py-2 cursor-pointer hover:bg-green-700/30 ${
                          selectedEvent === ev.eventId ? 'bg-green-700/40' : ''
                        } ${searchActiveIndex === idx ? 'bg-green-800/60' : ''}`}
                        onClick={() => {
                          setSelectedEvent(ev.eventId);
                          setEventSearch(ev.eventName);
                        }}
                        onMouseEnter={() => setSearchActiveIndex(idx)}
                      >
                        {ev.eventName}
                      </div>
                    ))}
                    {filteredEvents.length === 0 && (
                      <div className="px-4 py-2 text-gray-400">{t('eventReviews.noEventFound')}</div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Select Dropdown */}
              <div className="relative w-full sm:w-80">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-200 w-5 h-5" />
                <select
                  value={selectedEvent}
                  onChange={(e) => {
                    const event = events.find((ev) => ev.eventId === e.target.value);
                    setSelectedEvent(e.target.value);
                    setEventSearch(event ? event.eventName : '');
                  }}
                  className="pl-10 pr-8 py-2 w-full rounded-xl bg-[#2d0036]/80 text-white border-2 border-green-500/30 focus:outline-none focus:border-green-400 appearance-none"
                >
                  <option value="" className="bg-[#2d0036] text-white">
                    -- {t('eventReviews.chooseEvent')} --
                  </option>
                  {filteredEvents.map((event) => (
                    <option
                      key={event.eventId}
                      value={event.eventId}
                      className="bg-[#2d0036] text-white"
                    >
                      {event.eventName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Analyze Button */}
            <button
              onClick={analyzeSentiment}
              disabled={!selectedEvent || loading}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg
                ${
                  selectedEvent && !loading
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {t('eventReviews.analyzing')}
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  {t('eventReviews.analyzeWithAI')}
                </>
              )}
            </button>
          </div>
          
          {/* Selected Event Display */}
          {selectedEventData && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-900/60 to-blue-900/60 rounded-xl border-2 border-green-500/30">
              <p className="text-sm text-green-200">
                <strong className="text-green-300">{t('eventReviews.selectedEvent')}:</strong>{' '}
                {selectedEventData.eventName}
              </p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {sentimentData && (
          <>
            {/* No Comments Found Message */}
            {sentimentData.data.totalComments === 0 ? (
              <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-xl rounded-2xl shadow-2xl p-16 border border-amber-500/30">
                <div className="text-center">
                  <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                    <MessageCircle className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">{t('eventReviews.noCommentsFound')}</h3>
                  <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                    {t('eventReviews.noCommentsDescription')}
                  </p>
                  <div className="mt-8 flex justify-center items-center gap-4 text-slate-400">
                    <Sparkles className="w-5 h-5" />
                    <span>{t('eventReviews.waitingForFeedback')}</span>
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Sentiment Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[
                    {
                      icon: TrendingUp,
                      value: `${sentimentData.data?.positivePercentage ?? 0}%`,
                      label: t('eventReviews.positiveSentiment'),
                      gradient: 'from-emerald-500 to-green-500',
                      bgGradient: 'from-emerald-500/20 to-green-500/20',
                    },
                    {
                      icon: Minus,
                      value: `${sentimentData.data?.neutralPercentage ?? 0}%`,
                      label: t('eventReviews.neutralSentiment'),
                      gradient: 'from-amber-400 to-yellow-600',
                      bgGradient: 'from-amber-400/20 to-yellow-600/20',
                    },
                    {
                      icon: TrendingDown,
                      value: `${sentimentData.data?.negativePercentage ?? 0}%`,
                      label: t('eventReviews.negativeSentiment'),
                      gradient: 'from-red-500 to-rose-500',
                      bgGradient: 'from-red-500/20 to-rose-500/20',
                    },
                  ].map((metric, index) => (
                    <div
                      key={index}
                      className={`bg-gradient-to-br ${metric.bgGradient} backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/10 transform transition-all duration-300 hover:scale-105`}
                    >
                      <div className="flex items-center">
                        <div className={`p-3 bg-gradient-to-r ${metric.gradient} rounded-xl`}>
                          <metric.icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="text-3xl font-bold text-white mb-1">{metric.value}</p>
                          <p className="text-slate-300 text-sm font-medium">{metric.label}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overall Sentiment Overview */}
                <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 mb-8 border border-purple-500/30">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    {t('eventReviews.overallSentiment')}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <div
                        className={`inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r ${getSentimentGradient(
                          sentimentData.data?.overallSentiment
                        )} text-white font-semibold text-lg shadow-lg`}
                      >
                        {getSentimentIcon(sentimentData.data?.overallSentiment)}
                        {t('eventReviews.overallSentiment')}:{' '}
                        {sentimentData.data?.overallSentiment === 'positive'
                          ? t('eventReviews.veryPositive')
                          : sentimentData.data?.overallSentiment === 'negative'
                          ? t('eventReviews.needsImprovement')
                          : t('eventReviews.neutral')}
                      </div>
                    </div>
                    {(sentimentData.data?.positivePercentage > 0 ||
                      sentimentData.data?.neutralPercentage > 0 ||
                      sentimentData.data?.negativePercentage > 0) && (
                      <div className="space-y-4">
                        <div className="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden shadow-inner">
                          <div className="h-full flex">
                            <div
                              className="bg-gradient-to-r from-emerald-400 to-green-500 h-full transition-all duration-1000 ease-out shadow-lg"
                              style={{ width: `${sentimentData.data?.positivePercentage || 0}%` }}
                            ></div>
                            <div
                              className="bg-gradient-to-r from-amber-400 to-yellow-500 h-full transition-all duration-1000 ease-out delay-300"
                              style={{ width: `${sentimentData.data?.neutralPercentage || 0}%` }}
                            ></div>
                            <div
                              className="bg-gradient-to-r from-red-400 to-rose-500 h-full transition-all duration-1000 ease-out delay-500"
                              style={{ width: `${sentimentData.data?.negativePercentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm text-slate-300">
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"></div>
                            {t('eventReviews.positive')} ({sentimentData.data?.positivePercentage ?? 0}%)
                          </span>
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"></div>
                            {t('eventReviews.neutral')} ({sentimentData.data?.neutralPercentage ?? 0}%)
                          </span>
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-rose-500 rounded-full"></div>
                            {t('eventReviews.negativeSentiment')} ({sentimentData.data?.negativePercentage ?? 0}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Negative Comments Section */}
                <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-blue-500/30">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    {t('eventReviews.negativeComments')}
                  </h3>
                  <div className="space-y-4">
                    {comments.length === 0 && (
                      <div className="text-slate-400 text-center py-8">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-400" />
                        <p className="text-green-300">{t('eventReviews.noNegativeComments')}</p>
                        <p className="text-slate-400 text-sm mt-2">{t('eventReviews.noNegativeCommentsDescription')}</p>
                      </div>
                    )}
                    {comments.map((comment, index) => (
                      <div
                        key={comment.id || index}
                        className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 hover:bg-slate-700/50 transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-red-500/20 rounded-lg">
                            <XCircle className="w-5 h-5 text-red-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-200 text-lg leading-relaxed mb-2">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-xl rounded-2xl shadow-2xl p-16 border border-purple-500/30">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-500 border-t-transparent mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-purple-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{t('eventReviews.aiNeuralNetworkProcessing')}</h3>
              <p className="text-slate-300 text-lg">
                {t('eventReviews.analyzingSentimentPatterns')}
              </p>
              <div className="mt-6 flex justify-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        {!sentimentData && !loading && (
          <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-xl rounded-2xl shadow-2xl p-16 border border-blue-500/30">
            <div className="text-center">
              <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">{t('eventReviews.readyForAIAnalysis')}</h3>
              <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                {t('eventReviews.selectEventDescription')}
              </p>
              <div className="mt-8 flex justify-center items-center gap-4 text-slate-400">
                <Sparkles className="w-5 h-5" />
                <span>{t('eventReviews.poweredByAdvancedMachineLearning')}</span>
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventReviews;

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getApprovedEvents } from '@/services/Admin/event.service';
import { analyzeCommentSentiment } from '@/services/Admin/comment.service';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import type { ApprovedEvent } from '@/types/Admin/event';
import type { SentimentAnalysisResponse } from '@/types/Admin/comment';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  open: boolean;
  onClose: () => void;
}

// Helper type guard for keyword object
function isKeywordObject(obj: unknown): obj is { positive: string[]; negative: string[] } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    Array.isArray((obj as Record<string, unknown>).positive) &&
    Array.isArray((obj as Record<string, unknown>).negative)
  );
}

export const AnalyzeCommentModal = ({ open, onClose }: Props) => {
  const [events, setEvents] = useState<ApprovedEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SentimentAnalysisResponse | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getApprovedEvents({ page: 1, pageSize: 100 })
      .then((res) => {
        setEvents(res.data.items || []);
      })
      .catch(() => {
        toast.error('Failed to load events');
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const handleAnalyze = async () => {
    if (!selectedEventId) {
      toast.warn('Please select an event!');
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await analyzeCommentSentiment(selectedEventId);
      if (res.flag && res.data) {
        setResult(res.data);
      } else {
        toast.error(res.message || 'Analyze failed');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error?.response?.data?.message || error?.message || 'Analyze failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose} modal={true}>
      <DialogContent
        className="max-w-3xl bg-white dark:bg-gray-800 p-0 shadow-lg flex flex-col rounded-xl border-0 dark:border-0"
        style={{ maxHeight: '80vh', minHeight: '200px' }}
      >
        <div className="p-6 border-b border-gray-200 dark:border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Analyze Event Comments Sentiment
            </DialogTitle>
          </DialogHeader>
        </div>
        {/* Nội dung modal cho scroll nếu vượt quá */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Event
            </label>
            <Select
              value={selectedEventId}
              onValueChange={(val) => {
                setSelectedEventId(val);
                setResult(null);
              }}
              disabled={loading || analyzing}
            >
              <SelectTrigger className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                {events.map((event) => (
                  <SelectItem
                    key={event.eventId}
                    value={event.eventId}
                    className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    {event.eventName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Kết quả phân tích cũng nằm trong vùng scroll này */}
          {result && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
                Sentiment Analysis Result
              </h4>
              <div className="flex flex-col items-center my-4">
                <ResponsiveContainer width={340} height={180}>
                  <BarChart
                    layout="vertical"
                    data={[
                      {
                        name: 'Positive',
                        value: result.overall_sentiment.positive_percentage,
                        fill: '#14b8a6',
                      },
                      {
                        name: 'Negative',
                        value: result.overall_sentiment.negative_percentage,
                        fill: '#ef4444',
                      },
                      {
                        name: 'Neutral',
                        value: result.overall_sentiment.neutral_percentage,
                        fill: '#6b7280',
                      },
                    ]}
                    margin={{ left: 40, right: 40, top: 10, bottom: 10 }}
                    barCategoryGap={28}
                  >
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tick={(props) => {
                        const { x, y, payload } = props;
                        let color = '#6b7280';
                        if (payload.value === 'Positive') color = '#14b8a6';
                        if (payload.value === 'Negative') color = '#ef4444';
                        return (
                          <text
                            x={x}
                            y={y}
                            dy={4}
                            fontSize={15}
                            fontWeight={700}
                            fill={color}
                            textAnchor="end"
                          >
                            {payload.value}
                          </text>
                        );
                      }}
                    />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar
                      dataKey="value"
                      radius={[12, 12, 12, 12]}
                      barSize={32}
                      isAnimationActive
                      label={({ value, fill }) => (
                        <tspan x="0" dy={0} fontSize={15} fontWeight={700} fill={fill}>
                          {value}%
                        </tspan>
                      )}
                    >
                      {['#14b8a6', '#ef4444', '#6b7280'].map((color) => (
                        <Cell key={color} fill={color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mb-2">
                <div className="font-semibold mb-1 text-gray-800 dark:text-gray-200">
                  Top Keywords:
                </div>
                <div className="flex flex-wrap gap-4 mt-1">
                  {/* Positive Keywords */}
                  {isKeywordObject(result.top_keywords) && (
                    <div>
                      <div className="text-green-600 dark:text-green-400 font-medium mb-1">
                        Positive:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.top_keywords.positive.map((kw) => (
                          <span
                            key={kw}
                            className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Negative Keywords */}
                  {isKeywordObject(result.top_keywords) && (
                    <div>
                      <div className="text-red-600 dark:text-red-400 font-medium mb-1">
                        Negative:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.top_keywords.negative.map((kw) => (
                          <span
                            key={kw}
                            className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Fallback if no keywords */}
                  {(!result.top_keywords || !isKeywordObject(result.top_keywords)) && (
                    <span className="text-gray-400 dark:text-gray-500 text-xs">
                      No keywords found.
                    </span>
                  )}
                </div>
              </div>
              <div className="mb-2">
                <div className="font-semibold text-gray-800 dark:text-gray-200">
                  Top Negative Reviews:
                </div>
                <ul className="list-disc ml-5 text-sm">
                  {result.negative_reviews.map((r) => (
                    <li key={r.text} className="mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{r.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Aspect sentiments nếu có */}
              {Array.isArray(result.aspect_sentiments) && result.aspect_sentiments.length > 0 && (
                <div className="mb-2">
                  <div className="font-semibold mb-1 text-gray-800 dark:text-gray-200">
                    Aspect Sentiments:
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-[400px] border border-gray-200 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-600">
                          <th className="px-3 py-1 text-left font-semibold text-gray-900 dark:text-gray-100">
                            Aspect
                          </th>
                          <th className="px-3 py-1 text-center font-semibold text-gray-900 dark:text-gray-100">
                            Sentiment
                          </th>
                          <th className="px-3 py-1 text-center font-semibold text-gray-900 dark:text-gray-100">
                            Mentions
                          </th>
                          <th className="px-3 py-1 text-center font-semibold text-gray-900 dark:text-gray-100">
                            Score
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.aspect_sentiments.map((aspect, idx) => (
                          <tr
                            key={aspect.aspect || idx}
                            className="border-t border-gray-200 dark:border-gray-600"
                          >
                            <td className="px-3 py-1 font-medium text-gray-700 dark:text-gray-300">
                              {aspect.aspect}
                            </td>
                            <td
                              className="px-3 py-1 font-semibold text-center"
                              style={{
                                color:
                                  aspect.sentiment === 'positive'
                                    ? '#16a34a'
                                    : aspect.sentiment === 'negative'
                                    ? '#dc2626'
                                    : '#6b7280',
                              }}
                            >
                              {aspect.sentiment}
                            </td>
                            <td className="px-3 py-1 text-gray-500 dark:text-gray-400 text-center">
                              {aspect.mention_count}
                            </td>
                            <td className="px-3 py-1 text-gray-500 dark:text-gray-400 text-center">
                              {aspect.score.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Footer luôn nằm dưới cùng modal */}
        <div className="p-6 border-t border-gray-200 dark:border-0 flex justify-end gap-3">
          <button
            className="border-2 border-gray-400 bg-gray-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-gray-700 hover:border-gray-400"
            onClick={onClose}
            disabled={analyzing}
            type="button"
          >
            Cancel
          </button>
          <button
            className="border-2 border-blue-500 bg-blue-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-blue-500 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleAnalyze}
            disabled={analyzing || !selectedEventId}
            type="button"
          >
            {analyzing ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                Analyzing
              </>
            ) : (
              'Analyze'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnalyzeCommentModal;

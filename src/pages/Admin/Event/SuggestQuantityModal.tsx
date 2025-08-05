import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getApprovedEvents } from '@/services/Admin/event.service';
import { suggestEventQuantity } from '@/services/Admin/event.service';
import { toast } from 'react-toastify';
import { FaSpinner, FaUsers, FaBrain } from 'react-icons/fa';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import type { ApprovedEvent } from '@/types/Admin/event';
import type { SuggestQuantityResponse } from '@/types/Admin/event';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const SuggestQuantityModal = ({ open, onClose }: Props) => {
  const [events, setEvents] = useState<ApprovedEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<number | null>(null);

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

  const handlePredict = async () => {
    if (!selectedEventId) {
      toast.warn('Please select an event!');
      return;
    }
    setPredicting(true);
    setResult(null);
    try {
      const res = await suggestEventQuantity(selectedEventId);
      if (res.flag && res.data) {
        setResult(res.data.suggested_quantity);
        toast.success('Prediction completed successfully!');
      } else {
        toast.error(res.message || 'Prediction failed');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error?.response?.data?.message || error?.message || 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  const selectedEvent = events.find((event) => event.eventId === selectedEventId);

  return (
    <Dialog open={open} onOpenChange={onClose} modal={true}>
      <DialogContent
        className="max-w-2xl bg-white dark:bg-gray-800 p-0 shadow-lg flex flex-col rounded-xl border-0 dark:border-0"
        style={{ maxHeight: '80vh', minHeight: '200px' }}
      >
        <div className="p-6 border-b border-gray-200 dark:border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <FaBrain className="w-5 h-5 text-blue-500" />
              AI Event Attendance Prediction
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Select Event
            </label>
            <Select
              value={selectedEventId}
              onValueChange={(val) => {
                setSelectedEventId(val);
                setResult(null);
              }}
              disabled={loading || predicting}
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

          {/* Event Details */}
          {selectedEvent && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Event Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Name:</span>
                  <p className="text-gray-800 dark:text-gray-200">{selectedEvent.eventName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Location:</span>
                  <p className="text-gray-800 dark:text-gray-200">{selectedEvent.eventLocation}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Start Date:</span>
                  <p className="text-gray-800 dark:text-gray-200">
                    {selectedEvent.startAt
                      ? new Date(selectedEvent.startAt).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">End Date:</span>
                  <p className="text-gray-800 dark:text-gray-200">
                    {selectedEvent.endAt
                      ? new Date(selectedEvent.endAt).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Category:</span>
                  <p className="text-gray-800 dark:text-gray-200">
                    {selectedEvent.categoryName && selectedEvent.categoryName.length > 0
                      ? selectedEvent.categoryName.join(', ')
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Created By:</span>
                  <p className="text-gray-800 dark:text-gray-200">
                    {selectedEvent.createByName || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Prediction Result */}
          {result !== null && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <FaUsers className="w-4 h-4 text-green-500" />
                AI Prediction Result
              </h4>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {result.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Predicted Attendees
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  <p className="mb-2">
                    <strong>Note:</strong> This prediction is based on AI analysis of similar
                    events, historical data, and current market trends. Actual attendance may vary.
                  </p>
                  <p>
                    <strong>Factors considered:</strong> Event category, location, timing,
                    historical attendance patterns, and market conditions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-0 flex justify-end gap-3">
          <button
            className="border-2 border-gray-400 bg-gray-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-gray-700 hover:border-gray-400"
            onClick={onClose}
            disabled={predicting}
            type="button"
          >
            Cancel
          </button>
          <button
            className="border-2 border-blue-500 bg-blue-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-blue-500 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handlePredict}
            disabled={predicting || !selectedEventId}
            type="button"
          >
            {predicting ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                Predicting...
              </>
            ) : (
              <>
                <FaBrain className="w-4 h-4" />
                Predict Attendance
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestQuantityModal;

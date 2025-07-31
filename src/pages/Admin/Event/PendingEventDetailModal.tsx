/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { ApprovedEvent, AdminTicket } from '@/types/Admin/event';
import { getUserByIdAPI } from '@/services/Admin/user.service';
import {
  getCategoryById,
  getTicketsByEventAdmin,
  approvedRejectEvent,
} from '@/services/Admin/event.service';
import { EventApproveStatus } from '@/types/Admin/event';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import { NO_IMAGE } from '@/assets/img';

interface Props {
  event: ApprovedEvent;
  onClose: () => void;
  onActionDone?: () => void;
}

export const PendingEventDetailModal = ({ event, onClose, onActionDone }: Props) => {
  const [createdByName, setCreatedByName] = useState<string>('unknown');
  const [approvedByName, setApprovedByName] = useState<string>('unknown');
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    if (event.createdBy) {
      getUserByIdAPI(event.createdBy)
        .then((name) => setCreatedByName(name || 'unknown'))
        .catch(() => setCreatedByName('unknown'));
    }
    if (event.approvedBy) {
      getUserByIdAPI(event.approvedBy)
        .then((name) => setApprovedByName(name || 'unknown'))
        .catch(() => setApprovedByName('unknown'));
    }
    if (event.categoryIds && event.categoryIds.length > 0) {
      const isValidCategoryId = (id: string) => !!id && /^[0-9a-fA-F-]{36}$/.test(id);
      Promise.all(
        event.categoryIds.map(async (id) => {
          if (!isValidCategoryId(id)) return 'unknown';
          try {
            const cat = await getCategoryById(id);
            return cat.categoryName || id;
          } catch {
            return 'unknown';
          }
        })
      ).then(setCategoryNames);
    } else {
      setCategoryNames([]);
    }
  }, [event.createdBy, event.approvedBy, event.categoryIds]);

  useEffect(() => {
    setLoadingTickets(true);
    getTicketsByEventAdmin(event.eventId)
      .then((res) => setTickets(res.data?.items || []))
      .catch(() => setTickets([]))
      .finally(() => setLoadingTickets(false));
  }, [event.eventId]);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = NO_IMAGE;
  };

  const handleApprove = async () => {
    setApproveLoading(true);
    setLoading(true);
    try {
      const res = await approvedRejectEvent(event.eventId, EventApproveStatus.Approved, '');
      if (res.flag) {
        toast.success('Event approved successfully!');
        onClose();
        onActionDone && onActionDone();
      } else {
        toast.error('Approve event failed!');
      }
    } catch {
      toast.error('Approve event failed!');
    } finally {
      setApproveLoading(false);
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason!');
      return;
    }
    setRejectLoading(true);
    setLoading(true);
    try {
      const res = await approvedRejectEvent(
        event.eventId,
        EventApproveStatus.Rejected,
        rejectionReason
      );
      if (res.flag) {
        toast.success('Event rejected successfully!');
        onClose();
        onActionDone && onActionDone();
      } else {
        toast.error('Reject event failed!');
      }
    } catch {
      toast.error('Reject event failed!');
    } finally {
      setRejectLoading(false);
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!event} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto p-4">
          {/* Cover Image */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-69 h-48 rounded border bg-gray-100 flex items-center justify-center overflow-hidden mt-1">
              <img
                src={event.eventCoverImageUrl || NO_IMAGE}
                alt="cover"
                className="object-contain w-full h-full"
                onError={handleImgError}
              />
            </div>
          </div>
          {/* Hiển thị từng content riêng biệt nếu có */}
          {event.contents && event.contents.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Contents</label>
              <div className="flex flex-col gap-6">
                {event.contents.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row gap-4 items-start bg-gray-100 rounded px-2 py-2 border"
                  >
                    <div>
                      <img
                        src={c.imageUrl || NO_IMAGE}
                        alt={c.description?.slice(0, 30) || `content-img-${idx}`}
                        className="w-40 h-28 object-cover rounded border mb-2 md:mb-0"
                        onError={handleImgError}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-700 mb-1">#{idx + 1}</div>
                      <div className="text-gray-700 text-sm whitespace-pre-line">
                        {c.description || (
                          <span className="italic text-gray-400">No description</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Info fields as input/textarea (style giống category detail) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input
                value={event.eventName ?? 'unknown'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Location</label>
              <input
                value={event.eventLocation ?? 'unknown'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <input
                value={categoryNames.length > 0 ? categoryNames.join(', ') : 'unknown'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start At</label>
              <input
                value={
                  event.startAt
                    ? new Date(event.startAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'unknown'
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End At</label>
              <input
                value={
                  event.endAt
                    ? new Date(event.endAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'unknown'
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tags</label>
              <input
                value={event.tags && event.tags.length > 0 ? event.tags.join(', ') : 'unknown'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bank Account</label>
              <input
                value={event.bankAccount ?? 'unknown'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea
              value={event.eventDescription ?? 'unknown'}
              readOnly
              className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Approved By</label>
              <input
                value={event.approvedBy ? approvedByName : 'unknown'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Approved At</label>
              <input
                value={
                  event.approvedAt
                    ? new Date(event.approvedAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'unknown'
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Created By</label>
              <input
                value={event.createdBy ? createdByName : 'unknown'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Created At</label>
              <input
                value={
                  event.createdAt
                    ? new Date(event.createdAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'unknown'
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
          </div>
          {/* Ticket List */}
          <div>
            <b>Tickets:</b>
            <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow">
              {loadingTickets ? (
                <div className="text-gray-500 p-4">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="text-gray-500 p-4">No tickets found.</div>
              ) : (
                <table className="min-w-full text-sm rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-900 font-semibold">
                      <th className="px-3 py-2 text-center">#</th>
                      <th className="px-3 py-2 text-center">Name</th>
                      <th className="px-3 py-2 text-center">Description</th>
                      <th className="px-3 py-2 text-center">Price</th>
                      <th className="px-3 py-2 text-center">Available</th>
                      <th className="px-3 py-2 text-center">Sold</th>
                      <th className="px-3 py-2 text-center">Start Sell</th>
                      <th className="px-3 py-2 text-center">End Sell</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket, idx) => (
                      <tr key={ticket.ticketId} className="hover:bg-blue-50 transition-colors">
                        <td className="px-3 py-2 text-center font-medium">{idx + 1}</td>
                        <td className="px-3 py-2 text-center">{ticket.ticketName}</td>
                        <td className="px-3 py-2 text-center">{ticket.ticketDescription}</td>
                        <td className="px-3 py-2 text-center text-blue-700 font-bold">
                          {ticket.ticketPrice?.toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="px-3 py-2 text-center">{ticket.quantityAvailable}</td>
                        <td className="px-3 py-2 text-center">{ticket.quantitySold}</td>
                        <td className="px-3 py-2 text-center">
                          {ticket.startSellAt
                            ? new Date(ticket.startSellAt).toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : ''}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {ticket.endSellAt
                            ? new Date(ticket.endSellAt).toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        <div className="p-4">
          <DialogFooter>
            {/* Action buttons */}
            {showRejectInput ? (
              <>
                <input
                  className="border px-2 py-1 rounded w-full mb-2"
                  placeholder="Enter rejection reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  disabled={loading}
                />
                <button
                  className=" border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-red-600 hover:text-white hover:border-red-500 mr-2 flex items-center justify-center"
                  onClick={handleReject}
                  disabled={loading || rejectLoading}
                  type="button"
                >
                  {rejectLoading && <FaSpinner className="animate-spin mr-2" />}
                  Submit
                </button>
                <button
                  className="border-2 border-[#24b4fb] bg-white rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-[#24b4fb] hover:bg-[#24b4fb] hover:text-white hover:border-[#24b4fb]"
                  onClick={() => setShowRejectInput(false)}
                  disabled={loading || rejectLoading}
                  type="button"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  className="flex gap-2 items-center border-2 border-green-500 bg-green-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-green-600 hover:text-white hover:border-green-500"
                  style={{ boxSizing: 'border-box' }}
                  onClick={handleApprove}
                  disabled={loading || approveLoading}
                  type="button"
                >
                  {approveLoading && <FaSpinner className="animate-spin mr-2" />}
                  Approve
                </button>
                <button
                  className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-red-600 hover:text-white-500 hover:border-red-500"
                  style={{ boxSizing: 'border-box' }}
                  onClick={() => setShowRejectInput(true)}
                  disabled={loading || approveLoading}
                  type="button"
                >
                  Reject
                </button>
                <button
                  className="border-2 border-red-500 bg-white rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500"
                  onClick={onClose}
                  disabled={loading || approveLoading}
                  type="button"
                >
                  Close
                </button>
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PendingEventDetailModal;

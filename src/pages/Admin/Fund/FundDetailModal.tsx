import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { WithdrawalRequestDto } from '@/types/Admin/fund';
import { useState } from 'react';
import { approveWithdrawal, rejectWithdrawal, confirmPayment } from '@/services/Admin/fund.service';
import { toast } from 'react-toastify';
import { formatCurrency } from '@/utils/format';

interface Props {
  withdrawal: WithdrawalRequestDto;
  onClose: () => void;
  showActionButtons?: boolean;
  showConfirmPaymentButton?: boolean;
  onSuccess?: () => void;
}

const FundDetailModal = ({
  withdrawal,
  onClose,
  showActionButtons = true,
  showConfirmPaymentButton = false,
  onSuccess,
}: Props) => {
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const isPending = withdrawal.transactionStatus === 'Pending';

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (showConfirmPaymentButton) {
        await confirmPayment(withdrawal.transactionId, { Notes: reason.trim() });
        toast.success('Confirmed payment successfully');
      } else if (actionType === 'approve') {
        await approveWithdrawal(withdrawal.transactionId, { Notes: reason.trim() });
        toast.success('Approved successfully');
      } else {
        await rejectWithdrawal(withdrawal.transactionId, { Reason: reason.trim() });
        toast.success('Rejected successfully');
      }
      setActionType(null);
      setReason('');
      // Gọi callback để refresh danh sách trước khi đóng modal
      onSuccess?.();
      toast.success('List refreshed successfully');
      // Đóng modal sau khi refresh
      setTimeout(() => {
        onClose();
      }, 100);
    } catch {
      toast.error('Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!withdrawal} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Withdrawal Detail</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Event Name</label>
              <input
                value={withdrawal.eventName}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bank Account</label>
              <input
                value={withdrawal.bankAccount}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bank Account Name</label>
              <input
                value={withdrawal.bankAccountName}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bank Name</label>
              <input
                value={withdrawal.bankName}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount</label>
              <input
                value={formatCurrency(withdrawal.amount)}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <input
                value={withdrawal.transactionStatus}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Created At</label>
              <input
                value={withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleString() : ''}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Processed At</label>
              <input
                value={
                  withdrawal.processedAt ? new Date(withdrawal.processedAt).toLocaleString() : ''
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Initiated By Name</label>
              <input
                value={withdrawal.initiatedByName}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Processed By Name</label>
              <input
                value={withdrawal.processedByName || ''}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>

            <div className="md:col-span-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Transaction Description</label>
                <textarea
                  value={withdrawal.transactionDescription}
                  readOnly
                  rows={5}
                  className="bg-gray-200 border rounded px-2 py-1 w-full mb-1 resize-none overflow-y-auto"
                  style={{ minHeight: '120px', maxHeight: '120px' }}
                />
              </div>
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <div className="bg-gray-200 border rounded px-2 py-1 w-full mb-1 min-h-[40px]">
                {withdrawal.notes ? (
                  <span>{withdrawal.notes}</span>
                ) : (
                  <span className="text-gray-400">No notes</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <DialogFooter>
            {showConfirmPaymentButton ? (
              !actionType ? (
                <div className="flex gap-2">
                  <button
                    className="border-2 border-green-500 bg-green-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-green-500 hover:border-green-500"
                    onClick={() => setActionType('approve')}
                    type="button"
                  >
                    Confirm Payment
                  </button>
                  <button
                    className="border-2 border-gray-400 bg-gray-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-gray-700 hover:border-gray-400"
                    onClick={onClose}
                    type="button"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form
                  className="flex flex-col gap-2 w-full"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                >
                  <label className="text-sm font-medium">Enter payment note</label>
                  <input
                    className="border rounded px-2 py-1"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Payment note..."
                    required
                    disabled={loading}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      className="border-2 border-green-500 bg-green-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-green-500"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Confirm'}
                    </button>
                    <button
                      className="border-2 border-gray-400 bg-gray-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-gray-700 hover:border-gray-400"
                      type="button"
                      onClick={() => {
                        setActionType(null);
                        setReason('');
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )
            ) : (
              <>
                {/* Nếu là pending thì hiện nút action */}
                {showActionButtons && isPending && !actionType && (
                  <div className="flex gap-2">
                    <button
                      className="border-2 border-green-500 bg-green-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-green-500 hover:border-green-500"
                      onClick={() => setActionType('approve')}
                      type="button"
                    >
                      Approve
                    </button>
                    <button
                      className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
                      onClick={() => setActionType('reject')}
                      type="button"
                    >
                      Reject
                    </button>
                    <button
                      className="border-2 border-gray-400 bg-gray-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-gray-700 hover:border-gray-400"
                      onClick={onClose}
                      type="button"
                    >
                      Close
                    </button>
                  </div>
                )}
                {/* Nếu đang approve/reject thì hiện input nhập lý do và xác nhận */}
                {showActionButtons && isPending && actionType && (
                  <form
                    className="flex flex-col gap-2 w-full"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmit();
                    }}
                  >
                    <label className="text-sm font-medium">
                      {actionType === 'approve'
                        ? 'Enter approval reason'
                        : 'Enter rejection reason'}
                    </label>
                    <input
                      className="border rounded px-2 py-1"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={
                        actionType === 'approve' ? 'Approval reason...' : 'Rejection reason...'
                      }
                      required
                      disabled={loading}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        className={`border-2 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold ${
                          actionType === 'approve'
                            ? 'border-green-500 bg-green-500 text-white hover:bg-white hover:text-green-500'
                            : 'border-red-500 bg-red-500 text-white hover:bg-white hover:text-red-500'
                        }`}
                        type="submit"
                        disabled={loading}
                      >
                        {loading
                          ? 'Processing...'
                          : actionType === 'approve'
                          ? 'Confirm Approve'
                          : 'Confirm Reject'}
                      </button>
                      <button
                        className="border-2 border-gray-400 bg-gray-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-gray-700 hover:border-gray-400"
                        type="button"
                        onClick={() => {
                          setActionType(null);
                          setReason('');
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                {/* Nếu không phải pending thì chỉ hiện nút Close */}
                {(!showActionButtons || !isPending) && (
                  <button
                    className="border-2 border-gray-400 bg-gray-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-gray-700 hover:border-gray-400"
                    onClick={onClose}
                    type="button"
                  >
                    Close
                  </button>
                )}
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FundDetailModal;

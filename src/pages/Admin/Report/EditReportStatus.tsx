/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { FaSpinner } from 'react-icons/fa';
import type { Report } from '@/types/Admin/report';
import { updateReportStatus } from '@/services/Admin/report.service';
import { toast } from 'react-toastify';

interface Props {
  report: Report | null;
  onClose: () => void;
  onUpdated?: () => void;
  statusMap?: Record<number, string>;
}

const statusOptions = [
  { value: 0, label: 'Pending' },
  { value: 1, label: 'Resolved' },
  { value: 2, label: 'Rejected' },
  { value: 3, label: 'Other' },
];

const EditReportStatus = ({ report, onClose, onUpdated, statusMap }: Props) => {
  const [status, setStatus] = useState<number>(report?.status ?? 0);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!report) return;
    setLoading(true);
    try {
      await updateReportStatus(report.reportId, status as 0 | 1 | 2 | 3);
      onUpdated && onUpdated();
      setLoading(false);
      toast.success('Status updated successfully');
      onClose();
    } catch {
      setLoading(false);
      toast.error('An error occurred while updating the status.');
    }
  };

  return (
    <Dialog open={!!report} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Edit Report Status</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 p-4 pt-0">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <Select
              value={status.toString()}
              onValueChange={(val) => setStatus(Number(val))}
              disabled={loading}
            >
              <SelectTrigger className="border-gray-200 border rounded px-2 py-1 w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {statusMap ? statusMap[opt.value] : opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="p-4">
          <DialogFooter>
            <button
              className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500 mr-2"
              onClick={onClose}
              disabled={loading}
              type="button"
            >
              Cancel
            </button>
            <button
              className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
              onClick={handleSave}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Saving...
                </div>
              ) : (
                'Save'
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditReportStatus;

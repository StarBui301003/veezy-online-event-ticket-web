import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { ApprovedEvent } from '@/types/Admin/event';

interface Props {
  event: ApprovedEvent;
  onClose: () => void;
}

export const PendingEventDetailModal = ({ event, onClose }: Props) => (
  <Dialog open={!!event} onOpenChange={onClose}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Event Details</DialogTitle>
      </DialogHeader>
      <div className="space-y-2">
        <div>
          <b>Name:</b> {event.eventName}
        </div>
        <div>
          <b>Description:</b> {event.eventDescription}
        </div>
        <div>
          <b>Location:</b> {event.eventLocation}
        </div>
        <div>
          <b>Start:</b> {event.startAt}
        </div>
        <div>
          <b>End:</b> {event.endAt}
        </div>
        <div>
          <b>Approved By:</b> {event.approvedBy}
        </div>
        <div>
          <b>Created By:</b> {event.createdBy}
        </div>
        {/* Add more fields as needed */}
      </div>
      <DialogFooter>
        <button
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          onClick={onClose}
        >
          Close
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default Ev;

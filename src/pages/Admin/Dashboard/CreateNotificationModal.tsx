/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { sendNotificationByRoles } from '@/services/Admin/notification.service';
import { toast } from 'react-toastify';
import type { SendNotificationByRolesRequest, Role } from '@/types/Admin/notification';
import { FaSpinner } from 'react-icons/fa';
import { Switch } from '@/components/ui/switch';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const ROLE_OPTIONS = [
  { value: 0, label: 'Admin' },
  { value: 1, label: 'Customer' },
  { value: 2, label: 'Event Manager' },
  { value: 3, label: 'Collaborator' },
];

export const CreateNotificationModal = ({ open, onClose, onCreated }: Props) => {
  const [form, setForm] = useState<SendNotificationByRolesRequest>({
    title: '',
    message: '',
    roles: [],
    sendEmail: true,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof SendNotificationByRolesRequest, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.message.trim() || !form.roles || form.roles.length === 0) {
      toast.error('Please enter title, message and select at least one role!');
      return;
    }
    setLoading(true);
    try {
      const response = await sendNotificationByRoles({
        ...form,
        roles: form.roles,
      });
      toast.success(response.message);
      setForm({ title: '', message: '', roles: [], sendEmail: true });
      onClose();
      if (onCreated) onCreated();
    } catch (error: unknown) {
      const errMsg =
        error && typeof error === 'object' && 'message' in error
          ? (error as any).message
          : 'Failed to send notification!';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Create Notification</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Title</label>
            <input
              className="border px-3 py-2 rounded w-full"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              disabled={loading}
              placeholder="Enter notification title"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Message</label>
            <textarea
              className="border px-3 py-2 rounded w-full min-h-[80px]"
              value={form.message}
              onChange={(e) => handleChange('message', e.target.value)}
              disabled={loading}
              placeholder="Enter notification message"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Roles</label>
            <div className="flex flex-wrap gap-3">
              {ROLE_OPTIONS.map((role) => (
                <label key={role.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.roles?.includes(role.value as Role) || false}
                    onChange={(e) =>
                      handleChange(
                        'roles',
                        e.target.checked
                          ? [...(form.roles || []), role.value as Role]
                          : (form.roles || []).filter((r) => r !== (role.value as Role))
                      )
                    }
                    disabled={loading}
                  />
                  <span className="text-sm">{role.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Send Email</label>
            <Switch
              checked={form.sendEmail}
              onCheckedChange={(checked) => handleChange('sendEmail', checked)}
              disabled={loading}
              className={
                form.sendEmail ? '!bg-green-500 !border-green-500' : '!bg-red-400 !border-red-400'
              }
            />
            <span className="ml-2 text-sm">Send notification via email</span>
          </div>
        </div>
        <div className="p-4 flex justify-end gap-2">
          <DialogFooter>
            <button
              className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
              onClick={onClose}
              disabled={loading}
              type="button"
            >
              Cancel
            </button>
            <button
              className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2] flex items-center justify-center gap-2"
              onClick={handleCreate}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Sending...
                </>
              ) : (
                'Send'
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNotificationModal;

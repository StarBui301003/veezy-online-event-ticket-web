/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      <DialogContent className="max-w-md bg-white dark:bg-gray-800 p-0 shadow-lg rounded-xl border-0 dark:border-0">
        <div className="p-6 border-b border-gray-200 dark:border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Create Notification
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Title
            </label>
            <input
              className="border border-gray-200 dark:border-0 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              disabled={loading}
              placeholder="Enter notification title"
            />
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Message
            </label>
            <textarea
              className="border border-gray-200 dark:border-0 rounded px-3 py-2 w-full min-h-[100px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              value={form.message}
              onChange={(e) => handleChange('message', e.target.value)}
              disabled={loading}
              placeholder="Enter notification message"
            />
          </div>

          {/* Roles Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Target Roles
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((role) => (
                <label
                  key={role.value}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
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
                    className="w-4 h-4 text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {role.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Email Notification Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Email Notification
            </label>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Switch
                checked={form.sendEmail}
                onCheckedChange={(checked) => handleChange('sendEmail', checked)}
                disabled={loading}
                className={
                  form.sendEmail ? '!bg-green-500 !border-green-500' : '!bg-red-400 !border-red-400'
                }
              />
              <span className="text-sm text-gray-900 dark:text-white">
                Send notification via email
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-200 flex justify-end gap-3">
          <button
            className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            Cancel
          </button>
          <button
            className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-[#0071e2] flex items-center justify-center gap-2"
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
              'Send Notification'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNotificationModal;

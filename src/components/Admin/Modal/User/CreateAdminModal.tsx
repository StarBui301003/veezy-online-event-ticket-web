/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { createAdminAPI } from '@/services/User/user.service';
import { toast } from 'react-toastify';
import type { CreateAdminRequest } from '@/types/Admin/user';
import { FaSpinner } from 'react-icons/fa';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const GENDER_OPTIONS = [
  { value: 0, label: 'Male' },
  { value: 1, label: 'Female' },
];

export const CreateAdminModal = ({ open, onClose, onCreated }: Props) => {
  const [form, setForm] = useState<CreateAdminRequest>({
    username: '',
    email: '',
    phone: '',
    password: '',
    gender: 0,
    fullName: '',
    dateOfBirth: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'gender' ? Number(value) : type === 'number' ? Number(value) : value,
    }));
  };

  const handleCreate = async () => {
    if (!form.username.trim()) {
      toast.error('Username is required!');
      return;
    }
    if (!form.email.trim()) {
      toast.error('Email is required!');
      return;
    }
    if (!form.password.trim()) {
      toast.error('Password is required!');
      return;
    }
    if (!form.fullName.trim()) {
      toast.error('Full name is required!');
      return;
    }
    if (!form.dateOfBirth) {
      toast.error('Date of birth is required!');
      return;
    }
    setLoading(true);
    try {
      await createAdminAPI(form);
      toast.success('Admin account created successfully!');
      setForm({
        username: '',
        email: '',
        phone: '',
        password: '',
        gender: 0,
        fullName: '',
        dateOfBirth: '',
      });
      onClose();
      if (onCreated) onCreated();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create admin!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Create Admin</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Username</label>
            <input
              className="border px-3 py-2 rounded w-full"
              name="username"
              value={form.username}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input
              className="border px-3 py-2 rounded w-full"
              name="email"
              type="email"
              value={form.email}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Enter email"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input
              className="border px-3 py-2 rounded w-full"
              name="phone"
              value={form.phone}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Enter phone"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Password</label>
            <input
              className="border px-3 py-2 rounded w-full"
              name="password"
              type="password"
              value={form.password}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Enter password"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Full Name</label>
            <input
              className="border px-3 py-2 rounded w-full"
              name="fullName"
              value={form.fullName}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Gender</label>
            <select
              className="border px-3 py-2 rounded w-full"
              name="gender"
              value={form.gender}
              onChange={handleInputChange}
              disabled={loading}
            >
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date of Birth</label>
            <input
              className="border px-3 py-2 rounded w-full"
              name="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={handleInputChange}
              disabled={loading}
            />
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
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAdminModal;

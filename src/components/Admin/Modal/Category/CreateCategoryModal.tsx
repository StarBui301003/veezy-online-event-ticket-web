import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { createCategory } from '@/services/Admin/event.service';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateCategoryModal = ({ open, onClose, onCreated }: Props) => {
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!categoryName.trim()) {
      if (!toast.isActive('create-category-error')) {
        toast.error('Category name is required!', { toastId: 'create-category-error' });
      }
      return;
    }
    setLoading(true);
    try {
      await createCategory({
        categoryName: categoryName.trim(),
        categoryDescription: categoryDescription.trim(),
      });
      toast.success('Category created successfully!');
      setCategoryName('');
      setCategoryDescription('');
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      onCreated && onCreated();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (!toast.isActive('create-category-error')) {
        toast.error(err?.message || 'Failed to create category!', {
          toastId: 'create-category-error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose} modal={true}>
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Category Name</label>
            <input
              className="border px-3 py-2 rounded w-full"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              disabled={loading}
              placeholder="Enter category name"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Category Description</label>
            <textarea
              className="border px-3 py-2 rounded w-full"
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
              disabled={loading}
              placeholder="Enter description"
              rows={3}
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
              className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
              onClick={handleCreate}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Creating...
                </div>
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

export default CreateCategoryModal;

import { useState, ChangeEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { editCategory } from '@/services/Admin/event.service';
import type { Category } from '@/types/event';
import { FaSpinner } from 'react-icons/fa';

interface Props {
  category: Category;
  onClose: () => void;
  onUpdated?: (updatedCategory: Category) => void;
}

export const EditCategoryModal = ({ category, onClose, onUpdated }: Props) => {
  const [form, setForm] = useState<Category>({ ...category });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = async () => {
    setLoading(true);
    try {
      await editCategory({
        categoryId: form.categoryId,
        categoryName: form.categoryName,
        categoryDescription: form.categoryDescription,
      });
      if (onUpdated) onUpdated(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!category} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Category Name</label>
            <input
              name="categoryName"
              className="border rounded px-2 py-1 w-full"
              value={form.categoryName}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea
              name="categoryDescription"
              className="border rounded px-2 py-1 w-full"
              value={form.categoryDescription}
              onChange={handleInputChange}
              rows={3}
            />
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
              onClick={handleEdit}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Editing...
                </div>
              ) : (
                'Edit'
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;

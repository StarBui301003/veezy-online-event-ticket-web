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
        <div className="border-b-2 border-gray-400 pb-4 p-4">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 p-4">
          <div>
            <label className="block text-sm font-medium">Category Name</label>
            <input
              name="categoryName"
              className="border rounded px-2 py-1 w-full"
              value={form.categoryName}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              name="categoryDescription"
              className="border rounded px-2 py-1 w-full"
              value={form.categoryDescription}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
        </div>
        <div className="p-4 border-t-2 border-gray-400">
          <DialogFooter>
            <button
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 mr-2"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              onClick={handleEdit}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Edit'}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;

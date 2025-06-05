import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Category } from '@/types/Admin/category';

interface Props {
  cate: Category;
  onClose: () => void;
}

export const CategoryDetailModal = ({ cate, onClose }: Props) => {
  return (
    <Dialog open={!!cate} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="border-b-2 border-gray-400 pb-4 p-4">
          <DialogHeader>
            <DialogTitle>Category Details</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
          <div>
            <b>Category Name:</b> <span className="text-gray-800">{cate.categoryName}</span>
          </div>
          <div>
            <b>Description:</b>{' '}
            <p className="text-gray-800 whitespace-pre-line break-words">
              {cate.categoryDescription || <span className="text-gray-400">No description</span>}
            </p>
          </div>
        </div>
        <div className="p-4 border-t-2 border-gray-400">
          <DialogFooter>
            <button
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              onClick={onClose}
            >
              Close
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDetailModal;

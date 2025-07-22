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

import { useTranslation } from 'react-i18next';

export const CategoryDetailModal = ({ cate, onClose }: Props) => {
  const { t } = useTranslation();
  return (
    <Dialog open={!!cate} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>{t('categoryDetails')}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-4 pt-0">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">{t('categoryName')}</label>
            <input
              className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              value={cate.categoryName}
              readOnly
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">{t('description')}</label>
            <textarea
              className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              value={cate.categoryDescription || t('noDescription')}
              readOnly
            />
          </div>
        </div>
        <div className="p-4">
          <DialogFooter>
            <button
              className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
              onClick={onClose}
              type="button"
            >
              {t('close')}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDetailModal;

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      <DialogContent className="max-w-md bg-white dark:bg-gray-800 p-0 shadow-lg rounded-xl border-0 dark:border-0">
        <div className="p-6 border-b border-gray-200 dark:border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {t('categoryDetails')}
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t('categoryName')}
            </label>
            <input
              className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              value={cate.categoryName}
              readOnly
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t('description')}
            </label>
            <textarea
              className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full resize-none min-h-[100px]"
              value={cate.categoryDescription || t('noDescription')}
              readOnly
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-0 flex justify-end gap-3">
          <button
            className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
            onClick={onClose}
            type="button"
          >
            {t('close')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDetailModal;

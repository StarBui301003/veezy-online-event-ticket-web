import { useState } from 'react';
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
import { validateEditCategoryForm } from '@/utils/validation';
import { useAdminValidation, createFieldChangeHandler } from '@/hooks/use-admin-validation';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

interface Props {
  category: Category;
  onClose: () => void;
  onUpdated?: (updatedCategory: Category) => void;
}

interface EditCategoryFormData {
  categoryName: string;
  categoryDescription: string;
}

export const EditCategoryModal = ({ category, onClose, onUpdated }: Props) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<EditCategoryFormData>({
    categoryName: category.categoryName,
    categoryDescription: category.categoryDescription,
  });
  const [loading, setLoading] = useState(false);

  // Use validation hook
  const { validateForm, handleApiError, getFieldError, getErrorClass, clearFieldError } =
    useAdminValidation({
      showToastOnValidation: false, // Only show inline errors, no toast for validation
      showToastOnApiError: true, // Keep toast for API errors
    });

  // Field change handlers with error clearing
  const handleCategoryNameChange = createFieldChangeHandler(
    'categoryName',
    (value: string) => {
      setForm((prev) => ({ ...prev, categoryName: value }));
    },
    clearFieldError
  );

  const handleDescriptionChange = createFieldChangeHandler(
    'categoryDescription',
    (value: string) => {
      setForm((prev) => ({ ...prev, categoryDescription: value }));
    },
    clearFieldError
  );

  const handleEdit = async () => {
    // Validate form using comprehensive validation
    const isValid = validateForm(form, validateEditCategoryForm);

    if (!isValid) {
      return;
    }

    setLoading(true);
    try {
      await editCategory({
        categoryId: category.categoryId,
        categoryName: form.categoryName,
        categoryDescription: form.categoryDescription,
      });
      toast.success(t('categoryUpdatedSuccessfully'));
      if (onUpdated) {
        onUpdated({
          ...category,
          categoryName: form.categoryName,
          categoryDescription: form.categoryDescription,
        });
      }
      onClose();
    } catch (error: unknown) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!category} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>{t('editCategory')}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('categoryName')}</label>
            <input
              className={getErrorClass('categoryName', 'border rounded px-2 py-1 w-full')}
              value={form.categoryName}
              onChange={handleCategoryNameChange}
              disabled={loading}
              placeholder={t('enterCategoryName')}
            />
            {getFieldError('categoryName') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('categoryName')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('description')}</label>
            <textarea
              className={getErrorClass('categoryDescription', 'border rounded px-2 py-1 w-full')}
              value={form.categoryDescription}
              onChange={(e) => handleDescriptionChange(e)}
              disabled={loading}
              rows={3}
              placeholder={t('enterCategoryDescription')}
            />
            {getFieldError('categoryDescription') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('categoryDescription')}
              </div>
            )}
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
              {t('cancel')}
            </button>
            <button
              className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2] flex items-center justify-center gap-2"
              onClick={handleEdit}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  {t('updating')}
                </>
              ) : (
                t('update')
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;

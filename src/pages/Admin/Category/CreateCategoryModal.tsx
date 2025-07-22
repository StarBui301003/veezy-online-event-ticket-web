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
import { validateCategoryForm } from '@/utils/validation';
import { useAdminValidation, createFieldChangeHandler } from '@/hooks/use-admin-validation';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

interface CategoryFormData {
  categoryName: string;
  description: string;
}

export const CreateCategoryModal = ({ open, onClose, onCreated }: Props) => {
  const [form, setForm] = useState<CategoryFormData>({
    categoryName: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

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
    'description',
    (value: string) => {
      setForm((prev) => ({ ...prev, description: value }));
    },
    clearFieldError
  );

  const handleCreate = async () => {
    // Validate form using comprehensive validation
    const isValid = validateForm(form, validateCategoryForm);

    if (!isValid) {
      return;
    }

    setLoading(true);
    try {
      await createCategory({
        categoryName: form.categoryName.trim(),
        categoryDescription: form.description.trim(),
      });
      toast.success(t('categoryCreatedSuccessfully'));
      setForm({
        categoryName: '',
        description: '',
      });
      onClose();
      if (onCreated) onCreated();
    } catch (error: unknown) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose} modal={true}>
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>{t('createCategory')}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('categoryName')}</label>
            <input
              className={getErrorClass('categoryName', 'border px-3 py-2 rounded w-full')}
              value={form.categoryName}
              onChange={handleCategoryNameChange}
              disabled={loading}
              placeholder={t('enterCategoryName')}
            />
            {getFieldError('categoryName') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('categoryName')}</div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('categoryDescription')} <span className="text-gray-400">- {t('optional')}</span></label>
            <textarea
              className={getErrorClass('description', 'border px-3 py-2 rounded w-full')}
              value={form.description}
              onChange={handleDescriptionChange}
              disabled={loading}
              placeholder={t('enterCategoryDescription')}
              rows={3}
            />
            {getFieldError('description') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('description')}</div>
            )}
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
              {t('cancel')}
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
                  {t('creating')}
                </div>
              ) : (
                t('create')
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCategoryModal;

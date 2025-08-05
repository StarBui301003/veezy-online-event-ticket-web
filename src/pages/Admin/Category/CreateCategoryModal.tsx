import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      <DialogContent className="max-w-md bg-white dark:bg-gray-800 p-0 shadow-lg rounded-xl border-0 dark:border-0">
        <div className="p-6 border-b border-gray-200 dark:border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {t('createCategory')}
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t('categoryName')}
            </label>
            <input
              className={`${getErrorClass(
                'categoryName',
                'border px-3 py-2 rounded w-full'
              )} text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border-gray-200 dark:border-gray-600`}
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t('categoryDescription')}{' '}
              <span className="text-gray-400 dark:text-gray-500">- {t('optional')}</span>
            </label>
            <textarea
              className={`${getErrorClass(
                'description',
                'border px-3 py-2 rounded w-full'
              )} text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border-gray-200 dark:border-gray-600 resize-none`}
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
        <div className="p-6 border-t border-gray-200 dark:border-0 flex justify-end gap-3">
          <button
            className="border-2 border-gray-400 bg-gray-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-gray-700 hover:border-gray-400"
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            {t('cancel')}
          </button>
          <button
            className="border-2 border-blue-500 bg-blue-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-blue-500 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleCreate}
            disabled={loading}
            type="button"
          >
            {loading ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                {t('creating')}
              </>
            ) : (
              t('create')
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCategoryModal;

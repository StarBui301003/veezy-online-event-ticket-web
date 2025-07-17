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
import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  parseBackendErrors,
  getFieldError,
  hasFieldError,
  getAllFieldErrors,
  type FieldErrors,
} from '@/utils/validation';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateCategoryModal = ({ open, onClose, onCreated }: Props) => {
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);

  const handleCreate = async () => {
    // Clear previous errors
    setFieldErrors({});
    setGeneralErrors([]);

    // Frontend validation
    const frontendErrors: string[] = [];

    const nameValidation = validateRequired(categoryName, 'Category name');
    if (!nameValidation.isValid) {
      frontendErrors.push(nameValidation.errorMessage!);
    }

    const nameMinValidation = validateMinLength(categoryName, 2, 'Category name');
    if (!nameMinValidation.isValid) {
      frontendErrors.push(nameMinValidation.errorMessage!);
    }

    const nameMaxValidation = validateMaxLength(categoryName, 100, 'Category name');
    if (!nameMaxValidation.isValid) {
      frontendErrors.push(nameMaxValidation.errorMessage!);
    }

    if (categoryDescription.trim()) {
      const descMaxValidation = validateMaxLength(categoryDescription, 500, 'Category description');
      if (!descMaxValidation.isValid) {
        frontendErrors.push(descMaxValidation.errorMessage!);
      }
    }

    if (frontendErrors.length > 0) {
      setGeneralErrors(frontendErrors);
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
    } catch (error: unknown) {
      // Parse backend errors
      const { fieldErrors: backendFieldErrors, generalErrors: backendGeneralErrors } =
        parseBackendErrors(error);

      // Set errors to display inline
      setFieldErrors(backendFieldErrors);
      setGeneralErrors(backendGeneralErrors);

      // Also show toast for critical errors
      if (backendGeneralErrors.length > 0) {
        toast.error(backendGeneralErrors[0]);
      } else if (getAllFieldErrors(backendFieldErrors).length > 0) {
        toast.error('Please check your input fields');
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
          {/* General Errors */}
          {generalErrors.length > 0 && (
            <div className="mb-4">
              {generalErrors.map((error, index) => (
                <div key={index} className="text-red-500 text-sm mb-2">
                  {error}
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Category Name</label>
            <input
              className={`border px-3 py-2 rounded w-full ${
                hasFieldError(fieldErrors, 'categoryname') ? 'border-red-500' : ''
              }`}
              value={categoryName}
              onChange={(e) => {
                setCategoryName(e.target.value);
                // Clear field error when user starts typing
                if (hasFieldError(fieldErrors, 'categoryname')) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.categoryname;
                    return newErrors;
                  });
                }
              }}
              disabled={loading}
              placeholder="Enter category name"
            />
            {getFieldError(fieldErrors, 'categoryname') && (
              <div className="text-red-500 text-sm mt-1">
                {getFieldError(fieldErrors, 'categoryname')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Category Description</label>
            <textarea
              className={`border px-3 py-2 rounded w-full ${
                hasFieldError(fieldErrors, 'categorydescription') ? 'border-red-500' : ''
              }`}
              value={categoryDescription}
              onChange={(e) => {
                setCategoryDescription(e.target.value);
                // Clear field error when user starts typing
                if (hasFieldError(fieldErrors, 'categorydescription')) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.categorydescription;
                    return newErrors;
                  });
                }
              }}
              disabled={loading}
              placeholder="Enter description"
              rows={3}
            />
            {getFieldError(fieldErrors, 'categorydescription') && (
              <div className="text-red-500 text-sm mt-1">
                {getFieldError(fieldErrors, 'categorydescription')}
              </div>
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

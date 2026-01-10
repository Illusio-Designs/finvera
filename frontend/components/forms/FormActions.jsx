import Button from '../ui/Button';
import { FiX, FiSave, FiCheck } from 'react-icons/fi';

/**
 * FormActions - Standardized form action buttons (Cancel + Submit)
 * Always displays buttons on the right side with Cancel first, then Submit
 * 
 * @param {Object} props
 * @param {Function} props.onCancel - Cancel button click handler
 * @param {Function} props.onSubmit - Submit button click handler (optional if form handles it)
 * @param {boolean} props.loading - Loading state for submit button
 * @param {boolean} props.disabled - Disabled state for both buttons
 * @param {string} props.submitText - Text for submit button (default: "Save")
 * @param {string} props.cancelText - Text for cancel button (default: "Cancel")
 * @param {string} props.submitIcon - Icon component for submit button (default: FiSave)
 * @param {string} props.className - Additional classes for container
 * @param {boolean} props.showBorder - Show top border (default: true)
 */
export default function FormActions({
  onCancel,
  onSubmit,
  loading = false,
  disabled = false,
  submitText = 'Save',
  cancelText = 'Cancel',
  submitIcon: SubmitIcon = FiSave,
  className = '',
  showBorder = true,
}) {
  return (
    <div className={`flex gap-3 justify-end ${showBorder ? 'pt-4 border-t border-gray-200' : ''} ${className}`}>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={disabled || loading}
        className="flex items-center gap-2"
      >
        <FiX className="h-4 w-4" />
        <span>{cancelText}</span>
      </Button>
      <Button
        type={onSubmit ? 'button' : 'submit'}
        onClick={onSubmit}
        loading={loading}
        disabled={disabled || loading}
        className="flex items-center gap-2"
      >
        <SubmitIcon className="h-4 w-4" />
        <span>{submitText}</span>
      </Button>
    </div>
  );
}

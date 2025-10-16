import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Dialog from './Dialog';

/**
 * Confirmation Dialog for delete actions
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when dialog closes
 * @param {Function} props.onConfirm - Function to call when user confirms
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Confirmation message
 * @param {string} props.itemName - Name of the item being deleted (optional)
 * @param {string} props.confirmText - Text for confirm button
 * @param {string} props.cancelText - Text for cancel button
 * @param {string} props.type - Type of confirmation ('delete', 'warning', 'info')
 */
const ConfirmationDialog = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  itemName = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'delete'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <Trash2 className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-blue-600" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'delete':
        return 'btn-danger';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      default:
        return 'btn-primary';
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={null}
      size="sm"
    >
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {message}
          {itemName && (
            <span className="font-medium text-gray-900 dark:text-gray-100">
              "{itemName}"?
            </span>
          )}
        </p>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          This action cannot be undone.
        </p>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`btn flex-1 ${getConfirmButtonClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default ConfirmationDialog; 
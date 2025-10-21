import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          titleColor: 'text-gray-900'
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          titleColor: 'text-gray-900'
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          titleColor: 'text-gray-900'
        };
      default:
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          titleColor: 'text-gray-900'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-8">
          {/* Close button */}
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-full bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 p-2 hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            {/* Icon */}
            <div className={`mx-auto flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg} sm:mx-0 sm:h-12 sm:w-12`}>
              {type === 'danger' ? (
                <Trash2 className={`h-8 w-8 sm:h-6 sm:w-6 ${styles.iconColor}`} />
              ) : (
                <AlertTriangle className={`h-8 w-8 sm:h-6 sm:w-6 ${styles.iconColor}`} />
              )}
            </div>

            {/* Content */}
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
              <h3 className={`text-xl font-semibold leading-6 ${styles.titleColor} sm:text-lg`}>
                {title}
              </h3>
              <div className="mt-3">
                <p className="text-gray-600 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 sm:mt-6 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm ${styles.confirmBg} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Deleting...</span>
                </div>
              ) : (
                confirmText
              )}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:mt-0 sm:w-auto transition-all duration-200"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
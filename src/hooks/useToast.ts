import { useState, useCallback } from 'react';

interface ToastState {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'upgrade';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: '',
    type: 'success',
  });

  const showToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'warning' | 'upgrade' = 'success',
    action?: { label: string; onClick: () => void }
  ) => {
    setToast({
      isOpen: true,
      message,
      type,
      action,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const success = useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  const error = useCallback((message: string) => {
    showToast(message, 'error');
  }, [showToast]);

  const warning = useCallback((message: string) => {
    showToast(message, 'warning');
  }, [showToast]);

  // Show upgrade required toast with optional action
  const upgrade = useCallback((message: string, onUpgrade?: () => void) => {
    showToast(message, 'upgrade', onUpgrade ? {
      label: 'Upgrade Now',
      onClick: onUpgrade,
    } : undefined);
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    success,
    error,
    warning,
    upgrade,
  };
}

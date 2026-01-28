import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X, Crown, Lock } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'upgrade';
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Toast({ message, type, isOpen, onClose, duration = 5000, action }: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <XCircle className="w-5 h-5 text-red-500" />,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    },
    upgrade: {
      bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <Lock className="w-5 h-5 text-blue-500" />,
    },
  };

  const style = styles[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div
        className={`${style.bg} ${style.border} ${style.text} border rounded-xl shadow-lg p-4 min-w-[320px] max-w-md`}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">{style.icon}</div>
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
            {action && (
              <button
                onClick={action.onClick}
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Crown className="w-4 h-4" />
                {action.label}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Upgrade-specific toast for feature limits
export function UpgradeToast({
  message,
  isOpen,
  onClose,
  onUpgrade,
  duration = 7000
}: {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-lg p-4 min-w-[340px] max-w-md">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Upgrade Required</p>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
            {onUpgrade && (
              <button
                onClick={() => {
                  onUpgrade();
                  onClose();
                }}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                <Crown className="w-4 h-4" />
                Upgrade Now
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

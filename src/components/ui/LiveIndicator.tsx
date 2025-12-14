interface LiveIndicatorProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'success' | 'danger' | 'warning' | 'brand';
}

const sizeStyles = {
  sm: { dot: 'w-1.5 h-1.5', ring: 'w-3 h-3', text: 'text-xs' },
  md: { dot: 'w-2 h-2', ring: 'w-4 h-4', text: 'text-sm' },
  lg: { dot: 'w-2.5 h-2.5', ring: 'w-5 h-5', text: 'text-base' },
};

const variantStyles = {
  success: 'bg-success-500',
  danger: 'bg-danger-500',
  warning: 'bg-warning-500',
  brand: 'bg-brand-500',
};

export function LiveIndicator({
  label = 'Live',
  size = 'md',
  variant = 'success',
}: LiveIndicatorProps) {
  const styles = sizeStyles[size];
  const color = variantStyles[variant];

  return (
    <div className="inline-flex items-center gap-2">
      <span className="relative flex">
        {/* Ping animation ring */}
        <span
          className={`
            absolute inline-flex rounded-full opacity-75
            ${styles.ring} ${color}
            animate-ping
          `}
          style={{ animationDuration: '1.5s' }}
        />
        {/* Solid dot */}
        <span
          className={`
            relative inline-flex rounded-full
            ${styles.dot} ${color}
          `}
        />
      </span>
      {label && (
        <span className={`font-medium text-surface-700 ${styles.text}`}>
          {label}
        </span>
      )}
    </div>
  );
}

// Compact version for tight spaces
export function LiveDot({ variant = 'success' }: { variant?: 'success' | 'danger' | 'warning' | 'brand' }) {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className={`
          animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
          ${variantStyles[variant]}
        `}
      />
      <span
        className={`
          relative inline-flex rounded-full h-2 w-2
          ${variantStyles[variant]}
        `}
      />
    </span>
  );
}

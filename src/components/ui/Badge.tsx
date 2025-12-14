import { HTMLAttributes, ReactNode } from 'react';

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-100 text-surface-700 border-surface-200/50',
  brand: 'bg-brand-50 text-brand-700 border-brand-200/50',
  success: 'bg-success-50 text-success-600 border-success-500/20',
  warning: 'bg-warning-50 text-warning-600 border-warning-500/20',
  danger: 'bg-danger-50 text-danger-600 border-danger-500/20',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-surface-500',
  brand: 'bg-brand-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  children,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full border
        transition-colors duration-150
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// Status Badge with pulse animation
interface StatusBadgeProps extends Omit<BadgeProps, 'dot'> {
  pulse?: boolean;
}

export function StatusBadge({
  pulse = false,
  variant = 'success',
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <Badge variant={variant} {...props}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`
              animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
              ${dotColors[variant]}
            `}
          />
        )}
        <span
          className={`
            relative inline-flex rounded-full h-2 w-2
            ${dotColors[variant]}
          `}
        />
      </span>
      {children}
    </Badge>
  );
}

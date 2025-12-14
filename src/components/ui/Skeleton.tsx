import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const roundedStyles = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

export function Skeleton({
  width,
  height,
  rounded = 'md',
  className = '',
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`
        bg-gradient-to-r from-surface-100 via-surface-200 to-surface-100
        bg-[length:200%_100%] animate-shimmer
        ${roundedStyles[rounded]}
        ${className}
      `}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  );
}

// Card Skeleton
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`
        bg-white rounded-2xl border border-surface-200/60 p-5
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton width={100} height={16} />
          <Skeleton width={140} height={28} />
          <Skeleton width={80} height={12} />
        </div>
        <Skeleton width={48} height={48} rounded="xl" />
      </div>
    </div>
  );
}

// Stat Card Skeleton
export function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-surface-200/60 p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton width={80} height={14} />
          <Skeleton width={120} height={32} />
          <div className="flex items-center gap-2">
            <Skeleton width={50} height={20} rounded="full" />
            <Skeleton width={60} height={12} />
          </div>
        </div>
        <Skeleton width={48} height={48} rounded="xl" />
      </div>
    </div>
  );
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-surface-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton
            width={i === 0 ? 150 : i === columns - 1 ? 80 : 100}
            height={16}
          />
        </td>
      ))}
    </tr>
  );
}

// List Item Skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton width={40} height={40} rounded="full" />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} />
      </div>
      <Skeleton width={60} height={24} rounded="full" />
    </div>
  );
}

// Widget Skeleton
export function WidgetSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-surface-200/60 p-4">
      <div className="flex items-center gap-3">
        <Skeleton width={48} height={48} rounded="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" height={14} />
          <Skeleton width="50%" height={12} />
        </div>
      </div>
    </div>
  );
}

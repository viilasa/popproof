import { HTMLAttributes } from 'react';

interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: 'brand' | 'white' | 'surface';
}

const sizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const colorStyles = {
  brand: 'text-brand-600',
  white: 'text-white',
  surface: 'text-surface-400',
};

// Classic Spinner
export function Spinner({ size = 'md', color = 'brand', className = '' }: LoaderProps) {
  return (
    <svg
      className={`animate-spin ${sizeStyles[size]} ${colorStyles[color]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Loading Dots Animation
export function LoadingDots({ size = 'md', color = 'brand', className = '' }: LoaderProps) {
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const gap = size === 'sm' ? 'gap-1' : 'gap-1.5';

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`
            ${dotSize} rounded-full ${colorStyles[color].replace('text-', 'bg-')}
            animate-bounce
          `}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
}

// Pulse Loader
export function PulseLoader({ size = 'md', color = 'brand', className = '' }: LoaderProps) {
  const pulseSize = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16';
  const innerSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8';

  return (
    <div className={`relative ${pulseSize} ${className}`}>
      <div
        className={`
          absolute inset-0 rounded-full opacity-25
          ${colorStyles[color].replace('text-', 'bg-')}
          animate-ping
        `}
      />
      <div
        className={`
          absolute inset-0 m-auto ${innerSize} rounded-full
          ${colorStyles[color].replace('text-', 'bg-')}
        `}
      />
    </div>
  );
}

// Bar Loader
export function BarLoader({ color = 'brand', className = '' }: Omit<LoaderProps, 'size'>) {
  return (
    <div className={`w-full h-1 bg-surface-100 rounded-full overflow-hidden ${className}`}>
      <div
        className={`
          h-full w-1/3 rounded-full
          ${colorStyles[color].replace('text-', 'bg-')}
          animate-[barLoader_1s_ease-in-out_infinite]
        `}
        style={{
          animation: 'barLoader 1s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes barLoader {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}

// Full Page Loader
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-surface-200" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-brand-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium text-surface-600">{message}</p>
      </div>
    </div>
  );
}

// Skeleton Pulse (for inline loading states)
export function InlineLoader({ width = 60, height = 16 }: { width?: number; height?: number }) {
  return (
    <span
      className="inline-block bg-surface-200 rounded animate-pulse"
      style={{ width, height }}
    />
  );
}

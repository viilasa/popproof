import { HTMLAttributes, ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ 
  children, 
  hover = false, 
  padding = 'md',
  className = '', 
  ...props 
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-2xl border border-surface-200/60 shadow-soft
        transition-all duration-200
        ${hover ? 'hover:shadow-soft-md hover:border-surface-200 hover:-translate-y-0.5 cursor-pointer' : ''}
        ${paddingStyles[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

// Glass Card with blur effect
export function GlassCard({ 
  children, 
  className = '', 
  ...props 
}: CardProps) {
  return (
    <div
      className={`
        bg-white/70 backdrop-blur-xl rounded-2xl 
        border border-white/20 shadow-soft-lg
        transition-all duration-200
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  iconBg?: string;
  loading?: boolean;
}

export function StatCard({ 
  label, 
  value, 
  change, 
  changeLabel = 'vs last period',
  icon,
  iconBg = 'bg-brand-50',
  loading = false,
}: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const isNeutral = change === 0;

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 w-24 bg-surface-200 rounded" />
            <div className="h-8 w-32 bg-surface-200 rounded" />
            <div className="h-3 w-20 bg-surface-100 rounded" />
          </div>
          <div className="w-12 h-12 bg-surface-100 rounded-xl" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-surface-500">{label}</p>
          <p className="text-2xl font-bold text-surface-900 tracking-tight animate-count-up">
            {value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 pt-1">
              <span
                className={`
                  inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full
                  ${isPositive ? 'text-success-600 bg-success-50' : ''}
                  ${isNegative ? 'text-danger-600 bg-danger-50' : ''}
                  ${isNeutral ? 'text-surface-500 bg-surface-100' : ''}
                `}
              >
                {isPositive && <TrendingUp className="w-3 h-3" />}
                {isNegative && <TrendingDown className="w-3 h-3" />}
                {isNeutral && <Minus className="w-3 h-3" />}
                {isPositive && '+'}
                {Math.round(change)}%
              </span>
              <span className="text-xs text-surface-400">{changeLabel}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`
            p-3 rounded-xl ${iconBg}
            transition-transform duration-200
            group-hover:scale-110
          `}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

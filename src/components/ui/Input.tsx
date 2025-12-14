import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { Search } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3.5 text-base rounded-2xl',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      inputSize = 'md',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-surface-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full bg-white border rounded-xl
              placeholder:text-surface-400
              transition-all duration-200 ease-out
              hover:border-surface-300
              focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none
              disabled:bg-surface-50 disabled:cursor-not-allowed disabled:text-surface-400
              ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : 'border-surface-200'}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${sizeStyles[inputSize]}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-danger-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-sm text-surface-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Search Input Component
interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, className = '', ...props }, ref) => {
    return (
      <Input
        ref={ref}
        leftIcon={<Search className="w-4 h-4" />}
        placeholder="Search..."
        className={`${className}`}
        onChange={(e) => onSearch?.(e.target.value)}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

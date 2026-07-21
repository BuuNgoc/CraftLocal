import React from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

const Input: React.FC<InputProps> = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="flex flex-col w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative w-full">
          {icon && (
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`h-11 w-full rounded-xl border border-[#E5E7EB] bg-white text-gray-900 placeholder:text-gray-455 text-xs sm:text-sm font-semibold outline-none transition-all focus:border-[#A65A3A] focus:ring-4 focus:ring-[#A65A3A]/10 hover:border-gray-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed ${icon ? 'pl-[42px] pr-4' : 'px-3.5'} ${rightIcon ? 'pr-[42px]' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;

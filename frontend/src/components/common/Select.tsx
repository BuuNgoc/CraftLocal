import React from 'react';
import { AlertCircle } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  icon?: React.ReactNode;
}

const Select: React.FC<SelectProps> = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, icon, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="flex flex-col w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative w-full">
          {icon && (
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            className={`h-11 w-full rounded-xl border border-[#E5E7EB] bg-white text-gray-900 text-xs sm:text-sm font-semibold outline-none transition-all focus:border-[#A65A3A] focus:ring-4 focus:ring-[#A65A3A]/10 hover:border-gray-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed appearance-none ${icon ? 'pl-[42px] pr-10' : 'px-3.5 pr-10'} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''} ${className}`}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom chevron */}
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
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

Select.displayName = 'Select';
export default Select;

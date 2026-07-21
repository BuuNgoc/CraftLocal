import React from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

const Checkbox: React.FC<CheckboxProps> = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="flex flex-col">
        <label htmlFor={checkboxId} className="inline-flex items-center cursor-pointer group">
          <input
            type="checkbox"
            ref={ref}
            id={checkboxId}
            className={`w-4 h-4 rounded border-gray-300 text-[#A65A3A] focus:ring-[#A65A3A]/20 transition-all ${className}`}
            {...props}
          />
          {label && (
            <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-900 selection:bg-transparent">
              {label}
            </span>
          )}
        </label>
        {error && (
          <p className="mt-1 text-[11px] font-semibold text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
export default Checkbox;

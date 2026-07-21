import React from 'react';

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

const Radio: React.FC<RadioProps> = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const radioId = id || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="flex flex-col">
        <label htmlFor={radioId} className="inline-flex items-center cursor-pointer group">
          <input
            type="radio"
            ref={ref}
            id={radioId}
            className={`w-4 h-4 border-gray-300 text-[#A65A3A] focus:ring-[#A65A3A]/20 transition-all ${className}`}
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

Radio.displayName = 'Radio';
export default Radio;

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea: React.FC<TextareaProps> = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="flex flex-col w-full">
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full rounded-xl border border-[#E5E7EB] bg-white p-3.5 text-gray-900 placeholder:text-gray-455 text-xs sm:text-sm font-semibold outline-none transition-all focus:border-[#A65A3A] focus:ring-4 focus:ring-[#A65A3A]/10 hover:border-gray-300 resize-y min-h-[100px] disabled:bg-gray-50 disabled:text-gray-500 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''} ${className}`}
          {...props}
        />
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

Textarea.displayName = 'Textarea';
export default Textarea;

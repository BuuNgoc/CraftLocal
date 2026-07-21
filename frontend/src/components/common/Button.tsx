import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: 'bg-[#A65A3A] text-white hover:bg-[#904C2F] border border-[#A65A3A] shadow-xs focus:ring-[#A65A3A]/30',
    secondary: 'bg-[#0F172A] text-white hover:bg-[#1E293B] border border-[#0F172A] shadow-xs focus:ring-[#0F172A]/30',
    outline: 'border border-[#E5E7EB] bg-white text-[#374151] hover:bg-gray-50 hover:text-[#111827] shadow-2xs focus:ring-[#0F172A]/10',
    ghost: 'text-[#374151] hover:bg-gray-100 hover:text-[#111827] focus:ring-gray-100',
    danger: 'bg-[#DC2626] text-white hover:bg-red-700 border border-[#DC2626] shadow-xs focus:ring-red-200',
  };

  const sizes = {
    sm: 'h-9 px-4 text-xs font-bold tracking-wide gap-1.5',
    md: 'h-11 px-5 text-sm font-bold tracking-tight gap-2',
    lg: 'h-[48px] px-6 text-sm sm:text-base font-extrabold tracking-tight gap-2',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Đang xử lý...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;

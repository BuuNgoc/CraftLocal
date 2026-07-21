import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-full';
  
  const variants = {
    primary: 'bg-[#A65A3A]/10 text-[#A65A3A] border border-[#A65A3A]/20',
    secondary: 'bg-slate-900/10 text-slate-900 border border-slate-900/20',
    success: 'bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20',
    warning: 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20',
    danger: 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20',
    info: 'bg-blue-50 text-blue-700 border border-blue-150',
    neutral: 'bg-gray-100 text-gray-600 border border-gray-200',
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-[9px] sm:text-[10px] uppercase tracking-wider',
    md: 'px-3 py-1 text-[11px] sm:text-xs uppercase tracking-wider',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;

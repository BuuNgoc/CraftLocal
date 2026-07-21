import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-[#E5E7EB] pb-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0F172A]">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-gray-500 font-semibold mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2.5 shrink-0">{action}</div>}
    </div>
  );
};

export default PageHeader;

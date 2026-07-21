import React from 'react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, className = '' }) => {
  return (
    <div className={`mb-6 ${className}`}>
      <h2 className="text-2xl font-bold font-headline-md text-[#2F2722]">{title}</h2>
      {subtitle && <p className="text-sm text-[#7A6A5E] mt-1">{subtitle}</p>}
    </div>
  );
};

export default SectionTitle;

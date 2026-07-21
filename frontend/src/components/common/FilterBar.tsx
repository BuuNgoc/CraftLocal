import React from 'react';

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex flex-wrap items-center gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl ${className}`}>
      {children}
    </div>
  );
};

export default FilterBar;

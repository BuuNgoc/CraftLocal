import React from 'react';

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon, className = '' }) => {
  return (
    <div className={`flex justify-between items-start gap-4 py-2.5 text-xs sm:text-sm ${className}`}>
      <div className="flex items-center gap-1.5 text-gray-500 font-semibold select-none">
        {icon && <span className="text-[#A65A3A] shrink-0">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="text-gray-900 font-bold text-right break-words max-w-[60%]">
        {value}
      </div>
    </div>
  );
};

export default InfoRow;

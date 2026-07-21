import React from 'react';
import Card from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number | string;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  description,
  className = '',
}) => {
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs font-bold text-[#7A6A5E] uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl md:text-3xl font-bold text-[#2F2722] tracking-tight">{value}</h3>
          
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <span
                className={`text-xs font-bold ${
                  trend.isPositive ? 'text-[#2F855A]' : 'text-[#DC2626]'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-[10px] text-[#7A6A5E] font-medium">so với tháng trước</span>
            </div>
          )}
          
          {description && (
            <p className="text-[11px] text-[#7A6A5E] font-semibold pt-0.5">{description}</p>
          )}
        </div>
        {icon && (
          <div className="p-2.5 bg-[#FAF7F2] border border-[#E6DED5]/80 rounded-xl text-[#A65A3A]">
            {icon}
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FAF7F2]" />
    </Card>
  );
};

export default StatCard;

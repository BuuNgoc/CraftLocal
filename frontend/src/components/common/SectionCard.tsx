import React from 'react';
import Card from './Card';

interface SectionCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  icon,
  action,
  children,
  className = '',
}) => {
  return (
    <Card className={`overflow-hidden shadow-2xs ${className}`}>
      {(title || description || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB] mb-4.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {icon && <div className="text-[#A65A3A] shrink-0">{icon}</div>}
              {title && <h3 className="font-extrabold text-[#0F172A] text-sm sm:text-base tracking-tight">{title}</h3>}
            </div>
            {description && (
              <p className="text-xs text-gray-500 font-semibold">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="w-full">{children}</div>
    </Card>
  );
};

export default SectionCard;

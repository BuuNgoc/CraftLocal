import React from 'react';

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex border-b border-gray-200 overflow-x-auto scrollbar-none ${className}`}>
      <div className="flex gap-6 min-w-max">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`pb-3 text-xs sm:text-sm font-extrabold tracking-tight relative transition-colors ${
                isActive ? 'text-[#A65A3A]' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
                    isActive ? 'bg-[#A65A3A]/10 text-[#A65A3A]' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#A65A3A] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;

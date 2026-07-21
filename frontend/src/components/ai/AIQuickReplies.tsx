import React from 'react';

interface AIQuickRepliesProps {
  quickReplies: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

const AIQuickReplies: React.FC<AIQuickRepliesProps> = ({ quickReplies, onSelect, disabled }) => {
  if (!quickReplies || quickReplies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {quickReplies.map((text, i) => (
        <button
          key={`${text}-${i}`}
          onClick={() => onSelect(text)}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium rounded-full border border-[#E6DED5] bg-white text-[#A65A3A] hover:bg-[#A65A3A] hover:text-white hover:border-[#A65A3A] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {text}
        </button>
      ))}
    </div>
  );
};

export default AIQuickReplies;

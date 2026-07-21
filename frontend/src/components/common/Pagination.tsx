import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  limit?: number;
  onLimitChange?: (limit: number) => void;
}

const LIMIT_OPTIONS = [8, 12, 16, 24];

const Pagination: React.FC<PaginationProps> = ({
  page, totalPages, onPageChange, total, limit, onLimitChange,
}) => {
  if (totalPages <= 1 && !onLimitChange) return null;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 pb-4">
      {/* Info */}
      <div className="flex items-center gap-4 text-sm text-[#7A6A5E] font-medium">
        {total !== undefined && (
          <span>Tổng <strong className="text-[#2F2722]">{total}</strong> mục</span>
        )}
        <span>Trang <strong className="text-[#2F2722]">{page}</strong> / {totalPages}</span>
      </div>

      {/* Page buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#E6DED5] bg-white text-[#7A6A5E] hover:bg-[#FAF7F2] hover:border-[#A65A3A]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Trang trước"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-[#7A6A5E] text-sm font-medium">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                p === page
                  ? 'bg-[#A65A3A] text-white shadow-sm'
                  : 'border border-[#E6DED5] bg-white text-[#2F2722] hover:bg-[#FAF7F2] hover:border-[#A65A3A]/30'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#E6DED5] bg-white text-[#7A6A5E] hover:bg-[#FAF7F2] hover:border-[#A65A3A]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Trang sau"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Limit selector */}
      {onLimitChange && limit && (
        <div className="flex items-center gap-2 text-sm text-[#7A6A5E] font-medium">
          <span>Hiển thị</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2.5 py-1.5 border border-[#E6DED5] rounded-xl bg-white text-[#2F2722] font-bold focus:outline-none focus:ring-2 focus:ring-[#A65A3A]/20 focus:border-[#A65A3A]"
          >
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>/ trang</span>
        </div>
      )}
    </div>
  );
};

export default Pagination;

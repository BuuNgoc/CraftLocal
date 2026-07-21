import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Calendar, Users, Sparkles, Star, SlidersHorizontal, X, ChevronDown, Filter } from 'lucide-react';
import { LOCATIONS } from '../../utils/constants';

interface WorkshopFilterBarProps {
  localKeyword: string;
  setLocalKeyword: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  date: string;
  setDate: (val: string) => void;
  guests: string;
  setGuests: (val: string) => void;
  difficulty: string;
  setDifficulty: (val: string) => void;
  minRating: string;
  setMinRating: (val: string) => void;
  sort: string;
  setSort: (val: string) => void;
  onReset: () => void;
}

const WorkshopFilterBar: React.FC<WorkshopFilterBarProps> = ({
  localKeyword,
  setLocalKeyword,
  location,
  setLocation,
  date,
  setDate,
  guests,
  setGuests,
  difficulty,
  setDifficulty,
  minRating,
  setMinRating,
  sort,
  setSort,
  onReset,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAdvanced(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = 
    localKeyword || 
    location || 
    date || 
    guests || 
    difficulty || 
    minRating || 
    sort !== '-averageRating';

  return (
    <div className="relative w-full mb-8 z-30" ref={dropdownRef}>
      {/* Main Filter Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl md:rounded-full p-2 shadow-xs flex flex-col md:flex-row md:items-center gap-2 md:h-16">
        
        {/* Search Input */}
        <div className="flex-1 flex items-center gap-2.5 px-3 h-11 md:h-full border-b md:border-b-0 md:border-r border-[#E5E7EB] focus-within:ring-2 focus-within:ring-[#A65A3A]/15 rounded-xl md:rounded-none transition-all">
          <Search size={16} className="text-[#6B7280]" />
          <input
            type="text"
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            placeholder="Tìm workshop..."
            className="w-full bg-transparent border-none text-sm font-semibold text-[#111827] placeholder:text-[#6B7280]/60 outline-none"
          />
          {localKeyword && (
            <button
              onClick={() => setLocalKeyword('')}
              className="text-[#6B7280] hover:text-[#111827] p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Location Select */}
        <div className="w-full md:w-[160px] flex items-center gap-2 px-3 h-11 md:h-full border-b md:border-b-0 md:border-r border-[#E5E7EB] hover:bg-[#FAF7F2]/40 rounded-xl md:rounded-none transition-colors cursor-pointer relative">
          <MapPin size={15} className="text-[#A65A3A] shrink-0" />
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-[#111827] outline-none cursor-pointer appearance-none pr-4"
          >
            <option value="">Khu vực</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <ChevronDown size={14} className="text-[#6B7280] absolute right-3 pointer-events-none" />
        </div>

        {/* Date Input */}
        <div className="w-full md:w-[155px] flex items-center gap-2 px-3 h-11 md:h-full border-b md:border-b-0 md:border-r border-[#E5E7EB] hover:bg-[#FAF7F2]/40 rounded-xl md:rounded-none transition-colors cursor-pointer relative">
          <Calendar size={15} className="text-[#A65A3A] shrink-0" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-[#111827] outline-none cursor-pointer"
          />
        </div>

        {/* Filter Toggle and Actions */}
        <div className="flex items-center justify-between md:justify-end gap-2 px-2 h-11 md:h-full">
          {/* Advanced Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`h-9 md:h-10 px-4 rounded-xl md:rounded-full border flex items-center gap-2 text-xs font-bold transition-all ${
              showAdvanced || guests || difficulty || minRating || sort !== '-averageRating'
                ? 'bg-[#A65A3A]/10 border-[#A65A3A] text-[#A65A3A]'
                : 'bg-white border-[#E5E7EB] text-[#111827] hover:bg-gray-50'
            }`}
          >
            <Filter size={14} />
            <span>Bộ lọc</span>
            {(guests || difficulty || minRating || sort !== '-averageRating') && (
              <span className="w-4 h-4 rounded-full bg-[#A65A3A] text-white text-[9px] flex items-center justify-center font-bold">
                !
              </span>
            )}
          </button>

          {/* Reset button inside main row */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="h-9 md:h-10 px-3.5 rounded-xl md:rounded-full text-xs font-bold text-red-600 hover:bg-red-50 border border-transparent transition-all"
              title="Đặt lại toàn bộ lọc"
            >
              Xóa lọc
            </button>
          )}
        </div>

      </div>

      {/* Advanced Filters Dropdown */}
      {showAdvanced && (
        <div className="absolute top-[102%] left-0 right-0 md:left-auto md:w-[480px] bg-white border border-[#E5E7EB] rounded-2xl shadow-lg p-5 mt-2 space-y-4 animate-[fadeIn_0.15s_ease-out]">
          <h4 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider border-b border-gray-100 pb-2">
            Bộ lọc nâng cao
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Guests Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1">
                <Users size={12} className="text-[#A65A3A]" /> Số khách
              </label>
              <div className="relative">
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl h-10 px-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#A65A3A] cursor-pointer appearance-none"
                >
                  <option value="">Tất cả</option>
                  <option value="1">1 khách</option>
                  <option value="2">2 khách</option>
                  <option value="3">3 khách</option>
                  <option value="4">4+ khách</option>
                </select>
                <ChevronDown size={12} className="text-[#6B7280] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Difficulty Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={12} className="text-[#A65A3A]" /> Độ khó
              </label>
              <div className="relative">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl h-10 px-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#A65A3A] cursor-pointer appearance-none"
                >
                  <option value="">Tất cả</option>
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
                <ChevronDown size={12} className="text-[#6B7280] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Min Rating Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1">
                <Star size={12} className="text-[#A65A3A]" /> Đánh giá tốt
              </label>
              <div className="relative">
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl h-10 px-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#A65A3A] cursor-pointer appearance-none"
                >
                  <option value="">Tất cả</option>
                  <option value="4">Từ 4.0 sao</option>
                  <option value="4.5">Từ 4.5 sao</option>
                </select>
                <ChevronDown size={12} className="text-[#6B7280] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Sort Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1">
                <SlidersHorizontal size={12} className="text-[#A65A3A]" /> Sắp xếp
              </label>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl h-10 px-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#A65A3A] cursor-pointer appearance-none"
                >
                  <option value="-averageRating">Đánh giá tốt nhất</option>
                  <option value="price">Giá từ thấp đến cao</option>
                  <option value="-price">Giá từ cao đến thấp</option>
                  <option value="-createdAt">Mới nhất</option>
                </select>
                <ChevronDown size={12} className="text-[#6B7280] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(false)}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-[#111827]"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2 text-xs font-bold text-red-650 hover:bg-red-50 rounded-xl"
            >
              Xóa tất cả
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkshopFilterBar;

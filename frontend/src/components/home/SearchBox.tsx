import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { LOCATIONS } from '../../utils/constants';

const SearchBox: React.FC = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('1');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location && location !== 'Bạn muốn đi đâu?') params.append('location', location);
    if (date) params.append('date', date);
    if (guests) params.append('guests', guests);
    navigate(`/workshops?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="w-full max-w-[920px] mx-auto bg-white/95 backdrop-blur-md rounded-2xl lg:rounded-full p-2 lg:p-3 shadow-[0_24px_80px_rgba(61,43,31,0.18)] border border-white/40 mt-8 lg:mt-10"
    >
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-0">
        
        {/* Destination Select */}
        <div className="flex-1 h-14 px-5 flex items-center gap-3 border-b lg:border-b-0 lg:border-r border-[#E6DED5]/60 hover:bg-[#FAF7F2]/40 lg:hover:bg-transparent rounded-xl lg:rounded-none transition-colors">
          <MapPin size={20} className="text-[#A65A3A] shrink-0" />
          <div className="flex-1 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A6A5E]">Địa điểm</p>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="text-sm font-semibold text-[#2F2722] bg-transparent outline-none w-full cursor-pointer"
            >
              <option value="">Bạn muốn đi đâu?</option>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Input */}
        <div className="flex-1 h-14 px-5 flex items-center gap-3 border-b lg:border-b-0 lg:border-r border-[#E6DED5]/60 hover:bg-[#FAF7F2]/40 lg:hover:bg-transparent rounded-xl lg:rounded-none transition-colors">
          <Calendar size={20} className="text-[#A65A3A] shrink-0" />
          <div className="flex-1 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A6A5E]">Ngày trải nghiệm</p>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm font-semibold text-[#2F2722] bg-transparent outline-none w-full cursor-pointer" 
            />
          </div>
        </div>

        {/* Guests Select */}
        <div className="flex-1 h-14 px-5 flex items-center gap-3 hover:bg-[#FAF7F2]/40 lg:hover:bg-transparent rounded-xl lg:rounded-none transition-colors mb-3 lg:mb-0">
          <Users size={20} className="text-[#A65A3A] shrink-0" />
          <div className="flex-1 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A6A5E]">Số khách</p>
            <select
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="text-sm font-semibold text-[#2F2722] bg-transparent outline-none w-full cursor-pointer"
            >
              <option value="1">1 khách</option>
              <option value="2">2 khách</option>
              <option value="3">3+ khách</option>
            </select>
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="h-12 lg:h-14 px-8 flex items-center justify-center gap-2 bg-[#A65A3A] hover:bg-[#8e492b] text-white rounded-xl lg:rounded-full font-bold transition-all shadow-md hover:shadow-lg w-full lg:w-auto shrink-0 active:scale-[0.98]"
        >
          <Search size={18} />
          <span>Tìm kiếm</span>
        </button>
        
      </div>
    </form>
  );
};

export default SearchBox;

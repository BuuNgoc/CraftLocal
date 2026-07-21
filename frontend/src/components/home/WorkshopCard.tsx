import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, MapPin } from 'lucide-react';
import type { Workshop } from '../../types/workshop.type';
import { formatCurrencyShort } from '../../utils/formatCurrency';
import ImageWithFallback from '../common/ImageWithFallback';

interface WorkshopCardProps {
  workshop: Workshop;
}

const WorkshopCard: React.FC<WorkshopCardProps> = ({ workshop }) => {
  const imgSrc = workshop.thumbnail || workshop.images?.[0] || '';

  return (
    <Link
      to={`/workshops/${workshop._id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-[#E5E0D8] hover:shadow-[0_20px_60px_rgba(61,43,31,0.12)] hover:-translate-y-1.5 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <ImageWithFallback
          src={imgSrc}
          fallbackSrc="/images/fallback-workshop.jpg"
          alt={workshop.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-[10px] font-bold text-[#964824] shadow-sm uppercase tracking-wide">
            {workshop.categoryId?.name || workshop.difficulty || 'Workshop'}
          </span>
        </div>
        {(workshop.averageRating ?? 0) >= 4.5 && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-full shadow-sm">⭐ Nổi bật</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-[15px] text-[#2F2722] mb-2 line-clamp-2 group-hover:text-[#964824] transition-colors leading-snug">
          {workshop.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-[#7A6A5E] mb-3">
          <span className="flex items-center gap-1"><MapPin size={12} className="text-[#964824]" /> {workshop.locationLabel}</span>
          <span className="flex items-center gap-1"><Clock size={12} className="text-[#964824]" /> {workshop.duration} phút</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-[#E5E0D8]/60">
          <span className="text-[#964824] font-bold text-base">{formatCurrencyShort(workshop.price)}</span>
          <div className="flex items-center gap-1 text-xs">
            <Star size={12} className="text-amber-500 fill-amber-500" />
            <span className="font-semibold text-[#2F2722]">{workshop.averageRating?.toFixed(1) || '0.0'}</span>
            <span className="text-[#7A6A5E]">({workshop.totalReviews || 0})</span>
          </div>
        </div>
        {workshop.hostName && (
          <p className="text-[11px] text-[#7A6A5E] mt-2.5">
            Tổ chức bởi <span className="font-medium text-[#964824]">{workshop.hostName}</span>
          </p>
        )}
      </div>
    </Link>
  );
};

export default WorkshopCard;

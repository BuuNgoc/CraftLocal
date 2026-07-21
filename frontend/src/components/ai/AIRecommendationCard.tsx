import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock } from 'lucide-react';
import type { AIRecommendation } from '../../types/ai.type';
import { aiApi } from '../../api/aiApi';

interface AIRecommendationCardProps {
  recommendation: AIRecommendation;
  resultMode?: string;
  index: number;
}

const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({ recommendation, resultMode, index }) => {
  const navigate = useNavigate();
  const ws = recommendation.workshop;
  if (!ws) return null;

  const handleClick = () => {
    const workshopId = ws._id || recommendation.workshopId;
    if (workshopId) {
      aiApi.track({ type: 'CLICK_WORKSHOP', workshopId }).catch(() => {});
      navigate(`/workshops/${workshopId}`);
    }
  };

  return (
    <div
      className="bg-white rounded-xl border border-[#E6DED5] overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={handleClick}
    >
      {ws.thumbnail && (
        <div className="relative h-28 overflow-hidden">
          <img
            src={ws.thumbnail || ws.images?.[0]}
            alt={ws.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {resultMode === 'CHEAPEST' && (
            <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Rẻ nhất #{index + 1}
            </span>
          )}
          {resultMode === 'BEST_RATED' && (
            <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Đánh giá cao #{index + 1}
            </span>
          )}
          {resultMode !== 'CHEAPEST' && resultMode !== 'BEST_RATED' && recommendation.matchScore && recommendation.matchScore > 0 && (
            <span className="absolute top-2 right-2 bg-white/90 backdrop-blur text-[#A65A3A] text-[10px] font-bold px-2 py-0.5 rounded-full">
              Phù hợp {recommendation.matchScore}%
            </span>
          )}
        </div>
      )}
      <div className="p-3">
        <h4 className="font-bold text-sm text-[#2F2722] line-clamp-1">{ws.title}</h4>
        <div className="flex items-center gap-2 text-[10px] text-[#7A6A5E] mt-1">
          {ws.locationLabel && (
            <span className="flex items-center gap-0.5"><MapPin size={10} /> {ws.locationLabel}</span>
          )}
          {ws.averageRating > 0 && (
            <span className="flex items-center gap-0.5"><Star size={10} className="text-amber-400" /> {ws.averageRating?.toFixed(1)}</span>
          )}
          {ws.duration > 0 && (
            <span className="flex items-center gap-0.5"><Clock size={10} /> {ws.duration}p</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[#A65A3A] font-bold text-sm">
            {(ws.price || recommendation.price)?.toLocaleString('vi-VN')}đ
          </span>
          <span className="text-[10px] text-[#A65A3A] font-semibold group-hover:underline">
            Xem chi tiết →
          </span>
        </div>
        {recommendation.reason && (
          <p className="text-[10px] text-[#7A6A5E] mt-1.5 line-clamp-2 italic">💡 {recommendation.reason}</p>
        )}
      </div>
    </div>
  );
};

export default AIRecommendationCard;

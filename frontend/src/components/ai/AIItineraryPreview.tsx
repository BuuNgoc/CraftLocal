import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import type { AIItinerary, AIItineraryItem } from '../../types/ai.type';

interface AIItineraryPreviewProps {
  itinerary: AIItinerary;
}

const TYPE_ICONS: Record<string, string> = {
  WORKSHOP: '🏺', FOOD: '🍜', MOVE: '🚶', SHOPPING: '🛍️', REST: '☕', NOTE: '📝',
};

const TYPE_COLORS: Record<string, string> = {
  WORKSHOP: 'border-l-amber-400 bg-amber-50/60',
  FOOD: 'border-l-green-400 bg-green-50/60',
  MOVE: 'border-l-blue-400 bg-blue-50/60',
  SHOPPING: 'border-l-purple-400 bg-purple-50/60',
  REST: 'border-l-gray-400 bg-gray-50/60',
  NOTE: 'border-l-gray-300 bg-gray-50/60',
};

function uniqueTimeline(timeline: AIItineraryItem[]): AIItineraryItem[] {
  const seen = new Set<string>();
  return (timeline || []).filter((item) => {
    const key = item.id || `${item.type}-${item.time}-${item.workshop?._id || item.workshopId || item.activity}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const AIItineraryPreview: React.FC<AIItineraryPreviewProps> = ({ itinerary }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  if (!itinerary) return null;

  const timeline = uniqueTimeline(itinerary.timeline || []);
  const displayItems = expanded ? timeline : timeline.slice(0, 3);
  const hasMore = timeline.length > 3;

  return (
    <div className="mt-2 bg-[#FAF7F2] rounded-xl border border-[#E6DED5] overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#E6DED5]/60">
        <h4 className="font-bold text-xs text-[#2F2722]">{itinerary.title || 'Lịch trình trải nghiệm'}</h4>
        {itinerary.summary && <p className="text-[10px] text-[#7A6A5E] mt-0.5 line-clamp-2">{itinerary.summary}</p>}
        {itinerary.estimatedBudget && itinerary.estimatedBudget > 0 && (
          <p className="text-[10px] text-[#A65A3A] font-semibold mt-0.5">
            💰 ~{itinerary.estimatedBudget.toLocaleString('vi-VN')}đ
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="px-3 py-2 space-y-1.5">
        {displayItems.map((item, idx) => (
          <div
            key={item.id || `${item.time}-${idx}`}
            className={`rounded-lg border-l-2 px-2.5 py-1.5 ${TYPE_COLORS[item.type] || 'border-l-gray-300 bg-white'}`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs">{TYPE_ICONS[item.type] || '📌'}</span>
              <span className="text-[10px] font-semibold text-[#7A6A5E]">{item.time}</span>
              <span className="text-[10px] text-[#2F2722] font-medium flex-1 truncate">{item.activity}</span>
            </div>
            {item.type === 'WORKSHOP' && item.workshop && (
              <div
                className="flex items-center gap-2 mt-1 cursor-pointer hover:bg-white/60 rounded-md p-1 -mx-1 transition"
                onClick={() => navigate(`/workshops/${item.workshop._id || item.workshopId}`)}
              >
                {item.workshop.thumbnail && (
                  <img src={item.workshop.thumbnail} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-[#2F2722] truncate">{item.workshop.title}</p>
                  <div className="flex items-center gap-1 text-[9px] text-[#7A6A5E]">
                    {item.workshop.locationLabel && <span className="flex items-center gap-0.5"><MapPin size={8} />{item.workshop.locationLabel}</span>}
                    {item.workshop.price > 0 && <span className="text-[#A65A3A] font-bold">{item.workshop.price?.toLocaleString('vi-VN')}đ</span>}
                  </div>
                </div>
              </div>
            )}
            {item.note && <p className="text-[9px] text-[#7A6A5E] mt-0.5">{item.note}</p>}
          </div>
        ))}
      </div>

      {/* Expand / CTA */}
      <div className="px-3 py-2 border-t border-[#E6DED5]/60 flex items-center gap-2">
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[10px] font-semibold text-[#A65A3A] hover:underline"
          >
            {expanded ? <><ChevronUp size={12} /> Thu gọn</> : <><ChevronDown size={12} /> Xem thêm {timeline.length - 3} hoạt động</>}
          </button>
        )}
        <button
          onClick={() => navigate('/ai/itinerary')}
          className="ml-auto text-[10px] font-semibold text-white bg-[#A65A3A] px-3 py-1 rounded-full hover:bg-[#8e492b] transition"
        >
          Mở trang lịch trình
        </button>
      </div>
    </div>
  );
};

export default AIItineraryPreview;

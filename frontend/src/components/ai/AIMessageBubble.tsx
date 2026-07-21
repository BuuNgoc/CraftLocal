import React from 'react';
import { Info } from 'lucide-react';
import type { AIChatMessage } from '../../types/ai.type';
import AIRecommendationCard from './AIRecommendationCard';
import AIItineraryPreview from './AIItineraryPreview';
import AIQuickReplies from './AIQuickReplies';

interface AIMessageBubbleProps {
  message: AIChatMessage;
  onQuickReply: (text: string) => void;
  isSending: boolean;
}

function uniqueRecommendations(recommendations: any[]) {
  const seen = new Set<string>();
  return (recommendations || []).filter((item) => {
    const id = item.workshop?._id || item.workshopId;
    if (!id) return false;
    if (seen.has(String(id))) return false;
    seen.add(String(id));
    return true;
  });
}

const AIMessageBubble: React.FC<AIMessageBubbleProps> = ({ message, onQuickReply, isSending }) => {
  const isUser = message.role === 'USER';
  const isSystem = message.role === 'SYSTEM';

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[80%] px-3.5 py-2.5 bg-[#A65A3A] text-white rounded-2xl rounded-br-md text-sm leading-relaxed shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  // AI or SYSTEM
  const hasRecommendations = !message.isOutOfScope && message.recommendations && message.recommendations.length > 0;
  const hasItinerary = !message.isOutOfScope && message.itinerary && message.itinerary.timeline && message.itinerary.timeline.length > 0;
  const deduped = hasRecommendations ? uniqueRecommendations(message.recommendations!) : [];

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[85%]">
        <div className={`px-3.5 py-2.5 rounded-2xl rounded-bl-md text-sm leading-relaxed shadow-sm ${
          message.isOutOfScope
            ? 'bg-amber-50 border border-amber-200 text-amber-800'
            : message.resultMode === 'ERROR'
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-white border border-[#E6DED5] text-[#2F2722]'
        }`}>
          {/* Out of scope icon */}
          {message.isOutOfScope && (
            <div className="flex items-center gap-1.5 mb-1.5 text-amber-600">
              <Info size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Ngoài phạm vi</span>
            </div>
          )}

          {/* Content */}
          <div className="whitespace-pre-line">{message.content}</div>
        </div>

        {/* Recommendation cards */}
        {deduped.length > 0 && (
          <div className="mt-2 space-y-2">
            {deduped.map((rec, idx) => (
              <AIRecommendationCard
                key={rec.workshop?._id || rec.workshopId || idx}
                recommendation={rec}
                resultMode={message.resultMode}
                index={idx}
              />
            ))}
          </div>
        )}

        {/* Itinerary preview */}
        {hasItinerary && (
          <AIItineraryPreview itinerary={message.itinerary!} />
        )}

        {/* Quick replies */}
        {message.quickReplies && message.quickReplies.length > 0 && (
          <AIQuickReplies
            quickReplies={message.quickReplies}
            onSelect={onQuickReply}
            disabled={isSending}
          />
        )}
      </div>
    </div>
  );
};

export default AIMessageBubble;

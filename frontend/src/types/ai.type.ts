export type AIMessageRole = 'USER' | 'AI' | 'SYSTEM';

export type AIResultMode =
  | 'RECOMMENDATION'
  | 'CHEAPEST'
  | 'BEST_RATED'
  | 'ITINERARY'
  | 'DESCRIPTION'
  | 'OUT_OF_SCOPE'
  | 'EMPTY'
  | 'GENERAL_GUIDE'
  | 'ERROR'
  | string;

export interface AIChatMessage {
  id: string;
  clientMessageId?: string;
  role: AIMessageRole;
  content: string;
  createdAt: string;
  intent?: string;
  resultMode?: AIResultMode;
  isOutOfScope?: boolean;
  recommendations?: AIRecommendation[];
  itinerary?: AIItinerary | null;
  quickReplies?: string[];
}

export interface AIRecommendation {
  rank?: number;
  workshop?: any;
  workshopId?: string;
  price?: number;
  matchScore?: number;
  reason?: string;
  bestFor?: string;
  suggestedTime?: string;
  matchedFactors?: string[];
  tradeOffs?: string[];
  resultMode?: string;
}

export interface AIItinerary {
  title?: string;
  summary?: string;
  estimatedBudget?: number;
  pace?: string;
  timeline?: AIItineraryItem[];
  preparationTips?: string[];
}

export interface AIItineraryItem {
  id?: string;
  time: string;
  type: 'MOVE' | 'WORKSHOP' | 'FOOD' | 'SHOPPING' | 'REST' | 'NOTE';
  activity: string;
  workshop?: any;
  workshopId?: string | null;
  note?: string;
  estimatedCost?: number;
  whyThisActivity?: string;
}

export interface AIChatResponseData {
  conversationId: string;
  clientMessageId?: string;
  intent: string;
  resultMode: AIResultMode;
  reply: string;
  detectedSlots?: Record<string, any>;
  missingSlots?: string[];
  recommendations?: AIRecommendation[];
  itinerary?: AIItinerary | null;
  quickReplies?: string[];
  isOutOfScope?: boolean;
}

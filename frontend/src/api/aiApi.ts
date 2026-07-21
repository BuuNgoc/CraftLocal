import axiosClient from './axiosClient';

export const aiApi = {
  health: () => axiosClient.get('/ai/health'),

  chat: (data: {
    conversationId?: string;
    clientMessageId: string;
    message: string;
    context?: {
      page?: string;
      currentWorkshopId?: string | null;
      role?: string | null;
    };
  }) => axiosClient.post('/ai/chat', data),

  recommendWorkshops: (data: {
    userMessage?: string;
    location?: string;
    date?: string;
    guests?: number;
    budget?: number;
    interests?: string[];
    difficulty?: string;
  }) => axiosClient.post('/ai/recommend-workshops', data),

  generateItinerary: (data: {
    location?: string;
    date?: string;
    duration?: string;
    guests?: number;
    budget?: number;
    interests?: string[];
    startTime?: string;
    endTime?: string;
    pace?: string;
    note?: string;
  }) => axiosClient.post('/ai/generate-itinerary', data),

  generateDescription: (data: {
    type: 'WORKSHOP' | 'PRODUCT';
    title: string;
    category?: string;
    location?: string;
    material?: string;
    origin?: string;
    keyPoints: string[];
    tone?: string;
  }) => axiosClient.post('/ai/generate-description', data),

  track: (data: {
    type: string;
    workshopId?: string;
    targetType?: string;
    targetId?: string;
  }) => axiosClient.post('/ai/track', data),
};

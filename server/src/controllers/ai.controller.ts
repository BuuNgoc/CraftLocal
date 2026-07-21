// ─── AI Controller ──────────────────────────────────────────────────
import { Request, Response } from 'express';
import { recommendWorkshops } from '../services/ai/recommend.service';
import { generateItinerary } from '../services/ai/itinerary.service';
import { generateDescription } from '../services/ai/description.service';
import { chat } from '../services/ai/chat.service';
import { CHAT_MODEL } from '../config/chat-ai';

// Health
export const aiHealth = async (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'CraftLocal Chat AI is running',
    data: {
      engine: 'CHAT_API_RAG',
      provider: 'openai-compatible',
      model: CHAT_MODEL,
      features: [
        'domain_guard', 'nlu', 'conversation_memory',
        'workshop_recommendation', 'itinerary_generation',
        'description_generation', 'validation_guard', 'fallback_rule_based',
      ],
    },
  });
};

// Chat
export const aiChat = async (req: Request, res: Response) => {
  try {
    const { conversationId, clientMessageId, message, context } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Thiếu nội dung tin nhắn' });
    }

    const userId = (req as any).user?.id;
    const result = await chat({ conversationId, clientMessageId, message: message.trim(), userId, context });
    return res.json(result);
  } catch (err: any) {
    console.error('[AI Controller] Chat error:', err.message || err.code);
    const status = err.code === 'AI_RATE_LIMIT' ? 429 : err.code === 'AI_MISSING_KEY' ? 503 : 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Lỗi khi gọi AI. Vui lòng thử lại sau.',
    });
  }
};

// Recommend Workshops
export const aiRecommendWorkshops = async (req: Request, res: Response) => {
  try {
    const result = await recommendWorkshops(req.body);
    return res.json(result);
  } catch (err: any) {
    console.error('[AI Controller] Recommend error:', err.message || err.code);
    const status = err.code === 'AI_RATE_LIMIT' ? 429 : 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Lỗi khi gọi AI. Vui lòng thử lại sau.',
    });
  }
};

// Generate Itinerary
export const aiGenerateItinerary = async (req: Request, res: Response) => {
  try {
    const result = await generateItinerary(req.body);
    return res.json(result);
  } catch (err: any) {
    console.error('[AI Controller] Itinerary error:', err.message || err.code);
    const status = err.code === 'AI_RATE_LIMIT' ? 429 : 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Lỗi khi gọi AI. Vui lòng thử lại sau.',
    });
  }
};

// Generate Description (HOST only)
export const aiGenerateDescription = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'HOST') {
      return res.status(403).json({ success: false, message: 'Chỉ HOST mới được sử dụng tính năng này.' });
    }

    const { type, title, keyPoints } = req.body;
    if (!type || !title || !keyPoints?.length) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin: type, title, keyPoints.' });
    }

    const result = await generateDescription(req.body);
    return res.json(result);
  } catch (err: any) {
    console.error('[AI Controller] Description error:', err.message || err.code);
    const status = err.code === 'AI_RATE_LIMIT' ? 429 : 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Lỗi khi gọi AI. Vui lòng thử lại sau.',
    });
  }
};

// Track interaction
export const aiTrack = async (req: Request, res: Response) => {
  try {
    // Simple tracking — just log for now
    const { type, workshopId, targetType, targetId } = req.body;
    console.log('[AI Track]', { type, workshopId, targetType, targetId, userId: (req as any).user?.id });
    return res.json({ success: true, message: 'Tracked' });
  } catch (err: any) {
    return res.json({ success: true, message: 'Track skipped' });
  }
};

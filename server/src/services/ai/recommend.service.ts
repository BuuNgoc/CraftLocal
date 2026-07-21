// ─── Recommend Workshop Service ─────────────────────────────────────
import { callChatJSON } from './ai-provider.adapter';
import { checkDomainScope, buildOutOfScopeResponse } from './domain-guard.service';
import { parseIntent, ExtractedSlots } from './nlu.service';
import { buildWorkshopContext, WorkshopContext } from './context-builder.service';
import { validateRecommendations } from './validation-guard.service';
import { buildFallbackRecommendation } from './fallback.service';
import Workshop from '../../models/workshop.model';

interface RecommendInput {
  userMessage?: string;
  location?: string;
  date?: string;
  guests?: number;
  budget?: number;
  interests?: string[];
  difficulty?: string;
}

export async function recommendWorkshops(input: RecommendInput) {
  const message = input.userMessage || '';

  // 1. Domain Guard
  if (message) {
    const domainCheck = checkDomainScope(message);
    if (!domainCheck.isInScope) {
      return buildOutOfScopeResponse();
    }
  }

  // 2. NLU: merge explicit params with parsed slots
  const nlu = message ? parseIntent(message) : { intent: 'RECOMMEND_WORKSHOP' as const, slots: {}, confidence: 0.8 };
  const slots: ExtractedSlots = {
    ...nlu.slots,
    ...(input.location && { location: input.location }),
    ...(input.date && { date: input.date }),
    ...(input.guests && { guests: input.guests }),
    ...(input.budget && { budget: input.budget, maxPrice: input.budget }),
    ...(input.interests?.length && { interests: input.interests }),
    ...(input.difficulty && { difficulty: input.difficulty }),
  };

  const intent = nlu.intent === 'UNKNOWN' ? 'RECOMMEND_WORKSHOP' : nlu.intent;

  // Force sort for cheapest
  if (intent === 'FIND_CHEAPEST_WORKSHOPS') slots.sort = 'PRICE_ASC';
  if (intent === 'FIND_BEST_RATED_WORKSHOPS') slots.sort = 'RATING_DESC';

  // 3. Build context from MongoDB
  const context = await buildWorkshopContext(slots, intent);

  if (context.workshops.length === 0) {
    const fallback = buildFallbackRecommendation([], slots, intent);
    return { success: true, message: 'Không tìm thấy workshop phù hợp', data: fallback };
  }

  // 4. Call Chat API
  try {
    const systemPrompt = `Bạn là trợ lý AI của CraftLocal — nền tảng đặt workshop trải nghiệm văn hóa Việt Nam.
Chỉ được tư vấn dựa trên danh sách workshop được cung cấp bên dưới.
Không được bịa workshopId, giá, địa điểm, timeslot hoặc thông tin không có trong context.
Nếu không đủ dữ liệu, hãy nói rõ.
Chỉ trả JSON hợp lệ, không markdown, không thêm giải thích ngoài JSON.
Ngôn ngữ tiếng Việt.

Trả JSON theo schema:
{
  "summary": "string — tóm tắt ngắn gọn kết quả",
  "recommendations": [
    {
      "workshopId": "string — _id từ danh sách",
      "matchScore": number 1-100,
      "reason": "string — lý do phù hợp",
      "bestFor": "string",
      "suggestedTime": "string",
      "matchedFactors": ["string"],
      "tradeOffs": ["string"]
    }
  ],
  "tips": ["string"]
}`;

    const userPrompt = `DANH SÁCH WORKSHOP CÓ SẴN:
${JSON.stringify(context.workshops, null, 0)}

YÊU CẦU CỦA KHÁCH:
${message || `Tìm workshop${slots.location ? ` ở ${slots.location}` : ''}${slots.budget ? ` dưới ${slots.budget}đ` : ''}${slots.guests ? ` cho ${slots.guests} người` : ''}`}
${slots.sort === 'PRICE_ASC' ? '\nSắp xếp: giá từ thấp đến cao.' : ''}
${slots.sort === 'RATING_DESC' ? '\nSắp xếp: đánh giá từ cao xuống thấp.' : ''}
Chọn tối đa 5 workshop phù hợp nhất.`;

    const aiResponse = await callChatJSON<any>({ systemPrompt, userPrompt });

    // 5. Validate
    const validated = validateRecommendations(
      aiResponse.recommendations || [],
      context.workshops,
      { location: slots.location, maxPrice: slots.maxPrice, sort: slots.sort }
    );

    // 6. Populate workshop objects
    const workshopIds = validated.map((r) => r.workshopId);
    const workshopDocs = await Workshop.find({ _id: { $in: workshopIds } }).lean();
    const wsDocMap = new Map(workshopDocs.map((w: any) => [w._id.toString(), w]));

    const resultMode = intent === 'FIND_CHEAPEST_WORKSHOPS' ? 'CHEAPEST' :
      intent === 'FIND_BEST_RATED_WORKSHOPS' ? 'BEST_RATED' : 'RECOMMENDATION';

    return {
      success: true,
      message: 'AI đã gợi ý workshop phù hợp',
      data: {
        engine: 'CHAT_API_RAG',
        resultMode,
        summary: aiResponse.summary || '',
        recommendations: validated.map((r) => ({
          workshop: wsDocMap.get(r.workshopId) || null,
          matchScore: r.matchScore,
          reason: r.reason,
          bestFor: r.bestFor,
          suggestedTime: r.suggestedTime,
          matchedFactors: r.matchedFactors || [],
          tradeOffs: r.tradeOffs || [],
        })),
        tips: aiResponse.tips || [],
      },
    };
  } catch (err: any) {
    console.error('[Recommend] Chat API error, using fallback:', err.message || err.code);
    const fallback = buildFallbackRecommendation(context.workshops, slots, intent);
    return { success: true, message: 'AI tạm bận, dùng hệ thống gợi ý tự động', data: fallback };
  }
}

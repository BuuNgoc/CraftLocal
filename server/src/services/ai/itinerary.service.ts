// ─── Itinerary Service ──────────────────────────────────────────────
import { callChatJSON } from './ai-provider.adapter';
import { buildItineraryContext } from './context-builder.service';
import { validateTimeline } from './validation-guard.service';
import { buildFallbackItinerary } from './fallback.service';
import { ExtractedSlots } from './nlu.service';
import Workshop from '../../models/workshop.model';

interface ItineraryInput {
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
}

export async function generateItinerary(input: ItineraryInput) {
  const slots: ExtractedSlots = {
    location: input.location,
    date: input.date,
    guests: input.guests,
    budget: input.budget,
    maxPrice: input.budget,
    interests: input.interests,
    startTime: input.startTime || '08:00',
    endTime: input.endTime || '18:00',
    pace: input.pace,
  };

  // Build context
  const context = await buildItineraryContext(slots);

  if (context.workshops.length === 0) {
    const fallback = buildFallbackItinerary([], slots);
    return { success: true, message: 'Không đủ dữ liệu tạo lịch trình', data: fallback };
  }

  try {
    const systemPrompt = `Bạn là trợ lý tạo lịch trình trải nghiệm của CraftLocal.
Chỉ dùng workshop thật trong context. Activity WORKSHOP bắt buộc dùng workshopId có trong context.
Không bịa workshop, giá, timeslot hoặc địa điểm.
Các hoạt động MOVE, FOOD, REST, SHOPPING có thể là gợi ý chung nhưng không được bịa workshop.
Mỗi workshop chỉ xuất hiện 1 lần. Không trùng workshopId.
Chỉ trả JSON hợp lệ, không markdown.

Schema:
{
  "title": "string",
  "summary": "string",
  "estimatedBudget": number,
  "pace": "RELAXED | BALANCED | FULL",
  "timeline": [
    {
      "id": "string — unique",
      "time": "HH:mm - HH:mm",
      "type": "MOVE | WORKSHOP | FOOD | SHOPPING | REST | NOTE",
      "activity": "string — tên hoạt động",
      "workshopId": "string | null — chỉ có khi type=WORKSHOP",
      "note": "string",
      "estimatedCost": number,
      "whyThisActivity": "string"
    }
  ],
  "recommendedWorkshops": ["workshopId"],
  "preparationTips": ["string"]
}`;

    const userPrompt = `WORKSHOP CÓ SẴN:
${JSON.stringify(context.workshops, null, 0)}
${context.products.length > 0 ? `\nSẢN PHẨM NỔI BẬT:\n${JSON.stringify(context.products, null, 0)}` : ''}

YÊU CẦU:
- Khu vực: ${input.location || 'Không giới hạn'}
- Ngày: ${input.date || 'Linh hoạt'}
- Thời gian: ${input.startTime || '08:00'} - ${input.endTime || '18:00'}
- Số khách: ${input.guests || 'Linh hoạt'}
- Ngân sách: ${input.budget ? input.budget.toLocaleString('vi-VN') + 'đ' : 'Không giới hạn'}
- Nhịp độ: ${input.pace || 'BALANCED'}
${input.interests?.length ? `- Sở thích: ${input.interests.join(', ')}` : ''}
${input.note ? `- Ghi chú: ${input.note}` : ''}

Tạo lịch trình chi tiết, chọn tối đa 3 workshop phù hợp.`;

    const aiResponse = await callChatJSON<any>({ systemPrompt, userPrompt });

    // Validate timeline
    const validatedTimeline = validateTimeline(aiResponse.timeline || [], context.workshops);

    // Populate workshop objects
    const workshopIds = validatedTimeline
      .filter((item) => item.type === 'WORKSHOP' && item.workshopId)
      .map((item) => item.workshopId!);
    const workshopDocs = await Workshop.find({ _id: { $in: workshopIds } }).lean();
    const wsDocMap = new Map(workshopDocs.map((w: any) => [w._id.toString(), w]));

    const populatedTimeline = validatedTimeline.map((item) => ({
      ...item,
      workshop: item.workshopId ? wsDocMap.get(item.workshopId) || null : null,
    }));

    return {
      success: true,
      message: 'AI đã tạo lịch trình trải nghiệm',
      data: {
        engine: 'CHAT_API_RAG',
        resultMode: 'ITINERARY',
        title: aiResponse.title || `Lịch trình ${input.location || ''}`,
        summary: aiResponse.summary || '',
        estimatedBudget: aiResponse.estimatedBudget || 0,
        pace: aiResponse.pace || input.pace || 'BALANCED',
        timeline: populatedTimeline,
        recommendedWorkshops: aiResponse.recommendedWorkshops || [],
        preparationTips: aiResponse.preparationTips || [],
      },
    };
  } catch (err: any) {
    console.error('[Itinerary] Chat API error, using fallback:', err.message || err.code);
    const fallback = buildFallbackItinerary(context.workshops, slots);
    return { success: true, message: 'AI tạm bận, dùng hệ thống tạo lịch trình tự động', data: fallback };
  }
}

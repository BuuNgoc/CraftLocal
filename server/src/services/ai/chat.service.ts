// ─── Chat Service ───────────────────────────────────────────────────
// Multi-turn AI chatbot with conversation memory.

import AIConversation from '../../models/aiConversation.model';
import AIMessage from '../../models/aiMessage.model';
import { checkDomainScope, buildOutOfScopeResponse } from './domain-guard.service';
import { parseIntent, ExtractedSlots, AIIntent } from './nlu.service';
import { recommendWorkshops } from './recommend.service';
import { generateItinerary } from './itinerary.service';
import { v4 as uuid } from 'uuid';

interface ChatInput {
  conversationId?: string;
  clientMessageId?: string;
  message: string;
  userId?: string;
  context?: { page?: string; currentWorkshopId?: string };
}

// Intent groups that trigger specific pipelines
const RECOMMEND_INTENTS: AIIntent[] = [
  'RECOMMEND_WORKSHOP', 'FIND_CHEAPEST_WORKSHOPS', 'FIND_BEST_RATED_WORKSHOPS',
  'FIND_WORKSHOPS_BY_LOCATION', 'FIND_WORKSHOPS_BY_BUDGET', 'FIND_WORKSHOPS_BY_CATEGORY',
  'COMPARE_WORKSHOPS',
];

const INFO_INTENTS: AIIntent[] = [
  'ASK_WORKSHOP_PRICE', 'ASK_WORKSHOP_LOCATION', 'ASK_WORKSHOP_TIME', 'ASK_WORKSHOP_DETAIL',
  'ASK_BOOKING', 'ASK_PAYMENT', 'ASK_TICKET', 'ASK_CHECKIN',
  'ASK_HOST_APPLICATION', 'ASK_TOUR_GUIDE', 'ASK_PROFILE', 'ASK_NOTIFICATION',
];

const INFO_REPLIES: Record<string, string> = {
  ASK_BOOKING: 'Để đặt workshop, bạn vào trang chi tiết workshop → chọn ngày giờ → nhấn "Đặt ngay". Sau khi thanh toán, bạn sẽ nhận vé QR qua trang "Vé của tôi".',
  ASK_PAYMENT: 'CraftLocal hỗ trợ thanh toán qua PayOS (chuyển khoản ngân hàng, QR code). Sau khi thanh toán, hệ thống sẽ tự động xác nhận booking.',
  ASK_TICKET: 'Sau khi booking thành công, vé QR sẽ hiển thị trong mục "Vé của tôi". Bạn xuất trình QR code khi đến xưởng để check-in.',
  ASK_CHECKIN: 'Hướng dẫn viên (Tour Guide) sẽ quét mã QR trên vé của bạn khi bạn đến xưởng. Hãy chuẩn bị vé trên điện thoại!',
  ASK_HOST_APPLICATION: 'Để trở thành Chủ xưởng, bạn cần: Đăng ký tài khoản → Vào "Đăng ký Chủ xưởng" → Điền thông tin & upload giấy tờ → Chờ Admin duyệt.',
  ASK_TOUR_GUIDE: 'Hướng dẫn viên là người quét QR check-in và hỗ trợ khách tại workshop. Bạn cần được Admin hoặc Host phân quyền TOUR_GUIDE.',
  ASK_PROFILE: 'Vào mục "Tài khoản" trên thanh menu để xem/sửa thông tin cá nhân, đổi mật khẩu, xem lịch sử booking.',
  ASK_NOTIFICATION: 'Bạn sẽ nhận thông báo khi: booking thành công, Host duyệt/hủy, có phản hồi mới. Xem tất cả thông báo ở biểu tượng 🔔.',
};

export async function chat(input: ChatInput) {
  const { message, clientMessageId, userId } = input;

  // Dedup by clientMessageId
  if (clientMessageId) {
    const existingMsg = await AIMessage.findOne({ clientMessageId }).lean();
    if (existingMsg) {
      // Return cached response
      const cachedResponse = await AIMessage.findOne({
        conversationId: existingMsg.conversationId,
        role: 'AI',
        createdAt: { $gt: existingMsg.createdAt },
      }).sort({ createdAt: 1 }).lean();

      if (cachedResponse) {
        return {
          success: true,
          message: 'Cached response',
          data: {
            conversationId: existingMsg.conversationId.toString(),
            clientMessageId,
            ...(cachedResponse.data || {}),
          },
        };
      }
    }
  }

  // 1. Domain Guard
  const domainCheck = checkDomainScope(message);
  if (!domainCheck.isInScope) {
    return buildOutOfScopeResponse();
  }

  // 2. Get or create conversation
  let conversation;
  if (input.conversationId) {
    conversation = await AIConversation.findById(input.conversationId);
  }
  if (!conversation) {
    conversation = await AIConversation.create({
      userId: userId || undefined,
      sessionId: uuid(),
      status: 'ACTIVE',
      slots: {},
      lastMessageAt: new Date(),
    });
  }

  // 3. NLU
  const nlu = parseIntent(message);
  let intent = nlu.intent;
  const newSlots = nlu.slots;

  // Merge slots from conversation context (multi-turn)
  const mergedSlots: ExtractedSlots = { ...conversation.slots, ...newSlots };

  // If user gives a short answer that looks like a location fill-in
  if (intent === 'UNKNOWN' && conversation.pendingIntent) {
    // Check if message is a location
    const words = message.trim().toLowerCase();
    const locationKeys = ['hội an', 'đà nẵng', 'huế', 'hà nội', 'sài gòn'];
    if (locationKeys.some((l) => words.includes(l)) || newSlots.location) {
      intent = conversation.pendingIntent as AIIntent;
      if (newSlots.location) mergedSlots.location = newSlots.location;
    }
  }

  // Save user message
  const savedUserMsg = await AIMessage.create({
    conversationId: conversation._id,
    clientMessageId: clientMessageId || uuid(),
    role: 'USER',
    content: message,
    intent,
  });

  // 4. Route by intent
  let responseData: any;

  if (intent === 'OUT_OF_SCOPE') {
    responseData = buildOutOfScopeResponse().data;
  } else if (RECOMMEND_INTENTS.includes(intent)) {
    const result = await recommendWorkshops({
      userMessage: message,
      location: mergedSlots.location,
      date: mergedSlots.date,
      guests: mergedSlots.guests,
      budget: mergedSlots.budget,
      interests: mergedSlots.interests,
      difficulty: mergedSlots.difficulty,
    });
    const rData = result.data as any;
    responseData = {
      intent,
      resultMode: rData?.resultMode || 'RECOMMENDATION',
      reply: rData?.summary || result.message,
      recommendations: rData?.recommendations || [],
      tips: rData?.tips || [],
      itinerary: null,
      isOutOfScope: false,
    };
  } else if (intent === 'GENERATE_ITINERARY') {
    const result = await generateItinerary({
      location: mergedSlots.location,
      date: mergedSlots.date,
      guests: mergedSlots.guests,
      budget: mergedSlots.budget,
      interests: mergedSlots.interests,
      pace: mergedSlots.pace,
    });
    const iData = result.data as any;
    responseData = {
      intent,
      resultMode: 'ITINERARY',
      reply: iData?.summary || result.message,
      itinerary: iData || null,
      recommendations: [],
      isOutOfScope: false,
    };
  } else if (INFO_INTENTS.includes(intent)) {
    const reply = INFO_REPLIES[intent] || 'Mình sẽ hỗ trợ bạn về vấn đề này. Bạn có thể mô tả chi tiết hơn không?';
    responseData = {
      intent,
      resultMode: 'INFO',
      reply,
      recommendations: [],
      itinerary: null,
      isOutOfScope: false,
      quickReplies: ['Gợi ý workshop phù hợp', 'Tạo lịch trình trải nghiệm'],
    };
  } else {
    // UNKNOWN — check if we need more info
    const missingSlots: string[] = [];
    if (!mergedSlots.location) missingSlots.push('khu vực');

    if (missingSlots.length > 0) {
      conversation.pendingIntent = 'RECOMMEND_WORKSHOP';
      await conversation.save();

      responseData = {
        intent: 'UNKNOWN',
        resultMode: 'CLARIFY',
        reply: `Bạn muốn tìm workshop ở khu vực nào? (Ví dụ: Hội An, Đà Nẵng, Huế...)`,
        missingSlots,
        recommendations: [],
        itinerary: null,
        isOutOfScope: false,
        quickReplies: ['Hội An', 'Đà Nẵng', 'Huế', 'Xem tất cả'],
      };
    } else {
      // Default to recommend
      const result = await recommendWorkshops({
        userMessage: message,
        location: mergedSlots.location,
        budget: mergedSlots.budget,
        guests: mergedSlots.guests,
      });
      const rData2 = result.data as any;
      responseData = {
        intent: 'RECOMMEND_WORKSHOP',
        resultMode: rData2?.resultMode || 'RECOMMENDATION',
        reply: rData2?.summary || result.message,
        recommendations: rData2?.recommendations || [],
        itinerary: null,
        isOutOfScope: false,
      };
    }
  }

  // Update conversation
  conversation.currentIntent = intent;
  conversation.slots = mergedSlots;
  conversation.lastMessageAt = new Date();
  if (responseData.resultMode !== 'CLARIFY') {
    conversation.pendingIntent = undefined;
  }
  await conversation.save();

  // Save AI message
  await AIMessage.create({
    conversationId: conversation._id,
    role: 'AI',
    content: responseData.reply || '',
    intent,
    data: responseData,
  });

  return {
    success: true,
    message: 'AI phản hồi thành công',
    data: {
      conversationId: conversation._id.toString(),
      clientMessageId: clientMessageId || savedUserMsg.clientMessageId,
      detectedSlots: mergedSlots,
      ...responseData,
    },
  };
}

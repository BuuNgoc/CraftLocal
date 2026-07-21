// ─── Fallback Service ───────────────────────────────────────────────
// Rule-based fallback when Chat API is unavailable or errors out.

import { WorkshopContext } from './context-builder.service';
import { ExtractedSlots, AIIntent } from './nlu.service';

export function buildFallbackRecommendation(
  workshops: WorkshopContext[],
  slots: ExtractedSlots,
  intent: AIIntent
) {
  if (workshops.length === 0) {
    const locationText = slots.location ? ` ở ${slots.location}` : '';
    return {
      engine: 'RULE_BASED_FALLBACK',
      resultMode: 'EMPTY',
      summary: `Hiện tại chưa tìm thấy workshop phù hợp${locationText}. Hãy thử mở rộng tiêu chí tìm kiếm.`,
      recommendations: [],
      tips: ['Thử bỏ bộ lọc khu vực hoặc tăng ngân sách để có nhiều lựa chọn hơn.'],
      reply: `Hiện tại mình chưa tìm thấy workshop nào${locationText} trong dữ liệu CraftLocal.`,
      quickReplies: slots.location
        ? [`Tìm ở khu vực khác`, `Xem tất cả workshop`, `Tìm workshop rẻ nhất toàn hệ thống`]
        : [`Xem tất cả workshop`, `Tìm workshop rẻ nhất`],
    };
  }

  // Sort
  let sorted = [...workshops];
  if (intent === 'FIND_CHEAPEST_WORKSHOPS' || slots.sort === 'PRICE_ASC') {
    sorted.sort((a, b) => a.price - b.price);
  } else if (intent === 'FIND_BEST_RATED_WORKSHOPS' || slots.sort === 'RATING_DESC') {
    sorted.sort((a, b) => b.averageRating - a.averageRating);
  }

  const resultMode = intent === 'FIND_CHEAPEST_WORKSHOPS' ? 'CHEAPEST' :
    intent === 'FIND_BEST_RATED_WORKSHOPS' ? 'BEST_RATED' : 'RECOMMENDATION';

  const locationText = slots.location ? ` tại ${slots.location}` : '';
  const summary = resultMode === 'CHEAPEST'
    ? `Tìm thấy ${sorted.length} workshop có giá thấp nhất${locationText}, sắp xếp theo giá tăng dần.`
    : resultMode === 'BEST_RATED'
    ? `Tìm thấy ${sorted.length} workshop được đánh giá cao nhất${locationText}.`
    : `Tìm thấy ${sorted.length} workshop phù hợp${locationText}.`;

  return {
    engine: 'RULE_BASED_FALLBACK',
    resultMode,
    summary,
    reply: summary,
    recommendations: sorted.map((w, idx) => ({
      workshopId: w._id,
      matchScore: Math.max(95 - idx * 5, 60),
      reason: `${w.title} - ${w.categoryName} (${w.price.toLocaleString('vi-VN')}đ, ${w.averageRating}⭐)`,
      bestFor: w.difficulty === 'EASY' ? 'Người mới bắt đầu' : w.difficulty === 'HARD' ? 'Người có kinh nghiệm' : 'Mọi đối tượng',
      suggestedTime: w.availableTimeslots?.[0] ? `${w.availableTimeslots[0].date} ${w.availableTimeslots[0].time}` : 'Liên hệ để biết lịch',
      matchedFactors: [w.categoryName, w.locationLabel],
      tradeOffs: [],
    })),
    tips: ['Kết quả được sắp xếp bằng hệ thống tự động. AI đang tạm thời không khả dụng.'],
    quickReplies: [],
  };
}

export function buildFallbackItinerary(
  workshops: WorkshopContext[],
  slots: ExtractedSlots
) {
  if (workshops.length === 0) {
    return {
      engine: 'RULE_BASED_FALLBACK',
      resultMode: 'EMPTY',
      title: 'Chưa có lịch trình',
      summary: `Không tìm thấy workshop phù hợp${slots.location ? ` ở ${slots.location}` : ''} để tạo lịch trình.`,
      timeline: [],
      recommendedWorkshops: [],
      preparationTips: [],
      estimatedBudget: 0,
    };
  }

  const selected = workshops.slice(0, 3);
  let totalBudget = 0;
  const timeline: any[] = [];
  let hour = 8;

  for (let i = 0; i < selected.length; i++) {
    const ws = selected[i];
    const startH = hour.toString().padStart(2, '0');
    const endH = (hour + Math.ceil(ws.duration / 60)).toString().padStart(2, '0');

    timeline.push({
      id: `ws-${i}`,
      time: `${startH}:00 - ${endH}:00`,
      type: 'WORKSHOP',
      activity: ws.title,
      workshopId: ws._id,
      note: ws.shortDescription,
      estimatedCost: ws.price,
      whyThisActivity: `${ws.categoryName} - ${ws.averageRating}⭐`,
    });

    totalBudget += ws.price;
    hour = parseInt(endH) + 1;

    if (i < selected.length - 1) {
      timeline.push({
        id: `break-${i}`,
        time: `${endH}:00 - ${(parseInt(endH) + 1).toString().padStart(2, '0')}:00`,
        type: 'FOOD',
        activity: 'Nghỉ ngơi & ẩm thực địa phương',
        workshopId: null,
        estimatedCost: 50000,
      });
      totalBudget += 50000;
    }
  }

  return {
    engine: 'RULE_BASED_FALLBACK',
    resultMode: 'ITINERARY',
    title: `Lịch trình trải nghiệm${slots.location ? ` ${slots.location}` : ''}`,
    summary: `Lịch trình gồm ${selected.length} workshop, tổng chi phí ước tính ${totalBudget.toLocaleString('vi-VN')}đ.`,
    estimatedBudget: totalBudget,
    pace: slots.pace || 'BALANCED',
    timeline,
    recommendedWorkshops: selected.map((w) => w._id),
    preparationTips: ['Mang theo nước uống', 'Mặc quần áo thoải mái'],
  };
}

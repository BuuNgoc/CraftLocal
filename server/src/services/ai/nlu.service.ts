// ─── NLU Service ────────────────────────────────────────────────────
// Rule-based intent classification & slot extraction from Vietnamese text.

export type AIIntent =
  | 'OUT_OF_SCOPE'
  | 'UNKNOWN'
  | 'RECOMMEND_WORKSHOP'
  | 'FIND_CHEAPEST_WORKSHOPS'
  | 'FIND_BEST_RATED_WORKSHOPS'
  | 'FIND_WORKSHOPS_BY_LOCATION'
  | 'FIND_WORKSHOPS_BY_BUDGET'
  | 'FIND_WORKSHOPS_BY_CATEGORY'
  | 'ASK_WORKSHOP_PRICE'
  | 'ASK_WORKSHOP_LOCATION'
  | 'ASK_WORKSHOP_TIME'
  | 'ASK_WORKSHOP_DETAIL'
  | 'COMPARE_WORKSHOPS'
  | 'GENERATE_ITINERARY'
  | 'GENERATE_WORKSHOP_DESCRIPTION'
  | 'GENERATE_PRODUCT_DESCRIPTION'
  | 'ASK_BOOKING'
  | 'ASK_PAYMENT'
  | 'ASK_TICKET'
  | 'ASK_CHECKIN'
  | 'ASK_HOST_APPLICATION'
  | 'ASK_TOUR_GUIDE'
  | 'ASK_PROFILE'
  | 'ASK_NOTIFICATION';

export interface ExtractedSlots {
  location?: string;
  date?: string;
  guests?: number;
  budget?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  limit?: number;
  category?: string;
  difficulty?: string;
  interests?: string[];
  mood?: string;
  pace?: string;
  startTime?: string;
  endTime?: string;
  workshopName?: string;
  productName?: string;
}

export interface NLUResult {
  intent: AIIntent;
  slots: ExtractedSlots;
  confidence: number;
}

// ─── Intent Rules ───────────────────────────────────────────────────
interface IntentRule {
  intent: AIIntent;
  patterns: RegExp[];
  priority: number;
}

const INTENT_RULES: IntentRule[] = [
  // Cheapest — must come before general recommend
  {
    intent: 'FIND_CHEAPEST_WORKSHOPS',
    patterns: [
      /rẻ\s*nhất/i, /giá\s*(thấp|rẻ)\s*nhất/i, /workshop\s*rẻ/i, /rẻ\s*nhất/i,
      /tiết\s*kiệm\s*nhất/i, /giá\s*rẻ/i, /ít\s*tiền\s*nhất/i,
      /dưới\s*\d+/i, /không\s*quá\s*\d+/i,
    ],
    priority: 10,
  },
  // Best rated
  {
    intent: 'FIND_BEST_RATED_WORKSHOPS',
    patterns: [
      /đánh\s*giá\s*(cao|tốt)\s*nhất/i, /rating\s*(cao|tốt)/i,
      /phổ\s*biến\s*nhất/i, /hay\s*nhất/i, /tốt\s*nhất/i,
      /nhiều\s*sao\s*nhất/i,
    ],
    priority: 10,
  },
  // Ask specific workshop price
  {
    intent: 'ASK_WORKSHOP_PRICE',
    patterns: [
      /giá\s*(của\s*)?workshop/i, /workshop.*giá\s*(bao\s*nhiêu|là)/i,
      /bao\s*nhiêu\s*tiền/i, /chi\s*phí.*workshop/i,
      /giá\s*(bao\s*nhiêu|của)/i,
    ],
    priority: 8,
  },
  // Itinerary
  {
    intent: 'GENERATE_ITINERARY',
    patterns: [
      /lịch\s*trình/i, /kế\s*hoạch/i, /itinerary/i, /timeline/i,
      /sắp\s*xếp\s*ngày/i, /plan\s*cho/i,
    ],
    priority: 9,
  },
  // Description — workshop
  {
    intent: 'GENERATE_WORKSHOP_DESCRIPTION',
    patterns: [
      /viết\s*mô\s*tả\s*workshop/i, /tạo\s*mô\s*tả/i,
      /mô\s*tả\s*workshop/i, /description.*workshop/i,
    ],
    priority: 9,
  },
  // Description — product
  {
    intent: 'GENERATE_PRODUCT_DESCRIPTION',
    patterns: [
      /viết\s*mô\s*tả\s*sản\s*phẩm/i, /mô\s*tả\s*sản\s*phẩm/i,
      /description.*product/i,
    ],
    priority: 9,
  },
  // By location
  {
    intent: 'FIND_WORKSHOPS_BY_LOCATION',
    patterns: [
      /workshop\s*(ở|tại|gần)/i, /ở\s*(hội\s*an|đà\s*nẵng|huế|hà\s*nội)/i,
      /tại\s*(hội\s*an|đà\s*nẵng|huế|hà\s*nội)/i,
    ],
    priority: 5,
  },
  // By budget
  {
    intent: 'FIND_WORKSHOPS_BY_BUDGET',
    patterns: [
      /ngân\s*sách/i, /budget/i, /trong\s*khoảng\s*\d+/i,
      /từ\s*\d+.*đến\s*\d+/i,
    ],
    priority: 5,
  },
  // By category
  {
    intent: 'FIND_WORKSHOPS_BY_CATEGORY',
    patterns: [
      /loại|category|thể\s*loại/i,
      /workshop\s*(làm\s*)?(gốm|đèn|lụa|mây|nón|tranh|dệt|thêu)/i,
    ],
    priority: 5,
  },
  // Compare
  {
    intent: 'COMPARE_WORKSHOPS',
    patterns: [
      /so\s*sánh/i, /compare/i, /khác\s*(nhau|gì)/i,
      /nên\s*chọn.*hay/i,
    ],
    priority: 7,
  },
  // Booking
  {
    intent: 'ASK_BOOKING',
    patterns: [/đặt\s*(chỗ|vé|lịch)/i, /booking/i, /cách\s*đặt/i, /hủy\s*(đặt|booking)/i],
    priority: 6,
  },
  // Payment
  {
    intent: 'ASK_PAYMENT',
    patterns: [/thanh\s*toán/i, /payment/i, /payos/i, /chuyển\s*khoản/i, /trả\s*tiền/i],
    priority: 6,
  },
  // Ticket
  {
    intent: 'ASK_TICKET',
    patterns: [/vé/i, /ticket/i, /qr/i, /mã\s*vé/i],
    priority: 6,
  },
  // Check-in
  {
    intent: 'ASK_CHECKIN',
    patterns: [/check[\s-]?in/i, /điểm\s*danh/i, /quét\s*qr/i],
    priority: 6,
  },
  // Host application
  {
    intent: 'ASK_HOST_APPLICATION',
    patterns: [/đăng\s*ký\s*(chủ\s*xưởng|host)/i, /hồ\s*sơ\s*(host|chủ)/i, /trở\s*thành\s*host/i],
    priority: 6,
  },
  // Tour guide
  {
    intent: 'ASK_TOUR_GUIDE',
    patterns: [/hướng\s*dẫn\s*viên/i, /tour\s*guide/i, /hdv/i],
    priority: 6,
  },
  // Profile
  {
    intent: 'ASK_PROFILE',
    patterns: [/tài\s*khoản/i, /profile/i, /thông\s*tin\s*cá\s*nhân/i, /đổi\s*mật\s*khẩu/i],
    priority: 4,
  },
  // Notification
  {
    intent: 'ASK_NOTIFICATION',
    patterns: [/thông\s*báo/i, /notification/i],
    priority: 4,
  },
  // General recommend — low priority so specific intents win
  {
    intent: 'RECOMMEND_WORKSHOP',
    patterns: [
      /gợi\s*ý/i, /tư\s*vấn/i, /recommend/i, /suggest/i,
      /workshop\s*(nào|phù\s*hợp|hay)/i, /tìm\s*workshop/i,
      /trải\s*nghiệm\s*(gì|nào)/i, /muốn\s*(đi|thử|học|làm)/i,
    ],
    priority: 3,
  },
];

// ─── Slot Extraction ────────────────────────────────────────────────

const LOCATION_MAP: Record<string, string> = {
  'hội an': 'Hội An', 'hoian': 'Hội An', 'hoi an': 'Hội An',
  'đà nẵng': 'Đà Nẵng', 'da nang': 'Đà Nẵng', 'danang': 'Đà Nẵng',
  'huế': 'Huế', 'hue': 'Huế',
  'hà nội': 'Hà Nội', 'ha noi': 'Hà Nội', 'hanoi': 'Hà Nội',
  'sài gòn': 'TP.HCM', 'hồ chí minh': 'TP.HCM', 'tphcm': 'TP.HCM', 'hcm': 'TP.HCM',
  'nha trang': 'Nha Trang', 'đà lạt': 'Đà Lạt', 'da lat': 'Đà Lạt',
  'phú quốc': 'Phú Quốc', 'cần thơ': 'Cần Thơ', 'sapa': 'Sa Pa',
  'ninh bình': 'Ninh Bình',
};

const CATEGORY_MAP: Record<string, string> = {
  'gốm': 'Làm gốm', 'đèn lồng': 'Làm đèn lồng', 'đèn': 'Làm đèn lồng',
  'lụa': 'Dệt lụa', 'mây tre': 'Đan mây tre', 'nón lá': 'Làm nón lá',
  'tranh': 'Vẽ tranh', 'dệt': 'Dệt lụa', 'thêu': 'Thêu',
  'sơn mài': 'Sơn mài', 'mộc': 'Làm mộc', 'gỗ': 'Chế tác gỗ',
  'nhuộm': 'Nhuộm vải', 'batik': 'Nhuộm Batik',
};

function extractSlots(message: string): ExtractedSlots {
  const lower = message.toLowerCase();
  const slots: ExtractedSlots = {};

  // Location
  for (const [key, value] of Object.entries(LOCATION_MAP)) {
    if (lower.includes(key)) {
      slots.location = value;
      break;
    }
  }

  // Budget / price
  const budgetMatch = lower.match(/(?:dưới|không\s*quá|tối\s*đa|budget|ngân\s*sách)\s*(\d[\d.,]*)\s*(k|nghìn|ngàn|triệu)?/i);
  if (budgetMatch) {
    let amount = parseFloat(budgetMatch[1].replace(/[.,]/g, ''));
    const unit = budgetMatch[2]?.toLowerCase();
    if (unit === 'k' || unit === 'nghìn' || unit === 'ngàn') amount *= 1000;
    if (unit === 'triệu') amount *= 1000000;
    slots.maxPrice = amount;
    slots.budget = amount;
  }

  // Price range
  const rangeMatch = lower.match(/từ\s*(\d[\d.,]*)\s*(k|nghìn|triệu)?\s*(?:đến|tới|-)\s*(\d[\d.,]*)\s*(k|nghìn|triệu)?/i);
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1].replace(/[.,]/g, ''));
    const minUnit = rangeMatch[2]?.toLowerCase();
    if (minUnit === 'k' || minUnit === 'nghìn') min *= 1000;
    if (minUnit === 'triệu') min *= 1000000;
    slots.minPrice = min;

    let max = parseFloat(rangeMatch[3].replace(/[.,]/g, ''));
    const maxUnit = rangeMatch[4]?.toLowerCase();
    if (maxUnit === 'k' || maxUnit === 'nghìn') max *= 1000;
    if (maxUnit === 'triệu') max *= 1000000;
    slots.maxPrice = max;
    slots.budget = max;
  }

  // Guests
  const guestMatch = lower.match(/(\d+)\s*(người|khách|bạn|người lớn|nguoi)/i);
  if (guestMatch) {
    slots.guests = parseInt(guestMatch[1], 10);
  }
  const forMatch = lower.match(/cho\s*(\d+)\s*(người|khách)?/i);
  if (forMatch && !slots.guests) {
    slots.guests = parseInt(forMatch[1], 10);
  }

  // Category
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) {
      slots.category = value;
      break;
    }
  }

  // Difficulty
  if (/dễ|easy|nhẹ\s*nhàng/i.test(lower)) slots.difficulty = 'EASY';
  else if (/khó|hard|thử\s*thách/i.test(lower)) slots.difficulty = 'HARD';
  else if (/trung\s*bình|medium/i.test(lower)) slots.difficulty = 'MEDIUM';

  // Sort
  if (/rẻ\s*nhất|giá\s*(thấp|rẻ)|tiết\s*kiệm/i.test(lower)) slots.sort = 'PRICE_ASC';
  if (/đắt\s*nhất|giá\s*cao/i.test(lower)) slots.sort = 'PRICE_DESC';
  if (/đánh\s*giá\s*cao|rating|sao|tốt\s*nhất/i.test(lower)) slots.sort = 'RATING_DESC';

  // Pace
  if (/nhẹ\s*nhàng|relax|thư\s*giãn|chậm/i.test(lower)) slots.pace = 'RELAXED';
  else if (/đầy\s*đủ|full|nhiều/i.test(lower)) slots.pace = 'FULL';
  else if (/cân\s*bằng|balanced|vừa/i.test(lower)) slots.pace = 'BALANCED';

  // Date
  const dateMatch = lower.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (dateMatch) {
    slots.date = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
  }

  // Interests
  const interestKeywords = ['gốm', 'đèn lồng', 'lụa', 'dệt', 'nón lá', 'mây tre', 'tranh', 'thêu', 'ẩm thực', 'mua sắm', 'shopping', 'quà', 'văn hóa', 'nghệ thuật'];
  const interests = interestKeywords.filter((k) => lower.includes(k));
  if (interests.length > 0) slots.interests = interests;

  return slots;
}

// ─── Main Parse ─────────────────────────────────────────────────────

export function parseIntent(message: string): NLUResult {
  const lower = message.toLowerCase().trim();

  // Find highest priority matching intent
  let bestMatch: IntentRule | null = null;
  let bestPriority = -1;

  for (const rule of INTENT_RULES) {
    if (rule.priority <= bestPriority) continue;
    for (const pattern of rule.patterns) {
      if (pattern.test(lower)) {
        bestMatch = rule;
        bestPriority = rule.priority;
        break;
      }
    }
  }

  const slots = extractSlots(message);

  if (!bestMatch) {
    // If we extracted slots, it's probably a workshop query
    if (slots.location || slots.budget || slots.category || slots.guests) {
      return { intent: 'RECOMMEND_WORKSHOP', slots, confidence: 0.5 };
    }
    return { intent: 'UNKNOWN', slots, confidence: 0.2 };
  }

  return { intent: bestMatch.intent, slots, confidence: Math.min(0.5 + bestPriority * 0.05, 0.95) };
}

// ─── Domain Guard Service ───────────────────────────────────────────
// Checks if user message is within CraftLocal's scope BEFORE calling Chat API.

const ALLOWED_KEYWORDS = [
  // workshop & experiences
  'workshop', 'trải nghiệm', 'làng nghề', 'thủ công', 'nghệ nhân', 'xưởng',
  'gốm', 'đèn lồng', 'mây tre', 'nón lá', 'dệt', 'tranh', 'chạm', 'khắc', 'thêu',
  'lụa', 'đan', 'sơn mài', 'gỗ', 'đá', 'kim loại', 'giấy', 'nhuộm', 'batik',
  // booking
  'đặt', 'booking', 'vé', 'ticket', 'qr', 'check-in', 'checkin',
  // payment
  'thanh toán', 'payment', 'payos', 'giá', 'phí', 'chi phí', 'ngân sách', 'rẻ', 'đắt',
  // roles
  'chủ xưởng', 'host', 'hướng dẫn', 'tour guide', 'khách', 'tourist',
  // products
  'sản phẩm', 'quà', 'tặng', 'mua', 'shopping', 'hàng', 'đồ thủ công',
  // itinerary
  'lịch trình', 'kế hoạch', 'itinerary', 'timeline',
  // locations
  'hội an', 'đà nẵng', 'huế', 'hà nội', 'sài gòn', 'hồ chí minh', 'nha trang',
  'đà lạt', 'phú quốc', 'cần thơ', 'sapa', 'ninh bình',
  // AI tasks
  'gợi ý', 'tư vấn', 'recommend', 'tìm', 'search', 'mô tả', 'viết',
  'description', 'so sánh', 'compare',
  // platform
  'craftlocal', 'tài khoản', 'profile', 'notification', 'thông báo',
  'đăng ký', 'đăng nhập', 'hồ sơ',
  // time
  'ngày', 'sáng', 'chiều', 'tối', 'cuối tuần', 'thứ',
  // general workshop
  'khó', 'dễ', 'trung bình', 'người', 'khách', 'nhóm',
  'đánh giá', 'review', 'rating', 'sao',
  'khu vực', 'địa điểm', 'location',
];

const BLOCKED_KEYWORDS = [
  // sports
  'ronaldo', 'messi', 'bóng đá', 'football', 'world cup', 'premier league',
  'nba', 'tennis', 'boxing',
  // crypto/finance
  'bitcoin', 'crypto', 'chứng khoán', 'stock', 'forex', 'coin', 'ethereum',
  // tech unrelated
  'iphone', 'samsung', 'laptop', 'macbook', 'android', 'ios',
  // entertainment
  'phim', 'movie', 'netflix', 'anime', 'game', 'esport',
  // politics
  'chính trị', 'bầu cử', 'đảng', 'chiến tranh',
  // code unrelated
  'sort array', 'leetcode', 'hackerrank', 'algorithm',
  // general knowledge
  'thời tiết', 'weather', 'nasa', 'vũ trụ',
];

export interface DomainCheckResult {
  isInScope: boolean;
  confidence: number;
  matchedKeywords: string[];
}

export function checkDomainScope(message: string): DomainCheckResult {
  const lower = message.toLowerCase().trim();

  // Check blocked keywords first
  for (const blocked of BLOCKED_KEYWORDS) {
    if (lower.includes(blocked)) {
      return { isInScope: false, confidence: 0.95, matchedKeywords: [blocked] };
    }
  }

  // Check allowed keywords
  const matched: string[] = [];
  for (const allowed of ALLOWED_KEYWORDS) {
    if (lower.includes(allowed)) {
      matched.push(allowed);
    }
  }

  if (matched.length > 0) {
    const confidence = Math.min(0.5 + matched.length * 0.15, 1.0);
    return { isInScope: true, confidence, matchedKeywords: matched };
  }

  // Short messages with no clear intent — let through (chatbot handles)
  if (lower.length < 10) {
    return { isInScope: true, confidence: 0.3, matchedKeywords: [] };
  }

  // No match — ambiguous, default to in-scope but low confidence
  return { isInScope: true, confidence: 0.2, matchedKeywords: [] };
}

export function buildOutOfScopeResponse() {
  return {
    success: true,
    message: 'Câu hỏi nằm ngoài phạm vi CraftLocal AI',
    data: {
      intent: 'OUT_OF_SCOPE',
      resultMode: 'OUT_OF_SCOPE',
      isOutOfScope: true,
      reply: 'Mình là trợ lý AI của CraftLocal nên chỉ hỗ trợ các nội dung liên quan đến workshop, trải nghiệm văn hóa, sản phẩm thủ công, đặt vé, lịch trình và tài khoản trên CraftLocal. 😊',
      quickReplies: [
        'Gợi ý workshop phù hợp',
        'Tạo lịch trình trải nghiệm',
        'Tìm workshop rẻ nhất',
        'Hướng dẫn đặt vé',
      ],
      recommendations: [],
      itinerary: null,
    },
  };
}

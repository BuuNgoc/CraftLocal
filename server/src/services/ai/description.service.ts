// ─── Description Service ────────────────────────────────────────────
// AI writes workshop/product descriptions for HOST users.

import { callChatJSON } from './ai-provider.adapter';

interface DescriptionInput {
  type: 'WORKSHOP' | 'PRODUCT';
  title: string;
  category?: string;
  location?: string;
  material?: string;
  origin?: string;
  keyPoints: string[];
  tone?: string;
}

export async function generateDescription(input: DescriptionInput) {
  const isProduct = input.type === 'PRODUCT';

  const systemPrompt = `Bạn là trợ lý viết nội dung cho Chủ xưởng trên CraftLocal.
Hãy tạo mô tả tiếng Việt chuyên nghiệp, hấp dẫn, đúng văn hóa địa phương.
Chỉ dùng thông tin Host cung cấp. Không bịa giải thưởng, chứng nhận, giá, địa chỉ, nghệ nhân nổi tiếng hoặc cam kết không có trong input.
Chỉ trả JSON hợp lệ, không markdown.

${isProduct ? `Schema PRODUCT:
{
  "versions": [
    {
      "style": "string",
      "nameSuggestion": "string",
      "shortDescription": "string dưới 120 ký tự",
      "description": "string 200-500 từ"
    }
  ],
  "recommendedVersion": 0,
  "materialSuggestion": "string",
  "careInstructions": ["string"],
  "seoKeywords": ["string"],
  "qualityScore": number 1-100,
  "suggestions": ["string"]
}` : `Schema WORKSHOP:
{
  "versions": [
    {
      "style": "string",
      "titleSuggestion": "string",
      "shortDescription": "string dưới 120 ký tự",
      "description": "string 200-500 từ"
    }
  ],
  "recommendedVersion": 0,
  "includedItems": ["string"],
  "requiredItems": ["string"],
  "seoKeywords": ["string"],
  "qualityScore": number 1-100,
  "suggestions": ["string"]
}`}

Tạo ít nhất 2 phiên bản mô tả với giọng điệu khác nhau.`;

  const userPrompt = `THÔNG TIN ${isProduct ? 'SẢN PHẨM' : 'WORKSHOP'}:
- Tên: ${input.title}
${input.category ? `- Danh mục: ${input.category}` : ''}
${input.location ? `- Địa điểm: ${input.location}` : ''}
${input.material ? `- Chất liệu: ${input.material}` : ''}
${input.origin ? `- Xuất xứ: ${input.origin}` : ''}
- Điểm nổi bật:
${input.keyPoints.map((p) => `  • ${p}`).join('\n')}
${input.tone ? `- Giọng điệu mong muốn: ${input.tone}` : ''}`;

  try {
    const aiResponse = await callChatJSON<any>({ systemPrompt, userPrompt, temperature: 0.7 });

    return {
      success: true,
      message: 'AI đã tạo mô tả thành công',
      data: {
        engine: 'CHAT_API',
        ...aiResponse,
      },
    };
  } catch (err: any) {
    console.error('[Description] Chat API error:', err.message || err.code);
    // Simple fallback
    const fallbackDesc = `${input.title}${input.location ? ` tại ${input.location}` : ''} — ${input.keyPoints.join(', ')}.`;
    return {
      success: true,
      message: 'AI tạm bận, dùng mô tả tự động',
      data: {
        engine: 'RULE_BASED_FALLBACK',
        versions: [
          {
            style: 'Cơ bản',
            [isProduct ? 'nameSuggestion' : 'titleSuggestion']: input.title,
            shortDescription: fallbackDesc.substring(0, 120),
            description: fallbackDesc,
          },
        ],
        recommendedVersion: 0,
        seoKeywords: input.keyPoints.slice(0, 5),
        qualityScore: 50,
        suggestions: ['Thử lại sau khi AI khả dụng để có mô tả hay hơn.'],
      },
    };
  }
}

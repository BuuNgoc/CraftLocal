import { getChatAIClient, CHAT_MODEL, AI_TEMPERATURE } from '../../config/chat-ai';

// ─── Types ──────────────────────────────────────────────────────────
export interface ChatCallOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxRetries?: number;
}

// ─── Parse & Clean ──────────────────────────────────────────────────
export function parseAIJsonResponse(text: string): any {
  let cleaned = text.trim();
  // Remove markdown code fences
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  cleaned = cleaned.trim();
  return JSON.parse(cleaned);
}

// ─── Error Handler ──────────────────────────────────────────────────
export function handleAIError(err: any): never {
  const status = err?.status || err?.response?.status || err?.statusCode || err?.code;
  const msg = err?.message || '';

  console.error('[AI Provider] Error:', status, msg.substring(0, 200));

  if (msg.includes('Missing CHAT_API_KEY') || msg.includes('Incorrect API key') || msg.includes('invalid_api_key')) {
    throw { code: 'AI_MISSING_KEY', message: 'CHAT_API_KEY không hợp lệ hoặc chưa cấu hình trong server/.env.' };
  }

  if (status === 429 || msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate_limit')) {
    throw { code: 'AI_RATE_LIMIT', message: 'AI đang vượt giới hạn. Vui lòng thử lại sau ít phút.' };
  }

  if (status === 403 || msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbidden')) {
    throw { code: 'AI_FORBIDDEN', message: 'API key không có quyền truy cập. Kiểm tra lại key.' };
  }

  if (msg.toLowerCase().includes('timeout') || err?.code === 'ETIMEDOUT' || err?.code === 'ECONNABORTED') {
    throw { code: 'AI_TIMEOUT', message: 'AI phản hồi quá chậm. Vui lòng thử lại.' };
  }

  throw {
    code: 'AI_UNKNOWN_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'Lỗi khi gọi AI. Vui lòng thử lại sau.'
      : `Lỗi AI: ${msg.substring(0, 300) || 'Unknown error'}`,
  };
}

// ─── Main Call ───────────────────────────────────────────────────────
export async function callChatJSON<T = any>(options: ChatCallOptions): Promise<T> {
  const { systemPrompt, userPrompt, temperature = AI_TEMPERATURE, maxRetries = 1 } = options;

  let client;
  try {
    client = getChatAIClient();
  } catch (err) {
    return handleAIError(err);
  }

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: CHAT_MODEL,
        temperature,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const text = response.choices?.[0]?.message?.content ?? '';
      if (!text.trim()) {
        throw new Error('AI trả response rỗng');
      }

      try {
        return parseAIJsonResponse(text) as T;
      } catch (jsonErr) {
        if (attempt < maxRetries) {
          console.warn('[AI Provider] JSON parse failed, retrying...', (jsonErr as Error).message);
          continue;
        }
        throw { code: 'AI_PARSE_ERROR', message: 'AI trả dữ liệu không đúng định dạng JSON.' };
      }
    } catch (err: any) {
      lastError = err;
      if (err.code?.startsWith?.('AI_')) throw err; // Already formatted

      const status = err?.status || err?.response?.status;
      if (status === 429 || err?.code === 'AI_PARSE_ERROR') break; // Don't retry rate limits

      if (attempt < maxRetries) {
        console.warn('[AI Provider] Network error, retrying in 800ms...', err.message?.substring(0, 100));
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }
    }
  }

  return handleAIError(lastError);
}

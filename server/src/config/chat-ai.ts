import OpenAI from 'openai';

export const CHAT_MODEL = process.env.CHAT_MODEL || 'gpt-4o-mini';
export const AI_TEMPERATURE = parseFloat(process.env.AI_TEMPERATURE || '0.3');
export const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '30000', 10);

let _client: OpenAI | null = null;

export function getChatAIClient(): OpenAI {
  if (_client) return _client;

  const apiKey = process.env.CHAT_API_KEY;
  const baseURL = process.env.CHAT_API_BASE_URL;

  if (!apiKey) {
    throw new Error('Missing CHAT_API_KEY in server/.env');
  }

  _client = new OpenAI({
    apiKey,
    baseURL: baseURL || 'https://api.openai.com/v1',
    timeout: AI_TIMEOUT_MS,
  });

  return _client;
}

/** Reset client (useful when env changes at runtime) */
export function resetChatAIClient(): void {
  _client = null;
}

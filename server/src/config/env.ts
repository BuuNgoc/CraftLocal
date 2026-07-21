import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  API_URL: process.env.API_URL || 'http://localhost:5000',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  MAIL_HOST: process.env.MAIL_HOST || 'smtp.gmail.com',
  MAIL_PORT: parseInt(process.env.MAIL_PORT || '587', 10),
  MAIL_USER: process.env.MAIL_USER || '',
  MAIL_PASS: process.env.MAIL_PASS || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',

  // payOS
  PAYOS_CLIENT_ID: process.env.PAYOS_CLIENT_ID || '',
  PAYOS_API_KEY: process.env.PAYOS_API_KEY || '',
  PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY || '',
  PAYOS_RETURN_URL: process.env.PAYOS_RETURN_URL || 'http://localhost:5173/payment/payos-return',
  PAYOS_CANCEL_URL: process.env.PAYOS_CANCEL_URL || 'http://localhost:5173/payment/payos-cancel',

  // Chat AI (OpenAI-compatible)
  CHAT_API_KEY: process.env.CHAT_API_KEY || '',
  CHAT_API_BASE_URL: process.env.CHAT_API_BASE_URL || 'https://api.openai.com/v1',
  CHAT_MODEL: process.env.CHAT_MODEL || 'gpt-4o-mini',
  AI_TEMPERATURE: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
  AI_TIMEOUT_MS: parseInt(process.env.AI_TIMEOUT_MS || '30000', 10),
  AI_MAX_CONTEXT_WORKSHOPS: parseInt(process.env.AI_MAX_CONTEXT_WORKSHOPS || '12', 10),
  AI_MAX_CONTEXT_PRODUCTS: parseInt(process.env.AI_MAX_CONTEXT_PRODUCTS || '8', 10),
  AI_CACHE_TTL_SECONDS: parseInt(process.env.AI_CACHE_TTL_SECONDS || '300', 10),
};

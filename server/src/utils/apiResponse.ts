import { Response } from 'express';

export const sendSuccess = (res: Response, message: string, data?: any, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

export const sendError = (res: Response, message: string, statusCode = 400, code?: string) => {
  return res.status(statusCode).json({ success: false, message, code });
};

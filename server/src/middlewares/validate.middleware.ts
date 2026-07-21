import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/apiResponse';
import { env } from '../config/env';

export const validate = (schema: ZodSchema, source: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Log request body in development
    if (env.NODE_ENV === 'development' && source === 'body') {
      console.log(`[Validate] ${req.method} ${req.path} body:`, JSON.stringify(req.body, null, 2));
    }

    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fieldErrors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      const message = fieldErrors.map(e => e.message).join(', ');

      if (env.NODE_ENV === 'development') {
        console.log(`[Validate] Validation failed:`, JSON.stringify(fieldErrors, null, 2));
      }

      res.status(400).json({
        success: false,
        message: `Dữ liệu không hợp lệ: ${message}`,
        errors: fieldErrors,
      });
      return;
    }
    req[source] = result.data;
    next();
  };
};

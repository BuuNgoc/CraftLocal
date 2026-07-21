/**
 * Optional Auth Middleware
 * Parses JWT if present but does NOT block unauthenticated requests.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { env } from '../config/env';

export const optionalAuthMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string };
      const user = await User.findById(decoded.userId);
      if (user && user.status !== 'BLOCKED') {
        req.user = user;
      }
    }
  } catch {
    // Silently ignore invalid tokens — user just proceeds as anonymous
  }
  next();
};

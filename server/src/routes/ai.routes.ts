import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { optionalAuthMiddleware } from '../middlewares/optionalAuth.middleware';
import {
  aiHealth,
  aiChat,
  aiRecommendWorkshops,
  aiGenerateItinerary,
  aiGenerateDescription,
  aiTrack,
} from '../controllers/ai.controller';

const router = Router();

// Public
router.get('/health', aiHealth);

// Optional auth (works for both logged-in and guest)
router.post('/chat', optionalAuthMiddleware, aiChat);
router.post('/recommend-workshops', optionalAuthMiddleware, aiRecommendWorkshops);
router.post('/generate-itinerary', optionalAuthMiddleware, aiGenerateItinerary);

// Auth required — HOST only
router.post('/generate-description', authMiddleware, aiGenerateDescription);

// Tracking
router.post('/track', optionalAuthMiddleware, aiTrack);

export default router;

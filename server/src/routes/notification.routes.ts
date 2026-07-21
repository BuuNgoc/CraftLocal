import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearRead,
} from '../controllers/notification.controller';

const router = Router();

// Tất cả routes cần authentication
router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);

// Đặt read-all và clear-read TRƯỚC /:id để tránh conflict
router.put('/read-all', markAllAsRead);
router.delete('/clear-read', clearRead);

router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;

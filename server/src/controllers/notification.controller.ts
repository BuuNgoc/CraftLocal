import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { NotificationService } from '../services/notification.service';

/**
 * GET /api/notifications
 * Lấy danh sách thông báo của user đang đăng nhập
 */
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const result = await NotificationService.getUserNotifications(
    req.user!._id.toString(),
    {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      type: String(req.query.type || ''),
      isRead: String(req.query.isRead || ''),
      priority: String(req.query.priority || ''),
    }
  );
  sendSuccess(res, 'Lấy danh sách thông báo thành công', result);
});

/**
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const unreadCount = await NotificationService.countUnread(req.user!._id.toString());
  sendSuccess(res, 'Lấy số thông báo chưa đọc', { unreadCount });
});

/**
 * PUT /api/notifications/:id/read
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await NotificationService.markAsRead(
    req.user!._id.toString(),
    String(req.params.id)
  );
  if (!notification) return sendError(res, 'Thông báo không tồn tại', 404);
  sendSuccess(res, 'Đánh dấu đã đọc', notification);
});

/**
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await NotificationService.markAllAsRead(req.user!._id.toString());
  sendSuccess(res, 'Đánh dấu tất cả đã đọc', { modifiedCount: result.modifiedCount });
});

/**
 * DELETE /api/notifications/:id
 */
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const result = await NotificationService.deleteNotification(
    req.user!._id.toString(),
    String(req.params.id)
  );
  if (!result) return sendError(res, 'Thông báo không tồn tại', 404);
  sendSuccess(res, 'Xóa thông báo thành công');
});

/**
 * DELETE /api/notifications/clear-read
 */
export const clearRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await NotificationService.clearRead(req.user!._id.toString());
  sendSuccess(res, 'Xóa thông báo đã đọc thành công', { deletedCount: result.deletedCount });
});

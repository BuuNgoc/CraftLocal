import Notification, { NotificationType, NotificationPriority } from '../models/notification.model';
import User from '../models/user.model';

interface CreateNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedType?: string;
  relatedId?: string;
  actionUrl?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Tạo 1 notification cho user
   */
  static async createNotification(data: CreateNotificationPayload) {
    if (!data.userId) {
      console.warn('[NotificationService] Bỏ qua: thiếu userId');
      return null;
    }

    try {
      const notification = await Notification.create({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        relatedType: data.relatedType,
        relatedId: data.relatedId,
        actionUrl: data.actionUrl,
        priority: data.priority || 'NORMAL',
        metadata: data.metadata,
      });

      console.log(`[Notification] ✅ ${data.type} → user ${data.userId}: "${data.title}"`);
      return notification;
    } catch (err: any) {
      console.error(`[NotificationService] Lỗi tạo notification: ${err.message}`);
      return null;
    }
  }

  /**
   * Tạo nhiều notification cùng lúc
   */
  static async createManyNotifications(list: CreateNotificationPayload[]) {
    const results = await Promise.allSettled(
      list.map((item) => NotificationService.createNotification(item))
    );
    return results
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => (r as PromiseFulfilledResult<any>).value);
  }

  /**
   * Gửi notification cho 1 user cụ thể
   */
  static async notifyUser(
    userId: string,
    payload: Omit<CreateNotificationPayload, 'userId'>
  ) {
    return NotificationService.createNotification({ userId, ...payload });
  }

  /**
   * Gửi notification cho tất cả Admin
   */
  static async notifyAdmin(payload: Omit<CreateNotificationPayload, 'userId'>) {
    try {
      const admins = await User.find({ role: 'ADMIN', status: 'ACTIVE' }).select('_id');
      const notifications = admins.map((admin) => ({
        userId: admin._id.toString(),
        ...payload,
      }));
      return NotificationService.createManyNotifications(notifications);
    } catch (err: any) {
      console.error(`[NotificationService] notifyAdmin error: ${err.message}`);
      return [];
    }
  }

  /**
   * Gửi notification cho Host cụ thể
   */
  static async notifyHost(
    hostId: string,
    payload: Omit<CreateNotificationPayload, 'userId'>
  ) {
    return NotificationService.notifyUser(hostId, payload);
  }

  /**
   * Gửi notification cho Tour Guide cụ thể
   */
  static async notifyTourGuide(
    guideId: string,
    payload: Omit<CreateNotificationPayload, 'userId'>
  ) {
    return NotificationService.notifyUser(guideId, payload);
  }

  /**
   * Lấy danh sách notification của user (paginated)
   */
  static async getUserNotifications(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      type?: string;
      isRead?: string;
      priority?: string;
    } = {}
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: any = { userId };
    if (query.type) filter.type = query.type;
    if (query.isRead === 'true') filter.isRead = true;
    if (query.isRead === 'false') filter.isRead = false;
    if (query.priority) filter.priority = query.priority;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Đếm số thông báo chưa đọc
   */
  static async countUnread(userId: string) {
    return Notification.countDocuments({ userId, isRead: false });
  }

  /**
   * Đánh dấu 1 notification đã đọc
   */
  static async markAsRead(userId: string, notificationId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    return notification;
  }

  /**
   * Đánh dấu tất cả notification đã đọc
   */
  static async markAllAsRead(userId: string) {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return result;
  }

  /**
   * Xóa 1 notification
   */
  static async deleteNotification(userId: string, notificationId: string) {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });
    return result;
  }

  /**
   * Xóa tất cả notification đã đọc
   */
  static async clearRead(userId: string): Promise<{ deletedCount?: number }> {
    const result = await Notification.deleteMany({ userId, isRead: true });
    return result;
  }
}

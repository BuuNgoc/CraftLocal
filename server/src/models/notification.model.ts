import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'BOOKING'
  | 'ORDER'
  | 'PAYMENT'
  | 'SYSTEM'
  | 'REVIEW'
  | 'TIMESLOT'
  | 'HOST_APPLICATION'
  | 'CHECK_IN';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  relatedType?: string;
  relatedId?: mongoose.Types.ObjectId;
  actionUrl?: string;
  isRead: boolean;
  readAt?: Date;
  priority: NotificationPriority;
  metadata?: Record<string, any>;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['BOOKING', 'ORDER', 'PAYMENT', 'SYSTEM', 'REVIEW', 'TIMESLOT', 'HOST_APPLICATION', 'CHECK_IN'],
      required: true,
    },
    relatedType: { type: String },
    relatedId: { type: Schema.Types.ObjectId },
    actionUrl: { type: String },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    priority: { type: String, enum: ['LOW', 'NORMAL', 'HIGH'], default: 'NORMAL' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });

export default mongoose.model<INotification>('Notification', notificationSchema);

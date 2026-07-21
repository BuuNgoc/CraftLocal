import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  paymentCode: string;
  userId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  amount: number;
  method: 'PAYOS';
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
  provider: 'PAYOS';
  orderCode: number;
  paymentLinkId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  transactionCode?: string;
  payosResponse?: Record<string, any>;
  webhookData?: Record<string, any>;
  paidAt?: Date;
  cancelledAt?: Date;
  expiredAt?: Date;
  refundedAt?: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    paymentCode: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['PAYOS'], default: 'PAYOS' },
    paymentStatus: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED'], default: 'PENDING' },
    provider: { type: String, enum: ['PAYOS'], default: 'PAYOS' },
    orderCode: { type: Number, required: true, unique: true },
    paymentLinkId: String,
    checkoutUrl: String,
    qrCode: String,
    transactionCode: String,
    payosResponse: Schema.Types.Mixed,
    webhookData: Schema.Types.Mixed,
    paidAt: Date,
    cancelledAt: Date,
    expiredAt: Date,
    refundedAt: Date,
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1 });
paymentSchema.index({ bookingId: 1 }, { sparse: true });
paymentSchema.index({ orderId: 1 }, { sparse: true });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ provider: 1 });

export default mongoose.model<IPayment>('Payment', paymentSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  bookingId: mongoose.Types.ObjectId;
  touristId: mongoose.Types.ObjectId;
  workshopId: mongoose.Types.ObjectId;
  timeslotId: mongoose.Types.ObjectId;
  qrToken: string;
  checkInCode: string;
  qrCodeImage?: string;
  status: 'PENDING_PAYMENT' | 'UNUSED' | 'USED' | 'EXPIRED' | 'CANCELLED';
  usedAt?: Date;
  checkedBy?: mongoose.Types.ObjectId;
  expiredAt?: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    touristId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    workshopId: { type: Schema.Types.ObjectId, ref: 'Workshop', required: true },
    timeslotId: { type: Schema.Types.ObjectId, ref: 'Timeslot', required: true },
    qrToken: { type: String, required: true, unique: true },
    checkInCode: { type: String, required: true, unique: true },
    qrCodeImage: { type: String },
    status: { type: String, enum: ['PENDING_PAYMENT', 'UNUSED', 'USED', 'EXPIRED', 'CANCELLED'], default: 'PENDING_PAYMENT' },
    usedAt: Date,
    checkedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    expiredAt: Date,
  },
  { timestamps: true }
);

ticketSchema.index({ touristId: 1 });
ticketSchema.index({ workshopId: 1 });
ticketSchema.index({ timeslotId: 1 });
ticketSchema.index({ status: 1 });

export default mongoose.model<ITicket>('Ticket', ticketSchema);

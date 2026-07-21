import Booking from '../models/booking.model';
import Payment from '../models/payment.model';
import Ticket from '../models/ticket.model';
import Timeslot from '../models/timeslot.model';

/**
 * Release slot khi booking bị hủy/expired
 * Trả lại availableSlots, cập nhật status nếu cần
 */
async function releaseSlot(timeslotId: any, quantity: number) {
  const ts = await Timeslot.findById(timeslotId);
  if (!ts) return;

  ts.bookedSlots = Math.max(0, ts.bookedSlots - quantity);
  ts.availableSlots = ts.totalSlots - ts.bookedSlots;

  // Chỉ set lại AVAILABLE nếu timeslot chưa qua
  if (ts.availableSlots > 0 && ts.status === 'FULL') {
    const now = new Date();
    if (new Date(ts.startTime).getTime() > now.getTime()) {
      ts.status = 'AVAILABLE';
    }
  }

  await ts.save();
  console.log(`[SlotRelease] Timeslot ${ts._id}: released ${quantity} slots → available=${ts.availableSlots}`);
}

/**
 * Expire 1 booking cụ thể (dùng cho cron job)
 */
export async function expireSingleBooking(bookingId: any, reason = 'PAYMENT_TIMEOUT') {
  const booking = await Booking.findById(bookingId);
  if (!booking || booking.bookingStatus !== 'PENDING_PAYMENT') return;

  // 1. Expire booking
  booking.bookingStatus = 'EXPIRED';
  booking.cancelReason = reason;
  booking.cancelledAt = new Date();
  await booking.save();

  // 2. Expire payment
  await Payment.updateMany(
    { bookingId: booking._id, paymentStatus: 'PENDING' },
    { paymentStatus: 'EXPIRED', expiredAt: new Date() }
  );

  // 3. Expire/cancel ticket
  await Ticket.updateMany(
    { bookingId: booking._id, status: { $in: ['PENDING_PAYMENT', 'UNUSED'] } },
    { status: 'CANCELLED', expiredAt: new Date() }
  );

  // 4. Release slot
  await releaseSlot(booking.timeslotId, booking.quantity);

  console.log(`[BookingExpiry] Booking ${booking.bookingCode} expired (${reason})`);
}

/**
 * Tìm và expire tất cả booking PENDING_PAYMENT đã hết hạn
 * Được gọi bởi cron job mỗi phút
 */
export async function expirePendingBookings() {
  const now = new Date();

  const expiredBookings = await Booking.find({
    bookingStatus: 'PENDING_PAYMENT',
    expiresAt: { $lte: now },
  });

  if (expiredBookings.length === 0) return;

  console.log(`[BookingExpiry] Found ${expiredBookings.length} expired pending bookings`);

  for (const booking of expiredBookings) {
    try {
      await expireSingleBooking(booking._id, 'PAYMENT_TIMEOUT');
    } catch (err: any) {
      console.error(`[BookingExpiry] Error expiring booking ${booking._id}:`, err.message);
    }
  }

  console.log(`[BookingExpiry] Processed ${expiredBookings.length} expired bookings`);
}

/**
 * Hủy thanh toán booking — gọi khi user bấm "Hủy thanh toán"
 */
export async function cancelBookingPayment(bookingId: string, userId?: string) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Booking không tồn tại');

  // Chỉ hủy nếu đang PENDING_PAYMENT
  if (booking.bookingStatus !== 'PENDING_PAYMENT') {
    throw new Error('Booking không ở trạng thái chờ thanh toán');
  }

  // Kiểm tra quyền nếu có userId
  if (userId && booking.touristId.toString() !== userId) {
    throw new Error('Không có quyền hủy booking này');
  }

  // 1. Cancel booking
  booking.bookingStatus = 'CANCELLED';
  booking.cancelReason = 'USER_CANCELLED_PAYMENT';
  booking.cancelledAt = new Date();
  await booking.save();

  // 2. Cancel payment
  await Payment.updateMany(
    { bookingId: booking._id, paymentStatus: 'PENDING' },
    { paymentStatus: 'CANCELLED', cancelledAt: new Date() }
  );

  // 3. Cancel ticket
  await Ticket.updateMany(
    { bookingId: booking._id, status: { $in: ['PENDING_PAYMENT', 'UNUSED'] } },
    { status: 'CANCELLED' }
  );

  // 4. Release slot
  await releaseSlot(booking.timeslotId, booking.quantity);

  console.log(`[BookingCancel] Booking ${booking.bookingCode} cancelled by user`);
  return booking;
}

/**
 * Cleanup: migrate booking PENDING cũ (trước khi có expiresAt) sang EXPIRED
 */
export async function cleanupLegacyPendingBookings() {
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);

  // Tìm booking PENDING (status cũ) hoặc PENDING_PAYMENT mà không có expiresAt và đã tạo > 10 phút
  const legacyBookings = await Booking.find({
    bookingStatus: { $in: ['PENDING', 'PENDING_PAYMENT'] },
    createdAt: { $lte: tenMinAgo },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $lte: new Date() } },
    ],
  });

  console.log(`[Cleanup] Found ${legacyBookings.length} legacy pending bookings to expire`);

  for (const booking of legacyBookings) {
    try {
      // Set PENDING_PAYMENT so expireSingleBooking can process it
      if (booking.bookingStatus === 'PENDING') {
        booking.bookingStatus = 'PENDING_PAYMENT';
        await booking.save();
      }
      await expireSingleBooking(booking._id, 'LEGACY_CLEANUP');
    } catch (err: any) {
      console.error(`[Cleanup] Error processing booking ${booking._id}:`, err.message);
    }
  }

  return legacyBookings.length;
}

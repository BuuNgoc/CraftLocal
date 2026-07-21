import Timeslot from '../models/timeslot.model';
import Booking from '../models/booking.model';
import Payment from '../models/payment.model';
import Workshop from '../models/workshop.model';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from './notification.service';

const BOOKING_EXPIRY_MINUTES = 10;
const BOOKING_BUFFER_MINUTES = 5; // không cho đặt nếu timeslot bắt đầu trong 5 phút tới

export class BookingService {
  /**
   * Tạo booking: validate thời gian, chống duplicate, reserve slot ngay
   */
  static async createBooking(touristId: string, timeslotId: string, quantity: number) {
    // 1. Tìm timeslot
    const timeslot = await Timeslot.findById(timeslotId);
    if (!timeslot) {
      throw new Error('Khung giờ không tồn tại');
    }

    // 2. Validate timeslot status
    if (!['AVAILABLE'].includes(timeslot.status)) {
      throw new Error('Khung giờ không khả dụng');
    }

    // 3. ★ VALIDATE THỜI GIAN QUÁ KHỨ ★
    const now = new Date();
    const bufferMs = BOOKING_BUFFER_MINUTES * 60 * 1000;
    const slotStart = new Date(timeslot.startTime).getTime();

    if (slotStart <= now.getTime() + bufferMs) {
      throw new Error('Khung giờ này đã qua hoặc sắp bắt đầu, vui lòng chọn khung giờ khác.');
    }

    // 4. Validate số chỗ
    if (timeslot.availableSlots < quantity) {
      throw new Error('Không đủ chỗ trống trong khung giờ này');
    }

    // 5. ★ CHỐNG DUPLICATE PENDING BOOKING ★
    const existingPending = await Booking.findOne({
      touristId,
      timeslotId,
      bookingStatus: 'PENDING_PAYMENT',
      expiresAt: { $gt: now },
    });

    if (existingPending) {
      // Trả lại booking cũ + payment nếu có
      const existingPayment = await Payment.findOne({
        bookingId: existingPending._id,
        paymentStatus: 'PENDING',
      });

      return {
        booking: existingPending,
        payment: existingPayment,
        reusePendingBooking: true,
        expiresAt: existingPending.expiresAt,
        remainingSeconds: Math.max(0, Math.floor(
          ((existingPending.expiresAt as Date).getTime() - now.getTime()) / 1000
        )),
      };
    }

    // 6. Tìm workshop
    const workshop = await Workshop.findById(timeslot.workshopId);
    if (!workshop) throw new Error('Workshop không tồn tại');

    // 7. Tạo booking
    const bookingCode = `BK-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;
    const unitPrice = timeslot.price || workshop.price || 0;
    if (unitPrice <= 0) {
      throw new Error('Giá workshop không hợp lệ. Vui lòng liên hệ chủ xưởng.');
    }
    const totalPrice = unitPrice * quantity;
    const expiresAt = new Date(Date.now() + BOOKING_EXPIRY_MINUTES * 60 * 1000);

    const booking = await Booking.create({
      bookingCode,
      touristId,
      workshopId: timeslot.workshopId,
      timeslotId: timeslot._id,
      hostId: timeslot.hostId,
      quantity,
      unitPrice,
      totalPrice,
      bookingStatus: 'PENDING_PAYMENT',
      expiresAt,
    });

    // 8. ★ RESERVE SLOT NGAY ★
    timeslot.bookedSlots += quantity;
    timeslot.availableSlots = timeslot.totalSlots - timeslot.bookedSlots;
    if (timeslot.availableSlots <= 0) {
      timeslot.availableSlots = 0;
      timeslot.status = 'FULL';
    }
    await timeslot.save();

    // 9. 🔔 Notifications
    NotificationService.notifyUser(touristId, {
      title: 'Đã tạo booking',
      message: `Booking ${workshop.title} đã được tạo. Vui lòng thanh toán trong ${BOOKING_EXPIRY_MINUTES} phút để nhận vé QR.`,
      type: 'BOOKING',
      relatedType: 'BOOKING',
      relatedId: booking._id.toString(),
      actionUrl: '/my-bookings',
    }).catch(() => {});

    NotificationService.notifyHost(timeslot.hostId.toString(), {
      title: 'Có booking mới',
      message: `Khách vừa đặt ${quantity} chỗ workshop ${workshop.title}.`,
      type: 'BOOKING',
      relatedType: 'BOOKING',
      relatedId: booking._id.toString(),
      actionUrl: '/host/timeslots',
    }).catch(() => {});

    return {
      booking,
      reusePendingBooking: false,
      expiresAt,
      remainingSeconds: BOOKING_EXPIRY_MINUTES * 60,
    };
  }
}

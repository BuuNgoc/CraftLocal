import crypto from 'crypto';
import Ticket from '../models/ticket.model';
import Booking from '../models/booking.model';
import Timeslot from '../models/timeslot.model';
import { NotificationService } from './notification.service';

/**
 * Generate a short, human-readable, unique check-in code
 * Format: CL-XXXXXX (6 chars alphanumeric uppercase)
 */
function generateCheckInCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude confusing chars: I,O,0,1
  let code = 'CL-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return code;
}

/**
 * Generate a unique check-in code, retrying if collision occurs
 */
async function generateUniqueCheckInCode(maxRetries = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateCheckInCode();
    const exists = await Ticket.findOne({ checkInCode: code });
    if (!exists) return code;
  }
  // Fallback: use timestamp-based code
  return `CL-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export class QRService {
  /**
   * Tạo ticket QR + checkInCode sau khi thanh toán thành công
   */
  static async createTicket(bookingId: string) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error('Booking không tồn tại');

    // Kiểm tra đã có ticket chưa
    const existingTicket = await Ticket.findOne({ bookingId });
    if (existingTicket) {
      // Nếu ticket cũ thiếu checkInCode thì bổ sung
      if (!existingTicket.checkInCode) {
        existingTicket.checkInCode = await generateUniqueCheckInCode();
        await existingTicket.save();
        console.log(`[QRService] Backfilled checkInCode for ticket ${existingTicket._id}`);
      }
      return existingTicket;
    }

    const timeslot = await Timeslot.findById(booking.timeslotId);

    // Generate unique qrToken using bookingCode
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    const qrToken = `QR-${booking.bookingCode}-${randomPart}`;

    // Generate unique checkInCode
    const checkInCode = await generateUniqueCheckInCode();

    const ticket = await Ticket.create({
      bookingId: booking._id,
      touristId: booking.touristId,
      workshopId: booking.workshopId,
      timeslotId: booking.timeslotId,
      qrToken,
      checkInCode,
      status: 'UNUSED',
      expiredAt: timeslot?.endTime || undefined,
    });

    // Gắn ticketId vào booking
    booking.ticketId = ticket._id as any;
    await booking.save();

    return ticket;
  }

  /**
   * Check-in bằng QR token hoặc check-in code
   * Unified: nhận 1 field `code` và tìm theo cả qrToken và checkInCode
   */
  static async checkIn(code: string, tourGuideId: string) {
    // Tìm ticket bằng qrToken hoặc checkInCode
    const ticket = await Ticket.findOne({
      $or: [
        { qrToken: code },
        { checkInCode: code },
      ],
    });

    if (!ticket) throw new Error('Mã QR hoặc mã check-in không hợp lệ');
    if (ticket.status === 'PENDING_PAYMENT') throw new Error('Vé chưa được thanh toán. Vui lòng thanh toán trước khi check-in.');
    if (ticket.status === 'USED') throw new Error('Vé này đã được sử dụng');
    if (ticket.status === 'CANCELLED') throw new Error('Vé này đã bị hủy');
    if (ticket.status === 'EXPIRED') throw new Error('Vé này đã hết hạn');

    const booking = await Booking.findById(ticket.bookingId)
      .populate('workshopId', 'title');
    if (!booking) throw new Error('Không tìm thấy booking');
    if (booking.bookingStatus !== 'PAID') {
      throw new Error('Booking chưa thanh toán hoặc không hợp lệ');
    }

    const timeslot = await Timeslot.findById(ticket.timeslotId);
    if (!timeslot) throw new Error('Không tìm thấy khung giờ');
    if (timeslot.status === 'CANCELLED') throw new Error('Khung giờ đã bị hủy');

    if (!timeslot.tourGuideId) {
      throw new Error('Khung giờ này chưa được gán hướng dẫn viên');
    }
    if (timeslot.tourGuideId.toString() !== tourGuideId) {
      throw new Error('Bạn không được phân công check-in cho khung giờ này');
    }

    // Check-in thành công
    ticket.status = 'USED';
    ticket.usedAt = new Date();
    ticket.checkedBy = tourGuideId as any;
    await ticket.save();

    // Update booking status
    booking.bookingStatus = 'CHECKED_IN';
    booking.checkedInAt = new Date();
    booking.checkedInBy = tourGuideId as any;
    await booking.save();

    // 🔔 Notifications
    const workshopTitle = (booking.workshopId as any)?.title || 'Workshop';

    // Notify tourist
    NotificationService.notifyUser(booking.touristId.toString(), {
      title: 'Check-in thành công',
      message: `Bạn đã check-in thành công tại ${workshopTitle}.`,
      type: 'CHECK_IN',
      relatedType: 'BOOKING',
      relatedId: booking._id.toString(),
      actionUrl: '/my-bookings',
    }).catch(() => {});

    // Notify host
    NotificationService.notifyHost(booking.hostId.toString(), {
      title: 'Khách đã check-in',
      message: `Một khách đã check-in tại ${workshopTitle}.`,
      type: 'CHECK_IN',
      relatedType: 'BOOKING',
      relatedId: booking._id.toString(),
      actionUrl: '/host/timeslots',
    }).catch(() => {});

    return {
      ticket,
      booking,
      customer: {
        fullName: booking.customerInfo?.fullName || '',
        phone: booking.customerInfo?.phone || '',
        email: booking.customerInfo?.email || '',
      },
      workshop: {
        title: (booking.workshopId as any)?.title || '',
      },
      timeslot: {
        startTime: timeslot.startTime,
        endTime: timeslot.endTime,
      },
    };
  }
}

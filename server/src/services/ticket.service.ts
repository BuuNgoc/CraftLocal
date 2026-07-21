import crypto from 'crypto';
import Ticket, { ITicket } from '../models/ticket.model';
import Booking, { IBooking } from '../models/booking.model';
import Timeslot from '../models/timeslot.model';

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
async function generateUniqueCheckInCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateCheckInCode();
    const exists = await Ticket.findOne({ checkInCode: code });
    if (!exists) return code;
  }
  // Fallback: use timestamp-based code
  return `CL-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

/**
 * Generate a unique QR token based on bookingCode
 */
function generateQrToken(bookingCode: string): string {
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `QR-${bookingCode}-${randomPart}`;
}

/**
 * Đảm bảo ticket tồn tại cho một booking đã PAID/CHECKED_IN/COMPLETED.
 * Idempotent: nếu ticket đã có thì trả lại, không tạo trùng.
 * Nếu ticket thiếu checkInCode thì bổ sung.
 * Gắn booking.ticketId nếu chưa có.
 *
 * @returns ticket document
 */
export async function ensureTicketForBooking(booking: IBooking): Promise<ITicket> {
  // Chỉ tạo ticket cho booking đã thanh toán
  if (!['PAID', 'CHECKED_IN', 'COMPLETED'].includes(booking.bookingStatus)) {
    throw new Error(`Booking ${booking._id} chưa thanh toán (status: ${booking.bookingStatus}), không thể tạo vé`);
  }

  // 1. Nếu booking.ticketId đã có, thử tìm ticket
  let ticket: ITicket | null = null;
  if (booking.ticketId) {
    ticket = await Ticket.findById(booking.ticketId);
  }

  // 2. Fallback: tìm theo bookingId
  if (!ticket) {
    ticket = await Ticket.findOne({ bookingId: booking._id });
  }

  // 3. Nếu vẫn không có → tạo mới
  if (!ticket) {
    const timeslot = await Timeslot.findById(booking.timeslotId);

    ticket = await Ticket.create({
      bookingId: booking._id,
      touristId: booking.touristId,
      workshopId: booking.workshopId,
      timeslotId: booking.timeslotId,
      qrToken: generateQrToken(booking.bookingCode),
      checkInCode: await generateUniqueCheckInCode(),
      status: 'UNUSED',
      expiredAt: timeslot?.endTime || undefined,
    });

    console.log(`[TicketService] Tạo ticket mới ${ticket._id} cho booking ${booking._id}`);
  }

  // 4. Bổ sung checkInCode nếu ticket cũ thiếu
  if (!ticket.checkInCode) {
    ticket.checkInCode = await generateUniqueCheckInCode();
    await ticket.save();
    console.log(`[TicketService] Bổ sung checkInCode cho ticket ${ticket._id}`);
  }

  // 5. Gắn ticketId vào booking nếu chưa có hoặc sai
  if (!booking.ticketId || booking.ticketId.toString() !== ticket._id!.toString()) {
    booking.ticketId = ticket._id as any;
    await booking.save();
    console.log(`[TicketService] Gắn ticketId ${ticket._id} vào booking ${booking._id}`);
  }

  return ticket;
}

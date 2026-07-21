import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { BookingService } from '../services/booking.service';
import { cancelBookingPayment } from '../services/bookingExpiry.service';
import { ensureTicketForBooking } from '../services/ticket.service';
import Booking from '../models/booking.model';
import Ticket from '../models/ticket.model';
import Timeslot from '../models/timeslot.model';
import Workshop from '../models/workshop.model';
import Order from '../models/order.model';
import Notification from '../models/notification.model';
import Payment from '../models/payment.model';

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const { timeslotId, quantity } = req.body;
  const result = await BookingService.createBooking(req.user!._id.toString(), timeslotId, quantity);

  // ★ Ensure consistent response: always put bookingId + booking at top level ★
  const responseData = {
    booking: result.booking,
    bookingId: result.booking._id,
    reusePendingBooking: result.reusePendingBooking,
    expiresAt: result.expiresAt,
    remainingSeconds: result.remainingSeconds,
    payment: (result as any).payment || null,
  };

  if (result.reusePendingBooking) {
    return sendSuccess(res, 'Bạn đã có booking đang chờ thanh toán cho khung giờ này.', responseData);
  }

  sendSuccess(res, 'Đặt chỗ thành công! Vui lòng thanh toán trong 10 phút.', responseData, 201);
});

export const getMyBookings = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();

  // ★ Auto-expire: check bookings hết hạn trước khi trả list ★
  await Booking.updateMany(
    {
      touristId: req.user!._id,
      bookingStatus: 'PENDING_PAYMENT',
      expiresAt: { $lte: now },
    },
    {
      bookingStatus: 'EXPIRED',
      cancelReason: 'PAYMENT_TIMEOUT',
      cancelledAt: now,
    }
  );

  const bookings = await Booking.find({ touristId: req.user!._id })
    .populate('workshopId', 'title images location thumbnail')
    .populate('timeslotId', 'startTime endTime')
    .populate('hostId', 'fullName')
    .populate('paymentId', 'paymentStatus checkoutUrl orderCode')
    .sort({ createdAt: -1 });

  sendSuccess(res, 'Lấy danh sách đặt chỗ', bookings);
});

export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
  const booking = await Booking.findOne({ _id: req.params.id, touristId: req.user!._id })
    .populate('workshopId', 'title images')
    .populate('timeslotId', 'startTime endTime')
    .populate('hostId', 'fullName')
    .populate('paymentId', 'paymentStatus checkoutUrl orderCode');
  if (!booking) return sendError(res, 'Booking không tồn tại', 404);
  sendSuccess(res, 'Lấy thông tin booking', booking);
});

/**
 * GET /api/bookings/:id/ticket
 * Lấy vé điện tử cho tourist, bao gồm QR token, checkInCode, workshop và timeslot info
 * Self-repairing: nếu booking PAID nhưng thiếu ticket thì tự tạo
 */
export const getBookingTicket = asyncHandler(async (req: Request, res: Response) => {
  const bookingId = req.params.id;

  const booking = await Booking.findOne({ _id: bookingId, touristId: req.user!._id });
  if (!booking) {
    return sendError(res, 'Không tìm thấy thông tin đặt vé', 404);
  }

  // Chỉ cho xem vé nếu đã thanh toán
  if (!['PAID', 'CHECKED_IN', 'COMPLETED'].includes(booking.bookingStatus)) {
    return sendError(res, 'Booking chưa thanh toán nên chưa có vé', 400);
  }

  // Self-repairing: đảm bảo ticket tồn tại (tạo nếu thiếu, gắn ticketId nếu chưa có)
  let ticket;
  try {
    ticket = await ensureTicketForBooking(booking);
  } catch (err: any) {
    console.error(`[GetBookingTicket] Lỗi đảm bảo ticket: ${err.message}`);
    return sendError(res, `Không thể tạo vé: ${err.message}`, 500);
  }

  // Populate workshop và timeslot cho response
  const [workshop, timeslot] = await Promise.all([
    booking.workshopId
      ? Workshop.findById(booking.workshopId).select('title images location address').lean()
      : null,
    booking.timeslotId
      ? Timeslot.findById(booking.timeslotId).select('startTime endTime').lean()
      : null,
  ]);

  sendSuccess(res, 'Lấy vé điện tử thành công', {
    ticket: {
      _id: ticket._id,
      qrToken: ticket.qrToken,
      checkInCode: ticket.checkInCode,
      status: ticket.status,
      expiredAt: ticket.expiredAt,
      usedAt: ticket.usedAt,
      bookingId: ticket.bookingId,
      workshop: workshop || {},
      timeslot: timeslot || {},
    },
    booking: {
      _id: booking._id,
      bookingCode: booking.bookingCode,
      bookingStatus: booking.bookingStatus,
      quantity: booking.quantity,
      totalPrice: booking.totalPrice,
      customerInfo: booking.customerInfo,
    },
    bookingCode: booking.bookingCode,
    bookingStatus: booking.bookingStatus,
    quantity: booking.quantity,
    customerInfo: booking.customerInfo,
  });
});

/**
 * PUT /api/bookings/:id/cancel
 * ★ Hỗ trợ cả PENDING_PAYMENT (release slot) và PAID (release slot) ★
 */
export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await Booking.findOne({ _id: req.params.id, touristId: req.user!._id });
  if (!booking) return sendError(res, 'Booking không tồn tại', 404);

  // Nếu đang PENDING_PAYMENT → dùng cancelBookingPayment service
  if (booking.bookingStatus === 'PENDING_PAYMENT') {
    const cancelled = await cancelBookingPayment(booking._id.toString(), req.user!._id.toString());
    return sendSuccess(res, 'Đã hủy thanh toán và giải phóng chỗ đặt.', cancelled);
  }

  if (!['PENDING', 'PAID'].includes(booking.bookingStatus)) {
    return sendError(res, 'Không thể hủy booking ở trạng thái này');
  }

  const oldStatus = booking.bookingStatus;
  booking.bookingStatus = 'CANCELLED';
  booking.cancelReason = req.body.cancelReason || 'Khách hủy';
  booking.cancelledAt = new Date();
  await booking.save();

  // Release slot
  if (['PENDING', 'PAID'].includes(oldStatus)) {
    const ts = await Timeslot.findById(booking.timeslotId);
    if (ts) {
      ts.bookedSlots = Math.max(0, ts.bookedSlots - booking.quantity);
      ts.availableSlots = ts.totalSlots - ts.bookedSlots;
      if (ts.availableSlots > 0 && ts.status === 'FULL') {
        ts.status = 'AVAILABLE';
      }
      await ts.save();
    }
  }

  sendSuccess(res, 'Hủy booking thành công', booking);
});

/**
 * GET /api/bookings/dashboard
 * Tourist dashboard: lấy toàn bộ thống kê cá nhân từ MongoDB
 */
export const getTouristDashboard = asyncHandler(async (req: Request, res: Response) => {
  const touristId = req.user!._id;
  const now = new Date();

  const [
    totalBookings,
    upcomingBookingsCount,
    paidBookings,
    completedBookings,
    totalOrders,
    pendingOrders,
    completedOrders,
    unreadNotifications,
    // Recent data
    upcomingBookings,
    recentOrders,
    activeTickets,
    latestNotifications,
  ] = await Promise.all([
    Booking.countDocuments({ touristId }),
    Booking.countDocuments({
      touristId,
      bookingStatus: 'PAID',
    }),
    Booking.countDocuments({ touristId, bookingStatus: { $in: ['PAID', 'CHECKED_IN'] } }),
    Booking.countDocuments({ touristId, bookingStatus: 'COMPLETED' }),
    Order.countDocuments({ touristId }),
    Order.countDocuments({ touristId, orderStatus: { $in: ['PENDING', 'CONFIRMED'] } }),
    Order.countDocuments({ touristId, orderStatus: 'COMPLETED' }),
    Notification.countDocuments({ userId: touristId, isRead: false }),
    // Upcoming bookings (PAID, with future timeslot)
    Booking.find({ touristId, bookingStatus: 'PAID' })
      .populate('workshopId', 'title images thumbnail')
      .populate('timeslotId', 'startTime endTime')
      .sort({ createdAt: -1 })
      .limit(5),
    // Recent orders
    Order.find({ touristId })
      .sort({ createdAt: -1 })
      .limit(5),
    // Active tickets (UNUSED)
    Ticket.find({ touristId, status: 'UNUSED' })
      .populate('workshopId', 'title')
      .populate('timeslotId', 'startTime endTime')
      .sort({ createdAt: -1 })
      .limit(5),
    // Latest notifications
    Notification.find({ userId: touristId })
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  sendSuccess(res, 'Lấy dashboard tourist thành công', {
    stats: {
      totalBookings,
      upcomingBookings: upcomingBookingsCount,
      paidBookings,
      completedBookings,
      totalOrders,
      pendingOrders,
      completedOrders,
      unreadNotifications,
    },
    recent: {
      upcomingBookings,
      recentOrders,
      activeTickets,
      latestNotifications,
    },
  });
});

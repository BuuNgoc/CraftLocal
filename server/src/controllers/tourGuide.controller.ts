import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import Timeslot from '../models/timeslot.model';
import Booking from '../models/booking.model';
import Ticket from '../models/ticket.model';
import { QRService } from '../services/qr.service';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, 'Lấy thông tin thành công', req.user);
});

export const getSchedules = asyncHandler(async (req: Request, res: Response) => {
  const timeslots = await Timeslot.find({
    tourGuideId: req.user!._id,
  })
    .populate('workshopId', 'title address location images')
    .sort({ startTime: -1 });
  sendSuccess(res, 'Lấy lịch phân công', timeslots);
});

/**
 * GET /api/tour-guide/timeslots/:id/customers
 * Lấy danh sách khách đặt chỗ theo timeslot, bao gồm thông tin ticket + checkInCode
 */
export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  // Kiểm tra timeslot thuộc tour guide này
  const timeslot = await Timeslot.findOne({ _id: req.params.id, tourGuideId: req.user!._id });
  if (!timeslot) return sendError(res, 'Khung giờ không tồn tại hoặc không thuộc quyền của bạn', 404);

  const bookings = await Booking.find({
    timeslotId: timeslot._id,
    bookingStatus: { $in: ['PAID', 'CHECKED_IN', 'COMPLETED'] },
  })
    .populate('touristId', 'fullName email phone')
    .lean();

  // Lấy tickets cho các bookings
  const bookingIds = bookings.map((b) => b._id);
  const tickets = await Ticket.find({ bookingId: { $in: bookingIds } }).lean();
  const ticketMap = new Map(tickets.map((t) => [t.bookingId.toString(), t]));

  // Merge ticket info vào booking response
  const result = bookings.map((b) => {
    const ticket = ticketMap.get(b._id.toString());
    return {
      ...b,
      ticket: ticket
        ? {
            _id: ticket._id,
            status: ticket.status,
            checkInCode: ticket.checkInCode,
            qrToken: ticket.qrToken,
            usedAt: ticket.usedAt,
          }
        : null,
    };
  });

  sendSuccess(res, 'Lấy danh sách khách hàng', result);
});

/**
 * POST /api/tour-guide/check-in
 * Unified check-in: nhận field `code` (hoặc `qrToken` hoặc `checkInCode` cho backward compat)
 */
export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const code = req.body.code || req.body.qrToken || req.body.checkInCode;
  if (!code || !code.trim()) {
    return sendError(res, 'Vui lòng nhập mã QR hoặc mã check-in', 400);
  }

  try {
    const result = await QRService.checkIn(code.trim(), req.user!._id.toString());
    sendSuccess(res, 'Check-in thành công', result);
  } catch (err: any) {
    // Map error messages to appropriate HTTP status codes
    const msg = err.message || 'Check-in thất bại';
    if (msg.includes('không hợp lệ') || msg.includes('Không tìm thấy')) {
      return sendError(res, msg, 404);
    }
    if (msg.includes('không được phân công') || msg.includes('chưa được gán')) {
      return sendError(res, msg, 403);
    }
    return sendError(res, msg, 400);
  }
});

export const startTimeslot = asyncHandler(async (req: Request, res: Response) => {
  const timeslot = await Timeslot.findOneAndUpdate(
    { _id: req.params.id, tourGuideId: req.user!._id, status: { $in: ['AVAILABLE', 'FULL'] } },
    { status: 'ONGOING' },
    { new: true }
  );
  if (!timeslot) return sendError(res, 'Không thể bắt đầu khung giờ này', 400);
  sendSuccess(res, 'Bắt đầu khung giờ thành công', timeslot);
});

export const finishTimeslot = asyncHandler(async (req: Request, res: Response) => {
  const timeslot = await Timeslot.findOneAndUpdate(
    { _id: req.params.id, tourGuideId: req.user!._id, status: 'ONGOING' },
    { status: 'COMPLETED' },
    { new: true }
  );
  if (!timeslot) return sendError(res, 'Không thể kết thúc khung giờ này', 400);

  // Cập nhật tất cả booking CHECKED_IN thành COMPLETED
  await Booking.updateMany(
    { timeslotId: timeslot._id, bookingStatus: 'CHECKED_IN' },
    { bookingStatus: 'COMPLETED' }
  );

  sendSuccess(res, 'Kết thúc khung giờ thành công', timeslot);
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const guideId = req.user!._id;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [
    totalAssignedTimeslots,
    todaySchedules,
    upcomingSchedules,
    completedTimeslots,
    allMyTimeslots,
    // Today's timeslots with details
    todayTimeslots,
    // Recent check-ins
    recentCheckins,
  ] = await Promise.all([
    Timeslot.countDocuments({ tourGuideId: guideId }),
    Timeslot.countDocuments({
      tourGuideId: guideId,
      startTime: { $gte: todayStart, $lte: todayEnd },
    }),
    Timeslot.countDocuments({
      tourGuideId: guideId,
      startTime: { $gt: now },
      status: { $in: ['AVAILABLE', 'FULL'] },
    }),
    Timeslot.countDocuments({ tourGuideId: guideId, status: 'COMPLETED' }),
    Timeslot.find({ tourGuideId: guideId }),
    // Today's timeslots with populated workshop info
    Timeslot.find({
      tourGuideId: guideId,
      startTime: { $gte: todayStart, $lte: todayEnd },
    })
      .populate('workshopId', 'title address images locationLabel')
      .sort({ startTime: 1 }),
    // Recent check-ins (bookings that are CHECKED_IN in guide's timeslots)
    Booking.find({
      bookingStatus: { $in: ['CHECKED_IN', 'COMPLETED'] },
      checkedInBy: guideId,
    })
      .populate('touristId', 'fullName email avatar')
      .populate('workshopId', 'title')
      .populate('timeslotId', 'startTime endTime')
      .sort({ checkedInAt: -1 })
      .limit(10),
  ]);

  const timeslotIds = allMyTimeslots.map((ts) => ts._id);

  const bookings = await Booking.find({
    timeslotId: { $in: timeslotIds },
    bookingStatus: { $in: ['PAID', 'CHECKED_IN', 'COMPLETED'] },
  });

  const totalCustomers = bookings.reduce((sum, b) => sum + b.quantity, 0);
  const checkedInCustomers = bookings
    .filter((b) => ['CHECKED_IN', 'COMPLETED'].includes(b.bookingStatus))
    .reduce((sum, b) => sum + b.quantity, 0);
  const pendingCheckins = bookings
    .filter((b) => b.bookingStatus === 'PAID')
    .reduce((sum, b) => sum + b.quantity, 0);

  // Schedule by status chart
  const schedulesByStatus = await Timeslot.aggregate([
    { $match: { tourGuideId: guideId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  sendSuccess(res, 'Lấy dashboard thành công', {
    stats: {
      totalAssignedTimeslots,
      todaySchedules,
      upcomingSchedules,
      completedTimeslots,
      totalCustomers,
      checkedInCustomers,
      pendingCheckins,
    },
    charts: {
      schedulesByStatus: schedulesByStatus.map((s) => ({ status: s._id, count: s.count })),
    },
    recent: {
      todayTimeslots,
      recentCheckins,
    },
  });
});


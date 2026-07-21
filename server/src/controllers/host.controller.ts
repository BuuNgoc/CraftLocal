import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import User from '../models/user.model';
import Booking from '../models/booking.model';
import Order from '../models/order.model';
import Workshop from '../models/workshop.model';
import Timeslot from '../models/timeslot.model';
import Product from '../models/product.model';
import Payment from '../models/payment.model';
import Review from '../models/review.model';
import { NotificationService } from '../services/notification.service';
import mongoose from 'mongoose';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const hostId = req.user!._id;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Get all workshop IDs for this host
  const workshopIds = (await Workshop.find({ hostId }, '_id').lean()).map((w) => w._id);

  const [
    totalWorkshops,
    activeWorkshops,
    totalTimeslots,
    todayTimeslots,
    totalBookings,
    paidBookings,
    checkedInBookings,
    totalOrders,
    pendingOrders,
    totalProducts,
    outOfStockProducts,
    averageRatingAgg,
    // Revenue
    bookingRevenueAgg,
    orderRevenueAgg,
    monthlyBookingRevAgg,
    monthlyOrderRevAgg,
    // Charts
    bookingsByStatusAgg,
    ordersByStatusAgg,
    timeslotsByStatusAgg,
    // Recent
    upcomingTimeslots,
    recentBookings,
    recentOrders,
    latestReviews,
  ] = await Promise.all([
    Workshop.countDocuments({ hostId, status: { $ne: 'DELETED' } }),
    Workshop.countDocuments({ hostId, status: 'ACTIVE' }),
    Timeslot.countDocuments({ hostId }),
    Timeslot.countDocuments({ hostId, startTime: { $gte: todayStart, $lte: todayEnd } }),
    Booking.countDocuments({ hostId }),
    Booking.countDocuments({ hostId, bookingStatus: { $in: ['PAID', 'CHECKED_IN', 'COMPLETED'] } }),
    Booking.countDocuments({ hostId, bookingStatus: 'CHECKED_IN' }),
    Order.countDocuments({ hostId }),
    Order.countDocuments({ hostId, orderStatus: { $in: ['PENDING', 'CONFIRMED'] } }),
    Product.countDocuments({ hostId, status: { $ne: 'DELETED' } }),
    Product.countDocuments({ hostId, status: 'OUT_OF_STOCK' }),
    Workshop.aggregate([
      { $match: { hostId: new mongoose.Types.ObjectId(hostId), status: 'ACTIVE', totalReviews: { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: '$averageRating' } } },
    ]),
    // Total revenue from bookings (payments SUCCESS with bookingId belonging to host)
    Booking.aggregate([
      { $match: { hostId: new mongoose.Types.ObjectId(hostId), bookingStatus: { $in: ['PAID', 'CHECKED_IN', 'COMPLETED'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.aggregate([
      { $match: { hostId: new mongoose.Types.ObjectId(hostId), orderStatus: { $in: ['CONFIRMED', 'PACKING', 'SHIPPING', 'COMPLETED'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    // Monthly revenue
    Booking.aggregate([
      { $match: { hostId: new mongoose.Types.ObjectId(hostId), bookingStatus: { $in: ['PAID', 'CHECKED_IN', 'COMPLETED'] }, createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.aggregate([
      { $match: { hostId: new mongoose.Types.ObjectId(hostId), orderStatus: { $in: ['CONFIRMED', 'PACKING', 'SHIPPING', 'COMPLETED'] }, createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    // Chart: bookings by status
    Booking.aggregate([
      { $match: { hostId: new mongoose.Types.ObjectId(hostId) } },
      { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
    ]),
    // Chart: orders by status
    Order.aggregate([
      { $match: { hostId: new mongoose.Types.ObjectId(hostId) } },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),
    // Chart: timeslots by status
    Timeslot.aggregate([
      { $match: { hostId: new mongoose.Types.ObjectId(hostId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    // Recent: upcoming timeslots
    Timeslot.find({ hostId, startTime: { $gte: now } })
      .populate('workshopId', 'title')
      .populate('tourGuideId', 'fullName')
      .sort({ startTime: 1 })
      .limit(5),
    // Recent: bookings
    Booking.find({ hostId })
      .populate('touristId', 'fullName email')
      .populate('workshopId', 'title')
      .sort({ createdAt: -1 })
      .limit(5),
    // Recent: orders
    Order.find({ hostId })
      .populate('touristId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(5),
    // Recent: reviews
    Review.find({ hostId, status: 'VISIBLE' })
      .populate('touristId', 'fullName avatar')
      .populate('workshopId', 'title')
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  // Workshops without timeslots
  const workshopsWithTimeslots = await Timeslot.distinct('workshopId', { hostId });
  const workshopsNeedTimeslot = await Workshop.find({
    hostId,
    status: 'ACTIVE',
    _id: { $nin: workshopsWithTimeslots },
  }).select('title').lean();

  // Revenue by month chart
  const revenueByMonthBooking = await Booking.aggregate([
    { $match: { hostId: new mongoose.Types.ObjectId(hostId), bookingStatus: { $in: ['PAID', 'CHECKED_IN', 'COMPLETED'] } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$totalPrice' } } },
    { $sort: { _id: 1 } },
  ]);
  const revenueByMonthOrder = await Order.aggregate([
    { $match: { hostId: new mongoose.Types.ObjectId(hostId), orderStatus: { $in: ['CONFIRMED', 'PACKING', 'SHIPPING', 'COMPLETED'] } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' } } },
    { $sort: { _id: 1 } },
  ]);

  const monthlyRevenueMap: Record<string, number> = {};
  revenueByMonthBooking.forEach((item) => { monthlyRevenueMap[item._id] = (monthlyRevenueMap[item._id] || 0) + item.revenue; });
  revenueByMonthOrder.forEach((item) => { monthlyRevenueMap[item._id] = (monthlyRevenueMap[item._id] || 0) + item.revenue; });
  const revenueByMonth = Object.entries(monthlyRevenueMap)
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  const totalRevenue = (bookingRevenueAgg[0]?.total || 0) + (orderRevenueAgg[0]?.total || 0);
  const monthlyRevenue = (monthlyBookingRevAgg[0]?.total || 0) + (monthlyOrderRevAgg[0]?.total || 0);

  sendSuccess(res, 'Lấy dashboard thành công', {
    stats: {
      totalWorkshops,
      activeWorkshops,
      workshopsWithoutTimeslots: workshopsNeedTimeslot.length,
      totalTimeslots,
      todayTimeslots,
      totalBookings,
      paidBookings,
      checkedInBookings,
      totalOrders,
      pendingOrders,
      totalProducts,
      outOfStockProducts,
      totalRevenue,
      monthlyRevenue,
      averageRating: averageRatingAgg[0]?.avgRating || 0,
    },
    charts: {
      revenueByMonth,
      bookingsByStatus: bookingsByStatusAgg.map((b) => ({ status: b._id, count: b.count })),
      ordersByStatus: ordersByStatusAgg.map((o) => ({ status: o._id, count: o.count })),
      timeslotsByStatus: timeslotsByStatusAgg.map((t) => ({ status: t._id, count: t.count })),
    },
    recent: {
      upcomingTimeslots,
      bookings: recentBookings,
      orders: recentOrders,
      reviews: latestReviews,
      workshopsNeedTimeslot,
    },
  });
});

export const createTourGuide = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password, phone } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return sendError(res, 'Email đã được sử dụng');

  const tourGuide = await User.create({
    fullName,
    email,
    password,
    phone,
    role: 'TOUR_GUIDE',
    status: 'ACTIVE',
    hostId: req.user!._id,
    createdBy: req.user!._id,
  });

  const obj = tourGuide.toObject();
  const { password: _, ...result } = obj;
  sendSuccess(res, 'Tạo hướng dẫn viên thành công', result, 201);
});

export const getTourGuides = asyncHandler(async (req: Request, res: Response) => {
  const guides = await User.find({ role: 'TOUR_GUIDE', hostId: req.user!._id }).sort({ createdAt: -1 });
  sendSuccess(res, 'Lấy danh sách hướng dẫn viên', guides);
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ hostId: req.user!._id })
    .populate('touristId', 'fullName email phone')
    .sort({ createdAt: -1 });
  sendSuccess(res, 'Lấy danh sách đơn hàng', orders);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const order = await Order.findOne({ _id: req.params.id, hostId: req.user!._id });
  if (!order) return sendError(res, 'Đơn hàng không tồn tại', 404);

  const now = new Date();
  if (status === 'PACKING') order.packedAt = now;
  if (status === 'SHIPPING') order.shippedAt = now;
  if (status === 'COMPLETED') order.completedAt = now;
  if (status === 'CANCELLED') order.cancelledAt = now;

  order.orderStatus = status;
  await order.save();

  // 🔔 Notify tourist about order status change
  const STATUS_LABELS: Record<string, string> = {
    PACKING: 'Đang đóng gói',
    SHIPPING: 'Đang giao hàng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };
  NotificationService.notifyUser(order.touristId.toString(), {
    title: 'Cập nhật đơn hàng',
    message: `Đơn hàng ${order.orderCode} đã chuyển sang: ${STATUS_LABELS[status] || status}.`,
    type: 'ORDER',
    relatedType: 'ORDER',
    relatedId: order._id.toString(),
    actionUrl: '/my-orders',
  }).catch(() => {});

  sendSuccess(res, 'Cập nhật trạng thái đơn hàng thành công', order);
});

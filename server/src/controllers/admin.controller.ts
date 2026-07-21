import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import User from '../models/user.model';
import Workshop from '../models/workshop.model';
import Booking from '../models/booking.model';
import Order from '../models/order.model';
import Payment from '../models/payment.model';
import Timeslot from '../models/timeslot.model';
import Product from '../models/product.model';
import HostApplication from '../models/hostApplication.model';
import mongoose from 'mongoose';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role, status, page = '1', limit = '20' } = req.query;
  const filter: any = {};
  if (role) filter.role = role;
  if (status) filter.status = status;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const users = await User.find(filter).skip(skip).limit(parseInt(limit as string)).sort({ createdAt: -1 });
  const total = await User.countDocuments(filter);

  sendSuccess(res, 'Lấy danh sách người dùng thành công', { users, total, page: parseInt(page as string), limit: parseInt(limit as string) });
});

export const getPendingHosts = asyncHandler(async (_req: Request, res: Response) => {
  // Lấy từ HostApplication collection — đúng nghiệp vụ
  const applications = await HostApplication.find({ status: 'PENDING' })
    .populate('userId', 'fullName email avatar')
    .sort({ submittedAt: -1 });
  sendSuccess(res, 'Lấy danh sách hồ sơ chờ duyệt', applications);
});

export const approveHost = asyncHandler(async (req: Request, res: Response) => {
  const host = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'HOST', status: 'PENDING' },
    {
      status: 'ACTIVE',
      'hostProfile.approvedAt': new Date(),
      'hostProfile.approvedBy': req.user!._id,
    },
    { new: true }
  );
  if (!host) return sendError(res, 'Không tìm thấy Host hoặc đã được duyệt', 404);
  sendSuccess(res, 'Phê duyệt Host thành công', host);
});

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: 'BLOCKED' }, { new: true });
  if (!user) return sendError(res, 'Người dùng không tồn tại', 404);
  sendSuccess(res, 'Khóa tài khoản thành công', user);
});

export const unblockUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: 'ACTIVE' }, { new: true });
  if (!user) return sendError(res, 'Người dùng không tồn tại', 404);
  sendSuccess(res, 'Mở khóa tài khoản thành công', user);
});

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [
    totalUsers,
    totalTourists,
    totalHosts,
    totalGuides,
    pendingHostApplications,
    totalWorkshops,
    activeWorkshops,
    totalProducts,
    totalBookings,
    paidBookings,
    totalOrders,
    totalRevenueAgg,
    monthlyRevenueAgg,
    // Charts
    bookingByStatusAgg,
    orderByStatusAgg,
    userByRoleAgg,
    // Recent
    recentHostApplications,
    recentBookings,
    recentOrders,
    recentPayments,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'TOURIST' }),
    User.countDocuments({ role: 'HOST' }),
    User.countDocuments({ role: 'TOUR_GUIDE' }),
    HostApplication.countDocuments({ status: 'PENDING' }),
    Workshop.countDocuments({ status: { $ne: 'DELETED' } }),
    Workshop.countDocuments({ status: 'ACTIVE' }),
    Product.countDocuments({ status: { $ne: 'DELETED' } }),
    Booking.countDocuments(),
    Booking.countDocuments({ bookingStatus: { $in: ['PAID', 'CHECKED_IN', 'COMPLETED'] } }),
    Order.countDocuments(),
    // Total revenue from successful payments
    Payment.aggregate([
      { $match: { paymentStatus: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    // Monthly revenue (this month)
    Payment.aggregate([
      { $match: { paymentStatus: 'SUCCESS', paidAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    // Booking by status
    Booking.aggregate([
      { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
    ]),
    // Order by status
    Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),
    // User by role
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    // Recent host applications
    HostApplication.find({ status: 'PENDING' })
      .populate('userId', 'fullName email avatar')
      .sort({ submittedAt: -1 })
      .limit(5),
    // Recent bookings
    Booking.find()
      .populate('touristId', 'fullName email')
      .populate('workshopId', 'title')
      .sort({ createdAt: -1 })
      .limit(5),
    // Recent orders
    Order.find()
      .populate('touristId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(5),
    // Recent payments
    Payment.find({ paymentStatus: 'SUCCESS' })
      .populate('userId', 'fullName email')
      .sort({ paidAt: -1 })
      .limit(5),
  ]);

  // Revenue by month (last 6 months from payments SUCCESS)
  const revenueByMonth = await Payment.aggregate([
    { $match: { paymentStatus: 'SUCCESS' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
        revenue: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, month: '$_id', revenue: 1 } },
  ]);

  sendSuccess(res, 'Lấy thống kê dashboard thành công', {
    stats: {
      totalUsers,
      totalTourists,
      totalHosts,
      totalGuides,
      pendingHostApplications,
      totalWorkshops,
      activeWorkshops,
      totalProducts,
      totalBookings,
      paidBookings,
      totalOrders,
      totalRevenue: totalRevenueAgg[0]?.total || 0,
      monthlyRevenue: monthlyRevenueAgg[0]?.total || 0,
    },
    charts: {
      revenueByMonth,
      bookingByStatus: bookingByStatusAgg.map((b) => ({ status: b._id, count: b.count })),
      orderByStatus: orderByStatusAgg.map((o) => ({ status: o._id, count: o.count })),
      userByRole: userByRoleAgg.map((u) => ({ role: u._id, count: u.count })),
    },
    recent: {
      hostApplications: recentHostApplications,
      bookings: recentBookings,
      orders: recentOrders,
      payments: recentPayments,
    },
  });
});

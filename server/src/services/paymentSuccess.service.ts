import Payment, { IPayment } from '../models/payment.model';
import Booking from '../models/booking.model';
import Order from '../models/order.model';
import Product from '../models/product.model';
import Timeslot from '../models/timeslot.model';
import Workshop from '../models/workshop.model';
import Ticket from '../models/ticket.model';
import { ensureTicketForBooking } from './ticket.service';
import { NotificationService } from './notification.service';

export class PaymentSuccessService {
  /**
   * Xử lý khi thanh toán booking thành công
   * Idempotent: không tăng slot 2 lần, không tạo ticket 2 lần
   * ★ Không cho chuyển PAID nếu booking đã EXPIRED ★
   */
  static async handleSuccessfulBookingPayment(payment: IPayment) {
    if (!payment.bookingId) {
      console.error(`[PaymentSuccess] Payment ${payment._id} không có bookingId`);
      return;
    }

    const booking = await Booking.findById(payment.bookingId);
    if (!booking) {
      console.error(`[PaymentSuccess] Booking ${payment.bookingId} không tồn tại`);
      return;
    }

    // ★ Nếu booking đã EXPIRED → KHÔNG chuyển PAID, log warning ★
    if (['EXPIRED', 'CANCELLED'].includes(booking.bookingStatus)) {
      console.warn(`[PaymentSuccess] ⚠️ Booking ${booking._id} đã ${booking.bookingStatus} — webhook đến muộn. Cần xử lý thủ công/refund.`);
      return;
    }

    // Nếu booking đã ở trạng thái xử lý rồi → vẫn đảm bảo ticket tồn tại
    if (['PAID', 'CHECKED_IN', 'COMPLETED'].includes(booking.bookingStatus)) {
      console.log(`[PaymentSuccess] Booking ${booking._id} đã ở trạng thái ${booking.bookingStatus}, đảm bảo ticket tồn tại`);
      try {
        await ensureTicketForBooking(booking);
        // ★ Activate ticket nếu đang PENDING_PAYMENT ★
        await Ticket.updateMany(
          { bookingId: booking._id, status: 'PENDING_PAYMENT' },
          { status: 'UNUSED' }
        );
      } catch (err: any) {
        console.error(`[PaymentSuccess] Lỗi đảm bảo ticket cho booking ${booking._id}: ${err.message}`);
      }
      return;
    }

    // Booking đang PENDING_PAYMENT → xử lý thanh toán thành công
    // ★ Không cần trừ slot nữa vì đã reserve khi tạo booking ★
    const timeslot = await Timeslot.findById(booking.timeslotId);

    // Tăng totalBookings cho workshop
    const workshop = await Workshop.findByIdAndUpdate(booking.workshopId, {
      $inc: { totalBookings: booking.quantity },
    }, { new: true });

    // Update booking status PAID
    booking.bookingStatus = 'PAID';
    booking.paidAt = new Date();
    booking.paymentId = payment._id as any;
    await booking.save();

    // Tạo ticket QR (idempotent qua ensureTicketForBooking)
    try {
      const ticket = await ensureTicketForBooking(booking);
      // ★ Activate ticket: PENDING_PAYMENT → UNUSED ★
      if (ticket.status === 'PENDING_PAYMENT') {
        ticket.status = 'UNUSED';
        await ticket.save();
      }
      console.log(`[PaymentSuccess] Ticket ${ticket._id} sẵn sàng cho booking ${booking._id}`);
    } catch (err: any) {
      console.error(`[PaymentSuccess] Lỗi tạo ticket: ${err.message}`);
    }

    // 🔔 Notifications
    const workshopTitle = workshop?.title || 'Workshop';

    // Notify tourist
    NotificationService.notifyUser(booking.touristId.toString(), {
      title: 'Thanh toán thành công',
      message: `Bạn đã thanh toán thành công booking ${workshopTitle}. Xem vé QR ngay!`,
      type: 'PAYMENT',
      relatedType: 'BOOKING',
      relatedId: booking._id.toString(),
      actionUrl: `/my-bookings/${booking._id}/ticket`,
      priority: 'HIGH',
    }).catch(() => {});

    // Notify host
    NotificationService.notifyHost(booking.hostId.toString(), {
      title: 'Booking đã thanh toán',
      message: `Một khách đã thanh toán booking workshop ${workshopTitle}.`,
      type: 'PAYMENT',
      relatedType: 'BOOKING',
      relatedId: booking._id.toString(),
      actionUrl: '/host/timeslots',
    }).catch(() => {});
  }

  /**
   * Xử lý khi thanh toán order thành công
   * Idempotent: không xử lý lại nếu order đã CONFIRMED
   */
  static async handleSuccessfulOrderPayment(payment: IPayment) {
    const order = await Order.findById(payment.orderId);
    if (!order) {
      console.error(`[PaymentSuccess] Order ${payment.orderId} không tồn tại`);
      return;
    }

    // Idempotent: skip nếu order đã xử lý
    if (['CONFIRMED', 'PACKING', 'SHIPPING', 'COMPLETED'].includes(order.orderStatus)) {
      console.log(`[PaymentSuccess] Order ${order._id} đã ở trạng thái ${order.orderStatus}, bỏ qua`);
      return;
    }

    // Trừ stock sản phẩm
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity, sold: item.quantity },
      });
    }

    // Update order status
    order.orderStatus = 'CONFIRMED';
    order.paymentId = payment._id as any;
    order.confirmedAt = new Date();
    await order.save();

    // 🔔 Notifications
    // Notify tourist
    NotificationService.notifyUser(order.touristId.toString(), {
      title: 'Thanh toán đơn hàng thành công',
      message: 'Đơn hàng của bạn đã được xác nhận thành công.',
      type: 'PAYMENT',
      relatedType: 'ORDER',
      relatedId: order._id.toString(),
      actionUrl: '/my-orders',
    }).catch(() => {});

    // Notify host
    NotificationService.notifyHost(order.hostId.toString(), {
      title: 'Đơn hàng đã thanh toán',
      message: `Đơn hàng ${order.orderCode} đã được thanh toán.`,
      type: 'PAYMENT',
      relatedType: 'ORDER',
      relatedId: order._id.toString(),
      actionUrl: '/host/orders',
    }).catch(() => {});
  }
}

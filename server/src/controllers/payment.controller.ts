import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { PayOSService } from '../services/payos.service';
import { PaymentSuccessService } from '../services/paymentSuccess.service';
import { cancelBookingPayment } from '../services/bookingExpiry.service';
import Payment from '../models/payment.model';
import Booking from '../models/booking.model';
import Order from '../models/order.model';
import Ticket from '../models/ticket.model';
import Timeslot from '../models/timeslot.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/payments/payos/create-booking-payment
 * Tạo payment link payOS cho booking workshop
 * ★ Check PENDING_PAYMENT + expiresAt ★
 */
export const createBookingPayOSPayment = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.body;
  if (!bookingId) return sendError(res, 'Vui lòng cung cấp bookingId');

  const booking = await Booking.findOne({ _id: bookingId, touristId: req.user!._id })
    .populate('workshopId', 'title');
  if (!booking) return sendError(res, 'Booking không tồn tại', 404);

  // ★ Check cả PENDING và PENDING_PAYMENT (backward compat) ★
  if (!['PENDING', 'PENDING_PAYMENT'].includes(booking.bookingStatus)) {
    return sendError(res, 'Booking không ở trạng thái chờ thanh toán');
  }

  // ★ Check hết hạn ★
  if (booking.expiresAt && new Date(booking.expiresAt).getTime() <= Date.now()) {
    return sendError(res, 'Booking đã hết hạn thanh toán. Vui lòng đặt lại.', 400);
  }

  // Check timeslot availability
  const timeslot = await Timeslot.findById(booking.timeslotId);
  if (!timeslot) {
    return sendError(res, 'Khung giờ không tồn tại');
  }

  // Check if there's already a PENDING payment for this booking
  const existingPayment = await Payment.findOne({ bookingId, paymentStatus: 'PENDING' });
  if (existingPayment && existingPayment.checkoutUrl) {
    return sendSuccess(res, 'Đã có link thanh toán', {
      paymentId: existingPayment._id,
      orderCode: existingPayment.orderCode,
      checkoutUrl: existingPayment.checkoutUrl,
      qrCode: existingPayment.qrCode,
      amount: existingPayment.amount,
    });
  }

  // Generate unique orderCode and paymentCode
  const orderCode = PayOSService.generateOrderCode();
  const paymentCode = `PAY-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;

  // Create payment record
  const payment = await Payment.create({
    paymentCode,
    userId: req.user!._id,
    bookingId,
    amount: booking.totalPrice,
    method: 'PAYOS',
    provider: 'PAYOS',
    paymentStatus: 'PENDING',
    orderCode,
  });

  // Create payOS payment link
  const workshopTitle = (booking.workshopId as any)?.title || 'Workshop';
  try {
    const result = await PayOSService.createPaymentLink({
      orderCode,
      amount: booking.totalPrice,
      description: `CL ${paymentCode.slice(-8)}`,
      items: [{
        name: workshopTitle.slice(0, 50),
        quantity: booking.quantity,
        price: booking.unitPrice,
      }],
    });

    // Update payment with payOS response
    payment.checkoutUrl = result.checkoutUrl;
    payment.paymentLinkId = result.paymentLinkId;
    payment.qrCode = result.qrCode;
    payment.payosResponse = result.raw;
    await payment.save();

    // Link payment to booking
    await Booking.findByIdAndUpdate(bookingId, { paymentId: payment._id });

    sendSuccess(res, 'Tạo link thanh toán payOS thành công', {
      paymentId: payment._id,
      orderCode,
      checkoutUrl: result.checkoutUrl,
      qrCode: result.qrCode,
      amount: booking.totalPrice,
    }, 201);
  } catch (err: any) {
    // Cleanup payment on payOS error
    await Payment.findByIdAndDelete(payment._id);
    console.error('[PayOS] Lỗi tạo payment link:', err.message);
    return sendError(res, `Lỗi tạo link thanh toán: ${err.message}`, 500);
  }
});

/**
 * POST /api/payments/payos/create-order-payment
 * Tạo payment link payOS cho order sản phẩm
 */
export const createOrderPayOSPayment = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.body;
  if (!orderId) return sendError(res, 'Vui lòng cung cấp orderId');

  const order = await Order.findOne({ _id: orderId, touristId: req.user!._id });
  if (!order) return sendError(res, 'Đơn hàng không tồn tại', 404);
  if (order.orderStatus !== 'PENDING') return sendError(res, 'Đơn hàng không ở trạng thái chờ thanh toán');

  // Check existing pending payment
  const existingPayment = await Payment.findOne({ orderId, paymentStatus: 'PENDING' });
  if (existingPayment && existingPayment.checkoutUrl) {
    return sendSuccess(res, 'Đã có link thanh toán', {
      paymentId: existingPayment._id,
      orderCode: existingPayment.orderCode,
      checkoutUrl: existingPayment.checkoutUrl,
      qrCode: existingPayment.qrCode,
      amount: existingPayment.amount,
    });
  }

  const orderCode = PayOSService.generateOrderCode();
  const paymentCode = `PAY-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;

  const payment = await Payment.create({
    paymentCode,
    userId: req.user!._id,
    orderId,
    amount: order.totalAmount,
    method: 'PAYOS',
    provider: 'PAYOS',
    paymentStatus: 'PENDING',
    orderCode,
  });

  try {
    const items = order.items.map(item => ({
      name: item.name.slice(0, 50),
      quantity: item.quantity,
      price: item.price,
    }));

    const result = await PayOSService.createPaymentLink({
      orderCode,
      amount: order.totalAmount,
      description: `CL ${paymentCode.slice(-8)}`,
      items,
    });

    payment.checkoutUrl = result.checkoutUrl;
    payment.paymentLinkId = result.paymentLinkId;
    payment.qrCode = result.qrCode;
    payment.payosResponse = result.raw;
    await payment.save();

    await Order.findByIdAndUpdate(orderId, { paymentId: payment._id });

    sendSuccess(res, 'Tạo link thanh toán payOS thành công', {
      paymentId: payment._id,
      orderCode,
      checkoutUrl: result.checkoutUrl,
      qrCode: result.qrCode,
      amount: order.totalAmount,
    }, 201);
  } catch (err: any) {
    await Payment.findByIdAndDelete(payment._id);
    console.error('[PayOS] Lỗi tạo payment link:', err.message);
    return sendError(res, `Lỗi tạo link thanh toán: ${err.message}`, 500);
  }
});

/**
 * POST /api/payments/payos/webhook
 * Webhook endpoint cho payOS gọi khi thanh toán xong
 * Public endpoint, không cần auth
 * IDEMPOTENT: gọi nhiều lần không gây side effect
 */
export const payosWebhook = asyncHandler(async (req: Request, res: Response) => {
  console.log('[PayOS Webhook] Received:', JSON.stringify(req.body));

  let webhookData: any;
  try {
    webhookData = await PayOSService.verifyWebhookData(req.body);
  } catch (err: any) {
    console.error('[PayOS Webhook] Verify failed:', err.message);
    return sendError(res, 'Webhook verification failed', 400);
  }

  // payOS confirm webhook test (orderCode = 123)
  if (webhookData && webhookData.orderCode === 123) {
    console.log('[PayOS Webhook] Confirm test webhook received');
    return sendSuccess(res, 'Webhook confirmed');
  }

  const orderCode = webhookData?.orderCode;
  if (!orderCode) {
    console.error('[PayOS Webhook] Missing orderCode');
    return sendSuccess(res, 'Webhook received - no orderCode');
  }

  const payment = await Payment.findOne({ orderCode });
  if (!payment) {
    console.error(`[PayOS Webhook] Payment not found for orderCode: ${orderCode}`);
    // Return 200 to prevent payOS from retrying
    return sendSuccess(res, 'Webhook received - payment not found');
  }

  // Check if payment is successful (code "00" in payOS)
  const isSuccess = webhookData.code === '00' || req.body?.code === '00' ||
    webhookData.desc === 'success' || webhookData.desc === 'Thành công';

  if (isSuccess) {
    // Nếu payment đã SUCCESS → vẫn đảm bảo ticket tồn tại (idempotent)
    if (payment.paymentStatus === 'SUCCESS') {
      console.log(`[PayOS Webhook] Payment ${payment._id} already SUCCESS, ensuring ticket exists`);
      if (payment.bookingId) {
        await PaymentSuccessService.handleSuccessfulBookingPayment(payment);
      }
      return sendSuccess(res, 'Webhook processed (already success, ticket ensured)');
    }

    // Payment đang PENDING → update thành SUCCESS
    payment.paymentStatus = 'SUCCESS';
    payment.paidAt = new Date();
    payment.transactionCode = webhookData.reference || webhookData.paymentLinkId || String(orderCode);
    payment.webhookData = req.body;
    await payment.save();

    // Handle booking payment success
    if (payment.bookingId) {
      await PaymentSuccessService.handleSuccessfulBookingPayment(payment);
    }

    // Handle order payment success
    if (payment.orderId) {
      await PaymentSuccessService.handleSuccessfulOrderPayment(payment);
    }

    console.log(`[PayOS Webhook] Payment ${payment._id} marked SUCCESS`);
  } else {
    // ★ Payment failed or cancelled → cancel booking + release slot ★
    if (payment.paymentStatus !== 'SUCCESS') {
      payment.paymentStatus = 'FAILED';
      payment.webhookData = req.body;
      await payment.save();

      // Cancel associated booking
      if (payment.bookingId) {
        try {
          const booking = await Booking.findById(payment.bookingId);
          if (booking && booking.bookingStatus === 'PENDING_PAYMENT') {
            await cancelBookingPayment(booking._id.toString());
          }
        } catch (err: any) {
          console.error(`[PayOS Webhook] Error cancelling booking:`, err.message);
        }
      }

      console.log(`[PayOS Webhook] Payment ${payment._id} marked FAILED`);
    }
  }

  sendSuccess(res, 'Webhook processed');
});

/**
 * GET /api/payments/payos/status/:orderCode
 * Kiểm tra trạng thái thanh toán - FALLBACK cho local dev khi webhook không gọi được
 * Trả về đầy đủ: payment, booking, ticket, order
 */
export const getPayOSPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { orderCode } = req.params;

  const payment = await Payment.findOne({ orderCode: Number(orderCode) });
  if (!payment) return sendError(res, 'Payment không tồn tại', 404);

  // Check ownership (trừ ADMIN)
  if (req.user!.role !== 'ADMIN' && payment.userId.toString() !== req.user!._id.toString()) {
    return sendError(res, 'Không có quyền xem payment này', 403);
  }

  // If payment is still PENDING, try to check with payOS
  if (payment.paymentStatus === 'PENDING') {
    try {
      const payosInfo = await PayOSService.getPaymentInfo(Number(orderCode));
      if (payosInfo && (payosInfo as any).status === 'PAID') {
        // Update payment if payOS confirms paid
        payment.paymentStatus = 'SUCCESS';
        payment.paidAt = new Date();
        payment.transactionCode = (payosInfo as any).id || String(orderCode);
        await payment.save();

        if (payment.bookingId) {
          await PaymentSuccessService.handleSuccessfulBookingPayment(payment);
        }
        if (payment.orderId) {
          await PaymentSuccessService.handleSuccessfulOrderPayment(payment);
        }
      } else if (payosInfo && (payosInfo as any).status === 'CANCELLED') {
        payment.paymentStatus = 'CANCELLED';
        payment.cancelledAt = new Date();
        await payment.save();

        // ★ Cancel booking + release slot ★
        if (payment.bookingId) {
          try {
            await cancelBookingPayment(payment.bookingId.toString());
          } catch (err: any) {
            console.log('[PayOS Status] Booking already cancelled:', err.message);
          }
        }
      }
    } catch (err: any) {
      console.log('[PayOS Status] Error checking payOS:', err.message);
    }
  }

  // Build enriched response with booking, ticket, order info
  const responseData: any = {
    payment: payment.toObject(),
    status: payment.paymentStatus,
  };

  // Nếu có bookingId, lấy booking + ticket
  if (payment.bookingId) {
    const booking = await Booking.findById(payment.bookingId)
      .populate('workshopId', 'title images location')
      .populate('timeslotId', 'startTime endTime');
    if (booking) {
      responseData.booking = booking.toObject();

      // Tìm ticket
      let ticket = null;
      if (booking.ticketId) {
        ticket = await Ticket.findById(booking.ticketId);
      }
      if (!ticket) {
        ticket = await Ticket.findOne({ bookingId: booking._id });
      }
      if (ticket) {
        responseData.ticket = ticket.toObject();
      }
    }
  }

  // Nếu có orderId, lấy order
  if (payment.orderId) {
    const order = await Order.findById(payment.orderId);
    if (order) {
      responseData.order = order.toObject();
    }
  }

  sendSuccess(res, 'Lấy trạng thái thanh toán thành công', responseData);
});

/**
 * POST /api/payments/payos/cancel/:orderCode
 * ★ Hủy thanh toán + release slot + cancel booking ★
 */
export const cancelPayOSPayment = asyncHandler(async (req: Request, res: Response) => {
  const { orderCode } = req.params;

  const payment = await Payment.findOne({ orderCode: Number(orderCode) });
  if (!payment) return sendError(res, 'Payment không tồn tại', 404);

  if (payment.userId.toString() !== req.user!._id.toString() && req.user!.role !== 'ADMIN') {
    return sendError(res, 'Không có quyền hủy payment này', 403);
  }

  if (payment.paymentStatus !== 'PENDING') {
    return sendError(res, 'Chỉ có thể hủy thanh toán đang chờ');
  }

  try {
    await PayOSService.cancelPaymentLink(Number(orderCode), 'User cancelled');
  } catch (err: any) {
    console.log('[PayOS Cancel] Error cancelling on payOS:', err.message);
  }

  payment.paymentStatus = 'CANCELLED';
  payment.cancelledAt = new Date();
  await payment.save();

  // ★ Cancel booking + release slot ★
  if (payment.bookingId) {
    try {
      await cancelBookingPayment(payment.bookingId.toString());
    } catch (err: any) {
      console.log('[PayOS Cancel] Booking cancel note:', err.message);
    }
  }

  sendSuccess(res, 'Đã hủy thanh toán và giải phóng chỗ đặt.');
});

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import Product from '../models/product.model';
import Order from '../models/order.model';
import { v4 as uuidv4 } from 'uuid';
import { SHIPPING_FEE } from '../utils/constants';
import { env } from '../config/env';
import { NotificationService } from '../services/notification.service';

export const checkout = asyncHandler(async (req: Request, res: Response) => {
  const { items, shippingAddress } = req.body;

  if (env.NODE_ENV === 'development') {
    console.log('[Checkout] touristId:', req.user!._id);
    console.log('[Checkout] items:', JSON.stringify(items));
    console.log('[Checkout] shippingAddress:', JSON.stringify(shippingAddress));
  }

  if (!items || items.length === 0) {
    return sendError(res, 'Giỏ hàng không có sản phẩm', 400);
  }

  // Tải tất cả products
  const productIds = items.map((i: any) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, status: 'ACTIVE' });

  if (products.length !== items.length) {
    const foundIds = products.map(p => p._id.toString());
    const missingIds = productIds.filter((id: string) => !foundIds.includes(id));
    return sendError(res, `Sản phẩm không khả dụng hoặc không tồn tại: ${missingIds.join(', ')}`, 400);
  }

  // Gom nhóm sản phẩm theo hostId
  const itemsByHost: Record<string, any[]> = {};
  for (const item of items) {
    const product = products.find((p) => p._id.toString() === item.productId);
    if (!product) return sendError(res, `Sản phẩm ${item.productId} không tồn tại`, 400);
    if (product.stock < item.quantity) {
      return sendError(res, `Sản phẩm "${product.name}" không đủ số lượng (còn ${product.stock})`, 400);
    }

    const hId = product.hostId.toString();
    if (!itemsByHost[hId]) {
      itemsByHost[hId] = [];
    }

    const subtotal = product.price * item.quantity;
    itemsByHost[hId].push({
      productId: product._id,
      name: product.name,
      image: product.images[0] || '',
      price: product.price,
      quantity: item.quantity,
      subtotal,
    });
  }

  // Auto-fill province/fullAddress nếu thiếu
  const finalAddress = {
    fullName: shippingAddress.fullName,
    phone: shippingAddress.phone,
    addressLine: shippingAddress.addressLine,
    ward: shippingAddress.ward || '',
    district: shippingAddress.district || '',
    city: shippingAddress.city,
    province: shippingAddress.province || shippingAddress.city,
    country: shippingAddress.country || 'Việt Nam',
    fullAddress: shippingAddress.fullAddress ||
      [shippingAddress.addressLine, shippingAddress.ward, shippingAddress.district, shippingAddress.city]
        .filter(Boolean)
        .join(', '),
    note: shippingAddress.note || '',
  };

  const createdOrders = [];
  const entries = Object.entries(itemsByHost);

  for (let i = 0; i < entries.length; i++) {
    const [hId, hostItems] = entries[i];
    const productTotal = hostItems.reduce((sum, item) => sum + item.subtotal, 0);
    const orderCode = `ORD-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}-${i}`;
    const totalAmount = productTotal + SHIPPING_FEE;

    const order = await Order.create({
      orderCode,
      touristId: req.user!._id,
      hostId: hId,
      items: hostItems,
      shippingAddress: finalAddress,
      productTotal,
      shippingFee: SHIPPING_FEE,
      totalAmount,
      orderStatus: 'PENDING',
    });
    createdOrders.push(order);

    // 🔔 Notify host about new order
    NotificationService.notifyHost(hId, {
      title: 'Có đơn hàng mới',
      message: `Khách hàng vừa đặt mua sản phẩm của bạn (${order.orderCode}).`,
      type: 'ORDER',
      relatedType: 'ORDER',
      relatedId: order._id.toString(),
      actionUrl: '/host/orders',
    }).catch(() => {});

    if (env.NODE_ENV === 'development') {
      console.log(`[Checkout] Order created: ${orderCode}, total: ${totalAmount}`);
    }
  }

  // 🔔 Notify tourist about all orders created
  NotificationService.notifyUser(req.user!._id.toString(), {
    title: 'Đã tạo đơn hàng',
    message: `${createdOrders.length} đơn hàng đã được tạo. Vui lòng thanh toán.`,
    type: 'ORDER',
    actionUrl: '/my-orders',
  }).catch(() => {});

  sendSuccess(res, 'Đặt hàng thành công! Vui lòng thanh toán.', createdOrders, 201);
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ touristId: req.user!._id })
    .populate('hostId', 'fullName')
    .sort({ createdAt: -1 });
  sendSuccess(res, 'Lấy danh sách đơn hàng', orders);
});

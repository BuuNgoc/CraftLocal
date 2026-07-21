import { z } from 'zod';

export const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1, 'Thiếu mã sản phẩm'),
    quantity: z.number({ invalid_type_error: 'Số lượng phải là số' }).min(1, 'Số lượng phải từ 1 trở lên'),
  })).min(1, 'Giỏ hàng không có sản phẩm'),
  shippingAddress: z.object({
    fullName: z.string().min(1, 'Họ tên người nhận là bắt buộc'),
    phone: z.string().min(1, 'Số điện thoại là bắt buộc'),
    addressLine: z.string().min(1, 'Địa chỉ nhận hàng là bắt buộc'),
    ward: z.string().optional().default(''),
    district: z.string().optional().default(''),
    city: z.string().min(1, 'Tỉnh/Thành phố là bắt buộc'),
    province: z.string().optional().default(''),
    country: z.string().optional().default('Việt Nam'),
    fullAddress: z.string().optional().default(''),
    note: z.string().optional().default(''),
  }),
  paymentMethod: z.string().optional().default('PAYOS'),
});

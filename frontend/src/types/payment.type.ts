export type PaymentMethod = 'PAYOS';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface Payment {
  _id: string;
  paymentCode: string;
  userId: string;
  bookingId?: string;
  orderId?: string;
  amount: number;
  method: PaymentMethod;
  provider: 'PAYOS';
  paymentStatus: PaymentStatus;
  orderCode: number;
  paymentLinkId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  transactionCode?: string;
  paidAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayOSCreateResponse {
  paymentId: string;
  orderCode: number;
  checkoutUrl: string;
  qrCode?: string;
  amount: number;
}

export interface Booking {
  _id: string;
  bookingCode: string;
  touristId: any;
  workshopId: any;
  timeslotId: any;
  hostId: any;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  bookingStatus: 'PENDING_PAYMENT' | 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED' | 'CHECKED_IN' | 'COMPLETED' | 'REFUNDED';
  paymentId?: any;
  ticketId?: string;
  customerInfo?: { fullName: string; email: string; phone: string };
  expiresAt?: string;
  paidAt?: string;
  checkedInAt?: string;
  cancelReason?: string;
  cancelledAt?: string;
  refundStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingPayload {
  workshopId: string;
  timeslotId: string;
  quantity: number;
  customerInfo?: { fullName: string; email: string; phone: string };
}

import cron from 'node-cron';
import { expirePendingBookings } from '../services/bookingExpiry.service';

/**
 * Cron job: chạy mỗi phút, tìm booking PENDING_PAYMENT hết hạn → EXPIRED + release slot
 */
cron.schedule('* * * * *', async () => {
  try {
    await expirePendingBookings();
  } catch (err: any) {
    console.error('[PaymentTimeout Job] Error:', err.message);
  }
});

console.log('⏰ Payment timeout job scheduled (every minute)');

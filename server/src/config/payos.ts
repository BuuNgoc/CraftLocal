import { PayOS } from '@payos/node';
import { env } from './env';

if (!env.PAYOS_CLIENT_ID || !env.PAYOS_API_KEY || !env.PAYOS_CHECKSUM_KEY) {
  console.warn('⚠️  payOS credentials chưa được cấu hình. Thanh toán sẽ không hoạt động.');
  console.warn('   Vui lòng thêm PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY vào file .env');
}

const payos = new PayOS({
  clientId: env.PAYOS_CLIENT_ID,
  apiKey: env.PAYOS_API_KEY,
  checksumKey: env.PAYOS_CHECKSUM_KEY,
});

export default payos;

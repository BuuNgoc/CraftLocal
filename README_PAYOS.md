# payOS Payment Integration - CraftLocal

## Hướng dẫn cấu hình payOS cho CraftLocal

### Bước 1: Tạo tài khoản payOS

1. Truy cập [payOS.vn](https://payos.vn)
2. Đăng ký tài khoản doanh nghiệp/cá nhân
3. Sau khi đăng ký, vào **Dashboard** → **Tích hợp**
4. Lấy 3 thông tin:
   - **Client ID**
   - **API Key**
   - **Checksum Key**

### Bước 2: Cấu hình .env

Mở file `server/.env` và điền thông tin:

```env
PAYOS_CLIENT_ID=your_client_id_here
PAYOS_API_KEY=your_api_key_here
PAYOS_CHECKSUM_KEY=your_checksum_key_here
PAYOS_RETURN_URL=http://localhost:5173/payment/payos-return
PAYOS_CANCEL_URL=http://localhost:5173/payment/payos-cancel
```

> ⚠️ **Quan trọng**: Không commit file `.env` lên Git. Các key payOS chỉ lưu ở local.

### Bước 3: Cấu hình Webhook trên payOS Dashboard

1. Vào **Dashboard payOS** → **Webhook**
2. Thêm Webhook URL:
   - **Local**: Cần dùng ngrok (xem bước 4)
   - **Production**: `https://your-domain.com/api/payments/payos/webhook`

### Bước 4: Test Local với ngrok

payOS cần gọi webhook vào backend, nên khi test local cần public URL:

```bash
# Cài ngrok (nếu chưa có)
npm install -g ngrok

# Chạy ngrok
ngrok http 5000
```

Lấy URL dạng `https://xxxx.ngrok-free.app`, sau đó:

1. Cập nhật **payOS Dashboard** → Webhook URL:
   ```
   https://xxxx.ngrok-free.app/api/payments/payos/webhook
   ```
2. Cập nhật `server/.env`:
   ```env
   API_URL=https://xxxx.ngrok-free.app
   ```
3. **Restart backend**

### Bước 5: Chạy ứng dụng

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## API Endpoints

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| POST | `/api/payments/payos/create-booking-payment` | TOURIST | Tạo link thanh toán booking workshop |
| POST | `/api/payments/payos/create-order-payment` | TOURIST | Tạo link thanh toán order sản phẩm |
| POST | `/api/payments/payos/webhook` | Public | Webhook payOS gọi khi thanh toán xong |
| GET | `/api/payments/payos/status/:orderCode` | User | Kiểm tra trạng thái thanh toán |
| POST | `/api/payments/payos/cancel/:orderCode` | User | Hủy thanh toán |

---

## Flow thanh toán Booking Workshop

```
Tourist chọn Workshop → Chọn Timeslot → Bấm "Đặt trải nghiệm"
       ↓
POST /api/bookings → Booking PENDING
       ↓
POST /api/payments/payos/create-booking-payment
       ↓
Backend tạo Payment PENDING + gọi payOS SDK tạo link
       ↓
Frontend redirect → checkoutUrl (trang thanh toán payOS)
       ↓
User quét VietQR hoặc chuyển khoản
       ↓
payOS gọi webhook → POST /api/payments/payos/webhook
       ↓
Backend verify webhook → Payment SUCCESS
       ↓
Booking → PAID, Timeslot tăng bookedSlots, Ticket QR được tạo
       ↓
User quay về /payment/payos-return → Hiển thị kết quả
```

## Flow thanh toán Order

```
Tourist thêm sản phẩm vào giỏ → Checkout
       ↓
POST /api/orders/checkout → Order PENDING
       ↓
POST /api/payments/payos/create-order-payment
       ↓
Backend tạo Payment PENDING + gọi payOS SDK
       ↓
Frontend redirect → checkoutUrl
       ↓
payOS gọi webhook → Payment SUCCESS
       ↓
Order → CONFIRMED, Product stock giảm + sold tăng
```

---

## Kiểm tra MongoDB

Sau khi thanh toán thành công, kiểm tra các collection:

```javascript
// Payments
db.payments.find({ orderCode: 1234567890 })

// Bookings
db.bookings.find({ bookingStatus: 'PAID' })

// Tickets
db.tickets.find({ status: 'UNUSED' })

// Timeslots (kiểm tra bookedSlots)
db.timeslots.find({ status: 'FULL' })

// Orders
db.orders.find({ orderStatus: 'CONFIRMED' })

// Products (kiểm tra stock giảm)
db.products.find({}, { name: 1, stock: 1, sold: 1 })
```

---

## Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| `payOS credentials chưa được cấu hình` | Thiếu env vars | Điền PAYOS_CLIENT_ID, API_KEY, CHECKSUM_KEY vào .env |
| `Webhook verification failed` | Sai CHECKSUM_KEY | Kiểm tra lại PAYOS_CHECKSUM_KEY |
| Thanh toán thành công nhưng DB chưa update | Webhook chưa đến | Kiểm tra ngrok và webhook URL trên payOS dashboard |
| `429 Too Many Requests` | Rate limiting | Tăng giới hạn trong app.ts khi dev |
| `orderCode bị trùng` | Trùng orderCode | Hệ thống tự generate unique, hiếm khi xảy ra |
| `amount không hợp lệ` | Amount ≤ 0 hoặc quá lớn | Kiểm tra totalPrice/totalAmount |
| `description quá dài` | payOS giới hạn 25 ký tự | Hệ thống tự cắt, không cần lo |
| ReturnUrl thành công nhưng payment PENDING | Webhook chưa xử lý | Bấm "Kiểm tra lại" trên trang kết quả |

---

## Packages sử dụng

| Package | Location | Mục đích |
|---------|----------|----------|
| `@payos/node` | Backend | payOS SDK chính thức |

---

## Đã xóa

- ✅ VNPay (backend + frontend)
- ✅ MoMo (backend + frontend)  
- ✅ Mock payment success
- ✅ PAYMENT_RETURN_URL cũ

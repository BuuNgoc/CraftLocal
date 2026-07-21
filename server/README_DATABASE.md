# 🗄️ CraftLocal Database Guide

## Kết nối MongoDB Atlas

### 1. Tạo tài khoản tại [cloud.mongodb.com](https://cloud.mongodb.com)
### 2. Tạo Cluster Free (M0)
### 3. Database Access → Add User (ghi nhớ username/password)
### 4. Network Access → Allow Access from Anywhere (0.0.0.0/0)
### 5. Database → Connect → Drivers → Node.js → Copy connection string
### 6. Thêm `craftlocal` vào URI:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/craftlocal?retryWrites=true&w=majority
```
### 7. Dán vào `server/.env`:
```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/craftlocal?retryWrites=true&w=majority
```
### 8. Chạy seed:
```bash
cd server
npm install
npm run seed
```

## Collections (14)

| # | Collection | Documents | Mô tả |
|---|-----------|-----------|--------|
| 1 | users | 23 | 1 admin + 6 hosts + 6 guides + 10 tourists |
| 2 | categories | 8 | Danh mục workshop/product |
| 3 | workshops | 20 | Workshop có địa chỉ cụ thể |
| 4 | timeslots | 60 | 3 slot/workshop, 7 ngày |
| 5 | products | 30 | Sản phẩm thủ công |
| 6 | bookings | 30 | Đặt chỗ đa trạng thái |
| 7 | tickets | 25 | Vé QR |
| 8 | orders | 20 | Đơn hàng |
| 9 | payments | 40 | Thanh toán |
| 10 | reviews | 20 | Đánh giá tiếng Việt |
| 11 | wishlists | 20 | Yêu thích |
| 12 | carts | 5 | Giỏ hàng |
| 13 | notifications | 30 | Thông báo |
| 14 | audit_logs | 20 | Nhật ký hệ thống |

## Tài khoản demo

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gmail.com | 123456 |
| Host 1-6 | host1@gmail.com ... host6@gmail.com | 123456 |
| Guide 1-6 | guide1@gmail.com ... guide6@gmail.com | 123456 |
| Tourist 1-10 | tourist1@gmail.com ... tourist10@gmail.com | 123456 |

## Ảnh local path

Tất cả ảnh dùng local path `/images/...`. Khi deploy production, thay bằng URL Cloudinary.

## Lưu ý Frontend

Nếu frontend đang dùng `workshop.address` là string, cần đổi sang:
```typescript
workshop.address.fullAddress    // Địa chỉ đầy đủ
workshop.locationLabel          // Label ngắn
workshop.mapLocation.lat        // Vĩ độ
workshop.mapLocation.lng        // Kinh độ
workshop.hostName               // Tên chủ xưởng
workshop.hostPhone              // SĐT chủ xưởng
```

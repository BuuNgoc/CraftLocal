# 🏺 CraftLocal Backend API

**Cultural & Craft Workshop Booking System** — Nền tảng đặt chỗ trải nghiệm workshop và mua sắm sản phẩm văn hóa địa phương.

## 📋 Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcryptjs
- **Validation:** Zod
- **File Upload:** Multer + Cloudinary
- **QR Code:** qrcode
- **Email:** Nodemailer
- **Security:** Helmet, CORS, express-rate-limit

---

## 🚀 Hướng dẫn chạy

### Bước 1: Cài đặt dependencies

```bash
cd server
npm install
```

### Bước 2: Cấu hình môi trường

```bash
cp .env.example .env
```

Mở file `.env` và cập nhật `MONGO_URI` (xem hướng dẫn MongoDB Atlas bên dưới).

### Bước 3: Chạy server

```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:5000`

### Bước 4: Seed dữ liệu mẫu

```bash
npm run seed
```

---

## 🗄️ Hướng dẫn kết nối MongoDB Atlas

### Bước 1: Tạo tài khoản
Vào [MongoDB Atlas](https://cloud.mongodb.com) và đăng ký/đăng nhập.

### Bước 2: Tạo Project & Cluster
- Tạo Project mới
- Tạo Cluster Free (M0)

### Bước 3: Tạo Database User
- Vào **Database Access** → Add New Database User
- Tạo username và password (ghi nhớ!)

### Bước 4: Cấu hình Network Access
- Vào **Network Access** → Add IP Address
- Chọn **Allow Access from Anywhere** (0.0.0.0/0) cho môi trường học tập
- Hoặc add IP máy hiện tại

### Bước 5: Lấy Connection String
- Vào **Database** → **Connect** → **Drivers** → **Node.js**
- Copy connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Bước 6: Thêm tên database
Thêm `craftlocal` vào connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/craftlocal?retryWrites=true&w=majority
```

### Bước 7: Dán vào `.env`
```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/craftlocal?retryWrites=true&w=majority
```

### Bước 8: Kiểm tra
Sau khi `npm run seed`, vào MongoDB Atlas → **Browse Collections** kiểm tra 10 collections:
`users`, `workshops`, `timeslots`, `bookings`, `tickets`, `products`, `orders`, `payments`, `reviews`, `notifications`

---

## 👤 Tài khoản mẫu

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gmail.com | 123456 |
| Host 1 | host1@gmail.com | 123456 |
| Host 2 | host2@gmail.com | 123456 |
| Tourist 1 | tourist1@gmail.com | 123456 |
| Tourist 2 | tourist2@gmail.com | 123456 |
| Tour Guide 1 | guide1@gmail.com | 123456 |
| Tour Guide 2 | guide2@gmail.com | 123456 |

---

## 📡 API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/register` | Đăng ký |
| POST | `/login` | Đăng nhập |
| GET | `/profile` | Lấy profile (🔒) |
| PUT | `/profile` | Cập nhật profile (🔒) |
| PUT | `/change-password` | Đổi mật khẩu (🔒) |

### Admin (`/api/admin`) — 🔒 ADMIN
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/users` | Danh sách users |
| GET | `/hosts/pending` | Host chờ duyệt |
| PUT | `/hosts/:id/approve` | Duyệt Host |
| PUT | `/users/:id/block` | Khóa user |
| PUT | `/users/:id/unblock` | Mở khóa user |
| GET | `/dashboard` | Dashboard Admin |

### Host (`/api/host`) — 🔒 HOST
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/dashboard` | Dashboard Host |
| POST | `/workshops` | Tạo workshop |
| GET | `/workshops` | DS workshop của mình |
| PUT | `/workshops/:id` | Sửa workshop |
| DELETE | `/workshops/:id` | Xóa workshop |
| POST | `/products` | Tạo sản phẩm |
| GET | `/products` | DS sản phẩm |
| PUT | `/products/:id` | Sửa sản phẩm |
| DELETE | `/products/:id` | Xóa sản phẩm |
| POST | `/timeslots` | Tạo khung giờ |
| GET | `/timeslots` | DS khung giờ |
| PUT | `/timeslots/:id` | Sửa khung giờ |
| DELETE | `/timeslots/:id` | Xóa khung giờ |
| PUT | `/timeslots/:id/assign-guide` | Gán HĐV |
| POST | `/tour-guides` | Tạo Tour Guide |
| GET | `/tour-guides` | DS Tour Guide |
| GET | `/orders` | DS đơn hàng |
| PUT | `/orders/:id/status` | Cập nhật đơn |

### Tour Guide (`/api/tour-guide`) — 🔒 TOUR_GUIDE
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/profile` | Profile |
| GET | `/schedules` | Lịch phân công |
| GET | `/timeslots/:id/customers` | DS khách |
| POST | `/check-in` | Check-in QR |
| PUT | `/timeslots/:id/start` | Bắt đầu |
| PUT | `/timeslots/:id/finish` | Kết thúc |

### Public Workshops (`/api/workshops`)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/` | DS workshops |
| GET | `/:id` | Chi tiết workshop |

### Public Timeslots (`/api/timeslots`)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/workshop/:workshopId` | DS timeslots |

### Public Products (`/api/products`)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/` | DS sản phẩm |
| GET | `/:id` | Chi tiết sản phẩm |

### Bookings (`/api/bookings`) — 🔒 TOURIST
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/` | Đặt chỗ |
| GET | `/my-bookings` | DS đặt chỗ |
| GET | `/:id/ticket` | Lấy vé |

### Orders (`/api/orders`) — 🔒 TOURIST
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/checkout` | Đặt hàng |
| GET | `/my-orders` | DS đơn hàng |

### Payments (`/api/payments`)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/create-payment-url` | Tạo link thanh toán (🔒) |
| POST | `/mock-success/:id` | Mock thanh toán OK (🔒) |
| GET | `/:id/status` | Kiểm tra trạng thái (🔒) |
| GET | `/vnpay-callback` | VNPay callback |
| POST | `/momo-callback` | MoMo callback |

### Reviews (`/api/reviews`)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/workshop/:workshopId` | DS đánh giá |
| POST | `/` | Tạo đánh giá (🔒 TOURIST) |

---

## 🔗 Gắn Frontend với Backend

1. Thêm vào `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

2. Frontend axiosClient dùng:
```typescript
baseURL: import.meta.env.VITE_API_URL
```

---

## 🧪 Test với Postman

### 1. Đăng nhập
```
POST http://localhost:5000/api/auth/login
Body: { "email": "admin@gmail.com", "password": "123456" }
```

### 2. Lấy profile
```
GET http://localhost:5000/api/auth/profile
Headers: Authorization: Bearer <token>
```

### 3. Lấy danh sách workshops
```
GET http://localhost:5000/api/workshops
```

### 4. Booking flow
```
1. Login Tourist → lấy token
2. POST /api/bookings → tạo booking
3. POST /api/payments/create-payment-url → tạo payment
4. POST /api/payments/mock-success/:paymentId → mock thanh toán
5. GET /api/bookings/:id/ticket → lấy vé QR
6. Login Tour Guide → POST /api/tour-guide/check-in → check-in
```

---

## 📂 Cấu trúc thư mục

```
server/
├── src/
│   ├── config/          # DB, Cloudinary, ENV
│   ├── models/          # Mongoose schemas (10 models)
│   ├── controllers/     # Request handlers (11 controllers)
│   ├── routes/          # Express routers (11 route files)
│   ├── middlewares/      # Auth, Role, Validate, Error, Upload
│   ├── services/        # Business logic (Auth, Booking, QR, Payment, Mail, SlotLock)
│   ├── validations/     # Zod schemas (7 validation files)
│   ├── utils/           # Helpers (token, response, constants, QR)
│   ├── seeders/         # Database seed script
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── package.json
├── tsconfig.json
├── .env
└── .env.example
```

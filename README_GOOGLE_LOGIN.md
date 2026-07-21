# Google Login Setup - CraftLocal

## Hướng dẫn cấu hình Google OAuth cho CraftLocal

### Bước 1: Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện tại
3. Đặt tên project: **CraftLocal**

### Bước 2: Cấu hình OAuth Consent Screen

1. Vào **APIs & Services** → **OAuth consent screen**
2. Chọn **External** (cho testing cá nhân)
3. Điền thông tin:
   - **App name**: CraftLocal
   - **User support email**: email của bạn
   - **Developer contact email**: email của bạn
4. Thêm **Test users** nếu cần (khi chưa publish app)
5. **Save and Continue**

### Bước 3: Tạo OAuth Client ID

1. Vào **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth Client ID**
3. **Application type**: Web application
4. **Name**: CraftLocal Web Client
5. **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   ```
6. **Authorized redirect URIs** (không bắt buộc nếu dùng Google Identity Services popup):
   ```
   http://localhost:5173
   ```
7. Click **CREATE**
8. Copy **Client ID** (dạng: `xxx.apps.googleusercontent.com`)

### Bước 4: Cấu hình Environment Variables

#### Server (`server/.env`)

Thêm dòng sau:

```env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

#### Frontend (`frontend/.env`)

Thêm dòng sau:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

> ⚠️ **Quan trọng**: `GOOGLE_CLIENT_ID` ở server và `VITE_GOOGLE_CLIENT_ID` ở frontend phải **giống nhau**.

### Bước 5: Restart ứng dụng

```bash
# Restart backend
cd server
npm run dev

# Restart frontend (terminal khác)
cd frontend
npm run dev
```

---

## Flow hoạt động

```
User bấm "Tiếp tục với Google"
       ↓
Google hiện popup chọn tài khoản
       ↓
Google trả credential (ID Token)
       ↓
Frontend gửi POST /api/auth/google { credential }
       ↓
Backend verify ID token bằng google-auth-library
       ↓
Backend tìm/tạo user trong MongoDB
       ↓
Backend tạo JWT token CraftLocal
       ↓
Backend trả { token, user }
       ↓
Frontend lưu token + user → redirect theo role
```

## API Endpoint

```
POST /api/auth/google
Content-Type: application/json

{
  "credential": "GOOGLE_ID_TOKEN_STRING"
}
```

### Response thành công:

```json
{
  "success": true,
  "message": "Đăng nhập Google thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "...",
      "fullName": "Nguyễn Văn A",
      "email": "example@gmail.com",
      "avatar": "https://lh3.googleusercontent.com/...",
      "role": "TOURIST",
      "status": "ACTIVE",
      "authProvider": "GOOGLE",
      "googleId": "..."
    }
  }
}
```

### Response lỗi:

| Status | Message |
|--------|---------|
| 400 | Thiếu Google credential |
| 401 | Google token không hợp lệ |
| 403 | Tài khoản của bạn đã bị khóa |

---

## Packages sử dụng

| Package | Location | Mục đích |
|---------|----------|----------|
| `google-auth-library` | Backend | Verify Google ID Token |
| `@react-oauth/google` | Frontend | Google Login button & OAuth flow |

---

## Lưu ý Production

- Thêm domain production vào **Authorized JavaScript origins**
- Publish OAuth consent screen khi ra mắt
- Cân nhắc thêm `GOOGLE_CLIENT_SECRET` nếu cần server-side OAuth flow
- Monitor quota & usage trong Google Cloud Console

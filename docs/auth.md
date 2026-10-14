# Xác thực (FR-01, FR-02)

Cách làm theo project Capstone (E-commerce): `Account` + `Role` + `User`, JWT không lưu DB (jjwt), OTP giữ trong bộ nhớ và gửi qua email bằng template Thymeleaf, `JwtFilter` + `@CurrentUser`.

Mọi request đi qua gateway `http://localhost:8080`. Prefix của identity-service: `/identity-service/api/auth`.

## Dữ liệu

| Bảng | Vai trò |
|---|---|
| `accounts` | Thông tin đăng nhập: email (bắt buộc), phone_number, password_hash (BCrypt), `status` (`INACTIVE` → `ACTIVE` sau khi xác nhận OTP, `BANNED`), `account_verified`, role |
| `roles` | `CUSTOMER`, `ADMIN`, được tạo khi khởi động (`DataInitializer`) |
| `users` | Hồ sơ người dùng (full_name, email, phone, avatar), 1-1 với account. Địa chỉ và Vendor gắn vào bảng này |

Không có bảng refresh token và không có bảng mã OTP.

## Token

| Token | Claim | Hạn |
|---|---|---|
| Access (`token`) | `sub`=accountId, `type=ACCESS`, `role`, `accountId`, `userId`, `account_verified` | 12 giờ (`JWT_EXPIRATION`) |
| Refresh (`refreshToken`) | `sub`=accountId, `type=REFRESH`, `accountId` | 7 ngày (`JWT_REFRESH_EXPIRATION`) |

Cả hai đều là JWT HS256, ký bằng `jwt.secret` (dạng Base64). Mỗi lần gọi `/refresh-token` sẽ nhận một cặp mới. Refresh token **không dùng thay access token được**: identity-service và gateway đều kiểm tra claim `type`.

**Đăng xuất:** vì token không lưu trên server, frontend chỉ cần xóa `token` và `refreshToken`. Token cũ vẫn hợp lệ đến khi hết hạn.

## Endpoint

| Method | Path | Auth | Body | Kết quả |
|---|---|---|---|---|
| POST | `/register` | – | `{email, phoneNumber?, fullName, password}` | 200 `AccountCreateResponse` (status `INACTIVE`), gửi OTP qua email |
| POST | `/verify` | – | `{email, otp}` | 200, status chuyển `ACTIVE` |
| POST | `/resend-otp` | – | `{email}` | 200 (luôn luôn) |
| POST | `/login` | – | `{username, password}` (`username` = email **hoặc** số điện thoại) | 200 `LoginResponse` |
| POST | `/refresh-token` | – | `{refreshToken}` | 200 `LoginResponse` với cặp token mới |
| GET | `/me` | Bearer | – | 200 `LoginResponse` (không kèm token) |
| POST | `/forgot-password/send-otp` | – | `{email}` | 200 (luôn luôn). Chỉ gửi nếu email đã xác nhận (AC-02.1) |
| POST | `/forgot-password/reset` | – | `{email, otp, newPassword}` | 200 |

```json
// LoginResponse
{ "token": "...", "refreshToken": "...", "accountId": "...", "userId": "...",
  "email": "lan@example.com", "phoneNumber": "0912345678", "fullName": "Nguyen Lan",
  "role": "CUSTOMER", "vendorStatus": "NONE", "vendorId": null }
```

`vendorStatus` (FR-27) có một trong các giá trị: `NONE`, `PENDING`, `NEEDS_INFO`, `APPROVED`, `REJECTED`, `LOCKED`. Giống `sellerStatus` của Capstone.

## OTP

- 6 chữ số, có hiệu lực 5 phút (`otp.expiration`). Nhập sai 5 lần (`otp.max-attempts`) thì mã bị hủy và phải gọi `/resend-otp`.
- Mã được giữ trong bộ nhớ của identity-service, theo email. Khởi động lại service thì mã đang chờ sẽ mất, người dùng chỉ cần gửi lại.
- **Local dev:** để trống `MAIL_HOST` thì mã không được gửi mà được in ra log của identity-service: `[DEV] spring.mail.host not set, OTP for ...`.
- **Gửi mail thật:** đặt các biến `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` (ví dụ Gmail App Password). Template nằm ở `resources/templates/REGIS.html` và `FORGOT_PASSWORD.html`.

## Lỗi

Mọi lỗi trả theo cùng một dạng, giống Capstone:

```json
{ "status": 409, "error": "Conflict", "message": "Email đã được sử dụng", "path": "/api/auth/register", "timestamp": "..." }
```

| HTTP | Khi nào |
|---|---|
| 400 | Validation (`field: message; ...`), OTP sai hoặc hết hạn, tài khoản chưa kích hoạt, tài khoản bị khóa |
| 401 | Sai thông tin đăng nhập (một câu chung cho mọi trường hợp, FR-02), token thiếu, sai hoặc hết hạn |
| 409 | Email hoặc số điện thoại đã được dùng (AC-01.3) |

"Chưa kích hoạt" hoặc "bị khóa" **chỉ** được báo khi mật khẩu đúng, để người lạ không dò được email nào đã đăng ký.

## Gateway

- Gateway kiểm tra access token. Nó xóa các header `X-User-Id`, `X-Account-Id`, `X-User-Role` do client tự gửi lên, rồi gắn lại từ token. Các service khác đọc danh tính người dùng từ ba header này.
- Không cần token: `/identity-service/api/auth/**`, và `GET` vào products, order-profiles, reviews của catalog-service (FR-04).
- Tài khoản chưa xác nhận OTP thì không đăng nhập được, nên mọi token đều thuộc tài khoản đã xác nhận (AC-01.2).

## Cấu hình (`.env`)

Mọi giá trị cấu hình nằm trong file **`.env` ở thư mục gốc repo**. File này đã có trong `.gitignore` nên không bị commit. `application.yml` chỉ tham chiếu `${VAR}` và không chứa giá trị nào. `DotEnvConfig.loadDotEnv()` trong `main()` của mọi service đi ngược từ thư mục đang chạy lên các thư mục cha để tìm `.env`. Vì vậy chạy từ thư mục module, từ `backend/` hay từ gốc repo đều được. Biến môi trường thật của hệ điều hành được ưu tiên hơn giá trị trong `.env`.

Cách thiết lập cho thành viên mới:

```bash
cp .env.example .env
openssl rand -base64 48   # dán kết quả vào JWT_SECRET
```

Thiếu `.env` hoặc thiếu một biến thì service dừng ngay khi khởi động với lỗi `Could not resolve placeholder 'TEN_BIEN'`.

| Biến | Ghi chú |
|---|---|
| `DB_USERNAME`, `DB_PASSWORD` | Dùng chung cho 4 container Postgres |
| `IDENTITY_DB_HOST/PORT`, `CATALOG_DB_*`, `TENDER_DB_*`, `ORDER_DB_*` | Mỗi service một DB (cổng 5441–5444 khi chạy từ IDE). Trong Docker, compose tự đổi sang tên container |
| `EUREKA_URL` | `http://localhost:8761/eureka/`; trong Docker tự đổi thành `http://discovery-server:8761/eureka/` |
| `JWT_SECRET` | Chuỗi Base64, ít nhất 32 byte. identity-service và api-gateway đọc **cùng một** giá trị này |
| `JWT_EXPIRATION` / `JWT_REFRESH_EXPIRATION` | Đơn vị mili giây (12 giờ / 7 ngày) |
| `OTP_EXPIRATION` / `OTP_MAX_ATTEMPTS` | `5m` / `5` |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | Để trống `MAIL_HOST` thì OTP được in ra log thay vì gửi mail |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin được tạo khi khởi động lần đầu |
| `CORS_ORIGINS` | Gateway, nhiều giá trị thì ngăn bằng dấu phẩy |

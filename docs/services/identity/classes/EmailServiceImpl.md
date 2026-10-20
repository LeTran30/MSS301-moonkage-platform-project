# Class Log: `EmailServiceImpl`

> **Một câu:** đóng gói mã OTP thành một sự kiện email và đẩy lên RabbitMQ; orchestrator-service nhận và gửi email thật.

- **Package:** `com.moonkage.identity.service.impl`
- **Tham chiếu:** `FR-01`, `FR-02`, `A-17` (Gmail SMTP)
- **Dependencies:** `EmailNotificationPublisher`, `OtpProperties` (số phút hiệu lực in trong email), `MessageSource` (tiêu đề email theo ngôn ngữ của request)

## 0. Luật bất biến

1. **Mã xác nhận đăng ký**: gửi lỗi thì **báo lỗi** (`EMAIL_DELIVERY_FAILED`, 503), để người dùng biết bấm "Gửi lại".
2. **Mã đặt lại mật khẩu**: gửi lỗi thì **im lặng**, vì báo lỗi sẽ để lộ email có tài khoản (FR-02).
3. Tiêu đề lấy từ `messages.properties`, không viết thẳng trong code.

## 1. Danh mục Method

| Method | ErrorCode có thể ném | Làm gì |
| --- | --- | --- |
| `sendVerifyAccountOtp(email, name, otp)` | `EMAIL_DELIVERY_FAILED` | Template `REGISTRATION` |
| `sendResetPasswordOtp(email, name, otp)` | — (im lặng) | Template `FORGOT_PASSWORD` |

## 2. Luồng (`send`)
1. Tạo `EmailNotificationEvent { eventId ngẫu nhiên, người nhận, tiêu đề, mã template, params: name, otp, minutes }`.
2. Đẩy đồng bộ lên exchange `moonkage.events`, routing key `orchestrator.email.identity`.
3. Broker lỗi → ghi log, ném `EMAIL_DELIVERY_FAILED`. `sendResetPasswordOtp` bắt lỗi này và bỏ qua.

## 3. Ghi chú
- Không đi qua outbox: luồng đăng ký cần biết **ngay** khi gửi thất bại. Đổi lại, broker nhận rồi mà orchestrator làm mất thì identity không biết.
- Log hiện có ghi địa chỉ email (mục 10 trong bản rà soát); nên che bớt.
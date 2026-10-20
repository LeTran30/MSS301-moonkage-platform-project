# Class Log: `AuthServiceImpl`

> **Một câu:** tạo tài khoản, xác nhận email bằng mã OTP, đăng nhập, cấp lại token và đặt lại mật khẩu.

- **Package:** `com.moonkage.identity.service.impl`
- **Tham chiếu:** `FR-01` (đăng ký), `FR-02` (đăng nhập, quên mật khẩu), `AC-01.3`, `AC-02.1`, `Q-04`, `Q-05`
- **Dependencies:** `AccountRepository`, `UserProfileRepository`, `PasswordEncoder`, `AuthenticationManager`, `JwtTokenProvider`, `OtpService`, `EmailService`, `AccountMapper`

## 0. Luật bất biến (không bao giờ được vi phạm)

1. **Một email, một số điện thoại chỉ thuộc một tài khoản.** Email lưu dạng chữ thường (`Account.toStoredEmail`), số điện thoại lưu 9 số cuối (`Account.toStoredPhoneNumber`), nên `0912…`, `84912…`, `+84912…` là cùng một số.
2. **Chưa xác nhận email thì chưa đăng nhập được.** Tài khoản mới luôn có `accountVerified = false`.
3. **Không để lộ email nào đã đăng ký.** Các API gửi mã (`sendVerifyAccountOtp`, `sendResetPasswordOtp`) trả lời giống hệt nhau dù email có tài khoản hay không. Email lạ vẫn bị tính lượt gửi (`throttleSend`), nên cả thông báo "đợi 60 giây" cũng không tiết lộ gì.
4. **Mã của luồng này không dùng được cho luồng kia.** Mã đăng ký (`VERIFY_ACCOUNT`) không đặt lại mật khẩu được, và ngược lại.
5. **Đặt lại mật khẩu thì mọi phiên cũ hết hiệu lực.** Mọi token phát hành trước `passwordChangedAt` đều bị từ chối.

## 1. Danh mục Method

| Method | Input | Output | ErrorCode có thể ném | Làm gì |
| --- | --- | --- | --- | --- |
| `register` | `RegisterAccountRequest` | `RegisterAccountResponse` | `EMAIL_ALREADY_EXISTS`, `PHONE_ALREADY_EXISTS` | Tạo tài khoản và hồ sơ, gửi mã xác nhận |
| `verifyAccount` | `VerifyAccountRequest` | `VerifyAccountResponse` | `OTP_INVALID_OR_EXPIRED`, `OTP_MAX_ATTEMPTS_EXCEEDED` | Đúng mã thì bật `accountVerified` |
| `sendVerifyAccountOtp` | `email` | `void` | `OTP_TOO_FREQUENT`, `OTP_SEND_LIMIT_EXCEEDED`, `EMAIL_DELIVERY_FAILED` | Gửi lại mã xác nhận |
| `login` | `LoginRequest` | `LoginResponse` | `INVALID_CREDENTIALS`, `ACCOUNT_NOT_ACTIVATED` | Kiểm mật khẩu, cấp access token và refresh token |
| `refreshToken` | `refreshToken` | `LoginResponse` | `REFRESH_TOKEN_INVALID`, `ACCOUNT_NOT_ACTIVATED` | Đổi refresh token lấy cặp token mới |
| `getMyAccount` | `accountId` | `AccountResponse` | `ACCOUNT_NOT_FOUND`, `USER_PROFILE_NOT_FOUND` | Thông tin tài khoản đang đăng nhập |
| `sendResetPasswordOtp` | `email` | `void` | `OTP_TOO_FREQUENT`, `OTP_SEND_LIMIT_EXCEEDED` | Gửi mã đặt lại mật khẩu (không bao giờ báo lỗi gửi email) |
| `resetPassword` | `email`, `otp`, `newPassword` | `void` | `OTP_INVALID_OR_EXPIRED`, `OTP_MAX_ATTEMPTS_EXCEEDED` | Đúng mã thì đổi mật khẩu, đá các phiên cũ |

## 2. Luồng chi tiết

### `register(request)`
1. **[Kiểm tra]**
   - Chuẩn hóa email, số điện thoại, họ tên vào biến cục bộ (request giữ nguyên như client gửi).
   - Email đã có tài khoản → `THROW EMAIL_ALREADY_EXISTS`. Số điện thoại đã có → `THROW PHONE_ALREADY_EXISTS`.
2. **[Nghiệp vụ]**
   - Tạo `Account` vai `MEMBER`, mật khẩu băm bcrypt, `accountVerified = false`.
   - Lưu và **đẩy xuống DB ngay** (`saveAndFlush`). Nếu có người đăng ký trùng đúng cùng lúc, khóa duy nhất của DB chặn lại; tên khóa (`uk_accounts_email` / `uk_accounts_phone_number`) cho biết trùng email hay trùng số → vẫn ném 409 như bước 1, không ra 500.
   - Tạo `UserProfile` với họ tên.
3. **[Gửi mã]**
   - Thử phát mã và gửi email. Gửi lỗi thì **vẫn giữ tài khoản**, chỉ đánh dấu `otpSent = false`; mã chưa tới tay người dùng bị xóa.
4. **[Trả kết quả]** `RegisterAccountResponse { id, email, phoneNumber, verified: false, otpSent }`.

### `verifyAccount(request)` và `resetPassword(email, otp, newPassword)`
1. Chuẩn hóa email → `OtpService.verifyOtp(mục đích, email, otp)`. Sai, hết hạn hoặc đang bị khóa thì `OtpService` ném lỗi.
2. Tìm tài khoản theo email. Mã đúng mà tài khoản đã biến mất → trả lời như mã sai (`OTP_INVALID_OR_EXPIRED`).
3. `verifyAccount`: bật `accountVerified = true`.
   `resetPassword`: băm mật khẩu mới, đặt `passwordChangedAt = bây giờ` → mọi token cũ hết hiệu lực.

### `sendVerifyAccountOtp(email)` và `sendResetPasswordOtp(email)`
1. Chuẩn hóa email, tìm tài khoản **đủ điều kiện**:
   - mã xác nhận: tài khoản **chưa** xác nhận;
   - mã đặt lại mật khẩu: tài khoản **đã** xác nhận (AC-02.1).
2. Không có tài khoản đủ điều kiện → chỉ tính một lượt gửi (`throttleSend`) rồi kết thúc, **trả 200 như bình thường**.
3. Có → phát mã và gửi email kèm họ tên (hồ sơ mất thì dùng email thay tên).
   - Mã xác nhận: gửi lỗi → xóa mã, ném `EMAIL_DELIVERY_FAILED` (503) để người dùng biết bấm gửi lại.
   - Mã đặt lại mật khẩu: gửi lỗi → im lặng, vì báo lỗi sẽ để lộ email có tài khoản.

### `login(request)`
1. Giao cho Spring Security (`AuthenticationManager`): tìm theo email hoặc số điện thoại, so mật khẩu.
2. Sai email/số/mật khẩu → `INVALID_CREDENTIALS` (một câu chung, không nói sai phần nào).
3. Mật khẩu đúng nhưng chưa xác nhận email → `ACCOUNT_NOT_ACTIVATED`. Chỉ báo **sau khi** mật khẩu đúng, nên người lạ không dò được email.
4. Thành công → `LoginResponse` gồm access token, refresh token và thông tin tài khoản.

### `refreshToken(refreshToken)`
1. Giải mã refresh token (sai chữ ký, hết hạn, hoặc là access token → `REFRESH_TOKEN_INVALID`).
2. Tài khoản đã bị xóa → `REFRESH_TOKEN_INVALID`. Chưa xác nhận → `ACCOUNT_NOT_ACTIVATED`.
3. Token phát hành trước lần đổi mật khẩu gần nhất → `REFRESH_TOKEN_INVALID`.
4. Cấp cặp token mới.

## 3. Trường hợp biên & ghi chú

- **Gửi email đồng bộ qua RabbitMQ**, không qua outbox: người dùng cần biết ngay khi gửi mã đăng ký thất bại để bấm "Gửi lại".
- Thời điểm lấy bằng `Instant.now()` trực tiếp; muốn test chủ động thời gian thì cần đưa `Clock` vào (chưa làm).
- So "token phát hành trước lần đổi mật khẩu" cắt về giây, vì `iat` của JWT chỉ có giây: đăng nhập cùng giây với lúc đặt lại vẫn dùng được.
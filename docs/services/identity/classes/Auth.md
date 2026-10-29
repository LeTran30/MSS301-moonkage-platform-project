# Class Log: module `auth`

> **Một câu:** tạo tài khoản, xác nhận email bằng mã OTP, đăng nhập, cấp lại token và đặt lại mật khẩu.

- **Package:** `com.moonkage.identity.auth`. Không có API cho module khác; gốc module chỉ có `AuthError`.
- **Use case (`application/`):** `RegisterAccount`, `VerifyAccount`, `ResendVerifyOtp`, `Login`, `RefreshSession`, `SendResetPasswordOtp`, `ResetPassword`. Hai bước dùng chung: `OtpDelivery` (phát mã và gửi mail) và `SessionOpener` (cấp token kèm họ tên).
- **Port:** `SessionTokens` (adapter `JwtSessionTokens`), `OtpMailer` (adapter `OrchestratorOtpMailer`).
- **Infrastructure:**
  - `web/`: `AuthController`, request tự parse thành `Command` qua `FieldParser`, response có `from(...)`.
  - `token/`: `JwtSessionTokens`, `JwtProperties`, `JwtBearerAuthenticator` (hiện thực SPI `platform.security.BearerTokenAuthenticator`).
  - `messaging/`: `OrchestratorOtpMailer`, `EmailNotificationEvent`.
- **Phụ thuộc:** `AccountApi`, `OtpApi`, `UserProfileService` (tới khi `profile` được dựng lại ở Phase 6).
- **Tham chiếu:** `FR-01` (đăng ký), `FR-02` (đăng nhập, quên mật khẩu), `AC-01.3`, `AC-02.1`, `Q-04`, `Q-05`; plan v2 mục 4.7.

## 0. Luật bất biến (không bao giờ được vi phạm)

1. **Một email, một số điện thoại chỉ thuộc một tài khoản.** Email được value object `Email` chuẩn hóa về chữ thường. Số điện thoại chỉ nhận dạng trong nước `0912…` và được `PhoneNumber` lưu dưới dạng 9 số cuối (quyết định C1). Việc kiểm trùng nằm ở `AccountApi.registerMember` (xem [`AccountApi.md`](AccountApi.md)).
2. **Chưa xác nhận email thì chưa đăng nhập được.** Tài khoản mới luôn chưa xác nhận.
3. **Không để lộ email nào đã đăng ký.**
   - Hai API gửi mã trả lời giống hệt nhau dù email có tài khoản hay không.
   - Email lạ vẫn bị tính lượt gửi (`OtpApi.throttle`), nên cả thông báo "đợi 60 giây" cũng không tiết lộ gì.
   - Đăng nhập: email lạ và sai mật khẩu cùng một câu trả lời, cùng một thời gian (`AccountApi.verifyCredentials`).
4. **Mã của luồng này không dùng được cho luồng kia.** Mã đăng ký (`VERIFY_ACCOUNT`) không đặt lại mật khẩu được, và ngược lại.
5. **Đặt lại mật khẩu thì mọi phiên cũ hết hiệu lực.** Mọi token phát hành trước `passwordChangedAt` đều bị từ chối.
6. **Request trả 400 kèm mọi trường sai một lần.** Request được parse hết trước khi gọi use case; khóa message giữ như cũ.

## 1. Danh mục use case

| Endpoint | Use case | ErrorCode có thể ném | Làm gì |
| --- | --- | --- | --- |
| `POST /register` | `RegisterAccount` | `EMAIL_ALREADY_EXISTS`, `PHONE_ALREADY_EXISTS` | Tạo tài khoản và hồ sơ, gửi mã xác nhận |
| `POST /verify-account` | `VerifyAccount` | `INVALID_OR_EXPIRED`, `MAX_ATTEMPTS_EXCEEDED` | Đúng mã thì xác nhận email |
| `POST /send-verify-account-otp` | `ResendVerifyOtp` | `TOO_FREQUENT`, `SEND_LIMIT_EXCEEDED`, `EMAIL_DELIVERY_FAILED` | Gửi lại mã xác nhận |
| `POST /login` | `Login` | `INVALID_CREDENTIALS`, `ACCOUNT_NOT_ACTIVATED` | Kiểm mật khẩu, cấp access token và refresh token |
| `POST /refresh-token` | `RefreshSession` | `REFRESH_TOKEN_INVALID`, `ACCOUNT_NOT_ACTIVATED` | Đổi refresh token lấy cặp token mới |
| `POST /send-reset-password-otp` | `SendResetPasswordOtp` | `TOO_FREQUENT`, `SEND_LIMIT_EXCEEDED` | Gửi mã đặt lại mật khẩu (không bao giờ báo lỗi gửi mail) |
| `POST /reset-password` | `ResetPassword` | `INVALID_OR_EXPIRED`, `MAX_ATTEMPTS_EXCEEDED` | Đúng mã thì đổi mật khẩu, đá các phiên cũ |

Mọi request sai trường → 400 `COMMON_400`.

## 2. Luồng chi tiết

### `RegisterAccount` (một transaction)
1. **[Request]** `email` → `Email`. `phoneNumber` bỏ trống thì không có, có thì → `PhoneNumber`. `fullName` trim, tối đa `ProfileConstant.MAX_FULL_NAME_LENGTH`. `password` → `RawPassword.parse` (8–72 ký tự, quyết định C4).
2. **[Nghiệp vụ]**
   - `AccountApi.registerMember(...)`: tạo tài khoản `MEMBER` chưa xác nhận. Email/số đã có tài khoản (kể cả hai người đăng ký trùng đúng cùng lúc) → `EMAIL_ALREADY_EXISTS` / `PHONE_ALREADY_EXISTS`.
   - `UserProfileService.createProfile(accountId, fullName)`.
3. **[Gửi mã]** `OtpDelivery.sendConfirmationCode`. Gửi lỗi thì **vẫn giữ tài khoản**, chỉ trả `otpSent = false`; mã chưa tới tay người dùng bị xóa.
4. **[Trả kết quả]** `{ id, email, phoneNumber, verified: false, otpSent }`.

### `VerifyAccount` và `ResetPassword`
1. `OtpApi.verify(mục đích, email, mã)`. Sai, hết hạn hoặc đang bị khóa thì `OtpApi` ném lỗi.
2. Tìm tài khoản theo email. Mã đúng mà tài khoản đã biến mất → trả lời như mã sai (`INVALID_OR_EXPIRED`).
3. Tùy use case:
   - `VerifyAccount`: `AccountApi.confirmEmail`.
   - `ResetPassword`: `AccountApi.changePassword(id, RawPassword.parse(newPassword))`. Account tự băm và đặt `passwordChangedAt = bây giờ`, nên mọi token cũ hết hiệu lực.

### `ResendVerifyOtp` và `SendResetPasswordOtp`
1. Tìm tài khoản **đủ điều kiện**:
   - mã xác nhận: tài khoản **chưa** xác nhận;
   - mã đặt lại mật khẩu: tài khoản **đã** xác nhận (AC-02.1).
2. Không có tài khoản đủ điều kiện → chỉ tính một lượt gửi (`OtpApi.throttle`) rồi kết thúc, **trả 200 như bình thường**.
3. Có → `OtpDelivery` phát mã và gửi mail kèm họ tên (hồ sơ mất thì dùng email thay tên). Khi gửi lỗi:
   - mã xác nhận: xóa mã, ném `EMAIL_DELIVERY_FAILED` (503) để người dùng biết bấm gửi lại;
   - mã đặt lại mật khẩu: im lặng, vì báo lỗi sẽ để lộ email có tài khoản.

### `Login`
1. **[Request]** `username`, `password` chỉ cần có mặt. Mật khẩu đi qua `RawPassword.forLogin`, không áp chính sách độ dài.
2. `LoginIdentifier.parse(username)`. Không phải email, cũng không phải số trong nước → `INVALID_CREDENTIALS` ngay: không tài khoản nào có định danh như vậy, nên trả lời ngay không lộ gì.
3. `AccountApi.verifyCredentials`:
   - `Rejected` (email/số lạ hoặc sai mật khẩu) → `INVALID_CREDENTIALS`;
   - `NotActivated` (mật khẩu đúng, chưa xác nhận) → `ACCOUNT_NOT_ACTIVATED`;
   - `Accepted` → `SessionOpener`: cặp token mới, thông tin tài khoản, họ tên (`UserProfileService.getFullName`).

### `RefreshSession`
1. `SessionTokens.readRefreshToken`: sai chữ ký, hết hạn, hoặc là access token → `REFRESH_TOKEN_INVALID`.
2. `AccountApi.find`: chủ thể không phải UUID hoặc tài khoản đã bị xóa → `REFRESH_TOKEN_INVALID`. Chưa xác nhận → `ACCOUNT_NOT_ACTIVATED`.
3. Token phát hành trước lần đổi mật khẩu gần nhất (`AccountView.acceptsTokenIssuedAt`) → `REFRESH_TOKEN_INVALID`.
4. `SessionOpener`: cặp token mới.

## 3. Token (`JwtSessionTokens`)

- HS256, khóa `jwt.secret`. Claim: `sub` (id tài khoản), `type` (`ACCESS`/`REFRESH`), `role` (chỉ access token), `iat`, `exp`.
- Thời hạn: `jwt.expiration`, `jwt.refresh-expiration`; số trơn được đọc là mili giây.
- Thời gian phát và kiểm hạn lấy từ bean `Clock`.
- Access token lỗi → `TOKEN_EXPIRED` / `TOKEN_INVALID` (`BearerTokenError` của `platform`). Refresh token lỗi, kể cả hết hạn → `REFRESH_TOKEN_INVALID`.
- `JwtBearerAuthenticator` kiểm mỗi request:
  - tài khoản còn tồn tại (không thì `TOKEN_INVALID`, 401 chứ không phải 404);
  - đã xác nhận (không thì `ACCOUNT_NOT_ACTIVATED`);
  - token không cũ hơn lần đổi mật khẩu (Q-04).

## 4. Mail OTP (`OrchestratorOtpMailer`)

1. Tạo `EmailNotificationEvent`, gồm:
   - `eventId` (UUID v7 từ `IdGenerator`), người nhận;
   - tiêu đề lấy từ `messages.properties` theo ngôn ngữ của request;
   - template `REGISTRATION` hoặc `FORGOT_PASSWORD`;
   - params `name`, `otp`, `minutes` (`OtpApi.codeLifetime()`).
2. Đẩy **đồng bộ** lên exchange `moonkage.events`, routing key `orchestrator.email.identity`. orchestrator-service nhận và gửi mail thật.
3. Broker lỗi → log (email đã che), ném `EMAIL_DELIVERY_FAILED`.

Không đi qua outbox, vì luồng đăng ký cần biết **ngay** khi gửi thất bại. Đổi lại, nếu broker đã nhận mà orchestrator làm mất thì identity không biết.

## 5. Ghi chú

- So "token phát hành trước lần đổi mật khẩu" cắt về giây, vì `iat` của JWT chỉ có giây. Đăng nhập cùng giây với lúc đặt lại vẫn dùng được.
- Không dùng `AuthenticationManager`, `UserDetailsService`. `UserDetailsServiceAutoConfiguration` bị loại, để Boot không tạo user trong bộ nhớ.
- Test: `LoginTest`, `RefreshSessionTest`, `OtpUseCasesTest`, `JwtSessionTokensTest`, `JwtBearerAuthenticationTest`, `OrchestratorOtpMailerTest`, test đặc tả `AuthContractTest`.

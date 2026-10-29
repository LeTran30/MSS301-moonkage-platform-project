# Plan v2, Phase 5: module `auth` + `platform.security`

Ngày: 2026-10-30. Plan: [identity-service-refactor-plan.md](identity-service-refactor-plan.md) mục 4.7, 5.5.7, 6.1, 6.2, Phase 5. Nhánh `refactor/identity-v2`. ĐIỂM DỪNG E đã được duyệt.

## 1. Đã làm

**`auth`** ([Auth.md](classes/Auth.md)):
- Gốc module: `AuthError` (`AUTH_001`, `AUTH_002`, `AUTH_006`, `AUTH_013`; giữ nguyên mã và khóa message).
- `application/`:
  - 7 use case: `RegisterAccount`, `VerifyAccount`, `ResendVerifyOtp`, `Login`, `RefreshSession`, `SendResetPasswordOtp`, `ResetPassword`. Use case nhận vào một `Command` lồng trong chính nó, trả `Registration` hoặc `Session`.
  - Hai bước dùng chung: `OtpDelivery` (phát mã, gửi mail, bỏ mã nếu gửi lỗi) và `SessionOpener` (cấp token kèm họ tên).
  - Port `SessionTokens` và `OtpMailer`.
- **`Login` gọi `AccountApi.verifyCredentials`.** Không còn `AuthenticationManager`, `UserDetailsService`, `DaoAuthenticationProvider`, `PasswordEncoder` bean, `AccountPrincipal`.
- `infrastructure/web/`:
  - `AuthController` chuyển từ `web/` vào module.
  - Request tự parse thành `Command` qua `FieldParser` (mục 6.2). Phần dùng chung (email, OTP, mật khẩu mới) nằm ở `AuthFields`.
  - Response có `from(...)`. Không còn Bean Validation, `RequestText`, `AuthMapper`.
- `infrastructure/token/`:
  - `JwtSessionTokens`: đọc giờ từ `Clock`, cả lúc phát lẫn lúc kiểm hạn, nên test đi được thời gian.
  - `JwtProperties`: record, thời hạn kiểu `Duration`.
  - `JwtBearerAuthenticator`: hiện thực SPI của `platform`.
- `infrastructure/messaging/`: `OrchestratorOtpMailer` (gửi đồng bộ qua RabbitMQ như trước) và `EmailNotificationEvent`.

**`platform.security`:**
- `BearerTokenError` (`AUTH_010`, `AUTH_011`, `AUTH_012`): lỗi của bearer token, thuộc về hợp đồng của SPI.
- `CurrentUserInfo` mang `AccountId` và `Email` (mục 5.5.7). Controller cũ gọi `.toString()` khi đưa id cho service cũ.
- `GlobalExceptionHandler` bỏ ba handler của luồng đăng nhập cũ (`BadCredentialsException`, `UsernameNotFoundException`, `AccountStatusException`).
- `IdentityServiceApplication` loại `UserDetailsServiceAutoConfiguration`, để Boot không tạo user trong bộ nhớ với mật khẩu ngẫu nhiên.

**`account`:** bỏ `findLoginRecord` và `LegacyLoginRecord`. Mật khẩu và hash không còn rời module nữa.

**`otp`:** thêm `OtpApi.codeLifetime()`, để mail ghi số phút hiệu lực mà không phải đọc lại cấu hình `otp.*`.

## 2. Test

- **Test mới:**
  - `LoginTest`: ba kết quả của `verifyCredentials`; định danh sai dạng bị từ chối mà không gọi account.
  - `RefreshSessionTest`: token hợp lệ; tài khoản đã xóa; chủ thể không phải UUID; tài khoản chưa xác nhận; token cũ hơn lần đặt lại mật khẩu.
  - `OtpUseCasesTest`: mọi kịch bản của `AuthServiceImplTest` cũ, cộng thêm:
    - gửi mail lỗi lúc đăng ký thì giữ tài khoản và bỏ mã;
    - gửi lại mã lỗi thì báo 503;
    - mail đặt lại mật khẩu lỗi thì im lặng;
    - mã đúng của tài khoản đã mất thì coi như mã sai.
  - `JwtSessionTokensTest`: chạy với `MovableClock`, thay cho thời hạn âm và `ReflectionTestUtils`.
  - `JwtBearerAuthenticationTest`: dùng token thật thay cho mock, thêm trường hợp token hết hạn.
  - `OrchestratorOtpMailerTest`: mọi `OtpMail` đều có template.
  - `SensitiveDtoToStringTest`: chuyển vào `auth.infrastructure.web`.
- **Kết quả:**
  - `./mvnw -pl identity-service -am clean verify`: **354 test xanh**, 0 skip, checkstyle và spotless qua.
  - **Test đặc tả: không đổi snapshot nào.** Đăng ký, xác nhận, gửi lại mã, đăng nhập, làm mới, đặt lại mật khẩu, cùng mọi lỗi 400 liệt kê trường: JSON và status y như cũ.
  - Báo cáo Modulith giảm từ 42 xuống 18 vi phạm, chỉ còn `web` gọi vào `dto` của `address`, `kyc`, `profile`.
- **Kho ArchUnit:**
  - 2 vi phạm `Instant.now()` của `JwtTokenProvider` đã hết.
  - Luật "entity không có method ghi công khai" đổi câu chữ (thêm `auth` vào danh sách bỏ qua), nên kho được ghi lại dưới id mới. Nội dung giữ nguyên, file cũ đã xóa.

## 3. Code đã xóa

- `auth/`: `AuthService`, `AuthServiceImpl`, `AuthMapper`, `dto/` (cả package).
- `email/` (cả package): `EmailService`, `EmailServiceImpl`, `EmailNotificationPublisher`, `EmailProperties`.
- `security/` (cả package): `JwtTokenProvider`, `JwtClaims`, `JwtBearerAuthenticator` cũ, `LoginSecurityConfig`, `AccountPrincipal`, `SecurityConstant`.
- `web/AuthController`.
- `account/LegacyLoginRecord`, `AccountApi.findLoginRecord`.
- 7 mã auth trong `LegacyError`.
- Test cũ:
  - `AuthServiceImplTest`, `EmailServiceImplTest`, `JwtTokenProviderTest`: thay bằng test mới ở mục 2.
  - Phần đăng ký trong `ValidationMessagesTest`: request đăng ký không còn dùng Bean Validation. Thông báo lỗi đã được snapshot `register-invalid` và `register-password-too-long` khóa.

## 4. Lệch khỏi plan

| Chỗ | Plan | Đã làm | Lý do |
|---|---|---|---|
| Port token | `TokenService`, adapter `JwtTokenService` | `SessionTokens`, adapter `JwtSessionTokens` | Mục 3.5: port là danh từ nghiệp vụ. `ModuleArchitectureTest` cấm hậu tố `Service` trong module đã dựng lại |
| `OtpMailProperties` | Có | Không có. Số phút lấy từ `OtpApi.codeLifetime()`; mã template và khóa tiêu đề là hằng trong `OrchestratorOtpMailer` | Thời hạn mã là thông tin của `otp`. Đọc lại `otp.*` từ module khác thì hai module dính cấu hình của nhau |
| Lỗi của bearer token | Không nói | `platform.security.BearerTokenError` | `BearerTokenFilter` ném `MISSING_BEARER_TOKEN`, mà `platform` không được phụ thuộc `auth` |
| `JwtClaims` | Ở `token/` | `SessionTokens.Claims` (port) | Use case `RefreshSession` cần đọc claims, mà `application` không được thấy `infrastructure` |
| Bước dùng chung | Không nói | `OtpDelivery`, `SessionOpener` (package-private) | Hai use case cùng gửi mã xác nhận; hai use case cùng mở phiên |
| `ModuleArchitectureTest` | — | Luật tầng `domain` cho phép rỗng | Mục 3.4: tầng rỗng thì bỏ; `auth` không có domain |

## 5. Hành vi đổi ngoài snapshot

Không test đặc tả nào phải sửa. Có ba điểm hành vi khác trước, đều không nằm trong snapshot:

1. **Đăng nhập bằng chuỗi có `@` nhưng không phải email** (ví dụ `lan@`):
   - Trước: `UserDetailsService` ném `AppException(COMMON_400)`, bị Spring Security bọc thành `InternalAuthenticationServiceException`, nên trả về **401 `AUTH_012` "Token xác thực không hợp lệ"**, một câu trả lời sai chỗ.
   - Giờ: **401 `AUTH_001`**, giống mọi định danh không có tài khoản.
2. **Refresh token có khoảng trắng ở đầu hoặc cuối** giờ được trim trước khi đọc. Trước đây nó trả `REFRESH_TOKEN_INVALID`.
3. **Log gửi mail** giờ ghi email đã che (`masked()`). Trước đây ghi đầy đủ địa chỉ.

## 6. Phát hiện cho phase sau

- **Phase 6:** `auth` còn gọi `UserProfileService` (`createProfile`, `getFullName`, `findFullName`) bằng id dạng `String`. Khi có `ProfileApi`, đổi sang `AccountId` và `FullName`. Lúc đó `fullName` của request đăng ký cũng parse thành `FullName`, không còn `Text.bounded` với `ProfileConstant`.
- Controller cũ (`AccountController`, `AddressController`, `KycController`) đang gọi `currentUser.accountId().toString()`. Phần này hết khi các module đó được dựng lại.
- `RequestText`, `Email.of`, `PhoneNumber.of`/`isValid`/`REGEX` vẫn còn người dùng ở `address` và `profile`.

## 7. Kết quả build

BUILD SUCCESS, 354 test, 0 lỗi, 0 skip (2026-10-30).

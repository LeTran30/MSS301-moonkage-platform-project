# Đánh giá chất lượng code — identity-service

> Ngày: 2026-10-19 · Phạm vi: toàn bộ `src/main` (75 file, ~3.700 dòng) và `src/test` (14 file, 117 test) của nhánh `develop`, gồm cả phần chưa commit (NFC, `JwtTokenProvider`, role enum).
> Tham chiếu: `../Software_Design_v0.6.md`, `docs/Moonkage Requirement Final.md`, `../../../docs/iden-service/auth.md`, nguyên tắc **không hardcode**.

**Thang đánh giá**

| Ký hiệu | Độ sạch code | Đúng miền nghiệp vụ |
|---|---|---|
| 🟢 | Rõ ràng, không trùng lặp, đúng quy ước | Đúng requirement / thiết kế |
| 🟡 | Có điểm cần chỉnh (trùng lặp, hardcode, thiếu nhất quán) | Đúng ý chính, lệch chi tiết hoặc tài liệu chưa khớp |
| 🔴 | Có lỗi cần sửa | Sai nghiệp vụ hoặc vi phạm ranh giới service |

Mã `Q-xx` trỏ tới danh sách phát hiện ở mục 3.

---

## 1. Tóm tắt

| Tiêu chí | Kết quả |
|---|---|
| Build, Spotless, Checkstyle, Error Prone | Đạt (0 vi phạm) |
| ArchUnit (6 rule phân tầng, không vòng package) | Đạt |
| Unit test | 117/117 pass; chưa có test tầng web, tầng JPA, `JwtFilter` |
| Lỗi nghiệp vụ / bảo mật cần sửa | 2 mức Cao, 9 mức Trung bình |
| Nguyên tắc không hardcode | Phần NFC đạt; phần auth / address / email còn vi phạm (Q-06, Q-08, Q-09, Q-13, Q-14) |

**Điểm mạnh**
- Phân tầng rõ (`controller → service → repository`, DTO tách entity), được ArchUnit kiểm tự động.
- Lỗi đi qua một đường: `ErrorCode` → `AppException` → `messages.properties` → `GlobalExceptionHandler`.
- Auth chú ý chống dò tài khoản (FR-02): quên mật khẩu, gửi lại OTP trả lời giống nhau dù email có hay không; OTP đếm cả lần sai của email lạ.
- Đồng thời được xử lý có chủ đích: OTP qua `Map.compute`, địa chỉ mặc định và bộ đếm NFC qua khóa dòng `findByIdForUpdate`.
- Phần NFC (FR-04) đúng thứ tự kiểm của thiết kế 4.2, có test cho từng `reasonCode`.

**Điểm yếu chính**
- Hai lỗi nghiệp vụ ở đăng nhập và filter (Q-01, Q-02).
- Một số quy tắc được viết ở nhiều nơi với giá trị khác nhau (Q-03, Q-07, Q-09).
- Tài liệu và contract lệch code (Q-10, Q-17, Q-21).

---

## 2. Đánh giá theo file

### 2.1. `controller/`

| File | Sạch | Nghiệp vụ | Ghi chú |
|---|---|---|---|
| `AuthController` | 🟢 | 🟢 | Mỏng, chỉ chuyển tiếp. `resend-otp` dùng lại `ForgotPasswordRequest` (tên DTO không khớp mục đích, Q-19) |
| `AddressController` | 🟢 | 🟢 | FR-03; lấy `accountId` từ JWT, không nhận từ body |
| `NfcController` | 🟢 | 🟢 | Đúng bảng API 5.1; `/card` luôn 200 theo contract app |
| `InternalAccountController` | 🟢 | 🟡 | `nfc-status` đúng 5.3; `by-email` chỉ phục vụ seed seller demo (Q-14) |
| `InternalIdNumberController` | 🟢 | 🟢 | D-07: pepper không rời identity |

### 2.2. `service/` và `service/impl/`

| File | Sạch | Nghiệp vụ | Ghi chú |
|---|---|---|---|
| `AuthServiceImpl` | 🟡 | 🔴 | BANNED báo "thử lại sau 15 phút" (Q-01); đặt lại mật khẩu không vô hiệu token cũ (Q-04); OTP dùng chung giữa đăng ký và quên mật khẩu (Q-05); sửa trực tiếp DTO đầu vào (Q-19); chuẩn hóa SĐT lặp (Q-07) |
| `OtpServiceImpl` | 🟢 | 🟡 | Logic khóa, cooldown, quota tốt; mặc định `max-attempts = 3` khác `../../.env` = 5 (Q-03); trạng thái trên RAM (Q-23) |
| `EmailServiceImpl` | 🔴 | 🟢 | Nhánh `publisher == null` không bao giờ chạy nhưng in OTP ra log; tiêu đề email tiếng Việt viết thẳng trong code (Q-06) |
| `AddressServiceImpl` | 🟢 | 🟢 | AC-03.1 đúng: tối đa một mặc định, khóa dòng account khi đổi |
| `AccountServiceImpl` | 🟢 | 🟡 | Chỉ phục vụ seed seller demo (Q-14) |
| `NfcSessionServiceImpl` | 🟢 | 🟡 | Đúng D-20; tạo phiên song song có thể để lại 2 phiên chờ (Q-24); RAM (Q-23) |
| `NfcCardServiceImpl` | 🟢 | 🟡 | Đúng 4.2 và AC-04.5–04.11; sự kiện chưa qua outbox (Q-22) |
| `NfcCardValidator` | 🟢 | 🟢 | Đủ 9 trường A-08, ngày kiểm strict |
| `LegalProfileServiceImpl` | 🟢 | 🟢 | So khớp bằng `MessageDigest.isEqual`; chỉ trả dạng đã che |
| `*Service` (interface) | 🟢 | 🟢 | Javadoc ghi rõ FR/AC |

### 2.3. `security/`

| File | Sạch | Nghiệp vụ | Ghi chú |
|---|---|---|---|
| `jwt/JwtFilter` | 🔴 | 🟢 | `doFilter` nằm trong `try … catch (Exception)`: lỗi phía sau bị đổi thành 401; mất tham số message (Q-02); nhánh `ExpiredJwtException` chết (Q-12). Kiểm khóa tài khoản mỗi request là đúng |
| `jwt/JwtTokenProvider` | 🟢 | 🟡 | Tách sạch khỏi DB; claim `account_verified` snake_case, `accountId` trùng `sub` (Q-20) |
| `SecurityConfig` | 🟡 | 🟢 | Đăng nhập email / SĐT đúng FR-02; chuẩn hóa SĐT lặp (Q-07) |
| `SecurityProperties` | 🟡 | 🟢 | Danh sách mặc định trùng `application.yml` (Q-13) |
| `CurrentUser`, `CurrentUserArgumentResolver` | 🟢 | 🟢 | |
| `CurrentUserInfo` | 🟡 | 🟢 | `@Data` mutable, `role` là `String` thay vì `Role` (Q-25) |

### 2.4. `crypto/`

| File | Sạch | Nghiệp vụ | Ghi chú |
|---|---|---|---|
| `NfcTransportDecryptor` | 🟢 | 🟢 | Chỉ nhận RSA-OAEP-256 + A256GCM (D-17) |
| `PiiCipher` | 🟢 | 🟢 | AES-256-GCM, IV ngẫu nhiên (AC-04.11) |
| `IdNumberHasher` | 🟢 | 🟢 | HMAC có pepper (D-07, D-08), che 4 số cuối (AC-04.12) |

### 2.5. `entity/`, `enums/`, `repository/`

| File | Sạch | Nghiệp vụ | Ghi chú |
|---|---|---|---|
| `Account` | 🟡 | 🟡 | Hai cờ cho một sự thật "đã xác nhận email": `status` và `accountVerified` (Q-15); dùng tên đầy đủ `com.moonkage…SecurityConstant` thay vì import (Q-16); entity gắn với `UserDetails` (chấp nhận được) |
| `UserProfile` | 🟢 | 🟢 | D-21, `@MapsId` |
| `LegalProfile` | 🟢 | 🟢 | Đúng 10 cột AC-04.11, unique `(id_number_hash, id_hash_key_ver)` |
| `Address` | 🟡 | 🟡 | Không kế thừa `BaseEntity`; `LocalDateTime` thay vì `Instant` (Q-17) |
| `BaseEntity` | 🟢 | 🟢 | |
| `enums/*` | 🟢 | 🟢 | `Role` đúng D-19; `NfcReasonCode` khớp 5.1 |
| `AccountRepository` | 🟢 | 🟢 | `findByIdForUpdate` có lý do ghi rõ |
| `AddressRepository`, `UserProfileRepository`, `LegalProfileRepository` | 🟢 | 🟢 | |

### 2.6. `dto/`, `mapper/`

| File | Sạch | Nghiệp vụ | Ghi chú |
|---|---|---|---|
| `RegisterRequest` | 🟡 | 🟢 | Message validation viết thẳng (Q-08); 100 / 8–72 lặp (Q-09). Bắt buộc email: khớp A-17 "demo chỉ đăng ký bằng email" (AC-01.1 cho phép SĐT) |
| `ResetPasswordRequest`, `VerifyRequest`, `LoginRequest`, `ForgotPasswordRequest`, `RefreshTokenRequest` | 🟡 | 🟢 | Message validation viết thẳng (Q-08) |
| `AddressRequest` | 🟡 | 🟢 | Regex `areaCode` viết thẳng (Q-09) |
| `SubmitCardRequest`, `IdNumberCheckRequest` | 🟢 | 🟢 | Bỏ bean validation có chủ đích (BAD_FORMAT tính lần thử) |
| `LoginResponse`, `AccountCreateResponse` | 🟡 | 🟢 | `role`, `status` là `String` (Q-25) |
| `AddressResponse` | 🟡 | 🟡 | Thời điểm không có múi giờ (Q-17) |
| `ErrorResponse` | 🟡 | 🔴 | Khác định dạng chuẩn `{status, error, message, path, timestamp}` (Q-10) |
| NFC response (`Nfc*Response`, `SubmitCardResponse`, `IdNumberCheckResponse`) | 🟢 | 🟢 | Khớp 4.2 / 5.1 |
| `mapper/*Mapper` + `*MapperImpl` | 🟡 | 🟢 | Interface + Impl viết tay cho 1 method, trong khi `LoginResponse` và response NFC dựng trong service (Q-18) |

### 2.7. `config/`, `constant/`, `exception/`, `messaging/`

| File | Sạch | Nghiệp vụ | Ghi chú |
|---|---|---|---|
| `DataInitializer` | 🟡 | 🔴 | Seed seller cho vendor-service (vi phạm ranh giới, mục 1.2 của `boundary-and-hardcode-violations.md` vẫn mở); mặc định họ tên / SĐT viết trong `@Value` (Q-14); chuẩn hóa SĐT lặp (Q-07) |
| `NfcProperties` | 🟢 | 🟢 | |
| `RabbitConfig` | 🟢 | 🟢 | Routing key khớp 5.4 |
| `LocaleConfig` | 🟢 | 🟡 | Hỗ trợ `en`, nhưng message validation luôn tiếng Việt (Q-08) |
| `DotEnvConfig`, `OpenApiConfig`, `WebMvcConfig` | 🟢 | 🟢 | |
| `constant/PhoneConstant`, `IdCardConstant`, `TimeConstant` | 🟢 | 🟢 | |
| `constant/SecurityConstant` | 🟡 | 🟡 | Q-20 |
| `ErrorCode` | 🟡 | 🟢 | Hai mã trùng `COMMON_400` (Q-11) |
| `GlobalExceptionHandler` | 🟡 | 🟡 | Handler JWT không bao giờ chạy (Q-12); định dạng lỗi (Q-10) |
| `AppException` | 🟢 | 🟢 | |
| `NfcEventPublisher`, `NfcVerificationEvent` | 🟢 | 🟡 | Payload chỉ dạng che; chưa outbox (Q-22) |
| `EmailNotificationPublisher`, `EmailNotificationEvent` | 🟢 | 🟢 | |

---

## 3. Danh sách phát hiện

### Mức Cao

**Q-01 — Tài khoản bị khóa vĩnh viễn được báo "thử lại sau 15 phút"**
`service/impl/AuthServiceImpl.java:131-132`. `LockedException` chỉ xảy ra khi `status = BANNED` (`Account.isAccountNonLocked`), tức quản trị khóa, không có thời hạn. Hằng `DEFAULT_LOCKOUT_MINUTES = 15` không gắn với cơ chế nào.
Sửa: mã lỗi riêng, ví dụ `ACCOUNT_BANNED`, không tham số thời gian.

**Q-02 — `JwtFilter` che lỗi thật thành 401**
`security/jwt/JwtFilter.java:71-96`. `filterChain.doFilter(...)` nằm trong `try` có `catch (Exception)`, nên mọi lỗi phát sinh sau filter mà không được MVC xử lý sẽ thành `TOKEN_INVALID`. Ngoài ra `fail()` (dòng 109) tạo `AppException` mới không kèm tham số, nên message `ACCOUNT_NOT_FOUND` hiện `{0}`.
Sửa: chỉ bọc phần xác thực token; gọi `doFilter` ngoài `try`; truyền nguyên `AppException`.

### Mức Trung bình

**Q-03 — Số lần nhập OTP sai có 3 giá trị khác nhau**
`OtpServiceImpl.java:36` mặc định `3`; `.env.example:47` và `docs/auth.md:131` ghi `5`. Thêm vào đó, mỗi giới hạn OTP được viết ở 3 nơi (yml, mặc định của `@Value`, giá trị khởi tạo field), giống tình trạng NFC trước khi có `NfcProperties`.
Sửa: tạo `OtpProperties` (`@ConfigurationProperties("otp")`), một nguồn mặc định.

**Q-04 — Đặt lại mật khẩu không cắt phiên cũ**
`AuthServiceImpl.java:176`. Refresh token 7 ngày vẫn dùng được sau khi đặt lại mật khẩu, nên người đã chiếm phiên vẫn tiếp tục. Đây là giới hạn của JWT không trạng thái.
Sửa: thêm `passwordChangedAt` (hoặc `tokenVersion`) vào `Account`, ghi vào token và so khi refresh.

**Q-05 — OTP không tách theo mục đích**
`OtpService` khóa theo email. Mã gửi lúc đăng ký cũng được `forgotPasswordReset` chấp nhận (tài khoản chưa xác nhận vẫn bị đổi mật khẩu được), và ngược lại.
Sửa: khóa map theo `(mục đích, email)`.

**Q-06 — `EmailServiceImpl` có nhánh chết in OTP ra log, tiêu đề viết thẳng**
`EmailServiceImpl.java:52-54`: `emailNotificationPublisher` được inject qua constructor nên không bao giờ null; nếu nhánh này chạy thì OTP bị ghi vào log. Dòng 27-28: tiêu đề email tiếng Việt viết trong code.
Sửa: xóa nhánh; chuyển tiêu đề vào `messages.properties` (hoặc để notification-service chọn theo `templateCode`).

**Q-07 — Chuẩn hóa số điện thoại lặp ở 3 nơi**
`AuthServiceImpl.java:243`, `SecurityConfig.java:46`, `DataInitializer.java:63` đều tự cắt 9 số cuối. Sửa một chỗ quên chỗ khác thì đăng ký và đăng nhập sẽ lệch nhau.
Sửa: một hàm duy nhất (ví dụ trong `AccountService`) cho cả ba nơi gọi.

**Q-08 — Message validation viết thẳng tiếng Việt trong 7 DTO**
`RegisterRequest`, `ResetPasswordRequest`, `VerifyRequest`, `LoginRequest`, `ForgotPasswordRequest`, `RefreshTokenRequest`, `AddressRequest`. Vi phạm nguyên tắc không hardcode; `LocaleConfig` hỗ trợ `en` nhưng các message này luôn là tiếng Việt.
Sửa: `message = "{validation.email.required}"` cùng key trong `messages.properties`, và cấu hình `LocalValidatorFactoryBean` dùng `MessageSource`.

**Q-10 — Định dạng lỗi khác chuẩn đã chốt**
`ErrorResponse` trả `{success, code, message, errors, timestamp}`, trong khi `docs/auth.md:70` và Software Design 5.1 quy tắc 8 chốt `{status, error, message, path, timestamp}` (thêm `code` cho lỗi nghiệp vụ).
Sửa: chọn một định dạng rồi cập nhật bên còn lại, vì client web / app phải biết dạng nào là đúng.

**Q-14 — identity-service seed tài khoản seller cho vendor-service**
`DataInitializer.java` (seed seller), `InternalAccountController.getByEmail`, `AccountServiceImpl` chỉ tồn tại cho việc này. Mục 1.2 của `boundary-and-hardcode-violations.md` vẫn chưa xử lý. Các mặc định `"Nguyễn Văn Bánh"`, `"0901234567"` nằm trong `@Value` (dòng 46-49), trùng với `application.yml`.
Sửa: chuyển dữ liệu demo sang profile `demo` hoặc script seed; bỏ mặc định trong Java.

**Q-17 — Thời điểm của địa chỉ không có múi giờ**
`Address.java:48`, `AddressResponse.java:19` dùng `LocalDateTime`, trong khi mọi entity khác dùng `Instant` qua `BaseEntity`. Software Design 5.1 quy tắc 7 yêu cầu "thời điểm ISO 8601 có múi giờ".
Sửa: cho `Address` kế thừa `BaseEntity`.

**Q-21 — `auth.md` còn mô tả cách lưu SĐT cũ**
`docs/auth.md:52` ghi "luôn được lưu dạng `0xxxxxxxxx`", trong khi code hiện lưu 9 số cuối, và API trả `phoneNumber` 9 số.
Sửa: cập nhật tài liệu (kèm lưu ý cho client hiển thị lại số `0`).

**Q-22 — Sự kiện `account.nfc_verified` chưa qua outbox**
`NfcEventPublisher` gửi sau commit; broker lỗi lúc đó thì mất sự kiện (web không tự cập nhật, mất audit). Software Design mục 6 yêu cầu outbox cho sự kiện này.

### Mức Thấp

| Mã | File:dòng | Vấn đề | Hướng sửa |
|---|---|---|---|
| Q-09 | `AccountCreateRequest:28,32`, `ResetPasswordRequest:23`, `AddressRequest:24` | Họ tên ≤ 100 lặp với cột `UserProfile`; mật khẩu 8–72 lặp 2 lần; regex `areaCode` viết thẳng | Hằng trong `constant/` (như `IdCardConstant`) |
| Q-11 | `ErrorCode:13,15` | `INVALID_INPUT` và `MALFORMED_JSON` cùng mã `COMMON_400` | Tách mã |
| Q-12 | `GlobalExceptionHandler:79-87`, `JwtFilter:92` | Handler `ExpiredJwtException` / `JwtException` không bao giờ chạy vì `JwtTokenProvider` đã đổi sang `AppException` | Xóa |
| Q-13 | `SecurityProperties:16-29` | Danh sách endpoint công khai lặp với `application.yml` | Để danh sách rỗng, chỉ khai báo trong yml |
| Q-15 | `Account:49-62`, `AuthServiceImpl.verifyAccount` | `status = ACTIVE` và `accountVerified = true` cùng nói "đã xác nhận email", luôn được đặt cùng nhau, có thể lệch nhau | Giữ một trường, trường kia suy ra |
| Q-16 | `Account:86` | Tên đầy đủ `com.moonkage.identity.constant.SecurityConstant` trong code | Import |
| Q-18 | `mapper/*` | Interface + Impl viết tay (đặt tên như MapStruct) cho 1 method; response khác lại dựng trong service | Chọn một cách: mapper cho mọi response, hoặc factory tĩnh trên DTO |
| Q-19 | `AuthServiceImpl:56-57`, `dto/request/*` | Sửa trực tiếp DTO đầu vào; DTO cũ là class Lombok mutable, DTO mới là record; `resend-otp` dùng `ForgotPasswordRequest` | Chuẩn hóa vào biến cục bộ; thống nhất record; DTO `EmailRequest` |
| Q-20 | `SecurityConstant:15` | Claim `account_verified` snake_case giữa các claim camelCase; claim `accountId` trùng `sub`; thiết kế mục 8 chỉ liệt kê `sub`, `type`, `role` | Gỡ hoặc ghi vào thiết kế |
| Q-23 | `OtpServiceImpl`, `NfcSessionServiceImpl` | OTP và phiên NFC nằm trên RAM: chỉ đúng khi chạy 1 instance; restart mất mã / phiên | Chấp nhận cho demo, ghi rõ giới hạn; nếu scale thì dùng Redis |
| Q-24 | `NfcSessionServiceImpl.createSession` | `removeIf` rồi `put` không nguyên tử: hai request tạo phiên cùng lúc để lại 2 phiên chờ | Dùng một `compute` theo account |
| Q-25 | `CurrentUserInfo`, `LoginResponse.role`, `AccountCreateResponse.status` | Enum bị đổi thành `String` | Dùng `Role`, `AccountStatus` |

---

## 4. Kiểm thử

| Vùng | Có test | Thiếu |
|---|---|---|
| Auth (service) | `AuthServiceImplTest` (9) | Đăng ký trùng email / SĐT, xác nhận OTP, đặt lại mật khẩu |
| OTP | `OtpServiceImplTest` (15) | Q-05 (dùng mã đăng ký để đặt lại mật khẩu) |
| Địa chỉ | `AddressServiceImplTest` (5) | |
| NFC | Validator (23), session (12), card (11), legal profile (7), crypto (13) | Publisher sự kiện |
| JWT | `JwtTokenProviderTest` (8) | `JwtFilter` (bị khóa giữa chừng, endpoint công khai có token hỏng) |
| Web | — | Không có `@WebMvcTest`: mã HTTP, validation, `@CurrentUser` |
| JPA | — | Không có `@DataJpaTest`: unique key email / SĐT / `uk_legal_profiles_id_hash`, `findByIdForUpdate`, `validateAccountUniqueness` |
| Đăng nhập bằng SĐT | — | `SecurityConfig.userDetailsService` với 3 dạng số |
| Kiến trúc | `ArchitectureTest` (6) | |

---

## 5. Trạng thái sửa (cập nhật 2026-10-19)

Sau khi sửa: 154/154 test pass (thêm 37 test, trong đó 15 test tích hợp trên PostgreSQL), Checkstyle / Error Prone / ArchUnit đạt.

| Mã | Trạng thái | Đã làm |
|---|---|---|
| Q-01 | Đã sửa | `AUTH_003` không còn tham số thời gian; message "bị quản trị viên khóa" |
| Q-02 | Đã sửa | `JwtFilter` chỉ bọc phần xác thực, `doFilter` nằm ngoài `try`; giữ nguyên `AppException` (kèm tham số). Thêm `JwtFilterTest` (7 case) |
| Q-03 | Đã sửa | `OtpProperties`, mặc định `maxAttempts = 5` khớp `../../.env` / `auth.md` |
| Q-04 | Đã sửa | `accounts.password_changed_at`; token có `iat` trước đó bị từ chối ở `JwtFilter` và `/refresh-token`. Giới hạn còn lại: gateway không tra DB, access token cũ vẫn tới service khác đến khi hết hạn |
| Q-05 | Đã sửa | `OtpPurpose`; OTP khóa theo `(mục đích, email)` |
| Q-06 | Đã sửa | Bỏ nhánh in OTP; tiêu đề email ở `messages.properties` |
| Q-07 | Đã sửa | Một hàm `Account.storedPhoneNumber`, có `AccountTest` |
| Q-08 | Đã sửa | Message validation dùng key `{validation.*}`; validator đọc `messages.properties` (`ValidationMessagesTest`) |
| Q-09 | Đã sửa | `AccountConstant`, `AddressConstant`; cột `user_profiles.full_name` dùng chung hằng |
| Q-10 | Đã sửa | `ErrorResponse` = `{status, error, code, message, path, errors?, timestamp}` |
| Q-11 | Đã sửa | `MALFORMED_JSON` = `COMMON_400_JSON` |
| Q-12 | Đã sửa | Bỏ handler JWT không bao giờ chạy |
| Q-13 | Đã sửa | `SecurityProperties` mặc định rỗng, danh sách chỉ ở yml |
| Q-14 | Đã sửa | Phương án C: code chỉ tự tạo admin. Bỏ seed seller (`DataInitializer`, `app.seller.*`, mật khẩu mặc định `Seller@123`), `GET /internal/accounts/by-email` và `AccountService`; phía vendor bỏ `DemoVendorSeeder`. Dữ liệu demo tạo bằng `api/docs/seed/*.sql`, hướng dẫn ở `../../api/docs/seed/README.md` (đã chạy thử trên postgres:17-alpine; `SeedPasswordHashTest` kiểm hash pgcrypto đăng nhập được) |
| Q-15 | Đã sửa | Phương án A, theo Requirement 7.1: tài khoản chỉ có "đã xác nhận email" (`accountVerified`) và trạng thái NFC (suy ra). Bỏ `AccountStatus` (`INACTIVE` trùng `accountVerified`, `BANNED` không có trong requirement và không code nào đặt), bỏ `AUTH_003` / `AUTH_004`. Response đăng ký / xác nhận trả `verified` thay `status`. Migration `../../api/docs/2026-10-19_drop_account_status.sql` (tự dừng nếu dữ liệu lệch; đã chạy thử) |
| Q-16 | Đã sửa | Import `SecurityConstant` |
| Q-17 | Đã sửa | `Address` kế thừa `BaseEntity`, thời điểm là `Instant` |
| Q-18 | Đã sửa | Mapper là class tĩnh trong `mapper/` (bỏ interface + Impl viết tay); mọi response dựng từ entity đi qua đây, kể cả `LoginResponse` và response NFC nội bộ (`LegalProfileMapper`). Không đặt factory trên DTO vì ArchUnit cấm `dto → entity` |
| Q-19 | Đã sửa | `register` không sửa DTO đầu vào; `ForgotPasswordRequest` → `EmailRequest` |
| Q-20 | Đã sửa | Token chỉ còn `sub`, `type`, `role`, `iat`, `exp` (Software Design 8); có test kiểm tên claim. Gateway chỉ đọc `sub` / `type` / `role` nên không bị ảnh hưởng |
| Q-21 | Đã sửa | `auth.md` cập nhật: SĐT 9 số, role enum, định dạng lỗi, mã HTTP, OTP theo mục đích, cắt phiên khi đặt lại mật khẩu |
| Q-22 | Đã sửa | Bảng `outbox_events` + `OutboxRelay` (publisher confirm, giữ thứ tự); 3 sự kiện NFC đi qua outbox |
| Q-23 | Ghi nhận | Giới hạn 1 instance đã ghi trong `auth.md` và Javadoc `OutboxRelay` |
| Q-24 | Đã sửa | Tạo phiên NFC đồng bộ; test 16 luồng song song |
| Q-25 | Đã sửa | `CurrentUserInfo` là record với `Role`; `LoginResponse.role`, `AccountCreateResponse.status` là enum (JSON không đổi) |
| Test web / JPA | Đã làm | Testcontainers `postgres:17-alpine` (như docker-compose), profile `it`. `RepositoryIntegrationTest` (7): unique email / SĐT / CCCD, query kiểm trùng, `FOR UPDATE`, thứ tự địa chỉ và outbox. `IdentityApiIntegrationTest` (8): đăng ký → xác nhận → đăng nhập bằng SĐT khác dạng → `/me`, định dạng lỗi, 401 kèm `path`, đặt lại mật khẩu cắt phiên cũ, mã đăng ký không đặt lại được mật khẩu, địa chỉ có múi giờ, phiên NFC theo chủ. Bỏ qua khi máy không có Docker |
| (mới) | Đã sửa | Test tích hợp phát hiện `JwtFilter` dò endpoint công khai bằng `getServletPath()` (rỗng ngoài Tomcat); đổi sang `UrlPathHelper.getPathWithinApplication`, đúng cả khi sau gateway (context path `/identity-service`) |

## 6. Thứ tự sửa đề xuất (ban đầu)

1. **Q-01, Q-02**: lỗi hành vi, sửa nhỏ, nên làm ngay kèm test.
2. **Q-06, Q-07, Q-03**: dọn rủi ro log OTP và quy tắc bị lặp với giá trị lệch nhau.
3. **Q-05, Q-04**: bảo mật luồng OTP / mật khẩu.
4. **Q-10, Q-17, Q-21**: chốt contract với client trước khi web và app tích hợp sâu hơn.
5. **Q-08, Q-09, Q-13, Q-14**: hoàn tất nguyên tắc không hardcode cho phần auth.
6. **Q-22** và test tầng web / JPA.
7. Các mục còn lại ở mức Thấp, làm khi chạm vào file liên quan.

# Plan v2, Phase 4: module `account` + `otp`

Ngày: 2026-10-29. Plan: [identity-service-refactor-plan.md](identity-service-refactor-plan.md) mục 4.2, 4.5, Phase 4. Nhánh `refactor/identity-v2`.

## 1. Đã làm

**`account`** ([AccountApi.md](classes/AccountApi.md)):
- Gốc module (hợp đồng): `AccountApi`, `AccountView`, `CredentialCheck` (`Accepted` / `NotActivated` / `Rejected`), `LoginIdentifier` (`ByEmail` / `ByPhoneNumber`), `RawPassword`, `AccountError`.
- `RawPassword` có hai cửa vào. `parse` áp chính sách 8–72 ký tự (quyết định C4) và báo đủ `{min}`, `{max}` cho khóa `validation.password.size`. `forLogin` chỉ đòi không rỗng. In ra là `[PROTECTED]`.
- `domain/`: `Account` (id không `@GeneratedValue`, factory `registerMember(AccountId, …)`, `confirmEmail`, `changePassword`) và `PasswordHash` (record, in ra `[PROTECTED]`).
- `application/`: use case `RegisterMember`, `ConfirmEmail`, `ChangePassword`, `VerifyCredentials`, cộng `AccountQueries`. Hai port `AccountRepository` và `PasswordHasher`.
- `infrastructure/`:
  - `persistence/JpaAccountRepository`. `add` gọi `persist` rồi `flush`. Gặp vi phạm khóa duy nhất thì đọc tên khóa và trả `EMAIL_ALREADY_EXISTS` hoặc `PHONE_ALREADY_EXISTS` (409).
  - `persistence/PasswordHashConverter`.
  - `crypto/BCryptPasswordHasher`. `dummyMatch` so với hash của một chuỗi ngẫu nhiên sinh lúc khởi động.
- `RegisterMember` lấy id từ `IdGenerator` (UUID v7). Cột id vẫn là `varchar` tới Phase 8b.

**`otp`** ([OtpApi.md](classes/OtpApi.md)):
- Gốc module: `OtpApi` (`issue`, `throttle`, `verify`, `discard`), `OtpCode`, `OtpPurpose`, `OtpError`.
- `OtpCode` sinh mã từ `SecureRandom`, so khớp trong thời gian hằng số, in ra là `[PROTECTED]`.
- `domain/`: `OtpEntry` (record bất biến, mọi luật gửi/đoán/khóa), `OtpRules` (dựng từ `otp.*`, tự kiểm), `OtpKey`.
- `application/`: `IssueOtp`, `ThrottleOtpSend`, `VerifyOtp`, `DiscardOtp`, port `OtpStore`.
- `infrastructure/memory/InMemoryOtpStore` trên `ExpiringMap` của `platform`. Phiếu được giữ đủ lâu để mã, khóa, thời gian chờ và khung giờ gửi đều hết hạn trước (`OtpRules.retention()`).
- `infrastructure/config/OtpProperties` và `OtpConfig`.
- Thời gian lấy từ `Clock`.

**Mã lỗi** dời từ `LegacyError` về module sở hữu, giữ nguyên mã và khóa message:
- `AccountError`: `AUTH_007`, `AUTH_008`, `USER_001`.
- `OtpError`: `AUTH_005`, `AUTH_014`, `AUTH_015`, `AUTH_016`.

**Code cũ chuyển sang API mới:** `AuthServiceImpl`, `AuthMapper`, `UserProfileServiceImpl`, `UserProfileMapper`, `AddressServiceImpl`, `LegalProfileServiceImpl`, `NfcServiceImpl`, `NfcProfileSeeder`, `JwtBearerAuthenticator`, `JwtTokenProvider`, `LoginSecurityConfig`, `AccountPrincipal`. Id không phải UUID được trả lời như tài khoản không tồn tại (`AccountId.tryParse`).

**Luật máy kiểm:**
- `ModuleArchitectureTest` kiểm các module đã dựng lại (danh sách trong `RebuiltModules`, hiện có `account` và `otp`):
  - code ngoài module chỉ dùng gốc package;
  - gốc package chỉ phụ thuộc `shared` và `java.*`;
  - `domain` không phụ thuộc Spring hay tầng ngoài;
  - `application` không phụ thuộc `infrastructure`;
  - không class nào tên `*Impl`, `*Service`, `*Mapper`, `*Constant`;
  - không `@GeneratedValue`, không `UUID.randomUUID()`.
- `ComponentArchitectureTest` và luật "entity không có method ghi công khai" của `DomainModelArchitectureTest` bỏ qua các module đã dựng lại. Các luật đó viết cho bố cục component cũ, nơi entity phải package-private.
- `ErrorCodeCatalogTest` kiểm thêm `AccountError` và `OtpError`.

## 2. Test

**Viết trước khi chuyển người gọi:**
- `VerifyCredentialsTest`:
  - bốn nhánh;
  - email lạ vẫn chạy `dummyMatch`;
  - sai mật khẩu của tài khoản chưa xác nhận vẫn trả `Rejected`, không lộ tài khoản;
  - đăng nhập bằng số điện thoại;
  - mật khẩu đặt trước khi có chính sách vẫn đăng nhập được.
- `BCryptPasswordHasherTest`:
  - khớp hash seed pgcrypto `$2a$`;
  - `dummyMatch` mất cùng cỡ thời gian với một lần so thật.
- `ParallelRegistrationIntegrationTest`: 8 luồng đăng ký trùng email hoặc trùng số điện thoại trên PostgreSQL thật. Đúng một luồng thành công, các luồng còn lại nhận 409.
- `AccountFacadeTest` (có thêm 16 luồng trên repository giả), `AccountTest`, `RawPasswordTest`, `LoginIdentifierTest`, `JpaAccountRepositoryIntegrationTest`.
- `OtpFacadeTest` port toàn bộ kịch bản của `OtpServiceImplTest` cũ, thời gian chạy bằng `MovableClock`. Cùng nhóm có `OtpRulesTest` và `InMemoryOtpStoreTest`.

**Kết quả:**
- `./mvnw -pl identity-service -am clean verify`: **347 test xanh**, 0 skip, checkstyle và spotless qua.
- **Test đặc tả: không đổi snapshot nào.** Đăng ký, OTP, đăng nhập, refresh và đặt lại mật khẩu trả đúng JSON và status như trước.
- Báo cáo Modulith giảm từ 123 xuống 42 vi phạm. Không còn vi phạm nào vào `account` hay `otp`. Phần còn lại là `web` gọi vào `dto` của `auth`, `kyc`, `address`, `profile`.

## 3. Code đã xóa

- `account/`:
  - `AccountService`, `AccountServiceImpl`, `AccountMapper`, `AccountRepository` cũ;
  - `atom/` (`PasswordConstant`, `PasswordHashConverter`; `PasswordHash` dời vào `domain`);
  - `dto/AccountCredentials`, `dto/AccountView`.
  - `dto/AccountResponse` dời sang `profile/dto`, vì chỉ `profile` ghép nó.
- `otp/OtpService`, `OtpServiceImpl`.
- Khóa `otp.min`, `otp.range` trong `application.yml`. Mã giờ luôn là 6 chữ số, quy tắc nằm trong `OtpCode`.
- 7 mã trong `LegacyError`.
- Test cũ:
  - `AccountServiceImplTest`, `OtpServiceImplTest`: thay bằng test use case.
  - `ValueObjectsTest`: phần `CitizenId` dời sang `kyc/CitizenIdTest`.
  - `SeedPasswordHashTest`: gộp vào `BCryptPasswordHasherTest`.
- Kho ArchUnit: bỏ vi phạm `Instant.now()` đã đóng băng của `OtpServiceImpl` (4 dòng).

## 4. Lệch khỏi plan

| Chỗ | Plan | Đã làm | Lý do |
|---|---|---|---|
| Lớp hiện thực API | Use case implement API (kiểu `ProfileQueries implements ProfileApi`) | `AccountFacade implements AccountApi`, `OtpFacade implements OtpApi`, chỉ chuyển lời gọi | Mỗi use case một class, một method `handle`. Một use case không thể implement cả API nhiều method, nên lớp đứng trước có tên đúng việc nó làm |
| `AccountApi` | Chỉ các method mục 4.2 | Thêm 3 method chuyển tiếp: `findLoginRecord` (bỏ ở Phase 5), `requireExists` (Phase 6), `lockForUpdate` (Phase 7) | Đăng nhập vẫn đi qua `AuthenticationManager` tới ĐIỂM DỪNG E. `address`, `kyc` chưa dựng lại |
| `LegacyLoginRecord` | Không có | View + chuỗi hash cho `UserDetailsService`, in ra che hash | Để `PasswordHash` không rời module ngay cả trong lúc chuyển tiếp |
| `OtpCode.parse` | Không nói | Không trim | Mã thừa khoảng trắng bị coi là sai, như hành vi cũ |
| `otp.min`, `otp.range` | Không nói | Bỏ | Mã 6 số là quy tắc của `OtpCode`, không phải cấu hình |
| `AccountResponse` | Không nói | Dời sang `profile/dto` | Nó ghép tài khoản với họ tên, nên thuộc về `profile` |
| Luật kiến trúc cũ | Bỏ ở Phase 9 | Bỏ qua module đã dựng lại, qua `RebuiltModules` | Entity của module mới là public trong module; `ModuleArchitectureTest` chặn bên ngoài thay |

## 5. Phát hiện cho phase sau

- **Phase 5:** `LoginSecurityConfig`, `AccountPrincipal`, `LegacyLoginRecord` và `AccountApi.findLoginRecord` sẽ được thay bằng `verifyCredentials`. Test đặc tả `login-*` đã khóa bốn câu trả lời: 200, 401 `AUTH_001`, 403 `AUTH_002`, 400 thiếu trường.
- `JwtTokenProvider` còn đọc `Instant.now()`. Vi phạm này đã đóng băng; trong kho chỉ đổi tên class `AccountView`.
- `Email.of`, `PhoneNumber.of`, `PhoneNumber.isValid` vẫn còn người dùng ở `auth`, `profile`, `address`, nên chưa xóa được.

## 6. ⛔ ĐIỂM DỪNG E

`VerifyCredentials` và test của nó đã sẵn sàng nhưng **chưa nối vào đăng nhập**. Chờ duyệt trước khi bắt đầu Phase 5.

## 7. Kết quả build

BUILD SUCCESS, 347 test, 0 lỗi, 0 skip (2026-10-29).

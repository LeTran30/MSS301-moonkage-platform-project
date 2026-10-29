# Plan v2, Phase 3: nền móng `shared` + `platform`

Ngày: 2026-10-29. Plan: [identity-service-refactor-plan.md](identity-service-refactor-plan.md) mục 4.1, 5, 6, Phase 3. Nhánh `refactor/identity-v2`.

## 1. Đã làm

**`shared`** (Java thuần, module Modulith mở):
- `Email`, `PhoneNumber`: hai cửa vào theo mục 5.2. `parse` là nguồn quy tắc và ném `ValueRejected`. Constructor chỉ kiểm cấu trúc (không rỗng), để đọc dữ liệu cũ không vỡ khi siết quy tắc. `toString()` trả bản che. Bỏ `Serializable`.
- `Role`, `AccountId` (`tryParse`, `fromStored`), `VietnamTime.ZONE` (thay `TimeConstant`).
- `id/IdGenerator`.
- `value/ValueRejected` (không chụp stack trace), `value/Text`.
- `error/ErrorCode` (interface; `httpStatus()` là `int` để `shared` không phụ thuộc Spring), `AppException`, `CommonError` (`COMMON_xxx`), `LegacyError` (các mã còn lại, giữ nguyên mã và khóa message).

**`platform`** (module Modulith mở, không biết module nghiệp vụ):
- `config/`: `ClockConfig`, `LocaleConfig`, `OpenApiConfig`, `DotEnvConfig` (dời từ `common/config`).
- `web/`: `ApiResponse`, `GlobalExceptionHandler` (thêm xử lý `InvalidFields`, điền placeholder có tên như `{max}`), `validation/FieldParser`, `validation/InvalidFields`.
- `security/`: `SecurityConfig` (chỉ còn filter chain), `BearerTokenFilter`, SPI `BearerTokenAuthenticator`, `CurrentUser`, `CurrentUserInfo`, `CurrentUserArgumentResolver`, `WebMvcConfig`, `SecurityProperties`.
- `id/UuidV7Generator` (đọc giờ từ `Clock`).
- `persistence/`: `BaseEntity`, `EmailConverter`, `PhoneNumberConverter`.
- `memory/ExpiringMap`: `compute` nguyên tử, TTL theo `Clock`, `purgeExpired`.
- `messaging/`: `RabbitConfig` (chỉ exchange và converter; routing key về module sở hữu). `outbox/` gồm `Outbox`, `EventId`, `OutboxEvent`, `OutboxEventRepository`, `OutboxRelay`, `OutboxProperties`.

**Outbox:** `Outbox.enqueue(routingKey, eventId -> event)` sinh `EventId` qua `IdGenerator`, đưa id vào event để payload mang đúng id của dòng outbox, rồi lưu bằng `persist` (không `save`/`merge`). `OutboxEvent` không còn builder, có factory `record(...)`. `OutboxRelay` đọc giờ từ `Clock`.

**Code cũ chuyển sang nền mới:**
- `JwtFilter` tách làm hai: `platform.security.BearerTokenFilter` và `security.JwtBearerAuthenticator` (implement SPI).
- Bean đăng nhập (`UserDetailsService`, `PasswordEncoder`, `AuthenticationProvider`, `AuthenticationManager`) dời sang `security.LoginSecurityConfig`, chờ Phase 5 (ĐIỂM DỪNG E).
- `NfcVerificationEvent` nhận `eventId` từ outbox.
- Mail OTP lấy `eventId` từ `IdGenerator`.
- Routing key `account.nfc_*` về `NfcVerificationEvent.Type`, `orchestrator.email.identity` về `EmailNotificationPublisher`.
- Bất biến của `Account` và `NfcLockout` dùng `Objects.requireNonNull` / `IllegalArgumentException` thay cho `DomainGuard` (mục 5.4: bất biến bị phá là bug, không phải 400).

**Test mới:**
- `EmailTest`, `PhoneNumberTest`, `AccountIdTest`, `TextTest`.
- `UuidV7GeneratorTest`, `ExpiringMapTest`, `OutboxTest`.
- Thêm vào `GlobalExceptionHandlerTest`: `FieldParser` + `InvalidFields`, có bảng ghi đè khóa.
- `ErrorCodeCatalogTest`: mã không trùng, mọi khóa có trong mọi file `messages*.properties`.
- `FoundationArchitectureTest`: `shared` chỉ dùng `java.*`; `platform` không phụ thuộc module nghiệp vụ; không package `common|util|helper`; không `*Impl|*Constant|*Mapper`, không `@GeneratedValue`, không `UUID.randomUUID()` trong `shared`/`platform`.
- `ModulithStructureTest` (chế độ báo cáo).
- `SequentialIdGenerator` cho test.

## 2. Test

- `./mvnw -pl identity-service -am clean verify`: **307 test xanh** (269 trước phase + 38 mới), 0 skip, checkstyle và spotless qua.
- **Test đặc tả: không đổi snapshot nào.** Mọi thay đổi ở phase này đều nằm bên trong; JSON, status và sự kiện vẫn như cũ.
- Báo cáo Modulith: còn 123 vi phạm, đều là các component cũ gọi vào package con `dto` của nhau (`auth → account`, `security → account`, `web → auth/kyc/address/account`, `profile → account`). Không có vòng phụ thuộc. Các vi phạm này hết dần khi Phase 4–7 dựng lại từng module.

## 3. Code đã xóa

- `common/` (cả package): `DomainGuard`, `TimeConstant`, `exception/ErrorCode` (enum), `exception/AppException`. Phần còn lại dời sang `shared`/`platform`.
- `account/atom/Email`, `PhoneNumber`, `Role` cùng hai converter. `account/atom` còn `PasswordHash` chờ Phase 4.
- `outbox/` (cả package), gồm cặp `OutboxService` + `OutboxServiceImpl`.
- `security/JwtFilter`. Hằng `AUTHORIZATION_HEADER`, `BEARER_PREFIX`, `ROLE_PREFIX` trong `SecurityConstant`.
- Test: `DomainGuardTest`; `JwtFilterTest` thành `JwtBearerAuthenticationTest`; phần Email/PhoneNumber của `ValueObjectsTest` chuyển sang `shared`.

## 4. Lệch khỏi plan

| Chỗ | Plan | Đã làm | Lý do |
|---|---|---|---|
| `Email.of`, `PhoneNumber.of`, `PhoneNumber.isValid`, `PhoneNumber.REGEX` | Chỉ `parse` | Giữ tạm. `of` gọi `parse` rồi đổi `ValueRejected` thành `AppException(COMMON_400)` | Code cũ (`AuthServiceImpl`, `AccountServiceImpl`, DTO Bean Validation) chưa đi qua `FieldParser`. Xóa ở Phase 4–7, khi module tương ứng được dựng lại |
| `RequestText` | Xóa khi không còn ai dùng | Dời tạm vào `platform/web/validation` | Năm request DTO cũ còn dùng; package `common` thì phải xóa ngay |
| `ErrorCode.httpStatus()` | Không nói kiểu | `int` | `shared` không phụ thuộc Spring (`HttpStatus`) |
| Outbox | `EventId` sinh qua `IdGenerator` | `Outbox` tự sinh id, truyền vào hàm dựng event | Bảo đảm `eventId` trong payload luôn trùng id dòng outbox; bên gọi không cần `IdGenerator` |
| `CurrentUserInfo` | Mang `AccountId` (mục 5.5.7) | Vẫn `String` | Gắn với JWT, làm ở Phase 5 |
| Modulith | `ApplicationModules...verify()` ở Phase 9 | Thêm `spring-modulith-api` (chỉ annotation) và đánh dấu `shared`, `platform` là module `OPEN` | Mặc định Modulith chỉ coi package gốc là API, nên `shared.error`, `platform.web`... bị báo sai |
| Thời gian trong test đặc tả | `Clock` cố định | Chưa | OTP và JWT vẫn đọc giờ hệ thống; Phase 4–5 |

## 5. Phát hiện cho phase sau

- **Phase 4, `RawPassword`:** khóa `validation.password.size` có cả `{min}` lẫn `{max}`. `ValueRejected.tooShort(min)` chỉ mang `min`, nên `RawPassword.parse` phải đưa đủ hai tham số (hoặc `FieldParser` nhận tham số bổ sung). Nếu không, message sẽ hiện nguyên chữ `{max}`.
- Vi phạm `Instant.now()` đã đóng băng: `OutboxRelay` hết. Hai vi phạm của `ApiResponse` chỉ đổi tên class trong kho.

## 6. Kết quả build

BUILD SUCCESS, 307 test, 0 lỗi, 0 skip (2026-10-29).

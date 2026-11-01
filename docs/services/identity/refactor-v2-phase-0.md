# Plan v2, Phase 0: khảo sát identity-service

Ngày: 2026-10-29. Plan: [identity-service-refactor-plan.md](identity-service-refactor-plan.md). Phase này không sửa code.

## 1. Môi trường

| Mục | Giá trị |
|---|---|
| Build | Maven đa module (`api/pom.xml`), Java 21 |
| Spring Boot / Cloud | 3.5.16 / 2025.0.3 (Hibernate 6.6, Jackson 2.x theo BOM của Boot) |
| Lệnh test (như CI) | `cd api && ./mvnw -pl identity-service -am clean verify` (checkstyle, spotless, ArchUnit 1.5.1) |
| Migration | Flyway, `identity-service/src/main/resources/db/migration`; seed dev `db/seed/R__seed.sql` (`app.seed.enabled`) |
| Hạ tầng test | Testcontainers Postgres 17 (`@ServiceConnection`), profile `it`. RabbitMQ **bị mock** (`@MockitoBean RabbitTemplate`). Chưa có Spring Modulith |
| Mốc test | 218 test xanh, 0 skip, trên `develop` cộng thay đổi chưa commit (giai đoạn 1–2 của `domain-model-plan.md`) |

## 2. Bên ngoài dùng identity

| Thứ | Bên dùng | Cách dùng |
|---|---|---|
| `POST /internal/accounts/check` | vendor-service | OpenFeign `IdentityClient` + `IdentityClientConfig` (giải mã lỗi). **`nfcVerifiedAt == null` được hiểu là chưa KYC** (`VendorServiceImpl.getOwnerCard`), và vendor lưu giá trị vào `vendor_owner_checks.nfc_verified_at` |
| `GET /internal/nfc/status/{accountId}` | vendor-service, quotation-service | OpenFeign `IdentityClient` |
| `account.nfc_verified`, `account.nfc_failed`, `account.nfc_locked` | orchestrator-service | Queue `orchestrator.nfc`, bind cứng ba routing key (`RabbitConfig.NFC_ROUTING_KEYS`) |
| `orchestrator.email.identity` | orchestrator-service | Gửi đồng bộ, không qua outbox |

## 3. Hợp đồng

### 3.1. Endpoint và mã lỗi

Suy từ code; Phase 1 xác nhận bằng test đặc tả. Mọi endpoint có thể trả `COMMON_500`, `COMMON_405`, `COMMON_404` (đường dẫn sai). Endpoint có body thêm `COMMON_400` (`INVALID_INPUT`) và `COMMON_400_JSON`. Endpoint cần đăng nhập thêm `AUTH_010` (thiếu token), `AUTH_011` (hết hạn), `AUTH_012` (token sai, tài khoản không còn, token phát trước lần đổi mật khẩu), `AUTH_002` (chưa kích hoạt).

| Endpoint | Đăng nhập | Mã riêng |
|---|---|---|
| `POST /api/auth/register` | — | `AUTH_007`, `AUTH_008`; gửi mail lỗi thì vẫn 2xx với `otpSent = false` |
| `POST /api/auth/login` | — | `AUTH_001`, `AUTH_002` (chỉ khi mật khẩu đúng) |
| `POST /api/auth/refresh-token` | — | `AUTH_006` |
| `POST /api/auth/verify-account` | — | `AUTH_005`, `AUTH_015` |
| `POST /api/auth/send-verify-account-otp` | — | `AUTH_014`, `AUTH_016`, `AUTH_013` |
| `POST /api/auth/send-reset-password-otp` | — | `AUTH_014`, `AUTH_016`, `AUTH_013` |
| `POST /api/auth/reset-password` | — | `AUTH_005`, `AUTH_015` |
| `GET /api/accounts/me` | có | `USER_002` |
| `GET /api/addresses` | có | — |
| `POST /api/addresses` | có | — |
| `PUT /api/addresses/{addressId}` | có | `ADDRESS_001` (kể cả địa chỉ của người khác) |
| `DELETE /api/addresses/{addressId}` | có | `ADDRESS_001` |
| `POST /api/nfc/sessions` | có | `NFC_001`, `NFC_002`, `USER_001` |
| `GET /api/nfc/sessions/{sessionId}` | có | `NFC_003`, `NFC_004` |
| `POST /api/nfc/sessions/{sessionId}/card` | có | `NFC_001`, `NFC_002`, `NFC_003`, `NFC_004`; thẻ bị từ chối trả 2xx với kết quả `FAILED` / `LOCKED` |
| `GET /api/nfc/status` | có | `USER_001` |
| `POST /internal/accounts/check` | — | `NFC_005`, `USER_001` |
| `GET /internal/nfc/status/{accountId}` | — | `USER_001` (id lạ, kể cả không phải UUID) |

### 3.2. Mã lỗi

27 mã trong enum `ErrorCode`: `COMMON_500`, `COMMON_400`, `COMMON_403`, `COMMON_400_JSON`, `COMMON_404`, `COMMON_405`, `AUTH_001/002/005/006/007/008/010/011/012/013/014/015/016`, `USER_001/002`, `ADDRESS_001`, `NFC_001..005`. `COMMON_403` (`ACCESS_DENIED`) chưa thấy endpoint nào kích hoạt (chưa có endpoint chỉ cho ADMIN).

### 3.3. Khóa message theo trường (đầu vào cho `FieldParser`)

| Request | Trường JSON | Khóa | Ghi đè cần thiết (plan 5.4) |
|---|---|---|---|
| Register | `email` | `validation.email.required`, `.invalid` | — |
| Register | `phoneNumber` | `validation.phone.invalid` | không có `required` (tùy chọn) |
| Register | `fullName` | `validation.full_name.required`, `.too_long` | — |
| Register | `password` | `validation.password.required`, `validation.password.size` | `TOO_SHORT`, `TOO_LONG` → `validation.password.size` (args `min`, `max`) |
| Login | `username` | `validation.username.required` | sai định dạng hiện không có khóa (đi thẳng `AUTH_001`) |
| Login | `password` | `validation.password.required` | — |
| Refresh | `refreshToken` | `validation.refresh_token.required` | — |
| Verify / SendOtp / Reset | `email` | `validation.email.required`, `.invalid` | — |
| Verify / Reset | `otp` | `validation.otp.required` | — |
| Reset | `newPassword` | `validation.new_password.required`, `validation.password.size` | `REQUIRED` → `validation.new_password.required`; `TOO_SHORT`/`TOO_LONG` → `validation.password.size` |
| Address | `recipientName` | `validation.address.recipient_name.required`, `.too_long` | — |
| Address | `recipientPhone` | `validation.address.recipient_phone.required`, `.invalid` | — |
| Address | `provinceCode` | `validation.address.province_code.required`, `.invalid` | `UNKNOWN_CODE` → `.invalid` (mặc định đã khớp) |
| Address | `provinceName` | `validation.address.province_name.required`, `.too_long` | tùy C3: bỏ qua thì khóa này không còn dùng |
| Address | `wardName` | `validation.address.ward_name.required`, `.too_long` | — |
| Address | `detail` | `validation.address.detail.required`, `.too_long` | — |
| Address | `label` | `validation.address.label.too_long` | tùy chọn |
| Internal check | `accountId`, `idNumber` | không có khóa (`@NotBlank` mặc định của Hibernate Validator) | cần quyết: giữ message mặc định hay thêm khóa (thêm khóa là đổi hợp đồng) |

### 3.4. Sự kiện và cấu hình

- Exchange `moonkage.events`. Routing key: `orchestrator.email.identity`, `account.nfc_verified`, `account.nfc_failed`, `account.nfc_locked`.
- Biến môi trường: xem `application.yml`. `PII_ENC_KEY_V1` hết dùng sau Phase 6.

### 3.5. Cột id (cho Phase 8b)

Mọi cột đều `varchar(255)`: `accounts.id`, `addresses.id`, `addresses.account_id`, `user_profiles.account_id`, `legal_profiles.account_id` (bỏ ở Phase 6), `outbox_events.id`. Seed dev dùng UUID hợp lệ (`00000000-0000-4000-8000-…`). Ngoài identity: `vendor`, `quotation`, `order`… lưu account id ở DB riêng, không có khóa ngoại sang identity.

## 4. Mâu thuẫn và rủi ro

| # | Plan v2 | Thực tế | Đề xuất |
|---|---|---|---|
| 1 | Phase 7 tạo `ux_addresses_one_default` | Index này **đã có** với tên `ux_addresses_one_default_per_account` (V2026_10_22) | Giữ tên cũ, bỏ bước tạo index ở Phase 7 |
| 2 | Bỏ cột NFC ở Phase 6 | Đã bỏ ở migration `V2026_10_29_1500__accounts_invariants.sql` (chưa commit) | Giữ, Phase 6 bỏ bước này |
| 3 | Không `DomainGuard`, không `RequestText`, `*Constant`, `*Mapper` | Giai đoạn 1–2 cũ vừa thêm những thứ này | Xóa dần theo phase (Phase 3 `common/`, Phase 4 account) |
| 4 | `coding-rules.md`, `domain-model-plan.md` là tài liệu đối chiếu | Hai file chưa ghi là đã bị v2 thay thế | Thêm một dòng trạng thái ở đầu hai file |
| 5 | ĐIỂM DỪNG G: `nfcVerifiedAt` trả `null` hay bỏ | vendor coi `null` là chưa KYC: trả `null` thì **mọi** đăng ký người bán bị từ chối | Chốt sớm (trước Phase 6): thêm `kycVerified` vào response, vendor chuyển sang dùng nó |
| 6 | `identity-client` không dùng Feign | Hai bên gọi đang dùng Feign, vendor có test cho bộ giải mã lỗi | Để ĐIỂM DỪNG H |
| 7 | Test đặc tả cần RabbitMQ thật | Đang mock | Thêm `org.testcontainers:rabbitmq` (plan cho phép) |
| 8 | Nhánh `refactor/identity-v2` | Thay đổi giai đoạn 1–2 chưa commit trên `develop` | Commit làm mốc rồi tạo nhánh |

## 5. Quyết định ở ĐIỂM DỪNG A (2026-10-29)

1. `kycVerified` thêm vào response (G1 trong plan).
2. Giữ tên index `ux_addresses_one_default_per_account` (P0-2).
3. Ghi trạng thái "đã thay thế" ở đầu `coding-rules.md` và `domain-model-plan.md`.
4. Commit mốc trên `develop`, rồi làm trên `refactor/identity-v2` (P0-4).
5. Test đặc tả dùng RabbitMQ thật (P0-5).

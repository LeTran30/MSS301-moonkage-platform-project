# Plan v2, Phase 1: test đặc tả identity-service

Ngày: 2026-10-29. Plan: [identity-service-refactor-plan.md](identity-service-refactor-plan.md) mục 8.1. Nhánh `refactor/identity-v2`.

## 1. Đã làm

- Package `com.moonkage.identity.contract` (test), chỉ import `IdentityServiceApplication`: `ContractTest` (nền chung), `Golden` (so khớp snapshot), `EventInbox` (đọc sự kiện từ broker), và 5 lớp test: `AuthContractTest` (25), `AccessContractTest` (10), `AddressContractTest` (7), `KycContractTest` (8). Tổng 50 test.
- PostgreSQL 17 và **RabbitMQ 4.1 thật** (Testcontainers, thêm `org.testcontainers:rabbitmq`, quyết định P0-5). OTP được đọc từ mail trên broker như orchestrator nhận; sự kiện outbox được đọc từ hàng đợi gắn `#` vào `moonkage.events`.
- **Snapshot đã duyệt**: `src/test/resources/contract/**/*.json`, 94 file, gồm status, toàn bộ body JSON (cả `message` tiếng Việt), và với sự kiện: routing key, content type, payload. Hai endpoint `/internal/**` có snapshot riêng ở `contract/internal/`.
- Chỉ che giá trị đổi theo lần chạy: id, token, mốc thời gian, mã OTP, UUID và mã phiên NFC trong `path`, số phút/giây còn lại trong ba message `OTP_TOO_FREQUENT`, `OTP_MAX_ATTEMPTS_EXCEEDED`, `NFC_LOCKED`. `idHash` (HMAC với pepper cố định) **không** che: vendor lưu nó.
- Sai khác thì `Golden` ghi `*.actual.json` cạnh snapshot (git bỏ qua) để diff. Ghi lại snapshot: `-Dcontract.record=true`, rồi review diff.
- Kiểm tra DB sau request ở: đăng ký (dòng `accounts` + `user_profiles`), xác nhận, đặt lại mật khẩu (`password_changed_at`). Địa chỉ kiểm qua `GET /api/addresses`.
- `./mvnw -pl identity-service -am clean verify`: **268 test xanh** (218 cũ + 50 mới), 0 skip.

## 2. Độ phủ: endpoint × nhánh

✓ có test · ✗ chưa phủ (lý do ở mục 3) · — không áp dụng

| Endpoint | Thành công | Lỗi đã phủ | Chưa phủ |
|---|---|---|---|
| `POST /api/auth/register` | ✓ (+ chuẩn hóa email, `""` = không số) | `COMMON_400` đủ trường sai / thiếu, mật khẩu > 72, `COMMON_400_JSON`, `AUTH_007`, `AUTH_008` | `otpSent = false` khi gửi mail lỗi ✗(a) |
| `POST /api/auth/verify-account` | ✓ | `AUTH_005` (sai mã, mã đã dùng, email lạ: cùng body), `AUTH_015` (lần 5, cả mã đúng khi đang khóa), `COMMON_400` | `AUTH_005` do hết hạn ✗(t) |
| `POST /api/auth/send-verify-account-otp` | ✓ email lạ (200, không mail) | `AUTH_014`, `COMMON_400` | `AUTH_016` ✗(t), `AUTH_013` ✗(a), gửi lại thành công sau cooldown ✗(t) |
| `POST /api/auth/login` | ✓ email (cả chữ hoa), 4 dạng số điện thoại | `AUTH_001` (sai mật khẩu, email lạ, số lạ: cùng body), `AUTH_002` chỉ khi mật khẩu đúng, `COMMON_400` | — |
| `POST /api/auth/refresh-token` | ✓ | `AUTH_006` (rác, access token, token trước lần đổi mật khẩu), `COMMON_400` | `AUTH_002` (tài khoản chưa xác nhận có refresh token) ✗(u) |
| `POST /api/auth/send-reset-password-otp` | ✓ (mail `FORGOT_PASSWORD`), email lạ và chưa xác nhận: cùng 200, không mail | `AUTH_014`, `COMMON_400` | `AUTH_016` ✗(t), `AUTH_013` ✗(a) |
| `POST /api/auth/reset-password` | ✓ (Q-04: access/refresh cũ bị từ chối, mật khẩu cũ hết dùng) | `AUTH_005` (mã đăng ký không dùng được: Q-05), `COMMON_400` | `AUTH_015` (cùng code với verify, chưa test riêng) |
| Token (mọi endpoint cần đăng nhập) | — | `AUTH_010` (có `path`), `AUTH_011` hết hạn, `AUTH_012` (rác, refresh token, tài khoản không còn, token trước lần đổi mật khẩu), `AUTH_002` | — |
| `GET /api/accounts/me` | ✓ | `USER_002` | — |
| `GET /api/addresses` | ✓ rỗng, một mục, sau khi đổi mặc định thất bại | — | — |
| `POST /api/addresses` | ✓ mục đầu thành mặc định, mục không mặc định, `provinceName` lệch mã vẫn lưu | `COMMON_400` đủ 7 trường sai / thiếu | **mục mặc định thứ hai: 500** (B-1) |
| `PUT /api/addresses/{id}` | ✓ giữ cờ (`isDefault` vắng), `true` trên mục đang mặc định, `false` bỏ cờ | `ADDRESS_001` (của người khác, UUID lạ, không phải UUID) | **đặt mục khác làm mặc định: 500** (B-1) |
| `DELETE /api/addresses/{id}` | ✓ 204, xóa mục mặc định thì không còn mặc định | `ADDRESS_001` (đã xóa, của người khác) | — |
| `POST /api/nfc/sessions` | ✓ 201 | `NFC_001`, `NFC_002` | `USER_001` không với tới được (b) |
| `GET /api/nfc/sessions/{id}` | ✓ PENDING, VERIFIED | `NFC_004`, `NFC_003` (phiên lạ) | `NFC_003` do hết hạn ✗(t) |
| `POST /api/nfc/sessions/{id}/card` | ✓ VERIFIED + sự kiện `account.nfc_verified` | REJECTED: `BAD_FORMAT` (+ `account.nfc_failed`), `CARD_EXPIRED`, `ID_ALREADY_LINKED`, `SESSION_USED`, `SESSION_NOT_OWNED`, `SESSION_EXPIRED` (phiên lạ), khóa ở lần 5 (+ `account.nfc_locked`) | `LOCKED` khi gửi thẻ lúc đang khóa ✗(u), hết khóa ✗(t) |
| `GET /api/nfc/status` | ✓ NOT_VERIFIED, VERIFIED, LOCKED | — | `USER_001` không với tới được (b) |
| `POST /internal/accounts/check` | ✓ khớp (cả số có dấu cách), số khác, chưa KYC (`nfcVerifiedAt: null`), hash ổn định | `NFC_005`, `USER_001`, `COMMON_400` | — |
| `GET /internal/nfc/status/{id}` | ✓ VERIFIED, NOT_VERIFIED (không bọc `ApiResponse`) | `USER_001` (UUID lạ, không phải UUID) | — |
| Chung | — | `COMMON_404`, `COMMON_405` | `COMMON_500` tổng quát ✗(u), `COMMON_403` (chưa có endpoint chỉ cho ADMIN) |

Lý do chưa phủ:
- **(t) thời gian thật.** OTP (`OtpServiceImpl` dùng `Instant.now()`) và JWT (jjwt) chưa đi qua `Clock`; đặt `Clock` cố định sẽ làm Q-04 sai. Phủ được sau khi Phase 3–5 đưa mọi chỗ đọc giờ về `Clock`. Một chỗ duy nhất phải chờ: `resetPasswordEndsEveryEarlierSession` ngủ 1,1 giây vì Q-04 so theo giây.
- **(a) broker phải lỗi.** Dừng RabbitMQ dùng chung sẽ phá các test khác. Đề xuất phủ ở Phase 5 bằng test use case với `OtpMailer` giả.
- **(b) không với tới được qua HTTP.** Tài khoản không còn thì bộ lọc token trả `AUTH_012` trước.
- **(u) chưa viết.** Làm được ngay nếu cần.

## 3. Phát hiện

| Mã | Phát hiện | Đề xuất |
|---|---|---|
| **B-1** | **Bug**: tạo địa chỉ mặc định thứ hai (`POST` với `isDefault: true`) hoặc đặt địa chỉ khác làm mặc định (`PUT` với `isDefault: true`) trả **500**. Hibernate ghi cờ mới trước khi bỏ cờ cũ, chạm `ux_addresses_one_default_per_account`. Test cũ dùng mock nên không thấy. Snapshot đang khóa đúng hành vi 500 (`address/create-new-default`, `address/update-make-default`) | Sửa ở Phase 2 như một thay đổi hành vi có chủ đích (thêm mục C5): bỏ cờ cũ và flush trước khi đặt cờ mới. Snapshot đổi thành 201/200 |
| B-2 | `NfcSessionId` hiện là chuỗi ngẫu nhiên 32 ký tự (không phải UUID). Plan mục 5.5.2 dùng `UUID.randomUUID()`: đổi định dạng id mà app/web thấy | **Đã chốt (2026-10-29): giữ nguyên 32 ký tự**; plan cập nhật mục 5.5.2, 5.5.7, 8.2, Phase 6 |
| B-3 | `/internal/accounts/check` thiếu trường trả message tiếng Anh mặc định ("must not be blank"), không có khóa riêng | Giữ nguyên (hợp đồng nội bộ); `FieldParser` cần bảng ghi đè trả đúng chuỗi này, hoặc duyệt thêm khóa |
| B-4 | `USER_001` lặp lại nguyên id người gọi gửi trong message ("…người dùng not-a-uuid.") | Giữ nguyên (hợp đồng) |
| B-5 | Tài khoản vừa đăng ký rồi xác nhận, gọi gửi lại mã xác nhận trong 60 giây: 429 `AUTH_014`; email lạ: 200. Phân biệt được "email vừa đăng ký" | Ghi nhận; không đổi trong refactor |
| B-6 | Header `__TypeId__` của mail OTP là tên class Java. Orchestrator chọn class theo listener, không theo header, nên không đưa vào snapshot | Phase 5 dời class thoải mái |

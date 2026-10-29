# identity-service (`identity_db`)

> **Trạng thái:** Đề xuất (2026-10-22). Một phần của [phác thảo API và database](README.md); quyết định ở [decisions.md](decisions.md).
>
> **Migration:** [`V2026_10_22_1000__align_with_api_db_outline.sql`](../../../api/identity-service/src/main/resources/db/migration/V2026_10_22_1000__align_with_api_db_outline.sql)

Schema đã gần đủ. Phiên NFC và OTP giữ nguyên trong bộ nhớ của service như code hiện tại (L-06).

**Bảng**

| Bảng | Cột chính | Ràng buộc | Nguồn |
| --- | --- | --- | --- |
| `accounts` | `id`, `email`, `phone_number`, `password_hash`, `account_verified`, `role`, `password_changed_at` | `id` là UUID dạng chuỗi (`varchar`), JPA sinh khi lưu; `email` duy nhất, chữ thường; `phone_number` duy nhất, 9 chữ số thuê bao; `role` ∈ MEMBER, ADMIN. Bộ đếm và khóa NFC không lưu ([db-identify.md](../../services/identity/db-identify.md)) | FR-01, FR-02 |
| `user_profiles` | `account_id` (PK, FK), `full_name`, `avatar_key` | 1-1 với `accounts` | D-21; **Sửa** `avatar_url` → `avatar_key` |
| `legal_profiles` | `account_id` (PK, FK), `legal_name`, `gender`, `nationality`, `date_of_birth_enc`, `id_number_enc`, `id_number_hash`, `id_hash_key_ver`, `id_number_masked`, `pii_key_ver`, `nfc_verified_at` | `(id_number_hash, id_hash_key_ver)` duy nhất; có bản ghi = đã xác minh | FR-04, AC-04.11, BR-23 |
| `addresses` | `id`, `account_id` (FK), `recipient_name`, `recipient_phone`, `province_code`, `province_name`, `ward_name`, `detail`, `label`, `is_default` | Tối đa một `is_default = true` mỗi tài khoản (unique index có điều kiện) | FR-03; vùng giao theo `province_code` (Q-12) |
| `refresh_tokens` **Mới** (tùy chọn) | `id`, `account_id`, `token_hash`, `expires_at`, `revoked_at` |  | Để thu hồi token khi đổi mật khẩu |
| `outbox_events` | `id`, `routing_key`, `payload`, `attempts`, `published_at` |  | NFR-05 |

**Dữ liệu sống ngắn (không ghi DB, L-06).** Phiên NFC và OTP đều hết hạn sau 5 phút, nên lưu ở kho key-value có TTL thay vì PostgreSQL:

| Khóa | Giá trị | TTL |
| --- | --- | --- |
| `nfc:session:{sessionId}` | `accountId`, `status` (PENDING, VERIFIED), `expiresAt` | 5 phút; xóa ngay khi dùng (một lần) |
| `otp:{purpose}:{email}` | `codeHash`, `attempts` | 5 phút |

Số lần xác minh NFC thất bại và thời điểm hết tạm khóa vẫn nằm trên `accounts` (đã có), vì tạm khóa phải còn sau khi phiên hết hạn (AC-04.9). **Đã chốt (22/10/2026):** giữ trong bộ nhớ của identity-service (`ConcurrentHashMap` như code hiện tại), có tác vụ dọn khóa hết hạn. Hệ quả chấp nhận: khởi động lại thì phiên và OTP đang chờ bị mất, người dùng tạo lại; identity chỉ chạy một bản.

**API công khai**

Auth giữ nguyên như code vì đăng nhập, OTP, refresh không phải tài nguyên được quản lý.

| Method, đường dẫn | Ai | Mục đích | FR |
| --- | --- | --- | --- |
| `POST /api/auth/register`, `/send-verify-account-otp`, `/verify-account` | K | Đăng ký, gửi lại OTP, xác nhận tài khoản | FR-01 |
| `POST /api/auth/login`, `/refresh-token` | K | Đăng nhập `{username, password}`, đổi refresh token | FR-02 |
| `POST /api/auth/send-reset-password-otp`, `/reset-password` | K | Đặt lại mật khẩu | FR-02 |

**Root Account** (`/api/accounts`)

| Method, đường dẫn | Ai | Mục đích | FR |
| --- | --- | --- | --- |
| `GET /api/accounts/me` | M | Tài khoản + `profile` + `nfcStatus`, `idNumberMasked` | FR-02 |
| `PATCH /api/accounts/me/profile` | M | Sửa họ tên hiển thị, ảnh đại diện | FR-02 |
| `GET\|POST /api/accounts/me/addresses` | M | Danh sách, thêm địa chỉ | FR-03 |
| `PUT\|DELETE /api/accounts/me/addresses/{addressId}` | M | Sửa (gồm `isDefault`), xóa | FR-03 |
| `POST /api/accounts/me/nfc-sessions` | M | Tạo phiên → `{sessionId, expiresAt}` | AC-04.1 |
| `GET /api/accounts/me/nfc-sessions/{sessionId}` | M, App | Trạng thái phiên; phiên của tài khoản khác trả `SESSION_NOT_OWNED` | AC-04.2 |
| `PUT /api/accounts/me/nfc-sessions/{sessionId}/card` | App | Gửi thẻ một lần sau khi bấm Lưu (JWE) → `{status, reasonCode, attemptsLeft, lockedUntil}` | AC-04.5 → AC-04.11 |
| `GET /api/accounts/me/legal-profile` | M | Kết quả xác minh: họ tên, giới tính, quốc tịch, số định danh đã che, thời điểm | FR-04, AC-04.12 |
| `GET /api/accounts?email=&role=`, `GET /api/accounts/{accountId}` | A | Tra cứu tài khoản | FR-45 |

So với code: `/api/addresses` → `/api/accounts/me/addresses`; `/api/nfc/sessions...` → `/api/accounts/me/nfc-sessions...`, và gửi thẻ đổi từ `POST .../card` sang `PUT` (thẻ là tài nguyên duy nhất của phiên). Web và app Moonkage Verify phải sửa theo (mục 11, L-17).

## Sự kiện và API nội bộ

**Phát**

- `account.kyc_verified`, `account.kyc_failed`, `account.kyc_locked` → orchestrator
- Email OTP → orchestrator

**Nghe**

- Không nghe sự kiện nào

**API nội bộ**

- Cung cấp `GET /internal/nfc/status/{accountId}` cho vendor, quotation (BR-23, AC-45.1)
- Cung cấp `POST /internal/accounts/check` cho vendor: băm số định danh, so với CCCD của chủ (BR-27)

## Quyết định liên quan

[L-06](decisions.md), [L-12](decisions.md), [L-15](decisions.md), [L-17](decisions.md).

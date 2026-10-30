# Rà soát database: identity-service

Ngày chốt: 2026-10-29. Phương pháp: chỉ lưu bền thuộc tính có người đọc lại và còn ý nghĩa sau thời gian tạm; kiểm hợp lệ xong thì bỏ những gì không ai đọc.

## Thực thể

- **Account**: cách một người vào hệ thống (đăng nhập, mật khẩu, vai).
- **Profile**: người đó là ai (tên tự xưng, danh tính đã KYC).
- **Address**: nơi nhận hàng.

KYC là việc nền tảng làm; NFC chỉ là phương thức. Chưa lưu phương thức vì hiện chỉ có NFC.

## Schema chốt

```sql
accounts (
  id                   uuid         PRIMARY KEY,           -- ứng dụng sinh lúc tạo (UUID v7; id seed cũ là v4)
  email                varchar(255) NOT NULL UNIQUE,
  phone_number         varchar(9)   UNIQUE,             -- giữ cho demo
  account_verified     boolean      NOT NULL DEFAULT false,
  password_hash        varchar(255) NOT NULL,
  password_changed_at  timestamptz,                     -- vô hiệu refresh token cũ
  role                 varchar(10)  NOT NULL CHECK (role IN ('MEMBER','ADMIN')),
  created_at           timestamptz  NOT NULL,
  updated_at           timestamptz  NOT NULL
);

profiles (
  account_id           uuid         PRIMARY KEY REFERENCES accounts(id),
  full_name            varchar(100) NOT NULL,
  kyc_verified         boolean      NOT NULL DEFAULT false,
  legal_name           varchar(100),
  id_number_hash       varchar(64)  UNIQUE,
  id_hash_key_ver      integer,
  id_number_masked     varchar(12),
  created_at           timestamptz  NOT NULL,
  updated_at           timestamptz  NOT NULL,
  CONSTRAINT ck_profiles_kyc_complete CHECK (
    kyc_verified = (legal_name IS NOT NULL)
    AND kyc_verified = (id_number_hash IS NOT NULL)
    AND kyc_verified = (id_hash_key_ver IS NOT NULL)
    AND kyc_verified = (id_number_masked IS NOT NULL))
);

addresses (
  id uuid, account_id uuid REFERENCES accounts(id), label, recipient_name, recipient_phone,
  province_code, ward_name, detail, is_default,
  created_at, updated_at
);
-- tối đa một địa chỉ mặc định mỗi tài khoản
```

Kỹ thuật: `outbox_events` giữ nguyên, riêng `id` là `uuid` (= `eventId`; id trong payload JSON vẫn là chuỗi).

## Không lưu bền

|Thứ|Lý do|
|---|---|
|Mã OTP, liên kết đặt lại, phiên KYC|Sống vài phút; giữ trong bộ nhớ|
|Bộ đếm và khóa thử KYC|Chỉ có ý nghĩa trong thời gian khóa; giữ trong bộ nhớ|
|Ngày sinh, giới tính, quốc tịch, hạn thẻ, nơi sinh, nơi thường trú, ngày cấp|Chỉ kiểm hợp lệ lúc nhận thẻ, không ai đọc lại|
|Số định danh đầy đủ (đã mã hóa)|Bỏ; hệ quả: đổi khóa băm thì người dùng phải KYC lại|
|Ảnh đại diện|Không có màn hình dùng|
|Thời điểm xác nhận tài khoản, thời điểm KYC|Dùng boolean cho đơn giản|
|Khóa / đóng tài khoản|Không có chức năng|

## So với schema hiện tại

- `user_profiles` → `profiles`; bỏ `avatar_key`.
- `legal_profiles` bỏ table; chuyển `legal_name`, `id_number_hash`, `id_hash_key_ver`, `id_number_masked` vào `profiles`; bỏ `date_of_birth_enc`, `gender`, `nationality`, `id_number_enc`, `pii_key_ver`, `nfc_verified_at`; thêm `kyc_verified`.
- `accounts`: bỏ `nfc_failed_attempts`, `nfc_locked_until`.
- Unique số định danh: `(id_number_hash, id_hash_key_ver)` → `(id_number_hash)`.

## Ảnh hưởng ngoài identity (rà khi làm vendor)

- `vendor_owner_checks.nfc_verified_at` không còn nguồn: bỏ, hoặc vendor tự ghi thời điểm so khớp.
- Màn duyệt người bán không còn hiện thời điểm KYC của chủ.
- Sự kiện gửi từ identity có trường `nfc_*` đổi theo tên KYC.
- Code: bỏ mã hóa khi lưu (`PII_ENC_KEY_V1`, phần lưu của `PiiCipher`); giữ khóa giải mã dữ liệu app gửi lên. Identity có thể không còn dùng MinIO.
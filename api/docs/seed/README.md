# Dữ liệu demo: tài khoản người bán mẫu

Code không còn tự tạo dữ liệu demo (trước đây `DataInitializer` của identity-service và `DemoVendorSeeder` của vendor-service làm việc này ở mọi môi trường, kèm mật khẩu mặc định). identity-service chỉ tự tạo tài khoản **admin** (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Tài khoản người bán mẫu được tạo bằng hai script dưới đây, **chỉ cho máy dev và môi trường demo, không chạy trên production**.

| Bước | Script | Database | Tạo ra |
|---|---|---|---|
| 1 | `01_demo_seller_identity.sql` | `identity_db` | Tài khoản `seller@moonkage.vn` (MEMBER, đã xác nhận email, SĐT `0901234567`), hồ sơ "Nguyễn Văn Bánh" |
| 2 (tùy chọn) | `02_demo_seller_vendor.sql` | `vendor_db` | Shop đã duyệt "Công ty TNHH Bánh Trung Thu Trăng Vàng" của tài khoản trên |

Chạy lại nhiều lần không sao: bản ghi đã có thì giữ nguyên.

## Điều kiện

- Đã chạy `docker compose up -d` ít nhất một lần và identity-service (cùng vendor-service nếu làm bước 2) đã khởi động xong: Hibernate tạo bảng lúc khởi động.
- Database tạo trước 2026-10-19 (bảng `accounts` còn cột `status`) phải chạy `api/docs/2026-10-19_drop_account_status.sql` trước.
- Thay `<DB_USERNAME>` bằng giá trị `DB_USERNAME` trong `.env` ở gốc repo.
- Chọn một mật khẩu demo. Mật khẩu chỉ truyền vào lúc chạy, không lưu trong repository (script băm bằng bcrypt ngay trong database).

Chạy các lệnh từ **gốc repo** (`platform/`). Script được chép vào container bằng `docker cp` rồi chạy bằng `psql -f`, để tiếng Việt không bị lỗi mã hóa khi chạy từ PowerShell.

## Bước 1: tài khoản (identity_db)

PowerShell:

```powershell
docker cp api/docs/seed/01_demo_seller_identity.sql moonkage-identity-db:/tmp/seed_identity.sql
docker exec moonkage-identity-db psql -U <DB_USERNAME> -d identity_db -v seller_password='Demo@12345' -f /tmp/seed_identity.sql
```

bash:

```bash
docker cp api/docs/seed/01_demo_seller_identity.sql moonkage-identity-db:/tmp/seed_identity.sql
docker exec moonkage-identity-db psql -U "$DB_USERNAME" -d identity_db -v seller_password='Demo@12345' -f /tmp/seed_identity.sql
```

Cuối kết quả là `seller_account_id`: giữ giá trị này cho bước 2. Muốn dùng email khác thì thêm `-v seller_email=...`.

## Bước 2 (tùy chọn): Shop đã duyệt (vendor_db)

Thay `<ID>` bằng `seller_account_id` của bước 1.

```powershell
docker cp api/docs/seed/02_demo_seller_vendor.sql moonkage-vendor-db:/tmp/seed_vendor.sql
docker exec moonkage-vendor-db psql -U <DB_USERNAME> -d vendor_db -v owner_account_id=<ID> -f /tmp/seed_vendor.sql
```

(bash: giống hệt, dùng `"$DB_USERNAME"`.)

## Kiểm tra

```bash
curl -X POST http://localhost:8080/identity-service/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"0901234567","password":"Demo@12345"}'
```

Trả 200 kèm `token`, `"role": "MEMBER"`, `"phoneNumber": "901234567"`. Đăng nhập bằng email `seller@moonkage.vn` cũng được.

## Lưu ý

- **Chưa xác minh NFC.** Script không tạo `legal_profiles`: số định danh phải mã hóa AES-GCM bằng khóa của chính môi trường, không làm được trong SQL. Theo BR-23, chủ người bán phải đã xác minh NFC; muốn tài khoản demo đúng quy tắc này thì xác minh bằng app Moonkage Verify sau khi seed.
- Không đổi mật khẩu bằng cách chạy lại script (tài khoản đã có thì được giữ nguyên). Dùng chức năng quên mật khẩu, hoặc xóa tài khoản rồi chạy lại.
- Database còn tài khoản seller do bản code cũ tạo thì bước 1 giữ nguyên tài khoản đó (cả mật khẩu cũ); bước 2 vẫn dùng `seller_account_id` mà bước 1 in ra.

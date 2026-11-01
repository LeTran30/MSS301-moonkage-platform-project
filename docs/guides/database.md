# Database: schema và dữ liệu mẫu

Mỗi service tự quản DB của mình bằng **Flyway**. Không có script nào phải chạy tay.

```bash
docker compose up -d --build
```

Lệnh này tạo bảng, nạp dữ liệu mẫu, và tạo tài khoản admin. Xong.

---

## 1. Hai thư mục trong mỗi service

```
<service>/src/main/resources/db/
├── migration/   V1__baseline.sql, V2026_10_21_0930__add_x.sql …   → schema, chạy ở MỌI môi trường
└── seed/        R__seed.sql                                       → dữ liệu mẫu, CHỈ ở máy dev
```

- `migration/` luôn chạy. Hibernate chỉ **kiểm** entity có khớp DB không (`ddl-auto: validate`), không tự sửa DB.
- `seed/` chỉ chạy khi `SPRING_FLYWAY_LOCATIONS` có thêm `classpath:db/seed`. `docker-compose.yml` bật nó cho cả 7 service. Test và production không bật.
- Flyway chạy `R__seed.sql` **sau** mọi migration, và **chạy lại mỗi khi nội dung file thay đổi**: sửa seed, khởi động lại service là xong.

## 2. Đổi schema (thêm cột, đổi tên, thêm bảng)

1. Sửa entity.
2. Thêm **một file mới** vào `db/migration/`, tên theo thời điểm tạo:
   `V<yyyy>_<MM>_<dd>_<HHmm>__<việc_làm>.sql`, ví dụ `V2026_10_21_0930__add_note_to_orders.sql`.
   Đặt tên theo thời gian thì hai người làm song song không bị trùng số.
3. Sửa `db/seed/R__seed.sql` của service đó nếu cột mới bắt buộc, **trong cùng PR**.
4. Chạy service: Flyway áp file mới, Hibernate kiểm lại. Sai ở đâu thì service báo lỗi lúc khởi động, chỉ rõ file và cột.

**Không bao giờ sửa file `V…` đã merge** (kể cả `V1__baseline.sql`): Flyway kiểm checksum, sửa là máy mọi người báo lỗi. Muốn sửa thì thêm file mới.

## 3. Viết seed

- Mỗi service một file `db/seed/R__seed.sql`, do người phụ trách service đó viết.
- Mọi `INSERT` đều có `ON CONFLICT DO NOTHING`: file chạy lại nhiều lần không sinh trùng.
- Dùng **ID cố định** trong sổ ở mục 5. Cần ID mới thì ghi vào sổ trước. Service khác tham chiếu tới thì tra sổ, không phải chạy gì để lấy ID.
- Riêng hồ sơ NFC (`legal_profiles`) nằm ở `identity-service/…/db/seed/nfc-profiles.json`. Số CCCD phải mã hóa bằng khóa của từng máy nên SQL không làm được; `NfcProfileSeeder` đọc file này lúc identity khởi động. Máy chưa đặt `PII_ENC_KEY_V1` / `ID_HASH_PEPPER_V1` thì bỏ qua phần này và chỉ ghi cảnh báo.

## 4. Tài khoản mẫu

Mật khẩu chung của **mọi** tài khoản mẫu, kể cả admin: `SEED_PASSWORD` trong `.env` (bắt buộc, không dùng dấu `'`; `.env.example` đặt `12345678`). Đăng nhập bằng email hoặc số điện thoại.

| Email | Họ tên | SĐT | Trạng thái | Dùng để test |
|---|---|---|---|---|
| `admin@mk.com` | Quản trị viên MoonKage | — | ADMIN | duyệt người bán, bảng phí |
| `member1@mk.com` | Nguyễn Thị Lan | 0901000001 | đã xác nhận email, **đã NFC**, 2 địa chỉ | mua ngay, gửi yêu cầu đặt hàng |
| `member2@mk.com` | Trần Văn Minh | 0901000002 | đã xác nhận, **chưa NFC**, 1 địa chỉ | luồng bị BR-23 chặn |
| `member3@mk.com` | Lê Thị Hoa | 0901000003 | **chưa xác nhận email** | đăng nhập bị từ chối |
| `member4@mk.com` | Phạm Văn Bánh | 0901000004 | NFC, chủ "Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng", **đã duyệt, đã đóng phí** | luồng người bán đầy đủ |
| `member5@mk.com` | Võ Thị Quê | 0901000005 | NFC, chủ "Hộ kinh doanh Bánh Quê", **chờ duyệt** | màn duyệt của admin |

`mk.com` là domain có thật, nên orchestrator **không gửi email** tới `@mk.com` (`moonkage.mail.blocked-domains`), chỉ ghi một dòng log (không kèm mã). Persona không cần OTP để đăng nhập; muốn test luồng OTP (đăng ký, quên mật khẩu) thì dùng email thật của bạn.

Seed không bao giờ đụng tới tài khoản người dùng tự tạo: email đã có người dùng thì persona đó bị bỏ qua.

## 5. Sổ ID

Định dạng: `00000000-0000-4000-8000-<loại 4 số><thứ tự 8 số>`.

| Loại | Mã | ID | Là gì | Service |
|---|---|---|---|---|
| account | `0001` | `…-000100000000` | admin | identity |
| | | `…-000100000001` → `…-000100000005` | member1 → member5 | identity |
| vendor | `0002` | `…-000200000001` | Trăng Vàng (của member4) | vendor |
| | | `…-000200000002` | Bánh Quê (của member5) | vendor |
| product | `0003` | | *chờ người phụ trách vendor* (sản phẩm ghi ở vendor-service, L-18) | vendor |
| quote request | `0004` | | *chưa dùng*; seed quotation chỉ có bản sao người bán (`vendor_snapshots`) theo ID `0002` | quotation |
| order | `0005` | | *chờ người phụ trách order* | order |
| address | `0006` | `…-000600000001`, `…02` | 2 địa chỉ của member1 (TP.HCM, Hà Nội) | identity |
| | | `…-000600000003` | địa chỉ của member2 | identity |
| delivery area | `0007` | `…-000700000001`, `…02` | vùng giao của 2 shop (79, 01) | vendor |
| registration fee config | `0008` | `…-000800000001` | mức phí đăng ký mặc định 200.000đ (nằm trong migration, mọi môi trường) | vendor |

Loại mới thì lấy mã tiếp theo (`0008`…) và thêm một dòng vào bảng.

## 6. Làm lại từ đầu

Xóa mọi dữ liệu (cả tài khoản tự tạo) rồi dựng lại từ migration và seed:

```bash
docker compose down -v
docker compose up -d --build
```

Chỉ một DB, ví dụ vendor:

```bash
docker compose rm -sfv vendor-db vendor-service
docker volume rm moonkage_vendor-db-data
docker compose up -d
```

## 7. Máy tạo DB trước khi có Flyway (trước 2026-10-20)

Schema cũ do Hibernate tự sinh nên mỗi máy lệch một kiểu, và Flyway sẽ không khởi động được. Chạy một lần các lệnh ở mục 6 (`down -v` rồi `up -d --build`); tài khoản mẫu sẽ có lại từ seed.
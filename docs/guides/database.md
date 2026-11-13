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
- **Dữ liệu demo** (thêm 4 Shop ở TP.HCM, 17 sản phẩm, 42 đơn của 28 ngày gần nhất cùng thanh toán, sổ tiền, giải ngân, khiếu nại, đánh giá) do `infra/dev/demo_seed.py` sinh ra, nằm giữa hai dòng `-- >>> DEMO DATA` và `-- <<< DEMO DATA` trong seed của identity, vendor, catalog, quotation, order và payment. Một đơn trải trên 3 DB, nên **không sửa tay** khối này: sửa script, chạy `python infra/dev/demo_seed.py` ở gốc repo, rồi build lại các service đó. Ảnh sản phẩm: mỗi loại vỏ một ảnh (`CRUST_IMAGE` trong script, ảnh nguồn ở `infra/dev/demo-images/`), script chép sang `infra/minio/seed/products/<vendorId>/` để `minio-init` đưa lên bucket. Thời gian ghi dạng `now() - interval`, nên DB dựng mới luôn có đơn của 4 tuần vừa qua cho biểu đồ.
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
| `member6@mk.com` | Đỗ Minh Tâm | 0901000006 | NFC, chủ "Hộ kinh doanh Bánh Dẻo Chợ Lớn" (TP.HCM), bán Shop và nhận đặt | Shop thứ hai ở TP.HCM |
| `member7@mk.com` | Hoàng Thị Ba | 0901000007 | NFC, chủ "Hộ kinh doanh Tiệm Bánh Cô Ba" (TP.HCM), chỉ bán Shop | Shop không nhận đặt |
| `member8@mk.com` | Bùi Quang Huy | 0901000008 | NFC, chủ "Doanh nghiệp tư nhân Quà Tặng Đoàn Viên" (TP.HCM), **chỉ nhận đặt** (BR-21) | người nhận lời mời ở Flow 2 |
| `member9@mk.com` | Ngô Thanh Mây | 0901000009 | NFC, chủ "Hộ kinh doanh Bánh Nhà Mây" (TP.HCM), bán Shop và nhận đặt, có hàng bán lại | Shop có sản phẩm bán lại |
| `member10@mk.com` → `member14@mk.com` | Đặng Thu Trang, Phan Quốc Bảo, Trịnh Mỹ Linh, Lý Gia Hân, Mai Đức Thắng | 0901000010 → 0901000014 | đã xác nhận, chưa NFC, 1 địa chỉ (4 người ở TP.HCM, member14 ở Cần Thơ) | người mua của các đơn demo |
| `member15@mk.com` → `member17@mk.com` | Châu Ngọc Hà, Tạ Văn Khoa, Lâm Bảo Ngọc | 0901000015 → 0901000017 | đã xác nhận email, **đã NFC**, **chưa có Shop** | đăng ký người bán từ đầu (mỗi người một lần) |

Dữ liệu demo tập trung ở **TP.HCM**: cả 5 Shop đã duyệt và 4/5 người mua mới ở đó, nên chọn khu vực TP.HCM khi demo. Khoảng 3/4 số đơn giao nội thành; số còn lại giao liên tỉnh tới Hà Nội (địa chỉ thứ hai của member1) và Cần Thơ, có mã vận đơn. Đơn demo (`member1` có nhiều nhất): 2 đơn mới thanh toán, 2 đã xác nhận, 2 đang giao, 3 đã giao (1 đơn có khiếu nại đang mở), còn lại đã hoàn tất. Trong số đã hoàn tất, có 3 đơn qua hạn khiếu nại nhưng **chưa giải ngân** để admin demo bước duyệt giải ngân, 1 đơn được hoàn một phần sau khiếu nại, 1 đơn bị từ chối khiếu nại. Mỗi đơn có tên Shop, ảnh của từng dòng và lịch sử tiến độ (`progress_updates`) cho các bước nó đã qua, đúng như khi đi qua app.

`mk.com` là domain có thật, nên orchestrator **không gửi email** tới `@mk.com` (`moonkage.mail.blocked-domains`), chỉ ghi một dòng log (không kèm mã). Persona không cần OTP để đăng nhập; muốn test luồng OTP (đăng ký, quên mật khẩu) thì dùng email thật của bạn.

Seed không bao giờ đụng tới tài khoản người dùng tự tạo: email đã có người dùng thì persona đó bị bỏ qua.

## 5. Sổ ID

Định dạng: `00000000-0000-4000-8000-<loại 4 số><thứ tự 8 số>`.

| Loại | Mã | ID | Là gì | Service |
|---|---|---|---|---|
| account | `0001` | `…-000100000000` | admin | identity |
| | | `…-000100000001` → `…-000100000005` | member1 → member5 | identity |
| | | `…-000100000006` → `…-000100000014` | member6 → member14 (dữ liệu demo) | identity |
| | | `…-000100000015` → `…-000100000017` | member15 → member17 (đăng ký người bán) | identity |
| vendor | `0002` | `…-000200000001` | Trăng Vàng (của member4) | vendor |
| | | `…-000200000002` | Bánh Quê (của member5) | vendor |
| | | `…-000200000003` → `…-000200000006` | Chợ Lớn, Cô Ba, Đoàn Viên, Nhà Mây, đều ở TP.HCM (của member6 → member9; dữ liệu demo; catalog và quotation seed bản sao `vendor_snapshots`) | vendor, catalog, quotation |
| product | `0003` | `…-000300000001` → `…-000300000008` | 8 sản phẩm Shop của Trăng Vàng, đang bán (ghi ở vendor-service, L-18; catalog-service seed bản sao `product_views` cùng ID) | vendor, catalog |
| | | `…-000300000009` → `…-000300000025` | 17 sản phẩm của các Shop demo | vendor, catalog |
| quote request | `0004` | | *chưa dùng*; seed quotation chỉ có bản sao người bán (`vendor_snapshots`) theo ID `0002` | quotation |
| order | `0005` | `…-000500000001` → `…-000500000042` | 42 đơn mua ngay của dữ liệu demo, cũ nhất trước | order, payment |
| address | `0006` | `…-000600000001`, `…02` | 2 địa chỉ của member1 (TP.HCM, Hà Nội) | identity |
| | | `…-000600000003` | địa chỉ của member2 | identity |
| | | `…-000600000004` → `…-000600000008` | địa chỉ của member10 → member14 | identity |
| delivery area | `0007` | `…-000700000001`, `…02` | vùng giao của 2 shop (79, 01) | vendor |
| | | `…-000700000003` → `…-000700000007` | vùng giao của 4 Shop demo | vendor |
| registration fee config | `0008` | `…-000800000001` | mức phí đăng ký mặc định 200.000đ (nằm trong migration, mọi môi trường) | vendor |
| price tier | | `md5(product_id:from_qty)` | bậc giá số lượng lớn (BR-35) của các sản phẩm `0003`; ID suy ra từ sản phẩm và mốc số lượng nên chạy lại seed vẫn ra cùng dòng | vendor |
| bản ghi con của dữ liệu demo | | `md5(cha:loại)` | checkout, dòng đơn, thanh toán, sổ tiền và bút toán, giải ngân, hoàn tiền, khiếu nại, đánh giá của đơn `0005` (ví dụ `md5(order_id:payment)`); duyệt và hồ sơ nhận đặt của Shop `0002`. Tính trong `infra/dev/demo_seed.py` (`derived_id`) | order, payment, catalog, vendor |

Loại mới thì lấy mã tiếp theo (`0009`…) và thêm một dòng vào bảng. ID của bản ghi trong seed phải có dòng tương ứng ở đây — xem quy tắc trong [../architecture/api-db/decisions.md](../architecture/api-db/decisions.md) (D-26).

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

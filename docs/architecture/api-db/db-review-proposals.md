# Đề xuất chỉnh sửa thiết kế database

> **Trạng thái:** Đã chốt (2026-10-22), đã gộp vào file `V2026_10_22_1000__align_with_api_db_outline.sql` của từng service và các file `*.md` tương ứng. Rà soát bản [phác thảo API và database](README.md) và migration V2. SQL dưới đây là bản rút gọn để đọc; bản chạy thật nằm trong migration.
>
> **Đã thử:** SQL dưới đây chạy sau V2 trên cả DB mới và DB dev cũ của 6 service, seed chạy lại được. Các ca kiểm ở mục [Kiểm thử](#kiểm-thử).

## Tóm tắt

| Mục | Ưu tiên | Vấn đề | Đề xuất | Service |
| --- | --- | --- | --- | --- |
| [P-01](#p-01-ipn-đến-trễ-ở-luồng-mua-ngay) | Cao | Hàng đã trả về kho nhưng IPN thành công vẫn đến | Một đồng hồ do order đặt; checkout có `EXPIRED`, giữ hàng lại hoặc hoàn tiền | order, vendor, payment |
| [P-02](#p-02-khóa-chuyển-tiền-ở-order) | Cao | Chuyển tiền dựa trên bản sao có thể trễ | order khóa đơn trước khi payment chuyển tiền | order, payment |
| [P-03](#p-03-một-việc-chỉ-thanh-toán-thành-công-một-lần) | Cao | Một việc có thể được trả thành công hai lần | Unique có điều kiện; trạng thái `DUPLICATE` và tự hoàn tiền | payment |
| [P-04](#p-04-sổ-tiền-và-phân-bổ-do-database-giữ) | Trung bình | Sổ tiền và phân bổ chỉ đúng nếu code đúng | CHECK `held`; trigger đối chiếu lúc commit | payment, order |
| [P-05](#p-05-bản-đọc-sản-phẩm-không-chép-trường-của-vendor) | Trung bình | Trường vendor bị chép hai lần ở catalog | `product_views` bỏ trường vendor; view JOIN `vendor_snapshots` | catalog |
| [P-06](#p-06-loại-đơn-đi-với-trạng-thái-của-nó) | Trung bình | Đơn mua ngay có thể mang trạng thái của đơn đặt hàng | CHECK ghép `kind` với `status` | order |
| [P-07](#p-07-danh-sách-tỉnh-thành) | Đã chốt | `province_code` không được kiểm ở đâu | Bảng `provinces` ở catalog, danh sách dùng chung | catalog và các service lưu mã tỉnh |
| [P-08](#p-08-index-outbox) | Thấp | Index outbox chứa cả dòng đã phát | Index có điều kiện | cả 6 service |
| [P-09](#p-09-số-tài-khoản-ngân-hàng) | Đã chốt | Số tài khoản ngân hàng để dạng thường | Mã hóa và che như CCCD | vendor |
| [Giữ nguyên](#giữ-nguyên) | — | Khóa `varchar(36)`, hai bảng chống lặp ở orchestrator | Không đổi, ghi lý do | — |

Thứ tự làm: P-01 → P-03 → P-04 (P-04 cần id đơn có sẵn từ P-01), các mục khác độc lập.

## P-01: IPN đến trễ ở luồng mua ngay

**Vấn đề.** Vendor trả hàng theo `stock_reservations.expires_at`, order đóng checkout theo `checkouts.expires_at`, VNPay có hạn riêng. Ba đồng hồ không ràng nhau, nên IPN thành công có thể đến khi hàng đã bán cho người khác. Luồng báo giá đã có nhánh hoàn tiền (L-10, bước 5); luồng mua ngay chưa có.

**Đề xuất.**

1. Một đồng hồ, do order đặt lúc tạo checkout:

   | Mốc | Giá trị |
   | --- | --- |
   | `payments.expires_at` | Hạn `vnp_ExpireDate` gửi VNPay (ví dụ 15 phút) |
   | `checkouts.expires_at` | Hạn thanh toán + 5 phút đệm |
   | `stock_reservations.expires_at` | Bằng `checkouts.expires_at`; order gửi sang, vendor không tự đặt |

2. Hàng được giữ theo checkout, không theo giao dịch: `stock_reservations.payment_ref` → `checkout_id`, vì lúc giữ hàng chưa có giao dịch. API nội bộ đổi thành `DELETE /internal/stock/reservations/{checkoutId}`.
3. Id đơn được cấp ngay khi tạo checkout (`checkout_groups.order_id`), để payment phân bổ tiền theo đơn từ đầu (P-04) và IPN lặp lại vẫn tạo đúng các đơn đó.
4. Trạng thái checkout:

   | Từ | Sự kiện | Sang |
   | --- | --- | --- |
   | `PENDING_PAYMENT` | `payment.succeeded` | `SUCCEEDED`: chốt hàng đã giữ, tạo đơn |
   | `PENDING_PAYMENT` | `payment.failed` | `FAILED`: trả hàng |
   | `PENDING_PAYMENT` | quá `expires_at` | `EXPIRED`: trả hàng |
   | `FAILED`, `EXPIRED` | `payment.succeeded` đến trễ | Giữ hàng lại (cùng `checkout_id`): đủ hàng thì `SUCCEEDED`; không đủ thì `REFUND_REQUESTED` và gọi `POST /internal/refunds` với lý do `LATE_PAYMENT` |

```sql
-- order-service
ALTER TABLE checkout_groups ADD COLUMN order_id varchar(36);
ALTER TABLE checkout_groups ADD CONSTRAINT uk_checkout_groups_order UNIQUE (order_id);
ALTER TABLE checkouts ADD COLUMN payment_id varchar(36);
ALTER TABLE checkouts DROP CONSTRAINT ck_checkouts_status;
ALTER TABLE checkouts ADD CONSTRAINT ck_checkouts_status
    CHECK (status IN ('PENDING_PAYMENT', 'SUCCEEDED', 'FAILED', 'EXPIRED', 'REFUND_REQUESTED'));

-- vendor-service
ALTER TABLE stock_reservations RENAME COLUMN payment_ref TO checkout_id;
ALTER TABLE stock_reservations RENAME CONSTRAINT uk_stock_reservations_payment_product
    TO uk_stock_reservations_checkout_product;

-- payment-service: hoàn tiền không đến từ khiếu nại thì không có đơn hoặc khiếu nại
ALTER TABLE refunds ADD COLUMN reason varchar(30) NOT NULL DEFAULT 'DISPUTE';
ALTER TABLE refunds ALTER COLUMN reason DROP DEFAULT;
ALTER TABLE refunds ADD CONSTRAINT ck_refunds_reason
    CHECK (reason IN ('DISPUTE', 'LATE_PAYMENT', 'DUPLICATE_PAYMENT', 'QUOTE_EXPIRED'));
ALTER TABLE refunds ALTER COLUMN order_id DROP NOT NULL;
ALTER TABLE refunds ADD CONSTRAINT ck_refunds_dispute
    CHECK (reason <> 'DISPUTE' OR (order_id IS NOT NULL AND dispute_id IS NOT NULL)) NOT VALID;
CREATE UNIQUE INDEX ux_refunds_one_per_payment_reason ON refunds (original_payment_id, reason)
    WHERE reason IN ('LATE_PAYMENT', 'DUPLICATE_PAYMENT', 'QUOTE_EXPIRED');
```

**Sửa tài liệu:** `order.md` (bảng checkout, vòng đời), `vendor.md` và `integration.md` (khóa giữ hàng), `payment.md` (`refunds`). Báo giá dùng chung lý do `QUOTE_EXPIRED`.

## P-02: Khóa chuyển tiền ở order

**Vấn đề.** payment xét điều kiện chuyển tiền trên `order_snapshots`, bản này cập nhật qua sự kiện. Nếu người mua mở khiếu nại đúng lúc quản trị bấm chuyển tiền, payment vẫn thấy chưa có khiếu nại và chuyển tiền (BR-18).

**Đề xuất.** order là nơi duy nhất quyết định "đơn đã khóa để chuyển tiền".

- API nội bộ mới ở order: `POST /internal/orders/{orderId}/payout-lock`. Trong một transaction, khóa dòng đơn (`SELECT … FOR UPDATE`), kiểm đủ điều kiện (đã nhận hoặc quá hạn khiếu nại, không có khiếu nại mở), ghi `payout_locked_at`. Gọi lại khi đã khóa vẫn trả 200, nên payment thử lại được.
- Mở khiếu nại khóa cùng dòng đơn và trả 409 khi `payout_locked_at` đã có.
- payment gọi khóa trước, rồi ghi `payouts` và dòng `PAYOUT` vào sổ. `order_snapshots` chỉ còn dùng cho danh sách chờ chuyển tiền.

```sql
-- order-service
ALTER TABLE orders ADD COLUMN payout_locked_at timestamptz;
```

**Sửa tài liệu:** `order.md` (cột và luồng khiếu nại), `payment.md` (luồng chuyển tiền), `integration.md` (API nội bộ mới).

## P-03: Một việc chỉ thanh toán thành công một lần

**Vấn đề.** `gateway_txn_ref` duy nhất chặn được một giao dịch ghi hai lần, nhưng không chặn hai giao dịch khác nhau cùng trả cho một việc. Ví dụ người mua mở hai tab rồi trả cả hai, hoặc người bán trả phí đăng ký hai lần.

**Đề xuất.**

- Mỗi `(purpose, reference_id)` chỉ có một payment `SUCCEEDED`, ép bằng unique index.
- Payment thành công thứ hai được ghi `DUPLICATE` thay vì `SUCCEEDED`, tự tạo `refunds` với lý do `DUPLICATE_PAYMENT`, và không phát `payment.succeeded`.
- Khi hai IPN chạy đua nhau, bên thua vấp unique index, xử lý viên bắt lỗi và ghi `DUPLICATE`.

```sql
-- payment-service
ALTER TABLE payments DROP CONSTRAINT payments_status_check;
ALTER TABLE payments ADD CONSTRAINT ck_payments_status
    CHECK (status IN ('PENDING', 'SUCCEEDED', 'FAILED', 'DUPLICATE'));
CREATE UNIQUE INDEX ux_payments_one_success ON payments (purpose, reference_id) WHERE status = 'SUCCEEDED';
```

## P-04: Sổ tiền và phân bổ do database giữ

**Vấn đề.** Ba quy tắc đang chỉ được code giữ:

- `ledgers` là tổng của `ledger_entries`.
- `held` = tiền thu − đã giải ngân − đã hoàn − đã chuyển.
- Tổng `payment_allocations` = số tiền thanh toán.

Lệch ở bất kỳ quy tắc nào cũng là sai tiền mà không ai biết (NFR-09).

**Đề xuất.**

- `held` được ép bằng CHECK đẳng thức, thay cho `ck_ledgers_integrity`. Vì `held >= 0` nên ràng buộc cũ vẫn đúng.
- Hai cặp constraint trigger kiểm lúc commit (`DEFERRABLE INITIALLY DEFERRED`), nên trong transaction được ghi bảng nào trước cũng được:
  - Mỗi lần `ledgers` hoặc `ledger_entries` đổi: tổng các dòng phải khớp số trên sổ của đơn đó.
  - Mỗi lần payment thành công hoặc phân bổ đổi: tổng phân bổ phải bằng số tiền; phí đăng ký thì không có phân bổ.
- Sổ cũ trên DB dev được chép ngược thành các dòng `ledger_entries` để khớp.

```sql
-- payment-service (rút gọn; bản đầy đủ có hai hàm check_ledger_matches_entries, assert_payment_allocated)
ALTER TABLE ledgers DROP CONSTRAINT ck_ledgers_integrity;
ALTER TABLE ledgers ADD CONSTRAINT ck_ledgers_balance
    CHECK (held = total_collected - disbursed - refunded - paid_out);

CREATE CONSTRAINT TRIGGER tg_ledgers_match_entries
    AFTER INSERT OR UPDATE ON ledgers DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_ledger_matches_entries();
CREATE CONSTRAINT TRIGGER tg_ledger_entries_match_ledger
    AFTER INSERT ON ledger_entries DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_ledger_matches_entries();
CREATE CONSTRAINT TRIGGER tg_payments_allocated
    AFTER INSERT OR UPDATE OF status, amount ON payments DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_payment_allocated();
CREATE CONSTRAINT TRIGGER tg_payment_allocations_sum
    AFTER INSERT OR UPDATE OR DELETE ON payment_allocations DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_payment_allocated();
```

**Hệ quả cho code:** mọi thay đổi sổ phải thêm dòng `ledger_entries` và sửa `ledgers` trong cùng một transaction. Lỗi trigger nổ lúc commit, nên test tích hợp phải commit thật, không rollback cuối test.

## P-05: Bản đọc sản phẩm không chép trường của vendor

**Vấn đề.** `product_views` đang lưu lại `vendor_name`, `owner_account_id`, `delivery_areas`, `can_operate`, `sells_shop`, trong khi `vendor_snapshots` cùng DB đã có các trường này. Hai bản đi theo hai luồng sự kiện khác nhau, nên một Shop vừa bị khóa vẫn có thể hiện sản phẩm. Ngoài ra, mỗi lần khóa Shop phải sửa mọi dòng sản phẩm của Shop đó.

**Đề xuất.** `product_views` chỉ giữ trường sản phẩm. Đọc qua view `product_listings` JOIN `vendor_snapshots` (entity `@Immutable`). Khóa Shop chỉ còn sửa một dòng.

```sql
-- catalog-service
DROP INDEX ix_product_views_listing;
ALTER TABLE product_views DROP COLUMN vendor_name, DROP COLUMN owner_account_id, DROP COLUMN delivery_areas,
                          DROP COLUMN can_operate, DROP COLUMN sells_shop;
CREATE INDEX ix_product_views_listing ON product_views (status, delivery_label, vendor_id);
CREATE INDEX ix_vendor_snapshots_listing ON vendor_snapshots (vendor_id) WHERE can_operate AND sells_shop;
CREATE INDEX ix_vendor_snapshots_delivery_areas ON vendor_snapshots USING gin (delivery_areas);
CREATE VIEW product_listings AS
SELECT p.*, v.business_name AS vendor_name, v.owner_account_id, v.delivery_areas, v.local_delivery_fee,
       v.can_operate, v.sells_shop
FROM product_views p
JOIN vendor_snapshots v ON v.vendor_id = p.vendor_id;
```

**Sửa tài liệu:** `catalog.md`. Payload `product.upserted` không cần mang trường vendor nữa.

## P-06: Loại đơn đi với trạng thái của nó

**Vấn đề.** `orders_status_check` gộp trạng thái của cả hai loại đơn, nên DB vẫn nhận một đơn mua ngay mang `IN_PRODUCTION`.

```sql
-- order-service
ALTER TABLE orders ADD CONSTRAINT ck_orders_kind_status CHECK (
    (kind = 'BUY_NOW' AND status IN ('PAID', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'COMPLETED'))
    OR (kind = 'CUSTOM_ORDER' AND status IN ('DEPOSITED', 'AWAITING_MOCKUP_APPROVAL', 'IN_PRODUCTION',
                                            'READY_TO_SHIP', 'DELIVERED', 'COMPLETED'))) NOT VALID;
```

**Về các CHECK `NOT VALID`.**

- Cách để: chúng được để `NOT VALID` cho an toàn với DB dev của các thành viên khác.
- Kết quả trên DB dev mẫu:
  - `ck_orders_kind_status`: VALIDATE qua.
  - `ck_refunds_dispute`: không qua, vì dòng hoàn tiền cũ không có khiếu nại.
- Đề xuất: sau khi merge V2, chạy `VALIDATE CONSTRAINT` trong một migration sau; dòng cũ nào vi phạm thì sửa hoặc xóa trong cùng file đó.

## P-07: Danh sách tỉnh thành

**Vấn đề.** `province_code` có ở identity, vendor, catalog, quotation và order nhưng không nơi nào kiểm. Bảng phí liên tỉnh lại phải đủ mọi tỉnh (A-18). Từ 01/07/2025, cả nước còn 34 tỉnh thành và bỏ cấp huyện, nên rất dễ lọt mã cũ vào.

**Đã chốt (22/10/2026):**

- Danh sách chính thức (mã, tên) để ở một file dùng chung trong `api/common` (JSON hoặc enum).
- catalog có bảng `provinces` nạp từ danh sách đó bằng migration repeatable trong `db/migration`, không phải trong `db/seed`, vì môi trường thật cũng cần. `interprovince_fees.province_code` có foreign key sang `provinces`.
- Các service còn lại kiểm mã bằng danh sách dùng chung khi validate request, không cần bảng riêng.

**Đã làm:**

- Nguồn: Quyết định 19/2025/QĐ-TTg (hiệu lực 01/07/2025), 34 đơn vị.
- `api/common-reference`: enum `com.moonkage.reference.Province` (`fromCode`, `isKnown`). Test kiểm đủ 34 mã duy nhất và khớp từng dòng với `R__provinces.sql` của catalog.
- catalog: bảng `provinces`, `R__provinces.sql` trong `db/migration`, FK từ `interprovince_fees`. Seed dev đặt phí 45.000 đ cho đủ 34 tỉnh.
- `01` (Hà Nội) và `79` (TP. Hồ Chí Minh) của seed vẫn đúng theo danh sách mới.
- Còn lại cho giai đoạn viết entity: identity, vendor, quotation, order thêm phụ thuộc `common-reference` và kiểm `province_code` bằng `Province.isKnown` thay cho regex.

## P-08: Index outbox

Bộ phát chỉ tìm các dòng chưa phát. Index hiện tại trên `published_at` chứa cả những dòng đã phát, và bảng sẽ phình dần.

```sql
-- cả 6 service (identity đã có index từ V1)
DROP INDEX ix_outbox_events_unpublished;
CREATE INDEX ix_outbox_events_unpublished ON outbox_events (created_at) WHERE published_at IS NULL;
```

## P-09: Số tài khoản ngân hàng

**Vấn đề.** `vendors.bank_account_number` để dạng thường, trong khi CCCD đã được mã hóa (NFR-03).

**Đã chốt (22/10/2026):**

- Thay bằng `bank_account_number_enc bytea`, `bank_account_masked`, `pii_key_ver`, mã hóa AES-GCM giống `legal_profiles`.
- Màn quản trị chỉ giải mã khi chuyển tiền và ghi audit.

**Chi phí:**

- vendor phải có khóa mã hóa riêng.
- Seed SQL không mã hóa được, nên tài khoản mẫu chỉ có số đã che (giống `representative_id_*`).

Dòng cũ trên DB dev chỉ còn số đã che; chủ Shop nhập lại số trước lần chuyển tiền đầu tiên.

## Giữ nguyên

- **Khóa `varchar(36)` thay vì `uuid`.**
  - Lý do giữ: đổi kiểu thì phải sửa mọi bảng, entity và khóa ngoại, trong khi dữ liệu đồ án nhỏ nên lợi ích không đáng.
  - Quy ước: giữ `varchar(36)` cho bảng mới để đồng nhất.
- **`processed_events` và `notification_event_logs` ở orchestrator.** Hai bảng làm hai việc khác nhau:
  - Bảng đầu chống xử lý lặp một sự kiện.
  - Bảng sau ghi kết quả gửi email để thử lại.

  Chỉ cần ghi rõ ranh giới này trong `orchestrator.md`.

## Kiểm thử

Chạy V1 → (dữ liệu dev cũ) → V2 → SQL đề xuất → seed hai lần, trên PostgreSQL 16, cho cả DB mới và DB cũ của 6 service: đều qua. Trên `payment_db`:

| Ca | Kết quả |
| --- | --- |
| Thanh toán checkout chia cho hai đơn, sổ và dòng sổ ghi trong một transaction | Qua |
| Payment thành công thứ hai cho cùng checkout | Bị chặn (`ux_payments_one_success`); ghi `DUPLICATE` thì được |
| Phân bổ thiếu 10.000 đ so với số tiền | Bị chặn lúc commit |
| Sửa `ledgers` không thêm dòng sổ | Bị chặn |
| `held` không khớp | Bị chặn (`ck_ledgers_balance`) |
| Hoàn tiền `DUPLICATE_PAYMENT` không có đơn | Qua |
| Hoàn tiền `DISPUTE` không có khiếu nại | Bị chặn |
| Sổ cũ trên DB dev | Đã chép thành dòng `COLLECT` 530.000 và `REFUND` 100.000, khớp sổ |

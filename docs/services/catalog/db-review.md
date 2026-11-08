# Rà soát database: catalog-service

Ngày: 2026-10-30. Trạng thái: đề xuất, chờ chốt. Phương pháp như identity, vendor: chỉ lưu thuộc tính có người đọc lại; kiểm hợp lệ xong thì bỏ.

## Trách nhiệm
Quản lý hàng có sẵn của Shop: sản phẩm, ảnh, vỏ/nhân, bậc giá, ngưỡng báo giá, tồn kho, giữ hàng khi thanh toán. Đồng thời phục vụ trang tìm kiếm và trang chi tiết sản phẩm.

Nhận từ vendor (theo DB_Review_Vendor): sản phẩm, tồn kho, giữ hàng, danh mục vỏ/nhân.
Bỏ khỏi catalog: tỉnh, bảng phí liên tỉnh, nhãn giao, vùng giao.

## Quyết định
| Chủ đề | Quyết định |
|---|---|
| Nguồn dữ liệu sản phẩm | Catalog là chủ và ghi trực tiếp `products`. Bỏ cơ chế chiếu ngược sản phẩm vào chính catalog (`product_views`, `product_tombstones`) |
| Thương hiệu, nơi sản xuất | Bắt buộc với mọi sản phẩm. Không lưu cờ "bán lại", vì vendor đã bỏ nguồn hàng và Context chỉ yêu cầu ghi thương hiệu, nơi sản xuất |
| Loại bánh | Bỏ `cake_type` tự do. Dùng danh mục vỏ (`crust_types`) và nhân (`filling_types`); một hộp có thể có nhiều vỏ, nhiều nhân |
| Giao hàng | Không lưu ở catalog. Phí giao lấy từ `shipping_fee` của người bán (bản sao) |
| Xóa sản phẩm | Không có thao tác xóa (AC-34.6). Bỏ cột `deleted` |
| Gỡ sản phẩm | `status = 'REMOVED'` bắt buộc có `removed_reason`. Người gỡ và thời điểm đi qua audit, không lưu ở đây |
| Ảnh | Bảng riêng có `position` để giữ thứ tự hiển thị (hiện tại thứ tự không được bảo đảm) |
| Bậc giá | Khóa `(product_id, min_qty)`, bỏ `id` riêng |
| Giữ hàng | Trừ `stock` ngay khi giữ; trả lại khi thất bại hoặc hết hạn. Giữ dòng kèm trạng thái để trả lời IPN đến muộn |
| Người bán | Bản sao rút gọn theo sự kiện `vendor.updated` mới. Bỏ `can_operate`, `delivery_areas`, `local_delivery_fee`; `sells_shop` → `sells_retail` |
| Đánh giá | Giữ bản sao để phục vụ danh sách đánh giá và tính điểm. Bỏ `vendor_id` (suy ra từ sản phẩm) |
| Điểm đánh giá | Bảng riêng `product_ratings`, tách khỏi `products` để cập nhật điểm không đụng version sản phẩm |
| Version | Giữ `products.version`: khóa lạc quan khi người bán sửa và để bên nhận sự kiện bỏ bản cũ. Thay đổi tồn kho đi bằng SQL nguyên tử, không tăng version |
| Inbox | Gộp `projection_inbox` và `processed_events` thành `inbox_events` có `processed_at` |
| Trang tìm kiếm | `product_listings` là VIEW trên `products` + `vendor_snapshots` + `product_ratings`, không còn là bảng chiếu |

## Schema đề xuất

```sql
-- Danh mục
crust_types (
  code  varchar(30)  PRIMARY KEY,
  name  varchar(100) NOT NULL
);

filling_types (
  code  varchar(30)  PRIMARY KEY,
  name  varchar(100) NOT NULL
);

-- Sản phẩm
products (
  id              uuid         PRIMARY KEY,
  vendor_id       uuid         NOT NULL,
  name            varchar(200) NOT NULL CHECK (btrim(name) <> ''),
  description     text         NOT NULL,
  brand           varchar(100) NOT NULL CHECK (btrim(brand) <> ''),
  origin          varchar(150) NOT NULL CHECK (btrim(origin) <> ''),  -- nơi sản xuất
  pieces_per_box  smallint     CHECK (pieces_per_box > 0),
  list_price      bigint       NOT NULL CHECK (list_price > 0),       -- VND, đã gồm GTGT
  stock           integer      NOT NULL CHECK (stock >= 0),           -- còn bán được (đã trừ phần đang giữ)
  expiry_date     date         NOT NULL,
  quote_threshold integer      CHECK (quote_threshold > 1),           -- chỉ có tác dụng khi người bán sells_wholesale
  status          varchar(10)  NOT NULL CHECK (status IN ('ON_SALE','HIDDEN','REMOVED')),
  removed_reason  text,
  version         bigint       NOT NULL DEFAULT 0,
  created_at      timestamptz  NOT NULL,
  updated_at      timestamptz  NOT NULL,
  CHECK ((status = 'REMOVED') = (removed_reason IS NOT NULL AND btrim(removed_reason) <> ''))
);
CREATE INDEX ix_products_vendor ON products (vendor_id);
CREATE INDEX ix_products_on_sale ON products (list_price) WHERE status = 'ON_SALE';

product_images (
  product_id  uuid         NOT NULL REFERENCES products(id),
  position    smallint     NOT NULL CHECK (position >= 0),
  object_key  varchar(255) NOT NULL,
  PRIMARY KEY (product_id, position)
);

product_crusts (
  product_id  uuid        NOT NULL REFERENCES products(id),
  crust_code  varchar(30) NOT NULL REFERENCES crust_types(code),
  PRIMARY KEY (product_id, crust_code)
);

product_fillings (
  product_id    uuid        NOT NULL REFERENCES products(id),
  filling_code  varchar(30) NOT NULL REFERENCES filling_types(code),
  PRIMARY KEY (product_id, filling_code)
);

product_price_tiers (                               -- giá theo số lượng khi mua ngay
  product_id  uuid    NOT NULL REFERENCES products(id),
  min_qty     integer NOT NULL CHECK (min_qty >= 2),
  unit_price  bigint  NOT NULL CHECK (unit_price > 0),
  PRIMARY KEY (product_id, min_qty)
);

-- Giữ hàng cho một lần thanh toán mua ngay (BR-28)
stock_holds (
  checkout_id  uuid        NOT NULL,                -- lần thanh toán
  product_id   uuid        NOT NULL REFERENCES products(id),
  quantity     integer     NOT NULL CHECK (quantity > 0),
  status       varchar(10) NOT NULL CHECK (status IN ('HELD','CONFIRMED','RELEASED')),
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL,
  updated_at   timestamptz NOT NULL,
  PRIMARY KEY (checkout_id, product_id)
);
CREATE INDEX ix_stock_holds_expiry ON stock_holds (expires_at) WHERE status = 'HELD';

-- Bản sao từ vendor
vendor_snapshots (
  vendor_id              uuid         PRIMARY KEY,
  owner_account_id       uuid         NOT NULL,     -- nhãn "Sản phẩm của bạn" (BR-22)
  shop_name              varchar(100) NOT NULL,
  status                 varchar(20)  NOT NULL,
  registration_fee_paid  boolean      NOT NULL,
  sells_retail           boolean      NOT NULL,
  sells_wholesale        boolean      NOT NULL,
  shipping_fee           bigint       NOT NULL CHECK (shipping_fee >= 0),
  source_updated_at      timestamptz  NOT NULL      -- bỏ sự kiện cũ đến muộn
);

-- Bản sao từ dịch vụ đánh giá
product_reviews (
  review_id   uuid        PRIMARY KEY,
  product_id  uuid        NOT NULL REFERENCES products(id),
  rating      smallint    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content     text,
  created_at  timestamptz NOT NULL
);
CREATE INDEX ix_product_reviews_product ON product_reviews (product_id, created_at DESC);

product_ratings (                                   -- dẫn xuất, dựng lại được từ product_reviews
  product_id    uuid         PRIMARY KEY REFERENCES products(id),
  rating_count  integer      NOT NULL CHECK (rating_count >= 0),
  rating_avg    numeric(3,2) CHECK (rating_avg BETWEEN 1 AND 5)
);

-- Kỹ thuật
outbox_events (id, routing_key, payload, attempts, published_at, created_at, updated_at);  -- giữ nguyên

inbox_events (
  event_id      uuid        PRIMARY KEY,
  routing_key   varchar(100) NOT NULL,
  payload       jsonb       NOT NULL,
  received_at   timestamptz NOT NULL,
  processed_at  timestamptz
);
CREATE INDEX ix_inbox_pending ON inbox_events (received_at, event_id) WHERE processed_at IS NULL;
```

`product_listings` (VIEW) chỉ gồm sản phẩm `ON_SALE` của người bán có `status = 'APPROVED' AND registration_fee_paid AND sells_retail`. View ghép thêm `shop_name`, `owner_account_id`, `shipping_fee`, mảng mã vỏ/nhân, ảnh, bậc giá và điểm đánh giá.

## Luồng tồn kho
- **Giữ**: `UPDATE products SET stock = stock - :q WHERE id = :p AND stock >= :q AND status = 'ON_SALE'`. Nếu cập nhật được 1 dòng thì thêm `stock_holds` trạng thái `HELD`, còn 0 dòng thì báo hết hàng. Cả hai bước trong một transaction.
- **Chốt** (IPN thành công): `HELD` → `CONFIRMED`; tồn kho không đổi.
- **Trả** (thất bại hoặc hết hạn): `HELD` → `RELEASED` và cộng lại `stock`.
- **IPN thành công đến sau khi đã `RELEASED`**: catalog báo hàng đã trả; order/payment xử lý hoàn tiền.
- Gọi lại cùng `checkout_id` không làm gì thêm.

## Ghi chú
- Không đặt khóa ngoại `products.vendor_id → vendor_snapshots`: bản sao có thể đến muộn. Khi đăng và sửa sản phẩm, service kiểm người bán trên bản sao.
- Ràng buộc nhiều dòng do service kiểm: có ít nhất một ảnh (AC-29.1); bậc giá không chồng lấn đã có khóa `(product_id, min_qty)` bảo đảm.
- Thông tin sản phẩm chép vào đơn ở order (BR-19), nên sửa sản phẩm không ảnh hưởng đơn cũ.

## So với schema hiện tại
| Hiện tại | Đề xuất |
|---|---|
| `products.cake_type` | Bỏ; thay bằng `product_crusts`, `product_fillings` |
| `products.delivery_label` | Bỏ |
| `products.deleted` | Bỏ |
| `products.brand`, `origin` cho phép null | NOT NULL |
| `product_images` không thứ tự | Thêm `position` |
| `product_price_tiers.id`, `from_qty` | Bỏ `id`; `from_qty` → `min_qty`, làm khóa chính cùng `product_id` |
| `product_views`, `product_tombstones` | Bỏ; thay bằng VIEW `product_listings` |
| `vendor_snapshots.business_name`, `can_operate`, `sells_shop`, `delivery_areas`, `local_delivery_fee`, `source_version` | `shop_name`, `status + registration_fee_paid`, `sells_retail` (+ `sells_wholesale`), bỏ, `shipping_fee`, `source_updated_at` |
| `product_reviews.vendor_id`; điểm nằm trong `product_views` | Bỏ `vendor_id`; điểm sang `product_ratings` |
| `provinces`, `interprovince_fees` | Bỏ |
| `projection_inbox` + `processed_events` | Gộp thành `inbox_events` |
| (chưa có) | `stock_holds`, `crust_types`, `filling_types` |

## Câu hỏi còn mở
1. Thương hiệu, nơi sản xuất bắt buộc với cả hàng tự làm: đồng ý không?
2. Vỏ/nhân có bắt buộc ít nhất một không?
3. Bậc giá có phải thấp hơn `list_price` không (Q-06)?
4. Thời gian giữ hàng bao lâu; có giới hạn số ảnh không?

## Ảnh hưởng ngoài catalog
- vendor: sự kiện `vendor.updated` phải có `shop_name`, `status`, `registration_fee_paid`, `sells_retail`, `sells_wholesale`, `shipping_fee`, `owner_account_id`, `updated_at`.
- review: sự kiện đánh giá không cần `vendor_id`.
- order/payment: gọi giữ / chốt / trả theo `checkout_id`; xử lý trường hợp hàng đã trả khi IPN đến muộn.
- quotation: đọc `quote_threshold` qua sự kiện sản phẩm nếu cần.
- Code: bỏ `InterprovinceFee*`, `Province`, `DeliveryLabel`, `ProductProjectionRow`, nhánh `applyProduct/removeProduct`, cấu hình `legacy-writer`; `ProductListing` trỏ vào VIEW.

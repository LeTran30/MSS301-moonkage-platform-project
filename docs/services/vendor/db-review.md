# Rà soát database: vendor-service

Ngày chốt: 2026-10-30. Phương pháp như identity: chỉ lưu thuộc tính có người đọc lại; kiểm hợp lệ xong thì bỏ.

## Trách nhiệm
Xác lập và quản lý tư cách người bán: ai là chủ, đơn vị nào, giấy phép, được duyệt chưa, đã đóng phí mở bán chưa, bán theo mô hình nào, trang tiệm, phí giao.

Chuyển ra khỏi vendor:
- Sản phẩm, ảnh, bậc giá, tồn kho, giữ hàng, danh mục vỏ/nhân → catalog.
- Hồ sơ nhận đặt hàng (min_qty, bậc giá tham khảo, custom_types, năng lực) → quotation.

## Quyết định
| Chủ đề | Quyết định |
|---|---|
| Mô hình kinh doanh | `sells_retail`, `sells_wholesale` nằm trong `vendor_profiles`; custom chỉ phục vụ bán sỉ, chi tiết `custom_types` nằm ở quotation |
| Nguồn hàng | Không lưu ở vendor. Hàng bán lại hay tự làm, nếu cần, là thuộc tính của từng sản phẩm ở catalog |
| Giao hàng | Mặc định giao mọi nơi; mỗi người bán đặt một `shipping_fee` duy nhất. Bỏ vùng giao, bảng phí liên tỉnh, nhãn giao của sản phẩm, khái niệm đơn liên tỉnh |
| Pháp lý | Mọi loại hình. Không lưu loại hình; chỉ lưu mã số thuế làm định danh đơn vị; người bán tự điền, quản trị đối chiếu với giấy phép |
| Địa chỉ trụ sở | `address_line` (số nhà, đường) + `ward_code` + `province_code` |
| Giấy tờ | Demo chỉ một giấy phép kinh doanh |
| Người đại diện | Không lưu; quản trị đọc trên giấy phép |
| Tài khoản ngân hàng | Bỏ |
| Lịch sử duyệt | Giữ đầy đủ (`vendor_reviews`) |
| Sở hữu | Mỗi tài khoản làm chủ một đơn vị; mỗi mã số thuế đăng ký một lần |
| Phí đăng ký mở bán | Vendor chỉ lưu đã đóng hay chưa; số tiền, thời điểm ở payment |
| Version | Không dùng |

## Schema chốt

```sql
vendors (
  id                    uuid PRIMARY KEY,
  owner_account_id      uuid        NOT NULL UNIQUE,
  status                varchar(20) NOT NULL CHECK (status IN ('PENDING','NEEDS_INFO','APPROVED','REJECTED','LOCKED')),
  registration_fee_paid boolean     NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL,
  updated_at            timestamptz NOT NULL
);

vendor_profiles (                                   -- công khai
  vendor_id       uuid PRIMARY KEY REFERENCES vendors(id),
  shop_name       varchar(100) NOT NULL,
  logo_key        varchar(255),
  description     text,
  sells_retail    boolean      NOT NULL,
  sells_wholesale boolean      NOT NULL,
  shipping_fee    bigint       NOT NULL CHECK (shipping_fee >= 0),
  updated_at      timestamptz  NOT NULL,
  CHECK (sells_retail OR sells_wholesale)
);

vendor_legal_infos (                                -- chứng từ, quản trị
  vendor_id            uuid PRIMARY KEY REFERENCES vendors(id),
  business_name        varchar(255) NOT NULL,
  tax_code             varchar(14)  NOT NULL UNIQUE, -- HKD 12 số (CCCD); doanh nghiệp 10 số, chi nhánh 10-3
  address_line         varchar(255) NOT NULL,        -- số nhà, đường
  ward_code            varchar(5)   NOT NULL,        -- mã phường/xã
  province_code        varchar(2)   NOT NULL,
  business_license_key varchar(255) NOT NULL         -- bucket riêng tư
);

vendor_reviews (                                    -- chỉ thêm, không sửa
  id               uuid PRIMARY KEY,
  vendor_id        uuid NOT NULL REFERENCES vendors(id),
  admin_account_id uuid NOT NULL,
  decision         varchar(20) NOT NULL CHECK (decision IN ('APPROVE','NEEDS_INFO','REJECT','LOCK','UNLOCK')),
  reason           text,
  decided_at       timestamptz NOT NULL,
  CHECK (decision IN ('APPROVE','UNLOCK') OR (reason IS NOT NULL AND btrim(reason) <> ''))
);

registration_fee_configs (
  id             uuid PRIMARY KEY,
  amount         bigint      NOT NULL CHECK (amount > 0),
  effective_from timestamptz NOT NULL,
  created_by     uuid
);

-- kỹ thuật: outbox_events, processed_events
```

Service tạo `vendors`, `vendor_profiles`, `vendor_legal_infos` trong cùng một transaction khi nộp hồ sơ.

## Ghi chú
- Với hộ kinh doanh, mã số thuế là số CCCD của chủ hộ (từ 01/7/2025); số này in công khai trên hóa đơn. Doanh nghiệp có mã số doanh nghiệp riêng.
- `ward_code` cần danh mục phường/xã chung (hiện `common-reference` mới có 34 tỉnh) để chọn từ danh sách và kiểm phường thuộc đúng tỉnh.
- `vendor.updated` gửi: `vendor_profiles`, `owner_account_id`, `status`, `registration_fee_paid`; `business_name`, `tax_code` chỉ gửi cho quotation và order (in chứng từ).
- Không có version: bên nhận dùng `updated_at` để bỏ sự kiện cũ đến muộn.

## Ảnh hưởng ngoài vendor
- catalog: nhận sản phẩm, tồn kho, giữ hàng, danh mục vỏ/nhân; bỏ `interprovince_fees`, `delivery_label`, lọc theo vùng giao. Quy tắc "hàng bán lại phải có thương hiệu" không còn đọc nguồn hàng của vendor; xét theo từng sản phẩm.
- quotation: nhận hồ sơ nhận đặt hàng và `custom_types`; không còn nguồn hàng trong bản sao người bán.
- order: bỏ khái niệm đơn liên tỉnh.
- payment: gửi sự kiện đã đóng phí đăng ký để vendor bật `registration_fee_paid`; không còn tài khoản ngân hàng người bán.

# vendor-service (`vendor_db`)

> **Trạng thái:** Đề xuất (2026-10-22). Một phần của [phác thảo API và database](README.md); quyết định ở [decisions.md](decisions.md).
>
> **Migration:** [`V2026_10_22_1000__align_with_api_db_outline.sql`](../../../api/vendor-service/src/main/resources/db/migration/V2026_10_22_1000__align_with_api_db_outline.sql)

Bảng `vendors` thiếu phần lớn trường xác minh theo tư cách pháp nhân (BR-26, BR-27) và phí đăng ký (BR-31). Code mới có `GET /api/seller/vendor` và một endpoint nội bộ.

**Bảng**

| Bảng | Cột chính | Ràng buộc | Nguồn |
| --- | --- | --- | --- |
| `vendors` **Sửa** | `id`, `owner_account_id`, `business_name`, `entity_type`, `tax_code`, `address`, `province_code`, `representative_name`, `representative_id_hash`, `representative_id_key_ver`, `representative_id_masked`, `supply_source`, `sells_shop`, `accepts_orders`, `status`, `status_reason`, `local_delivery_fee`, `bank_name`, `bank_account_number_enc`, `bank_account_masked`, `pii_key_ver`, `bank_account_holder`, `registration_fee_payment_id`, `registration_fee_amount`, `registration_fee_paid_at`, `version` | `entity_type` ∈ HOUSEHOLD_BUSINESS, SOLE_PROPRIETORSHIP (công ty tạm bỏ, BR-33); `status` ∈ PENDING, NEEDS_INFO, APPROVED, REJECTED, LOCKED; `sells_shop OR accepts_orders`; số tài khoản mã hóa AES-GCM, chỉ hiện bản che, giải mã khi chuyển tiền và ghi audit (P-09) | FR-26, FR-27, FR-28, FR-53, BR-27, BR-31, BR-33 |
| `vendor_documents` **Mới** | `id`, `vendor_id`, `kind` (BUSINESS_LICENSE, FOOD_SAFETY, FEE_INVOICE), `object_key`, `uploaded_at` | Bucket riêng tư `vendor-docs` | AC-26.1, AC-27.6 |
| `vendor_owner_checks` **Mới** | `id`, `vendor_id`, `submission_no`, `owner_legal_name`, `owner_id_masked`, `nfc_verified_at`, `id_match`, `name_match` (MATCH, MISMATCH), `checked_at` | Bất biến, một dòng mỗi lần nộp | AC-26.8, A-15 |
| `vendor_reviews` **Mới** | `id`, `vendor_id`, `admin_account_id`, `decision` (APPROVE, NEEDS_INFO, REJECT), `reason`, `license_checked`, `registry_checked`, `decided_at` | `reason` bắt buộc khi không duyệt | AC-45.2, AC-45.5 |
| `vendor_delivery_areas` | `id`, `vendor_id`, `province_code` | `(vendor_id, province_code)` duy nhất | FR-28 |
| `order_profiles` | `id`, `vendor_id`, `min_qty`, `lead_time_days`, `early_bird_offer`, `weekly_capacity`, `cake_types`, `packaging_types`, `logo_printing`, `distributed_brands`, `gatherable_qty` | Một vendor tối đa một; `min_qty > 0` | FR-35 |
| `ref_price_tiers` | `id`, `order_profile_id`, `from_qty`, `unit_price` | `(order_profile_id, from_qty)` duy nhất **Mới** | FR-35 |
| `order_profile_custom_types` | `order_profile_id`, `custom_type` (BAG, CARD, STICKER, TEMPLATE_BOX) |  | BR-14 |
| `registration_fee_configs` **Mới** | `id`, `amount`, `effective_from`, `created_by` | `amount > 0`; mặc định 200.000 | FR-53 |
| `outbox_events` **Mới** | như identity |  | `vendor.updated`, `vendor.locked`, ... |

**Bảng sản phẩm (phía ghi, chuyển từ catalog)**

| Bảng | Cột chính | Ràng buộc | Nguồn |
| --- | --- | --- | --- |
| `products` **Chuyển** | `id`, `vendor_id` (FK), `name`, `description`, `cake_type`, `brand`, `origin`, `pieces_per_box`, `list_price`, `stock`, `expiry_date`, `delivery_label` (LOCAL, NATIONWIDE), `quote_threshold`, `status` (ON_SALE, HIDDEN, REMOVED), `removed_reason`, `removed_by`, `version` | `stock >= 0`; `list_price > 0`; chỉ tạo khi vendor `sells_shop` và `can_operate`; bán lại thì bắt buộc `brand`, `origin` | FR-29 → FR-34, FR-46, BR-12, BR-21, BR-24 |
| `product_images` **Chuyển** | `product_id`, `position`, `object_key` | PK `(product_id, position)` | FR-29 |
| `product_price_tiers` **Chuyển** | `id`, `product_id`, `from_qty`, `unit_price` | `(product_id, from_qty)` duy nhất | FR-31 |
| `stock_reservations` **Mới** | `id`, `product_id`, `qty`, `checkout_id`, `status` (HELD, COMMITTED, RELEASED), `expires_at` | Giữ theo checkout; `expires_at` do order gửi (một đồng hồ, P-01); RELEASED giữ lại được khi IPN đến trễ; index `(expires_at) WHERE HELD` cho tác vụ quét | BR-28, D-01 |

Giữ hàng bằng một câu lệnh có điều kiện: `UPDATE products SET stock = stock - :qty WHERE id = :id AND status = 'ON_SALE' AND stock >= :qty`, cùng transaction với dòng `stock_reservations`. Mỗi lần sản phẩm đổi (kể cả tồn kho), vendor ghi `product.upserted` vào outbox cùng transaction để catalog cập nhật bản đọc.

**API công khai**

**Root Vendor** (`/api/vendors`)

| Method, đường dẫn | Ai | Mục đích | FR |
| --- | --- | --- | --- |
| `POST /api/vendors/uploads` | M | Xin chỗ tải giấy tờ (presigned) → `{objectKey, url}` | AC-26.1 |
| `POST /api/vendors` | M (đã NFC) | Nộp hồ sơ, kèm `documents[{kind, objectKey}]`; kiểm BR-23, BR-27, BR-33 | FR-26 |
| `GET /api/vendors?ownerAccountId=me` | M | Hồ sơ của mình | FR-27 |
| `GET /api/vendors?status=` | A | Danh sách hồ sơ chờ duyệt | FR-45 |
| `GET /api/vendors/{vendorId}` | S, A | Hồ sơ, trạng thái, lý do, `canOperate`; với A thêm kết quả NFC của chủ và cảnh báo | FR-27, AC-45.1 |
| `PUT /api/vendors/{vendorId}` | S | Nộp lại khi NEEDS_INFO hoặc REJECTED | AC-27.2 |
| `PATCH /api/vendors/{vendorId}` | S | `{localDeliveryFee}` | FR-28 |
| `PATCH /api/vendors/{vendorId}` | A | `{status: LOCKED, statusReason}` | FR-46 |
| `GET /api/vendors/{vendorId}/documents/{documentId}` | S, A | Link xem giấy tờ, hóa đơn phí | AC-27.6 |
| `POST /api/vendors/{vendorId}/documents` | A | Gắn hóa đơn phí đăng ký (`kind = FEE_INVOICE`) | Q-36 |
| `GET\|PUT /api/vendors/{vendorId}/delivery-areas` | S | Danh sách `provinceCode` giao được | FR-28 |
| `GET\|PUT /api/vendors/{vendorId}/order-profile` | S | Hồ sơ nhận đặt hàng, bậc giá, custom | FR-35 |
| `GET /api/vendors/{vendorId}/owner-checks` | A | Kết quả so chủ từng lần nộp | AC-45.4 |
| `GET\|POST /api/vendors/{vendorId}/reviews` | A | Quyết định `APPROVE / NEEDS_INFO / REJECT` + lý do + xác nhận đối chiếu; tạo review thì Vendor đổi trạng thái | AC-45.2 → AC-45.5 |
| `GET\|POST /api/vendors/{vendorId}/registration-fee-payments` | S | Tạo giao dịch phí theo mức hiện hành → `{paymentId, paymentUrl}` | AC-27.4, AC-53.3 |
| `POST /api/vendors/{vendorId}/products/uploads` | S | Xin chỗ tải ảnh sản phẩm (bucket công khai) | FR-29 |
| `POST /api/vendors/{vendorId}/products` | S | Đăng sản phẩm kèm images[], priceTiers[]; trả về sản phẩm vừa ghi | FR-29, FR-31 |
| `PUT /api/vendors/{vendorId}/products/{productId}` | S | Sửa thông tin, tồn kho, giá, ngưỡng báo giá, ảnh, bậc giá | FR-30, FR-31, FR-33 |
| `PATCH /api/vendors/{vendorId}/products/{productId}` | S | {status: ON_SALE \| HIDDEN} | FR-34 |
| `PATCH /api/vendors/{vendorId}/products/{productId}` | A | {status: REMOVED, removedReason} | FR-46, BR-24 |

**Root RegistrationFeeConfig** (`/api/registration-fee-config`)

| Method, đường dẫn | Ai | Mục đích | FR |
| --- | --- | --- | --- |
| `GET /api/registration-fee-config` | K, M | Mức phí hiện hành cho form khai hồ sơ | AC-26.9 |
| `PUT /api/registration-fee-config` | A | Đổi mức phí | FR-53 |

`POST /<root>/uploads` là quy ước chung cho file: xin chỗ tải trước, rồi gửi `objectKey` trong body khi tạo hoặc sửa tài nguyên. File chỉ thuộc tài nguyên sau khi được gắn vào.

Sản phẩm là tài nguyên con của Vendor vì các bất biến của nó nằm ở Vendor: chỉ Shop đã duyệt và đã đóng phí được đăng (BR-21, BR-31), sản phẩm bán lại phải có thương hiệu (BR-12), Shop bị khóa thì ngừng bán (BR-20). Phía ghi không có `GET` cho khách; mọi màn hình đọc dùng `/api/products` của catalog. Lệnh ghi trả về sản phẩm vừa ghi, nên màn hình quản lý của Shop không phải chờ bản đọc cập nhật.

`owner_account_id` đang có ràng buộc duy nhất (mỗi tài khoản một người bán). BR-22 có nói tới trường hợp một tài khoản làm chủ nhiều người bán; giữ ràng buộc cho demo là đơn giản hơn (mục 11).

Người bán là công ty tạm thời không đăng ký qua hệ thống (BR-33, mục 11): không có bảng buổi làm việc, không có giấy tờ thỏa thuận, và `POST /api/vendors` từ chối mọi `entityType` khác hai loại hình trên.

## Sự kiện và API nội bộ

**Phát**

- `vendor.updated`, `vendor.locked` → catalog, quotation, order, orchestrator
- `product.upserted`, `product.removed` → catalog, order, orchestrator
- `vendor.submitted`, `vendor.onboarding_recorded`, `vendor.reviewed`, `vendor.registration_fee_paid`, `registration_fee.changed`, `vendor.bank_account_changed` → orchestrator

**Nghe**

- `payment.succeeded`, `payment.failed`: chốt hoặc trả hàng đã giữ (BR-28); ghi đã đóng phí đăng ký (BR-31)

**API nội bộ**

- Gọi identity: `GET /internal/nfc/status/{accountId}`, `POST /internal/accounts/check`
- Gọi payment: `POST /internal/payments` (`purpose = REGISTRATION_FEE`)
- Cung cấp `GET /internal/vendors/by-owner/{accountId}` cho catalog, quotation, order
- Cung cấp `POST /internal/stock/reservations`, `DELETE /internal/stock/reservations/{checkoutId}` cho order: giữ (kèm `expiresAt`), giữ lại khi IPN đến trễ, trả hàng, trả giá hiện hành

## Quyết định liên quan

[P-01, P-09](db-review-proposals.md), [L-01](decisions.md), [L-02](decisions.md), [L-03](decisions.md), [L-14](decisions.md), [L-15](decisions.md), [L-17](decisions.md), [L-18](decisions.md).

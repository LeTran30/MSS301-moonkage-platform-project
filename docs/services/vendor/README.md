# Người bán, sản phẩm và tồn kho (vendor-service)

vendor-service giữ hồ sơ người bán, phí đăng ký, cài đặt bán, danh mục vỏ và nhân, phía ghi của sản phẩm Shop và hàng giữ cho checkout. Người mua đọc sản phẩm ở catalog-service, nơi giữ bản sao dựng từ sự kiện của vendor (L-18).

- Đích thiết kế (bảng, API, sự kiện): [api-db/vendor.md](../../architecture/api-db/vendor.md). Khi tài liệu này lệch với đích, `vendor.md` đúng.
- Các giai đoạn đã làm và điểm khác đề xuất: [completion-plan.md](completion-plan.md). Đánh giá tính đúng đắn theo tầng: [correctness-review.md](correctness-review.md).

Mọi request đi qua gateway `http://localhost:8080`, theo hai dạng đường dẫn: `/api/vendors/**`, `/api/registration-fee-config/**`, `/api/cake-attributes/**` (theo tên root, L-17), hoặc `/vendor-service/api/**` (theo tên service, còn dùng tới khi mọi service chuyển xong).

## Dữ liệu

Schema do Flyway quản lý (`db/migration`), dữ liệu mẫu ở `db/seed/R__seed.sql`. Cột từng bảng xem `vendor.md`.

| Bảng | Vai trò |
|---|---|
| `vendors` | Hồ sơ, trạng thái, phí đăng ký, cài đặt bán. Số định danh chỉ giữ hash và bản che; số tài khoản mã hóa AES-GCM (P-09) |
| `vendor_documents`, `vendor_owner_checks`, `vendor_reviews` | Giấy tờ (bucket riêng tư), kết quả so chủ mỗi lần nộp, quyết định duyệt |
| `vendor_delivery_areas`, `order_profiles`, `ref_price_tiers`, `order_profile_custom_types`, `order_profile_cake_attributes` | Vùng giao, hồ sơ nhận đặt hàng |
| `registration_fee_configs` | Mức phí đăng ký theo thời điểm |
| `cake_attributes` | Danh mục vỏ và nhân; không xóa, chỉ ẩn |
| `products`, `product_images`, `product_price_tiers`, `product_cake_attributes` | Sản phẩm Shop (phía ghi) |
| `stock_reservations` | Hàng giữ cho một checkout của order-service |
| `outbox_events`, `processed_events` | Sự kiện phát (outbox) và sự kiện đã nhận (inbox, chống xử lý lặp) |

**Trạng thái**

| Đối tượng | Chuyển được |
|---|---|
| Người bán (`VendorStatus`) | `PENDING → APPROVED, NEEDS_INFO, REJECTED`; `NEEDS_INFO, REJECTED → PENDING` (nộp lại); `APPROVED → LOCKED`; `LOCKED` không ra. `canOperate` = APPROVED và đã đóng phí |
| Sản phẩm (`ProductStatus`) | `ON_SALE ⇄ HIDDEN` (Shop); `ON_SALE, HIDDEN → REMOVED` (admin, kèm lý do); `REMOVED` không ra và không sửa được |
| Hàng giữ (`ReservationStatus`) | `HELD → COMMITTED, RELEASED`; `RELEASED → COMMITTED` (tiền về trễ, lấy hàng lại); `COMMITTED` không ra |

## Cấu trúc mã (package-by-component)

Mỗi package cấp một dưới `com.moonkage.vendor` là một component: bên ngoài chỉ thấy interface `*Service`, DTO và value object của nó; entity, repository, `*ServiceImpl` đều package-private. `web` là tầng HTTP nằm ngoài mọi component.

| Package | Sở hữu | Public | Phụ thuộc |
|---|---|---|---|
| `web` | — | Controller | mọi service public |
| `product` | `products` và bảng con, `stock_reservations` | `ProductService`, `StockService`, DTO, `ProductStatus`, `ReservationStatus`, `DeliveryLabel` | `vendor`, `cakeattribute`, `outbox` |
| `vendor` | `vendors` và bảng con, vùng giao, hồ sơ nhận đặt hàng | `VendorService`, `DeliveryAreaService`, `OrderProfileService`, `VendorView`, DTO, `vo` | `cakeattribute`, `registrationfee`, `client`, `inbox`, `outbox` |
| `cakeattribute` | `cake_attributes` | `CakeAttributeService`, `CakeAttributeRef`, `CakeAttributeCodes` | — |
| `registrationfee` | `registration_fee_configs` | `RegistrationFeeService` | `outbox` |
| `client` | — | Feign tới identity, payment | — |
| `inbox`, `outbox` | `processed_events`, `outbox_events` | `InboxService`, `OutboxService`, `EventEnvelope` | — |
| `security` | — | `@CurrentUser`, `CurrentUserInfo`, `Role` | — |
| `common` | — | `AppException`, `ErrorCode`, `ApiResponse`, VO dùng chung (`Price`, `Quantity`, `PriceTiers`) | — |

`ComponentArchitectureTest` kiểm các luật trên; `ArchitectureTest.NO_PACKAGE_CYCLES` kiểm không có vòng phụ thuộc.

Luật của một đối tượng nằm trong chính nó: value object tự kiểm khi tạo (`TaxCode`, `CakeAttributeLabel`, `PriceTiers`...); bản ghi điều khoản kiểm đủ trường theo nguồn hàng (`OrderTerms`, `ProductDetails`); entity giữ chuyển trạng thái (`Vendor`, `Product`, `StockReservation`). Service chỉ kiểm quyền, nạp dữ liệu và ghép các bước.

## Endpoint

Ai: K khách, M thành viên, S chủ người bán (thành viên sở hữu vendor), A admin. Body và mô tả đầy đủ ở Swagger (`http://localhost:8080/swagger-ui.html`, chọn vendor-service) và Postman [`docs/api/mk-vendor.json`](../../api/mk-vendor.json).

| Method, đường dẫn | Ai | Việc |
|---|---|---|
| `POST /api/vendors/uploads` | M | Xin chỗ tải giấy tờ |
| `POST /api/vendors` | M (đã NFC) | Nộp hồ sơ |
| `GET /api/vendors?ownerAccountId=me` / `?status=` | M / A | Hồ sơ của mình / danh sách chờ duyệt |
| `GET`, `PUT`, `PATCH /api/vendors/{id}` | S, A | Xem; nộp lại; phí giao (S) hoặc khóa (A) |
| `GET /api/vendors/{id}/documents/{documentId}`, `POST .../documents` | S, A / A | Link xem giấy tờ (10 phút); gắn hóa đơn phí |
| `GET`, `POST /api/vendors/{id}/reviews`, `GET .../owner-checks` | A | Duyệt hồ sơ |
| `GET`, `POST /api/vendors/{id}/registration-fee-payments` | S | Đóng phí đăng ký |
| `GET`, `PUT /api/vendors/{id}/delivery-areas`, `.../order-profile` | S | Cài đặt bán |
| `POST /api/vendors/{id}/products/uploads`, `POST`, `GET .../products`, `GET`, `PUT`, `PATCH .../products/{productId}` | S (A: `GET`, `PATCH` gỡ) | Sản phẩm Shop |
| `GET`, `PUT /api/registration-fee-config` | K / A | Mức phí đăng ký |
| `GET /api/cake-attributes?group=&includeHidden=&codes=`, `POST`, `PATCH .../{attributeId}` | K / A | Danh mục vỏ và nhân; `codes=` trả nhãn cả mã đã ẩn |

**Nội bộ** (gateway chặn `/internal/**`, trả dữ liệu không bọc):

| Method, đường dẫn | Ai gọi | Việc |
|---|---|---|
| `GET /internal/vendors/by-owner/{accountId}` | catalog, quotation, order | `VendorView` (không có dữ liệu riêng tư); 404 nếu tài khoản không có vendor |
| `POST /internal/stock/reservations` | order | Giữ hàng của checkout: đủ mọi dòng hoặc không dòng nào; trả giá chốt từng dòng |
| `POST /internal/stock/reservations/{checkoutId}/commit` | order | Tiền về: chốt; tiền về trễ thì lấy hàng lại, 409 thì order hoàn tiền |
| `DELETE /internal/stock/reservations/{checkoutId}` | order | Không thanh toán: trả hàng |

## Lỗi

Dạng body như identity-service: `ApiResponse` `{status, code, message, data, errors?, path, timestamp}`. Lỗi gắn được với một trường của request có `errors[].field`; thiếu hàng có một phần tử `errors` cho mỗi sản phẩm thiếu, `field` là `productId`.

Mã chung: `COMMON_400` (validation), `COMMON_400_JSON`, `COMMON_400_REQUIRED`, `COMMON_400_TOO_LONG`, `COMMON_400_PRICE`, `COMMON_400_QUANTITY`, `COMMON_400_PRICE_TIERS`, `COMMON_400_PROVINCE`, `COMMON_401`, `COMMON_403`, `COMMON_404`, `COMMON_409` (sai trạng thái), `COMMON_503` (identity, payment hoặc MinIO không trả lời).

| Mã | HTTP | Tên | Câu báo |
|---|---|---|---|
| `VENDOR_001` | 404 | `VENDOR_NOT_FOUND` | Không tìm thấy người bán. |
| `VENDOR_002` | 409 | `VENDOR_ALREADY_EXISTS` | Tài khoản này đã có hồ sơ người bán. |
| `VENDOR_003` | 403 | `NFC_NOT_VERIFIED` | Tài khoản cần xác minh NFC trước khi khai hồ sơ người bán. |
| `VENDOR_004` | 422 | `REPRESENTATIVE_NOT_OWNER` | Số định danh khai báo không trùng với CCCD đã xác minh NFC của tài khoản. |
| `VENDOR_005` | 400 | `ENTITY_TYPE_NOT_ACCEPTED` | Loại hình này chưa đăng ký qua hệ thống. |
| `VENDOR_006` | 400 | `DOCUMENT_REQUIRED` | Thiếu giấy tờ. |
| `VENDOR_007` | 400 | `DOCUMENT_NOT_ACCEPTED` | Giấy tờ không hợp lệ. |
| `VENDOR_008` | 400 | `SELLING_MODE_REQUIRED` | Chọn ít nhất một cách bán. |
| `VENDOR_009` | 404 | `DOCUMENT_NOT_FOUND` | Không tìm thấy giấy tờ. |
| `VENDOR_010` | 400 | `REVIEW_REASON_REQUIRED` | Yêu cầu bổ sung hoặc từ chối phải có lý do. |
| `VENDOR_011` | 400 | `REVIEW_CONFIRMATION_REQUIRED` | Cần xác nhận đã đối chiếu trước khi duyệt. |
| `VENDOR_012` | 409 | `VENDOR_NOT_APPROVED` | Chỉ người bán đã duyệt mới làm được thao tác này. |
| `VENDOR_013` | 409 | `REGISTRATION_FEE_ALREADY_PAID` | Phí đăng ký đã được đóng. |
| `VENDOR_014` | 409 | `REGISTRATION_FEE_NOT_PAID` | Người bán chưa đóng phí đăng ký. |
| `VENDOR_015` | 409 | `VENDOR_NOT_ACCEPTING_ORDERS` | Người bán không bật nhận đặt hàng. |
| `VENDOR_016` | 404 | `ORDER_PROFILE_NOT_FOUND` | Người bán chưa khai hồ sơ nhận đặt hàng. |
| `VENDOR_017` | 400 | `ORDER_TERM_REQUIRED` | Bắt buộc với nguồn hàng này. |
| `VENDOR_018` | 400 | `LOCK_REASON_REQUIRED` | Khóa người bán phải có lý do. |
| `VENDOR_019` | 404 | `CAKE_ATTRIBUTE_NOT_FOUND` | Không tìm thấy giá trị vỏ hoặc nhân. |
| `VENDOR_020` | 409 | `CAKE_ATTRIBUTE_DUPLICATE` | Trùng tên với một giá trị trong cùng nhóm. |
| `VENDOR_021` | 409 | `LAST_VISIBLE_CAKE_ATTRIBUTE` | Không ẩn được giá trị đang hiện cuối cùng của nhóm. |
| `VENDOR_022` | 400 | `CAKE_ATTRIBUTE_NOT_SELECTABLE` | Giá trị không có hoặc đã bị ẩn khỏi danh mục. |
| `VENDOR_023` | 404 | `PRODUCT_NOT_FOUND` | Không tìm thấy sản phẩm. |
| `VENDOR_024` | 409 | `VENDOR_NOT_OPERATING` | Người bán chưa được duyệt, chưa đóng phí hoặc đã bị khóa. |
| `VENDOR_025` | 409 | `VENDOR_NOT_SELLING_SHOP` | Người bán không bật Shop bán sẵn. |
| `VENDOR_026` | 409 | `PRODUCT_REMOVED` | Sản phẩm đã bị gỡ, không sửa được. |
| `VENDOR_027` | 409 | `PRODUCT_CHANGED` | Sản phẩm vừa được sửa ở nơi khác (hoặc vừa bán ra). Tải lại rồi thử lại. |
| `VENDOR_028` | 400 | `RESALE_TERM_REQUIRED` | Bắt buộc với sản phẩm bán lại (`brand`, `origin`). |
| `VENDOR_029` | 400 | `REMOVED_REASON_REQUIRED` | Gỡ sản phẩm phải có lý do. |
| `VENDOR_030` | 400 | `PRODUCT_IMAGE_INVALID` | Ảnh không phải ảnh vừa tải lên hoặc ảnh sản phẩm đang có. |
| `VENDOR_031` | 404 | `RESERVATION_NOT_FOUND` | Không có hàng nào được giữ cho lượt thanh toán này. |
| `VENDOR_032` | 409 | `STOCK_UNAVAILABLE` | Sản phẩm không còn đủ hàng hoặc đã ngừng bán. |
| `VENDOR_033` | 409 | `RESERVATION_MISMATCH` | Lượt thanh toán này đã giữ hàng với danh sách khác. |
| `VENDOR_034` | 409 | `RESERVATION_COMMITTED` | Hàng đã chốt bán, không trả về kho được. |
| `VENDOR_101` → `VENDOR_115` | 400 | Giá trị sai dạng | Mã số thuế, họ tên không dấu, số định danh, số tài khoản, phí giao, vùng giao, nhãn và mã vỏ/nhân, thứ tự, thời gian chuẩn bị, tồn kho, số ảnh, chọn bán lại trái nguồn hàng, dòng giữ hàng trùng, hạn giữ hàng |

Câu báo đầy đủ nằm ở `messages.properties`.

## Sự kiện

Phát qua outbox (cùng transaction với thay đổi), exchange `moonkage.events`.

| Routing key | Dạng | Người nghe |
|---|---|---|
| `vendor.updated`, `vendor.locked` | Envelope, `data` = `VendorSnapshot` | catalog, quotation, order, orchestrator |
| `product.upserted`, `product.removed` | Envelope, `data` = `ProductSnapshot` / `{productId, vendorId, status}` | catalog, order, orchestrator |
| `vendor.submitted`, `vendor.reviewed`, `vendor.registration_fee_paid`, `registration_fee.changed` | Phẳng | orchestrator |

Envelope theo [contract-proposal.md](../catalog/contract-proposal.md) mục 2: `{eventId, schemaVersion, eventType, sourceService, aggregateType, aggregateId, sourceVersion, occurredAt, data}`. `sourceVersion` là version của vendor hoặc sản phẩm sau thay đổi; bên nghe bỏ bản không mới hơn bản đang giữ. `data` là bản chụp đầy đủ, trường null vẫn có mặt.

Nghe: `payment.succeeded` với `purpose = REGISTRATION_FEE` (queue `vendor-service.payment-events`), ghi phí đăng ký; chống lặp bằng `processed_events`. Thanh toán của checkout không do vendor nghe: order gọi các endpoint giữ hàng ở trên.

## Tác vụ định kỳ

| Tác vụ | Khoảng chạy | Việc |
|---|---|---|
| `OutboxRelay` | `outbox.relay-interval` (2s) | Gửi sự kiện chưa gửi lên RabbitMQ |
| `ExpiredReservationSweeper` | `vendor.stock.sweep-interval` (1m) | Trả hàng của checkout còn `HELD` đã quá `expires_at`, mỗi checkout một transaction |

## Bảo mật dữ liệu (NFR-03)

- Số định danh đầy đủ chỉ đi qua vendor-service tới identity-service để băm, không lưu, không log; `IdNumber`, `CheckIdNumberRequest`, `SubmitVendorRequest` che nó trong `toString()`.
- Số tài khoản ngân hàng lưu mã hóa, API chỉ trả bản che; `BankAccountNumber.toString()` không in số.
- Giấy tờ nằm ở bucket riêng tư, chỉ mở bằng link ký hạn 10 phút (`MINIO_DOWNLOAD_LINK_LIFETIME`).
- `GET /internal/vendors/by-owner` trả `VendorView`, không có tài khoản ngân hàng, số định danh, giấy tờ.

## Cấu hình (`../../.env`)

Cách nạp `.env` như identity-service. Biến riêng của vendor-service:

| Biến | Ghi chú |
|---|---|
| `VENDOR_DB_HOST`, `VENDOR_DB_PORT` | `vendor_db` |
| `MINIO_VENDOR_ACCESS_KEY`, `MINIO_VENDOR_SECRET_KEY` | User MinIO riêng, chỉ ghi được `<vendor-docs>/vendor/`, `<vendor-docs>/tmp/vendor/`, `<public>/products/` (`infra/minio/init.sh`) |
| `MINIO_PUBLIC_BUCKET`, `MINIO_VENDOR_DOCS_BUCKET` | Ảnh sản phẩm (công khai); giấy tờ (riêng tư) |
| `MINIO_UPLOAD_LINK_LIFETIME`, `MINIO_DOWNLOAD_LINK_LIFETIME` | Mặc định `10m` |
| `VENDOR_DOCUMENT_ALLOWED_CONTENT_TYPES`, `VENDOR_DOCUMENT_MAX_SIZE` | Mặc định PDF, JPEG, PNG; `10MB` |
| `PRODUCT_IMAGE_ALLOWED_CONTENT_TYPES`, `PRODUCT_IMAGE_MAX_SIZE` | Mặc định JPEG, PNG, WebP; `5MB` |
| `STOCK_SWEEP_INTERVAL`, `STOCK_SWEEP_BATCH_SIZE` | Mặc định `1m`, `100` |
| `BANK_ACCOUNT_ENC_KEY_V1` | Khóa AES-256 (Base64, 32 byte) mã hóa số tài khoản; mất khóa là mất số tài khoản đã lưu |

## Kiểm thử

```bash
cd api
./mvnw -pl vendor-service -am clean verify   # như CI: test, checkstyle, spotless, errorprone
```

Test tích hợp chạy PostgreSQL bằng Testcontainers (cần Docker; không có Docker thì bỏ qua). RabbitMQ, MinIO, identity, payment được mock, trừ `OutboxRelayIntegrationTest` tự chạy RabbitMQ.

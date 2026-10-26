# Kế hoạch hoàn thành vendor-service

> **Trạng thái:** Đề xuất (2026-10-26). Đích là [api-db/vendor.md](../../architecture/api-db/vendor.md); kế hoạch này chỉ chia việc và thứ tự. Khi hai bên lệch, `vendor.md` là bản đúng. Là phần vendor của giai đoạn 2 và 4.1 trong [api-db-alignment-plan.md](../../architecture/api-db-alignment-plan.md).

## Hiện trạng (nhánh `fix/vendor-entities-schema`)

| Phần | Có | Thiếu |
| --- | --- | --- |
| Migration | V1, `V2026_10_22_1000` (mọi bảng của `vendor.md`), `V2026_10_22_1500` (`cake_attributes`, `product_cake_attributes`, `brand`) | Không cần migration mới cho tới khi nghiệp vụ đòi |
| Entity | `Vendor`, `BankAccount` (embedded), `DeliveryArea`, `OrderProfile`, `RefPriceTier` | `VendorDocument`, `VendorOwnerCheck`, `VendorReview`, `RegistrationFeeConfig`, `CakeAttribute`, `Product`, `ProductImage`, `ProductPriceTier`, `StockReservation`, `OutboxEvent` |
| Controller | `VendorController`: đủ đường dẫn Root Vendor trừ sản phẩm | `/api/registration-fee-config`, `/api/cake-attributes`, `/api/vendors/{id}/products/**`, `/internal/stock/reservations` |
| Service | Chỉ `findByOwnerAccountId` chạy thật | Mọi hàm còn lại trả `null` / `List.of()` |
| Hạ tầng | Flyway, Feign (`IdentityClient` rỗng), Testcontainers (`VendorRepositoryIntegrationTest`) | `ApiResponse`, `AppException` / `ErrorCode` / handler, `messages.properties`, outbox + RabbitMQ, common-storage, mã hóa số tài khoản, kiểm vai |
| Bên ngoài | identity có `GET /internal/nfc/status/{accountId}` (`legalName`, `idNumberMasked`, `nfcVerifiedAt`), `POST /internal/accounts/check`; gateway gắn `X-Account-Id`, `X-User-Role` | payment chưa có `POST /internal/payments`; catalog vẫn giữ `SellerProductController` (ghi sản phẩm) |

## Nguyên tắc

- Cấu trúc **package-by-component** như identity ([README identity](../identity/README.md)): entity, repository, `*ServiceImpl`, mapper package-private; controller chỉ ở `web`; có `ComponentArchitectureTest`.
- **Tên phản ánh đúng bản chất** của thứ nó nói tới ([coding-rules.md](../../conventions/coding-rules.md) phần 2): đọc tên class, method, field là biết nó *là gì* và *làm gì*, không phải nó được dùng ở đâu hay nằm ở tầng nào. Cụ thể:
  - Tên theo ngôn ngữ nghiệp vụ của requirement và `vendor.md`: `businessName` (tên đơn vị), không `name`; `registrationFeePaidAt`, không `paidDate`; `ownerCheck`, không `nfcCompare`.
  - Tiền tố method cam kết kiểu trả về: `get…` ném lỗi khi không có, `find…` trả `Optional`, `is/has/can…` trả `boolean` (`canOperate()`, `isOwnedBy(accountId)`).
  - Package đặt theo đúng thứ nó sở hữu (`registrationfee`, `deliveryarea`, không `fee`, `delivery`); class phụ trợ đặt theo vai trò thật (`BankAccountNumberCipher` chỉ mã hóa số tài khoản, không `PiiCipher` chung chung).
  - Đổi bản chất thì đổi tên cùng PR; không để tên cũ "vì đang dùng".
- **Dữ liệu có luật dùng value object** (coding-rules mục 1.3): VO tự chuẩn hóa và tự kiểm trong constructor, nên trong service không tồn tại giá trị sai; entity giữ VO qua JPA converter (chỉ ghi `value()`), DTO request nhận kiểu thô rồi đổi sang VO ngay ở biên service. Không kiểm lại cùng một luật ở nhiều nơi. Danh sách ở mục [Value object](#value-object).
- Không hardcode: hằng số ở `*Constant`, cấu hình ở `application.yml` / `.env`, thông báo lỗi ở `messages.properties`.
- Không sửa file `V…` đã merge; cần đổi schema thì thêm file mới, migration + entity + seed đi cùng PR (`docs/guides/database.md`).
- Kiểm nghiệp vụ ở service, không tin giao diện (BR-22, BR-23, BR-27, BR-31, BR-33).
- Mỗi giai đoạn một PR, xong khi `./mvnw -pl vendor-service clean verify` qua (gồm checkstyle, spotless), không dùng `-Dcheckstyle.skip`.

## Cấu trúc package đích

| Package | Sở hữu | Public |
| --- | --- | --- |
| `web` | — | `VendorController`, `RegistrationFeeConfigController`, `CakeAttributeController`, `ProductController`, `StockReservationController` (nội bộ) |
| `vendor` | `vendors`, `vendor_documents`, `vendor_owner_checks`, `vendor_reviews` | `VendorService`, `VendorView` (bản chụp chỉ đọc: `ownerAccountId`, `status`, `sellsShop`, `acceptsOrders`, `isOwnedBy()`, `canOperate()`), DTO, enum trạng thái, `vendor.vo` |
| `deliveryarea` | `vendor_delivery_areas` | `DeliveryAreaService` |
| `orderprofile` | `order_profiles`, `ref_price_tiers`, `order_profile_custom_types` | `OrderProfileService` |
| `registrationfee` | `registration_fee_configs` | `RegistrationFeeService` |
| `cakeattribute` | `cake_attributes` | `CakeAttributeService`, `CakeAttributeCode` |
| `product` | `products`, `product_images`, `product_price_tiers`, `product_cake_attributes` | `ProductService` |
| `stock` | `stock_reservations` | `StockReservationService` |
| `outbox` | `outbox_events` | `OutboxService` |
| `client` | — | `IdentityClient`, `PaymentClient` |
| `security` | — | `CurrentUser(Info)` đọc `X-Account-Id`, `X-User-Role` |
| `common` | — | `ApiResponse`, `AppException`, `ErrorCode`, `GlobalExceptionHandler`, VO dùng chung (`ProvinceCode`, `Price`, `Quantity`, `ObjectKey`), cấu hình |

`vendor` là aggregate root: component khác hỏi quyền và trạng thái qua `VendorService.getView(vendorId)` → `VendorView`, không đọc `VendorRepository` hay entity `Vendor` (coding-rules mục 1.1: dữ liệu qua biên bằng bản chụp chỉ đọc).

`canOperate()` là hành vi của `Vendor` và `VendorView`: `status == APPROVED && registrationFeePaidAt != null`. `LOCKED` và các trạng thái khác đều `false` (BR-20, BR-31, AC-27.3, AC-27.4).

## Value object

Mỗi VO là `record` bất biến, constructor chuẩn hóa rồi kiểm, sai thì `AppException` với mã lỗi riêng (trong `messages.properties`); hằng số của luật nằm trong chính VO. Có JPA converter khi entity giữ nó. Mẫu: `PhoneNumber` của identity.

| VO | Bản chất và bất biến | Dùng ở | Nguồn |
| --- | --- | --- | --- |
| `TaxCode` | Mã số doanh nghiệp / hộ kinh doanh: bỏ khoảng trắng; đúng định dạng (câu hỏi 6) | `Vendor.taxCode` | AC-26.1 |
| `ProvinceCode` | Mã tỉnh 2 ký tự, `Province.isKnown` | `Vendor.provinceCode`, `DeliveryArea` | L-15, A-18 |
| `DeliveryAreas` | Tập `ProvinceCode` không trùng, không rỗng | `PUT …/delivery-areas` | FR-28 |
| `RepresentativeName` | Họ tên viết không dấu, chữ hoa, gộp khoảng trắng; có dấu → lỗi tại trường; `matches(legalName)` so với họ tên theo thẻ sau khi bỏ dấu | `Vendor.representativeName`, owner check | AC-26.1, A-15 |
| `IdNumber` | Số định danh 12 chữ số; chỉ sống trong request, không lưu, không có trong log (`toString()` trả bản che) | Gửi `checkIdNumber` | BR-27, NFR-03 |
| `BankAccountNumber` | Chuỗi chữ số, độ dài trong giới hạn cấu hình; `masked()`; `toString()` trả bản che | Trước khi mã hóa vào `BankAccount` | P-09, NFR-03 |
| `Price` | `long` VND > 0 | `listPrice`, `unitPrice` của bậc giá, `registrationFeeAmount`, mức phí cấu hình | NFR-09, AC-53.1 |
| `DeliveryFee` | `long` VND ≥ 0 | `localDeliveryFee` | FR-28 |
| `Quantity` | `int` > 0 | `minQty`, `fromQty`, số lượng giữ hàng | FR-35, BR-28 |
| `PriceTiers` | Danh sách bậc giá: `fromQty` tăng dần, không trùng; `unitPriceFor(qty)` | Sản phẩm, hồ sơ nhận đặt hàng | FR-31, FR-35 |
| `CakeAttributeCode` | Slug `banh-nuong`: sinh từ nhãn (bỏ dấu, kebab), không đổi sau khi tạo | `CakeAttribute.code`, `crustCodes[]`, `fillingCodes[]` | FR-54, BR-34 |
| `ObjectKey` | Khóa MinIO có tiền tố của chủ (vendor hoặc tài khoản) và bucket; không nhận khóa của người khác | `VendorDocument`, `ProductImage` | AC-26.1, FR-29 |

Không làm VO cho trường không có luật riêng (`address`, `description`): VO chỉ đáng khi nó giữ một bất biến.

## Giai đoạn

### 0. Nền

- Chuyển code hiện có sang cấu trúc package ở trên; thêm `ComponentArchitectureTest`.
- `common`: `ApiResponse<T>`, `ErrorCode` (gồm `INVALID_STATE_TRANSITION` 409, `VENDOR_NOT_FOUND` 404, `NOT_VENDOR_OWNER` 403, `ROLE_FORBIDDEN` 403, `NFC_NOT_VERIFIED` 403, `VENDOR_ALREADY_EXISTS` 409), `AppException`, handler, `messages.properties`. Chép cách làm của identity cho đến khi có `common-web` (giai đoạn 0 của alignment plan).
- `security`: `@CurrentUser` thay cho `@RequestHeader("X-Account-Id")` lặp lại ở mọi hàm; kiểm vai `MEMBER` / `ADMIN` trong service.
- `outbox`: `OutboxEvent`, `OutboxRelay` gửi RabbitMQ có publisher confirm, như identity. Thêm `spring-boot-starter-amqp`.
- `client`: `IdentityClient.getNfcStatus(accountId)`, `IdentityClient.checkIdNumber(request)`; Feign error decoder đổi 404 của identity thành `AppException`.
- Thêm `common-storage` vào pom; cấu hình bucket riêng tư `vendor-docs`, bucket công khai cho ảnh sản phẩm.
- Test: khung `@SpringBootTest` + Testcontainers PostgreSQL và RabbitMQ dùng chung cho các giai đoạn sau.

**Xong khi:** service khởi động, mọi endpoint chưa viết trả `ApiResponse` 501 `COMMON_501` (không trả `null` giả thành công), architecture test và `VendorRepositoryIntegrationTest` qua.

**Trạng thái (2026-10-26):** xong trên nhánh `feat/vendor-foundation`. `DeliveryArea`, `OrderProfile` giữ `vendorId` thay cho quan hệ JPA tới `Vendor`. Chưa có VO; mỗi VO vào cùng giai đoạn đầu tiên dùng nó.

### 1. Khai và duyệt hồ sơ (FR-26, FR-27, FR-45; BR-23, BR-27, BR-33)

- Entity `VendorDocument` (`kind` BUSINESS_LICENSE, FOOD_SAFETY, FEE_INVOICE), `VendorOwnerCheck` (bất biến), `VendorReview`.
- `POST /api/vendors/uploads`: presigned upload vào `vendor-docs` → `{objectKey, url}`.
- `POST /api/vendors`:
  - chặn khi NFC chưa xác minh (`IdentityClient.getNfcStatus`, AC-26.5);
  - chặn khi tài khoản đã có vendor (`owner_account_id` duy nhất);
  - chỉ nhận `entityType` HOUSEHOLD_BUSINESS, SOLE_PROPRIETORSHIP (BR-33);
  - `sellsShop || acceptsOrders`; đổi request sang VO ở đầu hàm (`TaxCode`, `ProvinceCode`, `RepresentativeName`, `IdNumber`, `BankAccountNumber`, `ObjectKey`), sai là dừng tại trường đó;
  - gửi `IdNumber` sang `IdentityClient.checkIdNumber` lấy hash, masked, key version; không lưu, không log số đầy đủ;
  - ghi `VendorOwnerCheck` lần nộp thứ `submission_no` với `id_match`, `name_match` (`RepresentativeName.matches(legalName)`, AC-26.8, A-15); không trùng thì vẫn cho nộp, admin thấy cảnh báo;
  - `BankAccountNumberCipher` mã hóa `BankAccountNumber` (AES-GCM, khóa riêng của vendor, `pii_key_ver`), lưu `masked()` (P-09);
  - gắn `documents[{kind, objectKey}]` (bắt buộc BUSINESS_LICENSE; FOOD_SAFETY theo AC-26.1);
  - outbox `vendor.submitted`.
- `PUT /api/vendors/{id}`: chỉ khi `NEEDS_INFO` / `REJECTED`, ngược lại 409; chạy lại toàn bộ kiểm trên, thêm một `VendorOwnerCheck` mới, về `PENDING` (AC-27.2).
- `GET /api/vendors?ownerAccountId=me` (M), `GET /api/vendors?status=` (A, phân trang), `GET /api/vendors/{id}` (S, A): A thấy thêm kết quả NFC và owner check mới nhất (AC-45.1, AC-45.4).
- `GET /api/vendors/{id}/documents/{documentId}`: presigned GET ngắn hạn, chỉ chủ hoặc A (NFR-03).
- `GET /api/vendors/{id}/owner-checks` (A).
- `GET|POST /api/vendors/{id}/reviews` (A): `PENDING` → `APPROVED | NEEDS_INFO | REJECTED`; `reason` bắt buộc khi không duyệt (AC-45.2); duyệt bắt buộc `licenseChecked`, `registryChecked` (AC-45.5); review và đổi trạng thái cùng transaction; outbox `vendor.reviewed`, `vendor.updated` (AC-45.3, orchestrator gửi thông báo).
- Chuyển trạng thái là hành vi của entity: `Vendor.resubmit(...)`, `Vendor.decide(review)`, `Vendor.lock(reason)` tự kiểm trạng thái nguồn (sai → `INVALID_STATE_TRANSITION`); bảng nguồn → đích nằm ở `VendorStatus.canTransitionTo`, không viết `setStatus` rải rác trong service. Test bảng chuyển trạng thái.
- Seed: một vendor mỗi trạng thái, có owner check và document.

**Xong khi:** kịch bản nộp → yêu cầu bổ sung → nộp lại → duyệt chạy qua gateway; test tích hợp phủ AC-26.5, AC-26.6, AC-26.8, AC-27.2, AC-45.2, AC-45.5.

### 2. Phí đăng ký (FR-53; BR-31; AC-27.4 → AC-27.6, AC-53.x)

- Entity `RegistrationFeeConfig`; mức hiện hành = dòng `effective_from` mới nhất ≤ now; seed 200.000.
- `GET /api/registration-fee-config` (K, M), `PUT` (A, `amount` là `Price`, thêm dòng mới, không sửa dòng cũ); outbox `registration_fee.changed`.
- `POST /api/vendors/{id}/registration-fee-payments` (S): chỉ khi `APPROVED` và chưa đóng, ngược lại 409; số tiền là mức hiện hành lúc tạo (AC-53.3); gọi `PaymentClient` (`purpose = REGISTRATION_FEE`, `referenceId = vendorId`) → `{paymentId, paymentUrl}`.
- `GET /api/vendors/{id}/registration-fee-payments` (S): đọc từ các cột `registration_fee_*` của vendor (một lần đóng duy nhất).
- Nghe `payment.succeeded` (`purpose = REGISTRATION_FEE`): ghi `registration_fee_payment_id`, `amount`, `paid_at`; idempotent theo `paymentId`, lần hai bỏ qua (AC-27.5); outbox `vendor.registration_fee_paid`, `vendor.updated` (`canOperate` đổi). Bảng `processed_events` nếu chưa có thì thêm migration.
- `POST /api/vendors/{id}/documents` (A, `kind = FEE_INVOICE`), chủ tải được qua link ở giai đoạn 1 (AC-27.6).

**Phụ thuộc:** payment-service `POST /internal/payments` và sự kiện `payment.succeeded`. Nếu payment chưa xong, làm phần vendor trước với `PaymentClient` giả trong test, ghép thật khi payment merge.

**Xong khi:** vendor đã duyệt đóng phí qua VNPay sandbox, `canOperate = true`; IPN lặp không ghi hai lần.

### 3. Cài đặt bán và khóa người bán (FR-28, FR-35, FR-46)

- `PATCH /api/vendors/{id}` (S): `{localDeliveryFee}` → `DeliveryFee`; trường khác → 403.
- `PATCH /api/vendors/{id}` (A): `{status: LOCKED, statusReason}` bắt buộc lý do; outbox `vendor.locked`, `vendor.updated` (BR-20).
- `GET|PUT /api/vendors/{id}/delivery-areas` (S): thay toàn bộ danh sách bằng `DeliveryAreas`; outbox `vendor.updated`.
- `GET|PUT /api/vendors/{id}/order-profile` (S): chỉ khi `acceptsOrders`; `minQty` là `Quantity`, bậc giá là `PriceTiers`, `customTypes` ⊂ enum; outbox `vendor.updated`.
- Payload `vendor.updated` khớp `vendor_snapshots` của catalog (`ownerAccountId`, `businessName`, `status`, `canOperate`, `sellsShop`, `deliveryAreas`, `localDeliveryFee`, `sourceVersion = version`).
- Đổi tài khoản ngân hàng (nếu cho phép ngoài nộp lại): outbox `vendor.bank_account_changed`; không đưa số đầy đủ vào sự kiện.

**Xong khi:** catalog nhận `vendor.updated` và cập nhật `vendor_snapshots`; khóa Shop làm sản phẩm biến mất khỏi `GET /api/products`.

### 4. Danh mục vỏ và nhân (FR-54; BR-34)

- Entity `CakeAttribute`; danh mục ban đầu đã có trong migration `V2026_10_22_1500`.
- `GET /api/cake-attributes?group=` (công khai, chỉ `active`, theo `sortOrder`); `includeHidden=true` chỉ A.
- `POST` (A): `CakeAttributeCode.fromLabel(label)` sinh `code`, `labelKey` chuẩn hóa; trùng → 409 (AC-54.2); đặt cuối thứ tự.
- `PATCH /{id}` (A): `label`, `sortOrder`, `active`; không đổi `code`; ẩn giá trị đang hiện cuối cùng của nhóm → 409 (AC-54.6).
- `CakeAttributeCode` và `labelKey` dùng chung một hàm bỏ dấu; unit test cho chữ tiếng Việt (`đ`, dấu kép).

**Xong khi:** web người bán và bộ lọc người mua đọc danh mục từ endpoint này.

### 5. Ghi sản phẩm (L-18; FR-29 → FR-34, FR-46; BR-12, BR-21, BR-24, BR-34)

- Entity `Product`, `ProductImage`, `ProductPriceTier`, liên kết `product_cake_attributes`.
- `POST /api/vendors/{id}/products/uploads`: presigned upload bucket công khai, kiểm loại và kích thước bằng `common-storage`.
- `POST /api/vendors/{id}/products` (S): `VendorView` kiểm `isOwnedBy`, `canOperate()`, `sellsShop`; `listPrice` là `Price`, bậc giá là `PriceTiers`, ảnh là `ObjectKey`, `stock ≥ 0`; ít nhất một vỏ và một nhân, chỉ nhận mã đang hiện; bán lại (`supplySource` RESELL / BOTH theo lựa chọn sản phẩm) bắt buộc `brand`, `origin`, còn lại `brand` trống ghi `businessName` (BR-12, L-19); trả sản phẩm vừa ghi.
- `PUT /api/vendors/{id}/products/{productId}` (S): thay thông tin, tồn kho, giá, ngưỡng báo giá, ảnh, bậc giá; mã vỏ / nhân đã ẩn mà sản phẩm đang có thì giữ được (AC-33.6); `@Version` chống ghi đè.
- `PATCH` (S): `ON_SALE ⇄ HIDDEN`; (A): `REMOVED` + `removedReason`, `removedBy`; `REMOVED` không quay lại (BR-24).
- Mọi lần ghi (kể cả tồn kho) phát `product.upserted` cùng transaction; `REMOVED` phát `product.removed`. Payload mang `crustCodes[]`, `fillingCodes[]`, `sourceVersion`.
- Phối hợp catalog: catalog bỏ `SellerProductController`, `Product`, `ProductPriceTier` và dựng `product_views` từ sự kiện. Merge hai PR cùng ngày; seed sản phẩm tạo lại ở vendor (`R__seed.sql`).

**Xong khi:** Shop đăng sản phẩm qua vendor và thấy nó ở `GET /api/products` của catalog sau vài giây; catalog không còn endpoint ghi.

### 6. Giữ hàng (BR-28; D-01, D-14; P-01)

- Entity `StockReservation` (`HELD`, `COMMITTED`, `RELEASED`).
- `POST /internal/stock/reservations` cho order: nhận `checkoutId`, `expiresAt`, danh sách `{productId, qty}`; mỗi dòng giữ bằng `UPDATE products SET stock = stock - :qty WHERE id = :id AND status = 'ON_SALE' AND stock >= :qty` cùng transaction với dòng reservation; thiếu một dòng thì rollback cả checkout, trả dòng nào thiếu; trả giá hiện hành theo bậc giá. Lặp cùng `checkoutId` trả kết quả cũ.
- `DELETE /internal/stock/reservations/{checkoutId}`: trả hàng, `RELEASED`.
- Nghe `payment.succeeded` (`purpose = ORDER`): `HELD → COMMITTED`; nếu đã `RELEASED` (IPN đến trễ) thì giữ lại nếu còn hàng, không còn thì báo order để hoàn tiền (theo `order.md`, P-01). `payment.failed`: `RELEASED`.
- Tác vụ `@Scheduled` quét `HELD` quá `expires_at` (index `ix_stock_reservations_held`), trả hàng theo lô; khoảng chạy để trong `application.yml`.
- Mỗi lần tồn kho đổi phát `product.upserted`.
- Test đồng thời: nhiều checkout tranh một sản phẩm tồn kho thấp, tổng giữ không vượt tồn.

**Xong khi:** luồng mua ngay của order giữ, chốt, trả hàng đúng; test tranh chấp qua.

### 7. Hoàn thiện

- `GET /internal/vendors/by-owner/{accountId}` dùng DTO nội bộ riêng (không lộ số tài khoản), cập nhật `VendorClient` của catalog, quotation, order.
- Gateway: route `/api/vendors/**`, `/api/registration-fee-config/**`, `/api/cake-attributes/**` → vendor-service (giai đoạn 3 của alignment plan); chặn `/internal/**`.
- `docs/services/vendor/README.md` theo mẫu identity: bảng dữ liệu, cấu trúc package, trạng thái, sự kiện phát / nghe.
- Postman `docs/api/` cho vendor; Swagger có mô tả và ví dụ.
- Rà NFR-03: log không chứa số định danh, số tài khoản; link giấy tờ hết hạn ngắn.

## Kiểm thử

| Loại | Phạm vi |
| --- | --- |
| Unit | Mỗi VO: giá trị đúng, giá trị sai ném đúng mã lỗi, chuẩn hóa (vd `RepresentativeName`, `CakeAttributeCode` với chữ tiếng Việt), `toString()` của `IdNumber`, `BankAccountNumber` không lộ số; chuyển trạng thái `VendorStatus`; `canOperate()`; mã hóa / giải mã số tài khoản |
| Tích hợp (Testcontainers PostgreSQL + RabbitMQ) | Mỗi endpoint: đúng vai, sai vai 403, sai trạng thái 409; outbox ghi cùng transaction; listener idempotent; giữ hàng đồng thời |
| Hợp đồng | Feign tới identity, payment bằng WireMock; payload sự kiện so với DTO của catalog |
| Kiến trúc | `ComponentArchitectureTest`, không vòng phụ thuộc package; entity không giữ `String` cho trường đã có VO |

## Câu hỏi cần chốt

1. Sự kiện `vendor.onboarding_recorded` (buổi làm việc với công ty, BR-26) còn cần không khi công ty tạm bỏ (BR-33)? Đề xuất: bỏ khỏi danh sách phát.
2. Chủ đổi tài khoản ngân hàng ngoài lần nộp lại: cho phép không, có cần duyệt lại không? Ảnh hưởng `vendor.bank_account_changed`.
3. `supplySource` của vendor là `BOTH` thì sản phẩm nào là bán lại: cần cờ trên sản phẩm hay suy từ `brand ≠ businessName`?
4. Khóa mã hóa số tài khoản (`pii_key_ver`): lấy từ `.env` như identity hay một nguồn khác; ai được giải mã khi chuyển tiền (payment gọi vendor, hay vendor gửi số trong lệnh payout)?
5. Payment-service làm `POST /internal/payments` khi nào: quyết định giai đoạn 2 làm thật hay dùng client giả trước.
6. Định dạng `TaxCode`: chỉ 10 chữ số, hay nhận cả 10-3 (chi nhánh) và mã hộ kinh doanh là số định danh 12 chữ số? `TaxCode` của order (hóa đơn doanh nghiệp, AC-24.3) có nên chung một VO ở `common-reference` không?

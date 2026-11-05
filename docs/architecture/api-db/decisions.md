# Điểm lệch với code và việc cần chốt

> **Trạng thái:** Đề xuất (2026-10-22). Một phần của [phác thảo API và database](README.md); quyết định ở [decisions.md](decisions.md).

Phần lớn là migration `V2__...` cho từng service; nên làm trước khi viết nghiệp vụ của vendor, quotation, order, payment.

| # | Điểm | Hiện trạng code | Đề xuất | Căn cứ |
| --- | --- | --- | --- | --- |
| L-01 | Loại hình người bán | `entity_type` chỉ có ENTERPRISE, HOUSEHOLD_BUSINESS | Đã chốt: hai giá trị HOUSEHOLD_BUSINESS, SOLE_PROPRIETORSHIP; công ty tạm bỏ khỏi hệ thống (BR-33) | BR-27, BR-33 |
| L-02 | Tên đơn vị | `vendors.legal_name` | Đã chốt: đổi thành `business_name` | D-09 |
| L-03 | Thiếu trường xác minh, phí | Không có người đại diện, `owner_check`, buổi làm việc, phí giao nội thành, phí đăng ký, giấy tờ | Đã chốt: thêm theo mục 4, bỏ phần buổi làm việc với công ty (BR-33); làm trong một migration | FR-26, FR-45, BR-31 |
| L-04 | Xóa sản phẩm | Cột `products.deleted` + `DELETE /api/seller/products/{productId}`; README ghi "xóa" | Đã chốt: bỏ cả hai, chỉ ẩn | AC-34.6 |
| L-05 | Trả lời đánh giá | `reviews.vendor_reply`, `replied_at` | Đã chốt: bỏ | Requirement 4.2 |
| L-06 | Phiên NFC, OTP | Lưu trong `ConcurrentHashMap` | Đã chốt: không ghi DB; giữ trong bộ nhớ của identity-service, hết hạn sau 5 phút, thay vì bảng `nfc_sessions`, `otp_codes` | NFR-05 |
| L-07 | Kiểu thời điểm | vendor, catalog, quotation, order, payment dùng `timestamp without time zone` | `timestamptz` như identity. Đã chốt | NFR-06 |
| L-08 | Thanh toán | `payments.order_id NOT NULL`, `type` có REFUND | `purpose` + `reference_id`, bảng `payment_allocations`, `refunds`. Đã chốt | BR-29, BR-31 |
| L-09 | Phiên checkout | Chỉ có `orders.checkout_id` | Bảng `checkouts`, `checkout_lines`; cột đổi thành `payment_group_id`. Đã chốt | FR-09, D-10 |
| L-10 | Báo giá | Thiếu `shipping_fee`; không có `quote_acceptances` | Thiết kế lại: báo giá có dòng hàng, số phiên bản, số tiền cọc tính sẵn; chấp nhận sinh bản chép ràng buộc (mục dưới). Tạm chấp nhận (22/10/2026) | BR-30, D-11 |
| L-11 | Tên bảng, cột quotation | `tender_*`, `buyer_user_id` | `quote_requests`, `request_invitations`, `buyer_account_id`. Đã chốt | Requirement 7.1, D-21 |
| L-12 | Cột file | `file_url`, `avatar_url` | `object_key`; URL cấp qua presigned. Đã chốt | common-storage |
| L-13 | Voucher | Bảng `vouchers` ở order; Software Design đặt ở payment | Đã chốt: hoãn cùng FR-13, FR-50; chốt chỗ đặt khi làm | Software Design 4.7 |
| L-14 | Một tài khoản nhiều người bán | `owner_account_id` duy nhất | Đã chốt: giữ ràng buộc duy nhất cho demo | BR-22 |
| L-15 | Đơn vị vùng giao | Địa chỉ có cả `province_code` và `ward_code`; vùng giao là `area_code` tự do | Đã chốt: xóa ward_code khỏi addresses; vùng giao = `province_code` theo giá trị tạm Q-12 | Q-12 |
| L-16 | Đường dẫn API | `/<tên-service>/api/...`; auth có động từ | Gộp vào L-17: gateway định tuyến theo tên root; sửa một lần cho cả web và app | D-18, D-24 |
| L-17 | Kiểu API | Tách theo vai (/api/seller, /api/admin) và có động từ (/visibility, /review, /lock, /decline); D-18 cũng tách theo vai | Đã chốt (22/10/2026): tài nguyên theo aggregate root, trừ auth và callback VNPay; một đường dẫn cho mọi vai. Cần sửa D-18 trong Software Design, gateway, controller, web và app Moonkage Verify (đường dẫn NFC) | D-18, D-24 |
| L-18 | Ghi và đọc sản phẩm | catalog-service vừa ghi vừa đọc sản phẩm (CRUD, ảnh, bậc giá, tồn kho) | Đã chốt (22/10/2026): vendor-service là nơi duy nhất ghi sản phẩm và giữ tồn kho; catalog chỉ giữ bản đọc product_views từ product.upserted. Chuyển bảng, controller ghi và ảnh MinIO từ catalog sang vendor; cập nhật Software Design mục 4.3, 4.4, D-14 | BR-28, D-01, D-14 |
| L-19 | Vỏ, nhân và thương hiệu | `cake_type`, `brand` là chuỗi tự do, có thể trống; Requirement chưa có trường phân loại bánh dù AC-06.2 lọc theo nó | Đã chốt (22/10/2026): phân loại theo hai nhóm vỏ và nhân, giá trị là **dữ liệu** chứ không phải enum: bảng `cake_attributes` ở vendor-service (nơi ghi sản phẩm, kiểm được ngay khi ghi), quản trị quản lý qua `/api/cake-attributes` (FR-54); sản phẩm liên kết nhiều-nhiều qua `product_cake_attributes`; bỏ `products.cake_type`. catalog chỉ giữ mã (`crust_codes`, `filling_codes`) từ `product.upserted`, nên đổi tên giá trị không cần đồng bộ. `products.brand` NOT NULL, vendor ghi `business_name` khi người bán không thuần bán lại để trống. Migration vendor `V2026_10_22_1500__cake_attributes_and_product_brand.sql`, catalog `V2026_10_22_1510__product_views_crust_filling.sql`. `order_profiles.cake_types` chuyển sang liên kết cùng danh mục khi làm FR-35 | BR-12, BR-34, FR-54, AC-29.4 |

## Xử lý L-01 → L-05 (22/10/2026)

| # | Kết quả | Việc trong code |
| --- | --- | --- |
| L-01 | Đã chốt: hai loại hình, công ty tạm bỏ | Sửa CHECK `vendors_entity_type_check`, enum Java (chỉ HOUSEHOLD_BUSINESS, SOLE_PROPRIETORSHIP), form web; máy chủ từ chối loại hình khác |
| L-02 | Đã chốt | `ALTER TABLE vendors RENAME COLUMN legal_name TO business_name`; đổi entity, DTO, giao diện |
| L-03 | Đã chốt, bỏ phần công ty | Thêm cột và bảng theo mục 4; không có vendor_onboarding_meetings, không có giấy tờ AGREEMENT |
| L-04 | Đã chốt | Bỏ cột `products.deleted`, endpoint `DELETE /api/seller/products/{productId}`, dòng "xóa" trong README |
| L-05 | Đã chốt | Bỏ cột `reviews.vendor_reply`, `replied_at` |

### L-01: ba loại hình người bán

Phân biệt theo tư cách pháp nhân, vì nó quyết định ai được làm chủ tài khoản và nền tảng kiểm thế nào (Context mục 3, 5). Code đang gộp doanh nghiệp tư nhân và công ty vào `ENTERPRISE`, trong khi hai loại này được xác minh theo hai luồng khác nhau.

| Giá trị | Là gì | Pháp nhân | Ai làm chủ tài khoản | Nền tảng kiểm |
| --- | --- | --- | --- | --- |
| `HOUSEHOLD_BUSINESS` | Hộ kinh doanh: tiệm, xưởng gia đình, có mã số hộ kinh doanh | Không; chủ hộ chịu trách nhiệm bằng toàn bộ tài sản | Bắt buộc chính chủ hộ, không ủy quyền | Máy chủ so số định danh trên giấy chứng nhận với CCCD đã xác minh NFC, không trùng thì không nộp được (BR-27, AC-26.6) |
| `SOLE_PROPRIETORSHIP` | Doanh nghiệp tư nhân: doanh nghiệp một chủ, có mã số doanh nghiệp | Không; chủ chịu trách nhiệm bằng toàn bộ tài sản | Bắt buộc chính chủ doanh nghiệp | Như hộ kinh doanh, thêm: quản trị tra cứu mã số trên Cổng thông tin quốc gia (AC-45.5) |
| `COMPANY` | Tạm bỏ (BR-33). Công ty TNHH, cổ phần, hợp danh | Có; tồn tại độc lập với con người | Người được ghi trong thỏa thuận hợp tác; không cần là người đại diện theo pháp luật | Cho nộp dù số định danh không trùng; chỉ duyệt khi có buổi làm việc trực tiếp, thỏa thuận do người đại diện ký và đã tra cứu cổng (BR-26, AC-45.6) |

**Quyết định (22/10/2026):** công ty không đăng ký trực tuyến mà làm việc trực tiếp với đội vận hành, nên tạm thời bỏ khỏi hệ thống. `entity_type` chỉ còn `HOUSEHOLD_BUSINESS` và `SOLE_PROPRIETORSHIP`; cả hai đều bắt buộc chính chủ (BR-27).

**BR-33 (đã thêm vào Requirement, 22/10/2026):** Công ty TNHH, công ty cổ phần và công ty hợp danh tạm thời không khai hồ sơ người bán trên nền tảng. Công ty muốn bán làm việc trực tiếp với đội vận hành Moonkage, ngoài hệ thống. Form khai hồ sơ chỉ có hai loại hình hộ kinh doanh và doanh nghiệp tư nhân, kèm một dòng hướng dẫn công ty liên hệ đội vận hành. Máy chủ từ chối mọi loại hình khác, kể cả khi gọi thẳng API. BR-26, AC-26.7, AC-45.6 và phần công ty của AC-45.4 tạm hoãn. Doanh nghiệp tư nhân vẫn được tra cứu trên Cổng thông tin quốc gia (AC-45.5).

Hệ quả trong thiết kế: bỏ bảng `vendor_onboarding_meetings`, loại giấy tờ `AGREEMENT` và endpoint ghi buổi làm việc. Context và User Stories giữ nguyên theo quyết định của nhóm; khi triển khai thì theo BR-33.

### L-03: các trường còn thiếu ở vendor-service

| Nhóm | Cột / bảng | Để làm gì | Căn cứ |
| --- | --- | --- | --- |
| Người đại diện | `representative_name`, `representative_id_hash`, `representative_id_key_ver`, `representative_id_masked` trên `vendors` | Họ tên và số định danh của chủ hộ / chủ DNTN như trên giấy chứng nhận. Chỉ lưu mã băm (do identity băm) và dạng che, không lưu số đầy đủ | AC-26.1, BR-27, NFR-03 |
| Kết quả so chủ | Bảng `vendor_owner_checks` | Mỗi lần nộp ghi một dòng bất biến: số định danh có trùng CCCD của chủ tài khoản không, họ tên khớp không. Quản trị thấy cảnh báo khi duyệt | AC-26.8, AC-45.4, A-15 |
| Lịch sử duyệt | Bảng `vendor_reviews` | Mỗi quyết định của quản trị kèm lý do và các ô xác nhận đã đối chiếu | AC-45.2, AC-45.5 |
| Phí giao nội thành | `local_delivery_fee` trên `vendors` | Mức cố định cho mỗi đơn trong vùng giao; catalog đọc qua bản sao để tính phí | FR-28, BR-30 |
| Phí đăng ký mở bán | `registration_fee_payment_id`, `registration_fee_amount`, `registration_fee_paid_at` trên `vendors`; bảng `registration_fee_configs` | Chưa đóng thì `can_operate = false`: không đăng bán, không nhận yêu cầu. Lưu số tiền đã đóng vì đổi mức phí không ảnh hưởng người đã đóng | BR-31, AC-27.4, AC-53.2 |
| Giấy tờ | Bảng `vendor_documents` | Giấy chứng nhận đăng ký, giấy tờ ATTP, hóa đơn phí; lưu `object_key` ở bucket riêng tư `vendor-docs` | AC-26.1, AC-27.6 |

Đã chốt (22/10/2026): làm đủ các nhóm trên trong một migration của vendor-service.

## Xử lý L-06 → L-12 (22/10/2026)

| # | Kết quả |
| --- | --- |
| L-06 | Đã chốt: phiên NFC và OTP sống 5 phút nên không ghi PostgreSQL; lưu kho có TTL (mục 3). Kho: bộ nhớ của identity-service |
| L-07, L-11, L-12 | Đã chốt theo đề xuất |
| L-08, L-09 | Đã chốt theo đề xuất (giải thích bên dưới) |
| L-10 | Tạm chấp nhận thiết kế ở mục 6; xem lại khi nhóm quyết định báo giá có giá trị như hợp đồng hay không |

### L-08: vì sao `payments` không gắn cứng một `order_id`

Một giao dịch VNPay không phải lúc nào cũng trả cho đúng một đơn đã có. Ba trường hợp trong Requirement phá vỡ giả định đó:

| Trường hợp | Vì sao `order_id` không dùng được | `purpose` | `reference_id` |
| --- | --- | --- | --- |
| Giỏ nhiều Shop | Một lần trả cho N đơn (BR-29), và lúc tạo giao dịch các đơn chưa tồn tại (FR-09) | CHECKOUT | `checkoutId` |
| Đặt cọc | Đơn đặt hàng chỉ được tạo sau khi cọc thành công (BR-04) | DEPOSIT | `acceptanceId` |
| Phần còn lại | Đơn đã có, dùng được | REMAINDER | `orderId` |
| Phí đăng ký mở bán | Không có đơn nào (BR-31) | REGISTRATION_FEE | `vendorId` |

Ví dụ: anh Minh trả một lần 520.000đ cho hai Shop. Có một `payments` CHECKOUT 520.000đ. Khi IPN thành công, order tạo đơn O1, O2, rồi payment ghi `payment_allocations` (O1 = 330.000đ, O2 = 190.000đ) và mở sổ tiền từng đơn. Hoàn tiền tách sang bảng `refunds` vì đó là tiền đi ra, có gọi API riêng và có thể cần xử lý tay (AC-49.3), không phải một lần thanh toán.

### L-09: vì sao cần phiên checkout

FR-09 nói thanh toán thất bại thì **không tạo đơn**, và BR-28 nói phải **giữ hàng** trong lúc người mua ở trang VNPay. Vậy trong khoảng vài phút đó cần một nơi ghi "người mua đang trả cho những gì" mà chưa phải là đơn: đó là `checkouts` + `checkout_lines`.

1. Người mua bấm thanh toán → order chép giỏ (giá, số lượng, phí giao từng Shop, địa chỉ, hóa đơn) vào checkout PENDING_PAYMENT, vendor giữ hàng, payment tạo giao dịch.
2. IPN thành công → trong một transaction, từ checkout tạo N đơn, mỗi Shop một đơn, cùng `payment_group_id = checkoutId`; checkout SUCCEEDED.
3. Thất bại hoặc hết hạn → checkout FAILED, trả hàng; không có đơn nào từng tồn tại.

Code hiện chỉ có cột `orders.checkout_id`, nghĩa là đơn phải có trước khi trả tiền, trái FR-09. Đổi tên thành `payment_group_id` cho đúng tên nghiệp vụ của BR-29.

Các câu hỏi nghiệp vụ còn mở ảnh hưởng tới schema: hủy sau khi cọc (Q-01, có thể cần trạng thái CANCELLED), thanh toán khi nhận hàng nội thành (Q-05), duyệt lại hồ sơ sau khi sửa (Q-26).

## Rà soát database P-01 → P-09 (22/10/2026)

Chi tiết và SQL ở [db-review-proposals.md](db-review-proposals.md). Tất cả đã gộp vào file `V2026_10_22_1000__align_with_api_db_outline.sql` của từng service (V2 chưa merge, không thêm V3).

| # | Kết quả |
| --- | --- |
| P-01 | Một đồng hồ do order đặt; giữ hàng theo `checkout_id`; id đơn cấp lúc tạo checkout; checkout có `EXPIRED`, `REFUND_REQUESTED`; hoàn tiền `LATE_PAYMENT` |
| P-02 | `orders.payout_locked_at`; payment gọi `POST /internal/orders/{orderId}/payout-lock` trước khi chuyển tiền |
| P-03 | Mỗi `(purpose, reference_id)` tối đa một payment SUCCEEDED; lần sau ghi `DUPLICATE`, hoàn `DUPLICATE_PAYMENT` |
| P-04 | `held` ép bằng CHECK; sổ khớp dòng sổ, phân bổ khớp số tiền, kiểm lúc commit |
| P-05 | `product_views` bỏ trường vendor; đọc qua view `product_listings` |
| P-06 | `ck_orders_kind_status` (NOT VALID, VALIDATE sau khi merge) |
| P-07 | Module `api/common-reference` (enum `Province`, 34 đơn vị theo Quyết định 19/2025/QĐ-TTg); catalog có bảng `provinces` và FK từ `interprovince_fees`; seed phí cho đủ 34 tỉnh. Đóng A-18 |
| P-08 | Index outbox có điều kiện ở cả 6 service |
| P-09 | `bank_account_number_enc`, `bank_account_masked`, `pii_key_ver`; bỏ số dạng thường; seed chỉ có số đã che |
| Giữ nguyên | Khóa `varchar(36)`; hai bảng chống lặp ở orchestrator làm hai việc khác nhau |

---

## Quyết định kiến trúc D-25 → D-30 (đề xuất 2026-11-05)

Những quyết định dưới đây được rút ra từ rà soát code thực tế ngày 2026-11-05 (xem [../codebase-conformance-review.md](../codebase-conformance-review.md)). Mỗi mục dùng đúng bốn phần: Context / Decision / Consequences / Status. Số mã tiếp tục từ D-24 của [software-design.md](../software-design.md).

### D-25: Danh sách origin CORS và ranh giới tin cậy ở Gateway

**Context.** Gateway là điểm vào duy nhất của hệ thống và là nơi duy nhất xác thực JWT: `api/api-gateway/src/main/java/com/moonkage/gateway/config/SecurityConfig.java:147-157` dựng `NimbusReactiveJwtDecoder` với HS256 và chỉ nhận token có claim `type = "ACCESS"`. Cùng file đó loại bỏ header do client gửi lên rồi gắn lại danh tính từ token: `withUserHeaders()` tại `:185-203` xoá `X-User-Id`, `X-Account-Id`, `X-User-Role` và chỉ set `X-Account-Id` (bằng `sub`) cùng `X-User-Role`. Gateway cũng chặn toàn bộ đường dẫn nội bộ: `.pathMatchers("/internal/**", "/*/internal/**").denyAll()` tại `:68`. Trái với đó, cấu hình CORS đang đọc từ biến môi trường: `corsConfigurationSource()` tại `:161-169` lấy `${moonkage.cors.allowed-origins}` rồi đặt `setAllowedOrigins(origins)`, `setAllowedMethods(GET/POST/PUT/PATCH/DELETE/OPTIONS)` và `setAllowedHeaders(Authorization, Content-Type)`. Danh sách origin đến từ `CORS_ORIGINS` trong `.env` (`.env.example:104` mặc định `http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173`). Điểm đáng lưu ý: cơ chế "chặn header giả" hiện chỉ nằm ở gateway — không service nào tự kiểm `X-User-*`.

**Decision.**

1. **Gateway là cửa vào tin cậy duy nhất.** Danh tính người gọi chỉ được lấy từ `X-Account-Id` và `X-User-Role` do gateway gắn; service sau gateway **không** đọc trực tiếp JWT và **không** tin bất kỳ header nào khác do client gửi lên. Mọi endpoint nội bộ nằm dưới `/internal/...` và bị `denyAll()` ở gateway.
2. **CORS là danh sách origin tuyệt đối, không phải pattern.** `CORS_ORIGINS` liệt kê đầy đủ origin (scheme + host + port), mỗi origin một dòng, không có wildcard `*`. Origin không có trong danh sách thì trình duyệt chặn trước khi request tới gateway.
3. **`CORS_ORIGINS` là cấu hình môi trường, không phải hằng trong code.** Production bắt buộc khai báo đúng origin của web/app đang chạy; danh sách localhost chỉ dùng cho dev.
4. **`allowedHeaders` chỉ gồm `Authorization` và `Content-Type`.** Mọi header do client tự thêm — kể cả `X-User-*` — không được khai báo ở đây. Nếu sau này cần header tuỳ biến, phải thêm **có chủ đích** vào cả danh sách CORS lẫn kiểm tra ở gateway, không mở chung.
5. **Không dùng cookie phiên ở production khi chưa bật `VITE_AUTH_MODE=cookie`.** Web hiện dùng Bearer token (`web/src/shared/config/security.ts` — `AUTH_MODE` mặc định `'bearer'`, `apiCredentials()` chỉ bật `withCredentials` khi chế độ cookie). Nếu chuyển sang cookie, CORS phải trả `Access-Control-Allow-Credentials: true` và `Access-Control-Allow-Origin` **không** được là `*` — nghĩa là vẫn phải dùng danh sách origin cụ thể.

**Consequences.**

- Vì gateway là điểm tin cậy duy nhất, mọi service đều phải tin `X-Account-Id`; nếu một service bị truy cập **trực tiếp** (bypass gateway, ví dụ trong môi trường dev nội bộ) thì nó tin header giả. Đây là hệ quả được chấp nhận: môi trường dev chỉ mở cổng gateway ra ngoài; các cổng service (`8081`–`8088`) chỉ nằm trong mạng Docker.
- Danh sách origin phải cập nhật mỗi khi đổi domain hoặc thêm môi trường; quên cập nhật sẽ ra lỗi CORS ở trình duyệt chứ không phải ở server.
- Cấu hình CORS nằm trong `application.yml` của gateway và đọc qua `@Value`, chưa theo `@ConfigurationProperties` như chuẩn §4.8 — cần hợp nhất sau.
- Việc không khai báo `X-User-*` trong `allowedHeaders` là biện pháp phòng thủ thứ hai; biện pháp chính vẫn là xoá header ở gateway.

**Status.** Đề xuất (2026-11-05). Cần duyệt bởi BE lead.

### D-26: Sổ ID xác định và ranh giới dữ liệu PII trong seed

**Context.** D-22 đã chốt: schema do Flyway quản lý, dữ liệu mẫu là repeatable migration `db/seed/R__seed.sql` của từng service, chỉ bật ở docker-compose, dùng ID cố định. Code đã làm đúng phần lớn: `docker-compose.yml` bật `SPRING_FLYWAY_LOCATIONS=classpath:db/migration,classpath:db/seed` cho cả 7 service; mỗi `R__seed.sql` dùng `ON CONFLICT DO NOTHING` nên chạy lại nhiều lần không sinh trùng. Định dạng ID được quy định ở `docs/guides/database.md` mục 5: `00000000-0000-4000-8000-<loại 4 số><thứ tự 8 số>`. Sổ hiện liệt kê loại `0001` (account), `0002` (vendor), `0003` (product), `0004` (quote request, *chưa dùng*), `0005` (order, *chờ người phụ trách*), `0006` (address), `0007` (delivery area), `0008` (registration fee config). Nhưng seed hiện dùng các ID **không có trong sổ**: `api/vendor-service/src/main/resources/db/seed/R__seed.sql:77` ghi bậc giá `00000000-0000-4000-8000-000300000101` và `:83-84` ghi một dòng outbox `product.upserted` với `eventId` `00000000-0000-4000-8000-000900000001` — mã `0009` (outbox event) và mã bậc giá `000300000101` đều không được sổ ghi. Ranh giới PII: hồ sơ NFC không seed bằng SQL vì `legal_profiles` lưu số định danh đã mã hóa; `api/identity-service/src/main/java/com/moonkage/identity/kyc/NfcProfileSeeder.java` đọc `db/seed/nfc-profiles.json` và chạy **chỉ khi** `app.seed.enabled=true`, bỏ qua âm thầm nếu thiếu `PII_ENC_KEY_V1` / `ID_HASH_PEPPER_V1`.

**Decision.**

1. **ID xác định cấp phát bằng sổ, không cấp phát trong code.** Mọi ID hardcode trong `R__seed.sql` phải có một dòng tương ứng trong `docs/guides/database.md` mục 5. Loại mới lấy mã loại kế tiếp (`0009`…). Không dùng ID ngẫu nhiên trong seed — nếu dùng thì phải ghi rõ trong sổ là "sinh mỗi lần seed" và dữ liệu liên quan phải chịu được việc đó.
2. **Sổ có hai mảng tách biệt:**
   - *ID được tham chiếu chéo* (account, vendor, product, address, delivery area, registration fee config, bậc giá, outbox event trong seed) — bắt buộc có trong sổ, vì service khác hoặc E2E test tra cứu theo ID này.
   - *ID chỉ nội bộ một service* (ví dụ `0005` order khi order-service chưa có seed) — ghi trong sổ là *chờ*, và không ai được tham chiếu tới.
3. **ID của bản ghi outbox trong seed phải là ID xác định** (`0009` cho event), vì nó là `eventId` mà inbox của catalog dùng để chống xử lý trùng (`claim(eventId, routingKey)` trong `CatalogProjectionServiceImpl`).
4. **Dữ liệu PII không seed bằng SQL.** Hồ sơ NFC seed bằng `db/seed/nfc-profiles.json` + `NfcProfileSeeder`, và:
   - Chỉ chạy khi `app.seed.enabled=true` (tức là trong docker-compose dev), không có ở production.
   - Dùng khóa của **chính máy dev**; máy thiếu `PII_ENC_KEY_V1` / `ID_HASH_PEPPER_V1` thì bỏ qua và chỉ ghi cảnh báo — không được fail service.
   - Không bao giờ chứa số định danh dạng thường trong SQL seed. Số tài khoản ngân hàng trong seed chỉ có dạng đã che (P-09).
5. **ID trong seed phải là UUID hợp lệ version 4** (nhóm `0000-4000-8000`) để không lệch với `IdNumberHasher`/kiểm tra định dạng UUID của các service khác.

**Consequences.**

- Thêm một record mẫu mới tốn thêm một dòng sổ; đổi lại, ID trong seed **có thể tra cứu** và E2E test viết được theo ID thay vì đoán.
- Sổ phải được cập nhật **cùng PR** với seed, giống như quy tắc "migration và seed cùng PR" ở `docs/guides/database.md` mục 2.
- Hồ sơ NFC seed không nhất quán giữa các máy (khóa mã hóa khác nhau) — đây là chủ ý: dữ liệu dev không cần giống hệt nhau, chỉ cần đủ để chạy luồng.
- Seed chứa số định danh của người thật là rủi ro; sổ ID và `nfc-profiles.json` phải được coi là dữ liệu nhạy cảm, không được đẩy lên repo công khai.

**Status.** Đề xuất (2026-11-05). Cần bổ sung hai dòng còn thiếu (`000300000101`, `0009`) vào `docs/guides/database.md`.

### D-27: Catalog giữ bản đọc sản phẩm; nhất quán cuối cùng chấp nhận được

**Context.** L-18 đã chốt: vendor-service là nơi **duy nhất** ghi sản phẩm và giữ tồn kho; catalog-service chỉ giữ bản đọc `product_views` dựng từ sự kiện `product.upserted`. Code đã hiện thực đúng hướng đó: `api/catalog-service/src/main/resources/db/migration/V2026_10_22_1000__align_with_api_db_outline.sql:23` tạo `product_views`, `:69` tạo `vendor_snapshots`, `:88` tạo view `product_listings`; `api/catalog-service/src/main/resources/db/migration/V2026_10_22_1510__product_views_crust_filling.sql:18` và `V2026_11_02_1000__vendor_accepts_orders.sql:10` **DROP VIEW rồi CREATE lại** `product_listings` mỗi khi thêm cột mới. Một điểm cần lưu ý về tính nhất quán: bảng `products` cũ với cột `deleted` nằm ở `api/catalog-service/src/main/resources/db/migration/V1__baseline.sql:16` (cột `deleted` ở `:21`), trong khi L-04 đã chốt bỏ cột `deleted` và L-18 đã chốt bỏ việc ghi sản phẩm ở catalog — bảng này còn sót lại trong schema. Về cơ chế: `api/catalog-service/src/main/java/com/moonkage/catalog/inbox/ProjectionInboxConsumer.java` chỉ **ghi lại** sự kiện vào `projection_inbox` (ACK nghĩa là đã ghi inbox, chưa nghĩa là đã cập nhật bản đọc); `CatalogProjectionServiceImpl.applyProduct()` chống xử lý trùng bằng `eventId`; `ProjectionRecoveryServiceImpl.replayPending()` phát lại các sự kiện chưa áp dụng; `CatalogProjectionProperties` có `applyBatchSize` (mặc định 100) và `applyMaxPages` (mặc định 10).

**Decision.**

1. **Ranh giới ghi: chỉ vendor-service.** `catalog-service` không có endpoint ghi sản phẩm; mọi thay đổi sản phẩm đi qua outbox của vendor rồi mới tới catalog. Bản đọc của catalog là **dẫn xuất**, không phải nguồn sự thật.
2. **Cập nhật bản đọc là bất đồng bộ (eventual consistency), và điều này được chấp nhận.** Giữa lúc vendor phát `product.upserted` và lúc catalog áp dụng, trang danh mục có thể hiện dữ liệu cũ. UI phải chịu được độ trễ này (React Query dùng cache, không refetch dồn dập).
3. **`product_listings` là view, không phải bảng.** Khi thêm cột vào `product_views` hoặc `vendor_snapshots`, phải `DROP VIEW` rồi `CREATE VIEW` lại trong migration mới — quy tắc bắt buộc của PostgreSQL (không `CREATE OR REPLACE` được khi đổi danh sách cột). Migration phải theo thứ tự: `DROP VIEW` → `ALTER TABLE` → `CREATE VIEW`.
4. **Mọi lần sửa schema của catalog phải kèm kiểm tra bản đọc.** Thêm cột vào `product_views` mà quên cập nhật `product_listings` sẽ khiến trang danh mục im lặng mất trường dữ liệu.
5. **Inbox là bằng chứng, không phải hàng đợi.** Sự kiện được ghi vào `projection_inbox` trước khi áp dụng; nếu áp dụng hỏng thì hàng đợi không mất sự kiện, và `ProjectionRecoveryServiceImpl` phát lại được. Vì vậy **không** được xoá hoặc truncate `projection_inbox` như một hàng đợi thông thường.
6. **Bảng `products` cũ của catalog sẽ bị bỏ** bằng migration riêng (một migration `V…__drop_legacy_products.sql`), sau khi xác nhận không query nào còn đọc nó. Không gộp việc này vào migration đang ứng dụng.

**Consequences.**

- Việc sửa danh mục sẽ "động" sau vài giây; nếu người dùng kỳ vọng thấy ngay thì cần thao tác làm mới thủ công hoặc chờ — phải nói rõ trong UI, không che bằng spinner vô hạn.
- Có thêm một đường ghi trong schema lịch sử của catalog (`products` cũ) cần dọn; dọn sai sẽ làm hỏng trang danh mục, nên tách migration riêng và chạy sau khi đã xác nhận.
- View phải được khai báo lại theo mỗi lần đổi cột — công việc lặp lại nhỏ nhưng dễ sót, nên migration mới phải kèm câu lệnh kiểm tra (ví dụ `SELECT` thử từ view sau khi tạo).
- `applyMaxPages` giới hạn số trang mỗi lần chạy để một lần phát lại luôn kết thúc; đổi tham số này ảnh hưởng tới thời gian một lần replay.

**Status.** Đề xuất (2026-11-05). Phần "bỏ bảng `products` cũ" có thể chuyển sang **Đã chốt** ngay vì L-18 đã chốt nguyên tắc.

### D-28: Hợp đồng `Idempotency-Key` cho endpoint tiền và đặt cọc

**Context.** Retry sau khi mất phản hồi sẽ tạo trùng giao dịch tiền thật; cơ chế chống trùng duy nhất hiện là cột `payments.idempotency_key` (`api/payment-service/src/main/java/com/moonkage/payment/entity/Payment.java:63-64`) cùng truy vấn `findPendingByIdempotencyKey` (`PaymentRepository.java:32-34`). Phía gọi: `api/order-service/src/main/java/com/moonkage/order/client/PaymentClient.java:23` gửi `@RequestHeader("Idempotency-Key")`; `CheckoutServiceImpl.java:119-121` dùng **chính `checkoutId`** làm key, với comment "The checkout id is the idempotency key (BE-08b): a retry answers the same payment". Phía nhận: `api/payment-service/src/main/java/com/moonkage/payment/controller/InternalPaymentController.java:25,38` nhận header (không bắt buộc) rồi `PaymentServiceImpl.create(request, idempotencyKey)` tại `:62`; `findReusable()` tại `:114-124` chỉ trả lại payment cũ khi **cùng** `purpose`, `referenceId` **và** `amount` — cùng key nhưng khác số tiền bị coi là yêu cầu khác, không tái sử dụng. Ngoài ra có chốt trùng thứ hai: `existsByPurposeAndReferenceIdAndStatus(..., SUCCEEDED)` tại `:70-73` trả `PAYMENT_ALREADY_PAID` nếu mục tiêu đã thanh toán xong. Vấn đề còn mở: **web không gửi `Idempotency-Key`** — `web/src/shared/api/client.ts` chỉ gắn `Authorization` (`:72-73`), và `web/src/features/checkout/api/checkoutApi.ts` gọi `apiClient.post(GATEWAY.ORDER.CHECKOUT, payload)` không có key nào. Web chỉ chống click đúp ở tầng UI (`web/src/shared/lib/useAction.ts`).

**Decision.**

1. **`Idempotency-Key` là bắt buộc** trên mọi endpoint tạo giao dịch tiền: `POST /internal/payments` (purpose `CHECKOUT`, `DEPOSIT`, `REMAINDER`, `REGISTRATION_FEE`). Key phải là **UUID sinh ở phía gọi** và gắn vào **ý định** (một lần thanh toán), không phải sinh lại mỗi lần gửi lại.
2. **Giá trị key phải suy ra được từ đối tượng nghiệp vụ**, không phải số ngẫu nhiên rời rạc:
   - `CHECKOUT` → `checkoutId`
   - `DEPOSIT` → `acceptanceId`
   - `REMAINDER` → `orderId`
   - `REGISTRATION_FEE` → `vendorId`
   Đây đúng là cách `CheckoutServiceImpl` đang làm; giữ nguyên nguyên tắc đó và áp dụng cho các purpose còn lại.
3. **Server tái sử dụng payment cũ khi trùng `purpose` + `referenceId` + `amount`**; cùng key nhưng khác `amount` phải bị coi là yêu cầu khác và **không** tái sử dụng. Payment đã `FAILED` không được tái sử dụng — người gọi được quyền bắt đầu lượt thử mới.
4. **Chốt trùng ở tầng nghiệp vụ giữ nguyên.** `(purpose, reference_id)` đã có payment `SUCCEEDED` thì trả `409 PAYMENT_ALREADY_PAID` — không dựa vào key cho trường hợp này.
5. **Web chưa gửi key là hạn chế đã biết, và phải được ghi nhận trước khi bật thanh toán thật.** Bản sửa: `checkoutApi.ts` phải lấy key từ một nguồn ổn định theo ý định thanh toán (ví dư `checkoutId` do server cấp, hoặc `crypto.randomUUID()` giữ lại qua `usePaymentPoll`), và `apiClient` phải cho phép truyền header này. Trước khi sửa, `web/src/shared/lib/useAction.ts` chỉ chống click đúp ở tầng UI — **không** phải idempotency.
6. **Header là quy ước chung, không phải chi tiết riêng của payment.** Mọi endpoint tạo giao dịch tiền sau này dùng cùng tên header và cùng nguyên tắc "tái sử dụng theo ý định".

**Consequences.**

- Retry an toàn ở tầng server, kể cả khi mạng đứt giữa lúc gọi. Đây là điều kiện tiên quyết để bật VNPay thật.
- Vì key gắn với ý định, một người dùng bấm "thanh toán" hai lần trên hai tab vẫn tạo **một** giao dịch — đúng nhưng cần UI thông báo rõ.
- Số ID bị dùng làm key (checkoutId, orderId…) phải là duy nhất theo ý định; không được dùng lại một ID cho hai ý định khác nhau.
- Việc web chưa gửi key là khoảng trống thật: chốt D-28 không xoá được khoảng trống đó, cần một PR FE riêng kèm test.

**Status.** Đề xuất (2026-11-05). Phần "server tái sử dụng theo `purpose` + `referenceId` + `amount`" có thể chuyển sang **Đã chốt** ngay vì đã là hành vi đang chạy.

### D-29: Ranh giới sở hữu phí giao hàng

**Context.** BR-30 và D-14 đã chốt: catalog là nơi **duy nhất** tính phí giao cho đơn mua ngay, giữ bảng phí liên tỉnh, đọc phí nội thành từ bản sao, và trả phí theo người bán trong `POST /internal/products/snapshot`. Code khớp: `api/catalog-service/src/main/java/com/moonkage/catalog/service/impl/ProductSnapshotServiceImpl.java:42-46` đọc phí liên tỉnh theo `province_code` từ `InterprovinceFeeRepository`; `:60-72` chọn phí — nếu tỉnh người mua nằm trong `delivery_areas` của người bán thì dùng `local_delivery_fee` lấy từ bản sao `vendor_snapshots` (đọc qua view `product_listings`), còn ngoài vùng thì chỉ giao được khi mọi sản phẩm `NATIONWIDE` **và** tỉnh đó có phí liên tỉnh. Phía vendor chỉ **giữ** mức phí: `api/vendor-service/src/main/java/com/moonkage/vendor/vendor/VendorSnapshot.java:13,27` — `localDeliveryFee` là `null` khi người bán chưa đặt, và comment nói rõ "`null` … is not a free delivery". Phía order **chép** phí đã tính vào phiên checkout: `api/order-service/src/main/java/com/moonkage/order/entity/CheckoutGroup.java:41,47` có `shippingFee` và `total = itemsAmount + shippingFee`; `CheckoutServiceImpl.java:85` gọi `catalogClient.snapshot(...)` rồi `:352` gán `group.setShippingFee(vendor.shippingFee())`. Riêng luồng báo giá thì **người bán tự nhập** phí: `api/quotation-service/src/main/java/com/moonkage/quotation/dto/request/SubmitQuoteRequest.java:26` có `@NotNull @PositiveOrZero Long shippingFee` và `QuoteTerms.java:14,55` ghi rõ "shipping is inside the total, BR-30" — tức phí giao của luồng đặt hàng **không** do catalog tính.

**Decision.**

1. **Catalog là nơi duy nhất tính phí giao cho luồng mua ngay.** Nó giữ bảng `interprovince_fees` (mức liên tỉnh) và đọc `local_delivery_fee` của người bán từ bản sao `vendor_snapshots`. `POST /internal/products/snapshot` là hợp đồng trả phí duy nhất của luồng này.
2. **Vendor chỉ giữ mức phí nội thành, không tính phí.** `local_delivery_fee` là **thuộc tính của người bán**, không phải kết quả tính. `null` nghĩa là "chưa đặt" và **không** đồng nghĩa "miễn phí".
3. **Order chỉ chép phí đã được tính, không tính lại.** `checkout_groups.shipping_fee` là ảnh chụp bất biến của con số catalog trả tại thời điểm tạo checkout — đổi bảng phí sau đó không được làm đổi phí của phiên đang mở.
4. **Luồng báo giá có ranh giới riêng: người bán nhập phí giao trong báo giá.** `shippingFee` là một trường của báo giá, do người bán quyết định, và nằm **trong** tổng tiền báo giá. Đây là đường dẫn nghiệp vụ khác (BR-30), không phải ngoại lệ của quy tắc catalog-tính-phí.
5. **Điều kiện "giao được hay không" thuộc về cùng hợp đồng snapshot.** `deliverable` và cờ `interprovince` trả kèm phải được đọc từ cùng một câu trả lời; frontend không tự suy ra từ danh sách tỉnh.

**Consequences.**

- Có **hai** cách xác định phí giao trong hệ thống, theo hai luồng nghiệp vụ khác nhau; tài liệu và UI phải phân biệt rõ, nếu không sẽ có câu hỏi "tại sao báo giá này có phí giao còn đơn mua ngay thì không".
- Đổi bảng phí liên tỉnh ảnh hưởng tới các phiên checkout **mới**, không ảnh hưởng phiên đang mở — đúng với nguyên tắc chụp bất biến ở mục 3.
- Catalog phải luôn có bản sao `vendor_snapshots` đủ mới; nếu bản sao cũ, phí nội thành tính ra có thể lệch — vì vậy tồn kho và phí đều phụ thuộc độ trễ projection của D-27.
- Người bán không đặt phí (`null`) thì khách không mua được trong vùng của họ; đây là hành vi có chủ đích, cần hiển thị rõ trong UI quản lý sản phẩm.

**Status.** Đề xuất (2026-11-05). Phần "order chỉ chép phí" và "vendor chỉ giữ mức phí" có thể chuyển sang **Đã chốt** ngay vì đúng với D-14 đã chốt.

### D-30: Gateway định tuyến theo aggregate root; tắt `discovery.locator` theo từng service

**Context.** D-18 đã chốt đường dẫn công khai theo tài nguyên: `/api/<tài-nguyên>/...`, không tên service, không số phiên bản. D-24 ghi "**Mở: code lệch D-18**" và tới nay chưa chốt hướng đi. Hiện trạng code: `api/api-gateway/src/main/resources/application.yml` bật `spring.cloud.gateway.discovery.locator.enabled: true` với `lower-case-service-id: true` — nghĩa là mọi service đăng ký Eureka đều có thể truy cập qua `/<tên-service>/**`. Trên nền đó, file cấu hình khai báo thêm 4 route tường minh theo aggregate root:

| Route id | `uri` | `Path` |
|---|---|---|
| `catalog-service` | `lb://catalog-service` | `/api/products`, `/api/products/**`, `/api/interprovince-fees`, `/api/interprovince-fees/**` |
| `orchestrator-websocket` | `lb:ws://orchestrator-service` | `/ws/**` |
| `vendor-service` | `lb://vendor-service` | `/api/vendors/**`, `/api/registration-fee-config/**`, `/api/cake-attributes/**` |
| `orchestrator-notifications` | `lb://orchestrator-service` | `/api/notifications`, `/api/notifications/**` |

Phía web, `web/src/shared/api/gateway.ts` đang trộn **cả hai** kiểu đường dẫn: `/api/vendors`, `/api/registration-fee-config`, `/api/cake-attributes`, `/api/interprovince-fees`, `/api/notifications` (đúng D-18) bên cạnh `/identity-service/api/auth/login`, `/catalog-service/api/products`, `/quotation-service/api/quote-requests`, `/order-service/api/carts/me`, `/payment-service/api/payments` (theo tên service). Gateway cũng phải liệt kê **cả hai dạng** trong `SecurityConfig` khi cho phép công khai: ví dụ `GET /api/products` và `GET /catalog-service/api/products` cùng `permitAll()` tại `api/api-gateway/src/main/java/com/moonkage/gateway/config/SecurityConfig.java:100-106`.

**Decision.**

1. **Đường dẫn công khai duy nhất là `/api/<tài-nguyên>/...`**, không có tên service (giữ D-18). `discovery.locator` là đường dẫn tạm, không phải hợp đồng.
2. **Mỗi service được chuyển sang đường dẫn tài nguyên theo thứ tự**, và trong mỗi đợt chuyển:
   - Thêm route tường minh vào `application.yml` của gateway cho các aggregate root của service đó.
   - Chuyển toàn bộ hằng số đường dẫn trong `web/src/shared/api/gateway.ts` sang dạng `/api/...`.
   - Cập nhật `SecurityConfig` của gateway: `permitAll()` chỉ liệt kê dạng mới (dạng cũ sẽ bị xoá khi locator tắt).
   - Chạy E2E trên `vite preview` (`web/playwright.config.ts` — `webServer.command` dựng bản build thật rồi chạy `vite preview --port 4173`) để chắc chắn không đường dẫn nào bị bỏ sót.
3. **Đường dẫn cũ trả `308` trong một release**, rồi mới tắt `discovery.locator`. Không cắt thẳng: app mobile và tài liệu cũ còn gọi dạng có tên service.
   - `308` chứ không phải `301`: dạng cũ được gọi bằng method khác GET (bảng phí đổi bằng `PUT`), mà `301` khiến trình duyệt đổi thành GET và mất body. `308` giữ nguyên method và body nên caller không cảm nhận được khác biệt.
   - Trả redirect bằng `WebFilter` ở `Ordered.HIGHEST_PRECEDENCE` (`api/api-gateway/src/main/java/com/moonkage/gateway/config/LegacyPathRedirectFilter.java`), **trước** chuỗi Spring Security: một `GlobalFilter` của gateway chạy sau security nên đường dẫn cũ cần token (bảng phí `PUT` chỉ admin) sẽ bị `403` trước khi tới được redirect.
4. **Mỗi aggregate root thuộc đúng một service**; không có hai service cùng phục vụ `/api/<root>`. Đây là điều kiện để viết route tường minh mà không phải cân bằng đường dẫn.
5. **`/internal/...` không bao giờ có route công khai.** Gateway tiếp tục `denyAll()` cho `/internal/**` và `/*/internal/**` (`SecurityConfig.java:68`) bất kể locator còn bật hay không — vì đường dẫn nội bộ của service đã nằm dưới `/internal/` nên nó đã bị chặn sẵn, không phụ thuộc vào việc tắt locator.
6. **Đường dẫn có tên service chỉ được dùng trong code nội bộ** (OpenFeign gọi thẳng `lb://<service>/internal/...` qua `path = "/internal"` trong `@FeignClient`, ví dụ `api/order-service/src/main/java/com/moonkage/order/client/PaymentClient.java:12`) — không phải trong hợp đồng API công khai.

**Consequences.**

- Trong giai đoạn chuyển, hệ thống phục vụ **hai** dạng đường dẫn cho cùng một tài nguyên; bảng `SecurityConfig` phải cập nhật theo từng đợt, và cần nhớ rằng mọi `permitAll()` phải liệt kê cả hai dạng cho tới khi dạng cũ bị bỏ.
- Việc tắt `discovery.locator` là một thay đổi có tác động lớn nhất: mọi đường dẫn không khai báo route tường minh sẽ trả 404. Vì vậy thứ tự bắt buộc là: khai báo route → chuyển client → chạy E2E → chuyển `308` → tắt locator.
- `web/src/shared/api/gateway.ts` là nơi tập trung đường dẫn; sau khi chuyển xong, file này chỉ còn `/api/...` và có thể kiểm bằng một test đơn giản: không hằng số nào chứa `"-service/api/"`.
- Chưa chốt được ngày tắt locator vì còn phụ thuộc tiến độ app mobile — app Flutter gọi dạng có tên service và nằm ngoài repo này, nên không thể kiểm chứng từ đây.

**Status.** Đề xuất (2026-11-05). Thay cho D-24 đang "Mở". Cần BE lead + FE lead duyệt, và cần xác nhận từ phía app mobile.

---

## Tài liệu liên quan

| Tài liệu | Nội dung |
|---|---|
| [../software-design.md](../software-design.md) | Thiết kế hệ thống, quyết định D-01 → D-24 (mục 11) |
| [../architecture-standards.md](../architecture-standards.md) | Chuẩn kiến trúc mà các quyết định này cụ thể hoá |
| [../codebase-conformance-review.md](../codebase-conformance-review.md) | Rà soát code thực tế, backlog P0/P1/P2 |
| [../../guides/database.md](../../guides/database.md) | Sổ ID, quy tắc Flyway và seed |
| [README.md](README.md) | Bảng mục lục API–DB theo service |



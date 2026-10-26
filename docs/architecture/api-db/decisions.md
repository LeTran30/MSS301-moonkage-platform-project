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


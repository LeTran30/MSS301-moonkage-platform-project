# Kế hoạch: đưa code về khớp schema V2 và API theo aggregate root

> **Trạng thái:** Đề xuất (2026-10-22). Xong thì chuyển vào `archive/` theo quy tắc ở `docs/README.md`.
> **Căn cứ:** tài liệu "Moonkage – Phác thảo API và Database" (`docs/architecture/api-db/`, quyết định L-01 → L-18, rà soát P-01 → P-09), migration `V2026_10_22_1000__align_with_api_db_outline.sql` của 6 service, BR-33 trong `docs/product/requirements.md`.

## Mục tiêu

- Cả 6 service khởi động được với schema V2 (`ddl-auto: validate` không báo lỗi), `./mvnw clean verify` xanh.
- Sản phẩm chỉ được ghi ở vendor-service; catalog chỉ đọc (L-18).
- Mọi API công khai, trừ `/api/auth` và callback VNPay, đi theo aggregate root, không tiền tố vai, không động từ (L-17).
- Web và app Moonkage Verify gọi đúng đường dẫn mới.

## Nguyên tắc làm

- Một PR cho mỗi giai đoạn; trong mỗi PR, migration, entity và seed đi cùng nhau (`docs/guides/database.md`).
- Không sửa file `V…` đã merge; cần đổi thì thêm file mới.
- Kiểm nghiệp vụ ở service, không dựa vào giao diện (BR-22, BR-23, BR-27, BR-28, BR-31, BR-33).
- Service nào chưa có nghiệp vụ thì chỉ sửa cho khớp schema, chưa viết API.

## Giai đoạn

### 0. Nền dùng chung

- Thư viện `common-web`: `ApiResponse<T>`, `ErrorCode`, exception handler, đọc người gọi từ JWT, mã lỗi `INVALID_STATE_TRANSITION` (409). Chuyển catalog và identity sang dùng.
- Outbox và `processed_events` dùng chung cách làm của identity; quy ước tên sự kiện và DTO trong một module hợp đồng sự kiện.
- Khung test tích hợp Testcontainers PostgreSQL cho mọi service, chạy được V1 + V2. Test phải commit thật: sổ tiền và phân bổ được constraint trigger kiểm lúc commit (P-04).
- `common-reference` (enum `Province`, đã có): chạy `./mvnw -pl common-reference verify` và `spotless:apply` lần đầu.

**Xong khi:** một service mẫu dùng `common-web` và test tích hợp chạy migration thành công.

### 1. Khớp schema

| Service | Việc |
| --- | --- |
| identity | `avatar_url` → `avatar_key`; bỏ `ward_code` khỏi `Address`, DTO, validation, test; kiểm `provinceCode` bằng `Province.isKnown` |
| vendor | `business_name`, `province_code`, `bank_account_number_enc` + `bank_account_masked` (khóa mã hóa riêng của vendor, P-09); giữ hàng theo `checkout_id`; enum loại hình còn `HOUSEHOLD_BUSINESS`, `SOLE_PROPRIETORSHIP`; entity mới cho giấy tờ, kết quả so chủ, lịch sử duyệt, cấu hình phí |
| catalog | Bỏ entity `Product`, `ProductPriceTier`; thêm entity đọc `ProductView`, `ProductListing` (view, `@Immutable`), `ProductReview`, `VendorSnapshot`, `Province`, `InterprovinceFee` |
| quotation | `TenderRequest` → `QuoteRequest`, `TenderInvitation` → `RequestInvitation`; `Quote` thêm phiên bản và số tiền tính sẵn; entity mới `QuoteItem`, `QuoteAcceptance` |
| order | Đổi tên cột theo V2; entity mới `Checkout` (thêm `EXPIRED`, `REFUND_REQUESTED`), `CheckoutGroup` (có `orderId`), `CheckoutLine`; `payoutLockedAt`; bỏ trả lời đánh giá |
| payment | `Payment` theo `purpose` + `referenceId`, thêm `DUPLICATE`; entity mới `PaymentAllocation`, `Refund` (có `reason`), `Payout`, `LedgerEntry`, `OrderSnapshot` |

**Xong khi:** `docker compose up` với DB mới và DB dev cũ đều lên đủ 7 service; seed chạy không lỗi.

### 2. Chuyển ghi sản phẩm sang vendor (L-18)

- Chuyển CRUD sản phẩm, upload ảnh (common-storage), bậc giá từ catalog sang vendor, dưới `/api/vendors/{vendorId}/products`.
- Vendor kiểm khi ghi: Shop đã duyệt, đã đóng phí, có bật Shop; hàng bán lại có thương hiệu (BR-12, BR-21, BR-31).
- Vendor phát `product.upserted` qua outbox; catalog dựng `product_views`, bỏ qua sự kiện cũ theo `source_version`.
- Giữ hàng (`stock_reservations`) đặt ở vendor, kèm tác vụ trả hàng quá hạn.

**Xong khi:** Shop đăng sản phẩm qua vendor và thấy nó ở `GET /api/products` của catalog sau vài giây; catalog không còn endpoint ghi.

### 3. Đường dẫn theo aggregate root (L-17, D-24)

- Gateway định tuyến theo tên root (bảng ở mục 1 của tài liệu phác thảo), tắt `discovery.locator`.
- Controller đổi theo bảng API từng service: bỏ `/api/seller`, `/api/admin`; thao tác thành `PATCH status` hoặc tài nguyên con.
- Web: `web/src/api/endpoints.ts` bỏ tiền tố `/identity-service/api`.
- App: `ApiEndpoints.identityService` và đường dẫn NFC `/api/accounts/me/nfc-sessions/{id}/card` (`PUT`).

**Xong khi:** Swagger tại gateway chỉ còn đường dẫn mới; web đăng nhập và xác minh NFC chạy hết với app.

### 4. Luồng nghiệp vụ, theo thứ tự phụ thuộc

1. Khai và duyệt người bán, đóng phí đăng ký (FR-26, FR-27, FR-45, FR-53, BR-33).
2. Mua ngay: giỏ, checkout, giữ hàng, IPN, mỗi Shop một đơn, IPN đến trễ và thanh toán trùng (FR-08, FR-09, BR-28, BR-29, P-01, P-03).
3. Báo giá và đặt cọc: yêu cầu, báo giá có dòng hàng, bản chép ràng buộc, đơn từ bản chép (FR-15 → FR-19, L-10).
4. Sau đơn: maket, tiến độ, phần còn lại, khiếu nại, giải ngân, chuyển tiền qua `payout-lock`, đối soát (FR-20 → FR-22, FR-41 → FR-51, P-02).

**Xong khi:** từng luồng chạy được trên kịch bản demo của Context mục 7.

### 5. Tài liệu

- Software Design: sửa D-18 theo L-17, mục 4.3 và 4.4 theo L-18, D-14 (giữ hàng ở vendor), D-24 đóng, A-18 đóng (P-07).
- `docs/services/*/README.md` cho vendor, catalog; Postman `docs/api/` theo đường dẫn mới.
- README gốc: bỏ "xóa sản phẩm", "mùa bán hàng", "hoa hồng".

## Rủi ro và điểm cần biết

- Sau khi merge V2, catalog mất toàn bộ sản phẩm dev cũ; dữ liệu mẫu phải tạo lại qua vendor.
- Bản đọc ở catalog trễ vài giây; màn quản lý của Shop dùng kết quả trả về của lệnh ghi, không đọc lại catalog ngay.
- Danh sách tỉnh có ở hai nơi (enum `Province` và `R__provinces.sql`); test của `common-reference` giữ hai bản khớp nhau.
- Số tài khoản ngân hàng trên DB dev cũ chỉ còn bản che; seed không có số thật để thử chuyển tiền.
- Số định danh người đại diện của hồ sơ cũ đang trống; hồ sơ nộp mới phải có.
- Phiên NFC và OTP ở bộ nhớ: khởi động lại identity là mất, identity chỉ chạy một bản (L-06).
- Đổi đường dẫn (giai đoạn 3) làm web và app hỏng cùng lúc; nên merge ba phía cùng ngày.

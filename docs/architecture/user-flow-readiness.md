# Backend đã đủ cho các luồng người dùng chưa

> **Trạng thái:** Đang làm (rà soát ngày 02/11/2026, trên `develop` `01a45fc`; F1 chạy lại ngày 04/11/2026). Thuộc giai đoạn 4 của [api-db-alignment-plan.md](api-db-alignment-plan.md#4-luồng-nghiệp-vụ-theo-thứ-tự-phụ-thuộc). Khi mọi luồng đã chạy thật thì chuyển vào `archive/`.

Danh sách luồng lấy từ sheet "User flows" của `web/docs/information-architecture.xlsx` (F1–F7, mã trang M/B/Q/V theo IA).

## Cách rà

- **Chạy thật:** chạy qua gateway trên docker-compose bằng tài khoản seed, VNPay sandbox, IPN được ký bằng secret trong `.env`.
- **Đọc code:** đối chiếu từng bước của luồng với endpoint, event và listener. Có endpoint chưa có nghĩa là luồng chạy được; chỉ cột "Chạy thật" là bằng chứng.

## Kết quả

| Luồng | Backend | Chạy thật | Ghi chú |
| --- | --- | --- | --- |
| F1 Mua hàng có sẵn | Đủ | Có, 02/11/2026; chạy lại 04/11/2026 | Vendor đăng sản phẩm → listing/chi tiết → giỏ → checkout → IPN → PAID → giao → nhận → đánh giá hiện ở catalog. Lần chạy lại trên image build từ `develop` `cad5df1`: 25/25 bước qua, kể cả IPN gửi lặp trả `02` |
| F2 Yêu cầu báo giá có in logo | **Đứt ở bước đặt cọc** | Chưa | Xem [Lỗ hổng 1](#1-cọc-đã-trả-nhưng-không-có-đơn-đặt-riêng) |
| F3 Gửi yêu cầu cho một đơn vị | **Đứt ở bước đặt cọc** | Chưa | Nối vào F2 từ M6.2 nên đứt cùng chỗ |
| F4 Trở thành người bán | Đủ | Chưa | Nộp hồ sơ (`POST /api/vendors`, giấy tờ), admin quyết định (`POST /api/vendors/{id}/reviews`: duyệt, yêu cầu bổ sung, từ chối), nộp lại, phí đăng ký qua VNPay (vendor-service nghe `payment.succeeded`) |
| F5 Khiếu nại | Đủ | Chưa | Mở khiếu nại (`/api/orders/{id}/dispute`), payment-service giữ tiền khi nhận `dispute.opened`, admin xử lý, hoàn VNPay (`VnpayRefundClient`); lỗi hoàn thì chuyển xử lý tay (`refund.manual_required`) |
| F6 Xác minh NFC | Đủ phía server | Chưa | identity-service có phiên (`/api/nfc/sessions`), nhận thẻ, khóa sau nhiều lần sai. V1–V5 cần app mobile và thẻ thật hoặc dữ liệu `NfcProfileSeeder` |
| F7 Quản lý sản phẩm | Đủ | Một phần | Đăng sản phẩm đã chạy trong F1. Sửa, ẩn/hiện, admin gỡ (`ProductServiceImpl` của vendor-service) chưa chạy thật |

Không còn endpoint nào trả `NOT_IMPLEMENTED` (mã `COMMON_501` của vendor-service không còn được dùng).

## Lỗ hổng

### 1. Cọc đã trả nhưng không có đơn đặt riêng

Chặn F2 và F3 từ bước thanh toán cọc (M6.2.2 → M4.2) trở đi: không có đơn đặt riêng, nên không có maket, tiến độ hay thanh toán phần còn lại (M6.1.2).

Chuỗi đúng theo [L-10](api-db/decisions.md) và [integration.md](api-db/integration.md):

1. Người mua chấp nhận báo giá. quotation-service tạo `QuoteAcceptance` PENDING và gọi payment-service tạo thanh toán purpose `DEPOSIT`, `referenceId` = acceptanceId (`CreatePaymentRequest.deposit`).
2. VNPay gọi IPN. payment-service phát `payment.succeeded` có `purpose`, `referenceId`.
3. **quotation-service ghi nhận cọc** (`QuoteAcceptanceService.recordDepositPaid`), chốt bản chép và phát `quote.accepted`.
4. order-service nghe `quote.accepted` (`QuoteAcceptedListener`) và tạo đơn đặt riêng.

Bước 3 không xảy ra:

- `recordDepositPaid` (`api/quotation-service/.../service/impl/QuoteAcceptanceServiceImpl.java`) chỉ được gọi trong test.
- quotation-service không có `@RabbitListener` nào.
- order-service cố ý bỏ qua purpose DEPOSIT (comment đầu `PaymentEventListener`: "A deposit reaches order-service as quote.accepted, after quotation-service took it").
- vendor-service chỉ nhận purpose của phí đăng ký.

Hậu quả: tiền cọc vào, acceptance đứng PENDING mãi, người mua không thấy đơn.

**Cách sửa đề xuất:**

- Thêm listener `payment.succeeded` trong quotation-service. Chỉ nhận purpose `DEPOSIT` và gọi `recordDepositPaid(referenceId, paidAt)`.
- Chống xử lý lặp theo eventId (`processed_events`), như `PaymentSucceededListener` của vendor-service. `recordDepositPaid` đã idempotent theo trạng thái SUCCEEDED, và đã hoàn cọc đến trễ.
- Cần queue và binding riêng trong `RabbitConfig` của quotation-service.
- Xử lý `payment.failed` và acceptance hết hạn thanh toán (`depositPaymentTimeout`): hiện cũng không có ai đưa acceptance PENDING về trạng thái kết thúc.
- Kiểm bằng cách chạy thật F2 tới khi đơn đặt riêng xuất hiện ở M6.1.2.

### 2. Lỗi nhỏ gặp khi chạy F1

| Lỗi | Ảnh hưởng | Ghi chú |
| --- | --- | --- |
| Danh sách đơn của người mua trả `items: []` | Trang danh sách đơn không hiện dòng hàng; chi tiết đơn vẫn đúng | **Đã sửa 04/11/2026.** `OrderServiceImpl.list` cố ý truyền danh sách rỗng; nay nạp dòng hàng của cả trang bằng một truy vấn (`OrderItemRepository.findByOrderIdIn`) |
| `GET /api/carts/me` thiếu `provinceCode` trả 500 | Web luôn gửi tham số nên chưa gặp; client khác sẽ nhận lỗi sai mã | **Đã sửa 04/11/2026.** `GlobalExceptionHandler` của order-service trả 400 `COMMON_400_PARAM`, nêu tên tham số thiếu |
| `docker compose up --build` hỏng | Không build lại được image backend nào | **Đã sửa 04/11/2026.** Module `common-observability` (thêm ở #91) chưa được `COPY` trong Dockerfile của các service |

### 3. F1 trên web nối API thật (04/11/2026)

Chạy cả luồng bằng trình duyệt trên `localhost:5173`, không bật chế độ demo. Kết quả: 31/31 bước qua. Thanh toán dừng ở trang VNPay sandbox (lỗi 71, xem dưới), nên IPN được gửi giả có chữ ký đúng.

| Lỗi trên web | Đã sửa |
| --- | --- |
| Form sản phẩm (modal B4.0 và trang B4.1) thiếu thương hiệu, hạn dùng, nhãn giao, nguồn hàng, ảnh; backend trả 400 | Một form B4.1 duy nhất đủ trường theo `ProductDetails`; B4.0 mở form đó. Danh sách tải lại sau khi lưu |
| Chọn tỉnh giao ở header không đổi giá, giỏ, catalog | Header đọc và ghi `entities/region` |
| Thanh toán đi qua trang VNPay giả lập `/gateway/vnpay`, ghi đơn PAID giả vào store | Bỏ trang giả lập; web mở `paymentUrl` của máy chủ. Đơn giả chỉ còn ở chế độ demo |
| Trang thanh toán điền sẵn địa chỉ, tỉnh, thông tin hóa đơn mẫu | Lấy tỉnh giao hiện tại và địa chỉ đã lưu; hóa đơn để trống |
| SĐT hiện 9 số; `vendorId`, trạng thái NFC rỗng sau đăng nhập | Thêm số 0 đầu; đăng nhập đọc gian hàng và NFC |
| Chi tiết sản phẩm: nhãn giao luôn "toàn quốc", vỏ bánh sai tên | Đọc `LOCAL`/`NATIONWIDE`, tên vỏ từ danh mục |
| Đơn của Shop không có nút chuyển bước, nhãn PAID là "Hoàn tất", tỉnh hiện mã | Nút "Xử lý đơn" mở B2.1 chuyển đúng bước kế (kèm mã vận đơn khi liên tỉnh); nhãn và tên tỉnh đúng |
| Người mua không có chỗ viết đánh giá | Form đánh giá ở tab Đánh giá khi đơn đã giao |

Còn lại:

- VNPay sandbox trả lỗi 71 "Website này chưa được phê duyệt": cấu hình merchant (`VNPAY_TMN_CODE`, URL trả về đăng ký với VNPay), không sửa bằng code. IPN thật cũng không tới được `localhost`, cần tunnel khi thử với VNPay.
- Chi tiết sản phẩm không hiện khu vực của tiệm: listing của catalog không có tỉnh của Shop, còn `GET /api/vendors/{id}` chỉ cho chủ Shop và admin. Cần thêm tỉnh vào projection của catalog.

## Việc tiếp theo

1. Sửa lỗ hổng 1, chạy thật F2 rồi F3.
2. Chạy thật F4, F5, F7 qua gateway như F1; F6 khi có app mobile.
3. Cập nhật bảng kết quả sau mỗi lần chạy.

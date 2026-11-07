# Backend đã đủ cho các luồng người dùng chưa

> **Trạng thái:** Đang làm (rà soát ngày 02/11/2026, trên `develop` `01a45fc`; F1 chạy lại ngày 04/11/2026; F2 chạy thật ngày 07/11/2026). Thuộc giai đoạn 4 của [api-db-alignment-plan.md](api-db-alignment-plan.md#4-luồng-nghiệp-vụ-theo-thứ-tự-phụ-thuộc). Khi mọi luồng đã chạy thật thì chuyển vào `archive/`.

Danh sách luồng lấy từ sheet "User flows" của `web/docs/information-architecture.xlsx` (F1–F7, mã trang M/B/Q/V theo IA).

## Cách rà

- **Chạy thật:** chạy qua gateway trên docker-compose bằng tài khoản seed, VNPay sandbox, IPN được ký bằng secret trong `.env`.
- **Đọc code:** đối chiếu từng bước của luồng với endpoint, event và listener. Có endpoint chưa có nghĩa là luồng chạy được; chỉ cột "Chạy thật" là bằng chứng.

## Kết quả

| Luồng | Backend | Chạy thật | Ghi chú |
| --- | --- | --- | --- |
| F1 Mua hàng có sẵn | Đủ | Có, 02/11/2026; chạy lại 04/11/2026 | Vendor đăng sản phẩm → listing/chi tiết → giỏ → checkout → IPN → PAID → giao → nhận → đánh giá hiện ở catalog. Lần chạy lại trên image build từ `develop` `cad5df1`: 25/25 bước qua, kể cả IPN gửi lặp trả `02` |
| F2 Yêu cầu báo giá có in logo | Đủ | Có, 07/11/2026 | Yêu cầu mở → 2 báo giá → chấp nhận → cọc → đơn đặt riêng → maket → duyệt → sản xuất → giao → trả phần còn lại → COMPLETED. Xem [mục 4](#4-f2-trên-web-07112026) |
| F3 Gửi yêu cầu cho một đơn vị | Đủ | Có tới bước cọc, 07/11/2026 | Danh sách đơn vị → yêu cầu riêng (DIRECT) → Shop báo giá → chấp nhận → cọc → đơn đặt riêng. Từ đơn trở đi đi chung đường với F2 (đã chạy trọn cùng ngày). Xem [mục 5](#5-f3-trên-web-07112026) |
| F4 Trở thành người bán | Đủ | Chưa | Nộp hồ sơ (`POST /api/vendors`, giấy tờ), admin quyết định (`POST /api/vendors/{id}/reviews`: duyệt, yêu cầu bổ sung, từ chối), nộp lại, phí đăng ký qua VNPay (vendor-service nghe `payment.succeeded`) |
| F5 Khiếu nại | Đủ | Chưa | Mở khiếu nại (`/api/orders/{id}/dispute`), payment-service giữ tiền khi nhận `dispute.opened`, admin xử lý, hoàn VNPay (`VnpayRefundClient`); lỗi hoàn thì chuyển xử lý tay (`refund.manual_required`) |
| F6 Xác minh NFC | Đủ phía server | Chưa | identity-service có phiên (`/api/nfc/sessions`), nhận thẻ, khóa sau nhiều lần sai. V1–V5 cần app mobile và thẻ thật hoặc dữ liệu `NfcProfileSeeder` |
| F7 Quản lý sản phẩm | Đủ | Một phần | Đăng sản phẩm đã chạy trong F1. Sửa, ẩn/hiện, admin gỡ (`ProductServiceImpl` của vendor-service) chưa chạy thật |

Không còn endpoint nào trả `NOT_IMPLEMENTED` (mã `COMMON_501` của vendor-service không còn được dùng).

## Lỗ hổng

### 1. Cọc đã trả nhưng không có đơn đặt riêng

**Đã sửa.** quotation-service có `PaymentEventListener` nghe `payment.succeeded` purpose `DEPOSIT` và gọi `recordDepositPaid`; lần chạy F2 ngày 07/11/2026 tạo được đơn đặt riêng sau khi cọc. Phần dưới giữ lại để biết lỗ hổng từng là gì.

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

### 4. F2 trên web (07/11/2026)

Chạy cả luồng bằng trình duyệt trên `localhost:5173`: người mua member1, Shop Trăng Vàng (member4), đơn `#564F4DE0`. Hai lần thanh toán (cọc, phần còn lại) dùng return đã ký giả lập vì IPN không tới được `localhost`. Mã VNPay `3W9JVN8B` mở được trang chọn phương thức, không còn lỗi 71; chưa trả thử bằng thẻ test.

Backend chặn đúng: không vào sản xuất khi maket chưa duyệt (`ORDER_003`), phần còn lại chỉ trả được khi đơn đã giao, đơn chỉ hoàn tất khi phần còn lại đã về.

| Lỗi trên web | Đã sửa |
| --- | --- |
| Shop chuyển đơn sang "Chờ duyệt maket" mà không có maket; chỗ gửi maket chỉ ở trang danh sách | Trang B2.1 có khối maket và nút gửi; đơn sang chờ duyệt khi maket được gửi. Backend từ chối PATCH sang `AWAITING_MOCKUP_APPROVAL` (409 `ORDER_010`) |
| Nút "Thanh toán phần còn lại" hiện từ lúc mới cọc; "Đã nhận hàng" hiện trước khi trả đủ | Chỉ hiện khi đơn đã giao; với đơn đặt riêng, nút trả phần còn lại thay cho "Đã nhận hàng" |
| Lịch trình hiện mã `AWAITING_MOCKUP_APPROVAL` | Mốc tiến độ được đổi sang trạng thái UI trước khi hiện nhãn |
| Duyệt maket xong nút vẫn còn; "Việc cần bạn xử lý" vẫn báo maket chờ duyệt | Duyệt xong thì đọc lại maket; ô việc cần làm đếm maket mới nhất còn chờ duyệt |
| Trang kết quả cọc và phần còn lại dùng câu chữ đơn mua lẻ | Câu chữ theo mục đích thanh toán (mua lẻ, cọc, phần còn lại) |
| Tên mặt hàng của đơn đặt riêng chứa UUID yêu cầu; trang yêu cầu hiện UUID, mã tỉnh, ngày ISO, sao "0" | Mã ngắn 8 ký tự, tên tỉnh, ngày dd/mm/yyyy; ẩn sao khi chưa có đánh giá |
| Thẻ báo giá không tách phí giao; không hỏi hóa đơn khi cọc | Thẻ có tiền hàng, phí giao; form hóa đơn GTGT trước khi chấp nhận |
| Vỏ/nhân gõ tự do; Shop thấy "Chưa nêu"; loại tùy chỉnh không hiện | Chọn từ danh mục vỏ & nhân; Shop thấy loại tùy chỉnh |
| Shop vẫn thấy "Soạn báo giá ngay" sau khi báo giá; "Doanh nghiệp: <tên người>" | Danh sách nạp báo giá của chính Shop; nhãn "Người đặt" |
| B2.1 không hiện cọc và phần còn lại; lúc đã giao không nhắc phần còn lại | Hiện cả hai; lúc đã giao ghi số tiền khách còn phải trả |
| Tổng quan Shop: "Yêu cầu sỉ & in logo: 0", khối gấp liệt kê đơn hoàn tất, trạng thái thô, UUID | Đếm yêu cầu gửi tới Shop; khối gấp chỉ liệt kê đơn Shop cần xử lý, nhãn và mã ngắn |
| Người mua mở được trang Kênh người bán | Guard `RequireShop` đưa tài khoản chưa có Shop sang trang mở Shop |

Đơn `#564F4DE0` tạo trước bản sửa nên tên mặt hàng vẫn chứa UUID; đơn mới không còn.

Chạy lại sau bản sửa (đơn `#475F5BE4`, yêu cầu `#712FF77F`): cả luồng tới COMPLETED; các lỗi trên không còn. Lần này sửa thêm:

| Lỗi trên web | Đã sửa |
| --- | --- |
| Trang kết quả hiện "Thanh toán thành công 0đ" khi return không khớp giao dịch nào | Báo "Chưa tìm thấy giao dịch này", không hiện thành công khi máy chủ chưa xác nhận |
| Sidebar Kênh người bán cuộn theo trang | Sidebar cao bằng khung nhìn, ghim dưới header |
| Thẻ báo giá kéo hết khổ, nút chấp nhận nằm dưới màn hình; hộp thoại báo giá phải cuộn | Thẻ một cột, gọn hơn; form báo giá xếp hai ô một hàng |
| Ảnh maket to hết khổ, nút duyệt ở cuối trang; yêu cầu sửa dùng `window.prompt` | Ảnh cạnh nút (giới hạn cao, bấm để xem lớn); góp ý sửa nhập ngay trong bảng |
| Ô "Ghi chú cho khách" khi gửi maket không được gửi lên máy chủ | Bỏ ô; nhắc Shop dùng tin nhắn |
| Form yêu cầu báo giá mặc định Hà Nội dù header chọn TP HCM | Mặc định theo tỉnh giao ở header |
| Tổng quan Shop hiện "0 đơn" khi API đơn lỗi | Hiện lỗi và nút thử lại; số liệu "—" khi chưa tải |
| Shop không thấy thông tin hóa đơn GTGT khách yêu cầu | B2.1 hiện tên công ty, MST, email |
| Người mua không được nhắc trả phần còn lại | "Việc cần bạn xử lý" báo đơn đặt riêng đã giao chờ trả phần còn lại |

| Header lệch chiều cao thật (token 72px, thanh trên cùng làm header cao 114px): sidebar và các khối dính bị che phần đầu | Header đo chiều cao thật và ghi vào `--header-h` |
| Hàng demo "Đang đăng nhập" trên header; lối vào Kênh người bán nằm sâu trong menu tài khoản | Bỏ hàng demo; thanh trên cùng có "Kênh người bán của Shop bạn" hoặc "Đăng ký bán hàng trên Moonkage", hiện cả trên di động |
| Shop không xem lại ảnh maket đã gửi; không thấy yêu cầu chi tiết của khách trên B2.1 | Ảnh thu nhỏ bấm để xem lớn; khối "Khách yêu cầu" tìm yêu cầu gốc qua `quoteId` của đơn |
| Chọn vỏ/nhân rồi không bỏ chọn được | Thêm lựa chọn "Không yêu cầu riêng" |
| Lịch trình người mua chỉ hiện các bước đã qua | Hiện cả các bước sắp tới, mờ hơn |
| Trang báo giá của người mua không hiện lại thông số đã yêu cầu | Khối thu gọn "Xem lại thông số bạn đã yêu cầu" |
| Kết quả cọc không có nút tới đơn mới; "Tiếp tục mua sắm" ở đơn đặt riêng | Nút "Xem đơn hàng"; "Tiếp tục mua sắm" chỉ ở đơn mua lẻ |
| Kênh người bán dùng header của người mua (tìm bánh, menu mua, tỉnh giao, giỏ hàng) | Header riêng: logo "Kênh người bán", lối "Về kênh mua sắm"; lối vào Kênh người bán chỉ hiện ở kênh mua sắm |
| "Việc cần bạn xử lý": maket chờ duyệt dẫn về danh sách đơn | Một đơn thì mở thẳng tab maket của đơn đó (`?tab=maket`) |

### 5. F3 trên web (07/11/2026)

Người mua member1 gửi yêu cầu riêng `#473671EB` (120 hộp, túi giấy và thiệp) cho Trăng Vàng (member4). Shop báo giá 175.000đ/hộp, cọc 30%. Người mua chấp nhận và cọc 6.300.000đ (return đã ký giả lập), rồi đơn `#0C0EF411` được tạo ở trạng thái "Đã đặt cọc". Các bước sau đó giống F2 nên không chạy lại.

| Lỗi trên web | Đã sửa |
| --- | --- |
| Danh sách đơn vị và trang chủ không có Shop nào: danh mục đơn vị gọi API không kèm tỉnh, nên rơi về mã mặc định `01` trong khi Shop demo giao ở `79` | Danh mục đơn vị lấy theo tỉnh "Giao tới" ở header, như danh mục sản phẩm; tỉnh không có Shop thì danh sách rỗng, không giữ Shop của tỉnh trước |
| Thẻ đơn vị: nhãn góc và nút "Gửi yêu cầu riêng" bị cắt chữ | Nhãn được xuống dòng; hai nút xếp chồng khi thẻ hẹp |
| Form yêu cầu riêng khác form F2: bong bóng kiểm tra của trình duyệt, lỗi bằng toast, thiếu ngân sách, vỏ, nhân; cho chọn cả loại tùy chỉnh Shop không làm (server trả `CUSTOM_NOT_SUPPORTED`); hứa "phản hồi trong 24h"; tỉnh dự phòng cứng "Hà Nội"; tiêu đề "Cho undefined" khi Shop chưa tải | Trang dựng lại từ đúng các thẻ của F2, chung luật kiểm tra (`validateQuoteForm`). Mức tối thiểu và loại tùy chỉnh lấy từ Shop. Shop đọc riêng qua `GET /api/suppliers/{id}`, có trạng thái đang tải và không nhận đặt hàng |
| Bấm gửi khi form còn lỗi thì không thấy gì: lỗi nằm phía trên nút | Cả form F2 và F3 cuộn tới và đặt con trỏ vào ô lỗi đầu tiên |
| Ô tùy chỉnh đã chọn: chữ trắng trên vàng sáng, không đọc được ở giao diện tối | Nền `gold-soft`, chữ `gold-text`; sửa luôn chip phân loại sản phẩm và chip tỉnh giao của Shop |
| Trang yêu cầu riêng của người mua ghi "So sánh báo giá", "Chưa có xưởng nào…"; danh sách ghi "1 xưởng được mời", "So sánh 0 bảng báo giá", số 0 tô đỏ | Ghi "Yêu cầu riêng gửi <Shop>", "Đang chờ <Shop> gửi báo giá"; nút theo số báo giá (xem yêu cầu, xem báo giá, so sánh N báo giá) |
| Kênh người bán mở tab "Yêu cầu mở toàn sàn", nên yêu cầu riêng mới bị giấu; "Cơ hội doanh số" cộng cả yêu cầu đã chốt; yêu cầu riêng ghi "Đã có 0 xưởng gửi báo giá" | Mở tab "Tất cả", mỗi tab đếm số yêu cầu đang mở, yêu cầu còn mở xếp trước; cơ hội chỉ tính yêu cầu còn mở; yêu cầu riêng ghi "Khách chỉ gửi yêu cầu này cho Shop bạn" |

Lần rà thứ hai (cùng ngày) sửa thêm:

| Lỗi trên web | Đã sửa |
| --- | --- |
| Hồ sơ đơn vị: banner trống cao khoảng 330px; "MST:" trống; vùng giao "79"; quy cách "BAG CARD STICKER"; tiêu đề lộ "(US-35)"; mục "Bậc giá tham khảo" rỗng; mở link trực tiếp thì chớp "Không tìm thấy" | Không có ảnh thì bỏ banner; dòng pháp lý chỉ hiện khi có dữ liệu; tên tỉnh và nhãn tùy chỉnh tiếng Việt; bậc giá trống thì nói rõ là chưa công bố; Shop đọc qua `useSupplier` có trạng thái đang tải. `check-no-spec-ids` bắt thêm mã `US-xx` |
| Báo giá đã chấp nhận và đã cọc lại ghi "Báo giá không còn hiệu lực", không có lối sang đơn | "Bạn đã chấp nhận báo giá này" kèm "Xem đơn hàng" (tìm đơn theo `quoteId`), hoặc "Hoàn tất đặt cọc" khi chưa có đơn; báo giá rút, hết hạn, không được chọn có câu riêng |
| "Từ chối lời mời" gửi lý do viết sẵn thay Shop | Hộp thoại cho Shop chọn lý do hoặc tự ghi; không ghi thì không gửi |
| Shop từ chối yêu cầu riêng nhưng người mua vẫn thấy "Đang chờ … gửi báo giá" | Trang yêu cầu đọc lời mời, hiện "… đã từ chối" kèm lý do, và hai lối: gửi cho đơn vị khác, tạo yêu cầu gửi nhiều xưởng |

Còn mở:

- Danh sách yêu cầu của người mua vẫn ghi "Chờ đơn vị báo giá" cho yêu cầu riêng đã bị từ chối, vì `QuoteRequestResponse` không có trạng thái lời mời. Cần thêm trường ở quotation-service.
- Chưa xem được giao diện ở màn hình điện thoại trên Chrome, vì cửa sổ không thu nhỏ được; mới rà các media query trong code.
- **Không có thông báo trong ứng dụng.** Không service nào publish lên `orchestrator.inapp.#`, nên trung tâm thông báo luôn trống, kể cả với các sự kiện của F2. Cần phát sự kiện từ quotation-service và order-service.
- Trang `/thong-bao` mở được khi chưa đăng nhập và báo "Không có thông báo nào".
- Backend không kiểm tra Shop có giao tới tỉnh của yêu cầu DIRECT hay không, trong khi yêu cầu mở có lọc theo tỉnh.

## Việc tiếp theo

1. Phát thông báo trong ứng dụng cho báo giá, cọc, maket và đơn; trả thử phần còn lại bằng thẻ test VNPay.
2. Chạy thật F4, F5, F7 qua gateway như F1; F6 khi có app mobile.
3. Cập nhật bảng kết quả sau mỗi lần chạy.

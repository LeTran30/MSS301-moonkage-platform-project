# Moonkage – Đặc tả dữ liệu và nội dung cho Mid-fi Wireframe

- **Phiên bản:** 0.2 · 24/10/2026
- **Phạm vi:**
  - **Phần A – Toàn bộ Form & Bước thao tác khu Mua hàng (M):** M5.1–M5.5 (Tài khoản), M1.1 (Chọn khu vực), M6.3.1–M6.3.2 (Địa chỉ), M3.1 (Tạo yêu cầu báo giá), M3.4 (Gửi yêu cầu cho đơn vị), M6.2.2 (Chấp nhận báo giá và đặt cọc), M4.1 & M4.3 (Thanh toán & Kết quả), M6.1.1 (Xác nhận nhận hàng & Đánh giá), M6.1.2 (Gửi logo & Duyệt maket, Thanh toán phần còn lại), M6.1.3 (Khiếu nại của đơn), M7.1 (Khai hồ sơ người bán).
  - **Phần B – Cụm màn hình Sản phẩm & Danh mục (M, B, Q):** M2.0 (Mua hàng có sẵn), M2.1 & M4.0 (Chi tiết sản phẩm & Tương tác số lượng giỏ hàng), B4.0 (Danh sách sản phẩm Shop), B4.1 (Thêm / sửa sản phẩm), Q3.0 (Quản trị gỡ sản phẩm), Q6.4 (Quản trị danh mục Vỏ và nhân bánh).
- **Nguồn đối chiếu:** IA Moonkage (23/10/2026), [Requirement v1.8](requirements.md), [API & DB Outline](../architecture/api-db/README.md), [Seed & Sổ ID](../guides/database.md), validation trong `identity-service`, `catalog-service`, `vendor-service`, `quotation-service`, `order-service` và `web/src/strings.ts`.

---

## 0. Quy ước chung

| Mục | Quy ước |
|---|---|
| Tiền | VND, số nguyên không có số lẻ, dấu chấm phân cách hàng nghìn, hậu tố `đ`: `245.000đ`. Mọi giá hiển thị đã gồm thuế GTGT (NFR-06, BR-06) |
| Ngày giờ | Ngày `DD/MM/YYYY`, giờ `HH:mm`, múi giờ Việt Nam (`UTC+7`, `timestamptz`) |
| Số điện thoại | Di động Việt Nam 10 chữ số, đầu số `03/05/07/08/09` (`^(\+?84\|0)[35789]\d{8}$`); chấp nhận `0901000001`, `84901000001`, `+84901000001`. Hiển thị `0901 000 001` |
| Địa chỉ & Vùng giao | Hai cấp hành chính: **Tỉnh/thành phố** (34 đơn vị theo Quyết định 19/2025/QĐ-TTg, mã 2 chữ số trong `R__provinces.sql`, ví dụ `79` = TP. Hồ Chí Minh, `01` = TP. Hà Nội) và **Phường/xã** (văn bản hiển thị, không còn quận/huyện – L-15) |
| File tải lên | JPG, PNG, PDF; file logo nhận thêm SVG, AI. Tối đa `20 MB/file` theo NFR-08 *(lưu ý: `catalog-service` đang để mặc định `PRODUCT_IMAGE_MAX_SIZE: 5MB`, xem mục 19)* |
| Đánh dấu trường | Trường bắt buộc có dấu `*` đỏ sau nhãn. Trường tùy chọn ghi thêm `(không bắt buộc)` sau nhãn |
| Thời điểm kiểm lỗi | Khi rời ô (`on blur`) và khi bấm nút gửi (`on submit`). Lỗi hiện ngay dưới trường; khi bấm nút mà còn lỗi thì cuộn tới trường lỗi đầu tiên |
| Giọng văn | Xưng hô với người dùng là **bạn**, gọi nền tảng là **Moonkage**, không dùng dấu chấm than (`!`) theo quy ước ở `web/src/strings.ts`. Nhãn nút bắt đầu bằng động từ rõ hành động |
| Biến & Đề xuất | `{tên_biến}` là dữ liệu động. Giá trị có chú thích *(đề xuất)* là ràng buộc UX đề xuất thêm, cần nhóm xác nhận ở mục 19 |

### 0.1 Bộ dữ liệu mẫu chuẩn (khớp `R__seed.sql` & `nfc-profiles.json`)

Dùng thống nhất các nhân vật và con số dưới đây trên toàn bộ khung vẽ Mid-fi để khớp với dữ liệu chạy demo trong Docker:

| Đối tượng | Dữ liệu thực tế trong Seed / Đặc tả |
|---|---|
| **Người mua 1 (Đã xác nhận, đã NFC)** | **Nguyễn Thị Lan** · `member1@mk.com` · `0901 000 001` · Họ tên CCCD: `NGUYEN THI LAN` · Số CCCD đã che: `********0001` (số gốc trên app: `079190000001`, ngày sinh `15/03/1990`) |
| Địa chỉ 1 của chị Lan (Mặc định) | `Nhà riêng` · Nguyễn Thị Lan · `0901 000 001` · `12 Lê Lợi, Phường Sài Gòn, Thành phố Hồ Chí Minh` (mã tỉnh `79`) |
| Địa chỉ 2 của chị Lan | `Văn phòng` · Nguyễn Văn Hùng · `0901 000 011` · `25 Điện Biên Phủ, Phường Ba Đình, Thành phố Hà Nội` (mã tỉnh `01`) |
| **Người mua 2 (Đã xác nhận, chưa NFC)** | **Trần Văn Minh** · `member2@mk.com` · `0901 000 002` · Địa chỉ mặc định: `8 Hoàng Diệu, Phường Ba Đình, Thành phố Hà Nội` (mã tỉnh `01`) |
| **Người mua 3 (Chưa xác nhận email)** | **Lê Thị Hoa** · `member3@mk.com` · `0901 000 003` |
| **Người bán 1 (Đã duyệt, đã đóng phí)** | **Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng** · Loại hình: `Doanh nghiệp tư nhân` · MST: `0312345678` · Trụ sở: `123 Nguyễn Trãi, Thành phố Hồ Chí Minh` (mã `79`) · Chủ DNTN: `Phạm Văn Bánh` (`PHAM VAN BANH`, `member4@mk.com`, CCCD `********0004`) · Nguồn hàng: `Cả hai` · Cách bán: `Mở Shop` + `Nhận đặt hàng` · Vùng giao: TP. Hồ Chí Minh (`79`), phí giao nội thành `30.000đ`/đơn · Ngân hàng: `Vietcombank` · Số TK đã che: `*********3456` · Chủ TK: `DNTN BANH TRUNG THU TRANG VANG` |
| **Người bán 2 (Đang chờ duyệt)** | **Hộ kinh doanh Bánh Quê** · Loại hình: `Hộ kinh doanh` · MST: `8012345678` · Trụ sở: `45 Trần Phú, Thành phố Hà Nội` (mã `01`) · Chủ hộ: `Võ Thị Quê` (`VO THI QUE`, `member5@mk.com`, CCCD `********0005`) · Nguồn hàng: `Tự sản xuất` · Cách bán: chỉ `Mở Shop` · Ngân hàng: `Agribank` · Số TK đã che: `*********3456` · Chủ TK: `VO THI QUE` |
| **Người bán 3 (Mẫu "Chỉ nhận đặt hàng")** | **Hộ kinh doanh Xưởng Bánh Cô Hoa** · Chỉ nhận đặt hàng (không mở Shop) · Số lượng tối thiểu: `50 hộp` · Thời gian chuẩn bị: `10 ngày` · In logo: `In logo lên túi`, `In logo lên thiệp` |
| **Sản phẩm mẫu 1 (Tự sản xuất)** | **Hộp quà Trăng Vàng Đoàn Viên – 4 bánh nướng 150g** · Shop: `Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng` · Thương hiệu: `Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng` · Vỏ: `Bánh nướng` · Nhân: `Thập cẩm`, `Hạt sen`, `Trứng muối` · Giá niêm yết: `320.000đ` · Bậc giá: từ `10 hộp` còn `300.000đ/hộp`, từ `30 hộp` còn `285.000đ/hộp` · Ngưỡng báo giá: `50 hộp` · Tồn kho: `85 hộp` · Hạn dùng: `15/11/2026` · Nhãn giao: `Giao toàn quốc` |
| **Sản phẩm mẫu 2 (Bán lại)** | **Bánh dẻo đậu xanh trứng muối Kinh Đô 180g (Hộp 2 bánh)** · Shop: `Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng` · Thương hiệu: `Kinh Đô` · Nơi sản xuất: `Công ty Cổ phần Mondelez Kinh Đô Việt Nam, KCN VSIP, Bình Dương` · Vỏ: `Bánh dẻo` · Nhân: `Đậu xanh`, `Trứng muối` · Giá niêm yết: `145.000đ` · Tồn kho: `40 hộp` · Hạn dùng: `05/11/2026` · Nhãn giao: `Giao nội thành` |
| **Phí giao hàng mẫu** | Nội thành TP.HCM (Shop Trăng Vàng): `30.000đ`/đơn · Liên tỉnh (bảng phí nền tảng `R__seed.sql`): `45.000đ`/đơn |
| **Thông tin xuất hóa đơn DN mẫu** | `Công ty TNHH Truyền Thông Sao Mai` · MST: `0314567890` · Địa chỉ: `12 Lê Lợi, Phường Sài Gòn, Thành phố Hồ Chí Minh` · Email: `ketoan@saomai.vn` |

---

# PHẦN A – CÁC TRANG FORM & BƯỚC THAO TÁC KHU MUA HÀNG (M)

## 1. M5.1 Đăng nhập · `/dang-nhap`

### 1.1 Bảng cấu trúc dữ liệu (Data Fields)

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Email | Text Input (`type="email"`, `autocomplete="username"`) | Bắt buộc | Email chuẩn RFC, tự cắt khoảng trắng đầu/cuối, tối đa 254 ký tự. *(Demo chỉ bật email theo A-17; backend `LoginRequest.username` nhận cả SĐT)* | `Ví dụ: member1@mk.com` |
| 2 | Mật khẩu | Password Input + nút `Hiện`/`Ẩn` | Bắt buộc | Chuỗi bất kỳ, không rỗng khi đăng nhập | `Nhập mật khẩu` |

### 1.2 Bộ nội dung văn bản (Microcopy)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **H1** | Đăng nhập |
| **Sub-heading (Mặc định)** | Quản lý giỏ hàng, đơn hàng và các yêu cầu báo giá của bạn. |
| **Sub-heading khi chuyển hướng từ thao tác cần tài khoản (AC-02.3)** | - Từ **Thêm vào giỏ**: "Đăng nhập để thêm **Hộp quà Trăng Vàng Đoàn Viên – 4 bánh nướng 150g** vào giỏ hàng."<br>- Từ **Gửi yêu cầu cho đơn vị**: "Đăng nhập để gửi yêu cầu cho **Hộ kinh doanh Xưởng Bánh Cô Hoa**. Nội dung bạn vừa nhập vẫn được giữ."<br>- Từ **Tạo yêu cầu báo giá**: "Đăng nhập để gửi yêu cầu báo giá. Nội dung bạn vừa nhập vẫn được giữ."<br>- Từ **Bán hàng trên Moonkage**: "Đăng nhập để bắt đầu khai hồ sơ người bán." |
| **Primary CTA** | `Đăng nhập` *(khi đang gửi: `Đang đăng nhập…`)* |
| **Secondary CTA** | `Quên mật khẩu?` *(liên kết cạnh nhãn Mật khẩu → M5.4)* · `Chưa có tài khoản? Đăng ký` *(→ M5.2)* |

### 1.3 Các trạng thái đặc biệt

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|
| **Lỗi trường** | Để trống Email / Mật khẩu | `Vui lòng nhập email` / `Mật khẩu không được để trống` |
| **Lỗi trường** | Email sai định dạng | `Email không đúng định dạng` |
| **Lỗi chung (Banner đỏ)** | Sai thông tin đăng nhập (AC-02, `error.auth.invalid_credentials`) | `Email hoặc mật khẩu không chính xác.` *(Không tiết lộ email đã tồn tại hay chưa)* |
| **Chặn (Banner vàng)** | Tài khoản chưa xác nhận OTP (`member3@mk.com`, AC-01.2) | `Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email và nhập mã xác nhận.` · Nút: `Nhập mã xác nhận` *(→ M5.3)* |
| **Lỗi hệ thống** | Mất kết nối / lỗi 5xx (`strings.ts`) | `Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.` / `Máy chủ đang gặp lỗi. Thử lại sau ít phút.` |
| **Thành công** | Đăng nhập thành công | Chuyển thẳng về trang trước (hoặc M1.0). Nếu đến từ thao tác **Thêm vào giỏ** (AC-02.3), hệ thống tự thêm sản phẩm với số lượng đã chọn và hiện Toast: `Đã thêm Hộp quà Trăng Vàng Đoàn Viên vào giỏ hàng.` |

---

## 2. M5.2 Đăng ký · `/dang-ky`

> [!NOTE] Theo AC-01.1, form đăng ký **chỉ gồm** Email (hoặc số điện thoại), Họ tên, Mật khẩu; **không** hỏi cá nhân hay doanh nghiệp và không thêm trường nhập lại mật khẩu.

### 2.1 Bảng cấu trúc dữ liệu (Data Fields)

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Họ và tên | Text Input (`autocomplete="name"`) | Bắt buộc | 1–100 ký tự (`ProfileConstant.MAX_FULL_NAME_LENGTH`), cho phép tiếng Việt có dấu | `Ví dụ: Nguyễn Thị Lan` |
| 2 | Email | Text Input (`type="email"`) | Bắt buộc | Email hợp lệ, duy nhất trên hệ thống | `Ví dụ: lan.nguyen@gmail.com` |
| 3 | Mật khẩu | Password Input + nút `Hiện`/`Ẩn` | Bắt buộc | 8–72 ký tự (`PASSWORD_MIN_LENGTH = 8`, `PASSWORD_MAX_LENGTH = 72`) | `Từ 8 đến 72 ký tự` |

### 2.2 Bộ nội dung văn bản (Microcopy)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **H1** | Đăng ký tài khoản |
| **Sub-heading** | Dùng chung một tài khoản cho cả mua hàng có sẵn, đặt hàng theo yêu cầu và đăng ký bán hàng. |
| **Primary CTA** | `Đăng ký` |
| **Secondary CTA** | `Đã có tài khoản? Đăng nhập` *(→ M5.1)* |
| **Helper text** | Dưới ô Mật khẩu: `Mật khẩu từ 8 đến 72 ký tự.` |
| **Disclaimer** | `Khi bấm Đăng ký, bạn đồng ý với Điều khoản sử dụng và Chính sách mua bán của Moonkage.` |

### 2.3 Các trạng thái đặc biệt

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|
| **Lỗi trường** | Họ tên trống / > 100 ký tự | `Họ tên không được để trống` / `Họ tên tối đa 100 ký tự` |
| **Lỗi trường** | Email trống / sai định dạng | `Email không được để trống` / `Email không đúng định dạng` |
| **Lỗi trường** | Email đã tồn tại (AC-01.3) | `Email lan.nguyen@gmail.com đã được sử dụng.` · Liên kết: `Đăng nhập ngay` |
| **Lỗi trường** | Mật khẩu trống / ngoài 8–72 ký tự | `Mật khẩu không được để trống` / `Mật khẩu từ 8 đến 72 ký tự` |
| **Lỗi chung** | Không gửi được email OTP (`error.auth.email_delivery_failed`) | `Không thể gửi email xác nhận đến lan.nguyen@gmail.com. Vui lòng thử lại.` |
| **Thành công** | Tạo tài khoản xong | Chuyển sang M5.3, kèm Toast: `Đã gửi mã xác nhận gồm 6 chữ số đến lan.nguyen@gmail.com.` |

---

## 3. M5.3 Xác nhận tài khoản · `/dang-ky/xac-nhan`

### 3.1 Bảng cấu trúc dữ liệu (Data Fields)

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Mã xác nhận (OTP) | OTP Input (6 ô số rời hoặc 1 ô `inputmode="numeric"`, `maxlength="6"`, tự nhận khi dán) | Bắt buộc | Đúng 6 chữ số (`100000`–`999999` trong `OtpProperties`); hạn 5 phút; tối đa 5 lần nhập sai | 6 ô trống `· · · · · ·` |

### 3.2 Bộ nội dung văn bản (Microcopy)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **H1** | Xác nhận email của bạn |
| **Sub-heading** | Nhập mã 6 chữ số đã gửi tới **lan.nguyen@gmail.com**. Mã có hiệu lực trong 5 phút. |
| **Primary CTA** | `Xác nhận` |
| **Secondary CTA** | `Gửi lại mã` *(vô hiệu kèm đếm ngược `Gửi lại mã sau 00:59` trong 60 giây đầu)* · `Đổi email khác` *(→ M5.2)* |
| **Helper text** | `Chưa nhận được thư? Kiểm tra thêm hộp thư Rác (Spam) hoặc Quảng cáo.` |

### 3.3 Các trạng thái đặc biệt

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|
| **Lỗi trường** | Chưa nhập / chưa đủ 6 số | `Vui lòng nhập đủ 6 chữ số của mã xác nhận` |
| **Lỗi trường** | Mã sai hoặc quá 5 phút (`error.auth.otp_invalid_or_expired`) | `Mã xác nhận không đúng hoặc đã hết hạn.` |
| **Lỗi chung (Banner đỏ)** | Nhập sai quá 5 lần (`error.auth.otp_max_attempts_exceeded`) | `Bạn đã nhập sai mã quá 5 lần. Vui lòng thử lại sau 15 phút.` |
| **Lỗi chung (Toast)** | Bấm gửi lại khi chưa hết 60 giây (`error.auth.otp_too_frequent`) | `Vui lòng đợi 42 giây trước khi yêu cầu gửi lại mã.` |
| **Lỗi chung (Banner đỏ)** | Gửi lại quá 5 lần/giờ (`error.auth.otp_send_limit_exceeded`) | `Bạn đã vượt quá số lần yêu cầu nhận mã. Vui lòng thử lại sau.` |
| **Thành công** | Xác nhận OTP đúng | Nếu có thao tác đang dở (AC-02.3): tự chuyển về trang đang làm (hoặc sang M6.4 nếu thao tác cần NFC). Nếu không: hiện thông báo `Tài khoản đã được kích hoạt.` và chuyển về Trang chủ M1.0. |

---

## 4. M5.4 Quên mật khẩu · `/quen-mat-khau` & M5.5 Đặt lại mật khẩu · `/dat-lai-mat-khau`

### 4.1 Bảng cấu trúc dữ liệu (Data Fields)

| Màn | # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|---|
| M5.4 | 1 | Email | Text Input (`type="email"`) | Bắt buộc | Email hợp lệ | `Nhập email đã đăng ký` |
| M5.5 | 1 | Email | Text Input (Read-only) | Bắt buộc | Điền sẵn từ M5.4 | `member1@mk.com` |
| M5.5 | 2 | Mã xác nhận (OTP) | OTP Input (6 chữ số) | Bắt buộc | Đúng 6 chữ số; hạn 5 phút; tối đa 5 lần thử | `· · · · · ·` |
| M5.5 | 3 | Mật khẩu mới | Password Input + nút `Hiện`/`Ẩn` | Bắt buộc | 8–72 ký tự (`ResetPasswordRequest`) | `Từ 8 đến 72 ký tự` |

### 4.2 Bộ nội dung văn bản (Microcopy)

| Màn | Thành phần | Nội dung hiển thị thực tế |
|---|---|---|
| M5.4 | **H1 & Sub-heading** | **Quên mật khẩu** · Nhập email đã xác nhận của bạn. Moonkage sẽ gửi mã gồm 6 chữ số để đặt lại mật khẩu. |
| M5.4 | **Primary / Secondary CTA** | `Gửi mã đặt lại` · `Quay lại đăng nhập` *(→ M5.1)* |
| M5.5 | **H1 & Sub-heading** | **Đặt lại mật khẩu** · Nhập mã 6 chữ số đã gửi tới **member1@mk.com** và mật khẩu mới. |
| M5.5 | **Primary / Secondary CTA** | `Lưu mật khẩu mới` · `Gửi lại mã` *(đếm ngược 60 giây)* |

### 4.3 Các trạng thái đặc biệt

| Màn | Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|---|
| M5.4 | **Lỗi trường** | Email trống / sai định dạng | `Email không được để trống` / `Email không đúng định dạng` |
| M5.4 | **Thành công** | Gửi yêu cầu hợp lệ | Chuyển sang M5.5, hiện Banner thông tin: `Nếu email member1@mk.com đã đăng ký và kích hoạt, mã đặt lại mật khẩu đã được gửi tới hộp thư của bạn.` |
| M5.5 | **Lỗi trường** | OTP trống / sai / hết hạn | `Vui lòng nhập mã xác nhận` / `Mã xác nhận không đúng hoặc đã hết hạn.` |
| M5.5 | **Lỗi trường** | Mật khẩu mới trống / ngoài 8–72 ký tự | `Mật khẩu mới không được để trống` / `Mật khẩu từ 8 đến 72 ký tự` |
| M5.5 | **Thành công** | Đặt lại thành công | Chuyển về M5.1 (điền sẵn email), hiện Banner xanh: `Đã cập nhật mật khẩu mới. Vui lòng đăng nhập để tiếp tục.` |

---

## 5. M1.1 Chọn khu vực giao · Hộp thoại (Modal)

> [!NOTE] Mở tự động (không có nút đóng `×`) khi khách chưa có khu vực mà vào trang chủ/danh sách sản phẩm (AC-05.3). Khi người dùng chủ động bấm `Giao tới: [tỉnh/thành]` trên thanh điều hướng toàn cục thì có nút đóng `×`.

### 5.1 Bảng cấu trúc dữ liệu (Data Fields)

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Địa chỉ giao hàng đã lưu *(chỉ hiện khi đã đăng nhập và có ≥ 1 địa chỉ)* | Radio Card List | Bắt buộc (chọn 1 trong #1 hoặc #2) | Hiển thị: `[Nhãn] · [Tên người nhận] · [SĐT]` và `[Số nhà, đường], [Phường/xã], [Tỉnh/thành]`. Thẻ mặc định có badge `Mặc định` | Chọn sẵn địa chỉ đang dùng hoặc địa chỉ `Mặc định` |
| 2 | Tỉnh/thành phố nhận hàng *(dành cho khách hoặc khi muốn xem thử tỉnh khác)* | Searchable Dropdown | Bắt buộc (nếu không chọn #1) | 34 tỉnh/thành theo Quyết định 19/2025/QĐ-TTg (`Province` enum, mã 2 chữ số `01`–`96`) | `Chọn tỉnh/thành phố` · Ô tìm: `Tìm tỉnh/thành, ví dụ: Hồ Chí Minh` |

### 5.2 Bộ nội dung văn bản (Microcopy)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **H1 (Tiêu đề hộp thoại)** | Chọn khu vực nhận hàng |
| **Sub-heading** | Moonkage chỉ hiển thị sản phẩm và Shop giao được tới khu vực bạn chọn. |
| **Primary CTA** | `Xem sản phẩm tại khu vực này` |
| **Secondary CTA** | Với khách: `Đăng nhập để chọn từ sổ địa chỉ` *(→ M5.1)* · Với người mua đã đăng nhập: `+ Quản lý sổ địa chỉ` *(→ M6.3)* |
| **Helper text** | `Bạn có thể đổi lại khu vực bất cứ lúc nào ở thanh trên cùng của trang.` |

### 5.3 Các trạng thái đặc biệt

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|
| **Lỗi trường** | Bấm CTA khi chưa chọn tỉnh/thành | `Vui lòng chọn tỉnh/thành phố` |
| **Trạng thái trống** | Người mua đã đăng nhập nhưng sổ địa chỉ trống | `Bạn chưa có địa chỉ đã lưu. Chọn tỉnh/thành phố bên dưới để xem sản phẩm trước, hoặc thêm địa chỉ giao hàng mới.` |
| **Thành công** | Xác nhận khu vực | Đóng hộp thoại; nhãn trên Header cập nhật thành `Giao tới: Thành phố Hồ Chí Minh`; tải lại danh sách sản phẩm theo mã tỉnh `79` (AC-03.2). |

---

## 6. M6.3.1 Thêm / sửa địa chỉ · `/tai-khoan/dia-chi/:addressId` (+ M6.3.2 Xóa địa chỉ)

### 6.1 Bảng cấu trúc dữ liệu (Data Fields – khớp `SaveAddressRequest.java`)

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Tên người nhận | Text Input | Bắt buộc | 1–100 ký tự (`MAX_RECIPIENT_NAME_LENGTH = 100`) | `Ví dụ: Nguyễn Thị Lan` *(điền sẵn tên tài khoản khi thêm mới)* |
| 2 | Số điện thoại người nhận | Text Input (`type="tel"`) | Bắt buộc | SĐT di động VN (`^(\+?84\|0)[35789]\d{8}$`) | `Ví dụ: 0901 000 001` |
| 3 | Tỉnh/thành phố | Searchable Dropdown | Bắt buộc | Chọn từ 34 tỉnh/thành; gửi cả `provinceCode` (2 số) và `provinceName` (≤ 100 ký tự) | `Chọn tỉnh/thành phố` |
| 4 | Phường/xã | Text Input / Combobox | Bắt buộc | 1–100 ký tự (`MAX_ADMINISTRATIVE_UNIT_NAME_LENGTH = 100`) | `Ví dụ: Phường Sài Gòn` |
| 5 | Số nhà, tên đường | Text Input | Bắt buộc | 1–255 ký tự (`MAX_DETAIL_LENGTH = 255`) | `Ví dụ: 12 Lê Lợi` |
| 6 | Nhãn địa chỉ | Text Input + Chip chọn nhanh (`Nhà riêng`, `Văn phòng`) | Tùy chọn | Tối đa 30 ký tự (`MAX_LABEL_LENGTH = 30`) | `Ví dụ: Nhà riêng, Văn phòng` |
| 7 | Đặt làm địa chỉ mặc định | Checkbox | Tùy chọn | `Boolean isDefault`. Mỗi tài khoản tối đa 1 địa chỉ mặc định (AC-03.1) | Tự động bật nếu đây là địa chỉ đầu tiên |

### 6.2 Bộ nội dung văn bản (Microcopy)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **H1** | Thêm địa chỉ giao hàng *(hoặc: `Sửa địa chỉ giao hàng`)* |
| **Sub-heading** | Địa chỉ này dùng để lọc sản phẩm giao được và điền sẵn khi bạn thanh toán hoặc gửi yêu cầu báo giá. |
| **Primary CTA** | `Lưu địa chỉ` |
| **Secondary CTA** | `Hủy` *(quay về M6.3)* |
| **Helper text** | Dưới ô Phường/xã: `Nhập tên phường/xã theo địa giới hành chính hiện hành (không dùng quận/huyện).` |
| **Disclaimer** | `Thay đổi hoặc xóa địa chỉ tại đây không làm thay đổi địa chỉ trên các đơn hàng và yêu cầu đã gửi trước đó.` |

### 6.3 Các trạng thái đặc biệt

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể (khớp `messages.properties`) |
|---|---|---|
| **Lỗi trường #1** | Trống / > 100 ký tự | `Tên người nhận không được để trống` / `Tên người nhận tối đa 100 ký tự` |
| **Lỗi trường #2** | Trống / sai định dạng | `Số điện thoại người nhận không được để trống` / `Số điện thoại người nhận không hợp lệ` |
| **Lỗi trường #3** | Chưa chọn tỉnh/thành | `Vui lòng chọn tỉnh/thành phố` |
| **Lỗi trường #4** | Trống / > 100 ký tự | `Tên phường/xã không được để trống` / `Tên phường/xã tối đa 100 ký tự` |
| **Lỗi trường #5** | Trống / > 255 ký tự | `Số nhà, tên đường không được để trống` / `Số nhà, tên đường tối đa 255 ký tự` |
| **Lỗi trường #6** | > 30 ký tự | `Nhãn địa chỉ tối đa 30 ký tự` |
| **Trạng thái trống (M6.3)** | Sổ địa chỉ chưa có bản ghi nào | Tiêu đề: **Chưa có địa chỉ giao hàng** · Mô tả: `Thêm địa chỉ để Moonkage lọc đúng sản phẩm giao tới bạn và điền sẵn khi đặt đơn.` · CTA: `+ Thêm địa chỉ mới` |
| **Hộp thoại xóa (M6.3.2)** | Bấm `Xóa` trên một địa chỉ ở M6.3 | Tiêu đề: **Xóa địa chỉ giao hàng?** · Nội dung: `Địa chỉ "Nhà riêng – 12 Lê Lợi, Phường Sài Gòn, Thành phố Hồ Chí Minh" sẽ bị xóa khỏi sổ địa chỉ. Các đơn hàng đã tạo trước đó không bị ảnh hưởng.` · CTA chính (đỏ): `Xóa địa chỉ` · CTA phụ: `Giữ lại` |
| **Thành công** | Lưu / Xóa xong | Quay về M6.3, hiện Toast: `Đã lưu địa chỉ giao hàng.` / `Đã xóa địa chỉ giao hàng.` |

---

## 7. M3.1 Tạo yêu cầu báo giá (Gửi nhiều nơi) · `/dat-theo-yeu-cau/yeu-cau-moi`

> [!IMPORTANT] Bắt buộc tài khoản đã xác minh NFC (BR-23, AC-16.5). Nếu chưa xác minh (ví dụ tài khoản `Trần Văn Minh – member2@mk.com`), chuyển sang bước xác minh NFC (M6.4) rồi quay lại form với dữ liệu đã giữ.

### 7.1 Bảng cấu trúc dữ liệu (Data Fields – khớp bảng `quote_requests`, `request_custom_types`, `request_logos`)

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Số lượng cần đặt (hộp) | Number Input + nút `−`/`+` | Bắt buộc | Số nguyên `> 0` (`ck_quote_requests_quantity`), tối đa `100.000` *(đề xuất)* | `Ví dụ: 150` |
| 2 | Ngân sách dự kiến (tổng đơn) | Currency Input (hậu tố `đ`) | Bắt buộc (AC-16.1) | Số nguyên VND `> 0` (`ck_quote_requests_budget`), tự tách dấu chấm hàng nghìn | `Ví dụ: 45.000.000` |
| 3 | Hạn giao hàng | Datepicker | Bắt buộc | Định dạng `DD/MM/YYYY`; phải từ ngày mai trở đi (`delivery_deadline > current_date`) | `DD/MM/YYYY` |
| 4 | Địa chỉ nhận hàng | Dropdown (chọn từ sổ địa chỉ) + nút `+ Thêm địa chỉ mới` | Bắt buộc | Chép `delivery_recipient_name`, `delivery_recipient_phone`, `delivery_province_code`, `delivery_address_detail` vào yêu cầu | Chọn sẵn địa chỉ `Mặc định` |
| 5 | Hạng mục in logo | Checkbox Group | Tùy chọn | Chọn từ 4 giá trị chuẩn BR-14: `In logo lên túi` (`BAG`) · `In logo lên thiệp` (`CARD`) · `In logo lên sticker` (`STICKER`) · `In logo lên hộp mẫu có sẵn` (`TEMPLATE_BOX`) | Không chọn mặc định |
| 6 | Mô tả chi tiết yêu cầu | Textarea + bộ đếm ký tự | Tùy chọn | Tối đa `2.000` ký tự (`custom_spec`, *(đề xuất)*) | `Ví dụ: Hộp 4 bánh nướng 150g (nhân thập cẩm, hạt sen trứng muối). In logo công ty 1 màu lên túi giấy và thiệp chúc mừng. Giao giờ hành chính.` |
| 7 | File logo đính kèm | File Upload (kéo thả hoặc chọn file) | Tùy chọn | JPG, PNG, PDF, SVG, AI; tối đa `20 MB/file` (NFR-08); tối đa `5 file` (`request_logos`, *(đề xuất)*) | `Kéo thả file logo vào đây hoặc Bấm để chọn file` |

### 7.2 Bộ nội dung văn bản (Microcopy)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **H1** | Tạo yêu cầu báo giá |
| **Sub-heading** | Mô tả nhu cầu một lần. Hệ thống sẽ mời các đơn vị cung cấp đáp ứng được số lượng, hạng mục in logo và khu vực giao của bạn cùng gửi báo giá. |
| **Primary CTA** | `Gửi yêu cầu báo giá` |
| **Secondary CTA** | `Hủy` *(quay về M3.0)* |
| **Helper text – Số lượng** | `Hệ thống chỉ mời các đơn vị có mức nhận đặt tối thiểu thấp hơn hoặc bằng số lượng bạn nhập.` |
| **Helper text – Ngân sách** | `Tương đương khoảng {ngân_sách ÷ số_lượng}đ/hộp (đã gồm thuế GTGT và phí giao).` |
| **Helper text – In logo** | `Moonkage chỉ hỗ trợ 4 hình thức in logo lên bao bì có sẵn của đơn vị cung cấp (BR-14). Bạn có thể bổ sung file logo sau khi chốt đơn.` |
| **Disclaimer** | `Bạn chưa phải thanh toán ở bước này. Đơn đặt hàng chỉ được tạo khi bạn chọn chấp nhận một báo giá và thanh toán tiền cọc.` |

### 7.3 Các trạng thái đặc biệt

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|
| **Chặn xác minh NFC** | Tài khoản có `nfc_status = UNVERIFIED` (AC-16.5) | Tiêu đề: **Cần xác minh danh tính trước khi gửi yêu cầu** · Mô tả: `Để tránh yêu cầu ảo, tài khoản đặt hàng qua báo giá cần xác minh một lần bằng thẻ CCCD gắn chip qua ứng dụng Moonkage Verify. Thông tin bạn vừa nhập sẽ được giữ nguyên.` · CTA chính: `Xác minh danh tính ngay` *(→ M6.4)* · CTA phụ: `Quay lại` |
| **Lỗi trường #1** | Trống hoặc `≤ 0` | `Vui lòng nhập số lượng hộp cần đặt (lớn hơn 0)` |
| **Lỗi trường #2** | Trống hoặc `≤ 0` | `Vui lòng nhập ngân sách dự kiến cho đơn hàng` |
| **Lỗi trường #3** | Trống hoặc chọn ngày hôm nay / quá khứ | `Vui lòng chọn hạn giao hàng từ ngày mai trở đi` |
| **Lỗi trường #4** | Chưa có địa chỉ giao | `Vui lòng chọn hoặc thêm địa chỉ nhận hàng` |
| **Lỗi trường #7** | File sai định dạng / `> 20 MB` | `File {tên_file} không đúng định dạng (chỉ nhận JPG, PNG, PDF, SVG, AI)` / `File {tên_file} vượt quá giới hạn 20 MB` |
| **Trạng thái trống (Không ghép được người bán – FR-16)** | Không có đơn vị nào thỏa đồng thời `min_qty ≤ quantity`, `custom_capabilities`, `delivery_areas` | Tiêu đề: **Chưa tìm thấy đơn vị cung cấp phù hợp** · Mô tả: `Hiện chưa có đơn vị nào cùng lúc nhận mức {số_lượng} hộp, hỗ trợ {hạng_mục_in_logo} và giao tới {tỉnh_thành}. Bạn có thể tăng số lượng, bỏ bớt hạng mục in logo hoặc xem danh sách đơn vị cung cấp.` · CTA chính: `Chỉnh lại yêu cầu` · CTA phụ: `Xem danh sách đơn vị cung cấp` *(→ M3.2)* |
| **Thành công** | Tạo yêu cầu và gửi lời mời thành công | Chuyển tới trang chi tiết yêu cầu M6.2.1, hiện Banner xanh: `Đã gửi yêu cầu báo giá và mời {n} đơn vị cung cấp phù hợp. Bạn sẽ nhận thông báo ngay khi có báo giá mới.` |

---

## 8. M3.4 Gửi yêu cầu cho đơn vị (Gửi riêng) · `/don-vi-cung-cap/:vendorId/yeu-cau`

Đầu trang hiển thị thẻ tóm tắt đơn vị đích (Read-only):
- **Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng** *(hoặc **Hộ kinh doanh Xưởng Bánh Cô Hoa**)* · Nhận đặt từ: `50 hộp` · Thời gian chuẩn bị: `10 ngày` · Hỗ trợ in logo: `In logo lên túi, In logo lên thiệp`.

### 8.1 Bảng cấu trúc dữ liệu (Data Fields – FR-15)

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Sản phẩm tham khảo | Dropdown (danh sách sản phẩm đang bán của Shop đó) | Tùy chọn | Ẩn nếu đơn vị `Chỉ nhận đặt hàng` (`sells_shop = false`). Tự điền sẵn nếu người mua bấm sang từ trang Chi tiết sản phẩm (M2.1) hoặc Giỏ hàng (M4.0) | `Chọn sản phẩm của Shop (không bắt buộc)` |
| 2 | Số lượng cần đặt (hộp) | Number Input + nút `−`/`+` | Bắt buộc | Số nguyên `≥ min_qty` của đơn vị (AC-15.2). Tự điền sẵn nếu chuyển từ Giỏ hàng vượt ngưỡng (AC-08.2) | `Tối thiểu {min_qty} hộp (ví dụ: 50)` |
| 3 | Hạn giao hàng | Datepicker | Bắt buộc | `DD/MM/YYYY`; từ ngày mai trở đi | `DD/MM/YYYY` |
| 4 | Địa chỉ nhận hàng | Dropdown (sổ địa chỉ) + `+ Thêm địa chỉ mới` | Bắt buộc | Như M3.1 | Chọn sẵn địa chỉ `Mặc định` |
| 5 | Hạng mục in logo | Checkbox Group | Tùy chọn | Chỉ cho chọn các hạng mục nằm trong `custom_capabilities` mà đơn vị này hỗ trợ | Không chọn mặc định |
| 6 | Nội dung yêu cầu & ghi chú | Textarea + bộ đếm ký tự | Tùy chọn | Tối đa `2.000` ký tự *(đề xuất)* | `Ví dụ: Đặt 80 hộp quà Trăng Vàng Đoàn Viên, in logo công ty lên túi giấy. Giao 1 đợt vào buổi sáng.` |
| 7 | File logo đính kèm | File Upload | Tùy chọn | JPG, PNG, PDF, SVG, AI; `≤ 20 MB/file`; tối đa `5 file` | `Kéo thả file logo vào đây hoặc Bấm để chọn file` |

*(Không có trường Ngân sách vì `budget` chỉ áp dụng cho yêu cầu mở gửi nhiều nơi – mục 7.1 Requirement).*

### 8.2 Bộ nội dung văn bản (Microcopy)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **H1** | Gửi yêu cầu cho {tên_đơn_vị} |
| **Sub-heading** | Yêu cầu này chỉ gửi riêng tới **{tên_đơn_vị}** để đơn vị lập báo giá cho bạn. |
| **Banner ngữ cảnh (khi chuyển từ M4.0/M2.1 do vượt tồn kho hoặc đạt ngưỡng báo giá – AC-08.2)** | `Số lượng {số_lượng} hộp vượt mức mua ngay của sản phẩm (tồn kho hiện tại: {stock} hộp / ngưỡng báo giá: {quote_threshold} hộp). Vui lòng gửi yêu cầu để đơn vị báo giá và chuẩn bị hàng.` |
| **Primary CTA** | `Gửi yêu cầu cho đơn vị` |
| **Secondary CTA** | `Quay lại trang đơn vị` *(→ M3.3)* |
| **Helper text – Số lượng** | `Đơn vị này chỉ nhận đặt hàng từ tối thiểu {min_qty} hộp trở lên (AC-15.2).` |
| **Helper text – Hạn giao** | `Thời gian chuẩn bị tham khảo của đơn vị là khoảng {lead_time_days} ngày.` |
| **Disclaimer** | `Bậc giá trên hồ sơ đơn vị chỉ mang tính tham khảo (AC-14.2). Giá chính thức và phí vận chuyển sẽ được chốt trong báo giá đơn vị gửi cho bạn.` |

### 8.3 Các trạng thái đặc biệt

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|
| **Chặn xác minh NFC** | Tài khoản chưa xác minh NFC (AC-15.5) | Như M3.1 (xác minh xong tự quay lại M3.4 kèm dữ liệu đã nhập). |
| **Lỗi trường #2** | Nhập số lượng `< min_qty` (AC-15.2) | `{tên_đơn_vị} yêu cầu số lượng đặt tối thiểu là {min_qty} hộp.` |
| **Chặn tự giao dịch** | Chủ tài khoản là chủ của chính đơn vị đó (BR-22, AC-15.4) | `Bạn không thể gửi yêu cầu đặt hàng cho đơn vị do chính mình làm chủ.` |
| **Chặn trạng thái đơn vị** | Đơn vị bị khóa hoặc chưa đóng phí mở bán (BR-20, BR-31) | `Đơn vị này hiện tạm ngừng nhận yêu cầu đặt hàng mới. Bạn có thể tạo yêu cầu báo giá chung để tìm đơn vị khác.` · Nút: `Tạo yêu cầu báo giá` *(→ M3.1)* |
| **Thành công** | Gửi thành công | Chuyển sang M6.2.1, hiện Toast: `Đã gửi yêu cầu tới {tên_đơn_vị}. Bạn sẽ nhận thông báo khi đơn vị gửi báo giá hoặc phản hồi.` |

---

## 9. M6.2.2 Chấp nhận báo giá và đặt cọc · `/tai-khoan/yeu-cau/:requestId/dat-coc`

> [!NOTE] Bổ sung theo rà soát luồng F2/F3: Màn hình này tạo bản chép ràng buộc (`quote_acceptances` – L-10), cho phép chọn xuất hóa đơn doanh nghiệp (FR-24) và chuyển sang VNPay thanh toán tiền cọc (`deposit_amount = floor(total_amount × deposit_rate / 100)`).

Khối tóm tắt báo giá đang chọn (Read-only, chép vào `snapshot` kèm mã băm `content_hash`):
- Đơn vị báo giá: **Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng** · MST: `0312345678`
- Người mua (theo CCCD đã xác minh NFC): **NGUYEN THI LAN** · CCCD: `********0001`
- Bảng dòng hàng (`quote_items`):
  - Sản phẩm: `Hộp quà Trăng Vàng Đoàn Viên – 4 bánh nướng 150g` × `100 hộp` × `280.000đ` = `28.000.000đ`
  - Phụ phí in logo (`CUSTOM`): `In logo lên túi` × `100` × `5.000đ` = `500.000đ`
  - Phí giao hàng (`shipping_fee`): `150.000đ` (`Giao tận nơi bằng xe tải nhỏ`, ngày giao `15/10/2026`)
- **Tổng giá trị báo giá (`total_amount`):** `28.650.000đ` (đã gồm thuế GTGT)
- **Đặt cọc đợt 1 (`deposit_rate = 50%`):** `14.325.000đ` · **Còn lại thanh toán khi nhận hàng (`remaining_amount`):** `14.325.000đ`

### 9.1 Bảng cấu trúc dữ liệu (Data Fields – FR-19, FR-24)

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Yêu cầu xuất hóa đơn doanh nghiệp | Checkbox / Toggle | Tùy chọn | Mặc định tắt (AC-24.5). Khi bật thì cả 4 trường #2–#5 đều bắt buộc (`ck_quote_acceptances_invoice`) | Không chọn mặc định |
| 2 | Tên đơn vị (Công ty / Hộ kinh doanh) | Text Input | Bắt buộc khi bật #1 | 1–255 ký tự (`invoice_name`) | `Ví dụ: Công ty TNHH Truyền Thông Sao Mai` |
| 3 | Mã số thuế | Text Input (`inputmode="numeric"`) | Bắt buộc khi bật #1 | 10 chữ số hoặc 13 ký tự dạng `0123456789-001` (`invoice_tax_code`, tối đa 20 ký tự; chỉ kiểm định dạng theo AC-24.3) | `Ví dụ: 0314567890` |
| 4 | Địa chỉ đăng ký thuế | Text Input | Bắt buộc khi bật #1 | 1–255 ký tự (`invoice_address`) | `Ví dụ: 12 Lê Lợi, Phường Sài Gòn, Thành phố Hồ Chí Minh` |
| 5 | Email nhận hóa đơn | Text Input (`type="email"`) | Bắt buộc khi bật #1 | Email hợp lệ, tối đa 255 ký tự (`invoice_email`) | `Ví dụ: ketoan@saomai.vn` |
| 6 | Phương thức thanh toán cọc | Radio Card (chọn sẵn) | Bắt buộc | Duy nhất cổng `VNPay` (Thẻ ATM nội địa / Thẻ quốc tế / QR ngân hàng) | Chọn sẵn `VNPay` |

### 9.2 Bộ nội dung văn bản (Microcopy)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **H1** | Chấp nhận báo giá và đặt cọc |
| **Sub-heading** | Kiểm tra lại điều khoản báo giá và thanh toán khoản cọc để tạo đơn đặt hàng chính thức. |
| **Primary CTA** | `Thanh toán cọc 14.325.000đ qua VNPay` |
| **Secondary CTA** | `Quay lại bảng so sánh báo giá` *(→ M6.2.1)* |
| **Helper text – Hóa đơn DN** | `Thông tin hóa đơn chỉ lưu trong đơn hàng này, áp dụng như nhau cho công ty và hộ kinh doanh (BR-07).` |
| **Disclaimer** | `Khi bạn thanh toán cọc thành công, báo giá này trở thành thỏa thuận ràng buộc (mã đối chiếu SHA-256) và các báo giá khác của cùng yêu cầu sẽ tự động đóng (BR-17). Tiền cọc được Moonkage giữ và chỉ giải ngân từng phần theo mục đích được quản trị duyệt (BR-09).` |

### 9.3 Các trạng thái đặc biệt

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|
| **Lỗi trường #2–#5** | Bật xuất hóa đơn nhưng bỏ trống hoặc sai định dạng | - #2 trống: `Vui lòng nhập tên đơn vị xuất hóa đơn`<br>- #3 trống / sai định dạng: `Vui lòng nhập mã số thuế` / `Mã số thuế không đúng định dạng (10 chữ số hoặc 10 số kèm -XXX)`<br>- #4 trống: `Vui lòng nhập địa chỉ xuất hóa đơn`<br>- #5 trống / sai email: `Vui lòng nhập email nhận hóa đơn` / `Email nhận hóa đơn không đúng định dạng` |
| **Lỗi chung (Banner đỏ)** | Báo giá vừa hết hạn hoặc bị người bán thu hồi trước lúc bấm (AC-17.3, BR-05) | `Báo giá này đã hết thời hạn hiệu lực hoặc vừa được đơn vị thu hồi nên không thể chấp nhận.` · Nút: `Quay lại xem báo giá khác` |
| **Lỗi chung (Banner đỏ)** | Thanh toán cọc thất bại trên VNPay (AC-19.1) | `Thanh toán tiền cọc chưa thành công. Đơn đặt hàng chưa được tạo, bạn có thể bấm thanh toán lại khi báo giá còn hiệu lực.` |
| **Thành công** | IPN báo cọc thành công (AC-19.2) | Tạo đơn đặt hàng mới và chuyển tới Chi tiết đơn đặt hàng (M6.1.2), hiện Banner xanh: `Đã đặt cọc 14.325.000đ và tạo đơn đặt hàng. Nếu đơn có in logo, đơn vị sẽ gửi bản thiết kế (maket) tại tab Maket để bạn duyệt trước khi sản xuất.` |

---

## 10. M4.1 Thanh toán đơn mua hàng có sẵn · `/thanh-toan` (+ M4.3 Kết quả thanh toán)

### 10.1 Bảng cấu trúc dữ liệu (Data Fields – FR-09, FR-24)

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Địa chỉ nhận hàng | Radio Card (hiển thị địa chỉ đang chọn + nút `Thay đổi`) | Bắt buộc | Chọn từ sổ địa chỉ; đổi địa chỉ sẽ tính lại phí giao từng Shop và kiểm tra lại vùng giao (FR-05, BR-30) | Chọn sẵn địa chỉ `Mặc định` |
| 2 | Yêu cầu xuất hóa đơn doanh nghiệp | Checkbox / Toggle | Tùy chọn | Mặc định tắt. Khi bật thì nhập một lần và chép vào mọi đơn trong cùng lần thanh toán (BR-29) | Không chọn mặc định |
| 3–6 | Tên đơn vị · Mã số thuế · Địa chỉ · Email nhận hóa đơn | Text Inputs | Bắt buộc khi bật #2 | Giống hệt mục 9.1 (`ck_checkouts_invoice`) | Giống mục 9.1 |
| 7 | Phương thức thanh toán | Radio Card (chọn sẵn) | Bắt buộc | Duy nhất `VNPay` (AC-09.3, A-03: không có thanh toán khi nhận hàng) | Chọn sẵn `VNPay` |

*(Ô nhập mã Voucher ẩn trong phạm vi demo theo mục 4.3 Requirement).*

Khối tóm tắt đơn hàng theo từng Shop (Read-only – AC-09.1):
- **Nhóm Shop 1: Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng**
  - `Hộp quà Trăng Vàng Đoàn Viên – 4 bánh nướng 150g` × `2` = `640.000đ`
  - Phí giao hàng (Nội thành TP. Hồ Chí Minh): `30.000đ` · Cộng Shop 1: `670.000đ`
- **Tổng tiền hàng:** `640.000đ` · **Tổng phí vận chuyển:** `30.000đ` · **Tổng thanh toán:** `670.000đ`

### 10.2 Bộ nội dung văn bản (Microcopy)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **H1** | Thanh toán |
| **Sub-heading** | Kiểm tra địa chỉ nhận hàng và phí vận chuyển của từng Shop trước khi thanh toán. |
| **Thông báo tách đơn (khi giỏ có ≥ 2 Shop – BR-29)** | `Giỏ hàng có sản phẩm từ {n} Shop. Sau khi thanh toán một lần, hệ thống sẽ tách thành {n} đơn hàng riêng để từng Shop giao hàng và lập hóa đơn.` |
| **Primary CTA** | `Thanh toán 670.000đ qua VNPay` |
| **Secondary CTA** | `Quay lại giỏ hàng` *(→ M4.0)* |
| **Disclaimer** | `Tồn kho được giữ cho bạn trong thời gian thanh toán trên cổng VNPay (BR-28). Tiền thanh toán được Moonkage giữ và chỉ chuyển cho Shop sau khi bạn xác nhận đã nhận hàng hoặc hết thời hạn khiếu nại (3 ngày với đơn nội thành, 7 ngày với đơn liên tỉnh).` |

### 10.3 Các trạng thái đặc biệt (M4.1 & M4.3 `/thanh-toan/ket-qua`)

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|
| **Lỗi chung (M4.1)** | Không đủ tồn kho tại thời điểm giữ hàng (FR-09) | `Sản phẩm "Hộp quà Trăng Vàng Đoàn Viên" chỉ còn {stock} hộp trong kho. Vui lòng quay lại giỏ hàng để điều chỉnh số lượng.` |
| **Lỗi chung (M4.1)** | Sản phẩm không còn giao tới địa chỉ đang chọn (FR-05) | `Sản phẩm "Bánh dẻo đậu xanh trứng muối Kinh Đô" chỉ giao nội thành và không hỗ trợ giao tới Thành phố Hà Nội. Vui lòng đổi địa chỉ hoặc bỏ sản phẩm khỏi giỏ.` |
| **Thông báo loại tự động (M4.1)** | Có sản phẩm thuộc Shop do chính người mua làm chủ (AC-09.5) hoặc vừa bị ẩn/gỡ (AC-34.2, FR-46) | `Đã tự động loại {n} sản phẩm không còn đủ điều kiện mua (sản phẩm thuộc Shop của bạn hoặc đã ngừng bán) khỏi lần thanh toán này.` |
| **M4.3 – Đang chờ IPN** | Người mua vừa quay về từ VNPay, máy chủ chưa nhận IPN (BR-25) | Tiêu đề: **Đang xác nhận kết quả thanh toán** · Mô tả: `Hệ thống đang chờ xác nhận từ cổng VNPay. Trang sẽ tự động cập nhật ngay khi hoàn tất.` |
| **M4.3 – Thành công** | `checkout.status = SUCCEEDED` (AC-09.7) | Tiêu đề: **Thanh toán thành công** · Phụ đề: `Đã tạo {n} đơn hàng từ lần thanh toán này. Bạn có thể theo dõi trạng thái từng đơn trong mục Đơn hàng.` · Danh sách thẻ đơn vừa tạo (Mã đơn · Tên Shop · Tổng tiền · Trạng thái `Đã thanh toán`) · CTA chính: `Theo dõi đơn hàng` *(→ M6.1)* · CTA phụ: `Tiếp tục mua sắm` *(→ M2.0)* |
| **M4.3 – Thất bại / Hết hạn** | `checkout.status = FAILED \| EXPIRED` | Tiêu đề: **Thanh toán chưa hoàn tất** · Phụ đề: `Giao dịch không thành công hoặc đã hết thời gian chờ. Đơn hàng chưa được tạo và số lượng giữ chỗ đã được trả lại kho.` · CTA chính: `Quay lại giỏ hàng để thử lại` *(→ M4.0)* |

---

## 11. M6.1.1 Chi tiết đơn hàng có sẵn – Xác nhận nhận hàng & Đánh giá · `/tai-khoan/don-hang/:orderId`

> [!NOTE] Bổ sung theo rà soát: Đơn mua hàng có sẵn (`kind = BUY_NOW`) ở trạng thái `Đã giao` (`DELIVERED`) có 2 thao tác quan trọng của người mua: **Xác nhận đã nhận hàng** (AC-11.2) và **Gửi đánh giá sản phẩm** (AC-11.3, BR-32). Đơn đặt hàng không có đánh giá.

### 11.1 Bảng cấu trúc dữ liệu (Data Fields – Form Đánh giá sản phẩm, bảng `reviews`)

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Sản phẩm trong đơn | Thẻ sản phẩm (Read-only, mỗi sản phẩm trong đơn đánh giá tối đa 1 lần: `UNIQUE (order_id, product_id)`) | Bắt buộc | Hiển thị ảnh + tên sản phẩm | – |
| 2 | Mức độ hài lòng (Số sao) | Star Rating Picker (1 đến 5 sao) | Bắt buộc | Số nguyên `1`–`5` (`ck_reviews_rating`), kèm nhãn: `1 - Rất tệ`, `2 - Chưa hài lòng`, `3 - Bình thường`, `4 - Hài lòng`, `5 - Rất hài lòng` | Chọn sẵn `5 sao` *(đề xuất)* |
| 3 | Nội dung đánh giá | Textarea + bộ đếm ký tự | Tùy chọn | Tối đa `1.000` ký tự (`content` kiểu `text`, *(đề xuất)*) | `Chia sẻ cảm nhận của bạn về hương vị bánh, quy cách đóng gói và thời gian giao hàng…` |

### 11.2 Bộ nội dung văn bản (Microcopy)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **Khối Xác nhận nhận hàng (khi `status = DELIVERED` và chưa xác nhận)** | Tiêu đề khối: **Bạn đã nhận đủ sản phẩm của đơn này?** · Mô tả: `Nếu bánh đúng mô tả và không có vấn đề gì, hãy xác nhận đã nhận hàng. Sau khi xác nhận, Moonkage sẽ chuyển tiền đơn hàng cho Shop.` · Primary CTA: `Đã nhận được hàng` · Secondary CTA: `Báo vấn đề với đơn` *(→ M6.1.3, chỉ hiện khi còn trong hạn 3 ngày nội thành / 7 ngày liên tỉnh)* |
| **Hộp thoại xác nhận khi bấm `Đã nhận được hàng`** | Tiêu đề: **Xác nhận đã nhận hàng?** · Nội dung: `Sau khi xác nhận, đơn hàng đủ điều kiện để Moonkage tất toán tiền cho Shop. Nếu sản phẩm bị hỏng hoặc sai mẫu, hãy chọn "Báo vấn đề với đơn" trước.` · CTA chính: `Xác nhận đã nhận` · CTA phụ: `Quay lại` |
| **Tiêu đề khối Đánh giá (FR-11)** | **Đánh giá sản phẩm** · Phụ đề: `Đánh giá của bạn sẽ hiển thị công khai trên trang sản phẩm và trang Shop để người mua sau tham khảo.` |
| **CTA gửi đánh giá** | `Gửi đánh giá` |
| **Disclaimer đánh giá** | `Đánh giá sau khi gửi không thể chỉnh sửa; người bán không thể xóa hoặc ẩn đánh giá của bạn.` |

### 11.3 Các trạng thái đặc biệt

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|
| **Lỗi trường đánh giá** | Chưa chọn số sao / Nội dung `> 1.000` ký tự | `Vui lòng chọn số sao đánh giá từ 1 đến 5` / `Nội dung đánh giá tối đa 1.000 ký tự` |
| **Thành công xác nhận nhận hàng** | `receivedConfirmed = true` | Đổi trạng thái hiển thị kèm thời điểm `Đã xác nhận nhận hàng lúc {HH:mm DD/MM/YYYY}`, hiện Toast: `Cảm ơn bạn đã xác nhận nhận hàng.` |
| **Thành công gửi đánh giá** | Tạo bản ghi `reviews` thành công | Ẩn form nhập, hiển thị số sao và nội dung vừa gửi kèm nhãn `Đã đánh giá ngày {DD/MM/YYYY}`. Toast: `Đã đăng đánh giá của bạn.` |

---

## 12. M6.1.2 Chi tiết đơn đặt hàng – Tab Maket & Tab Thanh toán phần còn lại · `/tai-khoan/don-hang/:orderId`

> [!NOTE] Bổ sung theo rà soát luồng F2/F3: Trên trang Chi tiết đơn đặt hàng (`kind = CUSTOM_ORDER`), người mua có 2 bước nhập liệu/tương tác: (1) **Tải thêm logo hoặc Duyệt / Yêu cầu sửa maket** tại tab `Maket` (FR-20, BR-15) và (2) **Thanh toán phần còn lại** tại tab `Thanh toán` khi đơn ở trạng thái `Đã giao` (FR-22).

### 12.1 Bảng cấu trúc dữ liệu (Data Fields – Tab Maket, bảng `mockup_versions`)

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Bổ sung file logo cho đơn vị | File Upload | Tùy chọn | JPG, PNG, PDF, SVG, AI; `≤ 20 MB/file` (NFR-08) | `Tải lên file logo thiết kế` |
| 2 | Quyết định với phiên bản maket đang chờ duyệt (`review_status = PENDING_REVIEW`) | Radio / 2 nút hành động | Bắt buộc | `Duyệt bản thiết kế này` (`APPROVED`) hoặc `Yêu cầu chỉnh sửa` (`CHANGES_REQUESTED`) | – |
| 3 | Ghi chú chỉnh sửa / phản hồi (`reviewNote`) | Textarea + bộ đếm ký tự | **Bắt buộc** khi chọn `Yêu cầu chỉnh sửa`; tùy chọn khi chọn `Duyệt` (AC-20.2) | 1–1.000 ký tự *(đề xuất)* | `Ví dụ: Vui lòng tăng kích thước logo thêm 15% và đổi dòng chữ chúc mừng sang màu vàng kim.` |

### 12.2 Bộ nội dung văn bản (Microcopy – Tab Maket & Tab Thanh toán)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **Tiêu đề tab Maket** | **Bản thiết kế in logo (Maket)** · Phụ đề: `Đơn vị chỉ được bắt đầu sản xuất sau khi bạn duyệt một phiên bản maket (BR-15). Mọi phiên bản cũ đều được lưu lại để đối chiếu.` |
| **Primary CTA (Duyệt maket)** | `Duyệt phiên bản v{version_no}` |
| **Secondary CTA (Yêu cầu sửa)** | `Yêu cầu sửa maket` *(mở ô nhập #3 và nút `Gửi yêu cầu sửa`)* |
| **Tiêu đề khối Thanh toán phần còn lại (Tab Thanh toán – FR-22)** | **Thanh toán phần còn lại sau khi nhận hàng** · Mô tả: `Đơn vị đã giao hàng vào ngày {DD/MM/YYYY}. Vui lòng thanh toán số tiền còn lại để hoàn tất đơn đặt hàng.` |
| **Chi tiết số tiền (Read-only – AC-22.1)** | Tổng giá trị theo báo giá: `{total_amount}đ` − Đã đặt cọc: `{deposit_amount}đ` = **Cần thanh toán còn lại: `{remaining_amount}đ`** |
| **Primary CTA (Thanh toán phần còn lại)** | `Thanh toán phần còn lại {remaining_amount}đ qua VNPay` *(→ M4.2)* |

### 12.3 Các trạng thái đặc biệt

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|
| **Trạng thái trống (Tab Maket)** | Đơn vị chưa tải lên phiên bản maket nào | Tiêu đề: **Đang chờ đơn vị gửi bản thiết kế (maket)** · Mô tả: `Bạn sẽ nhận được thông báo ngay khi đơn vị tải lên phiên bản maket đầu tiên. Nếu bạn chưa gửi file logo lúc tạo yêu cầu, hãy tải file logo lên ở khung bên cạnh.` |
| **Lỗi trường #3** | Bấm `Gửi yêu cầu sửa` nhưng để trống ghi chú | `Vui lòng nhập nội dung cần chỉnh sửa để đơn vị cập nhật lại maket` |
| **Thành công duyệt maket** | `reviewStatus = APPROVED` | Badge phiên bản `v{version_no}` đổi thành `Đã duyệt`; hiện Toast: `Đã duyệt maket v{version_no}. Đơn vị có thể bắt đầu sản xuất.` |
| **Thành công yêu cầu sửa** | `reviewStatus = CHANGES_REQUESTED` | Badge phiên bản đổi thành `Yêu cầu sửa`; hiện Toast: `Đã gửi yêu cầu chỉnh sửa maket cho đơn vị.` |
| **Thành công trả phần còn lại** | IPN `REMAINDER` thành công | Cập nhật tab Thanh toán thành `Đã thanh toán đủ 100%`; hiện Toast: `Đã thanh toán phần còn lại của đơn hàng.` |

---

## 13. M6.1.3 Khiếu nại của đơn · `/tai-khoan/don-hang/:orderId/khieu-nai`

> [!NOTE] Nút `Báo vấn đề với đơn` chỉ hiển thị ở M6.1.1 / M6.1.2 khi đơn ở trạng thái `Đã giao` (`DELIVERED`) và còn trước `complaint_deadline` (3 ngày với đơn nội thành, 7 ngày với đơn liên tỉnh và đơn đặt hàng – giá trị tạm Q-10). Mỗi đơn tối đa một khiếu nại mở (`ux_disputes_one_open_per_order`).

### 13.1 Bảng cấu trúc dữ liệu (Data Fields – bảng `disputes` & `dispute_evidences`)

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Lý do khiếu nại | Radio Group | Bắt buộc | Chọn 1 trong 5 giá trị (`disputes_reason_check`, FR-12):<br>- `Bánh sai` (`WRONG_ITEM` – sai loại bánh, sai số lượng)<br>- `Hỏng` (`DAMAGED` – bể, móp hộp, chảy mốc)<br>- `Giao trễ` (`LATE_DELIVERY` – trễ so với cam kết)<br>- `In sai logo` (`WRONG_LOGO` – sai mẫu maket đã duyệt)<br>- `Khác` (`OTHER`) | Không chọn mặc định |
| 2 | Mô tả chi tiết | Textarea + bộ đếm ký tự | Bắt buộc | 20–2.000 ký tự (`description NOT NULL`, *(đề xuất tối thiểu 20 ký tự)*) | `Mô tả cụ thể số lượng hộp gặp vấn đề và tình trạng thực tế khi nhận hàng…` |
| 3 | Hình ảnh / tài liệu bằng chứng | File Upload (xem trước dạng lưới) | Bắt buộc (AC-12.1) | 1–5 file (`dispute_evidences` với `party = BUYER`); định dạng JPG, PNG, PDF; `≤ 20 MB/file` (NFR-08) | `+ Tải ảnh hoặc tài liệu bằng chứng` |

### 13.2 Bộ nội dung văn bản (Microcopy)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **H1** | Khiếu nại đơn hàng |
| **Sub-heading** | Đơn hàng của **Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng** · Thời hạn gửi khiếu nại đến `{HH:mm} ngày {DD/MM/YYYY}`. |
| **Primary CTA** | `Gửi khiếu nại` |
| **Secondary CTA** | `Quay lại chi tiết đơn` *(→ M6.1.1 / M6.1.2)* |
| **Helper text – Bằng chứng** | `Chụp rõ tình trạng bánh, vỏ hộp, vị trí in logo hoặc biên bản giao nhận. Tối đa 5 file, mỗi file không quá 20 MB.` |
| **Disclaimer** | `Ngay khi khiếu nại được mở, Moonkage sẽ tạm dừng chuyển tiền của đơn hàng này cho người bán (BR-18) để quản trị viên đối chiếu bằng chứng hai bên và ra quyết định.` |

### 13.3 Các trạng thái đặc biệt (Form tạo mới & Màn hình xem kết quả khi đã có khiếu nại)

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|
| **Lỗi trường #1** | Chưa chọn lý do | `Vui lòng chọn lý do khiếu nại` |
| **Lỗi trường #2** | Trống hoặc `< 20` ký tự | `Vui lòng nhập mô tả chi tiết (tối thiểu 20 ký tự)` |
| **Lỗi trường #3** | Chưa tải file bằng chứng | `Vui lòng đính kèm ít nhất 1 ảnh hoặc file bằng chứng` |
| **Chặn quá hạn** | Truy cập URL khi đã qua `complaint_deadline` hoặc đơn đã khóa chuyển tiền (`payout_locked_at` – P-02, AC-12.2) | Tiêu đề: **Đã hết thời hạn khiếu nại của đơn hàng** · Mô tả: `Đơn hàng này đã qua thời hạn báo vấn đề ({complaint_deadline}) nên không thể mở khiếu nại mới.` · CTA: `Quay lại chi tiết đơn` |
| **Trạng thái Đang mở (`status = OPEN`)** | Đã gửi khiếu nại, chờ quản trị xử lý (Q5.1) | Badge: **Đang mở** · Thông báo: `Moonkage đang giữ tiền đơn hàng và xem xét bằng chứng của hai bên. Bạn có thể bổ sung thêm ảnh bằng chứng nếu cần.` · Nút phụ: `+ Bổ sung bằng chứng` |
| **Trạng thái Đã quyết định (`status = RESOLVED`)** | Quản trị đã ra quyết định ở Q5.1 (FR-49) | - Nếu `decision = FULL_REFUND`: Badge **Hoàn toàn bộ** · `Quyết định của quản trị: Hoàn 100% số tiền ({refund_amount}đ) qua cổng VNPay. Lý do: {decision_reason}`<br>- Nếu `decision = PARTIAL_REFUND`: Badge **Hoàn một phần** · `Quyết định của quản trị: Hoàn {refund_amount}đ qua cổng VNPay. Lý do: {decision_reason}`<br>- Nếu `decision = REJECTED`: Badge **Bác khiếu nại** · `Quyết định của quản trị: Không chấp nhận hoàn tiền. Lý do: {decision_reason}` |

---

## 14. M7.1 Khai hồ sơ người bán · `/ban-hang/dang-ky` (Form 6 bước)

> [!IMPORTANT]
> - Theo **BR-33**: Hệ thống chỉ nhận 2 loại hình **Hộ kinh doanh** (`HOUSEHOLD_BUSINESS`) và **Doanh nghiệp tư nhân** (`SOLE_PROPRIETORSHIP`). Công ty (TNHH, cổ phần, hợp danh) liên hệ trực tiếp đội vận hành.
> - Theo **BR-23 & BR-27**: Tài khoản nộp phải đã xác minh NFC và số định danh cá nhân khai báo trên hồ sơ **bắt buộc trùng** với số CCCD đã xác minh NFC của chính tài khoản đó (AC-26.6).

### 14.1 Bảng cấu trúc dữ liệu (Data Fields – khớp `SubmitVendorRequest.java` & bảng `vendors`)

| Bước | # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|---|
| **1. Loại hình** | 1 | Loại hình đăng ký kinh doanh (`entityType`) | Radio Card (2 lựa chọn) | Bắt buộc | `Hộ kinh doanh` (`HOUSEHOLD_BUSINESS`) hoặc `Doanh nghiệp tư nhân` (`SOLE_PROPRIETORSHIP`) | Không chọn mặc định |
| **2. Đơn vị** | 2 | Tên đơn vị kinh doanh (`businessName`) | Text Input | Bắt buộc | 2–255 ký tự; ghi đúng như trên giấy chứng nhận đăng ký | `Ví dụ: Hộ kinh doanh Bánh Quê` |
| **2. Đơn vị** | 3 | Mã số thuế / Mã số hộ kinh doanh / Mã số doanh nghiệp (`taxCode`) | Text Input (`inputmode="numeric"`) | Bắt buộc | 10 chữ số hoặc 13 ký tự (`0123456789-001`), tối đa 20 ký tự | `Ví dụ: 8012345678` |
| **2. Đơn vị** | 4 | Tỉnh/thành phố trụ sở (`provinceCode`) | Searchable Dropdown | Bắt buộc | 34 tỉnh/thành (mã 2 chữ số) | `Chọn tỉnh/thành phố` |
| **2. Đơn vị** | 5 | Địa chỉ trụ sở (`address`) | Text Input | Bắt buộc | 1–255 ký tự (gồm số nhà, đường, phường/xã như trên giấy chứng nhận) | `Ví dụ: 45 Trần Phú, Phường Ba Đình` |
| **3. Chủ đơn vị** | 6 | Họ tên chủ hộ / chủ doanh nghiệp tư nhân (`representativeName`) | Text Input (tự động viết hoa) | Bắt buộc | **Chữ in hoa không dấu**, chỉ gồm `A–Z` và khoảng trắng (`[A-Z]+( [A-Z]+)*`), tối đa 100 ký tự (AC-26.1, A-15) | `Ví dụ: VO THI QUE` |
| **3. Chủ đơn vị** | 7 | Số định danh cá nhân (CCCD) của chủ hộ / chủ DNTN (`representativeIdNumber`) | Text Input (`inputmode="numeric"`, `maxlength="12"`) | Bắt buộc | Đúng 12 chữ số (`\d{12}`). Máy chủ băm và so với CCCD đã xác minh NFC của tài khoản (AC-26.6) | `Nhập đủ 12 chữ số CCCD` |
| **4. Giấy tờ & Ngân hàng** | 8 | Giấy chứng nhận đăng ký hộ kinh doanh / doanh nghiệp (`BUSINESS_LICENSE`) | File Upload | Bắt buộc | ≥ 1 file; JPG, PNG, PDF; `≤ 20 MB/file` | `Tải lên bản chụp hoặc scan rõ nét` |
| **4. Giấy tờ & Ngân hàng** | 9 | Giấy tờ an toàn thực phẩm (`FOOD_SAFETY`) | File Upload | Bắt buộc | ≥ 1 file; JPG, PNG, PDF; `≤ 20 MB/file` | `Tải lên giấy chứng nhận hoặc bản cam kết ATTP` |
| **4. Giấy tờ & Ngân hàng** | 10 | Ngân hàng nhận tiền (`bankName`) | Searchable Dropdown | Bắt buộc | Danh sách ngân hàng tại Việt Nam (tối đa 255 ký tự) | `Ví dụ: Vietcombank, Agribank` |
| **4. Giấy tờ & Ngân hàng** | 11 | Số tài khoản ngân hàng (`bankAccountNumber`) | Text Input (`inputmode="numeric"`) | Bắt buộc | 6–19 chữ số. Máy chủ mã hóa AES-GCM và chỉ hiển thị dạng đã che `*********3456` (P-09) | `Nhập số tài khoản nhận tiền đối soát` |
| **4. Giấy tờ & Ngân hàng** | 12 | Tên chủ tài khoản (`bankAccountHolder`) | Text Input (tự động viết hoa) | Bắt buộc | Chữ in hoa không dấu, tối đa 100 ký tự; đứng tên đơn vị / chủ hộ | `Ví dụ: DNTN BANH TRUNG THU TRANG VANG` |
| **5. Nguồn hàng & Cách bán** | 13 | Nguồn hàng (`supplySource`) | Radio Group | Bắt buộc | `Tự sản xuất` (`SELF_PRODUCED`) · `Bán lại` (`RESELL`) · `Cả hai` (`BOTH`) | Không chọn mặc định |
| **5. Nguồn hàng & Cách bán** | 14 | Cách bán trên Moonkage (`sellsShop`, `acceptsOrders`) | Checkbox Group (2 lựa chọn) | Bắt buộc chọn ít nhất 1 (`ck_vendors_sells_something`) | - `Có hàng sẵn (Mở Shop)` (`sellsShop = true`)<br>- `Nhận đặt hàng qua báo giá` (`acceptsOrders = true`) | Không chọn mặc định |
| **6. Xem lại** | 15 | Xác nhận cam kết | Checkbox | Bắt buộc | Phải đánh dấu trước khi bấm `Nộp hồ sơ` | Không chọn mặc định |

### 14.2 Bộ nội dung văn bản (Microcopy)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **H1** | Khai hồ sơ người bán |
| **Sub-heading** | Hoàn tất 6 bước dưới đây để gửi hồ sơ đăng ký bán hàng trên Moonkage. |
| **Banner phí mở bán (luôn hiển thị – AC-26.9, BR-31)** | `Phí đăng ký mở bán: 200.000đ (mức hiện hành). Bạn chỉ đóng khoản phí này một lần duy nhất sau khi hồ sơ đã được duyệt; không thu phí khi nộp hồ sơ.` |
| **Hộp thông báo dành cho Công ty (Bước 1 – BR-33)** | `Bạn đại diện cho Công ty TNHH, Công ty cổ phần hoặc Công ty hợp danh? Hiện tại khối công ty chưa đăng ký trực tuyến trên form này. Vui lòng liên hệ trực tiếp đội vận hành Moonkage để làm việc và ký thỏa thuận hợp tác.` |
| **Thẻ đối chiếu NFC của chủ tài khoản (Bước 3)** | `Tài khoản đang đăng nhập đã xác minh NFC: Họ tên trên thẻ: VO THI QUE · Số CCCD: ********0005. Với hộ kinh doanh và doanh nghiệp tư nhân, chủ tài khoản bắt buộc là chính chủ ghi trên giấy chứng nhận đăng ký (BR-27).` |
| **Cảnh báo khi chỉ chọn "Nhận đặt hàng", không chọn "Mở Shop" (Bước 5 – AC-26.4, BR-21)** | `Lưu ý khi chọn "Chỉ nhận đặt hàng": Đơn vị của bạn sẽ không có danh sách sản phẩm ở trang Mua hàng có sẵn. Người mua sẽ tìm thấy bạn qua trang Đơn vị cung cấp, khối Đơn vị cung cấp khi gõ đúng tên đơn vị trên ô tìm kiếm, hồ sơ nhận đặt hàng và lời mời từ yêu cầu báo giá.` |
| **Helper text – Cách bán (Bước 5)** | `Lựa chọn Mở Shop / Nhận đặt hàng chưa thể tự bật hoặc tắt lại sau khi hồ sơ được duyệt (A-10).` |
| **Primary CTA** | Bước 1–5: `Tiếp tục` · Bước 6: `Nộp hồ sơ người bán` *(hoặc `Nộp lại hồ sơ` tại B6.1 khi `NEEDS_INFO` / `REJECTED`)* |
| **Secondary CTA** | `Quay lại bước trước` |
| **Disclaimer (Nhãn Checkbox bước 6)** | `Tôi xác nhận các thông tin và giấy tờ đã khai hoàn toàn khớp với giấy chứng nhận đăng ký kinh doanh, và tôi là chính chủ hộ kinh doanh / chủ doanh nghiệp tư nhân của đơn vị này.` |

### 14.3 Các trạng thái đặc biệt

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|
| **Chặn xác minh NFC** | Tài khoản chưa xác minh NFC (AC-26.5) | Tiêu đề: **Cần xác minh danh tính trước khi khai hồ sơ người bán** · Mô tả: `Mọi tài khoản làm chủ người bán trên Moonkage phải được xác minh NFC bằng CCCD gắn chip để đối chiếu thông tin chủ hộ / chủ doanh nghiệp tư nhân.` · CTA: `Xác minh danh tính ngay` *(→ M6.4)* |
| **Lỗi trường #6 (Họ tên)** | Nhập tiếng Việt có dấu hoặc ký tự số/đặc biệt (FR-26) | `Vui lòng nhập họ tên viết hoa không dấu như trên thẻ CCCD (ví dụ: VO THI QUE)` |
| **Lỗi trường #7 (Số định danh)** | Không đủ 12 chữ số | `Số định danh cá nhân phải gồm đúng 12 chữ số` |
| **Lỗi chặn khi nộp (Banner đỏ ở Bước 6 – AC-26.6, BR-27)** | Số định danh nhập ở #7 không trùng với mã băm CCCD đã xác minh NFC của tài khoản | `Số định danh cá nhân khai báo không khớp với số CCCD đã xác minh của tài khoản này. Theo quy định của Moonkage, tài khoản làm chủ hộ kinh doanh hoặc doanh nghiệp tư nhân phải là chính chủ, không nhận người được ủy quyền.` · Nút: `Quay lại bước 3 để kiểm tra` |
| **Lỗi trường #14 (Cách bán)** | Không chọn ô nào trong 2 cách bán | `Vui lòng chọn ít nhất một cách bán (Mở Shop hoặc Nhận đặt hàng)` |
| **Thành công** | Nộp hồ sơ thành công (`status = PENDING`) | Chuyển sang trang Tổng quan Kênh người bán (B1.0), hiện Banner xanh: `Đã nộp hồ sơ người bán. Moonkage sẽ kiểm tra giấy tờ và thông báo kết quả cho bạn. Sau khi hồ sơ được duyệt, bạn đóng phí mở bán 200.000đ để bắt đầu kinh doanh.` |

---

# PHẦN B – CỤM MÀN HÌNH SẢN PHẨM & DANH MỤC (M2.0, M2.1, B4.0, B4.1, Q3.0, Q6.4)

## 15. M2.0 Mua hàng có sẵn (Danh sách & Tìm kiếm sản phẩm) · `/san-pham`

> [!NOTE]
> - Nhãn cấp 1 đã chốt theo Tree Test (Đ1, cây B): **Mua hàng có sẵn**.
> - Chỉ hiển thị sản phẩm `Đang bán` (`ON_SALE`) của các Shop đang hoạt động (`can_operate = true`, `sells_shop = true`) và giao được tới tỉnh/thành đang chọn (FR-05, BR-21).
> - Khi từ khóa tìm kiếm khớp tên một đơn vị nhận đặt hàng (`GET /api/suppliers?q=`), hiển thị thêm khối **Đơn vị cung cấp** tách biệt phía trên danh sách sản phẩm, không lọc theo vùng giao (AC-14.5).

### 15.1 Bảng cấu trúc dữ liệu (Data Fields – Bộ lọc & Tìm kiếm, khớp `/api/products`)

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Từ khóa tìm kiếm (`q`) | Search Input (trên thanh toàn cục) | Tùy chọn | Tối đa 100 ký tự; tìm theo tên sản phẩm, thương hiệu (`pg_trgm`) và tên đơn vị cung cấp nhận đặt hàng (AC-14.5) | `Tìm bánh nướng, đậu xanh, tên thương hiệu hoặc đơn vị cung cấp…` |
| 2 | Vỏ bánh (`crust`) | Checkbox Group (chọn nhiều) | Tùy chọn | Lấy các giá trị đang hiện (`active = true`) từ `GET /api/cake-attributes?group=CRUST` theo `sort_order` (AC-06.6). Danh mục ban đầu (A-19): `Bánh nướng`, `Bánh dẻo`, `Bánh lạnh`, `Khác`. Chọn nhiều = toán tử `HOẶC` | Không chọn mặc định |
| 3 | Nhân bánh (`filling`) | Checkbox Group (chọn nhiều) | Tùy chọn | Lấy từ `GET /api/cake-attributes?group=FILLING` theo `sort_order`. Danh mục ban đầu (A-19): `Thập cẩm`, `Đậu xanh`, `Hạt sen`, `Đậu đỏ`, `Khoai môn`, `Trà xanh`, `Sầu riêng`, `Trứng muối`, `Khác`. Chọn nhiều = `HOẶC` | Không chọn mặc định |
| 4 | Khoảng giá (`minPrice`, `maxPrice`) | 2 ô Currency Input (`Từ` – `Đến`) + nút `Áp dụng` | Tùy chọn | Số nguyên VND `≥ 0`; `minPrice ≤ maxPrice` | `Từ (đ)` – `Đến (đ)` |
| 5 | Thương hiệu (`brand`) | Checkbox Group + ô lọc nhanh | Tùy chọn | Sinh từ `facets` của kết quả đang bán (mọi sản phẩm đều có `brand` theo BR-12). Chọn nhiều = `HOẶC` | Không chọn mặc định |
| 6 | Shop (`vendorId`) | Checkbox Group + ô lọc nhanh | Tùy chọn | Chỉ liệt kê người bán có bật Shop (`sells_shop = true`, AC-06.4). Chọn nhiều = `HOẶC` | Không chọn mặc định |
| 7 | Sắp xếp (`sort`) | Dropdown | Bắt buộc | `Mới nhất` (mặc định) · `Giá: Thấp đến cao` · `Giá: Cao đến thấp` · `Đánh giá cao nhất` (AC-06.3) | Chọn sẵn `Mới nhất` |

### 15.2 Bộ nội dung văn bản (Microcopy)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **H1** | Mua hàng có sẵn |
| **Sub-heading** | Hiển thị các sản phẩm còn tồn kho, giao được tới **Thành phố Hồ Chí Minh** *(nút `Đổi khu vực` → M1.1)*. Giá hiển thị đã gồm thuế GTGT. |
| **Khối "Đơn vị cung cấp" tách riêng (chỉ hiện khi từ khóa `q` khớp tên đơn vị nhận đặt hàng – AC-14.5)** | Tiêu đề khối: **Đơn vị cung cấp nhận đặt hàng khớp từ khóa "{q}"** · Phụ đề: `Các đơn vị dưới đây nhận đặt hàng theo yêu cầu (không giới hạn vùng giao).` · Thẻ đơn vị: **Hộ kinh doanh Xưởng Bánh Cô Hoa** · Badge `Chỉ nhận đặt hàng` *(nếu `sells_shop = false`)* · `Nhận đặt từ 50 hộp` · Nút: `Xem hồ sơ` *(→ M3.3)* · `Gửi yêu cầu` *(→ M3.4, ẩn nếu là chủ đơn vị)* |
| **Thẻ sản phẩm trong danh sách (AC-06.5)** | Ảnh sản phẩm · Tên sản phẩm · Thương hiệu: `Kinh Đô` · Shop: `DNTN Bánh Trung Thu Trăng Vàng` · Giá: `145.000đ` · Điểm đánh giá: `★ 4.8 (12)` · Nhãn giao: `Giao nội thành` / `Giao toàn quốc` · Badge `Sản phẩm của bạn` *(nếu người xem là chủ Shop)* |
| **Primary / Secondary CTA của bộ lọc** | `Áp dụng khoảng giá` · `Xóa tất cả bộ lọc` |

### 15.3 Các trạng thái đặc biệt

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|
| **Lỗi khoảng giá** | Nhập `Giá từ` lớn hơn `Giá đến` | `Giá tối thiểu không được lớn hơn giá tối đa` |
| **Trạng thái trống (Không có sản phẩm khớp – FR-06)** | Danh sách sản phẩm trả về 0 kết quả | Tiêu đề: **Không tìm thấy sản phẩm có sẵn phù hợp** · Mô tả: `Chưa có sản phẩm nào tại khu vực Thành phố Hồ Chí Minh khớp với từ khóa và bộ lọc bạn đang chọn. Bạn hãy thử bỏ bớt bộ lọc, hoặc tạo yêu cầu báo giá nếu cần đặt bánh theo yêu cầu.` · CTA chính: `Xóa bộ lọc` · CTA phụ: `Tạo yêu cầu báo giá` *(→ M3.1)* |

---

## 16. M2.1 Chi tiết sản phẩm · `/san-pham/:productId` (+ Tương tác số lượng ở Giỏ hàng M4.0)

### 16.1 Bảng cấu trúc dữ liệu (Data Fields – hiển thị & nhập số lượng, FR-07, FR-08)

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Số lượng mua (`quantity`) | Number Input + nút `−`/`+` | Bắt buộc khi bấm Thêm vào giỏ / Mua ngay | Số nguyên `≥ 1`. Nếu nhập `> stock` hoặc `≥ quote_threshold` thì kích hoạt luồng đề nghị gửi yêu cầu (AC-08.2) | Mặc định `1` |

Các trường thông tin bắt buộc hiển thị trên M2.1 (Read-only – AC-07.1, AC-07.2, AC-07.3):
- **Tên sản phẩm:** `Hộp quà Trăng Vàng Đoàn Viên – 4 bánh nướng 150g`
- **Giá niêm yết:** `320.000đ / hộp` *(ghi chú ngay dưới giá: `Đã gồm thuế GTGT`)*
- **Bảng bậc giá theo số lượng (`qty_price_tiers`, nếu có):** `Từ 1–9 hộp: 320.000đ/hộp` · `Từ 10–29 hộp: 300.000đ/hộp` · `Từ 30–49 hộp: 285.000đ/hộp`
- **Thuộc tính bánh:** Vỏ bánh: `Bánh nướng` · Nhân bánh: `Thập cẩm, Hạt sen, Trứng muối` *(vẫn hiển thị cả giá trị đã bị quản trị ẩn sau này theo AC-54.4)* · Số bánh mỗi hộp: `4 bánh` · Hạn dùng: `15/11/2026`
- **Xuất xứ:** Thương hiệu: `Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng` · Nơi sản xuất: *(bắt buộc hiện nếu là hàng bán lại – BR-12)*
- **Tồn kho & Vận chuyển:** Tồn kho có sẵn: `85 hộp` · Nhãn giao: `Giao toàn quốc` · Phí giao tới **Thành phố Hồ Chí Minh**: `30.000đ/đơn` (Nội thành)

### 16.2 Bộ nội dung văn bản (Microcopy)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **Primary CTA** | `Thêm vào giỏ hàng` |
| **Secondary CTA** | `Mua ngay` *(thêm vào giỏ và chuyển thẳng tới M4.0)* · `Gửi yêu cầu cho Shop này` *(→ M3.4, chỉ hiện khi Shop có `accepts_orders = true` và người xem không phải chủ Shop)* |
| **Helper text dưới ô Số lượng (khi Shop có nhận đặt hàng)** | `Cần đặt từ {quote_threshold} hộp trở lên hoặc cần in logo lên túi, thiệp, hộp? Hãy gửi yêu cầu để nhận báo giá riêng.` |

### 16.3 Các trạng thái đặc biệt (M2.1 & Giỏ hàng M4.0)

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|
| **Chủ Shop tự xem sản phẩm của mình (AC-07.4, BR-22)** | Tài khoản đang đăng nhập là `owner_account_id` của Shop | Hiển thị badge nổi bật: **Sản phẩm của bạn** · **Ẩn hoàn toàn** ô chọn số lượng, nút `Thêm vào giỏ hàng`, `Mua ngay` và `Gửi yêu cầu cho Shop này`. Hiện dòng ghi chú: `Đây là sản phẩm thuộc Shop của bạn. Bạn không thể tự mua hoặc gửi yêu cầu cho sản phẩm của chính mình.` kèm liên kết `Sửa sản phẩm trong Kênh người bán` *(→ B4.1)*. |
| **Hết hàng tạm thời (`stock = 0`, AC-30.1)** | Sản phẩm có tồn kho bằng 0 | Badge: **Tạm hết hàng có sẵn** · Vô hiệu hóa nút `Thêm vào giỏ hàng` và `Mua ngay`. Nếu Shop có `accepts_orders = true`, hiện gợi ý: `Sản phẩm hiện đã hết hàng có sẵn. Bạn có thể gửi yêu cầu đặt hàng để Shop sản xuất hoặc chuẩn bị đợt mới.` kèm nút `Gửi yêu cầu cho Shop này` *(→ M3.4)*. |
| **Vượt tồn kho hoặc đạt ngưỡng báo giá – Shop CÓ nhận đặt hàng (AC-08.2)** | Người mua nhập `quantity > stock` hoặc `quantity ≥ quote_threshold` (tại M2.1 hoặc khi tăng số lượng trong Giỏ hàng M4.0) | Hộp thoại / Banner đề xuất: **Chuyển sang gửi yêu cầu đặt hàng cho số lượng {quantity} hộp?** · Nội dung: `Số lượng {quantity} hộp vượt mức mua ngay có sẵn của sản phẩm (tối đa mua ngay: {max_buy_now} hộp). Bạn có muốn chuyển sang gửi yêu cầu trực tiếp cho {tên_Shop} để nhận báo giá cho {quantity} hộp không?` · CTA chính: `Gửi yêu cầu {quantity} hộp` *(→ M3.4, điền sẵn sản phẩm và số lượng)* · CTA phụ: `Giữ mức tối đa {max_buy_now} hộp` |
| **Vượt tồn kho – Shop KHÔNG nhận đặt hàng (FR-08)** | Người mua nhập `quantity > stock` nhưng Shop có `accepts_orders = false` | Lỗi dưới ô số lượng: `Shop chỉ còn tối đa {stock} hộp có sẵn và không nhận đặt hàng theo yêu cầu.` |
| **Trạng thái trống Giỏ hàng (M4.0)** | Giỏ hàng chưa có sản phẩm nào | Tiêu đề: **Giỏ hàng của bạn đang trống** · Mô tả: `Khám phá các loại bánh Trung thu có sẵn giao tới khu vực của bạn.` · CTA: `Xem sản phẩm có sẵn` *(→ M2.0)* |

---

## 17. B4.0 Danh sách sản phẩm & B4.1 Thêm / sửa sản phẩm (Kênh người bán) · `/kenh-ban/san-pham`

> [!IMPORTANT]
> - Theo **BR-24 & AC-34.6**: Sản phẩm mới đăng hoặc sửa **hiển thị ngay**, không qua duyệt của quản trị. **Không có thao tác xóa sản phẩm**; ngừng bán thì chuyển sang `Đang ẩn` (`HIDDEN`).
> - Sản phẩm bị quản trị gỡ (`REMOVED`) chỉ xem được ở B4.1 kèm lý do gỡ, người bán không sửa và không hiện lại được (AC-34.5).

### 17.1 Màn hình danh sách B4.0 (`/kenh-ban/san-pham`)

- **H1:** Sản phẩm của Shop · **Primary CTA:** `+ Đăng sản phẩm mới` *(→ B4.1)*
- **3 Tab trạng thái:** `Đang bán ({n})` (`ON_SALE`) · `Đang ẩn ({n})` (`HIDDEN`) · `Bị gỡ ({n})` (`REMOVED`)
- **Thao tác trên từng dòng sản phẩm:**
  - Tab `Đang bán`: `Sửa` *(→ B4.1)* · `Ẩn sản phẩm` *(đổi sang `HIDDEN`, Toast: `Đã ẩn sản phẩm "{tên}". Sản phẩm không còn hiển thị ở trang mua hàng.`)*
  - Tab `Đang ẩn`: `Sửa` *(→ B4.1)* · `Hiện bán lại` *(kiểm đủ trường bắt buộc theo AC-34.4 rồi đổi sang `ON_SALE`, Toast: `Đã mở bán lại sản phẩm "{tên}".`)*
  - Tab `Bị gỡ`: `Xem chi tiết` *(→ B4.1 ở chế độ chỉ đọc)* · Hiển thị dòng chữ đỏ dưới tên sản phẩm: `Lý do quản trị gỡ: {removed_reason}`
- **Trạng thái trống B4.0:**
  - Tab `Đang bán` trống: Tiêu đề: **Shop chưa có sản phẩm nào đang bán** · Mô tả: `Đăng sản phẩm có sẵn trong kho để người mua tại khu vực giao hàng của bạn có thể đặt mua ngay.` · CTA: `+ Đăng sản phẩm đầu tiên`

### 17.2 Bảng cấu trúc dữ liệu B4.1 – Thêm / sửa sản phẩm (`/kenh-ban/san-pham/:productId`)

Khớp với `CreateProductRequest.java`, `PriceTierRequest.java`, `V2026_10_22_1500__cake_attributes_and_product_brand.sql` và FR-29 → FR-33:

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Tên sản phẩm (`name`) | Text Input | Bắt buộc | 1–255 ký tự (`@Size(max = 255)`) | `Ví dụ: Hộp quà Trăng Vàng Đoàn Viên – 4 bánh nướng 150g` |
| 2 | Ảnh sản phẩm (`imageKeys`) | Multi-Image Upload (kéo thả đổi vị trí; ảnh đầu là ảnh đại diện) | Bắt buộc | Từ `1` đến `10` ảnh (`@NotEmpty`, `@Size(max = 10)`); JPG, PNG; dung lượng theo cấu hình hệ thống | `+ Tải ảnh sản phẩm (1–10 ảnh)` |
| 3 | Mô tả sản phẩm (`description`) | Textarea + bộ đếm ký tự | Bắt buộc | 1–5.000 ký tự (`@Size(max = 5000)`) | `Mô tả thành phần từng bánh, khối lượng tịnh, quy cách hộp quà và hướng dẫn bảo quản…` |
| 4 | Vỏ bánh (`crustCodes`) | Checkbox Group / Multi-select Chips | Bắt buộc (chọn `≥ 1` – BR-34) | Lấy từ danh mục `CRUST` đang hiện (`GET /api/cake-attributes?group=CRUST`). Nếu sửa sản phẩm đang gắn một giá trị đã bị quản trị ẩn, giá trị đó vẫn hiện kèm nhãn `(đã ngừng dùng)` – bỏ chọn thì không chọn lại được (AC-33.6) | Chọn ít nhất 1 vỏ bánh |
| 5 | Nhân bánh (`fillingCodes`) | Checkbox Group / Multi-select Chips | Bắt buộc (chọn `≥ 1` – BR-34) | Lấy từ danh mục `FILLING` đang hiện (`GET /api/cake-attributes?group=FILLING`). Hộp nhiều bánh chọn đủ các nhân có trong hộp (ví dụ `Đậu xanh` + `Trứng muối`) | Chọn ít nhất 1 nhân bánh |
| 6 | Số bánh mỗi hộp (`piecesPerBox`) | Number Input | Tùy chọn | Số nguyên `> 0` (`@Positive`) | `Ví dụ: 4` |
| 7 | Thương hiệu (`brand`) | Text Input | **Bắt buộc** nếu nguồn hàng của Shop là `Bán lại` (`RESELL` – AC-29.2); **Tùy chọn** nếu `Tự sản xuất` hoặc `Cả hai` (để trống hệ thống tự lấy `business_name` của đơn vị – AC-29.4) | Tối đa 100 ký tự (`@Size(max = 100)`) | Nếu Tự sản xuất/Cả hai: `Để trống sẽ lấy tên đơn vị: {business_name}` · Nếu Bán lại: `Ví dụ: Kinh Đô, Như Lan` |
| 8 | Nơi sản xuất (`origin`) | Text Input | **Bắt buộc** nếu nguồn hàng là `Bán lại` (BR-12, AC-29.2); tùy chọn với loại khác | Tối đa 255 ký tự (`@Size(max = 255)`) | `Ví dụ: Công ty CP Mondelez Kinh Đô, KCN VSIP, Bình Dương` |
| 9 | Giá niêm yết (`listPrice`) | Currency Input (hậu tố `đ`) | Bắt buộc | Số nguyên VND `> 0` (`@Positive`), đã bao gồm thuế GTGT (BR-06) | `Ví dụ: 320.000` |
| 10 | Số lượng tồn kho (`stock`) | Number Input | Bắt buộc | Số nguyên `≥ 0` (`@PositiveOrZero`). Đặt về `0` thì người mua không mua ngay được (AC-30.1) | `Ví dụ: 85` |
| 11 | Hạn sử dụng (`expiryDate`) | Datepicker | Bắt buộc | `DD/MM/YYYY`; từ ngày hôm nay trở đi (`@FutureOrPresent`) | `DD/MM/YYYY` |
| 12 | Nhãn giao hàng (`deliveryLabel`) | Radio Group + Checkbox xác nhận đóng gói | Bắt buộc | - `Giao nội thành` (`LOCAL` – chỉ hiện cho người mua thuộc vùng giao đã khai ở B6.2)<br>- `Giao toàn quốc` (`NATIONWIDE` – hiện toàn quốc, kèm Checkbox bắt buộc xác nhận đạt chuẩn đóng gói theo giá trị tạm Q-11) | Chọn sẵn `Giao nội thành` |
| 13 | Bậc giá giảm theo số lượng (`priceTiers`) | Bảng dòng động (`+ Thêm bậc giá`, nút `Xóa dòng`) | Tùy chọn (FR-31) | Mỗi dòng gồm: `Số lượng từ (hộp)` (`fromQty ≥ 2`) và `Đơn giá (đ/hộp)` (`unitPrice > 0`). Các bậc không được trùng `fromQty` | Dòng mẫu: Từ `10` hộp → Đơn giá `300.000`đ |
| 14 | Ngưỡng chuyển sang báo giá (`quoteThreshold`) | Number Input | Tùy chọn *(chỉ hiện khi người bán có bật `Nhận đặt hàng` – AC-31.2, AC-31.3)* | Số nguyên `≥ 2` (`@Min(2)`). Người mua nhập từ mức này trở lên sẽ được chuyển sang gửi yêu cầu báo giá | `Ví dụ: 50 (để trống nếu không giới hạn)` |

### 17.3 Bộ nội dung văn bản (Microcopy – B4.1)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **H1** | Đăng sản phẩm mới *(hoặc: `Sửa thông tin sản phẩm` / `Chi tiết sản phẩm đã bị gỡ`)* |
| **Sub-heading** | Sản phẩm sau khi lưu sẽ hiển thị ngay trên kênh mua hàng mà không cần chờ duyệt (BR-24). |
| **Primary CTA** | `Đăng bán sản phẩm` *(khi thêm mới)* / `Lưu thay đổi` *(khi sửa)* |
| **Secondary CTA** | `Lưu và tạm ẩn` *(lưu với trạng thái `HIDDEN`)* · `Hủy` *(→ B4.0)* |
| **Helper text – Vỏ & Nhân bánh** | `Nếu là hộp quà gồm nhiều bánh khác nhau, hãy chọn tất cả loại vỏ và nhân có trong hộp để người mua tìm thấy khi lọc.` |
| **Helper text – Thương hiệu (khi Shop tự sản xuất / cả hai)** | `Hàng tự sản xuất mang thương hiệu của chính đơn vị bạn. Nếu để trống, hệ thống tự điền "{business_name}".` |
| **Nhãn Checkbox xác nhận đóng gói (khi chọn `Giao toàn quốc` – Q-11)** | `Tôi xác nhận sản phẩm có hộp cứng chống móp, túi hút ẩm/hút chân không từng bánh và đủ điều kiện vận chuyển liên tỉnh dài ngày.` |
| **Disclaimer** | `Thay đổi giá bán hoặc tồn kho tại đây không làm thay đổi số tiền của các đơn hàng đã được thanh toán trước đó (BR-19).` |

### 17.4 Các trạng thái đặc biệt (B4.1 – khớp message trong `CreateProductRequest` & `ProductServiceImpl`)

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|
| **Chế độ chỉ đọc khi sản phẩm Bị gỡ (AC-33, BR-24)** | `product.status = REMOVED` | Banner đỏ đầu trang: **Sản phẩm đã bị quản trị viên gỡ – Chỉ xem** · Nội dung: `Lý do gỡ: {removed_reason}. Theo quy định của nền tảng, sản phẩm đã bị gỡ không thể chỉnh sửa và không thể mở bán lại.` *(Mọi trường input đều `disabled`, ẩn nút Lưu)*. |
| **Lỗi trường #1–#3** | Trống hoặc quá ký tự | `Tên sản phẩm không được để trống` (`tối đa 255 ký tự`) / `Cần ít nhất 1 ảnh` (`Tối đa 10 ảnh`) / `Mô tả không được để trống` (`tối đa 5000 ký tự`) |
| **Lỗi trường #4–#5** | Chưa chọn đủ vỏ hoặc nhân (BR-34) | `Vui lòng chọn ít nhất 1 loại vỏ bánh` / `Vui lòng chọn ít nhất 1 loại nhân bánh` |
| **Lỗi trường #7–#8 (Shop thuần bán lại)** | `supply_source = RESELL` mà để trống thương hiệu hoặc nơi sản xuất (AC-29.2) | `Sản phẩm bán lại bắt buộc có thương hiệu và nơi sản xuất` |
| **Lỗi trường #9–#11** | Giá, tồn kho, hạn dùng không hợp lệ | `Giá niêm yết phải lớn hơn 0` / `Tồn kho không được âm` / `Hạn dùng không được ở quá khứ` |
| **Lỗi trường #13 (Bậc giá)** | Nhập `fromQty < 2` hoặc trùng 2 dòng cùng mức số lượng | `Bậc giá bắt đầu từ 2 hộp trở lên` / `Bậc giá bị trùng số lượng từ {fromQty}` |
| **Lỗi trường #14 (Ngưỡng báo giá)** | Nhập `< 2` | `Ngưỡng báo giá phải từ 2 trở lên` |
| **Thành công** | Lưu thành công | Quay về B4.0, hiện Toast: `Đã đăng bán sản phẩm "{name}".` *(hoặc `Đã cập nhật thông tin sản phẩm.`)* |

---

## 18. Q3.0 Sản phẩm (Quản trị gỡ vi phạm) & Q6.4 Vỏ và nhân bánh (Quản trị danh mục)

### 18.1 Q3.0 Quản trị sản phẩm · `/quan-tri/san-pham` (FR-46, BR-24)

- **H1:** Quản lý sản phẩm trên nền tảng · **Sub-heading:** `Tìm kiếm, kiểm tra hậu kiểm và gỡ các sản phẩm vi phạm quy định an toàn thực phẩm, nhãn mác hoặc tiêu chuẩn đóng gói.`
- **Bộ lọc & Tìm kiếm:** Ô tìm kiếm theo tên sản phẩm / thương hiệu · Dropdown lọc theo `Shop` · Dropdown lọc theo `Trạng thái` (`Tất cả`, `Đang bán`, `Đang ẩn`, `Bị gỡ`).
- **Hộp thoại `Gỡ sản phẩm vi phạm` (khi bấm nút `Gỡ sản phẩm` trên một dòng đang bán/đang ẩn):**

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Lý do gỡ sản phẩm (`removedReason`) | Textarea | **Bắt buộc** (`ck_products_removed`, AC-46.2) | 10–1.000 ký tự | `Ví dụ: Sản phẩm bánh bán lại nhưng không ghi đúng nơi sản xuất trên bao bì; hoặc không đạt tiêu chuẩn đóng gói giao toàn quốc.` |

- **Microcopy hộp thoại Q3.0:**
  - **Tiêu đề:** Gỡ sản phẩm "{tên_sản_phẩm}"?
  - **Disclaimer:** `Sau khi gỡ, sản phẩm sẽ biến mất khỏi kênh mua hàng, tự động bị loại khỏi giỏ hàng của người mua khi thanh toán, và người bán không thể tự sửa hay mở bán lại (BR-24). Thao tác được ghi vào nhật ký hệ thống (NFR-07).`
  - **Primary CTA (Đỏ):** `Xác nhận gỡ sản phẩm` · **Secondary CTA:** `Hủy`
  - **Lỗi trường:** `Vui lòng nhập lý do gỡ sản phẩm (tối thiểu 10 ký tự)`
  - **Thành công (Toast):** `Đã gỡ sản phẩm "{tên_sản_phẩm}" và gửi thông báo cho người bán.`

---

### 18.2 Q6.4 Quản trị danh mục Vỏ và nhân bánh · `/quan-tri/cau-hinh/vo-nhan` (FR-54, BR-34)

> [!NOTE] Danh mục gồm 2 nhóm cố định (`Vỏ bánh` – `CRUST`, `Nhân bánh` – `FILLING`). Không có thao tác xóa (`AC-54.4`), chỉ có `Ẩn` / `Hiện lại`, và **không được ẩn giá trị đang hiện cuối cùng của một nhóm** (`AC-54.5`).

#### Bảng cấu trúc dữ liệu (Data Fields – khớp bảng `cake_attributes` & `/api/cake-attributes`)

| # | Tên trường | Loại thành phần UI | Tính chất | Định dạng & Giới hạn ký tự | Placeholder / Gợi ý mặc định |
|---|---|---|---|---|---|
| 1 | Nhóm thuộc tính (`attributeGroup`) | 2 Tab chuyển đổi | Bắt buộc | Tab 1: `Vỏ bánh (CRUST)` · Tab 2: `Nhân bánh (FILLING)` | Mở sẵn tab `Vỏ bánh` |
| 2 | Tên hiển thị mới (`label`) – Khung thêm nhanh | Text Input + nút `+ Thêm vào nhóm` | Bắt buộc khi thêm | 1–100 ký tự (`varchar(100)`, `btrim(label) <> ''`). Máy chủ tự sinh `code` (chữ thường, không dấu, nối bằng gạch ngang, ví dụ `Bánh tuyết` → `banh-tuyet`) và kiểm trùng qua `label_key` (AC-54.1, AC-54.2) | Tab Vỏ: `Ví dụ: Bánh ngàn lớp` · Tab Nhân: `Ví dụ: Phô mai chảy` |
| 3 | Đổi tên hiển thị (`label`) – Sửa tại dòng | Inline Text Input / Hộp thoại sửa tên | Bắt buộc khi sửa | 1–100 ký tự. Khi đổi tên, `code` giữ nguyên (`banh-lanh`) và mọi sản phẩm đã gắn tự hiện tên mới (AC-54.3) | Điền sẵn tên hiện tại |
| 4 | Thứ tự hiển thị (`sortOrder`) | Tay nắm kéo thả (`Drag handle ⋮⋮`) hoặc nút `Lên`/`Xuống` | Bắt buộc | Số nguyên; thứ tự này quyết định thứ tự trong bộ lọc M2.0 của người mua và form B4.1 / B6.3 của người bán (AC-54.6) | Giá trị `Khác` (`sort_order = 99`) luôn gợi ý để cuối |
| 5 | Trạng thái hiển thị (`active`) | Toggle Switch / Nút `Ẩn` · `Hiện lại` | Bắt buộc | `Đang hiện` (`active = true`) hoặc `Đã ẩn` (`active = false`) | Mặc định khi tạo mới: `Đang hiện` |

#### Bộ nội dung văn bản (Microcopy – Q6.4)

| Thành phần | Nội dung hiển thị thực tế |
|---|---|
| **H1** | Danh mục Vỏ và nhân bánh |
| **Sub-heading** | Quản lý các giá trị phân loại bánh dùng chung cho bộ lọc mua hàng (M2.0), form đăng sản phẩm (B4.1) và điều kiện nhận đặt hàng (B6.3). |
| **Cột trong bảng danh sách** | `Thứ tự (⋮⋮)` · `Tên hiển thị (label)` · `Mã hệ thống (code – chỉ đọc)` · `Trạng thái (Đang hiện / Đã ẩn)` · `Thao tác (Đổi tên · Ẩn / Hiện lại)` |
| **Primary CTA (Thêm mới)** | `+ Thêm giá trị` |
| **Helper text** | `Mã hệ thống (ví dụ: banh-nuong, dau-xanh) được tạo tự động một lần và không thay đổi khi bạn đổi tên hiển thị. Không có chức năng xóa để bảo toàn dữ liệu các sản phẩm đã đăng.` |

#### Các trạng thái đặc biệt (Q6.4)

| Trạng thái | Điều kiện kích hoạt | Nội dung văn bản cụ thể |
|---|---|---|
| **Lỗi trường #2 / #3 (Trống)** | Bấm thêm hoặc lưu tên khi ô trống | `Tên hiển thị không được để trống` (`tối đa 100 ký tự`) |
| **Lỗi trùng tên trong cùng nhóm (HTTP 409 – AC-54.2)** | Nhập tên trùng với một giá trị đã có (kể cả giá trị đang ẩn) sau khi bỏ dấu, viết thường, gộp khoảng trắng | `Giá trị "{label}" bị trùng với "{existing_label}" (mã: {code}) đã có trong nhóm này. Nếu giá trị đó đang ẩn, bạn có thể bấm "Hiện lại".` |
| **Lỗi chặn ẩn giá trị cuối cùng (HTTP 409 – AC-54.5)** | Nhóm chỉ còn 1 giá trị `Đang hiện` mà quản trị bấm `Ẩn` | `Không thể ẩn "{label}" vì đây là giá trị đang hiển thị cuối cùng của nhóm {Vỏ bánh / Nhân bánh}. Mỗi nhóm phải có ít nhất 1 giá trị đang hiện.` |
| **Thành công (Toast)** | Thêm / Đổi tên / Đổi thứ tự / Ẩn / Hiện lại | - Thêm: `Đã thêm "{label}" (mã: {code}) vào cuối nhóm.`<br>- Đổi tên: `Đã đổi tên thành "{label}". Mọi sản phẩm đang gắn mã "{code}" đã được cập nhật tên hiển thị mới.`<br>- Đổi thứ tự: `Đã lưu thứ tự hiển thị mới.`<br>- Ẩn: `Đã ẩn "{label}" khỏi bộ lọc và danh sách chọn mới. Các sản phẩm đã gắn trước đó vẫn giữ nguyên.`<br>- Hiện lại: `Đã hiện lại "{label}" trong danh sách chọn và bộ lọc.` |

---

## 19. Bảng tổng hợp các điểm rà soát cần lưu ý khi chuyển sang Mid-fi & Code

| # | Điểm phát hiện khi rà soát | Hiện trạng trong tài liệu / code | Cách xử lý trong bản Mid-fi này |
|---|---|---|---|
| 1 | **Dữ liệu mẫu lệch với Seed** | Bản nháp đầu dùng tên tự đặt (`Trần Thị Lan`, `Xưởng bánh Cô Hoa`) | Đã chuẩn hóa toàn bộ mục 0.1 và các ví dụ theo đúng `docs/guides/database.md`, `R__seed.sql` và `nfc-profiles.json` (`Nguyễn Thị Lan – member1@mk.com`, `Trần Văn Minh – member2@mk.com`, `DNTN Bánh Trung Thu Trăng Vàng`, `Hộ kinh doanh Bánh Quê`) |
| 2 | **Dung lượng ảnh sản phẩm (NFR-08 vs `application.yml`)** | NFR-08 đề xuất `≤ 20 MB/file`, nhưng `catalog-service/src/main/resources/application.yml` đang đặt `PRODUCT_IMAGE_MAX_SIZE: 5MB` | Giữ `20 MB` trên thông báo UI theo NFR-08; backend cần đổi cấu hình khi chuyển phần ghi sản phẩm sang `vendor-service` (L-18) |
| 3 | **Đồng bộ code Sản phẩm theo quyết định L-18 & L-19** | Migration SQL V2 của `vendor-service` và `catalog-service` đã chuyển bảng `products` sang `vendor_db` và thay `cake_type` bằng `crust_codes`/`filling_codes`, nhưng class Java `Product.java` và `CreateProductRequest.java` ở `catalog-service` vẫn còn trường `cakeType` và `deleted` | Đặc tả Mid-fi của M2.0, M2.1, B4.0, B4.1, Q3.0, Q6.4 đã viết theo **thiết kế mới đã chốt** (`crustCodes`, `fillingCodes`, `brand` mặc định `business_name`, không có nút xóa) |
| 4 | **Nhãn trang M6.4 trên Web** | `web/src/strings.ts` đang ghi `Xác minh CCCD`, trong khi IA chốt nhãn điều hướng là `Xác minh danh tính` | Dùng thống nhất nhãn **Xác minh danh tính** trên Mid-fi theo IA |
| 5 | **Trạng thái khiếu nại cần xử lý tay (IA điểm #18)** | Bảng `disputes` trong `order_db` chỉ có `status IN ('OPEN', 'RESOLVED')`; lỗi hoàn tiền VNPay nằm ở bảng `refunds` (`MANUAL_REQUIRED`) của `payment_db` | Trên màn hình của người mua (M6.1.3) chỉ hiển thị `Đang mở` và `Đã quyết định`; tab `Cần xử lý tay` chỉ nằm ở màn hình quản trị Q5.0 |

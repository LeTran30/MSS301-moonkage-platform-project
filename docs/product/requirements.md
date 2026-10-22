# REQUIREMENT: Moonkage – Marketplace quà Trung thu

> **Hướng dẫn cho AI đọc tài liệu này**
> - Đây là nguồn sự thật (source of truth) cho dự án. Chỉ làm những gì được mô tả ở đây.
> - Không tự thêm tính năng ngoài phạm vi. Mục "Out of scope" là ràng buộc cứng.
> - Nếu gặp điểm mơ hồ, mâu thuẫn hoặc thiếu thông tin: **dừng lại và hỏi**, đừng tự giả định. Nếu buộc phải giả định, ghi rõ giả định đó vào phần trả lời.
> - Mỗi yêu cầu có mã ID (FR-xx, NFR-xx, BR-xx, ...). Khi trả lời hoặc viết code, hãy tham chiếu ID tương ứng.
> - Một yêu cầu chỉ được coi là "xong" khi thỏa mãn toàn bộ Acceptance Criteria của nó.
> - Tài liệu gốc: `docs/product/context.md` (bối cảnh) và `docs/product/user-stories.md` (user story). Chuỗi tài liệu: Context → User Stories → Requirement → Design. Requirement được sinh từ hai tài liệu gốc; FR-xx đánh số trùng với US-xx để truy vết một-một, liên tục theo thứ tự trong tài liệu.
> - Khi phát hiện một nhu cầu chưa có trong User Stories hoặc Context: không tự thêm FR; bổ sung từ trên xuống (Context → User Stories → Requirement).

---

## 0. Thông tin tài liệu

| Mục | Giá trị |
|---|---|
| Phiên bản | v1.6 |
| Ngày cập nhật | 2026-10-17 |
| Người viết | |
| Người phê duyệt (quyết định cuối) | |
| Trạng thái | Draft |

---

## 1. Bối cảnh & vấn đề

**Vấn đề hiện tại:**

Bánh Trung thu là hàng mùa vụ, nhu cầu dồn vào 6–8 tuần trước rằm tháng Tám. Thị trường có ba nhóm người mua (người mua phổ thông, hộ kinh doanh, doanh nghiệp) và ba kiểu người bán (thương hiệu lớn, xưởng vừa và nhỏ, tiệm bánh/đại lý). Các bên đang gặp:

- **Doanh nghiệp đặt quà custom mất nhiều công sức:** người phụ trách (HR, admin) tự tìm xưởng, nhắn Zalo từng nơi, nhận báo giá rời rạc không cùng định dạng, không biết trước xưởng nào in được logo, số lượng tối thiểu và thời gian; maket gửi qua tin nhắn dễ nhầm phiên bản; không biết tiến độ sản xuất nếu không gọi hỏi.
- **Xưởng nhỏ khó tiếp cận đơn lớn:** có năng lực nhưng không có đội sales; đơn đến rời rạc, dồn vào tuần cuối trong khi tháng Bảy vắng; báo giá tính tay.
- **Người mua phổ thông mất thời gian chọn bánh:** phải vào từng trang riêng, mỗi nơi một cách đặt và thanh toán.
- **Hộ kinh doanh khó tìm nguồn sỉ ổn định:** hỏi giá từng hãng, từng đại lý, mỗi nơi một chính sách, khó so biên lợi nhuận và khó nhập thêm giữa mùa.
- **Tiệm bánh nhỏ khó bán online:** chỉ bán qua Facebook, Zalo, chưa có giỏ hàng, thanh toán, quản lý đơn.

**Phạm vi thời gian:**

Thị trường bánh Trung thu theo mùa, nhưng dự án không mô hình hóa mùa vụ (Context mục 9): nền tảng xử lý mọi thời điểm như nhau, không có hạn chót của mùa và không xử lý riêng cho cao điểm. Deadline và ngân sách của dự án: Q-16.

---

## 2. Mục tiêu & chỉ số thành công

Chỉ tiêu định lượng chưa được nhóm chốt (Q-16). Cột "Chỉ tiêu" để trống có chủ đích.

| ID | Mục tiêu | Cách đo | Chỉ tiêu |
|---|---|---|---|
| G-01 | Doanh nghiệp so sánh và chốt báo giá custom trên một nơi, không cần nhắn từng xưởng | Thời gian từ lúc tạo yêu cầu mở đến lúc chấp nhận báo giá; số báo giá nhận được trên mỗi yêu cầu mở | Chưa chốt |
| G-02 | Xưởng có đơn số lượng lớn từ doanh nghiệp và hộ kinh doanh | Số đơn đặt hàng/xưởng | Chưa chốt |
| G-03 | Người mua phổ thông mua được từ nhiều Shop | Tỷ lệ chuyển đổi xem → mua ngay; số lần thanh toán tạo đơn của ≥ 2 Shop | Chưa chốt |
| G-04 | Hộ kinh doanh tìm được nguồn sỉ và nhập lại được nhiều đợt | Số người mua có ≥ 2 đơn đặt hàng; số lần dùng "Đặt lại từ đơn cũ" | Chưa chốt |
| G-05 | Tiệm bánh nhỏ có kênh bán online đầy đủ | Số Shop được duyệt và có ≥ 1 đơn mua ngay hoàn tất | Chưa chốt |
| G-06 | Giao dịch an toàn cho cả hai bên | Tỷ lệ đơn có khiếu nại; tỷ lệ khiếu nại xử lý xong trong thời hạn | Chưa chốt |

---

## 3. Người dùng & stakeholder

Nền tảng chỉ có một loại tài khoản phía mua, đại diện cho một con người. Vai mua/bán gắn với từng giao dịch, không gắn với con người. 

| Vai trò | Mô tả | Nhu cầu chính |
|---|---|---|
| Khách (Guest) | Người chưa đăng nhập | Xem sản phẩm giao được tới khu vực đã chọn |
| Người mua – cho mình | Bất kỳ ai có tài khoản: hộ gia đình, người gom đơn, cộng tác viên | So sánh, mua ngay; đặt hàng qua báo giá khi mua nhiều |
| Người mua – thay doanh nghiệp | HR, admin, thư ký; chủ hộ kinh doanh, chủ tiệm. Cùng loại tài khoản | Yêu cầu mở, so sánh và xuất báo giá, duyệt maket, theo dõi tiến độ, hóa đơn ghi thông tin doanh nghiệp |
| Người bán – Shop | Tiệm bánh, thương hiệu, đại lý, xưởng có hàng sẵn | Đăng sản phẩm, tồn kho, vùng giao; xử lý đơn mua ngay |
| Người bán – Nhận đặt hàng | Xưởng; đại lý và người bán lại có nguồn hàng lớn. Một số chỉ nhận đặt hàng, không bán lẻ (BR-21) | Khai năng lực, nhận yêu cầu, báo giá, maket, cập nhật tiến độ, giải ngân cọc |
| Quản trị | Đội vận hành Moonkage | Duyệt người bán (gồm làm việc trực tiếp với người bán là pháp nhân, BR-26), giải ngân, chuyển tiền, đối soát toàn nền tảng (FR-51), tranh chấp, voucher, bảng phí giao liên tỉnh (FR-52), mức phí đăng ký mở bán (FR-53) |

Stakeholder ngoài hệ thống: người duyệt ngân sách trong doanh nghiệp (dùng file báo giá xuất ra, không có tài khoản riêng); người đại diện theo pháp luật của người bán là pháp nhân (ký thỏa thuận hợp tác ngoài hệ thống, BR-26); hãng vận chuyển liên tỉnh; cổng thanh toán.

---

## 4. Phạm vi

### 4.1 In scope
- Tài khoản: đăng ký, xác nhận, đăng nhập, khôi phục, địa chỉ giao hàng, xác minh NFC chủ tài khoản (FR-01 → FR-04). Xác minh NFC: app mobile (Flutter) đọc thẻ NFC mô phỏng CCCD (thẻ NTAG chứa thông tin CCCD mẫu dạng JSON, người dùng tự có trước); người dùng đăng nhập app, tự kiểm thông tin trên điện thoại rồi xác nhận; máy chủ ghi nhận họ tên, giới tính, ngày sinh, quốc tịch, số định danh và chuyển tài khoản sang "đã xác minh NFC". Bắt buộc trước khi khai hồ sơ người bán và trước khi gửi yêu cầu đặt hàng (BR-23).
- Khám phá theo vùng giao, tìm/lọc, giỏ hàng nhiều Shop (một lần thanh toán, mỗi Shop một đơn, BR-29), phí giao (BR-30), thanh toán, theo dõi, đánh giá, khiếu nại, voucher (FR-05 → FR-13).
- Đặt hàng qua báo giá: yêu cầu trực tiếp, yêu cầu mở, so sánh và xuất báo giá, chấp nhận và đặt cọc, maket, tiến độ, thanh toán phần còn lại, đặt lại (FR-14 → FR-23).
- Xuất hóa đơn doanh nghiệp theo từng đơn, nhận hóa đơn (FR-24, FR-25).
- Đăng ký và duyệt người bán, phí đăng ký mở bán (BR-31), vùng giao hàng và phí giao nội thành (FR-26 → FR-28). Xác minh người bán phân theo tư cách pháp nhân: hộ kinh doanh và doanh nghiệp tư nhân xác minh bằng NFC của chủ và so số định danh trên giấy chứng nhận đăng ký (BR-27); công ty (pháp nhân) phải làm việc trực tiếp với nền tảng và có thỏa thuận hợp tác do người đại diện theo pháp luật ký (BR-26).
- Shop: sản phẩm, tồn kho, giá theo số lượng, ngưỡng báo giá, xử lý đơn (FR-29 → FR-32); sửa, ẩn / hiện sản phẩm (FR-33, FR-34).
- Nhận đặt hàng: hồ sơ năng lực, nhận yêu cầu, lịch công suất, báo giá, maket, tiến độ, giải ngân cọc, giao (FR-35 → FR-42).
- Đối soát và hóa đơn đơn hàng phía người bán (FR-43, FR-44).
- Quản trị: duyệt người bán, khóa/gỡ, giải ngân, chuyển tiền, tranh chấp, voucher, đối soát toàn nền tảng, bảng phí giao liên tỉnh, mức phí đăng ký mở bán (FR-45 → FR-53).

### 4.2 Out of scope (KHÔNG làm)
- Nền tảng **không** tự sản xuất, tự bán, tự nhập hàng hay giữ kho bánh.
- **Không** có tài khoản doanh nghiệp, **không** lưu hồ sơ doanh nghiệp mua hàng; không có vai trò, hạn mức duyệt hay màn hình chung của công ty. Duyệt nội bộ diễn ra ngoài nền tảng.
- **Không** xác minh người mua có quyền đại diện cho đơn vị ghi trên hóa đơn; chỉ kiểm tra định dạng mã số thuế. Xác minh NFC (FR-04) chỉ ghi nhận con người thao tác tài khoản, không xác minh quyền đại diện. (Quyền nhân danh người bán là pháp nhân được xác minh ngoài hệ thống qua thỏa thuận hợp tác, BR-26; điều này chỉ áp cho phía bán.)
- **Không** có tài khoản nhân viên bán hàng; mỗi người bán chỉ thao tác bằng tài khoản của chủ.
- **Không** cho cá nhân không có đăng ký kinh doanh bán hàng; không phải chợ mở.
- **Không** kết nối Cổng thông tin quốc gia về đăng ký doanh nghiệp hay hệ thống đăng ký hộ kinh doanh; quản trị tra cứu và đối chiếu thủ công (FR-45, A-14). **Không** đọc tự động nội dung file giấy chứng nhận đăng ký (không OCR).
- **Không** quản lý ký kết hợp đồng trong hệ thống: thỏa thuận hợp tác với người bán là pháp nhân được ký ngoài hệ thống; hệ thống chỉ lưu bản ghi buổi làm việc và file thỏa thuận (BR-26).
- **Không** có công cụ thiết kế hộp 3D. Custom chỉ gồm in logo lên túi, thiệp, sticker và hộp theo mẫu có sẵn của người bán.
- **Không** mô hình hóa mùa vụ: không có hạn chót của mùa, không xử lý riêng cho cao điểm, không điều tiết đơn theo thời điểm (Context mục 9).
- **Không** cho mua ngay sản phẩm hết tồn kho hoặc chưa đăng bán.
- **Không** hiển thị sản phẩm không giao được tới địa chỉ người mua.
- **Không** yêu cầu người bán khai nguồn nhập hàng (chỉ yêu cầu thương hiệu và nơi sản xuất).
- **Không** có thanh toán khi nhận hàng cho đơn liên tỉnh.
- **Không** có giá riêng theo loại người mua; giá niêm yết như nhau với mọi người.
- **Không** cho người bán giới hạn ai được gửi yêu cầu theo loại người mua (cá nhân/doanh nghiệp). Người bán "chỉ làm với doanh nghiệp" thể hiện bằng việc chỉ nhận đặt hàng và đặt số lượng tối thiểu (BR-21).
- **Không** phát hiện tự giao dịch thông qua một tài khoản khác (người thân, nhân viên của chủ người bán). BR-22 chỉ chặn khi tài khoản mua chính là tài khoản chủ của người bán.
- **Không** đọc chip CCCD thật và **không** kết nối hệ thống định danh quốc gia; xác minh dùng thẻ NFC mô phỏng (A-08). **Không** yêu cầu xác minh NFC cho mua ngay.
- **Không** kiểm tính xác thực của thẻ NFC (chữ ký số, UID): thẻ do bất kỳ ai tự ghi đúng định dạng đều được chấp nhận (A-08). **Không** cấp thẻ: thẻ NFC mô phỏng do người dùng tự có trước, nằm ngoài hệ thống (Context mục 9).
- **Không** duyệt sản phẩm trước khi hiển thị; quản trị chỉ gỡ sau khi phát hiện vi phạm (BR-24).
- **Không** dùng cổng thanh toán thật; thanh toán chỉ qua VNPay sandbox (A-11). **Không** chuyển tiền thật cho người bán: giải ngân cọc và chuyển tiền chỉ được ghi sổ khi quản trị bấm duyệt (A-12).
- **Không** tính hoa hồng giao dịch; nguồn thu của nền tảng là phí đăng ký mở bán (BR-31, Context mục 9).
- **Không** lấy giá từ hãng vận chuyển; phí liên tỉnh theo bảng của nền tảng (BR-30, Context mục 9).
- **Không** có bảng so sánh sản phẩm riêng; so sánh ngay trên trang tìm kiếm (FR-06).
- **Không** cho người bán trả lời đánh giá, **không** xóa sản phẩm (chỉ ẩn), và chưa cho đổi cách bán (bật / tắt Shop) sau khi duyệt.
- **Không** đánh giá và **không** áp dụng voucher cho đơn đặt hàng (BR-32).


### 4.3 Phạm vi demo

Phạm vi demo là phần nhóm cam kết chạy được khi bảo vệ. FR không có trong "Làm trọn" vẫn giữ nguyên đặc tả để làm tiếp sau; ưu tiên MoSCoW ở mục 5 không đổi.

**Làm trọn** (đạt toàn bộ Acceptance Criteria):

| Mảng | FR |
|---|---|
| Tài khoản, xác minh NFC | FR-01 (trừ phần nêu ở "Làm đơn giản"), FR-02, FR-03, FR-04 |
| Khám phá và mua ngay | FR-05 → FR-12 |
| Đặt hàng qua báo giá | FR-14 → FR-17, FR-19 → FR-22, FR-24 |
| Trở thành người bán | FR-26, FR-27, FR-28 |
| Shop, quản lý sản phẩm | FR-29 → FR-34 |
| Nhận đặt hàng | FR-35, FR-36, FR-38 → FR-42 |
| Hóa đơn phía người bán | FR-44 |
| Quản trị | FR-45, FR-46, FR-47 và FR-48 (ghi sổ theo A-12), FR-49, FR-51, FR-52, FR-53 |

**Làm đơn giản** (đạt AC chính, phần nêu dưới đây chưa làm):

| FR | Phần chưa làm trong demo |
|---|---|
| FR-01, FR-02 | Chỉ đăng ký, xác nhận và đặt lại mật khẩu bằng email (gửi qua Gmail SMTP, A-17); đăng ký bằng số điện thoại chưa làm vì chưa có SMS |
| FR-25 | Không gửi hóa đơn qua email (AC-25.2); người mua chỉ tải trên web |
| FR-43 | Không lọc theo khoảng thời gian và xuất file (AC-43.2); chỉ xem bảng đối soát |
| FR-10, FR-21, FR-27 và các thông báo khác | Chỉ thông báo trong ứng dụng (NFR-10); email chỉ dùng cho mã xác nhận và đặt lại mật khẩu; chưa có SMS |

**Hoãn** (không có trong demo): FR-13 và FR-50 (voucher), FR-18 (xuất báo giá ra file), FR-23 (đặt lại từ đơn cũ), FR-37 (lịch công suất).

**Đã bỏ khỏi đặc tả** theo User Stories: xem bảng đổi số ở mục 14.

**Giá trị tạm cho demo** (A-13). Các câu hỏi dưới đây đang mở nhưng chặn phần "Làm trọn", nên demo dùng giá trị tạm. Đây không phải quyết định cuối; khi nhóm chốt thì thay giá trị và đóng câu hỏi tương ứng.

| Câu hỏi | Giá trị tạm cho demo |
|---|---|
| Q-01 Hủy sau khi cọc | Không có chức năng hủy riêng; mọi trường hợp đi qua khiếu nại (FR-12) và quản trị quyết định hoàn tiền (FR-49) |
| Q-10 Thời hạn khiếu nại, giữ tiền | 3 ngày sau khi giao với đơn nội thành; 7 ngày với đơn liên tỉnh và đơn đặt hàng |
| Q-11 Tiêu chuẩn đóng gói "toàn quốc" | Người bán tự đánh dấu xác nhận đạt chuẩn khi chọn nhãn; quản trị gỡ nếu vi phạm (BR-24) |
| Q-12 Đơn vị vùng giao | Tỉnh / thành phố |
| Q-14 Không trả phần còn lại | Đơn đứng ở "đã giao – chờ thanh toán"; xử lý qua khiếu nại |
| Q-18 Vận chuyển liên tỉnh | Người bán nhập mã vận đơn tay. Phí liên tỉnh đã chốt ở BR-30 |
| Q-19 Hiệu lực báo giá | Người bán chọn từ 1 đến 14 ngày |
| Q-21 Kênh thông báo | Trong ứng dụng; email (Gmail SMTP) chỉ cho mã xác nhận và đặt lại mật khẩu |
| Q-26 Sửa hồ sơ pháp lý sau khi duyệt | Không cho sửa trong demo |
| Q-30 Giới hạn thử NFC | 5 lần thất bại thì tạm khóa xác minh 15 phút |
| Q-31 Thời hạn phiên QR | 5 phút |
| Q-37 Trường gửi lên khi xác minh NFC | App gửi đủ 9 trường của thẻ; số định danh, ngày sinh, nơi thường trú được mã hóa; máy chủ bỏ các trường không lưu ngay sau khi kiểm |
| Q-03, Q-28 Chuyển quyền chủ | Không hỗ trợ trong demo |
| Q-06, Q-20 Chênh lệch giá sỉ/lẻ, ưu đãi đặt sớm | Không kiểm chênh lệch giá; ưu đãi đặt sớm chỉ là thông tin hiển thị |
| Q-34 Hình thức ký thỏa thuận hợp tác | Quản trị tải lên file PDF thỏa thuận đã ký; hệ thống không kiểm chữ ký hay con dấu. Demo dùng file thỏa thuận mẫu |
| Q-36 Hóa đơn phí đăng ký mở bán | Quản trị lập hóa đơn ngoài hệ thống và tải file lên hồ sơ người bán; hệ thống không tự sinh hóa đơn |

---

## 5. Yêu cầu chức năng (Functional Requirements)

> Ưu tiên theo MoSCoW: **Must** / **Should** / **Could** / **Won't**.
> Mã FR trùng mã US và được đánh số liên tục theo thứ tự trong tài liệu (từ v1.5). Bảng đổi số giữa mã cũ (đến v1.4) và mã mới, cùng các FR đã bỏ, ở mục 14.

### Nhóm 1 – Tài khoản

### FR-01: Đăng ký tài khoản
- **Ưu tiên:** Must
- **User story:** Là khách, tôi muốn đăng ký bằng email hoặc số điện thoại cùng họ tên, để bắt đầu mua hàng.
- **Mô tả chi tiết:** Một form đăng ký duy nhất cho mọi người. Định danh là email hoặc số điện thoại; họ tên bắt buộc. Không hỏi cá nhân hay doanh nghiệp. Tài khoản chỉ dùng được (mua, gửi yêu cầu) sau khi xác nhận định danh. Trong demo chỉ có email; mã xác nhận gửi qua Gmail SMTP (mục 4.3, A-17).
- **Acceptance Criteria:**
  - **AC-01.1** — *Given* khách mở trang đăng ký, *When* form hiện ra, *Then* form chỉ có email hoặc số điện thoại, họ tên, mật khẩu; không có lựa chọn cá nhân/doanh nghiệp.
  - **AC-01.2** — *Given* tài khoản chưa xác nhận, *When* người dùng cố mua ngay hoặc gửi yêu cầu, *Then* hệ thống chặn và yêu cầu xác nhận email/số điện thoại.
  - **AC-01.3** — *Given* email hoặc số điện thoại đã gắn với một tài khoản, *When* khách đăng ký lại bằng định danh đó, *Then* hệ thống từ chối và báo định danh đã được dùng.
- **Trường hợp đặc biệt / lỗi:** Mã xác nhận hết hạn → cho gửi lại mã. Định dạng email/số điện thoại sai → báo lỗi tại trường. Gửi email thất bại → báo người dùng thử gửi lại mã.
- **Phụ thuộc:** Dịch vụ gửi email (Gmail SMTP, A-17); SMS (Q-21).

### FR-02: Đăng nhập và khôi phục
- **Ưu tiên:** Must
- **User story:** Là người mua, tôi muốn đăng nhập và đặt lại mật khẩu khi quên, để không mất quyền truy cập vào đơn hàng của mình.
- **Mô tả chi tiết:** Đăng nhập bằng email hoặc số điện thoại đã xác nhận. Đặt lại mật khẩu qua kênh đã xác nhận (demo: email qua Gmail SMTP, A-17).
- **Acceptance Criteria:**
  - **AC-02.1** — *Given* người dùng quên mật khẩu, *When* yêu cầu đặt lại, *Then* liên kết/mã đặt lại chỉ được gửi tới email hoặc số điện thoại đã xác nhận.
  - **AC-02.2** — *Given* người dùng đăng nhập thành công, *When* mở khu vực tài khoản, *Then* thấy toàn bộ đơn hàng, yêu cầu và báo giá của tài khoản (kể cả đơn có xuất hóa đơn doanh nghiệp).
- **Trường hợp đặc biệt / lỗi:** Sai thông tin đăng nhập → thông báo chung, không tiết lộ định danh có tồn tại hay không.
- **Phụ thuộc:** FR-01.

### FR-03: Quản lý địa chỉ giao hàng
- **Ưu tiên:** Should
- **User story:** Là người mua, tôi muốn lưu nhiều địa chỉ giao hàng và chọn một địa chỉ mặc định, để nền tảng chỉ hiện những thứ giao được tới tôi.
- **Mô tả chi tiết:** Danh sách địa chỉ thuộc tài khoản; một địa chỉ mặc định; một địa chỉ "đang chọn" dùng để lọc.
- **Acceptance Criteria:**
  - **AC-03.1** — *Given* người mua đã đăng nhập, *When* thêm, sửa hoặc xóa địa chỉ, *Then* danh sách được cập nhật và luôn có tối đa một địa chỉ mặc định.
  - **AC-03.2** — *Given* người mua đổi địa chỉ đang chọn, *When* danh sách sản phẩm/người bán tải lại, *Then* kết quả được lọc theo vùng giao của địa chỉ mới (FR-05).
- **Trường hợp đặc biệt / lỗi:** Xóa địa chỉ đang được dùng trong một đơn chưa giao → không ảnh hưởng đơn đó (địa chỉ đã được chép vào đơn).
- **Phụ thuộc:** FR-05, Q-12.

### FR-04: Xác minh NFC chủ tài khoản
- **Ưu tiên:** Must
- **User story:** Là người dùng muốn bán hàng hoặc đặt hàng qua báo giá, tôi muốn xác minh danh tính bằng cách đọc chip CCCD qua điện thoại có NFC, để tài khoản của tôi được gắn với một con người cụ thể.
- **Mô tả chi tiết:** Áp dụng BR-23. Web tạo phiên xác minh và hiện mã QR. Người dùng đăng nhập app mobile Moonkage Verify (Flutter) bằng chính tài khoản đó, quét QR, chạm thẻ. App đọc NDEF Text record là JSON 9 khóa (A-08), kiểm định dạng, hiện đủ 9 trường trên điện thoại để người dùng tự kiểm. Người dùng bấm Lưu thì app mã hóa các trường nhạy cảm rồi gửi một lần; bấm Hủy thì không gửi gì. Máy chủ kiểm lại mọi điều kiện, ghi nhận 5 trường vào tài khoản và chuyển tài khoản sang "đã xác minh NFC". Máy chủ **không** kiểm chữ ký hay UID của thẻ, và **không** so với thông tin người dùng tự nhập (A-08). Kết quả xác minh gắn với tài khoản (con người), không gắn với người bán. Mã băm số định danh còn được dùng để so với số định danh khai ở hồ sơ người bán (AC-26.6, AC-26.8). Thẻ do người dùng tự có trước, nằm ngoài hệ thống; nền tảng không cấp thẻ.
- **Acceptance Criteria:**
  - **AC-04.1** — *Given* tài khoản đã xác nhận và chưa xác minh NFC, *When* bắt đầu xác minh trên web, *Then* hệ thống tạo một phiên xác minh dùng một lần, có thời hạn (Q-31), thuộc tài khoản đó, và hiện mã QR.
  - **AC-04.2** — *Given* app chưa đăng nhập, hoặc đăng nhập bằng tài khoản khác với tài khoản của phiên, *When* quét QR rồi gửi thẻ, *Then* hệ thống không nhận thẻ; với phiên của tài khoản khác thì báo phiên không thuộc tài khoản đang đăng nhập.
  - **AC-04.3** — *Given* app đọc được thẻ, *When* Text record không phải JSON có khóa `id_number`, hoặc thiếu trường, sai định dạng trường (A-08), *Then* app báo thẻ không đúng loại hoặc nội dung thẻ không hợp lệ, không gửi gì lên máy chủ, và cho chạm lại.
  - **AC-04.4** — *Given* thẻ hợp lệ, *When* app hiện màn xác nhận, *Then* điện thoại hiện đủ 9 trường của thẻ, kể cả số định danh đầy đủ. Người dùng bấm Lưu thì app gửi; bấm Hủy thì không gửi gì và dữ liệu thẻ bị xóa khỏi bộ nhớ của app.
  - **AC-04.5** — *Given* người dùng bấm Lưu, *When* phiên còn hạn, chưa dùng, thuộc tài khoản đang đăng nhập, tài khoản không bị tạm khóa xác minh, nội dung đúng định dạng, CCCD còn hạn và số định danh chưa gắn với tài khoản khác, *Then* tài khoản chuyển sang "đã xác minh NFC", thông tin được ghi theo AC-04.11, và trang web tự cập nhật trạng thái.
  - **AC-04.6** — *Given* số định danh đã gắn với một tài khoản khác, *When* xác minh, *Then* hệ thống từ chối và báo lý do (BR-23).
  - **AC-04.7** — *Given* phiên đã hết hạn hoặc đã được dùng, *When* app gửi thẻ, *Then* máy chủ từ chối; người dùng phải tạo phiên mới.
  - **AC-04.8** — *Given* ngày hết hạn trên thẻ trước ngày hiện tại (giờ Việt Nam), *When* xác minh, *Then* hệ thống từ chối và báo CCCD đã hết hạn. App cũng báo ngay khi đọc thẻ, nhưng máy chủ vẫn kiểm lại.
  - **AC-04.9** — *Given* thẻ sai định dạng, CCCD hết hạn hoặc số định danh đã gắn tài khoản khác, *When* người dùng thử lại quá số lần cho phép, *Then* hệ thống tạm khóa xác minh của tài khoản (số lần và thời gian khóa: Q-30).
  - **AC-04.10** — *Given* người dùng bấm Lưu, *When* app gửi thẻ, *Then* số định danh, ngày sinh và nơi thường trú được app mã hóa trước khi gửi, ngoài HTTPS; chỉ thành phần máy chủ giữ khóa giải mã được (NFR-03). Trường gửi lên: Q-37.
  - **AC-04.11** — *Given* xác minh thành công, *When* lưu, *Then* hệ thống chỉ lưu họ tên, giới tính, ngày sinh, quốc tịch và số định danh, cùng thời điểm xác minh. Số định danh lưu dạng mã hóa, mã băm có khóa kèm phiên bản khóa (để kiểm trùng và để so với số định danh ở hồ sơ người bán) và dạng đã che; ngày sinh lưu dạng mã hóa. Không lưu nơi sinh, nơi thường trú, ngày cấp, ngày hết hạn và nội dung thô của thẻ (NFR-03).
  - **AC-04.12** — *Given* tài khoản đã xác minh, *When* bất kỳ màn hình nào ngoài màn xác nhận trên điện thoại hiện số định danh, *Then* chỉ hiện dạng đã che.
- **Trường hợp đặc biệt / lỗi:** Điện thoại không có NFC → app báo và gợi ý dùng điện thoại khác; không có cách xác minh thay thế. Đọc thẻ thất bại (chạm chưa đủ lâu) → cho chạm lại. Token đăng nhập của app hết hạn giữa chừng → app đăng xuất, bỏ dữ liệu thẻ đang giữ. So khớp khuôn mặt: không áp dụng (Q-29). CCCD hết hạn sau khi đã xác minh: Q-33.
- **Phụ thuộc:** FR-01, FR-02, App mobile (mục 9), A-08, NFR-03, NFR-04.

### Nhóm 2 – Khám phá và mua ngay

### FR-05: Chỉ thấy hàng giao được
- **Ưu tiên:** Must
- **User story:** Là người mua, tôi muốn chỉ thấy sản phẩm và người bán giao được đến địa chỉ của mình, để không mất công chọn thứ không mua được.
- **Mô tả chi tiết:** Áp dụng BR-13 và vùng giao người bán khai (FR-28).
- **Acceptance Criteria:**
  - **AC-05.1** — *Given* sản phẩm gắn "giao nội thành", *When* địa chỉ đang chọn nằm ngoài vùng giao người bán đã khai, *Then* sản phẩm không hiện.
  - **AC-05.2** — *Given* sản phẩm gắn "giao toàn quốc", *When* người mua ở bất kỳ địa chỉ nào, *Then* sản phẩm hiện.
  - **AC-05.3** — *Given* khách chưa có địa chỉ, *When* vào trang danh sách, *Then* hệ thống yêu cầu chọn khu vực trước khi hiện sản phẩm.
- **Trường hợp đặc biệt / lỗi:** Người bán thu hẹp vùng giao khi người mua đã bỏ sản phẩm vào giỏ → kiểm tra lại ở bước thanh toán và báo sản phẩm không còn giao được.
- **Phụ thuộc:** FR-03, FR-28, Q-12.

### FR-06: Tìm, lọc, sắp xếp
- **Ưu tiên:** Must
- **User story:** Là người mua, tôi muốn tìm theo từ khóa và lọc theo giá, thương hiệu, loại bánh, Shop, để thu hẹp lựa chọn nhanh.
- **Mô tả chi tiết:** Kết quả gộp sản phẩm của mọi Shop giao được tới địa chỉ đang chọn. Trang tìm kiếm sản phẩm là kênh bán lẻ: chỉ có sản phẩm của người bán có bật Shop; người bán chỉ nhận đặt hàng không xuất hiện ở đây (BR-21).
- **Acceptance Criteria:**
  - **AC-06.1** — *Given* có sản phẩm từ nhiều Shop giao được, *When* người mua tìm theo từ khóa, *Then* kết quả gộp từ mọi Shop đó và không có sản phẩm ngoài vùng giao.
  - **AC-06.2** — *Given* danh sách kết quả, *When* áp bộ lọc giá, thương hiệu, loại bánh hoặc Shop, *Then* chỉ còn sản phẩm thỏa mọi bộ lọc đang bật.
  - **AC-06.3** — *Given* danh sách kết quả, *When* chọn sắp xếp theo giá hoặc theo đánh giá, *Then* thứ tự thay đổi tương ứng.
  - **AC-06.4** — *Given* một người bán chỉ bật nhận đặt hàng, không bật Shop, *When* người mua tìm sản phẩm theo bất kỳ từ khóa hay bộ lọc nào, *Then* không có kết quả nào của người bán đó; bộ lọc "Shop" cũng không liệt kê người bán đó.
  - **AC-06.5** — *Given* danh sách kết quả, *When* hiển thị, *Then* mỗi sản phẩm hiện ảnh, giá, thương hiệu và tên Shop, để người mua so sánh ngay trong danh sách.
- **Trường hợp đặc biệt / lỗi:** Không có kết quả → thông báo và gợi ý bỏ bớt bộ lọc, kèm lối gửi yêu cầu mở (FR-16) cho người mua cần số lượng lớn.
- **Phụ thuộc:** FR-05, FR-11 (dữ liệu đánh giá), BR-21.

### FR-07: Xem chi tiết sản phẩm
- **Ưu tiên:** Must
- **User story:** Là người mua, tôi muốn xem đầy đủ thông tin một sản phẩm, để quyết định mua.
- **Mô tả chi tiết:** Trang chi tiết hiển thị dữ liệu người bán khai ở FR-29, FR-31.
- **Acceptance Criteria:**
  - **AC-07.1** — *Given* người mua mở trang sản phẩm, *When* trang tải, *Then* hiện giá đã gồm thuế GTGT, tồn kho, hạn dùng, thương hiệu, nơi sản xuất.
  - **AC-07.2** — *Given* người bán có đặt giá theo số lượng, *When* trang tải, *Then* hiện các bậc giá.
  - **AC-07.3** — *Given* người mua có địa chỉ đang chọn, *When* trang tải, *Then* hiện vùng giao và phí giao tới địa chỉ đó.
  - **AC-07.4** — *Given* tài khoản đang đăng nhập là chủ của người bán sở hữu sản phẩm, *When* trang tải, *Then* sản phẩm vẫn hiển thị kèm nhãn "Sản phẩm của bạn"; không có nút mua ngay, thêm vào giỏ hay gửi yêu cầu (BR-22).
- **Trường hợp đặc biệt / lỗi:** Người bán có bật nhận đặt hàng → hiện lối vào gửi yêu cầu trực tiếp (FR-15), trừ khi người xem là chủ của người bán đó (BR-22).
- **Phụ thuộc:** FR-29, FR-31, BR-22.

### FR-08: Giỏ hàng nhiều Shop
- **Ưu tiên:** Must
- **User story:** Là người mua, tôi muốn bỏ sản phẩm của nhiều Shop vào một giỏ, để thanh toán một lần.
- **Mô tả chi tiết:** Giỏ tách nhóm theo Shop. Khi số lượng rơi vào BR-03, đề nghị chuyển sang yêu cầu đặt hàng. Một lần thanh toán tạo mỗi Shop một đơn, nhóm theo lần thanh toán (BR-29); phí giao theo BR-30.
- **Acceptance Criteria:**
  - **AC-08.1** — *Given* sản phẩm còn N hộp tồn kho, *When* người mua nhập số lượng ≤ N và dưới ngưỡng báo giá, *Then* sản phẩm được thêm vào giỏ.
  - **AC-08.2** — *Given* số lượng nhập vượt tồn kho hoặc đạt ngưỡng báo giá của người bán, *When* người mua xác nhận, *Then* không thêm vào giỏ; hệ thống đề nghị gửi yêu cầu đặt hàng tới người bán đó (nếu người bán có bật nhận đặt hàng).
  - **AC-08.3** — *Given* giỏ có sản phẩm từ nhiều Shop, *When* người mua xem giỏ, *Then* giỏ tách theo Shop và hiện phí giao của từng Shop.
  - **AC-08.4** — *Given* sản phẩm thuộc người bán do tài khoản đang đăng nhập làm chủ, *When* người dùng thêm vào giỏ (kể cả gọi trực tiếp API), *Then* hệ thống từ chối và báo không thể mua sản phẩm của chính mình (BR-22).
- **Trường hợp đặc biệt / lỗi:** Vượt tồn kho nhưng người bán không nhận đặt hàng → chỉ báo số lượng tối đa mua được. Tồn kho giảm sau khi đã vào giỏ → kiểm tra lại ở FR-09. Người mua chưa xác minh NFC → vẫn được đề nghị gửi yêu cầu, nhưng phải xác minh NFC trước khi gửi (FR-04, BR-23).
- **Phụ thuộc:** FR-30, FR-31, FR-15, BR-22, BR-29, BR-30.

### FR-09: Thanh toán đơn mua ngay
- **Ưu tiên:** Must
- **User story:** Là người mua, tôi muốn thanh toán ngay trên nền tảng, để chốt đơn.
- **Mô tả chi tiết:** Áp dụng BR-08, BR-28, BR-29, BR-30. Có lựa chọn xuất hóa đơn doanh nghiệp (FR-24) và voucher (FR-13). Tồn kho được giữ khi người mua chuyển sang VNPay, chốt khi có IPN thành công và trả lại khi thanh toán thất bại hoặc hết thời hạn (BR-28).
- **Acceptance Criteria:**
  - **AC-09.1** — *Given* người mua ở bước thanh toán, *When* màn hình hiện tổng tiền, *Then* phí vận chuyển từng Shop hiện rõ trước nút thanh toán.
  - **AC-09.2** — *Given* người mua thanh toán, *When* giao dịch thành công, *Then* tiền được ghi nhận vào tài khoản giữ của nền tảng, không trả thẳng cho người bán.
  - **AC-09.3** — *Given* đơn có giao liên tỉnh, *When* người mua chọn phương thức, *Then* không có lựa chọn thanh toán khi nhận hàng.
  - **AC-09.4** — *Given* thanh toán thành công (IPN hợp lệ, BR-25), *When* đơn được tạo, *Then* phần tồn kho đã giữ cho đơn được chốt và tồn kho từng sản phẩm giảm đúng số lượng đã mua.
  - **AC-09.5** — *Given* giỏ có sản phẩm của người bán mà tài khoản thanh toán đang làm chủ (ví dụ do quyền chủ thay đổi sau khi thêm vào giỏ), *When* người dùng thanh toán, *Then* hệ thống loại các sản phẩm đó khỏi lần thanh toán, báo lý do và không tạo đơn cho người bán đó (BR-22).
  - **AC-09.6** — *Given* người mua đã được chuyển sang VNPay và chưa có kết quả, *When* người khác mua cùng sản phẩm, *Then* phần đã giữ không bán được cho người khác; nếu thanh toán thất bại hoặc hết thời hạn thanh toán, phần đã giữ được trả lại tồn kho (BR-28).
  - **AC-09.7** — *Given* lần thanh toán có sản phẩm của N Shop, *When* thanh toán thành công (BR-25), *Then* hệ thống tạo N đơn, mỗi Shop một đơn, cùng gắn với lần thanh toán đó; mỗi đơn có phí giao riêng theo BR-30.
- **Trường hợp đặc biệt / lỗi:** Tồn kho không đủ tại thời điểm giữ hàng → không chuyển sang VNPay, báo sản phẩm thiếu. Thanh toán thất bại → không tạo đơn, tồn kho đã giữ được trả lại. Hai người mua cùng lúc món cuối cùng → chỉ một người giữ được hàng.
- **Phụ thuộc:** VNPay sandbox (A-11, BR-25), FR-24, Q-05 (COD nội thành), BR-22, BR-28.

### FR-10: Theo dõi đơn hàng
- **Ưu tiên:** Must
- **User story:** Là người mua, tôi muốn xem trạng thái từng đơn, để biết khi nào nhận hàng.
- **Mô tả chi tiết:** Trạng thái đơn mua ngay theo mục 7.1.
- **Acceptance Criteria:**
  - **AC-10.1** — *Given* đơn mua ngay, *When* người mua mở chi tiết đơn, *Then* thấy trạng thái hiện tại trong: đã thanh toán, người bán xác nhận, đang giao, đã giao.
  - **AC-10.2** — *Given* người bán đổi trạng thái đơn, *When* thay đổi được lưu, *Then* người mua nhận thông báo.
  - **AC-10.3** — *Given* các đơn tạo từ cùng một lần thanh toán, *When* người mua xem danh sách đơn, *Then* các đơn được nhóm theo lần thanh toán và mỗi đơn có trạng thái riêng (BR-29).
- **Trường hợp đặc biệt / lỗi:** Đơn liên tỉnh → hiện mã vận đơn (FR-32).
- **Phụ thuộc:** FR-32, Q-21.

### FR-11: Xác nhận nhận hàng và đánh giá
- **Ưu tiên:** Should
- **User story:** Là người mua, tôi muốn xác nhận đã nhận hàng và đánh giá, để người sau có căn cứ chọn.
- **Mô tả chi tiết:** Xác nhận nhận hàng là một mốc kích hoạt chuyển tiền (FR-48).
- **Acceptance Criteria:**
  - **AC-11.1** — *Given* đơn chưa ở trạng thái đã giao, *When* người mua mở chi tiết đơn, *Then* không có chức năng đánh giá.
  - **AC-11.2** — *Given* đơn đã giao, *When* người mua xác nhận đã nhận hàng, *Then* đơn đủ điều kiện chuyển tiền cho người bán theo FR-48.
  - **AC-11.3** — *Given* đơn mua ngay đã giao, *When* người mua gửi đánh giá, *Then* đánh giá hiện trên sản phẩm và Shop.
- **Trường hợp đặc biệt / lỗi:** Đơn đặt hàng không có chức năng đánh giá (BR-32).
- **Phụ thuộc:** FR-48.

### FR-12: Khiếu nại đơn hàng
- **Ưu tiên:** Should
- **User story:** Là người mua, tôi muốn mở khiếu nại khi bánh sai, hỏng, giao trễ hoặc in sai logo, để được hoàn tiền hoặc xử lý.
- **Mô tả chi tiết:** Áp dụng cho cả đơn mua ngay và đơn đặt hàng. Áp dụng BR-18.
- **Acceptance Criteria:**
  - **AC-12.1** — *Given* đơn còn trong thời hạn khiếu nại, *When* người mua mở khiếu nại kèm mô tả và ảnh, *Then* khiếu nại được tạo và chuyển cho quản trị (FR-49).
  - **AC-12.2** — *Given* đơn đã quá thời hạn khiếu nại, *When* người mua tìm chức năng khiếu nại, *Then* không mở được.
  - **AC-12.3** — *Given* khiếu nại đang mở, *When* đơn đến mốc chuyển tiền, *Then* nền tảng tiếp tục giữ tiền, không chuyển cho người bán.
- **Trường hợp đặc biệt / lỗi:** Lý do khiếu nại là một trong: bánh sai, hỏng, giao trễ, in sai logo, khác.
- **Phụ thuộc:** FR-49, Q-10.

### FR-13: Dùng voucher hệ thống
- **Ưu tiên:** Could
- **User story:** Là người mua, tôi muốn nhập mã voucher khi thanh toán, để được giảm giá.
- **Mô tả chi tiết:** Voucher do quản trị tạo (FR-50).
- **Acceptance Criteria:**
  - **AC-13.1** — *Given* voucher hợp lệ, *When* người mua nhập mã ở bước thanh toán, *Then* mức giảm được trừ vào tổng tiền trước khi thanh toán.
  - **AC-13.2** — *Given* voucher hết hạn, hết lượt hoặc sai điều kiện, *When* người mua nhập mã, *Then* hệ thống từ chối và nêu lý do cụ thể.
- **Trường hợp đặc biệt / lỗi:** Voucher chỉ áp cho đơn mua ngay; đơn đặt hàng không áp dụng voucher (BR-32). Phần giảm do nền tảng hay người bán chịu: chưa quyết (Q-22).
- **Phụ thuộc:** FR-50.

### Nhóm 3 – Đặt hàng qua báo giá

### FR-14: Xem hồ sơ người bán nhận đặt hàng
- **Ưu tiên:** Must
- **User story:** Là người mua, tôi muốn xem năng lực của một người bán trước khi gửi yêu cầu, để không hỏi nhầm nơi.
- **Mô tả chi tiết:** Hiển thị dữ liệu FR-35. Với người bán chỉ nhận đặt hàng (BR-21), hồ sơ này và danh sách đơn vị cung cấp là nơi người mua tìm thấy họ, vì họ không có sản phẩm ở trang tìm kiếm sản phẩm.
- **Acceptance Criteria:**
  - **AC-14.1** — *Given* người bán có bật nhận đặt hàng, *When* người mua mở hồ sơ, *Then* thấy số lượng tối thiểu, bậc giá tham khảo, thời gian chuẩn bị/sản xuất, khả năng custom, ưu đãi đặt sớm, nguồn hàng.
  - **AC-14.2** — *Given* hồ sơ có bậc giá, *When* hiển thị, *Then* có ghi chú bậc giá là tham khảo, giá ràng buộc là giá trong báo giá.
  - **AC-14.3** — *Given* người bán chỉ nhận đặt hàng, *When* người mua xem danh sách đơn vị cung cấp, *Then* người bán đó hiện với nhãn "Chỉ nhận đặt hàng", số lượng tối thiểu, lối vào hồ sơ và lối gửi yêu cầu trực tiếp (FR-15); không có danh sách sản phẩm mua ngay.
  - **AC-14.4** — *Given* tài khoản đang đăng nhập là chủ của người bán, *When* mở hồ sơ hoặc dòng của người bán đó trong danh sách đơn vị cung cấp, *Then* hồ sơ vẫn hiển thị nhưng không có lối gửi yêu cầu trực tiếp (BR-22).
- **Trường hợp đặc biệt / lỗi:** Loại hóa đơn người bán xuất được: chưa quyết (Q-04).
- **Phụ thuộc:** FR-35, BR-21, BR-22.

### FR-15: Gửi yêu cầu trực tiếp
- **Ưu tiên:** Must
- **User story:** Là người mua, tôi muốn gửi yêu cầu cho một người bán cụ thể, để đặt số lượng lớn từ nơi tôi đã chọn.
- **Mô tả chi tiết:** Áp dụng BR-01, BR-16, BR-14, BR-22, BR-23.
- **Acceptance Criteria:**
  - **AC-15.1** — *Given* người mua đã xác nhận tài khoản và đã xác minh NFC, *When* tạo yêu cầu trực tiếp, *Then* yêu cầu gồm sản phẩm, số lượng, hạn giao, địa chỉ giao, nội dung custom (nếu có) và được gửi tới riêng người bán đó.
  - **AC-15.2** — *Given* số lượng dưới mức tối thiểu của người bán, *When* người mua bấm gửi, *Then* hệ thống chặn và hiện mức tối thiểu.
  - **AC-15.3** — *Given* bất kỳ tài khoản đã xác nhận nào, *When* tạo yêu cầu, *Then* không có câu hỏi cá nhân hay doanh nghiệp.
  - **AC-15.4** — *Given* người bán đích do chính tài khoản gửi yêu cầu làm chủ, *When* gửi yêu cầu (kể cả gọi trực tiếp API), *Then* hệ thống chặn và không tạo yêu cầu (BR-22).
  - **AC-15.5** — *Given* tài khoản chưa xác minh NFC, *When* mở form hoặc gửi yêu cầu trực tiếp (kể cả gọi trực tiếp API), *Then* hệ thống chặn, không tạo yêu cầu và đưa người dùng sang xác minh NFC (FR-04, BR-23); xác minh xong thì quay lại form với dữ liệu đã nhập.
- **Trường hợp đặc biệt / lỗi:** Người bán đích bị khóa (BR-20) hoặc chưa đóng phí đăng ký mở bán (BR-31) → chặn.
- **Phụ thuộc:** FR-14, FR-04.

### FR-16: Tạo yêu cầu mở
- **Ưu tiên:** Must
- **User story:** Là người mua, tôi muốn mô tả nhu cầu một lần và nhận báo giá từ nhiều người bán, để không phải nhắn từng nơi.
- **Mô tả chi tiết:** Nền tảng ghép yêu cầu với người bán phù hợp (BR-16) và gửi lời mời. Người bán chỉ nhận đặt hàng được mời như mọi người bán nhận đặt hàng khác. Người bán do chính người tạo yêu cầu làm chủ không bao giờ được mời (BR-22). Chỉ tài khoản đã xác minh NFC mới tạo được yêu cầu mở (BR-23).
- **Acceptance Criteria:**
  - **AC-16.1** — *Given* người mua tạo yêu cầu mở, *When* nhập thông tin, *Then* yêu cầu gồm số lượng, ngân sách, nội dung custom, hạn giao, địa chỉ giao.
  - **AC-16.2** — *Given* yêu cầu mở được gửi, *When* hệ thống chọn người bán để mời, *Then* chỉ mời người bán có mức tối thiểu ≤ số lượng, làm được loại custom yêu cầu, và giao được tới địa chỉ.
  - **AC-16.3** — *Given* yêu cầu đang mở, *When* người mua xem, *Then* thấy số người bán đã được mời và số báo giá đã nhận.
  - **AC-16.4** — *Given* tài khoản tạo yêu cầu mở là chủ của một người bán thỏa mọi điều kiện ở AC-16.2, *When* hệ thống chọn người bán để mời, *Then* người bán đó không được mời và không gửi được báo giá cho yêu cầu này (BR-22).
  - **AC-16.5** — *Given* tài khoản chưa xác minh NFC, *When* tạo yêu cầu mở (kể cả gọi trực tiếp API), *Then* hệ thống chặn, không tạo yêu cầu và đưa người dùng sang xác minh NFC (FR-04, BR-23).
- **Trường hợp đặc biệt / lỗi:** Không có người bán phù hợp → báo cho người mua và gợi ý chỉnh số lượng, custom hoặc hạn giao.
- **Phụ thuộc:** FR-35, FR-28, FR-36, FR-04.

### FR-17: Nhận và so sánh báo giá
- **Ưu tiên:** Must
- **User story:** Là người mua, tôi muốn xem các báo giá theo cùng một định dạng, để so sánh công bằng.
- **Mô tả chi tiết:** Mọi báo giá dùng một mẫu (FR-38).
- **Acceptance Criteria:**
  - **AC-17.1** — *Given* có báo giá, *When* người mua xem, *Then* mỗi báo giá hiện đơn giá, tổng tiền, tỷ lệ cọc, ngày giao, thời hạn hiệu lực.
  - **AC-17.2** — *Given* một yêu cầu có nhiều báo giá, *When* người mua mở yêu cầu, *Then* các báo giá xếp cạnh nhau trong một bảng.
  - **AC-17.3** — *Given* báo giá đã quá thời hạn hiệu lực, *When* hiển thị, *Then* được đánh dấu hết hiệu lực và nút chấp nhận bị vô hiệu.
- **Trường hợp đặc biệt / lỗi:** Báo giá bị người bán thu hồi → hiện là đã thu hồi, không chấp nhận được.
- **Phụ thuộc:** FR-38.

### FR-18: Xuất báo giá ra file
- **Ưu tiên:** Should
- **User story:** Là người mua thay doanh nghiệp, tôi muốn xuất báo giá ra file, để trình người có quyền duyệt trong công ty.
- **Mô tả chi tiết:** Định dạng file chưa quyết (Q-23). Hoãn trong demo (mục 4.3): Flow 2 bước 4 và tình huống trình duyệt nội bộ của doanh nghiệp không có trong kịch bản demo.
- **Acceptance Criteria:**
  - **AC-18.1** — *Given* một báo giá, *When* người mua chọn xuất, *Then* file chứa đủ các trường của báo giá và tên người bán.
  - **AC-18.2** — *Given* yêu cầu có nhiều báo giá, *When* người mua chọn xuất bảng so sánh, *Then* file chứa tất cả báo giá đang hiển thị trong bảng.
- **Trường hợp đặc biệt / lỗi:** Báo giá hết hiệu lực vẫn xuất được nhưng ghi rõ trạng thái.
- **Phụ thuộc:** FR-17.

### FR-19: Chấp nhận báo giá và đặt cọc
- **Ưu tiên:** Must
- **User story:** Là người mua, tôi muốn chấp nhận một báo giá và đặt cọc, để chốt đơn.
- **Mô tả chi tiết:** Áp dụng BR-04, BR-17, BR-22. Có lựa chọn xuất hóa đơn doanh nghiệp (FR-24).
- **Acceptance Criteria:**
  - **AC-19.1** — *Given* báo giá còn hiệu lực, *When* người mua chấp nhận nhưng thanh toán cọc thất bại, *Then* không tạo đơn.
  - **AC-19.2** — *Given* người mua chấp nhận và thanh toán cọc thành công, *When* đơn được tạo, *Then* số tiền cọc bằng tổng tiền × tỷ lệ cọc ghi trong báo giá và được nền tảng giữ.
  - **AC-19.3** — *Given* báo giá thuộc yêu cầu mở, *When* đơn được tạo, *Then* các báo giá còn lại của yêu cầu đó chuyển sang đã đóng.
  - **AC-19.4** — *Given* báo giá đến từ người bán do chính tài khoản chấp nhận làm chủ, *When* người dùng chấp nhận (kể cả gọi trực tiếp API), *Then* hệ thống chặn, không thu cọc và không tạo đơn (BR-22). Đây là lớp chặn cuối, kể cả khi các lớp ở FR-15, FR-16 đã bị vượt qua.
- **Trường hợp đặc biệt / lỗi:** Báo giá hết hiệu lực giữa lúc thanh toán → không tạo đơn, hoàn tiền nếu đã trừ. Hủy sau khi cọc: chưa quyết (Q-01).
- **Phụ thuộc:** FR-17, FR-24, VNPay sandbox (A-11, BR-25).

### FR-20: Gửi logo và duyệt maket
- **Ưu tiên:** Must
- **User story:** Là người mua có đơn custom, tôi muốn tải logo lên và duyệt maket ngay trên nền tảng, để không nhầm phiên bản.
- **Mô tả chi tiết:** Maket có phiên bản. Áp dụng BR-15.
- **Acceptance Criteria:**
  - **AC-20.1** — *Given* đơn có custom, *When* người bán gửi maket, *Then* maket được lưu thành phiên bản mới có số thứ tự và thời điểm.
  - **AC-20.2** — *Given* có maket chờ duyệt, *When* người mua duyệt hoặc yêu cầu sửa kèm ghi chú, *Then* trạng thái phiên bản được cập nhật và người bán được thông báo.
  - **AC-20.3** — *Given* chưa có phiên bản nào được duyệt, *When* người bán cố chuyển đơn sang sản xuất, *Then* hệ thống chặn.
- **Trường hợp đặc biệt / lỗi:** Định dạng và dung lượng file logo/maket: chưa quyết (NFR-08).
- **Phụ thuộc:** FR-39.

### FR-21: Theo dõi tiến độ đơn đặt hàng
- **Ưu tiên:** Must
- **User story:** Là người mua, tôi muốn xem tiến độ đơn đặt hàng, để không phải gọi hỏi.
- **Mô tả chi tiết:** Trạng thái đơn đặt hàng theo mục 7.1.
- **Acceptance Criteria:**
  - **AC-21.1** — *Given* đơn đặt hàng, *When* người mua mở chi tiết, *Then* thấy các mốc: đã cọc, duyệt maket (nếu có custom), đang sản xuất/chuẩn bị, sẵn sàng giao, đã giao, cùng ghi chú và ảnh người bán đính kèm.
  - **AC-21.2** — *Given* người bán cập nhật tiến độ, *When* thay đổi được lưu, *Then* người mua nhận thông báo.
- **Trường hợp đặc biệt / lỗi:** Đơn không có custom → bỏ qua mốc duyệt maket.
- **Phụ thuộc:** FR-40, Q-21.

### FR-22: Thanh toán phần còn lại
- **Ưu tiên:** Must
- **User story:** Là người mua, tôi muốn thanh toán phần còn lại khi giao hàng, để hoàn tất đơn.
- **Mô tả chi tiết:** Phần còn lại được yêu cầu khi người bán đánh dấu đã giao (FR-42).
- **Acceptance Criteria:**
  - **AC-22.1** — *Given* đơn được đánh dấu đã giao, *When* người mua mở yêu cầu thanh toán, *Then* số tiền bằng tổng tiền trong báo giá trừ tiền cọc.
  - **AC-22.2** — *Given* phần còn lại chưa thanh toán, *When* hệ thống xét trạng thái đơn, *Then* đơn không chuyển sang hoàn tất.
- **Trường hợp đặc biệt / lỗi:** Người mua không thanh toán phần còn lại: chưa quyết (Q-14).
- **Phụ thuộc:** FR-42, VNPay sandbox (A-11, BR-25).

### FR-23: Đặt lại từ đơn cũ
- **Ưu tiên:** Could
- **User story:** Là người mua nhập hàng nhiều đợt, tôi muốn tạo yêu cầu mới từ một đơn cũ, để không phải nhập lại.
- **Mô tả chi tiết:** Tạo yêu cầu trực tiếp điền sẵn; vẫn đi qua báo giá.
- **Acceptance Criteria:**
  - **AC-23.1** — *Given* một đơn đặt hàng cũ, *When* người mua chọn đặt lại, *Then* yêu cầu trực tiếp mới được điền sẵn sản phẩm, địa chỉ, người bán; số lượng và hạn giao sửa được.
  - **AC-23.2** — *Given* yêu cầu đặt lại, *When* gửi, *Then* yêu cầu đi qua báo giá như FR-15, không tự tạo đơn.
- **Trường hợp đặc biệt / lỗi:** Người bán đã bị khóa → không cho đặt lại, báo lý do. Người bán nay do chính tài khoản làm chủ (sau khi chuyển quyền chủ) → không cho đặt lại (BR-22). Tài khoản chưa xác minh NFC → chặn như AC-15.5 (BR-23).
- **Phụ thuộc:** FR-15, FR-04.

### Nhóm 4 – Hóa đơn phía người mua

### FR-24: Chọn xuất hóa đơn doanh nghiệp
- **Ưu tiên:** Must
- **User story:** Là người mua thay doanh nghiệp, tôi muốn chọn xuất hóa đơn doanh nghiệp khi đặt đơn, để công ty hoặc hộ kinh doanh của tôi có chứng từ.
- **Mô tả chi tiết:** Áp dụng BR-07. Thông tin là dữ liệu của đơn, không phải hồ sơ doanh nghiệp. Cách làm như nhau cho công ty và hộ kinh doanh.
- **Acceptance Criteria:**
  - **AC-24.1** — *Given* người mua ở bước thanh toán mua ngay hoặc chấp nhận báo giá, *When* xem form, *Then* có lựa chọn xuất hóa đơn doanh nghiệp.
  - **AC-24.2** — *Given* người mua chọn xuất hóa đơn doanh nghiệp, *When* nhập thông tin, *Then* phải nhập tên đơn vị, mã số thuế, địa chỉ, email nhận hóa đơn.
  - **AC-24.3** — *Given* mã số thuế sai định dạng, *When* người mua gửi, *Then* hệ thống báo lỗi; hệ thống không kiểm tra gì thêm ngoài định dạng.
  - **AC-24.4** — *Given* đơn được tạo có thông tin doanh nghiệp, *When* lưu, *Then* thông tin nằm trong đơn đó; không có bản ghi doanh nghiệp nào được tạo.
  - **AC-24.5** — *Given* người mua không chọn, *When* đơn được tạo, *Then* đơn là mua cho cá nhân, hóa đơn không ghi thông tin doanh nghiệp.
- **Trường hợp đặc biệt / lỗi:** Giỏ nhiều Shop → thông tin nhập một lần và chép vào mọi đơn của lần thanh toán đó (BR-29).
- **Phụ thuộc:** FR-09, FR-19.

### FR-25: Nhận và tải hóa đơn
- **Ưu tiên:** Must
- **User story:** Là người mua, tôi muốn nhận hóa đơn của mọi đơn hàng, để lưu hoặc nộp cho kế toán.
- **Mô tả chi tiết:** Hóa đơn do người bán lập và gắn (FR-44).
- **Acceptance Criteria:**
  - **AC-25.1** — *Given* người bán đã gắn hóa đơn, *When* người mua mở chi tiết đơn, *Then* tải được hóa đơn.
  - **AC-25.2** — *Given* đơn có email nhận hóa đơn, *When* hóa đơn được gắn, *Then* hệ thống gửi hóa đơn tới email đó.
- **Trường hợp đặc biệt / lỗi:** Hóa đơn chưa có → hiện "người bán chưa lập hóa đơn".
- **Phụ thuộc:** FR-44, Q-09.

### Nhóm 5 – Trở thành người bán

### FR-26: Khai hồ sơ người bán
- **Ưu tiên:** Must
- **User story:** Là người mua có đăng ký kinh doanh, tôi muốn khai hồ sơ người bán bằng chính tài khoản của mình, để được bán trên nền tảng.
- **Mô tả chi tiết:** Áp dụng BR-11, BR-23, BR-26, BR-27, BR-31. Tài khoản khai hồ sơ là chủ duy nhất và phải đã xác minh NFC. Loại hình được chia theo tư cách pháp nhân: hộ kinh doanh và doanh nghiệp tư nhân không có tư cách pháp nhân, người chủ chính là đơn vị (BR-27); công ty (TNHH, cổ phần, hợp danh) là pháp nhân, người đại diện theo pháp luật nhân danh đơn vị (BR-26). Thông tin chủ hộ / chủ doanh nghiệp tư nhân / người đại diện được khai đúng như ghi trên giấy chứng nhận đăng ký.
- **Acceptance Criteria:**
  - **AC-26.1** — *Given* tài khoản đã xác nhận và đã xác minh NFC, *When* khai hồ sơ, *Then* bắt buộc có tên đơn vị, loại hình (hộ kinh doanh / doanh nghiệp tư nhân / công ty), mã số thuế (mã số doanh nghiệp hoặc mã số hộ kinh doanh), địa chỉ trụ sở, họ tên (viết không dấu, A-15) và số định danh cá nhân của chủ hộ / chủ doanh nghiệp tư nhân / người đại diện theo pháp luật của công ty như ghi trên giấy chứng nhận đăng ký, file giấy chứng nhận đăng ký, giấy tờ an toàn thực phẩm, tài khoản ngân hàng đứng tên đơn vị.
  - **AC-26.2** — *Given* đang khai hồ sơ, *When* chọn nguồn hàng và cách bán, *Then* chọn được tự sản xuất/bán lại/cả hai và Shop/nhận đặt hàng/cả hai.
  - **AC-26.3** — *Given* hồ sơ được nộp, *When* lưu, *Then* tài khoản nộp được ghi là chủ của người bán; tài khoản vẫn mua được như trước, trừ mua của chính người bán đó (BR-22).
  - **AC-26.4** — *Given* người bán chọn cách bán "chỉ nhận đặt hàng", *When* xác nhận lựa chọn, *Then* hệ thống báo rõ: sản phẩm sẽ không hiện ở trang tìm kiếm sản phẩm; người mua tìm thấy người bán qua danh sách đơn vị cung cấp, hồ sơ nhận đặt hàng và lời mời từ yêu cầu mở (BR-21).
  - **AC-26.5** — *Given* tài khoản chưa xác minh NFC, *When* mở form khai hồ sơ người bán hoặc nộp hồ sơ (kể cả gọi trực tiếp API), *Then* hệ thống chặn và đưa người dùng sang xác minh NFC (FR-04, BR-23).
  - **AC-26.6** — *Given* loại hình hộ kinh doanh hoặc doanh nghiệp tư nhân, *When* nộp hồ sơ (kể cả gọi trực tiếp API), *Then* máy chủ so số định danh khai báo với số CCCD đã xác minh NFC của tài khoản nộp; nếu không trùng, hệ thống chặn và báo tài khoản làm chủ phải là chính chủ hộ / chủ doanh nghiệp tư nhân (BR-27).
  - **AC-26.7** — *Given* loại hình công ty, *When* nộp hồ sơ thành công, *Then* hệ thống báo rõ nền tảng sẽ liên hệ để làm việc trực tiếp và ký thỏa thuận hợp tác trước khi duyệt (BR-26); số định danh người đại diện không bắt buộc trùng với chủ tài khoản.
  - **AC-26.8** — *Given* hồ sơ được nộp hoặc nộp lại, *When* lưu, *Then* hệ thống ghi lại kết quả so tại thời điểm nộp: số định danh khai báo trùng hay không trùng với CCCD của chủ tài khoản, và mức khớp họ tên (A-15); số định danh khai báo chỉ được lưu dạng mã băm và dạng đã che (NFR-03).
  - **AC-26.9** — *Given* người dùng mở form khai hồ sơ, *When* form hiển thị, *Then* hệ thống báo rõ phí đăng ký mở bán theo mức hiện hành (FR-53) áp cho mọi người bán, đóng một lần sau khi hồ sơ được duyệt để bắt đầu kinh doanh, không thu lúc nộp (BR-31).
- **Trường hợp đặc biệt / lỗi:** Họ tên nhập có dấu → hệ thống báo lỗi tại trường, yêu cầu viết không dấu. Số định danh trùng nhưng họ tên khai báo khác họ tên theo thẻ (gõ sai) → vẫn cho nộp; kết quả so họ tên hiện cho quản trị (AC-45.4). Chuyển quyền chủ: chưa quyết (Q-03); giao dịch đang chạy giữa chủ mới và người bán khi chuyển quyền: Q-28. Chủ mới khi chuyển quyền cũng phải đã xác minh NFC (BR-23) và thỏa BR-26 hoặc BR-27 theo loại hình.
- **Phụ thuộc:** FR-45, FR-04.

### FR-27: Theo dõi kết quả duyệt
- **Ưu tiên:** Must
- **User story:** Là người bán đang chờ duyệt, tôi muốn biết hồ sơ đang ở trạng thái nào, để bổ sung khi cần.
- **Mô tả chi tiết:** Trạng thái hồ sơ theo mục 7.1.
- **Acceptance Criteria:**
  - **AC-27.1** — *Given* hồ sơ đã nộp, *When* chủ xem, *Then* thấy một trong: đang chờ, cần bổ sung, đã duyệt, bị từ chối.
  - **AC-27.2** — *Given* hồ sơ cần bổ sung hoặc bị từ chối, *When* chủ xem, *Then* thấy lý do và nộp lại được.
  - **AC-27.3** — *Given* hồ sơ chưa được duyệt, *When* chủ cố đăng sản phẩm hoặc nhận yêu cầu, *Then* hệ thống chặn.
  - **AC-27.4** — *Given* hồ sơ đã duyệt và chủ chưa đóng phí đăng ký mở bán, *When* chủ đăng sản phẩm hoặc nhận yêu cầu, *Then* hệ thống chặn và đưa chủ sang đóng phí (BR-31).
  - **AC-27.5** — *Given* chủ thanh toán phí đăng ký mở bán, *When* có IPN thành công (BR-25), *Then* người bán được mở bán, thời điểm đóng phí được ghi vào hồ sơ, và phí không bị thu lần thứ hai.
  - **AC-27.6** — *Given* nền tảng đã gắn hóa đơn phí đăng ký, *When* chủ mở hồ sơ người bán, *Then* tải được hóa đơn (cách lập hóa đơn: Q-36).
- **Trường hợp đặc biệt / lỗi:** Hồ sơ loại hình công ty ở trạng thái "đang chờ" hiện thêm ghi chú chờ làm việc trực tiếp với nền tảng (BR-26); không có trạng thái riêng.
- **Phụ thuộc:** FR-45.

### FR-28: Khai vùng giao hàng
- **Ưu tiên:** Must
- **User story:** Là người bán, tôi muốn khai các khu vực mình giao được, để chỉ nhận đơn trong tầm phục vụ.
- **Mô tả chi tiết:** Đơn vị khu vực chưa quyết (Q-12). Phí giao nội thành theo BR-30.
- **Acceptance Criteria:**
  - **AC-28.1** — *Given* người bán đã duyệt, *When* khai vùng giao, *Then* chọn được nhiều khu vực.
  - **AC-28.2** — *Given* vùng giao đã lưu, *When* người mua ngoài vùng duyệt sản phẩm, *Then* không thấy sản phẩm "giao nội thành" của người bán đó.
  - **AC-28.3** — *Given* người bán đã duyệt, *When* khai vùng giao, *Then* khai thêm một mức phí giao nội thành cố định (VND), áp cho mỗi đơn có địa chỉ giao trong vùng (BR-30).
- **Trường hợp đặc biệt / lỗi:** Thu hẹp vùng hoặc đổi phí giao không ảnh hưởng đơn đã tạo (BR-19).
- **Phụ thuộc:** FR-05, FR-16.

### Nhóm 6 – Shop

### FR-29: Đăng sản phẩm có sẵn
- **Ưu tiên:** Must
- **User story:** Là người bán có Shop, tôi muốn đăng sản phẩm, để người mua mua ngay được.
- **Mô tả chi tiết:** Áp dụng BR-06, BR-12, BR-13. Chỉ người bán có bật Shop mới đăng được sản phẩm mua ngay (BR-21).
- **Acceptance Criteria:**
  - **AC-29.1** — *Given* người bán có Shop, *When* đăng sản phẩm, *Then* bắt buộc có tên, ảnh, mô tả, giá niêm yết đã gồm thuế, tồn kho, hạn dùng.
  - **AC-29.2** — *Given* người bán có nguồn hàng là bán lại, *When* đăng sản phẩm bán lại, *Then* bắt buộc nhập thương hiệu và nơi sản xuất.
  - **AC-29.3** — *Given* sản phẩm chưa đạt tiêu chuẩn đóng gói, *When* người bán chọn nhãn giao, *Then* chỉ chọn được "giao nội thành".
- **Trường hợp đặc biệt / lỗi:** Cách xác nhận đạt tiêu chuẩn đóng gói: chưa quyết (Q-11). Sản phẩm hiển thị ngay sau khi đăng, không qua duyệt (BR-24).
- **Phụ thuộc:** FR-27, Q-11.

### FR-30: Cập nhật tồn kho và giá
- **Ưu tiên:** Must
- **User story:** Là người bán có Shop, tôi muốn sửa tồn kho và giá, để thông tin luôn đúng.
- **Mô tả chi tiết:** Áp dụng BR-19.
- **Acceptance Criteria:**
  - **AC-30.1** — *Given* tồn kho được đặt về 0, *When* người mua xem sản phẩm, *Then* không mua ngay được.
  - **AC-30.2** — *Given* đơn đã thanh toán, *When* người bán đổi giá, *Then* số tiền của đơn đó không đổi.
- **Trường hợp đặc biệt / lỗi:** Tồn kho không nhận số âm.
- **Phụ thuộc:** FR-09.

### FR-31: Đặt giá theo số lượng và ngưỡng báo giá
- **Ưu tiên:** Should
- **User story:** Là người bán có Shop, tôi muốn đặt giá giảm theo số lượng và một ngưỡng phải qua báo giá, để khuyến khích mua nhiều mà vẫn kiểm soát được đơn lớn.
- **Mô tả chi tiết:** Quy tắc chênh lệch giá sỉ/lẻ chưa quyết (Q-06).
- **Acceptance Criteria:**
  - **AC-31.1** — *Given* một sản phẩm, *When* người bán thêm bậc giá, *Then* lưu được nhiều bậc (số lượng từ, đơn giá) không chồng lấn.
  - **AC-31.2** — *Given* người bán có bật nhận đặt hàng, *When* đặt ngưỡng báo giá, *Then* người mua nhập số lượng ≥ ngưỡng sẽ được chuyển sang gửi yêu cầu (FR-08).
  - **AC-31.3** — *Given* người bán không bật nhận đặt hàng, *When* xem cấu hình, *Then* ngưỡng báo giá không có tác dụng.
- **Trường hợp đặc biệt / lỗi:** Không có.
- **Phụ thuộc:** FR-08, FR-35, Q-06.

### FR-32: Xử lý đơn mua ngay
- **Ưu tiên:** Must
- **User story:** Là người bán có Shop, tôi muốn xác nhận và cập nhật trạng thái đơn, để người mua theo dõi được.
- **Mô tả chi tiết:** Trạng thái theo mục 7.1.
- **Acceptance Criteria:**
  - **AC-32.1** — *Given* có đơn mới, *When* người bán mở danh sách, *Then* thấy đơn kèm địa chỉ giao và thông tin xuất hóa đơn doanh nghiệp nếu có.
  - **AC-32.2** — *Given* một đơn, *When* người bán chuyển trạng thái, *Then* chỉ đi theo thứ tự: xác nhận → đang giao → đã giao.
  - **AC-32.3** — *Given* đơn liên tỉnh, *When* chuyển sang đang giao, *Then* bắt buộc có mã vận đơn của hãng vận chuyển.
- **Trường hợp đặc biệt / lỗi:** Người bán không xác nhận được đơn (hết hàng thực tế) → hủy và hoàn tiền: chưa quyết (Q-01).
- **Phụ thuộc:** FR-10, Q-18.

> FR-33, FR-34 thuộc Nhóm 6 – Shop nhưng được thêm sau nên mang số mới; giữ nguyên số cũ để không lệch tham chiếu.

### FR-33: Sửa thông tin sản phẩm
- **Ưu tiên:** Should
- **User story:** Là người bán có Shop, tôi muốn sửa tên, ảnh, mô tả, hạn dùng và các thông tin khác của sản phẩm, để thông tin luôn đúng mà không phải đăng lại.
- **Mô tả chi tiết:** Bổ sung cho FR-30 (chỉ gồm tồn kho và giá). Áp dụng BR-12, BR-13, BR-19, BR-24.
- **Acceptance Criteria:**
  - **AC-33.1** — *Given* sản phẩm đang bán hoặc đang ẩn, *When* người bán sửa tên, ảnh, mô tả, hạn dùng, thương hiệu, nơi sản xuất hoặc nhãn giao, *Then* thay đổi được lưu và hiển thị ngay cho người mua, không qua duyệt (BR-24).
  - **AC-33.2** — *Given* sản phẩm có nguồn hàng bán lại, *When* người bán xóa trống thương hiệu hoặc nơi sản xuất, *Then* hệ thống chặn (AC-29.2).
  - **AC-33.3** — *Given* sản phẩm chưa đạt tiêu chuẩn đóng gói, *When* người bán đổi nhãn giao, *Then* chỉ chọn được "giao nội thành" (AC-29.3).
  - **AC-33.4** — *Given* đơn đã tạo có sản phẩm này, *When* người bán sửa thông tin, *Then* thông tin chép trong đơn không đổi (BR-19).
- **Trường hợp đặc biệt / lỗi:** Sản phẩm "bị gỡ" → người bán không sửa được (BR-24).
- **Phụ thuộc:** FR-29, FR-30.

### FR-34: Ẩn và hiện lại sản phẩm
- **Ưu tiên:** Should
- **User story:** Là người bán có Shop, tôi muốn tạm ẩn một sản phẩm và hiện lại sau, để ngừng bán tạm thời mà không mất dữ liệu.
- **Mô tả chi tiết:** Dùng trạng thái "ẩn" của Product. Áp dụng BR-19, BR-24.
- **Acceptance Criteria:**
  - **AC-34.1** — *Given* sản phẩm đang bán, *When* người bán ẩn, *Then* sản phẩm rời trang tìm kiếm và trang Shop phía người mua.
  - **AC-34.2** — *Given* sản phẩm bị ẩn khi đang nằm trong giỏ của người mua, *When* người mua thanh toán, *Then* sản phẩm bị loại khỏi lần thanh toán kèm thông báo.
  - **AC-34.3** — *Given* đơn đã tạo có sản phẩm bị ẩn, *When* hệ thống xử lý đơn, *Then* đơn vẫn chạy bình thường.
  - **AC-34.4** — *Given* sản phẩm đang ẩn, *When* người bán hiện lại, *Then* hệ thống cho phép chỉ khi sản phẩm đủ trường bắt buộc (AC-29.1).
  - **AC-34.5** — *Given* sản phẩm "bị gỡ" (FR-46), *When* người bán tìm thao tác hiện lại, *Then* không có (BR-24).
  - **AC-34.6** — *Given* bất kỳ sản phẩm nào, *When* người bán tìm thao tác xóa, *Then* không có; sản phẩm đăng nhầm hoặc ngừng bán thì ẩn, để giữ lịch sử đơn, đánh giá và đối soát.
- **Trường hợp đặc biệt / lỗi:** Không có.
- **Phụ thuộc:** FR-29, FR-46.

### Nhóm 7 – Nhận đặt hàng

### FR-35: Khai hồ sơ nhận đặt hàng
- **Ưu tiên:** Must
- **User story:** Là người bán, tôi muốn khai điều kiện nhận đặt hàng, để chỉ nhận những yêu cầu mình làm được.
- **Mô tả chi tiết:** Trường bổ sung theo nguồn hàng.
- **Acceptance Criteria:**
  - **AC-35.1** — *Given* người bán đã duyệt, *When* khai hồ sơ, *Then* nhập số lượng tối thiểu, bậc giá tham khảo, thời gian chuẩn bị/sản xuất, khả năng custom, ưu đãi đặt sớm.
  - **AC-35.2** — *Given* nguồn hàng có tự sản xuất, *When* khai, *Then* bắt buộc thêm công suất theo tuần, loại bánh, loại bao bì, khả năng in logo.
  - **AC-35.3** — *Given* nguồn hàng có bán lại, *When* khai, *Then* bắt buộc thêm thương hiệu đang phân phối và số lượng gom được.
  - **AC-35.4** — *Given* người bán không mở Shop, *When* bật nhận đặt hàng, *Then* hệ thống cho phép; người bán này không có sản phẩm ở trang tìm kiếm sản phẩm (BR-21).
- **Trường hợp đặc biệt / lỗi:** Custom khai được chỉ trong phạm vi BR-14.
- **Phụ thuộc:** FR-26.

### FR-36: Nhận yêu cầu phù hợp
- **Ưu tiên:** Must
- **User story:** Là người bán nhận đặt hàng, tôi muốn nhận yêu cầu trực tiếp và lời mời từ yêu cầu mở, để có đơn mà không cần đội sales.
- **Mô tả chi tiết:** Ghép theo BR-16.
- **Acceptance Criteria:**
  - **AC-36.1** — *Given* một yêu cầu mở, *When* không đạt số lượng tối thiểu, sai loại custom hoặc ngoài vùng giao của người bán, *Then* người bán không nhận lời mời.
  - **AC-36.2** — *Given* người bán mở một yêu cầu, *When* xem, *Then* thấy số lượng, hạn giao, địa chỉ giao, nội dung custom, ngân sách nếu có.
  - **AC-36.3** — *Given* một yêu cầu, *When* người bán từ chối, *Then* bắt buộc nhập lý do và người mua được thông báo.
- **Trường hợp đặc biệt / lỗi:** Người bán bị khóa → không nhận yêu cầu mới (BR-20). Yêu cầu do chính tài khoản chủ tạo → người bán không nhận được (BR-22).
- **Phụ thuộc:** FR-15, FR-16, FR-35.

### FR-37: Xem công suất còn lại
- **Ưu tiên:** Should
- **User story:** Là xưởng sản xuất, tôi muốn xem số lượng đã nhận theo từng tuần, để không nhận quá khả năng.
- **Mô tả chi tiết:** "Đã nhận" tính từ các đơn đã cọc, xếp theo tuần giao.
- **Acceptance Criteria:**
  - **AC-37.1** — *Given* xưởng đã khai công suất tuần, *When* mở lịch, *Then* mỗi tuần hiện công suất, số đã nhận, số còn lại.
  - **AC-37.2** — *Given* xưởng soạn báo giá có số lượng vượt công suất còn lại của tuần giao, *When* bấm gửi, *Then* hệ thống cảnh báo (không chặn).
- **Trường hợp đặc biệt / lỗi:** Báo giá đã gửi nhưng chưa được chấp nhận có tính vào "đã nhận" không: chưa quyết (Q-24); mặc định không tính.
- **Phụ thuộc:** FR-35, FR-38.

### FR-38: Soạn và gửi báo giá
- **Ưu tiên:** Must
- **User story:** Là người bán nhận đặt hàng, tôi muốn gửi báo giá theo mẫu chuẩn, để xác nhận mình đáp ứng được và người mua so sánh được.
- **Mô tả chi tiết:** Áp dụng BR-05.
- **Acceptance Criteria:**
  - **AC-38.1** — *Given* người bán soạn báo giá, *When* gửi, *Then* bắt buộc có đơn giá, phí giao, tổng tiền (đã gồm phí giao, BR-30), tỷ lệ cọc, ngày giao, cách giao, thời hạn hiệu lực.
  - **AC-38.2** — *Given* người bán có bậc giá tham khảo, *When* mở form, *Then* đơn giá được gợi ý theo bậc ứng với số lượng; người bán sửa được và thêm được phụ phí custom.
  - **AC-38.3** — *Given* báo giá đã gửi, *When* người bán muốn đổi, *Then* chỉ thu hồi và gửi bản mới; không sửa trực tiếp.
- **Trường hợp đặc biệt / lỗi:** Không có.
- **Phụ thuộc:** FR-36, FR-37.

### FR-39: Gửi maket để duyệt
- **Ưu tiên:** Must
- **User story:** Là người bán nhận đơn custom, tôi muốn gửi maket cho người mua duyệt, để không in sai.
- **Mô tả chi tiết:** Phía người bán của FR-20.
- **Acceptance Criteria:**
  - **AC-39.1** — *Given* đơn có custom, *When* người bán tải maket lên, *Then* tạo phiên bản mới và người mua được thông báo.
  - **AC-39.2** — *Given* chưa có maket được duyệt, *When* người bán chuyển đơn sang sản xuất, *Then* bị chặn.
- **Trường hợp đặc biệt / lỗi:** Không có.
- **Phụ thuộc:** FR-20.

### FR-40: Cập nhật tiến độ
- **Ưu tiên:** Must
- **User story:** Là người bán nhận đặt hàng, tôi muốn cập nhật tiến độ từng đơn, để người mua không phải gọi hỏi.
- **Mô tả chi tiết:** Trạng thái theo mục 7.1.
- **Acceptance Criteria:**
  - **AC-40.1** — *Given* đơn đặt hàng, *When* người bán cập nhật, *Then* chỉ đi theo thứ tự: đang sản xuất/chuẩn bị → sẵn sàng giao → đã giao.
  - **AC-40.2** — *Given* mỗi lần cập nhật, *When* lưu, *Then* có thể kèm ghi chú và ảnh, và được ghi vào lịch sử tiến độ.
- **Trường hợp đặc biệt / lỗi:** Không có.
- **Phụ thuộc:** FR-21.

### FR-41: Yêu cầu giải ngân tiền cọc
- **Ưu tiên:** Must
- **User story:** Là người bán nhận đặt hàng, tôi muốn xin giải ngân một phần tiền cọc, để có vốn mua nguyên liệu, in ấn, nhập hàng.
- **Mô tả chi tiết:** Áp dụng BR-09.
- **Acceptance Criteria:**
  - **AC-41.1** — *Given* đơn có cọc đang giữ, *When* người bán gửi yêu cầu, *Then* bắt buộc nhập số tiền và mục đích (nguyên liệu, in ấn, bao bì, nhập hàng).
  - **AC-41.2** — *Given* tổng số đã giải ngân và đang chờ cộng số tiền mới vượt cọc đang giữ, *When* gửi, *Then* hệ thống chặn.
  - **AC-41.3** — *Given* yêu cầu đã gửi, *When* người bán xem, *Then* thấy trạng thái đang chờ, đã duyệt, hoặc bị từ chối kèm lý do.
- **Trường hợp đặc biệt / lỗi:** Có thể đổi sang giải ngân theo mốc tiến độ (Q-02).
- **Phụ thuộc:** FR-47.

### FR-42: Giao đơn đặt hàng theo lịch hẹn
- **Ưu tiên:** Must
- **User story:** Là người bán nhận đặt hàng, tôi muốn giao theo lịch đã ghi trong báo giá và cập nhật trạng thái, để hoàn tất đơn.
- **Mô tả chi tiết:** Đơn đặt hàng không giới hạn địa lý; cách giao thỏa thuận trong báo giá.
- **Acceptance Criteria:**
  - **AC-42.1** — *Given* đơn đặt hàng, *When* người bán mở đơn, *Then* thấy ngày giao, cách giao và phí giao đã thỏa thuận trong báo giá.
  - **AC-42.2** — *Given* người bán đánh dấu đã giao, *When* lưu, *Then* người mua nhận yêu cầu thanh toán phần còn lại (FR-22).
- **Trường hợp đặc biệt / lỗi:** Giao trễ so với ngày trong báo giá → người mua có thể khiếu nại (FR-12).
- **Phụ thuộc:** FR-22, FR-38.

### Nhóm 8 – Tiền và hóa đơn phía người bán

### FR-43: Xem đối soát
- **Ưu tiên:** Must
- **User story:** Là người bán, tôi muốn xem tiền của từng đơn, để biết mình sẽ nhận bao nhiêu và khi nào.
- **Mô tả chi tiết:** Tiền sẽ nhận = tổng tiền (gồm phí giao) − đã giải ngân − hoàn tiền (nếu có). Không tính hoa hồng (BR-10 đã bỏ).
- **Acceptance Criteria:**
  - **AC-43.1** — *Given* một đơn, *When* người bán xem đối soát, *Then* thấy tổng tiền, tiền nền tảng đang giữ, tiền đã giải ngân, tiền sẽ nhận và ngày dự kiến nhận.
  - **AC-43.2** — *Given* danh sách đối soát, *When* lọc theo khoảng thời gian và xuất file, *Then* file chứa đúng các đơn trong khoảng đó.
- **Trường hợp đặc biệt / lỗi:** Đơn đang khiếu nại → hiện là đang giữ, chưa có ngày dự kiến.
- **Phụ thuộc:** FR-48.

### FR-44: Lập hóa đơn cho đơn hàng
- **Ưu tiên:** Must
- **User story:** Là người bán, tôi muốn lập và gắn hóa đơn vào từng đơn, để làm đúng nghĩa vụ và người mua có chứng từ.
- **Mô tả chi tiết:** Theo A-02: người bán phát hành hóa đơn bên ngoài và tải file lên.
- **Acceptance Criteria:**
  - **AC-44.1** — *Given* một đơn, *When* người bán mở, *Then* thấy rõ đơn có hay không có thông tin xuất hóa đơn doanh nghiệp, và nội dung thông tin đó.
  - **AC-44.2** — *Given* người bán gắn hóa đơn, *When* lưu, *Then* người mua tải được (FR-25).
  - **AC-44.3** — *Given* đơn chưa có hóa đơn, *When* người bán xem danh sách đơn, *Then* đơn đó được đánh dấu nhắc.
- **Trường hợp đặc biệt / lỗi:** Thời hạn nhắc: chưa quyết (Q-09).
- **Phụ thuộc:** FR-24, Q-04, Q-09.

### Nhóm 9 – Quản trị nền tảng

### FR-45: Duyệt hồ sơ người bán
- **Ưu tiên:** Must
- **User story:** Là quản trị, tôi muốn xem và duyệt hồ sơ người bán, để chỉ đơn vị hợp lệ mới được bán.
- **Mô tả chi tiết:** Phía quản trị của FR-26, FR-27. Áp dụng BR-26, BR-27. Hệ thống không đọc được nội dung file giấy chứng nhận và không kết nối cổng đăng ký doanh nghiệp, nên quản trị đối chiếu thủ công; hệ thống tự động so số định danh và họ tên đã khai với kết quả xác minh NFC của chủ tài khoản (A-14, A-15).
- **Acceptance Criteria:**
  - **AC-45.1** — *Given* hồ sơ đang chờ, *When* quản trị mở, *Then* xem được giấy chứng nhận đăng ký, giấy tờ an toàn thực phẩm, tài khoản ngân hàng, kết quả xác minh NFC của chủ (họ tên theo dữ liệu thẻ, số CCCD đã che, thời điểm xác minh), và thông tin chủ hộ / chủ doanh nghiệp tư nhân / người đại diện đã khai (họ tên, số định danh đã che).
  - **AC-45.2** — *Given* hồ sơ đang chờ, *When* quản trị yêu cầu bổ sung hoặc từ chối, *Then* bắt buộc nhập lý do.
  - **AC-45.3** — *Given* quản trị ra quyết định, *When* lưu, *Then* chủ người bán được thông báo.
  - **AC-45.4** — *Given* hồ sơ đang chờ, *When* quản trị mở, *Then* hệ thống hiện kết quả so đã ghi lúc nộp (AC-26.8): số định danh khai báo trùng hay không trùng với CCCD của chủ tài khoản, và họ tên khai báo so với họ tên theo thẻ là khớp hay không khớp (A-15); kết quả "không trùng" hoặc "không khớp" hiện thành cảnh báo. Với công ty, số định danh không trùng là bình thường khi chủ tài khoản không phải người đại diện; cảnh báo ghi rõ điều này.
  - **AC-45.5** — *Given* bất kỳ hồ sơ nào, *When* quản trị bấm duyệt, *Then* bắt buộc xác nhận đã đối chiếu tên đơn vị, mã số, họ tên và số định danh của chủ hộ / chủ doanh nghiệp tư nhân / người đại diện đã khai với file giấy chứng nhận đăng ký; với doanh nghiệp tư nhân và công ty, xác nhận thêm đã tra cứu mã số doanh nghiệp trên Cổng thông tin quốc gia về đăng ký doanh nghiệp (A-14).
  - **AC-45.6** — *Given* hồ sơ loại hình công ty, *When* quản trị bấm duyệt, *Then* hệ thống chỉ cho phép khi đã có bản ghi buổi làm việc trực tiếp gồm ngày làm việc, quản trị thực hiện, họ tên người đại diện theo pháp luật đã làm việc, và file thỏa thuận hợp tác đã ký có ghi tài khoản làm chủ người bán (BR-26).
- **Trường hợp đặc biệt / lỗi:** Người bán sửa hồ sơ pháp lý hoặc tài khoản ngân hàng sau khi đã duyệt → có cần duyệt lại không: chưa quyết (Q-26). Người đại diện trên thỏa thuận khác người đại diện đã khai trong hồ sơ → quản trị yêu cầu bổ sung.
- **Phụ thuộc:** FR-27, FR-04.

### FR-46: Khóa người bán hoặc sản phẩm vi phạm
- **Ưu tiên:** Should
- **User story:** Là quản trị, tôi muốn khóa một người bán hoặc gỡ một sản phẩm, để bảo vệ người mua.
- **Mô tả chi tiết:** Áp dụng BR-20.
- **Acceptance Criteria:**
  - **AC-46.1** — *Given* người bán bị khóa, *When* người mua tìm hoặc gửi yêu cầu, *Then* không thấy và không đặt được đơn mới; đơn đang chạy vẫn xử lý tiếp.
  - **AC-46.2** — *Given* quản trị khóa hoặc gỡ, *When* lưu, *Then* bắt buộc có lý do và hệ thống ghi người thực hiện, thời điểm.
- **Trường hợp đặc biệt / lỗi:** Sản phẩm bị gỡ đang nằm trong giỏ người mua → bị loại khỏi giỏ ở bước thanh toán.
- **Phụ thuộc:** NFR-07.

### FR-47: Duyệt yêu cầu giải ngân tiền cọc
- **Ưu tiên:** Must
- **User story:** Là quản trị, tôi muốn xét từng yêu cầu giải ngân, để tiền cọc được dùng đúng cho đơn hàng.
- **Mô tả chi tiết:** Áp dụng BR-09. Duyệt giải ngân là ghi sổ: hệ thống cập nhật số đã giải ngân của đơn và thông báo người bán; không phát sinh giao dịch ngân hàng thật (A-12).
- **Acceptance Criteria:**
  - **AC-47.1** — *Given* một yêu cầu giải ngân, *When* quản trị mở, *Then* thấy số tiền xin, mục đích, tiền cọc đang giữ, số đã giải ngân của đơn.
  - **AC-47.2** — *Given* số tiền duyệt vượt phần cọc còn giữ, *When* quản trị bấm duyệt, *Then* hệ thống chặn.
  - **AC-47.3** — *Given* yêu cầu được duyệt một phần hoặc toàn bộ, *When* hoàn tất, *Then* phần cọc chưa giải ngân tiếp tục được giữ đến khi giao thành công.
  - **AC-47.4** — *Given* quản trị bấm duyệt, *When* lưu, *Then* sổ tiền của đơn (Escrow / Ledger) tăng `disbursed` đúng số đã duyệt, người bán được thông báo, và log ghi người duyệt, thời điểm, số tiền (NFR-07).
- **Trường hợp đặc biệt / lỗi:** Từ chối → bắt buộc lý do.
- **Phụ thuộc:** FR-41, Q-02.

### FR-48: Chuyển tiền cho người bán khi đơn hoàn tất
- **Ưu tiên:** Must
- **User story:** Là quản trị, tôi muốn tiền được chuyển cho người bán khi đủ điều kiện, để đối soát đúng hạn.
- **Mô tả chi tiết:** Áp dụng BR-08, BR-18.
- **Acceptance Criteria:**
  - **AC-48.1** — *Given* đơn được người mua xác nhận đã nhận hàng hoặc hết thời hạn khiếu nại mà không có khiếu nại mở, *When* hệ thống xét, *Then* đơn đủ điều kiện chuyển tiền.
  - **AC-48.2** — *Given* đơn liên tỉnh, *When* tính thời hạn giữ tiền, *Then* thời hạn dài hơn đơn nội thành.
  - **AC-48.3** — *Given* đơn đủ điều kiện, *When* chuyển tiền, *Then* số chuyển = tổng tiền (gồm phí giao) − số đã giải ngân − số đã hoàn.
  - **AC-48.4** — *Given* hệ thống đã liệt kê các đơn đủ điều kiện, *When* quản trị bấm duyệt chuyển tiền cho một đơn, *Then* hệ thống ghi sổ `paid_out`, đơn chuyển sang hoàn tất về tiền và người bán được thông báo; không phát sinh giao dịch ngân hàng thật (A-12).
  - **AC-48.5** — *Given* đơn có khiếu nại đang mở, *When* quản trị bấm chuyển tiền, *Then* hệ thống chặn (BR-18).
- **Trường hợp đặc biệt / lỗi:** Chuyển tiền do quản trị bấm duyệt, không tự động (A-12, Q-27 đã chốt). Con số thời hạn: Q-10.
- **Phụ thuộc:** FR-11, FR-12.

### FR-49: Xử lý tranh chấp và hoàn tiền
- **Ưu tiên:** Must
- **User story:** Là quản trị, tôi muốn xử lý khiếu nại của người mua, để hai bên được phân xử công bằng.
- **Mô tả chi tiết:** Phía quản trị của FR-12.
- **Acceptance Criteria:**
  - **AC-49.1** — *Given* một khiếu nại, *When* quản trị mở, *Then* xem được đơn, báo giá, các phiên bản maket, lịch sử tiến độ và bằng chứng của hai bên.
  - **AC-49.2** — *Given* quản trị quyết định, *When* lưu, *Then* là một trong: hoàn toàn bộ, hoàn một phần, bác; bắt buộc có lý do.
  - **AC-49.3** — *Given* quyết định hoàn tiền, *When* thực hiện, *Then* tiền hoàn lấy từ khoản nền tảng đang giữ của đơn; hệ thống gọi API hoàn tiền của VNPay sandbox cho giao dịch gốc và ghi sổ `refunded`. Nếu VNPay từ chối hoặc lỗi, hệ thống vẫn ghi quyết định, đánh dấu "hoàn tiền cần xử lý tay" và thông báo quản trị (A-11).
- **Trường hợp đặc biệt / lỗi:** Số hoàn vượt số đang giữ (vì cọc đã giải ngân) → xử lý thế nào: chưa quyết (Q-01).
- **Phụ thuộc:** FR-12, Q-01.

### FR-50: Quản lý voucher hệ thống
- **Ưu tiên:** Could
- **User story:** Là quản trị, tôi muốn tạo và tắt voucher, để chạy khuyến mãi.
- **Mô tả chi tiết:** Không có.
- **Acceptance Criteria:**
  - **AC-50.1** — *Given* quản trị tạo voucher, *When* lưu, *Then* voucher có mức giảm, thời hạn, số lượt dùng, điều kiện áp dụng; voucher chỉ áp cho đơn mua ngay (BR-32).
  - **AC-50.2** — *Given* voucher bị tắt, *When* người mua nhập mã, *Then* bị từ chối.
- **Trường hợp đặc biệt / lỗi:** Q-22.
- **Phụ thuộc:** FR-13.

### FR-51: Đối soát toàn nền tảng
- **Ưu tiên:** Should
- **User story:** Là quản trị, tôi muốn xem đối soát của toàn nền tảng, để biết tiền nền tảng đang giữ và đã đi đâu.
- **Mô tả chi tiết:** Đọc từ sổ tiền theo đơn (Escrow / Ledger) và các khoản phí đăng ký mở bán (BR-31). Áp dụng NFR-09.
- **Acceptance Criteria:**
  - **AC-51.1** — *Given* quản trị mở đối soát, *When* chọn một đơn, *Then* thấy số người mua đã trả, đang giữ, đã giải ngân, đã chuyển cho người bán và đã hoàn.
  - **AC-51.2** — *Given* danh sách đối soát, *When* lọc theo khoảng thời gian, *Then* thấy tổng các con số trên của các đơn trong khoảng đó.
  - **AC-51.3** — *Given* có người bán đã đóng phí đăng ký mở bán, *When* quản trị xem đối soát, *Then* thấy từng khoản phí đã thu (người bán, số tiền, thời điểm) và tổng.
  - **AC-51.4** — *Given* một đơn có đã giải ngân + đã chuyển + đã hoàn vượt số người mua đã trả, *When* hiển thị, *Then* đơn được đánh dấu để kiểm tra (NFR-09).
- **Trường hợp đặc biệt / lỗi:** Đơn đang khiếu nại hiện là đang giữ.
- **Phụ thuộc:** FR-43, FR-47, FR-48, FR-49, BR-31.

### FR-52: Đặt bảng phí giao liên tỉnh
- **Ưu tiên:** Must
- **User story:** Là quản trị, tôi muốn đặt phí giao liên tỉnh theo tỉnh nhận hàng, để người mua thấy phí trước khi thanh toán đơn hàng giao toàn quốc.
- **Mô tả chi tiết:** Áp dụng BR-30. Phí theo bảng, không theo cân nặng hay giá của hãng vận chuyển (Context mục 9). Bảng phí luôn có mức cho mọi tỉnh/thành (A-18).
- **Acceptance Criteria:**
  - **AC-52.1** — *Given* trang cấu hình, *When* quản trị đặt phí, *Then* mỗi tỉnh/thành nhận hàng có một mức phí (VND, số nguyên ≥ 0), tính cho mỗi đơn.
  - **AC-52.2** — *Given* bảng phí thay đổi, *When* tính phí giao, *Then* đơn tạo trước thời điểm thay đổi giữ mức cũ (BR-19).
  - **AC-52.3** — *Given* quản trị lưu bảng phí, *When* còn tỉnh/thành chưa có mức phí, *Then* hệ thống không cho lưu và chỉ ra tỉnh còn thiếu; bảng phí đang dùng luôn đủ mọi tỉnh/thành (A-18).
- **Trường hợp đặc biệt / lỗi:** Không có.
- **Phụ thuộc:** FR-09, NFR-07.

### FR-53: Đặt mức phí đăng ký mở bán
- **Ưu tiên:** Must
- **User story:** Là quản trị, tôi muốn đặt mức phí đăng ký mở bán, để điều chỉnh nguồn thu của nền tảng.
- **Mô tả chi tiết:** Áp dụng BR-31. Mức mặc định 200.000đ.
- **Acceptance Criteria:**
  - **AC-53.1** — *Given* trang cấu hình, *When* quản trị đặt mức phí, *Then* mức phí là số nguyên VND lớn hơn 0 và có hiệu lực từ thời điểm lưu.
  - **AC-53.2** — *Given* mức phí vừa thay đổi, *When* xét người bán đã đóng phí trước đó, *Then* không thu thêm và không hoàn phần chênh.
  - **AC-53.3** — *Given* người bán đã duyệt nhưng chưa đóng phí, *When* tạo giao dịch thanh toán phí, *Then* số phải đóng là mức hiện hành tại thời điểm tạo giao dịch.
- **Trường hợp đặc biệt / lỗi:** Mức phí đổi trong lúc người bán đang ở trang thanh toán → giao dịch đã tạo giữ mức cũ.
- **Phụ thuộc:** FR-27, BR-31, NFR-07.

---

## 6. Yêu cầu phi chức năng (Non-functional Requirements)

Bản ngữ cảnh chưa đặt con số cho phần lớn NFR. Các giá trị ghi "Đề xuất" là điểm xuất phát để nhóm chốt (Q-17), chưa phải ràng buộc.

| ID | Loại | Yêu cầu (phải đo được) |
|---|---|---|
| NFR-01 | Hiệu năng | Đề xuất: trang danh sách/tìm kiếm phản hồi < 2 giây (p95) với 10.000 sản phẩm đang đăng bán. |
| NFR-02 | Tải | Dự án không mô hình hóa cao điểm mùa vụ (mục 4.2). Đề xuất: 500 người dùng đồng thời; không bán vượt tồn kho khi nhiều người mua cùng một sản phẩm (xem FR-09, BR-28). |
| NFR-03 | Bảo mật | Căn cứ: pháp luật về bảo vệ dữ liệu cá nhân (Context mục 9). Mật khẩu được hash bằng thuật toán chậm (bcrypt/argon2). Giấy tờ pháp lý và tài khoản ngân hàng của người bán chỉ chủ người bán và quản trị xem được. Không đưa dữ liệu cá nhân vào URL. Phân quyền theo vai: người mua / chủ người bán / quản trị. Dữ liệu xác minh NFC lưu tối thiểu theo AC-04.11. Số định danh, ngày sinh và nơi thường trú được mã hóa khi truyền từ app lên máy chủ, ngoài HTTPS (AC-04.10); số định danh và ngày sinh được mã hóa khi lưu, không lưu dạng đọc được. Số CCCD đầy đủ chỉ hiển thị trên điện thoại của chính người dùng ở bước xác nhận (AC-04.4); mọi màn hình khác chỉ hiện dạng đã che (AC-04.12); mã QR của phiên xác minh không chứa dữ liệu cá nhân. Mã băm số CCCD dùng khóa bí mật phía máy chủ (không băm trần), vì số CCCD ít chữ số và có thể dò ngược. Khóa băm chỉ nằm ở một thành phần máy chủ duy nhất; mọi phép băm và so khớp số CCCD / số định danh đều đi qua thành phần đó. Khóa mã hóa dữ liệu xác minh khi lưu và khóa giải mã dữ liệu app gửi lên cũng chỉ nằm ở thành phần đó, có phiên bản, mỗi môi trường một bộ. Mỗi môi trường (phát triển, demo, vận hành) dùng khóa riêng, không đưa vào mã nguồn. Mỗi mã băm lưu kèm phiên bản khóa đã dùng; khi cần đổi khóa (ví dụ khóa bị lộ), hệ thống thêm phiên bản mới và băm lại từng bản ghi: với tài khoản, băm lại từ số định danh đã mã hóa; với số định danh khai ở hồ sơ người bán (chỉ lưu mã băm), băm lại vào lần kế tiếp người dùng nộp lại hồ sơ. Số định danh khai ở hồ sơ người bán (AC-26.1) được bảo vệ như số CCCD: chỉ lưu mã băm có khóa bí mật và dạng đã che, chỉ chủ người bán và quản trị xem được dạng đã che. File thỏa thuận hợp tác (BR-26) chỉ chủ người bán và quản trị xem được. Thông tin đăng nhập SMTP (A-17) đặt qua biến môi trường, không đưa vào mã nguồn. |
| NFR-04 | Tương thích | Đề xuất: Chrome, Edge, Safari, Firefox 2 phiên bản mới nhất; responsive từ 360px (đa số người mua phổ thông và chủ tiệm dùng điện thoại). App mobile xác minh NFC viết bằng Flutter: Android và iOS trên máy có NFC (phiên bản tối thiểu: Q-07). iOS cần capability đọc thẻ NFC, thường đòi tài khoản Apple Developer trả phí; demo ưu tiên Android. |
| NFR-05 | Khả dụng | Đề xuất: uptime 99,5%; thanh toán và báo giá không mất dữ liệu khi lỗi giữa chừng. |
| NFR-06 | Ngôn ngữ / i18n | Tiếng Việt; tiền VND, không có số lẻ; ngày DD/MM/YYYY; giờ Việt Nam (UTC+7). Mọi giá hiển thị đã gồm thuế GTGT. |
| NFR-07 | Logging / audit | Ghi log bất biến (ai, lúc nào, giá trị trước/sau) cho: khóa/gỡ, duyệt hồ sơ (kèm kết quả so số định danh, họ tên và các xác nhận đối chiếu của quản trị), ghi nhận buổi làm việc trực tiếp và file thỏa thuận hợp tác (BR-26), duyệt giải ngân, duyệt chuyển tiền cho người bán, mọi lệnh hoàn tiền gửi VNPay và kết quả, quyết định tranh chấp, đổi bảng phí giao liên tỉnh, đổi mức phí đăng ký mở bán, thanh toán phí đăng ký mở bán, gửi/thu hồi báo giá, phiên bản maket, cập nhật tiến độ, sửa tài khoản ngân hàng người bán, mọi lần xác minh NFC (thành công, thất bại, tạm khóa). Thao tác trên người bán luôn được ghi là của chủ (không có tài khoản nhân viên). |
| NFR-08 | Lưu trữ file | Đề xuất: ảnh sản phẩm, logo, maket, bằng chứng khiếu nại, hóa đơn, giấy tờ người bán, thỏa thuận hợp tác chấp nhận JPG/PNG/PDF (logo thêm SVG/AI), tối đa 20 MB/file. Phiên bản maket không bị ghi đè. |
| NFR-09 | Toàn vẹn tiền | Mọi số tiền lưu dưới dạng số nguyên VND. Tổng giải ngân + hoàn tiền + chuyển cho người bán của một đơn không vượt số người mua đã trả. |
| NFR-10 | Thông báo | Thông báo trạng thái (FR-10, FR-21, FR-20, FR-27...) đến người nhận trong vòng 1 phút. Kênh: Q-21. |

---

## 7. Dữ liệu

### 7.1 Thực thể chính

| Thực thể | Trường | Kiểu | Bắt buộc | Ràng buộc / ghi chú |
|---|---|---|---|---|
| **Account** | account_id | string | Có | Duy nhất |
| | email | string | Một trong hai | Duy nhất nếu có |
| | phone | string | Một trong hai | Duy nhất nếu có. Chưa dùng trong demo (A-17) |
| | full_name | string | Có | |
| | verified | bool | Có | Chưa xác nhận thì không mua, không gửi yêu cầu |
| | password_hash | string | Có | NFR-03 |
| | nfc_status | enum | Có | chưa xác minh / đã xác minh / tạm khóa. Mặc định chưa xác minh (FR-04, BR-23) |
| | legal_name | string | Có nếu đã xác minh | Họ tên đọc từ thẻ NFC (in hoa, không dấu, A-08) |
| | gender, nationality | enum, string | Có nếu đã xác minh | Từ thẻ NFC |
| | id_number_enc, date_of_birth_enc, pii_key_ver | string, string, int | Có nếu đã xác minh | Số định danh và ngày sinh mã hóa bằng khóa bí mật phía máy chủ, kèm phiên bản khóa (AC-04.11, NFR-03) |
| | id_number_hash, id_hash_key_ver | string, int | Có nếu đã xác minh | Băm có khóa bí mật, kèm phiên bản khóa đã dùng (NFR-03). Duy nhất: một CCCD chỉ gắn với một tài khoản (BR-23); kiểm trùng phải xét mọi phiên bản khóa còn hiệu lực |
| | id_number_masked | string | Có nếu đã xác minh | Ví dụ ********1234 |
| | nfc_verified_at | datetime | Có nếu đã xác minh | |
| **NfcSession** (phiên xác minh) | session_id, account_id | string | Có | Dùng một lần. Thuộc tài khoản tạo phiên; app phải đăng nhập đúng tài khoản này (AC-04.2) |
| | expires_at | datetime | Có | Thời hạn: Q-31 |
| | status | enum | Có | đang chờ / thành công / thất bại / hết hạn |
| | attempts | int | Có | Giới hạn: Q-30 |
| **Address** | address_id, account_id | string | Có | Thuộc một Account |
| | detail, area_code | string | Có | area_code dùng để so vùng giao (Q-12) |
| | is_default | bool | Có | Tối đa một mặc định mỗi Account |
| **Vendor** | vendor_id | string | Có | |
| | owner_account_id | string | Có | Một chủ duy nhất; không có tài khoản nhân viên. Dùng để áp BR-22. Account này phải có nfc_status = đã xác minh (BR-23). Với hộ kinh doanh và doanh nghiệp tư nhân, phải là chính chủ hộ / chủ doanh nghiệp tư nhân (BR-27); với công ty, phải là tài khoản ghi trong thỏa thuận hợp tác (BR-26) |
| | business_name, entity_type | string, enum | Có | business_name: tên đơn vị như trên giấy chứng nhận đăng ký. entity_type: hộ kinh doanh / doanh nghiệp tư nhân / công ty. Hộ kinh doanh và doanh nghiệp tư nhân không có tư cách pháp nhân; công ty (TNHH, cổ phần, hợp danh) có tư cách pháp nhân |
| | tax_code, address | string | Có | tax_code: mã số doanh nghiệp hoặc mã số hộ kinh doanh (đồng thời là mã số thuế) |
| | representative_name | string | Có | Họ tên chủ hộ / chủ doanh nghiệp tư nhân / người đại diện theo pháp luật như trên giấy chứng nhận đăng ký, viết không dấu (A-15) |
| | representative_id_hash, representative_id_key_ver, representative_id_masked | string, int, string | Có | Số định danh cá nhân khai báo; chỉ lưu mã băm có khóa bí mật (cùng cách băm với Account.id_number_hash), phiên bản khóa đã dùng và dạng đã che (NFR-03) |
| | owner_check | {owner_legal_name, owner_id_masked, nfc_verified_at, id_match, name_match, checked_at} | Có | Ghi lúc nộp hoặc nộp lại (AC-26.8). id_match: trùng / không trùng. name_match: khớp / không khớp (A-15). Bất biến cho mỗi lần nộp |
| | onboarding_meeting | {met_at, admin_account_id, representative_name, agreement_file, registry_checked} | Có nếu công ty, trước khi duyệt | Bản ghi buổi làm việc trực tiếp và file thỏa thuận hợp tác (BR-26, AC-45.6) |
| | business_license, food_safety_docs | file[] | Có | |
| | bank_account | object | Có | Đứng tên đơn vị |
| | supply_source | enum | Có | tự sản xuất / bán lại / cả hai |
| | sells_shop, accepts_orders | bool | Có | Ít nhất một là true. sells_shop = false → không có sản phẩm ở trang tìm kiếm sản phẩm (BR-21). Chọn khi khai hồ sơ; chưa đổi được sau khi duyệt (chức năng bật / tắt Shop tạm bỏ) |
| | status | enum | Có | đang chờ / cần bổ sung / đã duyệt / bị từ chối / bị khóa |
| | delivery_areas | area_code[] | Có | FR-28 |
| | local_delivery_fee | int (VND) | Có khi đã duyệt | Phí giao nội thành cố định cho mỗi đơn trong vùng giao (FR-28, BR-30) |
| | registration_fee_payment_id, registration_fee_amount, registration_fee_paid_at | string, int (VND), datetime | Có trước khi mở bán | Phí đăng ký mở bán đã đóng, theo mức hiện hành lúc tạo giao dịch (BR-31, FR-53) |
| | registration_fee_invoice_file | file | Không | Hóa đơn phí đăng ký do nền tảng lập (Q-36) |
| **OrderProfile** (hồ sơ nhận đặt hàng) | vendor_id | string | Có | Một Vendor có tối đa một |
| | min_qty | int | Có | > 0 |
| | ref_price_tiers | {from_qty, unit_price}[] | Có | Tham khảo, không ràng buộc |
| | lead_time_days | int | Có | |
| | custom_capabilities | enum[] | Không | túi / thiệp / sticker / hộp mẫu có sẵn |
| | early_bird_offer | text | Không | |
| | weekly_capacity, cake_types, packaging_types, logo_printing | | Có nếu tự sản xuất | FR-35 |
| | distributed_brands, gatherable_qty | | Có nếu bán lại | FR-35 |
| **Product** | product_id, vendor_id | string | Có | Chỉ tạo được khi Vendor có sells_shop = true (BR-21) |
| | name, images, description | | Có | |
| | list_price | int (VND) | Có | Đã gồm thuế GTGT |
| | stock | int | Có | ≥ 0. Không gồm phần đang giữ cho thanh toán chờ IPN (BR-28) |
| | expiry | date | Có | |
| | brand, origin | string | Có nếu bán lại | BR-12 |
| | delivery_label | enum | Có | nội thành / toàn quốc (BR-13) |
| | qty_price_tiers | {from_qty, unit_price}[] | Không | |
| | quote_threshold | int | Không | Chỉ có tác dụng khi Vendor accepts_orders |
| | status | enum | Có | đang bán / ẩn / bị gỡ. Người bán đổi đang bán ↔ ẩn (FR-34); chỉ quản trị đặt "bị gỡ" (FR-46, BR-24). Không có thao tác xóa |
| **StockReservation** (giữ hàng) | reservation_id, product_id, qty, payment_ref | | Có | BR-28. Một bản ghi cho mỗi sản phẩm trong một lần thanh toán |
| | status | enum | Có | đang giữ / đã chốt / đã trả |
| | expires_at | datetime | Có | Bằng thời hạn thanh toán VNPay; quá hạn mà chưa chốt thì trả lại tồn kho |
| **Request** (yêu cầu) | request_id, buyer_account_id | string | Có | buyer_account_id phải có nfc_status = đã xác minh tại thời điểm tạo (BR-23) |
| | type | enum | Có | trực tiếp / mở |
| | target_vendor_id | string | Có nếu trực tiếp | owner_account_id của Vendor này ≠ buyer_account_id (BR-22) |
| | product_ref, qty, budget | | qty bắt buộc | budget chỉ ở yêu cầu mở |
| | deadline, delivery_address | | Có | |
| | custom_spec, logo_files | | Không | BR-14 |
| | invited_vendor_ids | string[] | Có nếu mở | Không chứa Vendor do buyer_account_id làm chủ (BR-22) |
| | status | enum | Có | đang mở / đã chốt / đã đóng / hết hạn |
| **Quote** (báo giá) | quote_id, request_id, vendor_id | string | Có | |
| | unit_price, total, custom_surcharge | int (VND) | Có (phụ phí: Không) | |
| | deposit_rate | % | Có | |
| | delivery_date, delivery_method, shipping_fee | | Có | shipping_fee nằm trong total (BR-30) |
| | valid_until | datetime | Có | |
| | status | enum | Có | đã gửi / đã thu hồi / hết hiệu lực / được chấp nhận / đã đóng / bị từ chối. Không sửa sau khi gửi |
| **Order** (đơn hàng) | order_id, buyer_account_id, vendor_id | string | Có | Tại thời điểm tạo đơn: buyer_account_id ≠ owner_account_id của Vendor (BR-22); kiểm ở phía máy chủ |
| | kind | enum | Có | mua ngay / đặt hàng |
| | quote_id | string | Có nếu đặt hàng | |
| | items, amounts, shipping_fee, voucher | | Có | Giá và phí giao chép tại thời điểm tạo (BR-19, BR-30). voucher chỉ có ở đơn mua ngay (BR-32) |
| | payment_group_id | string | Có nếu mua ngay | Lần thanh toán đã tạo ra đơn; các đơn cùng lần thanh toán được nhóm để người mua theo dõi (BR-29) |
| | is_interprovince | bool | Có | |
| | invoice_info | {name, tax_code, address, email} | Không | Có = xuất hóa đơn doanh nghiệp. Không tạo thực thể doanh nghiệp |
| | delivery_address | object | Có | Chép từ Address |
| | status (mua ngay) | enum | Có | đã thanh toán / người bán xác nhận / đang giao / đã giao / hoàn tất (+ trạng thái hủy: Q-01) |
| | status (đặt hàng) | enum | Có | đã cọc / chờ duyệt maket / đang sản xuất-chuẩn bị / sẵn sàng giao / đã giao / hoàn tất (+ trạng thái hủy: Q-01) |
| | tracking_code | string | Có nếu liên tỉnh mua ngay | |
| | invoice_file | file | Không | Người bán gắn (FR-44) |
| **MockupVersion** | order_id, version_no, uploaded_at, file | | Có | Bất biến |
| | review_status, review_note | enum, text | Có | chờ duyệt / đã duyệt / yêu cầu sửa |
| **ProgressUpdate** | order_id, milestone, note, photos, at | | milestone, at bắt buộc | Lịch sử bất biến |
| **Payment** | payment_id, order_id, vendor_id, type, amount, status | | Có | type: thanh toán mua ngay / cọc / phần còn lại / hoàn tiền / phí đăng ký mở bán. Một lần thanh toán mua ngay gắn nhiều đơn, mỗi Shop một đơn (BR-29). Phí đăng ký gắn với vendor_id, không gắn đơn (BR-31) |
| | gateway_txn_ref | string | Có | Mã giao dịch nền tảng gửi VNPay; duy nhất cho mỗi lần thanh toán (BR-25) |
| | gateway_txn_no, gateway_response_code, paid_at | | Có khi VNPay trả kết quả | Lấy từ IPN đã kiểm checksum (BR-25) |
| **Escrow / Ledger** | order_id, held, disbursed, refunded, paid_out | int (VND) | Có | NFR-09 |
| **DisbursementRequest** | request_id, order_id, amount, purpose, status, reason | | Có (reason khi từ chối) | purpose: nguyên liệu / in ấn / bao bì / nhập hàng |
| **Dispute** | dispute_id, order_id, reason, evidence, decision, refund_amount, decision_reason | | | decision: hoàn toàn bộ / hoàn một phần / bác |
| **Review** | review_id, order_id, product_id, rating, text | | | Chỉ cho đơn mua ngay đã giao (BR-32). Người bán không trả lời và không xóa được |
| **Voucher** | code, discount, valid_from/to, max_uses, conditions, active | | Có | |
| **InterprovinceFee** (bảng phí giao liên tỉnh) | province_code, fee, effective_from | string, int (VND), datetime | Có | FR-52, BR-30. Một mức hiện hành cho mỗi tỉnh/thành nhận hàng |
| **RegistrationFeeConfig** (mức phí đăng ký mở bán) | amount, effective_from | int (VND), datetime | Có | FR-53, BR-31. amount > 0; mặc định 200.000đ. Một mức hiện hành |

### 7.2 Quy tắc nghiệp vụ
- **BR-01:** Kiểu giao dịch (mua ngay / đặt hàng) do số lượng và yêu cầu của lần mua quyết định, không do người mua là ai.
- **BR-02:** Mua ngay chỉ áp dụng cho sản phẩm đang đăng bán, trong giới hạn tồn kho.
- **BR-03:** Một lần mua phải đi theo đặt hàng khi: vượt tồn kho đang đăng bán; sản phẩm phải sản xuất; có custom; hoặc đạt ngưỡng báo giá người bán đặt.
- **BR-04:** Đơn đặt hàng chỉ được tạo khi người mua chấp nhận báo giá và thanh toán cọc thành công.
- **BR-05:** Báo giá đã gửi không được sửa; người bán chỉ thu hồi và gửi bản mới. Báo giá hết hiệu lực hoặc đã thu hồi không chấp nhận được. Bậc giá tham khảo không ràng buộc; giá trong báo giá ràng buộc.
- **BR-06:** Giá hiển thị đã gồm thuế GTGT và như nhau với mọi người mua.
- **BR-07:** Mọi đơn có hóa đơn do người bán lập. Thông tin xuất hóa đơn doanh nghiệp được nhập theo từng đơn, lưu trong đơn, không tạo hồ sơ doanh nghiệp; hệ thống chỉ kiểm định dạng mã số thuế.
- **BR-08:** Người mua trả cho nền tảng. Nền tảng giữ tiền đến khi đơn được xác nhận nhận hàng hoặc hết thời hạn khiếu nại; đơn liên tỉnh giữ lâu hơn; không thanh toán khi nhận hàng cho đơn liên tỉnh. Đơn đặt hàng thanh toán hai đợt: cọc và phần còn lại.
- **BR-09:** Giải ngân cọc theo báo cáo số tiền và mục đích của người bán, do quản trị duyệt; tổng giải ngân của một đơn không vượt số cọc đang giữ.
- **BR-10:** *Bỏ (v1.4).* Dự án không tính hoa hồng (Context mục 9); nguồn thu của nền tảng là phí đăng ký mở bán (BR-31).
- **BR-11:** Người bán là đơn vị có đăng ký kinh doanh (hộ kinh doanh, doanh nghiệp tư nhân hoặc công ty) đã được duyệt, do đúng một tài khoản đã xác minh NFC làm chủ (BR-23); không có tài khoản nhân viên. Cách xác minh quyền làm chủ phân theo tư cách pháp nhân (BR-26, BR-27).
- **BR-12:** Sản phẩm bán lại phải ghi thương hiệu và nơi sản xuất. Không yêu cầu khai nguồn nhập.
- **BR-13:** Nhãn "giao toàn quốc" chỉ dùng cho sản phẩm đạt tiêu chuẩn đóng gói của nền tảng; sản phẩm "giao nội thành" chỉ hiện trong vùng giao người bán đã khai.
- **BR-14:** Custom chỉ gồm in logo lên túi, thiệp, sticker và hộp theo mẫu có sẵn của người bán. Không có hạn chót của mùa (mục 4.2).
- **BR-15:** Đơn có custom chỉ chuyển sang sản xuất khi có một phiên bản maket được người mua duyệt.
- **BR-16:** Yêu cầu dưới số lượng tối thiểu của người bán không gửi được. Lời mời của yêu cầu mở chỉ gửi tới người bán đạt đủ: số lượng tối thiểu ≤ số lượng yêu cầu, làm được loại custom yêu cầu, giao được tới địa chỉ, không do chính tài khoản tạo yêu cầu làm chủ (BR-22), và đã đóng phí đăng ký mở bán (BR-31).
- **BR-17:** Chấp nhận một báo giá của yêu cầu mở thì các báo giá còn lại của yêu cầu đó đóng.
- **BR-18:** Khi có khiếu nại đang mở, nền tảng tiếp tục giữ tiền của đơn.
- **BR-19:** Thay đổi giá, tồn kho, phí giao nội thành và bảng phí giao liên tỉnh không ảnh hưởng đơn đã tạo.
- **BR-20:** Người bán bị khóa không nhận đơn hay yêu cầu mới; đơn đang chạy vẫn được xử lý tiếp.
- **BR-21:** Trang tìm kiếm sản phẩm (FR-06) là kênh bán lẻ: chỉ hiện sản phẩm đang bán của người bán có bật Shop. Người bán chỉ nhận đặt hàng (không bật Shop) — thường là đơn vị chỉ làm việc với doanh nghiệp và đơn số lượng lớn — không có sản phẩm ở trang tìm kiếm sản phẩm. Người mua tìm thấy họ qua danh sách đơn vị cung cấp và hồ sơ nhận đặt hàng (FR-14), gửi yêu cầu trực tiếp (FR-15), hoặc được nền tảng mời qua yêu cầu mở (FR-16). "Chỉ làm việc với doanh nghiệp" được thực hiện bằng cách chỉ nhận đặt hàng và đặt số lượng tối thiểu; nền tảng không kiểm tra người mua là cá nhân hay doanh nghiệp (BR-01, mục 4.2).
- **BR-22 (cấm tự giao dịch):** Một tài khoản không được giao dịch với người bán do chính tài khoản đó làm chủ (`buyer_account_id = vendor.owner_account_id`). Quy tắc áp dụng cho: thêm vào giỏ và thanh toán mua ngay (FR-08, FR-09), gửi yêu cầu trực tiếp (FR-15), lời mời và báo giá của yêu cầu mở (FR-16), chấp nhận báo giá (FR-19), đặt lại (FR-23). Nếu một tài khoản làm chủ nhiều người bán, quy tắc áp cho tất cả người bán đó. Sản phẩm và hồ sơ của chính mình vẫn hiển thị với nhãn "Sản phẩm của bạn" nhưng không có thao tác mua hay gửi yêu cầu. Hệ thống kiểm ở phía máy chủ tại thời điểm tạo giỏ, yêu cầu và đơn, không chỉ ẩn nút trên giao diện. Áp dụng như nhau dù đơn có chọn xuất hóa đơn doanh nghiệp hay không. Mục đích: ngăn tự đánh giá, thổi phồng số đơn, lạm dụng voucher và giải ngân cọc từ đơn giả. Nền tảng không phát hiện tự giao dịch qua tài khoản khác (mục 4.2).
- **BR-23 (xác minh NFC):** Tài khoản phải có trạng thái "đã xác minh NFC" (FR-04) trước khi: (a) khai hoặc nộp hồ sơ người bán (FR-26), áp dụng cho mọi người bán bất kể cách bán; (b) gửi yêu cầu trực tiếp, tạo yêu cầu mở hoặc đặt lại (FR-15, FR-16, FR-23). Mua ngay (FR-08, FR-09) không cần xác minh NFC. Một CCCD chỉ gắn với một tài khoản. Hệ thống kiểm ở phía máy chủ tại thời điểm tạo hồ sơ người bán và tạo yêu cầu, không chỉ ẩn nút trên giao diện. Xác minh NFC chỉ ghi nhận thông tin CCCD (AC-04.11) của người thao tác tài khoản; không chứng minh quyền đại diện cho doanh nghiệp (mục 4.2) và không chứng minh thẻ là thật (A-08). Mục đích: buộc mỗi tài khoản đặt hàng hoặc bán hàng gắn với một số CCCD duy nhất.
- **BR-24 (kiểm soát sản phẩm sau khi đăng):** Sản phẩm mới đăng hoặc vừa sửa hiển thị ngay, không qua duyệt của quản trị. Quản trị kiểm soát sau bằng cách gỡ sản phẩm vi phạm (FR-46). Sản phẩm "bị gỡ" thì người bán không sửa và không hiện lại được.
- **BR-25 (xác nhận thanh toán qua VNPay):** Áp dụng cho thanh toán mua ngay, cọc và phần còn lại (FR-09, FR-19, FR-22). Mỗi lần thanh toán có một mã giao dịch duy nhất. Trạng thái "đã thanh toán" chỉ được ghi khi máy chủ nhận IPN từ VNPay có chữ ký (checksum) hợp lệ, mã giao dịch tồn tại và số tiền khớp số đã tạo; trang quay về (return URL) chỉ để hiển thị kết quả, không dùng để cập nhật trạng thái. Xử lý IPN phải lặp lại an toàn: IPN gửi nhiều lần không tạo đơn hay ghi tiền hai lần. Giao dịch không có IPN thành công trong thời hạn thanh toán thì coi là thất bại (không tạo đơn, trả lại tồn kho đã giữ theo BR-28).
- **BR-26 (người bán là pháp nhân):** Người bán có tư cách pháp nhân (công ty TNHH, công ty cổ phần, công ty hợp danh) chỉ được duyệt (FR-45) sau khi nền tảng đã làm việc trực tiếp với doanh nghiệp và có thỏa thuận hợp tác mang chữ ký của người đại diện theo pháp luật, trong đó ghi rõ tài khoản làm chủ người bán. Quản trị ghi nhận buổi làm việc (ngày, người thực hiện, họ tên người đại diện, file thỏa thuận) và việc đã tra cứu mã số doanh nghiệp trên Cổng thông tin quốc gia về đăng ký doanh nghiệp trước khi duyệt. Chủ tài khoản vẫn phải đã xác minh NFC (BR-23) nhưng không bắt buộc là người đại diện. Lý do: pháp nhân tồn tại độc lập với con người; người đại diện chỉ nhân danh pháp nhân, nên xác minh một con người không đủ chứng minh quyền thay mặt đơn vị. Hình thức ký thỏa thuận: Q-34.
- **BR-27 (người bán không có tư cách pháp nhân):** Với hộ kinh doanh và doanh nghiệp tư nhân, người chủ chính là đơn vị kinh doanh và chịu trách nhiệm bằng toàn bộ tài sản của mình. Tài khoản làm chủ người bán phải là chính chủ hộ hoặc chủ doanh nghiệp tư nhân; không chấp nhận người được ủy quyền. Máy chủ kiểm bằng cách so số định danh khai trên hồ sơ (như ghi trên giấy chứng nhận đăng ký) với số CCCD đã xác minh NFC của tài khoản nộp, qua mã băm; không trùng thì không nộp được hồ sơ (AC-26.6). Kiểm ở phía máy chủ, không chỉ ở giao diện.
- **BR-28 (giữ tồn kho khi chờ thanh toán):** Khi người mua chuyển sang VNPay thanh toán đơn mua ngay, hệ thống giữ đúng số lượng của từng sản phẩm bằng một thao tác có điều kiện (chỉ giữ được khi còn đủ hàng), để hai người không cùng mua được món cuối. Phần đang giữ không bán cho người khác. IPN thành công (BR-25) thì chốt phần giữ thành số đã bán; thanh toán thất bại hoặc hết thời hạn thanh toán thì trả phần giữ về tồn kho.

- **BR-29 (một lần thanh toán, mỗi Shop một đơn):** Người mua thanh toán một lần cho cả giỏ có sản phẩm của nhiều Shop. Khi thanh toán thành công (BR-25), lần thanh toán đó tạo mỗi Shop một đơn; các đơn mang cùng payment_group_id để người mua theo dõi cùng nhau. Trạng thái, phí giao, hóa đơn, khiếu nại, giữ tiền và chuyển tiền tính theo từng đơn. Thông tin xuất hóa đơn doanh nghiệp nhập một lần và chép vào mọi đơn của lần thanh toán đó. Nguồn: Context mục 4 (Mua ngay).
- **BR-30 (phí giao):** Mỗi đơn chịu một khoản phí giao. Đơn mua ngay có địa chỉ giao trong vùng giao người bán đã khai: phí giao nội thành của người bán (FR-28). Ngoài vùng đó (chỉ sản phẩm "giao toàn quốc"): mức của tỉnh nhận hàng trong bảng phí liên tỉnh (FR-52). Đơn đặt hàng: phí giao ghi trong báo giá và nằm trong tổng tiền (FR-38). Phí giao được nền tảng giữ cùng tiền hàng và chuyển cho người bán khi đủ điều kiện (FR-48). Nguồn: Context mục 4 (Giao hàng).
- **BR-31 (phí đăng ký mở bán):** Sau khi hồ sơ được duyệt, mọi người bán, dù mở Shop hay chỉ nhận đặt hàng, phải đóng phí đăng ký mở bán một lần để bắt đầu hoạt động kinh doanh (FR-27). Mức phí do quản trị đặt (FR-53), mặc định 200.000đ; số phải đóng là mức hiện hành lúc tạo giao dịch thanh toán, và đổi mức không ảnh hưởng người bán đã đóng. Chưa đóng phí thì người bán không đăng bán, không nhận yêu cầu trực tiếp và không được mời từ yêu cầu mở. Phí thanh toán qua cổng thanh toán và được xác nhận theo BR-25. Phí không thu lúc nộp hồ sơ nên không phát sinh hoàn phí khi hồ sơ bị từ chối. Nền tảng lập hóa đơn cho khoản phí này (Q-36). Nguồn: Context mục 4 (Thanh toán, Hóa đơn).
- **BR-32 (đơn đặt hàng là thỏa thuận riêng):** Đơn đặt hàng không có đánh giá và không áp dụng voucher hệ thống; đánh giá và voucher chỉ dùng cho đơn mua ngay. Nguồn: Context mục 4 (Đặt hàng qua báo giá).
- **BR-33 (người bán là công ty tạm thời không đăng ký qua hệ thống):** Công ty TNHH, công ty cổ phần và công ty hợp danh tạm thời không khai hồ sơ người bán trên nền tảng; công ty muốn bán làm việc trực tiếp với đội vận hành Moonkage, ngoài hệ thống. Form khai hồ sơ người bán (FR-26) chỉ có hai loại hình hộ kinh doanh và doanh nghiệp tư nhân, kèm một dòng hướng dẫn công ty liên hệ đội vận hành. Máy chủ từ chối mọi loại hình khác, kể cả khi gọi trực tiếp API. Cả hai loại hình còn lại đều phải là chính chủ (BR-27). Trong thời gian áp dụng quy tắc này, BR-26, AC-26.7, AC-45.6 và phần dành cho công ty của AC-26.1, AC-45.4, AC-45.5 tạm hoãn; doanh nghiệp tư nhân vẫn được quản trị tra cứu mã số trên Cổng thông tin quốc gia về đăng ký doanh nghiệp (AC-45.5). Quyết định của nhóm ngày 22/10/2026.

---

## 8. Luồng người dùng chính (User Flow)

### Flow 1: Mua ngay (anh Minh; chị Lan buổi tối)
1. Người mua chọn khu vực hoặc địa chỉ (FR-03, FR-05).
2. Hệ thống hiện sản phẩm giao được của các Shop (chỉ người bán bán lẻ, BR-21); người mua tìm, lọc, so sánh trên trang tìm kiếm (FR-06, FR-07).
3. Người mua thêm sản phẩm vào giỏ; nếu vượt tồn kho/ngưỡng, hệ thống đề nghị gửi yêu cầu (FR-08 → Flow 3). Sản phẩm của người bán do chính người mua làm chủ không thêm được (BR-22).
4. Người mua thanh toán; có thể chọn xuất hóa đơn doanh nghiệp, nhập voucher (FR-09, FR-24, FR-13). Phí giao từng Shop tính theo BR-30. Hệ thống giữ tồn kho rồi chuyển sang VNPay (BR-28).
5. IPN thành công → hệ thống tạo mỗi Shop một đơn, nhóm theo lần thanh toán (BR-29), chốt tồn kho đã giữ, giữ tiền. Thất bại hoặc hết hạn → trả tồn kho, không tạo đơn.
6. Người bán xác nhận → đang giao (kèm mã vận đơn nếu liên tỉnh) → đã giao (FR-32).
7. Người mua xác nhận nhận hàng, đánh giá; hoặc khiếu nại (FR-11, FR-12).
8. Đủ điều kiện → nền tảng chuyển tiền cho người bán (gồm phí giao); người bán gắn hóa đơn (FR-48, FR-44, FR-25).

### Flow 2: Yêu cầu mở có custom (chị Lan)
1. Nếu tài khoản chưa xác minh NFC → đi Flow 6 rồi quay lại (FR-04, BR-23). Người mua tạo yêu cầu mở: số lượng, ngân sách, custom, hạn giao, địa chỉ (FR-16).
2. Hệ thống mời người bán phù hợp (BR-16), kể cả người bán chỉ nhận đặt hàng, trừ người bán do chính người mua làm chủ (BR-22); người bán nhận lời mời (FR-36).
3. Người bán xem công suất, soạn và gửi báo giá (FR-37, FR-38).
4. Người mua so sánh, xuất file trình duyệt nội bộ ngoài nền tảng (FR-17, FR-18). Trong demo không có bước xuất file (FR-18 hoãn).
5. Người mua chấp nhận một báo giá, chọn xuất hóa đơn doanh nghiệp, đặt cọc; báo giá khác đóng (FR-19, FR-24).
6. Người bán gửi maket; người mua duyệt hoặc yêu cầu sửa đến khi duyệt (FR-39, FR-20).
7. Người bán xin giải ngân một phần cọc; quản trị duyệt (FR-41, FR-47).
8. Người bán cập nhật tiến độ đến đã giao (FR-40, FR-42); người mua theo dõi (FR-21).
9. Người mua thanh toán phần còn lại (FR-22); đơn hoàn tất; chuyển tiền và hóa đơn như Flow 1 bước 8.

### Flow 3: Yêu cầu trực tiếp (chị Thảo; anh Quân; bạn Vy)
1. Người mua tìm người bán trong danh sách đơn vị cung cấp và xem hồ sơ nhận đặt hàng (FR-14), hoặc được chuyển từ giỏ (FR-08).
2. Nếu tài khoản chưa xác minh NFC → đi Flow 6 rồi quay lại (FR-04, BR-23). Người mua gửi yêu cầu trực tiếp; hệ thống kiểm số lượng tối thiểu, BR-22, BR-23 và BR-31 (FR-15).
3. Người bán báo giá hoặc từ chối kèm lý do (FR-36, FR-38).
4. Tiếp tục từ Flow 2 bước 5 (bỏ qua maket nếu không có custom).

### Flow 4: Trở thành người bán (cô Hoa; chị Thảo; anh Quân)
1. Tài khoản đã xác nhận; nếu chưa xác minh NFC → đi Flow 6 rồi quay lại (FR-04, BR-23). Khai hồ sơ người bán: loại hình (hộ kinh doanh / doanh nghiệp tư nhân / công ty), thông tin đơn vị, họ tên và số định danh của chủ hộ / chủ doanh nghiệp tư nhân / người đại diện như trên giấy chứng nhận, nguồn hàng, cách bán (FR-26). Chọn "chỉ nhận đặt hàng" thì sản phẩm không hiện ở trang tìm kiếm sản phẩm (BR-21).
2. Khi nộp, máy chủ so số định danh và họ tên đã khai với kết quả xác minh NFC của tài khoản và ghi kết quả (AC-26.8).
   - Hộ kinh doanh, doanh nghiệp tư nhân: số định danh không trùng → không nộp được; tài khoản làm chủ phải là chính chủ (BR-27).
   - Công ty: nộp được; hồ sơ chờ nền tảng liên hệ làm việc trực tiếp (BR-26).
3. Quản trị xem hồ sơ và kết quả so (FR-45). Quản trị đối chiếu thông tin đã khai với file giấy chứng nhận; với doanh nghiệp tư nhân và công ty, tra cứu mã số trên Cổng thông tin quốc gia về đăng ký doanh nghiệp. Với công ty, quản trị làm việc trực tiếp với doanh nghiệp, nhận thỏa thuận hợp tác do người đại diện theo pháp luật ký và ghi nhận buổi làm việc.
4. Quản trị duyệt / yêu cầu bổ sung / từ chối (FR-45); chủ theo dõi và nộp lại (FR-27).
5. Sau khi duyệt: chủ đóng phí đăng ký mở bán một lần theo mức hiện hành (FR-27, FR-53, BR-31); đóng xong mới hoạt động kinh doanh.
6. Khai vùng giao và phí giao nội thành (FR-28); đăng sản phẩm nếu có Shop (FR-29 → FR-31) và/hoặc khai hồ sơ nhận đặt hàng (FR-35).

### Flow 5: Khiếu nại
1. Người mua mở khiếu nại trong thời hạn, kèm ảnh và mô tả (FR-12); tiền tiếp tục bị giữ.
2. Quản trị xem toàn bộ hồ sơ đơn và bằng chứng (FR-49).
3. Quản trị quyết định hoàn toàn bộ / một phần / bác, kèm lý do; tiền hoàn lấy từ khoản đang giữ; phần còn lại chuyển cho người bán theo FR-48.

### Flow 6: Xác minh NFC (luồng con của Flow 2, 3, 4)
1. Web tạo phiên xác minh dùng một lần, có thời hạn, thuộc tài khoản đang đăng nhập, hiện mã QR (FR-04).
2. Người dùng mở app Moonkage Verify (Flutter), đăng nhập bằng chính tài khoản đó, quét QR; app kiểm điện thoại có NFC.
3. Người dùng chạm thẻ NFC mô phỏng (A-08); app đọc Text record JSON, kiểm định dạng và hạn CCCD. Sai → báo, cho chạm lại, không gửi.
4. App hiện đủ 9 trường trên điện thoại. Người dùng bấm Hủy → không gửi gì; bấm Lưu → app mã hóa số định danh, ngày sinh, nơi thường trú rồi gửi một lần.
5. Máy chủ kiểm: phiên còn hạn, chưa dùng, thuộc tài khoản đang đăng nhập; tài khoản không bị tạm khóa; nội dung đúng định dạng; CCCD còn hạn; số định danh chưa gắn tài khoản khác. Lỗi → báo lý do, thử lại trong giới hạn (Q-30) hoặc tạo phiên mới.
6. Thành công → máy chủ lưu họ tên, giới tính, ngày sinh, quốc tịch, số định danh theo AC-04.11, chuyển tài khoản sang "đã xác minh NFC"; web tự cập nhật và đưa người dùng về bước đang làm.
7. Thẻ do người dùng tự có trước, nằm ngoài hệ thống; nền tảng không cấp thẻ (A-08).

### Flow 7: Quản lý sản phẩm (Shop)
1. Người bán đã duyệt, đã đóng phí đăng ký mở bán (BR-31) và có Shop; mở trang Quản lý sản phẩm.
2. Đăng mới: nhập thông tin bắt buộc; hàng bán lại nhập thương hiệu và nơi sản xuất; chọn nhãn giao theo tiêu chuẩn đóng gói; hợp lệ thì sản phẩm "đang bán" và hiện ngay, không qua duyệt (FR-29, BR-12, BR-13, BR-24).
3. Sửa thông tin (FR-33); sửa tồn kho và giá (FR-30); đặt bậc giá và ngưỡng báo giá, ngưỡng chỉ có tác dụng khi bật nhận đặt hàng (FR-31). Đơn đã tạo không đổi (BR-19).
4. Ẩn / hiện lại sản phẩm (FR-34); không có thao tác xóa.
5. Quản trị gỡ sản phẩm vi phạm kèm lý do; sản phẩm "bị gỡ" rời trang tìm kiếm, bị loại khỏi giỏ; người bán không tự hiện lại được (FR-46, BR-24).

---

## 9. Tích hợp & môi trường kỹ thuật

- **Tech stack** (Q-07). Cách chia service và hạ tầng do Software Design quyết định dựa trên tài liệu này.
  - **Web frontend:** React. Giao diện web cho khách, người mua, chủ người bán và quản trị; đáp ứng NFR-04 (trình duyệt, responsive từ 360px).
  - **Backend:** Java Spring Boot theo kiến trúc microservices, đóng gói và chạy bằng Docker (ràng buộc môn học). Mọi kiểm tra nghiệp vụ phía máy chủ làm ở backend, không dựa vào việc ẩn nút trên React: BR-22 (cấm tự giao dịch), BR-23 (xác minh NFC), BR-25 (xác nhận thanh toán qua IPN), BR-26 và BR-27 (xác minh người bán theo tư cách pháp nhân), BR-28 (giữ tồn kho), BR-31 (phí đăng ký mở bán), kiểm định dạng và trùng CCCD ở FR-04.
  - **Cơ sở dữ liệu:** PostgreSQL.
  - **App mobile:** Flutter, chỉ phục vụ FR-04.
  - **Còn mở trong Q-07:** môi trường triển khai cuối (Docker Compose trên máy hay cloud); phiên bản Android/iOS tối thiểu và thư viện NFC của app mobile (đề xuất: `minSdk 26`, `nfc_manager`).
- **Hệ thống bên ngoài cần tích hợp:**
  - Cổng thanh toán: VNPay sandbox (A-11). Người mua được chuyển sang trang VNPay; kết quả xác nhận qua IPN (BR-25); hoàn tiền qua API hoàn tiền của VNPay. VNPay không dùng để chi tiền cho người bán; giải ngân và chuyển tiền chỉ ghi sổ (A-12).
  - Gửi email: Gmail SMTP cho mã xác nhận tài khoản và đặt lại mật khẩu (A-17). Thông báo khác chỉ trong ứng dụng.
  - SMS: chưa tích hợp (Q-21).
  - Hãng vận chuyển liên tỉnh: không tích hợp; người bán nhập mã vận đơn (Q-18), phí liên tỉnh theo bảng của nền tảng (BR-30, FR-52).
  - Hóa đơn điện tử: theo A-02, chưa tích hợp; người bán tải file lên (Q-09).
  - Cổng thông tin quốc gia về đăng ký doanh nghiệp: **không tích hợp**; quản trị tra cứu thủ công (A-14).
- **Thành phần mobile:** App Moonkage Verify (Flutter; Android, iOS) chỉ phục vụ xác minh NFC (FR-04). Đọc NDEF Text record qua thư viện Flutter (gợi ý: `nfc_manager`; chốt ở Q-07). App đăng nhập bằng tài khoản Moonkage và nhận phiên qua mã QR trên web; phiên phải thuộc tài khoản đang đăng nhập. App không có chức năng mua bán và không có chức năng ghi thẻ. App kiểm nội dung thẻ để báo lỗi sớm, hiện thông tin cho người dùng xác nhận, mã hóa các trường nhạy cảm rồi gửi; máy chủ kiểm lại mọi điều kiện. Thẻ do người dùng tự có trước (A-08). Kế hoạch chi tiết: `claude/Flutter_App_Plan.md`.
- **Môi trường triển khai:** Docker (ràng buộc môn học); môi trường cuối còn mở (Q-07).

---

## 10. Giả định & ràng buộc

- **A-01:** *Đã chốt thành BR-29 (v1.4).*
- **A-02:** Người bán tự phát hành hóa đơn điện tử bằng hệ thống của mình và tải file lên đơn; nền tảng không phát hành hóa đơn thay người bán (Q-09).
- **A-03:** Mua ngay chỉ thanh toán trước trên nền tảng; thanh toán khi nhận hàng cho đơn nội thành chưa có trong phạm vi cho đến khi Q-05 được quyết.
- **A-04:** Người bán dùng chính tài khoản chủ để mua hàng; đơn mua và đơn bán cùng hiện trong một tài khoản. Tài khoản chủ không mua được từ chính người bán của mình (BR-22).
- **A-05:** Công suất "đã nhận" ở FR-37 chỉ tính đơn đã cọc, không tính báo giá đang chờ (Q-24).
- **A-06:** *Bỏ (v1.4).* Dự án không mô hình hóa mùa vụ.
- **A-07:** Khi quyền chủ người bán chuyển sang một tài khoản đang có giao dịch với chính người bán đó: đơn đã cọc hoặc đã thanh toán chạy tiếp đến hết; yêu cầu và báo giá chưa chốt tự đóng; sản phẩm trong giỏ bị loại ở bước thanh toán (AC-09.5). Giả định tạm cho đến khi Q-03 và Q-28 được chốt.
- **A-08:** Chip CCCD được mô phỏng bằng thẻ NFC NTAG (NTAG215 hoặc tương đương) chứa một NDEF Text record là một JSON object 9 khóa theo các trường in trên CCCD: `id_number` (đúng 12 chữ số), `full_name` (in hoa, không dấu), `date_of_birth`, `gender` (`Nam`, `Nu` hoặc `Nữ`), `nationality`, `place_of_birth`, `place_of_residence`, `date_of_issue`, `date_of_expiry`; ngày dạng `yyyy-MM-dd`, ngày cấp sau ngày sinh, ngày hết hạn sau ngày cấp. Thẻ do người dùng tự có trước, nằm ngoài hệ thống; nền tảng không cấp thẻ. Trong demo, thẻ mẫu được ghi sẵn bằng một công cụ ghi NFC bên ngoài. Thẻ không có chữ ký số; máy chủ không kiểm tính xác thực của thẻ (chữ ký, UID), chỉ kiểm định dạng, hạn CCCD và một CCCD một tài khoản. Hệ quả được chấp nhận: ai có app ghi NFC cũng tự ghi được thẻ với số CCCD bất kỳ; xác minh NFC chỉ ghi nhận thông tin CCCD gắn với tài khoản, không chứng minh danh tính thật. Các quy tắc phía máy chủ vẫn phải chạy thật: phiên dùng một lần và thuộc đúng tài khoản, kiểm định dạng, kiểm hạn CCCD, một CCCD một tài khoản, giới hạn lần thử, mã hóa khi truyền và khi lưu, lưu tối thiểu. Không kết nối hệ thống định danh quốc gia. Khi demo chỉ dùng dữ liệu mẫu, không dùng số CCCD thật của người khác.
- **A-09:** Cổng NFC phía mua đặt ở bước gửi yêu cầu (sớm nhất), không ở bước chấp nhận báo giá. Người mua thay doanh nghiệp xác minh bằng CCCD của chính người thao tác (HR, admin), không phải của doanh nghiệp.
- **A-10:** *Bỏ (v1.4) cùng chức năng bật / tắt Shop.* Chưa cho bật / tắt Shop sau khi duyệt.
- **A-11:** Thanh toán dùng môi trường sandbox của VNPay với thẻ thử nghiệm; không có giao dịch tiền thật. "Nền tảng giữ tiền" được thể hiện bằng sổ tiền theo đơn (Escrow / Ledger) trên hệ thống, không phải tài khoản ký quỹ thật. Hoàn tiền một phần dùng API hoàn tiền nếu sandbox hỗ trợ; nếu không thì ghi sổ và đánh dấu xử lý tay (AC-49.3).
- **A-12:** Giải ngân cọc (FR-47) và chuyển tiền cho người bán (FR-48) chỉ làm ở mức quản trị bấm duyệt: hệ thống ghi sổ, cập nhật đối soát và thông báo người bán; việc chuyển khoản thật nằm ngoài hệ thống và ngoài phạm vi dự án.
- **A-13:** Các giá trị tạm cho demo ở mục 4.3 chỉ dùng để demo chạy được; không thay thế quyết định cuối của các câu hỏi tương ứng ở mục 11.
- **A-14:** Hệ thống không đọc nội dung file giấy chứng nhận đăng ký và không kết nối cổng đăng ký doanh nghiệp hay hệ thống đăng ký hộ kinh doanh. Quản trị đối chiếu thông tin đã khai với file và tra cứu mã số doanh nghiệp thủ công; hệ thống chỉ ghi nhận việc đã đối chiếu, đã tra cứu (AC-45.5). Buổi làm việc trực tiếp với công ty diễn ra ngoài hệ thống; hệ thống chỉ lưu bản ghi và file thỏa thuận (BR-26). Trong demo, các bước này thể hiện bằng ô xác nhận và file mẫu.
- **A-15:** So họ tên ở AC-26.8. Ở hồ sơ người bán, họ tên chủ hộ / chủ doanh nghiệp tư nhân / người đại diện được nhập không dấu (AC-26.1); họ tên trên thẻ cũng in hoa, không dấu (A-08). Chuẩn hóa cả hai chuỗi (Unicode NFC, bỏ khoảng trắng đầu cuối, gộp khoảng trắng liên tiếp, viết hoa, bỏ dấu kể cả đổi "Đ" thành "D"), rồi phân hai mức: **khớp** (trùng sau chuẩn hóa) và **không khớp**. Không so gần đúng (khoảng cách ký tự, đảo thứ tự từ). Họ tên chỉ dùng để cảnh báo; căn cứ chính là số định danh.
- **A-16:** Công ty có nhiều người đại diện theo pháp luật: hồ sơ khai một người đại diện; thỏa thuận hợp tác do chính người đó ký.
- **A-17:** Trong demo, email (mã xác nhận tài khoản, đặt lại mật khẩu) gửi thật qua Gmail SMTP bằng một tài khoản Gmail của nhóm với mật khẩu ứng dụng (App Password), đặt qua biến môi trường. Gmail giới hạn số thư mỗi ngày; đủ cho demo, không dùng cho vận hành thật. Vì chưa có SMS, demo chỉ cho đăng ký bằng email; trường số điện thoại giữ trong đặc tả để làm sau.
- **A-18:** Bảng phí giao liên tỉnh luôn có mức cho mọi tỉnh/thành nhận hàng (FR-52). Không có trường hợp đơn liên tỉnh thiếu phí.
- **C-01 (ràng buộc):** *Bỏ (v1.4).* Dự án không mô hình hóa mùa vụ nên không ràng buộc thời điểm mở theo mùa. Deadline và ngân sách: Q-16.
- **C-02 (ràng buộc):** Ưu tiên tuyển người bán ở một vài thành phố lớn trước khi mở rộng vùng.

---

## 11. Câu hỏi còn mở

| ID | Câu hỏi | Người cần trả lời | Trạng thái |
|---|---|---|---|
| Q-01 | Người mua hủy sau khi cọc, hoặc người bán không giao được: ai mất gì? Trạng thái hủy của từng loại đơn? Hoàn tiền khi cọc đã giải ngân một phần? | | Mở |
| Q-02 | Giải ngân cọc theo báo cáo mục đích (hiện tại) hay theo mốc tiến độ? | | Mở |
| Q-03 | Chuyển quyền làm chủ người bán khi chủ rời đi? | | Mở |
| Q-04 | Người bán xuất được loại hóa đơn nào; người mua có lọc theo đó được không? | | Mở |
| Q-05 | Thanh toán khi nhận hàng có áp dụng cho đơn mua ngay nội thành không? | | Mở |
| Q-06 | Quy tắc chênh lệch giá sỉ/lẻ: mức bao nhiêu, ai kiểm tra, chặn hay cảnh báo? | | Mở |
| Q-07 | Tech stack và môi trường triển khai (gồm nền tảng và phiên bản tối thiểu cho app mobile)? |  | Chốt phần lớn: React, Spring Boot microservices + Docker (ràng buộc môn học), PostgreSQL, Flutter (mục 9). Cách chia service và hạ tầng do Software Design quyết định. Còn mở: môi trường triển khai cuối, phiên bản tối thiểu và thư viện NFC của app mobile |
| Q-08 | Cổng thanh toán nào; có hỗ trợ giữ tiền và hoàn tiền một phần không? | | Đã chốt: VNPay sandbox; giữ tiền bằng sổ tiền trên hệ thống (A-11) |
| Q-09 | Hóa đơn điện tử: tích hợp nhà cung cấp hay người bán tải file (A-02)? Sau bao lâu thì nhắc người bán? | | Mở |
| Q-10 | Thời hạn khiếu nại và thời gian giữ tiền cụ thể cho đơn nội thành, liên tỉnh, đơn đặt hàng? | | Mở |
| Q-11 | Tiêu chuẩn đóng gói tối thiểu cho nhãn "giao toàn quốc" là gì, ai xác nhận? | | Mở |
| Q-12 | Đơn vị vùng giao hàng: tỉnh/thành, quận/huyện hay phường/xã? | | Mở |
| Q-13 | Giỏ nhiều Shop: một lần thanh toán tách thành nhiều đơn (A-01) có đúng ý nhóm không? |  | Đã chốt (v1.4): một lần thanh toán, mỗi Shop một đơn, nhóm theo lần thanh toán (BR-29) |
| Q-14 | Người mua không thanh toán phần còn lại sau khi hàng đã giao thì xử lý thế nào? Có nên thu phần còn lại trước khi giao? | | Mở |
| Q-15 | Đơn đặt hàng có được đánh giá không? |  | Đã chốt (v1.4): không (BR-32) |
| Q-16 | Chỉ tiêu định lượng cho G-01 → G-06; deadline, ngân sách? |  | Mở |
| Q-17 | Chốt con số cho NFR-01, 02, 04, 05, 08? | | Mở |
| Q-18 | Hãng vận chuyển liên tỉnh: tích hợp API hay nhập mã vận đơn thủ công? |  | Mở. Phí liên tỉnh đã chốt (v1.4): bảng phí theo tỉnh của nền tảng (BR-30) |
| Q-19 | Có giới hạn thời hạn hiệu lực báo giá (tối thiểu/tối đa) không? | | Mở |
| Q-20 | Ưu đãi đặt sớm có tác động tự động lên giá báo giá không, hay chỉ là thông tin? | | Mở |
| Q-21 | Kênh thông báo: email, SMS, trong ứng dụng, Zalo? | | Chốt một phần (v1.3): email qua Gmail SMTP cho mã xác nhận và đặt lại mật khẩu (A-17); thông báo trạng thái trong ứng dụng. Còn mở: SMS, email cho thông báo khác |
| Q-22 | Phần giảm của voucher do nền tảng hay người bán chịu? |  | Mở. Đã chốt (v1.4): voucher chỉ cho đơn mua ngay (BR-32); không còn hoa hồng |
| Q-23 | Định dạng file xuất báo giá: PDF, Excel, hay cả hai? | | Mở |
| Q-24 | Báo giá đang chờ có giữ chỗ công suất không (A-05)? | | Mở |
| Q-25 | Độ dài kỳ đối soát và lịch lập hóa đơn phí hoa hồng? |  | Không còn áp dụng (v1.4): không tính hoa hồng |
| Q-26 | Người bán sửa hồ sơ pháp lý hoặc tài khoản ngân hàng sau khi đã duyệt có phải duyệt lại không? (Bản ngữ cảnh chấp nhận người trực sửa được, nên đây là điểm rủi ro.) | | Mở |
| Q-27 | Chuyển tiền cho người bán tự động hay quản trị bấm? | | Đã chốt: quản trị bấm duyệt, chỉ ghi sổ (A-12) |
| Q-28 | Khi chuyển quyền chủ (Q-03), các giao dịch đang chạy giữa tài khoản chủ mới và chính người bán đó xử lý thế nào? Đang dùng giả định A-07. | | Mở (có giả định tạm) |
| Q-29 | Xác minh NFC có so khớp khuôn mặt (selfie với ảnh trong chip) không? | | Đóng: thẻ mô phỏng không chứa ảnh (A-08) |
| Q-30 | Số lần thử đọc thẻ tối đa và thời gian tạm khóa xác minh? | | Mở |
| Q-31 | Thời hạn của phiên xác minh (mã QR)? | | Mở |
| Q-32 | Tài khoản chủ người bán có bắt buộc là chủ hộ / người đại diện pháp luật trên ĐKKD không, hay chấp nhận người được ủy quyền (kèm giấy ủy quyền)? | | Đã chốt (v1.1): theo tư cách pháp nhân. Hộ kinh doanh và doanh nghiệp tư nhân: chủ tài khoản bắt buộc là chính chủ, không ủy quyền (BR-27). Công ty: chủ tài khoản là người được ghi trong thỏa thuận hợp tác do người đại diện theo pháp luật ký (BR-26) |
| Q-33 | CCCD hết hạn sau khi đã xác minh: tài khoản giữ trạng thái hay phải xác minh lại? Giao dịch đang chạy có bị ảnh hưởng không? |  | Đã chốt một phần (v1.6): CCCD hết hạn tại thời điểm xác minh bị từ chối (AC-04.8). Còn mở: CCCD hết hạn sau khi đã xác minh |
| Q-34 | Thỏa thuận hợp tác với người bán là pháp nhân (BR-26): ký tay kèm con dấu hay chữ ký số? Mẫu thỏa thuận gồm những điều khoản nào? Ai phía nền tảng được làm việc và ký? | | Mở (giá trị tạm ở mục 4.3) |
| Q-35 | Bảng so sánh sản phẩm cho chọn tối thiểu và tối đa bao nhiêu sản phẩm? Câu hiện tại "ít nhất ba" đọc như giới hạn dưới |  | Không còn áp dụng (v1.4): bảng so sánh sản phẩm đã bỏ |
| Q-36 | Hóa đơn phí đăng ký mở bán do hệ thống tự sinh hay quản trị lập ngoài hệ thống rồi tải lên? | | Mở (giá trị tạm ở mục 4.3) |
| Q-37 | App có cần gửi nơi sinh, nơi thường trú, ngày cấp lên máy chủ không, khi máy chủ không lưu các trường này? | | Mở (giá trị tạm ở mục 4.3) |

> AI: Nếu một yêu cầu phụ thuộc vào câu hỏi đang "Mở", hãy hỏi lại trước khi triển khai phần đó.

---

## 12. Thuật ngữ (Glossary)

| Thuật ngữ | Định nghĩa trong dự án này |
|---|---|
| Khách (Guest) | Người dùng chưa đăng nhập. |
| Người mua (Member) | Bất kỳ ai có tài khoản đã đăng nhập. Không gợi vai mua hay bán; mua/bán là vai trong từng giao dịch. |
| Tài khoản | Đại diện cho một con người. Phía mua chỉ có một loại tài khoản. |
| Người bán (Vendor) | Đơn vị có đăng ký kinh doanh (hộ kinh doanh, doanh nghiệp tư nhân hoặc công ty) đã được duyệt, do một tài khoản làm chủ. |
| Tư cách pháp nhân | Tư cách của một tổ chức tồn tại độc lập với con người, có tài sản riêng và chịu trách nhiệm bằng tài sản đó. Công ty TNHH, công ty cổ phần, công ty hợp danh có tư cách pháp nhân; hộ kinh doanh và doanh nghiệp tư nhân không có. Quyết định cách xác minh người bán (BR-26, BR-27). |
| Người đại diện theo pháp luật | Cá nhân nhân danh công ty (pháp nhân) trong giao dịch, ghi trên giấy chứng nhận đăng ký doanh nghiệp. Ký thỏa thuận hợp tác với nền tảng (BR-26). |
| Chủ hộ / chủ doanh nghiệp tư nhân | Người chính là đơn vị kinh doanh không có tư cách pháp nhân, chịu trách nhiệm bằng toàn bộ tài sản của mình. Phải là chủ tài khoản người bán (BR-27). |
| Số định danh cá nhân | Số CCCD 12 chữ số, được ghi trên giấy chứng nhận đăng ký cho chủ hộ, chủ doanh nghiệp tư nhân hoặc người đại diện. Dùng để so với CCCD đã xác minh NFC (AC-26.6, AC-26.8). |
| Thỏa thuận hợp tác | Văn bản giữa người bán là pháp nhân và Moonkage, do người đại diện theo pháp luật ký, ghi rõ tài khoản làm chủ người bán. Ký ngoài hệ thống; hệ thống lưu file (BR-26). |
| Buổi làm việc trực tiếp | Lần quản trị làm việc với doanh nghiệp là pháp nhân trước khi duyệt hồ sơ; được ghi nhận trong hồ sơ người bán (BR-26, AC-45.6). |
| Đơn vị cung cấp | Cách gọi Người bán trên giao diện phía người mua (trang danh sách đơn vị cung cấp). Cùng nghĩa với Người bán (Vendor). |
| Nguồn hàng | Người bán tự sản xuất (xưởng), bán lại, hoặc cả hai. |
| Shop | Cách bán hàng có sẵn với giá niêm yết và tồn kho; phục vụ mua ngay. Là kênh bán lẻ duy nhất xuất hiện ở trang tìm kiếm sản phẩm (BR-21). |
| Nhận đặt hàng | Cách bán qua báo giá; phục vụ đặt hàng. |
| Chỉ nhận đặt hàng | Người bán bật nhận đặt hàng nhưng không bật Shop; không bán lẻ, không có sản phẩm ở trang tìm kiếm sản phẩm (BR-21). |
| Mua ngay | Mua sản phẩm đang đăng bán trong giới hạn tồn kho, giá niêm yết, thanh toán ngay. |
| Giữ tồn kho | Phần số lượng tạm giữ cho một lần thanh toán mua ngay đang chờ kết quả VNPay; chốt khi IPN thành công, trả lại khi thất bại hoặc hết hạn (BR-28). |
| Đặt hàng | Giao dịch qua yêu cầu và báo giá; chốt khi chấp nhận báo giá và đặt cọc. |
| Yêu cầu trực tiếp | Yêu cầu gửi cho riêng một người bán. |
| Yêu cầu mở | Yêu cầu mô tả nhu cầu, nền tảng mời nhiều người bán phù hợp cùng báo giá. |
| Báo giá | Xác nhận của người bán về khả năng đáp ứng, gồm đơn giá, tổng tiền, tỷ lệ cọc, ngày giao, cách giao, thời hạn hiệu lực. Ràng buộc khi được chấp nhận. |
| Bậc giá tham khảo | Giá theo số lượng công khai ở hồ sơ nhận đặt hàng; không ràng buộc. |
| Giá theo số lượng | Bậc giá của sản phẩm trong Shop, áp dụng khi mua ngay. |
| Ngưỡng báo giá | Số lượng mà từ đó trở lên người mua phải gửi yêu cầu thay vì mua ngay. |
| Số lượng tối thiểu | Số lượng nhỏ nhất người bán nhận cho một yêu cầu đặt hàng. |
| Custom | In logo lên túi, thiệp, sticker, hộp theo mẫu có sẵn của người bán. |
| Maket | Bản thiết kế người bán gửi để người mua duyệt trước khi sản xuất; có phiên bản. |
| Tiền cọc | Phần thanh toán đầu của đơn đặt hàng, theo tỷ lệ trong báo giá, do nền tảng giữ. |
| Giải ngân | Nền tảng chuyển một phần tiền cọc đang giữ cho người bán trước khi giao, theo yêu cầu đã duyệt. |
| Giữ tiền | Nền tảng giữ tiền người mua trả cho đến khi đủ điều kiện chuyển cho người bán. |
| Đối soát | Bảng tiền theo đơn: tổng tiền, đang giữ, đã giải ngân, đã hoàn, sẽ nhận. |
| Xuất hóa đơn doanh nghiệp | Lựa chọn ở từng đơn để hóa đơn ghi tên đơn vị, mã số thuế, địa chỉ, email; là dữ liệu của đơn. |
| Vùng giao hàng | Các khu vực người bán khai giao được. |
| Phí giao | Khoản người mua trả cho việc giao một đơn: trong vùng giao của người bán thì theo phí giao nội thành người bán khai; ngoài vùng thì theo bảng phí giao liên tỉnh; đơn đặt hàng thì theo báo giá (BR-30). |
| Bảng phí giao liên tỉnh | Mức phí giao theo tỉnh nhận hàng do quản trị đặt, áp cho sản phẩm "giao toàn quốc" giao ra ngoài vùng của người bán (FR-52). |
| Lần thanh toán | Một lần người mua trả tiền cho cả giỏ; tạo mỗi Shop một đơn, các đơn được nhóm theo lần thanh toán (BR-29). |
| Phí đăng ký mở bán | Khoản mọi người bán đóng cho nền tảng một lần sau khi hồ sơ được duyệt để bắt đầu kinh doanh; mức do quản trị đặt, mặc định 200.000đ; là nguồn thu của nền tảng (BR-31, FR-53). |
| Giao nội thành / giao toàn quốc | Nhãn giao của sản phẩm Shop; "toàn quốc" chỉ cho sản phẩm đạt tiêu chuẩn đóng gói. |
| Đơn liên tỉnh | Đơn giao ra ngoài tỉnh/thành của người bán qua hãng vận chuyển. |
| Tự giao dịch | Giao dịch mà tài khoản mua chính là tài khoản chủ của người bán. Bị cấm (BR-22). |
| Xác minh NFC | Ghi nhận họ tên, giới tính, ngày sinh, quốc tịch và số định danh của chủ tài khoản bằng cách đọc thẻ NFC mô phỏng trên app Moonkage Verify; người dùng đăng nhập app, tự kiểm thông tin rồi xác nhận; máy chủ kiểm định dạng, hạn CCCD, trùng CCCD và chuyển tài khoản sang "đã xác minh NFC" (FR-04). Bắt buộc trước khi khai hồ sơ người bán và trước khi gửi yêu cầu đặt hàng (BR-23). |
| Thẻ NFC mô phỏng | Thẻ NTAG chứa một Text record JSON 9 khóa theo các trường in trên CCCD, do người dùng tự có trước và nằm ngoài hệ thống; không có chữ ký số (A-08). |
| Phiên xác minh | Phiên dùng một lần, có thời hạn, thuộc một tài khoản, liên kết trang web với app mobile qua mã QR; app phải đăng nhập đúng tài khoản của phiên (FR-04). |
| Quản trị | Đội vận hành Moonkage. |

---

## 13. Lịch sử thay đổi

Các mã FR, US, AC trong các dòng đến v1.4 là mã cũ; đối chiếu với mã mới ở mục 14.

| Phiên bản | Ngày | Người sửa | Nội dung thay đổi | Người duyệt |
|---|---|---|---|---|
| v0.1 | 2026-10-13 | | Tạo tài liệu từ `Group_Project_Context.md` và `docs/product/user-stories.md` | |
| v0.2 | 2026-10-14 | | Thêm BR-21: trang tìm kiếm sản phẩm chỉ hiện sản phẩm của người bán bán lẻ (có Shop); người bán chỉ nhận đặt hàng tìm qua danh sách đơn vị cung cấp, hồ sơ nhận đặt hàng và yêu cầu mở. Cập nhật mục 3, 4.2, FR-05 (thêm AC-05.4), FR-14 (thêm AC-14.3), FR-16, FR-26 (thêm AC-26.4), FR-30, AC-35.4, mục 7.1 (Vendor, Product), Flow 1–4, thuật ngữ "Đơn vị cung cấp", "Chỉ nhận đặt hàng". | |
| v0.3 | 2026-10-15 | | Thêm BR-22: cấm tài khoản giao dịch với người bán do chính mình làm chủ; sản phẩm và hồ sơ của mình vẫn hiển thị nhưng không mua hay gửi yêu cầu được. Cập nhật mục 4.2, FR-07 (AC-07.4), FR-08 (AC-08.4), FR-09 (AC-09.5), FR-14 (AC-14.4), FR-15 (AC-15.4), FR-16 (AC-16.4), FR-19 (AC-19.4), FR-23, FR-26, FR-36, BR-16, mục 7.1 (Vendor, Request, Order), Flow 1–3, A-04, thêm A-07, Q-28, thuật ngữ "Tự giao dịch". | Duyệt |
| v0.4 | 2026-10-15 | | Thêm FR-54 (Nhóm 10 – Xác minh NFC chủ tài khoản qua app mobile mô phỏng) và BR-23: bắt buộc xác minh NFC trước khi khai hồ sơ người bán và trước khi gửi yêu cầu đặt hàng; mua ngay không cần. Cập nhật mục 4.1, 4.2, FR-08, FR-15 (AC-15.1, thêm AC-15.5), FR-16 (thêm AC-16.5), FR-23, FR-26 (AC-26.1, thêm AC-26.5), FR-46 (AC-46.1, thêm AC-46.4), BR-11, NFR-03, NFR-04, NFR-07, mục 7.1 (Account, thêm NfcSession, Vendor, Request), Flow 2–4, thêm Flow 6, mục 9, thêm A-08, A-09, Q-29 → Q-33, thuật ngữ "Xác minh NFC", "Phiên xác minh". Cần bổ sung US-54 vào User Stories. | |
| v0.5 | 2026-10-15 | | Đổi cách mô phỏng: thay chip CCCD bằng thẻ NFC NTAG ghi sẵn dữ liệu mẫu có chữ ký, app Flutter chỉ đọc thẻ, máy chủ kiểm tra. Thêm FR-55 (cấp thẻ NFC mô phỏng). Cập nhật mục 4.1, 4.2, FR-54 (mô tả, AC-54.2, 54.5, 54.6, thêm AC-54.7), NFR-03, NFR-04, NFR-07, mục 7.1 (Account, NfcSession), Flow 6, mục 9, A-08, Q-29, thuật ngữ "Xác minh NFC", thêm "Thẻ NFC mô phỏng". Cần bổ sung US-54, US-55 vào User Stories. | |
| v0.6 | 2026-10-15 | | Chốt các thao tác quản lý sản phẩm còn thiếu: thêm FR-56 (sửa thông tin sản phẩm), FR-57 (ẩn / hiện lại), FR-58 (xóa, chỉ khi chưa từng có đơn), FR-59 (bật / tắt Shop). Quyết định: sản phẩm đăng là hiển thị, không qua duyệt; thêm BR-24. Cập nhật mục 4.1, 4.2, FR-30, NFR-07, mục 7.1 (Product), thêm Flow 7, A-10. Cần bổ sung US-56 → US-59 vào User Stories. | |
| v0.7 | 2026-10-15 | | Chốt thanh toán và chi tiền: dùng VNPay sandbox (A-11), xác nhận thanh toán qua IPN (thêm BR-25); giải ngân cọc và chuyển tiền cho người bán chỉ ghi sổ khi quản trị bấm duyệt (A-12). Đóng Q-08, Q-27. Cập nhật mục 4.2, FR-09, FR-19, FR-22 (phụ thuộc), FR-48 (thêm AC-48.4), FR-49 (thêm AC-49.4, AC-49.5), FR-51 (AC-51.3), NFR-07, mục 7.1 (Payment), mục 9. | |
| v0.8 | 2026-10-15 | | Thêm mục 4.3 Phạm vi demo: FR làm trọn, làm đơn giản (FR-25, FR-43, thông báo chỉ trong ứng dụng), hoãn (FR-13, FR-18, FR-23, FR-34, FR-37, FR-45, FR-52); bảng giá trị tạm cho demo của các câu hỏi mở đang chặn phần làm trọn. Thêm A-13. | |
| v1.0 | 2026-10-15 | | Chốt một phần Q-07 (tech stack): web frontend dùng React, backend dùng Spring Boot; app mobile giữ Flutter. Cập nhật mục 0 (phiên bản v1.0, trạng thái Approved), mục 9 (thêm mục Tech stack, ghi rõ các kiểm tra BR-22, BR-23, BR-25, FR-54 làm ở backend), Q-07 ở mục 11. Phần còn mở của Q-07: cơ sở dữ liệu, cách chia service, môi trường triển khai, phiên bản tối thiểu và thư viện NFC của app mobile. | |
| v1.1 | 2026-10-15 | | Xác minh người bán theo tư cách pháp nhân. Thêm BR-26 (công ty là pháp nhân: làm việc trực tiếp với nền tảng và có thỏa thuận hợp tác do người đại diện theo pháp luật ký, ghi rõ tài khoản làm chủ) và BR-27 (hộ kinh doanh, doanh nghiệp tư nhân: chủ tài khoản bắt buộc là chính chủ, máy chủ so số định danh trên giấy chứng nhận với CCCD đã xác minh NFC). Mở rộng loại hình người bán thành hộ kinh doanh / doanh nghiệp tư nhân / công ty. Đóng Q-32; thêm Q-34. Cập nhật mục 3, 4.1, 4.2 (không tích hợp cổng đăng ký doanh nghiệp, không OCR, không ký hợp đồng trong hệ thống), 4.3 (giá trị tạm Q-34), FR-26 (AC-26.1, thêm AC-26.6 → AC-26.8), FR-27, FR-46 (AC-46.1, viết lại AC-46.4, thêm AC-46.5, AC-46.6), FR-54 (mô tả, AC-54.6: băm có khóa bí mật), NFR-03, NFR-07, NFR-08, mục 7.1 (Account, Vendor: representative_name, representative_id_hash/masked, owner_check, onboarding_meeting), BR-11, Flow 4, mục 9, thêm A-14 → A-16, thuật ngữ "Tư cách pháp nhân", "Người đại diện theo pháp luật", "Chủ hộ / chủ doanh nghiệp tư nhân", "Số định danh cá nhân", "Thỏa thuận hợp tác", "Buổi làm việc trực tiếp". Cần cập nhật theo: `Group_Project_Context.md` mục 5, User Stories US-26, US-46, Software Design (identity-service, vendor-service). | Duyệt |
| v1.2 | 2026-10-15 | | Chốt theo hướng an toàn lâu dài (Software Design D-07 → D-09). Khóa băm số CCCD / số định danh chỉ nằm ở một thành phần máy chủ, mỗi môi trường một khóa, mã băm lưu kèm phiên bản khóa để đổi khóa được bằng cách băm lại khi người dùng cung cấp lại số (NFR-03). Đổi tên `Vendor.legal_name` thành `Vendor.business_name` để không trùng `Account.legal_name`. Cập nhật NFR-03, AC-54.6, mục 7.1 (Account: thêm id_hash_key_ver; Vendor: business_name, thêm representative_id_key_ver). | Duyệt |
| v1.3 | 2026-10-15 | | Rà soát tính đồng nhất giữa các tài liệu và chốt bốn quyết định. (1) **Xác minh NFC đơn giản hóa:** thẻ chỉ chứa Text record `MK1|<số CCCD>|<họ tên>`, quản trị ghi bằng app NFC Tools; máy chủ không kiểm chữ ký, UID, hạn CCCD; khi đọc hợp lệ, máy chủ ghi họ tên và số CCCD (băm, đã che) vào tài khoản và chuyển sang "đã xác minh NFC". Viết lại FR-54 (mô tả, AC-54.2, 54.5, 54.6; bỏ AC-54.7), FR-55 (ghi bằng NFC Tools; bỏ AC-55.4), A-08, BR-23, NFR-03 (bỏ khóa ký thẻ), NFR-07 (bỏ log cấp thẻ), mục 7.1 (Account bỏ id_expiry; NfcSession bỏ card_uid), Flow 6, mục 4.1, 4.2, thuật ngữ; Q-33 không còn áp dụng; đóng Q-29. (2) **Email thật qua Gmail SMTP** cho mã xác nhận và đặt lại mật khẩu; demo chỉ đăng ký bằng email: thêm A-17, cập nhật mục 4.3, FR-01, FR-02, NFR-03, mục 9, Q-21. (3) **Giữ tồn kho khi chờ thanh toán** (Software Design D-01): thêm BR-28, thực thể StockReservation, AC-09.6; sửa FR-09 (mô tả, AC-09.4, trường hợp lỗi), BR-25, NFR-02, Flow 1, thuật ngữ. (4) **Đồng bộ tech stack với Software Design:** cập nhật mục 9 và Q-07 (PostgreSQL, 7 service, hạ tầng). Thêm ghi chú FR-18 hoãn ảnh hưởng Flow 2 bước 4; thêm Q-35 (AC-06.1). | |
| v1.4 | 2026-10-17 | | Đồng bộ với `Moonkage Context.md` và `docs/product/user-stories.md` mới; sửa chiều phụ thuộc thành Context → User Stories → Requirement → Design. (1) **Không mô hình hóa mùa vụ:** bỏ FR-53, Season, A-06, C-01; sửa BR-14, NFR-02, G-02, FR-15, FR-16, FR-38, FR-42. (2) **Không tính hoa hồng, thêm phí đăng ký mở bán 200.000đ** (đóng một lần sau khi duyệt): bỏ FR-45, FR-50, BR-10, CommissionConfig; thêm BR-31, AC-26.9, AC-27.4 → AC-27.6, Q-36; sửa FR-43, FR-49, NFR-09, Escrow / Ledger, Payment. (3) **Một lần thanh toán, mỗi Shop một đơn:** A-01 thành BR-29; thêm AC-09.7, AC-10.3, payment_group_id; đóng Q-13. (4) **Phí giao:** thêm BR-30, FR-61, AC-29.3, InterprovinceFee, local_delivery_fee; phí giao trong báo giá. (5) **Đơn đặt hàng không đánh giá, không voucher:** thêm BR-32; đóng Q-15, chốt một phần Q-22. (6) Bỏ FR-06 (thay bằng AC-05.5), FR-34, FR-55 (thẻ do người dùng tự có), FR-58 (thêm AC-57.6); tạm bỏ FR-59. (7) Thêm FR-60 (đối soát toàn nền tảng). (8) Chuyển FR-54 vào Nhóm 1. (9) Mục 9 bỏ phần chia service và hạ tầng (thuộc Design); bỏ dẫn chiếu ngược tới Software Design ở BR-28. (10) NFR-03 thêm căn cứ pháp luật về bảo vệ dữ liệu cá nhân. (11) Mức phí đăng ký mở bán do quản trị đặt: thêm FR-62, RegistrationFeeConfig; sửa BR-31. (12) Bảng phí liên tỉnh luôn đủ mọi tỉnh: thêm A-18, sửa AC-61.3. (13) FR-60 làm trọn trong demo, gồm lọc theo khoảng thời gian. (14) Mục 3 bỏ cột "Mức độ dùng". | |
| v1.5 | 2026-10-17 | | Đánh số lại FR, US và AC liên tục theo thứ tự trong tài liệu (FR-01 → FR-53); bỏ dòng AC đã bỏ ở FR xác minh NFC. Thêm mục 14 (bảng đổi số). Nội dung yêu cầu không đổi so với v1.4. Xác nhận cùng `Moonkage Context.md` và `docs/product/user-stories.md`. | Đã xác nhận |
| v1.6 | 2026-10-17 | | Đồng bộ luồng xác minh NFC theo app mobile, đi từ Context và User Stories xuống. FR-04 viết lại (AC-04.1 → AC-04.12): app đăng nhập, phiên phải thuộc tài khoản; thẻ JSON 9 khóa (A-08); app kiểm, hiện đủ thông tin trên điện thoại, người dùng xác nhận rồi mới gửi; app mã hóa số định danh, ngày sinh, nơi thường trú khi gửi; máy chủ chặn CCCD hết hạn; lưu 5 trường (họ tên, giới tính, ngày sinh, quốc tịch, số định danh), số định danh và ngày sinh mã hóa khi lưu. Sửa NFR-03, Account, NfcSession, BR-23, Flow 6, mục 9, A-08. So họ tên còn hai mức, họ tên ở hồ sơ người bán nhập không dấu (A-15, AC-26.1, AC-45.4, owner_check). Chốt một phần Q-33; thêm Q-37. Đổi tên tài liệu gốc thành bản Final. | |

---

## 14. Bảng đổi số (v1.4 → v1.5)

Từ v1.5, FR, US và AC được đánh số liên tục theo thứ tự trong tài liệu. AC đổi theo FR: AC-xx.y cũ thành AC-(số FR mới).y. Code và Software Design còn dùng mã cũ thì đối chiếu bảng này.

| Mã cũ | Mã mới | Yêu cầu |
| --- | --- | --- |
| FR-01 | FR-01 | Đăng ký tài khoản |
| FR-02 | FR-02 | Đăng nhập và khôi phục |
| FR-03 | FR-03 | Quản lý địa chỉ giao hàng |
| FR-54 | FR-04 | Xác minh NFC chủ tài khoản |
| FR-04 | FR-05 | Chỉ thấy hàng giao được |
| FR-05 | FR-06 | Tìm, lọc, sắp xếp |
| FR-07 | FR-07 | Xem chi tiết sản phẩm |
| FR-08 | FR-08 | Giỏ hàng nhiều Shop |
| FR-09 | FR-09 | Thanh toán đơn mua ngay |
| FR-10 | FR-10 | Theo dõi đơn hàng |
| FR-11 | FR-11 | Xác nhận nhận hàng và đánh giá |
| FR-12 | FR-12 | Khiếu nại đơn hàng |
| FR-13 | FR-13 | Dùng voucher hệ thống |
| FR-14 | FR-14 | Xem hồ sơ người bán nhận đặt hàng |
| FR-15 | FR-15 | Gửi yêu cầu trực tiếp |
| FR-16 | FR-16 | Tạo yêu cầu mở |
| FR-17 | FR-17 | Nhận và so sánh báo giá |
| FR-18 | FR-18 | Xuất báo giá ra file |
| FR-19 | FR-19 | Chấp nhận báo giá và đặt cọc |
| FR-20 | FR-20 | Gửi logo và duyệt maket |
| FR-21 | FR-21 | Theo dõi tiến độ đơn đặt hàng |
| FR-22 | FR-22 | Thanh toán phần còn lại |
| FR-23 | FR-23 | Đặt lại từ đơn cũ |
| FR-24 | FR-24 | Chọn xuất hóa đơn doanh nghiệp |
| FR-25 | FR-25 | Nhận và tải hóa đơn |
| FR-26 | FR-26 | Khai hồ sơ người bán |
| FR-27 | FR-27 | Theo dõi kết quả duyệt |
| FR-29 | FR-28 | Khai vùng giao hàng |
| FR-30 | FR-29 | Đăng sản phẩm có sẵn |
| FR-31 | FR-30 | Cập nhật tồn kho và giá |
| FR-32 | FR-31 | Đặt giá theo số lượng và ngưỡng báo giá |
| FR-33 | FR-32 | Xử lý đơn mua ngay |
| FR-56 | FR-33 | Sửa thông tin sản phẩm |
| FR-57 | FR-34 | Ẩn và hiện lại sản phẩm |
| FR-35 | FR-35 | Khai hồ sơ nhận đặt hàng |
| FR-36 | FR-36 | Nhận yêu cầu phù hợp |
| FR-37 | FR-37 | Xem công suất còn lại |
| FR-38 | FR-38 | Soạn và gửi báo giá |
| FR-39 | FR-39 | Gửi maket để duyệt |
| FR-40 | FR-40 | Cập nhật tiến độ |
| FR-41 | FR-41 | Yêu cầu giải ngân tiền cọc |
| FR-42 | FR-42 | Giao đơn đặt hàng theo lịch hẹn |
| FR-43 | FR-43 | Xem đối soát |
| FR-44 | FR-44 | Lập hóa đơn cho đơn hàng |
| FR-46 | FR-45 | Duyệt hồ sơ người bán |
| FR-47 | FR-46 | Khóa người bán hoặc sản phẩm vi phạm |
| FR-48 | FR-47 | Duyệt yêu cầu giải ngân tiền cọc |
| FR-49 | FR-48 | Chuyển tiền cho người bán khi đơn hoàn tất |
| FR-51 | FR-49 | Xử lý tranh chấp và hoàn tiền |
| FR-52 | FR-50 | Quản lý voucher hệ thống |
| FR-60 | FR-51 | Đối soát toàn nền tảng |
| FR-61 | FR-52 | Đặt bảng phí giao liên tỉnh |
| FR-62 | FR-53 | Đặt mức phí đăng ký mở bán |

**FR đã bỏ** (không có mã mới): FR-06 (So sánh sản phẩm của nhiều Shop), FR-28 (Thêm nhân viên bán hàng), FR-34 (Xem và phản hồi đánh giá), FR-45 (Nhận hóa đơn phí hoa hồng), FR-50 (Cấu hình hoa hồng), FR-53 (Đặt hạn chót của mùa), FR-55 (Ghi thẻ NFC mô phỏng), FR-58 (Xóa sản phẩm); FR-59 (Bật và tắt Shop) tạm bỏ. Lý do: xem User Stories, bảng đổi số.

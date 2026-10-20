# User Stories: Moonkage

## 0. Về tài liệu này

> **Trạng thái: Đã xác nhận** (17/10/2026). Bộ tài liệu đã xác nhận cùng nhau: `docs/product/context.md`, `docs/product/user-stories.md`, `docs/product/requirements.md`. Cập nhật cùng ngày: luồng xác minh NFC theo app mobile. Mọi thay đổi sau ngày này phải sửa từ trên xuống (Context → User Stories → Requirement) và ghi lại.

User Stories diễn đạt nhu cầu của từng bên bằng lời của người dùng: ai, muốn gì, để làm gì. Tài liệu đứng giữa Context và Requirement trong chuỗi:

**Context → User Stories → Requirement → Design**

- **Nguồn gốc:** mỗi story phải truy được về `docs/product/context.md` (vấn đề ở mục 2, giải pháp ở mục 4 và 5, các bên ở mục 6, tình huống ở mục 7, ràng buộc ở mục 9). Tài liệu này chỉ dẫn chiếu lên Context, không dẫn chiếu mã của Requirement hay Design.
- **Truy vết xuống:** mỗi US-xx là gốc của FR-xx cùng số trong Requirement. Requirement viết chi tiết thành Acceptance Criteria, quy tắc nghiệp vụ, dữ liệu và yêu cầu phi chức năng.
- **Khi các tài liệu nói khác nhau:** khi triển khai thì theo Requirement, vì nó chính xác nhất. Khi sửa thì sửa từ trên xuống: Context trước, rồi User Stories, rồi Requirement. Requirement phát hiện một nhu cầu chưa có story thì thêm story ở đây trước.
- **Không đưa vào đây:** cách hệ thống kiểm tra, công nghệ, dịch vụ bên ngoài cụ thể, giá trị tạm, phạm vi demo.

**Vai dùng trong tài liệu**

| Vai | Là ai |
| --- | --- |
| Khách | Người chưa đăng nhập |
| Người mua | Bất kỳ ai có tài khoản. Gồm cả người mua thay doanh nghiệp và người bán lại đi nhập hàng, vì nền tảng chỉ có một loại tài khoản. Muốn đặt hàng qua báo giá thì phải xác minh NFC (US-04) |
| Người bán | Tài khoản đã xác minh NFC làm chủ của một đơn vị đã được duyệt: hộ kinh doanh, doanh nghiệp tư nhân hoặc công ty. Với hộ kinh doanh và doanh nghiệp tư nhân, chủ tài khoản phải là chính chủ; với công ty, chủ tài khoản là người được ghi trong thỏa thuận hợp tác (Context mục 5). Có thể có Shop, nhận đặt hàng, hoặc cả hai. Không có tài khoản nhân viên; người trực của tiệm đăng nhập bằng tài khoản của chủ |
| Quản trị | Đội vận hành Moonkage |

**Mức ưu tiên**

- **Must**: thiếu thì luồng chính không chạy được.
- **Should**: quan trọng nhưng có cách làm tạm.
- **Could**: có thì tốt.

**Tổng quan**

| Nhóm | Story | Số lượng |
| --- | --- | ---: |
| 1. Tài khoản | US-01 đến US-04 | 4 |
| 2. Khám phá và mua ngay | US-05 đến US-13 | 9 |
| 3. Đặt hàng qua báo giá | US-14 đến US-23 | 10 |
| 4. Hóa đơn phía người mua | US-24, US-25 | 2 |
| 5. Trở thành người bán | US-26 đến US-28 | 3 |
| 6. Shop | US-29 đến US-34 | 6 |
| 7. Nhận đặt hàng | US-35 đến US-42 | 8 |
| 8. Tiền và hóa đơn phía người bán | US-43, US-44 | 2 |
| 9. Quản trị nền tảng | US-45 đến US-53 | 9 |

Story được đánh số liên tục theo thứ tự trong tài liệu. Bảng đổi số giữa mã cũ và mã mới, cùng các story đã bỏ, ở cuối tài liệu.

---

## 1. Tài khoản

### US-01 · Đăng ký tài khoản · Must
**Là** khách, **tôi muốn** đăng ký bằng email hoặc số điện thoại cùng họ tên, **để** bắt đầu mua hàng.
- Chỉ có một form đăng ký; form không hỏi tôi là cá nhân hay doanh nghiệp.
- Tài khoản chỉ mua và gửi yêu cầu được sau khi tôi xác nhận email hoặc số điện thoại.
- Một email hoặc số điện thoại chỉ gắn với một tài khoản; đăng ký trùng thì bị từ chối.
- Mã xác nhận hết hạn thì tôi xin gửi lại được.
- Trong dự án chỉ đăng ký được bằng email, vì không có kênh SMS (Context mục 9).

### US-02 · Đăng nhập và khôi phục · Must
**Là** người mua, **tôi muốn** đăng nhập và đặt lại mật khẩu khi quên, **để** không mất quyền truy cập vào đơn hàng của mình.
- Đặt lại mật khẩu qua email hoặc số điện thoại đã xác nhận.
- Sau khi đăng nhập, tôi thấy toàn bộ đơn hàng, yêu cầu và báo giá của tài khoản, kể cả đơn mua thay doanh nghiệp.
- Đăng nhập sai thì thông báo chung, không tiết lộ email hoặc số điện thoại có tồn tại hay không.

### US-03 · Quản lý địa chỉ giao hàng · Should
**Là** người mua, **tôi muốn** lưu nhiều địa chỉ giao hàng và chọn một địa chỉ mặc định, **để** nền tảng chỉ hiện những thứ giao được tới tôi.
- Tôi thêm, sửa, xóa được địa chỉ; luôn có tối đa một địa chỉ mặc định.
- Đổi địa chỉ đang chọn thì danh sách sản phẩm và người bán được lọc lại theo vùng giao hàng.
- Xóa hoặc sửa địa chỉ không ảnh hưởng đơn đã đặt.

### US-04 · Xác minh NFC chủ tài khoản · Must
**Là** người dùng muốn bán hàng hoặc đặt hàng qua báo giá, **tôi muốn** xác minh danh tính bằng cách đọc chip CCCD qua điện thoại có NFC, **để** tài khoản của tôi được gắn với một con người cụ thể (Context mục 5).
- Tôi bắt đầu xác minh trên web và thấy mã QR. Tôi đăng nhập ứng dụng xác minh bằng chính tài khoản đó rồi quét QR; mã QR của tài khoản khác thì không dùng được.
- Tôi chạm thẻ; điện thoại hiện đầy đủ thông tin trên thẻ, kể cả số định danh, để tôi tự kiểm (Context mục 5).
- Tôi bấm Lưu thì thông tin mới được gửi lên nền tảng; bấm Hủy thì không gửi gì. Xong thì trang web tự cập nhật và đưa tôi về bước đang làm.
- Nền tảng chỉ giữ họ tên, giới tính, ngày sinh, quốc tịch và số định danh của tôi; tài khoản chuyển sang "đã xác minh". Các thông tin khác trên thẻ không được giữ lại.
- Số định danh, ngày sinh và nơi thường trú của tôi được giữ kín khi gửi đi và khi lưu (Context mục 9). Ngoài màn xác nhận trên điện thoại của tôi, số định danh không hiển thị đầy đủ ở bất kỳ đâu.
- CCCD đã hết hạn thì bị từ chối (Context mục 5).
- Một CCCD chỉ gắn với một tài khoản. CCCD đã gắn với tài khoản khác thì bị từ chối kèm lý do.
- Thẻ đọc không được, không đúng loại hoặc sai nội dung thì tôi được báo và thử lại; thử sai quá nhiều lần thì việc xác minh bị tạm khóa một thời gian.
- Điện thoại không có NFC thì tôi được báo và gợi ý dùng máy khác. Không có cách xác minh thay thế; tôi vẫn mua ngay bình thường (Context mục 5).
- Thẻ là của tôi, có trước khi tôi dùng nền tảng; nền tảng không cấp thẻ.
- Trong dự án, chip CCCD được mô phỏng bằng thẻ NFC chứa dữ liệu mẫu và không xác thực được (Context mục 9).

---

## 2. Khám phá và mua ngay

### US-05 · Chỉ thấy hàng giao được · Must
**Là** người mua, **tôi muốn** chỉ thấy sản phẩm và người bán giao được đến địa chỉ của mình, **để** không mất công chọn thứ không mua được.
- Sản phẩm "giao nội thành" chỉ hiện với địa chỉ trong vùng người bán đã khai.
- Sản phẩm "giao toàn quốc" hiện với mọi địa chỉ.
- Khách chưa có địa chỉ được yêu cầu chọn khu vực trước khi xem.
- Người bán thu hẹp vùng giao sau khi sản phẩm đã vào giỏ thì tôi được báo ở bước thanh toán.

### US-06 · Tìm, lọc, sắp xếp · Must
**Là** người mua, **tôi muốn** tìm theo từ khóa và lọc theo giá, thương hiệu, loại bánh, Shop, **để** thu hẹp lựa chọn nhanh.
- Kết quả gộp sản phẩm của mọi Shop giao được tới tôi.
- Mỗi sản phẩm trong kết quả hiện ảnh, giá, thương hiệu và tên Shop, để tôi so sánh ngay trong danh sách mà không phải mở từng trang.
- Kết quả chỉ gồm hàng có sẵn của người bán có Shop. Người bán chỉ nhận đặt hàng không có sản phẩm ở đây; tôi tìm họ ở US-14.
- Sắp xếp được theo giá và theo đánh giá.
- Không có kết quả thì hệ thống gợi ý bỏ bớt bộ lọc, và gợi ý gửi yêu cầu mở nếu tôi cần số lượng lớn.

### US-07 · Xem chi tiết sản phẩm · Must
**Là** người mua, **tôi muốn** xem đầy đủ thông tin một sản phẩm, **để** quyết định mua.
- Hiện giá đã gồm thuế giá trị gia tăng, tồn kho, hạn dùng, thương hiệu và nơi sản xuất.
- Hiện giá theo số lượng nếu người bán có đặt.
- Hiện vùng giao hàng và phí giao tới địa chỉ của tôi.
- Người bán có bật nhận đặt hàng thì trang có lối vào gửi yêu cầu trực tiếp.
- Sản phẩm của người bán do chính tôi làm chủ vẫn hiện để tôi xem như người mua thấy, được đánh dấu là của tôi, nhưng không có nút mua hay gửi yêu cầu (Context mục 5).

### US-08 · Giỏ hàng nhiều Shop · Must
**Là** người mua, **tôi muốn** bỏ sản phẩm của nhiều Shop vào một giỏ, **để** thanh toán một lần.
- Số lượng mỗi sản phẩm không vượt quá tồn kho đang đăng bán.
- Khi tôi nhập số lượng vượt tồn kho, hoặc đạt ngưỡng báo giá người bán đã đặt, hệ thống đề nghị chuyển sang gửi yêu cầu đặt hàng, nếu người bán có bật nhận đặt hàng; nếu không, hệ thống chỉ báo số lượng tối đa mua được.
- Giỏ hàng tách theo từng Shop và hiện phí giao của từng Shop.
- Tôi thanh toán một lần cho cả giỏ. Lần thanh toán đó tạo ra mỗi Shop một đơn, và các đơn được nhóm lại theo lần thanh toán để tôi theo dõi cùng nhau (Context mục 4).
- Tôi không thêm được vào giỏ sản phẩm của người bán do chính tôi làm chủ (Context mục 5).

### US-09 · Thanh toán đơn mua ngay · Must
**Là** người mua, **tôi muốn** thanh toán ngay trên nền tảng, **để** chốt đơn.
- Phí vận chuyển của từng Shop hiện rõ trước khi tôi bấm thanh toán. Mỗi Shop tính một khoản phí giao: địa chỉ của tôi trong vùng giao của Shop thì theo mức Shop đã khai; ngoài vùng (hàng giao toàn quốc) thì theo bảng phí liên tỉnh (Context mục 4).
- Tiền được trả cho nền tảng giữ, không trả thẳng cho người bán.
- Đơn chỉ được tạo khi thanh toán thành công; thất bại thì không trừ tiền và không tạo đơn.
- Đơn liên tỉnh không có lựa chọn thanh toán khi nhận hàng. Đơn nội thành có được thanh toán khi nhận hàng không: chưa quyết (Context mục 11).
- Trong lúc tôi đang thanh toán, phần hàng tôi mua không bị bán cho người khác. Hai người cùng mua những hộp cuối thì chỉ một người mua được (Context mục 4).
- Hàng không còn đủ lúc tôi bấm thanh toán thì tôi được báo sản phẩm thiếu trước khi trả tiền.
- Trong dự án không có tiền thật; thanh toán dùng môi trường thử nghiệm của cổng thanh toán (Context mục 9).

### US-10 · Theo dõi đơn hàng · Must
**Là** người mua, **tôi muốn** xem trạng thái từng đơn, **để** biết khi nào nhận hàng.
- Trạng thái tối thiểu: đã thanh toán, người bán xác nhận, đang giao, đã giao.
- Tôi được thông báo khi trạng thái thay đổi.
- Đơn liên tỉnh hiện mã vận đơn.

### US-11 · Xác nhận nhận hàng và đánh giá · Should
**Là** người mua, **tôi muốn** xác nhận đã nhận hàng và đánh giá, **để** người sau có căn cứ chọn.
- Chỉ đơn mua ngay đã giao mới đánh giá được; đánh giá hiện trên sản phẩm và Shop. Đơn đặt hàng là thỏa thuận riêng giữa hai bên nên không đánh giá (Context mục 4).
- Xác nhận nhận hàng là một mốc để nền tảng chuyển tiền cho người bán (Context mục 4, Thanh toán).

### US-12 · Khiếu nại đơn hàng · Should
**Là** người mua, **tôi muốn** mở khiếu nại khi bánh sai, hỏng, giao trễ hoặc in sai logo, **để** được hoàn tiền hoặc xử lý.
- Áp dụng cho cả đơn mua ngay và đơn đặt hàng.
- Khiếu nại mở được trong thời hạn khiếu nại của đơn; quá hạn thì không mở được. Con số thời hạn: chưa quyết (Context mục 11).
- Trong lúc khiếu nại đang mở, nền tảng tiếp tục giữ tiền của đơn.
- Tôi chọn lý do (bánh sai, hỏng, giao trễ, in sai logo, khác) và đính kèm được ảnh và mô tả.

### US-13 · Dùng voucher hệ thống · Could
**Là** người mua, **tôi muốn** nhập mã voucher khi thanh toán, **để** được giảm giá.
- Voucher hợp lệ được trừ vào tổng tiền trước khi thanh toán.
- Voucher hết hạn, hết lượt hoặc sai điều kiện bị từ chối kèm lý do cụ thể.
- Voucher chỉ dùng cho đơn mua ngay; đơn đặt hàng không áp dụng voucher (Context mục 4).
- Phần giảm do nền tảng hay người bán chịu: chưa quyết (Context mục 11).

---

## 3. Đặt hàng qua báo giá

### US-14 · Xem hồ sơ người bán nhận đặt hàng · Must
**Là** người mua, **tôi muốn** tìm và xem năng lực của các người bán nhận đặt hàng trước khi gửi yêu cầu, **để** không hỏi nhầm nơi.
- Tôi xem được danh sách người bán nhận đặt hàng, kể cả người bán không mở Shop như xưởng của cô Hoa (Context mục 7). Người bán chỉ nhận đặt hàng được ghi rõ là không bán lẻ.
- Hồ sơ hiện số lượng tối thiểu, bậc giá tham khảo theo số lượng, thời gian chuẩn bị hoặc sản xuất, khả năng custom, ưu đãi đặt sớm.
- Hồ sơ hiện nguồn hàng: tự sản xuất, bán lại, hoặc cả hai.
- Bậc giá được ghi rõ là tham khảo; giá ràng buộc là giá trong báo giá.
- Hồ sơ của người bán do chính tôi làm chủ vẫn xem được nhưng không có lối gửi yêu cầu (Context mục 5).

### US-15 · Gửi yêu cầu trực tiếp · Must
**Là** người mua, **tôi muốn** gửi yêu cầu cho một người bán cụ thể, **để** đặt số lượng lớn từ nơi tôi đã chọn.
- Yêu cầu gồm sản phẩm, số lượng, hạn giao, địa chỉ giao, custom nếu có.
- Số lượng dưới mức tối thiểu của người bán thì không gửi được; hệ thống hiện mức tối thiểu.
- Tài khoản phải đã xác minh NFC (US-04). Chưa xác minh thì tôi được đưa sang xác minh, xong quay lại với dữ liệu đã nhập.
- Hệ thống không hỏi tôi là cá nhân hay doanh nghiệp.
- Tôi không gửi được yêu cầu tới người bán do chính tôi làm chủ (Context mục 5).

### US-16 · Tạo yêu cầu mở · Must
**Là** người mua, **tôi muốn** mô tả nhu cầu một lần và nhận báo giá từ nhiều người bán, **để** không phải nhắn từng nơi.
- Yêu cầu gồm số lượng, ngân sách, nội dung custom, hạn giao, địa chỉ giao.
- Chỉ tài khoản đã xác minh NFC mới tạo được yêu cầu mở.
- Nền tảng chỉ mời những người bán phù hợp năng lực: đạt số lượng, làm được loại custom, giao được tới địa chỉ. Người bán chỉ nhận đặt hàng cũng được mời. Người bán do chính tôi làm chủ không bao giờ được mời (Context mục 5).
- Tôi thấy số người bán đã được mời và số báo giá đã nhận.
- Không có người bán phù hợp thì tôi được báo và được gợi ý chỉnh số lượng, custom hoặc hạn giao.

### US-17 · Nhận và so sánh báo giá · Must
**Là** người mua, **tôi muốn** xem các báo giá theo cùng một định dạng, **để** so sánh công bằng.
- Mỗi báo giá hiện đơn giá, tổng tiền, tỷ lệ cọc, ngày giao, thời hạn hiệu lực.
- Các báo giá của cùng một yêu cầu xếp cạnh nhau trong một bảng.
- Báo giá hết hiệu lực hoặc đã bị người bán thu hồi được đánh dấu và không chấp nhận được.

### US-18 · Xuất báo giá ra file · Should
**Là** người mua thay doanh nghiệp, **tôi muốn** xuất báo giá ra file, **để** trình người có quyền duyệt trong công ty.
- File chứa đủ thông tin của báo giá và tên người bán.
- Xuất được một báo giá hoặc bảng so sánh nhiều báo giá.
- Báo giá hết hiệu lực vẫn xuất được nhưng ghi rõ trạng thái.

### US-19 · Chấp nhận báo giá và đặt cọc · Must
**Là** người mua, **tôi muốn** chấp nhận một báo giá và đặt cọc, **để** chốt đơn.
- Đơn chỉ được tạo khi tiền cọc thanh toán thành công.
- Tiền cọc bằng tổng tiền nhân tỷ lệ cọc ghi trong báo giá và được nền tảng giữ.
- Chấp nhận một báo giá của yêu cầu mở thì các báo giá còn lại đóng.
- Báo giá hết hiệu lực giữa lúc thanh toán thì không tạo đơn và hoàn tiền nếu đã trừ.
- Tôi không chấp nhận được báo giá của người bán do chính tôi làm chủ (Context mục 5).
- Hủy sau khi đã cọc: chưa quyết (Context mục 11).

### US-20 · Gửi logo và duyệt maket · Must
**Là** người mua có đơn custom, **tôi muốn** tải logo lên và duyệt maket ngay trên nền tảng, **để** không nhầm phiên bản.
- Mỗi lần người bán gửi maket là một phiên bản có số thứ tự và thời điểm; phiên bản cũ không bị ghi đè.
- Tôi duyệt hoặc yêu cầu sửa kèm ghi chú; người bán được thông báo.
- Người bán chỉ chuyển đơn sang sản xuất sau khi có một phiên bản được duyệt.

### US-21 · Theo dõi tiến độ đơn đặt hàng · Must
**Là** người mua, **tôi muốn** xem tiến độ đơn đặt hàng, **để** không phải gọi hỏi.
- Tiến độ tối thiểu: đã cọc, duyệt maket (chỉ đơn có custom), đang sản xuất hoặc chuẩn bị, sẵn sàng giao, đã giao.
- Mỗi mốc kèm ghi chú và ảnh người bán đính kèm.
- Tôi được thông báo khi người bán cập nhật tiến độ.

### US-22 · Thanh toán phần còn lại · Must
**Là** người mua, **tôi muốn** thanh toán phần còn lại khi giao hàng, **để** hoàn tất đơn.
- Số tiền còn lại bằng tổng tiền trong báo giá trừ tiền cọc.
- Đơn chỉ chuyển sang đã hoàn tất sau khi phần còn lại được thanh toán.
- Người mua không thanh toán phần còn lại: chưa quyết (Context mục 11).

### US-23 · Đặt lại từ đơn cũ · Could
**Là** người mua nhập hàng nhiều đợt, **tôi muốn** tạo yêu cầu mới từ một đơn cũ, **để** không phải nhập lại.
- Yêu cầu mới được điền sẵn sản phẩm, địa chỉ, người bán của đơn cũ; tôi sửa được số lượng và hạn giao.
- Yêu cầu mới vẫn phải qua báo giá, vì công suất và nguồn hàng của người bán đã thay đổi.
- Người bán đã bị khóa thì không đặt lại được, kèm lý do.
- Tài khoản chưa xác minh NFC thì không đặt lại được.

---

## 4. Hóa đơn phía người mua

### US-24 · Chọn xuất hóa đơn doanh nghiệp · Must
**Là** người mua thay doanh nghiệp, **tôi muốn** chọn xuất hóa đơn doanh nghiệp khi đặt đơn, **để** công ty hoặc hộ kinh doanh của tôi có chứng từ.
- Lựa chọn có ở cả bước thanh toán mua ngay và bước chấp nhận báo giá.
- Tôi nhập tên đơn vị, mã số thuế, địa chỉ, email nhận hóa đơn.
- Hệ thống chỉ kiểm tra định dạng mã số thuế; không kiểm tôi có quyền đại diện cho đơn vị đó không.
- Thông tin được lưu vào chính đơn hàng đó; hệ thống không tạo hồ sơ doanh nghiệp.
- Giỏ nhiều Shop thì tôi nhập thông tin một lần, và thông tin được áp cho mọi đơn của lần thanh toán đó.
- Không chọn thì hóa đơn không ghi thông tin doanh nghiệp.

### US-25 · Nhận và tải hóa đơn · Must
**Là** người mua, **tôi muốn** nhận hóa đơn của mọi đơn hàng, **để** lưu hoặc nộp cho kế toán.
- Mọi đơn đều có hóa đơn do người bán lập, kể cả khi tôi không yêu cầu.
- Tôi tải được hóa đơn trong chi tiết đơn hàng; chưa có thì hiện "người bán chưa lập hóa đơn".
- Nếu tôi đã nhập email nhận hóa đơn, hóa đơn được gửi tới email đó.

---

## 5. Trở thành người bán

### US-26 · Khai hồ sơ người bán · Must
**Là** người mua có đăng ký kinh doanh, **tôi muốn** khai hồ sơ người bán bằng chính tài khoản của mình, **để** được bán trên nền tảng.
- Tôi phải xác minh NFC trước khi khai hồ sơ (US-04).
- Hồ sơ gồm tên đơn vị, loại hình (hộ kinh doanh, doanh nghiệp tư nhân hoặc công ty), mã số thuế, địa chỉ trụ sở, họ tên và số định danh cá nhân của chủ hộ / chủ doanh nghiệp tư nhân / người đại diện theo pháp luật như ghi trên giấy chứng nhận đăng ký, file giấy chứng nhận đăng ký, giấy tờ an toàn thực phẩm, tài khoản ngân hàng đứng tên đơn vị.
- Họ tên của chủ hộ / chủ doanh nghiệp tư nhân / người đại diện tôi nhập không dấu, cùng số định danh, để nền tảng đối chiếu với thông tin trên CCCD đã xác minh của tôi.
- Nếu đơn vị là hộ kinh doanh hoặc doanh nghiệp tư nhân, tôi phải chính là chủ: số định danh tôi khai phải trùng với số CCCD đã ghi nhận khi tôi xác minh NFC, nếu không thì không nộp được hồ sơ (Context mục 5).
- Nếu đơn vị là công ty, tôi không bắt buộc là người đại diện theo pháp luật; sau khi nộp, nền tảng sẽ liên hệ làm việc trực tiếp và ký thỏa thuận hợp tác do người đại diện ký, ghi rõ tài khoản của tôi làm chủ (Context mục 5).
- Tôi khai nguồn hàng: tự sản xuất, bán lại, hoặc cả hai.
- Tôi chọn cách bán: Shop, nhận đặt hàng, hoặc cả hai. Chọn chỉ nhận đặt hàng thì tôi được báo rằng sản phẩm của tôi sẽ không hiện ở trang tìm kiếm sản phẩm; người mua tìm tôi qua danh sách người bán nhận đặt hàng (US-14) và lời mời từ yêu cầu mở (US-16).
- Đăng ký mở bán tốn phí theo mức nền tảng đặt (hiện 200.000đ), áp cho mọi người bán; tôi đóng sau khi hồ sơ được duyệt (US-27), không phải lúc nộp (Context mục 4).
- Tài khoản khai hồ sơ trở thành chủ của người bán đó và vẫn mua hàng được như trước, trừ mua của chính người bán đó (Context mục 5).

### US-27 · Theo dõi kết quả duyệt · Must
**Là** người bán đang chờ duyệt, **tôi muốn** biết hồ sơ đang ở trạng thái nào, **để** bổ sung khi cần.
- Trạng thái: đang chờ, cần bổ sung, đã duyệt, bị từ chối.
- Hồ sơ công ty đang chờ có ghi chú chờ làm việc trực tiếp với nền tảng.
- Khi cần bổ sung hoặc bị từ chối, tôi thấy lý do và nộp lại được.
- Trước khi được duyệt, tôi không đăng bán và không nhận yêu cầu được.
- Sau khi được duyệt, tôi đóng phí đăng ký mở bán một lần theo mức hiện hành và nhận hóa đơn cho khoản phí này. Đóng xong tôi mới đăng bán và nhận yêu cầu được (Context mục 4).

### US-28 · Khai vùng giao hàng · Must
**Là** người bán, **tôi muốn** khai các khu vực mình giao được, **để** chỉ nhận đơn trong tầm phục vụ.
- Tôi chọn được nhiều khu vực. Đơn vị khu vực: chưa quyết (Context mục 11).
- Người mua ngoài vùng không thấy sản phẩm "giao nội thành" của tôi.
- Tôi khai một mức phí giao cố định cho vùng giao của mình; người mua trong vùng trả mức này cho mỗi đơn (Context mục 4).
- Thu hẹp vùng hoặc đổi phí giao không ảnh hưởng đơn đã tạo.

---

## 6. Shop

### US-29 · Đăng sản phẩm có sẵn · Must
**Là** người bán có Shop, **tôi muốn** đăng sản phẩm, **để** người mua mua ngay được.
- Mỗi sản phẩm có tên, ảnh, mô tả, giá niêm yết đã gồm thuế, tồn kho, hạn dùng.
- Sản phẩm bán lại bắt buộc ghi thương hiệu và nơi sản xuất.
- Tôi đánh dấu sản phẩm là "giao nội thành" hoặc "giao toàn quốc"; nhãn "giao toàn quốc" chỉ chọn được khi sản phẩm đạt tiêu chuẩn đóng gói của nền tảng. Tiêu chuẩn cụ thể: chưa quyết (Context mục 11).
- Sản phẩm hiển thị ngay khi đăng, không chờ quản trị duyệt; quản trị gỡ nếu vi phạm.

### US-30 · Cập nhật tồn kho và giá · Must
**Là** người bán có Shop, **tôi muốn** sửa tồn kho và giá, **để** thông tin luôn đúng.
- Tồn kho về 0 thì sản phẩm không mua ngay được nữa; tồn kho không nhận số âm.
- Thay đổi giá không ảnh hưởng tới đơn đã thanh toán.

### US-31 · Đặt giá theo số lượng và ngưỡng báo giá · Should
**Là** người bán có Shop, **tôi muốn** đặt giá giảm theo số lượng và một ngưỡng phải qua báo giá, **để** khuyến khích mua nhiều mà vẫn kiểm soát được đơn lớn.
- Tôi đặt được nhiều bậc giá theo số lượng cho một sản phẩm; các bậc không chồng lấn.
- Tôi đặt được số lượng mà từ đó trở lên người mua phải gửi yêu cầu.
- Ngưỡng này chỉ có tác dụng khi tôi có bật nhận đặt hàng.
- Quy tắc chênh lệch giá sỉ/lẻ: chưa quyết (Context mục 11).

### US-32 · Xử lý đơn mua ngay · Must
**Là** người bán có Shop, **tôi muốn** xác nhận và cập nhật trạng thái đơn, **để** người mua theo dõi được.
- Tôi thấy danh sách đơn mới kèm địa chỉ và thông tin xuất hóa đơn nếu có.
- Tôi chuyển đơn qua các trạng thái theo đúng thứ tự: xác nhận, đang giao, đã giao.
- Đơn liên tỉnh phải có mã vận đơn của hãng vận chuyển khi chuyển sang đang giao.
- Không xác nhận được đơn vì hết hàng thực tế: chưa quyết (Context mục 11, người bán không giao được).

### US-33 · Sửa thông tin sản phẩm · Should
**Là** người bán có Shop, **tôi muốn** sửa tên, ảnh, mô tả, hạn dùng và các thông tin khác của sản phẩm, **để** thông tin luôn đúng mà không phải đăng lại.
- Tôi sửa được tên, ảnh, mô tả, hạn dùng, thương hiệu, nơi sản xuất, nhãn giao; thay đổi hiển thị ngay, không qua duyệt.
- Sản phẩm bán lại vẫn bắt buộc có thương hiệu và nơi sản xuất; nhãn "giao toàn quốc" vẫn chỉ chọn được khi đạt tiêu chuẩn đóng gói.
- Đơn đã tạo giữ nguyên thông tin cũ.
- Sản phẩm đã bị quản trị gỡ thì tôi không sửa được.

### US-34 · Ẩn và hiện lại sản phẩm · Should
**Là** người bán có Shop, **tôi muốn** tạm ẩn một sản phẩm và hiện lại sau, **để** ngừng bán tạm thời mà không mất dữ liệu.
- Sản phẩm bị ẩn rời trang tìm kiếm và trang Shop phía người mua.
- Nếu sản phẩm đang nằm trong giỏ người mua, nó bị loại ở bước thanh toán kèm thông báo; đơn đã tạo vẫn chạy.
- Tôi hiện lại được khi sản phẩm đủ thông tin bắt buộc.
- Không có thao tác xóa sản phẩm. Sản phẩm đăng nhầm hoặc ngừng bán thì tôi ẩn đi, để giữ lịch sử đơn, đánh giá và đối soát.
- Sản phẩm đã bị quản trị gỡ thì tôi không hiện lại được.

---

## 7. Nhận đặt hàng

### US-35 · Khai hồ sơ nhận đặt hàng · Must
**Là** người bán, **tôi muốn** khai điều kiện nhận đặt hàng, **để** chỉ nhận những yêu cầu mình làm được.
- Tôi khai số lượng tối thiểu, bậc giá tham khảo, thời gian chuẩn bị hoặc sản xuất, khả năng custom, ưu đãi đặt sớm.
- Nếu tự sản xuất, tôi khai thêm công suất theo tuần, loại bánh, loại bao bì, khả năng in logo.
- Nếu bán lại, tôi khai thương hiệu đang phân phối và số lượng gom được.
- Custom chỉ khai được trong phạm vi in logo lên túi, thiệp, sticker, hộp mẫu có sẵn.
- Tôi nhận đặt hàng mà không cần mở Shop.

### US-36 · Nhận yêu cầu phù hợp · Must
**Là** người bán nhận đặt hàng, **tôi muốn** nhận yêu cầu trực tiếp và lời mời từ yêu cầu mở, **để** có đơn mà không cần đội sales.
- Tôi chỉ nhận lời mời khi yêu cầu đạt số lượng tối thiểu, đúng loại custom tôi làm được, và nằm trong vùng giao của tôi.
- Mỗi yêu cầu hiện số lượng, hạn giao, địa chỉ giao, nội dung custom, ngân sách nếu có.
- Tôi từ chối được yêu cầu, bắt buộc kèm lý do; người mua được thông báo.
- Khi bị khóa, tôi không nhận yêu cầu mới.
- Tôi không nhận yêu cầu do chính tài khoản của mình tạo (Context mục 5).

### US-37 · Xem công suất còn lại · Should
**Là** xưởng sản xuất, **tôi muốn** xem số lượng đã nhận theo từng tuần, **để** không nhận quá khả năng.
- Lịch hiện công suất đã khai, số đã nhận và số còn lại của mỗi tuần.
- Khi soạn báo giá vượt công suất còn lại của tuần giao, hệ thống cảnh báo nhưng không chặn.

### US-38 · Soạn và gửi báo giá · Must
**Là** người bán nhận đặt hàng, **tôi muốn** gửi báo giá theo mẫu chuẩn, **để** xác nhận mình đáp ứng được và người mua so sánh được.
- Báo giá gồm đơn giá, phí giao, tổng tiền, tỷ lệ cọc, ngày giao, cách giao, thời hạn hiệu lực. Phí giao nằm trong tổng tiền (Context mục 4).
- Đơn giá được gợi ý từ bậc giá tham khảo; tôi sửa được và thêm được phụ phí custom.
- Báo giá đã gửi không sửa được; tôi chỉ thu hồi và gửi bản mới.

### US-39 · Gửi maket để duyệt · Must
**Là** người bán nhận đơn custom, **tôi muốn** gửi maket cho người mua duyệt, **để** không in sai.
- Mỗi lần tải maket lên tạo một phiên bản mới; người mua được thông báo và trả lời duyệt hoặc yêu cầu sửa.
- Tôi không chuyển được đơn sang sản xuất khi chưa có maket được duyệt.

### US-40 · Cập nhật tiến độ · Must
**Là** người bán nhận đặt hàng, **tôi muốn** cập nhật tiến độ từng đơn, **để** người mua không phải gọi hỏi.
- Tôi chuyển đơn qua các mốc theo đúng thứ tự: đang sản xuất hoặc chuẩn bị, sẵn sàng giao, đã giao.
- Mỗi lần cập nhật có thể kèm ghi chú và ảnh, và được ghi vào lịch sử tiến độ.

### US-41 · Yêu cầu giải ngân tiền cọc · Must
**Là** người bán nhận đặt hàng, **tôi muốn** xin giải ngân một phần tiền cọc, **để** có vốn mua nguyên liệu, in ấn, nhập hàng.
- Yêu cầu ghi số tiền và mục đích sử dụng (nguyên liệu, in ấn, bao bì, nhập hàng).
- Tổng số đã giải ngân, đang chờ và số mới không vượt quá tiền cọc nền tảng đang giữ của đơn đó.
- Tôi thấy trạng thái yêu cầu: đang chờ, đã duyệt, bị từ chối kèm lý do.

### US-42 · Giao đơn đặt hàng theo lịch hẹn · Must
**Là** người bán nhận đặt hàng, **tôi muốn** giao theo lịch đã ghi trong báo giá và cập nhật trạng thái, **để** hoàn tất đơn.
- Ngày giao là ngày đã thỏa thuận trong báo giá.
- Khi tôi đánh dấu đã giao, người mua được yêu cầu thanh toán phần còn lại.
- Giao trễ so với báo giá thì người mua khiếu nại được (US-12).

---

## 8. Tiền và hóa đơn phía người bán

### US-43 · Xem đối soát · Must
**Là** người bán, **tôi muốn** xem tiền của từng đơn, **để** biết mình sẽ nhận bao nhiêu và khi nào.
- Mỗi đơn hiện tổng tiền, tiền nền tảng đang giữ, tiền đã giải ngân, tiền sẽ nhận và ngày dự kiến nhận.
- Tiền sẽ nhận = tổng tiền − đã giải ngân − đã hoàn. Dự án không tính hoa hồng (Context mục 9).
- Đơn đang khiếu nại hiện là đang giữ, chưa có ngày dự kiến.
- Tôi lọc được theo khoảng thời gian và xuất ra file.

### US-44 · Lập hóa đơn cho đơn hàng · Must
**Là** người bán, **tôi muốn** lập và gắn hóa đơn vào từng đơn, **để** làm đúng nghĩa vụ và người mua có chứng từ.
- Mỗi đơn hiện rõ có thông tin xuất hóa đơn doanh nghiệp hay không, và nội dung thông tin đó.
- Tôi gắn hóa đơn đã lập vào đơn để người mua tải về.
- Đơn chưa có hóa đơn được đánh dấu nhắc.

---

## 9. Quản trị nền tảng

### US-45 · Duyệt hồ sơ người bán · Must
**Là** quản trị, **tôi muốn** xem và duyệt hồ sơ người bán, **để** chỉ đơn vị hợp lệ mới được bán.
- Tôi xem được giấy chứng nhận đăng ký, giấy tờ an toàn thực phẩm, tài khoản ngân hàng, kết quả xác minh NFC của chủ tài khoản, và thông tin chủ hộ / chủ doanh nghiệp tư nhân / người đại diện đã khai. Số CCCD và số định danh chỉ hiện dạng đã che.
- Tôi thấy kết quả so số định danh và họ tên đã khai với thông tin CCCD đã xác minh của chủ tài khoản. Với công ty, không trùng là bình thường khi chủ tài khoản không phải người đại diện.
- Trước khi duyệt, tôi xác nhận đã đối chiếu thông tin đã khai với file giấy chứng nhận; với doanh nghiệp tư nhân và công ty, xác nhận thêm đã tra cứu mã số trên Cổng thông tin quốc gia về đăng ký doanh nghiệp. Việc tra cứu làm thủ công (Context mục 9).
- Với công ty, tôi chỉ duyệt được khi đã ghi nhận buổi làm việc trực tiếp và có file thỏa thuận hợp tác đã ký, ghi rõ tài khoản làm chủ (Context mục 5).
- Tôi duyệt, yêu cầu bổ sung, hoặc từ chối; yêu cầu bổ sung và từ chối bắt buộc kèm lý do.
- Người bán được thông báo kết quả.
- Người bán sửa hồ sơ pháp lý hoặc tài khoản ngân hàng sau khi duyệt có phải duyệt lại không: chưa quyết (Context mục 11).

### US-46 · Khóa người bán hoặc sản phẩm vi phạm · Should
**Là** quản trị, **tôi muốn** khóa một người bán hoặc gỡ một sản phẩm, **để** bảo vệ người mua.
- Người bán bị khóa không hiện trong tìm kiếm và không nhận đơn mới; đơn đang chạy vẫn được xử lý tiếp.
- Sản phẩm bị gỡ đang nằm trong giỏ người mua bị loại ở bước thanh toán; người bán không tự sửa hay hiện lại sản phẩm đó.
- Mỗi lần khóa hoặc gỡ có ghi lý do, người thực hiện và thời điểm.

### US-47 · Duyệt yêu cầu giải ngân tiền cọc · Must
**Là** quản trị, **tôi muốn** xét từng yêu cầu giải ngân, **để** tiền cọc được dùng đúng cho đơn hàng.
- Tôi thấy số tiền xin, mục đích, tiền cọc đang giữ và số đã giải ngân của đơn.
- Hệ thống không cho duyệt số tiền vượt phần cọc còn giữ.
- Từ chối bắt buộc kèm lý do.
- Phần cọc chưa giải ngân tiếp tục được giữ đến khi giao thành công.
- Trong dự án, duyệt giải ngân chỉ được ghi nhận, không chuyển khoản thật (Context mục 9).

### US-48 · Chuyển tiền cho người bán khi đơn hoàn tất · Must
**Là** quản trị, **tôi muốn** tiền được chuyển cho người bán khi đủ điều kiện, **để** đối soát đúng hạn.
- Đơn đủ điều kiện khi người mua xác nhận đã nhận hàng, hoặc hết thời hạn khiếu nại mà không có khiếu nại đang mở.
- Đơn liên tỉnh có thời gian giữ tiền dài hơn đơn nội thành. Con số: chưa quyết (Context mục 11).
- Số chuyển = tổng tiền − số đã giải ngân − số đã hoàn.
- Đơn đang có khiếu nại mở thì không chuyển được.
- Trong dự án, chuyển tiền chỉ được ghi nhận, không chuyển khoản thật (Context mục 9).

### US-49 · Xử lý tranh chấp và hoàn tiền · Must
**Là** quản trị, **tôi muốn** xử lý khiếu nại của người mua, **để** hai bên được phân xử công bằng.
- Tôi xem được đơn hàng, báo giá, các phiên bản maket, lịch sử tiến độ và bằng chứng của hai bên.
- Tôi quyết định hoàn toàn bộ, hoàn một phần, hoặc bác khiếu nại, bắt buộc kèm lý do.
- Tiền hoàn được lấy từ khoản nền tảng đang giữ của đơn.
- Số hoàn vượt số đang giữ vì cọc đã giải ngân: chưa quyết (Context mục 11).

### US-50 · Quản lý voucher hệ thống · Could
**Là** quản trị, **tôi muốn** tạo và tắt voucher, **để** chạy khuyến mãi.
- Voucher có mức giảm, thời hạn, số lượt dùng, điều kiện áp dụng.
- Voucher bị tắt thì người mua nhập mã bị từ chối.

### US-51 · Đối soát toàn nền tảng · Should
**Là** quản trị, **tôi muốn** xem đối soát của toàn nền tảng, **để** biết tiền nền tảng đang giữ và đã đi đâu (Context mục 4, mục 6).
- Theo từng đơn, tôi thấy số người mua đã trả, số đang giữ, đã giải ngân, đã chuyển cho người bán và đã hoàn.
- Tôi thấy tổng của các con số trên, lọc được theo khoảng thời gian.
- Tôi thấy các khoản phí đăng ký mở bán đã thu.
- Đơn có số đã giải ngân, đã chuyển và đã hoàn cộng lại vượt quá số người mua đã trả thì được đánh dấu để tôi kiểm tra.

### US-52 · Đặt bảng phí giao liên tỉnh · Must
**Là** quản trị, **tôi muốn** đặt phí giao liên tỉnh theo tỉnh nhận hàng, **để** người mua thấy phí trước khi thanh toán đơn hàng giao toàn quốc (Context mục 4).
- Mỗi tỉnh nhận hàng có một mức phí, tính cho mỗi đơn.
- Đổi bảng phí không ảnh hưởng đơn đã tạo.
- Phí lấy theo bảng, không theo cân nặng hay giá thật của hãng vận chuyển (Context mục 9).

### US-53 · Đặt mức phí đăng ký mở bán · Must
**Là** quản trị, **tôi muốn** đặt mức phí đăng ký mở bán, **để** điều chỉnh nguồn thu của nền tảng (Context mục 4).
- Mức phí mặc định là 200.000đ; tôi đổi được mức này.
- Người bán đóng theo mức hiện hành tại thời điểm đóng.
- Đổi mức phí không ảnh hưởng người bán đã đóng: không thu thêm và không hoàn phần chênh.

---

## Đối chiếu với các tình huống trong Context mục 7

| Nhân vật | Việc họ làm | Story đi qua |
| --- | --- | --- |
| Chị Lan, HR | Xác minh NFC, đặt 150 hộp có logo cho công ty, lấy hóa đơn doanh nghiệp | US-01, 04, 16, 17, 18, 19, 24, 20, 21, 22, 25 |
| Chị Lan, buổi tối | Mua hai hộp cho nhà bằng cùng tài khoản | US-05, 07, 08, 09, 10 |
| Cô Hoa, chủ xưởng (hộ kinh doanh) | Xác minh NFC, khai hồ sơ với số định danh trùng CCCD của mình, chỉ nhận đặt hàng, không mở Shop | US-04, 26, 27, 45, 28, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44 |
| Anh Minh | So sánh và mua vài hộp, không cần xác minh NFC | US-01, 05, 06, 07, 08, 09, 10, 11 |
| Chị Thảo, chủ tiệm quà (hộ kinh doanh) | Xác minh NFC, tìm xưởng cô Hoa, đặt 80 hộp, mua gấp 15 hộp từ đại lý, rồi mở Shop và quản lý sản phẩm | US-04, 14, 15, 17, 19, 24, 22, sau đó US-08, 09, sau đó US-26, 27, 45, 28, 29, 30, 33, 34 |
| Anh Quân, chủ tiệm bánh | Mở Shop, quản lý sản phẩm, nhận yêu cầu vượt tồn kho | US-04, 26, 27, 45, 28, 29, 30, 31, 33, 34, 32, 35, 38 |
| Bạn Vy, cộng tác viên | Xác minh NFC, đặt 60 hộp không có hóa đơn doanh nghiệp | US-01, 04, 15, 17, 19, 21, 22, 25 |

---

## Bảng đổi số (2026-10-17)

Story được đánh số lại liên tục theo thứ tự trong tài liệu. Mã cũ dùng đến Requirement v1.4; mã mới dùng từ Requirement v1.5. FR mang cùng số với US.

| Mã cũ | Mã mới | Story |
| --- | --- | --- |
| US-01 | US-01 | Đăng ký tài khoản |
| US-02 | US-02 | Đăng nhập và khôi phục |
| US-03 | US-03 | Quản lý địa chỉ giao hàng |
| US-54 | US-04 | Xác minh NFC chủ tài khoản |
| US-04 | US-05 | Chỉ thấy hàng giao được |
| US-05 | US-06 | Tìm, lọc, sắp xếp |
| US-07 | US-07 | Xem chi tiết sản phẩm |
| US-08 | US-08 | Giỏ hàng nhiều Shop |
| US-09 | US-09 | Thanh toán đơn mua ngay |
| US-10 | US-10 | Theo dõi đơn hàng |
| US-11 | US-11 | Xác nhận nhận hàng và đánh giá |
| US-12 | US-12 | Khiếu nại đơn hàng |
| US-13 | US-13 | Dùng voucher hệ thống |
| US-14 | US-14 | Xem hồ sơ người bán nhận đặt hàng |
| US-15 | US-15 | Gửi yêu cầu trực tiếp |
| US-16 | US-16 | Tạo yêu cầu mở |
| US-17 | US-17 | Nhận và so sánh báo giá |
| US-18 | US-18 | Xuất báo giá ra file |
| US-19 | US-19 | Chấp nhận báo giá và đặt cọc |
| US-20 | US-20 | Gửi logo và duyệt maket |
| US-21 | US-21 | Theo dõi tiến độ đơn đặt hàng |
| US-22 | US-22 | Thanh toán phần còn lại |
| US-23 | US-23 | Đặt lại từ đơn cũ |
| US-24 | US-24 | Chọn xuất hóa đơn doanh nghiệp |
| US-25 | US-25 | Nhận và tải hóa đơn |
| US-26 | US-26 | Khai hồ sơ người bán |
| US-27 | US-27 | Theo dõi kết quả duyệt |
| US-29 | US-28 | Khai vùng giao hàng |
| US-30 | US-29 | Đăng sản phẩm có sẵn |
| US-31 | US-30 | Cập nhật tồn kho và giá |
| US-32 | US-31 | Đặt giá theo số lượng và ngưỡng báo giá |
| US-33 | US-32 | Xử lý đơn mua ngay |
| US-56 | US-33 | Sửa thông tin sản phẩm |
| US-57 | US-34 | Ẩn và hiện lại sản phẩm |
| US-35 | US-35 | Khai hồ sơ nhận đặt hàng |
| US-36 | US-36 | Nhận yêu cầu phù hợp |
| US-37 | US-37 | Xem công suất còn lại |
| US-38 | US-38 | Soạn và gửi báo giá |
| US-39 | US-39 | Gửi maket để duyệt |
| US-40 | US-40 | Cập nhật tiến độ |
| US-41 | US-41 | Yêu cầu giải ngân tiền cọc |
| US-42 | US-42 | Giao đơn đặt hàng theo lịch hẹn |
| US-43 | US-43 | Xem đối soát |
| US-44 | US-44 | Lập hóa đơn cho đơn hàng |
| US-46 | US-45 | Duyệt hồ sơ người bán |
| US-47 | US-46 | Khóa người bán hoặc sản phẩm vi phạm |
| US-48 | US-47 | Duyệt yêu cầu giải ngân tiền cọc |
| US-49 | US-48 | Chuyển tiền cho người bán khi đơn hoàn tất |
| US-51 | US-49 | Xử lý tranh chấp và hoàn tiền |
| US-52 | US-50 | Quản lý voucher hệ thống |
| US-60 | US-51 | Đối soát toàn nền tảng |
| US-61 | US-52 | Đặt bảng phí giao liên tỉnh |
| US-62 | US-53 | Đặt mức phí đăng ký mở bán |

**Story đã bỏ** (không có mã mới):

| Mã cũ | Mã mới | Story và lý do |
| --- | --- | --- |
| US-06 | — | So sánh sản phẩm của nhiều Shop. Bỏ: nhu cầu so sánh (Context mục 1, 2, 4) đã đáp ứng bằng trang tìm kiếm gộp mọi Shop |
| US-28 | — | Thêm nhân viên bán hàng. Bỏ: nền tảng không có tài khoản nhân viên (Context mục 5) |
| US-34 | — | Xem và phản hồi đánh giá. Bỏ: không có gốc trong Context; mục 6 chỉ nói người bán nhận đánh giá |
| US-45 | — | Nhận hóa đơn phí hoa hồng. Bỏ: dự án không tính hoa hồng (Context mục 9) |
| US-50 | — | Cấu hình hoa hồng. Bỏ: dự án không tính hoa hồng; nguồn thu là phí đăng ký mở bán (Context mục 4, mục 9) |
| US-53 | — | Đặt hạn chót của mùa. Bỏ: nền tảng không mô hình hóa mùa vụ (Context mục 9) |
| US-55 | — | Ghi thẻ NFC mô phỏng. Bỏ: không có quản trị nào cấp CCCD; người dùng tự có thẻ trước (Context mục 9) |
| US-58 | — | Xóa sản phẩm. Bỏ: người bán ẩn sản phẩm thay vì xóa, đúng với Context mục 6 ("đăng, sửa, ẩn sản phẩm") |
| US-59 | — | Bật và tắt Shop. Tạm bỏ: cách bán được chọn khi khai hồ sơ người bán và chưa đổi được sau khi duyệt |

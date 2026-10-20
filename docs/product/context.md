# Bối cảnh dự án: Moonkage

## 0. Về tài liệu này

> **Trạng thái: Đã xác nhận** (17/10/2026). Bộ tài liệu đã xác nhận cùng nhau: `docs/product/context.md`, `docs/product/user-stories.md`, `docs/product/requirements.md`. Cập nhật cùng ngày: luồng xác minh NFC theo app mobile. Mọi thay đổi sau ngày này phải sửa từ trên xuống (Context → User Stories → Requirement) và ghi lại.

### Mục đích

Tài liệu mô tả bối cảnh và lý do của dự án Moonkage: thị trường, vấn đề của từng bên, cách mua bán diễn ra ngoài đời, giải pháp ở mức khái niệm, và các ràng buộc được áp từ bên ngoài vào dự án. Đây là tầng gốc của bộ tài liệu dự án.

### Vị trí trong chuỗi tài liệu

| Tài liệu        | Trả lời câu hỏi                       | Dựa trên                                                        |
| --------------- | ------------------------------------- | --------------------------------------------------------------- |
| **Context**     | Tại sao làm, thế giới vận hành ra sao | Thực tế bên ngoài: thị trường, con người, luật, điều kiện dự án |
| User Stories    | Người dùng cần gì                     | Context                                                         |
| Requirement     | Hệ thống phải làm gì                  | Context, User Stories                                           |
| Software Design | Xây hệ thống như thế nào              | Requirement                                                     |

Context sinh ra Requirement; Requirement là tiền đề của Design. Quan hệ chỉ đi một chiều: tài liệu tầng dưới được dẫn chiếu tài liệu tầng trên, không có chiều ngược lại. Khi viết Requirement hay Design mà phát hiện một nhu cầu chưa có ở đây, nhu cầu đó được bổ sung vào Context trước, rồi mới sinh ra yêu cầu tương ứng.

### Nội dung được đưa vào

Mỗi câu trong tài liệu phải qua được một trong hai phép thử:
1. **Không có hệ thống, câu này vẫn đúng.** Ví dụ: hộ kinh doanh không có tư cách pháp nhân; doanh nghiệp chốt đơn quà từ tháng Bảy.
2. **Điều này do bên ngoài đặt ra**, không do nhóm tự chọn. Ví dụ: dự án bắt buộc dùng microservices; bán thực phẩm phải có đăng ký kinh doanh.

Giải pháp được mô tả ở mức khái niệm: nền tảng làm gì, không làm gì, vì sao.

### Nội dung không đưa vào

- Mã yêu cầu, quy tắc, giả định, câu hỏi của các tài liệu tầng dưới.
- Hành vi chi tiết của hệ thống: trạng thái, màn hình, kiểm tra ở máy chủ, trường dữ liệu.
- Công nghệ do nhóm tự chọn, dịch vụ bên ngoài cụ thể, giá trị tạm cho demo.
- Câu trả lời tạm cho câu hỏi còn mở. Tài liệu này chỉ nêu câu hỏi (mục 11).

### Cách đọc

- Mục 1 đến 3: hiểu thị trường, vấn đề và cách mua bán ngoài đời.
- Mục 4 đến 7: giải pháp, định danh, các bên và tình huống tiêu biểu.
- Mục 8 và 9: ranh giới phạm vi và ràng buộc bên ngoài.
- Mục 10 và 11: thước đo thành công và câu hỏi nghiệp vụ còn mở.
- Mục 12: tra cứu thuật ngữ.

Nếu có điểm không hợp lý, phải hỏi, không tự suy diễn.

## 1. Bối cảnh thị trường

Bánh Trung thu là mặt hàng mùa vụ đặc biệt ở Việt Nam. Toàn bộ nhu cầu dồn vào khoảng 6 đến 8 tuần trước rằm tháng Tám. Bên cạnh người mua lẻ, nhu cầu còn đến từ các đơn số lượng lớn: doanh nghiệp đặt làm quà cho nhân viên, đối tác và hộ kinh doanh nhập để bán lại.

### Hành vi người mua

Người mua gồm ba nhóm có hành vi khác nhau. Đây là ba phân khúc thị trường, dùng để hiểu nhu cầu; nền tảng không có loại tài khoản riêng cho từng nhóm (xem mục 5). Với người mua phổ thông, nền tảng chỉ quan tâm việc họ muốn mua, không quan tâm họ mua để làm gì. Mục đích mua chỉ được phân tích ở hộ kinh doanh và doanh nghiệp, vì ở hai nhóm này nó kéo theo nhu cầu về giá, custom và chứng từ. Ma trận dưới đây thể hiện mức độ phổ biến của từng mục đích mua theo từng nhóm.

| Nhóm người mua ↓ / Mục đích → | Nhu cầu riêng | Tặng (nhân viên, đối tác, khách hàng) | Bán lại |
| ----------------------------- | ------------: | ------------------------------------: | ------: |
| Cá nhân / Hộ gia đình         |           ●●● |                                       |         |
| Hộ kinh doanh / Shop          |             ● |                                    ●● |     ●●● |
| Doanh nghiệp / Tổ chức        |             ● |                                   ●●● |         |

Chú thích: ●●● là mục đích chính, ●● là khá phổ biến, ● là thỉnh thoảng, ô trống là gần như không có. "Nhu cầu riêng" ở cá nhân, hộ gia đình gộp mọi mục đích cá nhân, không phân biệt; ở hai nhóm còn lại là dùng nội bộ (bày quán, tiếp khách, sự kiện).

Từ ma trận có thể rút ra ba điểm:
- **Người mua phổ thông** chủ yếu mua số lượng nhỏ cho nhu cầu riêng, nên thứ họ cần nhất là một nơi dễ so sánh và dễ đặt hàng.
- Mục đích **tặng** là chính ở doanh nghiệp và khá phổ biến ở hộ kinh doanh. Riêng ở doanh nghiệp, nó kéo theo nhu cầu custom (logo, thiệp) và hóa đơn đứng tên công ty.
- Mục đích **bán lại** chủ yếu thuộc về hộ kinh doanh, nên giá giảm theo số lượng là mối quan tâm lớn nhất của nhóm này.

**1.1. Người mua phổ thông (cá nhân, hộ gia đình)**
Mua cho nhu cầu riêng. Nền tảng không phân biệt và không cần biết họ mua để làm gì. Phần lớn mua số lượng nhỏ, thường là các sản phẩm đại trà trên thị trường. Một số ít mua vài chục hộp (gom đơn cho người quen, hội nhóm, bán lại không đăng ký kinh doanh); khi đó họ mua theo cách của mọi người mua số lượng lớn khác. Họ tự quyết định nhanh, thanh toán một lần, không cần hóa đơn ghi thông tin doanh nghiệp và gần như không cần custom. Mối quan tâm chính là giá, thương hiệu quen và bao bì. Khó khăn lớn nhất là so sánh bánh của nhiều tiệm. Họ mua muộn, tập trung vào những tuần sát rằm.

**1.2. Hộ kinh doanh / Shop (retailer)**
Gồm tiệm tạp hóa, quán cà phê, tiệm quà, shop online, người bán qua Facebook/Zalo. Mục đích chính là bán lại, kế đến là tặng khách hàng và nhân viên, còn dùng nội bộ (bày quán, tiếp khách) chỉ thỉnh thoảng. Họ mua với số lượng vừa, nhiều hơn người mua phổ thông. Khi bán lại, họ cần giá sỉ thấp để có biên lợi nhuận, quan tâm bánh dễ bán, mẫu mã phổ biến, hạn dùng còn dài. Một người (chủ hộ) quyết định, nhanh hơn doanh nghiệp nhưng tính giá kỹ hơn người mua phổ thông. Chứng từ ở mức đơn giản (phiếu giao hàng, hóa đơn), hiếm khi cần in logo riêng. Họ đặt hàng lặp lại, nhập nhiều đợt trong mùa và nhạy cảm với bậc giá theo số lượng. Thời điểm mua nằm giữa mùa, sớm hơn người mua phổ thông.

**1.3. Doanh nghiệp / Tổ chức**
Mục đích chủ yếu là tặng nhân viên và biếu đối tác. Nhu cầu dùng nội bộ (tiếp khách, sự kiện) chỉ thỉnh thoảng, và không có nhu cầu bán lại. Họ mua từ vài chục đến vài nghìn hộp. Người thực hiện (HR, admin, thư ký) không phải người trả tiền, nên quy trình qua nhiều bước: xin ngân sách, so sánh báo giá, trình duyệt. Họ có các yêu cầu mà hai nhóm trên ít khi có:
- Hộp, túi, thiệp mang logo và nhận diện công ty.
- Hóa đơn ghi tên công ty, mã số thuế, và chứng từ để thanh toán, đối soát.
- Giao đúng hạn.
- Theo dõi tiến độ sản xuất mà không phải gọi hỏi.

Họ chốt sớm (từ tháng Bảy) vì cần thời gian duyệt maket và sản xuất.

**Bảng so sánh ba nhóm người mua**

| Tiêu chí | Người mua phổ thông | Hộ kinh doanh | Doanh nghiệp |
| --- | --- | --- | --- |
| Mục đích chính | Nhu cầu riêng (không phân biệt mục đích) | Bán lại | Tặng |
| Số lượng | Phần lớn nhỏ, đôi khi vài chục hộp | Vừa | Lớn (vài chục đến vài nghìn hộp) |
| Người quyết định | Một người | Một người (chủ hộ) | Nhiều bước, qua duyệt ngân sách |
| Tiêu chí chọn | Giá, thương hiệu, bao bì | Giá sỉ, biên lợi nhuận, dễ bán | Giá theo số lượng, logo, hóa đơn công ty, đúng hạn |
| Custom | Không hoặc hiếm | Hiếm | Có (in logo lên túi, thiệp, sticker, hộp mẫu có sẵn) |
| Chứng từ | Hóa đơn thông thường, không cần thông tin doanh nghiệp | Hóa đơn, có thể ghi tên hộ kinh doanh | Hóa đơn ghi tên công ty và mã số thuế, đối soát |
| Thời điểm mua | Muộn, sát rằm | Giữa mùa | Sớm, từ tháng Bảy |
| Kiểu giao dịch thường gặp | Mua ngay hàng có sẵn; đặt hàng khi mua nhiều | Đặt hàng qua báo giá; mua ngay khi cần ít | Đặt hàng qua báo giá, thường kèm custom; mua ngay khi cần ít |

### Phía cung

Phía cung có ba kiểu chủ thể:
- **Thương hiệu lớn** có sẵn hệ thống phân phối và đội bán hàng doanh nghiệp riêng.
- **Xưởng bánh vừa và nhỏ** có sản phẩm tốt, có khả năng làm theo yêu cầu, nhưng không có đội sales và chủ yếu bán qua Facebook, Zalo, người quen. Nhiều xưởng chỉ muốn nhận đơn số lượng lớn, không muốn xử lý từng đơn 1-5 hộp, chụp ảnh, viết mô tả hay chăm sóc khách lẻ.
- **Tiệm bánh, thương hiệu nhỏ, đại lý** có sản phẩm để bán trực tiếp cho người tiêu dùng, có thể có xưởng riêng, nhận bánh từ xưởng khác, hoặc nhập lại từ một đại lý.

## 2. Vấn đề hiện tại

**Doanh nghiệp đặt quà custom mất nhiều công sức.** Người phụ trách (thường là HR hoặc admin) phải tự tìm xưởng, nhắn Zalo từng nơi, nhận báo giá rời rạc không cùng định dạng nên khó so sánh. Không biết trước xưởng nào in được logo, số lượng tối thiểu bao nhiêu, cần bao lâu. Maket logo gửi qua lại bằng tin nhắn dễ nhầm phiên bản. Khi đơn đang sản xuất, họ không biết tiến độ thế nào cho đến khi gọi hỏi.

**Xưởng sản xuất nhỏ khó tiếp cận đơn số lượng lớn.** Họ có năng lực nhưng không có kênh chạm tới doanh nghiệp và hộ kinh doanh. Đơn đến rời rạc và dồn vào sát rằm, gây quá tải tuần cuối trong khi tháng Bảy lại vắng. Báo giá phải tính tay: giá theo số lượng, phụ phí in ấn, chiết khấu.

**Người mua phổ thông mất thời gian chọn bánh.** Muốn so sánh bánh của nhiều tiệm phải vào từng trang riêng, mỗi nơi một cách đặt hàng và thanh toán.

**Hộ kinh doanh khó tìm nguồn hàng sỉ ổn định.** Họ phải liên hệ từng hãng, từng đại lý để hỏi giá sỉ, mỗi nơi một chính sách, khó so sánh biên lợi nhuận và khó nhập thêm hàng giữa mùa.

**Tiệm bánh nhỏ khó bán online.** Nhiều tiệm chỉ bán qua Facebook, Zalo, người quen, chưa có kênh bán hàng riêng với giỏ hàng, thanh toán và quản lý đơn.

## 3. Mô hình mua bán ngoài đời

Mọi khái niệm và quy tắc của nền tảng phải ứng với một thứ có thật ngoài đời. Các điều dưới đây là nền cho những mục sau.

**Con người và tổ chức kinh doanh là hai thứ khác nhau.** Con người đi mua, đi bán. Tổ chức kinh doanh (doanh nghiệp, hộ kinh doanh) có mã số thuế và đứng tên trên hóa đơn. Doanh nghiệp tồn tại độc lập với nhân viên, nhưng khi đi mua thì luôn phải có một con người đứng ra đại diện. Hộ kinh doanh thì gắn với chủ hộ, người chịu trách nhiệm bằng chính mình.

**Đơn vị kinh doanh có hoặc không có tư cách pháp nhân.** Hộ kinh doanh và doanh nghiệp tư nhân không có tư cách pháp nhân: người chủ chính là đơn vị và chịu trách nhiệm bằng toàn bộ tài sản của mình. Công ty (TNHH, cổ phần, hợp danh) là pháp nhân: tồn tại độc lập với con người, người đại diện theo pháp luật chỉ nhân danh công ty và có thể thay đổi. Vì vậy, với hộ kinh doanh và doanh nghiệp tư nhân, xác minh người chủ cũng là xác minh đơn vị; với công ty, cần thêm bằng chứng rằng người đứng ra có quyền thay mặt công ty (mục 5).

**Vai mua, bán gắn với từng giao dịch, không gắn với con người.** Chủ tiệm quà là người mua khi nhập bánh ở xưởng và là người bán khi đứng quầy. Hàng đi theo chuỗi nhiều tầng: nhà sản xuất → đại lý → người bán lẻ → người dùng cuối. Chuỗi có thể ngắn hơn (xưởng bán thẳng cho người dùng cuối) hoặc dài hơn.

**Người bán lẻ nhập hàng từ nguồn nào là tùy tình hình.** Họ nhập từ nhà sản xuất khi cần nhiều và đặt sớm được. Họ nhập từ một người bán lại khác khi cần ít, cần gấp, hoặc khi nhà sản xuất không bán trực tiếp cho tiệm nhỏ, như phần lớn thương hiệu lớn. Cùng một tiệm có thể dùng cả hai nguồn trong một mùa.

**Mua cho ai là danh nghĩa của lần mua.** Khi mua cho mình, người chọn, người trả tiền và người dùng là một. Khi mua cho tổ chức, ba vai đó tách ra: nhân viên đi chọn, công ty trả tiền, người khác nhận hàng. Vì tiêu tiền của tổ chức nên cần người duyệt và chứng từ. Cùng một người có thể mua cho công ty buổi sáng và mua cho nhà buổi tối.

**Ít hay nhiều được đo so với hàng người bán đang có.** Từ đó có hai kiểu giao dịch:
- Trong phạm vi hàng có sẵn: lấy hàng, trả giá niêm yết, xong.
- Vượt hàng có sẵn, hoặc hàng phải làm riêng: người bán phải xem có đáp ứng kịp không, giá phải thỏa thuận, phải hẹn ngày giao.

Ngưỡng "nhiều" do từng người bán tự đặt: 20 hộp là nhiều với một tiệm nhỏ nhưng là ít với một xưởng.

**Đặt hàng buộc hai bên tin nhau qua thời gian.** Lúc thỏa thuận, hàng chưa tồn tại. Người bán sợ làm xong không ai nhận, người mua sợ trả tiền rồi không có hàng. Tiền cọc và bên giữ tiền trung gian sinh ra từ đó. Cũng vì tiền cọc được giữ và một phần được giải ngân trước khi giao, nền tảng cần gắn mỗi tài khoản đặt hàng hoặc bán hàng với một danh tính cụ thể: đó là lý do của bước xác minh NFC (mục 5).

**Người bán khác nhau ở thứ họ có trong tay.**

| | Người bán lại | Người tự sản xuất (xưởng) |
| --- | --- | --- |
| Có trong tay | Hàng sẵn trên kệ | Năng lực làm ra hàng |
| Giới hạn | Số hàng đã nhập và nguồn nhập thêm | Công suất và thời gian |
| Hợp với | Mua ít, lấy ngay | Mua nhiều, đặt trước |
| Làm theo yêu cầu | Hầu như không | Được |
| Giá | Giá nhập cộng lãi | Thấp hơn, giảm theo số lượng |

Ranh giới này không cứng: xưởng vẫn bán lẻ ở cửa xưởng, người bán lại vẫn nhận gom đơn lớn rồi đặt lại nguồn hàng.

**Thuế và hóa đơn theo luật, không theo loại người mua.** Lần bán nào cũng chịu thuế giá trị gia tăng và có hóa đơn do người bán lập. Người mua là doanh nghiệp hay hộ kinh doanh chỉ làm thay đổi thông tin ghi trên hóa đơn.

Hai trục phía người mua tạo ra bốn tình huống, cả bốn đều có thật:

| | Mua ít | Mua nhiều |
| --- | --- | --- |
| **Cho mình** | Vài hộp cho gia đình (phổ biến nhất) | Gom đơn, hội nhóm, bán lại không đăng ký |
| **Cho tổ chức** | Công ty mua vài hộp tiếp khách | Quà cho toàn bộ nhân viên, đối tác; nhập hàng về bán |

## 4. Giải pháp

Moonkage (Moon + Hokage) là **marketplace** quà Trung thu, không giới hạn một địa phương. Người mua chỉ thấy những sản phẩm và người bán giao được đến địa chỉ của mình. Nền tảng **không tự bán bánh**, không tự nhập hàng, không giữ kho. Nền tảng kết nối người mua với các người bán đã được duyệt, và vận hành giao dịch, giữ tiền, đối soát, voucher hệ thống.

### Hai kiểu giao dịch

- **Mua ngay (mua lẻ)**: người mua chọn trong những sản phẩm đang được đăng bán, trong giới hạn tồn kho của người bán, trả theo giá niêm yết và thanh toán ngay.
- **Đặt hàng (mua sỉ hoặc làm theo yêu cầu)**: người mua gửi yêu cầu, người bán báo giá. Báo giá là bước người bán xác nhận đáp ứng được số lượng và hạn giao. Đơn chỉ được chốt khi người mua chấp nhận báo giá và đặt cọc.

Một lần mua phải đi theo kiểu đặt hàng khi rơi vào một trong các trường hợp sau:
- Số lượng vượt tồn kho đang đăng bán.
- Sản phẩm không có sẵn mà phải sản xuất.
- Có custom (in logo lên túi, thiệp, sticker, hộp mẫu có sẵn).
- Người bán có nhận đặt hàng và quy định từ một số lượng nào đó trở lên phải qua báo giá.

Kiểu giao dịch do số lượng và yêu cầu của lần mua quyết định, không do người mua là ai. Một cá nhân đạt số lượng tối thiểu, đã xác minh NFC và chấp nhận đặt cọc được đặt hàng như một công ty. Một công ty cần năm hộp tiếp khách thì mua ngay như một cá nhân.

### Người bán

Người bán (vendor) là một đơn vị kinh doanh đã được nền tảng duyệt: hộ kinh doanh, doanh nghiệp tư nhân hoặc công ty (xem mục 5). Cá nhân không có đăng ký kinh doanh không bán được trên nền tảng, vì bán thực phẩm đòi hỏi đăng ký kinh doanh, điều kiện an toàn thực phẩm và lập hóa đơn.

Mỗi người bán khai **nguồn hàng** của mình: tự sản xuất (xưởng), mua đi bán lại, hoặc cả hai. Sản phẩm bán lại phải ghi rõ thương hiệu và nơi sản xuất.

Mỗi người bán chọn một hoặc cả hai **cách bán**:

| Cách bán | Người bán khai gì | Phục vụ kiểu giao dịch |
| --- | --- | --- |
| **Shop** (hàng có sẵn) | Sản phẩm, giá niêm yết, tồn kho, hạn dùng, vùng giao hàng, giá theo số lượng nếu có | Mua ngay |
| **Nhận đặt hàng** | Số lượng tối thiểu, bậc giá tham khảo, thời gian chuẩn bị hoặc sản xuất, khả năng custom, ưu đãi đặt sớm | Đặt hàng |

Nền tảng không cấm cách bán nào theo loại người bán. Giới hạn đến từ thực tế của từng bên:
- **Xưởng nhận đặt hàng** khai thêm hồ sơ sản xuất: công suất theo tuần, loại bánh, loại bao bì, khả năng in logo, mức độ custom, giấy tờ chứng nhận. Xưởng không muốn xử lý đơn nhỏ thì không mở Shop và tự đặt số lượng tối thiểu cao.
- **Xưởng mở Shop** để bán lẻ hàng có sẵn, như bán ở cửa xưởng.
- **Người bán lại nhận đặt hàng** trong phạm vi nguồn hàng của mình: khai thương hiệu đang phân phối, số lượng gom được và thời gian chuẩn bị. Đây là vai của đại lý: bán sỉ cho những người bán lẻ khác. Với bánh thương hiệu lớn, đại lý thường là nguồn sỉ duy nhất mà tiệm nhỏ tiếp cận được. Họ chỉ nhận custom ở phần mình tự làm được và đã khai rõ (ví dụ kèm thiệp, túi).
- **Người bán lại cũng là người mua.** Họ nhập hàng từ nhà sản xuất hoặc từ một người bán lại khác, trên nền tảng hoặc ngoài nền tảng, tùy tình hình. Trên nền tảng, họ nhập bằng chính tài khoản của mình: đặt hàng qua báo giá khi cần nhiều, mua ngay từ Shop khác khi cần ít và gấp.
- **Nền tảng không yêu cầu khai nguồn nhập.** Người bán nhập từ ai là việc kinh doanh của họ. Nền tảng chỉ yêu cầu sản phẩm ghi rõ thương hiệu và nơi sản xuất.

Sản phẩm người bán đăng hoặc sửa hiển thị ngay, không chờ quản trị duyệt; quản trị kiểm soát sau bằng cách gỡ sản phẩm vi phạm.

### Mua ngay

Các Shop đăng sản phẩm có sẵn và bán trực tiếp cho người mua. Còn hàng thì mua được, kể cả mua nhiều; giới hạn là tồn kho, và ngưỡng phải qua báo giá nếu người bán có nhận đặt hàng và đã đặt ngưỡng. Hàng trên kệ chỉ bán được một lần: khi nhiều người cùng mua những hộp cuối, chỉ một người mua được, và trong lúc một người đang thanh toán thì phần hàng của họ không bị bán cho người khác. Giá trị khác biệt so với việc mua thẳng từ từng hãng:
- **So sánh và chọn dễ dàng**: bánh của nhiều thương hiệu, nhiều tiệm trên cùng một nơi.
- **Một nơi để mua**: tìm, đặt hàng, thanh toán và theo dõi đơn trên cùng một nền tảng.

Người mua thanh toán một lần cho cả giỏ hàng có sản phẩm của nhiều Shop. Lần thanh toán đó tạo ra mỗi Shop một đơn, vì mỗi Shop là một người bán riêng: Shop nào tự giao, tự cập nhật trạng thái và tự lập hóa đơn cho đơn của mình. Các đơn của cùng một lần thanh toán được nhóm lại để người mua theo dõi cùng nhau.

### Đặt hàng qua báo giá

Có hai cách gửi yêu cầu:
- **Yêu cầu trực tiếp**: người mua chọn hàng của một người bán và gửi yêu cầu (sản phẩm, số lượng, hạn giao, custom nếu có) cho riêng người bán đó.
- **Yêu cầu mở**: người mua mô tả nhu cầu (số lượng, ngân sách, nội dung in logo, hạn giao). Nền tảng gửi lời mời đến các người bán phù hợp năng lực. Các bên nộp giá theo cùng một định dạng để người mua so sánh.

Người gửi yêu cầu phải đã xác minh NFC (mục 5). Người bán đối chiếu yêu cầu với công suất hoặc nguồn hàng còn lại rồi mới báo giá. Báo giá ghi rõ đơn giá, tổng tiền, tỷ lệ cọc, ngày giao và thời hạn hiệu lực. Người mua xuất được báo giá ra file để trình duyệt trong nội bộ. Sau khi chấp nhận báo giá và đặt cọc, người mua duyệt maket (nếu có custom) và theo dõi tiến độ ngay trên nền tảng. Đơn đặt hàng là thỏa thuận riêng giữa hai bên qua báo giá, nên không được đánh giá công khai và không áp dụng voucher hệ thống.

Bậc giá tham khảo theo số lượng là công khai để người mua ước lượng trước; giá ràng buộc là giá trong báo giá. Custom giới hạn ở in logo lên túi, thiệp, sticker và hộp theo mẫu có sẵn của người bán. Nền tảng đặt quy tắc về chênh lệch giữa giá sỉ và giá bán lẻ để giá sỉ không làm méo giá bán lẻ trên nền tảng (mức cụ thể chưa quyết, xem mục 11).

### Giao hàng

Nền tảng không giới hạn địa lý nhưng mở rộng theo từng lớp, dựa trên vùng giao hàng mà mỗi người bán tự khai báo.

- **Vùng giao hàng do người bán khai báo.** Mỗi người bán khai khu vực giao được. Mỗi sản phẩm trong Shop được đánh dấu là "giao nội thành" hoặc "giao toàn quốc". Người mua chỉ thấy sản phẩm giao được đến địa chỉ của mình.
- **Đơn mua ngay, nội thành:** người bán hoặc đơn vị giao nội thành đảm nhận. Người bán biết chi phí giao của mình, nên tự khai một mức phí giao cố định cho vùng giao đã khai.
- **Đơn mua ngay, liên tỉnh:** giao qua hãng vận chuyển liên tỉnh, chỉ áp dụng cho sản phẩm đã đóng gói theo tiêu chuẩn tối thiểu của nền tảng để được gắn nhãn "giao toàn quốc". Phí vận chuyển lấy theo bảng phí theo tỉnh nhận hàng do nền tảng đặt, vì nền tảng là bên đặt tiêu chuẩn "giao toàn quốc"; phí hiển thị trước khi thanh toán.
- **Đơn đặt hàng:** không giới hạn địa lý. Người bán nào giao được ra tỉnh thì nhận, và thỏa thuận cách giao và phí giao với người mua trong báo giá, theo lịch hẹn. Phí giao nằm trong tổng tiền của báo giá. Trạng thái giao hàng được cập nhật trên nền tảng.
- **Ranh giới nội thành và liên tỉnh:** địa chỉ người mua nằm trong vùng giao người bán đã khai thì tính phí nội thành của người bán; nằm ngoài vùng đó (chỉ với sản phẩm "giao toàn quốc") thì tính theo bảng phí liên tỉnh.
- **Phí giao theo đơn:** mỗi đơn chịu một khoản phí giao. Người mua trả phí giao cho nền tảng cùng tiền hàng; nền tảng giữ và chuyển cho người bán khi đơn hoàn tất, vì người bán là bên tự giao hoặc tự trả cho hãng vận chuyển.
- **Mở rộng vùng theo lộ trình:** ưu tiên tuyển người bán ở một vài thành phố lớn trước khi mở rộng tiếp, để người mua ở mỗi vùng có đủ lựa chọn.

### Thanh toán

- Người mua thanh toán cho nền tảng, không trả thẳng cho người bán. Nền tảng thu hộ và đối soát.
- Nền tảng giữ tiền đến khi người mua xác nhận đã nhận hàng hoặc hết thời hạn khiếu nại. Thời gian giữ tiền dài hơn cho đơn liên tỉnh.
- Không áp dụng thanh toán khi nhận hàng cho đơn liên tỉnh.
- Đơn đặt hàng thanh toán theo hai đợt: đặt cọc khi chấp nhận báo giá, phần còn lại khi giao.
- Tỷ lệ cọc do người mua và người bán thỏa thuận, ghi rõ trong báo giá.
- Giải ngân tiền cọc cho người bán dựa trên báo cáo của người bán: họ báo cáo số tiền cần giải ngân và mục đích sử dụng (nguyên liệu, in ấn, bao bì, nhập hàng). Nền tảng xét duyệt và chỉ giải ngân đúng số tiền cần, không vượt quá số tiền cọc đang giữ. Phần cọc chưa giải ngân tiếp tục được giữ đến khi giao thành công.
- Nguồn thu của nền tảng là phí đăng ký mở bán: mọi người bán, dù mở Shop hay chỉ nhận đặt hàng, đóng một lần sau khi hồ sơ được duyệt để bắt đầu hoạt động kinh doanh. Mức phí do nền tảng đặt và có thể thay đổi, hiện là 200.000đ; người bán đóng theo mức tại thời điểm đóng.
- Nền tảng có quy tắc hoàn tiền và xử lý tranh chấp cho các trường hợp bánh sai, giao trễ, hỏng, in sai logo.

### Hóa đơn

- Người bán lập hóa đơn cho người mua với mọi đơn hàng, kể cả khi người mua không yêu cầu.
- Mặc định hóa đơn không ghi thông tin doanh nghiệp.
- Khi đặt đơn, người mua có thể chọn xuất hóa đơn doanh nghiệp và nhập tên đơn vị, mã số thuế, địa chỉ, email nhận hóa đơn. Thông tin này được ghi vào đơn hàng và người bán lập hóa đơn theo đó.
- Giá hiển thị là giá đã gồm thuế giá trị gia tăng và như nhau với mọi người mua. Thuế suất và cách tính thuế theo quy định hiện hành và theo loại hình của người bán.
- Nền tảng không phải bên bán hàng nên không lập hóa đơn bán bánh. Nền tảng chỉ lập hóa đơn cho khoản phí của chính mình (phí đăng ký mở bán).

## 5. Định danh: tài khoản và người bán

### Thuật ngữ

| Thuật ngữ | Nghĩa |
| --- | --- |
| **Guest** | Người dùng chưa đăng nhập |
| **Member** | Người dùng đã đăng nhập bằng một tài khoản |

"Member" nghĩa là có tài khoản, còn "đã đăng nhập" là trạng thái phiên. Trong tài liệu này hai nghĩa được coi là một, vì quyền chỉ áp dụng khi đã đăng nhập. Member không gợi vai mua hay bán: mua và bán là vai trong từng giao dịch, còn người bán là một đơn vị do Member làm chủ.

Tài khoản đại diện cho một con người; mọi tài khoản đều mua ngay được, và đặt hàng qua báo giá được sau khi xác minh NFC, cho mình hoặc thay cho một doanh nghiệp. Người bán là một đơn vị có đăng ký kinh doanh đã được duyệt, do một tài khoản đã xác minh NFC làm chủ. Người bán bán theo một hoặc cả hai cách: Shop (hàng có sẵn, mua ngay) và Nhận đặt hàng (qua báo giá, gồm mua vượt hàng có sẵn và làm theo yêu cầu).

### Nguyên tắc

Phía mua chỉ có một loại tài khoản, đại diện cho một con người. Không có tài khoản doanh nghiệp, và doanh nghiệp mua hàng không được lưu như một thực thể hay một hồ sơ trong hệ thống.

Lý do: thứ doanh nghiệp cần ở nền tảng chỉ là một người đại diện đứng ra mua và một hóa đơn ghi thông tin doanh nghiệp. Quan hệ giữa người đại diện và doanh nghiệp là việc nội bộ của doanh nghiệp, nền tảng không quản. Vì không lưu doanh nghiệp nên không phát sinh câu hỏi ai sở hữu hay ai kiểm soát dữ liệu của doanh nghiệp.

Cách này đúng với mua bán ngoài đời: người bán bán cho người đứng ra mua, và ghi lên hóa đơn tên đơn vị mà người đó yêu cầu.

```
Phía mua   Tài khoản (một con người) ──▶ đơn hàng
                                          └─ tùy chọn: thông tin xuất hóa đơn doanh nghiệp

Phía bán   Tài khoản ── làm chủ ──▶ Người bán (Shop, hồ sơ nhận đặt hàng)
```

### Tài khoản

- Mỗi người một tài khoản, đăng ký bằng email hoặc số điện thoại, kèm họ tên.
- Mọi tài khoản đã xác nhận đều mua ngay được. Đặt hàng qua báo giá (gửi yêu cầu trực tiếp, yêu cầu mở, đặt lại) cần thêm xác minh NFC một lần.
- Đơn hàng thuộc về tài khoản đã đặt, cùng yêu cầu, báo giá, maket và hóa đơn của đơn đó.

### Xác minh NFC

Xác minh NFC gắn tài khoản với một con người cụ thể, qua thông tin đọc từ chip trên thẻ CCCD. Ngoài đời, việc này giống như một bên ghi lại giấy tờ tùy thân của bên kia trước khi giao hay nhận tiền cọc. Với phía bán, nó cho biết ai đứng sau người bán. Với phía mua, nó gắn mỗi tài khoản tham gia giao dịch có cọc với một danh tính.

- Người dùng đăng nhập ứng dụng xác minh bằng tài khoản của mình, rồi đọc chip CCCD của chính mình bằng điện thoại có NFC.
- Thông tin trên thẻ hiện đầy đủ trên điện thoại để người dùng tự kiểm. Người dùng đồng ý thì thông tin mới được gửi lên nền tảng; không đồng ý thì không gửi gì.
- Nền tảng chỉ giữ những thông tin cần để xác định một con người: họ tên, giới tính, ngày sinh, quốc tịch và số định danh cá nhân. Các thông tin khác trên thẻ không được giữ lại. Tài khoản chuyển sang "đã xác minh".
- CCCD đã hết hạn thì không dùng để xác minh được, như ngoài đời giấy tờ hết hạn không còn giá trị.
- Một CCCD chỉ gắn với một tài khoản, để một số CCCD không dùng cho nhiều tài khoản.
- Xác minh NFC chỉ gắn tài khoản với một con người. Nó không chứng minh người đó có quyền đại diện cho doanh nghiệp ghi trên hóa đơn.
- Trong dự án, chip CCCD được mô phỏng và không xác thực được (mục 9).

### Mua thay doanh nghiệp

Khi đặt đơn (mua ngay hoặc chấp nhận báo giá), người mua có thể chọn **xuất hóa đơn doanh nghiệp** và nhập tên đơn vị, mã số thuế, địa chỉ, email nhận hóa đơn.

- Thông tin này được ghi vào chính đơn hàng đó, vì người bán cần nó để lập hóa đơn. Nó là dữ liệu của đơn hàng, không phải hồ sơ doanh nghiệp.
- Cách làm như nhau cho công ty và hộ kinh doanh.
- Nền tảng chỉ kiểm tra định dạng mã số thuế. Nền tảng không xác minh người mua có quyền đại diện cho đơn vị đó hay không.
- Không chọn xuất hóa đơn doanh nghiệp thì đơn là mua cho cá nhân.
- Người mua thay doanh nghiệp xác minh NFC bằng giấy tờ của chính mình, không phải của doanh nghiệp.

### Hệ quả được chấp nhận

- Doanh nghiệp không có màn hình chung. Lịch sử mua nằm ở tài khoản của từng người đã đặt; thứ doanh nghiệp giữ là hóa đơn và hàng đã nhận.
- Người đại diện nghỉ việc thì tài khoản và lịch sử đơn đi theo người đó. Đơn đang chạy cần người đó bàn giao, hoặc doanh nghiệp liên hệ người bán và nền tảng bằng mã đơn cùng thông tin trên hóa đơn.
- Không có vai trò hay hạn mức duyệt trong hệ thống. Việc xin duyệt nội bộ diễn ra ngoài nền tảng, bằng file báo giá xuất ra.
- Thông tin xuất hóa đơn được nhập ở từng đơn.
- Người không có điện thoại có NFC thì không tự đặt hàng qua báo giá được; họ vẫn mua ngay bình thường.

### Người bán

Phía bán thì có thực thể, vì người bán có sản phẩm, tồn kho, năng lực, uy tín, và phải được duyệt. Người bán là một đơn vị kinh doanh (hộ kinh doanh, doanh nghiệp tư nhân hoặc công ty) được khai và duyệt trên nền tảng. Hồ sơ gồm tên, loại hình, mã số thuế, địa chỉ, họ tên và số định danh của chủ hộ / chủ doanh nghiệp tư nhân / người đại diện theo pháp luật như ghi trên giấy chứng nhận đăng ký, giấy tờ, tài khoản ngân hàng nhận tiền, cùng Shop và hồ sơ nhận đặt hàng (xem mục 4). Tài khoản khai hồ sơ phải đã xác minh NFC.

- Mỗi người bán do một tài khoản làm chủ, và chỉ tài khoản đó thao tác trên người bán. Nền tảng không có tài khoản nhân viên bán hàng.
- Ngoài đời, nhân viên của tiệm đăng nhập bằng tài khoản của chủ và trực trên màn hình của người bán. Việc giao cho ai trực là việc nội bộ của người bán, nền tảng không quản.
- Người bán cũng là người mua: chủ dùng chính tài khoản của mình để đặt hàng từ xưởng.
- Không ai tự mua của chính mình: tài khoản chủ không mua ngay, không gửi yêu cầu, không được mời và không chấp nhận báo giá của người bán do mình làm chủ. Sản phẩm của mình vẫn hiển thị để chủ xem như người mua thấy, nhưng không mua được. Nền tảng không phát hiện được trường hợp chủ nhờ một tài khoản khác mua.

### Xác minh người bán theo tư cách pháp nhân

Ai được làm chủ người bán, và nền tảng kiểm điều đó thế nào, phụ thuộc vào việc đơn vị có tư cách pháp nhân hay không (mục 3).

| Loại hình | Pháp nhân | Ai làm chủ tài khoản người bán | Nền tảng kiểm thế nào |
| --- | --- | --- | --- |
| Hộ kinh doanh, doanh nghiệp tư nhân | Không | Bắt buộc là chính chủ hộ / chủ doanh nghiệp tư nhân; không chấp nhận ủy quyền | Nền tảng so số định danh của chủ ghi trên giấy chứng nhận đăng ký với số CCCD đã ghi nhận khi tài khoản xác minh NFC; không trùng thì không nhận hồ sơ |
| Công ty (TNHH, cổ phần, hợp danh) | Có | Người được ghi trong thỏa thuận hợp tác; không bắt buộc là người đại diện theo pháp luật | Nền tảng làm việc trực tiếp với công ty và nhận thỏa thuận hợp tác do người đại diện theo pháp luật ký, ghi rõ tài khoản làm chủ; chỉ duyệt khi đã làm việc trực tiếp và có thỏa thuận |

Với mọi loại hình, quản trị đối chiếu thông tin đã khai với file giấy chứng nhận đăng ký. Với doanh nghiệp tư nhân và công ty, quản trị tra cứu thêm mã số doanh nghiệp trên Cổng thông tin quốc gia về đăng ký doanh nghiệp. Nền tảng không kết nối cổng này, nên việc tra cứu làm thủ công.

Lý do tách hai luồng: với chủ thể không có tư cách pháp nhân, người chủ chính là đơn vị, nên xác minh con người là đủ. Với pháp nhân, xác minh một con người không chứng minh được người đó có quyền thay mặt công ty; thỏa thuận do người đại diện ký là bằng chứng ràng buộc.

### Hệ quả được chấp nhận ở phía bán

- Người trực màn hình người bán dùng chung tài khoản của chủ, nên thấy được cả đơn mua của chủ: đơn nhập hàng, đơn mua cho cá nhân, thông tin xuất hóa đơn doanh nghiệp.
- Người trực sửa được hồ sơ pháp lý và tài khoản ngân hàng nhận tiền của người bán. Việc có bắt duyệt lại sau khi sửa hay không đang mở (mục 11).
- Nền tảng không phân biệt được ai đã đăng sản phẩm, báo giá hay cập nhật tiến độ. Mọi thao tác được ghi nhận là của chủ, và chủ chịu trách nhiệm với nền tảng và người mua.
- Hộ kinh doanh và doanh nghiệp tư nhân không giao được quyền làm chủ cho người khác trên nền tảng, kể cả có giấy ủy quyền. Chủ muốn nhờ người trực thì cho người đó dùng tài khoản của mình.
- Công ty mất thêm một bước làm việc trực tiếp trước khi được duyệt, và đội vận hành tốn thêm công khi tuyển người bán.

### Mức xác minh

| Mức | Kiểm chứng | Mở khóa |
| --- | --- | --- |
| Tài khoản | Xác nhận email hoặc số điện thoại | Mua ngay; yêu cầu xuất hóa đơn doanh nghiệp khi mua ngay |
| Xác minh NFC | Đọc chip CCCD bằng điện thoại có NFC, người dùng xác nhận; CCCD còn hạn; ghi nhận họ tên, giới tính, ngày sinh, quốc tịch, số định danh vào tài khoản; một CCCD một tài khoản | Đặt hàng qua báo giá (gửi yêu cầu trực tiếp, yêu cầu mở, đặt lại); khai hồ sơ người bán |
| Người bán | Quản trị duyệt giấy chứng nhận đăng ký, giấy tờ an toàn thực phẩm, tài khoản ngân hàng đứng tên đơn vị. Hộ kinh doanh, doanh nghiệp tư nhân: số định danh của chủ trên giấy trùng số CCCD đã ghi nhận của chủ tài khoản. Công ty: làm việc trực tiếp và có thỏa thuận hợp tác do người đại diện theo pháp luật ký | Mở Shop, nhận đặt hàng |

Kênh đặt hàng không phân biệt người mua là cá nhân hay doanh nghiệp. Điều kiện để đặt hàng là tài khoản đã xác minh NFC, số lượng tối thiểu của người bán và tiền cọc. Lý do thêm xác minh NFC: đơn đặt hàng có tiền cọc được giữ và một phần được giải ngân trước khi giao, nên mỗi tài khoản tham gia cần gắn với một số CCCD duy nhất.

## 6. Các bên tham gia

Các vai dưới đây là vai trong giao dịch. Một người có thể đóng nhiều vai.

| Vai | Là ai ngoài đời | Dùng nền tảng để |
|---|---|---|
| **Người mua cho mình** | Bất kỳ ai có tài khoản: người mua cho gia đình, người gom đơn, cộng tác viên | So sánh và mua ngay hàng có sẵn; xác minh NFC rồi đặt hàng qua báo giá khi mua nhiều |
| **Người mua thay doanh nghiệp** | HR, admin, thư ký công ty; chủ hộ kinh doanh, chủ tiệm. Dùng cùng loại tài khoản như mọi người mua | Mua ngay hoặc đặt hàng cho doanh nghiệp, so sánh báo giá, duyệt maket, theo dõi đơn, nhận hóa đơn ghi thông tin doanh nghiệp |
| **Người bán có Shop** | Tiệm bánh, thương hiệu, đại lý, xưởng có hàng sẵn | Đăng, sửa, ẩn sản phẩm và tồn kho, khai vùng giao hàng và phí giao nội thành, xử lý đơn mua ngay, nhận đánh giá |
| **Người bán nhận đặt hàng** | Xưởng bánh; đại lý và người bán lại có nguồn hàng lớn | Khai năng lực, số lượng tối thiểu, bậc giá tham khảo và ưu đãi; nhận yêu cầu, báo giá, gửi maket, cập nhật tiến độ, xin giải ngân cọc |
| **Quản trị nền tảng** | Đội vận hành Moonkage | Duyệt người bán (gồm làm việc trực tiếp và nhận thỏa thuận hợp tác với người bán là công ty), khóa người bán hoặc gỡ sản phẩm vi phạm, duyệt giải ngân cọc, duyệt chuyển tiền cho người bán, đặt bảng phí giao liên tỉnh, đặt mức phí đăng ký mở bán, đối soát, xử lý tranh chấp, quản lý voucher hệ thống |

Lưu ý: thương hiệu lớn như Kinh Đô có kênh doanh nghiệp riêng, nhưng nếu muốn bán trên nền tảng thì vẫn tham gia như mọi người bán khác: là công ty nên phải làm việc trực tiếp với nền tảng và ký thỏa thuận hợp tác trước khi được duyệt. Họ (hoặc đại lý chính thức của họ) có thể mở Shop, nhận đặt hàng, hoặc cả hai.

## 7. Tình huống sử dụng tiêu biểu

**Chị Lan, HR công ty phần mềm 90 người ở Quận 7.**
Chị có một tài khoản như mọi người mua khác, và đứng ra mua thay công ty. Ngày 20/7, chị xác minh NFC một lần bằng điện thoại, rồi tạo yêu cầu mở cho công ty: 150 hộp, ngân sách khoảng 250.000đ/hộp, in logo lên túi và thiệp, giao về văn phòng trước 5/9. Chị nhận báo giá từ ba xưởng theo cùng một định dạng, xuất file trình giám đốc, rồi chấp nhận một báo giá và đặt cọc qua cổng thanh toán. Khi chấp nhận báo giá, chị chọn xuất hóa đơn doanh nghiệp và nhập tên, mã số thuế, địa chỉ công ty; thông tin này được ghi vào đơn hàng để xưởng lập hóa đơn. Buổi tối, chị mua hai hộp cho nhà mình bằng chính tài khoản đó, không chọn xuất hóa đơn doanh nghiệp.

**Cô Hoa, chủ xưởng bánh gia đình ở Quận 5.**
Xưởng của cô là một hộ kinh doanh, làm được khoảng 3.000 hộp mỗi mùa và nhận in sticker logo. Cô xác minh NFC rồi khai hồ sơ người bán, nhập họ tên và số định danh của chủ hộ đúng như trên giấy chứng nhận đăng ký hộ kinh doanh. Vì cô chính là chủ hộ, số định danh trùng với số CCCD vừa được ghi nhận khi cô xác minh và hồ sơ được nộp; quản trị đối chiếu với file giấy chứng nhận rồi duyệt. Cô không muốn xử lý từng đơn 1-5 hộp nên không mở Shop, chỉ nhận đặt hàng với số lượng tối thiểu 50 hộp. Từ tháng 6, cô khai hồ sơ sản xuất, bậc giá tham khảo và ưu đãi đặt sớm. Cô nhận các yêu cầu phù hợp năng lực, đối chiếu với lịch công suất các tuần rồi mới báo giá, nên không nhận quá số lượng xưởng làm được.

**Anh Minh, nhân viên văn phòng.**
Anh muốn mua vài hộp bánh Trung thu nhưng chưa biết chọn tiệm nào. Thay vì vào từng trang riêng, anh xem bánh của nhiều Shop trên cùng một nơi, so sánh giá và bao bì, rồi mua ngay và thanh toán trên nền tảng. Anh không cần xác minh NFC để mua ngay.

**Chị Thảo, chủ tiệm quà nhỏ ở Quận 10.**
Tiệm của chị là một hộ kinh doanh. Chị cần khoảng 80 hộp bánh tiêu chuẩn để bán lại trong tiệm, nên xác minh NFC rồi gửi yêu cầu trực tiếp đến xưởng cô Hoa, nhận báo giá xác nhận xưởng đáp ứng đủ số lượng, rồi đặt cọc. Chị chọn xuất hóa đơn doanh nghiệp và nhập tên cùng mã số thuế của hộ. Giữa mùa hàng bán chạy, chị cần gấp thêm 15 hộp. Xưởng cô Hoa báo phải chờ hai tuần, nên chị mua ngay từ Shop của một đại lý đang còn hàng, chấp nhận giá cao hơn để kịp bán. Sau đó chị khai hồ sơ người bán (tài khoản đã xác minh NFC từ trước nên không phải làm lại; chị là chủ hộ nên số định danh trên giấy chứng nhận trùng với số CCCD đã ghi nhận), được duyệt, và mở Shop trên nền tảng bằng chính tài khoản đó.

**Anh Quân, chủ tiệm bánh ở Quận 3.**
Tiệm anh trước đây chỉ bán qua Facebook và Zalo. Anh mở Shop, đăng sản phẩm, giá niêm yết và tồn kho. Một khách cần 40 hộp trong khi kho chỉ còn 25. Khách gửi yêu cầu đặt hàng; anh kiểm tra làm thêm kịp không rồi báo giá kèm ngày giao.

**Bạn Vy, cộng tác viên bán hàng qua Facebook.**
Vy không có đăng ký kinh doanh. Bạn gom được 60 hộp từ người quen, xác minh NFC bằng điện thoại rồi gửi yêu cầu đến một xưởng. Vì đạt số lượng tối thiểu và chấp nhận đặt cọc, bạn được báo giá như mọi người mua khác. Hóa đơn không ghi thông tin doanh nghiệp. Vy không mở được Shop cho đến khi có đăng ký kinh doanh.

## 8. Phạm vi

Các giới hạn dưới đây là ranh giới kinh doanh của nền tảng, không phải sự giản lược của dự án (giản lược của dự án ở mục 9):

- Không giới hạn một địa phương, nhưng chỉ bán sản phẩm giao được đến địa chỉ của người mua theo vùng giao hàng người bán đã khai báo (mục 4, Giao hàng).
- **Không** có công cụ thiết kế hộp 3D. Custom giới hạn ở in logo lên túi, thiệp, sticker, và hộp theo mẫu có sẵn của người bán.
- Nền tảng **không** tự sản xuất bánh, **không** tự bán bánh, **không** tự nhập hàng và giữ kho. Nền tảng là marketplace kết nối người bán với người mua.
- Mua ngay chỉ áp dụng cho sản phẩm **đang đăng bán và còn tồn kho**. Mọi nhu cầu vượt tồn kho, phải sản xuất hoặc có custom đều đi qua báo giá.
- Kênh đặt hàng mở cho mọi người mua đã **xác minh NFC**. Điều kiện còn lại là **số lượng tối thiểu và tiền cọc** do người bán đặt, không phải loại người mua.
- **Không** có tài khoản doanh nghiệp và **không** lưu hồ sơ doanh nghiệp mua hàng. Doanh nghiệp mua thông qua một người đại diện dùng tài khoản thông thường; thông tin doanh nghiệp chỉ xuất hiện trên đơn hàng để xuất hóa đơn. Không có vai trò, hạn mức duyệt hay màn hình chung của công ty.
- Người bán phải là **đơn vị có đăng ký kinh doanh** (hộ kinh doanh, doanh nghiệp tư nhân hoặc công ty), do một tài khoản **đã xác minh NFC** làm chủ, và chỉ tham gia sau khi được nền tảng **duyệt**. Với hộ kinh doanh và doanh nghiệp tư nhân, chủ tài khoản phải là **chính chủ**; với công ty, phải có **thỏa thuận hợp tác** do người đại diện theo pháp luật ký. Cá nhân không bán được, và đây không phải chợ mở cho mọi người đăng bán.
- **Không** có tài khoản nhân viên bán hàng. Mỗi người bán chỉ được thao tác bằng tài khoản của chủ.
- **Không** ký hợp đồng trong hệ thống. Thỏa thuận hợp tác với công ty được ký ngoài nền tảng; hệ thống chỉ lưu file và bản ghi buổi làm việc.

## 9. Ràng buộc bên ngoài

Các ràng buộc dưới đây do thị trường, pháp luật hoặc điều kiện của dự án đặt ra, không do nhóm tự chọn.
### Pháp luật

- Bán thực phẩm đòi hỏi đăng ký kinh doanh, điều kiện an toàn thực phẩm và lập hóa đơn, nên chỉ đơn vị có đăng ký kinh doanh được bán (mục 4).
- Lần bán nào cũng chịu thuế giá trị gia tăng và có hóa đơn do người bán lập (mục 3).
- Hộ kinh doanh và doanh nghiệp tư nhân không có tư cách pháp nhân; công ty là pháp nhân. Điều này quyết định cách xác minh người bán (mục 3, mục 5).
- Họ tên, số CCCD, số định danh, giấy tờ pháp lý và tài khoản ngân hàng là dữ liệu cá nhân. Pháp luật về bảo vệ dữ liệu cá nhân buộc nền tảng chỉ thu thập phần cần dùng, bảo vệ dữ liệu đó và không để lộ ra ngoài người có quyền xem. Số định danh, ngày sinh và nơi thường trú là những thông tin cần giữ kín nhất, cả khi truyền đi và khi lưu.

### Điều kiện của dự án

Đây là dự án môn Microservices (FPT University). Các điều dưới đây khác với khi vận hành thật:

- **Kiến trúc và công nghệ bắt buộc:** kiến trúc microservices, backend Java Spring Boot, đóng gói và chạy bằng Docker. Các lựa chọn công nghệ còn lại do nhóm quyết định và không thuộc tài liệu này.
- **Không có tiền thật:** thanh toán dùng môi trường thử nghiệm của cổng thanh toán. "Nền tảng giữ tiền" chỉ là sổ ghi trên hệ thống, không có tài khoản ký quỹ thật. Giải ngân cọc và chuyển tiền cho người bán chỉ được ghi nhận, không chuyển khoản thật.
- **Không đọc chip CCCD thật:** chip CCCD được mô phỏng bằng thẻ NFC chỉ chứa thông tin mô phỏng, không có chữ ký số. Vì vậy nền tảng không chứng minh được thẻ là thật; ai có công cụ ghi NFC cũng tự tạo được thẻ. Trong dự án, xác minh NFC chỉ ghi nhận số CCCD gắn với tài khoản, không chứng minh danh tính thật. Chỉ dùng dữ liệu CCCD mẫu. Như CCCD thật, thẻ mô phỏng có trước và nằm ngoài nền tảng: người dùng tự có thẻ, nền tảng không cấp thẻ. Khi vận hành thật cần đọc chip CCCD có chữ ký của cơ quan cấp.
- **Không kết nối hệ thống nhà nước:** không kết nối hệ thống định danh quốc gia và Cổng thông tin quốc gia về đăng ký doanh nghiệp, không đọc tự động file giấy chứng nhận. Quản trị tra cứu và đối chiếu thủ công. Khi vận hành thật nên cân nhắc xác minh tổ chức bằng chữ ký số của tổ chức hoặc tài khoản định danh điện tử của tổ chức.
- **Không có kênh SMS:** tài khoản chỉ đăng ký và xác nhận qua email.
- **Không lấy giá từ hãng vận chuyển:** phí giao liên tỉnh lấy từ bảng phí theo tỉnh do nền tảng đặt, không theo cân nặng hay giá thật của hãng vận chuyển. Khi vận hành thật nên lấy giá trực tiếp từ hãng vận chuyển.
- **Không tính hoa hồng giao dịch:** do giới hạn phạm vi, nền tảng chỉ thu phí đăng ký mở bán (mục 4), không thu hoa hồng trên từng đơn.
- **Không mô hình hóa mùa vụ:** thị trường vẫn theo mùa như mô tả ở mục 1 đến 3, nhưng do giới hạn của dự án môn học, nền tảng xử lý mọi thời điểm như nhau: không có hạn chót của mùa, không xử lý riêng cho cao điểm 6 đến 8 tuần trước rằm, không điều tiết hay dàn đều đơn theo thời điểm. Ngày giao do người mua và người bán thỏa thuận trong báo giá. Vì vậy vấn đề đơn dồn vào sát rằm của xưởng (mục 2) không được giải quyết trong dự án.

## 10. Thước đo thành công

Nền tảng thành công khi giải được các vấn đề ở mục 2:

| Bên                 | Thành công nghĩa là                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| Doanh nghiệp        | So sánh và chốt báo giá custom ở một nơi, nhận nhiều báo giá cùng định dạng, không phải nhắn từng xưởng |
| Xưởng sản xuất      | Có đơn số lượng lớn từ doanh nghiệp và hộ kinh doanh                                                    |
| Người mua phổ thông | Mua được từ nhiều Shop                                                                                  |
| Hộ kinh doanh       | Tìm được nguồn sỉ và nhập lại được nhiều đợt                                                            |
| Tiệm bánh nhỏ       | Có kênh bán online và có đơn hoàn tất trên nền tảng                                                     |
| Cả hai bên          | Giao dịch an toàn: ít đơn bị khiếu nại, khiếu nại được xử lý trong thời hạn                             |

Chỉ tiêu bằng số cho từng dòng: chưa quyết (mục 11).

## 11. Câu hỏi nghiệp vụ còn mở

Tài liệu này chỉ nêu câu hỏi. Câu trả lời tạm và trạng thái từng câu được theo dõi ở tài liệu yêu cầu.

- Người mua hủy sau khi đã cọc, hoặc người bán không giao được: ai mất gì? Hoàn tiền thế nào khi cọc đã giải ngân một phần?
- Người mua không thanh toán phần còn lại sau khi hàng đã giao thì xử lý thế nào?
- Đơn mua ngay nội thành có được thanh toán khi nhận hàng không?
- Người bán sửa hồ sơ pháp lý hoặc tài khoản ngân hàng sau khi đã duyệt có phải duyệt lại không?
- Chuyển quyền làm chủ người bán khi chủ rời đi (với công ty) xử lý thế nào?
- Thỏa thuận hợp tác với công ty ký tay kèm con dấu hay chữ ký số? Mẫu thỏa thuận gồm những gì? Ai phía nền tảng được làm việc và ký?
- Thời hạn khiếu nại và thời gian giữ tiền cho đơn nội thành, liên tỉnh, đơn đặt hàng?
- Tiêu chuẩn đóng gói tối thiểu cho nhãn "giao toàn quốc" là gì, ai xác nhận?
- Đơn vị vùng giao hàng: tỉnh/thành, quận/huyện hay phường/xã?
- Quy tắc chênh lệch giá sỉ/lẻ: mức bao nhiêu, chặn hay chỉ cảnh báo?
- Voucher hệ thống giảm giá cho đơn mua ngay: phần giảm do nền tảng hay người bán chịu?
- Chỉ tiêu thành công bằng số, deadline và ngân sách?

## 12. Thuật ngữ

| Thuật ngữ | Nghĩa |
| --- | --- |
| Hộ kinh doanh | Đơn vị kinh doanh gắn với chủ hộ, không có tư cách pháp nhân; chủ hộ chịu trách nhiệm bằng toàn bộ tài sản của mình |
| Doanh nghiệp tư nhân | Doanh nghiệp do một cá nhân làm chủ, không có tư cách pháp nhân; chủ chịu trách nhiệm bằng toàn bộ tài sản của mình |
| Công ty | Công ty TNHH, cổ phần, hợp danh; có tư cách pháp nhân, tồn tại độc lập với con người |
| Tư cách pháp nhân | Tư cách của tổ chức tồn tại độc lập với con người, có tài sản riêng và chịu trách nhiệm bằng tài sản đó |
| Người đại diện theo pháp luật | Cá nhân nhân danh công ty trong giao dịch, ghi trên giấy chứng nhận đăng ký doanh nghiệp |
| Số định danh cá nhân | Số CCCD 12 chữ số, ghi trên giấy chứng nhận đăng ký cho chủ hộ, chủ doanh nghiệp tư nhân hoặc người đại diện |
| Thỏa thuận hợp tác | Văn bản giữa công ty bán hàng và Moonkage, do người đại diện theo pháp luật ký, ghi rõ tài khoản làm chủ người bán |
| Guest / Member | Người dùng chưa đăng nhập / đã đăng nhập bằng một tài khoản (mục 5) |
| Người bán | Đơn vị có đăng ký kinh doanh đã được nền tảng duyệt, do một tài khoản làm chủ |
| Đơn vị cung cấp | Cách gọi người bán ở phía người mua |
| Nguồn hàng | Người bán tự sản xuất, bán lại, hoặc cả hai |
| Shop | Cách bán hàng có sẵn với giá niêm yết và tồn kho; phục vụ mua ngay |
| Nhận đặt hàng | Cách bán qua yêu cầu và báo giá; phục vụ đặt hàng |
| Mua ngay | Mua hàng đang đăng bán trong giới hạn tồn kho, theo giá niêm yết, thanh toán ngay |
| Đặt hàng | Giao dịch qua yêu cầu và báo giá; chốt khi người mua chấp nhận báo giá và đặt cọc |
| Yêu cầu trực tiếp / yêu cầu mở | Yêu cầu gửi cho riêng một người bán / yêu cầu mô tả nhu cầu để nền tảng mời nhiều người bán phù hợp cùng báo giá |
| Báo giá | Xác nhận của người bán rằng đáp ứng được, gồm đơn giá, tổng tiền, tỷ lệ cọc, ngày giao, thời hạn hiệu lực; ràng buộc khi được chấp nhận |
| Bậc giá tham khảo | Giá theo số lượng công khai ở hồ sơ nhận đặt hàng; không ràng buộc |
| Giá theo số lượng | Bậc giá của sản phẩm trong Shop, áp dụng khi mua ngay |
| Ngưỡng báo giá | Số lượng mà từ đó trở lên người mua phải gửi yêu cầu thay vì mua ngay |
| Số lượng tối thiểu | Số lượng nhỏ nhất người bán nhận cho một yêu cầu đặt hàng |
| Custom | In logo lên túi, thiệp, sticker, hộp theo mẫu có sẵn của người bán |
| Maket | Bản thiết kế người bán gửi để người mua duyệt trước khi sản xuất |
| Tiền cọc | Phần thanh toán đầu của đơn đặt hàng, theo tỷ lệ trong báo giá, do nền tảng giữ |
| Giải ngân | Nền tảng chuyển một phần tiền cọc đang giữ cho người bán trước khi giao |
| Giữ tiền | Nền tảng giữ tiền người mua trả cho đến khi đủ điều kiện chuyển cho người bán |
| Phí đăng ký mở bán | Khoản mọi người bán đóng cho nền tảng một lần sau khi hồ sơ được duyệt để bắt đầu kinh doanh; mức do nền tảng đặt (hiện 200.000đ); là nguồn thu của nền tảng |
| Đối soát | Bảng tiền theo đơn: tổng tiền, đang giữ, đã giải ngân, đã hoàn, sẽ nhận |
| Xuất hóa đơn doanh nghiệp | Lựa chọn ở từng đơn để hóa đơn ghi tên đơn vị, mã số thuế, địa chỉ, email; là dữ liệu của đơn |
| Vùng giao hàng | Các khu vực người bán khai giao được |
| Phí giao | Khoản người mua trả cho việc giao một đơn: trong vùng giao của người bán thì theo mức người bán khai; ngoài vùng thì theo bảng phí liên tỉnh; đơn đặt hàng thì theo báo giá |
| Giao nội thành / giao toàn quốc | Nhãn giao của sản phẩm trong Shop; "toàn quốc" chỉ cho sản phẩm đạt tiêu chuẩn đóng gói |
| Xác minh NFC | Ghi nhận họ tên, giới tính, ngày sinh, quốc tịch và số định danh của chủ tài khoản bằng cách đọc chip CCCD qua điện thoại có NFC, sau khi người dùng tự kiểm và đồng ý |
| Tự giao dịch | Tài khoản mua chính là tài khoản chủ của người bán; bị cấm |

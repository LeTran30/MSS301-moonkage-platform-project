import { routes } from '@/shared/config';
import type { SitemapPageNode } from './sitemapTypes';

/**
 * Tất cả màn hình của 4 khu vực (Zone M, B, Q, V) theo bản đồ thông tin (IA).
 *
 * Danh sách bám đủ 73 mã trang của IA. Hai mã được đặc tả hoãn cho bản demo
 * (`requirements.md` mục 4.3) vẫn có mặt ở đây (`deferred: true`) để bản đồ
 * không thiếu mã: B6.4 (lịch công suất) và Q6.3 (voucher).
 */
export const ALL_PAGES: SitemapPageNode[] = [
  // Zone M
  { code: 'M1.0', name: 'Trang chủ Moonkage', route: routes.base.home, desc: 'Banner Trung Thu, danh mục theo vỏ/nhân, xưởng cổ truyền, hub B2B', zone: 'M', frList: ['FR-05', 'FR-06'] },
  { code: 'M1.1', name: 'Chọn khu vực giao (hộp thoại)', route: routes.base.home, desc: 'Hộp thoại chọn tỉnh/thành giao hàng, quyết định danh mục và xưởng hiện ra', zone: 'M' },
  { code: 'M2.0', name: 'Danh mục sản phẩm', route: routes.base.catalog, desc: 'Bộ lọc đa diện Vỏ bánh & Nhân bánh (FR-06), giá, xưởng', zone: 'M', frList: ['FR-06'] },
  { code: 'M2.1', name: 'Chi tiết sản phẩm', route: `${routes.base.catalog}/banh-nuong-thap-cam-lap-xuong-ga-quay`, desc: 'Xem chi tiết, cảnh báo ngưỡng mua sỉ, chặn chủ xưởng mua (BR-22)', zone: 'M', brList: ['BR-22', 'BR-01'] },
  { code: 'M3.0', name: 'Hub Đặt hàng Doanh nghiệp', route: routes.base.bulk, desc: 'Giới thiệu 2 luồng đặt hàng: Đăng yêu cầu mở & Chọn xưởng chỉ định', zone: 'M', frList: ['FR-15'] },
  { code: 'M3.1', name: 'Tạo yêu cầu báo giá mở (Flow 2)', route: routes.base.quoteRequestNew, desc: 'Nhập số lượng, ngân sách, logo, kiểm tra điều kiện NFC CCCD', zone: 'M', frList: ['FR-16'], brList: ['BR-11'] },
  { code: 'M3.2', name: 'Danh sách nghệ nhân & xưởng bánh (Flow 3)', route: routes.base.vendors, desc: 'Xem danh sách xưởng thủ công, bộ lọc công suất và chứng nhận', zone: 'M', frList: ['FR-14'] },
  { code: 'M3.3', name: 'Trang thông tin xưởng bánh', route: `${routes.base.vendors}/v-dong-phuong`, desc: '2 tab: Bánh sẵn tại quầy & Điều kiện nhận đơn đặt theo hợp đồng', zone: 'M', brList: ['BR-21'] },
  { code: 'M3.4', name: 'Gửi yêu cầu chỉ định riêng (Flow 3)', route: `${routes.base.vendors}/v-dong-phuong/yeu-cau-bao-gia`, desc: 'Gửi riêng cho xưởng đã chọn, kiểm tra chủ shop không tự gửi (BR-22)', zone: 'M', brList: ['BR-22'] },
  { code: 'M4.0', name: 'Giỏ hàng đa xưởng', route: routes.base.cart, desc: 'Tách đơn theo từng shop (FR-08), cảnh báo ngưỡng mua sỉ nếu số lượng lớn', zone: 'M', frList: ['FR-08'], brList: ['BR-25'] },
  { code: 'M4.1', name: 'Thanh toán & Hóa đơn VAT', route: routes.base.checkout, desc: 'Nhập thông tin xuất hóa đơn VAT doanh nghiệp chung 1 lần (FR-24)', zone: 'M', frList: ['FR-09', 'FR-24'] },
  { code: 'M4.2', name: 'Cổng thanh toán VNPAY', route: routes.base.checkout, desc: 'Trang của VNPay, mở bằng link máy chủ trả về khi thanh toán bán lẻ, cọc, phần còn lại; VNPay đưa người mua về M4.3', zone: 'M', frList: ['FR-10'] },
  { code: 'M4.3', name: 'Kết quả thanh toán đơn hàng', route: routes.base.paymentResult, desc: 'Thông báo xác nhận thanh toán, tách đơn hàng độc lập (BR-25)', zone: 'M', brList: ['BR-25'] },
  { code: 'M5.1', name: 'Đăng nhập tài khoản', route: routes.auth.login, desc: 'Đăng nhập SĐT hoặc chuyển nhanh 6 Persona theo tài liệu IA', zone: 'M' },
  { code: 'M5.2', name: 'Đăng ký tài khoản', route: routes.auth.register, desc: 'Tạo tài khoản người mua cá nhân / doanh nghiệp mới', zone: 'M' },
  { code: 'M5.3', name: 'Xác nhận tài khoản', route: routes.auth.registerConfirm, desc: 'Nhập mã OTP để kích hoạt tài khoản vừa đăng ký', zone: 'M' },
  { code: 'M5.4', name: 'Quên mật khẩu', route: routes.auth.forgotPassword, desc: 'Gửi mã xác thực để đặt lại mật khẩu qua SĐT hoặc e-mail', zone: 'M' },
  { code: 'M5.5', name: 'Đặt lại mật khẩu', route: routes.auth.resetPassword, desc: 'Đặt mật khẩu mới bằng mã xác thực đã nhận', zone: 'M' },
  { code: 'M6.0', name: 'Tổng quan tài khoản', route: routes.account.overview, desc: 'Khối "Việc cần bạn xử lý": duyệt maket, thanh toán cọc, khiếu nại', zone: 'M' },
  { code: 'M6.1', name: 'Lịch sử đơn hàng', route: routes.account.orders, desc: 'Tab Đơn lẻ shop & Đơn đặt hàng sản xuất doanh nghiệp', zone: 'M', frList: ['FR-27'] },
  { code: 'M6.1.1', name: 'Chi tiết đơn bán lẻ', route: `${routes.account.orders}/ORD-2026-081`, desc: 'Xem hành trình giao hàng, hóa đơn VAT và tạo khiếu nại trong 48h', zone: 'M', frList: ['FR-27'] },
  { code: 'M6.1.2', name: 'Tiến độ đơn Bulk & Duyệt Maket (Flow 2)', route: `${routes.account.orders}/ORD-2026-083`, desc: 'Quy trình 5 mốc tiến độ, xem và duyệt Maket thiết kế, mở khóa cọc', zone: 'M', frList: ['FR-28', 'FR-44'] },
  { code: 'M6.1.3', name: 'Khiếu nại đơn hàng (Flow 5)', route: `${routes.account.orders}/ORD-2026-082/khieu-nai`, desc: 'Tạo yêu cầu bồi hoàn, đính kèm ảnh, theo dõi giữ tiền Escrow (FR-49)', zone: 'M', frList: ['FR-49'] },
  { code: 'M6.2', name: 'Quản lý yêu cầu báo giá B2B', route: routes.account.requests, desc: 'Danh sách các yêu cầu mở và yêu cầu chỉ định đã gửi', zone: 'M', frList: ['FR-18'] },
  { code: 'M6.2.1', name: 'So sánh báo giá & Đặt Cọc (Flow 2)', route: `${routes.account.requests}/REQ-2026-001/so-sanh`, desc: 'So sánh song song các xưởng (đơn giá, cọc %, tiến độ) và chốt cọc', zone: 'M', frList: ['FR-19', 'FR-20'] },
  { code: 'M6.2.2', name: 'Chấp nhận báo giá & Đặt cọc', route: `${routes.account.requests}/REQ-2026-001/dat-coc`, desc: 'Chốt xưởng, đặt cọc qua VNPAY và theo dõi kỳ cọc của đơn đặt hàng', zone: 'M', frList: ['FR-20', 'FR-21'] },
  { code: 'M6.3', name: 'Sổ địa chỉ nhận hàng', route: routes.account.addresses, desc: 'Lưu nhiều địa chỉ kho/văn phòng nhận bánh trung thu', zone: 'M' },
  { code: 'M6.3.1', name: 'Thêm / Sửa địa chỉ', route: routes.account.addressNew, desc: 'Sổ địa chỉ có nhiều người nhận, địa chỉ kho và địa chỉ văn phòng', zone: 'M' },
  { code: 'M6.3.2', name: 'Xóa địa chỉ (hộp thoại)', route: routes.account.addresses, desc: 'Hộp thoại xác nhận xóa; các đơn đã tạo trước đó không bị ảnh hưởng', zone: 'M' },
  { code: 'M6.4', name: 'Xác thực sinh trắc học NFC CCCD', route: routes.account.verify, desc: 'Mô phỏng app điện thoại V1-V5 đọc chip NFC thẻ CCCD (Flow 6)', zone: 'M', frList: ['FR-04'] },
  { code: 'M6.5', name: 'Hồ sơ người dùng', route: routes.account.profile, desc: 'Che mờ thông tin nhạy cảm số CCCD, SĐT (FR-04)', zone: 'M' },
  { code: 'M6.6', name: 'Trung tâm thông báo', route: routes.base.notifications, desc: 'Thông báo đẩy tiến độ đơn, maket, khiếu nại, sự kiện — dùng chung cho người mua và chủ người bán', zone: 'M' },
  { code: 'M7.0', name: 'Giới thiệu kênh người bán', route: routes.base.sellIntro, desc: 'Lợi ích bán hàng trên Moonkage, tiếp cận khách doanh nghiệp', zone: 'M' },
  { code: 'M7.1', name: 'Đăng ký gian hàng mới (Flow 4)', route: routes.base.sellRegister, desc: 'Hồ sơ pháp lý Hộ KD/DNTN (BR-33), xác thực CCCD, thanh toán mở bán', zone: 'M', brList: ['BR-33'], frList: ['FR-31'] },
  { code: 'M8.0', name: 'Chính sách sàn Moonkage', route: routes.base.policy, desc: 'Cơ chế Escrow, quy định khiếu nại 48h, quy tắc hoàn tiền tối đa', zone: 'M', frList: ['FR-49'] },

  // Zone B
  { code: 'B1.0', name: 'Tổng quan Kênh Người Bán', route: routes.vendor.overview, desc: 'Bảng điều khiển kinh doanh, số liệu đơn, việc cần xử lý ngay', zone: 'B' },
  { code: 'B1.1', name: 'Cổng đóng phí mở bán gian hàng', route: `${routes.vendor.overview}#fee`, desc: 'Cổng thanh toán 500.000 đ kích hoạt gian hàng qua VNPAY (Q6.2)', zone: 'B' },
  { code: 'B2.0', name: 'Quản lý đơn hàng xưởng', route: routes.vendor.orders, desc: 'Lọc đơn bán lẻ, đơn đặt hàng B2B, đơn đang bị khiếu nại tạm khóa tiền', zone: 'B', frList: ['FR-35'] },
  { code: 'B2.1', name: 'Tải lên Maket thiết kế (B2.1)', route: routes.vendor.orders, desc: 'Tải ảnh thiết kế hộp quà, logo dập nổi gửi khách hàng ký duyệt', zone: 'B', frList: ['FR-36'] },
  { code: 'B2.2', name: 'Gắn hóa đơn VAT điện tử (FR-24)', route: routes.vendor.orders, desc: 'Đính kèm số hóa đơn và file tra cứu hóa đơn VAT cho khách', zone: 'B', frList: ['FR-24'] },
  { code: 'B3.0', name: 'Danh sách yêu cầu báo giá', route: routes.vendor.requests, desc: 'Xem các yêu cầu mở toàn sàn và yêu cầu chỉ định riêng cho xưởng', zone: 'B', frList: ['FR-37'] },
  { code: 'B3.1', name: 'Chi tiết yêu cầu', route: `${routes.vendor.requests}/REQ-2026-001`, desc: 'Yêu cầu của doanh nghiệp: số lượng, ngân sách, yêu cầu logo và hạn gửi báo giá', zone: 'B', frList: ['FR-37'] },
  { code: 'B3.2', name: 'Soạn báo giá & Tỷ lệ cọc', route: `${routes.vendor.requests}/REQ-2026-001/bao-gia`, desc: 'Gửi đơn giá theo bậc, cấu hình % cọc sản xuất, thời gian bàn giao', zone: 'B', frList: ['FR-38'] },
  { code: 'B4.0', name: 'Quản lý sản phẩm gian hàng', route: routes.vendor.products, desc: 'Danh sách bánh trung thu, bật/tắt hiển thị, không cho xóa vĩnh viễn', zone: 'B', frList: ['FR-39'] },
  { code: 'B4.1', name: 'Thêm & Sửa sản phẩm (FR-54)', route: routes.vendor.products, desc: 'Bắt buộc chọn ít nhất 1 Vỏ và 1 Nhân theo danh mục chuẩn (BR-34)', zone: 'B', frList: ['FR-54'], brList: ['BR-34'] },
  { code: 'B5.0', name: 'Tiền của xưởng', route: routes.vendor.money, desc: 'Số tiền Moonkage giữ, số tiền chờ chuyển và số tiền đã nhận', zone: 'B', frList: ['FR-40'] },
  { code: 'B5.1', name: 'Đối soát doanh thu bán lẻ', route: routes.vendor.reconciliation, desc: 'Đối soát doanh thu hàng tuần, khấu trừ 5% phí nền tảng', zone: 'B', frList: ['FR-40'] },
  { code: 'B5.2', name: 'Giải ngân cọc sản xuất & Quỹ Escrow', route: routes.vendor.disbursements, desc: 'Theo dõi cọc được giải ngân khi duyệt Maket, số dư bị khóa khiếu nại', zone: 'B', frList: ['FR-41'] },
  { code: 'B6.0', name: 'Cài đặt bán hàng', route: routes.vendor.settings, desc: 'Hub cài đặt gian hàng: pháp lý, vùng giao, điều kiện nhận đặt hàng', zone: 'B' },
  { code: 'B6.1', name: 'Hồ sơ pháp lý Hộ KD / DNTN (BR-33)', route: routes.vendor.legal, desc: 'Thông tin ĐKKD, MST, người đại diện đối chiếu CCCD chip', zone: 'B', brList: ['BR-33'] },
  { code: 'B6.2', name: 'Cấu hình vùng giao hàng', route: routes.vendor.zones, desc: 'Cài đặt phạm vi giao nội tỉnh, miền Bắc, toàn quốc & freeship', zone: 'B' },
  { code: 'B6.3', name: 'Điều kiện nhận đơn đặt hàng (BR-21)', route: routes.vendor.bulkTerms, desc: 'Cài đặt số lượng tối thiểu (MOQ), thời gian chuẩn bị, chế độ bán (BR-21)', zone: 'B', brList: ['BR-21'] },
  { code: 'B6.4', name: 'Lịch công suất', route: routes.vendor.capacity, desc: 'Số hộp xưởng nhận được mỗi tuần — FR-37 hoãn trong bản demo', zone: 'B', frList: ['FR-37'], deferred: true },

  // Zone Q
  { code: 'Q1.0', name: 'Bàn làm việc Quản trị viên', route: routes.admin.overview, desc: 'Giám sát 4 hàng đợi: khiếu nại, duyệt xưởng, duyệt sản phẩm, giải ngân cọc', zone: 'Q' },
  { code: 'Q2.0', name: 'Quản lý danh sách người bán', route: routes.admin.vendors, desc: 'Tra cứu xưởng bánh, đối chiếu giấy tờ pháp lý Hộ KD/DNTN (BR-33)', zone: 'Q', frList: ['FR-45'] },
  { code: 'Q2.1', name: 'Thẩm định hồ sơ & Duyệt mở bán', route: routes.admin.vendors, desc: 'Kiểm tra CCCD đọc từ NFC, phê duyệt hoặc từ chối kèm lý do', zone: 'Q', frList: ['FR-46'] },
  { code: 'Q3.0', name: 'Kiểm duyệt & Gỡ sản phẩm vi phạm', route: routes.admin.products, desc: 'Giám sát bánh niêm yết, kiểm tra tuân thủ FR-54, gỡ bỏ kèm lý do', zone: 'Q', frList: ['FR-47'] },
  { code: 'Q4.0', name: 'Tiền của sàn', route: routes.admin.money, desc: 'Tổng quan dòng tiền: duyệt giải ngân, chuyển tiền, chu kỳ đối soát', zone: 'Q' },
  { code: 'Q4.1', name: 'Phê duyệt giải ngân tiền cọc', route: routes.admin.disbursements, desc: 'Duyệt chi trả cọc đợt 1 cho xưởng sau khi khách ký Maket', zone: 'Q', frList: ['FR-48'] },
  { code: 'Q4.2', name: 'Chuyển tiền cho người bán', route: routes.admin.payouts, desc: 'Lịch sử chuyển tiền và ủy nhiệm chi tới tài khoản xưởng', zone: 'Q', frList: ['FR-49'] },
  { code: 'Q4.3', name: 'Đối soát định kỳ toàn sàn', route: routes.admin.reconciliation, desc: 'Quản lý chu kỳ thứ Hai hàng tuần, quyết toán phí sàn 5%', zone: 'Q' },
  { code: 'Q5.0', name: 'Danh sách tranh chấp & Khiếu nại', route: routes.admin.disputes, desc: 'Tiếp nhận các vụ việc tranh chấp giữa người mua và xưởng sản xuất', zone: 'Q', frList: ['FR-50'] },
  { code: 'Q5.1', name: 'Phán quyết tranh chấp (Flow 5)', route: `${routes.admin.disputes}/DSP-2026-001`, desc: 'Hoàn toàn bộ, hoàn một phần hoặc bác khiếu nại. Áp trần Escrow AC-49.3', zone: 'Q', frList: ['FR-51'] },
  { code: 'Q6.0', name: 'Cấu hình sàn', route: routes.admin.config, desc: 'Hub cấu hình: danh mục Vỏ & Nhân, biểu phí liên tỉnh, phí mở bán, voucher', zone: 'Q' },
  { code: 'Q6.1', name: 'Cấu hình biểu phí ship liên tỉnh', route: routes.admin.interprovinceFee, desc: 'Cước phí vận chuyển liên tỉnh cơ bản và mức trợ giá của sàn', zone: 'Q', frList: ['FR-52'] },
  { code: 'Q6.2', name: 'Cấu hình phí mở bán gian hàng', route: routes.admin.openingFee, desc: 'Thiết lập mức phí 500.000 đ kích hoạt mở bán một lần', zone: 'Q', frList: ['FR-53'] },
  { code: 'Q6.3', name: 'Voucher hệ thống', route: routes.admin.vouchers, desc: 'Tạo mã giảm giá cho đơn mua lẻ — FR-13 & FR-50 hoãn trong bản demo', zone: 'Q', frList: ['FR-13', 'FR-50'], deferred: true },
  { code: 'Q6.4', name: 'Quản lý danh mục Vỏ & Nhân (FR-54)', route: routes.admin.cakeCatalog, desc: 'Khởi tạo và quản lý taxonomy chuẩn Vỏ bánh & Nhân bánh toàn sàn', zone: 'Q', frList: ['FR-54'], brList: ['BR-34'] },

  // Zone V
  { code: 'V1.0', name: 'Màn hình giới thiệu NFC CCCD', route: routes.account.verify, desc: 'Hướng dẫn chuẩn bị thẻ CCCD gắn chip vật lý', zone: 'V', frList: ['FR-04'] },
  { code: 'V2.0', name: 'Hướng dẫn áp thẻ vào điện thoại', route: routes.account.verify, desc: 'Mô phỏng vị trí ăng-ten NFC ở mặt lưng điện thoại', zone: 'V', frList: ['FR-04'] },
  { code: 'V3.0', name: 'Mô phỏng quét chip NFC thời gian thực', route: routes.account.verify, desc: 'Hiệu ứng sóng vô tuyến và tiến trình đọc dữ liệu bảo mật', zone: 'V', frList: ['FR-04'] },
  { code: 'V4.0', name: 'Hiển thị dữ liệu trích xuất từ Chip', route: routes.account.verify, desc: 'Trích xuất số CCCD, họ tên, ngày sinh, quê quán từ chip', zone: 'V', frList: ['FR-04'] },
  { code: 'V5.0', name: 'Xác thực thành công & Đồng bộ Web', route: routes.account.verify, desc: 'Cập nhật trạng thái Verified vào tài khoản, mở khóa tính năng B2B & Người bán', zone: 'V', frList: ['FR-04'] },
];

/** Nhãn hiển thị của từng khu vực trong ma trận trang. */
export const ZONE_LABELS: Record<SitemapPageNode['zone'], string> = {
  M: 'Khách mua',
  B: 'Kênh Người Bán',
  Q: 'Quản trị Admin',
  V: 'App NFC CCCD',
};

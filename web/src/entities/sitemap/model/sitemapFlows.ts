import { routes } from '@/shared/config';
import type { SitemapFlow } from './sitemapTypes';

/** 7 luồng người dùng chính (F1 - F7). */
export const FLOWS: SitemapFlow[] = [
  {
    id: 'F1',
    name: 'Flow 1: Mua lẻ bánh sẵn & Tách đơn theo Shop (BR-25)',
    steps: [
      { code: 'M1.0', title: 'Trang chủ', link: routes.base.home },
      { code: 'M2.0', title: 'Lọc danh mục vỏ/nhân (FR-06)', link: routes.base.catalog },
      { code: 'M2.1', title: 'Chi tiết sản phẩm & Thêm giỏ', link: `${routes.base.catalog}/banh-nuong-thap-cam-lap-xuong-ga-quay` },
      { code: 'M4.0', title: 'Giỏ hàng tách đơn theo Shop (FR-08)', link: routes.base.cart },
      { code: 'M4.1', title: 'Thanh toán & Hóa đơn VAT chung (FR-24)', link: routes.base.checkout },
      { code: 'M4.2', title: 'Cổng VNPAY (trang của VNPay, mở từ M4.1)', link: routes.base.checkout },
      { code: 'M4.3', title: 'Xác nhận tách đơn độc lập (BR-25)', link: routes.base.paymentResult },
    ],
  },
  {
    id: 'F2',
    name: 'Flow 2: Đặt hàng Doanh nghiệp số lượng lớn (Mở toàn sàn) & Duyệt Maket',
    steps: [
      { code: 'M3.0', title: 'Hub đặt hàng Doanh nghiệp', link: routes.base.bulk },
      { code: 'M3.1', title: 'Đăng yêu cầu mở & Kiểm tra NFC', link: routes.base.quoteRequestNew },
      { code: 'B3.0', title: 'Xưởng xem yêu cầu & Soạn báo giá (B3.1)', link: routes.vendor.requests },
      { code: 'M6.2.1', title: 'Người mua so sánh báo giá & Đặt cọc VNPAY', link: `${routes.account.requests}/REQ-2026-001/so-sanh` },
      { code: 'B2.1', title: 'Xưởng tải lên Maket thiết kế hộp/logo', link: routes.vendor.orders },
      { code: 'M6.1.2', title: 'Người mua duyệt Maket & Mở khóa cọc (FR-44)', link: `${routes.account.orders}/ORD-2026-083` },
      { code: 'Q4.1', title: 'Admin giải ngân tiền cọc đợt 1 cho xưởng', link: routes.admin.money },
    ],
  },
  {
    id: 'F3',
    name: 'Flow 3: Đặt hàng Doanh nghiệp chỉ định trực tiếp cho Xưởng nghệ nhân',
    steps: [
      { code: 'M3.2', title: 'Danh sách nghệ nhân & xưởng bánh (FR-14)', link: routes.base.vendors },
      { code: 'M3.3', title: 'Hồ sơ xưởng bánh Đông Phương (BR-21)', link: `${routes.base.vendors}/v-dong-phuong` },
      { code: 'M3.4', title: 'Gửi yêu cầu báo giá chỉ định riêng', link: `${routes.base.vendors}/v-dong-phuong/yeu-cau-bao-gia` },
      { code: 'B3.0', title: 'Xưởng nhận yêu cầu chỉ định & Phản hồi', link: routes.vendor.requests },
    ],
  },
  {
    id: 'F4',
    name: 'Flow 4: Đăng ký trở thành Người bán (Hộ KD/DNTN BR-33)',
    steps: [
      { code: 'M7.0', title: 'Trang giới thiệu Kênh Người Bán', link: routes.base.sellIntro },
      { code: 'M7.1', title: 'Điền hồ sơ Hộ KD/DNTN & Quét CCCD NFC', link: routes.base.sellRegister },
      { code: 'Q2.1', title: 'Admin thẩm định hồ sơ & Phê duyệt', link: routes.admin.vendors },
      { code: 'B1.1', title: 'Người bán đóng phí mở bán 500k (VNPAY)', link: routes.vendor.overview },
      { code: 'B4.1', title: 'Đăng sản phẩm đầu tiên theo FR-54 Vỏ/Nhân', link: routes.vendor.products },
    ],
  },
  {
    id: 'F5',
    name: 'Flow 5: Xử lý Khiếu nại & Giữ tiền Ký quỹ Escrow (FR-49)',
    steps: [
      { code: 'M6.1.1', title: 'Khách nhận bánh & Mở khiếu nại trong 48h', link: `${routes.account.orders}/ORD-2026-082` },
      { code: 'M6.1.3', title: 'Gửi bằng chứng bánh móp méo hộp (FR-49)', link: `${routes.account.orders}/ORD-2026-082/khieu-nai` },
      { code: 'B2.0', title: 'Xưởng nhận thông báo & Phản hồi giải trình', link: routes.vendor.orders },
      { code: 'Q5.1', title: 'Admin phân xử: Hoàn 1 phần (Trần Escrow AC-49.3)', link: routes.admin.disputes },
      { code: 'B5.1', title: 'Tiền còn lại được giải ngân cho xưởng', link: routes.vendor.money },
    ],
  },
  {
    id: 'F6',
    name: 'Flow 6: Xác thực sinh trắc học CCCD gắn chip qua NFC (App Simulator)',
    steps: [
      { code: 'V1.0', title: 'Màn hình bắt đầu xác thực', link: routes.account.verify },
      { code: 'V2.0', title: 'Hướng dẫn áp thẻ CCCD vào lưng máy', link: routes.account.verify },
      { code: 'V3.0', title: 'Quét sóng vô tuyến chip thời gian thực', link: routes.account.verify },
      { code: 'V4.0', title: 'Đọc trích xuất thông tin sinh trắc học', link: routes.account.verify },
      { code: 'V5.0', title: 'Xác thực thành công & Cấp huy hiệu bảo chứng', link: routes.account.verify },
    ],
  },
  {
    id: 'F7',
    name: 'Flow 7: Trọng tài Admin & Quản trị Danh mục Vỏ/Nhân (FR-54)',
    steps: [
      { code: 'Q1.0', title: 'Bàn làm việc Quản trị viên', link: routes.admin.overview },
      { code: 'Q6.4', title: 'Quản lý taxonomy Vỏ & Nhân bánh (FR-54)', link: routes.admin.cakeCatalog },
      { code: 'B4.1', title: 'Xưởng bánh chọn Vỏ & Nhân khi đăng sản phẩm', link: routes.vendor.products },
      { code: 'Q3.0', title: 'Admin kiểm duyệt & Gỡ sản phẩm vi phạm', link: routes.admin.products },
      { code: 'Q4.3', title: 'Chốt chu kỳ đối soát thứ Hai hàng tuần', link: routes.admin.reconciliation },
    ],
  },
];

/**
 * User-facing sentences shared by the whole web (Vietnamese; "bạn" for the user, no exclamation marks).
 * Each feature keeps its own sentences in its `strings.ts`.
 */
export const strings = {
  appName: 'Moonkage',

  errors: {
    network: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.',
    server: 'Máy chủ đang gặp lỗi. Thử lại sau ít phút.',
    config:
      'Thiếu VITE_API_BASE_URL. Sao chép web/.env.example thành web/.env.local, điền địa chỉ gateway rồi chạy lại npm run dev.',
    load: 'Không tải được dữ liệu. Thử lại sau ít phút.',
    retry: 'Thử lại',
  },

  loading: 'Đang tải…',

  nav: {
    main: 'Điều hướng chính',
    utility: 'Tiện ích',
    available: 'Mua hàng có sẵn',
    custom: 'Đặt theo yêu cầu',
    customDesc: 'Số lượng lớn, in logo hoặc hàng phải làm riêng, dù ít hộp.',
    newQuoteRequest: 'Tạo yêu cầu báo giá',
    newQuoteRequestHint: 'gửi nhiều nơi',
    suppliers: 'Đơn vị cung cấp',
    suppliersHint: 'chọn một nơi',
    policy: 'Chính sách mua bán',
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    account: 'Tài khoản',
  },

  footer: {
    note: 'Sàn bánh trung thu: mua hàng có sẵn hoặc đặt theo yêu cầu.',
  },

  notFound: {
    title: 'Không có trang này',
    back: 'Về trang chủ',
  },

  comingSoon: {
    title: 'Trang này đang được làm',
    body: 'Giao diện trang này chưa có trong bản hiện tại. Bạn có thể quay lại trang chủ.',
  },
};

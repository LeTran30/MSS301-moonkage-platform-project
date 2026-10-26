/** Sentences of the login screen (Vietnamese; "bạn" for the user, no exclamation marks). */
export const authStrings = {
  title: 'Đăng nhập',
  username: 'Email hoặc số điện thoại',
  password: 'Mật khẩu',
  submit: 'Đăng nhập',
  submitting: 'Đang đăng nhập…',
  missingFields: 'Nhập email hoặc số điện thoại và mật khẩu.',
  demoTitle: 'Tài khoản demo',
  demoHint: (password: string) => `Bản demo chạy trên dữ liệu mẫu. Chọn một vai, mật khẩu: ${password}.`,
  menu: {
    account: 'Tài khoản',
    overview: 'Tổng quan',
    orders: 'Đơn hàng',
    quotes: 'Yêu cầu và báo giá',
    addresses: 'Địa chỉ giao hàng',
    verify: 'Xác minh danh tính',
    profile: 'Thông tin cá nhân',
    logout: 'Đăng xuất',
  },
};

export const guideStrings = {
  heroTitle: (area: string) => `Bánh trung thu đóng hộp, giao tới ${area}`,
  heroLead: 'Chọn món, thanh toán VNPay và chờ Shop giao tới khu vực của bạn.',
  heroAvailable: 'Xem hàng có sẵn',
  heroCustom: 'Đặt theo yêu cầu',
  heroPhotoNote: 'Ảnh hero 1920 × 1080 chưa có: Moonkage tự chụp, chừa vùng giữa cho chữ.',

  moneyTitle: 'Tiền của bạn đi thế nào',
  step: (n: number) => `Bước ${n}`,
  money: [
    { title: 'Hàng có sẵn: trả ngay qua VNPay', body: 'Mỗi Shop tách một đơn. Phí giao tính ở giỏ hàng theo nơi nhận.' },
    { title: 'Đặt theo yêu cầu: Moonkage giữ tiền cọc', body: 'Trả cọc khi chấp nhận báo giá. Moonkage chỉ chuyển cho đơn vị từng phần khi quản trị duyệt giải ngân.' },
    { title: 'Duyệt maket trước khi làm', body: 'Đơn vị làm theo maket bạn đã duyệt. Phần còn lại trả sau khi giao hàng.' },
  ],

  customTitle: 'Đặt theo yêu cầu',
  customLead: 'Số lượng lớn, in logo hoặc hàng phải làm riêng, dù ít hộp.',
  whenLabel: 'Khi nào chọn:',
  entries: [
    {
      eyebrow: 'Gửi nhiều nơi',
      title: 'Tạo yêu cầu báo giá',
      when: 'bạn chưa có đơn vị quen và muốn nhận vài báo giá để so sánh.',
      conds: ['Moonkage gửi yêu cầu tới các đơn vị khớp số lượng, kiểu hộp và vùng giao', 'Cần đăng nhập và xác minh danh tính bằng CCCD gắn chip', 'Đặt cọc khi chấp nhận một báo giá'],
      cta: 'Tạo yêu cầu báo giá',
    },
    {
      eyebrow: 'Chọn một nơi',
      title: 'Đơn vị cung cấp',
      when: 'bạn đã biết đơn vị mình muốn, hoặc muốn xem năng lực từng nơi trước.',
      conds: ['Xem danh sách và trang đơn vị không cần đăng nhập', 'Gửi yêu cầu cho một đơn vị cần xác minh danh tính', 'Mỗi đơn vị có số hộp tối thiểu riêng'],
      cta: 'Xem đơn vị cung cấp',
    },
  ],
  afterTitle: 'Sau khi gửi, việc diễn ra thế nào',
  after: ['Đơn vị gửi báo giá', 'Bạn chấp nhận và đặt cọc', 'Duyệt maket', 'Đơn vị làm và giao', 'Trả phần còn lại'],
};

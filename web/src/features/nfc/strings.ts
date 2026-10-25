/** Sentences of NFC verification, FR-04 (Vietnamese; "bạn" for the user, no exclamation marks). */
export const nfcStrings = {
  title: 'Xác minh CCCD',
  intro:
    'Xác minh một lần bằng app Moonkage Verify trên điện thoại Android có NFC. Web không đọc và không lưu thông tin thẻ.',
  loadingStatus: 'Đang tải trạng thái xác minh…',
  reloadStatus: 'Tải lại trạng thái',
  qrHeading: 'Xác minh bằng app Moonkage Verify',
  steps: [
    'Mở app Moonkage Verify, đăng nhập cùng tài khoản này.',
    'Quét mã QR trên trang này.',
    'Chạm thẻ vào mặt sau điện thoại, kiểm tra thông tin rồi bấm Lưu.',
  ],
  createQr: 'Tạo mã QR',
  creatingQr: 'Đang tạo mã QR…',
  newQr: 'Tạo mã QR mới',
  qrAlt: 'Mã QR phiên xác minh, quét bằng app Moonkage Verify',
  qrPlaceholder: 'Mỗi mã QR chỉ dùng được một lần và hết hạn sau vài phút.',
  waiting: 'Đang chờ app gửi thẻ',
  remaining: (time: string) => `Mã hết hạn sau ${time}`,
  autoUpdate: 'Trang tự cập nhật khi app gửi thẻ xong.',
  expired: 'Mã QR đã hết hạn. Tạo mã mới để tiếp tục.',
  sessionLost: 'Mã QR này không còn dùng được. Tạo mã mới để tiếp tục.',
  verifiedBadge: 'Đã xác minh',
  verifiedTitle: 'Tài khoản đã xác minh CCCD',
  legalName: 'Họ tên trên thẻ',
  idNumber: 'Số CCCD',
  verifiedAt: 'Xác minh lúc',
  lockedBadge: 'Tạm khóa',
  lockedTitle: 'Xác minh đang tạm khóa',
  lockedBody: 'Bạn đã gửi thẻ không hợp lệ quá số lần cho phép. Hết thời gian khóa thì tạo mã QR mới.',
  lockedUntil: (time: string) =>
    `Bạn đã gửi thẻ không hợp lệ quá số lần cho phép. Tạo mã QR mới được từ ${time}.`,
  rejected: (reason: string, attemptsLeft: number | null) =>
    attemptsLeft === null
      ? `Thẻ vừa gửi chưa được nhận: ${reason} Chạm lại thẻ trên app để thử tiếp.`
      : `Thẻ vừa gửi chưa được nhận: ${reason} Còn ${attemptsLeft} lần thử, chạm lại thẻ trên app.`,
  reasons: {
    BAD_FORMAT: 'thông tin trên thẻ không đúng định dạng.',
    CARD_EXPIRED: 'CCCD đã hết hạn.',
    ID_ALREADY_LINKED: 'CCCD này đã gắn với một tài khoản khác.',
    other: 'máy chủ từ chối thẻ.',
  } as Record<string, string>,
};

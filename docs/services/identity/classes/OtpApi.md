# Class Log: `OtpApi`

> **Một câu:** phát và kiểm mã 6 số gửi qua email, kèm các giới hạn chống spam và chống đoán mò.

- **Package:** `com.moonkage.identity.otp`. Gốc module: `OtpApi`, `OtpCode`, `OtpPurpose`, `OtpError`. Hiện thực: `application.OtpFacade` → use case `IssueOtp`, `ThrottleOtpSend`, `VerifyOtp`, `DiscardOtp`. Luật nằm ở `domain.OtpEntry` và `domain.OtpRules`.
- **Tham chiếu:** `FR-01`, `FR-02`, `Q-05` (mã tách theo mục đích)
- **Dependencies:** `OtpRules` (dựng từ khóa `otp.*` trong application.yml), port `OtpStore` (adapter `InMemoryOtpStore` trên `ExpiringMap`), `Clock`. Không có DB: mọi thứ nằm trong RAM.

## 0. Hình dung dữ liệu

Mỗi cặp **(mục đích, email)** có một "phiếu" `OtpEntry`:

| Trường | Ý nghĩa |
| --- | --- |
| `code`, `expiresAt` | Mã đang chờ dùng và hạn của nó (`null` = không có mã) |
| `attempts` | Số lần nhập sai liên tiếp |
| `lockedUntil` | Đang bị khóa nhập tới lúc này |
| `lastSentAt` | Lần gửi gần nhất (để tính thời gian chờ) |
| `sendCount`, `sendWindowStart` | Số lần gửi trong khung 1 giờ hiện tại |

Mục đích là `VERIFY_ACCOUNT` hoặc `RESET_PASSWORD`, nên mã của luồng này không dùng được cho luồng kia.

## 1. Luật bất biến

1. **Chờ giữa hai lần gửi** ít nhất `otp.resend-cooldown` (mặc định 60 giây).
2. **Tối đa `otp.max-resend-per-hour` lần gửi mỗi giờ** (mặc định 5).
3. **Gửi lại trong lúc mã còn hạn thì dùng lại mã cũ**: xin mã mới không xóa bộ đếm nhập sai, nên không đoán mò vô hạn được.
4. **Nhập sai `otp.max-attempts` lần thì khóa** `otp.lockout-duration` (mặc định 15 phút). Hết khóa thì đếm lại từ 0.
5. **Mã đúng bị xóa ngay**: hai request song song không dùng chung được một mã.
6. **Email không có tài khoản vẫn có phiếu và vẫn bị đếm**, nên câu trả lời không để lộ email nào đã đăng ký.
7. Mọi thao tác đọc-sửa-ghi đi qua `OtpStore.update` (nguyên tử, trên `ExpiringMap.compute`), nên hai request song song không thể cùng đọc một giá trị đếm.
8. Thời gian đọc từ `Clock`. Phiếu được giữ `OtpRules.retention()` kể từ lần đổi cuối: tới khi mã, khóa, thời gian chờ và khung giờ gửi đều đã hết.

## 2. Danh mục Method

| Method | Output | ErrorCode có thể ném | Làm gì |
| --- | --- | --- | --- |
| `issue(purpose, email)` | `OtpCode` 6 số | `MAX_ATTEMPTS_EXCEEDED`, `SEND_LIMIT_EXCEEDED`, `TOO_FREQUENT` | Kiểm giới hạn, ghi một lượt gửi, trả mã (cũ nếu còn hạn, mới nếu không) |
| `throttle(purpose, email)` | `void` | như trên | Như `issue` nhưng không tạo mã: dùng cho email không đủ điều kiện |
| `verify(purpose, email, code)` | `void` | `INVALID_OR_EXPIRED`, `MAX_ATTEMPTS_EXCEEDED` | Đúng thì xóa mã; sai thì đếm, tới ngưỡng thì khóa |
| `discard(purpose, email)` | `void` | — | Bỏ mã (email gửi lỗi), giữ nguyên bộ đếm |
| `InMemoryOtpStore.purgeExpired()` | `void` | — | Chạy định kỳ (`otp.cleanup-interval`): xóa phiếu đã hết thời gian giữ |

## 3. Luồng chi tiết

### `issue` / `throttle` → `OtpEntry.reserveSend`
1. Lấy phiếu (chưa có thì phiếu trống). Khóa đã hết hạn → mở khóa, đếm sai về 0.
2. Đang khóa → `THROW MAX_ATTEMPTS_EXCEEDED` (kèm số phút còn lại).
3. Trong khung giờ hiện tại đã gửi đủ số lần → `THROW SEND_LIMIT_EXCEEDED`.
4. Chưa hết thời gian chờ → `THROW TOO_FREQUENT` (kèm số giây còn lại).
5. Ghi lượt gửi: còn trong khung giờ thì `sendCount + 1`; hết khung thì mở khung mới với `sendCount = 1`.
6. Chỉ `issue` (`withCodeIfNone`): mã cũ còn hạn → giữ; không thì tạo mã ngẫu nhiên mới (`SecureRandom`), hạn `otp.expiration`.

Bước 2–4 ném lỗi **mà không ghi gì**: lượt bị từ chối không làm chờ lâu thêm.

### `verify` → `OtpEntry.guess`
1. Lấy phiếu, mở khóa nếu khóa đã hết hạn.
2. Đang khóa → kết quả `LOCKED`.
3. Có mã còn hạn **và** khớp (so thời gian hằng số, không lộ đúng bao nhiêu chữ số) → `MATCH`, xóa mã, đếm sai về 0.
4. Ngược lại (sai, hết hạn, hoặc email không có mã) → đếm sai + 1; tới ngưỡng thì khóa → `LOCKED`, chưa tới thì `MISMATCH`.
5. `LOCKED` → `THROW MAX_ATTEMPTS_EXCEEDED`; `MISMATCH` → `THROW INVALID_OR_EXPIRED`.

## 4. Trường hợp biên & ghi chú

- **Dữ liệu nằm trong RAM của một instance.** Khởi động lại thì mất mã đang chờ (người dùng xin mã mới). Chạy nhiều instance thì cần chuyển sang Redis.
- `purgeStaleEntries` chỉ xóa phiếu đã sạch hoàn toàn: không có mã, không khóa, hết thời gian chờ, hết khung giờ. Xóa sớm hơn sẽ mở cửa cho spam.
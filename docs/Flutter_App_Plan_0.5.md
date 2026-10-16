# KẾ HOẠCH PHÁT TRIỂN APP FLUTTER: Moonkage Verify

> **Hướng dẫn cho AI đọc tài liệu này**
> - Tài liệu này mô tả **kế hoạch xây app mobile**. Xây gì nằm ở `Moonkage_Requirement_v1.5.md` (FR-04, A-08); API và luồng phía máy chủ nằm ở `Software_Design_v0.5.md` (mục 4.2, 5.1, 7.7). Mã FR, AC theo Requirement v1.5. Khi khác nhau, theo Requirement rồi đến Software Design.

## 0. Thông tin tài liệu

| Mục | Giá trị |
|---|---|
| Phiên bản | v0.5 |
| Ngày cập nhật | 2026-10-17 |
| Dựa trên | Requirement v1.5, Software Design v0.5 |
| Trạng thái | Draft |

---

## 1. Phạm vi

App Moonkage Verify **chỉ** phục vụ FR-04 (xác minh NFC): quét QR trên web, đọc thẻ, gửi lên máy chủ, hiện kết quả. Không có chức năng mua bán, không có chức năng ghi thẻ.

**Cách xác minh (Đã chốt, Requirement v1.5):**
- Thẻ chỉ chứa **họ tên** và **số CCCD**, không chữ ký. Như CCCD thật, thẻ do **người dùng tự có trước**, nằm ngoài hệ thống; nền tảng không cấp thẻ (A-08).
- App đọc thẻ và gửi nguyên văn nội dung lên máy chủ.
- Máy chủ kiểm phiên, định dạng và trùng CCCD. Hợp lệ thì máy chủ **ghi họ tên và số CCCD vào tài khoản** và chuyển tài khoản sang "đã xác minh NFC". Không so với thông tin người dùng tự nhập.

---

## 2. Nội dung thẻ

Một NDEF **Text record**, một dòng:

```
MK1|<so_cccd>|<ho_ten>
```

| Trường | Định dạng | Ví dụ |
|---|---|---|
| `MK1` | Tiền tố nhận diện thẻ Moonkage | `MK1` |
| `so_cccd` | Đúng 12 chữ số | `001090000001` |
| `ho_ten` | UTF-8, không rỗng | `Nguyễn Văn An` |

Chỉ dùng dữ liệu CCCD mẫu (A-08).

**Cách làm thẻ mẫu cho demo** (việc chuẩn bị của nhóm, ngoài hệ thống; A-08): mở NFC Tools → Write → Add record → Text, nhập dòng trên → Write, chạm thẻ → Read lại để kiểm → Other → Lock tag. Khóa thẻ không đảo ngược được, nên chỉ khóa sau khi đọc lại đúng.

---

## 3. Máy chủ xử lý gì (tóm tắt Software Design 4.2, 5.1)

| Bước | Kiểm | Không đạt thì `reason_code` |
|---|---|---|
| 1 | Phiên còn hạn (5 phút) và chưa dùng | `SESSION_EXPIRED` / `SESSION_USED` |
| 2 | Tài khoản không đang bị tạm khóa xác minh | `LOCKED` |
| 3 | Nội dung đúng dạng `MK1|<12 chữ số>|<họ tên không rỗng>` | `BAD_FORMAT` |
| 4 | Số CCCD chưa gắn với tài khoản khác | `ID_ALREADY_LINKED` |

Bước 3 và 4 không đạt thì tính một lần thử; 5 lần thì tạm khóa 15 phút. Đạt cả bốn bước thì máy chủ ghi họ tên, số CCCD (dạng băm và đã che) vào tài khoản, chuyển sang "đã xác minh NFC", và đẩy kết quả về web qua WebSocket.

---

## 4. Thiết kế app

### 4.1 Luồng màn hình

1. **Khởi động:** kiểm máy có NFC. Không có → báo dùng điện thoại khác. NFC đang tắt → hướng dẫn bật.
2. **Quét QR** (xin quyền camera). QR có dạng `moonkage-verify:v1:<session_id>`; sai dạng thì báo lỗi.
3. **Chạm thẻ:** đọc Text record đầu tiên bắt đầu bằng `MK1|`. Không có → báo "thẻ không đúng loại", cho chạm lại, không gửi lên máy chủ.
4. **Đang gửi.**
5. **Kết quả:** thành công → hiện họ tên và số CCCD đã che từ phản hồi, kèm "Quay lại trang web để tiếp tục"; thất bại → lý do theo `reason_code`, số lần thử còn lại hoặc thời điểm hết tạm khóa.

### 4.2 Nguyên tắc

- App không đăng nhập; phiên QR là thứ gắn app với tài khoản.
- URL máy chủ lấy từ cấu hình build, không đọc từ QR, để QR giả không khiến app gửi dữ liệu thẻ tới máy chủ lạ.
- App gửi nguyên văn dòng `MK1|...`; không tự kiểm định dạng chi tiết, không lưu nội dung thẻ trên máy.

### 4.3 API app gọi

| Method, đường dẫn | Body | Phản hồi |
|---|---|---|
| `POST /api/identity/nfc-sessions/{sessionId}/result` | `{card_text, app_version}` | `{status, reason_code, attempts_left, locked_until, legal_name, id_number_masked}` |

Endpoint không dùng JWT (Software Design 5.1, 8). Hai trường `legal_name`, `id_number_masked` chỉ có khi `status = VERIFIED` (Software Design v0.5 mục 5.1).

### 4.4 Thư viện và nền tảng

| Việc | Gói |
|---|---|
| NFC | `nfc_manager` |
| Quét QR | `mobile_scanner` |
| HTTP | `dio` |
| State, điều hướng | `flutter_riverpod`, `go_router` |

Android trước, đề xuất `minSdk 26` (Q-07). iOS để sau vì cần tài khoản Apple Developer trả phí.

### 4.5 Cấu trúc thư mục

```
mobile/
├── lib/
│   ├── main.dart
│   ├── core/       # cấu hình môi trường, API client, mã lỗi
│   ├── nfc/        # bọc nfc_manager: đọc Text record
│   └── features/verify/
└── test/
```

---

## 5. Kế hoạch theo giai đoạn

| GĐ | Việc | Ai | Thời lượng | Đầu ra |
|---|---|---|---|---|
| 0. Chuẩn bị | Mua 10 thẻ NTAG215; cài NFC Tools; máy Android có NFC; tạo project Flutter, CI | Cả nhóm | 1 ngày | Project build được, có thẻ thử |
| 1. App | Quét QR, đọc thẻ, gọi API, màn kết quả; chạy với mock server | Mobile | ~1 tuần | Đọc được thẻ ghi bằng NFC Tools, gửi đúng body lên mock |
| 1'. Backend (song song) | Endpoint mục 4.3 và quy tắc mục 3 ở identity-service | Backend | 2–3 ngày | Unit test các `reason_code` |
| 2. Tích hợp | Chạy với React (trang QR, cập nhật qua WebSocket), gateway, identity; chạy bảng kiểm thử bên dưới | Mobile + backend | 2–3 ngày | Mọi dòng kiểm thử đạt |
| 3. Demo | Câu chữ tiếng Việt, build APK, làm và khóa thẻ demo, kịch bản demo | Mobile | 1–2 ngày | APK và bộ thẻ demo |

Tổng khoảng 2 tuần cho phía mobile. Khi demo trên máy cá nhân, điện thoại phải gọi được gateway: dùng IP mạng LAN hoặc tunnel đã dùng cho VNPay IPN.

**Kiểm thử**

| Tình huống | Kết quả mong đợi | AC |
|---|---|---|
| Thẻ hợp lệ, phiên mới | Đã xác minh; họ tên và CCCD ghi vào tài khoản; web tự cập nhật | 04.1, 04.2 |
| Dùng thẻ đã xác minh cho tài khoản thứ hai | `ID_ALREADY_LINKED` | 04.3 |
| Phiên quá 5 phút / quét lại QR cũ | `SESSION_EXPIRED` / `SESSION_USED` | 04.4 |
| Sai 5 lần | Tạm khóa 15 phút | 04.5 |
| Thẻ có `MK1|` nhưng CCCD 11 chữ số | `BAD_FORMAT` | 04.2 |
| Thẻ trắng hoặc thẻ có URL | App báo thẻ không đúng loại, không gửi | FR-04 |
| Máy không có NFC | App báo dùng máy khác | FR-04 |
| Kiểm database sau xác minh | Không có số CCCD đầy đủ, không có nội dung thô của thẻ | 04.6 |
| App Moonkage Verify | Không có chức năng ghi thẻ | A-08 |

---

## 6. Hệ quả được chấp nhận

Thẻ không có chữ ký, và máy chủ không so với thông tin người dùng tự nhập. Vì vậy ai có app ghi NFC cũng tự ghi được thẻ với họ tên và số CCCD bất kỳ, và tài khoản sẽ được ghi nhận theo thẻ đó. Ràng buộc "một CCCD một tài khoản" vẫn giữ. Requirement A-08 đã ghi nhận hệ quả này.

---

## 7. Điểm cần nhóm chốt

| # | Điểm | Đề xuất | Liên quan |
|---|---|---|---|
| P-01 | Phiên bản Android tối thiểu, thư viện NFC | `minSdk 26`, `nfc_manager` | Q-07 |
| P-02 | State management | `flutter_riverpod` | |
| P-03 | Trả `legal_name`, `id_number_masked` trong phản hồi kết quả để app hiện cho người dùng kiểm | **Đã xong** ở Software Design v0.5 mục 5.1 | FR-04 |

---

## 8. Lịch sử thay đổi

| Phiên bản | Ngày | Nội dung |
|---|---|---|
| v0.1 | 2026-10-15 | Tạo plan: app hai flavor `verify` / `issuer`, định dạng thẻ nhị phân có chữ ký |
| v0.2 | 2026-10-15 | Bỏ flavor `issuer`; ghi thẻ bằng NFC Tools, ký bằng CLI Java `card-signer` |
| v0.3 | 2026-10-15 | Đơn giản hóa: thẻ chỉ lưu họ tên và số CCCD, không chữ ký; bỏ `card-signer`; so thẻ với thông tin nhập trên web |
| v0.4 | 2026-10-15 | Đồng bộ Requirement v1.3 và Software Design v0.4: bỏ bước nhập họ tên, CCCD trên web và bỏ so sánh; máy chủ ghi thông tin từ thẻ vào tài khoản. `reason_code` còn `SESSION_EXPIRED`, `SESSION_USED`, `LOCKED`, `BAD_FORMAT`, `ID_ALREADY_LINKED`. Thêm P-03 |
| v0.5 | 2026-10-17 | Đồng bộ Requirement v1.5 và Software Design v0.5: FR-54 cũ thành FR-04, AC theo mã mới; bỏ FR-55 (thẻ do người dùng tự có, nền tảng không cấp thẻ); việc ghi thẻ bằng NFC Tools chỉ còn là chuẩn bị thẻ mẫu cho demo; P-03 xong |

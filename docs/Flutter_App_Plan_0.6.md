# KẾ HOẠCH PHÁT TRIỂN APP FLUTTER: Moonkage Verify

> **Hướng dẫn cho AI đọc tài liệu này**
> - Tài liệu này mô tả **kế hoạch xây app mobile**. Xây gì nằm ở `Moonkage Requirement Final.md` (FR-04, A-08, NFR-03); API và luồng phía máy chủ nằm ở `Software_Design_v0.6.md` (mục 4.2, 5.1, 7.7, 8). Khi khác nhau, theo Requirement rồi đến Software Design.
> - Chi tiết code, cách chạy, lỗi đã gặp nằm trong `mobile/README.md` và `mobile/docs/`. Tài liệu này chỉ giữ phạm vi, luồng, hợp đồng với máy chủ và kế hoạch.

## 0. Thông tin tài liệu

| Mục | Giá trị |
|---|---|
| Phiên bản | v0.6 |
| Ngày cập nhật | 2026-10-17 |
| Dựa trên | Requirement v1.6, Software Design v0.6 |
| Trạng thái | Draft |

---

## 1. Phạm vi

App Moonkage Verify **chỉ** phục vụ FR-04 (xác minh NFC). App không có chức năng mua bán và không có chức năng ghi thẻ.

**Luồng đã chốt (Requirement v1.6, FR-04):**
1. Người dùng **đăng nhập** app bằng tài khoản Moonkage của mình (AC-04.2).
2. Quét mã QR phiên trên web. Phiên phải thuộc đúng tài khoản đang đăng nhập.
3. Chạm thẻ. App đọc Text record JSON 9 khóa (A-08), **kiểm định dạng và hạn CCCD** để báo lỗi sớm (AC-04.3, AC-04.8).
4. App **hiện đủ 9 trường trên điện thoại**, kể cả số định danh đầy đủ (AC-04.4).
5. Người dùng bấm **Lưu** thì app mã hóa số định danh, ngày sinh, nơi thường trú rồi **gửi một lần**; bấm **Hủy** thì không gửi gì (AC-04.4, AC-04.10).
6. Máy chủ kiểm lại mọi điều kiện, lưu 5 trường (họ tên, giới tính, ngày sinh, quốc tịch, số định danh) và trả kết quả (AC-04.5, AC-04.11).

Thẻ do người dùng tự có trước, nằm ngoài hệ thống; nền tảng không cấp thẻ (A-08).

---

## 2. Nội dung thẻ

Một NDEF **Text record** chứa một **JSON object** trên một dòng, 9 khóa `snake_case` theo các trường in trên CCCD (A-08):

| Khóa | Quy định |
|---|---|
| `id_number` | Chuỗi đúng 12 chữ số |
| `full_name` | In hoa, không dấu, các từ cách nhau một khoảng trắng |
| `date_of_birth` | `yyyy-MM-dd` |
| `sex` | `Nam`, `Nu` hoặc `Nữ` |
| `nationality`, `place_of_birth`, `place_of_residence` | Chuỗi không rỗng |
| `date_of_issue` | `yyyy-MM-dd`, sau ngày sinh |
| `date_of_expiry` | `yyyy-MM-dd`, sau ngày cấp; **không trước ngày hiện tại** (AC-04.8) |

App nhận ra thẻ Moonkage nhờ khóa `id_number`. Chỉ dùng dữ liệu CCCD mẫu (A-08). Thẻ mẫu khoảng 300 byte, NTAG215 là đủ. Cách làm thẻ mẫu cho demo (việc chuẩn bị của nhóm, ngoài hệ thống): `mobile/docs/NFC_CARD_GUIDE.md`.

---

## 3. Máy chủ xử lý gì (tóm tắt Software Design 4.2, 5.1)

| Bước | Kiểm | Không đạt thì `reasonCode` |
|---|---|---|
| 1 | Phiên tồn tại, còn hạn (5 phút) | `SESSION_EXPIRED` |
| 2 | Phiên thuộc tài khoản trong JWT | `SESSION_NOT_OWNED` |
| 3 | Phiên chưa dùng | `SESSION_USED` |
| 4 | Tài khoản không đang bị tạm khóa xác minh | `LOCKED` |
| 5 | Giải mã được `encryptedFields`; 9 trường đúng định dạng | `BAD_FORMAT` |
| 6 | CCCD còn hạn | `CARD_EXPIRED` |
| 7 | Số định danh chưa gắn với tài khoản khác | `ID_ALREADY_LINKED` |

Bước 5, 6, 7 không đạt thì tính một lần thử; 5 lần thì tạm khóa 15 phút (AC-04.9). Đạt cả bảy bước thì máy chủ lưu 5 trường (số định danh và ngày sinh mã hóa), bỏ các trường còn lại, chuyển tài khoản sang "đã xác minh NFC", và đẩy kết quả về web qua WebSocket.

---

## 4. Thiết kế app

### 4.1 Luồng màn hình

1. **Đăng nhập:** email hoặc số điện thoại và mật khẩu, qua `POST /api/auth/login`. Token chỉ giữ trong bộ nhớ.
2. **Trang chủ:** kiểm máy có NFC. Không có → báo dùng điện thoại khác. NFC đang tắt → hướng dẫn bật.
3. **Quét QR** (xin quyền camera). QR có dạng `moonkage-verify:v1:<sessionId>`; sai dạng thì báo lỗi, không gọi API.
4. **Chạm thẻ:** chọn Text record là JSON có khóa `id_number`; không có → "thẻ không đúng loại". Sai trường hoặc CCCD hết hạn → báo lỗi, cho chạm lại, không gửi.
5. **Xác nhận:** hiện 9 trường đọc từ thẻ, chỉ đọc. **Lưu** hoặc **Hủy**.
6. **Đang gửi** (chỉ sau khi bấm Lưu).
7. **Kết quả:** đã xác minh; hoặc lý do theo `reasonCode`, số lần thử còn lại hoặc thời điểm hết tạm khóa.

### 4.2 Nguyên tắc

- URL máy chủ và khóa công khai mã hóa lấy từ cấu hình build (`env/*.json`), không đọc từ QR, không cho người dùng nhập.
- Không log, không lưu dữ liệu thẻ, mật khẩu, token trên máy. Dữ liệu thẻ bị xóa khỏi bộ nhớ khi Lưu xong, Hủy, về trang chủ hoặc đăng xuất.
- App kiểm thẻ để báo lỗi sớm; máy chủ vẫn kiểm lại toàn bộ.
- Màn xác nhận là nơi duy nhất hiện số định danh đầy đủ (AC-04.4, AC-04.12).

### 4.3 API app gọi

| Method, đường dẫn | Xác thực | Body | Phản hồi |
|---|---|---|---|
| `POST /api/auth/login` | – | `{username, password}` | `LoginResponse` (`docs/auth.md`) |
| `POST /api/nfc-sessions/{sessionId}/card` | Bearer | `{fullName, sex, nationality, placeOfBirth, dateOfIssue, dateOfExpiry, encryptedFields, appVersion}` | `{status, reasonCode, attemptsLeft, lockedUntil}` |

- `sex` gửi dạng `MALE` / `FEMALE`.
- `encryptedFields` là JWE compact (`RSA-OAEP-256` + `A256GCM`, `kid` theo cấu hình) bọc `{idNumber, dateOfBirth, placeOfResidence}` (Software Design D-17).
- `status` là `VERIFIED` hoặc `REJECTED`. 401 thì app đăng xuất và về màn đăng nhập.

### 4.4 Thư viện và nền tảng

| Việc | Gói |
|---|---|
| NFC | `nfc_manager` |
| Quét QR | `mobile_scanner` |
| HTTP | `dio` |
| Mã hóa JWE | `jose` (đề xuất, P-04) |
| State, điều hướng | `flutter_riverpod`, `go_router` |

Android, `minSdk 26`. iOS để sau vì cần tài khoản Apple Developer trả phí.

---

## 5. Kế hoạch theo giai đoạn

Luồng đọc thẻ, đăng nhập và mock server đã có (`mobile/docs/DEV_LOGS.md`). Việc còn lại:

| GĐ | Việc | Ai | Đầu ra |
|---|---|---|---|
| 1. Chỉnh app theo luồng đã chốt | Bỏ bước máy chủ lưu tạm (`confirm`, `DELETE card`); màn xác nhận hiện dữ liệu đọc từ thẻ; Lưu mới gửi; mã hóa JWE; kiểm hạn CCCD; thêm `CARD_EXPIRED`; cập nhật mock server và test | Mobile | Luồng mục 4.1 chạy với mock |
| 1'. Backend (song song) | Endpoint mục 4.3 và các bước mục 3 ở identity-service; khóa JWE, khóa AES lưu | Backend | Unit test mọi `reasonCode`; database không có số định danh, ngày sinh dạng đọc được |
| 2. Tích hợp | Chạy với React (trang QR, WebSocket), gateway, identity; bảng kiểm thử dưới | Mobile + backend | Mọi dòng đạt |
| 3. Demo | Câu chữ tiếng Việt, build APK, bộ thẻ demo, kịch bản demo | Mobile | APK và bộ thẻ demo |

Khi demo trên máy cá nhân, điện thoại phải gọi được gateway: dùng IP mạng LAN hoặc tunnel đã dùng cho VNPay IPN.

**Kiểm thử**

| Tình huống | Kết quả mong đợi | AC |
|---|---|---|
| Đăng nhập, quét QR của chính mình, thẻ hợp lệ, bấm Lưu | Đã xác minh; web tự cập nhật | 04.1, 04.4, 04.5 |
| Bấm Hủy ở màn xác nhận | Không có request gửi thẻ; về trang chủ | 04.4 |
| Quét QR phiên của tài khoản khác | `SESSION_NOT_OWNED` | 04.2 |
| Dùng thẻ đã xác minh cho tài khoản thứ hai | `ID_ALREADY_LINKED` | 04.6 |
| Phiên quá 5 phút / quét lại QR đã dùng | `SESSION_EXPIRED` / `SESSION_USED` | 04.7 |
| Thẻ có `date_of_expiry` trước hôm nay | App báo CCCD hết hạn, không gửi; gửi thẳng bằng curl → `CARD_EXPIRED` | 04.8 |
| Sai 5 lần | Tạm khóa 15 phút | 04.9 |
| Thẻ thiếu trường, CCCD 11 chữ số, tên có dấu | App báo nội dung thẻ không hợp lệ, không gửi | 04.3 |
| Thẻ trắng, thẻ URL, thẻ định dạng cũ `MK1\|` | App báo thẻ không đúng loại, không gửi | 04.3 |
| Bắt request trên mạng | Không thấy số định danh, ngày sinh, nơi thường trú dạng đọc được trong body | 04.10 |
| Kiểm database sau xác minh | Chỉ 5 trường; số định danh và ngày sinh ở dạng mã hóa; không có nơi sinh, nơi thường trú, ngày cấp, ngày hết hạn, nội dung thô | 04.11 |
| Máy không có NFC | App báo dùng máy khác | FR-04 |
| App Moonkage Verify | Không có chức năng ghi thẻ | A-08 |

---

## 6. Hệ quả được chấp nhận

Thẻ không có chữ ký, và máy chủ không so với thông tin người dùng tự nhập. Vì vậy ai có app ghi NFC cũng tự ghi được thẻ với thông tin bất kỳ, và tài khoản sẽ được ghi nhận theo thẻ đó. Ràng buộc "một CCCD một tài khoản" và kiểm hạn CCCD vẫn giữ. Requirement A-08 đã ghi nhận hệ quả này.

---

## 7. Điểm cần nhóm chốt

| # | Điểm | Đề xuất | Liên quan |
|---|---|---|---|
| P-01 | Phiên bản Android tối thiểu, thư viện NFC | **Đã chọn trong code:** `minSdk 26`, `nfc_manager` | Q-07 |
| P-02 | State management | **Đã chọn trong code:** `flutter_riverpod` | |
| P-03 | Phản hồi kết quả có trả lại thông tin thẻ | **Bỏ:** app hiện dữ liệu đọc từ thẻ trước khi gửi (AC-04.4) | FR-04 |
| P-04 | Thư viện JWE phía app | `jose` | Software Design D-17 |
| P-05 | Có gửi nơi sinh, ngày cấp, nơi thường trú lên máy chủ không | Theo giá trị tạm Q-37: gửi đủ, máy chủ bỏ sau khi kiểm | Requirement Q-37 |

---

## 8. Lịch sử thay đổi

| Phiên bản | Ngày | Nội dung |
|---|---|---|
| v0.1 | 2026-10-15 | Tạo plan: app hai flavor `verify` / `issuer`, định dạng thẻ nhị phân có chữ ký |
| v0.2 | 2026-10-15 | Bỏ flavor `issuer`; ghi thẻ bằng NFC Tools, ký bằng CLI Java `card-signer` |
| v0.3 | 2026-10-15 | Đơn giản hóa: thẻ chỉ lưu họ tên và số CCCD, không chữ ký; bỏ `card-signer`; so thẻ với thông tin nhập trên web |
| v0.4 | 2026-10-15 | Đồng bộ Requirement v1.3 và Software Design v0.4: bỏ bước nhập họ tên, CCCD trên web; máy chủ ghi thông tin từ thẻ vào tài khoản. Thêm P-03 |
| v0.5 | 2026-10-17 | Đồng bộ Requirement v1.5 và Software Design v0.5: FR-54 cũ thành FR-04; bỏ FR-55 (thẻ do người dùng tự có) |
| v0.6 | 2026-10-17 | Đồng bộ Requirement v1.6 và Software Design v0.6, theo luồng app mobile đã làm: app đăng nhập; thẻ JSON 9 khóa; app kiểm định dạng và hạn CCCD; người dùng xác nhận trên điện thoại rồi mới gửi một lần; mã hóa JWE số định danh, ngày sinh, nơi thường trú; thêm `SESSION_NOT_OWNED`, `CARD_EXPIRED`; máy chủ không lưu tạm. P-01, P-02 đã chọn; bỏ P-03; thêm P-04, P-05. Đường dẫn API theo quy ước mới của Software Design D-18 (`/api/...`, không tên service) |

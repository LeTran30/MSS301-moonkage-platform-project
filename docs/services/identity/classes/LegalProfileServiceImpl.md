# Class Log: `LegalProfileServiceImpl`

> **Một câu:** trả lời các service khác "tài khoản này đã xác minh NFC chưa", và băm giúp họ một số định danh để so với CCCD của chủ tài khoản.

- **Package:** `com.moonkage.identity.kyc`
- **Tham chiếu:** `BR-23`, `BR-27`, `AC-26.6`, `AC-26.8`, `AC-45.1`, `D-07`, `NFR-03`
- **Dependencies:** `AccountApi` (`requireExists`), `NfcAttemptTracker` (đang khóa không), `LegalProfileRepository`, `IdNumberHasher`, `LegalProfileMapper`, `Clock`
- **Người gọi:** `KycController` (`GET /api/nfc/status`, `GET /internal/nfc/status/{accountId}`), `AccountController` (`POST /internal/accounts/check`)

## 0. Luật bất biến

1. **Khóa băm (pepper) không bao giờ rời identity-service** (D-07). vendor-service muốn có mã băm của một số định danh thì gửi số đó sang đây để băm.
2. **Chỉ dạng đã che** (`********1234`) mới rời service. Số đầy đủ chỉ nằm trong bộ nhớ khi băm, không ghi log, không lưu.
3. So hai mã băm bằng **phép so thời gian hằng số**, không để lộ thông tin qua thời gian phản hồi.

## 1. Danh mục Method

| Method | Output | ErrorCode có thể ném | Làm gì |
| --- | --- | --- | --- |
| `getNfcStatus(accountId)` | `NfcStatusResponse` | `ACCOUNT_NOT_FOUND` | Trả `VERIFIED` (kèm tên, số đã che, thời điểm), `LOCKED` hoặc `NOT_VERIFIED` |
| `checkIdNumber(request)` | `CheckIdNumberResponse` | `ID_NUMBER_INVALID`, `ACCOUNT_NOT_FOUND` | Băm số định danh, cho biết có trùng CCCD của chủ tài khoản không |

## 2. Luồng chi tiết

### `getNfcStatus(accountId)`
1. `AccountApi.requireExists(accountId)`: tài khoản không tồn tại → `ACCOUNT_NOT_FOUND`.
2. Có `LegalProfile` → `VERIFIED` kèm họ tên trên thẻ, số đã che, thời điểm xác minh.
3. Không có → `NfcAttemptTracker.lockoutOf(accountId).isLocked(now)` thì `LOCKED`, không thì `NOT_VERIFIED`. Không có dữ liệu thẻ nào.

### `checkIdNumber(request)`
1. Bỏ mọi ký tự không phải số (`"079 123-456 789"` cũng hợp lệ). Không đúng 12 chữ số → `ID_NUMBER_INVALID`.
2. `AccountApi.requireExists`: tài khoản không tồn tại → `ACCOUNT_NOT_FOUND`.
3. Băm số định danh bằng HMAC-SHA256 với pepper phiên bản hiện tại.
4. Tài khoản đã xác minh NFC → so mã băm vừa tạo với mã băm CCCD đã lưu → `matchesAccount`.
5. Trả mã băm, phiên bản khóa, dạng đã che, `matchesAccount`. Kèm thông tin chủ tài khoản (tên, số đã che, thời điểm xác minh) nếu đã xác minh; không thì các trường đó là `null` và `matchesAccount = false`.

## 3. Ghi chú

- vendor-service lưu `idHash` và `idHashKeyVer` để sau này đổi khóa thì băm lại được (NFR-03).
- Hai API nội bộ trả thẳng dữ liệu, không bọc trong `ApiResponse`. Gateway chặn đường dẫn `/internal/**` từ bên ngoài.

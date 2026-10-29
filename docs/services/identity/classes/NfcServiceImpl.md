# Class Log: `NfcServiceImpl`

> **Một câu:** web mở một phiên xác minh hiện thành mã QR, app Moonkage Verify đọc thẻ CCCD qua NFC rồi gửi lên một lần; máy chủ kiểm thẻ và lưu kết quả.

- **Package:** `com.moonkage.identity.kyc`
- **Tham chiếu:** `FR-04` (`AC-04.1` → `AC-04.12`), `BR-23`, `D-21`, Software Design 4.2 (thứ tự kiểm)
- **Dependencies:** `AccountService` (`requireAccountExists`, `lockForUpdate`), `NfcAttemptTracker` (bộ đếm sai và khóa), `LegalProfileRepository`, `NfcTransportDecryptor` (mở JWE), `NfcCardValidator` (kiểm định dạng), `IdNumberHasher` (băm có khóa), `PiiCipher` (mã hóa AES), `OutboxService` (sự kiện), `NfcProperties`, `TransactionTemplate`

## 0. Hình dung

```
Web ──POST /sessions──▶ phiên PENDING (RAM, 5 phút) ──QR──▶ App
App ──POST /sessions/{id}/card──▶ kiểm thẻ ──▶ VERIFIED: lưu LegalProfile
                                         └─▶ REJECTED: đếm lần sai (5 lần → khóa 15 phút)
Web ◀── WebSocket (qua outbox → orchestrator) hoặc GET /sessions/{id}
```

- **Phiên** nằm trong RAM (`sessions`), không có bảng DB: khởi động lại chỉ có nghĩa là quét QR mới.
- **Bộ đếm sai và thời điểm khóa** cũng nằm trong RAM (`NfcAttemptTracker`, giá trị `NfcLockout`), vì chúng chỉ có ý nghĩa trong thời gian khóa ([db-identify.md](../db-identify.md)); khởi động lại thì quên, như OTP. Chính sách (số lần, thời gian khóa) lấy từ `NfcProperties`. Khóa dòng tài khoản (`lockForUpdate`) vẫn tuần tự hóa các thẻ của cùng một tài khoản.
- **Đã xác minh** = tài khoản có một dòng `legal_profiles`.

## 1. Luật bất biến

1. **Mỗi tài khoản chỉ có một phiên đang chờ**: tạo phiên mới thì QR cũ hết tác dụng.
2. **Một phiên chỉ được một thẻ xử lý tại một thời điểm** (cờ `inFlight` đặt trong `Map.compute`).
3. **Một CCCD chỉ gắn với một tài khoản** (BR-23): kiểm trước bằng mã băm, và khóa duy nhất `uk_legal_profiles_id_hash` chặn trường hợp hai người lưu cùng lúc.
4. **Lần sai nào cũng được đếm**: `NfcAttemptTracker` đổi giá trị qua `Map.compute`, nên hai lần sai song song đều được tính.
5. **Không lưu số CCCD dạng đọc được**: chỉ lưu mã băm, dạng che (`********1234`) và bản mã hóa AES. Nơi sinh, nơi thường trú, ngày cấp bị bỏ ngay sau khi kiểm.
6. **Sự kiện đi cùng transaction** với thay đổi dữ liệu (outbox): không bao giờ gửi sự kiện cho một thay đổi đã bị rollback.

## 2. Danh mục Method

| Method | Output | ErrorCode / lý do từ chối | Làm gì |
| --- | --- | --- | --- |
| `createSession(accountId)` | `CreateNfcSessionResponse` | `ACCOUNT_NOT_FOUND`, `NFC_ALREADY_VERIFIED`, `NFC_LOCKED` | Mở phiên mới (thay phiên đang chờ cũ) |
| `getSession(sessionId, accountId)` | `NfcSessionStatusResponse` | `NFC_SESSION_EXPIRED` (410), `NFC_SESSION_NOT_OWNED` (403) | Xem phiên đang PENDING hay VERIFIED |
| `submitCard(sessionId, accountId, request)` | `SubmitCardResponse` (luôn 200) | `SESSION_*`, `LOCKED`, `BAD_FORMAT`, `CARD_EXPIRED`, `ID_ALREADY_LINKED` | Kiểm thẻ và lưu kết quả |
| `purgeExpiredSessions()` | `void` | — | Chạy định kỳ: dọn phiên hết hạn và các khóa NFC đã hết |

Thẻ bị từ chối **không phải lỗi HTTP**: luôn trả 200, lý do nằm ở `status` và `reasonCode`.

## 3. Luồng chi tiết

### `createSession(accountId)`
1. `validateCanStartVerification`: `requireAccountExists` → `ACCOUNT_NOT_FOUND`. Đã xác minh → `NFC_ALREADY_VERIFIED`. `NfcAttemptTracker.ensureNotLocked` → `NFC_LOCKED` (kèm số phút).
2. Tạo mã phiên ngẫu nhiên 192 bit (32 ký tự base64url), hạn `nfc.session-ttl`.
3. Xóa phiên PENDING cũ của tài khoản, thêm phiên mới (khóa `synchronized` để hai lần tạo song song không cùng sống sót).

### `submitCard(sessionId, accountId, request)`
1. **[Giữ phiên]** `claimSession`, theo đúng thứ tự:
   - không có hoặc hết hạn → `SESSION_EXPIRED`;
   - của tài khoản khác → `SESSION_NOT_OWNED`;
   - đã dùng hoặc đang có thẻ khác xử lý → `SESSION_USED`;
   - hợp lệ → đặt `inFlight = true`.
2. **[Kiểm thẻ, trong một transaction]** `saveCardResult`:
   1. Khóa dòng tài khoản: `AccountService.lockForUpdate` (`FOR UPDATE`).
   2. Đã xác minh rồi → `SESSION_USED`.
   3. `NfcAttemptTracker.lockoutOf(accountId)` còn đang khóa → `LOCKED`. Khóa đã hết hạn được xóa khi đếm lần sai kế tiếp.
   4. `parseCard`: mở JWE và kiểm định dạng 9 trường. Không đạt → `BAD_FORMAT`.
   5. `findCardRejection`: CCCD hết hạn (theo giờ Việt Nam) → `CARD_EXPIRED`; số CCCD đã gắn tài khoản khác → `ID_ALREADY_LINKED`.
   6. Có lý do từ chối ở bước 4–5 → `countFailedAttempt`: `NfcAttemptTracker.recordFailure` đếm + 1; chạm `nfc.max-attempts` thì khóa `nfc.lockout-duration` và đếm về 0. Ghi sự kiện `nfc_failed` hoặc `nfc_locked`.
   7. Qua hết → lưu `LegalProfile` (băm, che, mã hóa; chỉ giữ `accountId`), `NfcAttemptTracker.clear`, ghi sự kiện `nfc_verified`.
3. **[Va chạm DB]** Hai tài khoản lưu cùng một CCCD đúng cùng lúc → khóa duy nhất bắt được → `ID_ALREADY_LINKED`.
4. **[Nhả phiên]** `releaseSession`: xác minh thành công → phiên thành VERIFIED (giữ tới hết hạn để web còn đọc được qua GET). Bị từ chối → phiên trở lại PENDING để thử lại.

## 4. Trường hợp biên & ghi chú

- Lần sai do **phiên** (`SESSION_*`) hoặc **đang khóa** (`LOCKED`) không bị tính vào bộ đếm. Chỉ `BAD_FORMAT`, `CARD_EXPIRED`, `ID_ALREADY_LINKED` mới bị tính (AC-04.9).
- `submitCard` dùng `TransactionTemplate` chứ không dùng `@Transactional`, vì gọi method trong cùng class sẽ bỏ qua proxy của Spring.
- Phiên trong RAM chỉ đúng khi chạy **một instance**. Nhiều instance thì phiên phải chuyển sang Redis.
# Plan v2: profile và address là tài nguyên của account, NFC là cơ chế

Ngày: 2026-10-30. Nhánh `refactor/identity-v2`, sau Phase 7. Đây là thay đổi ngoài plan, theo quyết định của người dùng trong phiên làm việc.

## 1. Quyết định

- **KYC là thuộc tính của profile** (`profiles.kyc_verified`), như `account_verified` là thuộc tính của account. NFC chỉ là cách đạt nó, như OTP là cách xác nhận email. Vì vậy module `kyc` được đổi thành `nfc` và chỉ còn là cơ chế, giống `otp`.
- **`profile` và `address` là tài nguyên của tài khoản.** Hai module này chỉ cung cấp API (`ProfileApi`, `AddressApi`) và không có controller. Mọi endpoint nằm ở `AccountController` của module `account`.
- Các package vẫn **phẳng**: `account`, `profile`, `address`, `nfc`, `otp`, `auth`.
- **Đường dẫn mới**, bộ "có `/profile`" đã chốt:

| Cũ | Mới |
| --- | --- |
| `GET /api/nfc/status` | `GET /api/accounts/me/profile/kyc` |
| `POST /api/nfc/sessions` | `POST /api/accounts/me/profile/kyc/nfc-sessions` |
| `GET /api/nfc/sessions/{id}` | `GET /api/accounts/me/profile/kyc/nfc-sessions/{id}` |
| `POST /api/nfc/sessions/{id}/card` | `POST /api/accounts/me/profile/kyc/nfc-sessions/{id}/card` |
| `GET\|POST /api/addresses`, `PUT\|DELETE /api/addresses/{id}` | `/api/accounts/me/addresses[/{id}]` |
| `GET /internal/nfc/status/{accountId}` | `GET /internal/accounts/{accountId}/profile/kyc` |
| `POST /internal/accounts/check` body `{accountId, idNumber}` | `POST /internal/accounts/{accountId}/profile/kyc/id-number-check` body `{idNumber}` |

Body và response giữ nguyên; riêng API kiểm số định danh không còn `accountId` trong body. Mã lỗi, message key và routing key `account.kyc_*` không đổi, payload sự kiện cũng không đổi.

## 2. Đã làm

**`nfc`** (thay `kyc`):
- Gốc package: `NfcApi` (`open`, `find`, `isLocked`, `check`), `NfcSessionId`, `NfcSessionView`, `NfcSessionStatus`, `SubmittedCard`, `CardHolder`, `CardVerdict`, `CardCheck`, `NfcReasonCode` (thêm `countsAsAttempt`), và `NfcError` (`NFC_002`–`NFC_004`).
- `check` giữ phiên, kiểm theo thứ tự Software Design 4.2 (phiên, khóa, seal, định dạng, hạn thẻ), rồi hỏi `CardVerdict` của bên gọi. Sau đó nó đếm lần sai, có thể khóa, và nhả phiên dù có chuyện gì xảy ra, kể cả khi verdict ném lỗi.
- Không ghi DB, không phát sự kiện, không có controller.
- Đổi tên: `KycLockout` → `NfcLockout`, `KycRules` → `NfcRules`, `KycAttemptStore` → `NfcAttemptStore`, `KycConfig`/`KycProperties` → `NfcConfig`/`NfcProperties`. Các thuộc tính `nfc.*` trong `application.yml` không đổi.

**`profile`:**
- `ProfileApi` thêm `findKyc`, `startKyc`, `findKycSession`, `submitKycCard`, `checkIdNumber`. Gốc package có thêm `ProfileKyc`, `KycStatus`, `IdNumberCheck`, `IdNumberHash`.
- `ProfileError` nhận `NFC_001` (`KYC_ALREADY_VERIFIED`) và `NFC_005` (`ID_NUMBER_INVALID`); code và message key giữ nguyên.
- `SubmitKycCard` là verdict:
  - băm số, gọi `CompleteKyc`;
  - nếu hoàn tất, ghi sự kiện `account.kyc_verified` trong cùng transaction với việc lưu thẻ;
  - lần sai bị đếm thì phát `kyc_failed`/`kyc_locked` sau khi `nfc` đếm xong.
- Băm số định danh (`HmacIdNumberHasher`) và outbox `OutboxKycEvents` chuyển từ `kyc` sang `profile`.
- `profile` **không còn phụ thuộc `account`**. Hướng phụ thuộc giờ là `account → profile → nfc`.

**`address`:** `AddressApi` (`list`, `add`, `edit`, `remove`), `AddressDraft` (đầu vào thô), `AddressView`. Việc parse bằng `FieldParser` chuyển từ request web vào `ParsedAddress` ở `application`. Thứ tự vẫn như cũ: kiểm body trước, id sau.

**`account`:**
- `AccountController` gom mọi endpoint `/api/accounts/me/**` và `/internal/accounts/**`.
- Endpoint nội bộ đặt cạnh endpoint public, đánh `@Hidden`, đúng mục Controller của `coding-rules.md`. `InternalKycController` cũ là controller riêng, trái với mục đó, nay đã bỏ.
- Use case: `GetMyAccount` (chuyển từ `profile`), `GetAccountKyc`, `CheckAccountIdNumber`. Tài khoản không tồn tại vẫn trả 404 `USER_001` như trước, kiểm ở `AccountQueries.get`.

**`shared`:** `CitizenId`, `LegalName`, `MaskedIdNumber` chuyển vào đây, vì cả `nfc` và `profile` đều dùng.

**Service khác:**
- vendor-service: `IdentityClient` dùng đường dẫn mới; `checkIdNumber(accountId, request)`; `CheckIdNumberRequest` chỉ còn `idNumber`.
- quotation-service: `IdentityClient` dùng đường dẫn mới.
- **Không sửa web và mobile** (theo yêu cầu). Web và app Moonkage Verify vẫn gọi đường dẫn cũ nên sẽ nhận 404 cho tới khi được sửa.

## 3. Test

- **Test đặc tả:** 15 snapshot đổi, đều chỉ ở trường `path`. Riêng `internal/check-missing` mất lỗi trường `accountId`, vì trường này đã lên path. Không đổi status, code, message hay data nào. Snapshot sự kiện không đổi.
- `Golden` che id phiên NFC theo `/nfc-sessions/…` thay cho `/sessions/…`.
- Test mới:
  - `nfc/CheckNfcCardTest`: kiểm cơ chế với một verdict giả. Có thêm ca verdict đếm và không đếm, và ca verdict ném lỗi mà phiên vẫn được nhả.
  - `profile/SubmitKycCardTest`: kiểm verdict và sự kiện, với `NfcApi` giả.
  - `profile/KycUseCasesTest`.
- Đã sửa: `NfcSessionUseCasesTest`, `GetMyAccountTest`, `ParallelRegistrationIntegrationTest` (bỏ quét `@RestController`, dùng `ProfileApi` giả).
- Luật kiến trúc: `rootDependsOnlyOnShared` đổi thành `rootDependsOnlySharedAndOtherContracts`. Gốc package của một module được phép dùng gốc package của module khác (vd `ProfileApi` trả `NfcSessionView`, `CardCheck`), nhưng vẫn không được dùng framework hay phần bên trong.

## 4. Hành vi đổi ngoài snapshot

1. Khi tài khoản đã KYC mà vẫn còn một phiên chờ, thẻ gửi vào không còn bị trả `SESSION_USED` ngay trước bước kiểm khóa. Nó qua các bước kiểm của `nfc` rồi mới nhận `SESSION_USED` (không đếm) từ `CompleteKyc`. Thực tế trường hợp này không xảy ra: tài khoản đã KYC thì không mở được phiên mới, và phiên vừa xác minh đã ở trạng thái VERIFIED.
2. Sự kiện `kyc_failed`/`kyc_locked` được ghi trong một transaction riêng, ngay sau khi lần sai được đếm. Trước đây nó chung transaction với cả bước kiểm thẻ. Bộ đếm vốn nằm trong RAM, không theo transaction, nên kết quả không đổi.

## 5. Việc của người khác

- Web (`nfc.ts`, `nfcStatusApi.ts`, `addressApi.ts`) và app Moonkage Verify cần chuyển sang đường dẫn mới.

## 6. Kết quả build

`./mvnw -pl identity-service,vendor-service,quotation-service -am clean verify`: BUILD SUCCESS, checkstyle và spotless qua (2026-10-30). Số test xanh: identity 366, vendor 169, quotation 38.

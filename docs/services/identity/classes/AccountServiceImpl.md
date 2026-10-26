# Class Log: `AccountServiceImpl`

> **Một câu:** cửa duy nhất để các component khác đọc và đổi tài khoản; entity `Account` và `AccountRepository` không rời package `account`.

- **Package:** `com.moonkage.identity.account` (public: `AccountService`, `AccountView`, `AccountCredentials`, `AccountResponse`, `NfcLockout`, `Role`, value object trong `account.vo`)
- **Tham chiếu:** `FR-01`, `FR-02`, `FR-03`, `FR-04`, `AC-01.3`, `AC-04.9`, `Q-04`
- **Dependencies:** `AccountRepository`, `UserProfileService` (họ tên cho `getMyAccount`), `AccountMapper`
- **Người gọi:** `AuthServiceImpl`, `AddressServiceImpl`, `NfcServiceImpl`, `LegalProfileServiceImpl`, `NfcProfileSeeder`, `JwtFilter`, `SecurityConfig` (`UserDetailsService`), `AccountController`

## 0. Luật bất biến

1. **Không trả entity ra ngoài.** Đọc thì trả `AccountView` (bản chụp chỉ đọc); đăng nhập thì `AccountCredentials` (kèm `PasswordHash`, in ra là `[PROTECTED]`).
2. **Một email, một số điện thoại chỉ thuộc một tài khoản** (AC-01.3). Email và số đã được `Email` / `PhoneNumber` chuẩn hóa nên mọi dạng nhập của cùng một số là một giá trị.
3. **Thay đổi tham gia transaction của người gọi** (`@Transactional` mặc định `REQUIRED`): `register` tạo tài khoản và hồ sơ trong cùng một transaction; khóa của `lockForUpdate` giữ tới khi transaction của người gọi kết thúc.
4. **Trạng thái khóa NFC nằm trên dòng `accounts`**, nhưng chính sách (số lần, thời gian khóa) thuộc `kyc`: `account` chỉ lưu và trả `NfcLockout`, không tự quyết khi nào khóa.

## 1. Danh mục Method

| Method | Output | ErrorCode có thể ném | Làm gì |
| --- | --- | --- | --- |
| `getMyAccount(accountId)` | `AccountResponse` | `ACCOUNT_NOT_FOUND`, `USER_PROFILE_NOT_FOUND` | `GET /api/accounts/me`: tài khoản + họ tên |
| `getAccount(accountId)` / `findAccount(accountId)` | `AccountView` / `Optional` | `ACCOUNT_NOT_FOUND` (chỉ `get`) | Đọc một tài khoản |
| `findByEmail(email)` | `Optional<AccountView>` | — | Tìm theo email (OTP) |
| `findCredentials(identifier)` | `Optional<AccountCredentials>` | — | Đăng nhập bằng email hoặc số điện thoại |
| `requireAccountExists(accountId)` | `void` | `ACCOUNT_NOT_FOUND` | Kiểm tồn tại (API nội bộ) |
| `createMember(email, phone, passwordHash)` | `AccountView` | `EMAIL_ALREADY_EXISTS`, `PHONE_ALREADY_EXISTS` | Tạo tài khoản `MEMBER` chưa xác nhận |
| `markVerified(accountId)` | `AccountView` | `ACCOUNT_NOT_FOUND` | Bật `accountVerified` |
| `changePassword(accountId, passwordHash)` | `void` | `ACCOUNT_NOT_FOUND` | Đổi mật khẩu, đặt `passwordChangedAt` |
| `lockForUpdate(accountId)` | `void` | `ACCOUNT_NOT_FOUND` | `SELECT … FOR UPDATE` dòng tài khoản |
| `getNfcLockout(accountId)` / `saveNfcLockout(accountId, lockout)` | `NfcLockout` / `void` | `ACCOUNT_NOT_FOUND` | Đọc / ghi bộ đếm sai và hạn khóa NFC |

## 2. Luồng chi tiết

### `createMember(email, phone, passwordHash)`
1. **[Kiểm tra]** Email đã có → `EMAIL_ALREADY_EXISTS`. Số đã có → `PHONE_ALREADY_EXISTS`.
2. **[Nghiệp vụ]** Tạo `Account` vai `MEMBER`, `accountVerified = false`.
3. **[Lưu trữ]** `saveAndFlush`: đẩy xuống DB ngay. Hai người đăng ký trùng đúng cùng lúc thì khóa duy nhất của DB chặn người thứ hai; tên khóa (`uk_accounts_email` / `uk_accounts_phone_number`) cho biết trùng email hay trùng số → vẫn ném 409 như bước 1, không ra 500. Vi phạm khác giữ nguyên.
4. **[Trả kết quả]** `AccountView`.

### `findCredentials(identifier)`
- Có `@` → tìm theo `Email.of(identifier)`. `PhoneNumber.isValid(identifier)` → tìm theo `PhoneNumber.of(identifier)`. Không phải cả hai → rỗng (Spring Security trả `INVALID_CREDENTIALS`).

### `changePassword(accountId, passwordHash)`
- Gán hash mới, `passwordChangedAt = bây giờ`. `AccountView.acceptsTokenIssuedAt(iat)` so `iat` với mốc này (cắt về giây) nên mọi token cũ hết hiệu lực (Q-04).

## 3. Ghi chú

- `DataInitializer` (cùng package) tạo tài khoản ADMIN lúc khởi động qua `AccountRepository` và `UserProfileService.createProfile`.
- Muốn tách hẳn bộ đếm NFC sang `kyc` thì cần migration chuyển `nfc_failed_attempts`, `nfc_locked_until` sang bảng riêng; hiện giữ trên `accounts` để khóa dòng tài khoản vẫn tuần tự hóa các lần gửi thẻ.

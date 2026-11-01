# Class Log: `AccountServiceImpl`

> **Một câu:** cửa duy nhất để các component khác đọc và đổi tài khoản; entity `Account` và `AccountRepository` không rời package `account`.

- **Package:** `com.moonkage.identity.account` (public: `AccountService`, `dto/` (`AccountView`, `AccountCredentials`, `AccountResponse`), atom trong `account.atom`: `Email`, `PhoneNumber`, `PasswordHash`, `Role`)
- **Tham chiếu:** `FR-01`, `FR-02`, `FR-03`, `FR-04`, `AC-01.3`, `Q-04`
- **Dependencies:** `AccountRepository`, `AccountMapper`, `Clock`. Không phụ thuộc component nào khác: `profile`, `address`, `kyc` phụ thuộc `account`, không có chiều ngược lại.
- **Người gọi:** `AuthServiceImpl`, `AddressServiceImpl`, `NfcServiceImpl`, `LegalProfileServiceImpl`, `NfcProfileSeeder`, `UserProfileServiceImpl`, `JwtFilter`, `SecurityConfig` (`UserDetailsService`)

## 0. Luật bất biến

1. **Không trả entity ra ngoài.** Đọc thì trả `AccountView` (bản chụp chỉ đọc); đăng nhập thì `AccountCredentials` (kèm `PasswordHash`, in ra là `[PROTECTED]`).
2. **Một email, một số điện thoại chỉ thuộc một tài khoản** (AC-01.3). Email và số đã được `Email` / `PhoneNumber` chuẩn hóa nên mọi dạng nhập của cùng một số là một giá trị.
3. **Thay đổi tham gia transaction của người gọi** (`@Transactional` mặc định `REQUIRED`): `register` tạo tài khoản và hồ sơ trong cùng một transaction; khóa của `lockForUpdate` giữ tới khi transaction của người gọi kết thúc.
4. **Entity `Account` tự giữ đúng thuộc tính của nó** ([domain-model-plan.md](../domain-model-plan.md)): service nạp entity, gọi method có tên nghiệp vụ (`confirmEmail`, `changePassword`), không tự gán field.
5. **Id là `String`**: `@GeneratedValue(strategy = UUID)`, JPA sinh khi lưu lần đầu.

## 1. Danh mục Method

| Method | Output | ErrorCode có thể ném | Làm gì |
| --- | --- | --- | --- |
| `getAccount(accountId)` / `findAccount(accountId)` | `AccountView` / `Optional` | `ACCOUNT_NOT_FOUND` (chỉ `get`) | Đọc một tài khoản |
| `findByEmail(email)` | `Optional<AccountView>` | — | Tìm theo email (OTP) |
| `findCredentials(identifier)` | `Optional<AccountCredentials>` | — | Đăng nhập bằng email hoặc số điện thoại |
| `requireAccountExists(accountId)` | `void` | `ACCOUNT_NOT_FOUND` | Kiểm tồn tại (API nội bộ) |
| `createMember(email, phone, passwordHash)` | `AccountView` | `EMAIL_ALREADY_EXISTS`, `PHONE_ALREADY_EXISTS` | Tạo tài khoản `MEMBER` chưa xác nhận |
| `confirmEmail(accountId)` | `AccountView` | `ACCOUNT_NOT_FOUND` | OTP khớp: bật `accountVerified` (chỉ một chiều) |
| `changePassword(accountId, passwordHash)` | `void` | `ACCOUNT_NOT_FOUND` | Đổi mật khẩu, đặt `passwordChangedAt` |
| `lockForUpdate(accountId)` | `void` | `ACCOUNT_NOT_FOUND` | `SELECT … FOR UPDATE` dòng tài khoản |

## 2. Luồng chi tiết

### `createMember(email, phone, passwordHash)`
1. **[Kiểm tra]** Email đã có → `EMAIL_ALREADY_EXISTS`. Số đã có → `PHONE_ALREADY_EXISTS`.
2. **[Nghiệp vụ]** `Account.registerMember(...)`: vai `MEMBER`, `accountVerified = false`; id do JPA sinh lúc `saveAndFlush`.
3. **[Lưu trữ]** `saveAndFlush`: đẩy xuống DB ngay. Hai người đăng ký trùng đúng cùng lúc thì khóa duy nhất của DB chặn người thứ hai; tên khóa (`uk_accounts_email` / `uk_accounts_phone_number`) cho biết trùng email hay trùng số → vẫn ném 409 như bước 1, không ra 500. Vi phạm khác giữ nguyên.
4. **[Trả kết quả]** `AccountView`.

### `findCredentials(identifier)`
- Có `@` → tìm theo `Email.of(identifier)`. `PhoneNumber.isValid(identifier)` → tìm theo `PhoneNumber.of(identifier)`. Không phải cả hai → rỗng (Spring Security trả `INVALID_CREDENTIALS`).

### `changePassword(accountId, passwordHash)`
- `account.changePassword(hash, Instant.now(clock))`: kiểm cả hai giá trị rồi mới gán, nên lần đổi bị từ chối không để lại entity sửa dở. `AccountView.acceptsTokenIssuedAt(iat)` so `iat` với mốc này (cắt về giây) nên mọi token cũ hết hiệu lực (Q-04).

## 3. Ghi chú

- Code không tạo tài khoản ADMIN: admin `admin@mk.com` chỉ có từ `db/seed/R__seed.sql` ([database.md](../../../guides/database.md#4-tài-khoản-mẫu)).
- `GET /api/accounts/me` (tài khoản + họ tên) do `UserProfileService.getMyAccount` ghép, vì `profile` nằm trên `account`.
- Bộ đếm và khóa NFC không còn trên `accounts` (db-identify.md): `kyc` giữ chúng trong bộ nhớ (`NfcAttemptTracker`).

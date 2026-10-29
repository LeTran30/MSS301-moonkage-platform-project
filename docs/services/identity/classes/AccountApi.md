# Class Log: `AccountApi`

> **Một câu:** cửa duy nhất để các module khác đọc và đổi tài khoản. Entity `Account`, `PasswordHash` và mọi thứ trong `account.domain`, `account.application`, `account.infrastructure` không rời module.

- **Package:** `com.moonkage.identity.account`. Gốc module là hợp đồng công khai: `AccountApi`, `AccountView`, `CredentialCheck`, `LoginIdentifier`, `RawPassword`, `AccountError`.
- **Hiện thực:** `application.AccountFacade` chuyển mỗi lời gọi tới use case `RegisterMember`, `ConfirmEmail`, `ChangePassword`, `VerifyCredentials`, hoặc tới `AccountQueries`.
- **Port:** `AccountRepository` (adapter `JpaAccountRepository`), `PasswordHasher` (adapter `BCryptPasswordHasher`).
- **Tham chiếu:** `FR-01`, `FR-02`, `AC-01.3`, `Q-04`; plan v2 mục 4.2.
- **Người gọi:** `AuthServiceImpl`, `UserProfileServiceImpl`, `JwtBearerAuthenticator`, `LoginSecurityConfig`. Chuyển tiếp tới Phase 6–7: `AddressServiceImpl`, `NfcServiceImpl`, `LegalProfileServiceImpl`, `NfcProfileSeeder`.

## 0. Luật bất biến

1. **Mật khẩu không rời module.** API nhận `RawPassword`, tự băm và tự so khớp. Module khác không thấy `PasswordHash`. Ngoại lệ chuyển tiếp: `findLoginRecord` cho luồng đăng nhập Spring Security, bỏ ở Phase 5.
2. **Một email, một số điện thoại chỉ thuộc một tài khoản** (AC-01.3). `RegisterMember` kiểm trước. Hai người đăng ký trùng đúng cùng lúc thì khóa duy nhất của DB chặn người sau, và `JpaAccountRepository.add` dịch tên khóa thành `EMAIL_ALREADY_EXISTS` / `PHONE_ALREADY_EXISTS`: vẫn 409, không ra 500.
3. **Id có từ lúc tạo.** `RegisterMember` xin `AccountId` (UUID v7) từ `IdGenerator`. Tài khoản mới được `persist` rồi `flush`, không `save`/`merge`. Cột vẫn là `varchar` tới Phase 8b.
4. **Thay đổi tham gia transaction của người gọi:** đăng ký tạo tài khoản và hồ sơ trong cùng một transaction.
5. **Entity tự giữ đúng thuộc tính:** chỉ `registerMember`, `confirmEmail` (một chiều) và `changePassword` (đặt cả `passwordChangedAt`) ghi được.

## 1. Danh mục Method

| Method | Output | ErrorCode có thể ném | Làm gì |
| --- | --- | --- | --- |
| `find(id)` / `findByEmail(email)` | `Optional<AccountView>` | — | Đọc một tài khoản |
| `registerMember(email, phone, password)` | `AccountView` | `EMAIL_ALREADY_EXISTS`, `PHONE_ALREADY_EXISTS` | Tạo `MEMBER` chưa xác nhận |
| `confirmEmail(id)` | `AccountView` | `NOT_FOUND` | OTP khớp: bật `verified` |
| `changePassword(id, password)` | `void` | `NOT_FOUND` | Đổi mật khẩu; token cũ hết hiệu lực (Q-04) |
| `verifyCredentials(identifier, password)` | `CredentialCheck` | — | Kiểm đăng nhập (xem mục 2) |
| `findLoginRecord(identifier)` | `Optional<LegacyLoginRecord>` | `INVALID_INPUT` | Chuyển tiếp, bỏ ở Phase 5 |
| `requireExists(accountId)` | `void` | `NOT_FOUND` | Chuyển tiếp, bỏ ở Phase 6 |
| `lockForUpdate(accountId)` | `void` | `NOT_FOUND` | Chuyển tiếp: `SELECT … FOR UPDATE`, bỏ ở Phase 7 |

`NOT_FOUND` giữ mã `USER_001`. Id không phải UUID được trả lời như tài khoản không tồn tại.

## 2. `verifyCredentials(identifier, password)`

`LoginIdentifier.parse`: có `@` thì là email, ngược lại là số điện thoại dạng trong nước (quyết định C1). Mật khẩu đăng nhập đi qua `RawPassword.forLogin`, chỉ đòi không rỗng, để mật khẩu đặt trước khi siết chính sách vẫn đăng nhập được.

| Tình huống | Kết quả | Vì sao |
| --- | --- | --- |
| Không có tài khoản | `Rejected`, sau một lần `dummyMatch` | Thời gian trả lời như sai mật khẩu, không dò được email nào có tài khoản |
| Sai mật khẩu | `Rejected` | Giống hệt trường hợp trên |
| Đúng mật khẩu, chưa xác nhận email | `NotActivated` | Chỉ nói "chưa kích hoạt" khi mật khẩu đã chứng minh người hỏi là chủ tài khoản |
| Đúng mật khẩu, đã xác nhận | `Accepted(AccountView)` | |

`dummyMatch` so mật khẩu với hash của một chuỗi ngẫu nhiên sinh lúc khởi động, cùng độ khó BCrypt với hash thật.

## 3. Ghi chú

- Code không tạo tài khoản ADMIN: admin `admin@mk.com` chỉ có từ `db/seed/R__seed.sql` ([database.md](../../../guides/database.md#4-tài-khoản-mẫu)).
- `GET /api/accounts/me` (tài khoản + họ tên) do `UserProfileService.getMyAccount` ghép.
- Test: `VerifyCredentialsTest` (bốn nhánh), `AccountFacadeTest`, `JpaAccountRepositoryIntegrationTest`, `ParallelRegistrationIntegrationTest` (đăng ký song song trên PostgreSQL thật).

# Xác thực (FR-01, FR-02)

Cách làm theo project Capstone (E-commerce): `Account` có vai (`Role` enum), JWT không lưu DB (jjwt), OTP giữ trong bộ nhớ và gửi qua email (sự kiện RabbitMQ, orchestrator-service gửi), `JwtFilter` + `@CurrentUser`.

Mọi request đi qua gateway `http://localhost:8080`. Prefix của identity-service: `/identity-service/api/auth`.

Kế hoạch đưa entity về hướng rich entity (entity tự giữ đúng thuộc tính của nó): [domain-model-plan.md](domain-model-plan.md).

## Dữ liệu

| Bảng | Vai trò |
|---|---|
| `accounts` | Thông tin đăng nhập: email (bắt buộc), phone_number, password_hash (BCrypt), `account_verified` (đã xác nhận email bằng OTP), `role` (`MEMBER` / `ADMIN`, D-19; không có bảng role), `password_changed_at`, bộ đếm khóa xác minh NFC |

**Trạng thái của một tài khoản** (Requirement 7.1) chỉ có hai chiều độc lập: **xác nhận email** (`account_verified`: chưa thì không đăng nhập được, nên cũng không mua, không gửi yêu cầu, không nhận mã đặt lại mật khẩu) và **xác minh NFC** (chưa / đã / tạm khóa 15 phút; `profiles.kyc_verified`, cùng bộ đếm khóa trong RAM). Không có trạng thái "bị quản trị khóa": requirement không có chức năng này (FR-46 khóa *người bán* ở vendor-service, không khóa tài khoản).
| `profiles` | Họ tên hiển thị (full_name do người dùng nhập) và danh tính pháp lý sau KYC (`kyc_verified`, `legal_name`, mã băm và dạng che của số CCCD). Khóa chính là `account_id`. Không chứa email/số điện thoại: hai trường này chỉ nằm ở `accounts` |

Mỗi người chỉ có **một id là `accountId`** (= `sub` trong JWT). `addresses.account_id` và `vendors.owner_account_id` trỏ vào `accounts`. Thông tin pháp lý từ thẻ NFC (FR-04) nằm ngay trong `profiles`; số CCCD chỉ lưu dạng băm và dạng che.

Schema do Flyway quản lý (`db/migration`), dữ liệu mẫu ở `db/seed`; xem [`docs/guides/database.md`](../../guides/database.md).

Không có bảng refresh token và không có bảng mã OTP.

## Cấu trúc mã (package-by-component)

Mỗi package cấp một dưới `com.moonkage.identity` là một **module**. Code đang được dựng lại theo [plan v2](identity-service-refactor-plan.md): module đã dựng lại (`account`, `otp`, `auth`, `profile`, `kyc`) có hợp đồng ở gốc package (`<Module>Api`, view, value object, `<Module>Error`) và bên trong chia `domain/`, `application/`, `infrastructure/`. Module chưa dựng lại vẫn là **component** cũ: bên ngoài chỉ thấy interface `*Service` và DTO / value object; entity, repository, `*ServiceImpl`, mapper đều package-private. `web` là tầng HTTP nằm ngoài mọi component.

| Package | Sở hữu (bảng / dữ liệu) | Public | Phụ thuộc |
|---|---|---|---|
| `web` | — | Controller của component cũ: `AddressController` | mọi service public |
| `auth` | — (đăng ký, xác nhận email, đăng nhập, làm mới phiên, đặt lại mật khẩu) | `AuthError`; controller `/api/auth/**` nằm trong module ([Auth.md](classes/Auth.md)) | `account`, `profile`, `otp` |
| `account` | `accounts` | `AccountApi`, `AccountView`, `CredentialCheck`, `LoginIdentifier`, `RawPassword`, `AccountError` ([AccountApi.md](classes/AccountApi.md)) | — |
| `profile` | `profiles`; ghép `GET /api/accounts/me` | `ProfileApi`, `FullName`, `LegalIdentity` và các value object của nó, `KycCompletion`, `ProfileError` | `account` |
| `address` | `addresses` | `AddressService`, `address.dto` | `account` |
| `kyc` | phiên NFC và bộ đếm/khóa NFC (RAM); ghi KYC qua `ProfileApi` | `KycError`; controller `/api/nfc/**`, `/internal/nfc/**`, `/internal/accounts/check` nằm trong module | `account`, `profile` |
| `otp` | mã OTP (RAM) | `OtpApi`, `OtpCode`, `OtpPurpose`, `OtpError` ([OtpApi.md](classes/OtpApi.md)) | — |
| `shared` | — (ngôn ngữ chung, Java thuần) | `Email`, `PhoneNumber`, `Role`, `AccountId`, `IdGenerator`, `ValueRejected`, `ErrorCode`, `AppException`, `CommonError` | — |
| `platform` | `outbox_events` | cấu hình, `ApiResponse`, `GlobalExceptionHandler`, `FieldParser`, `BearerTokenFilter` + SPI `BearerTokenAuthenticator`, `CurrentUser(Info)`, `BearerTokenError`, `BaseEntity`, `ExpiringMap`, `Outbox` ([Outbox.md](classes/Outbox.md)) | `shared` |

Mọi module đều dùng `shared` và `platform`; hai module này không phụ thuộc module nghiệp vụ nào. Giữa hai component chỉ có liên kết bằng id (`addresses.account_id`, `profiles.account_id`), không có quan hệ JPA chéo; khóa ngoại vẫn nằm ở DB. Luật được kiểm bằng `ModuleArchitectureTest` (module đã dựng lại: ngoài module chỉ dùng gốc package; tầng `domain`/`application`/`infrastructure`; không `*Impl`/`*Service`/`*Mapper`/`*Constant`; id không do JPA sinh), `FoundationArchitectureTest` (`shared`, `platform`), `ComponentArchitectureTest` (component cũ: entity, repository, `*ServiceImpl` không public; controller chỉ ở `web`; không ai phụ thuộc `web`; entity không phụ thuộc Spring Security), `DomainModelArchitectureTest` (rich entity: không có đường ghi công khai vào entity, thời gian lấy từ bean `Clock`; xem [domain-model-plan.md](domain-model-plan.md#luật-máy-kiểm)) và `ArchitectureTest.NO_PACKAGE_CYCLES`.

Endpoint nội bộ `/internal/**` nằm trong module sở hữu dữ liệu, ở `infrastructure/web/internal/` (vd `InternalKycController`), đánh `@Hidden`.

## Token

| Token | Claim | Hạn |
|---|---|---|
| Access (`token`) | `sub`=accountId, `type=ACCESS`, `role`, `iat`, `exp` | 12 giờ (`JWT_EXPIRATION`) |
| Refresh (`refreshToken`) | `sub`=accountId, `type=REFRESH`, `iat`, `exp` | 7 ngày (`JWT_REFRESH_EXPIRATION`) |

Đúng các claim của Software Design mục 8. Không còn claim `accountId` (trùng `sub`) và `account_verified` (luôn `true`, vì tài khoản chưa xác nhận không đăng nhập được): client đọc id từ `sub`.

Cả hai đều là JWT HS256, ký bằng `jwt.secret` (dạng Base64). Mỗi lần gọi `/refresh-token` sẽ nhận một cặp mới. Refresh token **không dùng thay access token được**: identity-service và gateway đều kiểm tra claim `type`.

**Đăng xuất:** vì token không lưu trên server, frontend chỉ cần xóa `token` và `refreshToken`. Token cũ vẫn hợp lệ đến khi hết hạn.

**Đặt lại mật khẩu cắt mọi phiên cũ:** identity-service từ chối mọi token (access và refresh) có `iat` trước `password_changed_at`. Gateway không tra DB nên access token cũ vẫn đi qua gateway tới service khác cho đến khi hết hạn (tối đa 12 giờ); refresh token cũ thì không đổi được cặp mới.

## Endpoint

| Method | Path | Auth | Body | Kết quả |
|---|---|---|---|---|
| POST | `/register` | – | `{email, phoneNumber?, fullName, password}` | 200 `RegisterAccountResponse` (`verified: false`, `otpSent`), gửi OTP qua email |
| POST | `/verify-account` | – | `{email, otp}` | 200 `VerifyAccountResponse` `{id, email, phoneNumber, verified: true}` |
| POST | `/send-verify-account-otp` | – | `{email}` | 200; 503 nếu gửi email thất bại |
| POST | `/login` | – | `{username, password}` (`username` = email **hoặc** số điện thoại) | 200 `LoginResponse` |
| POST | `/refresh-token` | – | `{refreshToken}` | 200 `LoginResponse` với cặp token mới |
| GET | `/api/accounts/me` | Bearer | – | 200 `AccountResponse` `{accountId, email, phoneNumber, fullName, role}` (như `LoginResponse` nhưng không có token) |
| POST | `/send-reset-password-otp` | – | `{email}` | 200 (luôn luôn). Chỉ gửi nếu email đã xác nhận (AC-02.1) |
| POST | `/reset-password` | – | `{email, otp, newPassword}` | 200 |

```json
// LoginResponse (nội dung của "data")
{ "token": "...", "refreshToken": "...", "accountId": "...",
  "email": "lan@example.com", "phoneNumber": "912345678", "fullName": "Nguyen Lan",
  "role": "MEMBER" }
```

**Số điện thoại** chỉ nhận dạng trong nước `0912345678` (đầu số di động 3/5/7/8/9; quyết định C1, `+84…`/`84…` bị từ chối) và luôn được lưu dưới dạng **9 số cuối** (`912345678`) bởi value object `PhoneNumber` — dạng duy nhất được lưu (cả `accounts.phone_number` lẫn `addresses.recipient_phone`), so sánh và trả về. Kiểm trùng (AC-01.3) và đăng nhập so theo dạng 9 số này. API trả `phoneNumber` / `recipientPhone` dạng 9 số; frontend tự thêm `0` khi hiển thị.

**Gửi email thất bại (FR-01):** `/register` vẫn tạo tài khoản nhưng trả `"otpSent": false`; frontend hiện thông báo và nút "Gửi lại mã" (gọi `/resend-otp`), không bắt đăng ký lại (sẽ bị 409). `/resend-otp` thất bại thì trả 503. Riêng `/send-reset-password-otp` vẫn luôn trả 200 để không lộ email nào đã đăng ký.

Thông tin người bán **không** còn nằm trong `LoginResponse` (Vendor đã chuyển sang vendor-service). Frontend gọi `GET /vendor-service/api/seller/vendor` (Bearer): 200 trả `{id, ownerAccountId, legalName, status, supplySource, sellsShop, acceptsOrders}`, 404 nghĩa là tài khoản chưa có hồ sơ người bán (trước đây là `vendorStatus: "NONE"`).

## OTP

- 6 chữ số, có hiệu lực 5 phút (`otp.expiration`). Nhập sai 5 lần (`otp.max-attempts`) thì email bị khóa nhập mã 15 phút (`otp.lockout-duration`). Gửi lại mã cách nhau ít nhất 60 giây, tối đa 5 lần mỗi giờ.
- Mã được giữ trong bộ nhớ của identity-service, theo **mục đích và email**: mã xác nhận đăng ký không dùng được để đặt lại mật khẩu, và ngược lại. Khởi động lại service thì mã đang chờ sẽ mất, người dùng chỉ cần gửi lại. Chỉ đúng khi chạy một instance identity-service.
- identity-service chỉ phát sự kiện `orchestrator.email.identity`; việc gửi mail (và chế độ in mã ra log khi để trống `MAIL_HOST`) do orchestrator-service làm. Tiêu đề email nằm trong `messages.properties` (`email.subject.*`).
- **Gửi mail thật:** đặt các biến `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` (ví dụ Gmail App Password).

## Lỗi

Thành công và lỗi dùng **một dạng body** `ApiResponse<T>` (Software Design 5.1 quy tắc 8): `{status, code, message, data, timestamp}`. Thành công: `code = "SUCCESS"`, `message = "OK"`, dữ liệu nằm trong `data` (các ví dụ `LoginResponse`, `AddAddressResponse` trong tài liệu này là nội dung của `data`). Lỗi: `code` là mã nghiệp vụ (`ErrorCode`), `message` là câu cho người dùng, `data = null`, thêm `path`; lỗi validation thêm `errors`. API nội bộ `/internal/**` trả thẳng dữ liệu, không bọc.

```json
{ "status": 200, "code": "SUCCESS", "message": "OK",
  "data": { "token": "...", "refreshToken": "...", "role": "MEMBER" }, "timestamp": "2026-10-19T03:00:00Z" }

{ "status": 409, "code": "AUTH_007", "message": "Email lan@example.com đã được sử dụng.", "data": null,
  "path": "/api/auth/register", "timestamp": "2026-10-19T03:00:00Z" }

{ "status": 400, "code": "COMMON_400", "message": "Dữ liệu đầu vào không hợp lệ.", "data": null,
  "errors": [ { "field": "email", "message": "Email không đúng định dạng" } ], "path": "...", "timestamp": "..." }
```

`DELETE` trả 204 không có body.

| HTTP | Khi nào |
|---|---|
| 400 | Validation (`COMMON_400`, kèm `errors`), JSON sai dạng (`COMMON_400_JSON`), OTP sai hoặc hết hạn |
| 401 | Sai thông tin đăng nhập (một câu chung cho mọi trường hợp, FR-02), token thiếu, sai, hết hạn, hoặc phát trước lần đặt lại mật khẩu |
| 403 | Tài khoản chưa xác nhận email (`AUTH_002`) |
| 404 | Không tìm thấy tài nguyên, hoặc tài nguyên thuộc người khác (ví dụ địa chỉ) |
| 409 | Email hoặc số điện thoại đã được dùng (AC-01.3) |
| 429 | Gửi lại mã quá sớm, quá số lần mỗi giờ, hoặc nhập sai mã quá số lần |
| 503 | Không gửi được email chứa mã xác nhận; người dùng thử gửi lại mã |

"Chưa kích hoạt" hoặc "bị khóa" **chỉ** được báo khi mật khẩu đúng, để người lạ không dò được email nào đã đăng ký.

## Địa chỉ giao hàng (FR-03)

Prefix `/identity-service/api/addresses`, mọi endpoint cần Bearer token. Chỉ thao tác trên địa chỉ của chính mình; id của người khác trả 404 như id không tồn tại.

| Method | Path | Body | Kết quả |
|---|---|---|---|
| GET | `` | – | 200 danh sách, địa chỉ mặc định đứng đầu, sau đó mới nhất trước |
| POST | `` | `AddAddressRequest` | 201 `AddAddressResponse` |
| PUT | `/{addressId}` | `AddAddressRequest` (thay toàn bộ) | 200 `AddAddressResponse` |
| DELETE | `/{addressId}` | – | 204 |

```json
// SaveAddressRequest
{ "recipientName": "Nguyễn Lan", "recipientPhone": "0912345678",
  "provinceCode": "79",
  "wardCode": "26734", "wardName": "Phường Sài Gòn",
  "detail": "12 Lê Lợi", "label": "Văn phòng", "isDefault": true }

// AddressResponse (nội dung của "data")
{ "id": "...", "recipientName": "Nguyễn Lan", "recipientPhone": "912345678",
  "provinceCode": "79", "provinceName": "Thành phố Hồ Chí Minh",
  "wardCode": "26734", "wardName": "Phường Sài Gòn", "detail": "12 Lê Lợi",
  "fullAddress": "12 Lê Lợi, Phường Sài Gòn, Thành phố Hồ Chí Minh",
  "areaCode": "79", "label": "Văn phòng", "isDefault": true,
  "createdAt": "2026-10-17T11:30:17Z", "updatedAt": "2026-10-17T11:30:17Z" }
```

- **Hai cấp hành chính** (từ 01/07/2025): tỉnh/thành → phường/xã/đặc khu, không có quận/huyện. Client gửi `provinceCode` 2 chữ số (phải có trong danh mục quốc gia) và tên phường/xã. Server đặt `provinceName` theo mã từ danh mục; `provinceName` client gửi vẫn được nhận nhưng bị bỏ qua (quyết định C3). Server chưa kiểm phường/xã có thuộc tỉnh không.
- `recipientPhone`: chỉ nhận dạng `0912…` (C1); luôn lưu và trả về dạng 9 số `912…` như `phoneNumber` của tài khoản. `label` tùy chọn, tối đa 30 ký tự.
- `areaCode`: chỉ có trong response, luôn bằng `provinceCode` (vùng giao là tỉnh/thành, Q-12). Cùng bộ mã với vùng giao của người bán.
- **Mặc định (AC-03.1):** luôn có tối đa một. Địa chỉ đầu tiên tự thành mặc định. Gửi `isDefault: true` thì địa chỉ đó thành mặc định, địa chỉ mặc định cũ bị bỏ cờ. Khi PUT, bỏ trống `isDefault` thì giữ nguyên cờ hiện tại. Xóa địa chỉ mặc định thì tài khoản không còn địa chỉ mặc định.
- **Địa chỉ "đang chọn" (AC-03.2)** do frontend giữ (mặc định là địa chỉ `isDefault`), không lưu ở server. Frontend truyền `areaCode` của địa chỉ đang chọn khi gọi danh sách sản phẩm / người bán.
- Sửa hoặc xóa địa chỉ không ảnh hưởng đơn đã đặt, vì đơn chép địa chỉ lúc tạo.

## Gateway

- Gateway kiểm tra access token. Nó xóa các header `X-User-Id`, `X-Account-Id`, `X-User-Role` do client tự gửi lên, rồi gắn `X-Account-Id` (= `sub`) và `X-User-Role` từ token. Các service khác đọc danh tính người dùng từ hai header này. `X-User-Id` không còn được gắn.
- Không cần token: `/identity-service/api/auth/**`, và `GET` vào products, order-profiles, reviews của catalog-service (FR-04).
- Tài khoản chưa xác nhận OTP thì không đăng nhập được, nên mọi token đều thuộc tài khoản đã xác nhận (AC-01.2).

## Cấu hình (`../../.env`)

Mọi giá trị cấu hình nằm trong file **`../../.env` ở thư mục gốc repo**. File này đã có trong `../../.gitignore` nên không bị commit. `application.yml` chỉ tham chiếu `${VAR}` và không chứa giá trị nào. `DotEnvConfig.loadDotEnv()` trong `main()` của mọi service đi ngược từ thư mục đang chạy lên các thư mục cha để tìm `.env`. Vì vậy chạy từ thư mục module, từ `../api` hay từ gốc repo đều được. Biến môi trường thật của hệ điều hành được ưu tiên hơn giá trị trong `.env`.

Cách thiết lập cho thành viên mới:

```bash
cp .env.example .env
openssl rand -base64 48   # dán kết quả vào JWT_SECRET
```

Thiếu `../../.env` hoặc thiếu một biến thì service dừng ngay khi khởi động với lỗi `Could not resolve placeholder 'TEN_BIEN'`.

| Biến | Ghi chú |
|---|---|
| `DB_USERNAME`, `DB_PASSWORD` | Dùng chung cho 4 container Postgres |
| `IDENTITY_DB_HOST/PORT`, `CATALOG_DB_*`, `TENDER_DB_*`, `ORDER_DB_*` | Mỗi service một DB (cổng 5441–5444 khi chạy từ IDE). Trong Docker, compose tự đổi sang tên container |
| `EUREKA_URL` | `http://localhost:8761/eureka/`; trong Docker tự đổi thành `http://discovery-server:8761/eureka/` |
| `JWT_SECRET` | Chuỗi Base64, ít nhất 32 byte. identity-service và api-gateway đọc **cùng một** giá trị này |
| `JWT_EXPIRATION` / `JWT_REFRESH_EXPIRATION` | Đơn vị mili giây (12 giờ / 7 ngày) |
| `OTP_EXPIRATION` / `OTP_MAX_ATTEMPTS` | `5m` / `5` |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | Để trống `MAIL_HOST` thì OTP được in ra log thay vì gửi mail |
| `SEED_PASSWORD` | Mật khẩu chung của tài khoản mẫu, kể cả admin `admin@mk.com` (chỉ dev, [database.md](../../guides/database.md#4-tài-khoản-mẫu)) |
| `CORS_ORIGINS` | Gateway, nhiều giá trị thì ngăn bằng dấu phẩy |

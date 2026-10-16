# Cây thư mục module `identity-service`

> Đường dẫn module: `backend/identity-service`
> Cập nhật: 2026-10-16 — sau khi tách `security/`, chuyển `ErrorResponse` sang `dto/response`,
> gộp `AuthValidation` vào `service/`, đổi tên template `REGIS.html` → `REGISTRATION.html`.

```
.
├── Dockerfile
├── docs
│   ├── directory-structure.md
├── pom.xml
├── src
│   ├── main
│   │   ├── java
│   │   │   ├── com
│   │   │   │   ├── bake2b
│   │   │   │   │   ├── identity
│   │   │   │   │   │   ├── common
│   │   │   │   │   │   │   ├── exception
│   │   │   │   │   │   │   │   ├── CustomException.java
│   │   │   │   │   │   │   │   ├── EmailAlreadyExistsException.java
│   │   │   │   │   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   │   │   │   │   ├── InvalidCredentialsException.java
│   │   │   │   │   │   ├── config
│   │   │   │   │   │   │   ├── DataInitializer.java
│   │   │   │   │   │   │   ├── DotEnvConfig.java
│   │   │   │   │   │   │   ├── OpenApiConfig.java
│   │   │   │   │   │   │   ├── WebMvcConfig.java
│   │   │   │   │   │   ├── controller
│   │   │   │   │   │   │   ├── AddressController.java
│   │   │   │   │   │   │   ├── AuthController.java
│   │   │   │   │   │   │   ├── InternalVendorController.java
│   │   │   │   │   │   │   ├── VendorController.java
│   │   │   │   │   │   ├── dto
│   │   │   │   │   │   │   ├── request
│   │   │   │   │   │   │   │   ├── AccountCreateRequest.java
│   │   │   │   │   │   │   │   ├── ForgotPasswordRequest.java
│   │   │   │   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   │   │   │   ├── RefreshTokenRequest.java
│   │   │   │   │   │   │   │   ├── ResetPasswordRequest.java
│   │   │   │   │   │   │   │   ├── VerifyRequest.java
│   │   │   │   │   │   │   ├── response
│   │   │   │   │   │   │   │   ├── AccountCreateResponse.java
│   │   │   │   │   │   │   │   ├── ErrorResponse.java
│   │   │   │   │   │   │   │   ├── LoginResponse.java
│   │   │   │   │   │   │   │   ├── VendorInternalResponse.java
│   │   │   │   │   │   ├── entity
│   │   │   │   │   │   │   ├── Account.java
│   │   │   │   │   │   │   ├── Address.java
│   │   │   │   │   │   │   ├── AuditLog.java
│   │   │   │   │   │   │   ├── BankAccount.java
│   │   │   │   │   │   │   ├── BaseEntity.java
│   │   │   │   │   │   │   ├── Role.java
│   │   │   │   │   │   │   ├── User.java
│   │   │   │   │   │   │   ├── VendorDocument.java
│   │   │   │   │   │   │   ├── Vendor.java
│   │   │   │   │   │   ├── enums
│   │   │   │   │   │   │   ├── AccountStatus.java
│   │   │   │   │   │   │   ├── SupplySource.java
│   │   │   │   │   │   │   ├── VendorDocumentType.java
│   │   │   │   │   │   │   ├── VendorEntityType.java
│   │   │   │   │   │   │   ├── VendorStatus.java
│   │   │   │   │   │   ├── IdentityServiceApplication.java
│   │   │   │   │   │   ├── repository
│   │   │   │   │   │   │   ├── AccountRepository.java
│   │   │   │   │   │   │   ├── AddressRepository.java
│   │   │   │   │   │   │   ├── AuditLogRepository.java
│   │   │   │   │   │   │   ├── RoleRepository.java
│   │   │   │   │   │   │   ├── UserRepository.java
│   │   │   │   │   │   │   ├── VendorDocumentRepository.java
│   │   │   │   │   │   │   ├── VendorRepository.java
│   │   │   │   │   │   ├── security
│   │   │   │   │   │   │   ├── CurrentUserArgumentResolver.java
│   │   │   │   │   │   │   ├── CurrentUserInfo.java
│   │   │   │   │   │   │   ├── CurrentUser.java
│   │   │   │   │   │   │   ├── JwtFilter.java
│   │   │   │   │   │   │   ├── SecurityConfig.java
│   │   │   │   │   │   ├── service
│   │   │   │   │   │   │   ├── AddressService.java
│   │   │   │   │   │   │   ├── AuthService.java
│   │   │   │   │   │   │   ├── EmailService.java
│   │   │   │   │   │   │   ├── impl
│   │   │   │   │   │   │   │   ├── AddressServiceImpl.java
│   │   │   │   │   │   │   │   ├── AuthServiceImpl.java
│   │   │   │   │   │   │   │   ├── EmailServiceImpl.java
│   │   │   │   │   │   │   │   ├── TokenServiceImpl.java
│   │   │   │   │   │   │   │   ├── VendorServiceImpl.java
│   │   │   │   │   │   │   ├── TokenService.java
│   │   │   │   │   │   │   ├── VendorService.java
│   │   ├── resources
│   │   │   ├── application.yml
│   │   │   ├── templates
│   │   │   │   ├── FORGOT_PASSWORD.html
│   │   │   │   ├── REGISTRATION.html
│   ├── test
│   │   ├── java
│   │   │   ├── com
│   │   │   │   ├── bake2b
│   │   │   │   │   ├── identity
│   │   │   │   │   │   ├── service
│   │   │   │   │   │   │   ├── impl
│   │   │   │   │   │   │   │   ├── EmailServiceImplTest.java
```

## Giải thích các gói chính

| Gói / Thư mục | Vai trò |
|---|---|
| `common` | Chỉ còn `common/exception` chứa các exception tuỳ chỉnh + `GlobalExceptionHandler`. |
| `config` | Chỉ còn cấu hình "thuần" không liên quan bảo mật: nạp dữ liệu khởi tạo (`DataInitializer`), cấu hình `.env` (`DotEnvConfig`), OpenAPI (`OpenApiConfig`), và đăng ký argument resolver cho MVC (`WebMvcConfig`). |
| `security` | Toàn bộ thành phần bảo mật/runtime-auth: `SecurityConfig`, `JwtFilter`, annotation `@CurrentUser`, `CurrentUserArgumentResolver` và DTO nguyên tắc đi kèm `CurrentUserInfo` — gom một chỗ vì chúng luôn thay đổi cùng nhau. |
| `controller` | Các REST controller: xác thực (`AuthController`), địa chỉ, vendor (public & internal). |
| `dto/request` | DTO cho request của API (đăng nhập, đăng ký, quên/đặt lại mật khẩu, refresh token...). |
| `dto/response` | DTO trả về cho client, bao gồm cả `ErrorResponse` (chuyển từ `common/exception` sang vì bản chất nó là response DTO, không phải exception). |
| `entity` | Các entity JPA: `Account`, `User`, `Role`, `Address`, `Vendor`, `VendorDocument`, `BankAccount`, `AuditLog`, cùng lớp cơ sở `BaseEntity` (chuyển từ `common/` sang vì chỉ các entity mới kế thừa nó). |
| `enums` | Các enum trạng thái/loại: `AccountStatus`, `VendorStatus`, `VendorEntityType`, `VendorDocumentType`, `SupplySource`. |
| `repository` | Spring Data JPA repository tương ứng với từng entity. |
| `service` / `service.impl` | Interface service và implementation nghiệp vụ. `AuthenticationService`/`AuthenticationServiceImpl` đổi tên ngắn gọn thành `AuthService`/`AuthServiceImpl` (quy ước phổ biến hơn). Logic kiểm tra email/số điện thoại trùng lặp (trước đây là class `AuthValidation` riêng) đã được gộp thành private method `validateUniqueness` trong `AuthServiceImpl` vì nó chỉ có một method, chỉ dùng ở một nơi, và dùng chung `AccountRepository` đã inject sẵn. |
| `resources` | `application.yml` (đổi từ `application.properties`) và template email HTML: `FORGOT_PASSWORD.html`, `REGISTRATION.html` (đổi tên từ `REGIS.html` cho nhất quán). |
| `src/test` | Unit test, hiện có `EmailServiceImplTest`. |

## Thay đổi so với lần trước

- Tách `security/` khỏi `config/`: `SecurityConfig`, `JwtFilter`, `CurrentUser`, `CurrentUserArgumentResolver` di chuyển từ `config/` sang `security/`.
- `CurrentUserInfo` chuyển từ `common/` sang `security/` để nằm cùng annotation và resolver liên quan (trước đó khái niệm bị chia hai nơi).
- `ErrorResponse` chuyển từ `common/exception/` sang `dto/response/` (đúng bản chất là response DTO).
- Package `validate/` bị xoá; `AuthValidation` được gộp thành private method `validateUniqueness` ngay trong `AuthenticationServiceImpl` (không còn là class/bean riêng vì chỉ bọc một lệnh gọi repository, dùng ở đúng một nơi).
- Template `REGIS.html` đổi tên thành `REGISTRATION.html` cho nhất quán với `FORGOT_PASSWORD.html`.
- `AuthenticationController`/`AuthenticationService`/`AuthenticationServiceImpl` đổi tên thành `AuthController`/`AuthService`/`AuthServiceImpl` — tiền tố `Auth` phổ biến hơn trong codebase/convention chung. Các class `Authentication*` của Spring Security (`AuthenticationManager`, `AuthenticationException`,...) giữ nguyên vì thuộc framework, không đụng tới.
- `application.properties` chuyển sang `application.yml` (YAML), cấu trúc phân cấp theo `spring.*`, `eureka.*`, `jwt.*`, `otp.*`, `app.*`; các giá trị nhúng trong map kiểu `Properties` (`spring.mail.properties.*`, `spring.jpa.properties.hibernate.*`) được quote thành chuỗi để giữ đúng kiểu dữ liệu gốc. Đã kiểm chứng bằng cách chạy thử `spring-boot:run` với biến môi trường giả — tất cả placeholder `${...}` và cấu hình nested đều bind đúng.
- `BaseEntity` chuyển từ `common/` sang `entity/` vì chỉ các entity JPA mới kế thừa lớp này.

*Lưu ý: cây thư mục bỏ qua `target/`, `.git/`, `node_modules/` (build artifact và thư mục hệ thống).*

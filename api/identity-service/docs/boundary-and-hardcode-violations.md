# Đánh giá Boundary và Vi phạm Quy tắc Không Hardcode - Identity Service

> **Dự án**: MoonKage Platform  
> **Module**: `identity-service`  
> **Tài liệu đối chiếu**: `Software_Design_v0.6.md`, `Requirement Final (v1.6)`, `auth.md`  
> **Mục tiêu**: Rà soát ranh giới nghiệp vụ (boundary) và loại bỏ toàn bộ các điểm hardcode trong module.

---

## 1. Vi phạm Boundary & Kiến trúc hệ thống

### 1.1. Vi phạm mô hình Role hệ thống (Thiết kế D-19)

- **Vị trí vi phạm**:
  - [`DataInitializer.java:47-49`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/config/DataInitializer.java#L47-L49)
  - [`AuthServiceImpl.java:42`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/service/impl/AuthServiceImpl.java#L42)
  - [`Role.java:15`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/entity/Role.java#L15)
- **Mô tả**:
  - `identity-service` hiện đang định nghĩa và tạo 3 vai trò: `CUSTOMER`, `SELLER`, `ADMIN`.
- **Quy chuẩn kiến trúc (D-19 trong `Software_Design_v0.6.md`)**:
  > *"Hai vai `MEMBER`, `ADMIN` (thay `CUSTOMER` của `../../../docs/iden-service/auth.md` và `USER` của v0.5); chủ người bán **không phải vai**. Quyền chủ không nằm trong JWT, service tự tra bản sao người bán theo `sub`."*
- **Tác động**:
  - `identity-service` đang xâm phạm ranh giới của `vendor-service` khi coi "Người bán" là một quyền/role do identity cấp.
  - Role mặc định khi người dùng đăng ký (`AuthServiceImpl.DEFAULT_ROLE`) đang là `"CUSTOMER"` thay vì `"MEMBER"`.

---

### 1.2. Phụ thuộc dữ liệu của `vendor-service` trong Seeder

- **Vị trí vi phạm**:
  - [`DataInitializer.java:60-68`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/config/DataInitializer.java#L60-L68)
  - [`application.yml:57-59`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/resources/application.yml#L57-L59) (`app.seller.email`, `app.seller.password`)
- **Mô tả**:
  - `DataInitializer` khởi tạo sẵn tài khoản `seller` với role `SELLER` nhằm mục đích để `DemoVendorSeeder` của `vendor-service` gắn Shop vào.
- **Tác động**:
  - Phá vỡ tính độc lập của `identity-service`. Identity service chỉ nên quản lý tài khoản người dùng thông thường (`MEMBER`) và quản trị viên (`ADMIN`).

---

## 2. Chi tiết các vị trí vi phạm Hardcode

### 2.1. Hardcode dữ liệu mẫu / Seed data ([`DataInitializer.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/config/DataInitializer.java))

| Dòng | Giá trị hardcode | Vấn đề |
| --- | --- | --- |
| 47-49 | `"CUSTOMER"`, `"Người mua"`, `"SELLER"`, `"Người bán có vendor đã được duyệt"`, `"ADMIN"`, `"Quản trị viên MoonKage"` | Tên role và mô tả role bị fix cứng trong code |
| 55 | `"Quản trị viên MoonKage"` | Họ tên hiển thị của Admin |
| 62 | `"0901234567"` | Số điện thoại của Seller |
| 65 | `"Nguyễn Văn Bánh"` | Họ tên người bán demo |

---

### 2.2. Hardcode trong Logic nghiệp vụ & Service

#### A. [`AddressServiceImpl.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/service/impl/AddressServiceImpl.java)

- **Dòng 27**: `private static final String NOT_FOUND = "Không tìm thấy địa chỉ";` (hardcode string message).
- **Dòng 84**: `.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));` (hardcode message trực tiếp trong code).

#### B. [`AuthServiceImpl.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/service/impl/AuthServiceImpl.java)

- **Dòng 42**: `public static final String DEFAULT_ROLE = "CUSTOMER";` (hardcode role string).
- **Dòng 190-195**: Phụ thuộc chặt vào chuỗi SQL query raw:

  ```java
  if (result.equals("EMAIL_EXISTS")) { ... }
  else if (result.equals("PHONE_EXISTS")) { ... }
  ```

- **Rải rác thông báo lỗi tiếng Việt hardcode**:
  - Dòng 63: `"Role " + DEFAULT_ROLE + " chưa được khởi tạo"`
  - Dòng 95, 100, 177, 182: `"OTP không đúng hoặc đã hết hạn."`
  - Dòng 130: `"Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email và xác thực OTP."`
  - Dòng 132: `"Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên."`
  - Dòng 143: `"Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại."`
  - Dòng 147: `"Tài khoản đã bị khóa hoặc ngừng hoạt động."`
  - Dòng 155: `"Không tìm thấy tài khoản"`
  - Dòng 192, 194: `"Email đã được sử dụng"`, `"Số điện thoại đã được sử dụng"`
  - Dòng 212: `"Không tìm thấy hồ sơ người dùng"`

#### C. [`EmailServiceImpl.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/service/impl/EmailServiceImpl.java)

- **Dòng 41-42**: Hardcode cấu hình sinh OTP 6 số:

  ```java
  private static final int OTP_MIN = 100_000;
  private static final int OTP_RANGE = 900_000;
  ```

- **Dòng 64 & 72**: Hardcode template email và tiêu đề thư:
  - `"REGISTRATION"`, `"MoonKage - Mã xác nhận tài khoản"`
  - `"FORGOT_PASSWORD"`, `"MoonKage - Đặt lại mật khẩu"`
- **Dòng 91**: Hardcode charset `"UTF-8"`.

#### D. [`TokenServiceImpl.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/service/impl/TokenServiceImpl.java)

- **Dòng 53-55, 66-67**: Hardcode tên các JWT claim:
  - `"type"`, `"ACCESS"`, `"REFRESH"`, `"role"`, `"accountId"`, `"account_verified"`.
- **Dòng 57, 70**: Hardcode thuật toán ký JWT: `Jwts.SIG.HS256`.
- **Dòng 92, 94**: Hardcode thông báo Exception tiếng Anh: `"Invalid token type"`, `"Account not found"`.

---

### 2.3. Hardcode trong Cấu hình Bảo mật & Filter

#### A. [`JwtFilter.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/security/JwtFilter.java)

- **Dòng 28-42**: Danh sách `PUBLIC_ENDPOINTS` được fix cứng trong code Java:

  ```java
  static final List<String> PUBLIC_ENDPOINTS = List.of(
          "/error",
          "/actuator/health",
          "/internal/**",
          "/v3/api-docs/**",
          "/swagger-ui/**",
          "/swagger-ui.html",
          "/api/auth/register",
          "/api/auth/verify",
          "/api/auth/resend-otp",
          "/api/auth/login",
          "/api/auth/refresh-token",
          "/api/auth/forgot-password/send-otp",
          "/api/auth/forgot-password/reset");
  ```

- **Dòng 26, 60**: Hardcode header `"Authorization"` và prefix `"Bearer "`.
- **Dòng 76, 83, 96, 98**: Hardcode chuỗi lỗi xác thực:
  - `"Thiếu Authorization Bearer token"`
  - `"Tài khoản đã bị khóa hoặc ngừng hoạt động"`
  - `"Token đã hết hạn"`
  - `"Token không hợp lệ"`

#### B. [`SecurityConfig.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/security/SecurityConfig.java) & [`Account.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/entity/Account.java)

- **Account.java:75**: Hardcode tiền tố phân quyền: `"ROLE_" + role.getRoleName()`.
- **SecurityConfig.java:45**: Hardcode chuỗi `"Account not found"`.

---

### 2.4. Hardcode định dạng & Utility ([`PhoneNumbers.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/util/PhoneNumbers.java))

- **Dòng 7**: `PATTERN = "^(\\+?84|0)[35789]\\d{8}$"` (regex số điện thoại Việt Nam fix cứng trong class util).
- **Dòng 10, 20**: Hardcode tiền tố `"0"` và độ dài 9 số sau mã vùng: `SUBSCRIBER_DIGITS = 9`.

---

## 3. Kế hoạch Refactor đề xuất

1. **Chuẩn hóa Role theo D-19**:
   - Chuyển `Role` thành Constants tập trung (`RoleConstant.MEMBER`, `RoleConstant.ADMIN`, `RoleConstant.CUSTOMER`, `RoleConstant.SELLER`).
   - Cấu hình vai trò mặc định qua biến cấu hình `app.default-role`.
2. **Quản lý Hằng số tập trung (Constants)**:
   - Tạo `SecurityConstant` cho các tiền tố JWT, Header, Claim keys (`AUTHORIZATION_HEADER`, `BEARER_PREFIX`, `ROLE_PREFIX`, `CLAIM_TYPE`, `CLAIM_ROLE`, `CLAIM_ACCOUNT_ID`).
   - Tạo `ErrorMessageConstant` tập trung toàn bộ các thông báo lỗi người dùng và mã kết quả kiểm tra duy nhất.
3. **Cấu hình hóa qua `application.yml`**:
   - Chuyển danh sách `PUBLIC_ENDPOINTS` sang `SecurityProperties` (`security.public-endpoints`).
   - Cấu hình biên độ sinh OTP qua `otp.min` và `otp.range`.
   - Cấu hình thông tin seeder demo qua `app.admin.*` và `app.seller.*`.

---

## 4. Kết quả thực hiện Refactor (Hoàn thành)

- [x] Tạo gói `com.moonkage.identity.constant` chứa:
  - [`SecurityConstant.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/constant/SecurityConstant.java)
  - [`ErrorMessageConstant.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/constant/ErrorMessageConstant.java)
- [x] Tạo [`SecurityProperties.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/security/SecurityProperties.java) và cấu hình `security.public-endpoints` trong `application.yml`.
- [x] Refactor [`DataInitializer.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/config/DataInitializer.java): loại bỏ hoàn toàn các chuỗi literal và magic number về số điện thoại, tên hiển thị.
- [x] Refactor [`AuthServiceImpl.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/service/impl/AuthServiceImpl.java), [`AddressServiceImpl.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/service/impl/AddressServiceImpl.java), [`TokenServiceImpl.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/service/impl/TokenServiceImpl.java), [`EmailServiceImpl.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/service/impl/EmailServiceImpl.java), [`GlobalExceptionHandler.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/exception/GlobalExceptionHandler.java).
- [x] Bỏ util `PhoneNumbers` (mục 2.4): regex và độ dài thuê bao chuyển vào [`PhoneConstant.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/constant/PhoneConstant.java); số điện thoại chuẩn hóa bằng cách lấy 9 số cuối (không còn ghép tiền tố `"0"`).
- [x] Chuẩn hóa role theo D-19 (mục 1.1, 1.2): chỉ còn enum [`Role`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/enums/Role.java) `MEMBER` / `ADMIN` lưu ở cột `accounts.role`; bỏ bảng `roles`, `RoleRepository`, `RoleConstant` và `app.default-role` (đăng ký luôn là `MEMBER`). Tài khoản seller demo là `MEMBER`; gateway và catalog-service không còn check role `SELLER`, quyền quản lý Shop chỉ dựa vào vendor đã duyệt. DB cũ chạy [`api/docs/2026-10-19_roles_to_enum.sql`](file:///d:/02.%20Project/moonkage/platform/api/docs/2026-10-19_roles_to_enum.sql).
- [x] `TokenService` / `TokenServiceImpl` (mục D) chuyển thành [`security/jwt/JwtTokenProvider.java`](file:///d:/02.%20Project/moonkage/platform/api/identity-service/src/main/java/com/moonkage/identity/security/jwt/JwtTokenProvider.java): chỉ ký và parse token, trả `accountId`; việc nạp account và kiểm khóa nằm ở `JwtFilter` và `AuthServiceImpl.refreshToken`.
- [x] Mục 1.2 (seed seller cho vendor-service): identity chỉ còn tự tạo admin; tài khoản và Shop demo tạo bằng script `api/docs/seed/`, không chạy trên production.
- [x] Định dạng chuẩn Spotless (`mvn spotless:apply`).
- [x] Đạt 0 Checkstyle violation (`mvn checkstyle:check`).
- [x] Đạt toàn bộ kiểm thử kiến trúc ArchUnit (không có package cycle, tuân thủ đúng layering) và 100% Unit Test.

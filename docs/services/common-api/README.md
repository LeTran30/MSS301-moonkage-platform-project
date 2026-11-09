# common-api (thư viện hợp đồng HTTP)

> **Đây không phải service.** `common-api` là một **thư viện Java** (`api/common-api`) được các service nhúng vào dependency. Nó không chạy, không có cổng riêng, không có database, không có Dockerfile và không có health endpoint. Tài liệu này mô tả **API của thư viện** — vỏ JSON của câu trả lời HTTP và ranh giới lỗi dùng chung.

Thư viện giữ **hợp đồng HTTP công khai** của hệ thống: mọi service trả về cùng một vỏ `{status, code, message, data, timestamp}` (thành công và lỗi như nhau; `errors` và `path` chỉ có ở lỗi), cùng một hình dạng trang kết quả, cùng một bộ mã lỗi framework và cùng một ranh giới lỗi cho các lỗi mà mọi service đều hiểu giống nhau. Trước đây mỗi service tự viết lại `@RestControllerAdvice` của riêng mình — bảy bản sao — nên cùng một lỗi framework có thể trả về hai hình dạng khác nhau.

- Quyết định liên quan: D-18 (đường dẫn công khai), D-19 (vai trò `MEMBER`/`ADMIN`); xem [../../architecture/software-design.md](../../architecture/software-design.md) mục 5 và [../../architecture/api-db/README.md](../../architecture/api-db/README.md).

## Trách nhiệm

**Có trách nhiệm**

- Định nghĩa vỏ câu trả lời `ApiResponse` — trường `status`, `code`, `message`, `data`, `errors`, `path`, `timestamp` — và cách dựng nó (`ok`, `ok()`, `created`, `error`).
- Định nghĩa hình dạng trang kết quả `PageResponse` (`content`, `page`, `size`, `totalElements`, `totalPages`) để web không phải đoán JSON của `PageImpl` của Spring.
- Định nghĩa tên header mà gateway gắn vào request đi xuống: `X-Account-Id`, `X-User-Role` (và `X-User-Id` — không còn gắn nhưng vẫn bị xoá ở gateway).
- Định nghĩa hai vai trò toàn nền tảng của người gọi: `MEMBER` và `ADMIN` (D-19) cùng các hàm đọc header vai trò.
- Giữ **một** danh sách mã lỗi framework (`CommonErrorCode`, 17 mã `COMMON_*`) và **một** ranh giới lỗi dùng chung (`CommonExceptionHandler`) cho các lỗi mà mọi service đều trả giống nhau.
- Đăng ký ranh giới lỗi dùng chung vào context của mọi service qua auto-configuration, kèm cơ chế tắt cho service có ranh giới lỗi riêng.

**Không có trách nhiệm**

- Không chứa mã lỗi **nghiệp vụ**. Mỗi service giữ enum `ErrorCode`/`AppException` của riêng mình (`AUTH_*`, `CAT_*`, `PAY_*`…) và chỉ delegate các mã framework sang `CommonErrorCode`.
- Không kiểm quyền, không xác thực token, không đọc body. Thư viện chỉ mô tả hình dạng câu trả lời.
- Không bọc API nội bộ `/internal/**` — các API đó trả payload thô, không có vỏ.
- Không giữ câu chữ thông báo của service. Văn bản lấy từ `messages.properties` của chính service đó; thư viện chỉ giữ **văn bản dự phòng** cho service không có bundle riêng.
- Không có database, không có bảng, không có migration.

## Cách phụ thuộc

Tọa độ Maven: `com.moonkage:common-api:0.0.1-SNAPSHOT` (module `api/common-api`, cha là `com.moonkage:api`). Service khai báo trong `pom.xml` của mình:

```xml
<dependency>
    <groupId>com.moonkage</groupId>
    <artifactId>common-api</artifactId>
    <version>${project.version}</version>
</dependency>
```

Module này là **library jar** (`spring-boot.repackage.skip=true`), nên nó không đóng gói fat jar và không có `main` để chạy.

## API của thư viện

Package gốc `com.moonkage.api`. Không có bean nào phải khai báo thủ công: auto-configuration tự đăng ký `CommonExceptionHandler`.

| Class | Loại | Mô tả |
|---|---|---|
| `ApiResponse<T>` | record | Vỏ câu trả lời: `status`, `code`, `message`, `data`, `errors`, `path`, `timestamp`. Thành công dùng `code = "SUCCESS"`, `message = "OK"`; lỗi dùng mã của service và `data = null`. |
| `ApiResponse.FieldError` | record lồng | Một trường không hợp lệ (`field`, `message`) — web hiện thông báo ngay tại trường đó. |
| `PageResponse<T>` | record | Hình dạng JSON ổn định của một trang kết quả. Chỉ dựng được bằng `PageResponse.from(Page)`. |
| `GatewayHeader` | lớp final (hằng) | Tên header danh tính do gateway gắn: `ACCOUNT_ID` (`X-Account-Id`), `USER_ROLE` (`X-User-Role`), `USER_ID` (`X-User-Id` — không còn gắn, vẫn bị xoá để client không lỡ tay gửi nó vào service). |
| `GatewayRole` | enum | `MEMBER`, `ADMIN` — hai vai trò toàn nền tảng (D-19). Có `ADMIN_NAME`, `isAdmin(String)`, `isKnown(String)`, `nameOf(String)`. Vai trò "chủ shop" không nằm ở đây vì nó được kiểm theo từng người bán. |
| `CommonErrorCode` | enum | 17 mã lỗi framework: `INTERNAL_SERVER_ERROR`, `INVALID_INPUT`, `MALFORMED_JSON`, `PARAMETER_REQUIRED`, `UNAUTHENTICATED`, `ACCESS_DENIED`, `RESOURCE_NOT_FOUND`, `METHOD_NOT_ALLOWED`, `INVALID_STATE_TRANSITION`, `DEPENDENCY_UNAVAILABLE`, `FIELD_REQUIRED`, `TEXT_TOO_LONG`, `PROVINCE_CODE_INVALID`, `PRICE_INVALID`, `QUANTITY_INVALID`, `PRICE_TIERS_INVALID`, `NOT_IMPLEMENTED`. Mỗi mã mang `code`, `httpStatus` và `messageKey` (khoá trong `messages.properties` của service). |
| `CommonExceptionHandler` | `@RestControllerAdvice` | Ranh giới lỗi dùng chung với **7 handler**: validation, body không đọc được / sai kiểu tham số, thiếu tham số bắt buộc, không có route, sai method, lỗi Feign, và catch-all. Handler là `final`; service muốn trả lời khác thì override hook `protected` (`validationAnswer`, `unreadableAnswer`, `missingParameterAnswer`, `noResourceAnswer`, `methodNotAllowedAnswer`, `feignAnswer`, `uncaughtAnswer`, `status`, `code`, `message`) chứ không khai báo handler thứ hai cho cùng exception. |
| `CommonExceptionHandlerAutoConfiguration` | `@AutoConfiguration` | Đăng ký `CommonExceptionHandler` vào context khi service chưa có advice riêng. |

`CommonErrorCode` không phải là "mã của thư viện" mà là **mã dùng chung**: enum `ErrorCode` của service giữ mã nghiệp vụ và delegate các mã framework sang đây, nên cùng một chuỗi lỗi không tồn tại ở nhiều nơi.

### Auto-configuration đóng góp

`api/common-api/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`:

```
com.moonkage.api.CommonExceptionHandlerAutoConfiguration
```

`@RestControllerAdvice` đặt trong jar thư viện **không** được component scan của service nhặt (scan chỉ quét package của chính service), nên phải khai báo trong file `AutoConfiguration.imports` thì advice mới vào context.

Điều kiện: `@ConditionalOnWebApplication(type = SERVLET)`, `@ConditionalOnProperty("moonkage.common-api.error-handler.enabled")` (mặc định `true`) và `@ConditionalOnMissingBean`.

## Ai đang dùng

Cả 8 module chạy được trong `api/pom.xml` đều khai báo dependency `common-api` (`api-gateway`, `identity-service`, `catalog-service`, `quotation-service`, `vendor-service`, `order-service`, `payment-service`, `orchestrator-service`).

| Chỗ dùng | Ví dụ thật |
|---|---|
| Vỏ câu trả lời | `api/payment-service/src/main/java/com/moonkage/payment/controller/RefundController.java:38` — `ApiResponse.ok(refundService.list(...))` |
| Trang kết quả | `api/payment-service/src/main/java/com/moonkage/payment/service/impl/PaymentServiceImpl.java:173` — `PageResponse.from(page)` |
| Header gateway | `api/api-gateway/src/main/java/com/moonkage/gateway/config/SecurityConfig.java:190-196` — xoá header client gửi lên rồi gắn `GatewayHeader.ACCOUNT_ID` và `GatewayHeader.USER_ROLE` |
| Vai trò | `api/order-service/src/main/java/com/moonkage/order/security/CurrentUserArgumentResolver.java:41` — `GatewayRole.isKnown(role)` để từ chối request không đi qua gateway |
| Ranh giới lỗi dùng chung | `api/order-service/src/main/java/com/moonkage/order/exception/GlobalExceptionHandler.java:25` — `extends CommonExceptionHandler` (advice riêng của service kế thừa advice dùng chung) |

`catalog-service` là ngoại lệ: nó **tắt** advice dùng chung bằng `moonkage.common-api.error-handler.enabled=false` trong `application.yml` (kiểm thử: `api/catalog-service/src/test/java/com/moonkage/catalog/common/exception/CommonErrorHandlerRegistrationTest.java:29`) — lý do: hai advice catch-all sẽ tranh nhau mỗi lỗi không phải lỗi nghiệp vụ (audit M-03).

## Cấu hình

Thư viện không đọc cấu hình nào của riêng nó ngoài một khoá:

| Khoá | Mặc định | Ý nghĩa |
|---|---|---|
| `moonkage.common-api.error-handler.enabled` | `true` | Có đăng ký `CommonExceptionHandler` hay không. Service có ranh giới lỗi riêng (envelope khác, mã lỗi riêng) thì đặt `false`. |

Ngoài ra thư viện **đọc** `MessageSource` của service (để lấy văn bản thông báo theo `messageKey` của `CommonErrorCode`). `MessageSource` là tuỳ chọn: service không có bundle riêng vẫn nhận advice, với văn bản dự phòng trong `CommonExceptionHandler.DEFAULT_MESSAGES` — bản dự phòng có mặt cho **cả 17** mã.

## Chạy và kiểm thử

Thư viện không chạy riêng. Kiểm thử:

```bash
cd api
./mvnw -pl common-api -am clean verify
```

## Xem thêm

- [../common-storage/README.md](../common-storage/README.md) — thư viện lưu trữ đối tượng, viết theo cùng mẫu này.
- [../../architecture/api-db/decisions.md](../../architecture/api-db/decisions.md) — D-19 (vai trò), D-25 (ranh giới tin cậy ở gateway).

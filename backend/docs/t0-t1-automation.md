# Nhật ký: Cài đặt tự động hóa T0–T1 cho backend

- **Ngày:** 2026-10-15
- **Branch:** `chore/t0-t1-automation` (tách từ `develop`)
- **Nguồn cấu hình:** bộ mẫu `t0-t1-automation` (Spotless + Checkstyle + Error Prone)
- **Kết quả:** `./mvnw clean verify` **pass** trên cả 7 module, 4/4 test pass, image Docker build và chạy được trên JDK 21.

---

## 1. Mục tiêu

Để máy tự lo hai tầng thấp nhất của code standard:

| Tầng | Nội dung | Công cụ | Tự sửa? |
|---|---|---|---|
| T0 — Định dạng | Thụt lề, khoảng trắng, xuống dòng, thứ tự import | `.editorconfig` + Spotless (palantir-java-format) | Có |
| T1 — Cú pháp | Naming, import cấm, magic number, `System.out`… | Checkstyle | Chỉ báo lỗi |
| T1 — Ngữ nghĩa | Biến không dùng, charset mặc định, `==` sai… | Error Prone (lúc compile) | Chỉ báo lỗi |

## 2. Khác biệt giữa repo này và bộ mẫu

Bộ mẫu viết cho project **một module**, git root trùng Maven root. Repo này khác ở 4 điểm, nên không chép nguyên được:

| Repo này | Hệ quả |
|---|---|
| Git root là thư mục repo, Maven root là `backend/` (6 module) | Hook và CI đặt ở git root nhưng phải chạy Maven trong `backend/`. Đường dẫn Checkstyle tương đối sẽ không tìm thấy từ submodule. |
| Đang dùng Java 17, Dockerfile dùng `temurin-17` | Checkstyle 13.7 và Error Prone 2.50 yêu cầu JDK 21+ → **nâng toàn bộ lên Java 21**. |
| 4 service dùng Lombok | `annotationProcessorPaths` tắt việc tự tìm processor → phải khai báo Lombok. |
| Chưa có `mvnw`, máy chưa cài `mvn`/`jq` | Hook và CI gọi `./mvnw` → phải tạo Maven wrapper. |

## 3. Các bước đã làm

### 3.1. Tạo branch và Maven wrapper
- Tạo branch `chore/t0-t1-automation` từ `develop`.
- Dùng Maven 3.9.16 có sẵn trong `~/.m2/wrapper/dists` để sinh wrapper:
  `backend/mvnw`, `backend/mvnw.cmd`, `backend/.mvn/wrapper/maven-wrapper.properties`.

### 3.2. Chép file cấu hình
| File | Vị trí | Ghi chú |
|---|---|---|
| `jvm.config` | `backend/.mvn/` | Bắt buộc cho Error Prone; phải nằm nơi chạy `mvn`. |
| `checkstyle.xml` | `backend/config/checkstyle/` | |
| `.editorconfig` | gốc repo | Thêm rule `indent_size = 2` cho `js/jsx/ts/tsx/css/html` để không đụng frontend (đang dùng 2 space). |
| `pre-commit` | `.githooks/` (gốc repo) | Viết lại, xem 3.4. |
| `code-quality.yml` | `.github/workflows/` (gốc repo) | Viết lại, xem 3.5. |

Không chép `src/` (2 file demo) và hook Claude Code `.claude/settings.json` (cần `jq`, máy chưa có).

### 3.3. Sửa `backend/pom.xml` (parent — 6 module kế thừa)
- `java.version`: `17` → `21`.
- Thêm `lombok.version = 1.18.46` (mới hơn bản Spring Boot 3.3 quản lý, để chạy được trên JDK 25 ở máy local).
- Thêm 5 property version công cụ: Spotless 3.7.0, maven-checkstyle-plugin 3.6.0, Checkstyle 13.7.0, Error Prone 2.50.0, maven-compiler-plugin 3.14.0.
- Thêm 3 plugin, có chỉnh so với mẫu:
  - **Checkstyle:** `configLocation` dùng `${maven.multiModuleProjectDirectory}/config/checkstyle/checkstyle.xml` để mọi submodule đều tìm được.
  - **Compiler:** `<release>${java.version}</release>` thay vì hard-code `21`; thêm Lombok vào `annotationProcessorPaths`.
  - **Spotless:**
    - `<lineEndings>UNIX</lineEndings>` — nếu không, trên Windows Spotless ghi CRLF, lệch với `.editorconfig` và CI.
    - `sortPom` dùng `nrOfIndentSpace = 4` và `indentSchemaLocation = true` — mặc định là 2 space, lệch `.editorconfig` và làm diff pom phình to.
    - **Bỏ `<formatAnnotations/>`** — bước này coi `@NotBlank`, `@Size`, `@Email` (Jakarta Validation có target `TYPE_USE`) là type annotation và kéo chúng về cùng dòng với field → vượt 120 ký tự → Checkstyle `LineLength` báo lỗi. Đây là chỗ duy nhất Spotless và Checkstyle "cãi nhau". Palantir đã tự xử lý bố cục annotation nên bỏ bước này không mất gì.

### 3.4. Git hook `.githooks/pre-commit`
- Chỉ chạy khi có file `backend/**/*.java` hoặc `backend/**/pom.xml` được stage.
- `cd` vào `backend/` rồi chạy `./mvnw -q -B spotless:check checkstyle:check`.
- Đã set executable bit trong git (`git add --chmod=+x`) và chạy `git config core.hooksPath .githooks` trên máy này.

### 3.5. CI `.github/workflows/code-quality.yml`
- Trigger: pull request và push vào `main`, `develop`, chỉ khi thay đổi `backend/**` hoặc chính file workflow.
- `working-directory: backend`, JDK Temurin 21, chạy `./mvnw -B -ntp clean verify`.

### 3.6. Sửa 6 Dockerfile
- Image build: `maven:3.9-eclipse-temurin-17` → `maven:3.9-eclipse-temurin-21`.
- Image runtime: `eclipse-temurin:17-jre-alpine` → `eclipse-temurin:21-jre-alpine`.
- Thêm `COPY .mvn/jvm.config .mvn/` (Error Prone cần).
- Thêm `-Dspotless.check.skip=true -Dcheckstyle.skip=true` vào lệnh build — image không copy `config/checkstyle`, và việc kiểm tra style đã có CI lo.

### 3.7. Format toàn bộ code một lần
- Chạy `./mvnw spotless:apply`. Diff định dạng còn khoảng +482/−508 dòng sau khi chỉnh line ending và indent pom.

### 3.8. Lần `verify` đầu tiên — kết quả
Tooling chạy đúng nhưng build đỏ do vi phạm **có sẵn** trong code:

- **Checkstyle: 121 lỗi** — import `*` (81), dòng quá dài (16), thiếu `{}` (10), magic number (8), tên hằng (5), import cấm (1).
- **Error Prone: 54 lỗi** — 47 `UnusedVariable` là các field inject trong controller/service đang là stub; còn lại là lỗi thật: `DefaultCharset` ×2, `JavaUtilDate` ×4, `ExposedPrivateType` ×1.

Đã hỏi và chọn phương án: **sửa code + tạm nới `UnusedVariable` cho stub**.

### 3.9. Sửa vi phạm
| Vi phạm | Cách sửa | File |
|---|---|---|
| Import `*` (`jakarta.persistence`, `java.util`, `lombok`, `com.bake2b.*.enums`) | Script tách thành import tường minh theo tên class thực sự dùng trong file; bỏ qua tên trùng class cùng package để tránh che khuất (shadowing). Compiler xác nhận không thiếu, Spotless dọn import thừa. | ~45 file entity/DTO |
| `logger` sai `ConstantName` | Đổi thành `log` (pattern cho phép) | 5 × `DotEnvConfig.java` |
| Javadoc dài, `if (...) continue;` thiếu `{}` | Xuống dòng, thêm ngoặc | 5 × `DotEnvConfig.java` |
| Annotation validation trên 1 dòng quá dài | Mỗi annotation một dòng | `AccountCreateRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`, `VerifyRequest` |
| Javadoc dài | Xuống dòng / chuyển thành `<ul>` | `OrderController`, `OrderService`, `Order`, `OrderStatus` |
| `substring(7)` | Hằng `BEARER_PREFIX` + `BEARER_PREFIX.length()` | `JwtFilter` |
| `100000`, `900000` | Hằng `OTP_MIN`, `OTP_RANGE` | `EmailServiceImpl` |
| `getBytes()` không chỉ định charset | `getBytes(StandardCharsets.UTF_8)` | `EmailServiceImpl` |
| Field package-private lộ kiểu `private record OtpEntry` | Record thành package-private (test cần truy cập) | `EmailServiceImpl` |
| `java.util.Date` (import cấm + `JavaUtilDate`) | Dùng `Instant`; `Date` chỉ còn trong helper `toDate(Instant)` có `@SuppressWarnings("JavaUtilDate")` vì API jjwt bắt buộc `Date` | `TokenServiceImpl` |
| `setMaxAge(3600L)` | `setMaxAge(Duration.ofHours(1))` | `api-gateway/SecurityConfig` |
| Magic number trong test (`assertEquals(6, ...)`) | Tắt `MagicNumber` cho `src/test` bằng `SuppressionSingleFilter` trong `checkstyle.xml` | `checkstyle.xml` |
| 47 `UnusedVariable` ở stub | Hạ `-Xep:UnusedVariable` từ `ERROR` xuống `WARN`, có comment trong pom nhắc nâng lại khi implement xong | `pom.xml` |

### 3.10. Kiểm tra cuối
- `./mvnw -B -ntp clean verify`: **BUILD SUCCESS** cả 7 module, `Tests run: 4, Failures: 0, Errors: 0`.
- Còn 52 cảnh báo `UnusedVariable` (chỉ là warning, không chặn build).
- `docker build -f identity-service/Dockerfile .`: thành công, `java -version` trong image là 21.
- `bash -n .githooks/pre-commit`: cú pháp hợp lệ.

### 3.11. Chạy thử toàn bộ hệ thống trước khi commit
- Dùng file `.env` của nhóm (chép từ `Downloads/.env`, đổi CRLF → LF; file này đã nằm trong `.gitignore`).
- Chạy `docker compose up -d --build` ở gốc repo: build lại cả 6 image bằng Dockerfile mới (JDK 21 + Error Prone) → thành công.
- Volume `identity-db` vừa được tạo trong lần chạy này đã seed admin bằng mật khẩu khác, mà `DataInitializer` bỏ qua nếu admin đã tồn tại → xoá **riêng** volume này để seed lại bằng `ADMIN_PASSWORD` trong `.env`.
- Cả 5 service đăng ký `UP` trên Eureka.

Kiểm tra nhanh qua gateway (`http://localhost:8080`):

| Kiểm tra | Kết quả | Liên quan tới thay đổi |
|---|---|---|
| `POST /identity-service/api/auth/login` (admin) | 200, trả token | `TokenServiceImpl` dùng `Instant` |
| `GET /me` với access token | 200 | `JwtFilter` dùng `BEARER_PREFIX` |
| `GET /me` không token / dùng refresh token / sai mật khẩu | 401 | |
| `POST /refresh-token` | 200 | |
| `POST /register` dữ liệu sai | 400 | Annotation validation vẫn hoạt động sau khi tách dòng |
| CORS preflight | `Access-Control-Max-Age: 3600` | `Duration.ofHours(1)` |
| Route có bảo vệ (order) không token | 401 | |
| Route order / catalog có token | 404 | Gateway đã cho qua; 404 vì endpoint còn là stub (đúng như hiện trạng) |

## 4. Việc còn lại (chưa làm)

- [ ] **Commit** — chưa commit gì. Đề xuất tách 2 commit: (1) tooling, (2) format + sửa vi phạm.
- [ ] Thêm hash commit format vào `.git-blame-ignore-revs` để `git blame` bỏ qua.
- [ ] Kiểm tra lại `identity-service/.../entity/Vendor.java`: thay đổi chưa commit có sẵn từ trước giờ bị trộn với thay đổi format/import.
- [ ] Bật branch protection trên `main` (và `develop`): bắt buộc job **Code quality** pass. Hook có thể bị bỏ qua bằng `--no-verify`, CI thì không.
- [ ] Mỗi thành viên chạy một lần: `git config core.hooksPath .githooks`.
- [ ] Khi các service hết là stub: nâng `-Xep:UnusedVariable:WARN` lại thành `ERROR`.

## 5. Lệnh hằng ngày (chạy trong `backend/`)

| Việc | Lệnh |
|---|---|
| Format lại code | `./mvnw spotless:apply` |
| Kiểm tra format | `./mvnw spotless:check` |
| Chạy Checkstyle | `./mvnw checkstyle:check` |
| Chạy toàn bộ (format + Checkstyle + Error Prone + test) | `./mvnw clean verify` |

Bỏ qua **có chủ đích** một vi phạm (bắt buộc kèm lý do):
```java
@SuppressWarnings("checkstyle:MagicNumber") // lý do...
```

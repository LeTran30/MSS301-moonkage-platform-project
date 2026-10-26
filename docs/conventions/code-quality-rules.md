# Quy tắc chất lượng mã nguồn – Moonkage Backend

Oct 21, 2026 · @LAM Quoc-Cuong

Bản điền của template "Quy tắc chất lượng mã nguồn" cho thư mục `../../api` của Moonkage: Java 21, Spring Boot 3.5.16, 10 module Maven. Cột **Thực thi** ghi công cụ đang chạy trong repo; chỗ ghi **Đề xuất** là việc chưa có, cần nhóm duyệt rồi mới thành luật.

Đối chiếu với: repo `LeTran30/MSS301-moonkage-platform-project` (lần push 20/10/2026), `coding-rules.md`, `.github/CONTRIBUTING.md` và Software Design v0.5 trong Project.

**Bảy điểm cần nhóm chốt trước khi áp dụng** (trạng thái 21/10/2026)

1. **Đã chốt – tiền là `long` VND.** Khớp database (`bigint`) và Software Design 4.7 "tiền lưu bigint (VND, không số lẻ)"; bọc trong record `Money` khi cần ràng buộc. Câu nhắc của Checkstyle `noFloatingMoney` đã sửa thành `long`.
2. **Đã chốt – giữ tên `orchestrator-service`** (audit, thông báo, email). `docs/architecture/software-design.md` đã dùng tên này; cột consumer ở bảng sự kiện vẫn ghi `notification` theo vai trò. Việc gửi email đang nằm ở orchestrator thay vì identity, đã ghi nhận là lệch thiết kế ở mục 11 của tài liệu đó.
3. **Chưa có đo độ phức tạp, coverage, quét lỗ hổng, quét secret.** Các quy tắc FN-02/03/04/06, MD-03, TS-01/05, DP-04, RT-04 hiện chỉ dựa vào review. Phần D liệt kê cách nối từng công cụ.
4. **Đã làm – health check.** 7 service nghiệp vụ có `spring-boot-starter-actuator`, chỉ mở `health` (bật probes); `docker-compose.yml` kiểm `/actuator/health/readiness`. identity-service mở `/actuator/health/**` trong `security.public-endpoints`.
5. **Mạng chưa có timeout và tracing.** Không service nào cấu hình timeout cho OpenFeign; chưa có trace ID trong log (DS-01, DS-05, RT-03).
6. **Để sau – test tích hợp chỉ có ở identity.** Testcontainers mới khai báo trong identity-service; chờ chốt thiết kế database của các service còn lại rồi mới nhân rộng (TS-04).
7. **Đã làm – `AbbreviationAsWordInName` hạ từ `3` xuống `1`.** Chặn từ 3 chữ hoa liền nhau (`SendOTPRequest`, `NFCCardService`). Không dùng `0` vì bắt nhầm tên test dạng câu có mạo từ "A" (`tokenOfADeletedAccountIsInvalid`, TS-03); mức `1` không có vi phạm trên code hiện có.

## Phần A – Hồ sơ dự án

Java 21 cho phép đưa phần lớn quy tắc ngữ nghĩa lên L1 (record, sealed, enum, switch đủ nhánh); chỗ yếu duy nhất là null-safety, nên ER-01 dừng ở L2 nếu thêm NullAway.

### A1. Định danh

| Mục | Giá trị |
| --- | --- |
| Dự án / repo | Moonkage – `LeTran30/MSS301-moonkage-platform-project`, thư mục `../../api` |
| Ngôn ngữ chính + phiên bản | Java 21 (`<java.version>21`, CI dùng Temurin 21) |
| Framework chính | Spring Boot 3.5.16, Spring Cloud 2025.0.3 (Gateway, Eureka, OpenFeign), Spring Data JPA + Flyway, Spring AMQP |
| Kiểu triển khai | Web service: 7 microservice nghiệp vụ + `api-gateway` + `discovery-server` + thư viện `common-storage`, chạy bằng Docker Compose |
| Người chịu trách nhiệm bộ quy tắc | \[CẦN NHÓM CHỈ ĐỊNH\] |

### A2. Năng lực của ngôn ngữ

| Câu hỏi | Trả lời | Hệ quả |
| --- | --- | --- |
| Kiểu tĩnh hay động? | Tĩnh; `javac --release 21` + Error Prone 2.50.0 | Phần lớn L1 đạt được |
| Có null-safety? | Không có trong ngôn ngữ. Dự án dùng `Optional<T>` cho method `find...` (coding-rules 2.2) | ER-01 ở L3. Đề xuất NullAway + JSpecify `@NullMarked` để lên L2 |
| Có enum / sum type / sealed? | Có: `enum`, `sealed interface` + `record`, `switch` pattern; Error Prone `MissingCasesInEnumSwitch` = ERROR | KN-02, ST-02 đạt L1 |
| Có kiểu bọc rẻ? | Có: `record` với compact constructor kiểm tra | KN-01 đáng chi phí cho ID, tiền, số lượng, email |
| Có bất biến mặc định? | Không, nhưng có `final`, `record`, `List.copyOf`. Entity JPA bắt buộc mutable | ST-01: L1 cho DTO, event, value object; L4 cho entity |
| Cơ chế lỗi chính? | Exception unchecked: `AppException` + `ErrorCode` (identity-service) | ER-02 lỗi dự kiến qua `ErrorCode`; dùng sealed result khi người gọi phải rẽ nhánh |
| Ranh giới module được cưỡng chế? | Maven module (giữa service) + `package-private`; không dùng JPMS. ArchUnit chặn phụ thuộc giữa layer | MD-02 L1 trong package; DP-01, DP-02 L2 qua ArchUnit |

### A3. Bộ công cụ

| Vai trò | Công cụ đã chọn | Cấu hình nằm ở |
| --- | --- | --- |
| Formatter | Spotless 3.10.4 + palantir-java-format (style PALANTIR, 120 cột), sortPom; `../../.editorconfig` cho IDE | `../../api/pom.xml`, `.editorconfig`, `.gitattributes` |
| Linter / static analyzer | Checkstyle 13.11.0 (plugin 3.6.0); Error Prone 2.50.0 | `../../api/config/checkstyle/checkstyle.xml`; `compilerArgs` trong `api/pom.xml` |
| Type checker | `javac` + Error Prone. **Đề xuất:** NullAway | `../../api/pom.xml` |
| Đo độ phức tạp | **Chưa có. Đề xuất:** thêm các check độ phức tạp vào Checkstyle sẵn có (không thêm công cụ) | `../../api/config/checkstyle/checkstyle.xml` |
| Kiểm tra kiến trúc / phụ thuộc | ArchUnit 1.5.1, chạy như test trong mọi module | `../../api/config/archunit/com/moonkage/architecture/ArchitectureTest.java` |
| Quét lỗ hổng thư viện | **Chưa có. Đề xuất:** Dependabot (Maven + GitHub Actions) | `.github/dependabot.yml` (tạo mới) |
| Test runner + đo coverage | JUnit 5 qua `spring-boot-starter-test`; Testcontainers (identity). Coverage **chưa có. Đề xuất:** JaCoCo | `../../api/pom.xml` |
| Pre-commit / git hooks | `../../.githooks/pre-commit` (Spotless + Checkstyle khi stage `.java`/`pom.xml`), `.githooks/commit-msg` (Conventional Commits). Bật bằng `git config core.hooksPath .githooks` | `../../.githooks` |
| CI | GitHub Actions: `code-quality.yml` (`./mvnw -B -ntp clean verify`), `pr-conventions.yml` (nhánh, tiêu đề PR) | `../../.github/workflows` |
| Logging / tracing | SLF4J + Logback (`@Slf4j`, tên `log`). **Đề xuất:** log JSON có sẵn của Spring Boot (`logging.structured.format.console`) + Micrometer Tracing | `application.yml` từng service |

### A4. Đặc thù framework

- **Cấu trúc thư mục bắt buộc:** mỗi service một module `api/<service>/`; package `com.moonkage.<service>` tổ chức theo **component** (identity-service: `account`, `profile`, `address`, `kyc`, `auth`, `otp`, `email`, `outbox`, `security`, `common` + tầng HTTP `web`; xem `coding-rules.md` Phần 1.1) hoặc, với service chưa chuyển, theo layer `controller`, `service` + `service.impl`, `repository`, `entity`, `dto.request`, `dto.response`, `mapper`, `exception`, `config`, `messaging`. Không tạo vòng phụ thuộc giữa các package. Migration ở `src/main/resources/db/migration` (`V<n>__*.sql`), seed ở `db/seed` (`R__seed.sql`).
- **DI / vòng đời:** chỉ constructor injection (`@RequiredArgsConstructor`); Checkstyle `noFieldInjection` chặn `@Autowired` trên field. Bean là singleton, nên field của service không được giữ dữ liệu theo request.
- **Nơi đặt logic:** controller chỉ đổi HTTP ↔ DTO; luật nghiệp vụ và `@Transactional` ở `*ServiceImpl`; entity và value object chỉ chứa hành vi thuần trên dữ liệu của nó (vd `NfcLockout.isLocked(now)`); mapper là `final class` với method `static` (package-private trong component).
- **Cấu hình và secrets:** `application.yml` đọc `${ENV:mặc định}`; nhóm cấu hình dùng `@ConfigurationProperties` + `@Validated`; secrets nằm trong `../../.env` theo mẫu `.env.example`, không commit. Pepper, khóa PII và khóa giải mã thẻ chỉ cấp cho identity-service (D-07, D-08).
- **"Phép màu" cần làm tường minh:**
  - `@Transactional` chỉ có hiệu lực khi gọi qua proxy: gọi nội bộ trong cùng class, hoặc trên method không `public`, sẽ không mở transaction.
  - Dirty checking của JPA: sửa field của entity đang được quản lý là tự ghi xuống database khi commit. Chỉ sửa entity trong `*ServiceImpl` của component sở hữu nó.
  - `spring.jpa.open-in-view` mặc định `true`: query lazy chạy cả trong tầng web. Đề xuất đặt `false` ở mọi service.
  - OpenFeign và `lb://` qua Eureka: tên service là hợp đồng; Feign không có timeout hợp lý mặc định (xem DS-01).
  - Lombok `@Data` trên entity sinh `equals/hashCode` theo mọi field, kể cả quan hệ lazy: cấm; dùng `@Getter` + `@Setter` có chọn lọc.

## Phần B – Bộ quy tắc theo tầng cấu trúc

Tầng B1–B3 và phần lớn B6 đã có công cụ chặn trong repo; độ phức tạp (B4), runtime (B7) và mạng (B8) chủ yếu cần thêm cấu hình (ghi **Đề xuất**), còn lại là L4. Cột "Vì sao" giữ nguyên như template nên không chép lại. Cột **Mức** ghi mức đạt được với Java 21; quy tắc chỉ "cảnh báo" dùng `severity="info"` trong Checkstyle để hiện báo cáo mà không chặn build.

### B1. Biểu diễn

| ID | Quy tắc | Mức | Thực thi | Ngưỡng |
| --- | --- | --- | --- | --- |
| RP-01 | UTF-8, không BOM | L2 | `../../.editorconfig` `charset = utf-8`; `maven-compiler-plugin` `encoding UTF-8`; Checkstyle `charset UTF-8` | — |
| RP-02 | Một kiểu xuống dòng, một kiểu thụt lề | L2 | `.gitattributes` `eol=lf` (`.cmd`/`.bat` giữ CRLF); Spotless `lineEndings UNIX` | 4 spaces (Java, XML); 2 spaces (YAML, JSON) |
| RP-03 | Định dạng do formatter quyết định | L2 | Spotless + palantir-java-format, `importOrder`, `removeUnusedImports`; `spotless:check` ở phase `validate`; sửa bằng `./mvnw spotless:apply` | dòng 120 cột |

### B2. Định danh

| ID | Quy tắc | Mức | Thực thi | Ngưỡng |
| --- | --- | --- | --- | --- |
| NM-01 | Quy ước chữ hoa/thường chuẩn | L2 | Checkstyle `TypeName`, `MethodName`, `MemberName`, `ConstantName` (cho phép `log`), `PackageName`, `AbbreviationAsWordInName`. Hậu tố class theo layer (coding-rules 2.1) | `allowedAbbreviationLength = 1` (tối đa 2 chữ hoa liền nhau) |
| NM-02 | Không dùng từ rỗng | L2 + L4 | **Đề xuất:** ArchUnit cấm tên class kết thúc bằng từ cấm; tên biến kiểm ở review | cấm hậu tố class: `Manager`, `Helper`, `Util`, `Utils`, `Data`, `Info`; cấm tên biến: `data`, `info`, `temp`, `obj` |
| NM-03 | Boolean có tiền tố khẳng định | L2 (method) / L4 (field) | **Đề xuất:** ArchUnit: method trả `boolean` phải khớp `^(is\|has\|can\|should\|exists)` (coding-rules 2.2); field boolean kiểm ở review | — |
| NM-04 | Động từ phản ánh chi phí, rủi ro | L3 | Bảng từ vựng dự án: coding-rules 2.2 (`find…` → `Optional`, `get…` → có chắc hoặc ném `AppException`, `list…`/`search…` → không bao giờ `null`, `create/register/update/save/submit` → đổi trạng thái, `to/from/of` → chuyển kiểu thuần). Lời gọi service khác chỉ nằm trong interface `<Service>Client` | — |
| NM-05 | Không viết tắt ngoài danh sách | L2 / L4 | Checkstyle `AbbreviationAsWordInName`; danh sách kiểm ở review | danh sách: `Id`, `Dto`, `Otp`, `Nfc`, `Jwt`, `Pii`, `Ipn`, `Api`, `Http`, `Url`, `Uri`, `Sql`, `Json`, `Vnd` |

### B3. Biểu thức & câu lệnh

| ID | Quy tắc | Mức | Thực thi | Ngưỡng |
| --- | --- | --- | --- | --- |
| EX-01 | Không giá trị "ma thuật" | L2 (số) / L4 (chuỗi) | Checkstyle `MagicNumber` (bỏ qua test, annotation, khai báo field). Mã lỗi đi qua enum `ErrorCode`, không viết chuỗi | ngoại trừ: −1, 0, 1, 2 |
| EX-02 | Điều kiện phức tạp có tên | L2 + L4 | Checkstyle `SimplifyBooleanExpression`, `SimplifyBooleanReturn`; **Đề xuất:** `BooleanExpressionComplexity` | tối đa 3 toán tử logic / biểu thức |
| EX-03 | Không gán trong điều kiện, không tác dụng phụ ẩn | L2 | Checkstyle `InnerAssignment`, `ModifiedControlVariable`, `OneStatementPerLine`, `FallThrough` | — |
| EX-04 | Không code chết, biến thừa, import thừa | L2 | Spotless `removeUnusedImports`; Checkstyle `UnusedImports`; Error Prone `UnusedMethod` = ERROR, `UnusedVariable` = WARN (nâng ERROR khi hết stub) | 0 |

### B4. Hàm

| ID | Quy tắc | Mức | Thực thi | Ngưỡng |
| --- | --- | --- | --- | --- |
| FN-01 | Một việc, một mức trừu tượng | L4 | Method nghiệp vụ theo 4 nhịp: Guard → Nghiệp vụ → Lưu & sự kiện → Trả DTO (coding-rules 3.2) | — |
| FN-02 | Giới hạn độ phức tạp | L2 | **Đề xuất:** Checkstyle `CyclomaticComplexity`, `NPathComplexity` | cyclomatic ≤ 10; NPath ≤ 200 |
| FN-03 | Guard clause, giới hạn lồng | L2 | **Đề xuất:** Checkstyle `NestedIfDepth` (max 2), `NestedForDepth` (max 1), `NestedTryDepth` (max 1) | lồng ≤ 3 tầng |
| FN-04 | Giới hạn tham số | L2 | **Đề xuất:** Checkstyle `ParameterNumber` (`tokens = METHOD_DEF`, `ignoreOverriddenMethods = true`); constructor của bean do Lombok sinh nên không bị đếm | ≤ 5 |
| FN-05 | Tách logic thuần khỏi I/O | L4 | Hàm thuần làm `static` hoặc class không phụ thuộc repository/client, vd hàm so họ tên (Design 4.3.1), tính phí giao (4.4) | — |
| FN-06 | Giới hạn độ dài hàm | L2 (cảnh báo) | **Đề xuất:** Checkstyle `MethodLength` (`countEmpty = false`, `severity = info`) | ≤ 50 dòng |

### B5. Module / lớp

| ID | Quy tắc | Mức | Thực thi | Ngưỡng |
| --- | --- | --- | --- | --- |
| MD-01 | Một lý do để thay đổi | L4 | Review; dấu hiệu tách: service inject quá nhiều phụ thuộc | > 7 phụ thuộc trong một service → xem xét tách |
| MD-02 | Ẩn trạng thái nội bộ | L1 | `private` cho field; `package-private` cho entity, repository, `*ServiceImpl`, mapper và class phụ trợ của một component; entity chỉ có setter cho field được đổi ngoài luồng chuyển trạng thái | — |
| MD-03 | Giới hạn kích thước file | L2 (cảnh báo) | **Đề xuất:** Checkstyle `FileLength` (`severity = info`) | ≤ 500 dòng |

### B6. Gói & phụ thuộc

| ID | Quy tắc | Mức | Thực thi | Ngưỡng |
| --- | --- | --- | --- | --- |
| DP-01 | Không chu trình phụ thuộc | L2 | ArchUnit `NO_PACKAGE_CYCLES` (slice `com.moonkage.(*).(*)..`); Maven không cho vòng giữa module | 0 chu trình |
| DP-02 | Hướng phụ thuộc theo kiến trúc | L2 | Luật kiến trúc: ArchUnit 6 luật controller → service → repository, dto ↛ entity. **Đề xuất thêm:** entity ↛ service/repository/dto; module service chỉ được phụ thuộc `common-storage`, không phụ thuộc module service khác | — |
| DP-03 | Thư viện bên thứ ba sau adapter | L4 (+ L2 đề xuất) | MinIO chỉ qua `ObjectStorage` của `common-storage`; VNPay chỉ trong adapter của payment-service. **Đề xuất:** ArchUnit chỉ cho package `..client..` dùng `org.springframework.cloud.openfeign` | — |
| DP-04 | Ghim phiên bản, quét lỗ hổng | L2 | Phiên bản qua BOM `spring-boot-starter-parent` + `spring-cloud-dependencies`; Maven Wrapper ghim Maven. **Đề xuất:** Dependabot alerts + PR cập nhật hằng tuần | chặn: High, Critical (CVSS ≥ 7.0) |

### B7. Ứng dụng / tiến trình

| ID | Quy tắc | Mức | Thực thi | Ngưỡng |
| --- | --- | --- | --- | --- |
| RT-01 | Đóng tài nguyên theo cấu trúc ngôn ngữ | L2 | try-with-resources; Error Prone `MustBeClosedChecker` (bật mặc định). Kết nối DB, channel RabbitMQ do Spring quản lý; `InputStream` từ MinIO phải đóng ở nơi mở | — |
| RT-02 | Tắt máy có kiểm soát | L4 + test | **Đề xuất:** `server.shutdown: graceful`, `spring.lifecycle.timeout-per-shutdown-phase: 20s`; Docker Compose `stop_grace_period: 30s` (mặc định 10 s sẽ cắt ngang) | chờ 20 s |
| RT-03 | Log có cấu trúc, mức độ, ID tương quan; không log secrets | L2 | Checkstyle `noSystemOut`, `noPrintStackTrace`, `noLogConcat`; test `SensitiveDtoToStringTest` (identity). **Đề xuất:** `logging.structured.format.console: ecs`; trace ID vào MDC qua Micrometer Tracing | mức mặc định INFO; DEBUG chỉ ở dev |
| RT-04 | Cấu hình, secrets từ môi trường | L2 | `${ENV:default}` trong `application.yml`, mẫu ở `../../.env.example`, `.env` trong `.gitignore`. **Đề xuất:** gitleaks trong pre-commit và CI | — |
| RT-05 | Health check và đo lường | L2 | `spring-boot-starter-actuator` ở 7 service + gateway; `management.endpoints.web.exposure.include: health`, `management.endpoint.health.probes.enabled: true`; `healthcheck` trong `../../docker-compose.yml` gọi `/actuator/health/readiness` (không kiểm DB, SMTP để lỗi phụ trợ không đánh dấu service hỏng) | interval 10 s, 12 lần thử, `start_period` 30 s |

### B8. Hệ thống phân tán

| ID | Quy tắc | Mức | Thực thi | Ngưỡng |
| --- | --- | --- | --- | --- |
| DS-01 | Timeout tường minh cho mọi lời gọi mạng | L2 (cấu hình chung) | **Đề xuất:** `spring.cloud.openfeign.client.config.default.connect-timeout` và `read-timeout` cho mọi service; HTTP client của VNPay đặt timeout riêng. Đã có: publisher confirm của outbox `confirm-timeout: 5s` | connect 2.000 ms; read 5.000 ms |
| DS-02 | Retry có giới hạn, backoff, jitter; chỉ cho thao tác idempotent | L3 | Feign mặc định không retry; chỉ bật cho `GET /internal/**`. Outbox relay gửi lại theo chu kỳ (an toàn nhờ `event_id`). Listener RabbitMQ: `spring.rabbitmq.listener.simple.retry` | tối đa 3 lần; backoff 200 ms × 2, có jitter |
| DS-03 | Ghi qua mạng là idempotent | L4 | Theo Design 5.4, 6: consumer bỏ sự kiện trùng theo `event_id`; khóa duy nhất `gateway_txn_ref` (IPN); chỉ đổi reservation đang `DANG_GIU` | — |
| DS-04 | Hợp đồng API kiểm thử tự động | L2 (đề xuất) | **Đề xuất:** (1) DTO sự kiện trong một module hợp đồng dùng chung, kèm test đọc/ghi JSON mẫu; (2) sinh OpenAPI vào `docs/api/*.json` (đã có `mk-auth.json`) và so khác biệt trong CI | — |
| DS-05 | Tracing qua mọi ranh giới service | L2 / L4 | **Đề xuất:** Micrometer Tracing (bridge OpenTelemetry), bật observation cho Feign và RabbitMQ để trace ID đi qua cả REST lẫn sự kiện | — |

## Phần C – Quy tắc ngữ nghĩa

Với Java 21, các quy tắc về khái niệm, tập đóng và trạng thái đạt L1 bằng `record`, `enum`, `sealed` và visibility; việc của nhóm là dùng chúng nhất quán, nhất là cho tiền và ID đi qua nhiều service.

### C1. Tri thức tường minh

| ID | Quy tắc | Mức | Thực thi | Ngưỡng |
| --- | --- | --- | --- | --- |
| KN-01 | Khái niệm có ràng buộc dùng kiểu riêng | L1 | `record` với compact constructor kiểm tra, vd `Money(long vnd)` (≥ 0, VND không số lẻ), `AccountId(UUID value)`. Lưu bằng `@Embeddable` record hoặc `AttributeConverter` | Áp dụng cho: tiền, ID đi qua ranh giới service (account, vendor, order, product), số lượng, email, số định danh đã che |
| KN-02 | Tập giá trị đóng dùng enum / sealed | L1 | `enum` + `@Enumerated(EnumType.STRING)`; rẽ nhánh bằng switch expression (`->`) không `default` để compiler kiểm đủ nhánh (Checkstyle `MissingSwitchDefault` không áp cho switch expression); Error Prone `MissingCasesInEnumSwitch` = ERROR. **Đề xuất:** Checkstyle cấm `EnumType.ORDINAL` | — |
| KN-03 | Mỗi quy tắc nghiệp vụ ở đúng một nơi | L4 (+ L2 đề xuất) | Quy tắc xuyên service theo bảng Design mục 6 (vd phí giao chỉ tính ở catalog, D-14). **Đề xuất:** PMD CPD (`cpd-check`) chặn khối trùng | 0 khối trùng ≥ 100 token trong `src/main` |
| KN-04 | Chính sách thay đổi được nằm ở cấu hình có kiểm tra | L3 | `@ConfigurationProperties` + `@Validated` (vd `OutboxProperties`, `ProductImageProperties`). Chính sách do quản trị đổi lưu ở database có audit: `RegistrationFeeConfig` (vendor), `InterprovinceFee` (catalog), thời hạn khiếu nại (order, D-13) | — |
| KN-05 | Comment giải thích tại sao | L4 | coding-rules Phần 4: dẫn mã `FR`/`AC`/`D`; class nặng có file pseudocode ở `docs/services/<service>/classes/<ClassName>.md` (Phần 5) | — |

### C2. Ngữ nghĩa lỗi

| ID | Quy tắc | Mức | Thực thi | Ngưỡng |
| --- | --- | --- | --- | --- |
| ER-01 | Không dùng null / giá trị đặc biệt cho "không có" | L3 (L2 nếu thêm NullAway) | `Optional<T>` chỉ làm kiểu trả về của `find…`; không dùng `Optional` cho field hay tham số; method trả `List` không bao giờ trả `null`. **Đề xuất:** NullAway + JSpecify `@NullMarked` ở mức package | — |
| ER-02 | Tách lỗi nghiệp vụ dự kiến khỏi lỗi hạ tầng | L1 / L3 | Quy ước: lỗi dự kiến = `AppException(ErrorCode)`; `ErrorCode` là enum mỗi service có mã ổn định và HTTP status. Lỗi hạ tầng (DB, mạng) không bọc thành `AppException`, để handler trả 500. Khi người gọi phải rẽ nhánh theo kết quả (so họ tên `KHOP/GAN_KHOP/KHONG_KHOP`, kết quả thẻ NFC) dùng enum hoặc sealed result, không dùng exception | — |
| ER-03 | Không bắt chung chung rồi nuốt | L2 | Checkstyle `EmptyCatchBlock`, `IllegalCatch` (`Throwable`, `Error`), `noPrintStackTrace`. **Đề xuất:** thêm `Exception`, `RuntimeException` vào `IllegalCatch`; chỗ bắt có chủ đích (`GlobalExceptionHandler`, outbox relay) dùng `@SuppressWarnings("checkstyle:IllegalCatch")` kèm lý do | — |
| ER-04 | Xử lý lỗi cuối tập trung tại ranh giới | L4 | Mỗi service một `@RestControllerAdvice GlobalExceptionHandler` trả `ApiResponse<T>`; có test `GlobalExceptionHandlerTest` (identity). **Đề xuất:** ArchUnit chỉ cho class `GlobalExceptionHandler` dùng `@ExceptionHandler` | — |

### C3. Trạng thái & biến đổi

| ID | Quy tắc | Mức | Thực thi | Ngưỡng |
| --- | --- | --- | --- | --- |
| ST-01 | Bất biến là mặc định | L1 / L2 | `record` cho DTO, sự kiện, value object; field phụ thuộc `private final`; trả collection bằng `List.copyOf`. Entity JPA là ngoại lệ bắt buộc: không setter cho `id`, `createdAt` | — |
| ST-02 | Đối tượng hợp lệ ngay khi tạo | L1 / L4 | DTO request kiểm bằng Bean Validation (`@Valid`) ở controller; value object kiểm trong compact constructor; entity tạo qua constructor hoặc static factory có kiểm tra, constructor rỗng để `protected` cho JPA | — |
| ST-03 | Chuyển trạng thái qua method có tên | L1 (visibility) | Không có `public setStatus`; chuyển bằng method của entity (vd `markDelivered(now)`, `confirmReceived()`) ném `AppException` khi chuyển sai. **Đề xuất:** ArchUnit cấm gọi `setStatus` từ ngoài `..entity..` | — |
| ST-04 | Tách lệnh khỏi truy vấn | L4 | Method `get…`/`find…`/`list…` không đổi trạng thái | Ngoại lệ chấp nhận: `findByIdForUpdate` (khóa dòng + đọc), `saveAndFlush`, lệnh giữ tồn kho có điều kiện (D-01) |
| ST-05 | Không trạng thái toàn cục thay đổi được | L2 | Bean Spring là singleton nên không giữ dữ liệu theo request trong field; bộ đếm (lần thử NFC, OTP) lưu ở database. **Đề xuất:** Checkstyle `MatchXpath` cấm field `static` không `final` | — |

### C4. Kiểm thử

| ID | Quy tắc | Mức | Thực thi | Ngưỡng |
| --- | --- | --- | --- | --- |
| TS-01 | Logic thuần có unit test nhanh, độc lập, tất định | L2 | JUnit 5 + AssertJ + Mockito (`spring-boot-starter-test`); unit test không khởi động Spring context; thời gian lấy từ `Clock` tiêm vào (Error Prone `JavaTimeDefaultTimeZone` = ERROR). **Đề xuất:** JaCoCo `check` theo package | coverage `service.impl`, `entity`, hàm thuần ≥ 80 % (line) |
| TS-02 | Mỗi bug kèm test tái hiện | L4 | PR loại `fix(...)` phải có test đỏ trước khi sửa | — |
| TS-03 | Tên test mô tả hành vi | L4 | Tên method dạng câu, vd `rejectsSubmissionWhenOwnerIsNotAccountHolder`, hoặc `@DisplayName` tiếng Việt | — |
| TS-04 | Ranh giới I/O có test tích hợp với hạ tầng thật | L2 | Testcontainers PostgreSQL ở identity (`RepositoryIntegrationTest`, `IdentityApiIntegrationTest`, profile `application-it.yml`), Flyway chạy thật nên bắt được lệch với `ddl-auto: validate`. **Đề xuất:** nhân rộng cho mọi service có database; thêm container RabbitMQ cho outbox và consumer | — |
| TS-05 | Coverage là sàn cảnh báo | L2 | **Đề xuất:** JaCoCo báo cáo trong CI; so với nhánh `develop` | sàn 60 % mỗi module, không giảm so với `develop` |

## Phần D – Ba vòng cưỡng chế

Vòng 1 và 2 đã chạy chung một cấu hình (`../../api/pom.xml` + `checkstyle.xml`); việc còn lại là thêm các bước đề xuất vào đúng vòng và bật branch protection.

| Vòng | Khi nào | Thời gian mục tiêu | Chạy những gì | Hành vi khi vi phạm | Công cụ |
| --- | --- | --- | --- | --- | --- |
| 1. Tức thì | IDE + pre-commit khi stage `.java`/`pom.xml` | < 15 giây | `spotless:check`, `checkstyle:check` (RP-*, NM-01/05, EX-*, ST-05); commit message Conventional Commits. **Đề xuất:** `gitleaks protect --staged` (RT-04) | Chặn commit; format sửa bằng `./mvnw spotless:apply` | `../../.editorconfig`, `.githooks/pre-commit`, `.githooks/commit-msg` |
| 2. Tích hợp | Mỗi PR và push vào `main`, `develop` có đổi `api/**` | < 10 phút | `./mvnw -B -ntp clean verify`: Spotless, Checkstyle (gồm độ phức tạp FN-02/03/04/06, MD-03 khi thêm), Error Prone, unit + integration test, ArchUnit (DP-01/02). **Đề xuất:** JaCoCo (TS-01/05), CPD (KN-03), gitleaks, Dependabot (DP-04). Kiểm tên nhánh, hướng PR, tiêu đề PR | Chặn merge | GitHub Actions `code-quality.yml`, `pr-conventions.yml` |
| 3. Thiết kế | Code review mỗi PR | Theo PR | Quy tắc L4; mọi thay đổi chạm B7–B8, tiền, PII, sự kiện | Yêu cầu sửa hoặc ghi ngoại lệ (Phần E) | — |

### Quy tắc vận hành

- Mỗi máy dev bật hook một lần: `git config core.hooksPath .githooks`.
- Vòng 1 và 2 dùng cùng `../../api/config/checkstyle/checkstyle.xml` và cùng plugin trong `api/pom.xml`; không ai cấu hình Checkstyle riêng trong IDE.
- Bật quy tắc độ phức tạp mới: thêm với `severity="info"`, đo số vi phạm trên code hiện có, sửa dần rồi nâng lên `error` — không tắt quy tắc vì code cũ vi phạm.
- Bật branch protection cho `main` và `develop`: bắt buộc qua `verify` và `check`. Lưu ý: `code-quality.yml` lọc theo `paths: api/**`, nên PR không đụng `../../api` sẽ không có check này; đặt nó làm required check thì cần thêm job luôn chạy hoặc bỏ bộ lọc.
- Không có lối tắt bỏ qua CI; `git commit --no-verify` chỉ bỏ được vòng 1.

### Cấu hình đề xuất cần thêm

Checkstyle (thêm vào `TreeWalker` của `checkstyle.xml`):

```xml
<module name="CyclomaticComplexity"><property name="max" value="10"/></module>
<module name="NPathComplexity"><property name="max" value="200"/></module>
<module name="NestedIfDepth"><property name="max" value="2"/></module>
<module name="NestedForDepth"><property name="max" value="1"/></module>
<module name="NestedTryDepth"><property name="max" value="1"/></module>
<module name="BooleanExpressionComplexity"><property name="max" value="3"/></module>
<module name="ParameterNumber">
    <property name="max" value="5"/>
    <property name="ignoreOverriddenMethods" value="true"/>
    <property name="tokens" value="METHOD_DEF"/>
</module>
<module name="MethodLength">
    <property name="max" value="50"/>
    <property name="countEmpty" value="false"/>
    <property name="severity" value="info"/>
</module>
<module name="MatchXpath">
    <property name="id" value="noMutableStatic"/>
    <property name="query" value="//VARIABLE_DEF[./MODIFIERS/LITERAL_STATIC and not(./MODIFIERS/FINAL)]"/>
    <message key="matchxpath.match" value="Không dùng field static thay đổi được (ST-05)."/>
</module>
```

`FileLength` (max 500, `severity="info"`) đặt ngoài `TreeWalker`, cạnh `LineLength`. Câu nhắc của `noFloatingMoney` đã sửa thành "Tiền tệ dùng long (VND), không dùng double/float".

`application.yml` dùng chung cho mọi service nghiệp vụ (RT-02, DS-01, RT-05):

```yaml
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 20s
  jpa:
    open-in-view: false
  cloud:
    openfeign:
      client:
        config:
          default:
            connect-timeout: 2000
            read-timeout: 5000
management:
  endpoints:
    web:
      exposure:
        include: health
  endpoint:
    health:
      probes:
        enabled: true
```

### Checklist cho người review (chỉ phần máy không kiểm được)

Giữ nguyên checklist của template, thêm 5 mục riêng của Moonkage:

- [ ] **Tiền (NFR-09):** tiền là `long` VND hoặc `Money`; mọi lần ghi sổ kiểm `disbursed + refunded + paid_out ≤ tổng đã thu` trong cùng transaction.
- [ ] **PII (NFR-03):** số CCCD, số định danh, `card_text` không xuất hiện trong log, sự kiện, audit, `toString()` của DTO; chỉ dạng đã che.
- [ ] **Luật kiểm ở máy chủ:** BR-22, BR-23, BR-27, BR-31 kiểm trong service, không dựa vào giao diện hay claim JWT (Design mục 6).
- [ ] **Sự kiện:** sự kiện về tiền, đơn, tồn kho, audit ghi vào outbox trong cùng transaction; consumer bỏ qua `event_id` trùng.
- [ ] **Ranh giới service:** không đọc database của service khác; dữ liệu người bán lấy từ `vendor_snapshot`; không thêm service, bảng hay sự kiện ngoài Software Design mà chưa hỏi nhóm.

## Phần E – Ngoại lệ, đo lường và tiến hóa

Repo đang có 4 ngoại lệ cấp dự án; tất cả đã có lý do trong cấu hình, chỉ thiếu người duyệt và mốc xem lại.

### E1. Ngoại lệ

Cú pháp bỏ qua tại chỗ (phạm vi một method hoặc một field, luôn kèm comment lý do):

- Checkstyle: `@SuppressWarnings("checkstyle:<TênCheck>") // <lý do, mã quy tắc>`
- Error Prone: `@SuppressWarnings("<TênBugPattern>") // <lý do>`
- ArchUnit: không bỏ qua từng dòng; vi phạm có chủ đích ghi vào bảng dưới và dùng `FreezingArchRule` nếu cần đóng băng baseline.

| ID quy tắc | Phạm vi | Lý do | Người duyệt | Xem lại vào |
| --- | --- | --- | --- | --- |
| EX-04 | Toàn `../../api`: Error Prone `UnusedVariable` = WARN | Controller, service còn là stub có field chưa dùng | \[NGƯỜI CHỊU TRÁCH NHIỆM\] | Khi hết stub; nâng lại ERROR |
| EX-01 | `src/test/**`: tắt `MagicNumber` | Giá trị cụ thể trong assertion là bình thường | \[NGƯỜI CHỊU TRÁCH NHIỆM\] | Mỗi quý |
| NM-01 | `ConstantName` cho phép tên `log` | Quy ước SLF4J / Lombok `@Slf4j` | \[NGƯỜI CHỊU TRÁCH NHIỆM\] | Mỗi quý |
| ST-01 | Entity JPA trong `..entity..` | Hibernate cần entity mutable và constructor rỗng | \[NGƯỜI CHỊU TRÁCH NHIỆM\] | Mỗi quý |

### E2. Đo lường

| Chỉ số | Nguồn | Mục tiêu / xu hướng |
| --- | --- | --- |
| Số suppression tại chỗ | Đếm `@SuppressWarnings("checkstyle:` và Error Prone trong `api/**/src/main` | Không tăng |
| Số quy tắc L4 có thể nâng lên L2 | Retro sau mỗi sprint | Giảm dần; mốc gốc là các mục **Đề xuất** |
| Tỷ lệ bình luận review về hình thức | Mẫu PR | Gần 0 |
| Thời gian vòng 1 / vòng 2 | Hook (đo tay) / thời lượng job `verify` trên GitHub Actions | < 15 s / < 10 phút |
| Lỗi production theo tầng | Postmortem (`../archive`) | Lỗi cùng loại không lặp lại |
| Vi phạm độ phức tạp (`severity=info`) | Báo cáo Checkstyle trong CI | Giảm dần tới 0 rồi nâng `error` |

### E3. Việc cần làm để đạt bộ quy tắc

Xếp theo rủi ro: việc chặn lỗi tiền, PII và treo hệ thống làm trước.

- [x] Nhóm chốt kiểu tiền (`long` VND) và tên `orchestrator-service`
- [ ] Thêm timeout OpenFeign, `open-in-view: false`, graceful shutdown cho mọi service (DS-01, RT-02)
- [x] Thêm `spring-boot-starter-actuator` và `healthcheck` trong `../../docker-compose.yml` (RT-05)
- [x] Hạ `AbbreviationAsWordInName` xuống `1` (NM-01)
- [ ] Thêm gitleaks vào pre-commit và CI (RT-04)
- [ ] Tạo `.github/dependabot.yml` cho Maven và GitHub Actions (DP-04)
- [ ] Thêm các check độ phức tạp vào `checkstyle.xml` ở `severity=info` (FN-02/03/04/06, MD-03)
- [ ] Thêm JaCoCo vào `../../api/pom.xml`, báo cáo trong CI (TS-01, TS-05)
- [ ] Nhân rộng Testcontainers sang các service có database, sau khi chốt thiết kế database (TS-04)
- [ ] Thêm luật ArchUnit: tên class cấm, method `boolean`, entity ↛ tầng trên, Feign chỉ trong `..client..` (NM-02, NM-03, DP-02, DP-03)
- [ ] Bật branch protection cho `main`, `develop` với check bắt buộc
- [ ] Đánh giá NullAway + JSpecify (ER-01), Micrometer Tracing + log JSON (DS-05, RT-03)

Mọi thay đổi bộ quy tắc đi qua PR như code; sau mỗi sự cố, postmortem hỏi "quy tắc nào lẽ ra đã chặn lỗi này, ở mức nào?".

### Nguồn

- [Template quy tắc chất lượng mã nguồn](https://claude.ai/code/artifact/f0431faf-c16b-418f-8eda-0b690de7cc34)
- [Repo LeTran30/MSS301-moonkage-platform-project](https://github.com/LeTran30/MSS301-moonkage-platform-project): `../../api/pom.xml`, `api/config/`, `.githooks/`, `.github/workflows/`, `docs/conventions/coding-rules.md`
- Software Design v0.5 (Project "Moonkage: Marketplace Platform", `claude/Software_Design.md`)

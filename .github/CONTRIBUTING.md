# Hướng dẫn đóng góp (Contributing)

Tài liệu này dành cho **mọi người đóng góp: thành viên team và AI agents**. Các quy tắc ở đây được cưỡng chế bằng công cụ, branch protection và CI. PR vi phạm sẽ không merge được.

> Agents: đọc thêm [`AGENTS.md`](../AGENTS.md) để biết các quy tắc bổ sung dành riêng cho bạn.

---

## Hai phần, một ranh giới

Tài liệu chia làm hai phần, tương ứng với hai nơi code đi qua:

```text
  PHẦN I · LOCAL                                PHẦN II · REMOTE
  Việc của mỗi người                            Việc của cả team
 ┌────────────────────────────────┐            ┌────────────────────────────────┐
 │ Viết code                      │            │ Branch, commit message         │
 │ Tự đảm bảo chất lượng code     │  git push  │ Pull Request, code review      │
 │ Chạy ./mvnw verify cho xanh    │ ─────────▶ │ Merge vào main                 │
 │                                │            │                                │
 │ Chốt chặn: IDE, hook, verify   │            │ Chốt chặn: CI, reviewer,       │
 │ Người chịu trách nhiệm: BẠN    │            │ branch protection: CẢ TEAM     │
 └────────────────────────────────┘            └────────────────────────────────┘
```

- **Phần I · Local.** Mọi thứ diễn ra trên máy bạn, trước khi push. Chất lượng code là trách nhiệm cá nhân: bạn viết, bạn tự kiểm tra, bạn đảm bảo nó xanh.
- **Phần II · Remote.** Mọi thứ trở thành tài sản chung sau khi push: nhánh, lịch sử commit, PR, `main`. Đây là việc tập thể, nên được điều phối bằng quy ước chung và được cả team kiểm soát.

Commit và branch được tạo trên máy bạn, nhưng chúng sẽ trở thành lịch sử chung. Vì vậy quy ước về chúng thuộc **Phần II**.

**Cầu nối giữa hai phần:** lệnh kiểm tra ở local **giống hệt** lệnh CI chạy. Xanh ở máy bạn thì CI cũng xanh. CI không phải công cụ để tìm lỗi; nó là bước xác nhận lại việc bạn đã làm.

---

## Mục lục

**[Phần I. Local, việc của mỗi người](#phần-i-local-việc-của-mỗi-người)**

1. [Nguyên tắc cá nhân](#1-nguyên-tắc-cá-nhân)
2. [Thiết lập môi trường local](#2-thiết-lập-môi-trường-local)
3. [Bức tranh chất lượng code](#3-bức-tranh-chất-lượng-code)
4. [Công cụ và ngưỡng](#4-công-cụ-và-ngưỡng)
5. [Tự động hóa định dạng và câu lệnh](#5-tự-động-hóa-định-dạng-và-câu-lệnh)
6. [Quy ước viết code](#6-quy-ước-viết-code)
7. [Test](#7-test)
8. [Kiến trúc](#8-kiến-trúc)
9. [Dependencies](#9-dependencies)
10. [Bỏ qua quy tắc](#10-bỏ-qua-quy-tắc)
11. [Tự kiểm tra trước khi push](#11-tự-kiểm-tra-trước-khi-push)
12. [AI agents ở local](#12-ai-agents-ở-local)
13. [Câu hỏi thường gặp ở local](#13-câu-hỏi-thường-gặp-ở-local)

**[Phần II. Remote, việc của cả team](#phần-ii-remote-việc-của-cả-team)**

14. [Nguyên tắc tập thể](#14-nguyên-tắc-tập-thể)
15. [Chiến lược nhánh](#15-chiến-lược-nhánh)
16. [Đặt tên branch](#16-đặt-tên-branch)
17. [Commit message](#17-commit-message)
18. [Quy trình làm việc từng bước](#18-quy-trình-làm-việc-từng-bước)
19. [Pull Request](#19-pull-request)
20. [Code review](#20-code-review)
21. [Merge](#21-merge)
22. [AI agents ở remote](#22-ai-agents-ở-remote)
23. [Câu hỏi thường gặp ở remote](#23-câu-hỏi-thường-gặp-ở-remote)

---
---

## Phần I. Local, việc của mỗi người

> Trước khi push, code là của bạn. Bạn chịu trách nhiệm để nó đúng, sạch và xanh.

### 1. Nguyên tắc cá nhân

- **Bạn sở hữu chất lượng code của mình.** Reviewer và CI giúp phát hiện sót, không làm thay phần việc của bạn.
- **Xanh ở local trước khi push.** Chạy `./mvnw verify` (hoặc `./gradlew check`) và đảm bảo pass trước khi mở PR.
- **Máy lo hình thức, bạn lo ý nghĩa.** Format, naming, lỗi cú pháp do công cụ xử lý. Thời gian của bạn dành cho logic, thiết kế và test.
- **Không nới lỏng tiêu chuẩn để code qua được.** Không hạ ngưỡng, không tắt rule, không thêm suppression thiếu lý do (xem [mục 10](#10-bỏ-qua-quy-tắc)).
- **Không đưa bí mật vào code.** API key, mật khẩu, file `.env` không bao giờ được nằm trong file được commit.

### 2. Thiết lập môi trường local

**Yêu cầu:** JDK 21, Docker (cho Testcontainers). Dùng wrapper có sẵn trong repo (`./mvnw` hoặc `./gradlew`), không cần cài Maven/Gradle riêng.

**Cài Git hooks** (một lần sau khi clone):

```bash
git config core.hooksPath .githooks
chmod +x .githooks/*
```

Repo có sẵn hai hook trong thư mục `.githooks/`:

| Hook | Việc nó làm | Thuộc phần |
|---|---|---|
| `pre-commit` | Chạy `spotless:check` và `checkstyle:check`. Sai thì chặn commit | I · chất lượng code |
| `commit-msg` | Từ chối commit sai định dạng Conventional Commits | II · quy ước chung ([mục 17](#17-commit-message)) |

**IDE (IntelliJ):**

- Bật hỗ trợ **EditorConfig** (mặc định đã bật). IDE sẽ đọc `.editorconfig`: thụt 4 space, xuống dòng LF, dòng tối đa 120 ký tự.
- Cài plugin **palantir-java-format** để format giống hệt Spotless.
- Cài plugin **CheckStyle-IDEA**, trỏ tới `config/checkstyle/checkstyle.xml` để thấy lỗi ngay khi gõ.

**File cấu hình liên quan đến chất lượng code:**

```
.editorconfig                       ← định dạng cơ bản cho mọi editor
.mvn/jvm.config                     ← bắt buộc để Error Prone chạy trên JDK 21
config/checkstyle/checkstyle.xml    ← quy tắc Checkstyle
config/pmd/                         ← ruleset PMD
.githooks/pre-commit                ← chốt chặn trước commit
.claude/settings.json               ← hook tự format cho Claude Code (tùy chọn)
```

### 3. Bức tranh chất lượng code

Chất lượng code được nhìn theo **các tầng, từ vi mô đến vĩ mô**. Mỗi tầng có công cụ kiểm tra riêng. Tầng càng thấp thì càng tự động hóa được nhiều.

| Tầng | Đơn vị | Kiểm tra bằng | Mức tự động | Thuộc phần |
|---|---|---|---|---|
| T0 | Ký tự, định dạng | `.editorconfig`, Spotless | Tự sửa 100% | I |
| T1 | Câu lệnh, biểu thức | Checkstyle, Error Prone | Tự báo lỗi | I |
| T2 | Method | PMD, unit test | Phần lớn | I |
| T3 | Class | SpotBugs, PMD, unit test | Một phần | I |
| T4 | Package, phân tầng | ArchUnit | Một phần (viết thành test) | I |
| T5 | Ứng dụng | Integration test, Testcontainers | Một phần | I |
| T6 | Hệ thống, API, migration | Code Owner review, contract | Ít | II |
| T7 | Quy trình | Branch, commit, PR, CI | Cưỡng chế bằng nền tảng | II |

Hệ quả: T0–T5 nằm trọn trong tay bạn ở local. T6–T7 cần cả team.

**Bốn thời điểm kiểm tra.** Cùng một bộ luật, chạy ở bốn thời điểm. Càng sớm càng rẻ:

```
 Lúc gõ code     →  IDE đọc .editorconfig, plugin Checkstyle báo lỗi tại chỗ
 Agent sửa file  →  Hook Claude Code tự chạy spotless:apply trên file vừa sửa
 Lúc commit      →  .githooks/pre-commit: spotless:check + checkstyle:check
 ─────────────── ranh giới local / remote ───────────────
 Lúc mở PR       →  CI chạy ./mvnw verify  ← chốt chặn không thể bỏ qua
```

Ba lớp đầu thuộc Phần I và giúp bạn phát hiện sớm. Lớp cuối thuộc Phần II: hook có thể bị bỏ qua, CI thì không.

### 4. Công cụ và ngưỡng

```bash
./mvnw verify          # Maven
./gradlew check        # Gradle
```

| Khía cạnh | Công cụ | Ngưỡng / quy tắc | Chặn merge? |
|---|---|---|---|
| Định dạng | Spotless + palantir-java-format | Không lệch format | ✅ |
| Quy ước code | Checkstyle | Cấu hình tại `config/checkstyle/` | ✅ |
| Lỗi tiềm ẩn | Error Prone, SpotBugs | Không có lỗi mức High | ✅ |
| Code smell | PMD | Theo ruleset tại `config/pmd/` | ✅ |
| Test | JUnit 5 | 100% test pass, không test bị `@Disabled` mà không có lý do | ✅ |
| Coverage | JaCoCo | ≥ **80%** line coverage trên **code mới** | ✅ |
| Kiến trúc | ArchUnit | Tuân thủ quy tắc phân tầng ([mục 8](#8-kiến-trúc)) | ✅ |
| Tổng hợp | SonarQube / SonarCloud | Quality Gate "Sonar way" trên code mới | ✅ |
| Lỗ hổng thư viện | Dependabot / OWASP Dependency-Check | Không có CVE mức High/Critical | ✅ |

Maven chạy các công cụ theo thứ tự từ rẻ đến đắt, nên lỗi đơn giản được báo trong vài giây:

```
./mvnw verify
 ├─ validate  → Spotless check, Checkstyle      (vài giây)
 ├─ compile   → javac + Error Prone
 ├─ test      → unit test, ArchUnit
 └─ verify    → integration test, JaCoCo, kiểm tra cuối
```

> Các ngưỡng trên là mặc định của dự án. Muốn thay đổi, mở PR sửa cấu hình và cần Code Owner duyệt. Thay đổi tiêu chuẩn là việc tập thể.

### 5. Tự động hóa định dạng và câu lệnh

Hai tầng thấp nhất (T0, T1) **hoàn toàn do máy lo**. Không cần nhớ quy tắc, không cần tranh luận khi review.

#### 5.1. Ba công cụ, ba vai trò

| Công cụ | Tầng | Cơ chế | Tự sửa? |
|---|---|---|---|
| **Spotless** | T0 | Dựng cây cú pháp (AST), bỏ toàn bộ cách trình bày cũ rồi in lại code theo chuẩn. Kết quả chỉ phụ thuộc nội dung, không phụ thuộc cách bạn gõ | ✅ Có |
| **Checkstyle** | T1 cú pháp | Đọc **từng file**, duyệt AST và so khớp theo dòng. Không biết kiểu dữ liệu | ❌ Chỉ báo |
| **Error Prone** | T1 ngữ nghĩa | Chạy **bên trong javac** sau khi đã gán kiểu, nên thấy được kiểu dữ liệu và luồng dữ liệu. Báo lỗi như lỗi compile | ❌ Chỉ báo |

**Phân vai:** Spotless là chủ duy nhất của định dạng. Checkstyle được cấu hình **không** kiểm tra thụt lề và khoảng trắng, nên hai công cụ không bao giờ mâu thuẫn nhau.

#### 5.2. Checkstyle bắt những gì

| Nhóm | Ví dụ vi phạm |
|---|---|
| Đặt tên | `static final String prefix`, `class HTTPURLParser` |
| Import | `import java.util.*;`, `import java.util.Date;` (dùng `java.time`) |
| Câu lệnh | `if (x) return;` (thiếu `{}`), `catch (Exception e) {}` (catch rỗng) |
| Giá trị | `qty > 100` (magic number), `s == "abc"`, `10l` |
| Riêng dự án | `System.out.println(...)`, `e.printStackTrace()` |
| Riêng dự án | `log.info("Đơn " + id)` (phải dùng placeholder) |
| Riêng dự án | `@Autowired private OrderRepository repo;` (phải dùng constructor injection) |
| Riêng dự án | `double totalPrice` (tiền tệ phải dùng `BigDecimal`) |
| Riêng dự án | `// TODO sửa sau` (phải là `// TODO(#42): ...`) |

Một số luật chỉ bắt được một phần, vì Checkstyle không biết kiểu dữ liệu:

- Luật `double` cho tiền tệ dựa vào **tên biến** (price, amount, total, balance, fee).
- Luật `@Autowired` chỉ nhận ra **tên** annotation, không hiểu Spring.

Những trường hợp còn lại do Error Prone, ArchUnit và reviewer xử lý.

#### 5.3. Error Prone bắt những gì

Những lỗi cần biết kiểu dữ liệu, Checkstyle không làm được:

- So sánh `==` với object có override `equals()` (`ReferenceEquality`)
- Biến hoặc method private không dùng (`UnusedVariable`, `UnusedMethod`)
- Dùng charset hoặc múi giờ mặc định của hệ thống (`DefaultCharset`, `JavaTimeDefaultTimeZone`)
- `switch` trên enum thiếu case (`MissingCasesInEnumSwitch`)

> **Lưu ý cho dự án dùng Lombok / MapStruct:** Error Prone được nạp qua `annotationProcessorPaths`. Khi khai báo danh sách này, javac ngừng tự tìm annotation processor trên classpath. Lombok và MapStruct **phải** được khai báo vào cùng chỗ trong `pom.xml`, nếu không code sẽ lỗi compile.

#### 5.4. Lệnh hằng ngày

| Việc | Maven | Gradle |
|---|---|---|
| Format lại code | `./mvnw spotless:apply` | `./gradlew spotlessApply` |
| Kiểm tra format | `./mvnw spotless:check` | `./gradlew spotlessCheck` |
| Chạy Checkstyle | `./mvnw checkstyle:check` | `./gradlew checkstyleMain` |
| Chạy toàn bộ | `./mvnw verify` | `./gradlew check` |

Không tự format thủ công. Trước khi commit, chạy `spotless:apply` rồi `git add` lại.

### 6. Quy ước viết code

Phần này gồm những quy ước **không** tự động hóa hết được. Bạn cần tự nắm.

**Chung**

- Phiên bản Java: **21** (LTS). Được dùng `record`, `sealed`, pattern matching, `var` khi kiểu đã rõ ràng từ vế phải.
- Đặt tên: `PascalCase` cho class, `camelCase` cho method/biến, `UPPER_SNAKE_CASE` cho hằng số. Tên phải nói lên ý nghĩa, không viết tắt khó hiểu.
- Method ngắn: tối đa khoảng **40 dòng**, độ phức tạp cyclomatic ≤ **10**, tối đa **5 tham số**. Vượt ngưỡng thì tách nhỏ.
- Không để magic number hay magic string. Đưa vào hằng số hoặc cấu hình.
- Không để code bị comment, `System.out.println`, `printStackTrace()` trong code chính.
- Comment giải thích **vì sao**, không lặp lại code làm **gì**. Public API phải có Javadoc.
- Tiền tệ dùng `BigDecimal`. Thời gian dùng `java.time` (`Instant`, `LocalDate`, `OffsetDateTime`).

**Thiết kế**

- Ưu tiên bất biến: field `final`, dùng `record` cho DTO/value object, trả về collection không sửa được (`List.copyOf`, `Collections.unmodifiableList`).
- **Constructor injection**, không dùng field injection (`@Autowired` trên field).
- Không trả về `null` cho collection. Trả về collection rỗng.
- `Optional` chỉ dùng làm kiểu trả về, không dùng cho field hay tham số. Không gọi `Optional.get()` trực tiếp.
- Không để logic nghiệp vụ trong controller hay entity.

**Xử lý lỗi**

- Không nuốt exception (`catch` rỗng hoặc chỉ log rồi bỏ qua mà không có lý do).
- Không `catch (Exception e)` hay `catch (Throwable t)` chung chung, trừ ở tầng xử lý lỗi toàn cục.
- Dùng exception nghiệp vụ có ý nghĩa, kèm nguyên nhân gốc: `throw new PaymentFailedException("...", e)`.
- Tài nguyên (stream, connection) luôn mở bằng `try-with-resources`.

**Logging**

- Dùng SLF4J với placeholder: `log.info("Đơn {} đã thanh toán", orderId)`, không nối chuỗi.
- Chọn đúng mức: `ERROR` khi cần người xử lý, `WARN` bất thường nhưng tự phục hồi được, `INFO` sự kiện nghiệp vụ, `DEBUG` chi tiết kỹ thuật.
- **Không log dữ liệu nhạy cảm:** mật khẩu, token, số thẻ, CCCD, thông tin cá nhân.

**Bảo mật**

- Truy vấn SQL dùng tham số hoá (JPA, `PreparedStatement`), không nối chuỗi.
- Validate dữ liệu đầu vào tại biên (Bean Validation `@Valid`).
- Không hard-code bí mật. Đọc từ biến môi trường hoặc secret manager.

### 7. Test

- Framework: **JUnit 5 + AssertJ + Mockito**. Integration test với database/message broker dùng **Testcontainers**.
- Mỗi thay đổi `feat`/`fix` phải có test đi kèm. Thay đổi `fix` cần test tái hiện lỗi.
- Đặt tên test mô tả hành vi: `shouldRejectPayment_whenBalanceInsufficient()` hoặc dùng `@DisplayName`.
- Cấu trúc **Given / When / Then**, mỗi test kiểm tra một hành vi.
- Test phải độc lập, chạy được theo thứ tự bất kỳ, không phụ thuộc thời gian thực hay mạng ngoài.
- Không mock những gì mình không sở hữu khi có thể dùng Testcontainers hoặc fake.

### 8. Kiến trúc

Quy tắc phân tầng được kiểm tra bằng ArchUnit (`src/test/java/.../ArchitectureTest.java`). Đây là các luật cần nhìn **nhiều file cùng lúc**, nên Checkstyle và Error Prone không làm được:

```
controller ──▶ service ──▶ repository
     │             │
     └──▶ dto      └──▶ domain
```

- `controller` không gọi thẳng `repository`.
- `domain` không phụ thuộc framework (Spring, JPA annotation chỉ ở tầng persistence nếu tách riêng).
- Không có phụ thuộc vòng giữa các package.

### 9. Dependencies

- Phiên bản quản lý tập trung: Maven `<dependencyManagement>` / BOM, hoặc Gradle **version catalog** (`gradle/libs.versions.toml`).
- Dependency do Spring Boot BOM quản lý thì không ghi `<version>`.
- Không dùng phiên bản `SNAPSHOT` hay khoảng phiên bản (`1.+`) trên `main`.
- Thêm thư viện mới phải giải thích trong mô tả PR: vì sao cần, đã cân nhắc lựa chọn nào khác, license.

### 10. Bỏ qua quy tắc

Đôi khi một cảnh báo là false positive. Được phép bỏ qua **từng trường hợp cụ thể**, luôn kèm lý do:

```java
@SuppressWarnings("unchecked") // An toàn: list chỉ chứa String, đã kiểm tra ở dòng 42
@SuppressWarnings("checkstyle:MagicNumber") // Hệ số chuẩn của thuật toán X, xem tài liệu Y
```

- Không suppress ở mức class hay package.
- Không dùng `// NOSONAR`, `@SuppressFBWarnings`, `// CHECKSTYLE:OFF` mà không có lý do.
- Không được hạ ngưỡng coverage hay tắt rule trong cấu hình để PR qua được.

### 11. Tự kiểm tra trước khi push

**Phần máy kiểm tra.** Một lệnh, phải xanh:

```bash
./mvnw spotless:apply verify      # hoặc: ./gradlew spotlessApply check
```

**Phần bạn tự kiểm tra.** Những gì máy không thấy:

- [ ] Logic đúng, xử lý đủ trường hợp biên (null, rỗng, giá trị cực đại, đồng thời)
- [ ] Có test cho hành vi mới hoặc lỗi được sửa; test có ý nghĩa, không chỉ để tăng coverage
- [ ] Exception được xử lý đúng, không nuốt lỗi
- [ ] Không log hay để lộ dữ liệu nhạy cảm, không có bí mật trong code
- [ ] Transaction đặt đúng chỗ, không có truy vấn N+1
- [ ] Thread-safety với code dùng chung trạng thái
- [ ] Tên rõ ràng, method ngắn, không trùng lặp code
- [ ] Suppression (nếu có) đều kèm lý do hợp lý
- [ ] Đã tự đọc lại toàn bộ diff như một reviewer khó tính

### 12. AI agents ở local

AI agents (Claude, Copilot, Cursor…) tuân theo **toàn bộ** Phần I, cộng thêm:

| Quy định | Lý do |
|---|---|
| Chạy `./mvnw verify` (hoặc `./gradlew check`) và đảm bảo xanh **trước** khi mở PR | Không đẩy việc tìm lỗi cơ bản sang CI và reviewer |
| Không sửa cấu hình Checkstyle, PMD, SpotBugs, Error Prone, JaCoCo, Sonar; không hạ ngưỡng, không thêm suppression để code qua được | Tránh tự nới lỏng tiêu chuẩn chất lượng |
| Mỗi thay đổi `feat`/`fix` phải kèm test; không xoá hay `@Disabled` test đang có | Agent dễ "sửa" test cho khớp với code sai |
| Theo pattern sẵn có trong codebase (cách đặt package, xử lý lỗi, logging) thay vì tự đặt kiểu mới | Giữ code nhất quán |
| Không "tiện tay" refactor phần code ngoài phạm vi ticket | Giữ thay đổi nhỏ, dễ review |
| Không thêm dependency mới khi chưa được giao rõ ràng | Kiểm soát license, bảo mật, kích thước build |
| Không tự format thủ công; để Spotless làm (hook `.claude/settings.json` tự chạy sau mỗi lần sửa file `.java`) | Không tạo diff thừa vì sai format |

### 13. Câu hỏi thường gặp ở local

**Máy tôi xanh nhưng CI báo lỗi format?**
Có thể bạn chưa chạy `spotless:apply` sau lần sửa cuối, hoặc đang dùng Maven/Gradle cài riêng thay vì wrapper. Luôn dùng `./mvnw` hoặc `./gradlew` để cùng version với CI.

**Bật Error Prone xong thì Lombok hết hoạt động?**
Thêm Lombok (và MapStruct nếu có) vào `annotationProcessorPaths` trong `pom.xml`. Xem [mục 5.3](#53-error-prone-bắt-những-gì).

**Error Prone báo lỗi liên quan đến `com.sun.tools.javac`?**
Thiếu file `.mvn/jvm.config`. File này mở khoá API nội bộ của JDK mà Error Prone cần.

**Cảnh báo là false positive thì sao?**
Suppress đúng chỗ, kèm lý do. Xem [mục 10](#10-bỏ-qua-quy-tắc).

---
---

## Phần II. Remote, việc của cả team

> Sau khi push, code trở thành tài sản chung. Nhánh, lịch sử commit và `main` được quản lý bằng quy ước chung và kiểm soát bởi cả team.

### 14. Nguyên tắc tập thể

- **Không push thẳng lên `main`.** Mọi thay đổi đều đi qua Pull Request.
- **PR nhỏ, sống ngắn.** Mục tiêu dưới 400 dòng thay đổi, merge trong vòng 1–2 ngày.
- **`main` luôn ở trạng thái deploy được.** Tính năng chưa xong thì ẩn sau feature flag.
- **Không dùng `--force` trên nhánh dùng chung, không dùng `--no-verify`.**
- **Lỡ commit bí mật** (API key, mật khẩu, file `.env`)? Báo ngay cho team lead để thu hồi key. Xoá khỏi lịch sử không đủ, vì key có thể đã bị sao chép.
- **Thay đổi tiêu chuẩn là quyết định chung.** Sửa ngưỡng, rule, CI hay tài liệu này đều phải qua PR và được Code Owner duyệt.

### 15. Chiến lược nhánh

Dự án dùng **trunk-based development**:

```
main ──●────●────●────●────●──▶
        \  /      \  /
         ●●        ●●●
   feat/PAY-142   fix/PAY-150
```

- `main` là nhánh duy nhất tồn tại lâu dài và được bảo vệ.
- Mọi nhánh làm việc tạo từ `main` mới nhất và merge về `main` qua PR.
- Xoá nhánh sau khi merge (tự động trên GitHub).

### 16. Đặt tên branch

**Định dạng:**

```
[agent/]<type>/<ticket>-<mo-ta-ngan>
```

| Thành phần | Quy tắc |
|---|---|
| `agent/` | Chỉ dùng khi nhánh do AI agent tạo |
| `type` | Một trong: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`, `hotfix` |
| `ticket` | Mã ticket (ví dụ `PAY-142`); có thể bỏ với `chore`/`docs` nhỏ |
| `mo-ta-ngan` | Chữ thường, không dấu, nối bằng `-`, tối đa khoảng 5 từ |

**Ví dụ hợp lệ:**

```
feat/PAY-142-thanh-toan-qr
fix/PAY-150-loi-lam-tron-tien
chore/cap-nhat-dependencies
agent/refactor/PAY-160-tach-service-hoa-don
```

**Ví dụ không hợp lệ:** `PAY-142`, `Feat/ThanhToan`, `fix_bug`, `minh-test`

CI kiểm tra tên branch bằng regex:

```
^(agent/)?(feat|fix|chore|docs|refactor|test|perf|ci|hotfix)/[a-z0-9._-]+$
```

**Ngoại lệ:** nhánh do Dependabot tạo luôn có dạng `dependabot/...` và không đổi được tiền tố. CI bỏ qua kiểm tra tên với các nhánh này. Tiêu đề PR của Dependabot vẫn theo Conventional Commits (`chore(deps): ...`), và PR vẫn cần người thật approve như PR của agent.

### 17. Commit message

Dự án dùng **[Conventional Commits](https://www.conventionalcommits.org/)**. Commit được tạo trên máy bạn, nhưng sẽ trở thành lịch sử chung và là nguồn sinh CHANGELOG, nên định dạng phải thống nhất.

#### Định dạng

```
<type>(<scope>): <mô tả ngắn>

[thân: giải thích vì sao thay đổi, không chỉ thay đổi gì]

[footer: Refs: PAY-142 | BREAKING CHANGE: ...]
```

#### Các `type`

| Type | Dùng khi | Ảnh hưởng version |
|---|---|---|
| `feat` | Thêm tính năng mới | minor |
| `fix` | Sửa lỗi | patch |
| `perf` | Cải thiện hiệu năng | patch |
| `refactor` | Thay đổi code, không đổi hành vi | — |
| `docs` | Chỉ thay đổi tài liệu | — |
| `test` | Thêm hoặc sửa test | — |
| `chore` | Việc vặt: dependencies, cấu hình | — |
| `ci` | Thay đổi pipeline CI/CD | — |

Breaking change: thêm `!` sau type/scope **hoặc** footer `BREAKING CHANGE:`. Thay đổi này tăng major version.

#### Quy tắc viết

- Dòng đầu tối đa **72 ký tự**, không kết thúc bằng dấu chấm.
- Viết ở dạng mệnh lệnh: "thêm", "sửa", "xoá", không viết "đã thêm".
- `scope` là module bị ảnh hưởng: `auth`, `payment`, `api`, `ui`…
- Mỗi commit là **một thay đổi logic**. Đừng gộp sửa lỗi với refactor.
- Lần format toàn bộ code (khi mới áp dụng Spotless) phải nằm trong **một commit riêng** `style: ...`, và hash của nó được thêm vào `.git-blame-ignore-revs` để `git blame` không bị nhiễu.

#### Ví dụ

```
feat(payment): thêm thanh toán bằng mã QR

Khách hàng yêu cầu thanh toán nhanh tại quầy. Tích hợp VietQR
qua cổng thanh toán hiện có.

Refs: PAY-142
```

```
fix(auth): refresh token trước khi hết hạn 60 giây
```

```
feat(api)!: trả về số tiền dạng chuỗi thay vì số thực

BREAKING CHANGE: trường `amount` trong response đổi từ number sang string.
```

#### Hook kiểm tra `commit-msg`

Hook chạy ở máy bạn, nhưng bảo vệ quy ước chung. Nội dung `.githooks/commit-msg`:

```sh
#!/bin/sh
first_line=$(head -n1 "$1")
case "$first_line" in Merge*|Revert*|fixup!*|squash!*) exit 0 ;; esac
pattern='^(feat|fix|chore|docs|refactor|test|perf|ci|style)(\([a-z0-9-]+\))?!?: .+'
if ! echo "$first_line" | grep -Eq "$pattern"; then
  echo "❌ Commit message không đúng Conventional Commits: $first_line"
  echo "   Ví dụ: fix(auth): sửa lỗi đăng nhập"
  exit 1
fi
```

### 18. Quy trình làm việc từng bước

Quy trình nối hai phần: bước 3 là việc của bạn ở local, các bước còn lại đưa code ra kho chung.

```bash
# 1. Cập nhật main
git switch main
git pull --ff-only

# 2. Tạo nhánh
git switch -c feat/PAY-142-thanh-toan-qr

# 3. [Phần I] Code, format, kiểm tra cho xanh, rồi commit theo Conventional Commits
./mvnw spotless:apply verify
git add -p
git commit -m "feat(payment): thêm thanh toán bằng mã QR"

# 4. Cập nhật với main trước khi mở PR (rebase trên nhánh của riêng bạn)
git fetch origin
git rebase origin/main
./mvnw verify                 # kiểm tra lại sau khi rebase

# 5. Push và mở PR
git push -u origin feat/PAY-142-thanh-toan-qr
```

> Rebase **chỉ** trên nhánh do bạn sở hữu. Nếu đã push, dùng `git push --force-with-lease` (không dùng `--force`). Nếu có người khác cùng làm trên nhánh, dùng `git merge origin/main`.

### 19. Pull Request

#### Tiêu đề PR

Tiêu đề PR **phải theo Conventional Commits**, vì khi squash merge nó trở thành commit trên `main`:

```
feat(payment): thêm thanh toán bằng mã QR
```

#### Nội dung PR

Điền đầy đủ [PR template](./pull_request_template.md). GitHub tự điền template này khi bạn mở PR:

- **Mục đích:** vì sao cần thay đổi này, kèm link ticket.
- **Thay đổi chính:** tóm tắt ngắn gọn.
- **Cách kiểm tra:** các bước để reviewer tự xác nhận.
- **Ảnh hưởng:** breaking change, migration, cấu hình mới, rủi ro.
- **Ảnh chụp màn hình** nếu có thay đổi giao diện.

**Nâng cấp major** (Java, Spring Boot, hoặc thư viện lên version major mới) dùng [template riêng](./PULL_REQUEST_TEMPLATE/major_upgrade_template.md). Thêm `?expand=1&template=major_upgrade_template.md` vào cuối URL tạo PR để GitHub điền sẵn. Dependabot được cấu hình để **không** tự mở PR nâng major, nên việc này luôn do người làm chủ động.

#### Điều kiện để PR được merge

- [ ] Tên branch hợp lệ
- [ ] Tiêu đề PR theo Conventional Commits
- [ ] CI xanh (`./mvnw verify` hoặc `./gradlew check`), gồm format, phân tích tĩnh, test, coverage (xem [mục 4](#4-công-cụ-và-ngưỡng))
- [ ] Đạt Quality Gate của SonarQube trên code mới
- [ ] Có ít nhất **1 approval** (thư mục nhạy cảm cần **2**, gồm Code Owner)
- [ ] Không còn conversation chưa resolve
- [ ] Nhánh đã cập nhật với `main`

Mở PR ở trạng thái **Draft** khi còn đang làm và muốn nhận góp ý sớm.

#### CI: chốt chặn của cả team

CI chạy lại đúng lệnh bạn đã chạy ở local, nhưng trên máy sạch và không thể bỏ qua. Branch protection trên `main` bắt buộc job CI phải xanh mới cho merge. Git hook có thể bị bỏ qua, CI thì không.

### 20. Code review

Máy đã kiểm tra hình thức ở Phần I. Reviewer tập trung vào những gì máy không thấy.

#### Với người review

- Phản hồi trong vòng **1 ngày làm việc**.
- Review: tính đúng đắn, thiết kế, test, bảo mật, khả năng đọc hiểu.
- **Không góp ý về format hay naming đã có công cụ kiểm tra.** CI đã xanh nghĩa là phần đó đạt.
- Phân loại góp ý cho rõ ràng:
  - `blocking:` phải sửa trước khi merge
  - `suggestion:` nên cân nhắc
  - `nit:` chi tiết nhỏ, không bắt buộc
  - `question:` cần làm rõ
- Góp ý về code, không về người viết.

#### Checklist khi review code Java

- [ ] Logic đúng, xử lý đủ trường hợp biên (null, rỗng, giá trị cực đại, đồng thời)
- [ ] Có test cho hành vi mới hoặc lỗi được sửa; test có ý nghĩa
- [ ] Exception được xử lý đúng, không nuốt lỗi
- [ ] Không log hay để lộ dữ liệu nhạy cảm
- [ ] Transaction đặt đúng chỗ, không có truy vấn N+1
- [ ] Thread-safety với code dùng chung trạng thái
- [ ] Thiết kế hợp lý, đúng phân tầng kiến trúc
- [ ] API, schema, migration tương thích ngược (tầng T6)
- [ ] Suppression (nếu có) đều kèm lý do hợp lý

#### Với người tạo PR

- Tự review diff của mình trước khi yêu cầu review ([mục 11](#11-tự-kiểm-tra-trước-khi-push)).
- Trả lời mọi góp ý: sửa, hoặc giải thích vì sao không sửa.
- Đẩy commit sửa mới thay vì force-push, để reviewer xem được phần thay đổi. Commit sẽ được gộp khi squash.
- Commit mới sau khi được approve sẽ làm approval cũ mất hiệu lực, cần review lại.

#### Code Owners

Các thư mục nhạy cảm bắt buộc có review của Code Owner (xem [`CODEOWNERS`](./CODEOWNERS)):

- `infra/`, `.github/workflows/`: hạ tầng và CI
- `config/`: cấu hình Checkstyle, PMD và các công cụ chất lượng
- `src/auth/`, `src/payment/`: bảo mật và tiền
- `migrations/`: thay đổi cơ sở dữ liệu

### 21. Merge

- Dùng **Squash and merge** (mặc định duy nhất được bật).
- Commit trên `main` lấy theo **tiêu đề PR**. Kiểm tra lại trước khi bấm merge.
- Người tạo PR tự merge sau khi đủ điều kiện, trừ PR của agent (xem [mục 22](#22-ai-agents-ở-remote)).
- Nhánh tự động bị xoá sau khi merge.
- CHANGELOG và version được sinh tự động từ lịch sử commit trên `main`.

### 22. AI agents ở remote

AI agents tuân theo **toàn bộ** Phần II, cộng thêm:

| Quy định | Lý do |
|---|---|
| Tên nhánh bắt đầu bằng `agent/` | Dễ nhận biết và áp luật riêng |
| PR được gắn label `agent` | Lọc và theo dõi |
| **Không tự merge**, kể cả khi CI xanh | Con người chịu trách nhiệm cuối cùng |
| PR của agent cần **ít nhất 1 người thật approve** | Bot không được tính là reviewer |
| Không `push --force`, `reset --hard` trên nhánh đã push, `--no-verify` | Tránh mất dữ liệu và lách kiểm tra |
| Không sửa `.github/workflows/`, `CODEOWNERS`, cấu hình bảo mật trừ khi được giao rõ ràng | Tránh tự nới lỏng rào chắn |
| Phạm vi PR bám sát ticket | Giữ PR nhỏ, dễ review |
| Ghi rõ trong mô tả PR: agent nào tạo, ai giao việc, đã kiểm tra những gì | Truy vết |

Agents chạy bằng tài khoản bot hoặc GitHub App riêng với quyền tối thiểu: được tạo nhánh và mở PR, không có quyền bypass branch protection.

**Người giao việc cho agent** chịu trách nhiệm review PR đó hoặc chỉ định người review.

### 23. Câu hỏi thường gặp ở remote

**Lỡ commit vào `main` ở local thì sao?**

```bash
git switch -c feat/PAY-142-ten-nhanh   # chuyển commit sang nhánh mới
git switch main
git reset --hard origin/main           # đưa main local về như remote
```

**Lỡ viết sai commit message?**
Commit cuối, chưa push: `git commit --amend`. Nhiều commit: không cần sửa, vì khi squash chỉ tiêu đề PR là quan trọng.

**Có hotfix khẩn cấp trên production?**
Vẫn tạo nhánh `hotfix/...` và mở PR. Yêu cầu review gấp trong kênh team. Không có ngoại lệ push thẳng `main`.

---

## Đề xuất thay đổi tài liệu này

Quy trình và tiêu chuẩn là tài sản chung, nên mọi thay đổi đi theo Phần II: mở PR sửa `CONTRIBUTING.md` với type `docs`, và tag team lead vào review. Thay đổi ngưỡng hay rule trong `config/` cần thêm Code Owner duyệt.

Cảm ơn bạn đã đóng góp! 🙌

# Hướng dẫn đóng góp (Contributing)

Tài liệu này dành cho **mọi người đóng góp: thành viên team và AI agents**. Quy tắc nào được máy kiểm tra (hook, CI, branch protection) đều ghi rõ; vi phạm thì không merge được. Phần còn lại là quy ước để reviewer dựa vào.

> Agents: đọc thêm [mục 12](#12-ai-agents-ở-local) và [mục 22](#22-ai-agents-ở-remote) để biết các quy tắc bổ sung dành riêng cho bạn.

## Bắt đầu nhanh

Chỉ có thời gian đọc một phần? Đọc phần này.

**Cài một lần sau khi clone:**

```bash
git config core.hooksPath .githooks
```

**Năm quy tắc bắt buộc** (máy kiểm tra hết, sai là bị chặn):

1. Không push thẳng lên `develop` hay `main`; mọi thay đổi đi qua Pull Request.
2. Tạo nhánh từ `develop`, đặt tên `<type>/<mo-ta>`, ví dụ `feat/tao-bao-gia`.
3. Commit và tiêu đề PR theo dạng `<type>(scope): mô tả`, ví dụ `fix(order): sửa lỗi làm tròn tiền`.
4. PR vào `develop` cần CI xanh và 1 người approve, rồi **Squash and merge**.
5. Release: team lead mở PR `develop` → `main`, **Create a merge commit**.

**Mỗi ngày:**

```bash
git switch develop && git pull
git switch -c feat/tao-bao-gia
# ... code ...
cd api && ./mvnw spotless:apply verify      # web: npm run lint && npm run build
git add . && git commit -m "feat(quotation): thêm API tạo báo giá"
git push -u origin feat/tao-bao-gia         # rồi mở PR vào develop trên GitHub
```

Phần còn lại của tài liệu là tra cứu chi tiết.

---

## Hai phần, một ranh giới

Tài liệu chia làm hai phần, tương ứng với hai nơi code đi qua:

```text
  PHẦN I · LOCAL                                PHẦN II · REMOTE
  Việc của mỗi người                            Việc của cả team
 ┌────────────────────────────────┐            ┌────────────────────────────────┐
 │ Viết code                      │            │ Branch, commit message         │
 │ Tự đảm bảo chất lượng code     │  git push  │ Pull Request, code review      │
 │ Chạy ./mvnw verify cho xanh    │ ─────────▶ │ Merge vào develop, rồi main    │
 │                                │            │                                │
 │ Chốt chặn: IDE, hook, verify   │            │ Chốt chặn: CI, reviewer,       │
 │ Người chịu trách nhiệm: BẠN    │            │ branch protection: CẢ TEAM     │
 └────────────────────────────────┘            └────────────────────────────────┘
```

- **Phần I · Local.** Mọi thứ diễn ra trên máy bạn, trước khi push. Chất lượng code là trách nhiệm cá nhân: bạn viết, bạn tự kiểm tra, bạn đảm bảo nó xanh.
- **Phần II · Remote.** Mọi thứ trở thành tài sản chung sau khi push: nhánh, lịch sử commit, PR, `develop` và `main`. Đây là việc tập thể, nên được điều phối bằng quy ước chung và được cả team kiểm soát.

Commit và branch được tạo trên máy bạn, nhưng chúng sẽ trở thành lịch sử chung. Vì vậy quy ước về chúng thuộc **Phần II**.

**Cầu nối giữa hai phần:** lệnh kiểm tra ở local **giống hệt** lệnh CI chạy. Xanh ở máy bạn thì CI cũng xanh. CI không phải công cụ để tìm lỗi; nó là bước xác nhận lại việc bạn đã làm.

---

## Mục lục

**[Bắt đầu nhanh](#bắt-đầu-nhanh)**

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

> Trước khi push, code là của bạn. Bạn chịu trách nhiệm để nó đúng, sạch và xanh. Phần này chỉ mô tả những công cụ **đang thực sự chạy** trong repo.

### 1. Nguyên tắc cá nhân

- **Xanh ở local trước khi push.** Chạy lệnh kiểm tra của phần bạn sửa ([mục 4](#4-công-cụ-và-ngưỡng)) và đảm bảo pass trước khi mở PR.
- **Máy lo hình thức, bạn lo ý nghĩa.** Format, quy ước đặt tên, lỗi phổ biến do công cụ bắt. Thời gian của bạn dành cho logic, thiết kế và test.
- **Không nới lỏng tiêu chuẩn để code qua được.** Không tắt rule, không thêm suppression thiếu lý do (xem [mục 10](#10-bỏ-qua-quy-tắc)).
- **Không đưa bí mật vào code.** API key, mật khẩu, file `.env` không bao giờ được commit. Biến mới thì thêm vào `.env.example`.

### 2. Thiết lập môi trường local

**Yêu cầu:**

| Phần | Cần cài |
|---|---|
| `api/` | JDK 21. Không cần cài Maven, dùng wrapper `./mvnw` có sẵn |
| `web/` | Node 24, rồi `cd web && npm ci` |
| Chạy toàn hệ thống | Docker (`docker compose up`) |

**Cài Git hooks** (một lần sau khi clone):

```bash
git config core.hooksPath .githooks
```

| Hook | Việc nó làm |
|---|---|
| `pre-commit` | Có file `.java`/`pom.xml` trong `api/` được stage → chạy Spotless check + Checkstyle. Có file `.ts`/`.tsx`/`.js`/`.jsx` trong `web/` → chạy oxlint + `tsc -b`. Sai thì chặn commit |
| `commit-msg` | Từ chối commit sai định dạng Conventional Commits ([mục 17](#17-commit-message)) |

Hook kiểm tra file trên đĩa, không chỉ phần đã stage. Nếu dùng `git add -p` để commit một phần, kết quả có thể khác với commit thật; CI sẽ kiểm tra lại.

**IDE (IntelliJ), tùy chọn nhưng nên có:**

- **EditorConfig** (mặc định đã bật) đọc `.editorconfig`: LF, UTF-8, Java thụt 4 space và dòng tối đa 120 ký tự, web/YAML thụt 2 space.
- Plugin **palantir-java-format** để format giống hệt Spotless.
- Plugin **CheckStyle-IDEA**, trỏ tới `api/config/checkstyle/checkstyle.xml` để thấy lỗi ngay khi gõ.

**File cấu hình chất lượng:**

```
.editorconfig                               ← định dạng cơ bản cho mọi editor
.githooks/                                  ← pre-commit, commit-msg
api/pom.xml                                 ← khai báo Spotless, Checkstyle, Error Prone, ArchUnit
api/.mvn/jvm.config                         ← bắt buộc để Error Prone chạy trên JDK 21
api/config/checkstyle/checkstyle.xml        ← quy tắc Checkstyle
api/config/archunit/                        ← quy tắc phân tầng ArchUnit
web/.oxlintrc.json, web/tsconfig*.json      ← oxlint, TypeScript
.github/workflows/                          ← CI chạy lại các kiểm tra trên
```

### 3. Bức tranh chất lượng code

Chất lượng code được nhìn theo **các tầng, từ vi mô đến vĩ mô**. Bảng dưới ghi đúng hiện trạng: tầng nào có công cụ, tầng nào đang dựa vào con người.

| Tầng | Đơn vị | Kiểm tra bằng | Hiện trạng |
|---|---|---|---|
| T0 | Ký tự, định dạng | `.editorconfig`, Spotless | ✅ Tự động, tự sửa |
| T1 | Câu lệnh, biểu thức | Checkstyle, Error Prone, oxlint, `tsc` | ✅ Tự động |
| T2–T3 | Method, class | Unit test, code review | ⚠️ Mới có test ở `identity-service` |
| T4 | Package, phân tầng | ArchUnit | ✅ Tự động, mọi service |
| T5 | Ứng dụng | Chạy thử bằng `docker compose` | ❌ Chưa có integration test |
| T6 | Hệ thống, API | Code review | Con người |
| T7 | Quy trình | Branch, commit, PR, CI | ✅ Hook + CI ([Phần II](#phần-ii-remote-việc-của-cả-team)) |

**Ba thời điểm kiểm tra.** Cùng một bộ luật, chạy ở ba thời điểm. Càng sớm càng rẻ:

```
 Lúc gõ code     →  IDE đọc .editorconfig, plugin Checkstyle báo lỗi tại chỗ
 Lúc commit      →  .githooks/pre-commit
 ─────────────── ranh giới local / remote ───────────────
 Lúc mở PR       →  CI chạy lại toàn bộ  ← chốt chặn không thể bỏ qua
```

Hook có thể bị bỏ qua (`--no-verify`, hoặc chưa cài), CI thì không.

### 4. Công cụ và ngưỡng

**Lệnh kiểm tra** (giống hệt lệnh CI chạy):

```bash
cd api && ./mvnw verify                                  # API
cd web && npm run lint -- --deny-warnings && npm run build   # Web
```

**API** (`.github/workflows/code-quality.yml`):

| Khía cạnh | Công cụ | Quy tắc | Chặn? |
|---|---|---|---|
| Định dạng | Spotless + palantir-java-format | Không lệch format | ✅ |
| Quy ước code | Checkstyle | `api/config/checkstyle/checkstyle.xml` ([mục 5.2](#52-checkstyle-bắt-những-gì)) | ✅ |
| Lỗi tiềm ẩn | Error Prone | Danh sách ở [mục 5.3](#53-error-prone-bắt-những-gì) | ✅ |
| Kiến trúc | ArchUnit | Quy tắc phân tầng ([mục 8](#8-kiến-trúc)) | ✅ |
| Test | JUnit 5 + Mockito | 100% test pass | ✅ |

**Web** (`.github/workflows/web-quality.yml`):

| Khía cạnh | Công cụ | Quy tắc | Chặn? |
|---|---|---|---|
| Lint | oxlint | Plugin react, typescript, oxc; không cho phép warning | ✅ |
| Kiểu dữ liệu | TypeScript (`tsc -b`) | `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` | ✅ |
| Build | Vite | Build thành công | ✅ |

**Mobile:** có `mobile/analysis_options.yaml` để IDE cảnh báo, nhưng **chưa có hook hay CI**. Tự chạy `flutter analyze` trước khi push.

Maven chạy các công cụ theo thứ tự từ rẻ đến đắt, nên lỗi đơn giản được báo trong vài giây:

```
./mvnw verify
 ├─ validate  → Spotless check, Checkstyle      (vài giây)
 ├─ compile   → javac + Error Prone
 └─ test      → unit test, ArchUnit
```

> Muốn thêm hay đổi quy tắc, mở PR sửa cấu hình và cần team lead duyệt. Thay đổi tiêu chuẩn là việc tập thể.

### 5. Tự động hóa định dạng và câu lệnh

Hai tầng thấp nhất (T0, T1) **hoàn toàn do máy lo**. Không cần nhớ quy tắc, không cần tranh luận khi review.

#### 5.1. Ba công cụ, ba vai trò

| Công cụ | Tầng | Cơ chế | Tự sửa? |
|---|---|---|---|
| **Spotless** | T0 | Dựng cây cú pháp (AST), bỏ toàn bộ cách trình bày cũ rồi in lại code theo chuẩn. Kết quả chỉ phụ thuộc nội dung, không phụ thuộc cách bạn gõ. Cũng sắp xếp import, xoá import thừa, sắp xếp `pom.xml` | ✅ Có |
| **Checkstyle** | T1 cú pháp | Đọc **từng file**, duyệt AST và so khớp theo dòng. Không biết kiểu dữ liệu | ❌ Chỉ báo |
| **Error Prone** | T1 ngữ nghĩa | Chạy **bên trong javac** sau khi đã gán kiểu, nên thấy được kiểu dữ liệu. Báo lỗi như lỗi compile | ❌ Chỉ báo |

**Phân vai:** Spotless là chủ duy nhất của định dạng. Checkstyle **không** kiểm tra thụt lề và khoảng trắng, nên hai công cụ không bao giờ mâu thuẫn nhau.

#### 5.2. Checkstyle bắt những gì

| Nhóm | Ví dụ vi phạm |
|---|---|
| Đặt tên | `static final String prefix`, `class HTTPURLParser` |
| Import | `import java.util.*;`, `import java.util.Date;` (dùng `java.time`) |
| Câu lệnh | `if (x) return;` (thiếu `{}`), `catch (Exception e) {}` (catch rỗng), `catch (Throwable t)` |
| Giá trị | `qty > 100` (magic number, trừ trong test), `s == "abc"`, `10l` |
| Độ dài | Dòng quá 120 ký tự |
| Riêng dự án | `System.out.println(...)`, `e.printStackTrace()` |
| Riêng dự án | `log.info("Đơn " + id)` (phải dùng placeholder) |
| Riêng dự án | `@Autowired private OrderRepository repo;` (phải dùng constructor injection) |
| Riêng dự án | `double totalPrice` (tiền tệ phải dùng `BigDecimal` hoặc `Long`) |
| Riêng dự án | `// TODO sửa sau` (phải là `// TODO(#42): ...`) |

Một số luật chỉ bắt được một phần, vì Checkstyle không biết kiểu dữ liệu:

- Luật `double` cho tiền tệ dựa vào **tên biến** (price, amount, total, balance, fee).
- Luật `@Autowired` chỉ nhận ra **tên** annotation, không hiểu Spring.

#### 5.3. Error Prone bắt những gì

Những lỗi cần biết kiểu dữ liệu, Checkstyle không làm được. Các check sau được nâng lên mức **lỗi**:

- So sánh `==` với object có override `equals()` (`ReferenceEquality`)
- Method private không dùng (`UnusedMethod`)
- Dùng charset hoặc múi giờ mặc định của hệ thống (`DefaultCharset`, `JavaTimeDefaultTimeZone`)
- `String.split()` có hành vi bất ngờ (`StringSplitter`)
- `switch` trên enum thiếu case (`MissingCasesInEnumSwitch`)
- `equals()` dùng `getClass()` (`EqualsGetClass`), import tên quá chung (`BadImport`)

`UnusedVariable` tạm để mức cảnh báo, sẽ nâng lên lỗi khi các service hết code dở dang.

> **Lombok và Error Prone:** Error Prone được nạp qua `annotationProcessorPaths` trong `api/pom.xml`. Khi có danh sách này, javac ngừng tự tìm annotation processor trên classpath, nên Lombok **phải** được khai báo cùng chỗ. Thêm annotation processor mới (ví dụ MapStruct) cũng phải khai báo ở đó.

#### 5.4. Lệnh hằng ngày

| Việc | Lệnh |
|---|---|
| Format lại code Java | `cd api && ./mvnw spotless:apply` |
| Chạy Checkstyle | `cd api && ./mvnw checkstyle:check` |
| Kiểm tra toàn bộ API | `cd api && ./mvnw verify` |
| Kiểm tra web | `cd web && npm run lint && npm run build` |

Không tự format Java thủ công. Trước khi commit, chạy `spotless:apply` rồi `git add` lại.

### 6. Quy ước viết code

Phần này là quy ước **máy không kiểm tra hết**. Reviewer dựa vào đây khi góp ý.

**Chung**

- Java **21**: được dùng `record`, pattern matching, `var` khi kiểu đã rõ từ vế phải.
- Tên phải nói lên ý nghĩa, không viết tắt khó hiểu. Method ngắn; quá dài hay quá nhiều tham số thì tách nhỏ.
- Comment giải thích **vì sao**, không lặp lại code làm **gì**.
- Tiền tệ dùng `BigDecimal` hoặc `Long` (đơn vị đồng). Thời gian dùng `java.time`.

**Thiết kế**

- Ưu tiên bất biến: field `final`, `record` cho DTO, trả về collection không sửa được (`List.copyOf`).
- Không trả về `null` cho collection; trả về collection rỗng.
- `Optional` chỉ dùng làm kiểu trả về. Không gọi `Optional.get()` trực tiếp.
- Không để logic nghiệp vụ trong controller hay entity.

**Xử lý lỗi**

- Không nuốt exception (catch rồi bỏ qua mà không có lý do).
- Chỉ `catch (Exception e)` ở tầng xử lý lỗi toàn cục.
- Dùng exception nghiệp vụ có ý nghĩa, kèm nguyên nhân gốc: `throw new PaymentFailedException("...", e)`.
- Tài nguyên (stream, connection) mở bằng `try-with-resources`.

**Logging**

- Dùng SLF4J với placeholder: `log.info("Đơn {} đã thanh toán", orderId)`.
- **Không log dữ liệu nhạy cảm:** mật khẩu, token, OTP, thông tin cá nhân.

**Bảo mật**

- Truy vấn dùng tham số hoá (JPA, `@Query` với tham số), không nối chuỗi.
- Validate dữ liệu đầu vào tại controller (`@Valid`).
- Không hard-code bí mật; đọc từ biến môi trường.

### 7. Test

- Framework: **JUnit 5 + Mockito** (có sẵn trong `spring-boot-starter-test`, kèm AssertJ).
- Logic nghiệp vụ mới nên có unit test; sửa lỗi nên có test tái hiện lỗi. Xem ví dụ trong `identity-service/src/test/`.
- Đặt tên test mô tả hành vi, cấu trúc **Given / When / Then**, mỗi test kiểm tra một hành vi.
- Test phải độc lập, không phụ thuộc thứ tự chạy, thời gian thực hay mạng ngoài.

### 8. Kiến trúc

Quy tắc phân tầng được kiểm tra bằng ArchUnit. Bộ luật nằm ở một chỗ duy nhất, `api/config/archunit/.../ArchitectureTest.java`, và được pom gốc đưa vào test của **mọi service**. Đây là các luật cần nhìn **nhiều file cùng lúc**, nên Checkstyle và Error Prone không làm được:

```
controller ──▶ service ──▶ repository
     │            │
     └──▶ dto     ├──▶ mapper ──▶ dto, entity
                  └──▶ entity
```

- `controller` không gọi thẳng `repository`, không dùng `entity`. API chỉ trả về DTO.
- `dto` không phụ thuộc `entity`. Chuyển entity sang DTO đặt trong package `mapper` (ví dụ `ProductMapper.toResponse(product)`), không viết `from(entity)` trong DTO.
- `repository` không phụ thuộc `service`, `controller`, `dto`, `mapper`; `service` không phụ thuộc `controller`.
- Không có phụ thuộc vòng giữa các package.

### 9. Dependencies

- Phiên bản Java quản lý tập trung trong `api/pom.xml` (`<properties>`, `<dependencyManagement>`). Dependency do Spring Boot quản lý thì không ghi `<version>`.
- Không dùng phiên bản `SNAPSHOT` của thư viện bên ngoài.
- Thêm thư viện mới phải giải thích trong mô tả PR: vì sao cần, có lựa chọn nào khác không.

### 10. Bỏ qua quy tắc

Đôi khi một cảnh báo là false positive. Được phép bỏ qua **từng trường hợp cụ thể**, luôn kèm lý do:

```java
@SuppressWarnings("unchecked") // An toàn: list chỉ chứa String, đã kiểm tra ở dòng 42
@SuppressWarnings("checkstyle:MagicNumber") // Hệ số chuẩn của thuật toán X, xem tài liệu Y
```

- Không suppress ở mức class hay package.
- Không tắt rule trong cấu hình để PR qua được.

### 11. Tự kiểm tra trước khi push

**Phần máy kiểm tra.** Phải xanh:

```bash
cd api && ./mvnw spotless:apply verify
cd web && npm run lint -- --deny-warnings && npm run build
```

**Phần bạn tự kiểm tra.** Những gì máy không thấy:

- [ ] Logic đúng, xử lý đủ trường hợp biên (null, rỗng, giá trị lớn)
- [ ] Có test cho logic mới hoặc lỗi được sửa
- [ ] Không nuốt exception, không log dữ liệu nhạy cảm, không có bí mật trong code
- [ ] Đã tự đọc lại toàn bộ diff

### 12. AI agents ở local

AI agents (Claude, Copilot, Cursor…) tuân theo **toàn bộ** Phần I, cộng thêm:

- Chạy lệnh kiểm tra ở [mục 11](#11-tự-kiểm-tra-trước-khi-push) và đảm bảo xanh **trước** khi mở PR.
- Không sửa cấu hình Checkstyle, Error Prone, ArchUnit, oxlint; không thêm suppression để code qua được.
- Không xoá hay `@Disabled` test đang có để test pass.
- Theo pattern sẵn có trong codebase (package, mapper, xử lý lỗi, logging) thay vì tự đặt kiểu mới.
- Không refactor ngoài phạm vi được giao, không thêm dependency khi chưa được giao rõ ràng.

### 13. Câu hỏi thường gặp ở local

**Máy tôi xanh nhưng CI báo lỗi format?**
Có thể bạn chưa chạy `spotless:apply` sau lần sửa cuối, hoặc đang dùng Maven cài riêng thay vì `./mvnw`. Luôn dùng wrapper để cùng version với CI.

**Commit bị hook chặn nhưng tôi không sửa file đó?**
`pre-commit` kiểm tra toàn bộ `api/` hoặc `web/`, không chỉ file bạn sửa. Chạy `./mvnw spotless:apply` rồi xem lỗi Checkstyle còn lại.

**Hook báo `web/node_modules missing`?**
Chạy `cd web && npm ci` một lần.

**Error Prone báo lỗi liên quan đến `com.sun.tools.javac`?**
Thiếu file `api/.mvn/jvm.config`. File này mở khoá API nội bộ của JDK mà Error Prone cần.

**ArchUnit báo vi phạm?**
Đọc thông báo: nó ghi rõ class nào phụ thuộc class nào. Thường gặp nhất là DTO import entity; chuyển phần chuyển đổi sang `mapper` ([mục 8](#8-kiến-trúc)).

**Cảnh báo là false positive thì sao?**
Suppress đúng chỗ, kèm lý do. Xem [mục 10](#10-bỏ-qua-quy-tắc).

---
---

## Phần II. Remote, việc của cả team

> Sau khi push, code trở thành tài sản chung. Phần này cố ý ngắn: chỉ giữ những quy tắc mà máy kiểm tra được, cộng với vài thói quen tốt.

### 14. Nguyên tắc tập thể

**Năm quy tắc bắt buộc:**

| # | Quy tắc | Ai kiểm tra |
|---|---|---|
| 1 | Không push thẳng lên `develop` hay `main`; mọi thay đổi đi qua Pull Request | Branch protection |
| 2 | Tạo nhánh từ `develop`, đặt tên `<type>/<mo-ta>` ([mục 16](#16-đặt-tên-branch)) | CI |
| 3 | Commit và tiêu đề PR theo dạng `<type>(scope): mô tả` ([mục 17](#17-commit-message)) | Hook `commit-msg` + CI |
| 4 | PR vào `develop` cần CI xanh và 1 người approve, rồi **Squash and merge** | Branch protection |
| 5 | Release: team lead mở PR `develop` → `main`, **Create a merge commit** | CI + branch protection |

**Thói quen tốt** (không bắt buộc, nhưng giúp cả team đỡ khổ):

- PR nhỏ, merge trong 1–2 ngày. PR càng lớn càng khó review và càng dễ conflict.
- Không dùng `--force` trên nhánh dùng chung, không dùng `--no-verify`.
- **Lỡ commit bí mật** (API key, mật khẩu, file `.env`)? Báo ngay cho team lead để đổi key. Xoá khỏi lịch sử không đủ, vì key có thể đã bị sao chép.
- Sửa ngưỡng, rule, CI hay tài liệu này cần team lead approve ([mục 20](#20-code-review)).

### 15. Chiến lược nhánh

Dự án dùng **hai nhánh lâu dài**: làm việc trên `develop`, phát hành sang `main`.

```
main     ──●──────────────────●──────────────────●──▶  bản phát hành
            \                ↗ release          ↗ release
develop  ────●────●────●────●────●────●────●───●──▶  tích hợp hằng ngày
              ↖ squash   ↖ squash
         feat/tao-bao-gia  fix/lam-tron-tien
```

| Nhánh | Vai trò | Nhận PR từ |
|---|---|---|
| `main` | Bản đã phát hành, dùng để demo/nộp bài | Chỉ `develop` |
| `develop` | Tích hợp công việc hằng ngày, luôn build xanh | Nhánh làm việc |
| Nhánh làm việc | Một việc, sống ngắn | Không ai; xoá sau khi merge |

Không có luồng hotfix riêng. Lỗi trên `main` được sửa như mọi lỗi khác: nhánh `fix/...` vào `develop`, rồi release lại.

### 16. Đặt tên branch

```
<type>/<mo-ta-ngan>
```

- `type`: một trong `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`, `perf`.
- `mo-ta-ngan`: chữ thường, không dấu, nối bằng `-`.

**Hợp lệ:** `feat/tao-bao-gia`, `fix/lam-tron-tien`, `chore/cap-nhat-dependencies`

**Không hợp lệ:** `Feat/TaoBaoGia`, `fix_bug`, `minh-test`, `feature/nfc` (`feature` không phải type)

CI kiểm tra bằng regex `^(feat|fix|refactor|docs|test|chore|ci|perf)/[a-z0-9._-]+$`.

### 17. Commit message

Dự án dùng **[Conventional Commits](https://www.conventionalcommits.org/)**:

```
<type>(<scope>): <mô tả ngắn>
```

| Type | Dùng khi |
|---|---|
| `feat` | Thêm tính năng |
| `fix` | Sửa lỗi |
| `refactor` | Đổi code, không đổi hành vi |
| `docs` | Chỉ sửa tài liệu |
| `test` | Thêm hoặc sửa test |
| `chore` | Việc vặt: dependencies, cấu hình |
| `ci` | Sửa pipeline CI |
| `perf` | Cải thiện hiệu năng |
| `style` | Chỉ đổi format |

- `scope` (không bắt buộc) là phần bị ảnh hưởng: `api`, `web`, `mobile`, `order`, `auth`…
- Viết dạng mệnh lệnh: "thêm", "sửa", "xoá", không viết "đã thêm".
- Mỗi commit một thay đổi logic. Đừng gộp sửa lỗi với refactor.

**Ví dụ:**

```
feat(order): thêm API tạo báo giá
fix(auth): refresh token trước khi hết hạn
docs: cập nhật hướng dẫn cài đặt
```

Hook `.githooks/commit-msg` từ chối commit sai định dạng ngay trên máy bạn ([mục 2](#2-thiết-lập-môi-trường-local)).

### 18. Quy trình làm việc từng bước

```bash
# 1. Cập nhật develop
git switch develop
git pull

# 2. Tạo nhánh
git switch -c feat/tao-bao-gia

# 3. [Phần I] Code, kiểm tra cho xanh, rồi commit
cd api && ./mvnw spotless:apply verify      # web: npm run lint && npm run build
git add .
git commit -m "feat(quotation): thêm API tạo báo giá"

# 4. Lấy thay đổi mới của develop trước khi mở PR
git pull origin develop
./mvnw verify                               # kiểm tra lại sau khi gộp

# 5. Push, rồi mở PR vào develop trên GitHub
git push -u origin feat/tao-bao-gia
```

### 19. Pull Request

**Tiêu đề** theo Conventional Commits, vì khi squash merge nó trở thành commit trên `develop`: `feat(quotation): thêm API tạo báo giá`.

**Mô tả** ngắn gọn, gồm:

- **Mục đích:** làm gì, vì sao (link issue nếu có).
- **Cách kiểm tra:** reviewer làm gì để thấy nó chạy.
- **Ảnh chụp màn hình** nếu đổi giao diện.

**Điều kiện merge:** CI xanh, có 1 approval, không còn góp ý chưa trả lời.

Mở PR ở trạng thái **Draft** khi còn đang làm mà muốn nhận góp ý sớm.

> **CI là chốt chặn cuối.** CI chạy lại đúng lệnh bạn chạy ở local, trên máy sạch. Hook có thể bị bỏ qua, CI thì không.

### 20. Code review

Máy đã kiểm tra format, quy ước code và phân tầng. Reviewer tập trung vào những gì máy không thấy:

- [ ] Logic đúng, xử lý đủ trường hợp biên (null, rỗng, giá trị lớn)
- [ ] Có test cho hành vi mới hoặc lỗi được sửa
- [ ] Không nuốt exception, không log hay để lộ dữ liệu nhạy cảm
- [ ] Code dễ đọc, không trùng lặp

Góp ý về code, không về người viết. Không góp ý format: CI xanh nghĩa là phần đó đạt.

**Người tạo PR:** tự đọc lại diff trước khi nhờ review, và trả lời mọi góp ý (sửa, hoặc giải thích vì sao không sửa).

**Thay đổi tiêu chuẩn** cần team lead approve: PR sửa `.github/`, `.githooks/`, `api/config/`, `api/pom.xml`, `.editorconfig`.

### 21. Merge

| PR | Cách merge | Ai merge |
|---|---|---|
| Nhánh làm việc → `develop` | **Squash and merge** | Người tạo PR, sau khi đủ điều kiện |
| `develop` → `main` (release) | **Create a merge commit** | Team lead |

- Release **không squash**: xem câu hỏi cuối [mục 23](#23-câu-hỏi-thường-gặp-ở-remote).
- Branch protection giới hạn cách merge cho từng nhánh, nên không bấm nhầm được.
- Xoá nhánh làm việc sau khi merge (GitHub tự làm).

### 22. AI agents ở remote

PR do AI (Claude, Copilot, Cursor…) tạo theo đúng mọi quy tắc trên, cộng thêm:

- **AI không tự merge.** Người giao việc cho AI phải đọc và chịu trách nhiệm về PR đó như code của chính mình.
- Ghi trong mô tả PR là có dùng AI và đã kiểm tra những gì.
- AI không sửa `.github/`, `.githooks/` hay cấu hình chất lượng khi chưa được giao rõ ràng.

### 23. Câu hỏi thường gặp ở remote

**Lỡ commit thẳng vào `develop` ở local?**

```bash
git switch -c feat/ten-nhanh            # chuyển commit sang nhánh mới
git switch develop
git reset --hard origin/develop         # đưa develop local về như remote
```

**Lỡ viết sai commit message?**
Chưa push: `git commit --amend`. Đã push: không cần sửa, vì khi squash chỉ tiêu đề PR là quan trọng.

**PR báo conflict?**
Chạy `git pull origin develop` trên nhánh của bạn, sửa conflict, commit, rồi push lại.

**Tên nhánh bị CI báo sai?**
Đổi tên rồi push lại: `git branch -m feat/ten-moi && git push -u origin feat/ten-moi`, sau đó đóng PR cũ và mở PR mới.

**Vì sao release không squash?**
Nếu squash PR `develop` → `main`, commit trên `main` là commit mới mà `develop` không có. Lần release sau Git coi hai nhánh đã lệch nhau, gây conflict và buộc phải PR đồng bộ ngược `main` → `develop`. Merge commit giữ nguyên lịch sử nên không có vấn đề này.

---

## Đề xuất thay đổi tài liệu này

Quy trình và tiêu chuẩn là tài sản chung, nên mọi thay đổi đi theo Phần II: mở PR sửa `CONTRIBUTING.md` với type `docs`, và tag team lead vào review. Thay đổi ngưỡng hay rule trong `api/config/` cũng cần team lead duyệt.

Cảm ơn bạn đã đóng góp! 🙌

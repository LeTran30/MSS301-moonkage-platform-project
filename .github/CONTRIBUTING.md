# Hướng dẫn đóng góp (Contributing)

Tài liệu này dành cho **mọi người đóng góp: thành viên team và AI agents**. Quy tắc nào được máy kiểm tra (hook, CI, branch protection) đều ghi rõ; vi phạm thì không merge được. Phần còn lại là quy ước để reviewer dựa vào.

> Agents: đọc thêm [mục 7](#7-ai-agents-ở-local) và [mục 15](#15-ai-agents-ở-remote).

## Bắt đầu nhanh

**Cài một lần sau khi clone:**

```bash
git config core.hooksPath .githooks
```

**Năm quy tắc bắt buộc** (máy kiểm tra hết, sai là bị chặn):

| # | Quy tắc | Ai kiểm tra |
|---|---|---|
| 1 | Không push thẳng lên `develop` hay `main`; mọi thay đổi đi qua Pull Request | Branch protection |
| 2 | Tạo nhánh từ `develop`, đặt tên `<type>/<mo-ta>` ([mục 11](#11-đặt-tên-branch)) | CI |
| 3 | Commit và tiêu đề PR theo dạng `<type>(scope): mô tả` ([mục 12](#12-commit-message)) | Hook `commit-msg` + CI |
| 4 | PR vào `develop` cần CI xanh và 1 người approve, rồi **Squash and merge** | Branch protection |
| 5 | Release: team lead mở PR `develop` → `main`, **Create a merge commit** | CI + branch protection |

**Mỗi ngày:**

```bash
git switch develop && git pull
git switch -c feat/tao-bao-gia
# ... code ...
cd api && ./mvnw spotless:apply verify      # web: npm run lint && npm run build
git add . && git commit -m "feat(quotation): thêm API tạo báo giá"
git pull origin develop && ./mvnw verify    # lấy thay đổi mới của develop, kiểm tra lại
git push -u origin feat/tao-bao-gia         # rồi mở PR vào develop trên GitHub
```

**Tài liệu quy ước** (CONTRIBUTING không chép lại nội dung của chúng):

| Tài liệu | Nội dung |
|---|---|
| [`docs/conventions/coding-rules.md`](../docs/conventions/coding-rules.md) | Cách viết Java hằng ngày: package, đặt tên class/method/field, thứ tự trong class, 4 nhịp của method, comment, tài liệu pseudocode |
| [`docs/conventions/code-quality-rules.md`](../docs/conventions/code-quality-rules.md) | Bộ luật chất lượng API: ID, mức cưỡng chế, công cụ chặn, ngưỡng, ngoại lệ, checklist review |
| [`docs/guides/database.md`](../docs/guides/database.md) | Migration và seed |

---

## Phần I. Local, việc của mỗi người

> Trước khi push, code là của bạn: bạn viết, bạn tự kiểm tra, bạn đảm bảo nó xanh. Lệnh kiểm tra ở local **giống hệt** lệnh CI chạy, nên xanh ở máy bạn thì CI cũng xanh.

### 1. Thiết lập môi trường

| Phần | Cần cài |
|---|---|
| `api/` | JDK 21. Không cần cài Maven, dùng wrapper `./mvnw` |
| `web/` | Node 24, rồi `cd web && npm ci` |
| Chạy toàn hệ thống | Docker (`docker compose up`) |

| Hook | Việc nó làm |
|---|---|
| `pre-commit` | Stage file `.java`/`pom.xml` trong `api/` → Spotless check + Checkstyle. Stage file `.ts`/`.tsx`/`.js`/`.jsx` trong `web/` → oxlint + `tsc -b`. Sai thì chặn commit |
| `commit-msg` | Từ chối commit sai Conventional Commits ([mục 12](#12-commit-message)) |

Hook kiểm tra file trên đĩa, không chỉ phần đã stage; dùng `git add -p` thì kết quả có thể khác commit thật, CI sẽ kiểm lại.

**IDE (IntelliJ), nên có:** EditorConfig (mặc định bật, đọc `.editorconfig`), plugin **palantir-java-format** (format giống Spotless), plugin **CheckStyle-IDEA** trỏ tới `api/config/checkstyle/checkstyle.xml`.

### 2. Lệnh kiểm tra

| Việc | Lệnh |
|---|---|
| Kiểm tra toàn bộ API (như CI `code-quality.yml`) | `cd api && ./mvnw verify` |
| Format lại code Java | `cd api && ./mvnw spotless:apply` |
| Chỉ chạy Checkstyle | `cd api && ./mvnw checkstyle:check` |
| Kiểm tra web (như CI `web-quality.yml`) | `cd web && npm run lint -- --deny-warnings && npm run build` |
| Mobile (chưa có hook hay CI) | `cd mobile && flutter analyze` |

`./mvnw verify` chạy từ rẻ đến đắt: `validate` (Spotless, Checkstyle, vài giây) → `compile` (javac + Error Prone) → `test` (unit test, ArchUnit). Không tự format Java thủ công; chạy `spotless:apply` rồi `git add` lại.

**Web** chặn: oxlint (plugin react, typescript, oxc; không cho warning), `tsc -b` (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`), build Vite.

**API**: Spotless, Checkstyle, Error Prone, ArchUnit, JUnit. Từng luật chặn gì và ngưỡng bao nhiêu: [`code-quality-rules.md`](../docs/conventions/code-quality-rules.md) Phần A3, B, D.

### 3. Nguyên tắc cá nhân

- **Máy lo hình thức, bạn lo ý nghĩa.** Thời gian của bạn dành cho logic, thiết kế và test.
- **Viết code theo hai tài liệu quy ước** ở [Bắt đầu nhanh](#bắt-đầu-nhanh). Tiền tệ là `long` VND; thời gian dùng `java.time`.
- **Không đưa bí mật vào code.** API key, mật khẩu, file `.env` không bao giờ được commit. Biến mới thì thêm vào `.env.example`.
- **Không log dữ liệu nhạy cảm:** mật khẩu, token, OTP, thông tin cá nhân.
- **Dependency:** phiên bản quản lý tập trung trong `api/pom.xml`; dependency do Spring Boot quản lý thì không ghi `<version>`; không dùng `SNAPSHOT` bên ngoài; thêm thư viện mới phải giải thích trong mô tả PR.

### 4. Bỏ qua quy tắc

Được bỏ qua **từng trường hợp cụ thể**, luôn kèm lý do; không suppress ở mức class/package, không tắt rule trong cấu hình để PR qua được:

```java
@SuppressWarnings("checkstyle:MagicNumber") // Hệ số chuẩn của thuật toán X, xem tài liệu Y
```

Cú pháp cho từng công cụ và bảng ngoại lệ cấp dự án: [`code-quality-rules.md`](../docs/conventions/code-quality-rules.md) Phần E1.

### 5. Tự kiểm tra trước khi push

Lệnh ở [mục 2](#2-lệnh-kiểm-tra) phải xanh. Phần máy không thấy:

- [ ] Logic đúng, xử lý đủ trường hợp biên (null, rỗng, giá trị lớn)
- [ ] Có test cho logic mới hoặc lỗi được sửa
- [ ] Không nuốt exception, không log dữ liệu nhạy cảm, không có bí mật trong code
- [ ] Đã tự đọc lại toàn bộ diff

### 6. Câu hỏi thường gặp ở local

**Máy tôi xanh nhưng CI báo lỗi format?**
Có thể chưa chạy `spotless:apply` sau lần sửa cuối, hoặc dùng Maven cài riêng thay vì `./mvnw`.

**Commit bị hook chặn nhưng tôi không sửa file đó?**
`pre-commit` kiểm tra toàn bộ `api/` hoặc `web/`. Chạy `./mvnw spotless:apply` rồi xem lỗi Checkstyle còn lại.

**Hook báo `web/node_modules missing`?** Chạy `cd web && npm ci` một lần.

**Error Prone báo lỗi liên quan đến `com.sun.tools.javac`?**
Thiếu `api/.mvn/jvm.config`; file này mở khoá API nội bộ của JDK mà Error Prone cần.

**Thêm annotation processor (vd MapStruct) mà không chạy?**
Error Prone được nạp qua `annotationProcessorPaths` trong `api/pom.xml`, nên javac không tự tìm processor trên classpath. Khai báo processor mới cùng chỗ với Lombok.

**ArchUnit báo vi phạm?**
Thông báo ghi rõ class nào phụ thuộc class nào. Thường gặp nhất là DTO import entity; chuyển phần chuyển đổi sang `mapper`.

### 7. AI agents ở local

AI agents (Claude, Copilot, Cursor…) tuân theo **toàn bộ** Phần I, cộng thêm:

- Chạy lệnh ở [mục 2](#2-lệnh-kiểm-tra) và đảm bảo xanh **trước** khi mở PR.
- Không sửa cấu hình Checkstyle, Error Prone, ArchUnit, oxlint; không thêm suppression để code qua được.
- Không xoá hay `@Disabled` test đang có để test pass.
- Theo pattern sẵn có trong codebase thay vì tự đặt kiểu mới.
- Không refactor ngoài phạm vi được giao, không thêm dependency khi chưa được giao rõ ràng.

---

## Phần II. Remote, việc của cả team

> Sau khi push, code trở thành tài sản chung. Phần này chỉ giữ những quy tắc máy kiểm tra được ([Bắt đầu nhanh](#bắt-đầu-nhanh)), cộng với vài thói quen tốt.

### 8. Thói quen tốt

- PR nhỏ, merge trong 1–2 ngày. PR càng lớn càng khó review và càng dễ conflict.
- Không dùng `--force` trên nhánh dùng chung, không dùng `--no-verify`.
- **Lỡ commit bí mật?** Báo ngay team lead để đổi key. Xoá khỏi lịch sử không đủ, vì key có thể đã bị sao chép.

### 9. Chiến lược nhánh

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

Không có luồng hotfix riêng: lỗi trên `main` sửa bằng nhánh `fix/...` vào `develop`, rồi release lại.

### 10. Merge

| PR | Cách merge | Ai merge |
|---|---|---|
| Nhánh làm việc → `develop` | **Squash and merge** | Người tạo PR, sau khi đủ điều kiện |
| `develop` → `main` (release) | **Create a merge commit** | Team lead |

Branch protection giới hạn cách merge cho từng nhánh. GitHub tự xoá nhánh làm việc sau khi merge.

### 11. Đặt tên branch

`<type>/<mo-ta-ngan>`: `type` là một trong `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`, `perf`; mô tả chữ thường, không dấu, nối bằng `-`. CI kiểm bằng regex `^(feat|fix|refactor|docs|test|chore|ci|perf)/[a-z0-9._-]+$`.

**Hợp lệ:** `feat/tao-bao-gia`, `fix/lam-tron-tien` · **Không hợp lệ:** `Feat/TaoBaoGia`, `fix_bug`, `feature/nfc`

### 12. Commit message

[Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <mô tả ngắn>`

| Type | Dùng khi |
|---|---|
| `feat` / `fix` | Thêm tính năng / sửa lỗi |
| `refactor` | Đổi code, không đổi hành vi |
| `docs` / `test` | Chỉ sửa tài liệu / test |
| `chore` / `ci` | Dependencies, cấu hình / pipeline CI |
| `perf` / `style` | Hiệu năng / chỉ đổi format |

- `scope` (không bắt buộc): `api`, `web`, `mobile`, `order`, `auth`…
- Viết dạng mệnh lệnh ("thêm", "sửa", "xoá"); mỗi commit một thay đổi logic.

```
feat(order): thêm API tạo báo giá
fix(auth): refresh token trước khi hết hạn
```

### 13. Pull Request

**Tiêu đề** theo Conventional Commits, vì khi squash nó trở thành commit trên `develop`.

**Mô tả** gồm: mục đích (link issue nếu có), cách kiểm tra, ảnh chụp nếu đổi giao diện. Đổi hành vi service thì sửa `docs/services/<service>/` trong cùng PR; đổi schema thì có `db/migration/V…` và sửa `db/seed` nếu cần. Còn đang làm mà muốn góp ý sớm thì mở **Draft**.

**Điều kiện merge:** CI xanh, 1 approval, không còn góp ý chưa trả lời.

### 14. Code review

Máy đã kiểm format, quy ước code và phân tầng; reviewer dùng checklist ở [mục 5](#5-tự-kiểm-tra-trước-khi-push) và checklist riêng của Moonkage (tiền, PII, sự kiện, ranh giới service) trong [`code-quality-rules.md`](../docs/conventions/code-quality-rules.md) Phần D. Góp ý về code, không về người viết; không góp ý format.

**Người tạo PR:** tự đọc lại diff trước khi nhờ review, trả lời mọi góp ý (sửa, hoặc giải thích vì sao không).

**Thay đổi tiêu chuẩn** cần team lead approve: PR sửa `.github/`, `.githooks/`, `api/config/`, `api/pom.xml`, `.editorconfig`, `docs/conventions/`.

### 15. AI agents ở remote

- **AI không tự merge.** Người giao việc cho AI đọc và chịu trách nhiệm về PR đó như code của chính mình.
- Ghi trong mô tả PR là có dùng AI và đã kiểm tra những gì.
- AI không sửa `.github/`, `.githooks/` hay cấu hình chất lượng khi chưa được giao rõ ràng.

### 16. Câu hỏi thường gặp ở remote

**Lỡ commit thẳng vào `develop` ở local?**

```bash
git switch -c feat/ten-nhanh            # chuyển commit sang nhánh mới
git switch develop
git reset --hard origin/develop         # đưa develop local về như remote
```

**Lỡ viết sai commit message?** Chưa push: `git commit --amend`. Đã push: không cần sửa, khi squash chỉ tiêu đề PR là quan trọng.

**PR báo conflict?** `git pull origin develop` trên nhánh của bạn, sửa conflict, commit, push lại.

**Tên nhánh bị CI báo sai?** `git branch -m feat/ten-moi && git push -u origin feat/ten-moi`, đóng PR cũ, mở PR mới.

**Vì sao release không squash?** Squash `develop` → `main` tạo commit mới mà `develop` không có; lần release sau Git coi hai nhánh lệch nhau, gây conflict và buộc phải PR ngược `main` → `develop`. Merge commit giữ nguyên lịch sử nên không gặp chuyện này.

---

Mọi thay đổi tài liệu này đi theo Phần II: PR type `docs`, tag team lead vào review.

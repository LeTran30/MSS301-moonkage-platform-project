# Quản lý Git: nhánh, commit, đồng bộ

Tài liệu này là **phần thao tác** của quy trình Git. Luật bắt buộc (tên nhánh, định dạng commit, cách merge) nằm ở [`../../.github/CONTRIBUTING.md`](../../.github/CONTRIBUTING.md) — đọc mục 9–16 trước khi làm.

---

## 1. Mô hình nhánh

```
main     ──●──────────────────●──────────────────●──▶  bản phát hành
            \                ↗ release          ↗ release
develop  ────●────●────●────●────●────●────●───●──▶  tích hợp hằng ngày
              ↖ squash   ↖ squash
         feat/tao-bao-gia  fix/lam-tron-tien
```

| Nhánh | Sinh ra từ | PR vào | Merge bằng |
|---|---|---|---|
| `main` | `develop` | — | Create a merge commit (team lead) |
| `develop` | `main` | Nhánh làm việc | Squash and merge |
| Nhánh làm việc | **`develop`** | `develop` | Squash and merge |

> Nhánh làm việc **luôn** tạo từ `develop`, không phải từ `main`. Xem [mục 6](#6-tôi-tạo-nhánh-từ-main-rồi-sau-này-sửa-sao).

---

## 2. Thiết lập một lần sau khi clone

```bash
git config core.hooksPath .githooks   # bật pre-commit + commit-msg
git config core.autocrlf false        # .gitattributes đã lo EOL, không để git tự quyết
git config fetch.prune true           # xoá ref remote đã bị xoá trên GitHub
git config push.autoSetupRemote true  # push nhánh mới không cần -u
git config rerere.enabled true        # nhớ cách đã resolve conflict
git config merge.conflictstyle zdiff3 # conflict hiển thị 3 bên + base
```

Cấu hình này nằm trong `.git/config` của riêng máy, không commit lên repo.

**Vì sao `core.autocrlf false`?** Repo có [`.gitattributes`](../../.gitattributes) với `* text=auto eol=lf`, tức Git đã quyết định EOL. Bật thêm `autocrlf` sẽ khiến Git cảnh báo *"CRLF will be replaced by LF"* ở mỗi lần `git add`, và working tree lệch với index.

**Vì sao `rerere`?** Khi merge `develop` vào nhánh làm việc, cùng một conflict có thể xuất hiện lại ở lần merge sau. `rerere` ghi lại cách bạn resolve và tự áp dụng lại.

---

## 3. Vòng lặp hằng ngày

```bash
git switch develop && git pull              # đồng bộ develop
git switch -c feat/tao-bao-gia              # nhánh mới từ develop

# ... viết code ...

cd api && ./mvnw spotless:apply verify       # giống hệt CI
cd web && npm run check && npm run e2e

git add . && git commit -m "feat(quotation): them API tao bao gia"

git fetch origin && git rebase origin/develop   # lấy thay đổi mới, giữ lịch sử gọn
git push -u origin feat/tao-bao-gia             # đẩy lên remote
```

Sau khi push: mở PR vào `develop` trên GitHub, điền mô tả (mục đích · cách kiểm tra · ảnh nếu đổi giao diện), tag 1 người review.

### Kiểm tra trước khi push

| Lệnh | Kiểm cái |
|---|---|
| `cd api && ./mvnw verify` | Spotless, Checkstyle, Error Prone, test |
| `cd web && npm run lint -- --deny-warnings && npm run build` | oxlint, type-check, build |

Hai lệnh này giống hệt CI, nên xanh ở local thì CI cũng xanh.

---

## 4. Câu lệnh git hay dùng

```bash
git st              # status -sb (ngắn)
git lg              # log --oneline --graph --decorate --all -20
git l1              # log 15 commit gần nhất, có ngày
git last            # commit vừa rồi + diffstat
git sync            # pull --ff-only (không tạo merge commit rác)
git amend           # commit --amend --no-edit
git unstage         # restore --staged
git wip             # stash push -u -m wip
git unwip           # stash pop
git cleanbr         # fetch --prune + branch -vv (xem nhánh nào lệch remote)
```

---

## 5. Sửa commit khi chưa push

```bash
git commit --amend -m "feat(web): sua lai ten commit"   # đổi message commit cuối
git rebase -i HEAD~3                                   # sửa nhiều commit: đổi message, gộp, tách
```

Trong rebase tương tác, các lệnh hay dùng:

| Phím | Việc |
|---|---|
| `reword` | Sửa message của commit đó |
| `squash` | Gộp vào commit trước (ghép message) |
| `fixup` | Gộp vào commit trước (giữ message của commit trước) |
| `drop` | Bỏ commit đó |
| `edit` | Dừng lại để sửa code rồi `git commit --amend` |

> Đã push rồi thì **không sửa lịch sử đã có** — quy tắc của repo là khi squash chỉ tiêu đề PR mới là thứ quan trọng.

---

## 6. "Tôi tạo nhánh từ `main` rồi, sau này sửa sao?"

Cách sạch nhất: **rebase nhánh lên `develop`**.

```bash
git fetch origin
git rebase origin/develop      # đặt commit của bạn lên trên develop
```

Rebase thay vì merge cho lịch sử nhánh làm việc thẳng, không có merge commit rác — đúng những gì repo muốn khi squash vào `develop`.

Nếu rebase xung đột:

```bash
git status                    # xem file nào xung đột
# sửa file, rồi:
git add <file>
git rebase --continue
git rebase --skip             # bỏ commit đang rebase nếu thay đổi đã không còn cần
git rebase --abort            # hủy, về nguyên trạng
```

### Nhánh thay thế toàn bộ `web/`

Khi một nhánh thay thế cả thư mục (`web/` cũ → bản mới), merge `develop` vào sẽ xung đột ở **mọi file đã bị xoá**. Không giải quyết tay từng file — lấy phía của nhánh mình:

```bash
git checkout --ours  <file>   # giữ phiên bản của nhánh hiện tại
git checkout --theirs <file>   # lấy phiên bản từ develop
```

Rồi chạy lại kiểm tra chất lượng: `cd api && ./mvnw verify` và `cd web && npm run check`.

---

## 7. Đồng bộ với remote

```bash
git fetch origin --prune    # cập nhật ref remote, xoá ref đã bị xoá
git branch -vv              # nhánh nào đang ahead/behind bao nhiêu
```

| Tình huống | Lệnh |
|---|---|
| Nhánh mới, chưa có trên remote | `git push -u origin <ten-nhanh>` |
| Nhánh đã có, có commit mới | `git push` |
| Muốn nằm đúng trạng thái remote | `git fetch origin && git reset --hard origin/<ten-nhanh>` |
| Đổi tên nhánh | `git branch -m <ten-moi> && git push -u origin <ten-moi>` |

> Không dùng `--force` trên nhánh dùng chung, không dùng `--no-verify`.

---

## 8. Dọn dẹp

```bash
git fetch origin --prune     # xoá ref remote đã bị xoá trên GitHub
git branch -d <ten-nhanh>    # xoá nhánh đã merge (d an toàn)
git branch -D <ten-nhanh>    # xoá cả nhánh chưa merge (cân nhắc kỹ)
git stash list               # xem các bản tạm
git stash drop stash@{0}     # bỏ bản tạm không cần
git reflog expire --expire=30.days --all && git gc --prune=now   # dọn object cũ
```

Sau khi merge xong, GitHub tự xoá nhánh làm việc; ở local thì `git branch -d`.

---

## 9. Xử lý sự cố

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| Commit bị hook chặn | Sai Conventional Commits | `git commit --amend -m "type(scope): mo ta"` — xem [CONTRIBUTING §12](../../.github/CONTRIBUTING.md#12-commit-message) |
| Hook báo `web/node_modules missing` | Chưa cài dependency | `cd web && npm ci` |
| `Filename too long` khi clone | Đường dẫn Windows quá dài | `git config --global core.longpaths true` rồi clone lại |
| Commit message có dấu tiếng Việt bị hook từ chối | Git Bash đọc UTF-8, PowerShell truyền theo codepage OEM | Viết message **tiếng Anh**, hoặc bật `core.hooksPath` và dùng `git commit -m` từ Git Bash |
| Thêm file xong không thấy thay đổi | File đã bị `.gitignore` | `git check-ignore -v <file>` để xem quy tắc nào ăn |
| "Your branch is behind" | Remote có commit mới | `git pull --rebase` trên nhánh làm việc |
| Conflict lặp lại mỗi lần merge | Chưa bật `rerere` | `git config rerere.enabled true` |
| Muốn xem nhánh nào chưa push | — | `git branch -vv` (cột `[origin/...: ahead N]`) |

---

## 10. Trước khi mở PR

- [ ] Nhánh tạo từ `develop`, tên đúng regex `^(feat\|fix\|refactor\|docs\|test\|chore\|ci\|perf)/[a-z0-9._-]+$`
- [ ] Tiêu đề PR theo Conventional Commits (CI kiểm)
- [ ] PR nhắm vào `develop` (trừ khi release `develop` → `main`)
- [ ] `./mvnw verify` và `npm run check` xanh
- [ ] Đã tự đọc lại toàn bộ diff
- [ ] Đổi hành vi service → sửa `docs/services/<service>/` trong cùng PR
- [ ] Đổi schema → có `db/migration/V…` và cập nhật `db/seed` trong cùng PR

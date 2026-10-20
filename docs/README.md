# Tài liệu Moonkage

Mọi tài liệu của dự án nằm trong `docs/`, xếp theo **loại**: mỗi loại trả lời một câu hỏi và có người sửa riêng.

## Tôi muốn…

| … | Đọc |
|---|---|
| Chạy dự án lần đầu | [guides/getting-started.md](guides/getting-started.md) |
| Đổi schema DB, viết dữ liệu mẫu, biết tài khoản mẫu | [guides/database.md](guides/database.md) |
| Biết hệ thống phải làm gì (FR, AC, BR) | [product/requirements.md](product/requirements.md) |
| Biết hệ thống được xây ra sao (service, API, sự kiện, quyết định D-xx) | [architecture/software-design.md](architecture/software-design.md) |
| Viết code đúng quy ước (đặt tên, thứ tự, comment) | [conventions/coding-rules.md](conventions/coding-rules.md) |
| Mở branch, commit, PR, review | [../.github/CONTRIBUTING.md](../.github/CONTRIBUTING.md) |
| Hiểu một service: luồng, API, class nặng | [services/](#services) |
| Gọi thử API | Swagger `http://localhost:8080/swagger-ui.html` · Postman [api/mk-auth.json](api/mk-auth.json) |

## Cấu trúc

| Thư mục | Trả lời câu hỏi | Ai sửa, khi nào |
|---|---|---|
| [product/](product/) | Xây **gì**? Nguồn sự thật: [context](product/context.md) → [user stories](product/user-stories.md) → [requirements](product/requirements.md) | Khi requirement đổi |
| [architecture/](architecture/) | Xây **thế nào**? [software-design.md](architecture/software-design.md) | Khi có quyết định thiết kế |
| [conventions/](conventions/) | Viết code **ra sao**? | Hiếm; cả nhóm đồng ý |
| [guides/](guides/) | **Làm** việc X thế nào? | Khi quy trình đổi |
| [services/](services/) | Service Y **chạy** ra sao? | **Cùng PR** với code của service đó |
| [api/](api/) | Bộ request mẫu (Postman) | Khi API đổi |
| [archive/](archive/) | Trước đây đã khảo sát, rà soát, quyết gì? | Không sửa nữa |

### Services

| Service | Tổng quan | Class nặng |
|---|---|---|
| identity | [services/identity/README.md](services/identity/README.md) | [classes/](services/identity/classes/) |
| catalog | — | [classes/](services/catalog/classes/) |
| common-storage (thư viện) | — | [classes/](services/common-storage/classes/) |

Service chưa có thư mục thì tạo `services/<tên>/README.md` khi viết tài liệu đầu tiên.

## Quy tắc

1. **Một nội dung, một chỗ.** Chỗ khác chỉ đặt link, không chép lại.
2. **Tên file `kebab-case.md`**, không dấu cách, không ghi phiên bản trong tên (lịch sử nằm trong git và bảng thay đổi của file).
3. **Link tương đối** (`../guides/database.md`), không dùng `file:///` hay đường dẫn máy cá nhân. CI kiểm tra link hỏng (`.github/workflows/docs-links.yml`).
4. **Tài liệu class nặng** (Rules Phần 5) đặt tại `services/<service>/classes/<ClassName>.md`.
5. **Kế hoạch và bản rà soát** ghi trạng thái ngay dưới tiêu đề (`Đề xuất` · `Đang làm` · `Xong <ngày>`). Xong rồi thì chuyển vào `archive/` với tên `YYYY-MM-DD-<việc>.md` và thêm dòng **Lưu trữ** trỏ tới tài liệu hiện hành.
6. Ghi chú sau buổi làm việc: đưa vào issue/PR, hoặc `archive/YYYY-MM-DD-session-notes.md`. Không tạo thư mục ghi chú riêng.
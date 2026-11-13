# Tài liệu Moonkage

Đây là **cửa trước** của kho tài liệu dự án. Mọi tài liệu nằm trong `docs/`, xếp theo **việc người đọc cần làm** theo khung [Diátaxis](https://diataxis.fr) (học, làm, tra cứu, hiểu), cộng thêm một khu cho việc theo thời điểm và một khu lưu trữ.

- Cần biết **hệ thống phải làm gì** → [product/](product/)
- Cần **hiểu** hệ thống được xây ra sao → [architecture/](architecture/)
- Cần **tra** hợp đồng API, schema, quy ước code → [architecture/api-db/](architecture/api-db/README.md), [conventions/](conventions/)
- Cần **làm** một việc cụ thể → [guides/](guides/)
- Cần biết **đang làm gì, đã rà soát gì** → [work/](work/)

## Tôi muốn…

| … | Đọc |
|---|---|
| Chạy dự án lần đầu | [guides/getting-started.md](guides/getting-started.md) |
| Tách nhánh, commit, đồng bộ git | [guides/git-workflow.md](guides/git-workflow.md) |
| Đổi schema DB, viết dữ liệu mẫu, biết tài khoản mẫu | [guides/database.md](guides/database.md) |
| Biết hệ thống phải làm gì (FR, AC, BR) | [product/requirements.md](product/requirements.md) |
| Biết hệ thống được xây ra sao (service, API, sự kiện, quyết định D-xx) | [architecture/software-design.md](architecture/software-design.md) |
| Xem sơ đồ UML: use case, class, state machine, activity | [architecture/uml/](architecture/uml/README.md) |
| Biết chuẩn kiến trúc bắt buộc phải tuân thủ (đặt tên, API, dữ liệu, security, test) | [architecture/architecture-standards.md](architecture/architecture-standards.md) |
| Biết code hiện tại đang lệch chuẩn ở đâu và cần sửa gì | [work/reviews/codebase-conformance-review.md](work/reviews/codebase-conformance-review.md) |
| Biết API công khai và schema của từng service | [architecture/api-db/README.md](architecture/api-db/README.md) |
| Biết quyết định kiến trúc nào đã chốt, cái nào còn mở | [architecture/software-design.md](architecture/software-design.md) (mục 11) và [architecture/api-db/decisions.md](architecture/api-db/decisions.md) |
| Biết hình dạng dữ liệu cần đối chiếu với API (mục L-xx) | [architecture/api-db/decisions.md](architecture/api-db/decisions.md) |
| Viết code đúng quy ước (đặt tên, thứ tự, comment) | [conventions/coding-rules.md](conventions/coding-rules.md) |
| Kiểm tra chất lượng code (lint, test, coverage) | [conventions/code-quality-rules.md](conventions/code-quality-rules.md) |
| Mở branch, commit, PR, review | [../.github/CONTRIBUTING.md](../.github/CONTRIBUTING.md) |
| Hiểu một service: luồng, API, cấu hình | [services/](services/) |
| Biết luồng người dùng nào đã chạy được, kết quả E2E gần nhất | [work/reports/](work/reports/) |
| Xem việc đang lên kế hoạch hoặc đang rà soát | [work/](work/) |
| Biết cần làm gì để tối ưu điểm theo bảng chấm đồ án | [work/plans/grading-readiness-plan-2026-11-07.md](work/plans/grading-readiness-plan-2026-11-07.md) |
| Gọi thử API | Swagger `http://localhost:8080/swagger-ui.html` · Postman [api/mk-auth.json](api/mk-auth.json) |

### Theo vai trò

| Vai trò | Đọc trước khi viết code | Khi cần tra cứu |
|---|---|---|
| **Người mới (mọi vai)** | [guides/getting-started.md](guides/getting-started.md) → [architecture/software-design.md](architecture/software-design.md) | [guides/database.md](guides/database.md) |
| **Làm UI (frontend)** | [architecture/architecture-standards.md](architecture/architecture-standards.md) §6 (Frontend) | [conventions/coding-rules.md](conventions/coding-rules.md), [architecture/api-db/README.md](architecture/api-db/README.md) |
| **Làm backend** | [architecture/architecture-standards.md](architecture/architecture-standards.md) §2–§5 | [architecture/api-db/README.md](architecture/api-db/README.md), [architecture/api-db/decisions.md](architecture/api-db/decisions.md) |
| **Làm API / hợp đồng** | [architecture/api-db/README.md](architecture/api-db/README.md) | [architecture/api-db/decisions.md](architecture/api-db/decisions.md), [architecture/api-db/integration.md](architecture/api-db/integration.md) |
| **Triển khai / vận hành** | [guides/getting-started.md](guides/getting-started.md) | [guides/database.md](guides/database.md), [architecture/software-design.md](architecture/software-design.md) §9 (Docker Compose) |
| **Việc còn nợ — làm tiếp** | [work/plans/debt-implementation-plan.md](work/plans/debt-implementation-plan.md) | [work/reviews/codebase-conformance-review.md](work/reviews/codebase-conformance-review.md) §8, [work/reports/user-flow-readiness.md](work/reports/user-flow-readiness.md) |
| **Sự cố production** | [architecture/software-design.md](architecture/software-design.md) (luồng sự kiện, mục 4–7) | [work/reports/user-flow-readiness.md](work/reports/user-flow-readiness.md), [guides/git-workflow.md](guides/git-workflow.md) |

## Cấu trúc

Mỗi thư mục chứa đúng **một loại** tài liệu. Loại quyết định ai sửa, khi nào sửa, và tài liệu sống bao lâu.

| Thư mục | Loại (Diátaxis) | Trả lời câu hỏi | Ai sửa, khi nào |
|---|---|---|---|
| [product/](product/) | Reference nghiệp vụ | Xây **gì**? [context](product/context.md) → [user stories](product/user-stories.md) → [requirements](product/requirements.md); tài liệu IA ở [product/ia/](product/ia/) | Khi requirement đổi |
| [architecture/](architecture/) | Explanation | Xây **thế nào**, vì sao? [software-design.md](architecture/software-design.md), [architecture-standards.md](architecture/architecture-standards.md), [web-package-architecture.md](architecture/web-package-architecture.md), sơ đồ UML ở [uml/](architecture/uml/README.md) | Khi có quyết định thiết kế |
| [architecture/api-db/](architecture/api-db/README.md) | Reference kỹ thuật | Hợp đồng API, schema, sự kiện của từng service; sổ quyết định [decisions.md](architecture/api-db/decisions.md) | **Cùng PR** khi API hoặc schema đổi |
| [conventions/](conventions/) | Reference kỹ thuật | Viết code **ra sao**? | Hiếm; cả nhóm đồng ý |
| [guides/](guides/) | Tutorial + How-to | **Làm** việc X thế nào? | Khi quy trình đổi |
| [services/](services/) | Reference + Explanation | Service Y **chạy** ra sao: luồng, API, cấu hình, lý do của schema (`db-review.md`) | **Cùng PR** với code của service đó |
| [api/](api/) | Reference | Bộ request mẫu (Postman) | Khi API đổi |
| [work/](work/) | Việc theo thời điểm | Đang **kế hoạch** gì ([plans/](work/plans/)), đã **rà soát** gì ([reviews/](work/reviews/)), **chạy thử** ra sao ([reports/](work/reports/))? | Người làm việc đó; xong thì chuyển vào `archive/` |
| [archive/](archive/) | Lịch sử | Trước đây đã khảo sát, rà soát, quyết gì? | Không sửa nữa |

README này không giữ cây thư mục chép tay, vì cây đó lệch ngay khi có file mới. Danh sách file xem trực tiếp trong từng thư mục.

### Services

| Service | Tổng quan |
|---|---|
| identity | [services/identity/README.md](services/identity/README.md) |
| catalog | [services/catalog/README.md](services/catalog/README.md) |
| quotation | [services/quotation/README.md](services/quotation/README.md) |
| vendor | [services/vendor/README.md](services/vendor/README.md) |
| order | [services/order/README.md](services/order/README.md) |
| payment | [services/payment/README.md](services/payment/README.md) |
| orchestrator | [services/orchestrator/README.md](services/orchestrator/README.md) |
| common-storage (thư viện) | [services/common-storage/README.md](services/common-storage/README.md) |
| common-api (thư viện) | [services/common-api/README.md](services/common-api/README.md) |
| common-outbox (thư viện) | [services/common-outbox/README.md](services/common-outbox/README.md) |
| common-reference (thư viện) | [services/common-reference/README.md](services/common-reference/README.md) |
| common-observability (thư viện) | [services/common-observability/README.md](services/common-observability/README.md) |

Bảy service nghiệp vụ và năm thư viện dùng chung đều có README. Các module còn lại trong `api/pom.xml` cố ý không có README:

| Module | Vì sao không có README riêng |
|---|---|
| `api-gateway` | **Hạ tầng.** Chỉ định tuyến, kiểm token, rate limit. Không có bounded context, không sở hữu dữ liệu. Xem [architecture/software-design.md](architecture/software-design.md) và [guides/getting-started.md](guides/getting-started.md) |
| `discovery-server` | **Hạ tầng.** Chỉ đăng ký Eureka. Không có bounded context, không sở hữu dữ liệu |
| `config` | **Cấu hình build.** Bộ luật ArchUnit và Checkstyle dùng chung, không phải artifact Maven |

Service chưa có thư mục thì tạo `services/<tên>/README.md` khi viết tài liệu đầu tiên.

## Quy tắc

1. **Một nội dung, một chỗ.** Chỗ khác chỉ đặt link, không chép lại.
2. **Tên file `kebab-case.md`**, không dấu cách, không ghi ngày hay phiên bản trong tên (lịch sử nằm trong git và bảng thay đổi của file). Ngoại lệ: file trong `work/` và `archive/` được ghi ngày, vì chúng gắn với một thời điểm.
3. **Link tương đối** (`../guides/database.md`), không dùng `file:///` hay đường dẫn máy cá nhân. CI kiểm tra link hỏng (`.github/workflows/docs-links.yml`).
4. **Đặt tài liệu theo loại, không theo người viết hay theo module code.** Kế hoạch, rà soát, báo cáo chạy thử của một service vẫn vào `work/`, không vào `services/<service>/`. Tài liệu frontend cũng nằm trong `docs/`, không tạo lại `web/doc/`.
5. **Quyết định kiến trúc = ADR.** Mọi quyết định có hậu quả lâu dài (đổi ranh giới service, đổi hợp đồng API, đổi chiến lược dữ liệu) phải có một mã `D-xx` với Context / Decision / Consequences / Status. ADR đã chốt không sửa nội dung: sai thì thêm ADR mới thay vì sửa đè. Mã `D-xx` chỉ dùng cho ADR; mục trong kế hoạch đặt mã khác.
6. **Vòng đời của `work/`.** Mỗi file ghi trạng thái ngay dưới tiêu đề (`Đề xuất` · `Đang làm` · `Xong <ngày>`). Xong rồi thì chuyển vào `archive/` với tên `YYYY-MM-DD-<việc>.md` và thêm dòng **Lưu trữ** trỏ tới tài liệu hiện hành.
7. **Ghi chú sau buổi làm việc:** đưa vào issue/PR, hoặc `archive/YYYY-MM-DD-session-notes.md`. Không tạo thư mục ghi chú riêng.
8. **Phân biệt sự thật với đề xuất.** Tài liệu mô tả trạng thái code phải trích dẫn đường dẫn cụ thể; đề xuất phải nằm ở mục riêng và ghi rõ mức độ chắc chắn. Cấu trúc chuẩn ở [architecture/architecture-standards.md](architecture/architecture-standards.md) §8.
9. **Không viết tài liệu theo class** (ngừng từ 2026-11-08). Luồng nghiệp vụ ghi ở `services/<service>/README.md`; 20 file cũ nằm ở [archive/2026-11-08-class-docs/](archive/2026-11-08-class-docs/README.md).
10. **Không đặt file chứa dữ liệu cá nhân trong `docs/`.** `docs/Template.xlsx` và `docs/assets/` đã được thêm vào `.gitignore`.

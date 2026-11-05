# Tài liệu Moonkage

Đây là **cửa trước** của kho tài liệu dự án. Mọi tài liệu nằm trong `docs/`, xếp theo **loại**: mỗi loại trả lời một câu hỏi và có người sửa riêng.

- Cần biết **hệ thống phải làm gì** → [product/](product/)
- Cần biết **hệ thống được xây ra sao** → [architecture/](architecture/)
- Cần biết **viết code đúng chuẩn** → [architecture/architecture-standards.md](architecture/architecture-standards.md) và [conventions/](conventions/)
- Cần **làm** một việc cụ thể → [guides/](guides/)

## Tôi muốn…

| … | Đọc |
|---|---|
| Chạy dự án lần đầu | [guides/getting-started.md](guides/getting-started.md) |
| Tách nhánh, commit, đồng bộ git | [guides/git-workflow.md](guides/git-workflow.md) |
| Đổi schema DB, viết dữ liệu mẫu, biết tài khoản mẫu | [guides/database.md](guides/database.md) |
| Biết hệ thống phải làm gì (FR, AC, BR) | [product/requirements.md](product/requirements.md) |
| Biết hệ thống được xây ra sao (service, API, sự kiện, quyết định D-xx) | [architecture/software-design.md](architecture/software-design.md) |
| Biết chuẩn kiến trúc bắt buộc phải tuân thủ (đặt tên, API, dữ liệu, security, test) | [architecture/architecture-standards.md](architecture/architecture-standards.md) |
| Biết code hiện tại đang lệch chuẩn ở đâu và cần sửa gì | [architecture/codebase-conformance-review.md](architecture/codebase-conformance-review.md) |
| Biết API công khai và schema của từng service | [architecture/api-db/README.md](architecture/api-db/README.md) |
| Biết quyết định kiến trúc nào đã chốt, cái nào còn mở | [architecture/software-design.md](architecture/software-design.md) (mục 11) và [architecture/api-db/decisions.md](architecture/api-db/decisions.md) |
| Biết hình dạng dữ liệu cần đối chiếu với API (mục L-xx) | [architecture/api-db/decisions.md](architecture/api-db/decisions.md) |
| Viết code đúng quy ước (đặt tên, thứ tự, comment) | [conventions/coding-rules.md](conventions/coding-rules.md) |
| Kiểm tra chất lượng code (lint, test, coverage) | [conventions/code-quality-rules.md](conventions/code-quality-rules.md) |
| Mở branch, commit, PR, review | [../.github/CONTRIBUTING.md](../.github/CONTRIBUTING.md) |
| Hiểu một service: luồng, API, class nặng | [services/](services/) |
| Gọi thử API | Swagger `http://localhost:8080/swagger-ui.html` · Postman [api/mk-auth.json](api/mk-auth.json) |

### Theo vai trò

| Vai trò | Đọc trước khi viết code | Khi cần tra cứu |
|---|---|---|
| **Người mới (mọi vai)** | [guides/getting-started.md](guides/getting-started.md) → [architecture/software-design.md](architecture/software-design.md) | [guides/database.md](guides/database.md) |
| **Làm UI (frontend)** | [architecture/architecture-standards.md](architecture/architecture-standards.md) §6 (Frontend) | [conventions/coding-rules.md](conventions/coding-rules.md), [architecture/api-db/README.md](architecture/api-db/README.md) |
| **Làm backend** | [architecture/architecture-standards.md](architecture/architecture-standards.md) §2–§5 | [architecture/api-db/README.md](architecture/api-db/README.md), [architecture/api-db/decisions.md](architecture/api-db/decisions.md) |
| **Làm API / hợp đồng** | [architecture/api-db/README.md](architecture/api-db/README.md) | [architecture/api-db/decisions.md](architecture/api-db/decisions.md), [architecture/api-db-alignment-plan.md](architecture/api-db-alignment-plan.md) |
| **Triển khai / vận hành** | [guides/getting-started.md](guides/getting-started.md) | [guides/database.md](guides/database.md), [architecture/be-improve-progress-2026-11-04.md](architecture/be-improve-progress-2026-11-04.md) |
| **Sự cố production** | [architecture/software-design.md](architecture/software-design.md) (luồng sự kiện, mục 4–7) | [architecture/user-flow-readiness.md](architecture/user-flow-readiness.md), [guides/git-workflow.md](guides/git-workflow.md) |

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

### Cây tài liệu

```text
docs/
├── README.md                      ← bạn đang đọc: bản đồ tài liệu
├── product/                       ← XÂY GÌ (nghiệp vụ, không nói về code)
│   ├── context.md                 Bối cảnh nền tảng, phạm vi, đối tượng
│   ├── user-stories.md            Câu chuyện người dùng theo vai
│   ├── requirements.md            FR / AC / BR / Q-xx — nguồn sự thật nghiệp vụ
│   └── midfi-content-spec.md      Nội dung màn hình bản mid-fi
├── architecture/                  ← XÂY THẾ NÀO
│   ├── software-design.md         Thiết kế hệ thống; quyết định D-01 → D-24 (mục 11)
│   ├── architecture-standards.md  Chuẩn kiến trúc bắt buộc (BẮT BUỘC / KHUYẾN NGHỊ)
│   ├── codebase-conformance-review.md  Rà soát code thực tế so với chuẩn; backlog P0/P1/P2
│   ├── api-db-alignment-plan.md   Kế hoạch đưa code về khớp phác thảo API–DB
│   ├── be-improve-progress-2026-11-04.md  Tiến độ cải thiện backend
│   ├── user-flow-readiness.md     Mức độ sẵn sàng của từng luồng người dùng
│   └── api-db/                    Phác thảo API + database theo từng service
│       ├── README.md              Quy ước chung, aggregate root, bảng định tuyến
│       ├── identity.md            Account, hồ sơ, địa chỉ, NFC, OTP
│       ├── vendor.md              Người bán, giấy tờ, duyệt, phí đăng ký, sản phẩm (ghi)
│       ├── catalog.md             Bản đọc sản phẩm, đánh giá, phí liên tỉnh
│       ├── quotation.md           Yêu cầu báo giá, báo giá, bản chép chấp nhận
│       ├── order.md               Giỏ, checkout, đơn, maket, khiếu nại
│       ├── payment.md             Thanh toán, hoàn tiền, sổ tiền, giải ngân
│       ├── orchestrator.md        Thông báo, nhật ký
│       ├── integration.md         Sự kiện và API nội bộ toàn hệ thống
│       ├── decisions.md           Quyết định L-01 → L-19 (điểm lệch schema–code)
│       └── db-review-proposals.md Rà soát database P-01 → P-09
├── conventions/                   ← VIẾT CODE RA SAO
│   ├── coding-rules.md            Đặt tên, thứ tự, comment, cấu trúc tài liệu class
│   └── code-quality-rules.md      Lint, format, test, coverage, cổng chất lượng
├── guides/                        ← LÀM VIỆC X THẾ NÀO
│   ├── getting-started.md         Chạy dự án từ số 0
│   ├── database.md                Flyway, seed, sổ ID, cách đổi schema an toàn
│   └── git-workflow.md            Branch, commit, rebase, quy tắc đặt tên branch
├── services/                      ← SERVICE NÀY CHẠY RA SAO (viết cùng PR với code)
│   ├── identity/README.md         Tổng quan identity-service
│   ├── identity/classes/          Tài liệu class nặng (Rules Phần 5)
│   ├── catalog/README.md          Tổng quan catalog-service
│   ├── catalog/classes/
│   ├── quotation/README.md        Tổng quan quotation-service
│   ├── quotation/classes/
│   ├── vendor/README.md           Tổng quan vendor-service
│   ├── order/README.md            Tổng quan order-service
│   ├── payment/README.md          Tổng quan payment-service
│   ├── orchestrator/README.md     Tổng quan orchestrator-service
│   ├── common-storage/README.md   Tổng quan thư viện lưu trữ đối tượng
│   └── common-storage/classes/    Tài liệu thư viện lưu trữ đối tượng
├── scripts/                   ← SCRIPT kiểm tài liệu (chạy tay và trong CI)
│   └── check-class-docs.mjs    Tài liệu class còn khớp với mã nguồn không
├── api/                           ← BỘ REQUEST MẪU (Postman)
│   ├── mk-auth.json
│   └── mk-vendor.json
└── archive/                       ← KHÔNG SỬA NỮA
```

### Services

| Service | Tổng quan | Class nặng |
|---|---|---|
| identity | [services/identity/README.md](services/identity/README.md) | [classes/](services/identity/classes/) |
| catalog | [services/catalog/README.md](services/catalog/README.md) | [classes/](services/catalog/classes/) |
| quotation | [services/quotation/README.md](services/quotation/README.md) | [classes/](services/quotation/classes/) |
| vendor | [services/vendor/README.md](services/vendor/README.md) | — |
| order | [services/order/README.md](services/order/README.md) | — |
| payment | [services/payment/README.md](services/payment/README.md) | — |
| orchestrator | [services/orchestrator/README.md](services/orchestrator/README.md) | — |
| common-storage (thư viện) | [services/common-storage/README.md](services/common-storage/README.md) | [classes/](services/common-storage/classes/) |

Bảy service nghiệp vụ (`identity`, `catalog`, `quotation`, `vendor`, `order`, `payment`, `orchestrator`) và một thư viện dùng chung (`common-storage`) đều có README.

**Cố ý không có README** — các module còn lại trong `api/pom.xml` không phải service nghiệp vụ:

| Module | Vì sao không có README riêng |
|---|---|
| `api-gateway` | **Hạ tầng.** Chỉ định tuyến, kiểm token, rate limit — không có bounded context, không sở hữu dữ liệu, không có aggregate root. Xem [architecture/software-design.md](architecture/software-design.md) và [guides/getting-started.md](guides/getting-started.md) |
| `discovery-server` | **Hạ tầng.** Chỉ đăng ký Eureka — không có bounded context, không sở hữu dữ liệu |
| `common-api` | **Thư viện.** `ApiResponse`, `PageResponse`, `GatewayHeader`, `GatewayRole`, `CommonErrorCode` — không chạy, không có cổng, không có DB |
| `common-outbox` | **Thư viện.** Relay outbox dùng chung — không chạy, không có cổng, không có DB |
| `common-reference` | **Thư viện.** Enum `Province` (A-18) — không chạy, không có cổng, không có DB |
| `common-observability` | **Thư viện.** Tên metric và bộ đếm dùng chung — không chạy, không có cổng, không có DB |
| `config` | **Cấu hình build.** Bộ luật ArchUnit và Checkstyle dùng chung, không phải artifact Maven |

`common-storage` được tài liệu hoá như một thư viện vì nó đã có tài liệu class sẵn ([services/common-storage/classes/](services/common-storage/classes/)) và là thư viện duy nhất có hợp đồng cấu hình (`storage.*`) mà từng service phải tự khai báo. Ba thư viện `common-*` còn lại chưa có thư mục tài liệu — xem P2-12 trong [architecture/codebase-conformance-review.md](architecture/codebase-conformance-review.md).

Service chưa có thư mục thì tạo `services/<tên>/README.md` khi viết tài liệu đầu tiên.

## Quy tắc

1. **Một nội dung, một chỗ.** Chỗ khác chỉ đặt link, không chép lại.
2. **Tên file `kebab-case.md`**, không dấu cách, không ghi phiên bản trong tên (lịch sử nằm trong git và bảng thay đổi của file). Tài liệu sinh ra từ mã nguồn dùng `PascalCase.md` (ví dụ `docs/services/identity/classes/AuthServiceImpl.md`).
3. **Link tương đối** (`../guides/database.md`), không dùng `file:///` hay đường dẫn máy cá nhân. CI kiểm tra link hỏng (`.github/workflows/docs-links.yml`).
4. **Tài liệu class nặng** (Rules Phần 5) đặt tại `services/<service>/classes/<ClassName>.md`.
5. **Quyết định kiến trúc = ADR.** Mọi quyết định có hậu quả lâu dài (đổi ranh giới service, đổi hợp đồng API, đổi chiến lược dữ liệu) phải có một mã `D-xx` với Context / Decision / Consequences / Status. ADR đã chốt không sửa nội dung — sai thì thêm ADR mới thay vì sửa đè.
6. **Kế hoạch và bản rà soát** ghi trạng thái ngay dưới tiêu đề (`Đề xuất` · `Đang làm` · `Xong <ngày>`). Xong rồi thì chuyển vào `archive/` với tên `YYYY-MM-DD-<việc>.md` và thêm dòng **Lưu trữ** trỏ tới tài liệu hiện hành.
7. **Ghi chú sau buổi làm việc:** đưa vào issue/PR, hoặc `archive/YYYY-MM-DD-session-notes.md`. Không tạo thư mục ghi chú riêng.
8. **Phân biệt sự thật với đề xuất.** Tài liệu mô tả trạng thái code phải trích dẫn đường dẫn cụ thể; đề xuất phải nằm ở mục riêng và ghi rõ mức độ chắc chắn. Cấu trúc chuẩn ở [architecture/architecture-standards.md](architecture/architecture-standards.md) §9.
9. **Tài liệu class nặng phải sống cùng class.** Mỗi file `services/<service>/classes/<ClassName>.md` mô tả **một class Java cụ thể** (`api/<module>/src/main/java/.../<ClassName>.java`).
   - **Khi nào phải cập nhật:** trong **cùng PR** với bất kỳ thay đổi nào sau đây chạm vào class đó: đổi tên class, đổi package, đổi tên/xoá method, đổi luật bất biến, đổi mã lỗi nghiệp vụ, đổi thứ tự trạng thái. Nếu class không còn đáng viết tài liệu thì **xoá file** `classes/<ClassName>.md` trong cùng PR.
   - **Ai giữ:** tác giả của PR đó (người sửa code class đó). Người giữ tài liệu chỉ ghi lại danh sách class nặng trong [architecture/architecture-standards.md](architecture/architecture-standards.md) §7.6.
   - **Kiểm tra không cũ:** chạy `node docs/scripts/check-class-docs.mjs` — script đối chiếu **tên file** `classes/<ClassName>.md` với file `<ClassName>.java` trong module Maven tương ứng (`docs/services/<service>` ↔ `api/<service>-service`; `common-storage` giữ nguyên tên). Script chạy trong CI ở `.github/workflows/docs-links.yml`, bước **Check class docs match source**. Script chỉ bắt được class **đã đổi tên hoặc bị xoá**; nội dung tài liệu có còn đúng với hành vi mới thì người sửa PR phải tự đọc lại — đó là lý do quy tắc nằm trong quy trình review, không chỉ ở CI.

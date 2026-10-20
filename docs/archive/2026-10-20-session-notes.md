# Ghi chú phiên làm việc 2026-10-20

> **Lưu trữ.** Tài liệu lịch sử, không cập nhật nữa và có thể đã khác code hiện tại. Hiện trạng: [docs/README.md](../README.md).

Đánh đổi và chỗ còn hở:
- Lúc xác nhận, mỗi ảnh (tối đa 5MB) được đọc vào bộ nhớ của service một lần. File lớn hơn nhiều, như video, thì phải chuyển sang xử lý dạng stream.
- 7 database vẫn dùng chung một cặp DB_USERNAME/DB_PASSWORD, nên service nào cũng có mật khẩu đăng nhập được DB của service khác. Sửa thì cần mỗi DB một user riêng.

Chưa hẳn. Phần hạ tầng chạy được đã có. Nhưng còn 4 nền tảng dùng chung chưa có, mà FR nào cũng sẽ chạm tới. Nếu để vậy rồi chia việc, mỗi người sẽ tự chế một kiểu.

Đã sẵn sàng

- Khung hệ thống: ranh giới service, gateway kiểm JWT, Eureka, Docker Compose (mỗi container chỉ nhận biến nó cần).
- Chất lượng code: CI có Spotless, Checkstyle, Error Prone, ArchUnit; có Rules of All Things.
- Lưu file: common-storage giờ chỉ cần gọi là dùng được.
- Seed: có script tạo dữ liệu mẫu.
- Mẫu tham khảo: identity-service đã hoàn chỉnh, có ErrorCode, ApiResponse, outbox, Testcontainers và 22 file test.

Còn thiếu, xếp theo mức ảnh hưởng

#: 1
Thiếu gì: Chuẩn phản hồi và lỗi dùng chung
Hiện trạng (đã kiểm trong code): Chỉ identity có ErrorCode/AppException/ApiResponse/messages.properties. Catalog dùng CustomException với chuỗi
tiếng Việt viết thẳng trong code. Quotation, order, vendor, payment, orchestrator chưa có @RestControllerAdvice.
Hậu quả khi làm FR: Mỗi người tự viết một kiểu body lỗi; trái với Software Design 5.1 (ApiResponse<T>) và nguyên tắc no-hardcode.
────────────────────────────────────────
#: 2
Thiếu gì: Quản lý schema DB
Hiện trạng (đã kiểm trong code): Cả 7 service đều dùng ddl-auto: update, không có Flyway; migration là script chạy tay trong api/docs/.
Hậu quả khi làm FR: update không đổi được tên cột hay xóa cột. Mình vừa gặp đúng chuyện này với product_images. Business logic thay schema liên tục
thì máy mỗi người sẽ lệch nhau.
────────────────────────────────────────
#: 3
Thiếu gì: Outbox và hợp đồng sự kiện
Hiện trạng (đã kiểm trong code): Chỉ identity có outbox. Bản thân AuditPublisher của catalog ghi chú rằng event sẽ mất nếu broker sập. Chưa có quy
ước dùng chung cho exchange, routing key hay schema DTO sự kiện.
Hậu quả khi làm FR: Các luồng saga order ↔ payment ↔ quotation (Software Design 7.1–7.6) cần event không được mất, nên phải có nền này trước.
────────────────────────────────────────
#: 4
Thiếu gì: Ngữ cảnh người gọi và test nền
Hiện trạng (đã kiểm trong code): Service khác chỉ đọc head có Spring Security, trong khi Software Design yêu cầu
service tự kiểm lại quyền. Chỉ identity dùng Testcontainers; quotation, order, vendor, payment chưa có test nào.
Hậu quả khi làm FR: Mỗi người tự kiểm quyền admin/chủ Shoptest từ đầu.

Order, quotation, vendor và payment hiện mới là khung: mỗi3–30 dòng, payment thậm chí chưa có controller. Phần đóchính là business logic cần viết, nên không tính là thiếu sót.

Đề xuất

Làm xong nền tảng rồi mới chia FR song song:
1. Thư viện common-web (cách làm giống common-storage): Aption, exception handler chung, cấu hình messages.properties, đọc người gọi hiện tại và kiểm vai trò. Sau đó chuyển catalog sang dùng nó.
2. Flyway cho từng service: chụp schema hiện tại làm baselate.
3. Outbox dùng chung và quy ước sự kiện: cần trước khi làm order/payment.
4. Khung test tích hợp: dùng Testcontainers cho Postgres vtity.

❯ common-storage có thể thực hiện được là vì tất cả các module đang trên cùng một máy, còn nếu môi trường thật khi mỗi module 1 nơi thì soa

Bạn hỏi đúng chỗ cần làm rõ. Nhưng common-storage không phụ thuộc vào việc các module cùng nằm trên một máy. Để chứng minh, mình kiểm image catalog đang chạy:

Ran 1 shell command

common-storage là thư viện, không phải dịch vụ chạy chung

Kết quả trên cho thấy common-storage-0.0.1-SNAPSHOT.jar (cùng MinIO SDK) được đóng gói sẵn bên trong file jar của catalog (BOOT-INF/lib/). Không có tiến trình nào tên "common-storage" chạy riêng để các service phải gọi tới.

Khi mỗi service chạy ở một máy khác nhau:
- Mỗi service mang bản sao thư viện của riêng nó trong image Docker, giống như mang theo Spring hay Jackson.
- Service gọi MinIO qua mạng bằng URL lấy từ cấu hình (MINIO_INTERNAL_URL, hiện là http://minio:9000), chứ không qua đĩa chung hay bộ nhớ chung. Chỉ cần đổi URL đó thành địa chỉ MinIO hoặc S3 thật.
- Thứ duy nhất dùng chung lúc chạy là MinIO. Nó có vai trò như database: một hạ tầng riêng mà các service kết nối tới qua mạng.

Vậy kiến trúc này vẫn đúng khi tách máy. Điều thật sự thay đổi là cách build, cấu hình và vận hành.

Cần làm gì khi lên môi trường thật

┌─────────────┬─────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────┐
│   Vấn đề    │       Hiện tại (dev)        │                                     Môi trường thật                                      │
├─────────────┼─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ Build và    │ Monorepo; Dockerfile build  │ Vẫn ổn nếu giữ monorepo. Nếu tách mỗi service một repo thì phải publish thư viện lên     │
│ phiên bản   │ thư viện từ source cùng     │ Maven registry (GitHub Packages, Nexus) và đánh version rõ ràng. Mỗi lần sửa thư viện    │
│ thư viện    │ service (-am).              │ phải build lại mọi service dùng nó, và nên giữ tương thích ngược vì các service có thể   │
│             │                             │ deploy lệch version nhau.                                                                │
├─────────────┼─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ MinIO       │ Một container.              │ Cần chạy cụm MinIO phân tán (erasure coding, nhiều node) hoặc dùng S3/R2 có sẵn. Thư     │
│             │                             │ viện dùng API chuẩn S3 nên chỉ cần đổi cấu hình, không đổi code.                         │
├─────────────┼─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│             │ minio:9000 trong mạng       │ MINIO_INTERNAL_URL là DNS nội bộ của cụm; MINIO_BROWSER_URL là domain HTTPS công khai    │
│ Địa chỉ     │ Docker; trình duyệt dùng    │ (ví dụ https://files.example.com) qua reverse proxy hoặc CDN.                            │
│             │ localhost:9000.             │                                                                                          │
├─────────────┼─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ Tạo bucket, │ Container minio-init dùng   │ Chạy một lần như Job trong pipeline deploy, hoặc viết bằng Terraform. Nếu dùng AWS S3    │
│  user,      │ mc admin.                   │ thì mc admin không dùng được: user và policy chuyển thành IAM role hoặc user và bucket   │
│ policy      │                             │ policy; lifecycle cấu hình trên bucket.                                                  │
├─────────────┼─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ Secret      │ .env.                       │ Dùng secret manager (Vault, Kubernetes Secret, AWS Secrets Manager). Mỗi service chỉ     │
│             │                             │ nhận secret của mình; điểm này compose hiện tại đã làm đúng.                             │
├─────────────┼─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ CORS        │ MinIO cho phép mọi origin   │ Chỉ cho phép đúng domain của web; cần cấu hình riêng trên MinIO hoặc S3.                 │
│             │ (mặc định).                 │                                                                                          │
├─────────────┼─────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ Bộ nhớ khi  │ Mỗi ảnh ≤ 5MB đi qua        │ Vẫn chấp nhận được, nhưng phải tính vào giới hạn RAM khi chạy nhiều bản catalog song     │
│ xác nhận    │ service một lần.            │ song. File lớn hơn nhiều thì chuyển sang xử lý dạng stream hoặc bất đồng bộ.             │
│ ảnh         │                             │                                                                                          │
└─────────────┴─────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────┘

Đánh đổi của cách dùng thư viện chung

Theo tinh thần microservices, thư viện dùng chung tạo ra một chút ràng buộc: đổi thư viện thì phải build lại các service dùng nó. Cách này hợp lý ở đây vì:
- thư viện chỉ chứa phần kỹ thuật (ký link, kiểm file, xóa metadata), không chứa nghiệp vụ;
- quyền xem file vẫn do từng service quyết định;
- phương án thay thế là một file-service chạy riêng, đúng thứ ta vừa bỏ, vì nó buộc kiểm quyền theo người upload và mọi file phải đi qua nó.

Hiện chỉ catalog dùng thư viện, nên ràng buộc này còn rất nhỏ. Nguyên tắc cần giữ là để thư viện nhỏ, chỉ làm việc kỹ thuật, và giữ tương thích ngược khi sửa.

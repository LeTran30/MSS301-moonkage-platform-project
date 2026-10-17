<!--
Template cho PR nâng cấp MAJOR: Java, Spring Boot, Maven/Gradle, plugin build,
hoặc thư viện lên version major mới.

Dùng bằng cách thêm vào cuối URL tạo PR:
  ?expand=1&template=major_upgrade_template.md

Tiêu đề ví dụ:
  chore(deps)!: nâng Spring Boot 3.5 lên 4.0
  chore(build): nâng Error Prone 2.49 lên 2.50

Dependabot không tự mở PR nâng major. Việc này luôn do người làm chủ động,
và AI agent không tự nâng version khi chưa được giao rõ ràng.
-->

## Nâng cấp

| Thành phần | Từ | Lên |
|---|---|---|
| <!-- Spring Boot --> | <!-- 3.5.x --> | <!-- 4.0.x --> |

Refs: <!-- ticket -->

## Lý do

<!-- Hết hạn hỗ trợ? Lỗ hổng bảo mật? Cần tính năng mới? Thư viện khác yêu cầu? -->

## Tài liệu đã đọc

<!-- Bắt buộc. Link release notes và migration guide chính thức. -->

- Release notes:
- Migration guide:

## Breaking changes và cách xử lý

<!-- Liệt kê từng breaking change trong migration guide có ảnh hưởng tới dự án,
     và đã xử lý thế nào. Không ảnh hưởng thì ghi "Không ảnh hưởng" kèm lý do. -->

| Breaking change | Ảnh hưởng tới dự án | Cách xử lý |
|---|---|---|
| | | |

## Thay đổi đi kèm

- [ ] API bị deprecated đã được thay thế
- [ ] Cấu hình (`application*.yml`, property đổi tên) đã cập nhật
- [ ] Thư viện phụ thuộc đã nâng theo cho tương thích:
- [ ] Không còn version `SNAPSHOT` hay khoảng version (`1.+`)

## Công cụ chất lượng vẫn hoạt động

<!-- Nâng Java hoặc build tool dễ làm hỏng công cụ phân tích một cách âm thầm. -->

- [ ] Spotless, Checkstyle, Error Prone, PMD, SpotBugs chạy được với version mới
- [ ] Số vi phạm không giảm bất thường (giảm mạnh thường là dấu hiệu công cụ không còn chạy)
- [ ] Không có suppression mới được thêm để "cho qua"
- [ ] Annotation processor (Lombok, MapStruct) vẫn chạy

## Kiểm chứng

- [ ] `./mvnw clean verify` xanh ở local
- [ ] Integration test (Testcontainers) xanh
- [ ] Đã chạy thử ứng dụng ở môi trường staging. Kết quả:
- [ ] Đã so sánh thời gian khởi động, bộ nhớ hoặc hiệu năng nếu nâng framework/JVM:

## Kế hoạch rollback

<!-- Nếu lỗi sau khi deploy thì quay lại thế nào? Có migration hay dữ liệu
     nào không quay ngược được không? -->

## Điều kiện merge riêng cho PR này

- [ ] Code Owner của `pom.xml` / build đã approve
- [ ] Nếu ảnh hưởng `auth`, `payment` hoặc migration: Code Owner tương ứng đã approve
- [ ] Đã thông báo cho team về thời điểm merge

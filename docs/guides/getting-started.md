# Chạy dự án lần đầu

## Yêu cầu
- JDK 21+ (không cần cài Maven, dùng wrapper `./mvnw`)
- Node.js 18+
- Docker & Docker Compose

## Cài đặt
```bash
git clone https://github.com/LeTran30/MSS301-moonkage-platform-project.git
cd MSS301-moonkage-platform-project
cp .env.example .env
openssl rand -base64 48               # dán vào JWT_SECRET; đặt thêm ADMIN_PASSWORD và SEED_PASSWORD
git config core.hooksPath .githooks   # bật pre-commit kiểm tra format/style (mỗi lần clone)
```

Windows: nếu `git clone` báo `Filename too long`, chạy `git config --global core.longpaths true` rồi clone lại.

## Cách A: chạy toàn bộ backend bằng Docker
```bash
docker compose up -d --build
```

Các service tự tạo bảng (Flyway) và nạp dữ liệu mẫu: xem [database.md](database.md).

- Gateway: http://localhost:8080
- Eureka: http://localhost:8761
- Swagger UI: http://localhost:8080/swagger-ui.html (chọn service ở góc trên bên phải)
- MinIO console: http://localhost:9001
- RabbitMQ: http://localhost:15672

## Cách B: database chạy Docker, service chạy từ IDE
```bash
docker compose up -d identity-db catalog-db quotation-db order-db vendor-db payment-db orchestrator-db minio minio-init rabbitmq

cd api
./mvnw -pl discovery-server spring-boot:run   # chạy Eureka trước
./mvnw -pl api-gateway spring-boot:run        # các service còn lại, mỗi cái một terminal
./mvnw -pl identity-service spring-boot:run
./mvnw -pl catalog-service spring-boot:run
./mvnw -pl quotation-service spring-boot:run
./mvnw -pl order-service spring-boot:run
./mvnw -pl vendor-service spring-boot:run
./mvnw -pl payment-service spring-boot:run
./mvnw -pl orchestrator-service spring-boot:run
```

Trên Windows `cmd`/PowerShell dùng `mvnw.cmd` thay cho `./mvnw`. Mỗi service tự đọc file `.env` ở thư mục gốc. Chạy kiểu này thì **không có dữ liệu mẫu** (chỉ docker-compose bật `db/seed`).

## Frontend
```bash
cd web
npm install
npm run dev        # http://localhost:5173
```

## Tài khoản
- **Admin:** identity-service tạo lúc khởi động từ `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `.env`.
- **Tài khoản mẫu** `member1@mk.com` … `member5@mk.com`, mật khẩu `SEED_PASSWORD`: danh sách ở [database.md](database.md#4-tài-khoản-mẫu).
- Tài khoản khác đăng ký qua `/api/auth/register`. Mã OTP gửi bằng email qua orchestrator-service; khi `MAIL_HOST` để trống, email không được gửi (chỉ ghi một dòng log, không kèm mã), nên cần cấu hình Gmail SMTP để thử luồng đăng ký.

## Biến môi trường
Danh sách đầy đủ và giá trị mẫu: [`.env.example`](../../.env.example).

Trong Docker, mỗi container chỉ nhận các biến nó đọc (danh sách `environment` của service trong `docker-compose.yml`), không nạp cả `.env`. Khi một service đọc thêm biến mới trong `application.yml`, nhớ thêm biến đó vào danh sách của service trong `docker-compose.yml`. Chạy từ IDE thì service vẫn đọc cả `.env` ở thư mục gốc.

| Biến | Mô tả | Ví dụ |
|---|---|---|
| `DB_USERNAME`, `DB_PASSWORD` | Tài khoản PostgreSQL dùng chung cho 7 DB | `bake2b` / `bake2b_secret` |
| `*_DB_HOST`, `*_DB_PORT` | Địa chỉ DB của từng service (Docker tự ghi đè) | `localhost`, `5441` |
| `EUREKA_URL` | Địa chỉ Eureka | `http://localhost:8761/eureka/` |
| `JWT_SECRET` | Khóa HS256 dạng Base64, ≥ 32 byte. identity-service và gateway phải dùng **cùng** giá trị | `openssl rand -base64 48` |
| `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION` | Hạn token (ms) | `43200000` (12h), `604800000` (7 ngày) |
| `OTP_EXPIRATION`, `OTP_MAX_ATTEMPTS` | Hạn và số lần nhập sai OTP | `5m`, `5` |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | SMTP gửi email (orchestrator-service). Để trống `MAIL_HOST` thì không gửi | `smtp.gmail.com`, `587` |
| `NFC_TRANSPORT_PRIVATE_KEY_V1`, `PII_ENC_KEY_V1`, `ID_HASH_PEPPER_V1` | Khóa xác minh NFC, chỉ identity-service; cách tạo ghi trong `.env.example` | — |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Tài khoản admin tạo lúc khởi động | `admin@moonkage.vn` |
| `SEED_PASSWORD` | Mật khẩu chung của tài khoản mẫu (chỉ dev) | — |
| `CORS_ORIGINS` | Origin frontend được phép gọi gateway (phân cách bằng dấu phẩy) | `http://localhost:5173` |
| `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | Tài khoản root MinIO, chỉ container `minio` và `minio-init` dùng | `minioadmin` |
| `MINIO_API_PORT`, `MINIO_CONSOLE_PORT` | Port MinIO (API, console) | `9000`, `9001` |
| `MINIO_BROWSER_URL` | Địa chỉ trình duyệt dùng để tới MinIO (URL ảnh, link upload); bắt buộc đặt khi deploy | `http://localhost:9000` |
| `MINIO_PUBLIC_BUCKET`, `MINIO_PRIVATE_BUCKET`, `MINIO_VENDOR_DOCS_BUCKET` | Bucket đọc công khai (ảnh sản phẩm), riêng tư (file của order, upload tạm) và giấy tờ người bán (chỉ vendor-service) | `moonkage-public`, `moonkage-private`, `moonkage-vendor-docs` |
| `MINIO_CATALOG_ACCESS_KEY` / `_SECRET_KEY`, `MINIO_ORDER_…`, `MINIO_VENDOR_…` | User MinIO riêng của từng service, do `minio-init` tạo; service không dùng tài khoản root | `catalog-service`, … |
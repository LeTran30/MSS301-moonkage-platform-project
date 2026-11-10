# common-storage (thư viện lưu trữ đối tượng)

> **Đây không phải service.** `common-storage` là một **thư viện Java** (`api/common-storage`) được các service có file nhúng vào dependency. Nó không chạy, không có cổng riêng, không có database và không gọi HTTP ra ngoài. Tài liệu này mô tả **API của thư viện** và cách service dùng nó.

Thư viện lo phần "upload file" của hệ thống: client POST thẳng file lên MinIO bằng presigned policy, rồi service sở hữu kiểm file và chuyển nó sang vị trí chính. Không có service nào đẩy byte file qua mình ở bước tải lên.

- Mô tả đầy đủ class chính: [../../archive/2026-11-08-class-docs/common-storage/ObjectStorage.md](../../archive/2026-11-08-class-docs/common-storage/ObjectStorage.md).
- Quyết định kiến trúc liên quan: Software Design mục 8 (File) và NFR-03; quy ước đặt tên object nằm ở [../../architecture/api-db/README.md](../../architecture/api-db/README.md).

## Trách nhiệm

**Có trách nhiệm**

- Cấp presigned POST để client tải thẳng lên MinIO vùng tạm, ràng buộc key, Content-Type và dung lượng.
- Kiểm file đã tải (loại, kích thước, magic bytes) và **xoá** file sai; xoá metadata ảnh (EXIF, GPS…) trước khi lưu.
- Chuyển file từ vùng tạm sang key chính `<keyPrefix>/<uuid>.<ext>` và trả key để service lưu vào DB.
- Cấp link tải có thời hạn (presigned GET) cho file riêng tư; trả URL cố định cho file trong bucket công khai.
- Chặn service khởi động nếu user MinIO của service không đọc được vùng tạm của nó.

**Không có trách nhiệm**

- Không kiểm quyền nghiệp vụ. Service sở hữu phải kiểm quyền **trước** khi gọi `createPresignedUploadLink` hoặc `createPresignedDownloadUrl` — ai có link thì tải được.
- Không tạo bucket, policy hay user MinIO. Việc đó thuộc `infra/minio/init.sh` (container `minio-init`, chạy bằng root).
- Không lưu danh sách file. Thư viện không có database; service lưu `object_key` của file nó sở hữu.
- Không giữ file lâu dài. Vùng `tmp/` được dọn bằng lifecycle rule của MinIO.

## API của thư viện

Package gốc `com.moonkage.storage`. Bean `ObjectStorage` do `StorageAutoConfiguration` tạo; service chỉ cần khai báo dependency và cấu hình `storage.*`.

| Method | Input | Output | Mục đích |
|---|---|---|---|
| `createPresignedUploadLink` | `contentType`, `sizeBytes`, `FileLimit` | `PresignedUploadLink` (`tempKey`, `uploadUrl`, `formFields`, `expiresAt`) | Cấp link tải vào vùng tạm |
| `moveUploadedFile` | `tempKey`, `FileLimit`, `BucketAccess`, `keyPrefix` | `String` (key chính) | Kiểm file, xoá metadata ảnh, chuyển sang key chính |
| `isTempKey` | `key` | `boolean` | Key còn chờ xác nhận hay không |
| `toPublicUrl` | `key` | `String` | URL cố định của file trong bucket công khai |
| `createPresignedDownloadUrl` | `key` | `String` | Presigned GET có thời hạn cho file riêng tư |
| `deleteQuietly` | `BucketAccess`, `key` | `void` | Xoá file; không tồn tại thì bỏ qua, lỗi chỉ ghi log |
| `verifyPrivateBucketAccess` | — | `void` | Chặn khởi động nếu user MinIO không đọc được vùng tạm |

Lỗi: `InvalidFileException(StorageErrorCode)` cho lỗi phía client, `StorageUnavailableException` cho lỗi MinIO. Mã lỗi nằm ở `StorageErrorCode` (`STORAGE_001` … `STORAGE_007`, `STORAGE_503`), câu báo ở `storage-messages.properties` — service thêm `storage-messages` vào `spring.messages.basename` để resolve.

Kiểu phụ trợ: `FileLimit` (loại được phép + cỡ tối đa), `BucketAccess` (`PUBLIC` / `PRIVATE`), `PresignedUploadLink`, `ImageMetadataStripper`, `FileSignatures`, `ContentTypeExtensions`, `StorageProperties`.

## Ai đang dùng

Trong `api/pom.xml`, hai service khai báo dependency `common-storage`:

| Service | Dùng để | Key prefix |
|---|---|---|
| vendor-service | Ảnh sản phẩm (bucket công khai `moonkage-public`, tiền tố `products`), giấy tờ người bán và hóa đơn phí (bucket riêng tư `moonkage-vendor-docs`) | `tmp/vendor` (vùng tạm); file đã xác nhận nằm ở `products/<vendorId>/…` (ảnh, bucket công khai) và `vendor/<vendorId>/…` (giấy tờ, bucket riêng tư) |
| order-service | Maket, ảnh tiến độ, hóa đơn, bằng chứng khiếu nại (bucket riêng tư `moonkage-private`) | `tmp/order` (vùng tạm); file đã xác nhận nằm ở `order/<orderId>/…` |

`catalog-service` từng dùng thư viện này nhưng đã bỏ (BE-09): catalog chỉ đọc, không upload.

## Cấu hình

`StorageProperties` (`@ConfigurationProperties("storage")`) — mỗi service khai đủ các khoá sau trong `application.yml`, lấy từ `.env` ở gốc repo:

| Khoá | Ý nghĩa |
|---|---|
| `storage.internal-url` | Địa chỉ service gọi MinIO (trong Docker: `http://minio:9000`) |
| `storage.browser-url` | Địa chỉ trình duyệt gọi MinIO; link ký dùng host này vì chữ ký phủ cả host |
| `storage.region` | Cố định, để SDK không gọi `GetBucketLocation` (user của service không có quyền này) |
| `storage.access-key`, `storage.secret-key` | User MinIO **riêng của service**, do `infra/minio/init.sh` tạo — không dùng root |
| `storage.public-bucket-name` | Bucket đọc công khai (ảnh sản phẩm) |
| `storage.private-bucket-name` | Bucket chỉ mở qua link ký; cũng chứa file chưa xác nhận |
| `storage.temp-key-prefix` | Tiền tố vùng tạm của service, vd `tmp/order`; **phải** khớp với policy mà `infra/minio/init.sh` cấp |
| `storage.upload-link-lifetime` | Hạn presigned POST |
| `storage.download-link-lifetime` | Hạn presigned GET |

Thiếu một khoá hoặc sai thì service **dừng lúc khởi động** với `Could not resolve placeholder`.

## Luật bất biến

1. Upload luôn vào vùng tạm (`tempKeyPrefix`) của bucket riêng tư; chỉ `moveUploadedFile` mới chuyển sang chỗ chính.
2. Tên object là `<keyPrefix>/<uuid>.<ext>`: không chứa accountId hay dữ liệu cá nhân; đuôi lấy từ content type, không lấy từ tên file của client.
3. File vượt giới hạn, khai sai loại hoặc nội dung không khớp magic bytes bị **xoá ngay**, không để client thử lại với giới hạn rộng hơn.
4. Ảnh không mang metadata sau khi xác nhận: JPEG bỏ EXIF/XMP/IPTC/comment (giữ Orientation), PNG bỏ `eXIf`/`tEXt`/`zTXt`/`iTXt`/`tIME`, WebP bỏ `EXIF`/`XMP `.
5. Thư viện không kiểm quyền; service sở hữu kiểm quyền nghiệp vụ trước.

## Chạy và kiểm thử

Thư viện không chạy riêng. Kiểm thử:

```bash
cd api
./mvnw -pl common-storage -am clean verify
```

Test dùng Testcontainers (MinIO) nên cần Docker.

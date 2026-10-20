# Class Log: `ObjectStorage`

- **Package:** `com.moonkage.storage` (module `api/common-storage`, thư viện, không phải service)
- **Tham chiếu:** Software Design nguyên tắc chia service số 5, mục 8 (File), NFR-03; `docs/archive/2026-10-19-file-storage-plan.md`
- **Dependencies:** `MinioClient` nội bộ (`internalClient`, gọi MinIO qua `internalUrl` trong mạng Docker), `MinioClient` ký link (`browserUrlSigner`, theo `browserUrl`), `StorageProperties`, `Clock`. Cả hai đăng nhập bằng **user MinIO riêng của service**, không phải root.
- **Luật bất biến (Invariants):**
  1. Upload và tải xuống đi thẳng giữa client và MinIO (presigned POST / GET). File chỉ qua service một lần lúc xác nhận (`moveUploadedFile`), tối đa `limit.maxSize`, để kiểm nội dung và xóa metadata ảnh.
  2. Upload luôn vào `tempKeyPrefix` (vd `tmp/catalog/`) của bucket riêng tư; chỉ `moveUploadedFile` mới chuyển sang chỗ chính. `tmp/` tự xóa sau `MINIO_TEMP_RETENTION_DAYS` ngày (lifecycle rule do `infra/minio/init.sh` đặt).
  3. Tên object là `<keyPrefix>/<uuid>.<ext>`: không chứa accountId hay dữ liệu cá nhân; đuôi lấy từ content type, không lấy từ tên file của client.
  4. Class này **không kiểm quyền**. Service sở hữu phải kiểm quyền nghiệp vụ trước khi gọi `createPresignedUploadLink` và `createPresignedDownloadUrl`.
  5. File vượt giới hạn, khai sai loại hoặc nội dung không đúng loại (magic bytes, cấu trúc) bị xóa ngay, không để client thử lại với giới hạn rộng hơn.
  7. Ảnh công khai không mang metadata: JPEG bỏ EXIF/XMP/IPTC/comment (chỉ giữ Orientation), PNG bỏ `eXIf`/`tEXt`/`zTXt`/`iTXt`/`tIME`, WebP bỏ `EXIF`/`XMP `. Điểm ảnh không bị mã hóa lại.
  6. Class này không tạo bucket, policy hay user: việc đó thuộc `infra/minio/init.sh` (container `minio-init`, chạy bằng root). User của service chỉ có `GetObject`/`PutObject`/`DeleteObject` trên tiền tố của chính nó.

## 1. Danh mục Method

Lỗi client là `InvalidFileException(StorageErrorCode)`, text ở `storage-messages.properties` (service thêm `storage-messages` vào `spring.messages.basename`). Lỗi MinIO là `StorageUnavailableException`, service trả 503 với `UNAVAILABLE`.

| Method | Input | Output | Ngoại lệ | Mục đích |
| --- | --- | --- | --- | --- |
| `createPresignedUploadLink` | `contentType`, `sizeBytes`, `FileLimit` | `PresignedUploadLink` (`tempKey`, `uploadUrl`, `formFields`, `expiresAt`) | `TYPE_NOT_ALLOWED`, `EMPTY_FILE`, `FILE_TOO_LARGE`; `StorageUnavailableException` | Cấp presigned POST vào vùng tạm; policy ràng buộc key, Content-Type, dung lượng. |
| `moveUploadedFile` | `tempKey`, `FileLimit`, `BucketAccess`, `keyPrefix` | `String` (key chính) | `INVALID_KEY`, `NOT_UPLOADED`, `TYPE_MISMATCH`, `CONTENT_MISMATCH` và lỗi vượt giới hạn; `StorageUnavailableException` | Kiểm file (loại, cỡ, magic bytes), xóa metadata ảnh, ghi sang chỗ chính. |
| `isTempKey` | `key` | `boolean` | — | Key còn chờ xác nhận hay không. |
| `toPublicUrl` | `key` | `String` | — | URL cố định của file trong bucket công khai. |
| `createPresignedDownloadUrl` | `key` | `String` | `StorageUnavailableException` | Presigned GET có thời hạn cho file riêng tư. |
| `deleteQuietly` | `BucketAccess`, `key` | `void` | — (không bao giờ ném; lỗi chỉ ghi log) | Xóa file; object không tồn tại thì bỏ qua. |
| `verifyPrivateBucketAccess` | — | `void` | `StorageUnavailableException` | Chặn service khởi động nếu user không đọc được vùng tạm của mình; chạy lúc khởi động. |

## 2. Pseudocode chi tiết các Method nặng

### Method: `createPresignedUploadLink(contentType, sizeBytes, limit)` -> `PresignedUploadLink`
1. **[Guard]**
   - NẾU `contentType` không thuộc `limit.allowedContentTypes` -> `THROW InvalidFileException(TYPE_NOT_ALLOWED)` (liệt kê loại cho phép).
   - NẾU `sizeBytes <= 0` -> `THROW InvalidFileException(EMPTY_FILE)`.
   - NẾU `sizeBytes > limit.maxSize` -> `THROW InvalidFileException(FILE_TOO_LARGE)`.
2. **[Xử lý]**
   - `tempKey = <tempKeyPrefix>/<uuid ngẫu nhiên><đuôi theo contentType>`.
   - `expiresAt = bây giờ + uploadLinkLifetime`.
   - Ký POST policy cho bucket riêng tư bằng `browserUrlSigner`, hết hạn lúc `expiresAt`, điều kiện: `key` = `tempKey`, `Content-Type` = `contentType`, `content-length-range` 1..`sizeBytes`. Lỗi ký -> `THROW StorageUnavailableException`.
   - `formFields` = các trường SDK trả về (policy, chữ ký, x-amz-*) + `key` + `Content-Type`; `uploadUrl` = `<browserUrl>/<privateBucketName>`.
3. **[Trả kết quả]**
   - `RETURN PresignedUploadLink(tempKey, uploadUrl, formFields, expiresAt)`. Client POST multipart: mọi `formFields`, rồi file ở trường cuối tên `file`.

### Method: `moveUploadedFile(tempKey, limit, targetAccess, keyPrefix)` -> `String`
1. **[Guard]**
   - NẾU `tempKey` không bắt đầu bằng `<tempKeyPrefix>/` HOẶC phần sau không đúng dạng `<uuid>.<đuôi>` -> `THROW InvalidFileException(INVALID_KEY)`. Chặn `../`, key của người khác, key tự bịa.
   - Đọc metadata `tempKey` trong bucket riêng tư. NẾU không có -> `THROW InvalidFileException(NOT_UPLOADED)`.
   - NẾU content type thật khác loại suy ra từ đuôi của key, HOẶC vượt `limit` (loại, rỗng, quá cỡ):
     - Xóa `tempKey` -> `THROW InvalidFileException(TYPE_MISMATCH | TYPE_NOT_ALLOWED | EMPTY_FILE | FILE_TOO_LARGE)`.
   - Đọc toàn bộ object (đã chắc ≤ `limit.maxSize`). NẾU byte đầu không khớp loại (`FileSignatures`) HOẶC cấu trúc ảnh không đọc được -> xóa `tempKey` -> `THROW InvalidFileException(CONTENT_MISMATCH)`.
2. **[Xử lý]**
   - Xóa metadata ảnh (`ImageMetadataStripper`); PDF giữ nguyên.
   - `finalKey = <keyPrefix>/<uuid>.<đuôi>` (giữ nguyên tên file).
   - Ghi nội dung đã làm sạch vào `(bucket của targetAccess, finalKey)` kèm Content-Type. Lỗi -> `THROW StorageUnavailableException`.
3. **[Lưu trữ / Tác dụng phụ]**
   - Xóa `tempKey` (lỗi chỉ ghi log; lifecycle sẽ dọn sau).
4. **[Trả kết quả]**
   - `RETURN finalKey` để service lưu vào database.

### Method: `verifyPrivateBucketAccess()`
1. Đọc metadata key `<tempKeyPrefix>/.access-probe` (không bao giờ tồn tại) trong bucket riêng tư.
2. MinIO trả `NoSuchKey` -> bucket có, credentials đúng, policy cho phép -> ghi log, xong.
3. Lỗi khác (`AccessDenied`, `NoSuchBucket`, sai khóa, không kết nối được) -> `THROW StorageUnavailableException` nêu tên user, bucket, tiền tố và gợi ý chạy `minio-init`; service không khởi động.

## 3. Trường hợp biên & Ghi chú

- **POST policy chặn từ MinIO:** file lớn hơn kích thước đã khai -> MinIO trả 400 `EntityTooLarge`; khác `Content-Type` hoặc khác `key` -> 403. File quá cỡ không còn nằm trong `tmp/`. `moveUploadedFile` vẫn kiểm lại loại và cỡ trên object thật, phòng policy cấu hình sai.
- **Magic bytes:** MinIO không đọc nội dung, nên HTML khai `image/png` vẫn upload được; nó bị chặn lúc xác nhận (`CONTENT_MISMATCH`) và bị xóa.
- **Orientation:** bỏ hết EXIF thì ảnh điện thoại bị hiển thị nghiêng, nên JPEG giữ lại một khối EXIF tối thiểu chỉ có tag 0x0112. PNG/WebP hiếm khi dùng orientation nên không giữ.
- **Bộ nhớ:** mỗi lượt xác nhận giữ một file (≤ `limit.maxSize`) trong bộ nhớ; nhiều file cùng lúc thì nhân lên. Với ảnh 5MB là chấp nhận được; file lớn hơn nhiều (video) thì phải xử lý dạng stream hoặc bất đồng bộ.
- **Hai client cùng xác nhận một `tempKey`:** request đến sau không tìm thấy object (đã chuyển và xóa), nên nhận `NOT_UPLOADED`.
- **Copy xong nhưng xóa `tmp/` lỗi:** chỉ tốn chỗ, lifecycle dọn sau một ngày; nghiệp vụ không bị hỏng.
- **Host trong link ký:** chữ ký phủ cả host, nên `browserUrlSigner` dùng `browserUrl` (host trình duyệt thấy).
- **Region cố định cho cả hai client:** nếu không, SDK gọi `GetBucketLocation` để dò region; `browserUrlSigner` sẽ gọi qua địa chỉ container không tới được, còn user của service không có quyền này (lỗi `AccessDenied` trên `/bucket` lúc khởi động là dấu hiệu).
- **Thiếu `s3:ListBucket`:** user không có quyền liệt kê vẫn nhận `NoSuchKey` khi đọc metadata object không tồn tại trong tiền tố được cấp (đã kiểm với MinIO dev), nên `NOT_UPLOADED` vẫn là 400, không thành 503.
- **Bucket công khai đọc được toàn bộ:** vì upload chưa xác nhận nằm ở bucket riêng tư, bucket công khai chỉ chứa file đã được service xác nhận.
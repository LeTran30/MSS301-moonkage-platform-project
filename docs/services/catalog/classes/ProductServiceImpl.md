# Class Log: `ProductServiceImpl`

- **Package:** `com.moonkage.catalog.service.impl`
- **Tham chiếu:** FR-04 (xem sản phẩm công khai), FR-30 → FR-32 (Shop quản lý sản phẩm), AC-30.1, AC-30.2, AC-30.3 (chờ Q-11), AC-31.1, AC-31.2, AC-32.1, NFR-07 (audit), D-19 (chủ người bán không phải vai)
- **Dependencies:** `ProductRepository`, `VendorClient` (Feign sang vendor-service), `ObjectStorage` (common-storage), `ProductImageProperties`, `ApplicationEventPublisher` (audit qua `AuditPublisher`)
- **Luật bất biến (Invariants):**
  1. Chỉ người bán `APPROVED` đã mở Shop mới được thao tác sản phẩm; quyền tra theo accountId, không nằm trong JWT.
  2. Sản phẩm của Shop khác trả lời như không tồn tại (`404`), không lộ id.
  3. Sản phẩm `REMOVED` (quản trị gỡ) không sửa và không đổi hiển thị được.
  4. Người bán thuần bán lại (`RESELL`) bắt buộc có thương hiệu và nơi sản xuất.
  5. Bậc giá không trùng `fromQty`.
  6. Ảnh lưu dạng object key trong bucket công khai. Ảnh mới phải là upload `tmp/` vừa được xác nhận; không gắn được key của sản phẩm khác.
  7. MinIO khớp database sau transaction: commit thì xóa ảnh bị bỏ, rollback thì xóa ảnh vừa thêm.
  8. Xóa sản phẩm là xóa mềm; ảnh giữ lại vì giỏ hàng và lịch sử đơn còn tham chiếu.

## 1. Danh mục Method

Lỗi trả qua `CustomException(HttpStatus, message)`; lỗi file qua `InvalidFileException` (400) và `StorageUnavailableException` (503) của common-storage.

| Method | Input | Output | Lỗi có thể ném | Mục đích |
| --- | --- | --- | --- | --- |
| `createImageUploadLink` | `accountId`, `ImageUploadRequest` | `PresignedUploadLinkResponse` | 403 chưa có Shop; `InvalidFileException` | Cấp link upload ảnh sản phẩm thẳng lên MinIO. |
| `createProduct` | `accountId`, `CreateProductRequest` | `ProductResponse` | 403; 400 thiếu thông tin bán lại, trùng bậc giá, ảnh không hợp lệ | Tạo sản phẩm `ON_SALE`. |
| `updateProduct` | `accountId`, `productId`, `UpdateProductRequest` | `ProductResponse` | 403; 404; 400 (như trên, sản phẩm bị gỡ) | Sửa từng phần; ghi audit đổi giá / tồn kho. |
| `setVisibility` | `accountId`, `productId`, `visible` | `ProductResponse` | 403; 404; 400 sản phẩm bị gỡ | Ẩn / hiện sản phẩm. |
| `deleteProduct` | `accountId`, `productId` | `void` | 403; 404 | Xóa mềm. |
| `getMyProducts` | `accountId`, `status?` | `List<ProductResponse>` | 403 | Sản phẩm của Shop, mới nhất trước. |
| `getMyProduct` | `accountId`, `productId` | `ProductResponse` | 403; 404 | Chi tiết sản phẩm của Shop. |
| `searchOnSale` | `vendorId?`, `keyword?`, `page`, `size` | `PageResponse<ProductResponse>` | — | Tìm sản phẩm đang bán (không cần đăng nhập). |
| `getOnSaleProduct` | `productId` | `ProductResponse` | 404 | Chi tiết sản phẩm đang bán. |

## 2. Pseudocode chi tiết các Method nặng

### Method: `createImageUploadLink(accountId, request)` -> `PresignedUploadLinkResponse`
1. **[Guard]** `requireShop(accountId)` (xem bên dưới).
2. **[Xử lý]** `objectStorage.createPresignedUploadLink(contentType, size, luật ảnh sản phẩm)`; luật lấy từ `catalog.product-image` trong `application.yml`.
3. **[Trả kết quả]** `tempKey`, `uploadUrl`, `formFields`, `expiresAt`. Client POST multipart lên `uploadUrl` với mọi `formFields` rồi file ở trường `file` (MinIO chặn loại khác hoặc file lớn hơn kích thước đã khai), rồi gửi `tempKey` trong `imageKeys`. Khi xác nhận, metadata ảnh (EXIF/GPS…) bị xóa.

### Method: `createProduct(accountId, request)` -> `ProductResponse`
1. **[Guard]**
   - `requireShop(accountId)`.
   - NẾU người bán là `RESELL` VÀ thiếu `brand` hoặc `origin` -> 400.
   - NẾU hai bậc giá trùng `fromQty` -> 400.
2. **[Xử lý]**
   - Tạo `Product` từ request (trim chuỗi), `status = ON_SALE`.
   - `replaceImages(product, request.imageKeys)`: sản phẩm mới chưa có ảnh nên mọi key phải là upload `tmp/`.
   - Thay toàn bộ bậc giá, sắp theo `fromQty`.
3. **[Lưu trữ]** `save(product)`. Sau transaction: commit thì không xóa gì, rollback thì xóa ảnh vừa xác nhận.
4. **[Trả kết quả]** `toResponse`: `imageUrls` dựng từ `imageKeys` bằng `toPublicUrl`.

### Method: `updateProduct(accountId, productId, request)` -> `ProductResponse`
1. **[Guard]**
   - `requireShop(accountId)`; `requireOwnProduct` (không có hoặc của Shop khác -> 404); NẾU `REMOVED` -> 400.
   - Ghi nhớ giá và tồn kho cũ.
2. **[Xử lý]** Trường thiếu, `null`, chuỗi trống hoặc `imageKeys` rỗng thì giữ giá trị cũ.
   - NẾU có `imageKeys` -> `replaceImages(product, request.imageKeys)`. Đây là danh sách đầy đủ theo thứ tự hiển thị; ảnh không có trong danh sách sẽ bị xóa.
   - NẾU có `priceTiers` -> kiểm trùng -> thay toàn bộ (`[]` xóa hết).
   - Kiểm lại luật bán lại trên giá trị sau khi sửa.
3. **[Lưu trữ & Sự kiện]**
   - Audit `PRODUCT_PRICE_CHANGED`, `PRODUCT_STOCK_CHANGED` nếu giá trị đổi (gửi sau commit).
   - `saveAndFlush` để response có `updatedAt` mới. Sau transaction: commit thì xóa ảnh bị bỏ, rollback thì xóa ảnh vừa thêm.
4. **[Trả kết quả]** `toResponse(saved)`.

### Helper: `replaceImages(product, keys)` -> `void`
1. **[Guard]** (`validateImageKeys`)
   - `currentKeys` = ảnh sản phẩm đang có.
   - NẾU `keys` có phần tử trùng -> 400 "Danh sách ảnh bị trùng".
   - Với mỗi key: NẾU không thuộc `currentKeys` VÀ không phải key `tmp/` -> 400 "Ảnh không hợp lệ".
2. **[Xử lý]** (`moveNewUploads`, tất cả hoặc không)
   - Duyệt theo thứ tự: key đã có thì giữ, key `tmp/` thì `objectStorage.moveUploadedFile(..., PUBLIC, "products")`.
   - NẾU một ảnh bị từ chối -> xóa các ảnh đã chuyển trong lần này -> ném lại lỗi.
3. **[Tác dụng phụ]** (`deleteImagesAfterTransaction`)
   - `addedKeys` = key mới chuyển; `droppedKeys` = key cũ không còn trong danh sách.
   - Đăng ký `afterCompletion`: commit thì xóa `droppedKeys`, rollback thì xóa `addedKeys`.
4. **[Gán]** `product.imageKeys` = danh sách key cuối cùng, giữ thứ tự client gửi.

### Helper: `requireShop(accountId)` -> `VendorInfo`
1. Gọi vendor-service `getVendorByOwnerAccountId`. NẾU 404 -> 403 "chưa đăng ký người bán". Lỗi Feign khác -> 503 (qua `GlobalExceptionHandler`).
2. NẾU `status != APPROVED` -> 403. NẾU chưa mở Shop -> 403.
3. Trả `VendorInfo`.

## 3. Trường hợp biên & Ghi chú

- **Rollback sau khi đã chuyển ảnh** (vd `updateProduct` đổi ảnh rồi mới phát hiện thiếu thông tin bán lại): ảnh vừa chuyển bị xóa trong `afterCompletion`, ảnh cũ còn nguyên.
- **Xóa ảnh cũ thất bại sau commit:** chỉ ghi log và tốn chỗ trên MinIO; database đã đúng.
- **Upload chưa gắn vào sản phẩm:** không ai xóa ở đây; lifecycle của bucket riêng tư dọn `tmp/` sau 1 ngày.
- **Gắn `tmp/` key do Shop khác upload:** key là UUID ngẫu nhiên, không đoán được; class này không kiểm người upload.
- **Hai Shop sửa cùng lúc:** mỗi Shop chỉ sửa sản phẩm của mình; `@Version` trên `Product` chặn ghi đè khi hai request cùng sửa một sản phẩm.
- **Nhãn giao hàng (AC-30.3):** chờ Q-11, hiện chấp nhận mọi nhãn.
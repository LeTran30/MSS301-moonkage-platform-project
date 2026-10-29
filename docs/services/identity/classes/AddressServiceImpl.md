# Class Log: `AddressServiceImpl`

- **Package:** `com.moonkage.identity.address` (component `address`: chỉ `AddressService` và `dto/` là public)
- **Tham chiếu:** `FR-03` (Quản lý sổ địa chỉ), `AC-03.1`, `AC-03.2`, `Q-12` (vùng giao = tỉnh/thành)
- **Dependencies:** `AddressRepository`, `AccountApi` (`lockForUpdate`), `AddressMapper`
- **Mô hình địa chỉ:** hai cấp hành chính áp dụng từ 01/07/2025 — **tỉnh/thành → phường/xã/đặc khu**, không còn cấp huyện. Mỗi cấp lưu **mã quốc gia** (tỉnh 2 số, xã 5 số) để so khớp và **tên** người dùng đã chọn để địa chỉ vẫn đọc đúng nếu sau này đơn vị đổi tên. Kèm người nhận (`recipientName`, `recipientPhone`), `detail` (số nhà, đường) và `label` tùy chọn.
- **Luật bất biến (Invariants):**
  1. Mỗi tài khoản có **tối đa 1** địa chỉ mặc định tại mọi thời điểm.
  2. Mọi thao tác thêm/sửa đổi cờ mặc định phải khóa dòng tài khoản qua `AccountApi.lockForUpdate` (`FOR UPDATE` trên `accounts`) để chống race condition. `address` không đụng vào entity `Account`: `Address` chỉ giữ `accountId`.
  3. Địa chỉ của tài khoản khác trả về `ADDRESS_NOT_FOUND` (như không tồn tại) để không lộ thông tin.
  4. `areaCode` không do client gửi: luôn bằng `provinceCode` (`Address.getAreaCode()`), nên không thể lệch với tỉnh.

## 1. Danh mục Method

| Method | Input | Output | ErrorCode có thể ném | Mục đích |
| --- | --- | --- | --- | --- |
| `create` | `accountId`, `AddAddressRequest` | `AddAddressResponse` | `ACCOUNT_NOT_FOUND` | Tạo địa chỉ mới, tự xử lý cờ mặc định. |
| `getMyAddresses` | `accountId` | `List<AddressResponse>` | — | Danh sách địa chỉ, mặc định lên đầu rồi mới nhất. |
| `update` | `accountId`, `addressId`, `AddAddressRequest` | `AddAddressResponse` | `ACCOUNT_NOT_FOUND`, `ADDRESS_NOT_FOUND` | Thay toàn bộ nội dung địa chỉ thuộc sở hữu. |
| `delete` | `accountId`, `addressId` | `void` | `ADDRESS_NOT_FOUND` | Xóa địa chỉ; xóa địa chỉ mặc định thì không tự gán cái khác. |

## 2. Pseudocode chi tiết

### Method: `create(accountId, request)` -> `AddAddressResponse`
1. **[Guard & Lock]**
   - `AccountApi.lockForUpdate(accountId)` -> NẾU không có tài khoản `THROW ACCOUNT_NOT_FOUND`.
2. **[Xử lý nghiệp vụ]**
   - Lấy danh sách địa chỉ hiện có `existing`.
   - Tạo `Address` mới với `accountId`, gán qua `apply` (xem dưới).
   - `makeDefault = existing rỗng HOẶC request.isDefault == true`.
   - NẾU `makeDefault`: hạ cờ mặc định của mọi địa chỉ trong `existing`.
3. **[Lưu trữ]** `saveAndFlush` để response có `createdAt`, `updatedAt`.
4. **[Trả kết quả]** `AddressMapper.toResponse` (ghép `fullAddress = detail, wardName, provinceName`; `areaCode = provinceCode`).

### Method: `update(accountId, addressId, request)` -> `AddAddressResponse`
1. **[Guard & Lock]**
   - `AccountApi.lockForUpdate(accountId)` -> NẾU không có tài khoản `THROW ACCOUNT_NOT_FOUND`.
   - Tìm địa chỉ theo `(addressId, accountId)` -> NẾU không có `THROW ADDRESS_NOT_FOUND`.
2. **[Xử lý nghiệp vụ]**
   - `apply(address, request)`.
   - NẾU `request.isDefault == true`: hạ cờ các địa chỉ khác, đặt địa chỉ này mặc định.
   - NGƯỢC LẠI NẾU `request.isDefault == false`: bỏ cờ mặc định (tài khoản có thể còn 0 địa chỉ mặc định).
   - `null`: giữ nguyên cờ.
3. **[Lưu trữ & Trả kết quả]** `saveAndFlush` -> `AddressMapper.toResponse`.

### Helper: `apply(address, request)`
- `recipientName`, `wardName`, `detail`: `trim`.
- `provinceName`: lấy từ danh mục `Province` theo `provinceCode`; giá trị client gửi bị bỏ qua (quyết định C3).
- `recipientPhone`: dạng trong nước `0912…` (quyết định C1) -> `PhoneNumber` 9 số `912…` (cùng dạng với số của tài khoản; `toNational()` cho số để gọi).
- `provinceCode`, `wardCode`: giữ nguyên (đã qua regex 2 số / 5 số ở DTO).
- `label`: rỗng hoặc toàn khoảng trắng -> `null`.

## 3. Trường hợp biên & Ghi chú

- **Chỉ kiểm định dạng mã, chưa kiểm mã có thật và xã có thuộc tỉnh không.** identity-service chưa có danh mục đơn vị hành chính. Client chọn từ danh mục quốc gia; khi cần chặt hơn thì thêm danh mục (34 tỉnh, ~3.300 xã) và kiểm `wardCode` thuộc `provinceCode`.
- Đơn hàng chép lại địa chỉ (BR-19), nên sửa/xóa địa chỉ không ảnh hưởng đơn đã tạo.
- "Địa chỉ đang chọn" để lọc (AC-03.2) là trạng thái phía client, không lưu ở đây; client dùng `areaCode` của địa chỉ đó.
- Địa chỉ mẫu cho máy dev nằm trong `identity-service/…/db/seed/R__seed.sql` (xem `docs/guides/database.md`).

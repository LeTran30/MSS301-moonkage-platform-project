# Tài liệu pseudocode theo class (lưu trữ)

> **Lưu trữ (2026-11-08):** nhóm quyết định ngừng viết tài liệu class. 20 file dưới đây không còn được cập nhật cùng code, nên có thể đã lệch với hành vi hiện tại; code là bản đúng. Tài liệu hiện hành của mỗi service: `docs/services/<service>/README.md` ([bản đồ](../../README.md)).

| Thư mục | Class |
|---|---|
| [identity/](identity/) | `AccountServiceImpl`, `AddressServiceImpl`, `AuthServiceImpl`, `EmailServiceImpl`, `LegalProfileServiceImpl`, `NfcServiceImpl`, `OtpServiceImpl`, `OutboxServiceImpl` |
| [catalog/](catalog/) | `CatalogProjectionServiceImpl`, `InterprovinceFeeServiceImpl`, `JdbcCatalogProjectionRepository`, `OutboxDeliveryServiceImpl`, `ProductReadServiceImpl`, `ProjectionInboxServiceImpl`, `ProjectionRecoveryServiceImpl`, `ProjectionReplayEntryServiceImpl` |
| [quotation/](quotation/) | `QuoteAcceptanceServiceImpl`, `QuoteRequestServiceImpl`, `QuoteServiceImpl` |
| [common-storage/](common-storage/) | `ObjectStorage` |

`check-class-docs.mjs` là script CI từng dùng để đối chiếu tên file với class Java. Nó không còn chạy trong CI.

Nguyên văn hai quy tắc đã ngừng áp dụng được giữ dưới đây.

## Từ `docs/conventions/coding-rules.md`

### PHẦN 5: Quy tắc tạo Docs Log mô tả Pseudocode (Mỗi Class một File)

Khi hạn chế tối đa comment dài dòng trong file `.java` (để giữ code gọn sạch theo Phần 4), toàn bộ bức tranh luồng đi nghiệp vụ phức tạp cần được lưu lại thành **tài liệu Pseudocode riêng biệt**.

**Nguyên tắc gốc:**
- **Mỗi Class nặng = 1 File `.md` độc lập**, đặt tại `docs/services/<service>/classes/<ClassName>.md`, cạnh `README.md` của service đó (ví dụ: `docs/archive/2026-11-08-class-docs/identity/AuthServiceImpl.md`, `docs/services/catalog/classes/ProductServiceImpl.md`). Không nhồi nhét nhiều class vào chung một file lớn gây khó tra cứu và khó cập nhật khi sửa code.
- **Chỉ áp dụng có chọn lọc cho nhóm Class có nhiều method nặng:** Không viết tràn lan cho mọi class để tránh rác tài liệu.

#### 5.1. Phân loại nhóm Class CẦN và KHÔNG CẦN tạo Docs Pseudocode

| Phân loại | Các nhóm Class áp dụng | Lý do |
| --- | --- | --- |
| **BẮT BUỘC tạo file Pseudocode** | - Tầng nghiệp vụ chính (`*ServiceImpl`: `AuthServiceImpl`, `AccountServiceImpl`, `NfcServiceImpl`, `OtpServiceImpl`...)<br>- Các class bộ máy kiểm tra / thuật toán / bảo mật phức tạp (`NfcCardValidator`, `JwtFilter`, `OutboxRelay`...) | Chứa nhiều nhánh rẽ điều kiện (`if/else`), khóa đồng thời (locking), nhiều mã lỗi nghiệp vụ và tác dụng phụ (DB + Event + Cache). |
| **KHÔNG tạo file Pseudocode** | - Controller (`web/*`, `controller/*`), DTO (`dto/*`), entity, enum, repository, mapper, constant, value object | Các class này chỉ định tuyến mỏng, khai báo cấu trúc dữ liệu hoặc ánh xạ 1-1; đọc trực tiếp code nhanh hơn đọc tài liệu. |

#### 5.2. Cấu trúc chuẩn của một File Docs Pseudocode (`<ClassName>.md`)

Mỗi file tài liệu của một class nặng thống nhất gồm **4 mục**:

1. **Thông tin chung & Bất biến nghiệp vụ (Overview & Invariants):**
   - Mã yêu cầu liên quan (`FR-xx`, `AC-xx`, `D-xx`).
   - Danh sách các Dependency mà class gọi tới.
   - Các **luật bất biến (Invariants)** không bao giờ được phép vi phạm trong class này.
2. **Bảng tóm tắt các Method trong Class:**
   - Liệt kê nhanh: `Tên Method` | `Input` | `Output` | `Ngoại lệ (ErrorCode)` | `Mô tả 1 câu`.
3. **Luồng Pseudocode chi tiết cho từng Method nặng:**
   - Viết bằng **ngôn ngữ nghiệp vụ ngắn gọn** (không copy-paste code Java vào), bám sát **4 nhịp của Phần 3** (`[1. Guard / Validate]` → `[2. Xử lý nghiệp vụ]` → `[3. Lưu trữ & Sự kiện]` → `[4. Trả kết quả]`).
   - Ghi rõ điều kiện rẽ nhánh (`NẾU ... THÌ THROW ErrorCode...`).
4. **Nhật ký quyết định / Trường hợp biên (Edge Cases & Notes):**
   - Ghi chú các tình huống tranh chấp đồng thời (race condition), lý do đánh đổi kỹ thuật.

#### 5.3. Mẫu chuẩn một File Docs Pseudocode (Ví dụ: `AddressServiceImpl.md`)

```markdown
# Class Log: `AddressServiceImpl`

- **Package:** `com.moonkage.identity.address`
- **Tham chiếu:** `FR-03` (Quản lý sổ địa chỉ), `AC-03.1`
- **Dependencies:** `AddressRepository`, `AccountService` (`lockForUpdate`), `AddressMapper`
- **Luật bất biến (Invariants):**
    1. Mỗi tài khoản chỉ có **tối đa 1** địa chỉ mặc định tại mọi thời điểm.
    2. Mọi thao tác thêm/sửa đổi cờ mặc định của một tài khoản phải khóa dòng tài khoản (`AccountService.lockForUpdate`,
       `FOR UPDATE`) để chống race condition.
    3. Địa chỉ của tài khoản khác truy cập vào phải trả về lỗi `ADDRESS_NOT_FOUND` (như không tồn tại) để không lộ thông
       tin.

## 1. Danh mục Method

| Method | Input | Output | ErrorCode có thể ném | Mục đích |
| --- | --- | --- | --- | --- |
| `getMyAddresses` | `accountId` | `List<AddressResponse>` | — | Lấy danh sách địa chỉ, xếp mặc định lên đầu. |
| `create` | `accountId`, `AddAddressRequest` | `AddAddressResponse` | `ACCOUNT_NOT_FOUND` | Tạo địa chỉ mới và tự động xử lý cờ mặc định. |
| `update` | `accountId`, `addressId`, `AddAddressRequest` | `AddAddressResponse` | `ACCOUNT_NOT_FOUND`, `ADDRESS_NOT_FOUND` | Cập nhật địa chỉ thuộc sở hữu của tài khoản. |
| `delete` | `accountId`, `addressId` | `void` | `ADDRESS_NOT_FOUND` | Xóa địa chỉ (nếu xóa địa chỉ mặc định thì không tự gán cái khác). |

## 2. Pseudocode chi tiết các Method nặng

### Method: `create(accountId, request)` -> `AddAddressResponse`

1. **[Guard & Lock]**
    - Khóa dòng tài khoản `accountId` (`AccountService.lockForUpdate`).
    - NẾU không tồn tại tài khoản -> `THROW ACCOUNT_NOT_FOUND`.
2. **[Xử lý nghiệp vụ]**
    - Lấy danh sách địa chỉ hiện có `existing` của `accountId`.
    - Khởi tạo `Address` mới, chuẩn hóa `detail` (`trim`) và `areaCode` (`trim + UPPERCASE`).
    - Xác định `makeDefault = (existing rỗng) HOẶC (request.isDefault == true)`.
    - NẾU `makeDefault == true`:
        - Duyệt toàn bộ `existing` -> hạ cờ `isDefault = false`.
    - Gán `address.isDefault = makeDefault`.
3. **[Lưu trữ]**
    - Lưu và đẩy xuống DB ngay (`saveAndFlush`) để nhận giá trị `createdAt`, `updatedAt`.
4. **[Trả kết quả]**
    - Chuyển sang `AddAddressResponse` qua `AddressMapper.toResponse` và trả về.

### Method: `update(accountId, addressId, request)` -> `AddAddressResponse`

1. **[Guard & Lock]**
    - Khóa dòng tài khoản `accountId` (`AccountService.lockForUpdate`) -> NẾU không có `THROW ACCOUNT_NOT_FOUND`.
    - Tìm địa chỉ theo `(addressId, accountId)` -> NẾU không có `THROW ADDRESS_NOT_FOUND`.
2. **[Xử lý nghiệp vụ]**
    - Cập nhật `detail` và `areaCode` đã chuẩn hóa vào `address`.
    - NẾU `request.isDefault == true`:
        - Hạ cờ `isDefault = false` của tất cả địa chỉ khác cùng `accountId`.
        - Đặt `address.isDefault = true`.
    - NGƯỢC LẠI NẾU `request.isDefault == false`:
        - Đặt `address.isDefault = false`.
3. **[Lưu trữ & Trả kết quả]**
    - `saveAndFlush(address)` -> `RETURN AddressMapper.toResponse(saved)`.
```

## Từ `docs/architecture/architecture-standards.md`

### 7.6. Tài liệu class nặng: ai sửa, khi nào, kiểm bằng gì

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** `docs/services/*/classes/*.md` là tài liệu **sinh tay** mô tả pseudocode của class. Không có quy trình thì nó lệch dần và người đọc tưởng hành vi cũ vẫn đúng.

| Câu hỏi | Trả lời |
|---|---|
| **Phạm vi** | Mỗi file `docs/services/<service>/classes/<ClassName>.md` mô tả **một** class Java `api/<module>/src/main/java/**/<ClassName>.java`. Tên file phải **khớp đúng** tên class (kể cả phân biệt hoa thường). Ánh xạ thư mục → module: `docs/services/<service>` ↔ `api/<service>-service`, riêng `common-storage` giữ nguyên tên. |
| **Khi nào phải cập nhật** | Trong **cùng PR** với thay đổi chạm vào class: đổi tên class, đổi package, đổi/xoá method, đổi luật bất biến, đổi mã lỗi nghiệp vụ, đổi thứ tự trạng thái. Class không còn đáng viết tài liệu → **xoá file** tài liệu trong cùng PR. |
| **Ai giữ** | Tác giả của PR đó — người sửa code của class đó. Người giữ tài liệu chỉ cập nhật danh sách class nặng ở đây. |
| **Kiểm tra bằng gì** | `node docs/archive/2026-11-08-class-docs/check-class-docs.mjs` — đối chiếu tên file `classes/<ClassName>.md` với file `<ClassName>.java` trong module tương ứng. Chạy trong `.github/workflows/docs-links.yml`, bước **Check class docs match source**; job này chạy khi `**/*.md` **hoặc** `api/**/*.java` thay đổi. |
| **Giới hạn của bước kiểm tra** | Script bắt được class **đã đổi tên hoặc bị xoá**. Nội dung tài liệu có còn đúng với hành vi mới thì người review PR phải đọc lại — CI không thay được bước đọc đó. |

Danh sách class được tài liệu hoá (20 file) nằm ở `docs/services/*/classes/`:

| Service | Class |
|---|---|
| identity | `AccountServiceImpl`, `AddressServiceImpl`, `AuthServiceImpl`, `EmailServiceImpl`, `LegalProfileServiceImpl`, `NfcServiceImpl`, `OtpServiceImpl`, `OutboxServiceImpl` |
| catalog | `CatalogProjectionServiceImpl`, `InterprovinceFeeServiceImpl`, `JdbcCatalogProjectionRepository`, `OutboxDeliveryServiceImpl`, `ProductReadServiceImpl`, `ProjectionInboxServiceImpl`, `ProjectionRecoveryServiceImpl`, `ProjectionReplayEntryServiceImpl` |
| quotation | `QuoteAcceptanceServiceImpl`, `QuoteRequestServiceImpl`, `QuoteServiceImpl` |
| common-storage | `ObjectStorage` |

Tiêu chuẩn nội dung một file tài liệu class: [../conventions/coding-rules.md](../../conventions/coding-rules.md) Phần 5.

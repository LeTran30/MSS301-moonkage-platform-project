# Bộ Quy Tắc Thiết Kế Package & Viết Class Chuẩn

Dưới đây là **Bộ Quy Tắc Thiết Kế Package & Viết Class Chuẩn** được xây dựng theo đúng khung tư duy của bạn cho dự án Moonkage.

> **Mức độ kiểm tra tự động:** Chỉ một phần quy tắc được máy kiểm tra.
> - `checkstyle.xml` chặn: tên logger (`log`), viết tắt quá 4 chữ hoa liền nhau, `if` thiếu `{}`, `TODO` trơn, tiền tệ dùng `double/float`.
> - `ArchitectureTest.java` chỉ chặn **phụ thuộc giữa các layer** (controller ↛ repository/entity, dto ↛ entity, repository ↛ layer trên, service ↛ controller, không vòng lặp package).
> - Các quy tắc còn lại (DTO là `record`, Mapper là `final`, hậu tố tên class, thứ tự method...) là **quy ước nhóm**, kiểm tra bằng code review.

---

## PHẦN 1: Quy tắc gom nhóm Package (Layer & Domain)

Trước khi đặt bút viết một class, phải xác định đúng "nhà" cho nó theo 2 trục:

1. **Chia theo Domain (Cùng miền nghiệp vụ):**
   - Các class giải quyết cùng một bài toán nghiệp vụ phải nằm chung trong một microservice hoặc sub-package miền đó (`com.moonkage.identity`, `com.moonkage.order`, `com.moonkage.catalog`...).
   - Không để class của miền này xử lý hộ dữ liệu cốt lõi của miền khác.

2. **Chia theo Layer (Cùng tính chất kỹ thuật):**
   - Trong một domain, các class có **cùng bản chất kỹ thuật** phải gom vào cùng một package layer:
     - `controller`: Chỉ tiếp nhận/trả HTTP.
     - `service` / `service.impl`: Chỉ xử lý luật nghiệp vụ & transaction.
     - `repository`: Chỉ giao tiếp Database.
     - `mapper`: Chỉ chuyển đổi qua lại giữa `Entity` và `DTO`.
     - `dto.request` / `dto.response`: Chỉ mang dữ liệu qua biên API.
     - `entity`: Ánh xạ bảng cơ sở dữ liệu. Được chứa **hành vi thuần trên chính field của nó** (vd `Account.isNfcLocked(now)`, `Account.acceptsTokenIssuedAt(iat)`) để không lặp lại ở nhiều service; không gọi repository/service, không chứa luồng nghiệp vụ nhiều bước.


**Note**: Không bắt buộc phải chọn một trong hai mà có thể mix, nhưng phải đảm bảo một điều về tính đồng nhất giữa các package

- Ví dụ mix trong identity-service: package `nfc` gom mọi class nghiệp vụ của xác minh NFC (`NfcService`, `LegalProfileService` và `Impl`, `NfcCardValidator`, mã hóa `PiiCipher` / `IdNumberHasher` / `NfcTransportDecryptor`, cấu hình `NfcProperties`). Controller, entity, repository, dto vẫn nằm ở package layer chung.
- Một package miền không được tạo vòng phụ thuộc với package layer (ArchUnit `NO_PACKAGE_CYCLES`): `nfc` được dùng `service` (vd `OutboxService`), nhưng `service` không được dùng ngược lại `nfc`.


---

## PHẦN 2: Quy tắc Đặt tên (Tên Class, Tên Method, Tên Thuộc tính)

Một class gồm 3 định danh cốt lõi: **Tên Class**, **Tên Method** và **Tên Thuộc tính**. Một class tốt bắt buộc cả 3 cái tên này phải tốt.

### 2.1. Quy tắc đặt tên Class (Danh từ + Ngữ cảnh)

**Nguyên tắc gốc:**
- Luôn là **Danh từ** hoặc **Cụm danh từ** viết theo `PascalCase`.
- **Quy tắc từ viết tắt:** Từ viết tắt ghép vào tên luôn viết như một từ bình thường (chỉ hoa chữ cái đầu): `SendOtpRequest`, `NfcCardService`, `HttpUrl` — không viết `SendOTPRequest`, `NFCCardService`.
  - *Phạm vi kiểm tra:* Checkstyle `AbbreviationAsWordInName` với `allowedAbbreviationLength = 1` chặn từ **3 chữ hoa liền nhau** trở lên: `SendOTPRequest` (`OTPR`), `NFCCardService` (`NFCC`), `sendOTP` (`OTP`) đều bị chặn. Không đặt `0` vì sẽ bắt nhầm tên test dạng câu có mạo từ "A" (`tokenOfADeletedAccountIsInvalid`).

#### Bảng quy ước tên Class theo tình huống (Layer)

| Tình huống / Layer | Công thức đặt tên | Ví dụ chuẩn trong dự án | Lưu ý bắt buộc |
| --- | --- | --- | --- |
| **Entity (DB)** | `<DanhTừMiền>` (Số ít) | `Account`, `Address`, `LegalProfile` | Không thêm hậu tố `Entity` hay `Model`. |
| **Request DTO** | `<HànhĐộng/MụcĐích> + Request` | `LoginRequest`, `SendOtpRequest`, `SaveAddressRequest` | Dùng Java `record`. Cụm `<HànhĐộng>` đóng vai trò bổ ngữ cho danh từ `Request`. |
| **Response DTO** | Kết quả của một hành động: `<HànhĐộng> + <ĐốiTượng> + Response`<br>Biểu diễn một tài nguyên: `<DanhTừ> + Response` | Hành động: `RegisterAccountResponse`, `CreateNfcSessionResponse`, `CheckIdNumberResponse`, `SubmitCardResponse`, `LoginResponse`<br>Tài nguyên: `AddressResponse`, `NfcStatusResponse`, `NfcSessionStatusResponse`<br>Bao chung: `ApiResponse<T>` | Dùng Java `record`. Response của hành động đặt cùng cặp với Request (`RegisterAccountRequest` → `RegisterAccountResponse`). Response dùng chung cho nhiều endpoint (GET/POST/PUT cùng trả) thì đặt theo danh từ. |
| **Controller** | `<TàiNguyên> + Controller` | `AuthController`, `AddressController`, `NfcController`, `IntAccountController`, `IntNfcController` | Controller giao tiếp nội bộ giữa các service (path `/internal/...`) thêm tiền tố `Int`. Mỗi endpoint chỉ đặt ở **một** controller, theo tài nguyên nó thao tác. Thuộc tính con của tài nguyên (vd số định danh của tài khoản) không tách controller riêng mà đặt trong controller của tài nguyên cha: `POST /internal/accounts/check` nằm ở `IntAccountController`. |
| **Service** | Interface: `<Miền> + Service`<br>Class: `<Miền> + ServiceImpl` | `AddressService` → `AddressServiceImpl` | Nếu tách class phụ trợ chuyên biệt trong `service.impl` thì đặt theo vai trò: `NfcCardValidator`. |
| **Repository** | `<Entity> + Repository` | `AccountRepository`, `AddressRepository` | Luôn là `interface`. |
| **Mapper** | `<Entity> + Mapper` | `AddressMapper`, `AccountMapper` | Luôn là `public final class` có `private constructor`. |
| **Exception** | `<TênLỗi> + Exception` | `AppException` | Handler tập trung đặt là `GlobalExceptionHandler`. |
| **Event (Messaging)** | `<SựKiệnQuáKhứ/DanhTừ> + Event` | `NfcVerificationEvent`, `EmailNotificationEvent` | Dùng `record`. |
| **Enum** | `<DanhTừSốÍt>` | `Role`, `Gender`, `OtpPurpose` | Không đặt số nhiều (`Roles` ❌ → `Role` ✅). |

---

### 2.2. Quy tắc đặt tên Method (Động từ + Kiểu trả về)

**Nguyên tắc gốc:**
- Luôn bắt đầu bằng **Động từ** viết theo `camelCase`.
- Nhìn vào **tiền tố động từ**, người đọc phải đoán được ngay **kiểu dữ liệu trả về** và **hành vi khi không tìm thấy dữ liệu**.

#### Bảng quy ước tên Method theo Kiểu trả về

| Kiểu trả về | Tiền tố Động từ chuẩn | Ý nghĩa & Hành vi cam kết | Ví dụ chuẩn |
| --- | --- | --- | --- |
| **`boolean`** | `is...`, `has...`, `can...`, `should...`, `exists...` | Trả về đúng/sai, **không bao giờ** trả `Boolean` (wrapper có thể `null`) trừ khi bắt buộc ở DTO. | `isDefault()`, `hasVerifiedNfc()`, `canOperate()`, `existsByEmail(email)` |
| **`Optional<T>`** | `find...` | Tìm kiếm có thể có hoặc không. Người gọi tự quyết định xử lý khi rỗng. | `findByEmail(email)`, `findByIdAndAccountId(id, accountId)` |
| **`T` (Chắc chắn có)** | `get...`, `lock...` | Phải trả về đối tượng `T`. Nếu không thấy, **ném `AppException` ngay bên trong hàm**. Không dùng `find...` cho trường hợp này (đã dành cho `Optional`). | `getMyProfile(accountId)`, `getOwned(accountId, addressId)`, `lockAccount(accountId)` |
| **`List<T>` / `Page<T>`** | `get...s` (số nhiều), `list...`, `search...` | Không bao giờ trả về `null`. Nếu không có dữ liệu thì trả về `List.of()` (danh sách rỗng). | `getMyAddresses(accountId)`, `searchProducts(filter)` |
| **`T` / `Dto` (Tạo/Sửa)** | `create...`, `register...`, `update...`, `save...`, `submit...` | Thực hiện thay đổi trạng thái hệ thống và trả về kết quả vừa lưu. | `create(accountId, request)`, `register(request)`, `update(accountId, id, request)` |
| **`void` (Tác vụ)** | `delete...`, `send...`, `verify...`, `reset...`, `apply...`, `validate...` | Thực thi hành động hoặc kiểm tra hợp lệ (nếu sai thì throw exception). | `delete(accountId, addressId)`, `sendOtp(email)`, `apply(address, request)` |
| **Chuyển đổi kiểu** | `to...`, `from...`, `of...` | Chuyển đổi dữ liệu không làm thay đổi trạng thái hệ thống (thường là `static` trong Mapper/DTO). | `AddressMapper.toResponse(address)`, `ApiResponse.ok(data)` |

---

### 2.3. Quy tắc đặt tên Thuộc tính (Fields / Variables / Parameters)

**Nguyên tắc gốc:**
- **Rõ nghĩa, ngắn gọn, không lặp lại ngữ cảnh của Class chứa nó.**
  - Ví dụ: Trong class `Address`, đặt là `id`, `detail`, `areaCode` ✅ — **không** đặt là `addressId`, `addressDetail`, `addressAreaCode` ❌.
  - Ngược lại, khi truyền tham số vào Service hoặc đặt trong DTO không thuộc riêng `Address`, phải ghi rõ là `accountId`, `addressId` ✅ để không nhầm giữa các loại ID.

#### Bảng quy ước tên Thuộc tính theo tình huống

| Loại thuộc tính | Quy tắc đặt tên | Ví dụ Đúng (✅) | Ví dụ Sai (❌) & Lý do |
| --- | --- | --- | --- |
| **Biến thường / Field** | `camelCase`, danh từ ngắn gọn | `email`, `areaCode`, `attemptsLeft` | `strEmail` (thừa kiểu dữ liệu), `ac` (viết tắt tối nghĩa) |
| **Boolean field** | Tính từ hoặc có tiền tố `is/has/can` | `isDefault`, `verified`, `canOperate` | `status` (mơ hồ cho kiểu boolean), `flag` |
| **Collection (List/Set/Map)** | Danh từ **số nhiều** hoặc nêu rõ mối quan hệ | `addresses`, `existingAddresses`, `errors` | `addressList`, `itemArray`, `data` |
| **Tiền tệ (Money)** | Hậu tố rõ đơn vị/ý nghĩa (`...Price`, `...Fee`, `...Amount`) + kiểu `long` (VND, không số lẻ; khớp cột `bigint`) | `long totalPrice`, `long shippingFee` | `double price` (bị Checkstyle chặn bằng luật `noFloatingMoney`) |
| **Thời gian (Time)** | Thời điểm (`Instant`): hậu tố `...At` hoặc `...Until`<br>Ngày (`LocalDate`): `...Date` hoặc `dateOf...` | `createdAt`, `expiresAt`, `lockedUntil`, `dateOfBirth` | `createTime`, `expire`, `lockDate` (dùng cho `Instant`) |
| **Hằng số (`static final`)** | `UPPER_SNAKE_CASE`, thay thế cho mọi Magic Number | `MAX_OTP_ATTEMPTS = 5`, `SUCCESS_CODE = "SUCCESS"` | Viết thẳng số `5` hoặc chuỗi `"SUCCESS"` rải rác trong code |
| **Logger (SLF4J)** | Đặt đúng tên `log` | `private static final Logger log = ...` (hoặc `@Slf4j`) | `LOGGER`, `logger` (Checkstyle cấu hình chuẩn là `log`) |
| **Biến trong Stream / Lambda** | Ngắn gọn nếu lambda 1 dòng; rõ tên nếu nhiều dòng | `.forEach(a -> a.setDefault(false))` | Đặt tên `x`, `temp`, `obj` trong biểu thức dài |

---

## PHẦN 3: Luồng đi logic & Sắp xếp code trong Class / Method

Code tốt là code đọc từ trên xuống dưới mượt như một bài văn, không bắt người đọc phải cuộn chuột lên xuống liên tục.

### 3.1. Sắp xếp cấu trúc bên trong một Class (Từ trên xuống dưới)

1. **Hằng số (`static final`):** Đặt trên cùng (`PUBLIC` trước, `PRIVATE` sau).
2. **Dependencies (`private final` fields):** Các `Repository`, `Service` được inject qua constructor.
3. **Thuộc tính trạng thái (Instance fields):** Nếu là Entity/Config.
4. **Constructors / Static Factory methods.**
5. **Public methods (API chính của class):** Sắp xếp theo thứ tự nghiệp vụ (Create → Read → Update → Delete).
6. **Private helper methods:** Đặt ở dưới cùng, xếp theo đúng thứ tự mà các hàm `public` ở trên gọi tới chúng (**Stepdown Rule**).

### 3.2. Sắp xếp luồng đi bên trong một Method (4 bước rõ ràng)

Mỗi method nghiệp vụ nên đi theo đúng 4 nhịp (xem mẫu tại `AddressServiceImpl.update()`):

```java
@Override
@Transactional
public AddressResponse update(String accountId, String addressId, SaveAddressRequest request) {
    // NHỊP 1: Guard Clauses / Fail-Fast (Kiểm tra điều kiện biên, khóa & nạp dữ liệu, sai là dừng ngay)
    lockAccount(accountId);
    Address address = getOwned(accountId, addressId);

    // NHỊP 2: Thực thi nghiệp vụ chính (Biến đổi trạng thái rõ ràng, tách hàm phụ nếu dài)
    apply(address, request);
    if (Boolean.TRUE.equals(request.isDefault())) {
        clearOtherDefaults(accountId, addressId);
        address.setDefault(true);
    } else if (Boolean.FALSE.equals(request.isDefault())) {
        address.setDefault(false);
    }

    // NHỊP 3: Lưu trữ / Phát sự kiện (Persistence & Side-effects)
    Address saved = addressRepository.saveAndFlush(address);

    // NHỊP 4: Chuyển đổi và trả kết quả (Return DTO)
    return AddressMapper.toResponse(saved);
}
```

**3 quy tắc vàng giữ luồng logic sạch:**
- **Tránh lồng `if-else` sâu (Early Return / Guard Clause):** Kiểm tra lỗi trước và `throw` hoặc `return` ngay ở đầu hàm để phần thân chính luôn nằm ở mức thụt lề ngoài cùng.
- **Cùng mức độ trừu tượng (Single Level of Abstraction):** Không trộn lẫn các dòng xử lý chuỗi chi tiết (`trim()`, `toUpperCase()`) với các bước nghiệp vụ lớn trong cùng một hàm chính — hãy gom các chi tiết đó vào hàm phụ `private` như `apply(address, request)`.
- **Luôn có dấu `{}`:** Ngay cả khi `if` chỉ có 1 dòng (Checkstyle bắt bằng luật `NeedBraces`).

---

## PHẦN 4: Quy tắc viết Comment (Code tự mô tả là Comment tốt nhất)

**Nguyên tắc gốc:**
- **Chỉ comment khi thực sự cần thiết:** Khi Tên Class, Tên Method và Tên Thuộc tính đã được đặt tốt (Phần 2) và luồng logic đã rõ ràng (Phần 3), bản thân code đã là một lời giải thích hoàn chỉnh (**Self-Documenting Code**).
- **Giải thích "Tại sao" (Why), không lặp lại "Làm gì" (What):** Trước khi gõ một dòng comment để giải thích đoạn code khó hiểu, hãy tự hỏi: *"Mình có thể đổi tên biến hoặc tách đoạn này thành một hàm `private` có tên rõ nghĩa để khỏi cần comment không?"*

### 4.1. Khi nào CẦN viết Comment? (Nên viết)

| Trường hợp cần comment | Mục đích | Ví dụ chuẩn trong dự án |
| --- | --- | --- |
| **Luật nghiệp vụ & Tham chiếu tài liệu** | Liên kết code với mã yêu cầu (`FR`, `AC`, `D-xx`) hoặc giải thích quy tắc miền không hiển nhiên. | `/** FR-03. Rules: at most one default per account (AC-03.1); the first address becomes the default... */` (trên `AddressServiceImpl`) |
| **Lý do kỹ thuật / Quyết định ngầm (Why)** | Giải thích vì sao phải chọn cách xử lý này (khóa dòng, flush sớm, bảo mật chống dò thông tin...). | `// flush so the response carries the generated timestamps`<br>`/** Another account's address answers like a missing one. */` |
| **Hợp đồng ở biên (Public API / DTO)** | Làm rõ ràng buộc hoặc ý nghĩa của trường dữ liệu mà kiểu dữ liệu chưa nói hết được. | `/** @param username email or phone number (FR-02) */` (trên `LoginRequest`) |
| **Bỏ qua quy tắc kiểm tra (`@SuppressWarnings`)** | Bắt buộc giải thích lý do vì sao cảnh báo đó là an toàn (false positive). | `@SuppressWarnings("unchecked") // An toàn: list chỉ chứa String, đã kiểm tra ở dòng 42` |
| **Việc cần làm (`TODO` / `FIXME`)** | Đánh dấu phần việc tồn đọng có chủ đích, bắt buộc kèm người chịu trách nhiệm hoặc mã issue (Checkstyle chặn `TODO` trơn). | `// TODO(#42): tách sang Redis khi chạy nhiều instance` |

### 4.2. Khi nào TUYỆT ĐỐI KHÔNG viết Comment? (Cấm / Tránh)

| Loại comment thừa (Bad Comment) | Ví dụ Sai (❌) | Cách xử lý Đúng (✅) |
| --- | --- | --- |
| **Lặp lại y hệt tên hàm / dòng code** | `// Lấy danh sách địa chỉ của tôi`<br>`public List<AddressResponse> getMyAddresses(...)` | Xóa comment; tên hàm `getMyAddresses` đã tự nói lên tất cả. |
| **Dùng comment để cứu một cái tên tệ** | `int d; // số ngày hết hạn OTP` | Xóa comment, đổi tên biến thành `int otpExpirationDays;`. |
| **Giải thích từng cụm điều kiện `if` rối rắm** | `// Kiểm tra tài khoản đã xác thực và không bị khóa`<br>`if (acc.getStatus() == 1 && !acc.isLocked() && ...)` | Tách thành method có tên rõ nghĩa: `if (acc.canLogin())`. |
| **Code cũ bị đóng lại (Commented-out code)** | `// addressRepository.deleteById(id);` | Xóa hẳn khỏi file. Lịch sử code đã có Git lưu giữ. |
| **Nhật ký chỉnh sửa / Tên người sửa trong code** | `// 19/10/2026 - Nam sửa lỗi làm tròn` | Xóa; thông tin này thuộc về Commit Message và `git blame`. |

---

## PHẦN 5: Quy tắc tạo Docs Log mô tả Pseudocode (Mỗi Class một File)

Khi hạn chế tối đa comment dài dòng trong file `.java` (để giữ code gọn sạch theo Phần 4), toàn bộ bức tranh luồng đi nghiệp vụ phức tạp cần được lưu lại thành **tài liệu Pseudocode riêng biệt**.

**Nguyên tắc gốc:**
- **Mỗi Class nặng = 1 File `.md` độc lập**, đặt tại `docs/services/<service>/classes/<ClassName>.md`, cạnh `README.md` của service đó (ví dụ: `docs/services/identity/classes/AuthServiceImpl.md`, `docs/services/catalog/classes/ProductServiceImpl.md`). Không nhồi nhét nhiều class vào chung một file lớn gây khó tra cứu và khó cập nhật khi sửa code.
- **Chỉ áp dụng có chọn lọc cho nhóm Class có nhiều method nặng:** Không viết tràn lan cho mọi class để tránh rác tài liệu.

### 5.1. Phân loại nhóm Class CẦN và KHÔNG CẦN tạo Docs Pseudocode

| Phân loại | Các nhóm Class áp dụng | Lý do |
| --- | --- | --- |
| **BẮT BUỘC tạo file Pseudocode** | - Tầng nghiệp vụ chính (`service/impl/*Impl`: `AuthServiceImpl`, `NfcCardServiceImpl`, `OtpServiceImpl`...)<br>- Các class bộ máy kiểm tra / thuật toán / bảo mật phức tạp (`NfcCardValidator`, `JwtFilter`, `OutboxRelay`...) | Chứa nhiều nhánh rẽ điều kiện (`if/else`), khóa đồng thời (locking), nhiều mã lỗi nghiệp vụ và tác dụng phụ (DB + Event + Cache). |
| **KHÔNG tạo file Pseudocode** | - `controller/*`, `dto/*`, `entity/*`, `enums/*`, `repository/*`, `mapper/*`, `constant/*` | Các class này chỉ định tuyến mỏng, khai báo cấu trúc dữ liệu hoặc ánh xạ 1-1; đọc trực tiếp code nhanh hơn đọc tài liệu. |

### 5.2. Cấu trúc chuẩn của một File Docs Pseudocode (`<ClassName>.md`)

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

### 5.3. Mẫu chuẩn một File Docs Pseudocode (Ví dụ: `AddressServiceImpl.md`)

```markdown
# Class Log: `AddressServiceImpl`

- **Package:** `com.moonkage.identity.service.impl`
- **Tham chiếu:** `FR-03` (Quản lý sổ địa chỉ), `AC-03.1`
- **Dependencies:** `AddressRepository`, `AccountRepository`, `AddressMapper`
- **Luật bất biến (Invariants):**
  1. Mỗi tài khoản chỉ có **tối đa 1** địa chỉ mặc định tại mọi thời điểm.
  2. Mọi thao tác thêm/sửa đổi cờ mặc định của một tài khoản phải khóa dòng `Account` (`FOR UPDATE`) để chống race condition.
  3. Địa chỉ của tài khoản khác truy cập vào phải trả về lỗi `ADDRESS_NOT_FOUND` (như không tồn tại) để không lộ thông tin.

## 1. Danh mục Method

| Method | Input | Output | ErrorCode có thể ném | Mục đích |
| --- | --- | --- | --- | --- |
| `getMyAddresses` | `accountId` | `List<AddressResponse>` | — | Lấy danh sách địa chỉ, xếp mặc định lên đầu. |
| `create` | `accountId`, `SaveAddressRequest` | `AddressResponse` | `ACCOUNT_NOT_FOUND` | Tạo địa chỉ mới và tự động xử lý cờ mặc định. |
| `update` | `accountId`, `addressId`, `SaveAddressRequest` | `AddressResponse` | `ACCOUNT_NOT_FOUND`, `ADDRESS_NOT_FOUND` | Cập nhật địa chỉ thuộc sở hữu của tài khoản. |
| `delete` | `accountId`, `addressId` | `void` | `ADDRESS_NOT_FOUND` | Xóa địa chỉ (nếu xóa địa chỉ mặc định thì không tự gán cái khác). |

## 2. Pseudocode chi tiết các Method nặng

### Method: `create(accountId, request)` -> `AddressResponse`
1. **[Guard & Lock]**
   - Khóa dòng tài khoản `accountId` (`findByIdForUpdate`).
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
   - Chuyển sang `AddressResponse` qua `AddressMapper.toResponse` và trả về.

### Method: `update(accountId, addressId, request)` -> `AddressResponse`
1. **[Guard & Lock]**
   - Khóa dòng tài khoản `accountId` (`findByIdForUpdate`) -> NẾU không có `THROW ACCOUNT_NOT_FOUND`.
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

Lời khuyên kinh nghiệm: "Premature optimization is the root of all evil" (Tối ưu hóa sớm là nguồn gốc của mọi tội lỗi). Đừng hy sinh sự sạch sẽ, rõ ràng của mã nguồn để đổi lấy một lượng hiệu năng siêu nhỏ không đáng kể. Code chạy cho máy hiểu, nhưng trước hết phải viết cho con người đọc và bảo trì được.

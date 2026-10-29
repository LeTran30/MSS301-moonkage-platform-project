# Kế hoạch rich entity cho identity-service

> **Trạng thái:** Đã thay thế (2026-10-29) bởi [Plan v2](identity-service-refactor-plan.md). Giai đoạn 1–2 dưới đây đã làm; phần còn lại không làm theo file này nữa.
>
> Trạng thái cũ: Đề xuất (2026-10-29). Đích của schema vẫn là [api-db/identity.md](../../architecture/api-db/identity.md); kế hoạch này đổi **ai chịu trách nhiệm về tính đúng của dữ liệu** trong code và thêm ràng buộc database đi kèm. Khi hai bên lệch, `identity.md` là bản đúng.

## Đích

**Không tồn tại một entity sai.** Mọi entity tự giữ đúng từng thuộc tính của nó và quan hệ giữa các thuộc tính đó, từ lúc được tạo cho tới mọi lần thay đổi sau. Không đường nào (service mới, seeder, test, mapper, một luồng admin viết sau này) dựng được hay đưa được entity vào trạng thái sai, vì entity không mở đường ghi nào không qua luật của nó.

Không phải đích: đổi `setX` thành tên khác. Một method `rename(String)` không kiểm gì vẫn chỉ là setter đổi tên.

## Hiện trạng

| Hiện trạng | Hệ quả |
| --- | --- |
| Mọi entity có `@Setter`, `@Builder`, `@AllArgsConstructor` ở mức class | Ai trong component cũng dựng được `Account` thiếu `email`, `role` tùy ý, `accountVerified = true`; sửa được `createdAt`, `id` |
| Độ dài và định dạng chỉ kiểm ở DTO (`AddAddressRequest`, `RegisterAccountRequest`) và `@Column(length)` | Một luồng không đi qua DTO (seeder, consumer sự kiện, luồng admin) ghi dữ liệu sai đến tận database mới bị chặn, hoặc không bị chặn |
| `Address.provinceName` do client gửi, không đối chiếu `provinceCode` | Dữ liệu tự mâu thuẫn ("79" + "Hà Nội") mà không lớp nào phát hiện |
| `NfcServiceImpl.saveLegalProfile`, `AccountServiceImpl.createMember` dựng entity bằng builder | Luật tạo nằm ở người gọi, mỗi chỗ một bản |
| `AuthServiceImpl` tự đọc `account.verified()` để quyết định đăng nhập | Luật "chưa xác nhận email thì không đăng nhập" nằm ở service, không ở tài khoản |
| `PasswordHash` ném `IllegalArgumentException`, `Email` ném `AppException` | Cùng loại lỗi mà một chỗ ra 400, một chỗ ra 500 |
| `Instant.now()` trong service | Không test tất định được hết hạn khóa |

Giai đoạn 0 (xong 2026-10-29): bỏ overload `String` của builder, các chỗ gọi truyền value object. Cùng đợt: admin chuyển vào `db/seed/R__seed.sql` với `SEED_PASSWORD` như các persona, `DataInitializer` và `app.admin.*` bị bỏ (mục Đã chốt).

Giai đoạn 1 (xong 2026-10-29): `common.DomainGuard`, `common.config.ClockConfig`, `BaseEntity` không còn setter, `PasswordHash` ném `AppException`, `DomainModelArchitectureTest` (mục Luật máy kiểm), mục 1.4 và vai trò "đối tượng miền" trong [coding-rules.md](../../conventions/coding-rules.md).

Giai đoạn 2 (xong 2026-10-29), theo schema chốt ở [db-identify.md](db-identify.md):

- `Account` tạo bằng `registerMember`, đổi bằng `confirmEmail()`, `changePassword(hash, now)`; không setter, builder, constructor public. Id giữ như cũ: `String`, `@GeneratedValue(strategy = UUID)`, JPA sinh khi lưu.
- Package `account/vo` đổi thành `account/atom` (atom là thành phần cấu tạo nên entity, nằm cùng component với entity). `AccountConstant` thành `atom/PasswordConstant`, và `PasswordHash.fromRawPassword` tự kiểm 8–72 ký tự.
- Bộ đếm và khóa NFC rời `accounts` sang bộ nhớ của kyc (`NfcAttemptTracker`, `NfcLockout`, `NfcLockoutPolicy` đều thuộc `kyc`).
- Migration `V2026_10_29_1500__accounts_invariants.sql`: bỏ `nfc_failed_attempts`, `nfc_locked_until`; FK đổi tên `fk_<bảng>_account`; `role varchar(10)`; `phone_number varchar(9)` + CHECK; CHECK `email = lower(email)`.
- `account` không còn phụ thuộc `profile`: `GET /api/accounts/me` do `UserProfileService.getMyAccount` ghép.
- Request tự chuẩn hóa (`common.RequestText`), service không normalize (luật `SERVICES_DO_NOT_NORMALIZE`); validate nghiệp vụ trong service là method `private validate…` ([coding-rules.md](../../conventions/coding-rules.md) mục 1.5, 1.6).

Lệch so với bản thiết kế ban đầu của giai đoạn 2:

- `ensureCanLogin()` và `acceptsTokenIssuedAt(iat)` vẫn ở `AccountView`: component `auth` và `JwtFilter` chỉ nhận bản chụp, không nạp entity.
- Không có `createAdmin`: admin chỉ đến từ seed (mục Đã chốt).
- Bỏ luật "`passwordChangedAt` không lùi": đồng hồ máy chủ có thể bị chỉnh lùi, entity không phân biệt được với lỗi thật.
- Không có cột `version` (db-identify.md không có): id do JPA sinh, nên Spring Data vẫn nhận biết dòng mới qua id còn `null`.
- Id giữ `String` trên cột `varchar` (KISS, 2026-10-29): thử atom `AccountId` trên cột `uuid` kéo theo adapter Hibernate, `Persistable` và kiểm định dạng id ở mọi service, nên đã bỏ.
- `NfcLockoutPolicy` sai cấu hình ném `IllegalStateException` (lỗi cấu hình, không phải dữ liệu người dùng).

## Nguyên tắc

### 1. Bất biến thuộc về entity

Mỗi entity có một **bảng bất biến** (mục dưới): luật cho từng field và luật giữa các field. Factory và mọi method ghi đều kiểm qua guard của chính entity trước khi gán. Không có thời điểm nào, kể cả ngay sau `new`, entity ở trạng thái sai.

Luật nào là của một field duy nhất và có nghĩa nghiệp vụ thì đóng vào value object (`Email`, `PhoneNumber`, `AddressDetails`). Entity giữ luật giữa các field và luật chuyển trạng thái.

### 2. Không có đường ghi công khai

| Cách | Áp dụng |
| --- | --- |
| Field `private`, truy cập kiểu field (`@Id` đặt trên field) | Hibernate đọc và ghi bằng reflection, không cần setter |
| Không `@Setter`, `@Builder`, `@AllArgsConstructor`, `@Data` | Mọi entity và `BaseEntity` |
| Constructor rỗng `protected` | Chỉ cho JPA |
| Tạo bằng factory `static` đặt tên theo nghiệp vụ | `Account.registerMember`, `Address.create`, `LegalProfile.fromVerifiedCard` |
| Method ghi **package-private** | Chỉ `*ServiceImpl` và đối tượng miền cùng component gọi được; entity vốn đã package-private, nên ngoài component không thấy entity |
| Field không đổi sau khi tạo có `@Column(updatable = false)` | `accountId`, `email`, `role`, `routingKey`, `payload`… Hibernate không bao giờ đưa field này vào `UPDATE` |
| Entity không đổi sau khi tạo có `@org.hibernate.annotations.Immutable` | `LegalProfile` |

### 3. Đọc không mở đường ghi

- Getter trả value object hoặc kiểu bất biến (`String`, `Instant`, enum, record). Mỗi field một getter, tên nói đúng kiểu trả về.
- `byte[]` được copy cả khi nhận vào lẫn khi trả ra.
- Không trả collection sửa được.
- Mapper chỉ đọc entity. Không có `Mapper.toEntity`: entity chỉ sinh ra từ factory.

### 4. Hỏi entity, không lấy dữ liệu ra để tự quyết

Luật dựa trên trạng thái của entity nằm trên entity:

- `account.ensureCanLogin()` ném `ACCOUNT_NOT_ACTIVATED`, thay cho `if (!account.verified())` trong `AuthServiceImpl`.
- Khóa NFC không còn trên tài khoản (db-identify.md): `NfcAttemptTracker.ensureNotLocked(accountId, now)` của kyc ném `NFC_LOCKED`.
- `account.acceptsTokenIssuedAt(iat)`.
- `legalProfile.matches(fingerprint)`.

`AccountView` vẫn là bản chụp đi qua biên component. Nó mang kết quả của các method này, không tự tính lại.

### 5. Ba lớp kiểm, một nguồn giới hạn

| Lớp | Vai trò | Khi sai |
| --- | --- | --- |
| DTO (Bean Validation) | Thông báo 400 thân thiện theo từng field, cho request HTTP | `{validation.*}` trong `messages.properties` |
| Entity, value object | **Lớp có thẩm quyền**: mọi đường ghi đều đi qua | `AppException` |
| Database (CHECK, unique, FK) | Lớp cuối: chặn SQL tay, seed, bug bỏ qua entity | `DataIntegrityViolationException` |

Cả ba lớp đọc chung một bộ hằng số: `AddressConstant`, `ProfileConstant`, `IdCardConstant`, `PhoneNumber.SUBSCRIBER_DIGITS`. Không lớp nào tự ghi lại con số.

### 6. Loại lỗi

- **Sai định dạng hoặc giới hạn** (lẽ ra DTO đã chặn): `AppException(ErrorCode.INVALID_INPUT, <tên field>)`. Một luồng mới quên DTO vẫn trả 400, không 500.
- **Chuyển trạng thái không được phép mà người dùng gây ra được**: `ErrorCode` riêng có sẵn (`ACCOUNT_NOT_ACTIVATED`, `NFC_LOCKED`, `NFC_ALREADY_VERIFIED`).
- **Lỗi lập trình** (gọi `markPublished` hai lần, `rekey` cùng version): `IllegalStateException`. Đây là bug, cần ra 500 và log.
- `PasswordHash` đổi sang `AppException(INVALID_INPUT)` cho đồng nhất với `Email`.

### 7. Helper chung

`common/DomainGuard` (final class, method static) để các entity không lặp code kiểm:

```java
static String requireText(String value, int maxLength, String field)          // trim, không rỗng, ≤ maxLength
static String optionalText(String value, int maxLength, String field)         // null hoặc chuỗi rỗng → null
static String requireMatches(String value, Pattern pattern, String field)
static <T> T requireNonNull(T value, String field)
static int requireAtLeast(int value, int min, String field)
```

Tên field là tham số của `ErrorCode`, nằm trong `messages.properties`, không có chuỗi thông báo trong code.

### 8. Luật trên nhiều dòng

- Bất biến chỉ dính một dòng: nằm trong entity.
- Bất biến trải trên nhiều dòng của cùng một chủ: nằm ở **đối tượng miền** của component. Hiện chỉ có một: tối đa một địa chỉ mặc định trên mỗi tài khoản → `AddressBook`. Không dùng quan hệ JPA `Account → List<Address>`, vì nó kéo `Address` sang component `account`.
- Database giữ lớp cuối (`ux_addresses_one_default_per_account`).

### 9. Thời gian vào bằng tham số

Bean `Clock` (`common/config/ClockConfig`, UTC). Service lấy `Instant.now(clock)` và truyền vào method của entity. Entity không gọi `Instant.now()`.

## Bảng bất biến

Cột **Ghi bởi** là method duy nhất được đổi field đó. "—" nghĩa là chỉ factory gán, sau đó không đổi.

### `Account` (`account`)

| Field | Bất biến | Kiểm ở | Ghi bởi |
| --- | --- | --- | --- |
| `id` | UUID dạng chuỗi do JPA sinh khi lưu, không đổi | `@GeneratedValue`; `updatable = false` | — |
| `email` | `Email` (trim, chữ thường, ≤ 255, đúng mẫu); bắt buộc; duy nhất | VO; DB unique + CHECK `email = lower(email)` | — (chưa có FR đổi email) |
| `phoneNumber` | `PhoneNumber` (9 chữ số thuê bao) hoặc null; duy nhất | VO; DB unique + CHECK | — |
| `passwordHash` | `PasswordHash` BCrypt; bắt buộc | VO | `changePassword(hash, now)` |
| `passwordChangedAt` | null, hoặc đặt cùng lúc với `passwordHash` (kiểm cả hai rồi mới gán) | entity | `changePassword(hash, now)` |
| `role` | bắt buộc; cố định sau khi tạo | entity; `updatable = false`; DB CHECK | — (`registerMember` → MEMBER; code không tạo ADMIN, admin chỉ có từ seed) |
| `accountVerified` | chỉ đi một chiều false → true | entity | `confirmEmail()` (idempotent) |
Hành vi đọc: `ensureCanLogin()` và `acceptsTokenIssuedAt(iat)` ở `AccountView` (mục Hiện trạng, lệch giai đoạn 2).

Bộ đếm NFC (`NfcLockout`: `failedAttempts ≥ 0`, đang khóa thì `failedAttempts = 0`) là giá trị trong bộ nhớ của kyc, không thuộc `Account`. Test: `NfcLockoutTest`, `NfcServiceImplTest`.

### `UserProfile` (`profile`)

| Field | Bất biến | Kiểm ở | Ghi bởi |
| --- | --- | --- | --- |
| `accountId` | bắt buộc, không đổi | entity; `updatable = false`; FK | — |
| `fullName` | trim, không rỗng, ≤ `ProfileConstant.MAX_FULL_NAME_LENGTH` | entity (`DomainGuard.requireText`) | `rename(fullName)` |
| `avatarKey` | null, hoặc khóa object MinIO không rỗng ≤ 255; không phải URL (L-12) | entity | `changeAvatar(key)`, `removeAvatar()` |

### `Address` (`address`)

| Field | Bất biến | Kiểm ở | Ghi bởi |
| --- | --- | --- | --- |
| `id` | UUID do factory cấp | entity | — |
| `accountId` | bắt buộc, không đổi | entity; `updatable = false`; FK | — |
| `details` (`AddressDetails`, embeddable) | xem bảng dưới | VO | `revise(details)` |
| `isDefault` | tối đa một `true` trên mỗi `accountId`; địa chỉ đầu tiên luôn là mặc định | `AddressBook`; DB unique index có điều kiện | `markDefault()`, `unmarkDefault()`, chỉ `AddressBook` gọi |

`AddressDetails`:

| Thành phần | Bất biến | Cột |
| --- | --- | --- |
| `recipientName` | trim, không rỗng, ≤ `MAX_RECIPIENT_NAME_LENGTH` | `recipient_name` |
| `recipientPhone` | `PhoneNumber` | `recipient_phone` |
| `province` | `Province` của `common-reference`; **tên luôn khớp mã** vì cả hai lấy từ enum | `province_code`, `province_name` |
| `wardName` | trim, không rỗng, ≤ `MAX_ADMINISTRATIVE_UNIT_NAME_LENGTH` | `ward_name` |
| `detail` | trim, không rỗng, ≤ `MAX_DETAIL_LENGTH` | `detail` |
| `label` | null, hoặc trim không rỗng ≤ `MAX_LABEL_LENGTH` | `label` |

### `LegalProfile` (`kyc`)

Tạo một lần khi NFC xác minh thành công; `@Immutable`.

| Field | Bất biến | Kiểm ở |
| --- | --- | --- |
| `accountId` | bắt buộc | entity; FK |
| `legalName` | khớp `IdCardConstant.LEGAL_NAME_PATTERN`, ≤ `MAX_LEGAL_NAME_LENGTH` | entity |
| `gender` | bắt buộc | entity; DB CHECK |
| `nationality` | trim, không rỗng, ≤ `MAX_NATIONALITY_LENGTH` | entity |
| `fingerprint` (`IdNumberFingerprint`: `hash`, `keyVersion`) | `hash` là 64 ký tự hex; `keyVersion ≥ 1`; duy nhất | VO; DB unique |
| `idNumberMasked` | `MASK_CHAR` lặp `ID_NUMBER_DIGITS − MASK_VISIBLE_DIGITS` lần rồi tới `MASK_VISIBLE_DIGITS` chữ số | entity |
| `idNumberEnc`, `dateOfBirthEnc` (`EncryptedPii`) | không rỗng; copy khi vào và ra | VO |
| `piiKeyVer` | `≥ 1` | entity |
| `nfcVerifiedAt` | bắt buộc | entity |

Ngoại lệ duy nhất cho `@Immutable`: tác vụ đổi khóa (giai đoạn 5) không sửa dòng mà ghi lại bằng truy vấn `UPDATE` riêng trong repository, có test. Nhờ đó entity vẫn không có method ghi.

### `OutboxEvent` (`outbox`)

| Field | Bất biến | Ghi bởi |
| --- | --- | --- |
| `id`, `routingKey`, `payload` | không rỗng; `routingKey` ≤ 100; `updatable = false` | — (`OutboxEvent.enqueue`) |
| `publishedAt` | đặt một lần; không đặt được khi đã park | `markPublished(now)` |
| `attempts` | `≥ 0`, chỉ tăng | `recordFailedAttempt(maxAttempts, now)` |
| `parkedAt` (mới) | đặt khi `attempts` chạm `maxAttempts`; đã park thì relay bỏ qua | `recordFailedAttempt` |

### `BaseEntity` (`common`)

- `createdAt`, `updatedAt`: chỉ Hibernate ghi (`@CreationTimestamp`, `@UpdateTimestamp`). Không setter, chỉ getter.
- `@Version long version` cho `accounts`, `addresses`, `user_profiles`: hai request sửa cùng lúc mà không lấy khóa dòng sẽ không ghi đè nhau. `legal_profiles` bất biến; `outbox_events` chỉ relay sửa.
- id do factory cấp, nên `save` nhận biết dòng mới qua `version` null (kiểu `Long`, không phải `long`). Spring Data dùng `version` để chọn `persist` thay vì `merge`.

## Mẫu đầy đủ: `Address` và `AddressBook`

Các entity khác làm theo cùng khuôn: factory → guard → method ghi package-private → getter trả kiểu bất biến.

```java
@Entity
@Table(name = "addresses")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class Address extends BaseEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "account_id", nullable = false, updatable = false)
    private String accountId;

    @Embedded
    private AddressDetails details;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    private Address(String accountId, AddressDetails details) {
        this.id = UUID.randomUUID().toString();
        this.accountId = DomainGuard.requireText(accountId, ACCOUNT_ID_MAX_LENGTH, "accountId");
        this.details = DomainGuard.requireNonNull(details, "details");
    }

    /** Not default yet: only AddressBook decides which address is the default (AC-03.1). */
    static Address create(String accountId, AddressDetails details) {
        return new Address(accountId, details);
    }

    void revise(AddressDetails details) {
        this.details = DomainGuard.requireNonNull(details, "details");
    }

    void markDefault() {
        this.isDefault = true;
    }

    void unmarkDefault() {
        this.isDefault = false;
    }

    String getId() { … }
    String getAccountId() { … }
    AddressDetails getDetails() { … }   // record bất biến
    boolean isDefault() { … }
}
```

```java
@Embeddable
record AddressDetails(
        @Column(name = "recipient_name") String recipientName,
        @Column(name = "recipient_phone") PhoneNumber recipientPhone,
        @Convert(converter = ProvinceConverter.class) Province province,   // ghi province_code; province_name xem dưới
        @Column(name = "ward_name") String wardName,
        @Column(name = "detail") String detail,
        @Column(name = "label") String label) {

    AddressDetails {
        recipientName = DomainGuard.requireText(recipientName, MAX_RECIPIENT_NAME_LENGTH, "recipientName");
        DomainGuard.requireNonNull(recipientPhone, "recipientPhone");
        DomainGuard.requireNonNull(province, "province");
        wardName = DomainGuard.requireText(wardName, MAX_ADMINISTRATIVE_UNIT_NAME_LENGTH, "wardName");
        detail = DomainGuard.requireText(detail, MAX_DETAIL_LENGTH, "detail");
        label = DomainGuard.optionalText(label, MAX_LABEL_LENGTH, "label");
    }
}
```

`province_name` vẫn là cột riêng (giữ tên lúc lưu nếu sau này tỉnh đổi tên, theo `AddressConstant`). Entity ghi nó từ `province.getOfficialName()` trong `@PrePersist`/`@PreUpdate`, không nhận từ client. Cách ánh xạ cụ thể (embeddable record cần Hibernate 6.2+) chốt khi làm giai đoạn 3.

```java
/** Every address of one account, loaded under the account row lock. Owns AC-03.1: at most one default. */
final class AddressBook {

    private final String accountId;
    private final List<Address> addresses;

    static AddressBook of(String accountId, List<Address> addresses) { … }

    /** The first address is always the default; otherwise only when asked. */
    Address add(AddressDetails details, boolean requestedDefault) {
        Address address = Address.create(accountId, details);
        if (addresses.isEmpty() || requestedDefault) {
            makeDefault(address);
        }
        addresses.add(address);
        return address;
    }

    /** null = leave the default flag as it is. */
    Address revise(String addressId, AddressDetails details, Boolean defaultChoice) { … }

    /** Deleting the default leaves none (FR-03). */
    Address remove(String addressId) { … }

    private void makeDefault(Address chosen) {
        addresses.forEach(Address::unmarkDefault);
        chosen.markDefault();
    }
}
```

`AddressServiceImpl` chỉ còn điều phối: `accountService.lockForUpdate` → `AddressBook.of(accountId, repository.findByAccountId…)` → gọi method → `saveAll`, hoặc `delete` với `remove`.

## Database đi kèm

Mỗi CHECK lặp lại một bất biến của entity ở lớp cuối. Mỗi giai đoạn mang migration của nó, đặt tên `V<yyyy_MM_dd_HHmm>__<việc>.sql` ([database.md](../../guides/database.md)), không sửa file đã merge.

| Giai đoạn | Thay đổi | Lặp lại bất biến |
| --- | --- | --- |
| 2 (xong) | `accounts`: bỏ `nfc_failed_attempts`, `nfc_locked_until`; CHECK `phone_number ~ '^[35789][0-9]{8}$'`; CHECK `email = lower(email)`; `phone_number varchar(9)`; `role varchar(10)`; đổi tên FK sinh tự động thành `fk_<bảng>_account` | `PhoneNumber`, `Email` |
| 3 | `addresses`: CHECK `recipient_phone` như trên; CHECK `province_code ~ '^[0-9]{2}$'`; `recipient_phone` về `varchar(9)`; `version`; index `ix_addresses_account (account_id, created_at DESC)` | `AddressDetails` |
| 4 | `user_profiles`: `version`; CHECK `length(trim(full_name)) > 0` | `UserProfile.fullName` |
| 5 | `legal_profiles`: CHECK `id_number_hash ~ '^[0-9a-f]{64}$'`, `id_hash_key_ver >= 1`, `pii_key_ver >= 1` | `IdNumberFingerprint`, `piiKeyVer` |
| 6 | `outbox_events`: `parked_at timestamptz`; CHECK `attempts >= 0`; partial index đổi điều kiện thành `published_at IS NULL AND parked_at IS NULL` | `OutboxEvent` |

Trước CHECK ở giai đoạn 2 và 3, truy vấn các dòng còn dạng `0…`: migration ngày 26/10 bỏ qua các dòng bị trùng. Entity sửa cùng PR: bỏ `@Index` cũ trên `OutboxEvent` (index thật là partial trên `created_at`); `length` lấy từ `PhoneNumber.SUBSCRIBER_DIGITS`. `R__seed.sql` thêm cột nếu bắt buộc.

## Luật máy kiểm

`DomainModelArchitectureTest` (identity-service, giai đoạn 1). Luật mà code cũ còn vi phạm được bọc trong `FreezingArchRule`: vi phạm cũ ghi ở `src/test/resources/archunit_store` và được bỏ qua, vi phạm mới làm đỏ build. Mỗi giai đoạn sau sửa code thì store tự bớt dòng; commit thay đổi của store cùng PR. `archunit.properties` để `allowStoreCreation=false`, nên lỡ xóa store thì build đỏ chứ không âm thầm chấp nhận mọi vi phạm.

| Luật | Giữ nguyên tắc | Vi phạm cũ lúc bật (2026-10-29) |
| --- | --- | --- |
| Method `public` của `@Entity`, `@MappedSuperclass` chỉ là getter (`get*`, `is*`) hoặc method đọc `ensure*`, `accepts*`, `matches*` | 2 | 46, đóng băng |
| `@Entity` không có constructor `public` | 2 | 7, đóng băng |
| Constructor không tham số của `@Entity` là `protected` | 2 | 4, đóng băng |
| `@Entity` không phụ thuộc class `*Builder` (bắt cả builder của Lombok); `@Setter` của Lombok không còn trong bytecode nên luật method `public` ở trên bắt thay | 2 | 8, đóng băng |
| Class `*Mapper` không gọi method nào của `@Entity` trả `void` | 3 | 0, luật thường |
| `@Entity`, `@Embeddable`, `@MappedSuperclass` chỉ phụ thuộc `java..`, `jakarta.persistence..`, `org.hibernate.annotations..`, `lombok..`, `com.moonkage.identity.common..`, `com.moonkage.identity.account.atom..` (atom của component nằm dưới cùng), `com.moonkage.reference..` và chính component của nó | giới hạn của [coding-rules.md](../../conventions/coding-rules.md) | 0, luật thường |
| `*ServiceImpl` không gọi `trim`, `strip`, `toLowerCase`, `toUpperCase`, `replace*` của `String`, không dùng `java.text.Normalizer` | request và atom tự chuẩn hóa (coding-rules.md 1.5) | 0, luật thường |
| Không class nào, trừ `ClockConfig`, gọi `now()` của `java.time` mà không truyền `Clock` (gồm cả `LocalDate.now(zone)`) | 9 | 19, đóng băng |

Test bất biến: mỗi entity có `<Entity>Test` (unit, không Spring). Mỗi dòng của bảng bất biến có ít nhất:

- một test "không dựng được entity sai" (factory ném lỗi);
- một test "method ghi giữ đúng bất biến", hoặc "không có method ghi" với field cố định.

`RepositoryIntegrationTest` thêm test cho từng CHECK mới (ghi SQL thẳng thì bị chặn).

## Giai đoạn

Mỗi giai đoạn là một PR vào `develop`, chạy `./mvnw clean verify` như CI (không `-Dcheckstyle.skip`), và sửa `classes/*.md` của class bị đổi trong cùng PR ([docs/README.md](../../README.md)).

| # | Việc | Phụ thuộc | Xong khi |
| --- | --- | --- | --- |
| 0 | Sửa lỗi biên dịch của thay đổi dở trong `Account.java`: chỗ gọi truyền value object; test chuẩn hóa chuyển sang `EmailTest`, `PhoneNumberTest` | — | `verify` xanh |
| 1 | **Nền:** `DomainGuard`; `ClockConfig`; `BaseEntity` bỏ setter; `PasswordHash` ném `AppException`; luật ArchUnit ở trên (đóng băng); thêm vai trò "đối tượng miền" (`AddressBook`) và nguyên tắc 1–9 vào [coding-rules.md](../../conventions/coding-rules.md) | 0 | Luật chạy, vi phạm cũ nằm trong store đóng băng |
| 2 ✓ | **`Account`** theo db-identify.md: factory, bộ đếm NFC sang kyc (bộ nhớ); migration giai đoạn 2 | 1 | Xong 2026-10-29 (mục Hiện trạng) |
| 3 | **`Address`** + `AddressDetails` + `AddressBook`; bỏ `provinceName` khỏi `AddAddressRequest`, tên lấy từ `Province` (mục Đã chốt); migration giai đoạn 3 | 1 | `AddressBookTest` phủ AC-03.1; `AddressServiceImpl` chỉ điều phối |
| 4 | **`UserProfile`**: `create`, `rename`, `changeAvatar`, `removeAvatar`; migration giai đoạn 4 | 1 | Bảng bất biến có test |
| 5 | **`LegalProfile`**: `@Immutable`, `IdNumberFingerprint`, `EncryptedPii`, `fromVerifiedCard`, `matches`; kiểm BR-23 trên **mọi** version pepper còn hiệu lực (`IdNumberHasher.fingerprints(idNumber)` → `existsByFingerprintIn`); quy trình đổi khóa ghi vào `classes/NfcServiceImpl.md`; migration giai đoạn 5 | 2 | Test: cùng CCCD băm bằng v1 và v2 vẫn bị chặn |
| 6 | **`OutboxEvent`**: `enqueue`, `recordFailedAttempt`, `parked_at`; job xóa dòng đã phát cũ hơn `outbox.retention` (`application.yml`); đề xuất P-10 vào [db-review-proposals.md](../../architecture/api-db/db-review-proposals.md) cho 5 service còn lại | 1 | Test tích hợp: event vượt ngưỡng bị park, dòng cũ bị xóa |
| 7 | Bỏ đóng băng: store rỗng thì đổi `FreezingArchRule` thành `ArchRule` thường | 2–6 | Không còn vi phạm |

Sau giai đoạn 1, các giai đoạn 2, 3, 4, 6 độc lập nhau; giai đoạn 5 cần 2.

## Câu hỏi mở

1. **Bảng `refresh_tokens`.** `passwordChangedAt` đã thu hồi được token khi đổi mật khẩu. Chỉ làm khi có yêu cầu đăng xuất từng thiết bị.
2. **Xóa tài khoản.** Chưa có FR; khi có thì quyết `ON DELETE` và việc xóa `legal_profiles` (PII).

## Đã chốt

- **Schema đích là [db-identify.md](db-identify.md)** (2026-10-29): `id` giữ `String`/`varchar` do JPA sinh, không cột `version`, bộ đếm NFC không lưu bền.
- **Atom nằm trong component sở hữu entity** (2026-10-29), không ở `common`: `Email`, `PhoneNumber`, `PasswordHash` ở `account/atom`; `profile`, `address`, `kyc` dùng lại vì chúng nằm trên `account`.

- **`provinceName` bỏ khỏi `AddAddressRequest`** (2026-10-29). Server lấy tên từ `Province.getOfficialName()`, client chỉ gửi `provinceCode`. Web phải bỏ trường này cùng đợt với giai đoạn 3; `docs/api` (Postman) và Swagger cập nhật trong cùng PR.
- **Admin chỉ đến từ seed** (2026-10-29). `admin@mk.com`, id `00000000-0000-4000-8000-000100000000`, mật khẩu `SEED_PASSWORD` như mọi persona. Không môi trường nào tự tạo admin lúc khởi động nữa; môi trường không chạy `db/seed` cần quy trình tạo admin riêng khi có nhu cầu.

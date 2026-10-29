# Plan v2: tái thiết kế identity-service

> Dành cho Claude Code. Đọc hết file trước khi làm bất cứ việc gì.
> Repo: `platform/`. Service: `api/identity-service/`. Package gốc: `com.moonkage.identity`.
> Plan này **không** dựa vào cấu trúc code hiện tại. Thứ duy nhất được giữ là **hợp đồng với bên ngoài** (mục 2).
> Mọi thứ bên trong được thiết kế lại theo mục 3 đến mục 8.

---

## 0. Cách đọc plan này

| Mục | Nội dung |
|---|---|
| 1 | Nguyên tắc: lý do đằng sau mọi quyết định |
| 2 | Hợp đồng bất biến: thứ duy nhất không được đổi |
| 3 | Kiến trúc đích: module, sở hữu dữ liệu, phụ thuộc, bố cục, quy ước |
| 4 | Mô hình domain từng module |
| 5 | Value object, mô hình thất bại, Id |
| 6 | Platform |
| 7 | API nội bộ (`identity-client`) |
| 8 | Chiến lược test |
| 9 | Các phase thực hiện |
| 10 | Điểm dừng và quyết định cần người dùng |
| 11 | Thư viện |

Khi một chi tiết không có trong plan: suy ra từ mục 1. Khi plan mâu thuẫn với `docs/conventions/coding-rules.md`, `docs/services/identity/domain-model-plan.md` hoặc `docs/services/identity/db-identify.md`: **dừng và hỏi**, ghi rõ hai bên nói gì.

---

## 1. Nguyên tắc

**Nguyên tắc gốc: sắp xếp hệ thống theo tốc độ và lý do thay đổi.**

1. **Những gì đổi cùng nhau thì ở cùng nhau.** Module chia theo lý do thay đổi của nghiệp vụ, không theo tầng kỹ thuật, không theo bảng DB.
2. **Phụ thuộc chảy từ thứ đổi nhanh về thứ đổi chậm.** Hạ tầng phụ thuộc vào nghiệp vụ, không có chiều ngược lại. Module phụ thuộc vào hợp đồng của module khác, không phụ thuộc vào ruột của nó.
3. **Giữ phần đổi chậm càng nhỏ càng tốt.** `shared` và hợp đồng công khai của mỗi module chỉ chứa những gì thật sự cần chia sẻ.

Hệ quả cụ thể, dùng để tự quyết khi plan không nói:

- **Khái niệm thật phải có chỗ đứng trong code.** Nếu một quy tắc phải viết trong service vì "không có đối tượng nào giữ nó", thì đang thiếu một khái niệm (ví dụ: sổ địa chỉ, nguồn gốc của dữ liệu).
- **Trạng thái sai không biểu diễn được.** Ưu tiên kiểu dữ liệu chặt hơn kiểm tra lúc chạy.
- **Parse một lần ở biên, tin cậy ở bên trong.**
- **Mỗi thất bại có một chủ:** client, quy tắc nghiệp vụ, hoặc lập trình viên. Mỗi loại một kiểu exception (mục 5.4).
- **Máy ép quy tắc, không phải kỷ luật.** Quy tắc nào quan trọng thì có test kiến trúc.
- **Tối ưu cho người đọc.** Tên theo ngôn ngữ nghiệp vụ, một use case một class, không trừu tượng hóa trước khi thấy biến đổi thật.

---

## 2. Hợp đồng bất biến

Đây là **trung tâm ổn định** của dự án. Bộ test đặc tả (Phase 1) khóa chặt toàn bộ danh sách này, nhờ vậy bên trong được viết lại tự do.

| Hợp đồng | Phạm vi |
|---|---|
| HTTP công khai | Mọi đường dẫn `/api/**`, method, status code, hình dạng JSON (gồm `ApiResponse`, `errors[]`), header liên quan token |
| HTTP nội bộ | `/internal/**`: đường dẫn, JSON (thành công thì **không bọc** `ApiResponse`) |
| Mã lỗi | Mọi mã (`AUTH_00x`, `USER_00x`, `ADDRESS_00x`, `NFC_00x`, `COMMON_xxx`) và message key trong `messages*.properties` |
| Sự kiện | Exchange `moonkage.events`, routing key, payload JSON gửi cho orchestrator |
| Schema DB | Theo `db-identify.md` (sẽ áp dụng ở Phase 6). Tên bảng, tên cột, ràng buộc |
| Hành vi bảo mật | Không lộ email có tồn tại hay không; "chưa kích hoạt" chỉ báo sau khi mật khẩu khớp; token phát trước lần đổi mật khẩu bị từ chối (Q-04); OTP chỉ dùng đúng mục đích (Q-05) |
| Cấu hình | Tên biến môi trường và property đang dùng trong `application*.yml` |

Ngoại lệ: chỉ được đổi một hợp đồng khi có **ĐIỂM DỪNG** tương ứng ở mục 10 và người dùng đã duyệt.

---

## 3. Kiến trúc đích

### 3.1. Kiểu kiến trúc

**Modular monolith.** Mỗi module là một package con trực tiếp của `com.moonkage.identity`. Bên trong mỗi module dùng ports and adapters.

Lý do chọn so với các phương án khác:

| Phương án | Vì sao không chọn |
|---|---|
| Module phẳng, mọi thứ package-private | Compiler ép được ranh giới, nhưng không ép được tầng, và module lớn (`kyc`) sẽ thành một thư mục 30 file |
| Mỗi module một Maven/Gradle module | Compiler ép mọi thứ, nhưng quá nặng cho khoảng 5.000 dòng code |
| **Package con + Spring Modulith + ArchUnit** | **Chọn.** Ranh giới và tầng đều được ép bằng test chạy trong CI. Chuẩn phổ biến của Spring |

### 3.2. Module và sở hữu dữ liệu

| Module | Lý do thay đổi | Bảng | Trạng thái trong bộ nhớ |
|---|---|---|---|
| `account` | Cách một người vào hệ thống: định danh đăng nhập, mật khẩu, xác nhận email, vai | `accounts` | — |
| `profile` | Người đó là ai: tên tự xưng, danh tính pháp lý đã KYC | `profiles` | — |
| `address` | Sổ địa chỉ giao hàng | `addresses` | — |
| `otp` | Mã một lần: phát, giới hạn tần suất, xác nhận | — | mã, bộ đếm |
| `kyc` | Quy trình xác minh danh tính (phương thức hôm nay: NFC) | — | phiên NFC, bộ đếm và khóa thử |
| `auth` | Phiên đăng nhập: đăng ký, xác nhận, đăng nhập, làm mới, đặt lại mật khẩu | — | — |
| `shared` | Ngôn ngữ chung (đổi chậm nhất) | — | — |
| `platform` | Kỹ thuật dùng chung, không có nghiệp vụ | `outbox_events` | — |

Module không bằng bảng: `kyc` không có bảng nhưng vẫn là module, vì quy trình xác minh đổi theo lý do riêng. Kết quả của quy trình (danh tính pháp lý) thuộc `profile`.

### 3.3. Đồ thị phụ thuộc

```
auth ────► account, profile, otp
kyc ─────► profile
profile ─► account            (chỉ để ghép GET /api/accounts/me)
address ─► —
account ─► —
otp ─────► —

mọi module ─► shared, platform
platform ───► shared
auth implement SPI của platform.security
```

Quy tắc:
- Module A chỉ dùng **class ở gốc package** của module B (hợp đồng công khai).
- Không có vòng phụ thuộc.
- `platform` và `shared` không bao giờ phụ thuộc module nghiệp vụ.
- `address` và `otp` không phụ thuộc module nghiệp vụ nào. Đây là bằng chứng ranh giới đúng: hai module này tách thành service riêng được mà không phải sửa ai.

### 3.4. Bố cục một module

```
<module>/
├── <Module>Api.java          interface công khai cho module khác (chỉ khi có module khác cần)
├── *View, *Event, value object công khai, <Module>Error
├── domain/                   aggregate, entity, value object nội bộ, quy tắc
├── application/              use case (mỗi class một use case), truy vấn
│   └── port/                 interface cho thứ bên ngoài, viết bằng ngôn ngữ nghiệp vụ
└── infrastructure/
    ├── web/                  controller, request/response DTO
    ├── persistence/          Spring Data repository, adapter implement port, converter
    └── <công nghệ>/          memory/, crypto/, messaging/, token/, scheduling/...
```

Tầng nào rỗng thì bỏ. Không tạo thư mục rỗng.

| Tầng | Được phụ thuộc | Không được |
|---|---|---|
| gốc module | `shared` | mọi package con của chính nó, Spring |
| `domain` | gốc module, `shared`, `jakarta.persistence` (mapping, xem ADR-1) | Spring, `application`, `infrastructure` |
| `application` | `domain`, gốc module, `port`, gốc module khác, `@Service`, `@Transactional` | `infrastructure`, package con của module khác |
| `infrastructure` | mọi tầng trong module, `platform`, `shared` | package con của module khác |

**ADR-1 (ghi vào docs ở Phase 9):** entity domain mang annotation JPA, không tách model persistence riêng. Lý do: schema ổn định và gần với mô hình domain, nên mapping hai lớp chỉ thêm code mà không bảo vệ được gì. Đánh đổi: domain phụ thuộc `jakarta.persistence` (chỉ annotation). Xem lại nếu schema bắt đầu lệch xa mô hình domain.

### 3.5. Quy ước đặt tên và code

| Thứ | Quy ước | Ví dụ |
|---|---|---|
| Use case | Động từ nghiệp vụ, một class, phương thức `handle` | `RegisterMember`, `SubmitNfcCard` |
| Truy vấn | `<Thứ>Queries`, có thể nhiều phương thức đọc | `AccountQueries` |
| Port | Danh từ nghiệp vụ | `OtpStore`, `PasswordHasher`, `KycEvents` |
| Adapter | Tiền tố công nghệ + tên port | `JpaAccountRepository`, `InMemoryOtpStore`, `BCryptPasswordHasher` |
| Controller | `<Thứ>Controller` trong `infrastructure/web` | `AddressController` |
| DTO web | `<Hành động>Request`, `<Thứ>Response`, record, có `static from(...)` | `AddressResponse.from(entry)` |
| Lỗi | `<Module>Error implements ErrorCode` ở gốc module | `KycError` |
| Id | Value object có kiểu | `AccountId`, `AddressId`, `NfcSessionId` |

Cấm:
- `*Impl`, cặp `XxxService` + `XxxServiceImpl`.
- `*Constant` cho quy tắc nhập (quy tắc thuộc về value object).
- `*Mapper` dạng lớp tiện ích tĩnh (mapping nằm trong `from(...)` của DTO hoặc trong `Queries`).
- Package `util`, `common`, `helper`.
- `@Setter` trên entity domain.
- Đọc đồng hồ hệ thống ngoài `platform/config/ClockConfig` (quy tắc TS-01).
- Log giá trị PII đầy đủ (email, số điện thoại, số định danh).

---

## 4. Mô hình domain từng module

### 4.1. `shared`

```
shared/
├── AccountId.java              (record bọc UUID; dùng xuyên module: mục 5.5)
├── id/
│   └── IdGenerator.java        (port sinh id thực thể: mục 5.5)
├── Email.java                  (value object từ dữ liệu vào)
├── PhoneNumber.java            (value object từ dữ liệu vào; giá trị = 9 chữ số thuê bao)
├── Role.java
├── value/
│   ├── ValueRejected.java      (dữ liệu vào bị từ chối: mục 5.4)
│   └── Text.java               (hàm tĩnh: required, bounded, optional: dùng trong parse)
└── error/
    ├── ErrorCode.java          (interface: code, httpStatus, messageKey)
    ├── AppException.java       (vi phạm quy tắc nghiệp vụ)
    └── CommonError.java        (COMMON_xxx)
```

### 4.2. `account`

**Gốc (hợp đồng):** `AccountApi`, `AccountView`, `CredentialCheck`, `LoginIdentifier`, `RawPassword`, `AccountError`.

```java
public interface AccountApi {
    Optional<AccountView> find(AccountId id);
    Optional<AccountView> findByEmail(Email email);
    AccountView registerMember(Email email, PhoneNumber phoneOrNull, RawPassword password);  // ném EMAIL/PHONE_ALREADY_EXISTS
    AccountView confirmEmail(AccountId id);
    void changePassword(AccountId id, RawPassword newPassword);
    CredentialCheck verifyCredentials(LoginIdentifier identifier, RawPassword password);
}

public sealed interface CredentialCheck {
    record Accepted(AccountView account) implements CredentialCheck {}
    record NotActivated() implements CredentialCheck {}     // chỉ khi mật khẩu ĐÃ khớp
    record Rejected() implements CredentialCheck {}         // sai mật khẩu hoặc không có tài khoản
}
```

- **Mật khẩu không rời module.** API nhận `RawPassword`, tự băm, tự so khớp. Không module nào thấy `PasswordHash`.
- `LoginIdentifier.parse(raw)`: email nếu có `@`, ngược lại là số điện thoại; sai cả hai thì `ValueRejected`.
- `RawPassword` có hai cửa parse: `parse(raw)` áp đủ chính sách (độ dài tối thiểu, giới hạn trên theo ĐIỂM DỪNG C4) cho **đăng ký và đặt lại mật khẩu**; `forLogin(raw)` chỉ đòi không rỗng, để mật khẩu cũ đặt trước khi siết quy tắc vẫn đăng nhập được.
- `verifyCredentials`: khi không có tài khoản vẫn so khớp với một hash giả cố định để thời gian phản hồi tương đương.
- `AccountView` mang `AccountId`, `Email`, `PhoneNumber`, `Role`, `verified`, `passwordChangedAt`, và phương thức `acceptsTokenIssuedAt(Instant)`.

**Domain:** `Account` (aggregate: `registerMember`, `confirmEmail`, `changePassword(PasswordHash, Instant)`), `PasswordHash` (do hệ thống tạo, không biết thuật toán).

**Port:** `AccountRepository` (`add(Account)`, `find(AccountId)`, `findByEmail`, `findByPhoneNumber`), `PasswordHasher` (`hash(RawPassword)`, `matches(RawPassword, PasswordHash)`, `dummyMatch(RawPassword)`).

`RegisterMember` xin id từ `IdGenerator` rồi truyền vào `Account.registerMember(AccountId, ...)` (mục 5.5).

**Infrastructure:** `JpaAccountRepository` (`add` dùng `EntityManager.persist` + `flush`; dịch vi phạm `uk_accounts_email`, `uk_accounts_phone_number` thành `AccountError`), `BCryptPasswordHasher`.

### 4.3. `profile`

**Gốc:** `ProfileApi`, `ProfileView`, `KycRecord`, `LegalIdentity`, `LegalName`, `IdNumberHash`, `MaskedIdNumber`, `FullName`, `ProfileError`.

```java
public interface ProfileApi {
    void create(AccountId id, FullName fullName);
    Optional<FullName> findFullName(AccountId id);
    Optional<KycRecord> findKyc(AccountId id);                 // empty = chưa KYC
    void completeKyc(AccountId id, LegalIdentity identity);    // ném KYC_ALREADY_COMPLETED, ID_NUMBER_ALREADY_USED
}
```

`LegalIdentity` và các value object của nó nằm ở gốc module vì `kyc` phải tạo ra chúng: đây là ngôn ngữ mà `profile` công bố.

**Domain:**

```java
@Entity @Table(name = "profiles")
public class Profile extends BaseEntity {
    @Id @Column(name = "account_id") private AccountId accountId;
    @Column(name = "full_name", nullable = false) private FullName fullName;
    @Column(name = "kyc_verified", nullable = false) private boolean kycVerified;
    @Embedded private LegalIdentity legalIdentity;            // null ⇔ chưa KYC (khớp ck_profiles_kyc_complete)

    public static Profile create(AccountId id, FullName name) { ... }
    public void completeKyc(LegalIdentity identity) { ... }   // từ chối nếu đã KYC
}

@Embeddable
public record LegalIdentity(LegalName legalName, IdNumberHash idNumberHash,
                            int hashKeyVersion, MaskedIdNumber idNumberMasked) {}
```

**Application:** `CreateProfile`, `CompleteKyc`, `ProfileQueries` (implement `ProfileApi`), `GetMyAccount` (ghép `AccountApi` + profile cho `/api/accounts/me`).

**Infrastructure:** `MeController`, `JpaProfileRepository` (dịch vi phạm unique `id_number_hash`).

### 4.4. `address`

**Khái niệm** (lý do: mục "bản chất address" của phân tích trước):

| Khái niệm | Loại | Nghĩa |
|---|---|---|
| `AddressBook` | aggregate (không có bảng riêng) | Sổ địa chỉ của **một** tài khoản. Giữ mọi quy tắc về "mặc định" |
| `AddressEntry` | entity (bảng `addresses`) | Một mục trong sổ: id, nhãn, cờ mặc định, nội dung |
| `DeliveryContact` | value (embeddable) | Người nhận + vị trí. **Thứ đơn hàng sao chép** |
| `Recipient` | value | `RecipientName` + `PhoneNumber` |
| `DeliveryLocation` | value | `Province` + `WardName` + `StreetDetail`; `area()`, `oneLine()` |
| `Province` | value | Mã + tên **chụp từ danh mục chính thức** (`com.moonkage.reference.Province`), không lấy tên từ client |
| `DeliveryArea` | value | Khu vực lọc sản phẩm (AC-03.2). Hôm nay = tỉnh (Q-12) |
| `AddressLabel` | value | Nhãn tùy chọn ("Nhà riêng") |

**Quy tắc của `AddressBook`** (giữ đúng hành vi hiện tại):
- Tối đa một mục mặc định: `makeDefault(target)` đặt cờ cho đúng một mục, tắt mọi mục khác.
- Mục đầu tiên tự thành mặc định.
- `edit` với `isDefault = null` giữ nguyên cờ; `true` thì đặt mặc định; `false` thì bỏ cờ.
- Xóa mục mặc định thì sổ không còn mặc định (xem ĐIỂM DỪNG D).
- Mục của tài khoản khác được trả lời như không tồn tại (`ADDRESS_NOT_FOUND`).

**Port:** `AddressBookRepository` (`load(AccountId)`, `save(AddressBook)`).

**Đồng thời:** adapter `JpaAddressBookRepository.load` lấy `pg_advisory_xact_lock` theo `account_id` trong transaction, để hai request cùng tài khoản xếp hàng. Partial unique index `ux_addresses_one_default_per_account` là lưới an toàn cuối. Domain không biết cả hai cơ chế này. Không mượn khóa bảng `accounts`.

**Application:** `AddAddress`, `EditAddress`, `RemoveAddress`, `AddressQueries`.

**Web:** request nhận `provinceCode`; `provinceName` vẫn được chấp nhận nhưng bị bỏ qua (xem ĐIỂM DỪNG C). Response giữ đủ các trường hiện có, gồm `provinceName`, `fullAddress`, `areaCode`.

### 4.5. `otp`

**Gốc:** `OtpApi`, `OtpPurpose`, `OtpCode`, `OtpError`.

```java
public interface OtpApi {
    OtpCode issue(OtpPurpose purpose, Email email);      // ném OTP_TOO_FREQUENT, OTP_SEND_LIMIT_EXCEEDED
    void throttle(OtpPurpose purpose, Email email);      // tính một lần gửi mà không phát mã (chống dò email)
    void verify(OtpPurpose purpose, Email email, OtpCode code);   // ném OTP_INVALID_OR_EXPIRED, OTP_MAX_ATTEMPTS_EXCEEDED
    void discard(OtpPurpose purpose, Email email);
}
```

**Domain:** `OtpEntry` (mã, hạn, số lần thử, số lần gửi, mốc giới hạn), `OtpRules`.

**Port:** `OtpStore` với thao tác **nguyên tử theo nghĩa nghiệp vụ** (`update(key, UnaryOperator<OtpEntry>, ttl)`), không phải `get` rồi `save`.

**Infrastructure:** `InMemoryOtpStore` dùng `platform/memory/ExpiringMap`.

### 4.6. `kyc`

**Gốc:** `KycVerificationEvent` (payload giữ đúng hợp đồng sự kiện hiện tại), `KycError` (giữ mã `NFC_00x`).

**Domain:**

```
kyc/domain/
├── CitizenId.java              (số định danh thô: dữ liệu vào, chỉ sống trong request, không lưu, không log)
├── IdCardRules.java            (định dạng thẻ, hạn thẻ theo giờ Việt Nam)
├── KycLockout.java, KycLockoutPolicy.java
├── KycReasonCode.java, KycResult.java    (giữ giá trị enum xuất hiện trong JSON)
└── nfc/
    ├── NfcSession.java, NfcSessionId.java, NfcSessionStatus.java
    ├── NfcCard.java            (dữ liệu thẻ đã giải mã: dùng để kiểm rồi bỏ)
    └── NfcCardRules.java
```

**Application:** `CreateNfcSession`, `GetNfcSession`, `SubmitNfcCard`, `ExpireNfcSessions`, `GetKycStatus`, `CheckIdNumber`.

Luồng `SubmitNfcCard`:

```
kiểm khóa (KycAttemptStore)
→ giải mã JWE (CardPayloadDecryptor)
→ NfcCardRules
→ băm CitizenId (IdNumberHasher) → LegalIdentity
→ ProfileApi.completeKyc                          ┐ cùng transaction
→ KycEvents (outbox): verified / failed / locked   ┘
```

**Port:** `NfcSessionStore`, `KycAttemptStore` (`recordFailure(...)` trả trạng thái mới, nguyên tử), `IdNumberHasher`, `CardPayloadDecryptor`, `KycEvents`.

**Infrastructure:** `NfcController` (`/api/nfc/**`), `web/internal/InternalKycController` (implement `KycInternalApi`, mục 7), `InMemoryNfcSessionStore`, `InMemoryKycAttemptStore`, `HmacIdNumberHasher`, `JweCardPayloadDecryptor`, `OutboxKycEvents`, `KycRoutingKeys`, `NfcSessionCleanupJob`, `KycProfileSeeder`.

Không còn: lưu PII mã hóa, `PiiCipher`, bảng `legal_profiles`, cột NFC trên `accounts`.

### 4.7. `auth`

Không có API cho module khác.

**Application:** `RegisterAccount` (account + profile + phát OTP trong một transaction; gửi mail thất bại thì `otpSent = false`, tài khoản vẫn giữ), `VerifyAccount`, `ResendVerifyOtp`, `Login`, `RefreshSession`, `SendResetPasswordOtp`, `ResetPassword`.

**Port:** `TokenService` (phát và đọc access/refresh token), `OtpMailer`.

**Infrastructure:**
- `web/`: `AuthController`, request/response.
- `token/`: `JwtTokenService`, `JwtClaims`, `JwtProperties`, `JwtBearerAuthenticator` (implement SPI `platform.security.BearerTokenAuthenticator`, kiểm tài khoản còn tồn tại, đã xác nhận, và Q-04).
- `messaging/`: `OrchestratorOtpMailer` (gửi đồng bộ qua RabbitMQ như hiện tại, để biết ngay khi gửi thất bại), `EmailNotificationEvent`, `OtpMailProperties`.

`Login` gọi `AccountApi.verifyCredentials`, không dùng `AuthenticationManager`, `UserDetailsService`, `DaoAuthenticationProvider`.

---

## 5. Value object và mô hình thất bại

### 5.1. Hai họ value object

| Họ | Ví dụ | Cửa vào |
|---|---|---|
| **Từ dữ liệu vào** | `Email`, `PhoneNumber`, `RawPassword`, `LoginIdentifier`, `FullName`, `RecipientName`, `WardName`, `StreetDetail`, `AddressLabel`, `Province`, `CitizenId`, `OtpCode` | `static parse(String raw)` cho dữ liệu ngoài; constructor cho tái tạo từ nguồn tin cậy |
| **Do hệ thống tạo** | `PasswordHash`, `IdNumberHash`, `MaskedIdNumber`, `LegalIdentity`, `KycLockout`, `DeliveryArea`, mọi `*Id` | Chỉ constructor hoặc factory trong domain |

### 5.2. Hai cửa vào

```java
public record Email(String value) {

    /** Tái tạo từ nguồn tin cậy (DB, chính domain). Chỉ bất biến cấu trúc. Vi phạm là BUG. */
    public Email {
        if (value == null || value.isBlank()) throw new IllegalArgumentException("email is blank");
    }

    /** Dữ liệu vào. Nguồn quy tắc DUY NHẤT. */
    public static Email parse(String raw) {
        String v = Text.required(raw).toLowerCase(Locale.ROOT);
        if (v.length() > MAX_LENGTH) throw ValueRejected.tooLong(MAX_LENGTH);
        if (!PATTERN.matcher(v).matches()) throw ValueRejected.badFormat();
        return new Email(v);
    }

    public String masked() { ... }

    @Override public String toString() { return masked(); }   // log không bao giờ lộ PII
}
```

Quy tắc:
- `parse` là **nguồn quy tắc duy nhất**. Request DTO giữ kiểu thuần (`String`) và **không** gắn `@NotBlank`, `@Email`, `@Pattern`, `@Size` cho trường đi qua value object; việc bắt buộc và định dạng do `FieldParser` + `parse` lo (mục 6.2). Bean Validation chỉ còn cho trường không phải value object (ví dụ `Boolean isDefault`), nếu cần.
- `parse` chỉ nói **vì sao** từ chối (`Reason` + tham số). Nó không biết tên trường, không biết khóa i18n, không biết HTTP.
- `RawPassword.parse`: giới hạn trên đếm theo **byte UTF-8** hay **ký tự** do ĐIỂM DỪNG C quyết định. BCrypt chỉ đọc 72 byte đầu, nên đếm ký tự để lọt mật khẩu có dấu dài hơn 72 byte và bị cắt im lặng. Không trim mật khẩu.
- `PhoneNumber.parse`: có bỏ dấu cách, dấu chấm, gạch ngang trước khi khớp hay không, và có bắt buộc đầu số `0`/`84`/`+84` hay không, đều do ĐIỂM DỪNG C quyết định.
- Constructor **không** chạy chính sách nhập. Nhờ vậy, siết quy tắc không làm hỏng việc đọc dữ liệu cũ.
- Converter JPA gọi constructor, không gọi `parse`.
- Value object chứa PII có `toString()` trả bản che. `RawPassword`, `PasswordHash` trả `[PROTECTED]`.
- Không `implements Serializable`.
- Hằng số giới hạn (`MAX_LENGTH`) để `public` trong value object, để `@Column(length = ...)` dùng chung.
- `PasswordHash` không biết thuật toán (không kiểm tiền tố `$2a$`). Băm và so khớp đi qua port `PasswordHasher`.

### 5.3. Value object văn bản có giới hạn

Record không kế thừa được, nên dùng hàm tĩnh của `shared.value.Text`:

```java
public record RecipientName(String value) {
    public static final int MAX_LENGTH = 100;
    public RecipientName { Text.assertPresent(value, "recipientName"); }   // IllegalArgumentException nếu rỗng: bug
    public static RecipientName parse(String raw) {
        return new RecipientName(Text.bounded(raw, MAX_LENGTH));           // trim, REQUIRED, TOO_LONG
    }
}
```

`Text` gồm: `required(raw)` (trim; rỗng thì `REQUIRED`), `bounded(raw, max)` (`required` + `TOO_LONG`), `assertPresent(value, what)` (bất biến cho constructor, ném `IllegalArgumentException`).

Trường tùy chọn **không** xử lý trong value object mà trong `FieldParser.optional(...)`: null hoặc chỉ có khoảng trắng nghĩa là "không có", trả `null`, không gọi `parse`. Giữ hành vi hiện tại: số điện thoại `""` khi đăng ký nghĩa là không có số.

### 5.4. Ba loại thất bại

| Loại | Chủ | Kiểu | HTTP | Log |
|---|---|---|---|---|
| Dữ liệu vào bị từ chối | Client | `ValueRejected(reason, args)`, được `FieldParser` gom thành `InvalidFields` | 400 `INVALID_INPUT` + `errors[{field, message}]` (đủ mọi trường sai) | không |
| Vi phạm quy tắc nghiệp vụ | Nghiệp vụ | `AppException(ErrorCode, args)` | theo `ErrorCode` | `warn` |
| Bất biến bị phá | Lập trình viên | `IllegalArgumentException`, `IllegalStateException` | 500 `COMMON_500` | `error` + stack trace |

```java
/** Dữ liệu vào bị từ chối. Không biết tên trường, không biết khóa i18n, không biết HTTP. */
public final class ValueRejected extends RuntimeException {

    public enum Reason { REQUIRED, TOO_SHORT, TOO_LONG, BAD_FORMAT, UNKNOWN_CODE }

    private final Reason reason;
    private final Map<String, Object> args;    // ví dụ {max: 100}

    private ValueRejected(Reason reason, Map<String, Object> args) {
        super(reason.name(), null, false, false);   // không chụp stack trace: không phải bug
        this.reason = reason;
        this.args = Map.copyOf(args);
    }

    public static ValueRejected required()       { ... }
    public static ValueRejected badFormat()      { ... }
    public static ValueRejected unknownCode()    { ... }
    public static ValueRejected tooLong(int max) { ... }   // args {max}
    public static ValueRejected tooShort(int min){ ... }   // args {min}
}
```

**Không có `valueType`.** Lý do: cùng một value object nhưng khóa message khác nhau theo ngữ cảnh. Ví dụ `PhoneNumber` dùng `validation.phone.invalid` khi đăng ký nhưng `validation.address.recipient_phone.invalid` trong địa chỉ. Chỉ tầng web biết ngữ cảnh, nên khóa message và tên trường do `FieldParser` gắn vào (mục 6.2).

- Khóa message phải **trùng với khóa đang có** trong `messages*.properties`. **Không đổi tên khóa.**
- Quy tắc ghép mặc định: `<keyPrefix>.<hậu tố>`, với hậu tố theo `Reason`: `REQUIRED → required`, `BAD_FORMAT → invalid`, `UNKNOWN_CODE → invalid`, `TOO_LONG → too_long`, `TOO_SHORT → too_short`.
- Khóa hiện tại không theo quy tắc trên (ví dụ `validation.password.size` dùng chung cho quá ngắn và quá dài): truyền **bảng ghi đè** `Reason → khóa đầy đủ` vào `FieldParser` cho trường đó. Phase 0 lập danh sách khóa thật của từng trường.
- Không có `DomainGuard` biến bug thành 400. Kiểm bất biến dùng `Objects.requireNonNull` và `IllegalArgumentException`.

### 5.5. Id

Id là một value object có vai trò đặc biệt: **ứng dụng sinh, ngay lúc tạo**, qua một port như `Clock`. Có **kiểu riêng** để compiler bắt nhầm lẫn. Có **quy tắc sai định dạng riêng**: id sai định dạng trả lời như "không tồn tại", không phải "dữ liệu sai".

#### 5.5.1. Vì sao không để JPA sinh

Hiện tại `@GeneratedValue(strategy = UUID)` sinh id **khi lưu**, nên từ lúc tạo đến lúc `save` thì `id == null`. Hệ quả: domain không tạo được đối tượng đầy đủ; phải `saveAndFlush` mới có id để tạo profile, ghi outbox, trả về; `equals`/`hashCode` theo id không an toàn trước khi lưu. Sinh id ở ứng dụng lúc tạo thì id tồn tại từ đầu, và test dùng được id cố định.

#### 5.5.2. Loại id theo vai trò

| Id | Vai trò | Cần | Sinh bằng |
|---|---|---|---|
| `AccountId` | Định danh thực thể | Duy nhất; có thứ tự thời gian | `IdGenerator` (UUID v7) |
| `AddressId` | Định danh thực thể | Duy nhất; có thứ tự thời gian | `IdGenerator` (UUID v7) |
| `EventId` (outbox, `eventId` trong payload) | Định danh thực thể; phía nhận dùng chống xử lý trùng | Duy nhất; có thứ tự để relay đọc theo thứ tự | `IdGenerator` (UUID v7) |
| `NfcSessionId` | **Năng lực / bí mật**: có id là bước được vào phiên | **Không đoán được** | 24 byte `SecureRandom`, base64url không padding: chuỗi 32 ký tự, 192 bit, **giữ định dạng hiện tại** (quyết định B-2). Không phải UUID, **không** dùng `IdGenerator` |
| `profiles` | Không có id riêng: khóa chính là `account_id` | — | Dùng `AccountId` của tài khoản |

UUID v7 = 48 bit thời gian mili giây + 74 bit ngẫu nhiên. Đánh đổi: id lộ thời điểm tạo. Với địa chỉ và sự kiện không đáng kể (API đã trả `createdAt`); với tài khoản là lộ thời điểm đăng ký. **Đã chốt (I1): dùng v7 cho mọi id thực thể, kể cả `AccountId`, chấp nhận đánh đổi này.**

Id cũ (v4) trong DB vẫn hợp lệ và cùng tồn tại với id mới: `tryParse` nhận mọi phiên bản UUID, không ai được giả định phiên bản của một id.

#### 5.5.3. Port và hiện thực

```java
// shared/id/IdGenerator.java: Java thuần
public interface IdGenerator {
    UUID next();
}

// platform/id/UuidV7Generator.java
@Component
@RequiredArgsConstructor
class UuidV7Generator implements IdGenerator {

    private final Clock clock;                                  // TS-01: thời gian chỉ từ Clock
    private final SecureRandom random = new SecureRandom();

    @Override
    public UUID next() {
        long millis = clock.millis();
        long msb = (millis << 16) | 0x7000L | (random.nextInt() & 0x0FFF);                  // 48 bit ms | ver 7 | 12 bit ngẫu nhiên
        long lsb = (random.nextLong() & 0x3FFF_FFFF_FFFF_FFFFL) | 0x8000_0000_0000_0000L;   // variant 10 | 62 bit ngẫu nhiên
        return new UUID(msb, lsb);
    }
}
```

- Không thêm thư viện. Trong cùng một mili giây, id không bảo đảm tăng dần tuyệt đối. Chấp nhận được ở quy mô này.
- Test: `SequentialIdGenerator` trả UUID tuần tự cố định, để response và log so khớp chính xác.

#### 5.5.4. Id có kiểu

```java
// shared/AccountId.java (AddressId, EventId cùng khuôn, nằm trong module sở hữu; NfcSessionId bọc String, xem B-2)
public record AccountId(UUID value) {

    public AccountId {
        Objects.requireNonNull(value, "account id");
    }

    /** Từ chuỗi bên ngoài (URL, JWT, request nội bộ). Không phải UUID thì empty: chỗ gọi trả "không tồn tại". */
    public static Optional<AccountId> tryParse(String raw) {
        if (raw == null) return Optional.empty();
        try {
            return Optional.of(new AccountId(UUID.fromString(raw.trim())));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    /**
     * CHỈ dùng trong giai đoạn chuyển tiếp (Phase 4 → Phase 8b), khi cột id còn là varchar.
     * Sai định dạng là dữ liệu hỏng: IllegalArgumentException → 500. Xóa ở Phase 8b.
     */
    public static AccountId fromStored(String stored) {
        return new AccountId(UUID.fromString(stored));
    }

    @Override public String toString() { return value.toString(); }
}
```

- Id **không** dùng `parse` ném `ValueRejected`, vì quy tắc hiện có: id sai định dạng trả lời như id không tồn tại (không cho kẻ dò phân biệt hai trường hợp).
- Bên trong dùng `UUID`, nên kiểm định dạng miễn phí. Chữ ký như `remove(AccountId owner, AddressId address)` không thể truyền ngược thứ tự.
- Id không phải PII: được log bình thường.

#### 5.5.5. Ánh xạ JPA

Đặc tả JPA không cho dùng `AttributeConverter` trên `@Id`. Không dùng `@EmbeddedId` hay kiểu Hibernate tùy biến. Cách dùng: **field thô, accessor có kiểu**.

**Dạng cuối (sau Phase 8b):** field kiểu `java.util.UUID`, cột kiểu `uuid`. Hibernate 6 ánh xạ `UUID` sang kiểu `uuid` gốc của PostgreSQL mặc định, không cần annotation thêm.

```java
@Entity
@Table(name = "accounts")
public class Account extends BaseEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;                              // KHÔNG @GeneratedValue

    public static Account registerMember(AccountId id, Email email, PhoneNumber phone, PasswordHash hash) {
        Account a = new Account();
        a.id = id.value();
        // ...
        return a;
    }

    public AccountId id() { return new AccountId(id); }
}
```

**Dạng chuyển tiếp (Phase 4 → Phase 8b):** cột vẫn là `varchar`, nên field là `String`, gán `id.toString()`, accessor dùng `AccountId.fromStored(id)`. Nhờ id có kiểu, chỗ phải sửa khi chuyển chỉ nằm trong entity (field, factory, accessor) và adapter persistence; tầng `domain` công khai, `application` và web không đổi.

**Bẫy `save()` với id gán trước:** `JpaRepository.save()` thấy id khác null sẽ coi là entity đã tồn tại và gọi `merge` (thêm một `SELECT`, trả về instance khác). Vì vậy:
- Port có phương thức `add(...)` riêng cho tạo mới. Adapter gọi `EntityManager.persist(...)` rồi `flush()` để vi phạm unique nổ ngay trong phương thức (giữ AC-01.3: trùng email/số điện thoại trả 409, không phải 500 lúc commit).
- Cập nhật dựa vào dirty checking trong transaction, không gọi `save()`.
- Áp dụng cho mọi entity: `Account`, `Profile` (khóa chính gán từ ngoài), `AddressEntry`, `OutboxEvent`.

#### 5.5.6. Kiểu cột

**Đã chốt (I2): dùng kiểu `uuid` của PostgreSQL** cho mọi cột id và cột khóa ngoại trỏ tới id: 16 byte thay vì tối đa 255 ký tự, so sánh nhanh hơn, DB tự từ chối giá trị không phải UUID. JSON đi ra không đổi (id luôn là chuỗi).

**Vì sao đổi ở một phase riêng (Phase 8b), không đổi dần theo module:** `accounts.id` được khóa ngoại của `user_profiles`/`profiles`, `addresses`, `legal_profiles` tham chiếu, và hai đầu khóa ngoại phải cùng kiểu. Đổi `accounts.id` sớm buộc phải đổi cùng lúc cột của những module còn chạy code cũ (field `String`), và code cũ đó sẽ gãy khi bind tham số. Đợi đến khi **mọi** module đã viết lại (sau Phase 7), đổi tất cả một lần trong một migration, với code mới chỉ phải sửa ở entity và adapter.

Cột cần đổi ở Phase 8b (Phase 0 xác nhận danh sách thật):
- `accounts.id`
- `profiles.account_id` (khóa chính + khóa ngoại)
- `addresses.id`, `addresses.account_id`
- `outbox_events.id` nếu đang lưu UUID dạng chuỗi
- Mọi cột khác Phase 0 tìm thấy đang chứa id của các bảng trên

Không đổi: chuỗi id **bên trong** payload JSON của outbox (`eventId`, `accountId` trong sự kiện) vì đó là hợp đồng với orchestrator.

#### 5.5.7. Ở biên

| Biên | Xử lý |
|---|---|
| URL `/api/addresses/{id}` | Controller nhận `String`, `AddressId.tryParse`. Empty thì `ADDRESS_NOT_FOUND`. Có id thì use case kiểm quyền sở hữu: địa chỉ của tài khoản khác cũng trả `ADDRESS_NOT_FOUND` (không 403, chống dò) |
| URL `/api/nfc/sessions/{id}` | `NfcSessionId.tryParse` (đúng 32 ký tự base64url) empty thì trả như phiên không tồn tại: `NFC_003` khi đọc phiên, `REJECTED`/`SESSION_EXPIRED` khi gửi thẻ (snapshot `kyc/session-unknown`, `kyc/card-session-unknown`) |
| JWT | Claim chủ thể là chuỗi UUID. `JwtBearerAuthenticator` dùng `AccountId.tryParse`, empty thì `TOKEN_INVALID`. `CurrentUserInfo` mang `AccountId` |
| `/internal/**`, `identity-client`, payload sự kiện | Luôn là `String`. Hợp đồng giữa các service không dùng kiểu Java của identity |

#### 5.5.8. Tham chiếu giữa các module

- Chỉ bằng id: entity module A **không** có `@ManyToOne`/`@OneToOne`/`@OneToMany` tới entity module B (ví dụ `AddressEntry` giữ `account_id`, không giữ `Account`).
- Khóa ngoại ở DB giữa bảng của các module (`profiles.account_id → accounts.id`) được giữ, vì dùng chung một DB. Ghi trong ADR-5: đây là thứ đầu tiên phải bỏ khi tách module thành service.

---

## 6. Platform

```
platform/
├── config/        ClockConfig, LocaleConfig, OpenApiConfig, DotEnvConfig
├── web/
│   ├── ApiResponse.java
│   ├── GlobalExceptionHandler.java
│   └── validation/
│       ├── FieldParser.java               (parse từng trường request, gom MỌI lỗi theo trường)
│       └── InvalidFields.java             (exception mang danh sách FieldRejection)
├── security/
│   ├── SecurityConfig.java                (filter chain, quy tắc đường dẫn, không biết JWT)
│   ├── BearerTokenFilter.java
│   ├── BearerTokenAuthenticator.java      (SPI)
│   ├── CurrentUser.java, CurrentUserInfo.java, CurrentUserArgumentResolver.java
│   └── WebMvcConfig.java
├── id/            UuidV7Generator         (implement shared.id.IdGenerator: mục 5.5.3)
├── persistence/   BaseEntity, converter cho Email, PhoneNumber (id không dùng converter: mục 5.5.5)
├── memory/        ExpiringMap             (map có TTL, cập nhật nguyên tử, dùng Clock)
└── messaging/
    ├── RabbitConfig.java                  (exchange + message converter, không routing key)
    └── outbox/    Outbox, OutboxEvent, OutboxEventRepository, OutboxRelay, OutboxProperties
```

### 6.1. Bảo mật

`BearerTokenFilter` đọc header `Authorization`, gọi `BearerTokenAuthenticator`, đặt `SecurityContext`. Nó không biết JWT, không biết account. `auth` implement SPI.

### 6.2. Value object ở biên web

**Không** để Jackson tự gọi `parse` khi đọc JSON. Lý do:
1. Jackson dừng ở trường sai **đầu tiên**, trong khi hành vi hiện tại (Bean Validation) trả **mọi** trường sai trong `errors[]`. Đổi điều này là phá hợp đồng mục 2.
2. Jackson không biết ngữ cảnh để chọn khóa message (mục 5.4).

**Đầu vào: request tự parse thành command, gom mọi lỗi.**

```java
// platform/web/validation/FieldParser.java
public final class FieldParser {

    private final List<FieldRejection> rejections = new ArrayList<>();

    /** Trường bắt buộc. keyPrefix ví dụ "validation.address.recipient_phone". */
    public <T> T required(String field, String keyPrefix, String raw, Function<String, T> parse) {
        return required(field, keyPrefix, Map.of(), raw, parse);
    }

    /** Có bảng ghi đè Reason → khóa đầy đủ, cho khóa không theo quy tắc mặc định. */
    public <T> T required(String field, String keyPrefix, Map<ValueRejected.Reason, String> keyOverrides,
                          String raw, Function<String, T> parse) {
        try {
            return parse.apply(raw);
        } catch (ValueRejected e) {
            rejections.add(new FieldRejection(field, keyPrefix, keyOverrides, e));
            return null;
        }
    }

    /** Trường tùy chọn: null hoặc chỉ có khoảng trắng nghĩa là "không có", trả null. */
    public <T> T optional(String field, String keyPrefix, String raw, Function<String, T> parse) {
        return raw == null || raw.isBlank() ? null : required(field, keyPrefix, raw, parse);
    }

    /** Gọi sau khi đã parse HẾT mọi trường. */
    public void throwIfRejected() {
        if (!rejections.isEmpty()) throw new InvalidFields(List.copyOf(rejections));
    }

    public record FieldRejection(String field, String keyPrefix,
                                 Map<ValueRejected.Reason, String> keyOverrides, ValueRejected cause) {}
}
```

```java
// address/infrastructure/web/AddressRequest.java
public record AddressRequest(String recipientName, String recipientPhone, String provinceCode, String provinceName,
                             String wardName, String detail, String label, Boolean isDefault) {

    public AddressDraft toDraft() {
        var p = new FieldParser();
        var name     = p.required("recipientName",  "validation.address.recipient_name",  recipientName,  RecipientName::parse);
        var phone    = p.required("recipientPhone", "validation.address.recipient_phone", recipientPhone, PhoneNumber::parse);
        var province = p.required("provinceCode",   "validation.address.province_code",   provinceCode,   Province::parse);
        var ward     = p.required("wardName",       "validation.address.ward_name",       wardName,       WardName::parse);
        var street   = p.required("detail",         "validation.address.detail",          detail,         StreetDetail::parse);
        var tag      = p.optional("label",          "validation.address.label",           label,          AddressLabel::parse);
        p.throwIfRejected();
        return new AddressDraft(/* ... */);
    }
}
```

Quy tắc:
- Mọi request có trường là value object đều có **một** phương thức `toCommand()`/`toDraft()` theo mẫu trên: parse hết mọi trường, rồi `throwIfRejected()` một lần. Controller gọi phương thức này trước khi gọi use case.
- Tên trường (`field`) ghi tường minh, trùng tên trường JSON hiện tại.
- Request record **không** có compact constructor chuẩn hóa (`RequestText.trim`...): chuẩn hóa thuộc về `parse`. Xóa `RequestText` khi không còn ai dùng.
- Path variable: controller nhận `String`, gọi `XxxId.tryParse`/`parse` ngay đầu phương thức. Không dùng `ConverterFactory`.

**Lỗi:** `GlobalExceptionHandler` bắt `InvalidFields`, với mỗi `FieldRejection`: chọn khóa (ghi đè nếu có, không thì `keyPrefix + "." + hậu tố`), dịch kèm `args`, tạo `ApiResponse.FieldError(field, message)`. Trả 400 `INVALID_INPUT` với **đủ mọi phần tử**, cùng hình dạng như lỗi Bean Validation hiện tại. JSON hỏng (không parse được) vẫn là `MALFORMED_JSON` như cũ.

**Đầu ra:** response DTO dùng kiểu thuần. Mapping tường minh trong `XxxResponse.from(...)`. Không tự động serialize value object, để không có giá trị nào lộ ra mà không ai quyết định.

### 6.3. Store trong bộ nhớ

`ExpiringMap<K, V>`: `compute(key, fn, ttl)` nguyên tử, dọn dẹp định kỳ bằng một job duy nhất, thời gian lấy từ `Clock`. Mọi adapter `InMemory*` dùng nó. Khi cần chạy nhiều instance, viết adapter Redis cho từng port (ngoài phạm vi plan này).

---

## 7. API nội bộ: `identity-client`

Module build mới cạnh `identity-service`. Công cụ: **Spring HTTP Service Client** (`@HttpExchange`). **Không dùng Spring Cloud OpenFeign** (đã feature-complete).

```
com.moonkage.identity.client
├── kyc/
│   ├── KycInternalApi.java          (@HttpExchange("/internal"))
│   ├── CheckIdNumberRequest.java, CheckIdNumberResponse.java
│   └── KycStatusResponse.java
├── IdentityClientException.java
└── IdentityErrorHandler.java        (body ApiResponse lỗi → IdentityClientException)
```

```java
@HttpExchange("/internal")
public interface KycInternalApi {
    @PostExchange("/accounts/check")
    CheckIdNumberResponse checkIdNumber(@RequestBody CheckIdNumberRequest request);

    @GetExchange("/nfc/status/{accountId}")
    KycStatusResponse getKycStatus(@PathVariable String accountId);
}
```

Quy tắc:
- Đường dẫn và JSON **trùng từng ký tự** với endpoint hiện tại (khóa bằng test đặc tả).
- DTO chỉ dùng kiểu thuần, không value object, không phụ thuộc `identity-service`. Phụ thuộc duy nhất: `spring-web` (scope `provided`/`compileOnly`).
- Phía identity: `InternalKycController implements KycInternalApi`, parse sang value object trong controller. Nếu phiên bản Spring không nhận `@HttpExchange` ở phía server: giữ `@PostMapping`/`@GetMapping` trên controller, vẫn `implements` interface.
- Phía bên gọi: Boot 4 dùng `@ImportHttpServices(group = "identity", types = KycInternalApi.class)` + `spring.http.serviceclient.identity.base-url`. Boot 3 dùng `RestClient` + `HttpServiceProxyFactory`, gắn `IdentityErrorHandler`.
- Tiến hóa: chỉ thêm trường; deploy identity trước rồi mới nâng client; thay đổi phá vỡ đi qua `/internal/v2/...` chạy song song.

---

## 8. Chiến lược test

| Lớp | Mục đích | Phụ thuộc vào code production | Tồn tại sau refactor |
|---|---|---|---|
| **Đặc tả (characterization)** | Khóa hợp đồng mục 2 | Chỉ `IdentityServiceApplication`, HTTP, JSON, SQL, message | Có, mãi mãi |
| Domain | Quy tắc của aggregate và value object | Chỉ `domain` của module | Có |
| Use case | Điều phối, với port giả | `application` + fake port | Có |
| Adapter | JPA, crypto, JWT, messaging | `infrastructure` | Có |
| Kiến trúc | Ranh giới, tầng, quy ước | Toàn bộ | Có |

### 8.1. Test đặc tả: lưới an toàn cho việc viết lại

- Chạy toàn bộ ứng dụng với PostgreSQL và RabbitMQ thật (Testcontainers, hoặc hạ tầng test sẵn có nếu Phase 0 thấy dự án đã có).
- Mỗi endpoint: các nhánh thành công và **từng mã lỗi** có thể trả về. So sánh status, JSON (bỏ qua trường thay đổi theo lần chạy như `timestamp`, id sinh ra), và trạng thái DB sau request.
- Sự kiện: gắn một hàng đợi test vào exchange `moonkage.events`, kiểm routing key và payload.
- Hành vi bảo mật: email không tồn tại và mật khẩu sai trả cùng lỗi; "chưa kích hoạt" chỉ khi mật khẩu đúng; refresh token cũ bị từ chối sau khi đặt lại mật khẩu; OTP xác nhận không dùng được cho đặt lại mật khẩu.
- Lỗi nhiều trường: với mỗi request có từ hai trường kiểm hợp lệ trở lên, gửi một body có **ít nhất hai trường sai cùng lúc** và kiểm `errors[]` có đủ từng trường, đúng message theo khóa hiện tại (so theo `field`, không phụ thuộc thứ tự).
- Thời gian: dùng `Clock` cố định qua cấu hình test, không `sleep`.
- **Không import class production nào ngoài lớp Application.** Đây là điều kiện để test sống sót qua mọi thay đổi bên trong.
- Đặt trong package riêng `com.moonkage.identity.contract`.

### 8.2. Test kiến trúc (bật dần theo module, bật toàn bộ ở Phase 9)

- `ApplicationModules.of(IdentityServiceApplication.class).verify()`.
- Luật tầng ở mục 3.4.
- Luật quy ước ở mục 3.5 (không `*Impl`, không `*Constant`, không `@Setter` trên `@Entity`, không package `util|common|helper`).
- Chỉ converter JPA và chính value object được gọi constructor của value object họ "từ dữ liệu vào".
- Không gọi `Instant.now()`, `LocalDate.now()`, `System.currentTimeMillis()` không có `Clock`.
- Chỉ `kyc.infrastructure.web.internal` được import `com.moonkage.identity.client`.
- Mọi `ErrorCode` có mã không trùng nhau, và message key tồn tại trong mọi file `messages*.properties`.
- Không entity nào dùng `@GeneratedValue`.
- Không gọi `UUID.randomUUID()` trong code production. `SecureRandom` cho id chỉ trong `NfcSessionId`. Id thực thể chỉ sinh qua `IdGenerator`, và chỉ trong tầng `application`.
- Sau Phase 8b: không còn lời gọi `fromStored(String)`; mọi field `@Id` và cột tham chiếu id có kiểu `UUID`.
- Không gọi `JpaRepository.save(...)` / `saveAndFlush(...)` từ adapter cho entity có id gán trước; tạo mới dùng `EntityManager.persist`.
- Entity của module A không có quan hệ JPA tới entity của module B.

---

## 9. Các phase

Quy tắc chung:
- Nhánh `refactor/identity-v2`. Mỗi phase có một hoặc nhiều commit; **build và test xanh sau mỗi commit**.
- Kỹ thuật **strangler trong cùng codebase**: dựng module mới ở package mới, chuyển controller sang dùng nó, chạy test đặc tả, rồi **xóa code cũ** của phần đó trong cùng phase. Không để code cũ và mới cùng phục vụ một endpoint quá một phase.
- Không cần giữ lịch sử git từng file. Viết lại tự do miễn test đặc tả xanh.
- Gặp ⛔ thì dừng, báo cáo, chờ.

### Phase 0: Khảo sát (không sửa code)

1. Đọc `docs/conventions/coding-rules.md`, `docs/services/identity/domain-model-plan.md`, `docs/services/identity/db-identify.md`, mọi test hiện có (đặc biệt `DomainModelArchitectureTest`), `application*.yml`, `messages*.properties`.
2. Xác định: build tool và lệnh test; phiên bản Spring Boot, Spring Framework, Hibernate, Jackson; công cụ migration và vị trí script; cấu trúc build đa module ở `api/`; hạ tầng test hiện có (Testcontainers? DB nhúng?).
3. Liệt kê mọi bên ngoài identity dùng: endpoint `/internal/**` (và cách gọi: `RestTemplate`, `WebClient`, Feign...), routing key và trường sự kiện, `nfc_verified_at`.
4. Chạy test hiện có, ghi mốc.
5. Lập danh sách đầy đủ hợp đồng mục 2: mọi endpoint, mọi mã lỗi mỗi endpoint có thể trả, mọi routing key, mọi khóa message.
6. Ghi lại mọi điểm plan này mâu thuẫn với docs.

⛔ **ĐIỂM DỪNG A**: gửi báo cáo khảo sát và danh sách hợp đồng.

### Phase 1: Test đặc tả

1. Viết test đặc tả theo mục 8.1 cho **toàn bộ** danh sách hợp đồng ở Phase 0. Chạy trên code **hiện tại**: tất cả phải xanh.
2. Chụp JSON thật của hai endpoint `/internal/**` làm file mẫu.
3. Báo cáo độ phủ: bảng endpoint × nhánh (thành công, từng mã lỗi), đánh dấu nhánh nào chưa phủ và lý do.

⛔ **ĐIỂM DỪNG B**: người dùng duyệt độ phủ. Mọi phase sau dựa vào bộ test này.

### Phase 2: Sửa lỗi đã biết (thay đổi hành vi có chủ đích)

1. **Regex số điện thoại lệch:** DTO đăng ký và địa chỉ dùng `PhoneNumber.REGEX` (bắt buộc đầu số) trong khi `PhoneNumber` chấp nhận 9 chữ số không đầu số. Thống nhất theo quyết định C1.
2. **Ký tự phân cách trong số điện thoại:** áp dụng quyết định C2.
3. **Tên tỉnh do client gửi:** server lấy tên theo mã từ danh mục chính thức, xử lý `provinceName` của client theo quyết định C3.
4. **Giới hạn độ dài mật khẩu:** áp dụng quyết định C4 cho đăng ký và đặt lại mật khẩu.
5. Cập nhật đúng các test đặc tả liên quan, ghi rõ trong commit đây là thay đổi hành vi, mỗi quyết định một commit.

⛔ **ĐIỂM DỪNG C** (trước Phase 2): người dùng chọn hành vi đúng cho bốn điểm:

| Mã | Câu hỏi | Hiện tại | Lựa chọn |
|---|---|---|---|
| C1 | Số điện thoại có **bắt buộc** đầu số `0` / `84` / `+84` không? | Đăng ký và địa chỉ: bắt buộc. Đăng nhập: không bắt buộc (`912345678` được nhận) | (a) bắt buộc ở mọi nơi; (b) không bắt buộc ở mọi nơi |
| C2 | Có chấp nhận dấu cách, dấu chấm, gạch ngang trong số điện thoại không (`0912 345 678`, `0912.345.678`)? | Không | (a) không, giữ như cũ; (b) có: `parse` bỏ các ký tự này trước khi khớp. (b) chỉ **nới rộng**, không làm hỏng client nào |
| C3 | `provinceName` client gửi lên xử lý thế nào? | Lưu nguyên, không đối chiếu với mã | (a) vẫn nhận nhưng bỏ qua, tên lấy từ danh mục theo mã; (b) bỏ hẳn trường khỏi request (phá client cũ) |
| C4 | Giới hạn trên của mật khẩu đếm theo gì? | Ký tự (`length() <= 72`) | (a) **byte UTF-8** `<= 72`: khớp giới hạn thật của BCrypt, nhưng siết lại (mật khẩu có dấu dài trước đây được nhận nay có thể bị từ chối); (b) giữ ký tự và chấp nhận phần vượt 72 byte bị cắt im lặng |

Ghi chú C4: dù chọn (a), mật khẩu **đã lưu** không bị ảnh hưởng (đọc DB không chạy `parse`). Người dùng có mật khẩu cũ dài vẫn đăng nhập được, vì so khớp đi qua `PasswordHasher`, không qua `RawPassword.parse` giới hạn trên. Phase 2 phải xác nhận điều này bằng test: đăng nhập không áp giới hạn trên của `parse`, chỉ đăng ký và đặt lại mật khẩu mới áp.

### Phase 3: Nền móng

1. Tạo `shared` (mục 4.1) và `platform` (mục 6) mới: value object `Email`, `PhoneNumber`, `AccountId`, `ValueRejected`, `Text`, `ErrorCode` (interface), `AppException`, `CommonError`, `FieldParser`, `InvalidFields`, xử lý lỗi `InvalidFields` trong `GlobalExceptionHandler`, `IdGenerator` + `UuidV7Generator` + `SequentialIdGenerator` (test), `ExpiringMap`, SPI bảo mật, outbox (`EventId` sinh qua `IdGenerator`), cấu hình.
2. Enum `ErrorCode` cũ đổi tên thành `LegacyError implements ErrorCode`, giữ nguyên mã. Mỗi phase sau chuyển mã của module mình sang `<Module>Error` và xóa khỏi `LegacyError`. Xóa hẳn `LegacyError` ở Phase 9.
3. Code cũ chuyển sang dùng `shared`/`platform` mới ở những chỗ cần để build xanh. Xóa bản cũ bị thay thế (`common/`, `account/atom/` cho `Email`/`PhoneNumber`/`Role`, `outbox/`...).
4. Thêm test Modulith (chế độ báo cáo) và các luật ArchUnit chỉ áp cho package mới.

### Phase 4: `account` + `otp`

1. Dựng `account` theo mục 4.2, `otp` theo mục 4.5. `Account` không dùng `@GeneratedValue`; `RegisterMember` sinh `AccountId` (UUID v7) qua `IdGenerator`; `JpaAccountRepository.add` dùng `persist` + `flush` (mục 5.5). Field id ở **dạng chuyển tiếp** (`String`, mục 5.5.5) cho tới Phase 8b.
2. Viết test domain và test use case trước, đặc biệt bốn nhánh của `verifyCredentials`, việc so khớp hash giả, và đăng ký trùng email/số điện thoại song song vẫn trả 409.
3. Chuyển code cũ đang gọi `AccountService`/`OtpService` sang API mới. Xóa code cũ của hai module.

⛔ **ĐIỂM DỪNG E**: trình bày `VerifyCredentials` và test trước khi nối vào luồng login (Phase 5).

### Phase 5: `auth` + `platform.security`

1. Dựng `auth` theo mục 4.7. `JwtBearerAuthenticator` implement SPI.
2. `Login` dùng `AccountApi.verifyCredentials`. Gỡ `AuthenticationManager`, `UserDetailsService`, `AccountPrincipal`, `AccountCredentials`.
3. Gửi OTP qua `OrchestratorOtpMailer`. Xóa module `email/` cũ, `security/` cũ, `AuthServiceImpl`.
4. Test đặc tả auth, login, refresh, reset phải xanh nguyên vẹn.

### Phase 6: Schema mới + `profile` + `kyc`

⛔ **ĐIỂM DỪNG F** (trước khi chạy migration): trình bày script và kế hoạch dữ liệu.

1. Migration theo `db-identify.md`, bằng đúng công cụ ở Phase 0:
    - `user_profiles` → `profiles`, bỏ `avatar_key`; thêm `kyc_verified`, `legal_name`, `id_number_hash` (unique), `id_hash_key_ver`, `id_number_masked`, ràng buộc `ck_profiles_kyc_complete`.
    - Kiểm trước: có `id_number_hash` trùng nhau với `id_hash_key_ver` khác nhau không. Có thì dừng.
    - Chép dữ liệu đã xác minh từ `legal_profiles`; bỏ `legal_profiles`.
    - `accounts`: bỏ `nfc_failed_attempts`, `nfc_locked_until`: **đã làm** ở `V2026_10_29_1500__accounts_invariants.sql`, bỏ bước này.
    - **Không** đổi kiểu cột id ở phase này (để Phase 8b).
2. Dựng `profile` theo mục 4.3, `kyc` theo mục 4.6. `Profile` tạo mới qua `add` (`persist`), không `save`; khóa chính ở dạng chuyển tiếp (`String`). `NfcSessionId` sinh như hiện tại (24 byte `SecureRandom`, base64url, 32 ký tự: B-2).
3. Xóa `LegalProfile*`, `PiiCipher`, `NfcServiceImpl`, `UserProfile*` cũ. Biến môi trường `PII_ENC_KEY_V1` không còn dùng: ghi vào báo cáo, không tự sửa file môi trường.
4. Cập nhật test đặc tả cho phần schema (DB assertions) theo schema mới; JSON response giữ nguyên trừ quyết định ở ĐIỂM DỪNG G.

⛔ **ĐIỂM DỪNG G** (trước khi merge Phase 6):
1. ~~`nfcVerifiedAt` không còn nguồn~~: đã chốt (G1).
2. Sự kiện `nfc_*` đổi sang tên KYC: làm ngay, hay phát song song cũ và mới một thời gian?

### Phase 7: `address`

⛔ **ĐIỂM DỪNG D** (trước phase): xác nhận quy tắc "xóa địa chỉ mặc định thì không còn mặc định" (giữ nguyên, hay tự đẩy địa chỉ mới nhất lên).

1. Partial unique index đã có từ `V2026_10_22_1000`, tên `ux_addresses_one_default_per_account` (quyết định P0-2): không tạo lại, adapter dịch vi phạm theo tên này. Không đổi kiểu cột id ở phase này (để Phase 8b).
2. Dựng `address` theo mục 4.4: `AddressBook`, `AddressEntry`, `DeliveryContact` và các value object map vào **cột hiện có** bằng `@Embeddable`. `AddressEntry` nhận `AddressId` từ `IdGenerator` lúc `AddressBook.add`; use case truyền id vào, domain không tự sinh.
3. `JpaAddressBookRepository` dùng `pg_advisory_xact_lock`. Vi phạm `ux_addresses_one_default_per_account` (lưới an toàn) dịch thành lỗi: **đề xuất mã mới, chờ duyệt trong báo cáo phase**.
4. Xóa code address cũ. Sau phase này `AccountApi` không còn gì liên quan đến khóa dòng.

### Phase 8: `identity-client`

1. Tạo module build `identity-client` theo mục 7.
2. `InternalKycController implements KycInternalApi`. Test đặc tả nội bộ so với file mẫu Phase 1.
3. Test proxy phía client với `MockRestServiceServer`.

⛔ **ĐIỂM DỪNG H**: trước khi sửa service khác. Trình bày danh sách bên gọi và kế hoạch từng service. Sau khi duyệt: mỗi bên gọi thêm `identity-client`, cấu hình client giữ nguyên timeout, thay code gọi tay, xóa DTO trùng, chạy test của service đó.

### Phase 8b: Chuyển cột id sang kiểu `uuid`

Làm sau khi Phase 4 đến 7 đã xong (không còn code cũ nào đọc/ghi các bảng có id). Không phụ thuộc Phase 8.

⛔ **ĐIỂM DỪNG J** (trước khi chạy migration): trình bày script, danh sách cột, kết quả kiểm dữ liệu.

1. **Kiểm dữ liệu:** với mỗi cột trong danh sách mục 5.5.6, đếm giá trị không khớp định dạng UUID (`!~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'`). Có giá trị nào thì **dừng và báo**, không tự sửa dữ liệu.
2. **Migration** (một script, một transaction):
    - Bỏ các khóa ngoại trỏ tới `accounts.id`.
    - `ALTER TABLE ... ALTER COLUMN ... TYPE uuid USING <cột>::uuid` cho từng cột trong danh sách.
    - Tạo lại khóa ngoại, khóa chính, index, ràng buộc unique liên quan với **đúng tên cũ**.
3. **Code:** trong mỗi entity (`Account`, `Profile`, `AddressEntry`, `OutboxEvent`), đổi field id và field tham chiếu id từ `String` sang `UUID`; factory gán `id.value()`; accessor dùng constructor của id có kiểu. Đổi kiểu id của Spring Data repository trong adapter. Xóa mọi `fromStored(String)`.
4. **Tài liệu:** cập nhật `db-identify.md`: các cột id và cột tham chiếu id đổi từ `varchar(255)` sang `uuid`, bỏ ghi chú "UUID dạng chuỗi".
5. **Test:** test đặc tả xanh nguyên vẹn (JSON không đổi). Thêm test adapter: lưu và đọc lại với id v7, đọc lại được id v4 cũ.

### Phase 9: Khóa chặt và tài liệu

1. Xóa `LegacyError`. Bật toàn bộ luật mục 8.2, `ModularityTests` dùng `verify()`.
2. Kiểm: không còn package nào ngoài `shared`, `platform`, `account`, `profile`, `address`, `otp`, `kyc`, `auth`.
3. Cập nhật `coding-rules.md`: bố cục module, quy ước mục 3.5, value object hai cửa, ba loại thất bại, test đặc tả.
4. Ghi ADR: ADR-1 (JPA trên domain), ADR-2 (trạng thái tạm trong bộ nhớ và điều kiện chuyển Redis), ADR-3 (HTTP Service Client thay OpenFeign, hợp đồng dùng chung), ADR-4 (sổ địa chỉ là aggregate không có bảng, khóa advisory), ADR-5 (id: ứng dụng sinh lúc tạo, v7 cho thực thể, v4 cho bí mật, id có kiểu, khóa ngoại liên module).
5. Báo cáo cuối: số dòng code trước/sau, số test, mọi quyết định còn treo.

---

## 10. Điểm dừng

| Mã | Khi nào | Người dùng quyết định |
|---|---|---|
| A | Sau Phase 0 | Báo cáo khảo sát, mâu thuẫn với docs |
| B | Sau Phase 1 | Độ phủ test đặc tả đủ chưa |
| C | Trước Phase 2 | C1 số điện thoại có bắt buộc đầu số; C2 có nhận dấu cách/dấu chấm/gạch ngang trong số điện thoại; C3 xử lý `provinceName` của client; C4 giới hạn mật khẩu đếm theo byte hay ký tự |
| D | Trước Phase 7 | Xóa địa chỉ mặc định thì có tự chọn mặc định mới không |
| E | Trong Phase 4 | Duyệt `VerifyCredentials` |
| F | Trong Phase 6 | Duyệt migration DB |
| G | Cuối Phase 6 | `nfcVerifiedAt`; đổi tên sự kiện `nfc_*` |
| H | Trong Phase 8 | Sửa code service khác |
| J | Trong Phase 8b | Duyệt migration đổi cột id sang `uuid` và kết quả kiểm dữ liệu |

### Quyết định đã chốt

| Mã | Quyết định |
|---|---|
| I1 | Mọi id thực thể (`AccountId`, `AddressId`, `EventId`) dùng **UUID v7**, sinh qua `IdGenerator`. `NfcSessionId` là bí mật, sinh riêng (B-2) |
| B-2 | (2026-10-29) `NfcSessionId` giữ định dạng hiện tại: 24 byte `SecureRandom`, base64url không padding, 32 ký tự. App và web đã thấy định dạng này |
| I2 | Cột id và cột tham chiếu id dùng kiểu **`uuid` của PostgreSQL**, chuyển một lần ở Phase 8b; cập nhật `db-identify.md` |
| G1 | (2026-10-29) Thêm trường `kycVerified` (boolean) vào response của `POST /internal/accounts/check`, `GET /internal/nfc/status/{id}` và `GET /api/nfc/status` (chỉ thêm, theo mục 7 "Tiến hóa"). Bên gọi (vendor đang coi `nfcVerifiedAt == null` là chưa KYC) chuyển sang `kycVerified` **trước** khi Phase 6 làm `nfcVerifiedAt` mất nguồn; thời điểm sửa vendor duyệt ở ĐIỂM DỪNG H hoặc sớm hơn nếu Phase 6 tới trước. Sau đó `nfcVerifiedAt` trả `null` |
| P0-2 | (2026-10-29) Giữ index `ux_addresses_one_default_per_account` đã có, không tạo `ux_addresses_one_default` |
| P0-4 | (2026-10-29) Làm trên nhánh `refactor/identity-v2`, tạo từ `develop` sau commit mốc của `domain-model-plan.md` giai đoạn 1–2 |
| P0-5 | (2026-10-29) Test đặc tả dùng RabbitMQ thật (`org.testcontainers:rabbitmq`) |
| C1 | (2026-10-29) Số điện thoại nhập vào chỉ nhận dạng trong nước `0` + 9 chữ số, ở mọi nơi (đăng ký, địa chỉ, đăng nhập). `+84`, `84`, 9 chữ số trơn bị từ chối. DB và response vẫn là 9 chữ số thuê bao |
| C2 | (2026-10-29) Không nhận dấu cách, dấu chấm, gạch ngang trong số điện thoại (giữ như cũ) |
| C3 | (2026-10-29) (a) `provinceName` của client vẫn nhận nhưng bỏ qua; tên lấy từ danh mục theo `provinceCode`. Hướng sau này: frontend gọi API bên thứ ba và chỉ gửi mã |
| C4 | (2026-10-29) Giữ giới hạn đếm theo ký tự như hiện tại (b) |
| C5 | (2026-10-29) Sửa B-1: đặt địa chỉ mặc định thứ hai trả đúng 200/201 thay vì 500 |

Ngoài các điểm trên, dừng và hỏi khi:
- Một test đặc tả buộc phải đổi mà không thuộc quyết định nào ở bảng trên.
- Cần thêm thư viện ngoài mục 11.
- Cần thêm hoặc đổi mã lỗi, khóa message, đường dẫn, routing key.

---

## 11. Thư viện

Được thêm (scope test):
- `org.springframework.modulith:spring-modulith-starter-test`
- `com.tngtech.archunit:archunit-junit5`
- `org.testcontainers` (`postgresql`, `rabbitmq`, `junit-jupiter`) nếu dự án chưa có hạ tầng test tương đương

Có sẵn, không cần thêm: HTTP Service Client (`spring-web`).

Không thêm: Spring Cloud OpenFeign, Redis, jMolecules, MapStruct, Lombok `@Setter` cho domain, hay bất kỳ thư viện nào khác.

---

## Phụ lục: báo cáo cuối mỗi phase

1. Đã làm gì (danh sách commit).
2. Test: số pass/fail, so với mốc; test đặc tả có thay đổi không, vì sao.
3. Code đã xóa.
4. Chỗ lệch khỏi plan và lý do.
5. Câu hỏi cần người dùng trả lời.

# Plan v2, Phase 6: schema mới, module `profile` và `kyc`

Ngày: 2026-10-30. Plan: [identity-service-refactor-plan.md](identity-service-refactor-plan.md) mục 4.3, 4.6, Phase 6. Nhánh `refactor/identity-v2`.

Đã duyệt:
- ĐIỂM DỪNG F: mọi DB hiện đều là dữ liệu seed, được phép drop, không cần chuyển dữ liệu.
- Quyết định G1: thêm `kycVerified` vào các response trạng thái; `nfcVerifiedAt` thành `null`.

ĐIỂM DỪNG G2 (tên sự kiện `nfc_*`) còn chờ trả lời, xem mục 7.

## 1. Schema

Migration `V2026_10_30_1000__profiles_hold_kyc.sql`:
- `DROP TABLE legal_profiles`. Dữ liệu KYC cũ bị bỏ chứ không chép sang (ĐIỂM DỪNG F).
- `user_profiles` đổi tên thành `profiles`, đổi tên cả `profiles_pkey` và `fk_profiles_account`; bỏ `avatar_key`.
- Thêm các cột:
  - `kyc_verified boolean NOT NULL DEFAULT false`;
  - `legal_name varchar(100)`, `id_number_hash varchar(64)`, `id_hash_key_ver integer`, `id_number_masked varchar(12)`.
- Thêm hai ràng buộc:
  - `uk_profiles_id_number_hash`: BR-23;
  - `ck_profiles_kyc_complete`: bốn cột pháp lý cùng null trước KYC, cùng có sau KYC.

Seed:
- `R__seed.sql` ghi lại KYC cho ba tài khoản mẫu (…0001, …0004, …0005). Số CCCD được băm bằng `hmac(…, '${id_hash_pepper}', 'sha256')` của pgcrypto.
- Placeholder Flyway `id_hash_pepper` lấy từ `ID_HASH_PEPPER_V1`. Pepper rỗng thì bỏ qua phần KYC mẫu.
- Bỏ `nfc-profiles.json`, `NfcProfileSeeder` và cờ `app.seed.enabled`.

## 2. Đã làm

**`profile`:**
- Gốc module:
  - `ProfileApi`: `create`, `findFullName`, `findKyc`, `completeKyc`;
  - `ProfileError` (`USER_002`, giữ mã và khóa message);
  - value object `FullName`, `LegalName`, `IdNumberHash`, `MaskedIdNumber`, `LegalIdentity`;
  - `KycCompletion`, `IdNumberTakenMeanwhile`.
- `domain/Profile`: entity giàu hành vi; `completeKyc` chỉ chạy được một lần.
- `application/`:
  - `CreateProfile`, `CompleteKyc` (khóa dòng, kiểm mã băm, `flush`), `ProfileQueries`, `ProfileFacade`;
  - `GetMyAccount` cho `GET /api/accounts/me`.
- `infrastructure/`: `JpaProfileRepository`, `ProfileValueConverters`, `MeController`, `MyAccountResponse`.

**`kyc`:**
- Gốc module: `KycError` (`NFC_001` → `NFC_005`, giữ mã và khóa message).
- `domain/`: `CitizenId`, `KycRules`, `KycLockout`, `KycReasonCode`, `KycResult`, `KycStatus`. Riêng NFC nằm ở `domain/nfc/`: `NfcSession`, `NfcSessionId`, `NfcCardFields`, `NfcCard`, `NfcCardRules`.
- `application/`:
  - use case `CreateNfcSession`, `GetNfcSession`, `SubmitNfcCard`, `ExpireNfcSessions`, `GetKycStatus`, `CheckIdNumber`;
  - port `NfcSessionStore`, `KycAttemptStore`, `CardPayloadDecryptor`, `IdNumberHasher`, `KycEvents`.
- `infrastructure/`:
  - adapter RAM: `InMemoryNfcSessionStore`, `InMemoryKycAttemptStore`;
  - adapter crypto: `JweCardPayloadDecryptor`, `HmacIdNumberHasher`;
  - `OutboxKycEvents`, `KycVerificationEvent`, `NfcSessionCleanupJob`, `KycProperties`, `KycConfig`;
  - `NfcController`, `InternalKycController`.

**Module khác:**
- `auth` dùng `ProfileApi`: `Session.fullName` và `RegisterAccount.Command.fullName` có kiểu `FullName`; request đăng ký parse bằng `FullName::parse`.
- `account`: bỏ `requireExists`.
- `LegacyError` chỉ còn `ADDRESS_NOT_FOUND`.

## 3. Test

- **Test mới hoặc viết lại:**
  - `domain`: `KycLockoutTest`, `CitizenIdTest`, `NfcCardRulesTest`, `ProfileTest`.
  - Use case:
    - `SubmitNfcCardTest`: 17 kịch bản của `NfcServiceImplTest` cũ, chạy với store thật và `MovableClock`;
    - `NfcSessionUseCasesTest`, `KycQueriesTest`, `GetMyAccountTest`.
  - Adapter:
    - `InMemoryNfcSessionStoreTest`, `InMemoryKycAttemptStoreTest`;
    - `HmacIdNumberHasherTest`: có giá trị đối chiếu cố định, cùng thuật toán với seed;
    - `JweCardPayloadDecryptorTest`;
    - `JpaProfileRepositoryIntegrationTest`: đọc ghi value object; khóa duy nhất ném `IdNumberTakenMeanwhile`; CHECK chặn KYC thiếu cột.
- **Test viết lại bắt được hai lỗi trong code mới, đã sửa:**
  - `NfcCardRules`: giới tính `null` ném `NullPointerException`, vì `Set.of(...).contains(null)` ném lỗi. Đã sửa: trả `BAD_FORMAT`.
  - Test song song của `InMemoryNfcSessionStore` đếm phiên trước khi mọi luồng chạy xong. Đây là lỗi của test, không phải của store.
- **Test đặc tả:**
  - Chỉ 9 snapshot của G1 đổi:
    - `kyc/status-{verified,not-verified,locked}`;
    - `internal/status-{verified,not-verified}`;
    - `internal/check-{match,other-number,not-verified,hash}`.
  - Mỗi file đổi đúng hai chỗ: thêm `kycVerified`, và `nfcVerifiedAt` thành `null`.
  - SQL kiểm DB trong `AccessContractTest` và `AuthContractTest` đổi sang `profiles`.
- **Kho ArchUnit:**
  - Các vi phạm của `LegalProfile`, `UserProfile`, `NfcProfileSeeder` đã hết.
  - Luật "entity không có method ghi công khai" đổi câu chữ (thêm `profile`, `kyc` vào danh sách module đã dựng lại), nên kho được ghi lại dưới id mới. Nội dung giữ nguyên (chỉ còn `Address`); file cũ đã xóa.
- `ErrorCodeCatalogTest` đã có `ProfileError` và `KycError`.

## 4. Code đã xóa

- `kyc/`, toàn bộ code cũ: `LegalProfile*`, `NfcService*`, `NfcAttemptTracker`, `NfcCardValidator`, `NfcLockout*`, `NfcProfileSeeder`, `NfcProperties`, `NfcTransportDecryptor`, `NfcVerificationEvent`, `PiiCipher`, `IdNumberHasher`, `IdCardConstant`, `Gender`, `dto/`…
- `profile/`: `UserProfile*`, `ProfileConstant`, `dto/`.
- `web/AccountController`, `web/KycController`.
- Cấu hình `nfc.pii-key`, `app.seed.enabled`; `db/seed/nfc-profiles.json`.
- Test: `PiiCipherTest`, các test cũ đã thay ở mục 3.

## 5. Lệch khỏi plan

| Chỗ | Plan | Đã làm | Lý do |
| --- | --- | --- | --- |
| Chuyển dữ liệu | Chép `legal_profiles` sang `profiles` | Drop, seed ghi lại bằng SQL | ĐIỂM DỪNG F. Seed SQL thay `NfcProfileSeeder` vì không còn mã hóa AES |
| `LegalIdentity` | `@Embeddable` | Record ở gốc, `Profile` giữ cột phẳng | Gốc module không được phụ thuộc JPA (`ModuleArchitectureTest`) |
| `KycRecord` | Có | Không có; `findKyc` trả `LegalIdentity` | Không còn `nfcVerifiedAt` nên không còn gì để bọc thêm |
| `completeKyc` | Ném lỗi khi trùng | Trả `KycCompletion`; ghi song song thì ném `IdNumberTakenMeanwhile` | Không phải thêm mã lỗi mới |
| `KycVerificationEvent`, routing key | Ở gốc, `KycRoutingKeys` | Ở `infrastructure/messaging`; hằng trong `OutboxKycEvents` | Payload dùng `KycReasonCode` của `domain`; gốc không được phụ thuộc vào đó |
| `KycLockoutPolicy`, `IdCardRules`, `Gender` | Riêng | Gộp vào `KycRules`, `NfcCardRules`/`NfcCard`; giới tính kiểm bằng tập giá trị | Giới tính không được lưu nữa |
| `ProfileApi` | `ProfileQueries` hiện thực | `ProfileFacade` | Giống `AccountFacade` |
| Khóa tuần tự hóa | Khóa dòng `accounts` | Khóa dòng `profiles` trong `CompleteKyc` | Dữ liệu KYC nằm ở `profiles` |
| Request kiểm số định danh nội bộ | `FieldParser` | Giữ Bean Validation | Snapshot `"must not be blank"` phải giữ nguyên |

## 6. Hành vi đổi ngoài snapshot

1. Gọi `/internal/accounts/check` với `idNumber` như `" - "` (không rỗng nhưng không có chữ số): trước trả `COMMON_400`, giờ trả `NFC_005`.
2. Gửi thẻ cho tài khoản không có hồ sơ: trả 404 `USER_002`. Thực tế không xảy ra, vì hồ sơ được tạo cùng lúc đăng ký.
3. `POST /api/nfc/sessions` không còn kiểm tài khoản có tồn tại không: token đã bảo đảm điều đó.
4. Một thẻ bị từ chối trong lúc tài khoản đang khóa không được đếm thêm. Hai thẻ song song cùng chạm ngưỡng (hiếm) có thể gửi hai sự kiện `nfc_locked`.

## 7. Việc cần làm ngoài code identity

- **DB dev:** Flyway chạy migration mới bình thường, nhưng KYC cũ bị mất. Muốn có KYC mẫu thì đặt `ID_HASH_PEPPER_V1` trước khi khởi động identity.
- **Biến môi trường không còn dùng** (chưa sửa, vì không được đụng file môi trường):
  - `docker-compose.yml:239` `APP_SEED_ENABLED=true`;
  - `docker-compose.yml:257` `PII_ENC_KEY_V1`;
  - `.env.example:65` `PII_ENC_KEY_V1=`.
- **vendor-service** (`VendorServiceImpl.java:367`) coi `check.nfcVerifiedAt() == null` là "chưa xác minh". Từ Phase 6, identity luôn trả `null`, nên trên nhánh này vendor sẽ coi mọi chủ cửa hàng là chưa xác minh, cho tới khi vendor đọc `kycVerified`.
- **ĐIỂM DỪNG G2:** sự kiện vẫn mang tên `account.nfc_verified`, `nfc_failed`, `nfc_locked`.

## 8. Kết quả build

`./mvnw -pl identity-service -am clean verify`: BUILD SUCCESS, **372 test xanh**, 0 skip, checkstyle và spotless qua (2026-10-30).

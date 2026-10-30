# Plan v2, Phase 7: module `address`

Ngày: 2026-10-30. Plan: [identity-service-refactor-plan.md](identity-service-refactor-plan.md) mục 4.4, Phase 7. Nhánh `refactor/identity-v2`.

ĐIỂM DỪNG D đã chốt: **giữ nguyên quy tắc.** Xóa địa chỉ mặc định thì sổ địa chỉ không còn địa chỉ mặc định nào; không tự đẩy địa chỉ khác lên.

## 1. Đã làm

**Gốc module:** `AddressError` (`ADDRESS_001`, giữ mã và khóa message). Không module nào khác gọi vào `address`, nên gốc chỉ có mã lỗi.

**`domain/`:**
- `AddressBook`: aggregate, không có bảng riêng. Giữ mọi quy tắc về địa chỉ mặc định:
  - tối đa một địa chỉ mặc định;
  - địa chỉ đầu tiên tự thành mặc định;
  - khi sửa: `isDefault` là `true` thì lấy cờ mặc định, `false` thì bỏ cờ, `null` thì giữ nguyên;
  - xóa địa chỉ mặc định thì sổ không còn mặc định;
  - địa chỉ của tài khoản khác không nằm trong sổ.
- `AddressEntry`: entity của bảng `addresses`. Cờ mặc định chỉ đổi qua `AddressBook`.
- Value object:
  - `DeliveryContact` = `Recipient` + `DeliveryLocation`, cả ba là record `@Embeddable` và map vào các cột hiện có;
  - `Province` (mã + tên chính thức, lấy từ danh mục quốc gia), `RecipientName`, `WardName`, `StreetDetail`, `AddressLabel`, `DeliveryArea`, `AddressId`.

**`application/`:**
- Use case `AddAddress`, `EditAddress`, `RemoveAddress`, `AddressQueries`.
- Port `AddressBookRepository`.
- Id của địa chỉ mới lấy từ `IdGenerator`, không do JPA sinh.

**`infrastructure/`:**
- `JpaAddressBookRepository`:
  - `load` lấy `pg_advisory_xact_lock(1, hashtext(account_id))`, nên hai request của cùng tài khoản phải xếp hàng;
  - không còn khóa dòng `accounts`.
- `AddressValueConverters`.
- Web: `AddressController` (chuyển từ `web/` vào module), `AddressRequest`, `AddressResponse`:
  - request parse bằng `FieldParser`, không còn Bean Validation;
  - `provinceName` client gửi lên vẫn được nhận nhưng bị bỏ qua (quyết định C3).

**Ngoài module:**
- `account`: bỏ `AccountApi.lockForUpdate` và `AccountRepository.lock`, nên `AccountApi` không còn gì liên quan đến khóa dòng.
- Bỏ các phần chuyển tiếp không còn ai dùng:
  - `LegacyError` (cả file);
  - `RequestText`;
  - `Email.of`, `PhoneNumber.of`, `PhoneNumber.isValid`, `PhoneNumber.REGEX`.
- Bỏ package `web/`: không còn controller nào nằm ngoài module.

## 2. Test

- **Test mới:**
  - `AddressBookTest`: quy tắc mặc định khi thêm, sửa, xóa; id lạ; địa chỉ của tài khoản khác.
  - `AddressValuesTest`: tên tỉnh lấy từ mã; mã lạ; độ dài các trường; `oneLine`; `AddressId` không phải UUID.
  - `JpaAddressBookRepositoryIntegrationTest`:
    - value object được ghi rồi đọc lại đúng như cũ;
    - khóa advisory chạy được trên Postgres;
    - chuyển cờ mặc định khi thêm và khi sửa đều không vi phạm `ux_addresses_one_default_per_account`;
    - xóa địa chỉ.
- **Test đặc tả address: không đổi snapshot nào.** Mọi kết quả của tạo, sửa, xóa, liệt kê, cùng các lỗi 400 (đủ danh sách trường) và 404, đều y như cũ.
- **Test kiến trúc:**
  - `ComponentArchitectureTest` bị xóa. Không còn component cũ nào, nên 5 luật của nó không còn class nào để kiểm. Riêng luật "entity không phụ thuộc Spring Security" chuyển sang `DomainModelArchitectureTest`.
  - `DomainModelArchitectureTest`:
    - bỏ luật cho `*Mapper`, cho `*ServiceImpl` và cho method ghi công khai của module chưa dựng lại. Hai tên hậu tố đó đã bị `ModuleArchitectureTest` cấm;
    - ba luật về constructor và builder không còn vi phạm nào, nên chuyển từ luật đóng băng thành luật thường.
  - Kho ArchUnit chỉ còn đúng một luật đóng băng: 2 lần gọi `Instant.now()` trong `ApiResponse`.
- Xóa test cũ: `AddressServiceImplTest`, `AddressRepositoryIntegrationTest`, `ValidationMessagesTest` (phần Bean Validation của address), các test cho `lock`/`lockForUpdate`, `Email.of`, `PhoneNumber.of`/`isValid`/`REGEX`.

## 3. Lệch khỏi plan

| Chỗ | Plan | Đã làm | Lý do |
| --- | --- | --- | --- |
| Port | `load`, `save(AddressBook)` | `load`, `list`, `add`, `remove`, `flush` | Thứ tự ghi quan trọng (mục 4): phải ghi các thay đổi cũ trước, rồi mới thêm dòng mới. `list` dùng để đọc mà không giữ khóa |
| Vi phạm `ux_addresses_one_default_per_account` | Dịch thành mã lỗi mới | Chưa dịch; vẫn ra 500 như trước | Có khóa advisory nên thực tế không xảy ra. **Mã đề xuất:** `ADDRESS_002`, 409, `error.address.default_conflict` ("Địa chỉ mặc định vừa được đổi ở nơi khác, vui lòng thử lại."). Chờ duyệt |
| `Province` | Value của `com.moonkage.reference.Province` | Record `@Embeddable` (mã + tên lúc lưu) | Tên được chụp lại lúc lưu, nên địa chỉ không đổi khi danh mục đổi tên tỉnh |

## 4. Ghi chú kỹ thuật

- Partial unique index được kiểm theo từng dòng, nên phải ghi `false` cho địa chỉ mặc định cũ trước khi ghi `true` cho địa chỉ mới:
  - **Thêm:** Hibernate chạy lệnh insert trước lệnh update, nên `add` gọi `flush` trước `persist`.
  - **Sửa:** sổ được đọc với địa chỉ mặc định đứng đầu. Hibernate ghi các update theo thứ tự entity được đọc, nên cờ cũ luôn được xóa trước.
  - Cả hai trường hợp đều có test tích hợp và test đặc tả.
- `pg_advisory_xact_lock(int, int)`: số `1` ở khóa đầu dành riêng cho sổ địa chỉ, để không trùng với khóa advisory của việc khác nếu sau này có.

## 5. Hành vi đổi ngoài snapshot

1. Thêm địa chỉ cho một tài khoản không tồn tại không còn trả 404 `ACCOUNT_001`, mà vi phạm khóa ngoại và ra 500. Thực tế không xảy ra, vì token đã bảo đảm tài khoản tồn tại.
2. Id địa chỉ viết hoa trong URL: thông báo 404 giờ in id dạng chữ thường (`AddressId.toString`).

## 6. Kết quả build

`./mvnw -pl identity-service -am clean verify`: BUILD SUCCESS, **363 test xanh**, 0 skip, checkstyle và spotless qua (2026-10-30). Ít hơn Phase 6 (372) vì bỏ các test của component cũ và của phần chuyển tiếp đã xóa.

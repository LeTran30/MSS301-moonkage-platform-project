# common-reference (thư viện danh mục tham chiếu)

> **Đây không phải service.** `common-reference` là một **thư viện Java** (`api/common-reference`) được các service cần danh sách tỉnh nhúng vào dependency. Nó không chạy, không có cổng riêng, không có database, không có Dockerfile và không có health endpoint. Tài liệu này mô tả **API của thư viện**.

Thư viện chứa **một** enum: `Province` — 34 đơn vị hành chính Việt Nam theo Quyết định 19/2025/QĐ-TTg (hiệu lực 01/07/2025), mỗi đơn vị có mã 2 số quốc gia. Mọi service lưu `province_code` đều kiểm mã đó vào danh sách này (A-18).

- Quyết định liên quan: A-18 (mã tỉnh), P-07 (bảng `provinces` của catalog), L-15 (vùng giao là danh sách tỉnh); xem [../../architecture/api-db/README.md](../../architecture/api-db/README.md).

## Trách nhiệm

**Có trách nhiệm**

- Giữ **một** danh sách 34 đơn vị hành chính với mã 2 số và tên chính thức, để mọi service kiểm `province_code` giống hệt nhau.
- Cung cấp tra cứu theo mã (`fromCode`) và kiểm tra mã có hợp lệ không (`isKnown`).

**Không có trách nhiệm**

- Không lưu danh sách tỉnh trong database của thư viện (thư viện không có database). `catalog-service` giữ cùng các dòng đó trong bảng `provinces` (`db/migration/R__provinces.sql`); một test giữ hai danh sách bằng nhau.
- Không cung cấp danh sách huyện/xã — chỉ cấp tỉnh/thành phố.
- Không phục vụ tra cứu tỉnh qua API; service tự validate ở tầng nghiệp vụ.

## Cách phụ thuộc

Tọa độ Maven: `com.moonkage:common-reference:0.0.1-SNAPSHOT` (module `api/common-reference`, cha là `com.moonkage:api`). Service khai báo trong `pom.xml` của mình:

```xml
<dependency>
    <groupId>com.moonkage</groupId>
    <artifactId>common-reference</artifactId>
    <version>${project.version}</version>
</dependency>
```

Module này là **library jar** (`spring-boot.repackage.skip=true`) và **không phụ thuộc** gì ngoài JDK — nó là jar thuần, nhẹ nhất trong bốn thư viện `common-*`.

## API của thư viện

Package gốc `com.moonkage.reference`. Không có bean, không có auto-configuration, không có cấu hình.

| Thành phần | Mô tả |
|---|---|
| `Province` | Enum 34 hằng: mỗi hằng mang `code` (2 số) và `officialName` (tên trong quyết định). |
| `Province.fromCode(String)` | `Optional<Province>` — tỉnh theo mã, rỗng nếu mã không có trong danh sách. |
| `Province.isKnown(String)` | `boolean` — mã có hợp lệ không. |
| `Province.getCode()` / `Province.getOfficialName()` | Mã 2 số (`"79"`) và tên chính thức (`"Thành phố Hồ Chí Minh"`). |

## Ai đang dùng

| Service | Dùng để | Call site thật |
|---|---|---|
| identity-service | validator cho `province_code` của địa chỉ | `api/identity-service/src/main/java/com/moonkage/identity/address/ProvinceCodeValidator.java:18` — `Province.isKnown(value)` |
| vendor-service | kiểm mã tỉnh trong vùng giao của người bán | `api/vendor-service/src/main/java/com/moonkage/vendor/common/vo/ProvinceCode.java:16` — `Province.isKnown(trimmed)` |
| quotation-service | kiểm mã tỉnh trong địa chỉ giao của yêu cầu báo giá | `api/quotation-service/src/main/java/com/moonkage/quotation/service/impl/QuoteRequestServiceImpl.java:181` — `Province.isKnown(delivery.provinceCode())` |
| catalog-service | kiểm mã tỉnh khi đọc bản đọc sản phẩm | `api/catalog-service/src/main/java/com/moonkage/catalog/service/impl/ProductReadServiceImpl.java:166` — `Province.isKnown(provinceCode)` |

## Cấu hình

Thư viện không đọc cấu hình nào.

## Chạy và kiểm thử

Thư viện không chạy riêng. Kiểm thử:

```bash
cd api
./mvnw -pl common-reference -am clean verify
```

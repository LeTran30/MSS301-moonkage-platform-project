# Nhận xét: tính đúng đắn theo từng tầng của vendor-service

> **Trạng thái:** nhận xét (2026-10-26), sau giai đoạn 3 của [completion-plan.md](completion-plan.md), trên nhánh `feat/vendor-foundation`. Chỉ xét component `vendor` (gồm vùng giao, hồ sơ nhận đặt hàng) và `registrationfee`.

## Câu hỏi

Có đúng là đã đạt được chuỗi bảo đảm sau không?

1. **Thuộc tính:** mỗi giá trị tự đảm bảo nó đúng (value object).
2. **Class:** mỗi entity tự đảm bảo trạng thái của nó đúng, chỉ dựa vào thuộc tính đã đúng.
3. **Service:** mỗi service đảm bảo các entity nó dùng đúng *khi đặt cạnh nhau*: quyền, khóa, quan hệ giữa các entity.
4. **Use case:** một luồng nghiệp vụ đầu cuối (HTTP hoặc sự kiện) đảm bảo các service ghép lại cho kết quả đúng: transaction, sự kiện, lặp lại, lỗi.

Mỗi tầng chỉ phải lo phần của mình nếu tầng dưới đã giữ phần của nó. Chỗ nào một luật của tầng dưới bị đẩy lên tầng trên, thì tầng dưới chưa tự đúng: ai gọi nó mà quên luật đó sẽ tạo ra dữ liệu sai.

## Kết luận ngắn

| Tầng | Đánh giá | Ý chính |
| --- | --- | --- |
| Thuộc tính | **Phần lớn đạt** | Mọi trường có luật định dạng đều là VO, tự kiểm trong constructor. Còn vài trường "chữ tự do" và `leadTimeDays` chưa có VO, độ dài chỉ được chặn ở DTO, có chỗ chưa chặn. |
| Class | **Đạt một phần** | Máy trạng thái của `Vendor` đóng kín, không setter. Nhưng một số bất biến của class nằm ở service: khóa phải có lý do, quyết định không duyệt phải có lý do, phải bán ít nhất một kiểu, điều khoản đặt hàng khớp nguồn hàng. |
| Service | **Đạt, dựa vào quy ước** | Quyền và khóa gom về `VendorFinder`; điều kiện giữa các entity được kiểm đủ. Nhưng "mọi thay đổi aggregate phải khóa vendor rồi phát bản chụp" là quy ước, không có gì trong code ép buộc. |
| Use case | **Đạt cho các luồng hiện có** | Transaction + outbox + inbox cho mỗi luồng; gọi dịch vụ ngoài trước khi khóa. Sự đúng đắn ở tầng này được chứng minh bằng test tích hợp, không bằng cấu trúc. |

Câu trả lời ngắn: **chưa hoàn toàn**. Tầng thuộc tính và tầng use case khá chắc. Hai tầng giữa còn "rò": một số bất biến của class được giữ ở service, và một số bất biến của aggregate được giữ bằng quy ước gọi hàm theo đúng thứ tự.

## 1. Thuộc tính (value object)

### Đã đảm bảo

- Các VO là `record` tự chuẩn hóa và kiểm trong constructor, ném `AppException(ErrorCode)`:
  - chung: `ProvinceCode`, `Price`, `Quantity`, `PriceTier`, `PriceTiers`;
  - riêng vendor: `TaxCode`, `RepresentativeName`, `IdNumber`, `BankAccountNumber`, `DeliveryFee`, `DeliveryAreas`.
- Không tạo được một giá trị sai: entity giữ VO (qua `@Converter(autoApply = true)`), nên đọc từ DB lên cũng đi qua constructor. Dữ liệu cũ sai sẽ lộ ra ngay khi nạp, không âm thầm lan đi.
- VO tập hợp giữ luật của cả tập:
  - `PriceTiers`: không có phần tử null, không trùng `fromQty`, luôn xếp tăng dần;
  - `DeliveryAreas`: không rỗng, không trùng, xếp theo mã.
- Dữ liệu nhạy cảm chỉ tồn tại ở dạng đã xử lý: `HashedIdNumber`, `EncryptedBankAccountNumber`. Số đầy đủ không đi vào entity.

### Chưa đảm bảo

| Trường | Hiện tại | Hệ quả |
| --- | --- | --- |
| `OrderProfile.leadTimeDays` | `int`, chỉ `@PositiveOrZero` ở `SaveOrderProfileRequest` | Lớp trong gói gọi `OrderProfile.of` với số âm thì chỉ CHECK của DB (`ck_order_profiles_min_qty`) chặn, và lỗi ra là 500. Nên có VO `LeadTimeDays` (≥ 0). |
| `packagingTypes`, `distributedBrands` | `String`, cột `varchar(255)`, **request không có `@Size`** | **Lỗi thật:** gửi chuỗi dài hơn 255 ký tự ra lỗi DB → 500 thay vì 400 tại trường. Cần `@Size(max = VendorConstant.TEXT_MAX_LENGTH)` hoặc một VO chữ có giới hạn. |
| `businessName`, `address` | `String`, độ dài chặn bằng `@Size` ở `SubmitVendorRequest` | Đúng qua HTTP, nhưng `VendorProfile` vẫn nhận chuỗi rỗng hoặc dài nếu được dựng từ chỗ khác. Lý do tồn tại của VO là luật không phụ thuộc lối vào. |
| `representativeIdHash`, `representativeIdKeyVer`, `representativeIdMasked` | ba cột rời trong `Vendor` | Tính nhất quán của bộ ba chỉ nhờ `apply(profile)` gán cùng lúc. Nên là một `@Embeddable` (như `BankAccount`) để không thể có hash của số này đi với số đã che của số khác. |
| `earlyBirdOffer` | `String` tự do, cột `text` | Chấp nhận được: là thông tin tham khảo (Q-20). |

## 2. Class (entity và bất biến của nó)

### Đã đảm bảo

- **Không có setter.** Trạng thái chỉ đổi qua hành vi có tên nghiệp vụ:
  - `Vendor`: `register`, `resubmit`, `decide`, `lock`, `changeLocalDeliveryFee`, `recordRegistrationFee`;
  - `OrderProfile`: `of`, `replace`;
  - `RefPriceTier`: `changeUnitPrice`.
- **Máy trạng thái đóng.** Mọi bước chuyển đi qua `moveTo` → `VendorStatus.canTransitionTo`:
  - `PENDING` → `APPROVED | NEEDS_INFO | REJECTED`;
  - `NEEDS_INFO | REJECTED` → `PENDING`;
  - `APPROVED` → `LOCKED`;
  - `LOCKED` là trạng thái cuối.

  `VendorLockTest` và `VendorTest` kiểm điều này không cần Spring.
- **Luật suy ra nằm trong class:**
  - `canOperate()`, `isOwnedBy()`;
  - `checkRegistrationFeePayable()` (đã duyệt và chưa đóng);
  - `recordRegistrationFee` idempotent (lần hai trả `false`);
  - `checkSellingSettingsEditable()` (chỉ khi `APPROVED`).
- **Bản ghi lịch sử bất biến:** `VendorDocument`, `VendorOwnerCheck`, `VendorReview`, `DeliveryArea`, `RegistrationFeeConfig` là `@Immutable` và chỉ tạo qua factory.
- **`OrderProfile` giữ ràng buộc của chính nó khi thay bậc giá:** bậc nào giữ `fromQty` thì chỉ đổi giá, nên không đụng ràng buộc duy nhất.

### Chưa đảm bảo: bất biến của class đang nằm ở service

| Bất biến | Nên ở | Đang ở | Rủi ro |
| --- | --- | --- | --- |
| `LOCKED` phải có lý do (AC-46.2) | `Vendor.lock` | `VendorServiceImpl.lock` (`StringUtils.hasText`) | `vendor.lock(null)` chạy được, tạo vendor bị khóa không lý do. |
| `NEEDS_INFO`/`REJECTED` phải có lý do (AC-27.2) | `Vendor.decide` | `VendorServiceImpl.checkReview` | Như trên. |
| Bán ít nhất một kiểu (`sellsShop \|\| acceptsOrders`) | `VendorProfile` (constructor gọn) | `VendorServiceImpl.check` | Dựng `VendorProfile` ở chỗ khác (test, use case mới) có thể bỏ qua luật này. |
| Điều khoản đặt hàng khớp nguồn hàng (AC-35.2, AC-35.3) | `OrderTerms` (constructor gọn, nhận `SupplySource`) | `OrderProfileServiceImpl.toTerms` | Javadoc của `OrderTerms` ghi "checked … before it reaches the profile", tức là thừa nhận record không tự đúng. |
| Hồ sơ đặt hàng chỉ có khi vendor `acceptsOrders` | `Vendor` (hành vi quyết định có được có hồ sơ) | `OrderProfileServiceImpl.saveOrderProfile` | Hiện an toàn (xem mục 3). |

Đề xuất chung, rẻ nhất: đưa các kiểm tra này vào constructor gọn của record hoặc vào chính method của entity, và để service chỉ việc gọi. Mã lỗi và `atField` giữ nguyên: service bắt `AppException` rồi gắn tên trường, như cách đang làm với VO.

### Ranh giới aggregate

`DeliveryArea` và `OrderProfile` thuộc aggregate `Vendor`, nhưng `Vendor` không giữ chúng như trường. Chúng có repository riêng, nối bằng `vendorId`. Câu "changed only through the vendor" trong Javadoc vì vậy là **quy ước**. Điều giữ quy ước đó:

- entity và repository là package-private: chỉ code trong gói `vendor` chạm được (ArchUnit kiểm);
- service nào sửa chúng cũng gọi `VendorFinder.getForOwnerChange` → khóa vendor, tăng `version` → `checkSellingSettingsEditable()` → `announceUpdated`.

Đây là lựa chọn có chủ ý: không nạp cả cây khi chỉ đổi phí giao, và bản chụp vẫn đúng nhờ khóa trên `vendors`. Nhưng phải nói rõ là bất biến này **không do class giữ**.

## 3. Service (đúng khi đặt các entity cạnh nhau)

### Đã đảm bảo

- **Quyền gom về một chỗ:** `VendorFinder` có `get`, `getVisibleTo` (chủ hoặc admin), `getForOwnerChange` (chỉ chủ), `getForChange`. Ba service dùng chung, không còn bản sao kiểm quyền rải rác.
- **Khóa và phiên bản:** mọi thay đổi aggregate (nộp lại, duyệt, khóa, phí giao, vùng giao, hồ sơ đặt hàng, ghi phí đăng ký) nạp vendor qua `findForChange`, tức `EntityManager.lock(..., PESSIMISTIC_FORCE_INCREMENT)`. Hai thay đổi của một vendor nối tiếp nhau, và mỗi thay đổi, kể cả ở bảng con, có `sourceVersion` mới. Lỗi "entity đã nạp thì query khóa không tăng version" đã được test bắt và sửa.
- **Điều kiện giữa các entity được kiểm trước khi ghi:**
  - hồ sơ đặt hàng cần vendor `APPROVED` và `acceptsOrders`;
  - trường bắt buộc theo `supplySource` của vendor;
  - hóa đơn phí chỉ khi đã đóng phí;
  - không có hai vendor cho một chủ (ràng buộc duy nhất cộng `existsByOwnerAccountId`).
- **Thứ tự đổi một lượt:** `submit` / `resubmit` kiểm định dạng và gọi identity-service trước, rồi mới khóa vendor và ghi. Không có trạng thái nửa vời khi dịch vụ ngoài lỗi.
- **Bất biến xuyên entity được giữ gián tiếp bằng máy trạng thái.** Một vendor có hồ sơ đặt hàng hay vùng giao thì đã `APPROVED`, nên không bao giờ nộp lại được (`APPROVED` chỉ sang `LOCKED`). Vì thế hồ sơ đặt hàng không thể lệch với `supplySource` hay `acceptsOrders` mới. Đây là điểm đúng, nhưng **mong manh**: nếu sau này cho vendor đã duyệt sửa hồ sơ, hoặc thêm mở khóa, bất biến này vỡ mà không có test nào báo.

### Chưa đảm bảo

- **"Gọi `announceUpdated` cuối cùng" là quy ước.** Javadoc của `VendorSnapshotPublisher` nói vậy. Quên gọi hoặc gọi trước khi ghi xong bảng con thì catalog và quotation lệch với vendor-service, và chỉ test tích hợp phát hiện. Hướng làm chặt hơn:
  - một method của finder hoặc publisher nhận lambda thay đổi: khóa → đổi → phát (template method);
  - hoặc phát trong một `@TransactionalEventListener(phase = BEFORE_COMMIT)` theo id vendor đã khóa trong transaction.
- **Logic lặp lại ở ba nơi:** lấy danh sách mã tỉnh đã xếp (`DeliveryAreaServiceImpl.codesOf`, `VendorServiceImpl.toDetailResponse`, `VendorSnapshotPublisher`), và helper `atField` (hai service). Lặp lại chưa sai, nhưng là chỗ sẽ lệch nhau khi một nơi đổi luật. Nên để `DeliveryAreaRepository` hoặc một method trong gói trả `DeliveryAreas` (VO) và mọi nơi dùng nó.
- **`PaymentSucceededListener` ghi phí cho vendor ở bất kỳ trạng thái nào.** Ví dụ vendor bị khóa giữa lúc tạo link và lúc VNPay báo thành công. Kết quả vẫn đúng nghiệp vụ (tiền đã thu thì ghi; `canOperate` vẫn `false` vì `LOCKED`), nhưng đó là hệ quả, không phải quyết định được viết ra. Nên ghi rõ trong Javadoc của `recordRegistrationFee`.
- **`createRegistrationFeePayment` không khóa vendor.** Bấm hai lần tạo hai payment; payment-service hoàn tiền lần thành công thứ hai (P-03). Đúng nhờ service khác, nên cần được ghi lại như một phụ thuộc.

## 4. Use case (đầu cuối)

### Đã đảm bảo

- **Nguyên tử giữa dữ liệu và sự kiện:** mọi sự kiện ra đi qua outbox trong cùng transaction với thay đổi. Rollback thì không có sự kiện nào thoát ra.
- **Nhận sự kiện đúng một lần:** `payment.succeeded` đi qua `InboxService.markProcessed` (`processed_events`, propagation `MANDATORY`), và `recordRegistrationFee` lại idempotent: hai lớp chống lặp.
- **Thứ tự sự kiện:** `sourceVersion` tăng nghiêm ngặt theo từng thay đổi, nên bên nghe bỏ được bản cũ đến muộn (đã ghi vào `vendor.md`).
- **Mỗi use case có test tích hợp trên PostgreSQL thật:** `VendorApiIntegrationTest` (27), `RegistrationFeeIntegrationTest` (12), `VendorSettingsIntegrationTest` (13). Các test kiểm mã lỗi, trường lỗi, quyền 403, bản ghi outbox và `sourceVersion` tăng.

### Giới hạn

- **Tính đúng ở tầng này được *kiểm* bằng test, không được *đảm bảo* bằng cấu trúc.** Use case không có đối tượng riêng; nó là method của service cộng controller. Điều đó phù hợp với cỡ service hiện tại, nhưng nghĩa là luật "khóa → kiểm → đổi → phát" chỉ đúng chừng nào mỗi method mới được viết đúng và có test.
- **Các luồng xuyên service mới đúng ở một phía:**
  - catalog và quotation tiêu thụ `vendor.updated` chưa được kiểm;
  - payment-service chưa có `POST /internal/payments` và `payment.succeeded` (đang mock).

  Tính đúng đầu cuối của "khóa Shop thì sản phẩm biến mất" (tiêu chí xong của giai đoạn 3) **chưa được chứng minh**.
- **`Instant.now()` trong publisher** thay vì một `Clock` tiêm vào: không sai, nhưng test không cố định được `occurredAt`, và thời điểm của bản chụp có thể khác `decidedAt` của sự kiện duyệt đi cùng.

## Việc nên làm, theo thứ tự

1. **Sửa lỗi thật:** thêm `@Size` cho `packagingTypes` và `distributedBrands` (hoặc VO chữ có giới hạn), kèm test 400 tại trường.
2. **Đưa bất biến về class:**
   - `Vendor.lock` và `Vendor.decide` tự kiểm lý do;
   - `VendorProfile` tự kiểm "bán ít nhất một kiểu";
   - `OrderTerms` nhận `SupplySource` và tự kiểm AC-35.2 / AC-35.3.

   Service chỉ còn bắt lỗi và gắn tên trường.
3. **VO còn thiếu:** `LeadTimeDays`, và `@Embeddable` cho bộ ba số định danh đã băm.
4. **Ép quy ước thay đổi aggregate:** một chỗ duy nhất làm "khóa → đổi → phát bản chụp", và `DeliveryAreas` làm kiểu trả về chung cho danh sách tỉnh.
5. **Ghi lại các quyết định đang ngầm:**
   - ghi phí cho vendor đã khóa;
   - bất biến "hồ sơ đặt hàng khớp nguồn hàng" dựa vào máy trạng thái;
   - phụ thuộc vào P-03 của payment-service.

   Thêm một test đỏ ngay khi `APPROVED` có thêm bước chuyển mới (ví dụ test liệt kê đúng tập bước chuyển của `VendorStatus`).
6. **Kiểm đầu cuối với catalog** khi catalog nghe `vendor.updated` / `vendor.locked`.

Mục 1 nên làm trước khi commit giai đoạn 3. Mục 2 và 3 nhỏ và cục bộ, có thể làm cùng. Mục 4 nên làm trước giai đoạn 5 (ghi sản phẩm), vì giai đoạn đó thêm nhiều thay đổi phải phát sự kiện.

# Class Log: `QuoteRequestServiceImpl`

- **Package:** `com.moonkage.quotation.service.impl`
- **Tham chiếu:** FR-15, FR-16, FR-36, AC-15.2, AC-15.4, AC-15.5, AC-16.2 → AC-16.5, AC-36.3, BR-16, BR-20, BR-22, BR-23, BR-31
- **Dependencies:** `QuoteRequestRepository`, `RequestInvitationRepository`, `QuoteRepository`, `VendorSnapshotRepository`, `VendorDirectory`, `RequestAccessPolicy`, `IdentityClient`, `OutboxService`, `Clock`
- **Luật bất biến:**
  1. Không tạo yêu cầu khi người mua chưa xác minh NFC, kể cả gọi thẳng API.
  2. Không người bán nào do chính người mua làm chủ nhận được lời mời hay yêu cầu trực tiếp.
  3. Yêu cầu trực tiếp luôn có đúng một lời mời cho người bán đích; yêu cầu mở có ít nhất một lời mời, không có thì không tạo.
  4. Người không phải người mua, chủ người bán được mời hay quản trị thấy `REQUEST_NOT_FOUND`, như yêu cầu không tồn tại.

## 1. Danh mục Method

| Method | Input | Output | ErrorCode | Mục đích |
| --- | --- | --- | --- | --- |
| `create` | `accountId`, `CreateQuoteRequestRequest` | `QuoteRequestResponse` | `INVALID_PROVINCE`, `DELIVERY_DEADLINE_PASSED`, `NFC_NOT_VERIFIED`, `TARGET_VENDOR_REQUIRED`, `VENDOR_NOT_FOUND`, `SELF_DEALING`, `VENDOR_NOT_ACCEPTING_ORDERS`, `BELOW_MIN_QUANTITY`, `CUSTOM_NOT_SUPPORTED`, `NO_MATCHING_VENDOR` | Tạo yêu cầu và lời mời |
| `searchRequests` | `accountId`, `role`, `vendorId?` | `List<QuoteRequestResponse>` | `ACCESS_DENIED`, `VENDOR_NOT_FOUND` | Của mình, của Shop mình, hoặc tất cả (admin) |
| `getRequest` | `accountId`, `role`, `requestId` | `QuoteRequestResponse` | `REQUEST_NOT_FOUND` | Chi tiết; người bán thấy đơn giá gợi ý |
| `getInvitations` | `accountId`, `role`, `requestId` | `List<InvitationResponse>` | `REQUEST_NOT_FOUND` | Người bán chỉ thấy lời mời của mình |
| `updateInvitation` | `accountId`, `requestId`, `vendorId`, `UpdateInvitationRequest` | `InvitationResponse` | `INVALID_STATE_TRANSITION`, `ACCESS_DENIED`, `REQUEST_NOT_OPEN`, `INVITATION_NOT_FOUND`, `DECLINE_REASON_REQUIRED` | Từ chối kèm lý do |

## 2. Pseudocode

### `create(accountId, body)`
1. **[Guard]**
   - NẾU mã tỉnh không thuộc 34 tỉnh → `INVALID_PROVINCE`. NẾU hạn giao không sau hôm nay (giờ Việt Nam) → `DELIVERY_DEADLINE_PASSED`.
   - Gọi identity lấy trạng thái NFC. NẾU chưa VERIFIED → `NFC_NOT_VERIFIED`.
2. **[Chọn người bán]**
   - DIRECT: NẾU thiếu `targetVendorId` → `TARGET_VENDOR_REQUIRED`. Lấy bản sao người bán (không có → `VENDOR_NOT_FOUND`). NẾU người mua là chủ → `SELF_DEALING`. NẾU không nhận đặt hàng hoặc không `canOperate` → `VENDOR_NOT_ACCEPTING_ORDERS`. NẾU số lượng < tối thiểu → `BELOW_MIN_QUANTITY(minQty)`. NẾU có loại custom người bán không làm → `CUSTOM_NOT_SUPPORTED(loại)`.
   - OPEN: lấy mọi người bán nhận đặt hàng và `canOperate`; giữ người bán không do người mua làm chủ, tối thiểu ≤ số lượng, làm đủ các loại custom, giao tới tỉnh. Rỗng → `NO_MATCHING_VENDOR`.
3. **[Lưu & sự kiện]**
   - Tạo `QuoteRequest` (chép địa chỉ giao), `saveAndFlush`; tạo một `RequestInvitation` PENDING cho mỗi người bán đã chọn.
   - Outbox `request.created` với danh sách người bán được mời.
4. **[Trả]** Response với `invitedCount`, `quoteCount = 0`.

### `updateInvitation(accountId, requestId, vendorId, body)`
1. **[Guard]** NẾU `status ≠ DECLINED` → `INVALID_STATE_TRANSITION`. Người gọi phải là chủ `vendorId` → nếu không `ACCESS_DENIED`. Khóa dòng yêu cầu; NẾU không còn OPEN → `REQUEST_NOT_OPEN`. Không có lời mời → `INVITATION_NOT_FOUND`.
2. **[Nghiệp vụ]** `invitation.decline(reason)`: chỉ từ PENDING; lý do trống → `DECLINE_REASON_REQUIRED`.
3. **[Sự kiện]** Outbox `request.declined` cho người mua.

## 3. Ghi chú

- Ghép yêu cầu mở lọc trong Java trên danh sách người bán đang nhận đặt hàng: đủ nhanh ở quy mô demo và test được không cần DB. Khi số người bán lớn, chuyển điều kiện mảng (`delivery_areas`, `custom_capabilities`) xuống SQL.
- Gọi identity trước khi mở transaction ghi, để lỗi mạng không giữ khóa.

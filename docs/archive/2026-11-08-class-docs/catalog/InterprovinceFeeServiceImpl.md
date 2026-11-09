# Class Log: InterprovinceFeeServiceImpl

## 1. Thông tin chung và bất biến

- Package: `com.moonkage.catalog.service.impl`; FR-52, AC-52.3, A-18, NFR-05.
- Dependencies: InterprovinceFeeRepository, OutboxEventRepository, ObjectMapper, Clock; mapper chuyển domain rows sang record response.
- Chỉ ADMIN được thay bảng. Mỗi tỉnh có đúng một phí không âm, `long` VND. Không có phí không đồng nghĩa miễn phí. Fee và audit commit/rollback cùng nhau.
- Ghi JDBC dùng transaction Spring hiện tại; mọi writer phải khóa bộ province theo cùng thứ tự.

## 2. Method

| Method | Input | Output | Ngoại lệ | Mục đích |
| --- | --- | --- | --- | --- |
| replace | accountId, role, request | Bảng mới | CAT_001/002/003/004; lỗi serialization/DB | Thay toàn bộ bảng và enqueue audit |
| getTable | — | Bảng, complete | Lỗi DB | Trả cả tỉnh chưa cấu hình |
| getProvinceFee | provinceCode | Một dòng phí | CAT_005/006 | Trả giá hiện hành một tỉnh |

## 3. Luồng

### replace

1. Guard: thiếu account/role → CAT_002; role khác ADMIN → CAT_003. Khóa province theo code. Chặn row null, phí null/âm, mã trùng; đối chiếu tập mã input bằng đúng tập province, thiếu/thừa → CAT_004. Danh mục rỗng không được lưu.
2. Nghiệp vụ: đọc bảng cũ sau khóa; lấy thời điểm từ Clock; dựng toàn bộ phí mới cùng updatedBy/thời điểm; dựng before/after và eventId UUID.
3. Persistence/events: serialize event trước write; nếu thất bại thì không ghi. Upsert tất cả phí rồi insert outbox trong cùng transaction; lỗi bất kỳ rollback cả hai.
4. Response: trả bảng mới, thứ tự theo province; complete=true.

### getTable / getProvinceFee

1. Đọc danh mục tỉnh và phí hiện có.
2. Join bằng mã trong mapper; dòng chưa có phí giữ null; complete chỉ true khi mọi dòng có phí và danh mục không rỗng.
3. Không ghi DB hay phát sự kiện.
4. getProvinceFee tìm mã trong danh mục; không thấy → CAT_005; có tỉnh nhưng null fee → CAT_006; còn lại trả dòng.

## 4. Trường hợp biên và quyết định

- Lần lưu đầu chưa có dòng phí, nên khóa parent province thay vì chỉ lock bảng fee rỗng. Lần lưu thứ hai phải đọc before sau lần đầu commit.
- Không có revision/If-Match ở contract hiện tại: hai admin last-write-wins ở mức **nguyên bảng**, không trộn một phần mỗi bảng.
- Không sửa schema hay default phí production. Dev seed 45.000đ chỉ chạy khi bật `db/seed`.
- Controller dùng Bean Validation và VndDeserializer để từ chối số lẻ/chuỗi/overflow trước service; service vẫn kiểm null/âm/tập mã cho caller khác.

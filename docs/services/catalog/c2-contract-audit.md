# C2: đối chiếu contract trước khi viết consumer

Đối chiếu ngày 26/10/2026, trên C1 `3cbb1ff`. Đã fetch và đọc thêm `origin/develop` tại `d211767`; không merge ref đó vì có thay đổi vendor/order/frontend và taxonomy ngoài scope C2. Các tham chiếu đường dẫn dưới đây là bản trong checkout, trừ khi ghi rõ ref remote.

## 1. Kết quả §5.1–§5.4 của kế hoạch

| Điểm | Bằng chứng đã xác nhận | Chưa được xác nhận / ảnh hưởng |
| --- | --- | --- |
| Product upsert | [API/DB vendor](../../architecture/api-db/vendor.md): vendor là writer; mỗi thay đổi kể cả stock phát `product.upserted` trong transaction. V2 catalog có các cột product, `image_keys text[]`, `price_tiers jsonb`, `source_version bigint`; chỉ áp version mới hơn | Không có producer/record/schema JSON trong vendor, kể cả `origin/develop`. Chưa biết full snapshot hay patch, tên/trường envelope, null có nghĩa gì, tiers dùng fromQty/unitPrice hay tên khác; chưa có quy tắc tăng version và giá trị version trong wire payload. Không tự viết DTO event từ tên cột DB |
| Product removed | Routing key, nguồn vendor theo [integration](../../architecture/api-db/integration.md), BR-24 cấm seller sửa/hiện lại sản phẩm bị gỡ. User yêu cầu tombstone trước upsert | Payload tối thiểu/id/version và quy tắc restore của quản trị chưa có. Core lưu tombstone/version nội bộ; không nhận removed wire payload do tự đặt |
| Vendor updated/locked | [Software Design §4.3](../../architecture/software-design.md) liệt kê vendor_id, owner, businessName, status, canOperate, sellsShop, deliveryAreas, localDeliveryFee…; V2 tách product/vendor và có source_version | `vendor.updated` là nguồn đầy đủ các trường snapshot theo Design, nhưng chưa có producer để xác nhận JSON envelope và version. `vendor.locked` full snapshot hay signal chưa chốt; không suy diễn từ `vendor.updated`. Core hỗ trợ thay trạng thái vendor đã chuẩn hóa/version-gated; chưa có adapter lock signal |
| Review created | Routing key từ order; V2 product_reviews có reviewId/productId/vendorId/rating/content/createdAt, PK reviewId, rating 1–5. Chỉ có created; FK không buộc product đã tồn tại | ReviewServiceImpl/ReviewController còn stub, không producer/JSON schema. Không tự quyết định envelope, cách hủy/sửa review, hay nguồn trường vendorId. Core dedup eventId và reviewId, giữ review trước product, không đặt adapter created chưa duyệt |

`integration.md` xác nhận exchange `moonkage.events`, routing keys và field `eventId`. Đây là phần wire duy nhất đủ để thu nhận inbox bền vững; chưa đủ để ACK **đã project**. Capture phải phân biệt received với processed.

Software Design cũ §5.4 vẫn ghi nguồn `product.removed` là catalog; API/DB L-18 mới ghi vendor. Dùng L-18 cho ownership, không chỉnh code service khác hay tự phát event thay vendor.

## 2. Vendor endpoint chưa có

Checkout chỉ có GET seller/vendor và GET internal/by-owner. `origin/develop:d211767` có VendorController mới cho hồ sơ/vùng giao/order-profile, nhưng **không có endpoint ghi sản phẩm thay thế**, không ProductService/ProductController, không producer product/vendor events. Interface VendorService remote mở rộng trong khi impl vẫn chỉ có findByOwnerAccountId; không dùng các khai báo trong docs như bằng chứng endpoint đã chạy.

Vì vậy giữ nguyên source writer, entity/repository legacy và 11 test ảnh cũ theo yêu cầu. Không chuyển writer sang DB vendor, không tạo lại các bảng đã bị V2 xóa, không thay `ddl-auto: validate`.

**Đã được Lê Trần cho phép trong phiên C2:** cô lập legacy vào profile riêng `legacy-writer`, giữ code và tests, mặc định chạy read model V2. Không xóa writer hay chuyển nó sang DB khác. Profile legacy không tương thích V2, không dùng để phục hồi bảng đã xóa. Không coi một JPA slice chỉ có entity mới là bằng chứng toàn catalog startup; bổ sung test full SpringBootTest với migration thật và validate.

## 3. Phạm vi an toàn để triển khai độc lập

- Entity `ProductListing` @Immutable và repository chỉ đọc, bám đúng view V2 của checkout. Không map writable vào view hoặc khôi phục bảng legacy.
- Projection core nhận **row nội bộ đã chuẩn hóa**, không phải DTO event wire. Tên field/type lấy từ schema V2. Adapter từ event wire vào row này chưa được nối khi contract chưa duyệt.
- Transactional eventId claim, version gate native PostgreSQL, tombstone removal, reviews độc lập product và aggregate, vendor state tách product. Tests core dùng input nội bộ, không tuyên bố là contract test của producer.
- Inbox kỹ thuật lưu payload raw JSON theo eventId/routing key đã xác nhận; chưa project thì không thêm processed_events. Capture/replay source không thay thế consumer nghiệp vụ.
- Chỉ rebuild được phần đã biết nguồn (rating từ reviews). Full replay/rebuild projection từ event cần adapter/snapshot/replay feed của producer; không tạo API nguồn giả hoặc xóa processed_events/tombstone để “rebuild”. Lê Trần xác nhận chưa có contract được duyệt ngoài repo và yêu cầu chỉ làm phần đã xác nhận.

## 4. Chờ nhóm cung cấp trước khi bật business adapter

1. Payload mẫu và schema đã duyệt cho cả năm routing keys; product full/patch và null semantics; trường ảnh/tiers; version bigint tăng cùng transaction, dùng chung stream lock/update của vendor.
2. Removed tối thiểu phải có product identity + source version; quy tắc nếu có restore admin. Locked full state hay signal, xử lý lock trước snapshot đầu.
3. Review created đủ identity/rating/time; xác nhận immutable review và cách xử lý reviewId trùng nhưng nội dung khác.
4. Nguồn replay/rebuild đủ lịch sử hoặc full snapshot có checkpoint/watermark; không dùng clock/timestamp làm sourceVersion.
5. Vendor product endpoints chạy thật trước gỡ writer catalog. Orchestrator adapter/dedup cho `interprovince_fee.changed` vẫn là blocker audit C1 E2E, không sửa ở C2.

Remote L-19 đã chọn vendor sở hữu taxonomy và mã crust/filling. Không đưa migration taxonomy remote vào nhánh C2; cần đối chiếu lại C3 sau này, không tiếp tục dùng đề xuất owner taxonomy catalog trong C1 như quyết định đã chốt.

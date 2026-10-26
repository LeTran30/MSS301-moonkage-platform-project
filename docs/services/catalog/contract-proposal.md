# Đề xuất contract catalog — cần nhóm duyệt

**ĐỀ XUẤT, CHƯA ĐƯỢC NHÓM DUYỆT.** Ngày 26/10/2026, sau Phase A/B trên `feat/catalog-service`. Tài liệu này không cấp phép bật adapter, đổi schema thêm hoặc bắt đầu Phase D. Chỉ Lê Trần xác nhận **“contract đã được nhóm duyệt”** mới mở gate D; ghi lại commit tài liệu, các chỉnh sửa được duyệt, người duyệt và thời điểm ở đầu báo cáo D.

## 1. Phần đã xác nhận và phần đang đề xuất

| Đã có trong repo/quyết định | Chưa được duyệt trong tài liệu này |
| --- | --- |
| [L-18/L-19](../../architecture/api-db/decisions.md): vendor ghi sản phẩm và sở hữu từ điển taxonomy; catalog giữ projection và mã crust/filling | Schema wire đầy đủ, version/envelope/null semantics, tiers và adapter |
| [Integration](../../architecture/api-db/integration.md): exchange moonkage.events, keys product.upserted/removed, vendor.updated/locked, review.created, eventId/dedup/outbox | Full snapshot hay patch, locked full/signal, revision/correction review, replay feed/checkpoint |
| Migration catalog đã merge: product_views, vendor_snapshots, product_reviews, processed_events và arrays/jsonb; 34 mã tỉnh | Bổ sung acceptsOrders vào read model, cơ chế restore/rebuild generation, contract tests producer-consumer |
| [API/DB vendor](../../architecture/api-db/vendor.md): root /api/cake-attributes; crustCodes/fillingCodes, seed/code và validation L-19 | Bản triển khai endpoint và producer chạy thật; tài liệu API không đồng nghĩa code đã hoàn thành |

Phase A đã nhận develop `6523d00`, giữ nguyên migration `V2026_10_22_1510` theo ngoại lệ Lê Trần cho phép. Không tự sửa migration đó. Phase B chỉ có raw inbox capture/recovery skeleton, **không có adapter nghiệp vụ production**. Xem [audit C2](c2-contract-audit.md) và [báo cáo A–C](phase-abc-report.md).

## 2. Envelope đề xuất v1

Mỗi sự kiện là JSON object UTF-8; AMQP contentType=application/json, messageId=eventId. Producer lưu payload/eventId vào outbox cùng transaction với mutation. Publish/retry giữ nguyên eventId và nội dung; không sinh ID mới mỗi lần retry.

| Field đề xuất | Bắt buộc | Quy tắc đề xuất |
| --- | --- | --- |
| eventId | Có | Chuỗi UUID, tối đa 64 ký tự theo inbox; duy nhất xuyên keys/services; immutable |
| schemaVersion | Có | Số nguyên 1 cho bản này; không đánh đồng với version nghiệp vụ |
| eventType | Có | Đúng routing key; kiểm so với receivedRoutingKey, không dùng field này tự route lại |
| sourceService | Có | vendor-service hoặc order-service theo ownership |
| aggregateType | Có | PRODUCT, VENDOR, REVIEW |
| aggregateId | Có | Product/vendor/review ID tương ứng, varchar(36) theo DB hiện tại |
| sourceVersion | Có | JSON integer trong miền long >=0, tăng đơn điệu theo **một aggregate**, không phải global sequence |
| occurredAt | Có | Instant UTC ISO-8601, thời điểm producer ghi sự kiện; dùng audit, không dùng để order/gate version |
| data | Có | Object theo type bên dưới; snapshot có đủ field, không suy diễn field thiếu thành null/0/false |

Envelope này là lựa chọn đề xuất; inbox hiện chỉ kiểm eventId và key. Không đổi capture để bắt buộc các field mới trước khi nhóm chốt. Adapter tương lai strict với field bắt buộc/type, duplicate JSON keys, tiền/version overflow; field mở rộng không ảnh hưởng nghiệp vụ có thể bỏ qua theo policy schemaVersion được duyệt. Không log payload raw; không phát thông tin giấy tờ/NFC/ngân hàng/credentials.

### Quy tắc version và xung đột

- Vendor/order tăng sourceVersion trong cùng transaction mutation/outbox. Dùng DB optimistic version hoặc câu UPDATE tăng version nguyên tử; lệnh stock native SQL cũng phải tăng, không bỏ qua vì không đi qua Hibernate. Không dùng occurredAt/updatedAt hay thời gian consumer làm version.
- Product và vendor có stream riêng. product v100 không so với vendor v3. vendor.updated và vendor.locked dùng **cùng** version của vendor aggregate, không có bộ đếm lock riêng.
- Chỉ áp snapshot có version mới hơn. Version bằng nhau/nội dung giống có thể skip; version bằng nhau nhưng nội dung khác là producer conflict cần giữ để điều tra. Core C2 hiện chỉ gate bằng version; phát hiện equal-version conflict/hash cần được hoàn thiện/test ở D sau khi canonicalization được duyệt.
- Cùng eventId khác key/payload là conflict; không ghi đè inbox cũ. Cùng reviewId không được tạo rating lần hai.
- Khuyến nghị mỗi mutation phát một event state cho aggregate: lock dùng vendor.locked full state, không cần thêm vendor.updated cùng mutation. Nếu nhóm cần cả hai, phải cùng version và state tương đương; adapter bỏ trùng state, audit không nhân đôi.

## 3. Khuyến nghị full snapshot cho state events

**Đề xuất:** product.upserted và vendor.updated/vendor.locked mang **full snapshot** các trường cần cho read model. Patch làm mất nghĩa của field thiếu/null, cần biết mọi version trung gian và dễ ghi đè khi out-of-order; snapshot cho phép nhận version mới nhất trước, gate bản cũ và bootstrap theo một model thống nhất. Payload hiện vừa phải, không chứa binary file (chỉ object keys).

Full snapshot không có nghĩa nhúng vendor vào product hoặc rating vào product: vẫn tách ownership P-05. Removed là terminal signal tối thiểu riêng vì có thể đến trước product; review.created là immutable fact riêng. Nếu nhóm chọn patch, **không dùng ngay core full-row của C2 để áp patch**: phải chốt patch op, null semantics, gap detection, source fetch/retry trước D.

## 4. product.upserted — đề xuất payload

Producer vendor-service. aggregateId = data.productId; sourceVersion ở envelope là version sản phẩm sau mutation, kể cả đổi tồn kho. Không yêu cầu sourceVersion lặp lại trong data.

| data field | Bắt buộc/nullable đề xuất | Nghĩa |
| --- | --- | --- |
| productId, vendorId | Có, nonblank <=36 | Vendor sở hữu sản phẩm; không đổi vendor của cùng productId |
| name, description | Có | Name nonblank <=255; description text; không suy từ brand/vendor |
| brand | Có, nonblank | Vendor áp BR-12: thuần bán lại nhập brand; còn lại bỏ trống thì source điền businessName trước phát event |
| origin | Field có, nullable | Hàng bán lại source phải kiểm nơi sản xuất; catalog không suy supplySource từ brand |
| piecesPerBox | Field có, nullable | Khi có là integer >0 |
| listPrice | Có | Long VND >0, đã gồm thuế, không float/string/số lẻ |
| stock | Có | Integer >=0, chỉ để hiển thị tham khảo; order vẫn reserve ở vendor |
| expiryDate | Có | ISO local date YYYY-MM-DD; không tự cộng giờ hoặc đổi múi giờ |
| deliveryLabel | Có | LOCAL hoặc NATIONWIDE |
| quoteThreshold | Field có, nullable | Khi có integer >0; ý nghĩa ngưỡng nguồn vendor kiểm theo acceptsOrders |
| status | Có | ON_SALE/HIDDEN/REMOVED |
| imageKeys | Có, array | Chuỗi object key có thứ tự, không public URL/presigned URL. Có thể [] khi source cho phép; source chịu validation ảnh. Không nhúng file |
| priceTiers | Có, array | [] nghĩa không có bậc giá; item đề xuất bên dưới |
| crustCodes, fillingCodes | Có, array | Mã taxonomy vendor đã validate; xem §8. Đây là “vỏ/shell”, chọn tên **crustCodes** theo L-19, không phát song song shellCodes gây mơ hồ |

Đề xuất item priceTiers: `{fromQty: integer >0, unitPrice: long VND >0}`; fromQty duy nhất, thứ tự tăng. Bậc hiệu lực là fromQty lớn nhất không vượt số lượng, không có bậc thì listPrice. Cần nhóm xác nhận giảm giá có bắt buộc đơn điệu, có bắt buộc fromQty=1 hay không; khuyến nghị không bắt buộc bậc 1 vì listPrice đã là fallback. C2 hiện bảo toàn opaque JSONB, **chưa diễn giải từ fromQty/unitPrice theo đề xuất này**.

Những field có thể null vẫn phải xuất hiện trong full snapshot. `imageKeys: []`, `priceTiers: []`, `origin: null` thay thế giá trị cũ; không có nghĩa “giữ nguyên” như patch. Không nhận ratingAvg/ratingCount, ownerAccountId, canOperate hay localDeliveryFee từ product event để ghi vào projection.

Ví dụ minh họa **chưa được duyệt** (ID là dữ liệu mẫu):

```json
{
  "eventId": "a6302000-0000-4000-8000-000000000001",
  "schemaVersion": 1,
  "eventType": "product.upserted",
  "sourceService": "vendor-service",
  "aggregateType": "PRODUCT",
  "aggregateId": "00000000-0000-4000-8000-000300000001",
  "sourceVersion": 7,
  "occurredAt": "2026-10-26T11:00:00Z",
  "data": {
    "productId": "00000000-0000-4000-8000-000300000001",
    "vendorId": "00000000-0000-4000-8000-000200000001",
    "name": "Hộp bánh mẫu",
    "description": "Hộp bốn bánh",
    "brand": "Thương hiệu mẫu",
    "origin": "Việt Nam",
    "piecesPerBox": 4,
    "listPrice": 100000,
    "stock": 12,
    "expiryDate": "2027-01-01",
    "deliveryLabel": "LOCAL",
    "quoteThreshold": null,
    "status": "ON_SALE",
    "imageKeys": ["products/sample/cover.png"],
    "priceTiers": [{"fromQty": 10, "unitPrice": 95000}],
    "crustCodes": ["banh-nuong"],
    "fillingCodes": ["dau-xanh", "trung-muoi"]
  }
}
```

## 5. product.removed — tombstone đề xuất

- Envelope PRODUCT/aggregateId/sourceVersion theo cùng stream product.upserted. data tối thiểu: `{productId, vendorId, status: "REMOVED"}`; reason/audit actor nếu cần do nhóm chốt, không bắt catalog dựng tên/giá/ảnh từ removed signal.
- Ghi tombstone khi chưa có product; nếu đã có, mark REMOVED theo version. Stale upsert không tạo lại; row REMOVED có từ trước được backfill tombstone bằng migration C2 đã có.
- Đề xuất removal là terminal cho productId theo BR-24: không khôi phục bằng upsert ON_SALE dù version lớn hơn; vendor tạo sản phẩm mới với ID khác nếu nghiệp vụ cho phép. Nếu nhóm muốn admin restore, phải có contract/quyền/event riêng, không suy diễn từ timestamp hay trạng thái ON_SALE bất kỳ.
- Producer không phát ON_SALE mới hơn cho sản phẩm đã terminal removed. Nếu dữ liệu vi phạm quy tắc này xuất hiện, giữ conflict để điều tra, không khẳng định delivery order sẽ tự giải quyết đúng. Hai event cùng version khác state là conflict (§2).
- Snapshot product.upserted mang status REMOVED cũng giữ tombstone; không cần business consumer phụ thuộc phải nhận đủ hai loại event.

## 6. vendor.updated / vendor.locked — đề xuất full snapshot

Envelope VENDOR, aggregateId=data.vendorId; cả hai keys dùng cùng sourceVersion. Các trường snapshot đề xuất: vendorId, ownerAccountId (nonblank <=36), businessName (nonblank), status (PENDING/NEEDS_INFO/APPROVED/REJECTED/LOCKED), canOperate (boolean), sellsShop (boolean), **acceptsOrders** (boolean), deliveryAreas (array 34 mã tỉnh hợp lệ), localDeliveryFee (field có, nullable long >=0).

- Vendor là nguồn tính canOperate từ trạng thái/đóng phí; catalog không tự tính lại dựa riêng vào status. canOperate=true yêu cầu APPROVED, nhưng APPROVED chưa chắc canOperate=true.
- vendor.locked khuyến nghị cùng full snapshot, status=LOCKED và canOperate=false. Lock trước snapshot đầu vẫn đủ owner/name/areas để dựng vendor row một lần. Unlock phát vendor.updated full state/version mới hơn; late locked cũ bị gate. Không dùng bộ đếm/sourceVersion riêng cho locked.
- Nếu nhóm chọn locked **signal** chỉ có vendorId/version, cần thêm vendor tombstone/watermark/pending hydration hoặc authoritative fetch; không ghi các field thiếu thành rỗng hoặc ghi đè owner/fee. Chưa có source API đó, nên C2 chỉ capture signal pending, không tự hydrate.
- Product event không ghi vendor fields; vendor event không ghi product metadata/rating/version. Chỉ một row vendor đổi trạng thái, view join chặn public products của shop khóa. Dữ liệu chậm vẫn cần order/vendor chặn ở bước ghi theo BR-20/22.
- acceptsOrders phục vụ lối gửi yêu cầu ở detail; catalog schema hiện chưa có cột này. Sau duyệt, thêm migration **mới** ở D; không sửa V2/L-19. QuoteThreshold/stock không tự biến thành lệnh gửi báo giá.
- Profile quotation/capabilities có thể cùng vendor event nhưng phải chốt schema theo consumer quotation; catalog không chép giấy tờ, NFC, CCCD, ngân hàng, hồ sơ PII hoặc tự làm tem sản phẩm.

## 7. review.created — đề xuất wire và sửa/xóa

Producer order-service, aggregateType=REVIEW, aggregateId=data.reviewId, sourceVersion đề xuất 1 cho immutable fact v1. data bắt buộc: reviewId, productId, vendorId (<=36), rating integer 1–5, createdAt UTC Instant; content field có nhưng nullable. Producer kiểm đúng đơn BUY_NOW đã giao/quyền đánh giá và unique review theo đơn/dòng hàng; catalog không kiểm bằng cách đọc DB order.

eventId dùng dedup transport, reviewId dùng dedup business. Review đến trước product vẫn lưu. Khi product đến/upsert lại, aggregate count/average lấy từ reviews đã giữ, không ghi đè bằng rating trong product event. Duplicate cùng reviewId/data không tăng count; khác product/vendor/rating/content/time là conflict, không overwrite. Cần chốt precision createdAt tối đa microsecond để khớp PostgreSQL và so trùng nhất quán.

**Khuyến nghị v1:** review bất biến sau tạo; chưa phát review.updated/deleted và không tự thêm quyền sửa/xóa. Nếu nhóm yêu cầu sửa/xóa/moderation, phải duyệt trước envelope/version stream theo reviewId, `review.updated` full state và `review.removed` tombstone, quyền nguồn order, cách bỏ rating và rebuild aggregate. Chưa có version/tombstone review trong schema hiện tại: cần migration mới, adapter và tests out-of-order tương ứng. Không dùng review.created cùng ID để âm thầm sửa review.

## 8. Taxonomy theo L-19 — ownership đã chốt, wire còn đề xuất

Vendor sở hữu cake_attributes và product_cake_attributes; catalog **chỉ giữ mã** trong crust_codes/filling_codes, không tạo bảng từ điển hay API ghi catalog theo §7 plan cũ. Root đã đặc tả ở docs: `/api/cake-attributes` của vendor.

| API vendor trong outline | Hành vi cần xác minh với owner |
| --- | --- |
| GET ?group=CRUST\|FILLING | Public active, sortOrder rồi code/id ổn định; dùng picker/filter labels |
| GET ?group=&includeHidden=true | ADMIN; cần hỗ trợ hiển thị nhãn giá trị ẩn đã gắn trên sản phẩm theo AC-54.4 |
| POST body {group,label} | ADMIN sinh code bất biến/labelKey, append thứ tự, chống tên trùng |
| PATCH /{attributeId} body {label?,sortOrder?,active?} | ADMIN rename/reorder/hide, không đổi code/group, không DELETE; chặn ẩn active cuối nhóm trong transaction |

API outline hiện có một khoảng cần nhóm chốt: public product cũ vẫn phải hiển thị tên giá trị ẩn, nhưng GET public active không trả nhãn đó và includeHidden hiện chỉ ADMIN. Khuyến nghị vendor cung cấp resolver đọc nhãn theo `(group,code)` cho mã đã gắn, trả label/active, không mở picker chọn hidden; endpoint cụ thể cần owner duyệt, **chưa tự tạo route/resolver** trong catalog.

Mã seed đã có trong migration vendor, không tạo seed mới ở catalog:

| Nhóm | Mã seed |
| --- | --- |
| CRUST | banh-nuong, banh-deo, banh-lanh, khac |
| FILLING | thap-cam, dau-xanh, hat-sen, dau-do, khoai-mon, tra-xanh, sau-rieng, trung-muoi, khac |

`khac` có ở hai nhóm: identity từ điển là (group,code), không code đơn lẻ toàn cục. IDs trong migration vendor giữ nguyên; không tự sinh lại ledger IDs. Vendor validate >=1 crust và >=1 filling, array không trùng, mã đúng nhóm. Khi tạo/gắn mới chỉ active; mã hidden đã có được giữ. Rename không đổi mã hoặc phát lại toàn bộ products; filter chỉ active theo thứ tự vendor đặt. Source chịu validation brand/origin/ảnh; catalog không đọc DB vendor để kiểm mã mỗi message.

Migration L-19 đã có arrays default [] và chưa có mapping dữ liệu cũ từ cake_type; không đoán `cake_type` thành hai nhóm. Empty legacy projection là dữ liệu cần producer full snapshot/review, không tự gắn “khac” cho mọi sản phẩm. D chỉ làm read filters/facets sau duyệt, không viết từ điển ở catalog.

## 9. Nguồn replay/rebuild — lựa chọn và khuyến nghị

| Phương án | Lợi ích | Giới hạn / điều kiện |
| --- | --- | --- |
| Vendor publish lại full snapshot | Bootstrap state product/vendor mới nhất, không cần toàn bộ patch history | Phải gồm REMOVED/tombstone và vendors bị khóa; sourceVersion giữ nguyên, eventId mới cho logical republish, có manifest/checkpoint đủ dữ liệu; cần order feed reviews riêng |
| Event log lưu trữ của producer | Audit lịch sử, replay theo version, phục hồi khi queue/catalog mất | Cần retention đủ, immutable payload/schema versions, quyền truy cập, watermark/partition offset; Rabbit queue và outbox đã publish chưa phải cam kết event archive |
| Raw inbox catalog đã giữ | Có dữ liệu thật ngay, hỗ trợ retry sau adapter upgrade và điều tra, không gọi DB service khác | Chỉ các event đã nhận từ lúc capture, không chứng minh đủ history; eventId processed sẽ skip ở cùng target; chưa có business adapter nên không decode/rebuild state hiện giờ |

**Khuyến nghị cho demo:** trước tiên producer cung cấp full snapshots có manifest/checkpoint (vendor product/vendor + order reviews), dùng inbox raw để retry/replay phần đã nhận sau khi adapter được duyệt. Nếu yêu cầu phục hồi lịch sử lâu dài, bổ sung event archive như lựa chọn riêng; không tự dựng endpoint/feed giả ở catalog.

Phải duyệt các điểm sau trước full rebuild:

1. Nguồn từng aggregate, cách đọc/tải có quyền, consistency của snapshot và ranh giới chuyển sang event stream. Snapshot manifest phải chứa removed/locked chứ không chỉ public ON_SALE.
2. Opaque checkpoint từ producer hoặc archive; keyset receivedAt/eventId hiện tại chỉ là **scan cursor tạm**. receivedAt không phản ánh commit/source order; mỗi recovery run B mới bắt đầu null để thấy row commit muộn.
3. Rebuild target/generation và dedup scope: không xóa product_views rồi mong replay cùng processed_events sẽ dựng lại. Khuyến nghị build generation riêng với marker riêng, validate rồi swap có kiểm soát; schema/triển khai phải duyệt ở D, không tạo ở C.
4. Không xóa processed_events/tombstones/inbox/reviews để “reset”. Tombstone/version phải sống qua recovery; snapshot không hồi sinh terminal removed. Feed lặp/out-of-order dùng sourceVersion chứ không sort occurredAt.
5. Raw inbox sau processing vẫn giữ; cần chốt retention/PII/backup và cơ chế DLQ re-drive. Re-drive dùng eventId gốc và adapter đúng schema; không sửa payload xung đột rồi giữ cùng identity.
6. B hiện rebuild rating từ reviews local và quét pending; việc này **không** là bằng chứng có thể rebuild toàn bộ product/vendor state. Không mở HTTP endpoint hoặc scheduler rebuild trước quyết định quyền/vận hành.

## 10. Các quyết định nhóm cần trả lời

| Mục | Khuyến nghị | Tình trạng duyệt |
| --- | --- | --- |
| Envelope/schemaVersion/types/null semantics | §2, full state §3 | CHƯA DUYỆT |
| Product fields/tiers/arrays và nguồn sourceVersion mọi stock change | §4; crustCodes theo L-19, không shellCodes song song | CHƯA DUYỆT wire/tiers/version |
| Removed terminal hay admin restore | Terminal; restore phải thiết kế riêng | CHƯA DUYỆT chi tiết wire/restore |
| Locked full hay signal; version stream; acceptsOrders | Full, cùng vendor version; thêm acceptsOrders bằng migration mới sau duyệt | CHƯA DUYỆT |
| Review immutable hay sửa/xóa; precision | Immutable v1, microsecond; mở correction sau contract mới | CHƯA DUYỆT |
| Public resolver nhãn hidden | Vendor resolver theo group/code, không public picker hidden | CHƯA DUYỆT endpoint |
| Replay feed/checkpoint/target generation | Full snapshot manifest + order reviews, inbox retry; generation riêng nếu full rebuild | CHƯA DUYỆT |
| Endpoint sản phẩm vendor thay writer legacy | Owner triển khai và nghiệm thu trước xóa writer catalog | CHƯA CÓ endpoint thay thế |
| Audit phí liên tỉnh | [Handoff orchestrator](orchestrator-handoff.md): bind/adapter/processed_events atomic | CHƯA CÓ adapter E2E |

## 11. Tiêu chí nghiệm thu sau duyệt (Phase D, chưa thực hiện ở C)

- Producer-consumer fixtures dùng **payload được duyệt** cho cả năm keys; schemaVersion sai, missing field, null/empty, int overflow và duplicate identity conflict.
- PG/Rabbit thật: out-of-order/version0, equal-version conflict, late removal, lock trước snapshot/unlock, duplicate review và review trước product, concurrent consumers, DLQ/retry/rollback.
- Startup Flyway validate sau migration mới, không sửa migration đã merge; vendor product endpoints đủ trước gỡ writer/test cũ.
- Taxonomy picker/filter/hidden labels đúng ownership; facets scope vùng/quyền, sort/page ổn định; 34 mã tỉnh, không ba miền/tem NFC sản phẩm.
- Shipping/snapshot nguồn giá-tồn chính xác ở vendor, một phí/shop, phí chưa cấu hình không thành 0; root routes/internal deny theo C4.
- Rebuild có feed/checkpoint thật, không reset markers; so trạng thái/ratings/tombstone trước/sau, audit E2E và phối hợp UI theo phạm vi C5.

**Dừng sau Phase C. Không có dòng xác nhận “đã duyệt” trong tài liệu này.** Các ví dụ ở đây chỉ để nhóm review, không phải payload đã được chấp nhận để chạy production adapter.

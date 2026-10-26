# Catalog service

## Trạng thái 26/10/2026

[Kế hoạch C0–C5](implementation-plan.md) là bản phân chia scope sau khi đối chiếu IA và hai bộ wireframe. **C1** đã commit/push riêng (`3cbb1ff`). **C2** đã triển khai và kiểm chứng phần kỹ thuật đã xác nhận; còn chờ contract producer, chưa hoàn thành consumer nghiệp vụ và full replay/rebuild. C2 chưa commit/push/merge/deploy.

Runtime mặc định chỉ scan entity `ProductListing` @Immutable và repository chỉ đọc của view V2. Lê Trần đã cho phép cô lập writer/entity/repository cũ vào profile `legacy-writer`; giữ nguyên nghiệp vụ và 11 test ảnh, không xóa, không chuyển DB, không tạo lại bảng legacy. Profile đó **không dùng được với V2**; không bật nó để chạy catalog mới. Hibernate vẫn `ddl-auto: validate`. common-storage vẫn ở dependency cho code legacy, nhưng auto-config upload/MinIO chỉ được import khi bật legacy; read side chỉ dựng URL công khai, không cần credentials/upload hay gọi MinIO khi startup.

## C2: đã xác nhận và còn chờ

[Audit contract trước code](c2-contract-audit.md) ghi bằng chứng từ checkout và `origin/develop:d211767`. **Vendor endpoint chưa có** cho sản phẩm; chưa có producer event hay schema wire được duyệt. Lê Trần xác nhận không có bản contract khác và yêu cầu không tự đặt payload. Không merge develop mới vì ngoài scope có taxonomy và code service khác.

- Core nội bộ dùng row bám schema V2, không phải JSON event DTO: eventId claim + projection trong cùng transaction; sourceVersion bigint của source, không lấy timestamp thay thế; SQL gate chỉ version mới hơn.
- Product tombstone tồn tại dù removal đến trước snapshot; không dựng product giả với dữ liệu trống. Upsert stale hoặc ON_SALE sau tombstone không hồi sinh sản phẩm. Không có restore adapter cho tới khi có contract cho phép.
- Vendor state chỉ ghi vendor_snapshots, product chỉ ghi product_views. Row vendor đã chuẩn hóa hỗ trợ lock/unlock cùng sourceVersion; chưa giả định `vendor.locked` wire là full snapshot hay signal. Unknown lock signal chỉ được capture pending.
- Review độc lập product, dedup eventId và reviewId. Cùng reviewId nhưng nội dung khác bị từ chối và rollback event claim. Per-product advisory transaction lock bảo vệ aggregate khi reviews/upserts/rebuild cạnh tranh; upsert không ghi đè aggregate rồi làm mất đánh giá.
- `projection_inbox` lưu JSONB của event đã nhận; `processed_events` chỉ lưu event core đã áp dụng/đã quyết định stale hoặc duplicate một cách hợp lệ. Raw payload vẫn giữ sau processing để làm nguồn replay, không xóa để reset.
- Consumer `catalog.projections` bind đúng năm keys đã có trong docs, hai consumer nhận đồng thời. Chỉ đọc `eventId` đã xác nhận; không đọc tên field/version/tiers/venderId tự đặt. Sau inbox commit mới ACK. Malformed/ambiguous JSON, ID conflict, dữ liệu không lưu được theo ràng buộc → DLQ durable `catalog.projections.dlq`; lỗi DB tạm thời requeue, không đánh processed sớm.
- Có đọc pending inbox theo batch giới hạn và rebuild **rating từ product_reviews**. Chưa có full replay/rebuild tự động vì thiếu adapter và nguồn replay/checkpoint được producer xác nhận; không xóa watermark/tombstone/processed_events để lách việc này.

`catalog.projections.capture-enabled=true` bật capture; đây **không phải** cờ bật business adapter. Hàng pending chưa cập nhật hàng hóa, trạng thái lock hay reviews trên read model. Vì vậy chưa nghiệm thu đồng bộ vendor/order E2E hoặc sẵn sàng triển khai; gate không deploy vẫn áp dụng.

Theo dõi pending bằng truy vấn chỉ đọc trong catalog_db:

```sql
SELECT i.routing_key, count(*) AS pending_count
FROM projection_inbox i
WHERE NOT EXISTS (SELECT 1 FROM processed_events p WHERE p.event_id = i.event_id)
GROUP BY i.routing_key;
```

Khi có contract được duyệt, adapter phải đọc inbox bằng eventId/key gốc, chuẩn hóa sang row rồi gọi core trong transaction; chỉ thành công mới có processed marker. Retry cùng ID không được tự tạo eventId khác. Trước full rebuild cần nguồn snapshot/history và watermark được vendor/order xác nhận; không truncate inbox, processed_events hoặc tombstone. Rebuild rating hiện có là internal service operation có lock, không mở HTTP endpoint quản trị/rebuild chưa được thiết kế. DLQ giữ message lỗi để điều tra; chưa có công cụ re-drive tự động.

Migration mới `V2026_10_26_1500__catalog_projection_recovery.sql` chỉ thêm product_tombstones/projection_inbox và backfill tombstone từ product_views đã REMOVED. Không sửa V2, không thêm taxonomy, không đổi seed nghiệp vụ.

## API đọc cơ bản C2

Qua discovery route gateway `/catalog-service/api/products`; endpoint service giữ `/api/products` (root gateway/facets đầy đủ thuộc C3). GET list yêu cầu `provinceCode` hợp lệ trong 34 mã, hỗ trợ q theo name/brand, vendorId, page/size (1–100), sort cố định updatedAt rồi id. Chỉ ON_SALE + canOperate + sellsShop + giao được; LOCAL ngoài vùng không lọt ra. GET detail/reviews chặn hàng không công khai, detail chưa chọn tỉnh không trả shippingFee giả bằng 0. Phí/snapshot đầy đủ thuộc C4.

Response mới có envelope và record ProductListingResponse: giữ id, thêm vendorName/rating/isOwn, ảnh có imageKeys/imageUrls. Sau merge develop Phase A, read row/DTO dùng `crustCodes[]`, `fillingCodes[]` thay cakeType theo migration L-19 đã merge; chỉ tương thích schema, chưa làm bộ lọc C3. priceTiers là JSON nguyên trạng từ read model, chưa suy diễn schema item tier của event. Không cam kết tương thích hoàn toàn frontend cũ; chưa làm nhiều bộ lọc/facets hoặc quyền quản lý mọi trạng thái của C3. Không có lệnh ghi sản phẩm trong runtime mặc định; legacy controller vẫn còn trong source/profile.

## API C1

Gateway root: `/api/interprovince-fees`; route tương thích discovery `/catalog-service/api/interprovince-fees` vẫn áp cùng quyền. Public API trả `status, code, message, data, timestamp`; lỗi thêm `path` và `data: null`.

| Method/path | Quyền | Kết quả |
| --- | --- | --- |
| `GET /api/interprovince-fees` | Công khai | `data: {fees: [{provinceCode, provinceName, fee, effectiveFrom}], complete}`; đủ danh mục tỉnh, dòng chưa cấu hình có `fee: null`, không tự gán 0 |
| `GET /api/interprovince-fees/provinces/{provinceCode}` | Công khai | Một dòng; mã lạ 404, chưa cấu hình 503 |
| `PUT /api/interprovince-fees` | ADMIN | Body `{fees: [{provinceCode: "01", fee: 45000}, ...]}` phải có đúng một dòng cho **mỗi mã trong provinces**; trả bảng đã lưu |

Tiền là số nguyên JSON trong miền `long` VND: cho phép 0, từ chối âm, null, chuỗi số, số lẻ và overflow. Bảng hiện có 34 mã tỉnh. Không dùng ba mức Bắc/Trung/Nam từ mockup Q6.1. Mỗi lần PUT thay toàn bộ bảng tại thời điểm server, không hỗ trợ lịch giá tương lai. Hai lần PUT đồng thời được serialize; lần commit sau thay toàn bộ bảng trước.

Gateway xác thực JWT, xóa header danh tính client tự gửi, đặt `X-Account-Id`, `X-User-Role` từ claim. Service kiểm lại ADMIN trước truy cập DB. Hợp đồng header này chỉ tin ở mạng nội bộ phía sau gateway, như các service hiện có.

| Code | HTTP | Ý nghĩa |
| --- | --- | --- |
| CAT_001 | 400 | Body/tiền không hợp lệ |
| CAT_002 | 401 | Thiếu danh tính |
| CAT_003 | 403 | Không phải ADMIN |
| CAT_004 | 400 | Thiếu, trùng hoặc thừa mã tỉnh |
| CAT_005 | 404 | Mã tỉnh không tồn tại |
| CAT_006 | 503 | Chưa có phí tỉnh đó |
| CAT_008 | 500 | Lỗi DB/hạ tầng hoặc ngoài dự kiến |

Gateway tự trả lỗi security trước khi chuyển request vào service; body lỗi gateway hiện chưa theo envelope catalog.

## Persistence và audit

Không đổi schema/migration đã merge. JDBC đọc `provinces`, ghi `interprovince_fees`, `outbox_events` của V2 trong cùng transaction Spring. Khóa các dòng province theo code trước lần lưu, kể cả khi bảng phí còn trống. Bảng tỉnh là nguồn danh mục, không nhân đôi danh sách tỉnh trong service.

Sự kiện domain `interprovince_fee.changed` có `eventId, actorAccountId, occurredAt, before, after`; hai bản bảng phí giúp audit thấy giá trước/sau. Đây là **payload đề xuất cho consumer**, cần thống nhất với người phụ trách orchestrator. Outbox lưu cùng phí; không publish Rabbit ngay trong transaction nghiệp vụ.

Relay mặc định mỗi 2 giây, tối đa 25 message/tick. Mỗi message dùng một transaction riêng, `FOR UPDATE SKIP LOCKED`, timeout confirm 5 giây; không giữ khóa bảng phí trong lúc chờ broker. Publish persistent JSON lên `moonkage.events`, `messageId=eventId`. Chỉ cập nhật `published_at` sau ACK không kèm mandatory return. NACK, timeout, mất kết nối hoặc chưa có route tăng attempts và giữ pending. Có thể phát lặp khi crash sau ACK/trước commit; consumer phải dedup eventId. Chưa yêu cầu thứ tự giao giữa nhiều replica.

**Phụ thuộc còn mở:** orchestrator hiện chỉ bind audit cũ bằng `audit.#`, chưa bind/consume domain key này. Khi chưa có binding thì sự kiện giữ pending, chưa có bản ghi audit E2E. Không bind domain payload thẳng vào consumer AuditEvent cũ vì khác schema. Cần adapter và processed_events ở orchestrator theo [integration](../../architecture/api-db/integration.md).

Cấu hình `catalog.outbox.enabled`, `catalog.outbox.relay-interval`, `catalog.outbox.batch-size` trong application.yml; `spring.rabbitmq.publisher-confirm-type=correlated`, `publisher-returns=true`, `template.mandatory=true` phải đi cùng relay. Chưa thay AuditPublisher cũ của product; việc chuyển writer đó thuộc C2.

## Kiểm tra

Từ thư mục `api`, chạy Maven wrapper theo convention:

```powershell
.\mvnw.cmd -o -B -ntp -pl catalog-service,api-gateway -am verify
```

`-o` dùng cache; bỏ nó nếu máy chưa có dependencies. Tests dùng Testcontainers theo pattern identity. C1 dùng common-reference test scope để đối chiếu seed; C2 chuyển module nội bộ này sang runtime để kiểm mã tỉnh cho read API/normalized vendor row. Không thêm thư viện runtime bên ngoài. Dockerfile catalog copy cả pom/src common-reference để reactor build tìm được dependency.

- Unit/MVC: quyền, validation bảng/tiền, đủ/trùng/mã lạ, fees chưa cấu hình, serialization trước write, payload audit, relay ACK/NACK/return/lỗi broker.
- Gateway: GET công khai, PUT ADMIN ở cả hai route; lọc header giả mạo.
- PostgreSQL 17: Flyway thật, bảng tỉnh khớp enum, upsert toàn bảng, rollback phí+outbox, hai lần lưu đầu đồng thời, trạng thái pending/published.
- RabbitMQ 4.1: Testcontainers riêng; xác nhận persistent publish/messageId và mandatory return với routing key không có binding.

Các test DB **C1** là JDBC slice. **C2** bổ sung CatalogProjectionIntegrationTest là full SpringBootTest với HTTP server, PostgreSQL/RabbitMQ thật và `ddl-auto: validate`; kiểm default JPA metamodel chỉ ProductListing, không legacy tables/repos/storage bean. Bao gồm text[]/jsonb/pg_trgm/view, @Immutable dirty flush, upgrade/backfill migration, cạnh tranh version/reviews/eventId, inbox retry/DLQ và hai consumer đồng thời. Input row nội bộ không được gọi là producer contract test.

Tests C1 cũ giữ nguyên cơ chế skip khi thiếu Docker; full integration suite C2 **báo lỗi khi thiếu Docker**, không silently skip để kết luận startup. Không dùng H2 hoặc disable test. Kết quả bản cuối và cách đếm được ghi ở [kế hoạch](implementation-plan.md), tách riêng lần lỗi hạ tầng với lần xác minh thành công.

Bản cuối 26/10/2026: `clean verify` toàn backend **BUILD SUCCESS, 371 pass / 0 fail / 0 error / 0 skip**; catalog **99 tests**, gồm 28 full application C2 và 11 test ảnh legacy giữ nguyên. Đếm Surefire XML theo đúng 11 module parent POM sau clean. Spotless/Checkstyle/Error Prone/ArchUnit và `git diff --check` qua. Startup đã xác minh với DB V2 trên Testcontainers, chưa deploy hoặc nghiệm thu event producer/consumer nghiệp vụ E2E.

Pseudocode: [InterprovinceFeeServiceImpl](classes/InterprovinceFeeServiceImpl.md), [OutboxDeliveryServiceImpl](classes/OutboxDeliveryServiceImpl.md).

Pseudocode C2: [CatalogProjectionServiceImpl](classes/CatalogProjectionServiceImpl.md), [JdbcCatalogProjectionRepository](classes/JdbcCatalogProjectionRepository.md), [ProjectionInboxServiceImpl](classes/ProjectionInboxServiceImpl.md), [ProductReadServiceImpl](classes/ProductReadServiceImpl.md).

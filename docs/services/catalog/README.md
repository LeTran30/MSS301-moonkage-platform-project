# Catalog service

## Trạng thái 02/11/2026

Contract v1 đã duyệt; Phase D xong phần adapter, `acceptsOrders`, tìm kiếm/facets, root route gateway và `review.created` theo envelope. Catalog chỉ còn phía đọc: không ghi sản phẩm, không gọi MinIO hay Feign. Chi tiết trong [implementation-plan](../../work/plans/catalog-implementation-plan.md#02112026-acceptsorders-tìm-kiếm-bỏ-writer-cũ-review-envelope). Các mục bên dưới là lịch sử.

## Trạng thái 26/10/2026

[Kế hoạch C0–C5](../../work/plans/catalog-implementation-plan.md) là bản phân chia scope sau khi đối chiếu IA và hai bộ wireframe. **C1** đã push riêng (`3cbb1ff`). Snapshot C2 đã commit **local** `1e160ae`, merge develop local `3227fed` theo master prompt Phase A–C. C2 còn chờ contract producer, chưa hoàn thành consumer nghiệp vụ/full replay. Không push, merge vào develop/main hoặc deploy; Phase D chờ xác nhận nhóm duyệt contract.

Runtime mặc định chỉ scan entity `ProductListing` @Immutable và repository chỉ đọc của view V2.

**BE-09 (04/11/2026): profile `legacy-writer` đã bị xoá.** Writer/entity/repository/controller cũ (`ProductController`, `SellerProductController`, `ProductServiceImpl`, `Product`, `ProductPriceTier`, `ProductRepository`, `ProductMapper` và các DTO của chúng) đã bị gỡ khỏi source. Lý do: profile đó **không dùng được với V2** — nó là dead configuration, không phải feature; và để nó tồn tại là để mở đường ghi thứ hai vào cùng bảng, nên drift không kiểm soát được (trái L-18: catalog chỉ là read model).

Hệ quả: catalog-service **không còn gọi MinIO** (không upload ảnh sản phẩm, không cần credentials), **không còn gọi vendor-service** (bỏ Feign), và **không còn endpoint ghi sản phẩm** — `/api/products` chỉ có GET (đọc), `/api/seller/products` đã bị xoá hoàn toàn. Việc ghi sản phẩm thuộc `vendor-service` (writer theo L-18). Dependency `common-storage` và `spring-cloud-starter-openfeign` đã bị gỡ khỏi pom của catalog; user MinIO `catalog` cũng bị gỡ khỏi `infra/minio/init.sh`. Hibernate vẫn `ddl-auto: validate`.

## C2: đã xác nhận và còn chờ

[Audit contract trước code](../../archive/2026-10-26-catalog-c2-contract-audit.md) ghi bằng chứng thời điểm C2 ban đầu. Phase A đã nhận develop `6523d00`; **vendor endpoint sản phẩm/producer event vẫn chưa có**, schema event wire chưa được nhóm duyệt. Lê Trần cho phép nhận nguyên migration L-19 có sẵn và sửa tương thích catalog; các service khác giữ nguyên nội dung develop. Không suy ra event contract được duyệt từ việc merge base.

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

## Recovery Phase B (internal port, chưa nối consumer nghiệp vụ)

`ProjectionRecoveryService.rebuildRatings(afterProductId, limit)` quét productId hiện có theo batch 1–1000, gọi core có lock để recompute rating_count/rating_avg từ reviews. Không thay status/version hoặc xóa event claims/tombstones/raw/reviews; review trước product vẫn giữ để upsert sau tính aggregate. Đây không phải rebuild product/vendor snapshot bị mất.

`ProjectionRecoveryService.replayPending(afterCheckpoint, limit)` đọc raw inbox pending bằng keyset receivedAt/eventId và chọn `ProjectionReplayAdapter` theo key. **Không có adapter production** khi contract chưa duyệt: kết quả deferred, không processed marker. Khi adapter được duyệt sau này, từng entry được đọc lại/lock trong transaction REQUIRES_NEW, áp qua core và bắt buộc có marker cùng eventId/key mới thành công. Adapter lỗi, no-op hoặc marker sai key rollback; raw còn nguyên. Batch có thể commit một phần, nên retry từ đầu dùng eventId gốc.

`ReplayCheckpoint` hiện chỉ là placeholder **vị trí quét tạm của inbox**, không được persist hay gọi là checkpoint producer. receivedAt có thể có trước commit; mỗi recovery run mới bắt đầu null để không bỏ sót row commit muộn đứng sau cursor theo thời gian thực nhưng trước cursor theo timestamp. nextScanPosition có thể vượt qua deferred, không chứng minh đã xử lý các event đó. Không có feed giả, scheduler, HTTP rebuild hoặc thao tác truncate/reset marker.

Full replay/rebuild vẫn thiếu contract và nguồn feed/checkpoint được producer duyệt. Chỉ inbox raw không chứng minh lịch sử đủ; không parse các field business chưa chốt để “rebuild” tùy ý. Test adapter chỉ là fixture kiểm transaction, không là contract hoặc nguồn replay production.

Ghi chú cho owner orchestrator: [../../archive/2026-10-27-catalog-orchestrator-handoff.md](../../archive/2026-10-27-catalog-orchestrator-handoff.md). Chưa sửa orchestrator và chưa nghiệm thu audit E2E.

Verify Phase B: full clean verify **403 pass / 0 fail / 0 error / 0 skip**; catalog 109, gồm 38 full application tests PG/Rabbit thật. Phase A sau merge có 393 tests; B thêm 10 recovery tests. Chi tiết/cách đếm trong [báo cáo A–C](../../archive/2026-10-26-catalog-phase-abc-report.md). Kết quả 371/99 bên dưới là lịch sử trước merge develop.

Phase C: [đề xuất contract](contract-proposal.md) **CHƯA ĐƯỢC NHÓM DUYỆT**. Chưa có production adapter theo tài liệu đó, chưa bắt đầu D. Gate yêu cầu Lê Trần xác nhận contract đã được nhóm duyệt, sau đó mới làm C3/C4/C5. Local commits A/B không phải lệnh push/deploy.

## API đọc

Gateway root `/api/products` (route `catalog-service`); `/catalog-service/api/products` vẫn chạy qua discovery locator với cùng quyền. Guest đọc được, không cần token.

| Method/path | Tham số | Kết quả |
| --- | --- | --- |
| `GET /api/products` | `provinceCode` (bắt buộc, 34 mã); `q`; `vendorId`, `brand`, `crust`, `filling` (lặp tham số hoặc phân tách bằng dấu phẩy, tối đa 50 giá trị); `priceMin`, `priceMax` (>= 0, min <= max); `sort` = `rating` (mặc định) \| `price-asc` \| `price-desc` \| `newest`; `page`, `size` (1–100) | Trang `ProductListingResponse`. `q` tách theo khoảng trắng (tối đa 10 từ), mỗi từ phải có trong tên, thương hiệu hoặc tên Shop, không phân biệt hoa thường và dấu (`unaccent`). Cùng một nhóm là OR, khác nhóm là AND; vỏ/nhân khớp khi sản phẩm có ít nhất một mã đã chọn. Sort lạ → `CAT_001` |
| `GET /api/products/facets` | `provinceCode`, `q` | `{crusts, fillings, brands: [{value, count}], vendors: [{vendorId, vendorName, count}], priceMin, priceMax}` trên các sản phẩm công khai trong vùng khớp `q`, bỏ qua các bộ lọc khác để panel không tự thu hẹp |
| `GET /api/products/{id}`, `GET /api/products/{id}/reviews` | `provinceCode` (tùy chọn) | Chi tiết và đánh giá của sản phẩm công khai |

Chỉ ON_SALE + canOperate + sellsShop + giao được tới tỉnh; LOCAL ngoài vùng không lọt ra. Response có `vendorAcceptsOrders` để web quyết định nút gửi yêu cầu báo giá.

### Lịch sử: API đọc cơ bản C2

Qua discovery route gateway `/catalog-service/api/products`; endpoint service giữ `/api/products` (root gateway/facets đầy đủ thuộc C3). GET list yêu cầu `provinceCode` hợp lệ trong 34 mã, hỗ trợ q theo name/brand, vendorId, page/size (1–100), sort cố định updatedAt rồi id. Chỉ ON_SALE + canOperate + sellsShop + giao được; LOCAL ngoài vùng không lọt ra. GET detail/reviews chặn hàng không công khai, detail chưa chọn tỉnh không trả shippingFee giả bằng 0. Phí/snapshot đầy đủ thuộc C4.

Response mới có envelope và record ProductListingResponse: giữ id, thêm vendorName/rating/isOwn, ảnh có imageKeys/imageUrls. Sau merge develop Phase A, read row/DTO dùng `crustCodes[]`, `fillingCodes[]` thay cakeType theo migration L-19 đã merge; chỉ tương thích schema, chưa làm bộ lọc C3. priceTiers là JSON nguyên trạng từ read model, chưa suy diễn schema item tier của event. Không cam kết tương thích hoàn toàn frontend cũ; chưa làm nhiều bộ lọc/facets hoặc quyền quản lý mọi trạng thái của C3. Không có lệnh ghi sản phẩm trong runtime: **BE-09 đã xoá hẳn legacy controller**, `/api/seller/products` không còn tồn tại.

**BE-04 (04/11/2026): `ProductListingResponse` có `vendorAcceptsOrders`.** Trước đây web phải suy ra "hiệu có nhận đơn riêng" từ `quoteThreshold` — nhưng ngưỡng báo giá là "từ bao nhiêu hộp thì cần báo giá", không phải "có nhận đơn riêng hay không", nên câu trả lời luôn sai. Cờ đúng được copy từ `VendorSnapshot.acceptsOrders` của vendor-service qua projection (`vendor_snapshots.accepts_orders`, migration `V2026_11_02_1000__vendor_accepts_orders.sql`) và đi vào DTO qua view `product_listings` (cột `vendor_accepts_orders`). Web đọc `dto.vendorAcceptsOrders` và tự đặt tên hiển thị là `acceptsCustomOrder`.

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

Tests C1 cũ giữ nguyên cơ chế skip khi thiếu Docker; full integration suite C2 **báo lỗi khi thiếu Docker**, không silently skip để kết luận startup. Không dùng H2 hoặc disable test. Kết quả bản cuối và cách đếm được ghi ở [kế hoạch](../../work/plans/catalog-implementation-plan.md), tách riêng lần lỗi hạ tầng với lần xác minh thành công.

Bản cuối 26/10/2026: `clean verify` toàn backend **BUILD SUCCESS, 371 pass / 0 fail / 0 error / 0 skip**; catalog **99 tests**, gồm 28 full application C2 và 11 test ảnh legacy giữ nguyên. Đếm Surefire XML theo đúng 11 module parent POM sau clean. Spotless/Checkstyle/Error Prone/ArchUnit và `git diff --check` qua. Startup đã xác minh với DB V2 trên Testcontainers, chưa deploy hoặc nghiệm thu event producer/consumer nghiệp vụ E2E.

Pseudocode: [InterprovinceFeeServiceImpl](../../archive/2026-11-08-class-docs/catalog/InterprovinceFeeServiceImpl.md), [OutboxDeliveryServiceImpl](../../archive/2026-11-08-class-docs/catalog/OutboxDeliveryServiceImpl.md).

Pseudocode C2: [CatalogProjectionServiceImpl](../../archive/2026-11-08-class-docs/catalog/CatalogProjectionServiceImpl.md), [JdbcCatalogProjectionRepository](../../archive/2026-11-08-class-docs/catalog/JdbcCatalogProjectionRepository.md), [ProjectionInboxServiceImpl](../../archive/2026-11-08-class-docs/catalog/ProjectionInboxServiceImpl.md), [ProductReadServiceImpl](../../archive/2026-11-08-class-docs/catalog/ProductReadServiceImpl.md).

Pseudocode recovery B: [ProjectionRecoveryServiceImpl](../../archive/2026-11-08-class-docs/catalog/ProjectionRecoveryServiceImpl.md), [ProjectionReplayEntryServiceImpl](../../archive/2026-11-08-class-docs/catalog/ProjectionReplayEntryServiceImpl.md).

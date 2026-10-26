# Kế hoạch catalog-service

Ngày đối chiếu: 26/10/2026. Base: `origin/develop` (`4b70826`); nội dung tracked giống checkout `main` tại thời điểm bắt đầu. Nhánh làm việc: `feat/catalog-service`.

## 1. Kết luận và phạm vi nhận việc

Catalog là phía đọc sản phẩm, sở hữu bảng phí liên tỉnh và tính phí giao mua ngay. Đây không phải toàn bộ nghiệp vụ sản phẩm: vendor sở hữu tạo/sửa, ẩn/hiện/gỡ, ảnh, giá, tồn kho và giữ hàng (L-18). Order sở hữu giỏ/checkout, chống tự mua ở lệnh ghi, đánh giá và phát `review.created`. Catalog không đọc DB của hai service đó.

Scope nhận: API tìm/lọc/chi tiết/reviews, bản chiếu qua RabbitMQ, bảng phí, tính phí/snapshot nội bộ, đọc/lọc taxonomy vỏ/nhân theo IA mới, tests và tài liệu vận hành. Tích hợp gateway ở các endpoint catalog. Không nhận form/vendor writer, checkout/payment, supplier search hay toàn bộ frontend trong cùng phần việc này. Cập nhật C2: `origin/develop:d211767` đã có L-19 chọn vendor sở hữu từ điển taxonomy, nên đề xuất catalog ghi taxonomy ở phần 7 không còn là hướng triển khai.

## 2. Nguồn và độ lệch phiên bản

- Repo: [API/DB catalog](../../architecture/api-db/catalog.md), [integration](../../architecture/api-db/integration.md), [decisions](../../architecture/api-db/decisions.md), [requirements](../../product/requirements.md), hai [conventions](../../conventions/coding-rules.md), [quality](../../conventions/code-quality-rules.md), [database](../../guides/database.md).
- Workbook người dùng cung cấp `Moonkage_IA.xlsx`, cập nhật 23/10: đọc đủ 9 sheet; chú trọng Kiểm kê màn hình hàng 4–5, 45–46, 58, 66, 69; Mô hình nội dung hàng 2–14; Taxonomy hàng 4–16; User flows F1/F3/F4/F7. Bản trong gói `Moonkage_IA_2026-10-22` cũ hơn một ngày; đã đọc workbook, DOCX, README, sitemap và mã wireframe. PDF là bản trình bày kèm DOCX, chưa kiểm tra render PDF riêng.
- Đã kiểm kê và đọc mã HTML/JS/CSS trong thư mục `wireframe` (69 HTML), đối chiếu các màn M2.0/M2.1/B4.0/B4.1/B6.3/Q3.0/Q6.1/Q6.4. Chưa xác nhận render/click bằng trình duyệt: browser policy chặn `file://`; không coi kiểm tra mã là visual QA.
- IA ghi Requirement v1.7/v1.8 đang ở nhánh `feat/product-cake-type-brand`, chưa merge. Ref đó chưa có trong checkout. Repo vẫn dùng một `cake_type`, chưa có danh mục FR-54 hay schema/event cho nhiều vỏ/nhân. Không sửa migration V2 đã merge; cần migration mới và thống nhất payload với vendor trước mốc C3.
- Q6.1 của bộ HTML mới ghi **63 tỉnh**, nhập ba miền; repo yêu cầu **34 mã tỉnh và một giá mỗi tỉnh**. Triển khai theo bảng `provinces` và `common-reference`; không hardcode 63 hoặc ba miền.
- M2.1/B4.1/Q3.0 có tem NFC chống giả, truy xuất sản phẩm; yêu cầu hiện tại chỉ xác minh danh tính tài khoản bằng NFC. Không bổ sung nghiệp vụ tem từ dữ liệu mockup.
- M2.1 bản HTML thiếu hạn dùng, bậc giá, nơi sản xuất, danh sách reviews; không lấy thiếu sót của màn mẫu làm lý do bỏ API.
- Q6.4 có ba giá trị cùng hiện nhưng nút ẩn giá trị thứ ba bị khóa: backend phải đếm **số giá trị đang hiện trong nhóm**, không phụ thuộc vị trí dòng.
- HTML gộp nhãn “Thương hiệu / Shop”; API vẫn cần hai bộ lọc độc lập brand và vendorId để không nhầm thương hiệu hàng bán lại với tên đơn vị bán.
- Sản phẩm mockup 680.000đ xuất hiện dù chỉ chọn khoảng giá dưới 600.000đ; bộ lọc và khối rỗng là minh họa tĩnh, chưa chứng minh chức năng đã chạy.

## 3. Luồng và trách nhiệm

| Màn/luồng | Catalog cung cấp | Bên phối hợp |
| --- | --- | --- |
| M1.1 → M2.0, F1 | Province, chỉ hàng ON_SALE của shop canOperate+sellsShop giao được; q, giá, thương hiệu, vỏ, nhân, shop; pagination, facets, sort giá/rating | Web giữ vùng giao; taxonomy đang hiện, OR trong nhóm/AND giữa nhóm |
| M2.0 khối nhà cung cấp, F3 | Không trộn supplier vào kết quả sản phẩm | Quotation `/api/suppliers?q=` không áp vùng giao, theo IA v1.8 |
| M2.1 | Tên/ảnh/mô tả/brand/origin/quy cách, stock tham khảo, expiry, tiers, rating/reviews, shippingFee, isOwn | Vendor snapshot cần owner và acceptsOrders; UI ẩn cả mua và gửi yêu cầu khi isOwn |
| M4.0/M4.1 → order | `/internal/products/snapshot`: nhóm theo vendor, mỗi shop một phí; LOCAL ngoài vùng bị từ chối | Order lấy giá/tồn kho chính xác và reservation từ vendor; không dùng projection để xác nhận còn hàng |
| B4.0/B4.1, F7 | Đọc đủ ON_SALE/HIDDEN/REMOVED của shop mình | Vendor ghi, kiểm quyền/BR-21, chống sửa REMOVED, upload ảnh, phát version mới |
| Q3.0 | Admin đọc mọi trạng thái/shop | Vendor nhận lệnh gỡ kèm lý do |
| Q6.1 | GET cả bảng/một tỉnh; PUT ADMIN đủ tỉnh, không âm, atomic + outbox | Orchestrator nhận audit `interprovince_fee.changed` |
| Q6.4; B4.1/B6.3 | Danh mục vỏ/nhân có mã bất biến, rename/reorder/visibility, không xóa; chặn ẩn mục cuối | Cần thống nhất owner/schema/API với nhóm; vendor giữ quan hệ sản phẩm/năng lực ↔ mã |

## 4. Chia mốc triển khai

Ước lượng là ngày làm tập trung, chưa gồm thời gian chờ tích hợp. Không quy đổi thành phần trăm hoàn thành từ số file hoặc số endpoint.

| Mốc | Nội dung và nghiệm thu | Ước lượng | Trạng thái |
| --- | --- | --- | --- |
| C0 | Đọc nguồn, map màn/API/DB, ghi sai lệch và ranh giới | 0,5–1 ngày | Đã lập kế hoạch |
| C1 | Phí liên tỉnh: record DTO, validation server, ADMIN, lock chống lưu xen kẽ, atomic outbox, relay confirm/return, gateway route; tests thiếu/trùng/mã lạ/âm/zero/quyền/rollback | 1 ngày | Backend và tests đã qua; audit consumer/startup còn phụ thuộc C2/C5 |
| C2 | Thay entity/repository sản phẩm cũ bằng view `@Immutable`; bỏ writer khỏi catalog khi vendor có endpoint thay thế; consumer idempotent/version gate, tombstone chống resurrect; reviews đến trước product, vendor lock/unlock; replay/rebuild | 1,5–2 ngày | Phần đã xác nhận đã triển khai và qua kiểm tra: startup V2, core projection, inbox capture. **Chưa hoàn tất C2**: business adapter/full replay chờ contract và producer; writer còn giữ profile legacy |
| C3 | Chốt contract v1.8 với vendor; migration mới taxonomy và arrays/quan hệ read model; search nhiều tiêu chí, facets có scope vùng/quyền, sort ổn định + page giới hạn; chi tiết/reviews/own/admin | 1,5–2 ngày | Chờ contract và C2 |
| C4 | Shipping policy + snapshot, LOCAL/NATIONWIDE, một phí/shop, fee chưa cấu hình không thành 0; root routes và internal deny | 0,5–1 ngày | Chưa triển khai |
| C5 | Seed/replay fixture, Postgres+Rabbit integration, contract với vendor/order/orchestrator, nối UI và visual QA, startup qua Flyway validate | 1–1,5 ngày | Chưa triển khai |

Tổng dự kiến khoảng **6–8,5 ngày tập trung**. Để cân đối STEMotion, nhận catalog backend với các đầu vào rõ ràng; việc sửa toàn bộ màn seller/admin/buyer là task frontend riêng. Có thể review/merge từng mốc sau khi dependency tương ứng sẵn sàng.

## 5. Contract cần thống nhất trước C2/C3

1. Product event là **full snapshot** hay patch; field bắt buộc, imageKeys, tiers, shellCodes/fillingCodes, sourceVersion monotonic theo product; envelope eventId/occurredAt. Không dùng timestamp làm version.
2. `product.removed` đến trước upsert cần tombstone có version; upsert cũ không được phục hồi sản phẩm. Không chỉ lưu id sự kiện rồi bỏ qua sự kiện chưa có product.
3. `vendor.locked` có full snapshot/version hay chỉ signal? Cùng luồng version với `vendor.updated`; tách field product/vendor để không ghi đè lẫn nhau. `acceptsOrders` chưa có ở catalog V2 nhưng UI cần lối gửi yêu cầu.
4. Reviews dedup theo reviewId và eventId, aggregate không mất khi upsert sản phẩm; cần quy tắc khi review sửa/xóa (hiện chỉ created).
5. Catalog taxonomy là đề xuất triển khai theo IA, chưa có trong API/DB hiện tại. Chốt owner, endpoint root, mã seed, validation vendor và cách duy trì nhãn giá trị đã ẩn trước thêm schema. Không đổi mã khi rename.
6. Phí thay cả bảng hiện là last-write-wins trong một transaction được serialize. Nếu nhóm muốn báo xung đột hai admin thay vì lần lưu sau ghi đè, bổ sung revision/If-Match bằng contract mới.
7. Orchestrator hiện nghe `audit.#`, chưa nghe domain key `interprovince_fee.changed`; cần adapter/dedup eventId trước nghiệm thu audit E2E. Relay phải giữ pending nếu không có binding, không coi broker ACK không route là thành công.

## 6. Rủi ro và kế hoạch kiểm tra

- **Blocker tại C1, xử lý trong C2:** entity cũ map bảng đã bị V2 xóa. Lê Trần đã cho phép cô lập code/entity/repository/controller writer cũ trong profile `legacy-writer`, không bật mặc định; giữ code nghiệp vụ và 11 test ảnh cũ. Runtime mặc định scan ProductListing @Immutable/read repository, vẫn validate schema. Profile legacy không dùng được với V2, không khôi phục bảng hoặc tắt validate.
- Docker trên máy chưa chạy lúc bắt đầu. Unit/MVC/ArchUnit có thể chạy; tests Postgres/Rabbit chỉ tính đã xác minh khi hạ tầng thật chạy. Test skip không phải pass tích hợp.
- Test slice C1 dùng entity scan có chủ đích cho fee/province/outbox; không chứng minh các entity sản phẩm cũ hợp lệ.
- Test tiền tệ: `long`, 0 hợp lệ, âm/null bị chặn, không gán phí mặc định cho province chưa cấu hình.
- Test concurrency: khóa cùng bộ province theo code trước mọi lần thay bảng, kể cả lần lưu đầu chưa có fee; hai transaction không tạo bảng pha trộn. Outbox rollback cùng phí khi serialize/DB lỗi.
- Test relay: broker down/NACK/timeout/return giữ pending; ACK có route mới đánh published; messageId=eventId, persistent, chấp nhận at-least-once khi crash sau ACK.
- C2/C3 cần Postgres thật cho text[], jsonb, pg_trgm, view, upsert version và cạnh tranh consumer; không thay bằng H2 để kết luận tương đương.
- AC-05.3: public listing phải có vùng giao hợp lệ trước khi trả sản phẩm; thiếu provinceCode yêu cầu chọn vùng, không mặc định trả tất cả LOCAL. Owner/admin listing là luồng quản lý riêng. Detail chưa chọn vùng không tự gán shippingFee=0; web yêu cầu chọn vùng để báo phí.
- C1 đã commit/push `3cbb1ff` theo lệnh riêng của Lê Trần. **C2 chưa được commit/push/merge/deploy**; tiếp tục giữ gate cho tới lệnh riêng. Mỗi mốc cập nhật [README](README.md), pseudocode class và kết quả test thực tế.

## 7. Thiết kế dự kiến cho taxonomy (chưa thêm schema/API)

**KHÔNG CÒN HIỆU LỰC — chỉ giữ truy vết đề xuất C1:** L-19 chọn vendor sở hữu taxonomy, `crust_codes`/`filling_codes`. Lê Trần đã cho phép Phase A nhận nguyên migration taxonomy có sẵn khi merge develop `6523d00`; chỉ sửa tương thích catalog, không triển khai C3. Không tạo API từ điển catalog theo bảng dưới hoặc sửa migration đã merge.

Đề xuất catalog sở hữu từ điển, vendor sở hữu việc gắn mã vào sản phẩm/năng lực. Đây là thiết kế để thảo luận với nhóm, không phải endpoint đã chạy:

| API đề xuất | Hành vi |
| --- | --- |
| `GET /api/cake-attributes?group=SHELL|FILLING` | Danh mục active, sortOrder rồi code; public. Admin có chế độ xem cả hidden |
| `POST /api/cake-attributes` | ADMIN thêm mã bất biến, nhóm, tên, vị trí; chuẩn hóa và chống tên/mã trùng trong nhóm |
| `PATCH /api/cake-attributes/{code}` | ADMIN đổi tên/visibility, không đổi mã/nhóm; khóa nhóm và kiểm số active trước khi hide |
| `PUT /api/cake-attributes/groups/{group}/order` | ADMIN gửi đủ mã nhóm, mỗi mã một lần; cập nhật thứ tự atomic |

Không có DELETE. Product event cần `shellCodes[]`, `fillingCodes[]`; bộ lọc nhiều giá trị trong một nhóm dùng OR, giữa các nhóm AND. Khi ẩn taxonomy, danh sách chọn/bộ lọc không hiện mục đó nhưng sản phẩm cũ vẫn giữ mã và hiển thị tên. Rename phải phản ánh khi đọc mà không sửa hàng loạt sản phẩm. Không tự chuyển `cake_type` tự do thành mã vỏ/nhân vì thiếu thông tin; cần replay full snapshot từ vendor sau nâng contract hoặc script mapping được nhóm chốt. Seed dự kiến 4 vỏ và 9 nhân từ sheet Taxonomy, không lấy các tên mockup tùy ý làm nguồn chuẩn.

## 8. Kiểm tra C1 (lịch sử tại commit 3cbb1ff)

Docker ban đầu chưa chạy; đã khởi động Docker Desktop để chạy Testcontainers PostgreSQL/RabbitMQ riêng, không dùng DB/queue của project.

- Bản cuối: Maven wrapper `-o -B -ntp clean verify` toàn backend **BUILD SUCCESS**, 26/10/2026. 11 module con và parent đều thành công; **332 tests, 0 failure, 0 error, 0 skip** (đếm XML của đúng các module trong parent pom, không cộng target cũ của service đã xóa).
- Catalog **60 tests**, gồm **6 PostgreSQL** (Flyway, tỉnh, upsert, rollback, outbox lỗi, concurrent first save) và **2 RabbitMQ** (confirm/mandatory return). Gateway **8 tests**. Test ảnh cũ vẫn chạy, không xóa/disable.
- Spotless, Checkstyle, Error Prone, ArchUnit đều qua; `git diff --check` sạch. Chỉ sửa code catalog, route/security phí ở gateway và tài liệu; chưa commit/push.
- Chưa chạy startup catalog/V2, frontend render hay audit E2E với orchestrator. Build xanh và JDBC slice không thay thế các nghiệm thu đó.

## 9. C2: phạm vi đã làm và nghiệm thu còn thiếu

Đã đối chiếu trước code: [audit contract](c2-contract-audit.md). Lê Trần xác nhận chưa có contract được nhóm duyệt ngoài repo, cho phép chỉ triển khai phần đã xác nhận và cô lập legacy. Giữ nguyên code vendor/order/orchestrator/frontend, migration V2, writer entity/repository và test ảnh cũ. Migration mới chỉ thêm inbox/tombstone và backfill removal đã tồn tại.

- Runtime mặc định: read-only ProductListing/view, basic public reads và reviews; không storage upload/MinIO startup. Entity/repository legacy còn trong source/profile, không giả làm bản đọc và không còn chặn default entity scan.
- Core nội bộ đã chuẩn hóa theo row V2: transactional eventId dedup, bigint version gate, tombstone kể cả removed đến trước, vendor state stream độc lập product, reviewId dedup và aggregate kể cả reviews đến trước. Không dùng timestamp làm version.
- Rabbit chỉ capture minimum envelope đã chốt vào JSONB inbox; ACK sau commit, malformed/conflict vào DLQ, transient DB requeue. Không đánh processed hay sửa projection từ wire payload chưa duyệt. Tests core fixtures không phải producer contract tests.
- Recovery: đọc pending theo batch, giữ raw sau processing và rebuild rating từ reviews. **Full replay/rebuild chưa hoàn tất**: thiếu business adapter, snapshot/history feed và checkpoint của producer. Không xóa processed_events/tombstone để tự dựng rebuild giả.
- **Vendor endpoint chưa có** kể cả remote develop mới: không thể bàn giao/xóa writer. **Product event chưa chốt full/patch, field/envelope/tiers/sourceVersion wire; vendor.locked full/signal/shared version chưa chốt; review.created wire và review sửa/xóa chưa chốt.** C2 chưa nghiệm thu business event E2E.
- **Orchestrator adapter/dedup cho interprovince_fee.changed vẫn thiếu**, giữ pending C1 khi không route; không sửa ở C2.
- C2 chưa được công bố hoàn tất trước khi các blocker contract được giải quyết.

### Kết quả bản C2 cuối, 26/10/2026

- Lệnh Maven wrapper từ `api`: `-o -B -ntp clean verify`; kết thúc **BUILD SUCCESS lúc 17:31 (Asia/Saigon)**, cả parent và 11 module con thành công. Spotless/Checkstyle/Error Prone/ArchUnit qua, không thay cấu hình chất lượng.
- **371 tests: 371 pass, 0 failure, 0 error, 0 skip.** Cách đếm: đọc danh sách `<modules>` trong `api/pom.xml`, cộng thuộc tính tests/failures/errors/skipped của `target/surefire-reports/TEST-*.xml` chỉ ở các module đó sau clean verify; loại targets cũ của module đã xóa.
- **Catalog 99 tests:** 28 CatalogProjectionIntegrationTest (full SpringBootTest, PostgreSQL 17 + RabbitMQ 4.1 thật), 11 ProjectionInboxServiceImplTest mới, 60 tests C1/legacy/ArchUnit đã có. 28 test C2 gồm startup validate không legacy entity/repo/storage, upgrade backfill, text[]/jsonb/pg_trgm/view, immutable flush, version/review/eventId concurrency, tombstone, lock/unlock ở core, inbox retry/DLQ. Fixtures core nội bộ không được gọi là producer wire contract.
- C1 integration vẫn chạy đủ **6 PostgreSQL + 2 RabbitMQ**; gateway 8, identity 170, common-storage 32, common-reference 9, discovery/quotation/order/vendor/payment mỗi module 6, orchestrator 23. 11 test ảnh cũ giữ nguyên và pass.
- Lần chạy lúc 17:24 thất bại vì Docker engine chưa chạy: 1 lỗi hạ tầng, 8 skip; **không dùng làm bằng chứng pass**. Sau khởi động Docker, lần clean verify nêu trên chạy đầy đủ không skip. Không dùng H2, không disable test.
- `git diff --check` sạch; liên kết tài liệu catalog hợp lệ. V2, legacy product entities/repositories và test ảnh cũ so với C1 không đổi; writer service chỉ thêm profile. Không thay vendor/order/orchestrator/frontend hoặc cấu hình chất lượng. Chưa build image Docker/deploy; Dockerfile chỉ thêm copy common-reference cần cho runtime dependency.
- **C1 đã push:** `3cbb1ff433f7b4f50634fee67901bd1ae20453c3`; HEAD và origin/feat/catalog-service vẫn cùng commit này. **C2 chưa stage/commit/push/merge/deploy** theo gate. Tài liệu audit cũ ngoài scope vẫn được giữ nguyên.

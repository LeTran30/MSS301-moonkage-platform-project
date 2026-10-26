# Báo cáo Phase A–C — catalog

Ngày: 26/10/2026. Nhánh `feat/catalog-service`. Không push, merge vào develop/main hoặc deploy. Phase D cần xác nhận riêng của Lê Trần rằng contract đã được nhóm duyệt.

## Phase A — khóa C2, nhận develop

- A1 commit **local** `1e160ae`: C2 kỹ thuật đã kiểm chứng 371 tests ở phiên trước. Không đưa tài liệu audit cũ ngoài scope vào commit.
- Merge commit **local** `3227fed`, parents `1e160ae` và `6523d00`.
- Fetch thực tế: develop mới nhất là `6523d00`, mới hơn `d211767` trong prompt; bao gồm L-19 và migration catalog `V2026_10_22_1510__product_views_crust_filling.sql`.
- Lê Trần đã xác nhận ngoại lệ: **cho phép nhận migration đã merge từ develop; chỉ sửa tương thích catalog, không triển khai C3**. Giữ nguyên migration, không sửa/xóa checksum, không phục hồi cake_type hoặc tạo từ điển ở catalog.
- Merge `--no-ff`, không rebase. **Không có conflict Git**; Dockerfile/catalog API-DB docs tự merge. Giữ copy src/pom common-reference của C2, nhận VendorInfo.businessName từ develop.
- Sửa tương thích catalog: ProductListing/ProductProjectionRow/DTO/mapper/SQL/test fixture dùng crustCodes/fillingCodes (text[]) thay cakeType; chưa thêm search facets/filter, taxonomy writer hay business event adapter.
- Nội dung vendor/order/orchestrator/frontend và refactor identity đến từ develop nguyên trạng, không có sửa bổ sung của task catalog.
- Hai lần verify đầu dừng ở Checkstyle LineLength của SQL sau đổi cột; đã sửa, validate riêng catalog qua. Full `-o -B -ntp clean verify` kết thúc **BUILD SUCCESS 17:55:58, 393 pass / 0 fail / 0 error / 0 skip**, PostgreSQL/RabbitMQ thật. Catalog 99, identity mới 190, vendor mới 8; phần tăng so với 371 đến từ base develop. Đếm Surefire XML chỉ 11 module trong parent POM sau clean, không cộng target cũ. `git diff --check` sạch.

## Phase B — phạm vi recovery được phép

Chỉ dùng dữ liệu catalog đã lưu và contract tối thiểu đã xác nhận. Không tạo feed/snapshot giả, không suy diễn payload nghiệp vụ, không reset processed_events/tombstone. Checkpoint tạm để quét inbox không được coi là checkpoint nguồn producer.

- B1: batch rebuild rating_count/rating_avg từ reviews của sản phẩm hiện có. Không tái tạo product/vendor đã mất khi raw payload chưa có adapter được duyệt.
- B2: ProjectionReplayAdapter interface + ReplayCheckpoint placeholder; coordinator quét pending raw, không có adapter production → deferred. Entry service lock raw thật và áp core/kiểm marker đúng key cùng transaction, rollback khi lỗi. Checkpoint không persist, không phải watermark producer; mỗi run mới bắt đầu null.
- B3: [handoff cho orchestrator](orchestrator-handoff.md); không sửa service đó, không nhắn owner qua tool.
- B4: README, plan §9 và hai pseudocode class đã cập nhật. Full `-o -B -ntp clean verify` **BUILD SUCCESS 18:05:11, 403 pass / 0 fail / 0 error / 0 skip**; catalog 109 (38 full application tests), identity 190, vendor 8 và các module khác như A. Đếm Surefire XML theo đúng 11 module parent POM sau clean; PostgreSQL/RabbitMQ thật, không H2/disable/skip. Spotless/Checkstyle/Error Prone/ArchUnit qua; git diff --check sạch.
- Commit **local** Phase B: `1cf65c5`. Chỉ sửa catalog và tài liệu; các service khác bằng nguyên base develop đã nhận.

## Phase C — đề xuất cần duyệt

Đã soạn [contract-proposal.md](contract-proposal.md), đánh dấu **ĐỀ XUẤT, CHƯA ĐƯỢC NHÓM DUYỆT**: envelope/full snapshot, bắt buộc/null/arrays/tiers, sourceVersion, removal tombstone, vendor full lock/unlock/acceptsOrders, review immutable/correction, taxonomy L-19 và seed/hidden-label resolver, các phương án replay/feed/checkpoint. Không nối consumer nghiệp vụ theo tài liệu này. Dừng trước Phase D.

C chỉ thay tài liệu; giữ kết quả full verify B cho code không đổi, kiểm thêm JSON mẫu và local links/diff. Không chạy lại tests chỉ vì prose mới. Bản đề xuất không được dùng thay xác nhận nhóm duyệt.

## Blocker còn mở / gate

1. Vendor chưa có endpoint ghi sản phẩm thay thế: writer legacy và 11 tests cũ tiếp tục giữ; runtime mặc định không bật legacy.
2. Event wire chưa được duyệt: full/patch, envelope/tiers/version, removed/restore, locked full/signal, reviews và sửa/xóa. Chưa có adapter production; pending inbox không đồng nghĩa dữ liệu public đã cập nhật.
3. Full replay thiếu producer snapshot/history, completeness manifest/checkpoint và target generation; raw inbox chỉ đủ retry những gì đã nhận, không chứng minh toàn lịch sử.
4. Orchestrator chưa có domain audit adapter/dedup E2E cho phí; catalog giữ pending khi chưa route, queue consumer chịu retry sau khi đã route.
5. L-19 thuộc vendor; cần chốt cách đọc nhãn hidden đã gắn trên public products. Không tạo từ điển catalog theo plan §7 cũ.

Phase A/B hoàn thành phần đã được giao và xác nhận; **không tuyên bố C2 business E2E hoàn tất**. Chờ Lê Trần xác nhận “contract đã được nhóm duyệt” trước Phase D. Không push, merge vào develop/main hoặc deploy. C1 `3cbb1ff` vẫn là commit cuối trên remote feat/catalog-service tại lần kiểm tra này.

# Ghi chú phiên làm việc 2026-11-06 — chuẩn hoá kiến trúc & cổng chất lượng

> **Lưu trữ.** Tài liệu lịch sử, không cập nhật nữa và có thể đã khác code hiện tại. Hiện trạng: [docs/README.md](../README.md).
>
> Chi tiết phát hiện và backlog: [architecture/codebase-conformance-review.md](../architecture/codebase-conformance-review.md).
> Chuẩn áp dụng: [architecture/architecture-standards.md](../architecture/architecture-standards.md).

---

## 0. Tóm tắt

**Trạng thái:** Xong (2026-11-06) · **Nhánh:** `feat/ui-ux-standardization` · **PR:** [#98](https://github.com/LeTran30/MSS301-moonkage-platform-project/pull/98) · **Base:** `origin/develop` @ `ed704dd`

| Chỉ số | Giá trị |
|---|---|
| Commit | **6** (trên `origin/develop`) |
| File thay đổi | **718** (+20.191 / −8.847) |
| Backend (`api/`) | 192 file (+5.006 / −1.858) — thêm 49, xoá 21, đổi tên 14 |
| Frontend (`web/`) | 504 file (+11.379 / −6.960) — thêm 43, xoá 37, đổi tên 9 |
| Tài liệu (`docs/`) | 12 file (+3.573 / −15) |
| CI (`docs-links`, `web-quality`, `.githooks`, `.env.example`, `README.md`) | 7 file (+220 / −13) |
| Backend test | **926 test, 0 failure, 0 error** (128 surefire report) |
| Frontend test | `npm run check` → **87 file / 362 test**, bundle 1028,5 kB / ngân sách 1100 kB |
| E2E | **45 pass / 5 skip / 0 fail** (build thật, `vite preview` + API Gateway thật) |
| CI | 4/4 check xanh trên head `da12e04` |

**Phát hiện đã đóng:** 32/32 trong báo cáo đối chiếu, **+1 phát hiện M-13** phát sinh trong lúc làm (CSP nâng HTTP lên HTTPS ngoài production) → **33/33**.

---

## 1. Lịch sử commit

| # | SHA | Giờ | Tiêu đề | Nội dung chính |
|---|---|---|---|---|
| 1 | `aee85d0` | 02:04 | `refactor: consolidate shared modules, standardize architecture and quality gates` | 715 file · +19.526 / −8.841. Commit lõi: gộp 5 nhóm code trùng lặp ở backend, 11 controller đổi package, tách `VendorServiceImpl`, migration drop bảng legacy, 7 cổng chất lượng web mới, 2 tài liệu kiến trúc mới. Đóng 31/32 phát hiện. |
| 2 | `e0c6a7c` | 02:05 | `docs: close the remaining B-02 and H-05 findings in the conformance report` | 1 file · +4 / −4. Cập nhật bảng phát hiện cho khớp thực tế sau commit 1 (B-02 đã commit `check-no-spec-ids.mjs`; H-05 đã đồng bộ `show-sql` ở 7 service). |
| 3 | `767679a` | 06:31 | `fix(web): stop the CSP from upgrading HTTP requests to HTTPS outside production` | 11 file · +250 / −17. Tách `upgrade-insecure-requests` khỏi `CSP_DIRECTIVES`; chỉ thêm vào meta CSP khi origin là HTTPS; `connect-src` khai cả `http`/`https` + `ws`/`wss`; `reuseExistingServer: false` để E2E không chạy bundle cũ; thêm test khóa hành vi. |
| 4 | `e72a339` | 07:52 | `fix(web): reconcile the CSP and the E2E flow with the latest develop` | 4 file · +33 / −6. Giải quyết conflict rebase lên `origin/develop` (PR #94): gộp hai nguồn `connect-src` thành một cấu hình, giữ nguyên việc E2E nối API Gateway thật, xoá `apiStubs.ts`, không dùng `VITE_DEMO_MODE`. |
| 5 | `ceb4a9c` | 08:17 | `fix(web): declare the MinIO origin for the CSP of the E2E build in CI` | 5 file · +213 / −1. Truyền `VITE_MEDIA_BASE_URL` qua `webServer.env` + khai báo ở `web-quality.yml`; thêm gate `check-csp-media-origin.mjs` để lỗi thiếu biến lộ ra ở bước build chứ không phải bước E2E. |
| 6 | `da12e04` | 09:15 | `fix(web): wait for the real backend to be ready before running E2E in CI` | 3 file · +199 / −12. Thay vòng lặp `curl /actuator/health` bằng `wait-for-backend.mjs` — đăng nhập admin rồi probe 1 endpoint đại diện mỗi service; sẵn sàng = **mọi** probe trả 2xx. |

### Bối cảnh git

Nhánh được tạo từ `develop`, rebase lên `origin/develop` (`ed704dd`, PR #94 đã merge) với 26 file xung đột, 6 commit được viết lại (reword) sang tiếng Anh theo ràng buộc "không dùng tiếng Việt và phải đồng bộ" cho artefact quản lý. Branch cũ `feat/ui-ux-chuan-hoa` đã đóng và xoá; PR #95 bị thay bằng PR #98 (GitHub không cho đổi `head` của PR đã mở).

---

## 2. Backend (`api/`) — 192 file

### 2.1 Hai module dùng chung mới

| Module | Nội dung |
|---|---|
| `api/common-api/` (13 file) | `ApiResponse` (envelope duy nhất), `PageResponse`, `GatewayHeader` (`X-Account-Id`, `X-User-Role`, `X-User-Id`), `GatewayRole`, `CommonErrorCode` (**17** mã `COMMON_*`), `CommonExceptionHandler` (7 handler dùng chung) + auto-configuration đăng ký advice |
| `api/common-outbox/` (9 file) | `OutboxRelay` (đổi từ 4 bản trùng lặp), `EventExchange` (tên exchange chuẩn), `OutboxEventSource`, `OutboxEventRow`, `OutboxProperties`, `OutboxAutoConfiguration` |

**Kết quả:** 21 file Java trùng lặp bị xoá (`ApiResponse` ×5, `GatewayHeader` ×3, `OutboxRelay` ×4, `OutboxProperties` ×2, `PageResponse` ×1…). 6/7 service kế thừa `CommonExceptionHandler`; **catalog giữ riêng** vì trả mã `CAT_001`…`CAT_010` — tắt đăng ký chung bằng `moonkage.common-api.error-handler.enabled=false`.

### 2.2 Chuẩn hoá cấu trúc & cấu hình

- **11 controller** đổi package `web` → `controller` (identity ×4, vendor ×5, orchestrator ×1, catalog ×1). `orchestrator.web.ApiExceptionHandler` ở lại — là `@RestControllerAdvice`, không phải controller.
- **`@Value` → `@ConfigurationProperties`**: 6 nhóm (`nfc`, `jwt` ×3, `moonkage.cors` ×2). 4 `@Value` đơn lẻ giữ nguyên vì không có nhóm bạn cùng.
- **`VendorServiceImpl`**: 490 → **246 dòng**, tách 4 collaborator (`VendorSubmissionService` 167, `VendorDocumentService` 113, `VendorReviewService` 67, `VendorFeePaymentService` 53). Giữ làm façade nên không call site nào đổi.
- **Cổng chất lượng Java**: `open-in-view: false` + `server.shutdown: graceful` ở cả 7 service; `show-sql: ${JPA_SHOW_SQL:false}`.

### 2.3 Gateway — ADR D-30 (HTTP 308)

`api/api-gateway/.../LegacyPathRedirectFilter.java` (mới, 131 dòng) trả **HTTP 308** cho đường dẫn cũ có tên service → đường dẫn chuẩn `/api/<resource>`, giữ nguyên method và body.

Đặt ở `Ordered.HIGHEST_PRECEDENCE` **trước** chuỗi Spring Security — nếu là `GlobalFilter` thì chạy sau security, và đường dẫn cũ cần token (`PUT` bảng phí = admin) sẽ bị `403` trước khi tới được redirect.

| Đã migrate (có 308) | Chưa migrate (giữ locator) |
|---|---|
| `catalog`, `vendor`, `orchestrator` | `identity`, `quotation`, `order`, `payment` |

`SecurityConfig` chuyển sang dùng `GatewayHeader` thay cho hằng số cục bộ; `JwtProperties` + `CorsProperties` mới; `RateLimitFilter` dùng `GatewayHeader.ACCOUNT_ID`.

### 2.4 Dữ liệu

- Migration `V2026_11_06_1000__drop_legacy_products_table.sql` (catalog) — drop `products`, `product_price_tiers`, `product_images`, idempotent. `V1__baseline.sql` **không** sửa (Flyway kiểm checksum).
- Test `LegacyProductsTableMigrationTest` ghim trạng thái cuối.

### 2.5 Test backend

Thêm 15 file test: `LegacyPathRedirectFilterTest` (219 dòng, 11 test), `GlobalExceptionHandlerTest` (catalog, 173 dòng), `CommonErrorHandlerRegistrationTest`, `LegacyProductsTableMigrationTest`, `ApiResponseTest`, `CommonErrorCodeTest`, `CommonExceptionHandlerTest`, `OutboxRelayTest`, `PiiMaskerTest`, `GlobalExceptionHandlerTest` (quotation/vendor/payment), `ApiExceptionHandlerTest` (orchestrator)…
Kết quả: **926 test, 0 failure, 0 error**.

---

## 3. Frontend (`web/`) — 504 file

### 3.1 Bảy cổng chất lượng mới (script trong `web/scripts/`)

| Script | Chặn cái gì |
|---|---|
| `check-no-spec-ids.mjs` (224 dòng) | Mã đặc tả (`FR-06`, `M6.1.3`, `FLOW 5`…) lọt ra chuỗi hiển thị cho người dùng |
| `check-responsive.mjs` (261 dòng) | CSS Module có lưới ≥2 cột / bảng rộng / `width` cố định mà **không** có `@media` |
| `check-contrast.mjs` (113 dòng) | Token màu rơi dưới WCAG AA 4,5:1 (light + dark) |
| `check-fsd-layers.mjs` (110 dòng) | `shared` import từ slice khác, `entities` import `features`… |
| `check-orphan-css.mjs` (75 dòng) | `.module.css` không có file TSX tương ứng |
| `check-csp-media-origin.mjs` | Bundle build không khai origin của object storage trong `img-src` |
| `wait-for-backend.mjs` | E2E chạy trước khi backend thật sẵn sàng |

Tất cả nối vào `npm run check`, `.githooks/pre-commit` **và** CI. Ngoài ra `check-css-modules.mjs` và `check-bundle-size.mjs` đã có.

### 3.2 Design system & UI

- **Contrast WCAG AA**: `--color-text-subtle` `#9d8877` → `#766150` (light) và `#8c7a68` → `#a4947f` (dark); tách `--color-gold` (trang trí) khỏi `--color-gold-text` (`#855f16` / `#e8bf74`) để chữ dùng màu đủ tương phản.
- **`Icon`**: thêm 15+ icon SVG path (`users`, `mapPin`, `upload`, `download`, `truck`, `store`, `settings`, `phone`, `eye`, `eyeOff`, `lantern`, `percent`, `key`…) để thay emoji.
- **Component mới**: `Checkbox` (98 dòng), `Radio` (96), `Textarea` (61), `StarRating` (39), `ProductImage` (30), mỗi cái kèm test.
- **`Select`**: nâng từ bản cơ bản lên 328 dòng — custom listbox, placeholder, `aria-*`.
- **Responsive**: header thêm `HeaderMobileNav.tsx` (154 dòng) + `HeaderTopBar` + `HeaderUserMenu`; `Header.module.css` +222 dòng; sidebar thêm `SidebarDrawer.tsx` (152 dòng, kèm test 83 dòng).
- **Layout**: thêm `AdminLayout`, `VendorLayout`, `AccountLayout`; `SidebarDrawer` thay cho `ActorSwitcherModal` (xoá 75 dòng).

### 3.3 Vòng đời phiên & điều hướng

- `SessionBridge.tsx` (mới, 61 dòng) khôi phục phiên — sửa race làm hard reload đá người dùng về `/dang-nhap` trong khi header vẫn hiện đã đăng nhập.
- `guards/` tách `RequireAuth` / `RequireAdmin` / `RequireNfc` + test (163 dòng).
- `features/file-upload/` — **slice FSD mới** (`api/uploadFile.ts` + `model/useFileUpload.ts` + `index.ts`); `shared/api` chỉ giữ phần transport.
- `features/edit-vendor-settings/` — slice mới.
- `routes.tsx` +158 dòng.

### 3.4 Breakpoint token

`var()` **không** dùng được trong `@media` (bị bỏ qua âm thầm, `lightningcss` ném lỗi lúc minify ⇒ build đỏ). Vì vậy thêm plugin `web/vite/breakpointTokens.ts` (69 dòng) đọc `--breakpoint-*` từ `tokens.css` và thay bằng px trước khi CSS được xử lý — token vẫn là nguồn sự thật duy nhất, CSS nguồn vẫn đọc `@media (max-width: var(--breakpoint-md))`.

### 3.5 E2E nối API thật

- Xoá `web/e2e/apiStubs.ts` (107 dòng) — không còn chế độ demo.
- `playwright.config.ts`: `reuseExistingServer: false` (luôn build mới), `webServer.env` truyền `VITE_MEDIA_BASE_URL`.
- Thêm `flow-08-sidebar-drawer.spec.ts`; sửa `flow-01/03/05/06/07` + `foundation` + `helpers.ts` (127 dòng).
- 6 ảnh giả trong `web/public/images/` bị xoá — ảnh thật đến từ MinIO.

---

## 4. Tài liệu & CI — 19 file

### Tài liệu mới (2)

| File | Nội dung |
|---|---|
| `docs/architecture/architecture-standards.md` | Chuẩn kiến trúc bắt buộc: 10 chương, mỗi luật có **Mức độ bắt buộc** · **Lý do** · **Ví dụ đúng/sai** (trích từ code thật) |
| `docs/architecture/codebase-conformance-review.md` | Rà soát code thực tế: 33 phát hiện (3 Blocker, 10 High, 13 Medium, 7 Low) + backlog P0/P1/P2; **33/33 đã đóng** |

### Tài liệu sửa (10)

`docs/README.md` (bản đồ tài liệu, bảng "Cố ý không có README"), `docs/architecture/api-db/README.md`, `docs/architecture/api-db/decisions.md` (ADR D-25 → D-30, D-30 khớp 308), `docs/guides/database.md` (sổ ID), `docs/services/identity/README.md` (role `MEMBER`/`ADMIN` theo D-19), 4 README service mới (`orchestrator`, `order`, `payment`, `common-storage`), script `docs/scripts/check-class-docs.mjs`.

### CI

- `.github/workflows/web-quality.yml`: +107 dòng — 7 bước gate mới, dựng stack Docker thật, `wait-for-backend.mjs`, khai báo `VITE_MEDIA_BASE_URL`.
- `.github/workflows/docs-links.yml`: +11 dòng — bước **Check class docs match source**, trigger khi `api/**/*.java` đổi.
- `.githooks/pre-commit`: +30 dòng — 4 gate web mới.
- `.env.example`: +49 dòng — khai báo biến môi trường (rate limit, NFC, OTP, MinIO, sweep tồn kho).
- `README.md`: cập nhật số màn hình (73 → **64**), thêm `common-observability`, bỏ "chế độ demo".

---

## 5. Ba lỗi hạ tầng đã phát hiện & sửa

Ba lần chạy E2E đỏ liên tiếp — **không phải** lỗi sản phẩm mà là lỗi hạ tầng. Cả ba đều đã được sửa bằng nguyên tắc "lỗi hạ tầng phải lộ ra ở bước sớm hơn, không được giấu dưới dạng lỗi sản phẩm".

| # | Triệu chứng | Nguyên nhân gốc | Cách sửa |
|---|---|---|---|
| 1 | 5 test đỏ — catalog rỗng, chi tiết sản phẩm timeout | `upgrade-insecure-requests` nằm trong `CSP_DIRECTIVES` ⇒ meta CSP của bundle cũng mang directive. Origin loopback là *potentially trustworthy* nên browser vẫn nâng `http://127.0.0.1:8080` → `https://127.0.0.1:8080`, mà `connect-src` chỉ khai `http://` | Tách directive ra khỏi `CSP_DIRECTIVES`; `applyCspMeta` chỉ thêm khi origin là HTTPS; `connect-src` khai cả `http`/`https` + `ws`/`wss`; thêm test khóa cả hai nhánh |
| 2 | 2 test đỏ — ảnh MinIO bị chặn | CI có checkout sạch, **không** có `web/.env` (file local đã gitignore) ⇒ `VITE_MEDIA_BASE_URL` rỗng ⇒ `img-src 'self' data: blob:` chặn mọi ảnh. Local xanh vì có `.env` — đúng mẫu "CI lệch local" | Truyền `VITE_MEDIA_BASE_URL` qua `webServer.env` + khai báo ở `web-quality.yml`; thêm gate `check-csp-media-origin.mjs` để lỗi lộ ra ở bước build |
| 3 | Test "trang … không lỗi console" đỏ vì 503 | Gateway trả **200** cho `/actuator/health` trong khi route nghiệp vụ vẫn trả **503** (`No servers available for service: …`) — service chưa đăng ký Eureka | `wait-for-backend.mjs`: đăng nhập admin rồi probe 1 endpoint đại diện mỗi service; sẵn sàng = mọi probe trả 2xx (503 = chưa đăng ký, 500 = đang khởi động, không trả lời = chưa xong) |

> Lỗi 3 có một phát hiện phụ đáng ghi nhớ: `reuseExistingServer: false` mặc định của Playwright là `true` khi server đã chạy ⇒ E2E từng chạy trên **bundle cũ** và xanh giả. Đã đặt lại `false` để luôn build mới.

---

## 6. Còn nợ (không do phiên này)

| Hạng mục | Vị trí | Ghi chú |
|---|---|---|
| 4 service chưa phục vụ đường dẫn chuẩn ⇒ `discovery.locator` còn bật | `api/api-gateway/src/main/resources/application.yml:22-34` | Cần xác nhận từ **app mobile** (ngoài repo) trước khi migrate `identity`/`quotation`/`order`/`payment` và tắt locator |
| 4 thư viện dùng chung chưa có tài liệu | `P2-12` | `common-api`, `common-outbox`, `common-reference`, `common-observability` — ước lượng 1 ngày |
| ADR D-25 → D-30 vẫn ghi "Đề xuất" | `docs/architecture/api-db/decisions.md` | Code đã hiện thực; cần BE lead chốt Status |
| PR #98 cần duyệt | `.github/CONTRIBUTING.md` §14 | PR đụng `web-quality.yml` + `docs-links.yml` ⇒ cần team-lead duyệt |

---

## 7. Cách kiểm tra lại

```bash
cd api && ./mvnw -B -ntp clean verify    # 15/15 module, 926 test, 0 fail
cd web && npm run check                   # 8 gate + tsc + vitest + build + bundle budget
cd web && npm run e2e                     # 45 pass / 5 skip (cần docker compose up -d)
node web/scripts/wait-for-backend.mjs     # backend thật sẵn sàng
node docs/scripts/check-class-docs.mjs    # tài liệu class khớp mã nguồn
```

CI tương ứng: `code-quality.yml` (`verify`), `web-quality.yml` (`verify`), `docs-links.yml` (`links`), `pr-conventions.yml` (`check`).

# SO SÁNH `web` (main) vs `temp/web-temp/moonkage-web`

> **Ghi chú (04/11/2026):** tài liệu lịch sử. Bản `temp/web-temp/moonkage-web` đã **thay thế**
> thư mục `web/` cũ, nên hiện chỉ còn một bản web duy nhất ở `web/` — đây là bản của cột
> `temp`. Số liệu trong báo cáo giữ nguyên theo thời điểm 02/11/2026.

Ngày: 02-11-2026

| | `web` (main) | `temp/web-temp/moonkage-web` |
|---|---|---|
| Vị trí | `MSS301-moonkage-platform-project/web` (tracked git, 592 file) | `temp/web-temp/moonkage-web` (ngoài repo) |
| Tổng file `src` | 577 | 439 |
| LOC (`ts/tsx/css`) | ~21.178 | ~32.749 |

---

## 1. Kết luận tổng quát

**Bản `web` gốc vượt trội về kiến trúc FSD và đúng với bộ luật dự án.** Bản `temp` có điểm mạnh ở *chất lượng cục bộ* (test nhiều hơn, CSS Modules 100%, token chặt hơn) nhưng **sai lệch kiến trúc so với luật đã ghi trong `package-architecture.md`** — đặc biệt là phân tầng API.

> Điểm mấu chốt: luật dự án quy định
> *`api/` của **feature** chỉ có hàm ghi. Hàm đọc, type, nhãn trạng thái và giao diện thuần thuộc `entities`.*
> Bản `web` tuân thủ đúng. Bản `temp` **đảo ngược**: toàn bộ hàm ghi nằm trong `entities/*/api/`, feature không có `api/` nào.

---

## 2. Phân tầng API — khác biệt lớn nhất

| Tiêu chí | `web` | `temp` | Đánh giá |
|---|---|---|---|
| Feature có `api/` riêng | **26 / 31 feature** | **0 / 28 feature** | `web` ✅ |
| `features/*/api/` có hàm ghi (POST/PATCH/PUT/DELETE) | 23 feature (đúng luật) | 0 | `web` ✅ |
| `entities/*/api/` có hàm ghi | 3 file / 5 lệnh (chỉ `cart`, `orderFiles`, `session`) | **12 file / 42 lệnh** | `web` ✅ |
| Entity có `model/` | 12 / 12 | 10 / 10 | ngang |
| Entity có `ui/` | 10 / 12 | **2 / 10** | `web` ✅ |

Chi tiết `temp`: `entities/vendor/api/vendorApi.ts` (10 write), `entities/user/api/sessionApi.ts` (6), `entities/order/api/orderDocumentApi.ts` (5), `entities/cart|dispute|order|ledger|quote` (mỗi file 2–3 write).
→ Đây chính là lý do `temp` phải "vá" circular dependency bằng cách tách `disputeDecision.ts`, `useCartSync.ts`…: khi hàm ghi nằm trong entity, entity tự tham chiếu → vòng phụ thuộc. `web` không gặp vấn đề này vì hàm ghi nằm ở feature.

## 3. Phân bố UI theo tầng (FSD)

| Tầng | `web` (tsx / thư mục `ui/`) | `temp` (tsx / thư mục `ui/`) |
|---|---|---|
| `pages` | 68 / 0 | 63 / 0 |
| `widgets` | 14 / 10 | 6 / 5 |
| `features` | **37 / 30** | **4 / 4** |
| `entities` | **28 / 10** | **2 / 2** |
| `shared` | 17 / 1 | 16 / 1 |

`web` đẩy UI xuống feature/entity (widget `admin-overview`, `buying-guide`, `vendor-channel-gate`…; entity `OrderList`, `VendorOrders`, `NotificationBell`…). `temp` gần như **không có UI ở tầng dưới** → page tự dựng toàn bộ markup.

Hệ quả trực tiếp — độ dài page:

| | `web` | `temp` |
|---|---|---|
| Page > 250 dòng | **0** | **13** (`OrderDetailPage` 409, `SellRegisterPage` 408, `AdminDisputesPage` 337, `VendorOrdersPage` 325, `NfcVerifyPage` 318…) |
| Page có CSS Module riêng | 2 | 62 |

`temp` sạch CSS hơn nhưng vì page tự chứa UI, không có tầng tái sử dụng → 63 page × CSS riêng là 63 nơi sửa UI.

## 4. Widgets

| | `web` | `temp` |
|---|---|---|
| Widget | 10 (`account-sidebar`, `admin-bar`, `admin-overview`, `buying-guide`, `footer`, `header`, `sell-intro`, `vendor-bar`, `vendor-channel-gate`, `vendor-overview`) | 5 (`auth-shell`, `command-palette`, `footer`, `header`, `sidebar`) |

`temp` có thêm `command-palette` và gộp `sidebar` chứa cả Admin + Vendor — **vi phạm L7**: 1 widget chứa 2 miền nghiệp vụ khác nhau.

## 5. Chất lượng & tooling

| Tiêu chí | `web` | `temp` |
|---|---|---|
| `tsc -b` | ✅ 0 lỗi | ✅ 0 lỗi |
| `oxlint` | ✅ sạch | ✅ sạch |
| `madge --circular` | ✅ **No circular dependency** | ✅ (đã vá 3 vòng) |
| `vite build` | ✅ 2.36s | ✅ 3.79s |
| Unit test | 12 file / **38 test** | 46 file / **263 test** |
| Hardcoded hex (trừ `tokens.css`) | **0** | 1 |
| Inline `style={{}}` | 6 (trong `shared/ui`, `RouteErrorBoundary`) | **1** |
| CSS Modules | 88 file | 97 file (100% component) |
| Script `lint:css` kiểm tra class thiếu | ❌ | ✅ `scripts/check-css-modules.mjs` |
| `cn.ts` (ghép class) | ✅ | ❌ |
| Dark theme | `shared/config/theme.ts` | `tokens-dark.css` + `themeStore` + test |
| Realtime / WebSocket | ✅ `shared/api/realtime/` (RealtimeProvider, useRealtime) | ❌ **không có** |
| `.env` | 6 biến (poll NFC, poll VNPay, interval) | 3 biến (base URL, DEMO_MODE, WS_URL) |
| Demo/seed | 19 file (`shared/api/demo.ts`, `mock.ts`, seed per entity) | 3 file |

**Bundle (đã build cả hai):** `web` ~1.784 KB tổng asset vs `temp` ~1.054 KB. `temp` nhỏ hơn vì không có phần realtime + ít seed, nhưng `web` có code-splitting rõ ràng (`routes-Df9kQRT_.js`, `demo-*.js`, `verify-nfc-*.js`).

## 6. Phạm vi nghiệp vụ

Hai bản **khác tập tính năng**, không phải cùng một sản phẩm:

- `web` (63 page): có `vouchers`, `taxonomy`, `reconciliation`, `province-fees`, `vendor-capacity`, `vendor-settlements`, `vendor-terms`, `vendor-zones`, `notifications` (riêng account + vendor), `quote-request-detail`, `accept-quote`, `apply-to-sell`, `product-detail` (vendor), `order-complaint`, `config-error`…
- `temp` (63 page): có `bulk` (BulkHub), `cake-catalog`, `manage-cake-attributes`, `opening-fee`, `interprovince-fee`, `request-compare`, `sitemap`, `pay-remainder`, `switch-persona`, `verify-account`, `register-vendor`, `configure-registration-fee`, `deposit-payment`…

→ `web` là bản **đã nối backend thật** (commit `6e990f4 feat: Identity domain refactor and web wired to the backend`); `temp` là bản **demo/prototype với persona switch + mock trong bộ nhớ**.

---

## 7. Bảng điểm

| Mục | Trọng số | `web` | `temp` |
|---|---|---|---|
| Tuân thủ FSD (phân tầng layer) | 20 | **9.5** | 6.0 |
| Tuân thủ luật `api/` (feature ghi / entity đọc) | 15 | **9.0** | 4.0 |
| Trách nhiệm UI (page mỏng, tái sử dụng) | 15 | **9.0** | 5.0 |
| L6/L7 (page không gọi API, barrel export) | 10 | **9.5** | 9.5 |
| L1 AsyncState | 10 | 8.5 | 8.5 |
| L2 CSS/token | 10 | 8.0 | **9.5** |
| L4 idempotent write | 5 | 9.0 | 9.0 |
| Test coverage | 10 | 5.0 | **9.5** |
| Tooling / CI-quality (lint:css, cn.ts) | 5 | 6.5 | **8.5** |
| **Tổng** | 100 | **8.5** | **7.4** |

**Điểm yếu còn lại của `web`:** thiếu test (chỉ 38 test), còn 6 inline style, chưa có `lint:css`, chưa có `cn.ts`, chưa có dark theme token, chưa có WebSocket realtime.

---

## 8. Khuyến nghị

**Hướng điểm chính: lấy `web` làm nền, chọn lọc từ `temp`.**

1. **Giữ nguyên `web`.** Đừng merge `temp` vào `web` — `temp` đảo ngược luật phân tầng API của dự án và làm loãng UI xuống page.
2. **Lấy từ `temp` sang `web`:**
   - `scripts/check-css-modules.mjs` → thêm `lint:css` vào `npm run check`.
   - `shared/lib/cn.ts`.
   - Hệ dark theme (`tokens-dark.css` + `themeStore.ts`) — `web` mới chỉ có `shared/config/theme.ts`.
   - Bộ test (46 file / 263 test) — nhưng phải viết lại theo cấu trúc `web`.
   - `useAction` mở rộng hơn (`setError`) — cân nhắc đưa sang `web`.
3. **Với `web`, ưu tiên sửa 4 điểm còn lại:** (a) bổ sung test cho `entities/*/model` và `features/*/model`, (b) dọn 6 inline style còn lại, (c) thêm `lint:css`, (d) tách `place-order` (feature duy nhất còn thiếu `ui/`).
4. **Nếu bản `temp` phải sống tiếp:** cần migrate ~42 hàm ghi từ `entities/*/api/` lên `features/*/api/` và đẩy UI từ page xuống feature/entity — đây là refactor lớn, ước tính 40–60% khối lượng công việc đã làm trước đó.

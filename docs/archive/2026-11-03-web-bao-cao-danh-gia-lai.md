# BÁO CÁO ĐÁNH GIÁ & SO SÁNH LẠI — `web/` vs `moonkage-web`

> **Lưu trữ (2026-11-08):** báo cáo đánh giá frontend theo thời điểm, chuyển từ `web/doc/`. Tài liệu hiện hành: [architecture-standards.md](../architecture/architecture-standards.md) §6 (Frontend) và [web-package-architecture.md](../architecture/web-package-architecture.md).

**Ngày đo:** 02/11/2026, 03:00–03:05 (giờ VN)
**Bản temp được đo:** `C:\Workspace\MSS301\temp\web-temp\moonkage-web` (cập nhật mới nhất 02:41–02:46)
**Bản thật:** `C:\Workspace\MSS301\MSS301-moonkage-platform-project\web` (commit `6e990f4`, không bị thay đổi)
**Cơ sở:** đo đạc thực tế bằng `oxlint`, `vitest run`, `tsc -b`, `vite build`, đếm file/thuộc tính bằng script, và đọc trực tiếp mã nguồn.

---

## 0. Tóm tắt điều hành

| | Điểm |
|---|---|
| `web/` (bản thật) | **8.3 / 10** |
| `moonkage-web` (temp) | **4.2 / 10** — tăng từ ~3.8 sau lần cập nhật này |
| Khoảng cách | **4.1 điểm** — temp vẫn ở khoảng 50% chất lượng bản thật |

**Kết luận một câu:** Lần cập nhật 02:41–02:46 đã đóng thật 3 hạng mục P0 (`T-04` sai endpoint, `T-13` error boundary theo layout, `T-18` `RequireNfc` mất `search`/`hash`) và tăng số test từ 36 → 46; **nhưng** 3 module mới (`AsyncState`, `useAsync`, `validators`) mới chỉ được *định nghĩa* chứ chưa được *áp dụng* ở bất kỳ đâu, và 3 lỗi cấu hình mới phát sinh (demo mode mặc định bật, `apiBaseUrl` default im lặng, `executeApiOrDemo` nuốt lỗi) làm **giảm** độ tin cậy so với chính bản demo trước đó.

---

## 1. Những gì temp vừa sửa (02:41–02:46)

### 1.1 Đã hoàn thành thật

| # | Hạng mục | Bằng chứng |
|---|---|---|
| 1 | **T-04** — `gateway.ts` sai endpoint | `src/shared/api/__tests__/gateway.test.ts` assert khoá hợp đồng: `/identity-service/api/accounts/me`, `/quotation-service/api/suppliers`, `/order-service/api/orders/{id}/dispute` (số ít — đúng `DisputeController`), `/payment-service/api/ledgers/{id}/payout` |
| 2 | **T-13** — Error boundary theo layout | `src/app/layouts/LayoutErrorBoundary.tsx` — bọc trong cả 4 layout (Base/Vendor/Admin/Account), có **auto-reload 1 lần** khi lỗi chunk hash sau deploy (`sessionStorage` guard key `mk_chunk_reload_*`) |
| 3 | **T-18** — `RequireNfc` mất `search`/`hash` | `src/app/guards/RequireNfc.tsx` giờ truyền `location.pathname + location.search + location.hash` vào `state.returnUrl` |
| 4 | **T-21 (một phần)** — test | 46 test / 8 file (trước: 36 test / 6 file). Thêm `gateway.test.ts`, `validators.test.ts` |

### 1.2 Định nghĩa xong nhưng chưa áp dụng — "dead infrastructure"

Grep toàn bộ `src/pages/`, `src/widgets/`, `src/entities/`, `src/features/`:

| Module | File | Kết quả grep |
|---|---|---|
| `AsyncState` | `src/shared/ui/AsyncState/AsyncState.tsx` | **0 lần dùng** |
| `useAsync` | `src/shared/lib/useAsync.ts` | **0 lần dùng** |
| `validators` | `src/shared/lib/validators.ts` | **0 lần dùng** |
| `useAction` | `src/shared/lib/useAction.ts` | 1 lần dùng (`CheckoutPage.tsx`) |

Đây là mẫu "định nghĩa xong thì dừng" — không tạo giá trị người dùng cảm nhận được, không có test chứng minh hoạt động, và làm tăng diện tích bảo trì.

### 1.3 Sửa một nơi, còn sót 11 nơi (T-19)

Đã sửa:
```
CheckoutPage.tsx  →  crypto.randomUUID()   thay cho Date.now()
```

Còn sót:
| File | Chuỗi ID tự sinh |
|---|---|
| `features/quote/ui/SubmitQuoteModal.tsx:27` | `QUO-${Date.now().toString().slice(-4)}` |
| `pages/account/orders/OrderDisputePage.tsx:27` | `DISP-${Math.floor(100 + Math.random() * 900)}` |
| `pages/account/requests/RequestComparePage.tsx:15` | `MK-${Math.floor(8000 + Math.random() * 1999)}` |
| `pages/account/requests/RequestComparePage.tsx:69` | `DEP_${Date.now()}` |
| `pages/base/bulk/NewQuoteRequestPage.tsx:36` | `REQ-${Math.floor(500 + Math.random() * 500)}` |
| `pages/base/checkout/CheckoutPage.tsx:41,43` | `tmp_pay_${crypto.randomUUID()}`, `tmp_order_${...}` (vẫn là ID tạm) |
| `pages/base/sell/SellRegisterPage.tsx:32` | `ven_${Date.now()}` |
| `pages/base/vendors/DirectQuoteRequestPage.tsx:37` | `REQ-${Math.floor(600 + Math.random() * 400)}` |
| `pages/gateway/vnpay/VnPaySandboxPage.tsx:29` | `PAY_` + `Date.now()` |
| `pages/vendor/overview/VendorOverviewPage.tsx:46` | `FEE_${Date.now()}` |
| `pages/vendor/products/VendorProductsPage.tsx:116` | `p-${Date.now()}` |

---

## 2. Bảng so sánh định lượng

Đo lại toàn bộ lúc 02:53–03:05, không dùng khẳng định tĩnh.

| Tiêu chí | `web/` | `moonkage-web` | Chênh lệch |
|---|---|---|---|
| Tổng file `src/` | 577 | 249 | web **2.3×** |
| `.tsx` | 175 | 101 | web **1.7×** |
| `.ts` | 308 | 79 | web **3.9×** |
| `.css` | 91 | 69 | |
| CSS Module | 88 | 66 | web +33% |
| Route (`path:`) | 70 | 67 | gần bằng |
| **Features slice** | **31** | **4** | web **7.8×** |
| Entities | 12 | 8 | |
| Widgets | 10 | 4 | |
| Pages (folder) | 74 | 34 | |
| **`api/` modules** | **51 file** | **0** | web **∞** |
| **Call site API thật** | **170** | **7** (toàn bộ trong `shared/api/client.ts`) | web **24×** |
| `useEffect` trong `src/` | 26 | **0** | |
| Test file / test | 12 / 38 | 8 / **46** | temp nhiều test, web phủ rộng |
| `aria-*` | **182** | 35 | web **5.2×** |
| `role=` | **46** | 12 | web **3.8×** |
| `alt=` | 10 | 17 | temp |
| Inline `style={{}}` | **6** | **457** | web **76× sạch hơn** |
| `focus-visible` / `prefers-reduced-motion` | **25** | 2 | web **12×** |
| `@media` | 19 | 15 | |
| Token CSS | 90 (dark phủ **25/25 = 100%**) | 160 (dark phủ **32/106 = 30%**) | web hơn |
| `dist` | 1.83 MB / 145 chunk | 1.94 MB / 116 chunk | |
| `<img>` / có `loading="lazy"` | 8 / 1 | 17 / 4 | temp |
| Router data API (`loader`/`action`/`useFetcher`) | 14 | 20 | temp |

### Kiểm tra chất lượng (chạy thật)

| | `web/` | `moonkage-web` |
|---|---|---|
| `oxlint` | 0 cảnh báo | 0 cảnh báo |
| `tsc -b` | exit 0 | exit 0 |
| `vitest run` | 38 pass / 12 file | **46 pass / 8 file** |
| `vite build` | ✓ built | ✓ built (1.22s) |

---

## 3. Vấn đề mới phát sinh từ lần cập nhật này

### 🔴 N1 — `demoMode` mặc định BẬT (P0, an toàn sản phẩm)

```typescript
// temp/src/shared/config/env.ts
isDemoMode: env.VITE_DEMO_MODE !== 'false',   // Mặc định bật song song với API
```
```typescript
// web/src/shared/config/env.ts
demoMode: import.meta.env.VITE_DEMO_MODE === 'true',   // mặc định TẮT
```

Hệ quả: build production mà quên set env → **toàn bộ app chạy dữ liệu giả**, người dùng thật thấy dữ liệu giả mà không có cảnh báo nào.

### 🔴 N2 — `apiBaseUrl` default im lặng làm vô hiệu hoá kiểm tra cấu hình

```typescript
// temp
apiBaseUrl: env.VITE_API_BASE_URL || 'http://localhost:8080',
...
export function isConfigValid(): boolean { return Boolean(ENV.apiBaseUrl); }  // luôn true
```
```typescript
// web
apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').trim(),
// → isConfigValid() false → app dừng ở màn lỗi cấu hình
```

Temp đã có `isConfigValid()` nhưng vì đã có default nên hàm này **luôn trả `true`** → màn lỗi cấu hình không bao giờ hiện.

### 🔴 N3 — `executeApiOrDemo` nuốt lỗi API → fallback demo

```typescript
// temp/src/shared/api/demo.ts
return apiCall().catch((err) => {
  console.warn('[Moonkage Gateway] API thất bại, tự động chuyển về Demo Mode fallback:', err);
  return demoFallback();
});
```

Đây chính xác là anti-pattern "thôi giấu lỗi" mà `ket-hoach-cai-tien-temp.md` đã gọi tên ở Phase 1. Ở `web/`, `config.demoMode` là **điều kiện tường minh** (`if (config.demoMode) return mockResponse(...)`), không phải `catch`. Temp đã viết lại `demo.ts` theo hướng ngược lại so với bản thật.

### 🟠 N4 — `LayoutErrorBoundary` dùng nặng inline style, tự mâu thuẫn với T-17

File mới nhất (02:41) vẫn dùng inline style cho gần như toàn bộ UI fallback (~10 khối `style={{}}`), trong khi T-17 yêu cầu dọn 457 inline style. Đồng thời nó **không có CSS Module** trong khi `RouteErrorBoundary` (cũ hơn) thì có → 2 phong cách xử lý lỗi khác nhau trong cùng `app/`.

### 🟠 N5 — `AsyncState` không phân biệt được `empty` khi data không phải array

```typescript
if (Array.isArray(state.data) && state.data.length === 0 && empty) { return <>{empty}</>; }
```
Trường hợp `data = { content: [], total: 0 }` (kiểu phân trang của `catalog-service`) → **không** rơi vào nhánh empty → hiển thị empty UI rỗng. `web/` xử lý `PageResponse<T>.content` riêng biệt.

### 🟡 N6 — `useAsync` không có cache → chưa đạt mục tiêu T-15

Mục tiêu gốc của T-15 là *"không fetch lại mỗi lần vào trang"* (query cache). Bản port chỉ là `useEffect` + `nonce` → **không có cache**, không thay đổi hành vi. Tên `useAsync` giống `web/` nhưng ngữ nghĩa khác → dễ gây hiểu nhầm khi port tiếp.

### 🟡 N7 — Cần verify `Icon` có `name="alert"` không

`LayoutErrorBoundary` gọi `<Icon name="alert" size={28} />` và `<Button variant="primary" size="sm">`. Trong `src/shared/ui/Icon/Icon.tsx` đã đọc 30 dòng đầu, `paths` chứa `search, cart, bell, user, users, chevron*, mapPin, x, check, plus, minus, upload, download, filter, star, truck, file, shield, store, factory, package, wallet, settings, home, logout…` — **chưa thấy `alert`**. Nếu thiếu → runtime render `undefined` → icon rỗng ở đúng màn hình lỗi (nơi cần tín hiều báo cao nhất).

### 🟡 N8 — `ROUTES` và `routes` vẫn trùng tên trong `shared/config/routes.ts`

```typescript
export const routes = { ... }   // dùng cho URL
export const ROUTES = { ... }   // dùng cho redirect
```
Hai hằng số cùng nghĩa trong cùng file → dễ nhầm khi refactor (T-22 chưa xong).

---

## 4. So sánh chất lượng chi tiết theo trục

### 4.1 Tích hợp API thật — khoảng cách lớn nhất

| | `web/` | `moonkage-web` |
|---|---|---|
| Module `api/` | 51 file, phân bổ theo `entities/*/api/` và `features/*/api/` | **0** |
| Call site | 170 | 7 (toàn bộ trong `shared/api/client.ts`) |
| DTO mapping | Có (`mapDtoToSummary`, `toBuyerOrders`, `toComplaint`, `mapDtoToDetail`) | Không |
| Tầng gọi thật | `entities` → `features` → `pages` | Không tầng nào gọi |
| Chiến lược demo | `if (config.demoMode) return mockResponse(...)` — tường minh | `executeApiOrDemo` — `catch` nuốt lỗi |

**Kết luận:** temp hiện là **UI tĩnh có vỏ API**. `client.ts` + `gateway.ts` là hạ tầng đúng hướng nhưng **chưa có một màn hình nào** dùng nó. Đây là khoảng cách cần 4–6 tuần theo đúng kế hoạch T-01.

### 4.2 Kiến trúc FSD

| Tầng | `web/` | `moonkage-web` |
|---|---|---|
| `app/` | 22 file | 13 file |
| `entities/` | 165 file / 12 slice | 63 file / 8 slice |
| `features/` | **150 file / 31 slice** | 5 file / **4 slice** |
| `pages/` | 138 file / 74 folder | 63 file / 34 folder |
| `shared/` | 63 file | ~60 file |
| `widgets/` | 39 file / 10 | ~40 file / 4 |

Temp có đúng 4 feature slice: `auth` (QuickPersonaSelector), `cart` (AddToCartButton), `nfc` (NfcVerificationSimulator), `quote` (SubmitQuoteModal). Toàn bộ logic nghiệp vụ còn lại nằm trong `pages/` — `pages/` vẫn là 63 file với `useEffect` **= 0**.

### 4.3 CSS & Design system

| | `web/` | `moonkage-web` |
|---|---|---|
| Inline `style={{}}` | **6** | **457** |
| CSS Module | 88 | 66 |
| Token | 90, hệ `--mk-*` | 160, hệ `--color-*` / `--text-*` |
| Dark theme phủ token | **25/25 = 100%** | 32/106 = **30%** |
| Thiếu trong dark | — | 74 token: `--gradient-*` (6), `--glow-*` (3), `--font-*` (3), `--text-*` (5), `--weight-*` (4), `--leading-*` (2), `--radius-*` (6), `--shadow-*` (4), `--z-*` (4), `--control-h*` (3), `--container*` (2), `--duration-*` (3), `--ease-out`, `--ring`, `--header-h`, `--sidebar-w`, `--text-xs`… |

`web/` dùng class `mk-*` theo design system "DS: Moonkage" → theme đổi trọn vẹn. Temp có 160 token nhưng **gradient/glow không đổi theo theme** → chế độ tối vỡ về nửa vời.

### 4.4 A11y

| | `web/` | `moonkage-web` |
|---|---|---|
| `aria-*` | **182** | 35 |
| `role=` | **46** | 12 |
| `focus-visible` / `prefers-reduced-motion` | **25** | 2 |
| `CommandPalette` | (không có) | **ĐÃ ĐẠT**: `aria-activedescendant`, `role="listbox"`, `aria-selected`, `aria-modal`, `aria-controls` → **T-09 hoàn thành, xoá khỏi backlog** |

`AsyncState` mới trong temp có `role="status"` + `aria-busy` và `ErrorState` có `role="alert"` + `aria-live="assertive"` → đúng hướng, nhưng chưa áp dụng nên chưa có tác dụng.

### 4.5 Xử lý lỗi & bền vững

| | `web/` | `moonkage-web` |
|---|---|---|
| Error boundary | `RouteErrorBoundary` (có CSS Module, mã lỗi, link về home) | `RouteErrorBoundary` **+** `LayoutErrorBoundary` (auto-reload chunk) |
| Auto-reload chunk sau deploy | ✗ | ✓ (`sessionStorage` guard, reload 1 lần) |
| Guard | `RequireAuth`, `RequireAdmin`, `RequireNfc` (trong `entities/user/ui/`) | `RequireAuth`, `RequireAdmin`, `RequireNfc` (trong `app/guards/`) — **vị trí đúng hơn `web/`** |
| `providers/` | `app/providers/index.tsx` | **không có** |
| Config lỗi | Dừng app khi thiếu `VITE_API_BASE_URL` | Không bao giờ dừng (do N2) |

Temp **thắng** ở 2 điểm: auto-reload chunk và vị trí guard ở tầng `app/`.

### 4.6 Chiến lược demo mode

| | `web/` | `moonkage-web` |
|---|---|---|
| Mặc định | TẮT (`=== 'true'`) | **BẬT** (`!== 'false'`) |
| Cơ chế | `if (config.demoMode)` tường minh | `catch` → fallback |
| Demo store | `shared/api/demo.ts` (localStorage `moonkage.demo`) | `shared/api/demo.ts` (provider registry) |
| Lệnh | `npm run dev:demo` (`.env.demo`) | `npm run dev:demo` (`.env.demo`) — ngang |
| `.env` | không commit default URL | commit `VITE_API_BASE_URL=http://localhost:8080` |

Temp có `demoAdapter.registerProvider()` — mô hình provider registry sạch hơn `web/`, nhưng lại bị phá bởi `executeApiOrDemo`.

### 4.7 Kiểm thử

| | `web/` | `moonkage-web` |
|---|---|---|
| Hạ tầng | Vitest + jsdom | Vitest, `environment: 'node'` — **chưa có jsdom/testing-library** (T-14 chưa làm) |
| Test file | 12 | 8 |
| Test case | 38 | **46** |
| Phủ | `entities/*/model`, `features/filter-products`, `features/verify-nfc`, `shared/utils` | `entities/*/model`, `shared/api`, `shared/lib`, `shared/ui/Toast` |
| **Test hợp đồng API** | ✗ **không có** | ✓ `gateway.test.ts` — **điểm mạnh nhất của temp** |
| `ui/` test | ✗ | ✗ |

### 4.8 Tài liệu & onboarding

| | `web/` | `moonkage-web` |
|---|---|---|
| README | Đầy đủ: cách chạy, cấu trúc `src/`, lệnh kiểm tra trước commit, cảnh báo thiếu env | **Còn nguyên template Vite mặc định** ("React + TypeScript + Vite… Expanding the Oxlint configuration") |
| `doc/` | — | 3 file: `bao-cao-danh-gia-lai-2026-11-02.md`, `ket-hoach-cai-tien-temp.md`, `bao-cao-danh-gia-va-lo-trinh-cai-tien.md` |

---

## 5. Chấm điểm

| Mục | `web/` | `moonkage-web` | Ghi chú |
|---|---|---|---|
| Tích hợp API thật | **8.5** | **2.5** | Chênh lệch lớn nhất |
| Kiến trúc FSD | **9** | **5** | 31 vs 4 feature |
| Chất lượng CSS / token | **9** | **4.5** | 457 inline style, dark theme 30% |
| A11y | **8.5** | **3.5** | |
| Xử lý lỗi / bền vững | **8** | **5** | N1–N4 kéo giảm |
| Chiến lược demo mode | **9** | **3** | N1/N2/N3 |
| Kiểm thử | **7** | **6** | Temp có test hợp đồng API |
| Tài liệu & onboarding | **9** | **3** | README còn template |
| Trung bình | **8.3** | **4.2** | |

### 5.1 `moonkage-web` mạnh hơn ở 5 trục (cần port ngược)

1. **Test hợp đồng API** — `web/` không có test nào khoá endpoint → nguy cơ sai URL tái phát.
2. **`NOT_IMPLEMENTED_YET`** — khai báo tường minh endpoint chưa có REST (`/orchestrator-service/api/notifications`, `/payment-service/api/payments`) kèm test → `web/` giấu endpoint thiếu trong code.
3. **`createStore` dựa `useSyncExternalStore`** — gọn hơn Context của `web/`.
4. **`validators.ts`** — `web/` thiếu hoàn toàn.
5. **`LayoutErrorBoundary` auto-reload chunk** — giải quyết đúng bài toán deploy Vite mà `web/` chưa xử lý.

### 5.2 `web/` mạnh hơn ở 6 trục

1. **Tích hợp API thật**: 51 module + 170 call site, có DTO mapping.
2. **FSD đúng**: 31 feature slice vs 4.
3. **CSS/design system**: 6 inline style vs 457; dark theme phủ 100% vs 30%.
4. **A11y**: 182 `aria-*` + 46 `role=` vs 35 + 12.
5. **Chiến lược demo**: opt-in + fail-loud — đúng cho production.
6. **Bền vững**: có `app/providers/`, `RouteErrorBoundary` có CSS Module, không có "chunk hash" tự reload không kiểm soát.

---

## 6. Kế hoạch xử lý tiếp theo

### P0 — Sửa sai / an toàn sản phẩm (1–2 ngày)

| # | Việc | File |
|---|---|---|
| 1 | **N1**: `isDemoMode` → `=== 'true'` (khớp `web/`) | `src/shared/config/env.ts` |
| 2 | **N2**: bỏ default `http://localhost:8080`, để `apiBaseUrl` rỗng → `isConfigValid()` có tác dụng | `src/shared/config/env.ts` |
| 3 | **N3**: xoá `executeApiOrDemo`, thay bằng nhánh `if (config.demoMode)` tường minh | `src/shared/api/demo.ts` |
| 4 | **N5**: sửa `AsyncState` hỗ trợ `isEmpty` cho object phân trang | `src/shared/ui/AsyncState/AsyncState.tsx` |
| 5 | **N7**: verify/thêm `alert` vào `Icon.paths`; verify `Button` có `variant="outline"`, `size="sm"` | `src/shared/ui/Icon/Icon.tsx`, `Button.tsx` |
| 6 | **N8**: gộp `ROUTES` + `routes` (T-22) | `src/shared/config/routes.ts` |
| 7 | Bỏ `tmp_order_`/`tmp_pay_` ở Checkout, chờ `checkoutId` server trả về | `src/pages/base/checkout/CheckoutPage.tsx` |

### P1 — Biến module mới thành giá trị thật (3–5 ngày)

| # | Việc |
|---|---|
| 8 | Áp `AsyncState` + `useAsync` vào 6 page có dữ liệu: `CatalogPage`, `CartPage`, `ProductDetailPage`, `NotificationsPage`, `AdminOverviewPage`, `VendorOrdersPage` |
| 9 | Áp `validators` vào form (`LoginPage`, `RegisterPage`, `SellRegisterPage`, `CheckoutPage`) + gắn `aria-invalid` / `aria-describedby` |
| 10 | Áp `useAction` vào **mọi** nút submit (hiện mới 1 chỗ) — chống gửi trùng |
| 11 | **T-19**: xoá 11 chỗ `Date.now()` / `Math.random()`, thay `crypto.randomUUID()` hoặc ID server |
| 12 | **T-14**: `environment: 'node'` → `'jsdom'` + thêm `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` — **điều kiện tiên quyết** để test `ui/` |

### P2 — Nợ kỹ thuật (1–2 tuần)

| # | Việc |
|---|---|
| 13 | **T-17**: dọn 457 inline style → CSS Module (bắt đầu từ `LayoutErrorBoundary` vì vừa thêm mới) |
| 14 | **T-12**: đưa 74 token còn thiếu vào `[data-theme='dark']` (ưu tiên `--gradient-*`, `--glow-*`) |
| 15 | **T-06**: tách `features` 4 → 12+ slice |
| 16 | **T-07**: bổ sung `entity/ui` cho `order`, `vendor`, `quote`, `request`, `notification` |
| 17 | **T-01**: tạo `entities/*/api/` — ưu tiên 5 module cốt lõi: `product`, `order`, `cart`, `quote`, `vendor` (không cần làm 12 ngay) |
| 18 | **T-21**: test cho `ui/` (sau khi có jsdom) và `api/` |
| 19 | **T-20**: thêm `loading="lazy"` cho 13 `<img>` còn lại |
| 20 | **T-11**: `global.css` — bổ sung primitive grid dùng chung |
| 21 | Thêm `app/providers/` như `web/` (theme, toast, session) |

### Đồng thời — port ngược từ temp sang `web/` (2 ngày)

| # | Việc |
|---|---|
| 22 | `web/` thiếu test hợp đồng API → lấy `gateway.test.ts` của temp làm mẫu, viết tương tự cho `web/src/shared/api/` |
| 23 | `web/` thiếu `NOT_IMPLEMENTED_YET` → khai báo tường minh + test |
| 24 | `web/` thiếu `validators` → port `validators.ts` + test, áp vào form login/register |
| 25 | `web/` chưa có auto-reload chunk → port logic `sessionStorage` guard từ `LayoutErrorBoundary` của temp |
| 26 | `web/` đang dùng Context cho store → cân nhắc `createStore` + `useSyncExternalStore` của temp cho store đơn giản |

---

## 7. Ghi chú kiểm chứng

- `web/` **không bị thay đổi**: `git status --short -- web/` → **0 file** (repo sạch ngoài `target/` của backend Maven).
- Tất cả số liệu lấy từ lệnh chạy thật lúc 02:53–03:05: `oxlint` (0 cảnh báo cả 2), `vitest run` (38 / 46 pass), `tsc -b` (exit 0 cả 2), `vite build` (✓ cả 2).
- `moonkage-web` **không phải git repo** → không diff được bằng commit; phải dựa vào mtime (cập nhật gọn 02:41–02:46) và đọc code trực tiếp.
- Báo cáo này không sửa, thêm hay xoá bất kỳ file nào trong cả hai codebase.

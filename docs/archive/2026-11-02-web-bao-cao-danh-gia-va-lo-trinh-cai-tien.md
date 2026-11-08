# ĐÁNH GIÁ VÀ LỘ TRÌNH CẢI THIỆN `moonkage-web`

> **Lưu trữ (2026-11-08):** báo cáo đánh giá frontend theo thời điểm, chuyển từ `web/doc/`. Tài liệu hiện hành: [architecture-standards.md](../architecture/architecture-standards.md) §6 (Frontend) và [web-package-architecture.md](../architecture/web-package-architecture.md).

> **Mục tiêu tài liệu:** đưa `moonkage-web` (bản prototype tại `C:\Workspace\MSS301\temp\web-temp\moonkage-web`)
> vượt mặt bản đang chạy thật `web/` của repo `MSS301-moonkage-platform-project`.
>
> | | |
> |---|---|
> | **Bản đối chiếu** | `C:\Workspace\MSS301\MSS301-moonkage-platform-project\web` (gọi tắt: **BẢN THẬT**) |
> | **Bản cần cải thiện** | `C:\Workspace\MSS301\temp\web-temp\moonkage-web` (gọi tắt: **BẢN TEMP**) |
> | **Ngày đánh giá** | 02/11/2026 00:45 (ICT) |
> | **Trạng thái BẢN TEMP tại lúc đánh giá** | `src` sửa 00:10, `dist` build 00:31, `package.json` 00:11 |

---

## 0. Tóm tắt điều hành

BẢN TEMP đã **cải thiện rõ ở tầng hình thức** so với lần đánh giá trước: lint sạch, có test, tách bundle, sạch kiểu dữ liệu.
Nhưng **khoảng cách cốt lõi vẫn nguyên**: BẢN TEMP là prototype 100% dữ liệu giả; BẢN THẬT là sản phẩm đã nối 7 microservice.

> **Kết luận một dòng:** BẢN TEMP chưa thể "vượt mặt" BẢN THẬT bằng cách làm UI đẹp hơn —
> phải vượt bằng cách **trở thành sản phẩm thật** (nối API, có guard, có test có ý nghĩa) **và** giữ lấy
> những hạ tầng UX mà BẢN THẬT còn thiếu.

---

## 1. Bảng đối chiếu nhanh (baseline để theo dõi)

| # | Tiêu chí | BẢN THẬT | BẢN TEMP (hiện tại) | Mục tiêu | Ưu tiên |
|---|---|---|---|---|---|
| 1 | Số file / LOC | 574 / 21.178 | 191 / 18.842 | ≥ 260 / 26.000 | P2 |
| 2 | Tích hợp backend (7 service + STOMP) | ✅ đầy đủ | ❌ 0 dòng gọi mạng | ✅ đầy đủ | **P0** |
| 3 | Demo mode song song với API thật | ✅ | ❌ chỉ mock | ✅ | **P0** |
| 4 | Route guard (`RequireAuth/Admin/Nfc`) | ✅ 8 chỗ | ❌ 0 | ✅ | **P0** |
| 5 | Error boundary mỗi layout + chunk-reload recovery | ✅ 4 layout | ❌ 0 | ✅ | **P0** |
| 6 | Tầng `features` **được dùng thật** | ✅ 31 slice | ❌ 4 slice, **0 import** | ✅ ≥ 20 slice dùng thật | **P0** |
| 7 | Ràng buộc FSD bằng lint | ✅ 6 nhóm override | ❌ không có | ✅ đủ 6 tầng | **P0** |
| 8 | Import sâu xuyên slice (`../../../`) | ✅ 0 | ❌ 135 | ✅ 0 | **P0** |
| 9 | Kiểm thử trên **code đang chạy** | ✅ 12 file / 38 test | ⚠️ 5 file / 25 test, **2/5 là test rỗng** | ✅ 15+ file, 0 test rỗng | **P0** |
| 10 | Test hạ tầng (jsdom, testing-library) | ✅ đủ | ❌ thiếu | ✅ đủ | P1 |
| 11 | Số route / page | 70 / 68 | 61 / 38 | ≥ 70 / ≥ 55 | P2 |
| 12 | A11y (`aria-*`, `role=`) | 182 / 46 | 20 / 5 | ≥ 120 / ≥ 35 | P1 |
| 13 | `prefers-reduced-motion` | ✅ có | ❌ 0 | ✅ có | P1 |
| 14 | Code-splitting | 103 chunk | 46 chunk | ✅ ≥ 60 chunk | P1 |
| 15 | Tổng dung lượng `dist/` | **1.75 MB** | **6.87 MB** | **≤ 2.5 MB** | **P0** |
| 16 | Dung lượng ảnh | logo tối ưu | **8 JPEG = 6.2 MB** | ≤ 600 KB | **P0** |
| 17 | `any` / `as any` | 0 | ✅ 0 | ✅ 0 | giữ |
| 18 | `React.FC` | 0 | ✅ 0 | ✅ 0 | giữ |
| 19 | oxlint cảnh báo | 0 | ✅ 0 | ✅ 0 | giữ |
| 20 | `tsc -b` | pass | ✅ pass | ✅ pass | giữ |
| 21 | Command Palette (Cmd/Ctrl+K) | ❌ | ✅ có | ✅ giữ | giữ |
| 22 | Global Toast | ❌ | ✅ có | ✅ giữ | giữ |
| 23 | Theme sáng/tối có nút bật | ⚠️ token có, nút chưa thấy | ✅ có | ✅ giữ | giữ |
| 24 | Breadcrumbs | ❌ | ✅ có | ✅ giữ | giữ |
| 25 | Tài liệu kiến trúc frontend trong repo | ❌ không có | ✅ `information_architect/` | ✅ đưa vào `docs/` | **P0** |

---

## 2. Những gì đã tốt lên (giữ nguyên, không được phá)

| Hạng mục | Bằng chứng | Ghi chú |
|---|---|---|
| oxlint sạch | `npx oxlint` → 0 cảnh báo | Trước đây có 8, gồm 4 lỗi purity — **đã sửa đúng cách** (chuyển `Date.now()`/`Math.random()` vào event handler, không tắt rule) |
| Type safety | 0 `any`, 0 `React.FC` | Đã bằng BẢN THẬT |
| Test | 5 file / 25 test pass | `vitest` + script `test` đã thêm |
| Code-splitting | `manualChunks` tách `vendor` | `chunkSizeWarningLimit: 600` |
| Lazy route | `lazy()` từng trang + `PageLoader` skeleton | Đủ 38 page |
| Tầng `features` | 4 slice: `cart`, `auth`, `nfc`, `quote` | **Hình dạng đúng — xem §4.1 về nội dung** |

---

## 3. Bốn vấn đề chặn mục tiêu "vượt mặt"

### 3.1 P0 — Không có một dòng gọi mạng nào (ngăn cản việc trở thành sản phẩm thật)

Grep toàn bộ `src/`: `axios|fetch(|VITE_API|apiClient` → **0 kết quả**.

Mọi dữ liệu đến từ `createStore()` ghi `localStorage`:

```ts
// entities/order/model/orderStore.ts
export const MOCK_ORDERS: Order[] = [ /* ... */ ];
export const orderStore = createStore<Order[]>(MOCK_ORDERS, 'moonkage_orders');
```

**So sánh BẢN THẬT** — có đầy đủ:

| Hạ tầng | BẢN THẬT |
|---|---|
| HTTP client | `shared/api/client.ts` — axios instance, interceptor gắn `Authorization`, tự refresh token (chống refresh song song), `ApiError` kèm `errors[].field` cho validate form |
| Gateway mapping | `shared/api/gateway.ts` — `/identity-service/api`, `/catalog-service/api/products`, `/quotation-service/api/quote-requests`, `/order-service/api/carts/me`, `/payment-service/api/ledgers`, `/ws` (STOMP) |
| Realtime | `shared/api/realtime/` — STOMP qua gateway, token trong CONNECT frame |
| Upload | `shared/api/upload.ts` — maket, logo, ảnh khiếu nại |
| Demo mode | `shared/api/mock.ts` + `shared/api/demo.ts` — **chạy song song** với API thật, bật qua `VITE_DEMO_MODE` |

**Việc cần làm:** xem §5.1.

### 3.2 P0 — Tầng `features` là "cây thư mục chết"

Grep `features/` trong toàn bộ `src/` → **0 kết quả**. Cả 4 slice không được import ở bất kỳ đâu:

```ts
// features/index.ts
export { AddToCartButton } from './cart/ui/AddToCartButton';
export { QuickPersonaSelector } from './auth/ui/QuickPersonaSelector';
export { NfcVerificationSimulator } from './nfc/ui/NfcVerificationSimulator';
export { SubmitQuoteModal } from './quote/ui/SubmitQuoteModal';
```

Bằng chứng cụ thể — `ProductDetailPage` tự gọi `addToCart` trực tiếp, bypass feature:

```ts
// pages/base/product-detail/ProductDetailPage.tsx:7
import { addToCart } from '../../../entities/cart';
```

**So sánh BẢN THẬT** — feature slice dùng thật, qua public API, xử lý cả case khách chưa đăng nhập:

```tsx
// pages/base/home/HomePage.tsx
import { AddToCartButton } from '@/features/add-to-cart';
```

Feature đó xử lý: guest chưa đăng nhập → `onNeedLogin` (AC-02.3), bắt `ApiError`, `aria-busy`, trạng thái "đã thêm" 2 giây. Đó là **logic thật**, không phải wrapper.

**Việc cần làm:** xem §5.2.

### 3.3 P0 — 2/5 test là "test rỗng": test bản sao, không test code chạy

| Test file | Import gì | Đánh giá |
|---|---|---|
| `entities/cart/model/__tests__/cartStore.test.ts` | `cartStore, addToCart, updateCartQuantity, clearCart` | ✅ **code thật** |
| `shared/lib/theme/__tests__/themeStore.test.ts` | `getTheme, applyTheme, toggleTheme` | ✅ **code thật** |
| `shared/ui/Toast/__tests__/toastStore.test.ts` | `toast, addToast, removeToast, clearToasts` | ✅ **code thật** |
| `entities/product/model/__tests__/taxonomyFilter.test.ts` | chỉ `type Product, CakeCrust, CakeFilling` | ❌ `filterProducts` **định nghĩa lại trong file test** |
| `entities/dispute/model/__tests__/disputeEscrow.test.ts` | chỉ `type DisputeDecision` | ❌ `resolveEscrowDispute` **định nghĩa lại trong file test** |

Hai test cuối copy logic vào trong file test rồi test bản copy:

```ts
// entities/dispute/model/__tests__/disputeEscrow.test.ts:100
function resolveEscrowDispute(
  escrowHoldingAmount: number,
  maxRefundableAmount: number,
  decision: DisputeDecision,
  partialRefundInput?: number
): EscrowResolutionResult {
```

Trong khi logic thật trong production **không hề kiểm tra AC-49.3** (không hoàn vượt quá số tiền escrow giữ):

```ts
// entities/dispute/model/disputeStore.ts:60
export function resolveDispute(disputeId, decision, refundAmount, adminNote) {
  disputeStore.set((prev) => prev.map((d) => {
    if (d.id !== disputeId) return d;
    return { ...d, status: 'DECIDED', decision, refundAmount, adminNote, decidedAt: new Date().toISOString() };
  }));
}
```

→ `refundAmount` được ghi thẳng vào store, **không validate**. Test "chặn vi phạm AC-49.3" pass nhưng **không bảo vệ** code thật khỏi vi phạm đúng quy tắc đó. Đây là test tạo cảm giác an toàn giả — nguy hiểm hơn không có test.

Tương tự `taxonomyFilter.test.ts`: `CatalogPage` lọc bằng code riêng trong page, không dùng hàm mà test đang kiểm tra.

**So sánh BẢN THẬT:** 12 test đều import hàm thật từ module production
(`cartTotals, groupByShop`, `tierPrice`, `formatCountdown`, `seedProvinceFees`, `seedApplications`…)
và `useNfcSession.test.ts` dùng `@testing-library/react` để render hook thật.

**Việc cần làm:** xem §5.3.

### 3.4 P0 — Không có route guard, không có error boundary

| | BẢN THẬT | BẢN TEMP |
|---|---|---|
| `RequireAuth` / `RequireAdmin` / `RequireNfc` | 8 chỗ | **0** |
| `errorElement` mỗi layout | 4 layout | **0** |
| `RouteErrorBoundary` | ✅ có | ❌ không |
| Recovery khi chunk JS fail | ✅ `lazyPage.tsx` — reload 1 lần, cờ `sessionStorage` chống loop | ❌ không |

BẢN TEMP đã thêm lazy-load nhưng **không thêm `errorElement`** cho từng layout.
Nghĩa là: một page lỗi render → React unmount cả cây → **màn hình trắng**, không thông báo, không nút thử lại.

**Việc cần làm:** xem §5.4.

---

## 4. Nợ kỹ thuật còn lại (không chặn, nhưng cần dọn)

### 4.1 Ảnh 6.2 MB — 90% dung lượng `dist/`

```
public/images/xuong.jpg       1001.7 KB
public/images/hop-qua.jpg      932.5 KB
public/images/doanh-nghiep.jpg  807.5 KB
public/images/tra-xanh.jpg     749.4 KB
public/images/hero.jpg          712.4 KB
public/images/banh-nuong.jpg    692.1 KB
public/images/sau-rieng.jpg     682.6 KB
public/images/banh-deo.jpg       669.7 KB
```

Ba vấn đề cộng lại:
1. **Không nén** — JPEG ở mức chất lượng cao, không WebP/AVIF.
2. **Nằm trong `public/`** → **không đi qua bộ tối ưu của Vite** (không hash, không nén).
3. **Không `loading="lazy"`** → trang chủ chỉ hiện 4 sản phẩm + 3 vendor nhưng cuộn hết danh mục là tải cả 6 MB.

**BẢN THẬT** giải quyết bằng cách đưa ảnh vào `src/shared/assets` (Vite hash + nén), asset lớn nhất còn lại là `hero-banner.jpg` 790 KB.

### 4.2 135 import tương đối xuyên slice

Toàn bộ page/entity dùng `../../../shared/ui` thay vì alias `@/`.
Hệ quả: di chuyển file là vỡ import; không có đường dẫn tuyệt đối để lint kiểm tra ranh giới tầng.

**BẢN THẬT:** 770 import qua `@/`, **0** import tương đối xuyên slice, và `no-restricted-imports` chặn hồi quy bằng lint.

### 4.3 Không có lint ràng buộc kiến trúc

`.oxlintrc.json` hiện chỉ có 3 rule của Vite template:

```json
{
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

**BẢN THẬT** có 6 nhóm `overrides` theo tầng — cấm import sâu vào slice, cấm import ngược lên `app/`,
cấm page import page, cấm `../../` ra khỏi slice. Đây là thứ **biến luật thành điều máy kiểm tra**
(bản chất FSD: "luật quan trọng phải được lint hoặc CI kiểm tra").

### 4.4 A11y còn mỏng

20 `aria-*` / 5 `role=` (BẢN THẬT: 182 / 46). Không có `prefers-reduced-motion` — trong khi BẢN TEMP có
rất nhiều animation (`floatSlow`, `lanternSway`, gradient, glow) → **rủi ro cho người nhạy cảm thị giác**.

### 4.5 Thiếu hạ tầng test

Không có `jsdom`, không có `@testing-library/react`, không có block `test:` trong `vite.config.ts`.
Hiện tại chỉ test được logic thuần. Muốn test component/hook → phải bổ sung.

### 4.6 3 feature slice chưa ai dùng trong UI

`QuickPersonaSelector`, `NfcVerificationSimulator`, `SubmitQuoteModal` đã viết nhưng không được page nào import.

### 4.7 `shared/config/theme.ts` và `shared/utils/index.ts` là file lớn gộp nhiều nội dung

`theme.ts` chỉ có 1 hàm `getToken()`. `utils/index.ts` chứa 8 hàm format.
Không sai, nhưng chưa theo nguyên tắc "1 khái niệm = 1 file" mà BẢN THẬT áp dụng.

---

## 5. Lộ trình cải thiện (thứ tự nên làm)

> Nguyên tắc: **mỗi giai đoạn phải kết thúc với trạng thái "vẫn build được, lint sạch, test pass"** —
> không để lượt refactor nào làm repo hỏng.

### GĐ 1 — Nền tảng kiến trúc (P0, ~2–3 ngày)

| # | Việc | Chi tiết | Tiêu chí nghiệm thu |
|---|---|---|---|
| 1.1 | Bổ sung `no-restricted-imports` theo 6 tầng | Chép cấu hình từ BẢN THẬT `.oxlintrc.json`, đổi đường dẫn cho phù hợp | `oxlint` fail khi cố import sâu/xuyên tầng |
| 1.2 | Chuyển 135 import tương đối → alias `@/` | `../../../shared/ui` → `@/shared/ui` | grep `from '\.\./` = 0 |
| 1.3 | Thêm `jsdom` + `@testing-library/react` + block `test:` | `vite.config.ts`: `{ test: { environment: 'jsdom', env: { VITE_API_BASE_URL: 'http://gateway.test' } } }` | component test render được |
| 1.4 | `RouteErrorBoundary` + `errorElement` cho 4 layout | Chép pattern từ BẢN THẬT | page lỗi → hiện thông báo + nút thử lại, không trắng màn hình |
| 1.5 | `lazyPage` helper có chunk-reload recovery | Cờ `sessionStorage` chống reload loop | deploy mới không làm hỏng chunk cũ |
| 1.6 | `prefers-reduced-motion` trong `global.css` | Tắt `floatSlow`, `lanternSway`, shimmer khi user yêu cầu | — |

### GĐ 2 — Chuyển thành sản phẩm thật (P0, ~3–4 ngày) — **giai đoạn quyết định nhất**

| # | Việc | Chi tiết | Tiêu chí nghiệm thu |
|---|---|---|---|
| 2.1 | `shared/api/client.ts` | axios + interceptor `Authorization` + refresh token (chống refresh song song) + `ApiError` kèm `errors[].field` | — |
| 2.2 | `shared/api/gateway.ts` | Map đúng endpoint thật (xem bảng §3.1) | — |
| 2.3 | `shared/config/env.ts` | `VITE_API_BASE_URL`, `VITE_DEMO_MODE`, `isConfigValid()` | — |
| 2.4 | `shared/api/mock.ts` + `demo.ts` | Demo mode **song song** API thật, dùng lại `MOCK_*` hiện có làm seed | `npm run dev:demo` chạy được, `npm run dev` gọi thật |
| 2.5 | `shared/api/realtime/` | STOMP WebSocket qua gateway, token trong CONNECT frame | Nhận realtime notification |
| 2.6 | `shared/api/upload.ts` | Maket, logo, ảnh khiếu nại | — |
| 2.7 | `RequireAuth` / `RequireAdmin` / `RequireNfc` | Chặn route, không chỉ ẩn nút | Không vào được `/kenh-ban` khi chưa đăng nhập |
| 2.8 | Provider stack | `SessionProvider` → `RealtimeProvider` → `DeliveryAreaProvider` → `CartProvider` | — |

> **Ghi chú:** BẢN THẬT đã có sẵn toàn bộ 2.1–2.8 dưới dạng code chạy được. Đây là cơ hội **port trực tiếp**
> thay vì viết lại — nhưng phải viết lại theo đúng design system "Đêm Rằm" của BẢN TEMP.

### GĐ 3 — Sửa test để có ý nghĩa (P0, ~1–2 ngày)

| # | Việc | Chi tiết | Tiêu chí nghiệm thu |
|---|---|---|---|
| 3.1 | Rút `resolveEscrowDispute` ra `entities/dispute/model/` | Test import hàm thật | Test AC-49.3 bảo vệ code thật |
| 3.2 | Thêm validate AC-49.3 vào `resolveDispute` | Không cho hoàn vượt escrow đang giữ | `resolveDispute` từ chối giá trị vượt |
| 3.3 | Rút `filterProducts` ra `entities/product/model/` | `CatalogPage` dùng chung hàm này | 1 hàm, 1 nguồn sự thật |
| 3.4 | Bổ sung test cho `shared/utils` | `formatCurrency`, `formatRelative`, `maskMiddle` | — |
| 3.5 | Test `useTheme` / `useToast` bằng testing-library | — | — |
| 3.6 | Thêm script `check` | `lint && test && build` | Một lệnh kiểm tra tất cả |

### GĐ 4 — Kết nối `features` thật sự (P0, ~2 ngày)

| # | Việc | Chi tiết |
|---|---|---|
| 4.1 | `ProductDetailPage` dùng `@/features/cart` `AddToCartButton` | Bỏ `addToCart` trực tiếp |
| 4.2 | `LoginPage` dùng `@/features/auth` `QuickPersonaSelector` | |
| 4.3 | `NfcVerifyPage` dùng `@/features/nfc` `NfcVerificationSimulator` | |
| 4.4 | `VendorRequestsPage` dùng `@/features/quote` `SubmitQuoteModal` | |
| 4.5 | Tách thêm feature slice mới | `checkout`, `filter-products`, `place-order`, `login`, `register`, `review-mockup`, `respond-to-quote-request`, `resolve-disputes`, `approve-disbursement`, `pay`… mỗi slice có `api/ model/ ui/ index.ts` |
| 4.6 | Mỗi feature có `strings.ts` | Chuỗi nghiệp vụ nằm trong feature, không nằm trong page |

### GĐ 5 — Tối ưu tài nguyên (P0, ~0.5 ngày)

| # | Việc | Chi tiết | Tiêu chí nghiệm thu |
|---|---|---|---|
| 5.1 | Nén ảnh, đưa vào `src/shared/assets` | WebP, mỗi ảnh ≤ 80 KB | Vite hash + nén |
| 5.2 | `loading="lazy"` + `decoding="async"` cho ảnh không ở above-the-fold | | |
| 5.3 | Ảnh hero tách riêng, preload | | |
| 5.4 | Tăng `manualChunks` | Tách `vendor` thành `react` / `router` | Chunk lớn nhất ≤ 200 KB |
| 5.5 | Kiểm tra `dist/` | | **≤ 2.5 MB** |

### GĐ 6 — A11y & trải nghiệm (P1, ~1–2 ngày)

| # | Việc | Tiêu chí nghiệm thu |
|---|---|---|
| 6.1 | Bổ sung `aria-*` / `role=` cho form, modal, tabs, table | ≥ 120 `aria-*`, ≥ 35 `role=` |
| 6.2 | Command Palette: `aria-activedescendant`, `aria-selected`, `aria-modal` | |
| 6.3 | Focus trap trong `Modal` | |
| 6.4 | `EmptyState` khi danh mục rỗng | |
| 6.5 | `prefers-reduced-motion` (nếu chưa làm ở 1.6) | |

### GĐ 7 — Mở rộng phạm vi (P1/P2, ~3–5 ngày)

| # | Việc | Tiêu chí nghiệm thu |
|---|---|---|
| 7.1 | Bổ sung page còn thiếu so với BẢN THẬT | ≥ 55 page file |
| 7.2 | Route cho `AuthLayout` (login/register/forgot/reset/confirm) | ≥ 70 route |
| 7.3 | `NotFoundPage`, `ConfigErrorPage` | |
| 7.4 | `widgets/` đầy đủ hơn | header, footer, sidebar, admin-bar, vendor-bar, account-sidebar, buying-guide |

---

## 6. Thứ KHÔNG nên làm

| Không làm | Vì sao |
|---|---|
| ❌ Trộn design system "Đêm Rằm" với "Moonkage v2" | Hai bảng màu không thể cùng tồn tại. Nếu giữ "Đêm Rằm" thì phải viết lại `tokens.css` + 66 file CSS — làm một lần, dứt điểm |
| ❌ Bỏ `data-zone` | Đây là điểm mạnh riêng của BẢN TEMP: mỗi khu vực một màu chủ đạt (vendor → vàng, admin → mực) |
| ❌ Bỏ Command Palette / Toast / theme toggle / Breadcrumbs | Đây là 4 hạ tầng UX mà **BẢN THẬT còn thiếu** — giữ và mở rộng |
| ❌ Tắt rule lint để cho lint xanh | Bản TEMP đã sửa đúng cách 4 lỗi purity; giữ nguyên tinh thần đó |
| ❌ Tăng số test bằng cách copy logic vào file test | Đó là test rỗng — tệ hơn không có test |
| ❌ Thêm thư viện UI mới (MUI, AntD…) | BẢN TEMP đã có design system riêng 3 tầng token, ủng hộ "Đêm Rằm" |
| ❌ Bỏ `store` + `localStorage` hiện tại | Giữ làm **seed** cho demo mode (GĐ 2.4) — không phải nguồn dữ liệu duy nhất |

---

## 7. Checklist nghiệm thu từng giai đoạn

Mỗi GĐ kết thúc phải pass **toàn bộ**:

- [ ] `npx tsc -b` — không lỗi
- [ ] `npx oxlint` — 0 cảnh báo, 0 lỗi
- [ ] `npx vitest run` — tất cả pass, **không có test rỗng**
- [ ] `npm run build` — thành công
- [ ] `dist/` ≤ 2.5 MB (từ GĐ 5)
- [ ] grep `from '\.\./` trong `src/` = 0 (từ GĐ 1.2)
- [ ] grep `axios\|fetch(` trong `src/` > 0 (từ GĐ 2)
- [ ] grep `features/` trong `src/` > 0 (từ GĐ 4)
- [ ] Route guard: mở `/kenh-ban` khi chưa đăng nhập → bị chặn
- [ ] Lỗi 1 page → hiện error boundary, không trắng màn hình
- [ ] `npm run dev` gọi API thật; `npm run dev:demo` chạy seed

---

## 8. Tài liệu cần đưa vào repo chính

BẢN THẬT có code FSD chuẩn hơn BẢN TEMP nhưng **không có tài liệu nào mô tả nó**
(grep "FSD" / "Feature-Sliced" trong `docs/` → 0 kết quả). Đây là khoảng trống tài liệu thật sự.

Cần chuyển từ `C:\Workspace\MSS301\temp\web-temp\information_architect\`:

| File | Nội dung | Nên đặt ở |
|---|---|---|
| `docs/package-architecture.md` | Chuẩn kiến trúc React v2 — 14 mục: ràng buộc nền tảng, cây thư mục 5 tầng, luật phụ thuộc, quy ước CSS, cơ chế thực thi luật bằng lint, checklist | `docs/architecture/frontend-architecture.md` |
| `01_Tai_lieu_IA.pdf` / `.docx` | IA tổng hợp: 73 trang, taxonomy, tree test, user flows F1–F7 | `docs/product/ia/` |
| `02_Bang_tinh_IA.xlsx` | Kiểm kê màn hình, điều hướng, nhãn, kịch bản tree test | `docs/product/ia/` |
| `03_Sitemap_va_luong.html` | Cây trang tương tác theo 4 khu | `docs/product/ia/` |

---

## 9. Bảng theo dõi tiến độ

| GĐ | Mục tiêu | Ưu tiên | Trạng thái | Ngày hoàn thành |
|---|---|---|---|---|
| GĐ 1 | Nền tảng kiến trúc | P0 | ⬜ Chưa bắt đầu | |
| GĐ 2 | Chuyển thành sản phẩm thật | P0 | ⬜ Chưa bắt đầu | |
| GĐ 3 | Sửa test có ý nghĩa | P0 | ⬜ Chưa bắt đầu | |
| GĐ 4 | Kết nối `features` | P0 | ⬜ Chưa bắt đầu | |
| GĐ 5 | Tối ưu tài nguyên | P0 | ⬜ Chưa bắt đầu | |
| GĐ 6 | A11y & trải nghiệm | P1 | ⬜ Chưa bắt đầu | |
| GĐ 7 | Mở rộng phạm vi | P1/P2 | ⬜ Chưa bắt đầu | |
| — | Đưa tài liệu IA vào repo chính | P0 | ⬜ Chưa bắt đầu | |

### Chỉ số "vượt mặt BẢN THẬT" — cần đạt

| Chỉ số | BẢN THẬT | BẢN TEMP cần đạt |
|---|---|---|
| Dung lượng `dist/` | 1.75 MB | ≤ 1.75 MB |
| Số lần gọi mạng bị hardcode trong page | 0 | 0 |
| Test rỗng | 0 | 0 |
| Số page chưa có guard | 0 | 0 |
| Lần gọi API trùng lặp (nhiều page cùng gọi 1 endpoint) | có | không |
| `aria-*` trên mỗi form | đầy đủ | đầy đủ |
| Feature slice **dùng thật** | 31 | ≥ 20 |

---

## 10. Phụ lục — Bảng tra cứu nhanh

### 10.1 Cấu trúc BẢN THẬT (đích đến)

```
web/src/
├── app/            App.tsx, main.tsx, routes.tsx, lazyPage.tsx, RouteErrorBoundary.tsx
│                   ├── layouts/  BaseLayout, AuthLayout, AccountLayout, VendorLayout, AdminLayout
│                   ├── providers/ index.tsx  (Session → Realtime → DeliveryArea → Cart)
│                   └── styles/   reset.css, tokens.css, global.css
├── pages/          68 page, lazy-load từng trang
├── widgets/        10 widget
├── features/       31 slice  (api/ model/ ui/ strings.ts index.ts)
├── entities/       12 entity (api/ model/ ui/ strings.ts index.ts)
└── shared/
    ├── api/        client.ts, gateway.ts, demo.ts, mock.ts, upload.ts, realtime/
    ├── config/     env.ts, routes.ts, theme.ts, provinces.ts, wards.ts, disputes.ts
    ├── lib/        cn.ts, useAsync.ts, useAction.ts, useDisclosure.ts
    ├── ui/         16 component
    └── utils/      format.ts, money.ts, storage.ts
```

### 10.2 Cấu trúc BẢN TEMP hiện tại

```
moonkage-web/src/
├── app/            App.tsx, main.tsx, routes.tsx
│                   ├── layouts/  BaseLayout, AccountLayout, VendorLayout, AdminLayout
│                   └── styles/   reset.css, tokens.css, global.css
├── pages/          38 page (lazy-load)
├── widgets/        header, footer, sidebar
├── features/       4 slice  ⚠️ KHÔNG AI DÙNG
├── entities/       8 entity (cart, dispute, notification, order, product, request, user, vendor)
└── shared/
    ├── config/     routes.ts, theme.ts
    ├── lib/        cn.ts, createStore, theme/themeStore
    ├── ui/         14 component
    └── utils/      index.ts
```

### 10.3 Endpoint cần map (lấy từ `web/src/shared/api/gateway.ts`)

```
/identity-service/api
/api/vendors
/api/registration-fee-config
/api/cake-attributes
/catalog-service/api/products
/api/interprovince-fees
/quotation-service/api
/quotation-service/api/quote-requests
/quotation-service/api/vendors
/order-service/api
/order-service/api/carts/me
/order-service/api/checkouts
/order-service/api/orders
/payment-service/api
/payment-service/api/payments
/payment-service/api/ledgers
/orchestrator-service/api/notifications
/ws                                          (STOMP WebSocket)
```

### 10.4 Bảng màu đang dùng (BẢN TEMP — giữ nguyên)

| Nhóm | Token | Sáng | Tối |
|---|---|---|---|
| Nền | `--color-bg` | `#fbf6ec` | `#140e0a` |
| Nền sâu | `--color-bg-deep` | `#f4ead8` | `#0f0a07` |
| Surface | `--color-surface` | `#fffdf8` | `#1d1611` |
| Surface 2 / 3 | `--color-surface-2/3` | `#f7efe1` / `#efe3cd` | `#261d16` / `#31261d` |
| Chữ | `--color-text` | `#2a1d14` | `#f4ead9` |
| Chữ phụ | `--color-text-muted` | `#75604f` | `#bba68f` |
| Chữ nhạt | `--color-text-subtle` | `#9d8877` | `#8c7a68` |
| Viền | `--color-border` | `#e8dcc6` | `#3a2d22` |
| Viền đậm | `--color-border-strong` | `#d6c4a6` | `#4d3d2f` |
| Thương hiệu | `--color-primary` | `#b3261e` | `#e0574b` |
| Vàng | `--color-gold` | `#b8862b` | `#e2b25c` |
| Mực | `--color-ink` | `#2f4b6e` | `#8fb3e0` |
| Thành công | `--color-success` | `#2f7a4a` | `#74c58f` |
| Cảnh báo | `--color-warning` | `#a8670f` | `#e7b05c` |
| Nguy hiểm | `--color-danger` | `#b3261e` | `#ef7468` |
| Thông tin | `--color-info` | `#2f5d8a` | `#8fb3e0` |

Màu theo khu (`data-zone`): `vendor` → vàng đồng · `admin` → mực xanh · `base` → đỏ son.

### 10.5 Lệnh kiểm tra

```bash
# trong moonkage-web/
npx tsc -b              # type-check
npx oxlint              # lint
npx vitest run          # test
npm run build           # build + đo dist/
```

Sau khi có script `check` (GĐ 3.6): `npm run check` = lint && test && build.

---

*Tài liệu được tạo 02/11/2026. Không sửa, thêm hay xóa file nào trong `moonkage-web` hoặc repo chính khi viết tài liệu này.*

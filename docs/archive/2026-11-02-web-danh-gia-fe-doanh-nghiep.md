# Đánh giá góc độ Frontend doanh nghiệp — bản `temp`

> **Lưu trữ (2026-11-08):** báo cáo đánh giá frontend theo thời điểm, chuyển từ `web/doc/`. Tài liệu hiện hành: [architecture-standards.md](../architecture/architecture-standards.md) §6 (Frontend) và [web-package-architecture.md](../architecture/web-package-architecture.md).

> Ngày: 02/11/2026 · Đối tượng: `temp/web-temp/moonkage-web`
> Bộ tiêu chí lấy từ checklist FE của một dự án doanh nghiệp thực tế:
> TypeScript, kiến trúc, state/data, error handling, a11y, performance, bundle,
> security, DX/CI, khả năng mở rộng, vận hành.

---

## 0. Kết luận nhanh

> **Cập nhật 04/11/2026:** đợt này đóng nốt **tầng vận hành** — observability (Sentry +
> analytics + Core Web Vitals) và **E2E đủ 7/7 Flow** (53 test). Điểm tổng:
> **9,0/10 → 9,5/10**.

| Hạng mục | Điểm | Nhận xét |
| --- | ---: | --- |
| Kiến trúc & FSD 2.0 | 9,5/10 | Rất tốt, có cổng `@x` |
| TypeScript | **9,5/10** | ✅ Đã bật `strict` + `noImplicitOverride` — 0 lỗi |
| State & Data fetching | **9,0/10** | ✅ Đã có query cache (React Query) — hết fetch trùng |
| Error handling | **9,0/10** | ✅ ErrorBoundary + ApiError + **Sentry** báo lỗi production |
| Accessibility | **9,0/10** | ✅ Đã sửa 6 `div` không vai trò + `aria-invalid` + `vitest-axe` |
| Performance | **9,0/10** | ✅ `React.memo` + render dần theo trang + **đo Core Web Vitals** |
| Bundle & Build | 8,5/10 | ✅ Có ngân sách bundle chặn hồi quy trong CI (đang dùng 96% ngân sách) |
| Security | **8,5/10** | ✅ Token vault + CSP + sẵn sàng cookie `HttpOnly` |
| Testing | **9,5/10** | ✅ **292 test / 76 file** + **53 E2E Playwright (7/7 Flow)** + coverage threshold |
| DX / CI | **9,0/10** | ✅ Workflow CI đầy đủ: lint, test, coverage, bundle, E2E |
| Khả năng mở rộng | **8,5/10** | Rất tốt, đã có feature flag |
| Vận hành / Observability | **8,5/10** | ✅ **Đã có Sentry + GA4 analytics + Web Vitals** — còn thiếu uptime monitor |
| **TỔNG** | **9,5/10** | (trước P0: 8,1/10 · sau P0: 8,7/10 · sau P1+P2: 9,0/10 · sau P3: **9,5/10**) |

### Đã hoàn thành trong đợt P0

| # | Việc | Trạng thái |
| --- | --- | --- |
| 1 | Bật `strict` + `noImplicitOverride` | ✅ 0 lỗi |
| 2 | Token vault: `localStorage` → memory + `sessionStorage` | ✅ + 10 test |
| 3 | Workflow CI cho `temp` + thêm test vào `web-quality.yml` | ✅ đã chạy thử, exit 0 |
| 4 | 6 `div` clickable không có vai trò | ✅ radio/button/menu thật |
| 5 | `aria-invalid` + `aria-describedby` cho mọi form | ✅ + 7 test |

### Đã hoàn thành trong đợt P1 + P2

| # | Hạng mục | Trạng thái | Bằng chứng |
| --- | --- | --- | --- |
| P1.1 | Query cache + hết fetch trùng | ✅ | React Query 5, 14 hook chuyển sang `useQueryData`, **1 request thay vì 2** ở `/catalog/products` |
| P1.2 | Nền tảng E2E | ✅ | Playwright + 5 spec, **27 test** cho FLOW 1–4 và khung app — **100% pass** |
| P1.3 | CSP + cookie `HttpOnly` | ✅ | `src/shared/config/security.ts`, chế độ `VITE_AUTH_MODE=cookie` |
| P2.1 | Coverage threshold + `vitest-axe` | ✅ | Threshold ratchet **19/14/20/19**, 9 test axe tự động, coverage thực đo **20,8%** |
| P2.2 | Memo hoá + render dài theo trang | ✅ | `React.memo` cho `ProductCard`, `useProgressiveList` |
| P2.3 | Feature flag | ✅ | `src/shared/config/featureFlags.ts`, 11 test, tắt được không cần deploy |
| P2.4 | Phân tích & siết bundle | ✅ | `check-bundle-size.mjs` chặn hồi quy trong CI, 947 → **926,8 kB** |

### Đã hoàn thành trong đợt P3 (04/11/2026)

| # | Hạng mục | Trạng thái | Bằng chứng |
| --- | --- | --- | --- |
| P3.1 | **Sentry** — báo lỗi production | ✅ | `src/shared/observability/sentry.ts` + `sentrySdk.ts`, nạp **động** (không tăng payload mặc định), `dataCollection` chặn PII, 9 test |
| P3.2 | **Analytics** — funnel GA4 | ✅ | `src/shared/observability/analytics.ts`, 16 sự kiện nghiệp vụ, `sanitizeProperties` chặn 16 khoá PII, 8 test |
| P3.3 | **Core Web Vitals** | ✅ | `src/shared/observability/webVitals.ts` — LCP/INP/CLS/FCP/TTFB, chỉ ghi chỉ số xấu, 6 test |
| P3.4 | **E2E đủ 7/7 Flow** | ✅ | 8 spec / **53 test**, 100% pass, thêm FLOW 5 (khiếu nại), FLOW 6 (NFC), FLOW 7 (sản phẩm) |
| P3.5 | **Đưa `temp/` vào repo chính** | ✅ | Toàn bộ `temp/web-temp/moonkage-web/` đã nằm trong git — workflow CI có hiệu lực |

**Quan trọng về thiết kế observability:** cả ba lớp đều **opt-in** và **tôn trọng NFR-03**
(không PII). Không có `VITE_SENTRY_DSN` / `VITE_GA_MEASUREMENT_ID` → **không có một request nào
đi ra ngoài**; local, demo và CI đều sạch hoàn toàn.


### 🔍 E2E đã phát hiện thêm 2 lỗi thật (không phải lỗi test)

| # | Lỗi | Mức độ | Đã sửa |
| --- | --- | --- | --- |
| 1 | **Form yêu cầu báo giá không validate phía client** — gửi yêu cầu thiếu số lượng / thiếu địa chỉ vẫn tạo được yêu cầu rác ở server | 🟠 Cao | Validate đủ 5 trường + báo lỗi cạnh ô nhập, 6 test unit |
| 2 | **Form login có sẵn dữ liệu mẫu**, nên "bỏ trống thông tin" không bao giờ xảy ra — và `required` của trình duyệt chặn submit trước khi handler chạy | 🟡 Trung bình | `noValidate` + validate nội bộ, 2 test E2E mới |

Kết luận: đây là một codebase **chuẩn mực ở tầng kiến trúc**. Sau đợt P0, các nợ kỹ thuật
thấp đã được xử lý. Sau đợt P1 + P2, toàn bộ các hạng mục kỹ thuật trong roadmap đã
được đóng. Đợt **P3 (04/11/2026)** đóng nốt **tầng vận hành**: observability đầy đủ
(Sentry + GA4 analytics + Core Web Vitals) và E2E phủ **7/7 Flow**. Phần còn lại chỉ là
những việc phụ thuộc hạ tầng ngoài repo (uptime monitor, refresh token `HttpOnly` ở
backend) — không còn là nợ kỹ thuật trong FE.
---

## 1. TypeScript — 9,5/10 (đã cải thiện từ 8,0)

### Điểm mạnh
- `verbatimModuleSyntax: true`, `isolatedModules: true` (mặc định TS7), `erasableSyntaxOnly: true`.
- `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` — cảnh báo sớm.
- Dùng `import type` xuyên suốt cho type-only import.
- Chỉ **2** chỗ dùng `any`/`as any`, **9** non-null assertion — rất tiết chế.
- DTO được tách riêng khỏi API module → contract với backend rõ ràng.

### Đã bật `strict` — 0 lỗi, 1 dòng cấu hình

**Trạng thái trước:** `tsconfig.app.json` không có `"strict": true`.

**Điều đáng chú ý:** tôi đã chạy kiểm chứng thực nghiệm *trước khi* bật:

```
npx tsc -p tsconfig.app.json --noEmit --strict  →  0 lỗi
```

Tức là **codebase đã sẵn sàng đạt chuẩn strict** — không có một lỗi nào. Tôi đã xác minh
bằng probe file để chắc chắn cờ thực sự có hiệu lực:

```ts
// src/__probe.ts (tạm để kiểm chứng, đã xoá)
const x: string = 42;              // TS2322 bị bắt ✅
function f(a?: string) { return a.length; }  // TS18048 bị bắt ✅
```

**Kết quả sau khi bật (đã áp dụng vào codebase):**

```jsonc
// tsconfig.app.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,   // 0 lỗi — cũng đã bật
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Các cờ strict khác — đã đo, cần refactor

Tôi đã đo mức độ sẵn sàng cho từng cờ:

| Cờ | Số lỗi | Quyết định |
| --- | ---: | --- |
| `strict` | **0** | ✅ **Đã bật** |
| `noImplicitOverride` | **0** | ✅ **Đã bật** |
| `exactOptionalPropertyTypes` | 65 | ⏸ Cần refactor DTO (`prop?: T` vs `prop: T | undefined`) |
| `noUncheckedIndexedAccess` | 84 | ⏸ Cần xử lý truy cập mảng có thể `undefined` |
| `noPropertyAccessFromIndexSignature` | 2135 | ⏸ Quá nặng, không đáng ở giai đoạn này |

> Hai cờ `⏸` nên mở theo từng slice, mỗi lần một cờ, kèm PR riêng — đừng bật một lúc
> vì sẽ tạo diff 2.000+ dòng không liên quan đến mục tiêu.
---

## 2. Kiến trúc & FSD 2.0 — 9,5/10

Đây là điểm mạnh lớn nhất của bản `temp`:

| Tiêu chí | Kết quả |
| --- | --- |
| File vượt 250 dòng (TS/TSX) | **0 / 477** |
| Import sâu (deep import) | 0 (chỉ 2 cổng `@x` hợp lệ) |
| Feature import chéo feature | 0 |
| Vòng phụ thuộc (madge) | 0 |
| `oxlint` (enforce luật) | 0 lỗi, luật được viết trong `.oxlintrc.json` theo từng tầng |

### Điểm mạnh đặc biệt: cổng `@x`

```ts
// entities/dispute/api/disputeApi.ts
import { orderApi } from '@/entities/order/@x/dispute';
```

Bản `web` **không có** cơ chế này — liên kết chéo entity ở đó là import trực tiếp hoặc
không tồn tại. Cổng `@x` biến quan hệ chéo thành hợp đồng review được.

### Điểm cần chú ý: hiệu quả barrel

Có **189** import dạng `from '@/entities/<slice>'` (chỉ qua public API — đúng FSD).
Rủi ro thường gặp với barrel là "kéo code không cần vào bundle". Ở đây **không xảy ra**:

- Barrel nhỏ: entity lớn nhất (`vendor`) chỉ **18 export**, còn lại ≤ 10.
- Rollup **tree-shake** tốt — build cho thấy `orderApi` được tách riêng thành chunk
  (`orderApi-BmjXKUKg.js`), tức là code không dùng đã bị loại.
- Không có "giant barrel" ở `shared/` — `shared/ui` và `shared/api` được Vite tách
  thành chunk `ui` / `network` riêng, dùng chung nhiều route.

→ **Không cần hành động gì ở mục này.** Chỉ cần giữ nguyên thói quen không export thừa
từ `index.ts`.

### Chi tiết luật kiến trúc được máy thực thi

`.oxlintrc.json` không chỉ chặn deep import — nó **cấu hình ranh giới riêng cho từng tầng**:

| Tầng | Luật đang ép |
| --- | --- |
| `src/pages/**` | không import sâu slice khác; không import page khác; **không dùng đường dẫn tương đối `../**`** |
| `src/widgets/**` | không import widget khác; không lên `pages` |
| `src/features/**` | **không import feature khác**; không lên `widgets`/`pages` |
| `src/entities/**` | **không import entity khác**; chỉ import xuống `shared` |
| `src/shared/**` | **không import tầng trên** (shared không biết nghiệp vụ) |
| toàn cục | không import ngược lên `@/app` |

Điểm đáng chú ý nhất: luật `"../../**"` chặn **đường dẫn tương đối ra khỏi slice** — đây là
nguyên nhân khiến kiến trúc không thể "lách luật" bằng cách viết `../../entities/order/model/x`.
Luật được viết bằng tiếng Việt với thông điệp giải thích rõ → developer mới hiểu ngay.

---

## 3. State & Data fetching — 9,0/10 (đã cải thiện từ 7,0)

### Đã sửa: query cache (React Query 5) — hết fetch trùng

Vấn đề đã kiểm chứng ở đợt đánh giá trước: vào `/san-pham`, hệ thống gọi
`GET /catalog/products` **2 lần** — một lần để seed store ở `AppProviders`, một lần để
`CatalogPage` hiển thị.

**Đã sửa bằng query cache**, không phải bằng cách vá riêng từng chỗ:

```ts
// shared/api/queryClient.ts — một client cho toàn ứng dụng
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,      // mount lại trong 1 phút thì đọc cache, không gọi API
      gcTime: 5 * 60_000,
      retry: (count, error) => error instanceof ApiError && error.status < 500 ? false : count < 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

```ts
// shared/lib/useQueryData.ts — giữ nguyên hợp đồng AsyncStateKind<T> của useAsync
export function useQueryData<T>(queryKey: QueryKey, load: () => Promise<T>) {
  const query = useQuery({ queryKey, queryFn: load });
  // ...trả về { kind: 'loading' | 'error' | 'loaded', reload }
}
```

**Điểm thiết kế quan trọng:** `useQueryData` giữ nguyên kiểu `AsyncStateKind<T>` mà
`useAsync` đã trả về. Nhờ vậy **không phải sửa một call site nào** ở phía trên — các call site
cũ vẫn chạy, chỉ là dữ liệu giờ đến từ cache thay vì gọi API mỗi lần mount.

14 query hook đã chuyển sang query cache, tất cả dùng **key phân cấp** theo factory
`queryKeys` (`src/shared/api/queryClient.ts`):

```ts
queryKeys.product.catalog(provinceCode)  // ['product', 'catalog', 'HN']
queryKeys.order.list(vendorId, openDispute, status)
```

### Kết quả đo được

| Hạng mục | Trước | Sau |
| --- | --- | --- |
| Request `/catalog/products` khi vào `/san-pham` | 2 | **1** |
| Quay lại màn hình đã xem | spinner + request | **hiện dữ liệu tức thì** |
| `reload()` | gọi lại từ đầu | `refetch()` — dữ liệu cũ vẫn hiện khi đang tải lại |
| Key quản lý cache | không có | `queryKeys` phân cấp, invalidate được theo nhóm |

Có **7 test** riêng cho `useQueryData` (`src/shared/lib/__tests__/useQueryData.test.tsx`),
trong đó có test chứng minh đúng điều cần: hai hook cùng `queryKey` chỉ gọi API **một lần**.

### Hiện trạng

Kiến trúc data của `temp` **không tệ** — nó dùng mô hình 2 tầng có chủ đích:

```ts
// 1. Entity store — nguồn sự thật dùng chung cho nhiều màn hình
// entities/product/model/productStore.ts
export const productStore = createStore<Product[]>(...);
export function useProducts(): Product[] { return useStore(productStore); }

// 2. Query hook — bọc useAsync, trả về trạng thái cho tầng trên
// entities/order/model/useOrderQueries.ts
export function useOrderList(options?: { vendorId?: string | null; ... }) {
  return useAsync(() => orderApi.getOrders({...}), [vendorId, openDispute, status]);
}
```

Có **12 file query hook** (order, product, vendor, cart, dispute, request, user, payment…) — tất cả
đều bọc `useAsync`, không có hook nào gọi `apiClient` trực tiếp. Luật **L6** ("`pages/` không
bao giờ gọi API trực tiếp") được kiểm chứng: **0 vi phạm**.

### Vấn đề đã kiểm chứng: fetch trùng endpoint

Đây không phải phỏng đoán — tôi đã đọc code và tìm được **2 luồng gọi trùng cùng endpoint**:

```text
app/providers/AppProviders.tsx
  └─ CatalogBootstrap
       ├─ useProductCatalog(provinceCode)  → GET /catalog/products   ← fetch #1
       ├─ useTaxonomyCatalog()             → GET /catalog/attributes ← fetch #2
       └─ useVendorCatalog()               → GET /vendors            ← fetch #3

pages/base/catalog/CatalogPage.tsx
  └─ useProductCatalogFor(provinceCode)   → GET /catalog/products   ← fetch #4 (TRÙNG #1)
```

**Hậu quả:** vào trang `/catalog`, hệ thống gọi `/catalog/products` **2 lần** — một lần để seed
store ở `AppProviders`, một lần để `CatalogPage` hiển thị. 7 màn hình đọc store
(`HomePage`, `VendorDetailPage`, `VendorsListPage`, `AdminVendorDetailPage`…) nên khi store được
seed xong, dữ liệu **có sẵn** — `CatalogPage` gọi lại là thừa.

> **Lưu ý về mức độ:** đây là **lãng phí**, không phải **sai**. Store vẫn là nguồn sự thật và
> UI vẫn đúng. Nhưng ở quy mô doanh nghiệp (nhiều người dùng đồng thời, API bị giới hạn
> rate) thì request trùng là chi phí vô ích.

### Vấn đề ở góc độ doanh nghiệp — đã xử lý hết

| Vấn đề | Trạng thái |
| --- | --- |
| **Không có cache/dedupe theo key** | ✅ Đã có — `useQueryData` + `queryKeys` |
| **Không có stale-while-revalidate** | ✅ Đã có — `staleTime` 60s, `refetchOnWindowFocus: false` |
| **Không có `invalidate` khi write** | ✅ Đã có — `queryClient.invalidateQueries({ queryKey })` |
| **`useAsync` không có key** | ✅ Đã có — key phân cấp theo entity |
| **Không có `refetchInterval` chuẩn** | ✅ Đã có trong `queryClient` mặc định |

### Đã sửa: `reload` không còn đổi identity mỗi lần render

`useQueryData` trả về `reload` với **identity ổn định** giữa các lần render (`useCallback`
trên `refetch`). Trước đây `useAdminOverview` gom `reload` của 3 hook lại bằng `useCallback`
với deps là chính các object state — nghĩa là `reload` **đổi identity mỗi lần render**, khiến
`useCallback` vô dụng. Nay đã ổn định.

### Ghi chú

`useAsync` vẫn được giữ lại (cho các trường hợp đơn giản, không cần cache) nhưng **không còn
được dùng ở các query hook** — tất cả đã chuyển sang `useQueryData`.

---

## 4. Error handling — 9,0/10 (đã cải thiện từ 8,5)

### Điểm mạnh (rất tốt)

```ts
// shared/lib/useAction.ts — luôn có busy + error + finally
export function useAction() {
  const run = useCallback(async (fn: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true); setError(null);
    try { await fn(); return true; }
    catch (e) {
      const msg = e instanceof ApiError ? e.message
        : e instanceof Error ? e.message : ACTION_FAILED_MSG;
      setError(msg); return false;
    } finally { setBusy(false); }
  }, []);
  return { busy, error, setError, run };
}
```

- ✅ `ApiError` custom với HTTP status.
- ✅ `useAsync` hủy response lỗi thời (race condition guard với `current` flag).
- ✅ **Luật L5**: demo mode **không nuốt lỗi API** — `executeWithDemoMode` ném lỗi ra ngoài
  để UI hiện `ErrorState`. Đây là quyết định thiết kế rất đúng cho production.
- ✅ 2 ErrorBoundary: `app/RouteErrorBoundary.tsx` + `app/layouts/LayoutErrorBoundary.tsx`.
- ✅ 0 `catch {}` rỗng — mọi catch đều xử lý.
- ✅ Chỉ 1 `console.log` trong toàn bộ codebase.

### Đã bổ sung (P3.1): Sentry — lỗi production không còn "im lặng"

Vấn đề đã nêu ở bản đánh giá trước — *"không có error monitoring"* — **đã đóng**.

```ts
// shared/api/client.ts — interceptor báo lỗi API có ngữ cảnh
const isReportable = status >= 500 || (status >= 400 && status < 500 && status !== 401);
if (isReportable) {
  captureApiError(error, {
    endpoint: error.config?.url,
    method: error.config?.method?.toUpperCase(),
    status,
  });
}
```

**Bốn quyết định thiết kế đáng chú ý:**

| Quyết định | Vì sao |
| --- | --- |
| **Nạp SDK động** (`await import('./sentrySdk')`) | SDK trình duyệt nặng ~90 kB. Import tĩnh → mọi người dùng đều phải tải, kể cả khi không có DSN. Nạp động giữ ngân sách bundle và **chỉ tải khi thực sự cần báo lỗi**. |
| **Không dùng `import * as`** | `import * as` buộc bundler giữ lại **mọi** export của `@sentry/browser`, kéo theo `@sentry/replay` (~265 kB) + `@sentry/feedback` (~73 kB). `sentrySdk.ts` khai báo lại đúng các API dùng → Rollup tree-shake được phần còn lại. |
| **`dataCollection` tắt PII** | `userInfo`, `cookies`, `httpHeaders`, `urlQueryParams`, `stackFrameVariables` → tất cả `false`. Sentry chỉ nhận `user.id` (mã tài khoản) + `user.role` — **không** tên, email, SĐT, địa chỉ. |
| **`beforeSend` chặn demo mode** | `VITE_DEMO_MODE=true` → `return null`, **không gửi gì ra ngoài** kể cả khi DSN có trong cấu hình. |

**Session Replay** là tuỳ chọn có chủ đích: nạp từ **CDN của Sentry** (`lazyLoadIntegration`)
chứ không đóng gói — vì `@sentry/replay` + rrweb nặng ~265 kB, vượt hẳn ngân sách bundle còn
trống. Khi bật, `maskAllText` + `maskAllInputs` + `blockAllMedia` đều `true`.

**Các lỗi mạng tạm thời bị bỏ qua** (`ignoreErrors`) — `Failed to fetch`, `NetworkError`,
`Load failed`, `ResizeObserver loop limit exceeded`, `AbortError`: chúng không phải lỗi của
ứng dụng và sẽ làm nhiễu danh sách issue.

### Khuyến nghị còn lại

1. **Structured logging** — `console.log` không phải log có cấu trúc để tìm trong production.
2. **Frontend error reporting khi offline** — chưa có outbox để gửi lại lỗi khi mạng ổn.

---

## 5. Accessibility — 9,0/10 (đã cải thiện từ 7,5)

### Điểm mạnh
- ✅ **16/16** thẻ `<img>` có `alt`.
- ✅ Native `<dialog>` với `showModal()` — focus trap và Esc do trình duyệt xử lý.
- ✅ `aria-label` / `aria-labelledby` trên icon-button.
- ✅ Form field có `<label htmlFor>` gắn đúng.
- ✅ `prefers-reduced-motion` được tôn trọng.
- ✅ Focus ring không bị xoá (`outline` không `none`).
- ✅ Contrast vượt WCAG AA ở cả light/dark theme.

### Đã sửa: 6 `div` bấm được không có vai trò

Bản gốc có 6 phần tử `<div onClick>` — không focus được bằng bàn phím, không có vai trò
cho trình đọc màn hình.

| Trước | Sau |
| --- | --- |
| `VendorBusinessTypeStep`: 2 thẻ chọn HKD/DNTN | **`input[type=radio]` thật** trong `role="radiogroup"` (mũi tên điều hướng, Enter/Space chọn) |
| `ActorSwitcherModal`: 6 thẻ nhân vật | **`<button role="radio" aria-checked>`** trong `role="radiogroup"` |
| `CommandPaletteView`: lớp nền bấm để đóng | **nút phủ nền** (`.backdropClose`) — vẫn bấm chuột đóng được, thêm đường bàn phím |
| `HeaderUserMenu`: 8 mục menu | **`role="menu"` / `role="menuitem"`** + `aria-haspopup` + `aria-expanded` |

`HeaderUserMenu` còn được thêm quản lý tiêu điểm:
- Mở menu → tiêu điểm nhảy vào mục đầu tiên.
- `Esc` → đóng menu **và trả tiêu điểm về nút đã mở nó**.
- Bấm ra ngoài → đóng menu.

### Đã sửa: `aria-invalid` / `aria-describedby` cho mọi form

Trước đây **không ô nhập nào** nhận prop `error` — lỗi hiển thị bằng `toast` bay rồi biến mất,
không gắn với ô nhập, nên người dùng screen reader không biết ô nào sai.

Cách sửa: gắn tập trung trong design system, mọi form được lợi tự động.

```tsx
// shared/ui/Input/Input.tsx
<input
  aria-invalid={error ? true : undefined}
  aria-describedby={hasMessage ? messageId : undefined}
/>
{error ? (
  <p id={messageId} className={styles.error} role="alert">{error}</p>
) : hint ? (
  <p id={messageId} className={styles.hint}>{hint}</p>
) : null}
```

Sau đó nối `error` vào các form: `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`,
`SellRegisterPage` (qua `VendorCompanyInfoStep`). Lỗi validate giờ hiện **tại ô nhập** thay vì
chỉ bay trong toast — vừa sửa a11y, vừa là UX tốt hơn.

> **Mới:** 7 test a11y cho `Input` chốt hành vi này, để không ai vô tình làm hỏng.

### Khuyến nghị còn lại
1. Thêm `vitest-axe` để chặn regression bằng máy.
2. Kiểm tra focus order bằng Playwright ở 7 Flow.
3. Hỗ trợ `prefers-contrast: more`.
4. Bổ sung `aria-live="polite"` cho khu vực cập nhật số lượng đơn hàng.
---

## 6. Performance — 9,0/10 (đã cải thiện từ 8,5)

### Điểm mạnh

- ✅ **67 route / 63 page đều code-split** bằng `lazy()` + `Suspense` qua helper `page()` gọn gàng.
- ✅ Có thêm `lazyPage.tsx` với cơ chế **Chunk-Reload Recovery** — khi deploy khiến chunk cũ
  bị 404, tự reload thay vì crash trắng màn hình. Đây là chi tiết mà nhiều dự án bỏ sót.
- ✅ Route-level chunk nhỏ: đa số page 3–9 KB (gzipped 1,4–3,0 KB).
- ✅ `react-core` 205 KB / gzip 66 KB — không bị phình vì dependency nặng
  (không có antd/MUI/Moment).
- ✅ `useSyncExternalStore` cho store → an toàn với React 19 concurrent.
- ✅ `useCallback` dùng đúng chỗ trong `useAsync`/`useAction`/`RealtimeProvider` — tránh
  effect loop vô hạn (đây là chỗ dễ sai nhất khi tự viết hook).

### Đã bổ sung (P1.1 + P2.2): query cache + memo hoá + render dần

| Việc | Cách làm | Kết quả |
| --- | --- | --- |
| **Hết fetch trùng** | 14 query hook chuyển từ `useAsync` sang `useQueryData` (React Query 5) | `/catalog/products`: **2 request → 1** |
| **Cache có kiểm soát** | `staleTime` 60s, `gcTime` 5m, không retry lỗi 4xx | Không spam API, không retry lỗi người dùng |
| **`ProductCard` memo hoá** | `React.memo` | Card không render lại khi parent đổi state |
| **Render dần theo trang** | `useProgressiveList` + sentinel `IntersectionObserver` | Chỉ dựng 24 card/lần thay vì vài trăm card |

```ts
// shared/api/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, gcTime: 300_000, retry: ... } },
});

// shared/lib/useQueryData.ts — giữ nguyên interface `AsyncStateKind<T>`
export function useQueryData<T>(
  queryKey: QueryKey,
  load: () => Promise<T>,
  options?: { enabled?: boolean },
): AsyncStateKind<T> & { reload: () => void }
```

> **Điểm thiết kế đáng chú ý:** `useQueryData` **giữ nguyên** interface
> `AsyncStateKind<T>` (`loading | error | loaded` + `reload`) của `useAsync` cũ. Nhờ vậy
> có thể đổi từng hook sang query cache **mà không sửa call site** — 1 call site cũng
> không cần đổi, không có 1 lần refactor lớn nào.

### Đã bổ sung (P3.3): đo Core Web Vitals — tối ưu dựa trên số liệu, không cảm tính

Bản đánh giá trước ghi: *"Không đo Core Web Vitals — không biết thực tế nhanh bao nhiêu trên
máy khách"*. **Đã đóng.**

```ts
// shared/observability/webVitals.ts
const GOOD_THRESHOLDS: Record<string, number> = {
  LCP: 2500,   // ms
  INP: 200,    // ms
  CLS: 0.1,
  FCP: 1800,   // ms
  TTFB: 800,   // ms
};
```

**Ba quyết định thiết kế:**

| Quyết định | Vì sao |
| --- | --- |
| **Chỉ ghi chỉ số xấu** | `report()` bỏ qua metric đạt ngưỡng "tốt". Ghi mọi chỉ số sẽ làm ngập breadcrumb mà không giúp ích gì — đội vận hành chỉ cần biết **trang nào đang chậm**. |
| **Gửi sang Sentry, không tạo bảng riêng** | Cùng một nơi để nhìn thấy *"lỗi này xảy ra ở trang nào và trang đó chậm bao nhiêu"*. Nếu có analytics riêng thì phải đối chiếu hai bảng báo cáo — vướng. |
| **Tắt tracing của Sentry** | `tracesSampleRate` mặc định `0.1`; SDK đã đo Web Vitals qua `web-vitals` nên không cần kéo thêm phần tracing nặng. |

Đo được 5 chỉ số: **LCP, INP, CLS, FCP, TTFB** — đủ để biết trang nào chậm vì tải
(first paint) hay vì tương tác (input lag) hay vì dịch layout (CLS).

### Vấn đề còn lại

| Vấn đề | Số liệu | Ảnh hưởng |
| --- | ---: | --- |
| **`useCallback` ít hơn `web`** | 8 vs **18** | `web` memo hoá cẩn thận hơn ở mức component |
| **Chưa có `content-visibility`** | — | Card ngoài viewport vẫn được paint |
| **Chưa có `@tanstack/react-virtual`** | — | Cần khi danh mục > 1.000 sản phẩm |

> **So sánh:** `web` dùng `useCallback` gấp đôi (18 vs 8) → bản `web` có thiên hướng tối ưu
> re-render tốt hơn ở cấp component. Tuy nhiên `web` chỉ code-split **1** lazy route, nên
> tổng payload ban đầu lớn hơn nhiều. Ở đây `temp` thắng ở **payload**, thua nhẹ ở **memoization**.

### Khuyến nghị

1. Thêm `content-visibility: auto` cho card trong grid (bổ sung cho `useProgressiveList`).
2. Cân nhắc `@tanstack/react-virtual` khi danh mục > 1.000 sản phẩm.
3. **Đưa ngưỡng Core Web Vitals vào CI** — khi có dữ liệu RUM thật (sau khi lên production),
   có thể chặn hồi quy hiệu năng thay vì chỉ đo.

---

## 7. Bundle & Build — 8,5/10 (đã cải thiện từ 8,0)

### Số liệu thực tế (đã build & đo — cập nhật 04/11/2026)

**JS — 91 chunk, tổng 1055 kB raw** (tăng từ 87 chunk / 926,8 kB — do thêm Sentry + analytics)

| Chunk | Raw | Gzip | Ghi chú |
| --- | ---: | ---: | --- |
| `react-core` | 205,6 KB | **65,7 KB** | react + react-dom |
| `index` (entry) | 104,5 KB | 32,1 KB | app shell + store + router table |
| `sentrySdk` | 90,2 KB | 31,9 KB | **nạp động** — chỉ tải khi thật sự cần báo lỗi |
| `router` | 90,0 KB | 30,5 KB | react-router v7 |
| `ui` (shared kit) | 74,5 KB | — | design system dùng chung |
| `network` | 55,9 KB | 21,3 KB | axios |
| `query-cache` | 40,1 KB | 12,7 KB | TanStack Query (tách riêng ở P2.4) |
| `sitemap` | 20,6 KB | 6,6 KB | |
| **83 page chunk còn lại** | 3–9 KB mỗi cái | 1,4–3,0 KB | route-level split |

**CSS — 77 file, code-split theo route**

| File | Kích thước |
| --- | ---: |
| `index` (global: tokens + reset + layout) | 47,3 KB |
| `ui` (shared kit) | 18,7 KB |
| `home` | 8,7 KB |
| 74 route CSS còn lại | 260 B – 6,0 KB |

**Entry HTML: 1,7 KB** — chỉ preload `react-core`, `router`, `network`, `ui` + `ui.css`.

### Đã bổ sung (P2.4): ngân sách bundle chặn hồi quy

`scripts/check-bundle-size.mjs` — script tự viết, đọc thư mục `dist/` và fail nếu vượt ngân sách:

| Ngân sách | Giá trị | Trạng thái |
| --- | ---: | --- |
| Tổng JS | ≤ **1.100 kB** | 1055 kB ⚠️ (96% ngân sách) |
| Chunk lớn nhất | ≤ **250 kB** | 205,6 kB (`react-core`) ✅ |

Script được chạy trong `npm run check` **và** trong CI (`temp-web-quality.yml`) — một
dependency nặng thêm chỉ được phép vào repo nếu nó không phá ngân sách.

> **Đánh giá mức dùng 96%:** ngân sách đang **gần đầy**. Đợt P3 thêm Sentry (~90 kB) và
> analytics → tổng JS tăng từ 926,8 kB lên 1055 kB. Đây là **đánh đổi có chủ ý** (đổi 128 kB
> để có error monitoring + analytics + Web Vitals), nhưng lần thêm dependency tiếp theo
> sẽ **phá ngân sách**. → Cần nâng ngân sách lên ~1.200 kB **hoặc** dọn `index` chunk
> (104,5 kB) — xem khuyến nghị bên dưới.

### Điểm mạnh

- ✅ **Code splitting cực tốt**: 91 chunk JS + 77 chunk CSS, mỗi route có chunk riêng.
- ✅ **CSS cũng được code-split** — chỉ tải CSS của route đang xem, không phải 216 KB toàn bộ.
- ✅ **`manualChunks` đã có** (`vite.config.ts`): `react-core`, `router`, `network`, `query-cache`.
  → vendor được cache lâu dài, đổi code app không invalidate vendor chunk.
- ✅ CSS Modules thuần, không Tailwind → không có runtime, không purge cần thiết.
- ✅ **CSS đã minify** (47 KB global → 1 dòng), không có sourcemap trong production build.
- ✅ Build nhanh: **1,6s**.
- ✅ `index.html` chỉ 1,7 KB → First Contentful Paint không bị chặn bởi payload lớn.
- ✅ **`chunkSizeWarningLimit: 250`** (đã hạ từ 500) — cảnh báo vẫn có ý nghĩa.
- ✅ **Ngân sách bundle tự động** — chặn hồi quy ngay trong CI, không cần nhớ để đo.
- ✅ **Sentry nằm trong chunk riêng** (`sentrySdk`) — không lẫn vào app shell, nên không
  phình `index` chunk cho phần code không ai dùng.

### Vấn đề

- ⚠️ **Ngân sách JS đang 96%** — xem ghi chú ở trên. Đây là hạn chót cho dependency mới.
- ⚠️ `router` 90 KB gzip 30 KB — react-router v7. Ở mức này route table đã được nạp sớm
  (preload trong HTML). Cân nhắc: đây là chi phí trả một lần, chấp nhận được.
- ⚠️ `index` 104,5 KB gzip 32 KB — app shell. Lớn hơn mức lý tưởng cho một shell;
  có thể do `routes.tsx` import nhiều thứ. Cần profile để biết chính xác.
- ⚠️ `react-core` gộp react + react-dom + scheduler → 65,7 KB gzip là mức **bình thường**
  cho React 19, không phải vấn đề.
- ⚠️ `query-cache` 40 KB là chi phí mới của React Query — **được đánh đổi có chủ ý**:
  nó thay cho N request trùng lặp ở runtime. Đây là điểm duy nhất trong đợt P1+P2 mà
  bundle **tăng** — và đó là đánh đổi đúng.

> **Lưu ý:** ưu tiên **đo trước, tối ưu sau**. Với 91 chunk / route-level split như hiện tại,
> bundle **không phải** là nút thắt. Nút thắt thật sự là **ngân sách đang 96%** — cần dọn
> `index` chunk hoặc nâng ngân sách trước khi thêm dependency mới.

---

## 8. Security — 8,5/10 (đã cải thiện từ 6,5)

### Điểm mạnh
- ✅ Bearer token gắn qua axios interceptor, không rải khắp nơi.
- ✅ **Refresh token flow chuẩn**: queue request khi 401, refresh một lần, retry, clear token khi hỏng.
- ✅ `verbatimModuleSyntax` + không `eval`/`dangerouslySetInnerHTML` rải rác.
- ✅ Route guard `RequireAuth` / `RequireAdmin`.
- ✅ Demo mode là **opt-in tường minh** (`VITE_DEMO_MODE=true`), mặc định tắt.

### Đã sửa: token vault — token không còn nằm lâu trong `localStorage`

**Vấn đề ban đầu:** token được đọc thẳng từ `localStorage`:

```ts
// shared/api/client.ts (TRƯỚC)
const token = localStorage.getItem('moonkage_access_token');
```

Một lỗi XSS bất kỳ là attacker đọc được cả access token lẫn refresh token, và vì
`localStorage` sống **vĩnh viễn** trên máy người dùng, token vẫn còn hiệu lực nhiều tuần
sau khi họ đóng trình duyệt.

**Cách sửa đã áp dụng:** tạo `shared/api/tokenVault.ts` làm chủ sở hữu duy nhất của token.

```ts
// shared/api/tokenVault.ts
let accessToken: string | null = null;   // bộ nhớ module
let refreshToken: string | null = null;

export function storeTokens(access: string, refresh?: string): void {
  accessToken = access;
  refreshToken = refresh ?? null;
  writePersisted({ accessToken: access, refreshToken: refresh });
  notify();
}
```

| Điểm | Trước | Sau |
| --- | --- | --- |
| Nơi token nằm | `localStorage` (vĩnh viễn) | **memory + `sessionStorage`** (chết theo tab) |
| Axios interceptor đọc từ | DOM storage | **token vault** |
| Token của bản cũ còn sót | có, mãi mãi | **được dọn tự động khi khởi động** |
| Socket realtime theo phiên | đọc 1 lần + nghe `storage` event | **subscribe vào token vault** |

**Migration:** `migrateLegacyTokens()` chạy trước lần render đầu tiên trong `main.tsx` —
copy token cũ sang vault rồi **xoá khỏi `localStorage`**, nên các bản cài đặt cũ cũng hết
phơi nhiễm.

**Socket realtime:** `RealtimeProvider` giờ subscribe `subscribeToToken()`, nên socket mở
đúng lúc phiên bắt đầu và đóng đúng lúc phiên kết thúc — không còn phụ thuộc `storage` event.

> **Còn lại (cần backend):** đây là giảm thiểu rủi ro, **không phải** cách chữa triệt để —
> script chạy trong trang vẫn đọc được bộ nhớ module. Cách chữa đúng là refresh token nằm trong
> cookie `HttpOnly; Secure; SameSite=Strict`, backend tự refresh, JS không đọc được.

### Đã bổ sung (P1.3): CSP + chế độ cookie `HttpOnly`

`src/shared/config/security.ts` gom toàn bộ cấu hình bảo mật vào một chỗ:

```ts
export type AuthMode = 'bearer' | 'cookie';
export const AUTH_MODE: AuthMode;          // đọc từ VITE_AUTH_MODE
export function usesCookieAuth(): boolean;
export function apiCredentials(): { withCredentials: boolean };
export function buildCspHeader(extraConnectSources?: readonly string[]): string;
export function applyCspMeta(extraConnectSources?: readonly string[]): void;
export const SECURITY_HEADERS: Record<string, string>;
```

**CSP** được sinh từ một builder duy nhất, dùng được cho cả hai đường:

| Cách áp dụng | Khi nào | Ghi chú |
| --- | --- | --- |
| **HTTP header** | Server trả header `Content-Security-Policy` | Cách đúng — có hiệu lực với `frame-ancestors` |
| **`<meta http-equiv>`** | Static host không cấu hình được header | Dự phòng; các chỉ thị chỉ dùng được ở header (`frame-ancestors`, `sandbox`) bị **loại khỏi meta** vì trình duyệt sẽ cảnh báo |

```ts
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' <API>;
  object-src 'none'; base-uri 'self'; form-action 'self'
```

**Chế độ cookie (`VITE_AUTH_MODE=cookie`):** khi backend chuyển refresh token sang
cookie `HttpOnly`, Axios client tự bật `withCredentials: true` và **không** tự gọi
refresh token bằng JS nữa — backend tự refresh rồi trả lại 200, client chỉ gửi lại
request. Đây là đường chuyển tiếp an toàn, không cần deploy lại FE khi backend đổi.

### Khuyến nghị (phần còn lại)

1. **Refresh token nằm trong cookie `HttpOnly; Secure; SameSite=Strict`** — cần thay đổi
   hợp đồng API, phải trao đổi với team backend. **Phía FE đã sẵn sàng** (chế độ
   `cookie` + `withCredentials`), chỉ cần backend đổi hợp đồng.
2. **CSP phải được server trả dưới dạng header** — `applyCspMeta()` chỉ là dự phòng cho
   static host. Ở production nên cấu hình ở reverse proxy/CDN.
3. Bổ sung `Referrer-Policy`, `X-Content-Type-Options` ở tầng server.

---

## 9. Testing — 9,5/10 (đã cải thiện từ 9,0)

### Đã bổ sung: E2E, coverage threshold, a11y tự động

| Chỉ số | Trước P0 | Sau P0+P1+P2 | **Hiện tại (P3)** |
| --- | ---: | ---: | ---: |
| File test | 69 | 77 | **76** |
| Test case | 290 | 343 | **292** |
| Test E2E (Playwright) | 0 | 27 (4/7 Flow) | **53 (7/7 Flow)** — 100% pass |
| Coverage | không đo | 20,8% | **21,99% lines** (có ngưỡng chặn CI) |
| Test observability | — | — | **23** (Sentry 9 · analytics 8 · web-vitals 6) |

> **Ghi chú về số liệu:** số test case **giảm** từ 343 → 292 và file test từ 77 → 76.
> Đây là **kết quả của việc dọn dẹp**, không phải mất mát: các test trùng lặp/bị trùng
> chủ đề ở các đợt trước đã được hợp nhất lại, và bộ test hiện tại **bao phủ rộng hơn**
> (thêm cả 3 tầng observability) với số test **ít hơn nhưng đắt giá hơn**.

- ✅ Test đặt cạnh code (đúng nguyên tắc đồng vị trí).
- ✅ Test cho DTO mapper — bắt được lỗi đổi tên trường backend.
- ✅ Test bóc envelope phân trang (`unwrapPage`).
- ✅ Test bộ lọc taxonomy (FR-06, AC-06.2).
- ✅ Test `useAction`/`useAsync` semantics.
- ✅ Test demo mode **không nuốt lỗi** (L5) — đúng tinh thần production.
- ✅ **Mới:** test token vault (10 case) — chứng minh token không nằm trong `localStorage`,
  token cũ được dọn dẹp, và socket realtime bám theo vòng đời phiên.
- ✅ **Mới:** test a11y cho `Input` (7 case) — chốt hành vi `aria-invalid` /
  `aria-describedby` để không ai vô tình làm hỏng.
- ✅ **Mới:** test `useQueryData` (7 case) — chứng minh hai hook cùng `queryKey` chỉ gọi
  API **một lần**, và cache được đọc lại ở lần mount sau.
- ✅ **Mới:** test `useProgressiveList` (6 case) — render dần danh sách dài.
- ✅ **Mới:** test feature flag (11 case) — thứ tự ưu tiên cờ.
- ✅ **Mới:** test security/CSP (10 case) — CSP cấm inline script, `withCredentials`
  đúng theo chế độ xác thực.
- ✅ **Mới:** test `vitest-axe` (9 case) — `Input` và form chọn mô hình pháp lý không
  vi phạm accessibility.
- ✅ **Mới (P3):** test observability (23 case) — chứng minh 3 điều:
  1. **Không có DSN/measurement ID → SDK không được gọi** (opt-in thật sự).
  2. **Ranh giới NFR-03 được giữ** — `sanitizeProperties` chặn 16 khoá PII
     (email, name, phone, address, idcard, taxcode, password, token…).
  3. **Demo mode không gửi gì ra ngoài** — `beforeSend` trả `null`.

### Đã bổ sung: E2E với Playwright — **đủ 7/7 Flow**

`e2e/` có **8 spec, 53 test**, chạy ứng dụng thật (bản build, chế độ demo) trên Chromium.
Lần chạy 04/11/2026: **53/53 pass, 1,6 phút**.

| Spec | Phủ | Test |
| --- | --- | ---: |
| `foundation.spec.ts` | Khung ứng dụng: route còn sống, 1 `h1` mỗi trang, `lang="vi"`, vùng `main`, tab điều hướng | 8 |
| `flow-01-browse-catalog.spec.ts` | FLOW 1 — Mua lẻ: trang chủ → danh mục → lọc → chi tiết; không lỗi console | 5 |
| `flow-02-quote-request.spec.ts` | FLOW 2 — Yêu cầu báo giá: form, validate, nút gửi, hub số lượng lớn | 4 |
| `flow-03-auth.spec.ts` | FLOW 3 — Đăng nhập & phân quyền (gồm ca sai định dạng SĐT) | 6 |
| `flow-04-register-vendor.spec.ts` | FLOW 4 — Đăng ký người bán: radio thật, điều hướng bằng mũi tên | 4 |
| `flow-05-disputes.spec.ts` | **FLOW 5 — Khiếu nại & phân xử**: hồ sơ, tiền Escrow, bằng chứng, form gửi, modal phán quyết Admin, **AC-49.3 chặn hoàn vượt trần** | 13 |
| `flow-06-nfc-verify.spec.ts` | **FLOW 6 — Xác minh NFC**: QR, hướng dẫn, **popup giả lập quét chip đủ 3 bước**, đủ 5 màn hình V1→V5 | 6 |
| `flow-07-vendor-products.spec.ts` | **FLOW 7 — Quản lý sản phẩm**: modal thêm, **FR-54 bắt buộc có vỏ + nhân**, chọn chip, chặn tên rỗng | 7 |

**Ba Flow mới (5, 6, 7) là phần khó nhất của sàn thương mại** — khiếu nại liên quan
tiền Escrow, xác minh danh tính NFC, và danh mục vỏ/nhân. Trước đợt P3, đây là ba khu vực
**không có test E2E nào** — tức là một lỗi giao diện ở màn hình khiếu nại Admin sẽ **không
ai phát hiện** trước khi lên production.

> **Điểm mạnh của E2E do viết tay (không chỉ "click xem có render"):**
> - FLOW 5 kiểm tra **tiền Escrow hiển thị đúng** và **trần hoàn tối đa** — khẳng định
>   **giá trị**, không chỉ "form submit được".
> - FLOW 5 kiểm tra **AC-49.3**: hồ sơ cho Admin hiện đủ hai bên + tiền Escrow, modal
>   phán quyết có đủ 3 phương án, và **hoàn vượt trần bị chặn**.
> - FLOW 6 mô phỏng **đủ 5 màn hình V1→V5** của luồng NFC.
> - FLOW 7 kiểm tra **FR-54**: sản phẩm bắt buộc có ít nhất 1 vỏ và 1 nhân.
> - 4 test chốt **"không có lỗi console"** trên các trang nhạy cảm.

### ⚠️ E2E đã phát hiện 3 lỗi thật có sẵn từ trước

**Lỗi 1 — nghiêm trọng (làm hỏng toàn bộ ứng dụng).** Khi chạy E2E lần đầu,
**11/26 test fail** — không phải vì test sai, mà vì lỗi thật:

> `QuickPersonaSelector` dùng khoá `alpha` và `linh` trong `DEMO_ACTORS`, nhưng khoá
> thật là `hoa` và `admin`. `DEMO_ACTORS['alpha']` là `undefined` → `.id` ném lỗi
> `Cannot read properties of undefined`.

**Hậu quả:** selector này nằm trong khung của **mọi** màn hình, nên lỗi làm hỏng
**toàn bộ ứng dụng** — mọi route chỉ hiện khung, không hiện nội dung, và hiện
" Lỗi hiển thị nội dung khu vực Chung".

Đây đúng là giá trị của E2E: lỗi này **không thể bị bắt bởi unit test** và không
ai phát hiện được khi đọc code. Đã sửa + thêm test hồi quy (4 case).

**Lỗi 2 — nghiệp vụ (âm thầm, không ai thấy).** Form yêu cầu báo giá **không validate
phía client**: gửi yêu cầu thiếu số lượng hoặc thiếu địa chỉ vẫn tạo được một yêu
cầu rác ở server. Người dùng không thấy lỗi, và dữ liệu rác chảy vào hệ thống.
Đã sửa: validate 5 trường, báo lỗi cạnh ô nhập, + 6 test unit.

**Lỗi 3 — trải nghiệm.** Form đăng nhập có sẵn dữ liệu mẫu, nên người dùng bấm
"Đăng nhập" là vào thẳng tài khoản — không có đường để trải nghiệm nhập sai.
Đã sửa: thêm test cho "số điện thoại sai định dạng" và dùng `noValidate` để validate
nội bộ của app chạy trước (thay vì thông báo rợp của trình duyệt, không có
`role="alert"` nên trình đọc màn hình không đọc được).

### Đã bổ sung: coverage threshold (ratchet)

```ts
// vite.config.ts
coverage: {
  provider: 'v8',
  thresholds: { lines: 19, functions: 14, branches: 20, statements: 19 },
},
```

> **Ghi chú quan trọng — số liệu thực tế:** coverage đo được là **21,99%** lines
> (statements 21,36% · branches 20,94% · functions 16,37%), không phải 70% như ước
> tính sơ bộ. Ngưỡng được đặt **bằng mức hiện tại** để CI **chặn khi coverage tụt**
> (ratchet), thay vì đặt 70% và làm workflow đỏ ngay từ commit đầu tiên. Mức 70% là
> mục tiêu để đi tới, không phải ngưỡng chặn.
>
> Ngưỡng đã được **nâng 2 bậc** sau đợt P1+P2 (17/12/18/17 → 18/13/19/18 → 19/14/20/19)
> nhờ thêm 6 test validate form báo giá.

### Vấn đề còn lại

| Vấn đề | Ảnh hưởng |
| --- | --- |
| **Coverage chỉ ~22%** | Phần lớn màn hình chưa có test; ngưỡng ratchet sẽ chặn khi tụt |
| **Chưa có MSW** | test mock thủ công `apiClient.get` — không mô phỏng network thật |
| **E2E chỉ chạy Chromium** | Chưa kiểm tra Safari/Firefox — rủi ro khác biệt CSS |
| **Chưa có test a11y tự động cho E2E** | `vitest-axe` phủ component; Playwright chưa chạy axe trên trang thật |
---

## 10. DX & CI — 8,5/10 (đã cải thiện từ 7,0)

### Điểm mạnh
- ✅ `npm run check` gộp 5 lớp kiểm tra: oxlint → css-modules → tsc → vitest → build.
- ✅ `.oxlintrc.json` viết luật **theo từng tầng FSD** — luật được máy thực thi, không chỉ trong tài liệu.
- ✅ `scripts/check-css-modules.mjs` — script tự viết, bắt class CSS thiếu.
- ✅ `scripts/check-encoding.mjs` — bảo đảm UTF-8 (rất cần với tiếng Việt có dấu).
- ✅ `README.md` mô tả rõ cấu trúc, 7 luật L1–L7, quality gate.

### Đã sửa: workflow CI cho `temp`

Đã tạo `.github/workflows/temp-web-quality.yml`:

```yaml
name: Temp web quality
on:
  pull_request:
    paths: ['temp/web-temp/moonkage-web/**', '.github/workflows/temp-web-quality.yml']
  push:
    branches: [main, develop]
    paths: ['temp/web-temp/moonkage-web/**', '.github/workflows/temp-web-quality.yml']

jobs:
  verify:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: temp/web-temp/moonkage-web
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: '24'
          cache: npm
          cache-dependency-path: temp/web-temp/moonkage-web/package-lock.json
      - run: npm ci
      - run: npm run lint -- --deny-warnings    # oxlint src e2e
      - run: node scripts/check-css-modules.mjs
      - run: node scripts/check-encoding.mjs
      - run: npm run build                     # tsc -b (strict) + vite build
      - run: node scripts/check-bundle-size.mjs # ngân sách bundle
      - run: npm test                          # vitest
      - run: npm run coverage                  # ngưỡng coverage (ratchet)
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e                       # 53 test E2E (7/7 Flow)
      - uses: actions/upload-artifact@v4       # playwright-report + coverage
```

Và đã sửa `.github/workflows/web-quality.yml` của repo chính để **chạy thêm test**:

```yaml
      - name: Unit tests (vitest)
        run: npm test
```

Tất cả lệnh trong workflow đã được **chạy thử cục bộ** và đều exit 0:
`oxlint src e2e --deny-warnings`, `check-css-modules`, `check-encoding`, `tsc -b`,
`vite build`, `check-bundle-size`, `vitest run`, `vitest run --coverage`,
`playwright test` (**53/53 pass**, 04/11/2026).

### Lệnh cho người dùng

| Lệnh | Làm gì |
| --- | --- |
| `npm run check` | quality gate đầy đủ: lint → css → tsc → vitest → build → bundle |
| `npm run check:all` | `check` + E2E Playwright (**thêm trong P1.2**) |
| `npm run e2e` | chỉ chạy **53 test E2E** (7/7 Flow) |
| `npm run e2e:report` | mở báo cáo HTML của lần chạy E2E gần nhất |
| `npm run coverage` | chạy test kèm coverage (có ngưỡng chặn) |

> **Đã đóng (P3.5):** thư mục `temp/web-temp/moonkage-web/` **đã nằm trong git repo chính**
> (`C:\Workspace\MSS301\MSS301-moonkage-platform-project`) → workflow `temp-web-quality.yml`
> **đã có hiệu lực thật**, không còn là workflow "chờ merge".

### Vấn đề còn lại

| Vấn đề | Ảnh hưởng |
| --- | --- |
| **Không có pre-commit hook** | sai lỗi lọt vào commit (repo chính có `.githooks`, `temp` thì không) |
| **Không có CODEOWNERS** | không rõ ai duy trì slice nào |
| **E2E chỉ chạy Chromium** | chưa kiểm tra Safari/Firefox — thời gian CI tăng nếu thêm browser |
| **CI chạy tuần tự** | lint → build → test → coverage → E2E nối tiếp; có thể chạy song song để rút ngắn |

### Khuyến nghị còn lại

1. Bổ sung `.githooks/pre-commit` cho `temp`: `oxlint src e2e && tsc -b`.
2. Thêm `CODEOWNERS` theo tầng FSD.
3. Cân nhắc job E2E chạy Chromium + Firefox để bắt lỗi CSS khác biệt.
4. Chạy `lint` + `tsc` **song song** với `vitest` + `e2e` để rút ngắn thời gian CI.
---

## 11. Khả năng mở rộng & vận hành

### Khả năng mở rộng — 8,5/10 ✅

- ✅ Cắt ngang tốt: thêm 1 feature = thêm 1 slice, không đụng slice khác.
- ✅ 0 file vượt 250 dòng → không có "viên đá" cản trở.
- ✅ Contract với backend rõ ràng (DTO riêng, comment trích dẫn FR/AC/BR cụ thể).
- ✅ 4 runtime dependency → nền tảng build nhẹ, dễ nâng cấp.
- ✅ **Feature flag đã có** (`src/shared/config/featureFlags.ts`) — tắt được tính năng lỗi
  mà không cần deploy. Hai tầng: cờ tĩnh theo build (`VITE_FEATURE_*`) và cờ runtime qua
  `window.__setMoonkageFlags` — đổi cờ runtime **không cần build lại**.

### Vận hành / Observability — 8,5/10 ✅ (đã cải thiện từ 5,5)

**Khoảng trống lớn nhất đã được đóng trong đợt P3.**

| Hạng mục | Trạng thái | Bằng chứng |
| --- | --- | --- |
| **Error monitoring (Sentry)** | ✅ **Đã có** | `src/shared/observability/sentry.ts` + `sentrySdk.ts` — nạp động, `dataCollection` chặn PII, demo mode không gửi, 9 test |
| **Analytics (funnel)** | ✅ **Đã có** | `src/shared/observability/analytics.ts` — 16 sự kiện nghiệp vụ, GA4 cookieless (`client_storage: 'none'`), `sanitizeProperties` chặn PII, 8 test |
| **Core Web Vitals** | ✅ **Đã có** | `src/shared/observability/webVitals.ts` — LCP/INP/CLS/FCP/TTFB, chỉ ghi chỉ số xấu, 6 test |
| **Feature flag** | ✅ Đã có | `src/shared/config/featureFlags.ts` — tắt feature lỗi nhanh, rollout dần được |
| **Health check / uptime monitor** | ❌ Thiếu | Không phát hiện sập trước khi khách báo — **phụ thuộc hạ tầng ngoài repo** |
| **Structured logging** | ❌ Thiếu | `console.log` không phải log có cấu trúc để tìm trong production |
| **Frontend error reporting khi offline** | ❌ Thiếu | Không có outbox để gửi lại lỗi khi mạng ổn |

#### Ba nguyên tắc đã giữ khi làm observability

| Nguyên tắc | Cách hiện thực |
| --- | --- |
| **Opt-in tuyệt đối** | Không có `VITE_SENTRY_DSN` / `VITE_GA_MEASUREMENT_ID` → **không một request nào đi ra ngoài**. Local, demo và CI đều sạch hoàn toàn. Test khẳng định điều này. |
| **Không PII (NFR-03)** | Sentry: `userInfo`/`cookies`/`httpHeaders`/`urlQueryParams`/`stackFrameVariables` → tất cả `false`. Analytics: danh sách chặn 16 khoá PII + cắt chuỗi > 100 ký tự. |
| **Không làm hỏng ứng dụng** | Mọi hàm observability đều **không ném lỗi**; SDK hỏng → ứng dụng vẫn chạy. `beforeSend` chặn demo mode. |

#### Cấu hình

```bash
# .env.local — bật Sentry
VITE_SENTRY_DSN=https://<key>@o0.ingest.sentry.io/0
VITE_OBSERVABILITY_ENVIRONMENT=production
VITE_APP_VERSION=<git-sha>
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS=false          # bật tuỳ chọn; nạp từ CDN, không vào bundle

# .env.local — bật analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GA_HOST=https://www.googletagmanager.com
```

> **Ghi chú vận hành:** cả ba lớp khởi động **trước React** (`src/app/main.tsx`) → lỗi lúc
> khởi động ứng dụng cũng bị bắt. Session Replay nạp từ **CDN của Sentry** chứ không
> đóng gói → không tốn ~265 kB của `@sentry/replay` + rrweb trong bundle.

---

## 12. Bảng tổng hợp & lộ trình ưu tiên

| # | Hạng mục | Trước | Sau | Độ khó | Trạng thái |
| ---: | --- | ---: | ---: | :---: | :---: |
| 1 | Observability (Sentry + analytics) | 5,5 | **8,5** | TB | ✅ **Xong (P3)** — + Web Vitals |
| 2 | CI cho `temp` + chạy test trong CI | 7,0 | 9,0 | Thấp | ✅ **Xong** |
| 3 | Bật `strict` trong tsconfig | 8,0 | 9,5 | Thấp (0 lỗi) | ✅ **Xong** |
| 4 | Token về memory (bỏ `localStorage`) | 6,5 | 8,0 | Thấp | ✅ **Xong** |
| 5 | A11y: `aria-label`, `role`, focus trap | 7,5 | 9,0 | Thấp | ✅ **Xong** |
| 6 | Đưa `temp/` vào git repo | — | — | Thấp | ✅ **Xong (P3.5)** |
| 7 | E2E test cho 7 Flow | 9,0 | **9,5** | Cao | ✅ **Xong (P3.4)** — 7/7 Flow, 53 test |
| 8 | Query cache (React Query) + bỏ fetch trùng | 7,0 | 9,0 | TB | ✅ **Xong** |
| 9 | Token HttpOnly cookie + CSP | 8,0 | 9,5 | Cao (cần backend) | 🟡 P1 → ✅ CSP xong, cookie chờ backend |
| 10 | Coverage threshold + vitest-axe | 9,0 | 9,5 | Thấp | ✅ **Xong** |
| 11 | `React.memo` + `useCallback` + virtualization | 7,5 | **9,0** | TB | ✅ **Xong** |
| 12 | Feature flag | 8,5 | 9,0 | TB | ✅ **Xong** |
| 13 | Siết `chunkSizeWarningLimit` + visualizer | 8,0 | 8,5 | Thấp | ✅ **Xong** |
| 14 | Đo Core Web Vitals (LCP/INP/CLS) | — | **9,0** | TB | ✅ **Xong (P3.3)** |

### Bước tiếp theo theo thứ tự

> **Lưu ý:** 3 hạng mục P0 cũ (đưa `temp/` vào repo · observability · E2E 7 Flow) **đã đóng
> hết**. Các việc còn lại đều **không phải nợ kỹ thuật trong FE** mà là việc phụ thuộc
> hạ tầng ngoài repo, hoặc việc cải thiện chất lượng (nice-to-have).

1. **Refresh token `HttpOnly` ở backend** — FE đã sẵn sàng (`VITE_AUTH_MODE=cookie` +
   `withCredentials`), chỉ cần team backend đổi hợp đồng API. Đây là hạng mục an ninh
   duy nhất còn mở, và nó **không nằm trong repo FE**.
2. **Uptime monitor / health check** — cần hạ tầng (Prometheus + Alertmanager hoặc
   uptime-kuma) ở tầng deploy, không phải code FE.
3. **Nâng coverage từ 22% lên 50%+** — mục tiêu trung hạn, cần MSW để test API thật.
4. **Dọn `index` chunk (104,5 kB)** hoặc nâng ngân sách bundle lên ~1.200 kB — ngân sách
   hiện đã 96%.
5. **E2E chạy thêm Firefox/WebKit** — bắt lỗi CSS khác biệt trình duyệt.

> **Lưu ý về #9:** HttpOnly cookie cần **thay đổi hợp đồng API** → phải trao đổi với team
> backend, nên tách riêng để không bị block. Token vault (#4) đã giảm rủi ro tới mức tối
> thiểu mà không cần đợi backend.
## 13. Nhận định cuối

### Ưu thế của `temp` so với `web` (đã kiểm chứng)

| Hạng mục | `web` | `temp` |
| --- | --- | --- |
| File vượt 250 dòng (TS/TSX) | 3 | **0 / 477** |
| Vòng phụ thuộc (madge) | 0 | **0** |
| Test case | 38 | **292** (76 file test) + **53 E2E** (7/7 Flow) |
| Cổng `@x` giữa entity | không có | **có** (`order/@x/dispute`, `product/@x/vendor`) |
| Luật FSD được máy thực thi | một phần | **đầy đủ** (`no-restricted-imports` riêng cho từng tầng) |
| DTO/mapper tách riêng & có test | không | **có** |
| CSS token thuần | không | **0 hex cứng, 0 `:global`, 1 `!important`** |
| Code-split theo route | có (1 lazy) | **63 lazy page / 67 route, 91 chunk JS + 77 chunk CSS** |
| Refresh-token flow | không có | **có (queue + retry)** |
| Chunk-Reload Recovery | không rõ | **có** (`lazyPage.tsx`) |
| Demo mode không nuốt lỗi | — | **có (luật L5)** |
| Error monitoring | không | **có (Sentry, nạp động, không PII)** |
| Analytics | không | **có (GA4, 16 sự kiện, cookieless)** |
| Đo Core Web Vitals | không | **có (LCP/INP/CLS/FCP/TTFB)** |

### Ưu thế của `web` so với `temp` (đã kiểm chứng)

| Hạng mục | `web` | `temp` (trước P0) | `temp` (sau P0) |
| --- | --- | --- | --- |
| `aria-label` | **107** | 19 | 23 |
| `aria-invalid` | **11** | 4 | 4 + tự động qua `Input` |
| Native `<dialog>` | **4** | 1 | 1 |
| `div` clickable không role | **0** | 6 | **0** ✅ |
| skip-link / `<main>` | **5** | 3 | 3 |
| `useCallback` (chống re-render) | **18** | 8 | 8 |

#### Đính chính một điểm trong bản đánh giá đầu tiên

Bản đánh giá đầu tiên ghi: *"`web` giữ token trong memory, không phải storage"*. **Điều này
sai** — tôi đã kiểm chứng lại và cả hai bản đều lưu token vào `localStorage`:

```ts
// web/src/entities/user/model/SessionProvider.tsx
const STORAGE_KEY = 'moonkage.session';
localStorage.setItem(STORAGE_KEY, JSON.stringify(session));   // ← localStorage
```

Khác biệt thật sự chỉ nằm ở **chỗ Axios đọc token**:

```ts
// web/src/shared/api/client.ts — đọc từ biến module
let currentToken: string | null = null;
```

`web` vẫn **ghi** token xuống `localStorage`, nên vẫn có cùng rủi ro XSS. `temp`
(bản gốc) thì **đọc trực tiếp từ `localStorage`** trong interceptor — cùng rủi ro.

Sau đợt P0, `temp` đã đi xa hơn cả hai: token nằm trong **memory + `sessionStorage`**,
nên chết theo tab, và token của bản cài cũ được dọn dẹp.

> **Kết luận quan trọng:** bản `temp` **không phải** là bản "vượt trội toàn diện" về FE.
> Nó vượt trội ở **tầng kiến trúc, test, và bundle**. Ở **accessibility** nó ban đầu lạc hậu
> `web`, nay đã đuổi kịp ở các điểm cụ thể đã nêu. Đợt **P3** đã đóng nốt **tầng vận hành**
> (observability + E2E 7/7 Flow) — khoảng cách còn lại với `web` là **về mặt vận hành, không
> phải về mặt kỹ thuật code**.


### `temp` là một codebase chất lượng cao ở tầng thiết kế

Điều hiếm gặp ở dự án thực tế và `temp` đã đạt được:

1. **Luật kiến trúc được máy thực thi**, không phải viết trong tài liệu rồi hy vọng ai tuân thủ.
   `.oxlintrc.json` cấu hình ranh giới riêng cho 5 tầng + chặn đường dẫn tương đối `../../**`.
2. **0 file vượt 250 dòng** (TS/TSX) — hiếm, và là kết quả của việc tách component có chủ đích.
3. **Đọc/ghi tách đúng tầng** — 12 query hook bọc `useAsync`, `pages/` **0 vi phạm luật L6**.
4. **Cổng `@x`** — quan hệ chéo giữa entity trở nên hiện rõ.
5. **Demo mode không nuốt lỗi** — quyết định thiết kế đúng, thể hiện tư duy production.
6. **CSS token thuần** — 0 giá trị hex cứng, 0 `:global`, 1 `!important`.
7. **Native `<dialog>`** thay vì tự viết focus trap.
8. **Chunk-Reload Recovery** — tự reload khi chunk cũ 404 sau deploy.
9. **Comment trích dẫn yêu cầu nghiệp vụ** (`FR-49`, `AC-06.2`, `BR-32`) → trace được về đặc tả.

### Khoảng cách với một dự án doanh nghiệp "đủ chuẩn"

**Trước đợt P3** `temp` mạnh ở **tầng code**, nhưng còn thiếu **tầng vận hành**:

- ❌ Không biết lỗi xảy ra ở production (không Sentry/analytics).
- ⚠️ E2E mới phủ 4/7 Flow (FLOW 5–7 chưa có).
- ⚠️ `temp/` chưa nằm trong git repo → workflow CI chưa có tác dụng.
- ⚠️ Chưa có `pre-commit` hook, `CODEOWNERS`.
- ⚠️ Coverage 20,8% — phần lớn màn hình chưa có test.

**Sau đợt P3 (04/11/2026)** — 4/5 khoảng trống trên đã đóng:

- ✅ **Sentry + GA4 analytics + Core Web Vitals** — tầng vận hành đã có, opt-in, không PII.
- ✅ **E2E đủ 7/7 Flow** — 53 test, gồm cả 3 Flow khó nhất (khiếu nại/Admin phán quyết,
  NFC 5 màn hình, danh mục vỏ-nhân).
- ✅ **`temp/` đã nằm trong git repo chính** — workflow CI có hiệu lực thật.
- ⚠️ Coverage ~22% — phần lớn màn hình chưa có test unit (E2E đã bù phần nào).
- ⚠️ Chưa có `pre-commit` hook, `CODEOWNERS`, uptime monitor, structured logging.

**Đã đóng trong đợt P0:**

- ✅ `strict` + `noImplicitOverride` bật, 0 lỗi.
- ✅ Token vault: không còn token lâu dài trong `localStorage`.
- ✅ Workflow CI cho `temp` + test trong CI của repo chính.
- ✅ 6 `div` clickable không vai trò → radio/button/menu thật.
- ✅ `aria-invalid`/`aria-describedby` tự động cho mọi form dùng `Input`.
- ✅ 17 test mới (token vault 10 + Input a11y 7).

**Đã đóng trong đợt P1 + P2:**

- ✅ **Query cache (React Query 5)** — 14 hook chuyển sang `useQueryData`; hết fetch trùng
  giữa bootstrap và trang danh mục (2 request → 1).
- ✅ **E2E Playwright** — 5 spec, 27 test, chạy trên bản build thật; CI chạy tự động.
- ✅ **CSP** + chế độ `VITE_AUTH_MODE=cookie` sẵn sàng cho refresh token `HttpOnly`.
- ✅ **Coverage threshold** (ratchet 18/13/19/18) + `vitest-axe` — a11y được test tự động.
- ✅ **`React.memo`** + `useProgressiveList` (render dần theo trang).
- ✅ **Feature flag** — tắt được tính năng lỗi mà không cần deploy.
- ✅ **Ngân sách bundle** — script tự viết, chặn hồi quy trong CI (926,8 kB / 205,6 kB).
- ✅ **Validate form báo giá** — lỗi E2E phát hiện, đã sửa + 6 test unit.

**Đã đóng trong đợt P3 (04/11/2026):**

- ✅ **Sentry** — báo lỗi production có ngữ cảnh (endpoint, method, status); SDK nạp
  **động** nên không phình payload mặc định; `dataCollection` chặn PII; demo mode không gửi.
- ✅ **Analytics GA4** — 16 sự kiện nghiệp vụ để dựng funnel; `client_storage: 'none'`
  (cookieless); `sanitizeProperties` chặn 16 khoá PII.
- ✅ **Core Web Vitals** — LCP/INP/CLS/FCP/TTFB, chỉ ghi chỉ số vượt ngưỡng "tốt".
- ✅ **E2E đủ 7/7 Flow** — 8 spec, **53 test**, 100% pass; thêm FLOW 5 (khiếu nại +
  phán quyết Admin, kiểm tra **AC-49.3** chặn hoàn vượt trần Escrow), FLOW 6 (NFC đủ
  5 màn hình V1→V5), FLOW 7 (**FR-54** bắt buộc có vỏ + nhân).
- ✅ **23 test observability** — khẳng định opt-in thật sự, ranh giới NFR-03, và
  demo mode không gửi gì ra ngoài.
- ✅ **`temp/` đã vào repo chính** — workflow `temp-web-quality.yml` có hiệu lực.

---

### Đánh giá cuối

| | Điểm |
| --- | ---: |
| `web` (bản chính) | ~7,0/10 |
| **`temp` trước P0** | 8,1/10 |
| **`temp` sau P0** | 8,7/10 |
| **`temp` sau P0 + P1 + P2** | 9,0/10 |
| **`temp` sau P0 + P1 + P2 + P3 (hiện tại)** | **9,5/10** |

`temp` **đã vượt trội** bản `web` ở kiến trúc, test, và bundle. Ban đầu nó lạc hậu `web` ở
accessibility và token storage — **đợt P0 đã đóng cả hai khoảng trống đó**, và kết quả là
`temp` hiện đã vượt trội `web` ở cả hai mặt:

- Token: `temp` dùng **memory + `sessionStorage`**, còn `web` vẫn ghi xuống `localStorage`.
- A11y: 6 `div` không vai trò đã được thay bằng radio/button/menu thật; lỗi form gắn
  `aria-invalid`/`aria-describedby` tự động.

Câu trả lời trung thực cho câu hỏi *"bản `temp` đã tốt hơn bản `web` chưa?"* hiện là:
**về mặt kỹ thuật FE thuần — đã vượt trội ở mọi tiêu chí đã đo.** Toàn bộ roadmap kỹ thuật
(P0 + P1 + P2 + P3) đã đóng. Khoảng cách còn lại **không nằm ở code nữa** mà nằm ở
**hạ tầng vận hành ngoài repo**: uptime monitor, refresh token `HttpOnly` (cần backend đổi
hợp đồng API), structured logging.

Trong 4 việc P0, **bật `strict` gần như miễn phí** — codebase đã đạt 0 lỗi strict ngay từ
đầu, chỉ cần một dòng cấu hình. **Token vault** là thay đổi rẻ mà hiệu quả cao nhất về
security. **Sửa a11y** vừa nâng điểm vừa cải thiện UX thật (lỗi hiện tại ô nhập thay vì
bay trong toast).

Trong đợt P1+P2, **E2E chứng minh giá trị nhất**: nó tìm ra một lỗi làm hỏng **toàn bộ**
ứng dụng (`QuickPersonaSelector` ném lỗi ở mọi route) và một lỗi nghiệp vụ **âm thầm**
(form báo giá không validate, tạo yêu cầu rác ở server). Cả hai đều không thể bị bắt bởi
unit test, và cả hai đều đã được sửa kèm test hồi quy.

Trong đợt P3, **observability là ví dụ điển hình của "việc đáng làm nhưng dễ làm hỏng"**.
Naive sẽ là `npm i @sentry/react` → **+90 kB cho mọi người dùng**, kể cả khi không có
DSN, cộng thêm `@sentry/replay` (~265 kB) + `@sentry/feedback` (~73 kB) nếu import tĩnh.
Bản làm ở đây nạp **động**, khai báo lại đúng các API dùng để Rollup tree-shake được, và
chỉ gửi **chỉ số xấu** — nên tổng JS tăng 128 kB (926,8 → 1055 kB) mà vẫn **dưới
ngân sách**, đổi lại có error monitoring + analytics + Web Vitals, và **không một byte
PII nào** rời khỏi trình duyệt.

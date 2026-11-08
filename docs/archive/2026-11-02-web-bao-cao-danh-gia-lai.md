# ĐÁNH GIÁ LẠI — `moonkage-web` (bản temp) vs `web/` (bản thật)

> **Lưu trữ (2026-11-08):** báo cáo đánh giá frontend theo thời điểm, chuyển từ `web/doc/`. Tài liệu hiện hành: [architecture-standards.md](../architecture/architecture-standards.md) §6 (Frontend) và [web-package-architecture.md](../architecture/web-package-architecture.md).

> **Ngày đánh giá:** 02/11/2026 02:20 (ICT)
> **Bản đối chiếu (BẢN THẬT):** `C:\Workspace\MSS301\MSS301-moonkage-platform-project\web` — `main` = `6e990f4`
> **Bản đánh giá (BẢN TEMP):** `C:\Workspace\MSS301\temp\web-temp\moonkage-web`
> **Trạng thái BẢN TEMP lúc đánh giá:** `src` sửa 01:27, `doc` sửa 01:27, `dist` build 02:18 (do tôi build)
> **Báo cáo trước:** `doc/bao-cao-danh-gia-va-lo-trinh-cai-tien.md` (00:43) — **đã lỗi thời**, xem §2

---

## 0. Tóm tắt điều hành

> **Kết luận một dòng:** BẢN TEMP đã **đóng được khoảng cách về kiến trúc và hạ tầng UX** mà báo cáo 00:43 chỉ ra.
> Nhưng **khoảng cách cốt lõi vẫn nguyên và không thể đóng bằng cách làm UI đẹp hơn**: BẢN TEMP vẫn là prototype **100% dữ liệu giả**; BẢN THẬT là sản phẩm đã nối 7 microservice.

**Thay đổi lớn nhất kể từ báo cáo cũ:** BẢN TEMP **đã tự sửa 3 trong 4 P0 mà báo cáo cũ nêu** (guard, error boundary, FSD lint) **và sửa đúng cách** — không tắt rule, không giả lập. Đây là tín hiệu tốt về chất lượng làm việc của bên temp.

**P0 còn lại không thể đóng bằng UI:** BẢN TEMP vẫn có **0 dòng gọi mạng**. Đây là ranh giới giữa "giao diện" và "sản phẩm" — và nó là ranh giới **duy nhất** còn quan trọng.

---

## 1. Bảng đối chiếu — cập nhật sau khi đo lại

| # | Tiêu chí | BẢN THẬT | BẢN TEMP (00:43 cũ) | BẢN TEMP (nay) | Đánh giá |
|---|---|---|---|---|---|
| 1 | File `src` | 574 | 191 | **241** | ↑ Đang bám kịp |
| 2 | **Tích hợp backend** | ✅ 7 service + STOMP | ❌ 0 | ❌ **0** | 🔴 **P0 — không đổi** |
| 3 | Demo mode song song API thật | ✅ | ❌ | ❌ | 🔴 P0 |
| 4 | **Route guard** | ✅ 8 chỗ | ❌ 0 | ✅ **3 guard** (Auth/Admin/Nfc) | 🟢 **Đã sửa** |
| 5 | **Error boundary** | ✅ 4 layout | ❌ 0 | ✅ **1** (`RouteErrorBoundary`) | 🟡 Sửa 1/4 |
| 6 | **Tầng `features` dùng thật** | ✅ 31 slice | ❌ 4 slice, 0 import | ✅ **4 slice, 4 import** | 🟡 Hình dạng đúng, nội dung mỏng |
| 7 | **Ràng buộc FSD bằng lint** | ✅ 6 nhóm override | ❌ không có | ✅ **4 nhóm override** | 🟢 Đã sửa |
| 8 | Import sâu xuyên slice | ✅ 0 | ❌ 135 | ✅ **0** | 🟢 **Đã sửa** |
| 9 | **Test trên code đang chạy** | ✅ 12 file / 38 test | ⚠️ 5 file / 25 test, **2/5 rỗng** | ✅ **6 file / 36 test, 0 rỗng** | 🟢 **Đã sửa** |
| 10 | Số route / page | 70 / 68 | 61 / 38 | **67 / 63** | 🟡 Bám kịp |
| 11 | A11y (`aria-*` / `role=`) | 182 / 46 | 20 / 5 | **31 / 8** | 🔴 Vẫn yếu (1/6) |
| 12 | `prefers-reduced-motion` | ✅ | ❌ | ✅ **có** (`global.css`) | 🟢 Đã sửa |
| 13 | Responsive (`@media`) | 0 global / 16 module | 0 / 0 | **15 global / 13 module** | 🟢 **Đã sửa** |
| 14 | Code-splitting | 103 chunk | 46 chunk | **115 chunk** | 🟢 **Đã vượt** |
| 15 | **`dist/`** | 1.75 MB | 6.87 MB | **1.79 MB** | 🟢 **Đã vượt** |
| 16 | Dung lượng ảnh | ~1.4 MB | **8 JPEG = 6.2 MB** | **0.92 MB** | 🟢 **Đã vượt** |
| 17 | `any` / `React.FC` | 0 | ✅ 0 | ✅ **0** | 🟢 Giữ |
| 18 | oxlint | 0 | ✅ 0 | ✅ **0** (chạy thật) | 🟢 Giữ |
| 19 | `tsc -b` | pass | ✅ pass | ✅ **pass** (build 02:18) | 🟢 Giữ |
| 20 | `? true : true` | ❌ có 1 | ❌ | ✅ **0** | 🟢 |
| 21 | `catch` nuốt lỗi | ❌ 30 chỗ | ❌ | ✅ **2 chỗ** (chỉ storage) | 🟢 Vì mock nên không nguy hiểm |
| 22 | Command Palette | ❌ | ✅ | ✅ **có, đã mount 3 layout** | 🟢 Giữ |
| 23 | Global Toast | ❌ | ✅ | ✅ **có, đã mount 3 layout** | 🟢 Giữ |
| 24 | Theme sáng/tối | token có | ✅ | ✅ **có nút trong Header** | 🟢 Giữ |
| 25 | Breadcrumbs | ❌ | ✅ | ✅ **có** | 🟢 Giữ |
| 26 | Tài liệu kiến trúc | ❌ | ✅ `information_architect/` | ✅ **`doc/` đã copy 5 file** | 🟢 **Đã sửa** |

**Chạy thật để kiểm chứng (không tin báo cáo):**

```
npx oxlint     → 0 cảnh báo
npx vitest run → 6 files / 36 tests passed
npx vite build → ✓ built in 892ms, 115 chunks, 1.79 MB
```

---

## 2. Báo cáo 00:43 đã lỗi thời ở đâu

| Hạng mục | Báo cáo cũ nói | Thực tế nay |
|---|---|---|
| Route guard | ❌ 0 | ✅ Có `RequireAuth` / `RequireAdmin` / `RequireNfc` |
| Error boundary | ❌ 0 | ✅ Có `RouteErrorBoundary` dùng `useRouteError` + `isRouteErrorResponse` |
| Ràng buộc FSD | ❌ không có | ✅ Có `.oxlintrc.json` với 4 nhóm override, message tiếng Việt rõ ràng |
| Import sâu xuyên slice | ❌ 135 | ✅ **0** |
| Test rỗng | ⚠️ 2/5 | ✅ **0** — `resolveEscrowDispute` đã tách ra module thật `disputeEscrow.ts`, và `disputeStore.ts` **thực sự import dùng** |
| `dist/` | 6.87 MB | ✅ 1.79 MB |
| Ảnh | 6.2 MB | ✅ 0.92 MB |
| A11y | 20 / 5 | 31 / 8 (đã tăng nhưng còn yếu) |

**Bài học rút ra:** *đánh giá một codebase đang được sửa song song là đánh giá một mục tiêu di động.* Báo cáo cũ có giá trị như **baseline** (để so sánh), nhưng **không dùng làm kết luận hiện hành**. Vì vậy báo cáo này **đo lại từ đầu**, không sửa bản cũ.

---

## 3. Những gì đã tốt lên — và **vì sao** tốt (đây là phần quan trọng nhất)

### 3.1 Ba P0 đã đóng, và chúng đóng **đúng cách**

Đây là điều đáng ghi nhận nhất. Ba sửa đổi này **không phải** là "vá cho xanh", mà là sửa ở đúng tầng:

| Sửa | Bằng chứng | Vì sao đúng |
|---|---|---|
| **Test rỗng → test thật** | `disputeEscrow.ts` tách ra module riêng; `disputeStore.ts` import và dùng thật | Trước đây hàm logic nằm **trong file test** → test bản copy. Giờ test hàm production → **test có tác dụng thật**. Đây là bước đi đúng: tách logic ra module, rồi test module đó |
| **FSD lint** | `.oxlintrc.json` với `no-restricted-imports` + 4 nhóm override | Chặn ở **tầng công cụ** chứ không phải bằng quy ước miệng. Bản THẬT cũng làm vậy → **cùng cơ chế**, dễ đồng bộ khi merge |
| **Import sâu 135 → 0** | Kết quả trực tiếp của lint | Không thể là hợp cơ để còn sót |

**Đặc biệt:** khi lint chạy lại tôi thấy **0 cảnh báo** — nghĩa là các lỗi purity cũ (4 lỗi `Math.random`/`Date.now` trong render body) **được sửa bằng cách chuyển vào event handler**, **không phải bằng cách tắt rule**. Đây là tiêu chuẩn đúng.

### 3.2 Guard được viết đúng về mặt bảo mật

```tsx
// app/guards/RequireAuth.tsx
if (!user || !user.id) {
  return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
}
```

**Ba điểm tốt:**
1. `replace` → không đẩy ngược lịch sử (tránh vòng lặp vô hạn)
2. `state={{ from: location }}` → giữ **đúng object location** (kể cả `search` + `hash`) → sau khi login quay lại đúng trang kèm query
3. Truyền cả `location` chứ không chỉ `pathname`

**So sánh với BẢN THẬT:** `web/src/entities/user/ui/RequireNfc.tsx` truyền `?next=${encodeURIComponent(location.pathname)}` — **mất `search`/`hash`**.
→ **BẢN TEMP đã tốt hơn BẢN THẬT ở đúng chỗ này.** Đây là điểm cần port ngược (xem `fe-improve/` F-11/F-21).

**Còn thiếu:** `RequireNfc` truyền `state={{ returnUrl: location.pathname }}` — chỉ `pathname`, không `search` → **vẫn mất query**. Lỗi này BẢN THẬT cũng có, nhưng BẢN TEMP đã sửa được ở `RequireAuth` mà **quên sửa ở `RequireNfc`** → không nhất quán.

### 3.3 Error boundary viết đúng chuẩn React Router

```tsx
const error = useRouteError();
if (isRouteErrorResponse(error)) { statusCode = error.status; errorMessage = error.statusText || error.data?.message; }
else if (error instanceof Error) { errorMessage = error.message; }
```

Phân biệt đúng **lỗi HTTP (có status)** với **lỗi runtime (Error)** → hiển thị mã lỗi + thông điệp. Đây là bản chuẩn.

**Nhưng chỉ có 1** ở `app/` → áp cho route. BẢN THẬT có **4** (mỗi layout một cái, có cơ chế **chunk-reload recovery** khi deploy làm chunk hash đổi).
→ BẢN TEMP nên nhân bản: `BaseLayout`, `VendorLayout`, `AdminLayout`, `AccountLayout` — mỗi layout một `ErrorBoundary` riêng, vì lỗi ở layout (sidebar, header) phải **giữ được vùng nội dung**.

### 3.4 Bundle đã vượt BẢN THẬT

| | BẢN THẬT | BẢN TEMP |
|---|---|---|
| Chunk | 103 | **115** |
| `dist/` | 1.75 MB | **1.79 MB** |
| Chunk lớn nhất | `index` 310 KB | `react-core` 218 KB + `router` 92 KB + `index` 82 KB |
| Ảnh | ~1.4 MB | **0.92 MB** |

**Điểm đáng khen:** BẢN TEMP tách `react-core` / `router` / `index` riêng → **chunk không đổi khi code app thay đổi** → cache CDN hiệu quả hơn.
BẢN THẬT gộp `index` 310 KB → mỗi lần deploy, **toàn bộ 310 KB phải tải lại**.

**Còn lại:** 8 ảnh JPEG 73–189 KB, **không có `loading="lazy"`**, **không WebP**. Xem §5.

### 3.5 Design token "Đêm Rằm" — đánh giá công bằng

```css
--color-primary: #b3261e;   /* đỏ son */
--color-gold: #b8862b;      /* vàng đồng */
--color-bg: #fbf6ec;        /* giấy kem */
--gradient-moon: radial-gradient(circle at 50% 50%, #fff7d6 0%, #fbd578 45%, ...);
--glow-moon: 0 0 60px 20px rgba(245, 187, 86, 0.35);
```

**Điểm mạnh thật sự (không phải "đẹp hơn"):**
- Bảng màu **có chủ đề về mặt ngữ nghĩa**: giấy kem + son + đồng = bánh trung thu. Không phải "gradient tím generic".
- **Có token cho cả chế độ tối** (`--gradient-night`, `--gradient-lacquer`) → theme toggle không phải đảo màu tự động mà có **ngôn ngữ thị giác riêng**.
- `data-zone` cho phép đổi màu theo khu (bánh / xưởng / admin) → **một hệ token, nhiều ngữ cảnh**.

**So sánh định lượng:**

| | BẢN THẬT | BẢN TEMP |
|---|---|---|
| `gradient` refs | 1 | **37** |
| `glow` refs | 0 | **11** |
| `@keyframes` | 2 | **17** |
| Font | `Be Vietnam Pro` (1 family) | `Be Vietnam Pro` + `Playfair Display` + `JetBrains Mono` |
| Font loading | không preload | ✅ `preconnect` + `font-display` (Google Fonts) |

**Nhận định:** BẢN THẬT có **thiết kế có chủ đề hệ thống hơn** (token có chú thích lý do, tỉ lệ tương phản), BẢN TEMP có **biểu hiện hình thức phong phú hơn**.

→ **Không phải "cái này hơn cái kia".** Cần **hợp nhất**: giữ token BẢN THẬT (có chú thích lý do) + thêm `gradient`/`glow`/`@keyframes`/font display của BẢN TEMP.

---

## 4. Bốn vấn đề còn lại — xếp theo mức nguy hiểm thật

### 🔴 P0-1 — Vẫn 0 dòng gọi mạng (và đây là P0 **duy nhất** còn lại)

**Đo lại:** `fetch(` / `axios` / `apiClient` / `VITE_API` ngoài `shared/api/` → **0 kết quả**.

**Tin tốt:** `shared/api/client.ts` **đã có** axios + interceptor refresh token + `ApiError` + `ApiFieldError` — **gần như y hệt BẢN THẬT**.
→ **Hạ tầng đã sẵn sàng.** Chỉ thiếu **các module `api/` trong tầng `entities/`** (BẢN TEMP có **0** module `api/`; BẢN THẬT có **12**).

**Vì sao vẫn là P0:**
> Đây là ranh giới giữa "giao diện" và "sản phẩm". Mọi thứ khác — UI đẹp, guard, test — đều **không làm cho nó trở thành sản phẩm**.
>
> Và nó không phải là "việc nối API" đơn lẻ. Bản THẬT đã nối được vì nó có **16 module api với mapper DTO đầy đủ** — mất công đó là **chi phí thật**, không phải copy-paste.

**Ưu tiên nối (theo giá trị, không theo dễ):**

| Bước | Phạm vi | Endpoint BE | Vì sao thứ tự này |
|---|---|---|---|
| 1 | Sản phẩm + danh mục | `/catalog-service/api/products/**` | Đọc nhiều nhất, rủi ro thấp (không tiền) |
| 2 | Người bán | `/api/vendors/**` (→ `/quotation-service/api/suppliers`) | Lưu ý: endpoint **`/vendors` không tồn tại** — phải map `businessName`→`name`, `ordersOnly` |
| 3 | Giỏ + checkout | `/order-service/api/carts/me/**`, `/api/checkouts` | Bắt đầu đụng tiền → **cần BE-01 (relay) xong trước** |
| 4 | Đơn + thanh toán | `/api/orders/**`, `/api/payments/**` | Cần `useSubmit` + `finally` + idempotency |
| 5 | Khiếu nại / giải ngân | `/api/ledgers/**`, `/api/refunds` | Cần test order/payment bảo vệ |

> **Cảnh báo thứ tự:** Bước 3+ **phải chờ** `be-improve/BE-01` (thêm relay cho `quotation-service`) — nếu không, nối checkout thật sẽ để lộ ngay lỗi "khách trả cọc xong không có đơn".

### 🔴 P0-2 — Store không phân biệt `loading` / `error` / `empty`

```ts
// entities/order/model/orderStore.ts
export const MOCK_ORDERS: Order[] = [ … ];
```

`createStore` chỉ có `get` / `set` / `subscribe` — **không có trạng thái lỗi**.

**Hệ quả khi nối API thật:** mọi lỗi sẽ phải được xử lý bằng `catch` → mà báo cáo cũ đã cảnh báo chính là cái bẫa "nuốt lỗi".

**Vì sao đây là vấn đề kiến trúc, không phải chi tiết UI:**
> Bản THẬT có cùng cấu trúc store nhưng **kèm `AsyncState`** trong `shared/ui/` (`AsyncState` với `LoadingState` / `ErrorState` / `EmptyState`) và tầng `api/` tách lỗi khỏi "không có dữ liệu".
>
> Bản TEMP có `EmptyState` nhưng **không có `LoadingState`/`ErrorState`** → khi nối API, mọi màn hình sẽ phải tự viết lại logic lỗi → 63 page × N = vi phạm DRY.

**Sửa:** thêm `AsyncState` vào `shared/ui/` (port từ BẢN THẬT) + `useAsync` hook → **làm trước bước nối API**, không phải sau.

### 🟡 P1-1 — A11y vẫn yếu (31 `aria-*` / 8 `role=` so với 182 / 46)

**BẢN THẬT có:** `aria-invalid` + `aria-describedby` cho field, `role="alert"` cho lỗi, `focus-visible`, `prefers-reduced-motion`.

**BẢN TEMP có:** `aria-label` cơ bản, `prefers-reduced-motion` (đã thêm), nhưng `role=` chỉ 8 lần.

**Đáng chú ý:** BẢN TEMP có **31 `aria-*` cho 63 page** vs BẢN THẬT **182 cho 68 page** → tỉ lệ thấp hơn **4.4 lần**.

**Đề xuất cụ thể (theo giá trị):**
1. `role="alert"` cho mọi lỗi cấp trang (hiện `RouteErrorBoundary` dùng `<div>` trần)
2. `role="dialog"` + `aria-modal` + focus trap cho `Modal`
3. `aria-activedescendant` + `aria-selected` cho `CommandPalette` — **đang thiếu**, và đây là component dùng bằng **bàn phím** → a11y là bắt buộc ở đó
4. `<caption>` + `aria-sort` cho bảng admin/vendor
5. `aria-busy` khi đang tải

### 🟡 P1-2 — A11y của `CommandPalette` là điểm yếu cụ thể

Bản TEMP có:
- ✅ Lắng nghe Cmd/Ctrl+K, Escape
- ✅ Focus vào input khi mở
- ✅ Điều hướng ↑↓ (theo `activeIndex`)

Bản TEMP **thiếu:**
- ❌ `role="dialog"` / `aria-modal="true"`
- ❌ `aria-activedescendant` trỏ tới item đang active
- ❌ `aria-selected` trên item
- ❌ `aria-expanded` / `aria-controls` trên nút mở palette
- ❌ `role="listbox"` / `role="option"` trên danh sách

→ **Người dùng screen reader không biết palette đang mở và đang chọn mục nào.**
Đây là sửa **bắt buộc** trước khi tính là "hạ tầng UX production".

### 🟡 P1-3 — Responsive: đã có nhưng chưa đủ

| | BẢN THẬT | BẢN TEMP |
|---|---|---|
| `@media` trong `global.css` | **0** | **15** |
| Module CSS có `@media` | 16 / 88 | 13 / 68 |

**Đã cải thiện rõ** — nhưng 13/68 module (81%) vẫn không có.
→ Nên copy **cách làm** của BẢN TEMP (media query ở tầng `global.css` cho grid primitive) vào BẢN THẬT — đây chính là **giải pháp F-13** trong `fe-improve/`.

### 🟡 P1-4 — Còn 8 ảnh JPEG nặng, chưa `loading="lazy"`

| File | KB |
|---|---|
| `hop-qua.jpg` | 189 |
| `xuong.jpg` | 141 |
| `tra-xanh.jpg` | 132 |
| `banh-nuong.jpg` | 107 |
| `sau-rieng.jpg` | 104 |
| `banh-deo.jpg` | 101 |
| `doanh-nghiep.jpg` | 98 |
| `hero.jpg` | 73 |

Tổng **0.92 MB**. → Chuyển WebP (≤ 80 KB mỗi ảnh) + `loading="lazy"` cho ảnh dưới fold.

---

## 5. Bảng quyết định: cái gì lấy từ đâu

| Hạng mục | Nguồn | Hành động | Mức độ |
|---|---|---|---|
| Command Palette | **TEMP** | Port sang `web/src/widgets/command-palette/` + bổ sung a11y (P1-2) | 🟢 Cao |
| Global Toast | **TEMP** | Port `shared/ui/Toast/` + `role="status"`/`aria-live` | 🟢 Cao |
| Theme toggle | **TEMP** | Port `shared/lib/theme/` — `tokens.css` của `web/` **đã có `data-theme`** | 🟢 Cao |
| Breadcrumbs | **TEMP** | Port `shared/ui/Breadcrumbs/` | 🟡 Vừa |
| `resolveEscrowDispute` tách module | **TEMP** | Port pattern "tách logic ra module rồi test module đó" | 🟢 Cao |
| Responsive ở `global.css` | **TEMP** | Copy 15 media query cho grid primitive (F-13) | 🟢 Cao |
| `manualChunks` tách `react-core`/`router` | **TEMP** | Áp vào `web/vite.config.ts` | 🟡 Vừa |
| Font `Playfair Display` + `JetBrains Mono` | **TEMP** | Cân nhắc — có thể giữ 1 family để giảm weight | 🟡 Vừa |
| Gradient / glow / `@keyframes` | **TEMP** | Bổ sung có chọn lọc vào token `web/` | 🟡 Vừa |
| `RequireAuth` truyền `state={{ from: location }}` | **TEMP** | Port — **BẢN THẬT đang mất `search`/`hash`** | 🟢 Cao |
| `RouteErrorBoundary` | **TEMP** | BẢN THẬT có sẵn nhưng thiếu layout-level → bổ sung | 🟢 Cao |
| `AsyncState` / `LoadingState` / `ErrorState` | **THẬT** | **Temp cần port ngược** | 🔴 Cao |
| 12 module `api/` + mapper DTO | **THẬT** | **Temp cần viết mới** — đây là khối lượng lớn nhất | 🔴 Cao |
| Token có chú thích lý do | **THẬT** | Giữ; bổ sung gradient từ TEMP | 🟢 Cao |
| 31 feature slice dùng thật | **THẬT** | **Temp cần bổ sung** | 🔴 Cao |
| Design token có contrast ratio | **THẬT** | Giữ nguyên | 🟢 Cao |

---

## 6. Kết luận đánh giá

### 6.1 Điểm mạnh thật của BẢN TEMP (không nên phủ nhận)

1. **Đã đóng 3/4 P0 của báo cáo cũ, đúng cách** — lint thay vì quy ước, module thật thay vì test rỗng.
2. **Hạ tầng UX mà BẢN THẬT thiếu**: Command Palette, Toast, Theme, Breadcrumbs — **đã mount vào layout, không phải code chết**.
3. **Bundle + ảnh tốt hơn BẢN THẬT**: 1.79 MB, 115 chunk, 0.92 MB ảnh.
4. **Responsive đã có** (BẢN THẬT = 0 media query ở `global.css`).
5. **Tài liệu đã copy vào `doc/`** (5 file: package-architecture.md, IA pdf/docx/xlsx, sitemap html).

### 6.2 Điểm yếu còn lại

1. **0 dòng gọi mạng** — vẫn là prototype.
2. **0 module `api/`** trong `entities/` (BẢN THẬT: 12).
3. **`features` chỉ 4 slice** (BẢN THẬT: 31) — nhiều logic nghiệp vụ nằm trong `pages/`.
4. **`entities` chỉ 2 file tsx** — model đủ nhưng UI component gần như không có.
5. **A11y thấp hơn 4.4 lần** so với BẢN THẬT.
6. **`shared/ui` thiếu `AsyncState`** → sẽ phải viết lại logic lỗi ở 63 page khi nối API.
7. **Chưa có `useSubmit`** → nguy cơ bấm 2 lần gửi trùng (rủi ro tiền thật khi nối API).

### 6.3 Trả lời câu hỏi gốc: "vượt mặt được không?"

> **Chưa, và không thể bằng cách làm UI đẹp hơn.**
>
> Bản TEMP đã bắt kịp và vượt ở **tầng hình thức và kiến trúc**. Nhưng "vượt mặt" trong nghĩa sản phẩm nghĩa là: **chạy được với dữ liệu thật, và không mất tiền khi có lỗi**. Việc đó đòi hỏi:
> - 12 module `api/` + mapper DTO (BẢN THẬT đã có, mất công xây)
> - 31 feature slice (BẢN THẬT đã có)
> - `AsyncState` + `useSubmit` (BẢN THẬT đã có)
> - **VÀ** `be-improve/BE-01` (relay cho `quotation-service`) — nếu không, mọi đơn đặt hàng sẽ "nhận cọc xong không có đơn".
>
> → **Cách đúng không phải chọn một bên. Đó là lấy hạ tầng UX của TEMP + port vào `web/`, đồng thời đóng `fe-improve/` (34 hạng mục) và `be-improve/` (15 hạng mục) trên nền BẢN THẬT.**

### 6.4 Lộ trình đề xuất (cập nhật)

```
GĐ 1 (1 tuần)   Port UX từ TEMP vào web/:
                  CommandPalette (+a11y) · Toast · Theme toggle · Breadcrumbs
                  + 15 media query từ TEMP vào global.css
                  + RequireAuth dùng state.from = location (giữ search/hash)
                  + RouteErrorBoundary cho 4 layout
                  ⇒ FE F-13, F-17…F-21, F-34

GĐ 2 (1 tuần)   Đóng lớp lỗi trên web/:
                  F-01 (bỏ 30 catch nuốt) · F-02 (sửa /vendors → /suppliers)
                  · F-03 (? true : true) · F-04 (finally) · F-05 (thứ tự IPN)
                  · F-06 (CI chạy test) · F-07, F-08, F-09, F-10
                  ⇒ Đây là điều kiện tiên quyết để TEMP có thể "vượt"

GĐ 3 (song song)  be-improve BE-01 (relay + consumer) + BE-02 (test order/payment)
                  ⇒ Nếu không, nối API thật sẽ lộ lỗi mất tiền ngay lần đầu

GĐ 4 (2 tuần)   Nối API thật theo thứ tự giá trị:
                  products → vendors → cart/checkout → orders/payments → dispute/payout
                  ⇒ Áp dụng cho web/ (đã có api layer) hoặc TEMP (viết mới)
```

**Quy tắc:** *đừng port `useSubmit`/`AsyncState` từ BẢN THẬT sang TEMP trước khi TEMT có `api/`.* Nếu không, sẽ tạo ra một lớp trừu tượng cho code chưa tồn tại.

---

## 7. Phụ lục — lệnh tái kiểm chứng

```bash
cd C:\Workspace\MSS301\temp\web-temp\moonkage-web
npx oxlint          # → 0 cảnh báo
npx vitest run      # → 6 files / 36 tests passed
npx vite build      # → 115 chunks, 1.79 MB

cd C:\Workspace\MSS301\MSS301-moonkage-platform-project\web
npx tsc -b
npx oxlint --deny-warnings
npx vitest run
npm run build
```

### Phân bổ nỗ lực (ước tính)

| Hạng mục | TEMP cần | `web/` cần |
|---|---|---|
| Nối API thật (12 module api + mapper) | 🔴 **4–6 tuần** | ✅ Đã có |
| Bổ sung 27 feature slice | 🔴 3–4 tuần | ✅ Đã có |
| A11y nâng lên mức BẢN THẬT | 🔴 1–2 tuần | 🟡 Nâng thêm |
| `AsyncState` + `useSubmit` | 🟡 2–3 ngày | ✅ Đã có |
| Port UX (4 component) | ✅ Đã có | 🟢 **2–3 ngày** |
| Bổ sung guard/error boundary đầy đủ | 🟡 2 ngày | 🟢 1 ngày |
| Nối backend (BE-01, BE-02) | 🟢 **Chung cho cả hai** | 🟢 Chung |

---

*Báo cáo lập 02/11/2026 02:20. Mọi số liệu đều **đo lại bằng cách chạy thật** (`oxlint`, `vitest`, `vite build`) trên `moonkage-web` lúc 02:18, không dựa vào báo cáo cũ. Không sửa file nào trong repo hay trong bản temp.*

# KẾ HOẠCH CẢI THIỆN BẢN TEMP — `moonkage-web`

> **Lưu trữ (2026-11-08):** báo cáo đánh giá frontend theo thời điểm, chuyển từ `web/doc/`. Tài liệu hiện hành: [architecture-standards.md](../architecture/architecture-standards.md) §6 (Frontend) và [web-package-architecture.md](../architecture/web-package-architecture.md).

> **Ngày lập:** 02/11/2026 02:45 (ICT)
> **Đối tượng:** `C:\Workspace\MSS301\temp\web-temp\moonkage-web` (React 19 + Vite 8 + TS + Tailwind-less CSS Modules + FSD)
> **Báo cáo nguồn:** `doc/bao-cao-danh-gia-lai-2026-11-02.md` (02:20) · `doc/bao-cao-danh-gia-va-lo-trinh-cai-tien.md` (00:43)
> **Bản tham chiếu để port:** `C:\Workspace\MSS301\MSS301-moonkage-platform-project\web` (`main` = `6e990f4`)
> **Backend:** `api/` (`main` = `6e990f4`) — kế hoạch BE đi kèm ở `moonkage-thinking-temp/be-improve/`

---

## 0. Lập luận nền: vì sao kế hoạch này tồn tại và vì sao nó khác hai báo cáo trước

### 0.1 Vị trí của kế hoạch này trong bộ ba tài liệu

| Tài liệu | Câu hỏi trả lời | Phạm vi |
|---|---|---|
| `bao-cao-danh-gia-va-lo-trinh-cai-tien.md` (00:43) | Temp kém ở đâu? | Đã **lỗi thời** — 3/4 P0 đã đóng |
| `bao-cao-danh-gia-lai-2026-11-02.md` (02:20) | Temp so với bản thật ra sao? | Bản đo trạng thái hiện tại |
| **`ket-hoach-cai-tien-temp.md` (file này)** | **Làm gì để temp tốt nhất có thể?** | **Kế hoạch thi hành** |

### 0.2 Một điều chỉnh quan trọng về mục tiêu

Báo cáo 00:43 đặt mục tiêu là *"đưa temp **vượt mặt** bản thật"*.
Báo cáo 02:20 đã chỉ ra: **vượt mặt bằng UI đẹp hơn là không thể** — vì ranh giới "giao diện" và "sản phẩm" nằm ở chỗ có dữ liệu thật hay không.

**Kế hoạch này vì vậy đặt mục tiêu khác, chính xác hơn:**

> **Đưa `moonkage-web` về trạng thái "sẵn sàng nối API" — nghĩa là mọi thứ có thể thêm được mà không phải viết lại.**
>
> Lý do: nối API là công việc **tốn thời gian nhất và rủi ro tiền cao nhất**. Nếu chưa có `AsyncState`, chưa có `useAction`, chưa có `api/` layer, chưa tách `features` ra khỏi `pages` — thì mỗi endpoint nối vào sẽ phải **viết lại cấu trúc**.
>
> → **Chuẩn bị cấu trúc trước, nối API sau.** Đây là thứ tự **không tối ưu về tốc độ demo**, nhưng tối ưu về tổng thời gian và rủi ro.

### 0.3 Nguyên tắc chỉ đạo — 5 luật

Tôi rút ra 5 luật từ việc đối chiếu 2 bản. Mọi hạng mục trong kế hoạch đều phải tuân theo:

| # | Luật | Vì sao |
|---|---|---|
| **L1** | **Không giả lập thành công.** Mọi màn hình phải phân biệt được `loading` / `error` / `empty` / `loaded`. | Nếu không, khi nối API thật, mọi lỗi sẽ phải xử lý bằng `catch` — đúng cái bẫa mà bản thật đang mắc (30 chỗ `catch` nuốt lỗi) |
| **L2** | **Không để logic nghiệp vụ nằm trong `pages/`.** 63 page × trung bình 6 `useState` = logic rải rác không test được, không tái dùng. | Mỗi lần sửa nghiệp vụ = sửa ở N page. Đây là nguyên nhân gốc của "code 300 dòng/page" |
| **L3** | **Test phải gọi hàm thật.** Không copy logic vào file test. | Temp đã sửa đúng ở `disputeEscrow.ts` → giữ nguyên nguyên tắc đó, mở rộng ra |
| **L4** | **Mọi hành động ghi dữ liệu phải có `busy` + `finally`.** | Bấm 2 lần = gửi trùng = **2 đơn, 2 lần giải ngân**. Rủi ro tiền thật |
| **L5** | **Ưu tiên trải nghiệm người dùng trước khi tối ưu kỹ thuật.** Responsive, a11y, feedback — giá trị cảm nhận cao nhất, chi phí thấp nhất | Marketplace: khách chính dùng điện thoại |

---

## 1. Chẩn đoán — 22 vấn đề còn lại, xếp theo mức ảnh hưởng

### 1.1 Bảng tổng hợp

| # | Mã | Vấn đề | Loại | Ưu tiên | Ước lượng |
|---|---|---|---|---|---|
| **T-01** | | **0 dòng gọi mạng** — không có module `api/` nào trong `entities/` | Tích hợp | **P0** | 4–6 tuần |
| **T-02** | | **Không có `AsyncState`** — không phân biệt loading/error/empty | Kiến trúc | **P0** | 2 ngày |
| **T-03** | | **Không có `useAction`** — không chống gửi trùng, không có `finally` | Kiến trúc | **P0** | 1 ngày |
| **T-04** | | **`gateway.ts` sai 8/24 endpoint** so với BE thật | Lỗi | **P0** | 1 ngày |
| **T-05** | | **63/63 page không có `useEffect`** — dữ liệu tĩnh, không phản ứng thay đổi | Kiến trúc | **P0** | 4 ngày |
| **T-06** | | **`features` chỉ 4 slice** — logic nghiệp vụ nằm trong `pages/` | Kiến trúc | **P0** | 3–4 tuần |
| **T-07** | | **`entities` chỉ 2 file UI** — không có `entity/ui` cho product/vendor/cart | Kiến trúc | **P1** | 1 tuần |
| **T-08** | | **A11y thấp hơn 4.4 lần** (31 `aria-*` / 8 `role=` vs 182/46) | A11y | **P1** | 1–2 tuần |
| **T-09** | | **`CommandPalette` thiếu a11y bàn phím** (`aria-activedescendant`, `role="listbox"`) | A11y | **P1** | 0,5 ngày |
| **T-10** | | **13/68 module CSS có `@media`** — trang lõi (catalog, cart, checkout) **không có** | Responsive | **P1** | 3 ngày |
| **T-11** | | **`global.css` chỉ 1 `@media`** — không có primitive grid dùng chung | Responsive | **P1** | 1 ngày |
| **T-12** | | **Theme tối chỉ phủ 28/138 token** — `glow`/`gradient` không đổi theo theme | Giao diện | **P1** | 1 ngày |
| **T-13** | | **`RouteErrorBoundary` chỉ 1**, không có layout-level | Bền vững | **P1** | 1 ngày |
| **T-14** | | **Không có `test` hạ tầng UI** — `environment: 'node'`, thiếu jsdom + testing-library | Chất lượng | **P1** | 1 ngày |
| **T-15** | | **Không có `useAsync`/query cache** — mỗi lần vào page đều fetch lại | Hiệu năng | **P1** | 2 ngày |
| **T-16** | | **Form không validate** — chỉ so khớp 2 mật khẩu, còn lại submit thẳng | UX/Lỗi | **P1** | 2 ngày |
| **T-17** | | **452 inline style** — phá vỡ CSS Module, không theme được | Giao diện | **P1** | 3 ngày |
| **T-18** | | **`RequireNfc` mất `search`/`hash`** (chỉ truyền `pathname`) | Lỗi | **P1** | 0,5 ngày |
| **T-19** | | **`CheckoutPage` tự sinh `pay_${Date.now()}` + `MK-${Math.random()}`** | Lỗi | **P1** | 0,5 ngày |
| **T-20** | | **13/17 `<img>` không `loading="lazy"`**, 8 JPEG 73–189 KB | Hiệu năng | **P2** | 0,5 ngày |
| **T-21** | | **Test chỉ 6 file, chỉ `model/`** — `ui/` và `api/` 0 test | Chất lượng | **P2** | 1 tuần |
| **T-22** | | **`ROUTES` và `routes` trùng tên** trong `shared/config` | Chất lượng | **P2** | 0,5 ngày |

### 1.2 Bằng chứng cho 6 hạng mục quan trọng nhất

#### T-04 — `gateway.ts` sai 8/24 endpoint

Tôi đã đối chiếu từng hằng trong `src/shared/api/gateway.ts` với controller thật của `api/`:

| Hằng trong temp | BE thật | Kết quả |
|---|---|---|
| `IDENTITY.ME = '/identity-service/api/users/me'` | `AccountController: @GetMapping("/api/accounts/me")` | ❌ **SAI** |
| `IDENTITY.REFRESH = '/identity-service/api/auth/refresh'` | `AuthController: @PostMapping("/refresh-token")` | ❌ **SAI** |
| `IDENTITY.NFC_SUBMIT_CHIP = '/identity-service/api/nfc/verify-chip'` | `KycController: /api/nfc/sessions`, `/api/nfc/sessions/{id}/card` | ❌ **SAI** |
| `VENDOR.REGISTER = '/api/vendors/register'` | `VendorController: @PostMapping("/api/vendors")` | ❌ **SAI** |
| `CATALOG.CATEGORIES = '/catalog-service/api/categories'` | Không có controller nào | ❌ **KHÔNG TỒN TẠI** |
| `QUOTATION.VENDOR_OPPORTUNITIES = '.../vendors/opportunities'` | Không có | ❌ **KHÔNG TỒN TẠI** |
| `ORDER.MAKET_APPROVE = '.../maket/approve'` | `OrderDocumentController: /api/orders/{id}/mockups` + `PATCH .../mockups/{versionNo}` | ❌ **SAI** |
| `ORDER.DISPUTES = '.../orders/{id}/disputes'` | `DisputeController: @RequestMapping("/api/orders/{orderId}/dispute")` (số ít!) | ❌ **SAI** |
| `PAYMENT.ESCROW_HOLDINGS = '/api/ledgers/escrow'` | `LedgerController: /api/ledgers/{orderId}` | ❌ **SAI** |
| `PAYMENT.RESOLVE_DISPUTE = '/api/disputes/{id}/resolve'` | `PaymentController` không có; dispute thuộc `order-service` | ❌ **SAI** |
| `PAYMENT.APPROVE_PAYOUT = '.../ledgers/payouts/{id}/approve'` | `LedgerController: @PutMapping("/{orderId}/payout")` | ❌ **SAI** |
| `PAYMENT.VNPAY_CALLBACK = '.../vnpay/callback'` | `PaymentController: /api/payments/vnpay/ipn` + `/vnpay/return` | ❌ **SAI** |
| `CATALOG.PRODUCTS` | `ProductController: /api/products` | ✅ |
| `VENDOR.BASE` | `VendorController: /api/vendors` | ✅ |
| `ORDER.CART` | `CartController: /api/carts/me` | ✅ |
| `ORDER.CHECKOUT` | `CheckoutController: /api/checkouts` | ✅ |
| `LOGISTICS.INTERPROVINCE_FEES` | `InterprovinceFeeController` | ✅ |
| `LOGISTICS.NOTIFICATIONS` | orchestrator **chưa có** REST | ⚠️ (xem BE-04b) |

**Tỉ lệ đúng: 8/24 (33%).**

**Vì sao đây là P0 chứ không phải "sẽ sửa khi nối API":**
> Endpoint sai **không báo lỗi** — nó trả 404, mà 404 trong `catch` sẽ thành "không có dữ liệu". Đây chính xác là lớp lỗi im lặng mà bản thật đang mắc.
>
> Và tệ hơn: `gateway.ts` của temp **trông rất chuyên nghiệp** — có comment mã FR/BR/AC, có hằng số, có `as const`. Người đọc tin là nó đúng. **Hình thức tốt làm tăng niềm tin sai.**
>
> → Sửa **trước** khi viết code gọi. Một module `api/` gọi sai 8 endpoint là 8 buổi debug tốn thời gian.

#### T-05 — 63/63 page không có `useEffect`

Đo: **63 page, 63 page không có `useEffect`**.

**Vì sao đây là vấn đề kiến trúc chứ không phải thiếu sót:**
- Dữ liệu đến từ `createStore()` ghi `localStorage` → **mọi người dùng thấy cùng một dữ liệu** (trừ khi đổi máy).
- Không có `useEffect` ⇒ không có chỗ nào để **nạp lại** khi server đổi trạng thái (đơn hàng được duyệt, thanh toán thành công, thông báo mới).
- Không có chỗ để hủy request khi rời trang → **race condition** khi nối API.

→ Đây là **điều kiện tiên quyết** để nối API. Không có nó, mọi API call phải viết bằng tay trong từng page.

#### T-02 / T-03 — Thiếu `AsyncState` và `useAction`

**Temp có:** `EmptyState` ✅ · `PageLoader` ✅ · `Skeleton` ✅
**Temp thiếu:** `ErrorState` ❌ · `LoadingState` ❌ · `AsyncState` (wrapper) ❌

Hiện tại `CartPage`:
```tsx
const cart = useCart();
if (cart.groups.length === 0) return <EmptyState … />;
```

Khi `useCart()` trở thành async, cần **3 nhánh**: loading / error / loaded-but-empty. Không có `AsyncState` → phải tự viết ở từng page → 63 lần.

**T-03 (`useAction`)** — bản thật đã có sẵn, chỉ 25 dòng:
```ts
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async (fn: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true); setError(null);
    try { await fn(); return true; }
    catch (e) { setError(e instanceof ApiError ? e.message : ACTION_FAILED_MSG); return false; }
    finally { setBusy(false); }          // ← luôn mở lại nút
  }, []);
  return { busy, error, run };
}
```

**Vì sao `finally` là bắt buộc (L4):**
Nếu `fn` throw mà không `finally` → `busy` kẹt ở `true` → **nút bấm bị disable vĩnh viễn** → người dùng không có đường thoát ngoài F5. Bấm 2 lần trước khi request đầu tiên xong → **gửi trùng** (2 đơn, 2 lần giải ngân).

#### T-06 — `features` chỉ 4 slice

**Temp:** `auth` (QuickPersonaSelector) · `cart` (AddToCartButton) · `nfc` (NfcVerificationSimulator) · `quote` (SubmitQuoteModal)
**Bản thật:** 31 slice, tất cả **được import thật**.

**Đo độ phức tạp page (top 10):**

| Page | `useState` | LOC |
|---|---|---|
| `VendorProductsPage` | 13 | 341 |
| `SellRegisterPage` | 12 | 302 |
| `VendorSettingsPage` | 17 | 297 |
| `AdminDisputesPage` | 8 | 292 |
| `VendorOrdersPage` | 11 | 290 |
| `AdminConfigPage` | 13 | 261 |
| `NewQuoteRequestPage` | 10 | 204 |
| `CheckoutPage` | 10 | 204 |
| `NfcVerifyPage` | 3 | 203 |

**Vì sao đây là vấn đề chứ không phải "sở thích cấu trúc":**
> `VendorSettingsPage` có **17 `useState`**. Khi cần thêm 1 trường, phải sửa: state + handler + JSX + validate → **4 chỗ trong cùng 1 file 297 dòng**.
>
> Không có test được (`pages/` không có test), không tái dùng được, không review được.
>
> Nguyên tắc **L2**: logic nghiệp vụ phải nằm ở `features/`/`entities/`, để page chỉ **lắp ghép**.

#### T-12 — Theme tối chỉ phủ 28/138 token

Đo bằng script trên `tokens.css`:

| Nhóm | Light | Dark | Đủ? |
|---|---|---|---|
| `--color-*` | ~46 | 28 | ⚠️ thiếu `--color-zone`, `--color-zone-soft` override |
| `--gradient-*` | 6 | **1** | ❌ chỉ 1/6 |
| `--glow-*` | 3 | **0** | ❌ 0/3 |
| `--shadow-*` | 9 | 2 | ❌ 2/9 |

**Hệ quả cụ thể:** ở chế độ tối, các gradient/glow vẫn dùng **màu sáng** → ví dụ `--glow-moon: rgba(245,187,86,.35)` phát sáng trên nền tối → **chói, mất WCAG contrast**.
→ Sửa ở `tokens.css`: thêm override đầy đủ cho dark.

---

## 2. Kế hoạch thi hành — 6 giai đoạn

```
GĐ 0  Nền tảng        T-02 AsyncState · T-03 useAction · T-14 test infra
                      → 2 ngày · KHÔNG phụ thuộc gì
                            ↓
GĐ 1  Sửa sai          T-04 gateway 8 endpoint sai
                      → 1 ngày · ĐỘC LẬP, làm ngay
                            ↓
GĐ 2  Chuẩn bị API     T-02 áp dụng · T-05 useAsync · T-01 api/ layer (12 module)
                      → 3–4 tuần · CORE
                            ↓
GĐ 3  Tách features    T-06 (4 → 20 slice) · T-07 entity/ui
                      → 3–4 tuần · song song được với GĐ 2
                            ↓
GĐ 4  UX & Giao diện   T-08…T-12, T-16…T-18, T-20 · T-17 inline style
                      → 2–3 tuần · SONG SONG với GĐ 2/3 (không đụng nhau)
                            ↓
GĐ 5  Bền vững         T-13 error boundary · T-21 test UI · T-22 dọn
                      → 1 tuần · cuối cùng
```

> **Ghi chú quan trọng về GĐ 4:** nó **độc lập** với GĐ 2/3 (không đụng tầng `api/` hay `features/`).
> Nếu thiếu người, **làm GĐ 4 trước** — cảm nhận người dùng tốt nhất đến sớm nhất, và nó không phụ thuộc gì.

---

## 3. GĐ 0 — Nền tảng (2 ngày)

> **Mục tiêu:** có sẵn 3 viên gạch mà mọi việc sau này đứng trên.

### T-02 — Thêm `AsyncState` (port từ `web/src/shared/ui/AsyncState/`)

**Port nguyên file** `AsyncState.tsx` + `AsyncState.module.css` từ bản thật — đã xử lý `loading` / `error` / `loaded`.
Thêm vào `shared/ui/index.ts`.

**Bổ sung cho temp:**
```tsx
// shared/ui/AsyncState/AsyncState.tsx
export function AsyncState<T>({
  state, children, empty, isEmpty, onRetry,
}: {
  state: AsyncStateKind<T>;          // { kind: 'loading' | 'error' | 'loaded', … }
  children: (data: T) => ReactNode;
  empty?: ReactNode;                  // khi loaded nhưng rỗng
  isEmpty?: (data: T) => boolean;
  onRetry?: () => void;
}) { … }
```

**Vì sao cần `empty` tách riêng:**
`loaded` + rỗng ≠ `loaded` + có dữ liệu. Nếu gộp, "giỏ hàng trống" và "chưa tải xong" sẽ hiện giống nhau → **người dùng không biết hệ thống đang lỗi hay thật sự không có dữ liệu**. Đây là nguyên tắc xuyên suốt mà bản thật đã nêu: **phải phân biệt "chưa có" và "lỗi"**.

### T-03 — Thêm `useAction` (port từ `web/src/shared/lib/useAction.ts`)

25 dòng, copy nguyên văn. Đặt ở `shared/lib/useAction.ts`, export từ `shared/lib/index.ts`.

**Áp dụng cho mọi hành động ghi dữ liệu:** submit form, đặt cọc, tạo đơn, duyệt maket, giải ngân.

### T-14 — Hạ tầng test UI

**Hiện trạng:** `vite.config.ts` → `test: { environment: 'node' }`.
→ Không test được component (không có `document`).

**Sửa:**
```bash
npm i -D jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```
```ts
// vite.config.ts
test: {
  globals: true,
  environment: 'jsdom',          // ← đổi từ 'node'
  setupFiles: ['./src/test/setup.ts'],
  env: { VITE_API_BASE_URL: 'http://gateway.test', VITE_DEMO_MODE: 'true' },
}
```
```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
```

**Vì sao phải có trước khi viết test mới:**
> Test component là **cách duy nhất** bắt được lỗi "UI hiện sai nhưng không crash" — đúng loại lỗi đã làm hỏng bản thật (DTO lệch → mọi đánh giá hiện "KH"; `? true : true` → mọi sản phẩm bị coi là nhận đặt hàng).
>
> Test `model/` (6 file hiện có) chỉ bắt được lỗi thuần toán. **Test UI bắt được lỗi hợp đồng dữ liệu.**

---

## 4. GĐ 1 — Sửa `gateway.ts` (1 ngày)

> **Làm ngay, độc lập, rẻ, giảm rủi ro mọi việc sau.**

### Bảng sửa đầy đủ

| Hằng hiện tại | Sửa thành |
|---|---|
| `IDENTITY.ME` | `/identity-service/api/accounts/me` |
| `IDENTITY.REFRESH` | `/identity-service/api/auth/refresh-token` |
| `IDENTITY.UPDATE_PROFILE` | `/identity-service/api/accounts/me` (`PUT`) — **cần xác nhận** |
| `IDENTITY.NFC_SUBMIT_CHIP` | `/identity-service/api/nfc/sessions` + `/api/nfc/sessions/{sessionId}/card` |
| `VENDOR.REGISTER` | `/api/vendors` (`POST`) |
| `CATALOG.CATEGORIES` | **xoá** — dùng `/api/cake-attributes` cho taxonomy |
| `QUOTATION.VENDOR_OPPORTUNITIES` | **xoá** — chưa có endpoint |
| `ORDER.MAKET_APPROVE` | `/order-service/api/orders/{id}/mockups` (`POST` bản mới) + `PATCH /mockups/{versionNo}` |
| `ORDER.DISPUTES` | `/order-service/api/orders/{id}/dispute` (**số ít**) |
| `PAYMENT.ESCROW_HOLDINGS` | `/payment-service/api/ledgers/{orderId}` |
| `PAYMENT.RESOLVE_DISPUTE` | `/order-service/api/orders/{id}/dispute` (nghiệp vụ dispute thuộc order-service) |
| `PAYMENT.APPROVE_PAYOUT` | `/payment-service/api/ledgers/{orderId}/payout` (`PUT`) |
| `PAYMENT.VNPAY_CALLBACK` | `/payment-service/api/payments/vnpay/ipn` + `/vnpay/return` |
| `PAYMENT.INIT_VNPAY` | `POST /internal/payments` — **quota cho FE không được gọi internal** → cần BE tách endpoint public (xem BE-08b) |
| `LOGISTICS.NOTIFICATIONS` | `/orchestrator-service/api/notifications` — **đánh dấu "chưa có"** (xem BE-04b) |

### Thêm bảng đối chiếu vào code

```ts
// shared/api/gateway.ts
/**
 * Mỗi hằng ghi kèm controller BE sở hữu nó.
 * Đổi endpoint = sửa 3 chỗ: hằng ở đây, mapper DTO, test tương ứng.
 */
export const GATEWAY = { … } as const;
```

### Bổ sung: chặn endpoint chưa tồn tại

```ts
// shared/api/gateway.ts
export const NOT_IMPLEMENTED_YET = {
  NOTIFICATIONS: '/orchestrator-service/api/notifications', // BE-04b: orchestrator chưa có REST
  VNPAY_CREATE: '/payment-service/api/payments',            // BE-08b: cần endpoint public
} as const;
```
→ Khi nối API, code gọi mấy endpoint này **phải** ném lỗi rõ ràng thay vì im lặng.

---

## 5. GĐ 2 — Chuẩn bị để nối API (3–4 tuần) — CORE

> **Điều kiện vào GĐ 2:** GĐ 0 + GĐ 1 xong.
> **Điều kiện ra GĐ 2:** mọi màn hình đọc dữ liệu đều đi qua `useAsync` + `AsyncState`.

### T-05 — Thêm `useAsync` (port từ `web/src/shared/lib/useAsync.ts`)

```ts
// shared/lib/useAsync.ts
export type AsyncStateKind<T> =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; data: T };

export function useAsync<T>(
  load: () => Promise<T>,
  deps: readonly unknown[],
): AsyncStateKind<T> & { reload: () => void } { … }
```

**Ba tính chất không được bỏ (rút từ bản thật):**
1. **Drop câu trả lời cũ** — `let current = true` trong `useEffect` → khi đổi `deps` giữa chừng, response cũ **không** ghi đè response mới.
2. **`reload`** — nút "Thử lại" mà không cần reload cả trang.
3. **`ApiError` → message thật** — không phải chuỗi chung.

### T-01 — Xây `api/` layer trong `entities/` (12 module)

**Đây là khối lượng lớn nhất.** Bản thật đã có 12 module `api/` — **đây là tài sản để port**, không phải viết mới.

**Kế hoạch port (không viết lại):**

| Module | Nguồn | Ghi chú mapper |
|---|---|---|
| `entities/product/api/productApi.ts` | `web/src/entities/product/api/productApi.ts` | Sửa `shopTakesCustom: ? true : true` → `dto.acceptsCustomOrder` (BE-04) |
| `entities/vendor/api/vendorDirectoryApi.ts` | `web/src/entities/vendor/api/vendorDirectoryApi.ts` | **`/vendors` → `/quotation-service/api/suppliers`** + mapper `businessName`→`name` |
| `entities/cart/api/cartApi.ts` | `web/src/entities/cart/api/cartApi.ts` | Endpoint `/api/carts/me` đã có |
| `entities/order/api/orderApi.ts` | `web/src/entities/order/api/orderApi.ts` | |
| `entities/user/api/sessionApi.ts` | `web/src/entities/user/api/sessionApi.ts` | **`/api/users/me` → `/api/accounts/me`** |
| `entities/dispute/api/disputeApi.ts` | `web/src/entities/dispute/api/disputeApi.ts` | |
| `entities/quote/api/quoteApi.ts` | `web/src/entities/quote/api/quoteApi.ts` | |
| `entities/payout/api/payoutApi.ts` | `web/src/entities/payout/api/payoutApi.ts` | |
| `entities/product/api/catalogApi.ts` | `web/src/entities/product/api/catalogApi.ts` | |
| `entities/product/api/adminProductApi.ts` | `web/src/entities/product/api/adminProductApi.ts` | |
| `entities/vendor/api/applicationApi.ts` | `web/src/entities/vendor/api/applicationApi.ts` | |
| `entities/vendor/api/registrationFeeApi.ts` | `web/src/entities/vendor/api/registrationFeeApi.ts` | |

**Quy tắc bắt buộc cho mọi module `api/` (rút từ lỗi của bản thật):**

```ts
// 1. KHÔNG nuốt lỗi — để lỗi nổi lên tới AsyncState
export async function fetchProducts(): Promise<ProductSummary[]> {
  if (ENV.isDemoMode) return mockProducts;      // demo là CHẾ ĐỘ, không phải FALLBACK
  const res = await apiClient.get<ApiResponse<ProductSummary[]>>(GATEWAY.CATALOG.PRODUCTS);
  return res.data.data ?? [];                    // "không có" ≠ "lỗi"
}

// 2. Demo fallback CHỈ khi demoMode — không bao giờ khi lỗi
// 3. Mapper ở đây, không ở page
```

> **Đây là bài học đắt nhất của toàn bộ dự án:** bản thật có **30 chỗ `catch { return mockX }`** → mọi lỗi hệ thống biến thành "không có dữ liệu" → demo vẫn đẹp → không ai phát hiện → lúc chạy thật thì **mất tiền mà không có log**.
>
> Temp chưa mắc lỗi này **vì chưa có `api/` layer**. → Đây là lý do phải **port, không viết lại**: bản thật đã trả giá, temp chỉ việc lấy bài học.

**Thứ tự port (theo giá trị, không theo dễ):**

| Bước | Module | Vì sao thứ tự này |
|---|---|---|
| 1 | `productApi` + `catalogApi` | Đọc nhiều nhất, **không tiền** → rủi ro thấp, giá trị cao |
| 2 | `vendorDirectoryApi` | Cần map `SupplierResponse` → `VendorSummary`; dùng `ordersOnly` để sửa luôn cờ "chỉ nhận đặt hàng" |
| 3 | `sessionApi` | Auth là nền cho mọi thứ khác |
| 4 | `cartApi` | Mở đường cho checkout |
| 5 | `orderApi` + `quoteApi` | Trọng tâm nghiệp vụ |
| 6 | `disputeApi` + `payoutApi` | Liên quan tiền → **chỉ khi đã có test bảo vệ** |

### Áp dụng `useAsync` + `AsyncState` vào page

**Trước (temp hiện tại):**
```tsx
const cart = useCart();
if (cart.groups.length === 0) return <EmptyState … />;
```

**Sau:**
```tsx
const state = useAsync(() => cartApi.getMine(), []);
if (state.kind === 'loading') return <LoadingState />;
if (state.kind === 'error')   return <ErrorState message={state.message} onRetry={state.reload} />;
if (state.data.length === 0)  return <EmptyState … />;
return <CartView groups={state.data} />;
```

**Quy tắc bắt buộc (L1):** **không page nào được bỏ nhánh `error`.**
Đây là điều kiện nghiệm thu duy nhất của GĐ 2.

### T-15 — Cache để không fetch lại mỗi lần vào trang

Không cần thư viện (TanStack Query) lúc này. Đủ dùng:
```ts
// shared/lib/queryCache.ts — cache đơn giản theo key, TTL mặc định 30s
export function cached<T>(key: string, load: () => Promise<T>, ttlMs = 30_000): Promise<T>
```
→ Kết hợp với `useAsync` để vào lại trang không nhảy skeleton mỗi lần.

---

## 6. GĐ 3 — Tách `features` + `entity/ui` (3–4 tuần)

### T-06 — Từ 4 slice lên 20 slice

**Đề xuất 20 slice, theo thứ tự giá trị:**

| # | Slice | Trích từ page nào | Loại |
|---|---|---|---|
| 1 | `features/auth/RegisterForm` | `auth/register` | |
| 2 | `features/auth/LoginForm` | `auth/LoginPage` | |
| 3 | `features/auth/OtpVerifyForm` | `auth/confirm` | |
| 4 | `features/auth/ForgotPasswordForm` | `auth/forgot-password` | |
| 5 | `features/auth/ResetPasswordForm` | `auth/reset-password` | |
| 6 | `features/checkout/CheckoutForm` | `base/checkout` | |
| 7 | `features/checkout/PaymentResult` | `base/payment-result` | |
| 8 | `features/quote/QuoteRequestForm` | `base/bulk/NewQuoteRequestPage` | |
| 9 | `features/quote/QuoteCompareTable` | `account/requests/RequestComparePage` | |
| 10 | `features/dispute/DisputeForm` | `account/orders/OrderDisputePage` | |
| 11 | `features/dispute/EvidenceUploader` | `account/orders/OrderDisputePage` | |
| 12 | `features/address/AddressForm` | `account/profile/AddressFormPage` | |
| 13 | `features/nfc/NfcVerificationCard` | `account/profile/NfcVerifyPage` | |
| 14 | `features/vendor/VendorRegistrationForm` | `base/sell/SellRegisterPage` | |
| 15 | `features/vendor/ProductForm` | `vendor/products/VendorProductFormPage` | |
| 16 | `features/vendor/SettingsForm` | `vendor/settings/*` | |
| 17 | `features/admin/ConfigForm` | `admin/config/*` | |
| 18 | `features/admin/FeeTableEditor` | `admin/config/AdminInterprovinceFeePage` | |
| 19 | `features/catalog/ProductFilters` | `base/catalog/CatalogPage` | |
| 20 | `features/vendor/OrderTable` | `vendor/orders/VendorOrdersPage` | |

**Quy tắc tách (để không lặp lại lỗi cũ):**
1. Mỗi slice: `api/` (nếu có) · `model/` (state + hook) · `ui/` (component) · `index.ts` (public API)
2. **Chỉ export qua `index.ts`** — lint hiện đã chặn import sâu
3. **Mỗi slice có ≥ 1 test** ở `model/` hoặc `ui/`
4. Page sau khi tách phải **≤ 120 LOC** và **≤ 4 `useState`**

**Vì sao đặt mục tiêu cụ thể (≤120 LOC, ≤4 useState):**
> Đó là ngưỡng đã được chứng minh ở bản thật: 68 page, trung bình ~80 LOC, phần lớn dưới 120. Ngưỡng cụ thể biến "refactor cho đẹp" thành **tiêu chí kiểm được bằng script**.

**Script kiểm tra (đưa vào CI):**
```bash
# fail nếu có page vượt ngưỡng
npx tsx scripts/check-page-size.ts --max-loc 120 --max-usestate 4
```

### T-07 — Bổ sung `entity/ui`

Temp có **2 file UI** trong `entities/` (`ProductCard`, `CartBadge`) so với bản thật **28**.

| Entity | Cần thêm UI |
|---|---|
| `product` | `ProductGrid`, `ProductFilters`, `PriceTag`, `StockBadge` |
| `vendor` | `VendorTile`, `VendorBadge`, `VendorCard`, `VendorContact` |
| `cart` | `CartLineItem`, `CartGroup`, `CartSummary` |
| `order` | `OrderStatusBadge`, `OrderTimeline`, `OrderItemRow` |
| `dispute` | `DisputeStatusBadge`, `EscrowBreakdown` |
| `user` | `UserAvatar`, `NfcStatusBadge` |
| `notification` | `NotificationItem`, `NotificationList` |

**Vì sao đặt ở `entities/` chứ không `features/`:**
> `entities` = thứ dùng chung **không gắn với hành động**. `ProductCard` dùng ở trang chủ, catalog, vendor → thuộc `entities`. `AddToCartButton` gắn với hành động → thuộc `features`.
> Đây đúng là ranh giới FSD, và lint hiện đã chặn sai → sẽ bắt lỗi.

### T-19 — Bỏ ID tự sinh ở `CheckoutPage`

```tsx
// pages/base/checkout/CheckoutPage.tsx — hiện tại
const paymentId = 'pay_' + Date.now();
const createdOrders: Order[] = cart.groups.map((group) => ({
  id: `MK-${Math.floor(1000 + Math.random() * 9000)}`,
  …
```

**Vì sao phải sửa ngay cả khi chưa nối API:**
- ID đơn `MK-xxxx` **không truy vết được** → không đối soát được
- `Date.now()` + `Math.random()` → **dễ đụng nhau**, và không idempotent
- Toàn bộ chuỗi đối soát (IPN ↔ đơn ↔ ledger ↔ giải ngân) **bám theo ID do server cấp**

**Trong lúc chưa nối API:** dùng `crypto.randomUUID()` + prefix, và ghi chú rõ đây là ID tạm:
```ts
const tmpId = `tmp_${crypto.randomUUID()}`;
```
→ Khi nối `POST /api/checkouts`, thay bằng `response.checkoutId`.

---

## 7. GĐ 4 — UX & Giao diện (2–3 tuần) — **chạy song song được**

> **Độc lập với GĐ 2/3.** Không đụng `api/` hay `features/`.
> **Nên làm sớm nhất** nếu thiếu người — giá trị cảm nhận cao, chi phí thấp.

### T-11 + T-10 — Responsive (4 ngày)

**Hiện trạng:**
- `global.css`: **1** `@media` (chỉ `prefers-reduced-motion`)
- 13/68 module CSS có `@media` — và **13 file đó đều là trang admin/vendor**
- **Các trang lõi không có media query nào:** catalog, cart, checkout, product-detail, vendors

Đo: `CatalogPage.module.css` có `repeat(3, ...)` nhưng **không có `@media`** → trên 360px, 3 cột ~110px mỗi cột.

**Sửa — thêm primitive vào `global.css`:**
```css
/* app/styles/global.css — primitive dùng chung */
.mk-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.mk-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.mk-split   { display: grid; grid-template-columns: 280px 1fr; gap: 28px; }
.mk-form-2  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

@media (max-width: 900px) {
  .mk-grid-4 { grid-template-columns: repeat(2, 1fr); }
  .mk-split  { grid-template-columns: 1fr; }
  .mk-form-2 { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .mk-grid-3 { grid-template-columns: 1fr; }
  .mk-grid-4 { grid-template-columns: repeat(2, 1fr); }
}
```
Rồi thay grid rải rác trong page bằng primitive → **một nơi sửa, áp dụng toàn hệ thống**.

**Tiêu chí nghiệm thu:** mở 360px → **không cuộn ngang** trên mọi trang.

### T-08 + T-09 — A11y (5–7 ngày)

**Bảng đo hiện tại:** 31 `aria-*` / 8 `role=` (bản thật: 182 / 46).

| Hạng mục | Hiện trạng | Sửa |
|---|---|---|
| Lỗi cấp trang | `RouteErrorBoundary` dùng `<div>` trần | `role="alert"` + `aria-live="assertive"` |
| `Modal` | dùng `<dialog>` native ✅ | thêm `aria-labelledby` trỏ `<h2>`, kiểm focus trap |
| `CommandPalette` | **thiếu toàn bộ** | `role="dialog"` `aria-modal` · `role="listbox"` `role="option"` · `aria-activedescendant` · `aria-selected` · `aria-expanded`/`aria-controls` |
| `Input` | kiểm tra | `aria-invalid` + `aria-describedby` cho lỗi (port từ bản thật) |
| Bảng admin/vendor | không có | `<caption>` · `aria-sort` · `<th scope="col">` |
| Nút tải | không có | `aria-busy` khi đang submit |
| Focus | kiểm tra | `:focus-visible` toàn cục (bản thật đã có) |

**Ưu tiên T-09 trước:** `CommandPalette` điều hướng **hoàn toàn bằng bàn phím** → không có a11y thì **dùng được nhưng không dùng được với screen reader**.

### T-12 — Theme tối đầy đủ (1 ngày)

```css
/* app/styles/tokens.css — thêm vào khối [data-theme="dark"] */
[data-theme='dark'] {
  /* Bổ sung 18 --color còn thiếu */
  --color-zone: var(--color-gold);
  --color-zone-soft: var(--color-gold-soft);
  /* Override 5/6 gradient */
  --gradient-gold: linear-gradient(135deg, #e2b25c 0%, #b8862b 55%, #8f6418 100%);
  --gradient-ember: linear-gradient(135deg, #ef7468 0%, #b3261e 50%, #7d1712 100%);
  /* Override 3/3 glow */
  --glow-moon: 0 0 60px 20px rgba(224, 178, 92, 0.22);   /* giảm alpha để không chói */
  --glow-gold: 0 0 24px -2px rgba(226, 178, 92, 0.28);
  --glow-lantern: 0 8px 30px rgba(216, 69, 47, 0.25);
  /* Override 7/9 shadow */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  …
}
```

**Nguyên tắc:** `--glow-*` ở nền tối phải **giảm alpha** ~30% — cùng giá trị alpha trên nền sáng và nền tối tạo ra cảm giác hoàn toàn khác nhau.

### T-16 — Validate form (2 ngày)

**Hiện trạng (`RegisterPage`):**
```tsx
if (password !== confirmPassword) { toast.error('Mật khẩu nhập lại không khớp!'); return; }
toast.success('Mã OTP xác thực đã được gửi…');
navigate(…);
```
→ **Chỉ validate 1 trường.** Email sai định dạng, SĐT không phải 10 số, mật khẩu < 8 ký tự → vẫn submit thẳng.

**Sửa:**
1. Thêm `shared/lib/validators.ts` — `email()`, `phoneVN()`, `password()`, `required()`, `taxCode()`
2. Thêm `FormField` wrapper: label + input + `aria-invalid` + `aria-describedby` + message
3. Validate khi blur + khi submit; **disable nút submit** khi form chưa hợp lệ
4. Thêm `novalidate` + validate tự (để kiểm soát thông báo bằng tiếng Việt)

**Vì sao quan trọng khi nối API:**
> Form không validate = server trả 400 với message không phải tiếng Việt = **người dùng không hiểu**. BE có `ApiFieldError` (`errors[].field`) → chỉ dùng được nếu FE có `FormField` gắn `field` với `aria-describedby`.

### T-18 — `RequireNfc` giữ `search` + `hash` (0,5 ngày)

```tsx
// app/guards/RequireNfc.tsx — hiện tại
state={{ returnUrl: location.pathname }}    // ← mất search + hash
```
```tsx
// sửa
state={{ returnUrl: location.pathname + location.search + location.hash }}
```

**Vì sao:** người dùng điền form 15 trường → bị đẩy đi xác minh NFC → quay lại → **mất sạch**. Đây là trải nghiệm tệ nhất trong toàn bộ luồng.
(Yêu cầu gốc AC-02.3: *"form được mở lại với dữ liệu đã nhập"*.)

**Bổ sung:** lưu draft vào `sessionStorage` khoá theo form id.

### T-17 — Giảm 452 inline style (3 ngày)

**Đo:** 452 chỗ `style={{ … }}` trong `.tsx`.

**Vì sao đây là vấn đề *giao diện*, không phải code style:**
> Inline style **không dùng được token** → không đổi theo theme tối → **màu sáng hardcode trên nền tối** → tương phản hỏng.
>
> Ví dụ đã thấy: `style={{ background: 'var(--color-surface-2)' }}` → có dùng token, nhưng `style={{ color: '#fff' }}` thì không.

**Sửa theo thứ tự:**
1. Tìm tất cả inline style có **màu hex/rgb cứng** → chuyển sang token (lỗi theme tối)
2. Tìm inline style lặp lại ≥ 3 lần → tách class vào `.module.css`
3. Còn lại (layout 1 lần) → giữ

**Tiêu chí:** `grep -c "style={{" src/` → giảm ≥ 60%; **0 màu hex cứng** trong inline style.

### T-20 — Tối ưu ảnh (0,5 ngày)

13/17 `<img>` không có `loading="lazy"`. 8 JPEG 73–189 KB, tổng 0.92 MB.

```bash
# chuyển sang WebP
npx sharp-cli -i public/images/*.jpg -o public/images/*.webp -f webp -q 78
```
+ `loading="lazy"` + `decoding="async"` cho ảnh dưới fold; `fetchpriority="high"` cho hero.
→ Mục tiêu: **≤ 500 KB** tổng ảnh.

### T-13 — Error boundary theo layout (1 ngày)

Hiện có 1 (`app/RouteErrorBoundary.tsx`) → mount trong `routes.tsx` cho route element.
Bản thật có **4** (mỗi layout 1) → vì lỗi ở layout (sidebar, header) phải **giữ được vùng nội dung** thay vì mất trắng.

→ Thêm `LayoutErrorBoundary` cho `BaseLayout` · `VendorLayout` · `AdminLayout` · `AccountLayout`.

---

## 8. GĐ 5 — Bền vững (1 tuần)

### T-21 — Test `ui/` + `api/`

**Hiện trạng:** 6 file test, **chỉ ở `model/`**. `ui/` = 0, `api/` = 0.

**Test `api/` (bắt được lớp lỗi quan trọng nhất):**
| Test | Bảo vệ cái gì |
|---|---|
| Mỗi mapper: DTO BE → kiểu FE | Lỗi DTO lệch (HTTP 200 nhưng dữ liệu sai) |
| Mỗi endpoint: 404/500/timeout → **phải throw**, không trả mock | Lớp lỗi "nuốt lỗi" |
| `gateway.ts`: mỗi hằng khớp endpoint BE | GĐ 1 không bị hồi quy |

**Test `ui/` (bắt được lỗi hợp đồng):**
| Test | Bảo vệ cái gì |
|---|---|
| `ProductCard` với `acceptsCustomOrder` → hiện nhãn "Chỉ nhận đặt hàng", ẩn nút mua ngay | AC-14.3 / AC-15.4 |
| `CommandPalette`: ↑↓/Enter/Esc, `aria-activedescendant` đúng | T-09 |
| `AsyncState`: 3 nhánh loading/error/loaded | L1 |
| `Modal`: focus trap, Escape đóng | A11y |
| Form: chặn submit khi không hợp lệ | T-16 |

### T-22 — Dọn `shared/config`

```ts
// hiện tại
export { routes, ROUTES } from './routes';   // trùng tên
export { getToken } from './theme';
```
→ Chọn 1 tên (`routes`), xoá cái còn lại. Cập nhật mọi nơi import.

### Bổ sung: CI cho temp

```yaml
# .github/workflows/web-quality.yml (nếu đưa temp vào repo)
- name: Lint (oxlint)
  run: npm run lint -- --deny-warnings
- name: Type-check and build
  run: npm run build
- name: Test
  run: npm run test
- name: Page size guard
  run: npx tsx scripts/check-page-size.ts --max-loc 120 --max-usestate 4
```
> `package.json` của temp **đã có** `npm run check` (lint + tsc + test + build) → chỉ cần đưa vào CI.

---

## 9. Bảng ưu tiên tổng hợp + ước lượng

| Ưu tiên | Mã | Việc | Ngày |
|---|---|---|---|
| **P0** | T-04 | Sửa `gateway.ts` (8 endpoint sai) | **1** |
| **P0** | T-02 | Thêm `AsyncState` | **1** |
| **P0** | T-03 | Thêm `useAction` | **1** |
| **P0** | T-14 | Hạ tầng test UI (jsdom + testing-library) | **1** |
| **P0** | T-05 | Thêm `useAsync` | **1** |
| **P0** | T-19 | Bỏ ID tự sinh | **0.5** |
| **P1** | T-01 | Port 12 module `api/` + mapper | **15–25** |
| **P1** | T-05b | Áp `useAsync`+`AsyncState` cho 63 page | **4** |
| **P1** | T-06 | Tách 20 `features` slice | **15–25** |
| **P1** | T-07 | Bổ sung `entity/ui` (14 component) | **5** |
| **P1** | T-08+T-09 | A11y (role/aria/listbox/activedescendant) | **5–7** |
| **P1** | T-10+T-11 | Responsive (primitive grid + 8 trang lõi) | **4** |
| **P1** | T-12 | Theme tối đủ 138 token | **1** |
| **P1** | T-16 | Validate form + `FormField` | **2** |
| **P1** | T-17 | Giảm 452 inline style | **3** |
| **P1** | T-18 | `RequireNfc` giữ search+hash + draft | **0.5** |
| **P1** | T-13 | Error boundary 4 layout | **1** |
| **P1** | T-15 | Query cache | **2** |
| **P2** | T-20 | WebP + lazy loading | **0.5** |
| **P2** | T-21 | Test `ui/` + `api/` | **5** |
| **P2** | T-22 | Dọn `ROUTES`/`routes` | **0.5** |

**Tổng: ~14–18 tuần** cho 1 người, ~9–11 tuần cho 2 người (GĐ 4 chạy song song).

---

## 10. Checklist nghiệm thu

### GĐ 0
- [ ] `AsyncState` có 3 nhánh loading/error/loaded + nhánh empty
- [ ] `useAction` có `busy` + `error` + `finally`
- [ ] `vitest` chạy được test component (`environment: 'jsdom'`)

### GĐ 1
- [ ] **0 hằng sai** trong `gateway.ts` (đối chiếu controller BE)
- [ ] Endpoint chưa có được đánh dấu rõ, không gọi âm thầm
- [ ] Test khẳng định mỗi hằng khớp endpoint BE

### GĐ 2
- [ ] **12 module `api/`** có trong `entities/`
- [ ] **0** `catch` trả về dữ liệu giả
- [ ] **63/63 page** có nhánh `error` (không page nào bỏ)
- [ ] Demo mode là **chế độ** (`ENV.isDemoMode`), không phải fallback

### GĐ 3
- [ ] **≥ 20 feature slice**, tất cả **được import thật**
- [ ] Mỗi page **≤ 120 LOC** và **≤ 4 `useState`** (script CI kiểm)
- [ ] **≥ 14** component trong `entities/ui`
- [ ] Không còn `pay_${Date.now()}` / `MK-${Math.random()}`

### GĐ 4
- [ ] 360px: **không cuộn ngang** ở mọi trang
- [ ] `aria-activedescendant` + `role="listbox"` trong CommandPalette
- [ ] `role="alert"` cho lỗi cấp trang
- [ ] Theme tối phủ **≥ 95% token**; `--glow-*` giảm alpha
- [ ] Form chặn submit khi không hợp lệ + `aria-invalid`
- [ ] `RequireNfc` giữ `search` + `hash`
- [ ] Inline style giảm ≥ 60%; **0 màu hex cứng**
- [ ] Ảnh ≤ 500 KB tổng; `loading="lazy"` cho ảnh dưới fold

### GĐ 5
- [ ] Test `ui/` + `api/` ≥ 15 file
- [ ] CI chạy `lint` + `test` + `build` + **page-size guard**
- [ ] Có `RouteErrorBoundary` ở **4 layout**

---

## 11. Phụ lục — Dữ liệu tham chiếu

### 11.1 Bảng so sánh nhanh temp vs bản thật (đo lại 02:30)

| Chỉ số | Temp | Bản thật | Ghi chú |
|---|---|---|---|
| File `src` | 241 | 574 | |
| Page | 63 | 68 | |
| `features` slice (dùng thật) | 4 | 31 | |
| `entities/ui` component | 2 | 28 | |
| Module `api/` | **0** | 12 | |
| File test | 6 | 12 | |
| Test case | 36 | 38 | |
| `aria-*` / `role=` | 31 / 8 | 182 / 46 | |
| `@media` trong `global.css` | 1 | **0** | |
| Module CSS có `@media` | 13/68 | 16/88 | |
| Inline style | 452 | — | |
| `dist/` | 1.79 MB | 1.75 MB | |
| Chunk | 115 | 103 | |
| Ảnh | 0.92 MB | ~1.4 MB | |
| `? true : true` | 0 | 1 | ✅ |
| `catch` nuốt lỗi | 2 (storage) | 30 | ✅ |
| Import sâu xuyên slice | 0 | 0 | ✅ |
| oxlint | 0 | 0 | ✅ |

### 11.2 Endpoint BE thật (đã đối chiếu controller)

```
/identity-service/api/auth/login                  /identity-service/api/auth/register
/identity-service/api/auth/refresh-token           /identity-service/api/auth/verify-account
/identity-service/api/auth/send-verify-account-otp /identity-service/api/auth/reset-password
/identity-service/api/auth/send-reset-password-otp /identity-service/api/accounts/me
/identity-service/api/addresses/**                 /identity-service/api/nfc/status
/identity-service/api/nfc/sessions                 /identity-service/api/nfc/sessions/{id}/card
/api/vendors                                       /api/vendors/{vendorId}
/api/vendors/uploads                               /api/vendors/{vendorId}/documents
/api/vendors/{vendorId}/delivery-areas              /api/vendors/{vendorId}/order-profile
/api/vendors/{vendorId}/owner-checks                /api/vendors/{vendorId}/reviews
/api/vendors/{vendorId}/registration-fee-payments  /api/registration-fee-config
/api/cake-attributes                               /api/interprovince-fees
/catalog-service/api/products                      /catalog-service/api/products/{id}
/catalog-service/api/seller/products               /catalog-service/api/seller/products/uploads
/quotation-service/api/quote-requests              /quotation-service/api/quote-requests/{id}
/quotation-service/api/quote-requests/{id}/quotes   /quotation-service/api/quote-requests/{id}/quotes/{quoteId}
/quotation-service/api/quote-requests/{id}/quotes/{quoteId}/acceptance
/quotation-service/api/suppliers                   /quotation-service/api/suppliers/{vendorId}
/order-service/api/carts/me                        /order-service/api/carts/me/items
/order-service/api/checkouts                       /order-service/api/checkouts/{id}
/order-service/api/orders                          /order-service/api/orders/{id}
/order-service/api/orders/{id}/progress-updates    /order-service/api/orders/{id}/payments
/order-service/api/orders/{id}/dispute             /order-service/api/orders/{id}/dispute/evidences
/order-service/api/orders/{id}/mockups            /order-service/api/orders/{id}/invoice
/order-service/api/orders/{id}/reviews            /order-service/api/uploads
/payment-service/api/payments                      /payment-service/api/payments/{id}
/payment-service/api/payments/vnpay/ipn           /payment-service/api/payments/vnpay/return
/payment-service/api/refunds                       /payment-service/api/ledgers/{orderId}
/payment-service/api/ledgers/{orderId}/entries      /payment-service/api/ledgers/{orderId}/refunds
/payment-service/api/ledgers/{orderId}/disbursements /payment-service/api/ledgers/{orderId}/payout
/ws                                               (STOMP)
/orchestrator-service/api/notifications            ← CHƯA CÓ REST
```

### 11.3 Lệnh tái kiểm chứng

```bash
cd C:\Workspace\MSS301\temp\web-temp\moonkage-web
npx oxlint          # 0 cảnh báo
npx vitest run      # 6 files / 36 tests
npx vite build      # 115 chunks / 1.79 MB

# đếm nhanh các chỉ số trong kế hoạch
grep -rc "style={{" src/ --include=*.tsx | awk -F: '{s+=$2} END {print "inline style:", s}'
grep -rc "@media" src/ --include=*.css
grep -rn "useEffect" src/pages --include=*.tsx | wc -l
```

### 11.4 Bản đồ "port từ bản thật"

| Cần ở temp | Lấy từ `web/src/` |
|---|---|
| `AsyncState` | `shared/ui/AsyncState/` |
| `useAction` | `shared/lib/useAction.ts` |
| `useAsync` | `shared/lib/useAsync.ts` |
| 12 module `api/` + mapper | `entities/*/api/` |
| `client.ts` (axios + refresh + `ApiError`) | `shared/api/client.ts` — temp **đã có sẵn, gần y hệt** |
| `upload.ts` | `shared/api/upload.ts` |
| `realtime/` (STOMP) | `shared/api/realtime/` |
| `vendorDirectoryApi` | `entities/vendor/api/vendorDirectoryApi.ts` |
| `FileDrop` | `shared/ui/FileDrop/` |
| `StatusBadge` | `shared/ui/StatusBadge/` |

> **Ghi chú:** `shared/api/client.ts` của temp **đã có** axios + interceptor refresh token + `ApiError` + `ApiFieldError` → **gần y hệt bản thật**. Hạ tầng cơ bản đã sẵn sàng; thiếu là **các module `api/` bên trên `entities/`**.

---

*Kế hoạch lập 02/11/2026 02:45. Mọi số liệu đo bằng script trên mã nguồn thật của `moonkage-web` (02:30) và đối chiếu controller thật của `api/` (`6e990f4`). Không sửa file nào trong bản temp hay trong repo khi viết tài liệu này.*

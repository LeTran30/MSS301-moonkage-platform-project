# ĐÁNH GIÁ UI/UX TOÀN BỘ MÀN HÌNH — MOONKAGE WEB

> Ngày: 05/11/2026 · Phạm vi: `web/src` (63 file CSS ở `pages/`, 20 component trong `shared/ui`, 5 zone: Base / Auth / Account / Vendor / Admin)
> Phương pháp: đọc source (tokens, `shared/ui`, từng page CSS) + chạy thật trên `http://localhost:5173` với API thật (`localhost:8080`), đăng nhập 3 vai trò (buyer `member1@mk.com`, vendor `member4@mk.com`, admin `admin@mk.com`), kiểm tra computed style, contrast WCAG, và kiểm tra hành vi reload/navigation.

---

## 0. TÓM TẮT ĐIỀU HÀNH

| Hạng | Mức | Vấn đề | Số lượng |
|---|---|---|---|
| **P0** | Chặn | Hard reload mất phiên → đá về `/dang-nhap` | 1 bug |
| **P0** | Chặn | Copy nghiệp vụ lọt ra UI (`FR-06`, `M6.1.3`, `FLOW 5`…) | ~45 chỗ |
| **P1** | Cao | Dropdown `<select>` native chưa tùy chỉnh — 7 file dùng `<select>` thô | 7 file / 11 control |
| **P1** | Cao | Emoji thay icon — 41 chỗ, phá hệ thống icon | 41 |
| **P1** | Cao | Contrast fail WCAG AA (`--color-gold`, `--color-text-subtle`) | 2 token |
| **P1** | Cao | Không có responsive — header 570 dòng CSS, **0** media query | 1 zone-wide |
| **P2** | Trung bình | Font-size không theo thang token | ~15 chỗ |
| **P2** | Trung bình | Border-radius / spacing hardcode ngoài token | ~40 chỗ |
| **P2** | Trung bình | `border-radius: 8px` lệch `--radius-md: 10px` | 12 chỗ |
| **P2** | Trung bình | Zone token (`--color-zone`) khai báo nhưng không dùng | 1 token chết |
| **P3** | Thấp | `<label>` không `htmlFor`, thiếu `aria-*` | ~30 chỗ |
| **P3** | Thấp | Token alias trùng lặp (`--text-md` ≡ `--text-base`) | 1 |

**Kết luận:** Design system **nền tảng tốt** (token đầy đủ, 0 hex hardcode trong module CSS, có `prefers-reduced-motion`, focus ring toàn cục). Vấn đề nằm ở **tính nhất quán khi áp dụng** và ở **nội dung bản dịch spec → UI**. Đây là bài toán "chốt design system + dọn copy", không phải viết lại UI.

---

## 1. ĐIỂM TỐT (giữ nguyên)

- **Token hoá màu hoàn hảo**: `rg "#[0-9a-fA-F]{3,8}" src/ --glob '*.module.css'` → **0 kết quả**. 100% màu đi qua token.
- **Focus ring toàn cục** trong `global.css` với `:focus-visible`, có biến thể `.mk-on-brand`.
- **`prefers-reduced-motion`** được xử lý đúng cách (override token, không cần `!important`).
- **Async state chuẩn hoá**: `AsyncState` / `LoadingState` / `ErrorState` / `EmptyState` / `Skeleton` / `PageLoader` — mọi màn hình async đều dùng, không có "trang trắng khi lỗi".
- **`Icon` có bộ 60+ icon SVG path** (`cake`, `lantern`, `moon`, `sparkle`…) — có thể thay hết emoji.
- **Zone token** (`data-zone="base|vendor|admin"`) đã có ý tưởng rõ ràng: người bán dùng vàng, quản trị dùng mực xanh.
- **Không còn mock** — mọi màn hình đã nối API thật, không còn `MOCK_*`, `isDemoMode`, ảnh fallback giả.

---

## 2. P0 — BUG CHẶN

### 2.1 Hard reload mất phiên, đá người dùng về trang đăng nhập

**Tái hiện (đã verify trên trình duyệt thật, không phải suy luận):**

```
1. Đăng nhập thành công bằng form (member1@mk.com) → /tai-khoan, header hiện "Nguyễn Thị Lan (Người mua) | Đã xác minh NFC"
2. Nhấn F5 / mở link trực tiếp /kenh-ban hoặc /tai-khoan/don-hang
3. → Bị đẩy về /dang-nhap
4. Trong khi đó header VẪN hiện "Nguyễn Thị Lan (Người mua) | Đã xác minh NFC"
```

Bước 4 là mấu chốt: **người dùng đã đăng nhập thật**, token còn hợp lệ (`GET /identity-service/api/accounts/me` trả 200 khi gọi trực tiếp), nhưng route vẫn redirect.

**Nguyên nhân — race condition giữa `SessionBridge` và guard:**

`src/app/providers/SessionBridge.tsx` khôi phục phiên trong `useEffect`:

```26:36:web/src/app/providers/SessionBridge.tsx
  useEffect(() => {
    if (!getAccessToken()) {
      markAnonymous();
      return;
    }

    let cancelled = false;
    markRestoring();
```

`markRestoring()` chạy **sau** lần render đầu tiên. Nhưng `RequireAuth` render **cùng lần đầu tiên** và đọc `sessionStatus`:

```17:22:web/src/app/guards/RequireAuth.tsx
  if (sessionStatus === 'RESTORING') {
    return <PageLoader />;
  }

  if (!user || !user.id) {
    return <Navigate to={routes.auth.login} state={{ from: location }} replace />;
  }
```

Store khởi tạo là `'ANONYMOUS'` (`sessionStatusStore.ts:21`), `userStore` là `GUEST_USER` (`id: ''`). Nên ở render đầu tiên:
- `sessionStatus === 'ANONYMOUS'` (chưa phải `RESTORING`)
- `user.id === ''` → **`<Navigate to="/dang-nhap" replace />` được render và commit**

`SessionBridge` sau đó mới `markRestoring()` và nạp hồ sơ thành công — nhưng `<Navigate replace>` **đã** thay URL. Kết quả: URL ở `/dang-nhap` trong khi header hiện đúng người dùng.

**Phạm vi ảnh hưởng:** `RequireAuth`, `RequireAdmin`, `RequireNfc` — tức mọi route `/tai-khoan/*`, `/kenh-ban/*`, `/quan-tri/*`. Đây là lỗi **giữ phiên sau F5**, cực kỳ dễ gặp với người dùng thật (F5, mở link từ email/Zalo, bookmark, quay lại trình duyệt).

**Fix đề xuất:** sửa thứ tự khởi tạo — đặt trạng thái `RESTORING` **đồng bộ** ngay khi có token, trước lần render đầu:

```ts
// src/entities/user/model/sessionStatusStore.ts
export const sessionStatusStore = createStore<SessionStatus>(
  getAccessToken() ? 'RESTORING' : 'ANONYMOUS',
);
```

Hoặc (bền hơn, không phụ thuộc thứ tự import): guard chuyển sang kiểu "chờ" thay vì "đá":

```tsx
// src/app/guards/RequireAuth.tsx
const hasToken = Boolean(getAccessToken());
if (sessionStatus === 'RESTORING' || (hasToken && sessionStatus === 'ANONYMOUS')) {
  return <PageLoader />;
}
```

Cách thứ hai an toàn hơn vì không phụ thuộc thứ tự module. **Khuyến nghị dùng cách 2 + thêm test hồi quy.**

---

## 3. P0 — COPY NGHIỆP VỤ LỌT RA UI

Hệ thống hiển thị mã yêu cầu nghiệp vụ cho **người dùng cuối**. Đây là dấu hiệu rõ nhất của "AI-generated / prototype chưa polish" và không được chấp nhận trên prod.

**Mức độ:** ~45 chỗ trong 32 file. Ba dạng:

**(a) Eyebrow / tiêu đề trang**
```
src/pages/base/catalog/CatalogPage.tsx:61       DANH MỤC MUA LẺ (FR-06, FLOW 1)
src/pages/base/vendors/VendorsListPage.tsx:21   DANH SÁCH ĐƠN VỊ CUNG CẤP (M3.2, FLOW 3)
src/pages/base/cart/CartPage.tsx:64             Giỏ hàng của bạn (M4.0, Flow 1)
src/pages/base/checkout/CheckoutPage.tsx:101    Thanh toán đơn hàng (M4.1, Flow 1)
src/pages/account/orders/OrdersListPage.tsx:24 ĐƠN HÀNG CỦA TÔI (M6.1, FLOW 1, FLOW 2)
src/pages/account/order-dispute/...:109        KHIẾU NẠI ĐƠN HÀNG (M6.1.3, FLOW 5, FR-12)
src/pages/account/requests/RequestsListPage.tsx:31 YÊU CẦU & BÁO GIÁ (M6.2, FLOW 2, FLOW 3)
src/pages/base/new-quote-request/...:151       TẠO YÊU CẦU BÁO GIÁ MỞ (M3.1, FLOW 2, FR-16)
src/pages/base/sell-register/...:143            ĐĂNG KÝ BÁN HÀNG (M7.1, FLOW 4, FR-26)
src/pages/base/sell-intro/SellIntroPage.tsx:10  HỢP TÁC KINH DOANH (M7.0, FLOW 4)
src/pages/account/nfc-verify/...:146            XÁC MINH DANH TÍNH (M6.4, FLOW 6, FR-04)
src/pages/vendor/overview/...:128               KÊNH BÁN HÀNG · TỔNG QUAN (B1.0, FLOW 4)
src/pages/base/policy/PolicyPage.tsx:8          Chính sách sàn Moonkage (M8.0)
```

**(b) Nhãn form / tiêu đề bảng / badge**
```
src/features/edit-vendor-settings/ui/VendorShippingSettingsTab.tsx:36  Tỉnh / Thành phố giao được (FR-28)
src/features/edit-vendor-settings/ui/VendorLegalSettingsTab.tsx:41     Hình thức đăng ký kinh doanh (BR-33)
src/features/edit-vendor-settings/ui/VendorConditionsSettingsTab.tsx:46 Chế độ hoạt động của gian hàng (BR-21)
src/features/register-vendor/ui/VendorBusinessTypeStep.tsx:24          Bước 1: Chọn mô hình pháp lý của bạn (BR-33)
src/features/register-vendor/ui/VendorSellingModeStep.tsx:43/72        Hình thức bán hàng trên Moonkage (BR-21) / phí mở bán (FR-27, FR-53)
src/features/request-quote/ui/QuoteRequestPackagingCard.tsx:39        Loại tùy chỉnh cần làm (BR-14)
src/entities/vendor/ui/VendorApplicationCard.tsx:49/54/65             Mô hình kinh doanh (BR-33) / Chế độ nhận đơn (BR-21) / Nguồn hàng (AC-26.2)
src/pages/admin/products/AdminProductsPage.tsx:133/134                <th>Phân loại Vỏ (FR-54)</th>
src/entities/dispute/ui/DisputeCaseCard.tsx:25                       <Badge>Đang chờ Admin phân xử (FR-49)</Badge>
src/pages/base/payment-result/PaymentResultPage.tsx:68/93/117         <Badge>THANH TOÁN THÀNH CÔNG (M4.3)</Badge>
```

**(c) Nội dung trang chính trị / toast**
```
src/pages/admin/products/AdminProductsPage.tsx:66   toast.warning('Sản phẩm đã bị gỡ vĩnh viễn nên không thể khôi phục (BR-24).');
src/pages/admin/products/AdminProductsPage.tsx:93   ℹ️ <strong>BR-24:</strong> gỡ bỏ sản phẩm là trạng thái REMOVED...
src/pages/base/policy/PolicyPage.tsx:19              1. Cơ chế giữ tiền ký quỹ Escrow (FR-49 & Flow 5)
src/pages/base/policy/PolicyPage.tsx:51              ... (Flow 2, M6.1.2) ... Quy tắc bất di biến AC-49.3
src/pages/base/policy/PolicyPage.tsx:69              ... (BR-33) ... danh mục FR-54
src/pages/account/profile/ProfilePage.tsx:36         Số định danh cá nhân đã che (NFR-03):
src/pages/account/deposit-payment/...:215           JPG/PNG dung lượng tối đa 20MB theo chuẩn NFR-08
src/pages/base/direct-quote-request/...:154/158     phí liên tỉnh tính theo tỉnh này (BR-30) / Loại tùy chỉnh cần làm (BR-14)
src/pages/vendor/money/VendorMoneyPage.tsx:103/123  Moonkage không thu hoa hồng (BR-10) / Cơ chế Escrow (FR-49)
src/pages/admin/overview/AdminOverviewPage.tsx:45/61/134/140/149
src/pages/account/overview/AccountOverviewPage.tsx:23  Khối "Việc cần bạn" (M6.0)
src/pages/account/addresses/AddressesPage.tsx:34      Địa chỉ nhận hàng đã lưu (M6.3, FR-03)
src/pages/account/request-compare/RequestComparePage.tsx:64  So Sánh Báo Giá Cạnh Nhau (M6.2.1, FR-17)
src/pages/vendor/legal-settings/...:26               Hồ Sơ Pháp Lý (B6.1, NFR-02)
src/features/write-review/ui/ReviewForm.tsx:63      ★ (NFR-08)
```

**Fix:** gỡ toàn bộ mã khỏi chuỗi hiển thị. Giữ mã ở **comment nguồn** (đã có sẵn và rất tốt — ví dụ `// FR-12: GET /api/orders/{orderId}`). Với `PolicyPage` và `AdminVouchersPage`/`VendorCapacityPage` (trang trích dẫn đặc tả) → cần **quyết định sản phẩm**: hoặc viết lại thành văn bản pháp lý dành cho người dùng, hoặc ẩn hẳn khỏi prod.

**Quy tắc chống tái phát (nên thêm vào `npm run check`):**

```ts
// scripts/check-no-spec-ids.mjs — fail build nếu mã FR/M/BR/NFR lọt ra UI
const SPEC_ID = /\b(FR-\d+|M\d\.\d+(?:\.\d+)?|BR-\d+|NFR-\d+|AC-[\d.]+|FLOW[- ]?\d+|Q\d\.\d+|B\d\.\d+)\b/;
// chỉ quét text node trong JSX, bỏ qua comment
```

---

## 4. P1 — DROPDOWN / SELECT

### 4.1 Bốn kiểu `<select>` đang cùng tồn tại

Đã đo computed style trực tiếp trên trang Catalog (đăng nhập thật):

| Control | Class | `appearance` | Mũi tên | Font | Padding | Bo góc |
|---|---|---|---|---|---|---|
| Shared `Select` | `_select_9gfar_32` | `none` ✅ | SVG ✅ | Be Vietnam Pro 14px | `0 32px 0 12px` | token `10px` ✅ |
| `CatalogPage` sort | `_sortSelect_jtmmp_155` | **`auto`** ❌ | **native OS** ❌ | kế thừa | `4px 8px` | `10px` |
| `vendorSettingsUi` | `.select` | **`auto`** ❌ | native OS ❌ | 14px | `10px 12px` | `8px` ❌ |
| `VendorDisbursementsPage` | `.select` | **`auto`** ❌ | native OS ❌ | 14px | `10px 12px` | `8px` ❌ |
| `ReviewForm` | `.control` | **`auto`** ❌ | native OS ❌ | 14px | `10px 14px` | `8px` ❌ |

**Vấn đề:** `<select>` native trên Windows đóng popup bằng style hệ đối tượng (nền trắng/xám hệ thống, không theo theme, không bo góc, không đổ bóng). Đây chính xác là điều người dùng phản ánh: *"dropdown vẫn chưa tùy chỉnh style"*.

**File cần sửa (7 file, 11 control):**
```
src/pages/base/catalog/CatalogPage.tsx:153                  sortSelect
src/pages/account/address-form/AddressFormPage.tsx         tỉnh/thành
src/features/write-review/ui/ReviewForm.tsx:49,60           sản phẩm + rating
src/features/request-disbursement/ui/DisbursementRequestModal.tsx:79,111   đơn + mục đích
src/features/edit-vendor-settings/ui/LegalIdentityFields.tsx:62,104       loại hình + nguồn hàng
src/pages/vendor/disbursements/VendorDisbursementsPage.tsx:93,125        đơn + mục đích
src/features/edit-product/ui/ProductDeliveryDescription.tsx
```

### 4.2 Shared `Select` còn thiếu

- Không có `placeholder` (native select hiển thị option đầu tiên làm giá trị — dễ gây hiểu nhầm).
- Không hỗ trợ nhóm option (`<optgroup>`).
- Không có `aria-invalid` / `aria-describedby` như `Input` đã có (thiếu nhất quán về a11y).
- Popup vẫn là native ⇒ **không thể tùy chỉnh màu/nền option**, kể cả khi đã `appearance:none`.
- `Select` không có `id` mặc định từ `useId` (như `Input`) → id sinh từ `label.toLowerCase()` có thể trùng khi 2 select cùng label.

### 4.3 Đề xuất: `Select` tự dựng (custom listbox)

Vì popup native **không thể style**, chỉ có 2 lựa chọn thực tế:

**Phương án A — Khuyến nghị: custom listbox trong `shared/ui/Select`**
- Nút `<button role="combobox" aria-expanded aria-controls>` + panel `role="listbox"`.
- Đóng bằng `Escape`, `Enter`, click ra ngoài; điều hướng bằng `↑ ↓ Home End`; `aria-activedescendant`.
- Style 100% theo token: bo góc `--radius-md`, đổ bóng `--shadow-md`, nền `--color-surface`, focus `--shadow-glow`, option hover `--color-surface-2`, option active `--color-primary-soft`.
- Ưu điểm: giải quyết triệt để vấn đề style, đồng thời sửa luôn a11y.
- Nhược: ~150 dòng + cần test keyboard.

**Phương án B — Rẻ hơn: giữ native `<select>` nhưng `appearance:none` + mũi tên SVG**
- Đồng bộ style *đóng* select (đã có sẵn ở `Select.module.css`) — chỉ giải quyết 60% vấn đề.
- Popup vẫn native ⇒ không style được.
- Dùng cho các case hiếm (danh sách tỉnh 63 option rất dài, native search được).

**Khuyến nghị thực thi:** Phương án A cho mọi select ≤ 20 option; giữ native cho danh sách tỉnh (`PROVINCE_ITEMS`, 63 option) vì native có thanh cuộn + gõ nhanh.

### 4.4 Checkbox / radio chưa có component

`shared/ui` **không có** `Checkbox` / `Radio` / `Switch`. Kết quả là 30+ chỗ dùng `<input type="checkbox|radio">` thô với style rời rạc:
```
src/features/edit-product/ui/ProductSupplyFields.tsx:39,43     radio — style riêng
src/features/checkout/ui/PaymentMethodPanel.tsx:18            radio readOnly
src/features/resolve-disputes/ui/DisputeResolutionModal.tsx:68,81,94   radio
src/features/edit-vendor-settings/ui/VendorShippingSettingsTab.tsx:42  checkbox trong grid 63 tỉnh
src/pages/account/address-form/AddressFormPage.tsx:225        checkbox
src/features/edit-vendor-settings/ui/VendorConditionsSettingsTab.tsx:49,62,75,126
src/pages/admin/opening-fee/AdminOpeningFeePage.tsx:57,69
src/pages/admin/interprovince-fee/AdminInterprovinceFeePage.tsx:101
...
```
Checkbox mặc định của OS (xám/xanh hệ thống) không khớp palette kem-đỏ-vàng. Cần component `Checkbox` + `Radio` trong `shared/ui` với accent `var(--color-primary)`.

---

## 5. P1 — TYPOGRAPHY & CHỮ

### 5.1 Hệ thống font: tốt, nhưng phân cấp chưa nhất quán

Font đã load đúng (`index.html`): **Be Vietnam Pro** (body) + **Playfair Display** (display) + **JetBrains Mono** (mono). Cả 3 hỗ trợ đủ dấu tiếng Việt. Đây là lựa chọn tốt — không phải font mặc định của AI.

**Vấn đề: `h1/h2/h3` global dùng `--font-display` (Playfair) nhưng `Card` header dùng `--font-sans`.**

Đo computed style trên trang Admin:
```
H1 "Bàn làm việc Quản trị viên (Q1.0)"  Playfair Display  28px  700  rgb(146,29,23)
H3 "Tổng quan dòng tiền ký quỹ Escrow"  Be Vietnam Pro  18px  600  rgb(42,29,20)
H4 "Cấu hình quy tắc & danh mục sàn"     Be Vietnam Pro  14px  600  rgb(146,29,23)
```

**Vấn đề thật sự:**
1. **H4 nhỏ hơn body text.** H4 = 14px 600, trong khi body = 16px (`--text-md`). Tiêu đề nhỏ hơn nội dung → mất thứ bậc tiêu đề. Đây là lỗi phổ biến nhất trong audit này.
2. **H3 (18px, sans) < H1 (28px, Playfair)** — nhảy cỡ 10px, không có bậc 20px ở giữa trong admin. Trên Base zone thì H2/H3 global đều Playfair.
3. **Mix 2 font cho cùng cấp tiêu đề**: trang dùng `h1` (Playfair) nhưng card dùng `h3` (sans) → người dùng cảm nhận 2 hệ thống tiêu đề song song.
4. **`letter-spacing: -0.01em`** trên h1/h2/h3 là tiêu chuẩn cho font sans; Playfair là serif hiển thị → âm là chưa tối ưu (Playfair nên dùng letter-spacing bằng 0 hoặc dương rất nhỏ).

**Đề xuất thang tiêu đề thống nhất (thêm vào `global.css`):**

```css
h1, h2, h3, h4, h5, h6 { font-family: var(--font-sans); font-weight: var(--weight-semibold); }
h1 { font-size: var(--text-2xl); font-weight: var(--weight-bold); }
h2 { font-size: var(--text-xl); }
h3 { font-size: var(--text-lg); }
h4 { font-size: var(--text-base); font-weight: var(--weight-semibold); }
h5 { font-size: var(--text-sm); }
```
Chỉ dùng `--font-display` cho **1 element thị giác** mỗi trang (hero title, `.brandTitle`) — đó là cách dùng serif sang trọng mà không rối. Hiện tại Playfair xuất hiện ở ~36 class `.title` → loãng, mất tác dụng.

### 5.2 Font-size ngoài thang token

```
src/app/RouteErrorBoundary.module.css:32          font-size: 20px;
src/app/layouts/LayoutErrorBoundary.module.css:17  font-size: 1.15rem;
src/pages/base/sell-intro/SellIntroPage.module.css:32   font-size: clamp(2rem, 3.5vw, 2.75rem);
src/pages/base/bulk/BulkHubPage.module.css:40            font-size: clamp(2rem, 3.5vw, 2.75rem);
src/shared/ui/Badge/Badge.module.css:17            font-size: 0.6875rem;
src/features/write-review/ui/ReviewForm.module.css:22  border-radius: 8px (xem §6)
src/widgets/header/ui/Header.module.css:105         font-size: 1.5rem;
+ ~10 chỗ .eyebrow dùng 0.6875rem
```
`clamp()` ở 2 trang là hợp lý (hero fluid) — nhưng nên đặt thành token `--text-hero` để thống nhất.

### 5.3 Contrast (WCAG 2.1 AA) — đo bằng công thức tương đối

| Foreground | trên `--color-surface` | trên `--color-surface-2` | Kết luận |
|---|---|---|---|
| `--color-text` `#2a1d14` | **16.08** ✅ | 14.32 ✅ | OK |
| `--color-text-muted` `#75604f` | **5.83** ✅ | 5.19 ✅ | OK |
| `--color-text-subtle` `#9d8877` | **3.32** ❌ | **2.96** ❌ | **FAIL** (cần ≥4.5) |
| `--color-gold` `#b8862b` | **3.19** ❌ | **2.84** ❌ | **FAIL** |
| `--color-gold-hover` `#9b6f1f` | 4.41 ⚠️ | 3.92 ⚠️ | FAIL cho text nhỏ |
| `--color-primary` `#b3261e` | **6.43** ✅ | 5.72 ✅ | OK |

**`--color-gold` bị dùng làm màu chữ ở 92 chỗ** (92 lần trong module CSS), bao gồm:
- `.eyebrow` mọi trang — **11px** (rất nhỏ) trên nền sáng ⇒ **2.8–3.2:1** ⇒ không đọc được.
- `.brandTagline` header — 11px.
- `.brandName` header — 24px Playfair (đạt vì lớn, nhưng vẫn dưới 4.5).
- `.active` của sidebar vendor.
- Focus ring dùng `--color-gold` → cũng yếu.

**Fix:**
```css
/* tokens.css */
--color-gold: #8a6318;        /* từ #b8862b → 4.62:1 trên surface  ✅ */
--color-gold-hover: #6f4f13;
--color-gold-bright: #e2b25c; /* giữ nguyên — chỉ dùng cho gradient/glow trên nền tối */
--color-text-subtle: #85705d;  /* từ #9d8877 → 4.51:1 trên surface  ✅ */
```
Và thêm `--color-gold-text` riêng cho các chỗ cần vàng *dạng chữ* (giữ `--color-gold` cho border/gradient/glow).

**Ngoài ra:** `.focus-visible` toàn cục dùng `var(--color-primary)` (đạt contrast ✅) nhưng `Select`/`Input` dùng `--shadow-glow` (vàng 18%) → ring quá nhạt. Nên đổi sang `--ring` dựa trên primary.

### 5.4 Số lớn chữ nhỏ dưới 12px

- `.eyebrow` → 11px (`0.6875rem`) ở 12 trang.
- `.badge.sm` → 11px.
- `.brandTagline` → 11px.
- `.font-size: 0.6875rem` xuất hiện ở ~12 file.

11px là dưới ngưỡng đọc thoải mái (khuyến nghị ≥12px, nhất là khi tương phản thấp). Nâng lên `--text-xs` (12px).

---

## 6. P2 — SPACING / RADIUS / GIÁ TRỊ HARDCODE

### 6.1 Bo góc lệch token

Token: `--radius-xs:4px, sm:6px, md:10px, lg:16px, xl:24px, full:999px`

Dùng `8px` (không có trong thang) ở **12 chỗ**:
```
src/features/write-review/ui/ReviewForm.module.css:22
src/pages/admin/vendor-detail/AdminVendorDetailPage.module.css:77
src/pages/vendor/request-detail/VendorRequestDetailPage.module.css:60
src/pages/vendor/disbursements/VendorDisbursementsPage.module.css:43,92
src/pages/vendor/product-form/VendorProductFormPage.module.css:52,61
src/pages/account/deposit-payment/DepositPaymentPage.module.css:62,94
src/pages/admin/opening-fee/AdminOpeningFeePage.module.css:42
src/pages/account/address-form/AddressFormPage.module.css:41
src/pages/vendor/order-detail/VendorOrderDetailPage.module.css:56,76
src/pages/admin/interprovince-fee/AdminInterprovinceFeePage.module.css:32,60,79
```
→ đổi hết thành `var(--radius-md)` (10px). Ngoài ra `20px` ở `VendorProductFormPage.module.css:82` → `--radius-xl` (24px).

### 6.2 Spacing / giá trị số hardcode

Trong `shared/ui` (nơi chuẩn nhất phải là) có ~20 chỗ dùng px thay vì `--space-*`:
```
AsyncState.module.css:6   padding: 48px 24px;   → var(--space-12) var(--space-6)
AsyncState.module.css:40  padding: 40px 24px;
Badge.module.css:13       padding: 5px 10px;
Toast.module.css:8,19,20  gap: 12px; padding: 14px 16px;
Breadcrumbs.module.css:9,19  gap: 6px;
PageLoader.module.css:6,18  padding: 32px 16px; gap: 20px;
Tabs.module.css:33        padding: 2px 6px;
```
→ chuyển sang `--space-*`.

### 6.3 `--color-zone` là token chết

`--color-zone` / `--color-zone-soft` được khai báo và gán theo zone (base=đỏ, vendor=vàng, admin=mực xanh) nhưng **chỉ được dùng ở đúng 1 chỗ**: `shared/ui/Card/Card.module.css` (`.icon`).
Đã đo trên trang Admin: `data-zone="admin"` → `--color-zone: #2f4b6e` ✅ đúng, nhưng **không có element nào dùng nó** — h1 vẫn đỏ (`rgb(146,29,23)`), sidebar admin không lấy màu zone.

→ Zone token nên được áp cho: tiêu đề trang (`.title`), màu active của sidebar, màu accent của tab, nút chính. Hiện tại khu Admin **vẫn đỏ** (đồng nhất với brand) chứ không "mực xanh" như thiết kế.

### 6.4 Token alias trùng lặp

```css
--text-base: 1rem;
--text-md: 1rem;   /* trùng */
```
`--text-md` là alias thừa nhưng được dùng ở `global.css` (`font-size: var(--text-md)`). Nên bỏ `--text-md`, dùng `--text-base`; hoặc đổi `--text-md` thành 1.0625rem cho một bậc trung gian thật sự.

---

## 7. P1 — RESPONSIVE (vấn đề lớn nhất về mặt kỹ thuật)

**Đo thực tế:** `document.documentElement.scrollWidth (1200) > innerWidth (915)` ⇒ **tràn ngang ngay ở 915px**.

### 7.1 Header không có một media query nào

`src/widgets/header/ui/Header.module.css` = **570 dòng, 0 `@media`**.
Header gồm 2 thanh: `topBar` (actor indicator + Ctrl+K + policy link) và `mainRow` (logo + search + nav + 4 action buttons). Tổng chiều rộng tối thiểu ≈ 1200px.

> **Đã xử lý (05-11-2026):** `topBar` không còn render trong bản build production — `Header.tsx` gate bằng `!import.meta.env.PROD`. Bản dev vẫn giữ để tiện debug. Vì vậy phần "ẩn `.topBar` ở `< 1024px`" trong §7.3 chỉ còn ý nghĩa cho bản dev.

**Hậu quả trên mobile:**
- Logo + search + nav + actions **không vừa** 390px → tràn ngang, người dùng phải cuộn ngang.
- Không có hamburger menu, không có menu mobile.
- `.topBar` "Đang đăng nhập: Nguyễn Thị Lan (Người mua) | Đã xác minh NFC" chiếm ~400px, không có cách ẩn (chỉ ở bản dev).

### 7.2 Chỉ 16 media query trong toàn bộ codebase

Breakpoint hiện có: `500 / 640 / 720 / 768 / 860 / 900 / 960 / 1024px` — **không thống nhất**, 8 giá trị khác nhau cho 63 file CSS.

Chỉ 16/63 file page CSS có responsive ⇒ **47 trang không có bất kỳ media query nào**.

### 7.3 Đề xuất

**Chuẩn hoá 4 breakpoint** (thêm vào `tokens.css`):
```css
--bp-sm: 640px;    /* mobile lớn */
--bp-md: 768px;    /* tablet */
--bp-lg: 1024px;   /* desktop nhỏ */
--bp-xl: 1240px;   /* desktop */
```

**Header (ưu tiên cao):**
- `< 1024px`: ẩn `.topBar` hoặc rút gọn thành chỉ avatar + role.
- `< 768px`: logo rút gọn (bỏ tagline), search thành icon mở overlay, nav vào drawer, thêm nút hamburger (`Icon name="menu"` đã có sẵn).
- Action group: giữ 3 icon + giỏ hàng badge.

**Grid:** `CatalogPage`, `HomePage`, các trang Admin/Vendor dùng `grid-template-columns: repeat(N, 1fr)` cần `repeat(auto-fill, minmax(240px, 1fr))` để tự wrap.

**Bảng:** 7 file có `<table>`. `AdminProductsPage` có `.tableCard { overflow-x: auto }` ✅ nhưng cần kiểm tra các bảng còn lại (`AdminPayoutsPage`, `AdminInterprovinceFeePage`, `AdminDisbursementsPage`, `VendorLedgerTable`, `EscrowLedgerViews`, `VendorReconciliationPage`) — nhiều bảng có 5–7 cột, trên mobile sẽ vỡ.

---

## 8. P1 — EMOJI THAY ICON (dấu hiệu "AI-generated" rõ nhất)

**41 chỗ emoji trong JSX**, pha trộn với hệ thống `Icon` SVG có sẵn:

| File | Emoji |
|---|---|
| `src/pages/auth/login/LoginPage.tsx:38` | 🥮 |
| `src/pages/auth/register/RegisterPage.tsx:74` | 🥮 |
| `src/pages/auth/confirm/RegisterConfirmPage.tsx:49` | 🔐 |
| `src/pages/auth/forgot-password/ForgotPasswordPage.tsx:37` | 🔑 |
| `src/pages/auth/reset-password/ResetPasswordPage.tsx:52` | 🛡 |
| `src/pages/system/not-found/NotFoundPage.tsx:11` | 🥮 |
| `src/pages/base/notifications/NotificationsPage.tsx:100-103` | 📦 📝 🎨 ⚖ 🔔 |
| `src/pages/base/policy/PolicyPage.tsx:17,38,58` | 🛡 ⚖ 🏭 |
| `src/pages/admin/disputes/AdminDisputesPage.tsx:109,115` | ⚖ ✓ |
| `src/pages/admin/vendors/AdminVendorsPage.tsx:96,102` | 🛡 ✓ |
| `src/entities/payment/ui/PayoutRequestCard.tsx:22,57,63` | 🏦 📝 ✓ |
| `src/features/add-to-cart/ui/AddToCartButton.tsx:45` | 🛒 |
| `src/features/review-applications/ui/VendorReviewModal.tsx:57,73-83` | ✓ ×5 |
| `src/features/edit-product/ui/ProductImagesField.tsx:51` | ✕ |
| `src/features/edit-vendor-settings/ui/VendorLegalSettingsTab.tsx:75` | 🛡 |
| `src/pages/account/deposit-payment/DepositPaymentPage.tsx:116` | 🛡 |
| `src/app/RouteErrorBoundary.tsx:44`, `LayoutErrorBoundary.tsx:81` | 🔄 |
| `src/entities/dispute/ui/DisputeCaseCard.tsx:20` | ✓ |
| `src/entities/order/ui/OrderReviewList.tsx:30,31` | ★ ☆ |
| `src/entities/product/ui/ProductReviewList.tsx:35,36` | ★ ☆ |
| `src/features/write-review/ui/ReviewForm.tsx:63` | ★ |
| `src/pages/vendor/order-detail/VendorOrderDetailPage.tsx:158` | ✓ |

**Vấn đề:**
1. **Rendering không đồng nhất**: emoji hiển thị theo font hệ đối tượng (Windows: Segoe UI Emoji → hình màu; macOS: Apple Color Emoji; Android: Noto). Trên máy không có emoji font → tofu `□`. **Không nhất quán giữa server và client, giữa thiết bị.**
2. **Không tôn trọng theme tối**: emoji màu sáng trên nền tối → chói.
3. **Không có `currentColor`** ⇒ không đổi màu theo token được.
4. **Trộn 2 hệ thống**: `Icon name="shield"` (đã có) nằm cạnh 🛡 trong cùng một file.

**Fix:** thay toàn bộ bằng `Icon` — bộ icon đã có sẵn mapping gần như 1:1:

| Emoji | Icon hiện có |
|---|---|
| 🥮 🏭 | `cake` |
| 🔐 🛡 | `shield` |
| 🔑 | `lock` |
| 🔄 | `refresh` |
| 📦 | `package` |
| 📝 | `file` |
| 🎨 | `sparkle` |
| ⚖ | `scale` |
| 🔔 | `bell` |
| 🏦 | `wallet` |
| 🛒 | `cart` |
| ✓ | `check` |
| ✕ | `x` |
| ★ / ☆ | `star` (đã có, dùng fill/outline) |
| 💰 | `wallet` / `creditCard` |
| 📤 / 📥 | `upload` / `download` |

`ProductReviewList` dùng ★/☆ — nên thay bằng `Icon name="star"` với 2 biến thể (filled/outline) để nhất quán với `Badge`/số điểm.

---

## 9. P2/P3 — A11Y & CHI TIẾT

### 9.1 `<label>` không gắn `htmlFor`

~30 chỗ, đặc biệt là **label bọc input** (implicit label — vẫn nhận được, nhưng không có `id` ⇒ không `aria-describedby` được, và click vào text không nhảy focus như mong đợi ở một số trình duyệt):
```
src/pages/account/address-form/AddressFormPage.tsx:122,135,151,170,190,208
src/features/edit-vendor-settings/ui/VendorLegalSettingsTab.tsx:41,53,59,63,73,78
src/features/edit-vendor-settings/ui/VendorShippingSettingsTab.tsx:36
src/features/edit-vendor-settings/ui/VendorConditionsSettingsTab.tsx:46
src/features/write-review/ui/ReviewForm.tsx:47,58,68
src/features/resolve-disputes/ui/DisputeResolutionModal.tsx:64,68,81,94
src/pages/vendor/disbursements/VendorDisbursementsPage.tsx:92,112,124
src/features/edit-product/ui/ProductSupplyFields.tsx:38,42
src/pages/account/deposit-payment/DepositPaymentPage.tsx:133,151
src/pages/account/order-dispute/OrderDisputePage.tsx:217
```

### 9.2 Thiếu `aria-*` trên form

- `Select` không có `aria-invalid` / `aria-describedby` (trong khi `Input` đã có đầy đủ) → **không nhất quán**.
- Radio group ở `DisputeResolutionModal` dùng `id="decision-label"` nhưng không có `role="radiogroup"` / `aria-labelledby`.
- Nhiều `<button>` icon chỉ có `title`, không có `aria-label` (title không được trình đọc màn hình đọc nhất quán).

### 9.3 Vùng focus

`:focus-visible` toàn cục dùng `outline: 2px solid var(--color-primary)` — tốt. Nhưng:
- `Select`/`Input` dùng `box-shadow: var(--shadow-glow)` (vàng 18%) **và** vẫn nhận outline global → 2 vòng focus cùng lúc, trông rối.
- `.mk-on-brand` định nghĩa trong `global.css` nhưng **không nơi nào dùng** → class chết.

### 9.4 Focus ring trên nền tối

`--color-primary` ở dark mode = `#e0574b` → trên nền `#140e0a` contrast ≈ 4.9 ✅ OK.

---

## 10. P2 — NHÂN BẢN & BOT "AI SLOP"

Ngoài mã spec, còn một số dấu hiệu khác:

1. **Copy thừa lặp kiểu marketing**: "Moonkage — Sàn bánh trung thu", "HỢP TÁC KINH DOANH", "Bán hàng trên Moonkage" xuất hiện ở header, footer, hero, eyebrow — cùng một thông điệp 4 lần trên 1 màn hình.
2. **Trang "deferred" hiển thị nguyên văn đặc tả ra UI**:
   - `AdminVouchersPage.tsx:40,53` — trích nguyên văn `FR-13`, `FR-50`, `BR-32` cho người dùng đọc.
   - `VendorCapacityPage.tsx:48` — `FR-37` trong nhóm "đã hoãn".
   → Cần quyết định: ẩn khỏi prod, hoặc viết lại thành thông báo sản phẩm.
3. **Nhãn hành động nhập ký đặc tả**:
   - `AdminProductsPage.tsx:93` — `ℹ️ <strong>BR-24:</strong>` giữa giao diện người dùng.
   - `VendorLegalSettingsTab.tsx:75` — 🛡 ngay cạnh nhãn form.
4. **Placeholder quá chung**: `"Lorem"`-style như `"Chọn tỉnh"`, `"Nhập ghi chú"` — không có ví dụ định dạng cụ thể cho người Việt (ví dụ `0912 345 678`, `Công ty TNHH ABC`).

---

## 11. KẾ HOẠCH FIX — THEO ƯU TIÊN

### Giai đoạn 0 — Chặn (1–2 ngày)

| # | Việc | File | Ưu tiên |
|---|---|---|---|
| 0.1 | Fix race `SessionBridge` ↔ guard (đã có fix đề xuất ở §2.1) | `app/guards/RequireAuth.tsx`, `RequireAdmin.tsx`, `RequireNfc.tsx` | **P0** |
| 0.2 | Test hồi quy: reload trên `/tai-khoan/*`, `/kenh-ban/*`, `/quan-tri/*` với token hợp lệ → phải ở lại | `app/guards/__tests__/` | **P0** |
| 0.3 | Gỡ mã spec khỏi toàn bộ chuỗi hiển thị (45 chỗ / 32 file) | xem §3 | **P0** |
| 0.4 | Script `check-no-spec-ids.mjs` + nối vào `npm run check` | `web/scripts/` | **P0** |
| 0.5 | Thêm script `check-design-tokens.mjs`: chặn hex hardcode, radius ngoài thang, spacing px trong `shared/ui` | `web/scripts/` | P1 |

### Giai đoạn 1 — Design system (3–5 ngày)

| # | Việc | File | Ưu tiên |
|---|---|---|---|
| 1.1 | Fix contrast: `--color-gold`, `--color-text-subtle`, thêm `--color-gold-text` | `app/styles/tokens.css` (+ `tokens-dark.css`) | **P1** |
| 1.2 | Chuẩn hoá thang tiêu đề, hạn chế Playfair về 1 element/trang | `app/styles/global.css` | **P1** |
| 1.3 | Nâng `.eyebrow` / `.badge.sm` / `.brandTagline` từ 11px → 12px | ~14 file | **P1** |
| 1.4 | Thay 41 emoji bằng `Icon` | xem §8 | **P1** |
| 1.5 | Chuẩn hoá bo góc (`8px`→`--radius-md`, `20px`→`--radius-xl`) | ~12 file | P2 |
| 1.6 | Chuẩn hoá spacing trong `shared/ui` sang `--space-*` | 7 file | P2 |
| 1.7 | Xoá token chết: `--text-md`, `.mk-on-brand`; hoặc đưa `--color-zone` vào dùng thật | `tokens.css`, `global.css` | P2 |
| 1.8 | Áp `--color-zone` cho `.title`, sidebar active, tab active theo khu | `pages/**`, `widgets/sidebar/**` | P2 |

### Giai đoạn 2 — Form controls (4–6 ngày)

| # | Việc | File | Ưu tiên |
|---|---|---|---|
| 2.1 | Viết `Select` custom listbox (role=combobox/listbox, keyboard nav, `aria-activedescendant`) | `shared/ui/Select/` | **P1** |
| 2.2 | `Select` bổ sung: `placeholder`, `optgroup`, `aria-invalid`, `aria-describedby`, `id` từ `useId` | `shared/ui/Select/Select.tsx` | **P1** |
| 2.3 | Migrate 11 control `<select>` thô → `Select` | 7 file (xem §4.1) | **P1** |
| 2.4 | Viết `Checkbox` + `Radio` trong `shared/ui` (accent `var(--color-primary)`) | `shared/ui/Checkbox/`, `Radio/` | **P1** |
| 2.5 | Migrate 30+ input[type=checkbox|radio] thô → component | ~14 file | P1 |
| 2.6 | Viết `Textarea` (đang dùng `<textarea>` thô, không style) | `shared/ui/Textarea/` | P2 |
| 2.7 | `label` + `htmlFor` + `id` cho 30 chỗ | xem §9.1 | P3 |
| 2.8 | Bỏ focus ring trùng: `Select`/`Input` dùng `--ring` thay `--shadow-glow` | `Select.module.css`, `Input.module.css` | P3 |

### Giai đoạn 3 — Responsive (4–6 ngày)

| # | Việc | File | Ưu tiên |
|---|---|---|---|
| 3.1 | Thêm 4 breakpoint chuẩn vào tokens | `app/styles/tokens.css` | P1 |
| 3.2 | **Header responsive** + hamburger menu (mobile drawer) | `widgets/header/**` | **P1** |
| 3.3 | Sidebar vendor/admin → drawer trên mobile | `widgets/sidebar/**` | P1 |
| 3.4 | Grid dùng `auto-fill, minmax(...)` | ~12 file grid | P1 |
| 3.5 | Bảng: `overflow-x` + `min-width` + cân nhắc card-view trên mobile | 7 file table | P1 |
| 3.6 | Audit 47/63 page CSS không có media query | 47 file | P2 |

### Giai đoạn 4 — Bảng & layout dùng chung (3–4 ngày)

| # | Việc | File | Ưu tiên |
|---|---|---|---|
| 4.1 | `DataTable` trong `shared/ui` (header sticky, zebra, sort, empty, loading, responsive) | `shared/ui/DataTable/` | P2 |
| 4.2 | Migrate 7 bảng hiện tại → `DataTable` | xem §7.3 | P2 |
| 4.3 | `PageHeader` component (eyebrow + title + description + actions) — hiện 54 file tự viết `.title`/`.header` | `shared/ui/PageHeader/` | P2 |
| 4.4 | `PageLayout` component (`.page`/`.pageGrid`) — 31 file tự viết | `shared/ui/PageLayout/` | P2 |
| 4.5 | Thống nhất `.title`: 39 file `--text-2xl`, 9 file `--text-xl`, 3 file `--text-3xl` → 1 quy ước | 48 file | P2 |

### Giai đoạn 5 — Nội dung & polish (2–3 ngày)

| # | Việc | File | Ưu tiên |
|---|---|---|---|
| 5.1 | Quyết định & viết lại 3 trang trích dẫn đặc tả (`AdminVouchers`, `VendorCapacity`, `PolicyPage`) | 3 file | P1 |
| 5.2 | Bỏ `ℹ️ BR-24:`, `FR-49` khỏi toast/thông báo | ~8 file | P1 |
| 5.3 | Rà lại copy trùng lặp (header + footer + hero cùng thông điệp) | `widgets/header`, `footer`, `pages/base/home` | P2 |
| 5.4 | Placeholder có ví dụ định dạng thật | ~20 form | P2 |
| 5.5 | `a11y`: axe scan toàn bộ route | `e2e/` | P2 |

### Giai đoạn 6 — Gate chất lượng (liên tục)

```jsonc
// web/package.json — thêm vào "check"
"check:spec-ids": "node scripts/check-no-spec-ids.mjs",
"check:design-tokens": "node scripts/check-design-tokens.mjs",
"check:a11y": "playwright test e2e/a11y.spec.ts"
```

---

## 12. ĐỐI CHIẾU VỚI VẤN ĐỀ NGƯỜI DÙNG NÊU

| Người dùng nói | Đối chiếu |
|---|---|
| *"dropdown vẫn chưa tùy chỉnh style"* | ✅ Đúng — 11 control `<select>` native `appearance: auto`, popup do OS vẽ, không style được. §4 |
| *"font chữ có chuẩn thiết kế dễ nhìn trực quan"* | ⚠️ Font đã chọn tốt (Be Vietnam Pro + Playfair) nhưng phân cấp lộn xộn: H4 (14px) < body (16px), mix sans/serif cho cùng cấp tiêu đề, `--color-gold` contrast 3.19:1 trên 92 chỗ, 11px ở eyebrow. §5 |
| *"hạn chế AI"* | ✅ Đúng — 41 emoji render khác nhau theo OS, 45 chỗ lộ mã đặc tả `FR-06`/`M6.1.3`, copy marketing lặp 4 lần/màn hình. §8, §10 |

---

## 13. NHỮNG GÌ **KHÔNG** CẦN LÀM

- **Không** viết lại design system — nền tảng token rất tốt.
- **Không** đổi font — Be Vietnam Pro + Playfair Display là lựa chọn đúng, có đủ dấu tiếng Việt.
- **Không** thay gradient/hiệu ứng — thương hiệu "Trung Thu" là có chủ đích; chỉ cần giảm *mức độ* dùng (`.primary::after` shine sweep trên mọi nút chính là hơi nhiều).
- **Không** xoá emoji trong `PageLoader`/error page nếu đã đổi sang `Icon` — giữ nguyên ngữ nghĩa.
- **Không** sửa 6 lỗi ESLint/`oxlint` còn lại — không liên quan UI.

---

## 14. TRẠNG THÁI THỰC HIỆN (cập nhật 05/11/2026)

Các hạng mục dưới đây **đã được sửa** trong codebase. Gate chất lượng `npm run check`
(lint + CSS module + spec-ID gate + typecheck + 81 test file / 314 test + build + bundle size)
chạy xanh.

### 14.1 Giai đoạn 0 — Chặn (P0) ✅

| # | Việc | Kết quả |
|---|---|---|
| 0.1 | Fix race `SessionBridge` ↔ guard | `RequireAuth` / `RequireAdmin` / `RequireNfc` **chờ** session thay vì redirect khi `status === 'loading'` |
| 0.2 | Test hồi quy reload | `app/guards/__tests__/` — reload trên `/tai-khoan/*`, `/kenh-ban/*`, `/quan-tri/*` với token hợp lệ vẫn ở lại |
| 0.3 | Gỡ mã spec khỏi chuỗi hiển thị | 45 chỗ / 32 file đã sạch; copy thay bằng ngôn ngữ người dùng |
| 0.4 | Script `check-no-spec-ids.mjs` | `web/scripts/check-no-spec-ids.mjs` — nối vào `npm run check` |
| 0.5 | Script `check-design-tokens.mjs` | **Chưa làm** (P1) |

### 14.2 Giai đoạn 1 — Design system (P1) ✅

| # | Việc | Kết quả |
|---|---|---|
| 1.1 | Contrast WCAG AA | Thêm `--color-gold-text` (`#855f16` sáng / `#e8bf74` tối); `--color-text-subtle` đạt ≥ 4.59:1; `--color-gold-hover`, `--color-success`, `--color-warning` hiệu chỉnh lại; 29 CSS module chuyển `color: var(--color-gold)` → `var(--color-gold-text)` |
| 1.2 | Thang tiêu đề | `global.css`: `h1`–`h6` dùng `--font-sans`, thang giảm dần (`2xl`→`xs`); hạn chế `--font-display` cho hero/brand |
| 1.3 | Micro-text 11px → 12px | 31 chỗ `0.6875rem` → `var(--text-xs)` trong 25 file |
| 1.4 | Emoji → `Icon` SVG | **45/45 emoji đã thay**; thêm icon `key`, `pen`, `palette`, `bank`; tạo `shared/ui/StarRating` thay `★`/`☆` |
| 1.5 | Chuẩn hoá bo góc | **Đã làm** — 8 CSS module trang (8px → `--radius-md`, 20px → `--radius-xl`); các giá trị px còn sót (`2px`/`4px`) → `--radius-xs` |
| 1.6 | Chuẩn hoá spacing `shared/ui` | **Đã làm** — 20 chỗ px → `--space-*`; chỉ còn vài lệch micro (`margin: -1px` cho căn nhãn, `gap: 1px` cho dải sao) vì chúng không ánh xạ được 1-1 với token |
| 1.7 | Token chết | **Đã làm** — gỡ `--text-md` (giữ `--text-base` làm chuẩn) và `.mk-on-brand` khỏi `global.css` |
| 1.8 | Áp `--color-zone` | **Đã làm** — xem §17.2 (giữ hệ màu theo khu, đưa vào sidebar + tab + tiêu đề + eyebrow) |

### 14.3 Giai đoạn 2 — Form controls (P1) ✅

| # | Việc | Kết quả |
|---|---|---|
| 2.1 | `Select` custom listbox | `shared/ui/Select/Select.tsx` viết lại hoàn toàn: `role="combobox"` + `aria-expanded` + `aria-controls` + `aria-activedescendant`, `role="listbox"`/`role="option"`, điều hướng ↑ ↓ Home End Enter Escape Tab, bỏ qua option `disabled` |
| 2.2 | `Select` bổ sung | `placeholder`, `groups` (optgroup), `hideLabel`, `aria-invalid`, `aria-describedby`, `id` tự sinh từ `useId`, `name` (hidden input cho form) |
| 2.3 | Migrate `<select>` thô | **11/11 control đã migrate** — 7 file: `AddressFormPage`, `ReviewForm`, `VendorDisbursementsPage`, `DisbursementRequestModal`, `CatalogPage`, `LegalIdentityFields`, `ProductDeliveryDescription`. `rg "<select" src` → **0 kết quả** |
| 2.4–2.5 | `Checkbox` / `Radio` component | **Đã làm** — `shared/ui/Checkbox/` + `shared/ui/Radio/`, giữ `<input>` native, tô màu bằng `accent-color: var(--color-primary)`; `htmlFor`/`id` tự sinh, `aria-invalid`/`aria-describedby` tự gắn; **14/14** chỗ dùng thô đã migrate |
| 2.6 | `Textarea` component | **Đã làm** — `shared/ui/Textarea/` (khớp style `Input`); **tất cả** `<textarea>` thô đã migrate (`rg "<textarea" src` chỉ còn trong chính component) |
| 2.7 | `label` + `htmlFor` | **Đã làm** — ~15 label còn thiếu đã gắn `htmlFor`/`id` (`AddressFormPage`, `LegalIdentityFields`, `LegalBankFields`, `AdminOpeningFeePage`, `VendorDisbursementsPage`, `DisbursementRequestModal`, `UploadMaketModal`, `AttachInvoiceModal`); nhóm radio/pill chuyển sang `role="radiogroup"` + `aria-labelledby` |
| 2.8 | Bỏ focus ring trùng | `Select`/`Input`/`Textarea` dùng `var(--ring)` + `var(--color-primary)` thay `--shadow-glow`; `global.css` tắt `outline` cho control đã có vòng riêng |

### 14.4 Giai đoạn 3 — Responsive (P1) ✅ một phần

| # | Việc | Kết quả |
|---|---|---|
| 3.1 | Breakpoint token | Thêm `--breakpoint-sm/md/lg/xl` vào `tokens.css` |
| 3.2 | Header responsive + hamburger | `HeaderMobileNav.tsx` — drawer trượt từ phải, đóng bằng X / bấm ra ngoài / Escape, khoá cuộn trang, focus trả về trigger; `Header.module.css` có 4 media query (`1024px` / `768px` / `560px` / `400px`) |
| 3.3 | Sidebar → drawer | **Đã làm** — `widgets/sidebar/ui/SidebarDrawer.tsx` (portal, `role="dialog"`, `aria-modal`, focus trap/return, khoá cuộn trang, Escape, bấm ra ngoài); `VendorSidebar`/`AdminSidebar` tách phần nội dung dùng chung; E2E `flow-08-sidebar-drawer.spec.ts` |
| 3.4 | Grid tự wrap | **Đã làm** — 17 grid `repeat(N, 1fr)` → `repeat(auto-fill/auto-fit, minmax(…))` (catalog, home, vendor list/detail, overview, money, requests, bulk hub, admin/vendor overview…) |
| 3.5 | Bảng cuộn ngang | **Đã làm** — 7/7 bảng có `overflow-x: auto` + `min-width` (560–720px); `AdminInterprovinceFeePage` thêm `overflow-x` (trước đó chỉ `overflow-y`) |
| 3.6 | Media query cho trang | **Đã làm** — đợt 4 thêm vào 13 file trọng yếu (cart, checkout, product detail, catalog, vendor detail, vendors list, orders list, vendor overview, checkout UI, vendor/admin layout). Đợt 5 (§17.9) quét lại toàn bộ 132 CSS Module, thêm media query cho 14 file thực sự dễ vỡ, và thêm gate `scripts/check-responsive.mjs` |

### 14.5 Kiểm thử

- `shared/ui/Select/__tests__/Select.test.tsx` — 10 test: label/`htmlFor`, placeholder, mở listbox, `onChange`, điều hướng bàn phím, Escape, option `disabled`, `aria-invalid`/`aria-describedby`, optgroup, controlled value.
- `e2e/helpers.ts` — thêm `selectOptionByLabel()` cho listbox tự dựng (Playwright `selectOption()` không dùng được).
- `e2e/flow-05-disputes.spec.ts` — cập nhật theo API mới.

---

## 15. ĐỢT 2 — DỌN DỮ LIỆU ẢO (05/11/2026)

Câu hỏi người dùng: *"những phần này có cần thiết khi dùng dữ liệu BE thực tế không, và tại sao đã xóa hết các mock thừa rồi mà vẫn còn hiện 1 số dữ liệu ảo. kiểm tra lại toàn bộ các màn hình"*.

### 15.1 Trả lời: phần nào cần, phần nào không

| Loại | Ví dụ | Giữ hay bỏ |
|---|---|---|
| **Copy marketing** (không phải dữ liệu) | Hero "100% Bánh tươi mới nướng" / "NFC Định danh an toàn" / "VNPay Giữ tiền đảm bảo", ảnh `hero.jpg`, `xuong.jpg`, mô tả "Từ 20 đến 10.000 hộp" | **Giữ** — đây là thông điệp thương hiệu tĩnh, không mô phỏng dữ liệu nghiệp vụ |
| **Dữ liệu nghiệp vụ bịa** | "Đã bán 0 hộp", "★ 0 (0 đánh giá)", CCCD `0011••••9876`, tên shop "Tiệm Bánh Thủ Công Hương Xưa", bảng giá 160.000/145.000/130.000 | **Bỏ / ẩn** — BE không có field đó, hiện ra là con số bịa |
| **Ô nhập được điền sẵn** | MST `0201199281`, CCCD `031182001928`, số tài khoản `0123456789`, 4 tỉnh `['01','24','33','31']`, phí `25000` | **Bỏ** — người dùng có thể submit nguyên hồ sơ bịa mà không hề biết |
| **Trường không được lưu** | "Tỷ lệ hoa hồng sàn (%)", "Tỷ lệ đặt cọc mặc định (%)" | **Bỏ** — máy chủ không có endpoint lưu, người dùng tưởng đã thiết lập |

### 15.2 Nguyên nhân gốc — vì sao xóa mock xong vẫn còn dữ liệu ảo

1. **Fallback trong mapper**: `productApi.ts` điền `soldCount: 0` vì `ProductListingResponse` không có field này; `vendorCatalogApi.ts` điền `rating: 0, reviewCount: 0` vì `SupplierResponse` không có. UI hiển thị nguyên số 0 như dữ liệu thật.
2. **Fallback chuỗi trong JSX**: `user.idCardNumberMasked || '0011••••9876'` — người dùng tưởng đó là CCCD của họ.
3. **`useState` khởi tạo bằng dữ liệu demo**: nhà phát triển điền sẵn để dễ xem, rồi quên xoá.
4. **Chỗ chết trong UI**: `VendorLegalSettingsTab` hiển thị dữ liệu giả và nút "Lưu" **không gọi máy chủ**; `bulkSamplePriceTiers` không bao giờ được nạp nên bảng "Bậc giá tham khảo" luôn trống.

### 15.3 Danh sách sửa

| # | Vấn đề | Sửa |
|---|---|---|
| 1 | `soldCount: 0` hiện "Đã bán 0 hộp" | `ProductCard` / `ProductDetailPage`: ẩn khi `soldCount === 0` |
| 2 | `rating: 0, reviewCount: 0` hiện "★ 0 (0 đánh giá)" | `HomePage` / `VendorsListPage` / `VendorDetailPage`: ẩn khi bằng 0 |
| 3 | CCCD giả `0011••••9876` | `ProfilePage` / `NfcSessionCard` → "Chưa có dữ liệu" |
| 4 | Ô "Tỷ lệ hoa hồng sàn (%)" | Gỡ khỏi `AdminOpeningFeePage` (BE chỉ có `amount`; BR-10: sàn không thu hoa hồng) |
| 5 | Phí mở bán fallback `200000` | `AdminOpeningFeePage` / `VendorFeePage`: đọc thật từ `GET /api/registration-fee-config`, chưa tải thì để trống |
| 6 | Hồ sơ pháp lý giả | `VendorSettingsPage`: nạp từ `GET /api/vendors/{vendorId}`; tab Pháp lý dùng `LegalProfileForm` thật (đọc/ghi qua API) |
| 7 | `VendorLegalSettingsTab` (bản sao chết) | **Xoá file** — nút "Lưu" không hề gọi máy chủ |
| 8 | Vùng giao giả `['01','24','33','31']`, phí `25000` | `VendorZonesSettingsPage`: nạp từ `GET .../delivery-areas` + `GET /api/vendors/{vendorId}` |
| 9 | Bảng giá bậc giả `160000/145000/130000` | `VendorBulkTermsSettingsPage`: nạp `orderProfile.priceTiers`; bỏ bậc trống thay vì gửi `unitPrice: 0` |
| 10 | Báo giá điền sẵn `160000` / `2026-11-08` / ghi chú "hộp quà cao cấp ép kim" | `VendorRequestDetailPage` / `SubmitQuoteModal`: để trống + validate bắt buộc đơn giá / ngày giao / phương thức |
| 11 | RFQ điền sẵn `150` hộp / `160000` / "logo_aurora_vector.pdf" | `NewQuoteRequestPage` / `DirectQuoteRequestPage`: để trống; `QuoteRequestPackagingCard` bỏ khối upload giả (BE chưa có endpoint tệp cho RFQ) |
| 12 | Hồ sơ đăng ký bán giả (shopName, MST, CCCD, STK) | `SellRegisterPage`: mọi trường phải tự nhập |
| 13 | `bulkMinQuantity \|\| 20`, `leadTimeDays \|\| 5` | `VendorDetailPage` → "Chưa khai báo" |
| 14 | `vendor.bulkSamplePriceTiers` không bao giờ được nạp | `vendorCatalogApi.ts`: parse `refPriceTiers` (JSON thô từ BE) |
| 15 | `status \|\| 'PENDING'`, tên "Xưởng bánh" | `VendorOverviewPage` / `vendorCatalogApi.ts`: lấy thật, thiếu thì nói rõ |
| 16 | Radio "Chỉ bán lẻ" lặp 2 lần | `VendorConditionsSettingsTab`: gỡ bản lặp |
| 17 | 6 ảnh `public/images` không được tham chiếu | Xoá (`banh-deo`, `banh-nuong`, `doanh-nghiep`, `hop-qua`, `sau-rieng`, `tra-xanh`) — giữ `hero.jpg`, `xuong.jpg` |

### 15.4 Quy tắc áp dụng từ nay

- **Số 0 từ máy chủ ≠ số 0 thật.** Nếu BE không trả field, mặc định 0 và **ẩn khối hiển thị** thay vì in ra "0".
- **Ô nhập không được điền sẵn dữ liệu nghiệp vụ.** Chỉ điền sẵn giá trị đến từ hồ sơ máy chủ (`user.name`, `user.phone`) hoặc hằng số hệ thống (`DEFAULT_PROVINCE_CODE`).
- **Ô nhập không có endpoint lưu thì không hiện.** Kiểm tra contract BE trước khi thêm field vào form.
- **Placeholder trung tính thay vì nội dung bịa**: "Chưa có dữ liệu", "Chưa khai báo", "Khách không nêu yêu cầu riêng" — không có số/địa chỉ/tên riêng giả.

### 15.5 Gate

`npm run check` chạy xanh: lint + CSS module + spec-ID gate + typecheck + 81 test file / 314 test + build + bundle size.

---

## 16. ĐỢT 3 — LỖI CHẶN DỮ LIỆU THẬT (05/11/2026)

Sau khi dọn dữ liệu ảo, chạy E2E trên bản build thật (`vite preview`, cổng 4173) phát hiện **17 test đỏ**. Nguyên nhân không nằm ở UI mà ở **tầng kết nối** — mọi màn hình đều "đúng" nhưng không tải được dữ liệu.

### 16.1 CSP `connect-src 'self'` chặn toàn bộ request tới gateway

**Triệu chứng:** mọi trang hiện `Không thể tải dữ liệu / Network Error`. Console:

```
Connecting to 'http://localhost:8080/catalog-service/api/products?...' violates
the following Content Security Policy directive: "connect-src 'self'". The action has been blocked.
```

**Nguyên nhân:** `main.tsx` gọi `applyCspMeta()` **không truyền nguồn API**:

```ts
if (import.meta.env.PROD) {
  applyCspMeta();   // ← connect-src chỉ có 'self'
}
```

Gateway chạy khác origin (khác cổng) nên `'self'` chặn mọi XHR/fetch. Ở **dev** (`import.meta.env.PROD === false`) CSP không được áp dụng nên lỗi này ẩn — chỉ lộ ra ở bản build, tức là trên production thật.

**Sửa:** thêm `cspConnectSources()` và `cspImageSources()` trong `shared/config/security.ts`, lấy từ `VITE_API_BASE_URL` / `VITE_WS_URL` / `VITE_MEDIA_BASE_URL` — **cùng nguồn** với phần cấu hình mà `apiClient` dùng, nên CSP không bao giờ lệch với nơi app thực sự gọi.

| Vấn đề | Trước | Sau |
|---|---|---|
| API gateway | `connect-src 'self'` | `connect-src 'self' http://localhost:8080 ws://localhost:8080` |
| Ảnh MinIO | `img-src 'self' data: blob:` | `img-src 'self' data: blob: http://localhost:9000` |

### 16.2 Gateway chặn GET `/api/suppliers` cho khách

`SupplierController` ghi rõ *"Works for a guest too (no X-Account-Id)"*, nhưng gateway chỉ `permitAll` cho `/api/products/**`. Khách vào `/don-vi-cung-cap` → 401 → trang lỗi.

**Sửa:** thêm vào `SecurityConfig.java`:

```java
// FR-14: the list of suppliers that take custom orders is public
.pathMatchers(HttpMethod.GET,
    "/api/suppliers", "/api/suppliers/**",
    "/quotation-service/api/suppliers", "/quotation-service/api/suppliers/**")
.permitAll()
```

### 16.3 `/gio-hang` gọi API của tài khoản khi khách

`GET /api/carts/me` chỉ dành cho người đã đăng nhập. Khách mở `/gio-hang` → 401 → trang hiện "Network Error" thay vì giỏ rỗng.

**Sửa:** `cartApi.getMine()` bỏ qua request khi vault không có token, trả `{ groups: [] }` ngay.

### 16.4 `/api/vendors//products` — URL sai khi chưa có gian hàng

`useVendorProducts(vendorId)` gọi API ngay cả khi `vendorId` rỗng (tài khoản chưa mở Shop) → URL `/api/vendors//products` → 404.

**Sửa:** không gọi API khi `vendorId` rỗng.

### 16.5 Form báo giá redirect NFC trước khi validate

`NewQuoteRequestPage.handleSubmit` kiểm tra NFC **trước** khi validate trường bắt buộc → người dùng thiếu thông tin bị đưa sang trang xác minh, mất toàn bộ dữ liệu đã điền, và không ai báo họ thiếu gì.

**Sửa:** validate trước, kiểm tra NFC sau.

### 16.6 `/gio-hang` không có `h1` khi giỏ trống

`h1` nằm **trong** nhánh `loaded` của `AsyncState` → khi giỏ rỗng, trang không có tiêu đề cấp 1 (vi phạm accessibility, và `foundation.spec.ts` bắt được).

**Sửa:** đưa `h1` ra ngoài `AsyncState` để luôn có mặt.

### 16.7 Lỗi trong test E2E (không phải lỗi app)

| Lỗi | Nguyên nhân | Sửa |
|---|---|---|
| `apiGet` trả `<!doctype ...> is not valid JSON` | Đường dẫn tương đối bị `vite preview` trả về `index.html` (SPA fallback) | Thêm `gatewayUrl()` — luôn dùng URL tuyệt đối |
| FLOW 6 không thấy hướng dẫn 3 bước | Test đăng nhập `member1` — **đã** định danh nên trang hiện kết quả thành công | Tách persona: `buyerWithoutNfc` (`member2`) để test phần hướng dẫn, `buyer` (`member1`) để test kết quả |
| FLOW 7 mở form thêm sản phẩm timeout | Test đăng nhập `member1` — tài khoản mua lẻ, **không có gian hàng** | Dùng `SEED_ACCOUNTS.vendor` (`member4` — đã duyệt, đã đóng phí) |

### 16.8 Kết quả

```
npm run check    → 81 test file / 321 test xanh, build OK, bundle 1019 kB / 1100 kB
npx playwright test → 42/42 xanh
```

---

## 17. ĐỢT 4: HOÀN THIỆN DESIGN SYSTEM & RESPONSIVE (05/11/2026)

Đợt này đóng các hạng mục còn lại của §11 (giai đoạn 1–5): token, form control, responsive và copy.
Phạm vi chỉ trong `web/`.

### 17.1 Token & design system

| Hạng mục | Thay đổi |
|---|---|
| Bo góc | 8 CSS module trang: `8px` → `var(--radius-md)`, `20px` → `var(--radius-xl)`. Các giá trị px còn sót trong toàn bộ `src/` (`2px`, `4px` ở sitemap / header / command palette / home / nfc simulator) → `var(--radius-xs)`. Chỉ giữ nguyên `40px`/`28px` ở `NfcPhoneSimulator` vì đó là bo góc mô phỏng điện thoại, không phải bo góc UI. |
| Spacing `shared/ui` | 20 chỗ px → `--space-*`. Còn lại vài lệch micro không ánh xạ 1-1 với token (`margin: -1px` để căn nhãn với control, `gap: 1px` cho dải sao) — giữ nguyên có chủ đích. |
| Token chết | Gỡ `--text-md` (alias trùng `--text-base`) và `.mk-on-brand` khỏi `global.css`. `rg "text-md\|mk-on-brand" src` → 0 kết quả. |
| Focus ring | `global.css` giữ **một** vòng duy nhất: `outline: 2px solid var(--color-primary)` và tắt `outline` cho `input/select/textarea` (vì chúng đã tự vẽ vòng bằng `box-shadow: var(--ring)`). Không còn hiện trạng hai vòng focus chồng lên nhau. |
| Font | Tiêu đề trang (`.title`) ở 39 file chuyển từ `--font-heading`/`--font-display` → `--font-sans`. `--font-display` (Playfair) giữ lại đúng vai trò: logo/brand ở header & footer, hero trang chủ, mô phỏng điện thoại NFC, số thứ tự bước. Mỗi trang chỉ còn **một** điểm nhấn serif. |

### 17.2 Quyết định về `--color-zone` — **giữ lại và đưa vào sử dụng thật**

Audit §6.3 nêu `--color-zone` là "token chết". Có hai lựa chọn: xoá, hoặc làm cho nó có ý nghĩa.
**Chọn phương án thứ hai**, vì ba khu thực sự có ngôn ngữ thị giác khác nhau và đây là tín hiệu định hướng, không phải trang trí:

| Khu | `--color-zone` | `--color-zone-soft` |
|---|---|---|
| `base` (mua hàng) | `--color-primary` (đỏ thương hiệu) | `--color-primary-soft` |
| `vendor` (người bán) | `--color-gold-text` (vàng đồng) | `--color-gold-soft` |
| `admin` (quản trị) | `--color-info` (xanh mực) | `--color-info-soft` |

Áp dụng vào **ba vị trí dùng nhất trong mỗi khu**:

1. **Sidebar** — nền header, mục đang chọn, badge số việc chờ, màu khi hover.
2. **Tab đang chọn** (`shared/ui/Tabs`) — trước đây luôn dùng `--color-primary`; nay theo khu.
3. **Tiêu đề trang + nhãn eyebrow** — 11 trang Vendor/Admin đổi `color: var(--color-primary-dark)` → `var(--color-zone)`.

Tất cả đều dùng token sẵn có (đã qua kiểm tra contrast ở §5.3) ⇒ **không phát sinh màu mới, không phát sinh rủi ro contrast**. Đổi màu khu giờ chỉ cần sửa một chỗ trong `tokens.css`.

### 17.3 Form control — quyết định giữ `<input>` native

`Checkbox` và `Radio` **không** được viết lại bằng `div` + `role="radio"` mà vẫn giữ `<input type="checkbox|radio">` native, tô màu bằng `accent-color: var(--color-primary)`. Lý do:

1. Input native đã có sẵn hành vi bàn phím đúng (Space chọn, ←/→ chuyển giữa các nút trong cùng `name`) và trạng thái "chỉ chọn được một" cho radio.
2. Viết lại bằng `div` sẽ phải tự quản lý nhóm, roving tabindex và trạng thái `checked` — nhiều code, nhiều cơ hội lỗi a11y.
3. `accent-color` cho phép tô màu theo token, đủ để đồng bộ bảng màu.

Component lo phần còn lại: `htmlFor`/`id` tự sinh, `aria-invalid`/`aria-describedby` tự gắn, bố cục theo token, chế độ `bare` (`display: contents`) cho các control nằm trong card chọn mô hình.

`Textarea` bám sát style `Input` (cùng viền, cùng vòng focus `var(--ring)`, cùng xử lý lỗi).

### 17.4 Responsive

**Sidebar → drawer (§3.3)** — thành phần mới `widgets/sidebar/ui/SidebarDrawer.tsx`:

- Render qua `createPortal` vào `document.body` ⇒ không bị `overflow`/`transform` của vùng chứa cắt, drawer luôn trượt đúng từ mép màn hình.
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` qua `aria-label`.
- Khoá cuộn trang khi mở, trả lại `overflow` cũ khi đóng.
- Đóng bằng: nút X, bấm ra ngoài, phím Escape, bấm một mục (điều hướng sang trang khác).
- Đưa tiêu điểm vào panel khi mở, trả tiêu điểm về nút đã mở khi đóng.
- `VendorSidebar` / `AdminSidebar` được tách: `*SidebarContent` (nội dung dùng chung) + `*Sidebar` (bọc `<aside>` cho desktop). Ở `≤1024px`, sidebar cột cố định `display: none`, layout hiện một thanh công cụ chứa nút mở drawer.

**Grid (§3.4)** — 17 grid `repeat(N, 1fr)` đổi sang `repeat(auto-fill, minmax(…, 1fr))` hoặc `auto-fit` để thẻ tự xuống hàng thay vì bị bóp.

**Bảng (§3.5)** — 7/7 bảng có `overflow-x: auto` + `min-width` (560–720px tùy số cột). `AdminInterprovinceFeePage` trước đó chỉ có `overflow-y: auto` — đã thêm `overflow-x`.

**Media query (§3.6)** — thêm vào 13 file trọng yếu: cart, checkout (+ `checkoutUi`), product detail, catalog, vendor detail, vendors list, orders list, vendor overview, và hai layout Vendor/Admin. Dùng đúng 4 breakpoint chuẩn trong `tokens.css`.

> **Chưa làm:** 105/139 file CSS module còn lại chưa có media query. Đợt này ưu tiên các trang có nhiều dữ liệu, vì các trang còn lại phần lớn là form một cột hoặc trang trạng thái — chúng không vỡ layout khi thu hẹp.
>
> *(Đã cập nhật ở §17.9: đợt 5 quét lại toàn bộ 132 CSS Module và xử lý 14 file thực sự dễ vỡ. Con số 105/139 ở trên là ảnh chụp của đợt 4, không còn đúng.)*

### 17.5 Copy & nội dung (§10)

| Trang | Trước | Sau |
|---|---|---|
| `AdminVouchersPage` | Trích nguyên văn `FR-13`, `FR-50`, `requirements.md`, `VoucherController`, `GET/POST /api/vouchers` cho người dùng đọc | Thông báo sản phẩm: "Mã giảm giá do Moonkage phát hành đã được **hoãn** sang phiên bản sau…" + giải thích người dùng thấy gì trong lúc chờ |
| `VendorCapacityPage` | Nhắc `FR-37` và "nhóm hoãn của phiên bản này" | "Lịch công suất theo từng tuần đã được **hoãn** sang phiên bản sau…" |
| `PolicyPage` | Dùng chữ viết tắt nội bộ: "Maket", "Admin ban hành phán quyết", "bất di biến :" (thừa dấu cách) | "mẫu thiết kế", "đội vận hành Moonkage ban hành phán quyết", "bất di biến:" |

Ngoài ra:

- Placeholder đổi sang ví dụ định dạng Việt Nam thực tế: `0912 345 678`, `Công ty TNHH Bánh Hương Việt`, `Ví dụ: Nguyễn Thị Mai`, `Ví dụ: 500000`, `Ví dụ: 1350000`, `Ví dụ: 1C26TAA-0001293`.
- Gate `scripts/check-no-spec-ids.mjs` vẫn xanh — 0 mã đặc tả lọt vào giao diện.

### 17.6 Kiểm thử

| Hạng mục | Kết quả |
|---|---|
| `shared/ui/Checkbox/__tests__/` | 8 test — `htmlFor`/`id`, giữ input native, `onChange`, `aria-invalid`/`aria-describedby`, `hideLabel`, `disabled` |
| `shared/ui/Radio/__tests__/` | 6 test — `htmlFor`/`id`, giữ input native, `onChange`, `aria-invalid`/`aria-describedby`, `hideLabel`, `disabled` |
| `shared/ui/Textarea/__tests__/` | 6 test — `htmlFor`/`id`, `onChange`, `aria-invalid`/`aria-describedby`, `hint`, `disabled` |
| `widgets/sidebar/ui/__tests__/SidebarDrawer.test.tsx` | 5 test — ẩn panel, mở + khoá cuộn trang, Escape + trả tiêu điểm, nút X, đóng khi điều hướng |
| `e2e/flow-08-sidebar-drawer.spec.ts` | 3 test — drawer Admin, drawer Vendor, desktop vẫn hiện sidebar cột |

**Kết quả chạy gate:**

```
npm run check    → 85 test file / 347 test xanh, build OK, bundle 1026.5 kB / 1100 kB
npx playwright test → 45 passed / 5 skipped
npx playwright test e2e/foundation.spec.ts → 9 passed
```

### 17.7 Cổng chất lượng mới (chốt hồi quy)

Ba hạng mục trong audit là "sẽ quay lại nếu không có gate". Đợt này biến chúng thành script chạy tự động, nối vào **cả** `npm run check`, **pre-commit hook** và **CI**:

| Script | Chặn cái gì | Vì sao cần |
|---|---|---|
| `scripts/check-contrast.mjs` | Token màu rơi dưới WCAG AA ở theme sáng/tối | §5.3 — `--color-gold` và `--color-text-subtle` từng fail; sửa xong cần chặn quay lại |
| `scripts/check-fsd-layers.mjs` | Import ngược tầng FSD (`shared` → `features`, `entities` → `features`…) | Ranh giới slice là điều kiện để test từng phần độc lập; vi phạm là sinh vòng phụ thuộc |
| `scripts/check-orphan-css.mjs` | File `.module.css` không file nào import | Stylesheet mồ côi là dead code — đọc code tưởng style còn áp dụng |

Đợt 5 (§17.9) bổ sung thêm một cổng nữa:

| Script | Chặn cái gì | Vì sao cần |
|---|---|---|
| `scripts/check-responsive.mjs` | CSS Module có lưới nhiều cột / bảng rộng / width cố định / nhóm nút mà **không** có `@media` | Một layout vỡ trên điện thoại là hồi quy âm thầm — không ai thấy cho tới khi người dùng báo. Gate biến "nhớ thêm media query" thành "CI đỏ" |

Kết quả hiện tại:

```
✓ Mọi token màu chính đạt WCAG 2.1 AA.   (sáng 15.18/5.42/5.50/6.07/3.01 · tối 16.06/6.49/8.17/7.30/9.81)
✓ Ranh giới tầng FSD hợp lệ.
✓ Không còn file CSS Module mồ côi.
✓ Không có mã đặc tả nào lọt vào giao diện.
```

Script `check-orphan-css.mjs` đã phát hiện và xoá **7 file CSS mồ côi thật** cùng 2 thư mục rỗng (`entities/sitemap/`, `pages/system/sitemap/`).

Ngoài ra `vite.config.ts` nâng `testTimeout` 5 s → 15 s: ngưỡng 5 s phản ánh tải máy (test cần ~1,2 s khi chạy riêng nhưng vượt 5 s khi CI chạy song song với Maven), không phản ánh lỗi thật.

### 17.8 Điểm chưa làm & rủi ro còn lại

1. ~~**105/139 CSS module chưa có media query** (§3.6). Đợt này mới xử lý 13 file trọng yếu.~~ → **Đã xử lý ở §17.9**: quét lại toàn bộ 132 CSS Module, thêm media query cho 14 file thực sự dễ vỡ, và thêm gate `scripts/check-responsive.mjs` chặn tái phát. Còn 89/132 file không có `@media` — đã được kiểm chứng là bố cục một cột, không vỡ khi thu hẹp (chi tiết ở §17.9).
2. **`--font-display` vẫn xuất hiện ở 15 chỗ** sau khi rút về 39 tiêu đề trang. Phần lớn là logo/brand (header, footer, auth-shell), hero trang chủ, mô phỏng điện thoại NFC, số thứ tự bước — đều đúng quy tắc "một điểm nhấn serif mỗi trang".
3. **Số breakpoint còn lệch**: `tokens.css` định nghĩa `--breakpoint-sm/md/lg/xl` (480/768/1024/1280) nhưng nhiều file cũ vẫn dùng `500/640/720/860/900/960px`. Chưa chuẩn hoá hết vì đổi hàng loạt sẽ sửa hành vi hiển thị ngoài phạm vi audit.
4. **`AdminInterprovinceFeePage`** dùng `max-height: 480px` + `overflow-y: auto` trên vùng bảng — trên mobile vừa cuộn ngang vừa cuộn dọc lồng nhau, có thể hơi khó dùng.
5. **`Checkbox`/`Radio` dùng `<input>` native** với `accent-color` ⇒ hình dạng do trình duyệt vẽ, không kiểm soát hoàn toàn. Đổi lại giữ nguyên hành vi bàn phím và autofill.

### 17.9 ĐỢT 5 — Quét responsive toàn diện

Đợt 4 (§17.4) chỉ sửa 13 file trọng yếu và để lại con số "105/139 CSS module chưa có media query" — một con số **chưa được kiểm chứng**: nó đếm *thiếu `@media`*, chứ không đếm *thực sự vỡ*. Đợt 5 quét lại **toàn bộ** và đặt câu hỏi đúng: *file nào sẽ hỏng khi bề rộng co lại?*

#### Con số

| Chỉ số | Giá trị |
|---|---|
| CSS Module được quét | **132** (toàn bộ `web/src/**/*.module.css`) |
| Đã có `@media` trước đợt 5 | 29 |
| Đã có `@media` sau đợt 5 | **43** (+14) |
| **Cần media query** (theo luật ưu tiên) | **14** |
| **Được thêm media query** | **14** (100% — không bỏ sót) |
| Chưa có `@media` sau đợt 5 | 89 — trong đó **7** là bảng rộng đã có `overflow-x: auto` (cuộn ngang an toàn), **82** là bố cục một cột / thẻ trạng thái / khối chữ |
| Allowlist | 1 (`shared/ui/Modal/Modal.module.css`) |

#### Luật ưu tiên (rủi ro vỡ layout, không phải số lượng file)

Một file chỉ cần media query khi có **ít nhất một** dấu hiệu sau:

1. **Lưới nhiều cột** — `grid-template-columns` có từ 2 cột tường minh (`1fr 1fr`, `repeat(2, 1fr)`, `280px 1fr`…). Lưới `auto-fit` / `auto-fill` **không tính** vì tự co.
2. **Bảng rộng** — có `min-width` ≥ 480px mà thiếu `overflow-x: auto` để cuộn ngang.
3. **Chiều rộng cố định** — `width` ≥ 480px (không tính `max-width`).
4. **Hàng ngang dễ va chạm** — hàng flex không `flex-wrap` chứa một *nhóm nút* (≥ 2 `Button`/`ButtonLink`/`button`) hoặc *nhóm icon* (≥ 2 `Icon`).

Ngược lại, form một cột, thẻ trạng thái, trang xác nhận và khối chữ thuần **không** cần media query — thêm vào chỉ là noise.

#### 14 file đã thêm media query

| File | Sửa gì |
|---|---|
| `app/layouts/AccountLayout` | `.grid` `280px 1fr` → 1 cột; sidebar bỏ `position: sticky` |
| `entities/order/ui/OrderReviewList` | `.reviewRow` `auto 1fr auto` → 2 cột, ngày xuống dòng sau |
| `entities/product/ui/ProductReviewList` | như trên |
| `features/register-vendor/ui/VendorBusinessTypeStep` | `.typeCards` `1fr 1fr` → 1 cột |
| `features/register-vendor/ui/VendorCompanyInfoStep` | `.grid2` `1fr 1fr` → 1 cột |
| `features/request-quote/ui/QuoteRequestCards` | `.grid2` → 1 cột; thông báo NFC xếp dọc |
| `features/verify-nfc/ui/nfcVerifyUi` | `.unverifiedBox` `auto 1fr` → 1 cột (QR + hướng dẫn) |
| `pages/account/address-form/AddressFormPage` | `.gridTwo` → 1 cột |
| `pages/base/direct-quote-request/DirectQuoteRequestPage` | `.grid2` → 1 cột; giảm padding thẻ chủ |
| `pages/base/sell-intro/SellIntroPage` | `.hero` `1.2fr 0.8fr` → 1 cột |
| `pages/vendor/bulk-terms-settings/VendorBulkTermsSettingsPage` | `.row2` → 1 cột |
| `pages/vendor/product-form/VendorProductFormPage` | `.gridThree` `1fr 1fr 1fr` → 1 cột |
| `pages/vendor/request-detail/VendorRequestDetailPage` | `.formRow` → 1 cột; hàng spec/total cho wrap |
| `widgets/footer/ui/Footer` | `.grid` `2fr 1fr 1fr 1fr` → 2 cột (`≤lg`) → 1 cột (`≤sm`); cột brand tràn hàng; `.bottomBar` xếp dọc |

Tất cả chỉ dùng token `--breakpoint-sm/md/lg` — không có px viết tay trong rule mới.

#### Phát hiện quan trọng: `var()` **không** dùng được trong `@media`

Yêu cầu ban đầu là viết `@media (max-width: var(--breakpoint-md))`. Kiểm chứng bằng Chromium 156 cho thấy điều này **không hoạt động**:

```
375px viewport → @media (max-width: var(--bp))  không khớp (màu gốc)
                @media (max-width: 768px)       khớp     (màu override)
1200px viewport → cả hai đều không khớp
```

CSS không cho phép `var()` trong điều kiện media query — trình duyệt **bỏ qua âm thầm** (không báo lỗi), và `lightningcss` của Vite ném `Invalid media query` lúc minify ⇒ **`npm run build` đỏ**.

Vì vậy thay vì bỏ token, ta **mở rộng token lúc build**: plugin `vite/breakpointTokens.ts` đọc `--breakpoint-*` từ `src/app/styles/tokens.css` và thay `var(--breakpoint-md)` bằng `768px` trước khi `vite:css-post` xử lý CSS (áp dụng cho cả `dev` lẫn `build`).

- Token vẫn là **nguồn sự thật duy nhất** — đổi `tokens.css` là đổi mọi breakpoint.
- CSS nguồn vẫn đọc dễ: `@media (max-width: var(--breakpoint-md))`.
- CSS build ra: `@media (width<=768px)` — kiểm chứng bằng cách đọc `dist/assets/*.css`: **0** token `--breakpoint-*` còn sót.

#### Cổng chất lượng mới: `scripts/check-responsive.mjs`

Nối vào **cả** `npm run check` (ngay sau `check-css-modules.mjs`), **pre-commit hook** và **CI** (`web-quality.yml`, một step riêng sau CSS modules check).

Quy tắc phát hiện — file **không có `@media`** và có ít nhất một dấu hiệu:

| Mã | Điều kiện | Vì sao không báo nhầm |
|---|---|---|
| `GRID` | `grid-template-columns` có ≥ 2 track tường minh | `auto-fit` / `auto-fill` được tính là **1 cột** ⇒ không báo. `repeat(N,…)` đếm đúng N. Hàm lồng nhau (`minmax(…)`) tính là 1 track |
| `TABLE` | `min-width` ≥ 480px **và** file không có `overflow-x: auto` | File đã có wrapper cuộn ngang thì không báo (7 bảng hiện tại đều thuộc nhóm này) |
| `WIDTH` | `width` ≥ 480px (không phải `max-width`) | `max-width` không báo — nó **tự** thu hẹp |
| `ROW` | hàng flex không `flex-wrap` **và** JSX bên trong có ≥ 2 nút hoặc ≥ 2 `Icon` | Đếm trực tiếp trên **JSX** (quét thẻ mở/đóng tương ứng) ⇒ hàng chỉ có chữ không bị báo. Đây là điểm quan trọng: một quy tắc "mọi hàng flex" sẽ báo nhầm ~40 file |

Module **đã có** `@media` thì được miễn trừ — nhiệm vụ của đợt này là *bổ sung*, không phải *ép*.

#### Allowlist

| File | Vì sao an toàn |
|---|---|
| `shared/ui/Modal/Modal.module.css` | `.dialog` có `max-width: 90vw`, nên `.md/.lg/.xl` (520/720/920px) bị chặn còn ~90% bề rộng viewport. Kiểm chứng bằng Chromium: hộp thoại `.lg` (720px) ở viewport 320px **đo ra 288px** — không tràn. Đây là hộp thoại `<dialog>`, luôn vừa màn hình. |

Không có file nào khác cần miễn trừ.

#### Khoảng trống còn lại (nói thẳng)

**89/132 file vẫn không có `@media`.** Đây là kết quả đúng, không phải sót:

- **7 file** là bảng rộng (`EscrowLedgerViews`, `VendorLedgerTable`, `AdminDisbursementsPage`, `AdminInterprovinceFeePage`, `AdminPayoutsPage`, `AdminProductsPage`, `VendorReconciliationPage`) — đã có `overflow-x: auto` + `min-width`, nên bảng cuộn ngang an toàn mà không cần media query.
- **82 file** còn lại là form một cột, thẻ trạng thái, trang xác nhận, khối chữ, trang lỗi — thu hẹp không làm vỡ layout. Thêm `@media` cho chúng chỉ là noise, và noise thì khiến người sau không đọc nổi rule thật.

Rủi ro còn lại của cách làm này: một module hôm nay một cột, ngày mai thêm lưới hai cột mà quên thêm media query — **đó chính là lý do gate `check-responsive.mjs` tồn tại**. Nếu script báo nhầm thì chỉ cần bổ sung `ALLOWLIST` kèm lý do, không phải xoá gate.

#### Kết quả chạy gate

```
npm run check    → oxlint sạch · css-modules OK · responsive OK · orphan-css OK
                   · no-spec-ids OK · contrast OK · fsd OK · tsc OK
                   · vitest xanh · build OK · bundle 1026.5 kB / 1100 kB
npm run e2e      → 45 passed / 5 skipped
```

Tài liệu này được tạo bằng cách đọc source + kiểm tra thực tế trên trình duyệt với API thật. Mọi khẳng định về hành vi đều đã được reproduce, không phải suy đoán.*

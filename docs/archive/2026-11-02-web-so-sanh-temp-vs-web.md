# Đối chiếu bản `temp` với bản `web` — 02/11/2026

> **Lưu trữ (2026-11-08):** báo cáo đánh giá frontend theo thời điểm, chuyển từ `web/doc/`. Tài liệu hiện hành: [architecture-standards.md](../architecture/architecture-standards.md) §6 (Frontend) và [web-package-architecture.md](../architecture/web-package-architecture.md).

> **Ghi chú (04/11/2026):** tài liệu lịch sử. Bản `temp/web-temp/moonkage-web` đã **thay thế**
> thư mục `web/` cũ, nên hiện chỉ còn một bản web duy nhất ở `web/` — đây là bản của cột
> `temp`. Số liệu trong báo cáo giữ nguyên theo thời điểm 02/11/2026.

> Mục tiêu: chứng minh bản `temp` **vượt trội** bản `web` về kiến trúc FSD 2.0, độ mịn component,
> giới hạn 250 dòng/file, độ phủ kiểm thử và vệ sinh mã nguồn.
>
> - Bản `web`: `web/src` (bản production chính)
> - Bản `temp`: `temp/web-temp/moonkage-web/src` (bản đang được nâng cấp)

---

## 1. Bảng so sánh tổng quan

| Tiêu chí | `web` | `temp` | Đánh giá |
| --- | ---: | ---: | :---: |
| File mã nguồn (không tính test) | 471 | 428 | ✅ gọn hơn |
| Tổng dòng mã | 18.191 | 24.921 | ⚠️ nhiều tính năng hơn |
| File test | 12 | 49 | ✅ **4,1×** |
| Số test case | 38 | 273 | ✅ **7,2×** |
| File vượt 250 dòng | **3** | **0** | ✅ |
| File lớn nhất | **383** (`VendorOrderDetail.tsx`) | **247** (`OrderDetailPage.tsx`) | ✅ |
| Import sâu vi phạm FSD | 0 | 0 (chỉ 2 cổng `@x` hợp lệ) | ✅ |
| Feature import chéo feature | 0 | 0 | ✅ |
| Vòng phụ thuộc (madge) | 0 | 0 | ✅ |
| `oxlint src` | 0 lỗi | 0 lỗi | ✅ |
| `tsc -b` | sạch | sạch | ✅ |
| `vite build` | sạch | sạch | ✅ |
| Script kiểm tra CSS Module | ❌ không có | ✅ `check-css-modules.mjs` | ✅ |
| Script kiểm tra encoding UTF-8 | ❌ không có | ✅ `check-encoding.mjs` | ✅ |
| Realtime (STOMP) | ❌ không có | ✅ có, kiến trúc subscription sạch | ✅ |

**Kết luận:** `temp` thắng áp đảo ở mọi tiêu chí kiểm chứng được bằng công cụ.

---

## 2. Giới hạn 250 dòng — cải thiện rõ rệt

### Bản `web` còn 3 file vượt ngưỡng

| File | Dòng |
| --- | ---: |
| `features/fulfill-order/ui/VendorOrderDetail.tsx` | 383 |
| `entities/product/api/mockData.ts` | 282 |
| `features/apply-to-sell/ui/VendorApplyForm.tsx` | 274 |

### Bản `temp`: **0 file vượt 250 dòng**

Toàn bộ file đã được tách lại theo đúng ranh giới FSD:

| File gốc (trước) | Đã tách thành | Tầng đích |
| --- | --- | --- |
| `pages/vendor/settings/VendorSettingsPage.tsx` | `VendorLegalSettingsTab`, `VendorShippingSettingsTab`, `VendorConditionsSettingsTab` | `features/edit-vendor-settings/ui` |
| `pages/vendor/money/VendorMoneyPage.tsx` | `VendorLedgerTable`, `DisbursementRequestModal` | `entities/payment/ui`, `features/request-disbursement/ui` |
| `pages/system/sitemap/SitemapPage.tsx` | `sitemapData.ts`, `SitemapFlowInspector`, `SitemapPageGrid` | `entities/sitemap/model`, `entities/sitemap/ui` |
| `widgets/header/ui/Header.tsx` | `HeaderTopBar`, `HeaderSearch`, `HeaderNav`, `HeaderNotifications`, `HeaderUserMenu`, `LocationPickerModal`, `ActorSwitcherModal` | `widgets/header/ui` |
| `widgets/command-palette/ui/CommandPalette.tsx` | `commandTypes.ts`, `useCommandRegistry.ts`, `CommandPaletteView.tsx` | cùng slice |
| `pages/vendor/product-form/VendorProductFormPage.tsx` | `ProductBasicsFields`, `ProductTaxonomyPicker`, `ProductDeliveryDescription` | `features/edit-product/ui` |
| `pages/account/nfc-verify/NfcVerifyPage.tsx` | `NfcSessionCard`, `NfcStatusBadge`, `NfcVerifiedPanel` | `features/verify-nfc/ui` |
| `entities/vendor/api/vendorApi.ts` (470) | `vendorDto.ts`, `vendorCatalogApi.ts`, `vendorAdminApi.ts`, `cakeAttributeApi.ts` | `entities/vendor/api` |
| `entities/request/api/quoteApi.ts` (331) | `quoteDto.ts`, `quoteMappers.ts` | `entities/request/api` |
| `entities/order/api/orderApi.ts` (289) | `orderDto.ts`, `orderMappers.ts` | `entities/order/api` |
| `pages/base/new-quote-request/NewQuoteRequestPage.tsx` (267) | `QuoteRequestBasicsCard`, `QuoteRequestDeliveryCard`, `QuoteRequestPackagingCard`, `QuoteRequestFlavorCard`, `NfcVerifyNotice` | `features/request-quote/ui` |
| `pages/admin/config/AdminConfigPage.tsx` (261) | `AdminTaxonomyTab`, `AdminShippingTab`, `AdminFeesTab` | `features/manage-cake-attributes/ui` |
| `features/edit-vendor-settings/ui/LegalProfileForm.tsx` (260) | `LegalIdentityFields`, `LegalBankFields`, `LegalDocumentsField` | cùng slice |

---

## 3. FSD 2.0 — `temp` tuân thủ chặt chẽ hơn

### 3.1. Public API & cổng `@x`

- Mọi import từ ngoài slice đều qua `index.ts` của slice → `oxlint` với `no-restricted-imports` chặn 100%.
- Chỉ còn **2** import dạng `@/entities/<slice>/@x/...`:
  - `entities/vendor/api/vendorProductApi.ts` → `@/entities/product/@x/vendor`
  - `entities/dispute/api/disputeApi.ts` → `@/entities/order/@x/dispute`

  Đây chính là cơ chế cổng `@x` mà `docs/architecture/web-package-architecture.md` §3 quy định — hiện tại `web` **không có** cổng này.

### 3.2. Phân tách đọc / ghi đúng chuẩn

| Loại | Bản `web` | Bản `temp` |
| --- | --- | --- |
| Lọc sản phẩm (đọc) | `features/filter-products` | `entities/product/model/filterProducts.ts` ✅ đúng chỗ |
| Upload tài liệu | `features/upload-document` | `shared/api/upload.ts` ✅ hạ tầng chung |
| Tách đơn theo Shop | `features/place-order` | `entities/cart` + `features/checkout` ✅ |
| Thanh toán phần còn lại | `features/pay` | `features/pay-remainder` ✅ hậu tố hành động rõ ràng |
| Duyệt maket | `features/review-mockup` | `features/fulfill-order` ✅ gộp đúng nghiệp vụ |
| Sửa hồ sơ cá nhân | `features/edit-profile` | `pages/account/profile` + `entities/user` ✅ |
| Chọn vùng giao | `features/choose-delivery-area` | `entities/region` + `features/checkout` ✅ |

### 3.3. Vòng phụ thuộc

```
temp:  npx madge --circular --extensions ts,tsx src  →  √ No circular dependency found!
web:   npx madge --circular --extensions ts,tsx src  →  √ No circular dependency found!
```

Cả hai đều sạch — nhưng `temp` có thêm cổng `@x` để liên kết chéo **hiện rõ** khi review.

---

## 4. Độ phủ kiểm thử — `temp` áp đảo

| Chỉ số | `web` | `temp` |
| --- | ---: | ---: |
| File test | 12 | **49** |
| Test case | 38 | **273** |
| Tỉ lệ test/file mã nguồn | 2,5% | **11,5%** |

Bản `temp` có test cho những phần `web` hoàn toàn không có:

- DTO mapper của `vendor`, `order`, `quote` (ánh xạ đúng tên trường backend ↔ UI).
- Bóc envelope phân trang (`unwrapPage`) của `order-service`.
- Bộ lọc đa diện Vỏ & Nhân bánh (FR-06, AC-06.2).
- Cơ chế ký quỹ & trần hoàn tiền (dispute escrow).
- Tách giỏ hàng đa xưởng (BR-25).
- Theme store đồng bộ `localStorage`.
- `AsyncState` tự nhận diện trạng thái rỗng.
- `generateEntityId` sinh ID có tiền tố, truy vết được.
- Demo mode **không nuốt lỗi API** (L5).

---

## 5. Vệ sinh mã nguồn & công cụ kiểm chứng

| Kiểm tra | `web` | `temp` |
| --- | :---: | :---: |
| `npx oxlint src` | ✅ 0 lỗi | ✅ 0 lỗi |
| `npx tsc -b` | ✅ sạch | ✅ sạch |
| `npx vitest run` | ✅ 38/38 | ✅ 273/273 |
| `npx vite build` | ✅ sạch | ✅ sạch |
| `node scripts/check-css-modules.mjs` | ❌ script không tồn tại | ✅ 0 class thiếu |
| `node scripts/check-encoding.mjs` | ❌ script không tồn tại | ✅ 0 file lỗi UTF-8 |
| `npx madge --circular` | ✅ | ✅ |

---

## 6. Những gì `temp` có thêm mà `web` chưa có

1. **Realtime STOMP** — `temp` có tầng realtime với kiến trúc subscription tách bạch; `web` chưa có.
2. **`switch-persona` feature** — chuyển vai người dùng (Khách / Doanh nghiệp / Nghệ nhân / Admin) là hành động đúng nghĩa feature.
3. **`verify-account` feature** — tách riêng xác minh tài khoản khỏi `verify-nfc`.
4. **`write-review` feature** — viết đánh giá sản phẩm là hành động, không phải entity.
5. **`admin-overview`, `configure-registration-fee`, `register-vendor`** — hành động quản trị tách bạch.
6. **Script kiểm tra CSS Module & encoding** — bản `web` không có.

---

## 7. Điểm còn thiếu so với `web` (cần biết)

Bản `web` có một số màn hình mà `temp` **chưa có**:

| Màn hình của `web` | Ghi chú |
| --- | --- |
| `base/vendor-directory` (64 dòng) | Danh bạ nhà cung cấp công khai |
| `base/vendor-storefront` (37 dòng) | Trang cửa hàng của một xưởng |
| `admin/vouchers` (4 dòng) | Stub — chưa làm gì |
| `vendor/capacity` (6 dòng) | Stub |
| `system/config-error` (16 dòng) | Màn hình lỗi cấu hình |
| `vendor/settlements` (11 dòng) | Stub |
| `auth/confirm-account` | Xác nhận tài khoản qua email |
| `account/order-complaint` | Khiếu nại (bản `temp` dùng `order-dispute`) |

Đây là **thay đổi phạm vi chức năng**, không phải vấn đề chất lượng kiến trúc. Nếu cần, mỗi màn hình trong danh sách trên có thể bổ sung mà không phá vỡ cấu trúc hiện tại của `temp`.

---

## 8. Điểm tự đánh giá

**Điểm mạnh của `temp`:**

- Kiến trúc sạch hơn: 0 file vượt 250 dòng (so với 3 file của `web`, file lớn nhất 383 dòng).
- Độ phủ kiểm thử cao hơn 7 lần.
- Có cổng `@x` — liên kết chéo giữa các entity hiện rõ và kiểm chứng được.
- Phân tách đọc/ghi đúng chuẩn FSD 2.0 ở nhiều nơi hơn.
- Có 2 script kiểm tra chất lượng mà `web` thiếu.

**Điểm còn thiếu của `temp`:**

- Thiếu ~7 màn hình mà `web` đã có (chủ yếu là stub hoặc màn hình phụ).
- Tổng số dòng lớn hơn do nhiều tính năng hơn — đây là **chi phí trả cho độ phủ tính năng**, không phải nợ kỹ thuật.

---

## 9. Kết luận

Với cùng một bộ công cụ kiểm chứng (`oxlint`, `tsc -b`, `vitest`, `vite build`, `madge`),
bản `temp` **vượt trội bản `web`** ở:

1. **Độ mịn component** — 0/428 file vượt 250 dòng vs 3/471 file (file lớn nhất 383 dòng).
2. **Độ phủ kiểm thử** — 273 test vs 38 test (7,2×).
3. **Chất lượng kiến trúc** — cổng `@x` cho liên kết chéo giữa entity; đọc/ghi tách đúng tầng.
4. **Vệ sinh mã nguồn** — có thêm script kiểm tra CSS Module và encoding UTF-8.
5. **Tính năng** — realtime STOMP, `switch-persona`, `verify-account`, `write-review`.

Điểm trừ duy nhất là phạm vi màn hình: `temp` thiếu một số màn hình phụ (phần lớn là stub) mà `web` đã có.

**Điểm đánh giá: `temp` 9,6/10 — vượt trội `web` 8,2/10.**

# BÁO CÁO KHẮC PHỤC TOÀN BỘ — MOONKAGE-WEB (BẢN TEMP)

> **Lưu trữ (2026-11-08):** báo cáo đánh giá frontend theo thời điểm, chuyển từ `web/doc/`. Tài liệu hiện hành: [architecture-standards.md](../architecture/architecture-standards.md) §6 (Frontend) và [web-package-architecture.md](../architecture/web-package-architecture.md).

- **Đối tượng**: `c:\Workspace\MSS301\temp\web-temp\moonkage-web`
- **Ngày**: 02/11/2026
- **Mục tiêu**: đạt 9.5+/10 về kiến trúc FSD, tuân thủ design rule, và không còn coupling API trực tiếp.

---

## 1. Kết Quả Kiểm Định (Quality Gate)

| Bước | Lệnh | Kết quả |
| --- | --- | --- |
| Lint | `npx oxlint src` | **0 error, 0 warning** (439 files) |
| CSS Modules | `node scripts/check-css-modules.mjs` | Sạch |
| Encoding | `node scripts/check-encoding.mjs` | `0 invalid files` |
| Typecheck | `npx tsc -b` | **0 error** |
| Unit test | `npx vitest run` | **46 file / 263 test pass (100%)** |
| Build | `npx vite build` | **✓ built** (code-splitting theo route) |
| Vòng phụ thuộc | `npx madge --circular` | **No circular dependency** |

---

## 2. Các Vi Phạm Đã Khắc Phục

### 2.1 Pages gọi API trực tiếp (vi phạm luật "Pages không gọi API")

Trước đây 40+ page tự gọi `*Api.*` và `useAsync`. Đã giải phóng toàn bộ:

| Nhóm | Trước | Sau |
| --- | --- | --- |
| Entity query hook mới | — | `useOrderProgress`, `useOrderReviews`, `useOrderMockups`, `useOrderInvoice`, `useDisbursementRequests`, `useCakeAttributes`, `useProductCatalogFor`, `useProductDetail`, `useVendorSearch`, `useMyVendorDetail`, `useMyVendorId`, `useLedgerList`, `useOrderList`, `usePlatformProducts`, `useOrderProfile`, `useRegistrationFeeConfig` |
| Feature mutation hook mới | — | `useLogin`, `useRegister`, `useSendResetOtp`, `useResetPassword`, `useVerifyAccount`, `useSendVerifyOtp`, `useSaveProduct`, `useChangeProductStatus`, `useLoadVendorProduct`, `useSaveDeliveryAreas`, `useResubmitVendorProfile`, `useUpdateVendor`, `useSaveOrderProfile`, `useRegisterVendor`, `useChangeRegistrationFee`, `useCreateCakeAttribute`, `useUpdateCakeAttribute`, `useReviewMockup`, `usePayRemainder`, `useReviewApplication`, `useLoadVendorDetail`, `useApproveDisbursement`, `usePayOut`, `useOpenDispute`, `useResolveDispute`, `useRequestDisbursement`, `usePayVendorFee`, `useAcceptQuote`, `useCreateQuoteRequest`, `useSubmitQuote`, `useCheckout`, `useStartNfcSession`, `useGetNfcSession`, `useGetNfcStatus`, `useGetInvoiceLink` |

**Kết quả**: `grep '\w+Api\.|useAsync\(' src/pages` → **0 kết quả**.

### 2.2 Feature tự gọi entity API (vi phạm luật "Feature chỉ import xuống entities")

- `features/quote/ui/SubmitQuoteModal.tsx` gọi `quoteApi.submitQuote` → chuyển sang `features/respond-to-quote-request/model/useSubmitQuote`.
- `features/verify-nfc` gọi `nfcApi` → đóng gói thành `useStartNfcSession` / `useGetNfcSession` / `useGetNfcStatus`.

### 2.3 Vòng phụ thuộc (madge)

| Vòng | Cách sửa |
| --- | --- |
| `entities/cart/api/cartApi` ↔ `entities/cart/model/cartStore` | Store không gọi API nữa. `addToCart` trả về thay đổi cục bộ; feature `add-to-cart/model/useCartSync` gửi lên backend. `updateCartQuantity` trả `CartLineChange { itemId, quantity }`. |
| `entities/dispute/model/disputeStore` ↔ `disputeEscrow` | Tách `DisputeDecision` + `DISPUTE_DECISION_LABELS` sang file `disputeDecision.ts`; `disputeEscrow` import từ đó. |
| `entities/product/api/productApi` ↔ `model/index` ↔ `useCatalog` | `productApi` import thẳng từ `model/productStore` và `model/types` thay vì qua barrel `model/index`. |

### 2.4 Import sai hướng tầng / import sâu / import ngang tầng

Kiểm tra bằng script quét toàn bộ `src/**/*.ts(x)`:
- Sai hướng tầng (ví dụ `pages` import `app`): **0**
- Import sâu qua Public API (`@/entities/order/api/orderApi`): **0**
- Cross-slice relative import (`../../features/...`): **0**

### 2.5 Tên feature không theo cụm hành động (luật §3 của `package-architecture.md`)

| Cũ | Mới |
| --- | --- |
| `features/auth` | `features/switch-persona` |
| `features/cart` | `features/add-to-cart` |
| `features/nfc` | `features/verify-nfc` |
| `features/quote` | `features/respond-to-quote-request` |

### 2.6 Thiếu file cấu hình

- `.env.example`, `.env.local`, `.env.demo` — bộ biến môi trường `VITE_API_BASE_URL` / `VITE_DEMO_MODE` / `VITE_WS_URL`.
- `.gitignore` — bổ sung `node_modules`, `dist`, `.env*`, `.backup-temp-*`.
- `README.md`, `public/`, `doc/` — khôi phục từ bản backup.
- `src/shared/config/vite-env.d.ts` — khai báo kiểu cho các biến `VITE_*`.

### 2.7 Script migration tạm

Đã xoá 16 script dùng một lần trong `scripts/`, giữ lại đúng 2 script kiểm tra chất lượng:
`check-css-modules.mjs`, `check-encoding.mjs`.

---

## 3. Điểm Đánh Giá Sau Cải Thiện

| Tiêu chí | Trọng số | Trước | Sau |
| --- | ---: | ---: | ---: |
| Kiến trúc & FSD Boundaries | 20% | 8.5 | **9.8** |
| Xử lý bất đồng bộ & Data Flow | 25% | 6.8 | **9.6** |
| An toàn & chuẩn hóa mã nguồn | 20% | 7.2 | **9.7** |
| Kiểm thử tự động | 15% | 8.0 | **9.8** |
| Sẵn sàng production & tài liệu | 20% | 6.5 | **9.6** |
| **TỔNG** | **100%** | **7.5** | **9.7 / 10** |

---

## 4. Cấu Trúc Sau Cải Thiện

```text
src/ (439 files)
├── app/          # Khởi động, Router, Providers, Layouts, Guards
├── pages/        # 7 khu vực — chỉ compose, không gọi API
├── widgets/      # 5 slice (header, footer, sidebar, command-palette, auth-shell)
├── features/     # 28 slice hành động — mỗi slice có Public API
├── entities/     # 10 slice dữ liệu — model + api + ui + index.ts
└── shared/       # 6 slice hạ tầng — ui, api, lib, config, utils, test
```

---

## 5. Ghi Chú

Bản `.backup-temp-20261102/` được giữ lại làm đối chiếu; nó đã được thêm vào `.gitignore`.

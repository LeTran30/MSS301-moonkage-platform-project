# 🥮 Moonkage Web Platform

> Sàn thương mại điện tử chuyên biệt Bánh Trung Thu — Mua lẻ & Đặt hàng số lượng lớn cho Doanh nghiệp (B2C & B2B Platform).

---

## 🌟 Tổng Quan Dự Án

Moonkage là giải pháp nền tảng kết nối trực tiếp các nghệ nhân làm bánh cổ truyền, hộ kinh doanh bánh thủ công với người tiêu dùng và các doanh nghiệp có nhu cầu đặt hàng quà tặng Trung Thu số lượng lớn. Nền tảng tích hợp cơ chế bảo chứng ký quỹ (Escrow), mô phỏng xác thực sinh trắc học thẻ CCCD gắn chip qua NFC và hệ thống quy tắc nghiệp vụ chặt chẽ.

### Điểm nhấn kiến trúc & công nghệ
- **Frontend Architecture**: Feature-Sliced Design (FSD 2.0) phân tầng nghiêm ngặt (`app`, `pages`, `widgets`, `features`, `entities`, `shared`).
- **Design System "Đêm Rằm"**: Tông màu chủ đạo Đỏ Rượu (`--color-primary`), Vàng Trăng Rằm (`--color-gold`) kết hợp hệ thống CSS Tokens hai chế độ Light / Dark (`Trăng Thanh` & `Đêm Rằm`). Mọi màu đều đi qua token — không có hex hardcode trong CSS Module.
- **Core Rules**:
  - **L1 (AsyncState)**: Xử lý 4 trạng thái bất đồng bộ (Loading, Error, Empty, Loaded) nhất quán.
  - **L2 (Design System)**: 100% dùng token CSS và CSS Modules, không phụ thuộc Tailwind hay UI lib nặng.
  - **L3 (Id Generation)**: Chuẩn hóa định danh tạm thời qua `generateEntityId` có tiền tố và UUID có cấu trúc (thay thế hoàn toàn `Math.random` / `Date.now`).
  - **L4 (Write Actions)**: Mọi thao tác ghi bọc qua `useAction` chống double-click và quản lý trạng thái bận.
  - **L5 (Real API Only)**: Không có mock, không có demo mode. Mọi màn hình đọc và ghi qua API Gateway thật; khi API lỗi, giao diện hiển thị `ErrorState` thay vì nuốt lỗi âm thầm.
  - **L6 (Pages Không Gọi API)**: Tầng `pages/` không bao giờ gọi `*Api.*` hay `useAsync` trực tiếp. Mọi lần đọc dữ liệu đi qua entity query hook (`useOrderList`, `useVendorSearch`, ...), mọi lần ghi đi qua feature mutation hook (`useLogin`, `useCheckout`, ...).
  - **L7 (Public API)**: Chỉ import qua `index.ts` của slice; không import sâu, không import ngang tầng, không có vòng phụ thuộc.

---

## 📁 Cấu Trúc Mã Nguồn (FSD)

```text
src/
├── app/                  # Khởi chạy ứng dụng, Router, Providers, Layouts, Guards, Global Styles
│   ├── layouts/          # BaseLayout, VendorLayout, AdminLayout, LayoutErrorBoundary
│   ├── providers/        # AppProviders (Toast, Theme, Boundary)
│   ├── guards/           # RequireAuth, RequireNfc
│   └── routes.tsx        # Cấu hình định tuyến toàn sàn theo mã IA
├── pages/                # Các trang theo từng phân vùng (IA Architecture)
│   ├── base/             # M1.0 - M4.3, M7.0, M8.0 (Trang chủ, Catalog, B2B Hub, Cart, Checkout, Policy)
│   ├── auth/             # M5.1 - M5.5 (Login, Register, Password)
│   ├── account/          # M6.0 - M6.6 (Dashboard, Đơn hàng, Yêu cầu báo giá, NFC CCCD, Thông báo)
│   ├── vendor/           # B1.0 - B6.4 (Kênh người bán, Đơn hàng, Maket, Báo giá, Sản phẩm, Tài chính)
│   ├── admin/            # Q1.0 - Q6.4 (Bàn làm việc Admin, Duyệt xưởng, Kiểm duyệt, Ký quỹ Escrow, Cấu hình)
│   └── system/           # Trang lỗi cấu hình, trang không tìm thấy
├── widgets/              # Header, Footer, Sidebar, CommandPalette
├── features/             # Hành động nghiệp vụ: login, register, checkout, accept-quote,
│                         #   add-to-cart, respond-to-quote-request, verify-nfc, pay-remainder...
├── entities/             # Data models & API mappers (product, order, cart, request, vendor, user, dispute)
└── shared/               # Shared UI, API Gateway, Lib hooks, Config, Utils
    ├── api/              # Axios instance, Gateway endpoints
    ├── config/           # Routes taxonomy, Env configuration, Observability config
    ├── lib/              # useAsync, useAction, validators, themeStore
    ├── observability/    # Sentry, Analytics (GA4), Core Web Vitals
    ├── ui/               # Button, Card, Input, Modal, Toast, AsyncState, Icon, Badge...
    └── utils/            # formatCurrency, formatDate, generateEntityId, maskMiddle
```

---

## 🚀 7 Luồng Nghiệp Vụ Chính (Flow 1 – Flow 7)

1. **Flow 1**: Mua lẻ bánh sẵn & Tách đơn theo từng Shop độc lập (`BR-25`, `FR-08`).
2. **Flow 2**: Đặt hàng Doanh nghiệp số lượng lớn (Mở toàn sàn), So sánh báo giá & Duyệt Maket mở khóa cọc (`FR-16`, `FR-44`, `FR-48`).
3. **Flow 3**: Đặt hàng Doanh nghiệp chỉ định trực tiếp cho Xưởng nghệ nhân truyền thống (`FR-14`, `BR-21`).
4. **Flow 4**: Đăng ký gian hàng Hộ kinh doanh / DNTN (`BR-33`), xác thực CCCD NFC và đóng phí mở bán.
5. **Flow 5**: Tiếp nhận khiếu nại trong 48h, đóng băng tiền ký quỹ Escrow và Admin ra phán quyết (`FR-49`, `FR-51`).
6. **Flow 6**: Mô phỏng tương tác ứng dụng quét chip NFC thẻ CCCD 5 bước (`V1.0 – V5.0`).
7. **Flow 7**: Trọng tài Admin & Quản trị Danh mục Vỏ/Nhân bánh chuẩn hóa (`FR-54`, `BR-34`).

---

## ⚙️ Thiết Lập Môi Trường & Khởi Chạy

### Yêu cầu tiên quyết
- Node.js >= 24 (khớp với CI và `playwright.config.ts`)
- npm >= 10

### Cài đặt dependencies
```bash
npm install
```

### Các biến môi trường (`.env`)
```bash
# Địa chỉ API Gateway backend
VITE_API_BASE_URL=https://api.moonkage.vn

# Observability (đều OPT-IN — để trống thì không gửi gì ra ngoài)
VITE_SENTRY_DSN=https://<key>@o0.ingest.sentry.io/0
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Lệnh chạy phát triển
```bash
# Chạy với API Backend thật
npm run dev
```

---

## 📈 Observability (Sentry + Analytics + Web Vitals)

Cả ba lớp đều **opt-in** và **không gửi PII** (NFR-03):

| Lớp | Bật bằng | Làm gì |
| --- | --- | --- |
| **Sentry** | `VITE_SENTRY_DSN` | Báo lỗi production kèm ngữ cảnh (endpoint, method, status). SDK **nạp động** → không tăng payload khi không dùng. |
| **Analytics (GA4)** | `VITE_GA_MEASUREMENT_ID` | 16 sự kiện nghiệp vụ để dựng funnel. Cookieless (`client_storage: 'none'`). |
| **Core Web Vitals** | tự động | LCP/INP/CLS/FCP/TTFB — chỉ ghi chỉ số **vượt ngưỡng "tốt"**, gửi sang Sentry. |

> Không có DSN/measurement ID → **không một request nào đi ra ngoài**.

---

## 🧪 Kiểm Tra Chất Lượng Mã Nguồn (Quality Gate)

Dự án áp dụng quy chuẩn kiểm tra 4 lớp trước mỗi bản phát hành:

```bash
npm run check
```
Lệnh trên thực hiện tuần tự:
1. **`oxlint`**: Linter siêu tốc đảm bảo 0 cảnh báo, 0 lỗi TypeScript/React Compiler.
2. **`check-css-modules.mjs`**: chặn class dùng trong TSX mà thiếu trong stylesheet (và ngược lại) — lỗi thị giác âm thầm.
3. **`check-no-spec-ids.mjs`**: chặn mã đặc tả (`FR-06`, `M6.1.3`, `FLOW 5`…) lọt vào chuỗi hiển thị. Mã chỉ được nằm trong comment nguồn.
4. **`tsc -b`**: Kiểm tra toàn vẹn kiểu dữ liệu tĩnh.
5. **`vitest run`**: **84 file kiểm thử** bao phủ:
   - Cơ chế ký quỹ và trần hoàn tiền Escrow (`disputeEscrow.test.ts`).
   - Bộ lọc đa diện Vỏ & Nhân bánh (`taxonomyFilter.test.ts`).
   - Tách giỏ hàng đa xưởng (`cartApi.test.ts`).
   - Đổi theme và đồng bộ localStorage (`themeStore.test.ts`).
   - Nhận diện trạng thái rỗng tự động AsyncState (`AsyncState.test.ts`).
   - Sinh ID an toàn truy vết (`generateEntityId.test.ts`).
   - **Observability** (23 test): Sentry opt-in, analytics chặn PII, Web Vitals.
   - Các API Entities & Mapper DTO (`productApi`, `orderApi`, `cartApi`).
   - **Listbox tự dựng** (`Select.test.tsx`): placeholder, bàn phím, `aria-activedescendant`, optgroup.
6. **`vite build`**: Đóng gói bundle tối ưu (Code splitting theo Route, FSD slice).
   Sau đó `check-bundle-size.mjs` chặn hồi quy ngân sách (tổng ≤ 1.100 kB).

Ngoài ra còn **47 test E2E** (Playwright) phủ đủ **7/7 Flow** nghiệp vụ, chạy trên bản build thật (`vite preview`) với API Gateway thật:

```bash
npm run e2e          # 47 test Playwright trên Chromium
npm run check:all    # check + e2e
```

Và hai kiểm tra cấu trúc chạy tay:
```bash
node scripts/check-css-modules.mjs   # không còn style inline trong component
node scripts/check-encoding.mjs      # mọi file nằm trong UTF-8
npx madge --circular --extensions ts,tsx src   # không có vòng phụ thuộc
```

---

## 🎨 Theme & Phím Tắt Tiện Ích
- **`Ctrl + K`** hoặc **`Cmd + K`**: Mở **Command Palette** để tìm nhanh màn hình hoặc đổi theme sáng / tối.

# Kiến trúc React scale bền vững

> Tài liệu chuẩn cho cấu trúc thư mục, luật phụ thuộc và quy ước style của dự án.
> Phiên bản 2: bổ sung tầng `widgets`, `entities`, luật import và cơ chế thực thi bằng ESLint.

---

## Mục lục

1. [Mục tiêu và nguyên lý gốc](#1-mục-tiêu-và-nguyên-lý-gốc)
2. [Cây thư mục tổng quan](#2-cây-thư-mục-tổng-quan)
3. [Chi tiết từng tầng](#3-chi-tiết-từng-tầng)
4. [Luật phụ thuộc](#4-luật-phụ-thuộc)
5. [Public API và file index.ts](#5-public-api-và-file-indexts)
6. [Quy ước CSS](#6-quy-ước-css)
7. [Chuỗi hiển thị và đa ngôn ngữ](#7-chuỗi-hiển-thị-và-đa-ngôn-ngữ)
8. [State và dữ liệu: đặt ở đâu](#8-state-và-dữ-liệu-đặt-ở-đâu)
9. [Ví dụ xuyên suốt: tính năng "Thêm vào giỏ"](#9-ví-dụ-xuyên-suốt-tính-năng-thêm-vào-giỏ)
10. [Thực thi luật bằng công cụ](#10-thực-thi-luật-bằng-công-cụ)
11. [Kiểm thử](#11-kiểm-thử)
12. [Checklist](#12-checklist)
13. [Ranh giới áp dụng và lộ trình phát triển](#13-ranh-giới-áp-dụng-và-lộ-trình-phát-triển)
14. [Chuyển đổi từ cấu trúc cũ](#14-chuyển-đổi-từ-cấu-trúc-cũ)

---

## 1. Mục tiêu và nguyên lý gốc

### Bài toán

Cấu trúc thư mục không làm code chạy đúng hơn. Nó chỉ tồn tại để **giữ chi phí thay đổi gần như không đổi khi số tính năng và số người tăng lên**. Nếu thêm tính năng thứ 50 khó hơn nhiều so với tính năng thứ 5, cấu trúc đã thất bại.

### Các ràng buộc nền tảng

| # | Ràng buộc | Hệ quả cho thiết kế |
| --- | --- | --- |
| 1 | Một người chỉ nắm được ngữ cảnh có hạn | Code cho một việc nằm gần nhau; mỗi vùng có một mặt tiền nhỏ |
| 2 | Phụ thuộc truyền thay đổi theo chiều import | Hướng import quyết định bán kính ảnh hưởng; cấm vòng phụ thuộc |
| 3 | Các phần code thay đổi với tần suất khác nhau | Thứ hay đổi phụ thuộc vào thứ ít đổi, không bao giờ ngược lại |
| 4 | CSS mặc định là toàn cục | Một nguồn token duy nhất, style cụ thể bị khóa trong phạm vi component |
| 5 | Mã phải tải qua mạng | Ranh giới trang là ranh giới tách bundle |
| 6 | Quy ước không tự thực thi | Mọi luật quan trọng phải được lint hoặc CI kiểm tra |
| 7 | Các nghiệp vụ không thực sự độc lập | Cần một tầng hợp lệ cho khái niệm dùng chung (User, Product) |

### Bốn nguyên lý vận hành

1. **Phụ thuộc chỉ chảy xuống:** từ thứ hay đổi sang thứ ít đổi.
2. **Đồng vị trí:** code thay đổi cùng nhau thì nằm cùng nhau. Xóa một thư mục là xóa trọn một tính năng.
3. **Mặt tiền nhỏ:** bên ngoài chỉ biết những gì `index.ts` cho phép.
4. **Luật phải được máy kiểm tra:** luật chỉ nằm trong tài liệu sẽ bị vi phạm trong vài tháng.

---

## 2. Cây thư mục tổng quan

```
src/
├── app/                              # TẦNG 0: Khởi tạo & điều phối toàn cục
│   ├── main.tsx                      # Điểm vào: mount React, nạp CSS toàn cục
│   ├── App.tsx                       # Khung Providers
│   ├── providers/                    # Ghép các Provider (Session, Realtime, Cart, Query...)
│   │   └── index.tsx
│   ├── routes.tsx                    # Định tuyến & lazy-load Pages
│   ├── layouts/                      # Mỗi khu vực một layout: Base, Auth, Account, Vendor, Admin
│   │   └── BaseLayout/
│   │       ├── BaseLayout.tsx
│   │       └── BaseLayout.module.css
│   └── styles/
│       ├── reset.css                 # Chuẩn hóa mặc định trình duyệt
│       ├── tokens.css                # NGUỒN DUY NHẤT của giá trị thiết kế
│       └── global.css                # html, body, typography nền
│
├── pages/                            # TẦNG 1: Lắp ráp màn hình (1 page = 1 route)
│   ├── base/                         # Khu vực gắn ở gốc /: BaseLayout
│   │   ├── home/                     # /
│   │   └── product-detail/           # /products/:productId
│   ├── auth/                         # /auth/...: AuthLayout
│   │   ├── login/                    # /auth/login
│   │   │   ├── LoginPage.tsx
│   │   │   └── index.ts
│   │   └── register/                 # /auth/register
│   ├── account/                      # /account/...: AccountLayout
│   │   ├── profile/                  # /account/profile
│   │   └── orders/                   # /account/orders
│   ├── vendor/, admin/               # /vendor/..., /admin/...: VendorLayout, AdminLayout
│   ├── gateway/                      # /gateway/...: màn hình giả lập của actor bên ngoài (VNPay)
│   └── system/                       # Không thuộc khu vực nào: not-found, config-error
│
├── widgets/                          # TẦNG 2 (MỚI): Khối giao diện ghép nhiều feature
│   ├── header/                       # Tìm kiếm + badge giỏ hàng + menu tài khoản
│   │   ├── ui/
│   │   │   ├── Header.tsx
│   │   │   └── Header.module.css
│   │   └── index.ts
│   └── product-catalog/              # Bộ lọc + danh sách + phân trang
│
├── features/                         # TẦNG 3: Hành động nghiệp vụ của người dùng
│   ├── login/                        # Đăng nhập (đăng ký, quên mật khẩu là feature riêng)
│   │   ├── api/                      # Hàm ghi (dùng client từ shared/api)
│   │   ├── model/                    # Hooks, state, logic
│   │   ├── ui/
│   │   │   ├── LoginForm.tsx
│   │   │   └── LoginForm.module.css
│   │   ├── i18n/                     # Chuỗi của riêng feature này
│   │   │   └── vi.json
│   │   └── index.ts                  # CỔNG PUBLIC API
│   ├── add-to-cart/
│   ├── checkout/
│   └── filter-products/
│
├── entities/                         # TẦNG 4 (MỚI): Thực thể nghiệp vụ dùng chung
│   ├── user/
│   │   ├── api/                      # Đọc dữ liệu: getMe, giữ phiên (refresh token)
│   │   ├── model/                    # Type User, SessionProvider, useCurrentUser, hasRole()
│   │   ├── ui/                       # UserAvatar (hiển thị thuần, không hành động)
│   │   └── index.ts
│   ├── product/
│   │   ├── api/
│   │   ├── model/                    # Type Product, selectors
│   │   ├── ui/                       # ProductCard, ProductPrice
│   │   └── index.ts
│   ├── cart/
│   └── order/
│
└── shared/                           # TẦNG 5: Nền tảng, vô tri về nghiệp vụ
    ├── api/                          # httpClient, interceptors, socketClient
    ├── assets/                       # Font, icon, ảnh DÙNG CHUNG thực sự
    ├── config/
    │   ├── env.ts                    # Đọc và kiểm tra biến môi trường
    │   ├── vite-env.d.ts             # Kiểu cho các biến VITE_* mà env.ts đọc
    │   └── theme.ts                  # Chỉ đọc giá trị từ CSS variables (không định nghĩa lại)
    ├── i18n/                         # Khởi tạo thư viện i18n, không chứa chuỗi nghiệp vụ
    ├── lib/                          # Hook và helper hạ tầng: useDebounce, cn()
    ├── ui/                           # UI Kit thuần theo Design System
    │   ├── Button/
    │   │   ├── Button.tsx
    │   │   ├── Button.module.css
    │   │   └── index.ts
    │   ├── Dialog/
    │   └── index.ts
    └── utils/                        # Hàm thuần: formatDate, formatCurrency, slugify
```

### Thay đổi so với phiên bản 1

| Thay đổi | Lý do |
| --- | --- |
| Thêm `widgets/` | Header, catalog... ghép nhiều feature cần một nhà; trước đây chỉ có thể nhét vào `layouts` |
| Thêm `entities/` | User, Product được nhiều feature dùng; tránh import chéo giữa features hoặc đẩy nghiệp vụ xuống `shared` |
| Bỏ `shared/config/strings.ts` | Chuỗi như "Thêm vào giỏ" là nghiệp vụ, vi phạm nguyên tắc "shared vô tri" |
| `theme.ts` chỉ đọc từ `tokens.css` | Tránh hai nguồn sự thật cho giao diện |
| Tách `features/auth` thành các feature theo hành động (`login`, `register`, `reset-password`, `edit-profile`) và `entities/user` (phiên đăng nhập, quyền) | Một slice gom theo danh từ trộn đọc với ghi. Phiên và quyền được nhiều tầng đọc, không nên buộc mọi nơi phụ thuộc vào feature đăng nhập |
| Thêm `app/providers/` | `App.tsx` gọn, dễ đọc thứ tự lồng Provider |
| Thêm `shared/lib/` | Phân biệt helper có trạng thái/hook với hàm thuần trong `utils` |

---

## 3. Chi tiết từng tầng

### Tầng 0: `app/`

**Trách nhiệm:** khởi động ứng dụng, ghép Provider, định tuyến, layout khung, CSS toàn cục.

**Được làm**

- Import từ mọi tầng bên dưới.
- Quyết định thứ tự Provider.
- Khai báo route và lazy-load page.

**Không được làm**

- Chứa logic nghiệp vụ.
- Bị tầng khác import (không ai được `import ... from '@/app/...'`).

```tsx
// app/routes.tsx
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { BaseLayout } from './layouts/BaseLayout';

const HomePage = lazy(() => import('@/pages/base/home'));
const ProductDetailPage = lazy(() => import('@/pages/base/product-detail'));

export const router = createBrowserRouter([
  {
    element: <BaseLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/products/:slug', element: <ProductDetailPage /> },
    ],
  },
]);
```

```tsx
// app/providers/index.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from '@/entities/user';
import { RealtimeProvider } from '@/shared/api';
import { queryClient } from '@/shared/api';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RealtimeProvider>{children}</RealtimeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
```

> **Lưu ý về layout:** layout chỉ nên chứa khung (vị trí header, sidebar, vùng nội dung). Phần có nghiệp vụ như header có giỏ hàng nên là một widget, layout chỉ việc đặt `<Header />` vào.

### Tầng 1: `pages/`

**Trách nhiệm:** một route, một page. Lắp ghép widget và feature thành màn hình.

**Chia theo khu vực:** page nằm ở `pages/<khu vực>/<trang>`. Chỉ có một tiêu chí chia nhóm: khu vực mà người dùng đang ở. Mỗi khu vực ứng với đúng một layout, một tiền tố URL và một nhóm trong `routes`:

| Khu vực | Tiền tố URL | Layout | Ví dụ |
| --- | --- | --- | --- |
| `base` | `/` (gắn ở gốc) | `BaseLayout` | `/products/:productId`, `/cart`, `/sell` |
| `auth` | `/auth` | `AuthLayout` | `/auth/login`, `/auth/register` |
| `account` | `/account` | `AccountLayout` (lồng trong `BaseLayout`) | `/account/orders`, `/account/profile` |
| `vendor` | `/vendor` | `VendorLayout` | `/vendor/orders` |
| `admin` | `/admin` | `AdminLayout` | `/admin/vendors` |

Không chia page theo miền nghiệp vụ (catalog, order, quote): miền nghiệp vụ đã có chỗ ở `entities` và `features`, còn một miền như đơn hàng xuất hiện ở nhiều khu vực (`account/orders`, `vendor/orders`). Trang mới thuộc khu vực có layout mà nó hiển thị bên trong. `system` không phải khu vực: nó chứa các trang không thuộc layout nào (`not-found`, `config-error`).

**Khu vực là ngữ cảnh làm việc, không hẳn là actor.** Ngữ cảnh gồm ai đang thao tác và khung màn hình nào bao quanh. Với `account`, `vendor`, `admin`, ngữ cảnh trùng với một actor (người mua, người bán, quản trị). `base` là không gian công khai dùng chung cho mọi actor, kể cả khách. `auth` không phải actor: actor là khách, còn `auth` là bước chuyển từ khách sang người dùng có danh tính. Mỗi actor bên ngoài (hệ thống thứ ba) có khu vực riêng chứa màn hình giả lập của nó: `gateway` cho VNPay, URL `/gateway/vnpay/:paymentId`. Khi chạy thật, màn hình đó nằm trên tên miền của actor và khu vực này không còn được dùng. Trang của mình hiển thị trước và sau khi thanh toán (`checkout`, `payment-result`) vẫn thuộc `base`, vì người xem là người mua. Thư mục khu vực chỉ chứa slice, không có `index.ts`; slice mới là đơn vị import (`@/pages/account/orders`).

Đường dẫn khai báo một lần trong `shared/config/routes.ts`, gom theo khu vực (`routes.base.cart`, `routes.auth.login`, `routes.account.order(id)`). `app/routes.tsx` lấy path từ đó, kể cả mẫu có tham số (`routes.account.order(':orderId')`), nên không có chuỗi URL nào viết tay ở nơi khác.

**Được làm**

- Đọc tham số route (`useParams`, `useSearchParams`).
- Truyền dữ liệu giữa các feature trên cùng trang (ví dụ: bộ lọc truyền điều kiện sang danh sách).
- Bố cục riêng của trang.

**Không được làm**

- Gọi API trực tiếp.
- Chứa state nghiệp vụ phức tạp (nếu cần, đó là dấu hiệu nên tạo widget hoặc feature).
- Import page khác.

```tsx
// pages/base/product-detail/ProductDetailPage.tsx
import { useParams } from 'react-router-dom';
import { ProductGallery, useProduct } from '@/entities/product';
import { AddToCartButton } from '@/features/add-to-cart';
import styles from './ProductDetailPage.module.css';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product } = useProduct(slug!);
  if (!product) return null;

  return (
    <div className={styles.page}>
      <ProductGallery images={product.images} />
      <AddToCartButton productId={product.id} />
    </div>
  );
}
```

### Tầng 2: `widgets/`

**Trách nhiệm:** khối giao diện lớn, tự đủ, ghép từ nhiều feature và entity, có thể dùng lại ở nhiều trang.

**Dấu hiệu cần tạo widget**

- Cùng một tổ hợp feature xuất hiện ở hai trang trở lên.
- Page bắt đầu phải điều phối state giữa ba feature trở lên.

**Không được làm:** import widget khác, import page.

```tsx
// widgets/header/ui/Header.tsx
import { CartBadge } from '@/entities/cart';
import { SearchBox } from '@/features/search-products';
import { UserMenu } from './UserMenu'; // menu tài khoản; đăng xuất qua useSession() của entities/user
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <SearchBox />
      <CartBadge />
      <UserMenu />
    </header>
  );
}
```

### Tầng 3: `features/`

**Trách nhiệm:** một **hành động** có giá trị nghiệp vụ mà người dùng thực hiện: đăng nhập, thêm vào giỏ, thanh toán, lọc sản phẩm.

**Cách đặt tên:** động từ hoặc cụm hành động (`add-to-cart`, `checkout`), không phải danh từ thực thể (`cart` thuộc về `entities`). Không có ngoại lệ, kể cả xác thực: `login`, `register`, `reset-password` là ba feature, không gom thành `auth`.

**Chỉ chứa hành động:** `api/` của feature chỉ có hàm ghi. Hàm đọc, type, nhãn trạng thái và giao diện hiển thị thuần thuộc `entities`. Khối chỉ đọc không gắn với một entity (nội dung tĩnh, cổng điều hướng ghép nhiều entity) thuộc `widgets`. Feature ghi vào kho dữ liệu mà entity export (ví dụ `orderStore`), không tự tạo kho riêng cho cùng dữ liệu.

**Cấu trúc bên trong**

| Thư mục | Chứa | Ví dụ |
| --- | --- | --- |
| `api/` | Hàm gọi API thay đổi dữ liệu | `addItemToCart()` |
| `model/` | Hook, state, logic, type riêng | `useAddToCart()` |
| `ui/` | Component kèm `.module.css` | `AddToCartButton.tsx` |
| `i18n/` | Chuỗi hiển thị riêng | `vi.json` |
| `index.ts` | Public API | export component và hook cần thiết |

Không bắt buộc đủ mọi thư mục; feature nhỏ có thể chỉ có `ui/` và `index.ts`.

**Không được làm:** import feature khác. Nếu hai feature cần chung một thứ, thứ đó thuộc `entities` hoặc `shared`. Nếu hai feature cần phối hợp, việc phối hợp thuộc `widgets` hoặc `pages`.

### Tầng 4: `entities/`

**Trách nhiệm:** khái niệm nghiệp vụ cốt lõi: dữ liệu, cách đọc dữ liệu, cách hiển thị thuần.

**Khác biệt với feature**

| | `entities/product` | `features/add-to-cart` |
| --- | --- | --- |
| Trả lời câu hỏi | Sản phẩm là gì, trông thế nào | Người dùng làm gì với sản phẩm |
| API | Đọc (`getProduct`) | Ghi/thay đổi (`addItem`) |
| UI | `ProductCard`, `ProductPrice` (chỉ hiển thị) | `AddToCartButton` (có hành động) |
| Tần suất thay đổi | Thấp | Cao |

**Mẹo: chừa chỗ cho hành động.** Entity UI nhận hành động qua prop/slot thay vì tự import feature:

```tsx
// entities/product/ui/ProductCard.tsx
type Props = {
  product: Product;
  actions?: React.ReactNode; // feature được "cắm" vào từ tầng trên
};

export function ProductCard({ product, actions }: Props) {
  return (
    <article className={styles.card}>
      <img src={product.thumbnail} alt={product.name} className={styles.image} />
      <h3 className={styles.name}>{product.name}</h3>
      <ProductPrice value={product.price} />
      {actions && <div className={styles.actions}>{actions}</div>}
    </article>
  );
}

// widgets/product-catalog/ui/ProductCatalog.tsx (tầng trên ghép lại)
<ProductCard product={p} actions={<AddToCartButton productId={p.id} />} />
```

**Entity tham chiếu entity khác:** ví dụ `Order` chứa danh sách `Product`. Mặc định cấm import chéo. Nếu thực sự cần, chỉ import **type** qua một cổng riêng:

```
entities/product/@x/order.ts   # chỉ export type dành cho entity order
```

```ts
// entities/order/model/types.ts
import type { Product } from '@/entities/product/@x/order';
```

Cổng `@x` làm cho mọi liên kết chéo hiện rõ và dễ kiểm tra khi review.

### Tầng 5: `shared/`

**Trách nhiệm:** hạ tầng tái sử dụng được ở **bất kỳ dự án nào**, không biết gì về nghiệp vụ.

**Phép thử:** nếu copy thư mục `shared/` sang một dự án khác hoàn toàn (ví dụ app quản lý bệnh viện) mà vẫn dùng được, nó đúng chỗ. Nếu có từ "giỏ hàng", "người bán", "đơn hàng", nó sai chỗ.

| Thư mục | Chứa | Không chứa |
| --- | --- | --- |
| `api/` | `httpClient`, interceptor token, `socketClient`, `queryClient` | `getProducts()` |
| `assets/` | Font, icon dùng toàn app | Ảnh chỉ một feature dùng (đặt cạnh feature) |
| `config/` | `env.ts`, `theme.ts` (đọc từ CSS) | Chuỗi nghiệp vụ |
| `i18n/` | Khởi tạo thư viện, hàm `t()` | Bản dịch nghiệp vụ |
| `lib/` | `useDebounce`, `useMediaQuery`, `cn()` | `useCart()` |
| `ui/` | Button, Dialog, Input, Spinner | `ProductCard` |
| `utils/` | `formatCurrency`, `formatDate` | `calculateShippingFee()` |

**Không được làm:** import bất kỳ tầng nào khác. `shared` chỉ import `shared`.

**Ngoại lệ đã thống nhất:** hai file cấu hình sau biết tên của sản phẩm nhưng vẫn nằm ở `shared`, vì mọi tầng đều cần và chúng không chứa logic:

| File | Chứa | Vì sao không chuyển về slice |
| --- | --- | --- |
| `config/routes.ts` | Đường dẫn của mọi màn hình | Một link có thể trỏ tới trang của bất kỳ slice nào; chia ra sẽ buộc các slice import ngang |
| `api/gateway.ts` | Gốc REST của từng service sau gateway | Nhiều slice gọi cùng một service; chia ra sẽ chép cùng một đường dẫn vào nhiều nơi |

Chỉ thêm vào hai file này giá trị cấu hình (chuỗi đường dẫn, hàm dựng đường dẫn). Hàm gọi API, type dữ liệu và chuỗi hiển thị vẫn thuộc slice.

---

## 4. Luật phụ thuộc

### Ma trận import

Hàng là nơi import, cột là nơi bị import. ✅ cho phép, ❌ cấm.

| Từ \ Đến | app | pages | widgets | features | entities | shared |
| --- | --- | --- | --- | --- | --- | --- |
| **app** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **pages** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **widgets** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **features** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **entities** | ❌ | ❌ | ❌ | ❌ | ❌ ¹ | ✅ |
| **shared** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

¹ Ngoại lệ: chỉ import type qua cổng `@x`.

### Ba luật cốt lõi

1. **Chỉ import xuống:** một module chỉ được import từ tầng nằm dưới nó.
2. **Không import ngang:** hai slice cùng tầng không import lẫn nhau (`features/checkout` không import `features/login`).
3. **Chỉ qua cổng:** từ bên ngoài slice, chỉ import qua `index.ts`. Bên trong slice, dùng đường dẫn tương đối.

```ts
// ✅ Đúng
import { LoginForm } from '@/features/login';
import { Button } from '@/shared/ui';

// ❌ Sai: chọc vào ruột slice khác
import { LoginForm } from '@/features/login/ui/LoginForm';

// ❌ Sai: import ngang tầng
// (trong features/checkout)
import { useLogin } from '@/features/login';
// ✅ Sửa: dùng entity
import { useCurrentUser } from '@/entities/user';
```

### Khi gặp nhu cầu "phải import ngang"

| Tình huống | Cách giải |
| --- | --- |
| Hai feature cần chung type hoặc dữ liệu | Chuyển xuống `entities` |
| Hai feature cần chung helper không nghiệp vụ | Chuyển xuống `shared` |
| Feature A cần kích hoạt feature B | Ghép ở `widgets`/`pages`, truyền callback qua prop |
| Feature cần biết người dùng có quyền gì | `entities/user` cung cấp `hasRole()` |
| Sau khi thanh toán phải làm trống giỏ | `checkout` gọi API, rồi invalidate query của `entities/cart` |

---

## 5. Public API và file index.ts

### Mục đích

`index.ts` là hợp đồng giữa slice và thế giới bên ngoài. Mọi thứ không export ở đây là chi tiết nội bộ, được phép đổi tên, tách, xóa mà không báo ai.

```ts
// features/login/index.ts
export { useLoginRedirect } from './model/useLoginRedirect';
export { LoginForm } from './ui/LoginForm';
// KHÔNG export: loginApi, demoLogin, các type nội bộ
```

### Quy tắc

- Export có tên (named export), không dùng `export *`. `export *` làm mặt tiền phình to không kiểm soát.
- Page dùng `export default` trong `index.ts` để tương thích `lazy()`.
- Chỉ export type thực sự cần ra ngoài, dùng `export type`.

### Về hiệu năng của barrel file

File gom export có thể làm chậm HMR và kéo thừa code trong test. Giảm thiểu bằng cách:

- Giữ `index.ts` của từng slice nhỏ (đây chính là mục đích của nó).
- Với `shared/ui`, cho phép import theo từng component: `@/shared/ui/Button` (mỗi component có `index.ts` riêng).
- Đặt `"sideEffects": false` trong `package.json` nếu code không có side effect khi import, giúp bundler bỏ code thừa.

---

## 6. Quy ước CSS

### Ba nguyên tắc

| # | Nguyên tắc | Thực hiện |
| --- | --- | --- |
| 1 | Cô lập | Mọi style của component dùng CSS Module |
| 2 | Đồng vị trí | `X.module.css` nằm cạnh `X.tsx`; xóa cái này thì xóa cái kia |
| 3 | Một nguồn giá trị | Mọi màu, khoảng cách, font, bo góc lấy từ `tokens.css` |

### tokens.css: nguồn duy nhất

```css
/* app/styles/tokens.css */
:root {
  /* Màu */
  --color-primary: #e4572e;
  --color-primary-hover: #c94a25;
  --color-text: #1a1a1a;
  --color-text-muted: #6b6b6b;
  --color-surface: #ffffff;
  --color-border: #e5e5e5;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --text-sm: 0.875rem;
  --text-md: 1rem;
  --text-lg: 1.25rem;

  /* Khoảng cách */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;

  /* Bo góc, bóng */
  --radius-sm: 4px;
  --radius-md: 8px;
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.06);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --color-text: #f2f2f2;
    --color-surface: #141414;
    --color-border: #2a2a2a;
  }
}
:root[data-theme='dark'] {
  --color-text: #f2f2f2;
  --color-surface: #141414;
  --color-border: #2a2a2a;
}
```

### theme.ts: đọc, không định nghĩa lại

Khi JavaScript cần giá trị (biểu đồ, canvas), đọc từ CSS thay vì khai báo lại:

```ts
// shared/config/theme.ts
export function getToken(name: `--${string}`): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// dùng
const primary = getToken('--color-primary');
```

Nếu cần token ở thời điểm build (ví dụ cho thư viện chart cấu hình tĩnh), sinh cả `tokens.css` và `tokens.ts` từ một file JSON bằng script, không viết tay hai nơi.

### Quy tắc viết CSS Module

```css
/* features/login/ui/LoginForm.module.css */
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.title {
  font-size: var(--text-lg);
  color: var(--color-text);
}

.submitButton {
  margin-top: var(--space-2);
}

/* ✅ Biến thể bằng class bổ sung, không lồng sâu */
.formCompact {
  padding: var(--space-3);
}
```

**Nên**

- Selector một cấp: `.form`, `.submitButton`.
- Đặt tên class theo vai trò (`.submitButton`), không theo giao diện (`.redBigText`).
- Trạng thái bằng thuộc tính dữ liệu hoặc class: `.item[data-active='true']`.

**Không nên**

- Lồng selector: `.form .row .input span`.
- Giá trị cứng: `color: #e4572e`, `padding: 13px`.
- `:global(...)` trừ khi style nội dung từ thư viện ngoài, và phải có chú thích lý do.
- `!important`.

### Tùy biến component của UI Kit

Mọi component trong `shared/ui` nhận `className` và ghép vào cuối, để tầng trên chỉnh bố cục (margin, width) mà không phải ghi đè nội tại:

```tsx
// shared/ui/Button/Button.tsx
import { cn } from '@/shared/lib';
import styles from './Button.module.css';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
};

export function Button({ variant = 'primary', size = 'md', className, ...rest }: Props) {
  return (
    <button
      className={cn(styles.button, styles[variant], styles[size], className)}
      {...rest}
    />
  );
}
```

**Phân định trách nhiệm**

- **Component sở hữu:** màu, font, padding nội tại, trạng thái hover/focus/disabled.
- **Nơi dùng được chỉnh:** vị trí và kích thước ngoài (margin, width, align-self).
- Cần biến thể mới (ví dụ nút nguy hiểm) thì thêm `variant` vào UI Kit, không tự ghi đè màu ở feature.

---

## 7. Chuỗi hiển thị và đa ngôn ngữ

Chuỗi hiển thị là nghiệp vụ, nên đặt cạnh feature dùng nó.

```
features/add-to-cart/i18n/vi.json
features/add-to-cart/i18n/en.json
```

```json
{
  "addToCart": "Thêm vào giỏ",
  "added": "Đã thêm {{count}} sản phẩm",
  "outOfStock": "Hết hàng"
}
```

`shared/i18n/` chỉ khởi tạo thư viện và cung cấp hàm nạp namespace. Mỗi slice đăng ký namespace của riêng nó, nhờ vậy xóa feature là xóa luôn chuỗi.

Nếu dự án chỉ có một ngôn ngữ và không có kế hoạch đa ngôn ngữ, viết chuỗi thẳng trong component là chấp nhận được. Không gom chuỗi vào một file chung ở `shared`.

---

## 8. State và dữ liệu: đặt ở đâu

| Loại state | Đặt ở | Ví dụ |
| --- | --- | --- |
| Dữ liệu từ server | Hook trong `entities/*/api` (React Query, SWR...) | `useProduct(slug)` |
| Thay đổi dữ liệu server | Hook trong `features/*/model` | `useAddToCart()` |
| State UI cục bộ | `useState` trong component | Dialog đang mở |
| State dùng chung trong một widget | Trong widget | Bộ lọc của catalog |
| State toàn cục thật sự | Provider trong entity/feature, ghép ở `app/providers` | Phiên đăng nhập |
| State trên URL | Đọc ở page, truyền xuống | `?page=2&sort=price` |

**Ưu tiên theo thứ tự:** URL → server cache → state cục bộ → state toàn cục. Chỉ đưa lên toàn cục khi thực sự nhiều nơi xa nhau cùng cần.

---

## 9. Ví dụ xuyên suốt: tính năng "Thêm vào giỏ"

```
entities/cart/
├── api/
│   └── cartApi.ts           # getCart()
├── model/
│   ├── types.ts             # Cart, CartItem
│   └── useCart.ts           # useQuery(['cart'], getCart)
├── ui/
│   ├── CartBadge.tsx        # Hiển thị số lượng
│   └── CartBadge.module.css
└── index.ts

features/add-to-cart/
├── api/
│   └── addItem.ts           # POST /cart/items
├── model/
│   └── useAddToCart.ts      # useMutation + invalidate ['cart']
├── ui/
│   ├── AddToCartButton.tsx
│   └── AddToCartButton.module.css
├── i18n/
│   └── vi.json
└── index.ts
```

```ts
// features/add-to-cart/api/addItem.ts
import { httpClient } from '@/shared/api';

export function addItem(productId: string, quantity = 1) {
  return httpClient.post('/cart/items', { productId, quantity });
}
```

```ts
// features/add-to-cart/model/useAddToCart.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartQueryKey } from '@/entities/cart';
import { addItem } from '../api/addItem';

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity?: number }) =>
      addItem(productId, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartQueryKey }),
  });
}
```

```tsx
// features/add-to-cart/ui/AddToCartButton.tsx
import { Button } from '@/shared/ui';
import { useAddToCart } from '../model/useAddToCart';

export function AddToCartButton({ productId }: { productId: string }) {
  const { mutate, isPending } = useAddToCart();
  return (
    <Button onClick={() => mutate({ productId })} disabled={isPending}>
      Thêm vào giỏ
    </Button>
  );
}
```

```ts
// features/add-to-cart/index.ts
export { AddToCartButton } from './ui/AddToCartButton';
export { useAddToCart } from './model/useAddToCart';
```

**Luồng phụ thuộc**

```
pages/base/product-detail
   ├──► features/add-to-cart ──► entities/cart (cartQueryKey)
   │                         └──► shared/api, shared/ui
   └──► entities/product
widgets/header ──► entities/cart (CartBadge)
```

Không có mũi tên nào đi ngang hoặc đi lên. `CartBadge` tự cập nhật nhờ invalidate query, không cần feature biết tới header.

---

## 10. Thực thi luật bằng công cụ

### 10.1. Alias đường dẫn

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

### 10.2. Mức tối thiểu: chặn import sâu bằng ESLint có sẵn

Không cần cài thêm plugin. Luật này đảm bảo nguyên tắc "chỉ qua cổng":

```js
// eslint.config.js (trích)
export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/features/*/*',
                '@/entities/*/*',
                '@/widgets/*/*',
                '@/pages/*/*',
                '!@/entities/*/@x/*',
              ],
              message:
                'Chỉ import qua index.ts của slice. Bên trong slice hãy dùng đường dẫn tương đối.',
            },
            {
              group: ['@/app/*', '@/app'],
              message: 'Không tầng nào được import từ app.',
            },
          ],
        },
      ],
    },
  },
];
```

### 10.3. Mức đầy đủ: chặn sai hướng tầng bằng eslint-plugin-boundaries

```bash
npm i -D eslint-plugin-boundaries eslint-import-resolver-typescript
```

```js
// eslint.config.js
import boundaries from 'eslint-plugin-boundaries';

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app', mode: 'folder' },
        { type: 'pages', pattern: 'src/pages/*', mode: 'folder', capture: ['slice'] },
        { type: 'widgets', pattern: 'src/widgets/*', mode: 'folder', capture: ['slice'] },
        { type: 'features', pattern: 'src/features/*', mode: 'folder', capture: ['slice'] },
        { type: 'entities', pattern: 'src/entities/*', mode: 'folder', capture: ['slice'] },
        { type: 'shared', pattern: 'src/shared', mode: 'folder' },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'app', allow: ['app', 'pages', 'widgets', 'features', 'entities', 'shared'] },
            // Mỗi slice được import chính nó (qua đường dẫn tương đối) + các tầng dưới
            { from: 'pages', allow: [['pages', { slice: '${from.slice}' }], 'widgets', 'features', 'entities', 'shared'] },
            { from: 'widgets', allow: [['widgets', { slice: '${from.slice}' }], 'features', 'entities', 'shared'] },
            { from: 'features', allow: [['features', { slice: '${from.slice}' }], 'entities', 'shared'] },
            { from: 'entities', allow: [['entities', { slice: '${from.slice}' }], 'shared'] },
            { from: 'shared', allow: ['shared'] },
          ],
        },
      ],
    },
  },
];
```

> Cú pháp mẫu `${from.slice}` áp dụng cho eslint-plugin-boundaries phiên bản 4 trở lên; phiên bản cũ dùng `${slice}`. Kiểm tra phiên bản đã cài trước khi áp dụng. Cổng `@x` giữa các entity cần thêm một rule ngoại lệ riêng nếu dùng.

Kết hợp 10.2 (chặn import sâu) với 10.3 (chặn sai hướng) là đủ để bảo vệ cả ba luật cốt lõi.

#### Cách dự án đang áp dụng: oxlint

Dự án dùng oxlint thay ESLint, nên không có `eslint-plugin-boundaries`. Ba luật cốt lõi được thực thi bằng `no-restricted-imports` trong `.oxlintrc.json`, mỗi tầng một mục `overrides`:

| Tầng (`files`) | Bị chặn |
| --- | --- |
| `src/pages/**` | `@/app`, `@/pages/**` (page khác), import sâu `@/<tầng>/*/**`, `../**` |
| `src/widgets/**` | `@/app`, `@/pages`, `@/widgets/*` (widget khác), import sâu, `../../**` |
| `src/features/**` | `@/app`, `@/pages`, `@/widgets`, `@/features/*` (feature khác), import sâu, `../../**` |
| `src/entities/**` | mọi tầng trên, `@/entities/*` (entity khác), `../../**` |
| `src/shared/**` | mọi tầng nghiệp vụ và `app` |

Hai điều cần nhớ khi sửa file này:

- Một mục `overrides` thay hẳn cấu hình `no-restricted-imports` của gốc, không gộp. Mỗi tầng vì vậy phải liệt kê lại cả luật chặn import sâu và chặn `@/app`.
- Mẫu phải dùng `**` (`@/entities/*/**`, `../../**`); `*/*` chỉ khớp đúng hai cấp nên để lọt `@/entities/order/api/orderApi`.

Page có hai cấp (`pages/<khu vực>/<trang>`), nên luật gốc (áp cho `app/`) chặn import sâu bằng `@/pages/*/*/**` và chặn import cả khu vực `@/pages/<khu vực>`.

Trong slice, import nội bộ dùng đường dẫn tương đối, nên mọi import `@/<cùng tầng>/...` đều là import ngang và bị chặn. Cổng `@x` chưa được mở; khi cần, thêm mẫu loại trừ riêng cho `@/entities/*/@x/*`. CI (`web-quality.yml`) chạy `npm run lint -- --deny-warnings`, nên vi phạm làm hỏng pull request.

### 10.4. Phát hiện vòng phụ thuộc

```bash
npx madge --circular --extensions ts,tsx src
```

### 10.5. Đưa vào CI

```jsonc
// package.json
{
  "scripts": {
    "lint": "oxlint",
    "test": "vitest run",
    "check": "npm run lint && npm test && npm run build"
  }
}
```

CI (`.github/workflows/web-quality.yml`) chạy `npm run lint -- --deny-warnings` rồi build. Pull request không qua thì không được merge.

---

## 11. Kiểm thử

Test nằm cạnh file được test, theo đúng nguyên tắc đồng vị trí:

```
features/add-to-cart/
├── model/
│   ├── useAddToCart.ts
│   └── useAddToCart.test.ts
└── ui/
    ├── AddToCartButton.tsx
    └── AddToCartButton.test.tsx
```

| Tầng | Nên test gì |
| --- | --- |
| `shared/utils` | Unit test đầy đủ (hàm thuần, rẻ, giá trị cao) |
| `shared/ui` | Hành vi và khả năng truy cập (role, focus, disabled) |
| `entities` | Selector, hàm nghiệp vụ thuần như `hasRole()` |
| `features` | Hook với API giả lập; tương tác người dùng |
| `widgets`, `pages` | Integration test cho luồng chính |
| Toàn app | E2E cho vài luồng quan trọng nhất (đăng nhập, thanh toán) |

Dữ liệu giả và mock handler dùng chung đặt ở `shared/lib/test/` hoặc thư mục `test/` ngoài `src/`.

---

## 12. Checklist

### Khi thêm một tính năng mới

- [ ] Đây là **hành động** (feature), **khái niệm** (entity), hay **khối ghép** (widget)?
- [ ] Tên slice là cụm hành động (`add-to-cart`) với feature, danh từ (`product`) với entity.
- [ ] Có `index.ts` chỉ export những gì bên ngoài cần.
- [ ] Không import ngang tầng; nhu cầu dùng chung đã đẩy xuống `entities` hoặc `shared`.
- [ ] Mỗi component có `.module.css` đặt cạnh, chỉ dùng biến từ `tokens.css`.
- [ ] Chuỗi hiển thị nằm trong slice.
- [ ] Ảnh/icon chỉ slice này dùng thì nằm trong slice.
- [ ] Test đặt cạnh code.
- [ ] `npm run check` qua.

### Khi review code

- [ ] Có import nào chọc vào ruột slice khác?
- [ ] Có gì trong `shared` nhắc đến khái niệm nghiệp vụ?
- [ ] Page có gọi API trực tiếp hoặc chứa state nghiệp vụ phức tạp?
- [ ] CSS có giá trị cứng, selector lồng sâu, `:global` hoặc `!important`?
- [ ] `index.ts` có export thừa chi tiết nội bộ?

### Dấu hiệu cấu trúc đang xuống cấp

| Dấu hiệu | Nguyên nhân thường gặp | Xử lý |
| --- | --- | --- |
| `shared/` phình to, có tên nghiệp vụ | Thiếu chỗ cho khái niệm dùng chung | Chuyển sang `entities` |
| Một feature có hơn 30 file | Gộp nhiều hành động | Tách thành nhiều feature |
| Page dài hơn 200 dòng | Page đang điều phối quá nhiều | Tách widget |
| Sửa một chỗ hỏng nhiều trang | Phụ thuộc rò rỉ qua import sâu | Bật luật 10.2 |
| Tranh cãi liên tục "cái này thuộc tầng nào" | Ranh giới feature/entity chưa rõ | Áp dụng bảng so sánh ở mục 3, tầng 4 |

---

## 13. Ranh giới áp dụng và lộ trình phát triển

### Khi nào **không** nên dùng toàn bộ cấu trúc này

| Quy mô | Gợi ý |
| --- | --- |
| Dưới 10 màn hình, 1 đến 2 người, vòng đời ngắn | `components/`, `hooks/`, `pages/`, `styles/` là đủ |
| 10 đến 30 màn hình | Dùng `app/pages/features/shared`; thêm `entities` khi lần đầu cần import chéo |
| Trên 30 màn hình hoặc nhiều đội | Dùng đầy đủ 6 tầng và luật ESLint |

Bắt đầu đơn giản, thêm tầng khi ràng buộc thực sự xuất hiện. Thêm tầng trước khi cần chỉ tạo ra chi phí phân loại mà chưa đem lại lợi ích.

### Khi nào nên tách thành monorepo

Bốn layout (Shop, Account, Seller, Admin) cho thấy ứng dụng có thể gồm nhiều sản phẩm gần như riêng biệt. Nên tách thành package khi:

- Mỗi khu có đội phát triển riêng.
- Các khu có chu kỳ phát hành khác nhau.
- Thời gian build hoặc type-check trở thành điểm nghẽn.

```
packages/
├── ui-kit/            # từ shared/ui + tokens.css
├── api-client/        # từ shared/api
├── entities/          # dùng chung giữa các app
apps/
├── shop/
├── seller/
└── admin/
```

Ranh giới package được trình biên dịch và trình quản lý gói bảo vệ, mạnh hơn ranh giới thư mục bảo vệ bằng lint.

---

## 14. Chuyển đổi từ cấu trúc cũ

Thực hiện từng bước, mỗi bước là một pull request có thể merge độc lập:

1. **Bật luật 10.2** (chặn import sâu) ở chế độ `warn`, ghi nhận số vi phạm hiện có.
2. **Sửa các import sâu** để đi qua `index.ts`. Chuyển luật sang `error`.
3. **Tạo `entities/user`**, chuyển type `User`, phiên đăng nhập và logic kiểm tra quyền từ `features/auth/model` sang. Phần còn lại của `features/auth` tách thành `login`, `register`, `reset-password`, `edit-profile`.
4. **Tạo các entity khác** (`product`, `cart`, `order`) khi gặp import chéo giữa features.
5. **Xóa `shared/config/strings.ts`**: chuyển từng nhóm chuỗi về feature tương ứng.
6. **Sửa `theme.ts`** để đọc từ CSS variables thay vì định nghĩa lại giá trị.
7. **Tạo `widgets/header`** từ phần nghiệp vụ đang nằm trong các layout.
8. **Bật luật 10.3** (boundaries) và `madge` trong CI.

---

*Tài liệu này là hợp đồng sống: khi một luật cản trở công việc nhiều lần, hãy thảo luận và sửa luật trong tài liệu, không lặng lẽ vi phạm nó.*

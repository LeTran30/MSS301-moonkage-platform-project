import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { BaseLayout } from './layouts/BaseLayout/BaseLayout';
import { AccountLayout } from './layouts/AccountLayout/AccountLayout';
import { VendorLayout } from './layouts/VendorLayout/VendorLayout';
import { AdminLayout } from './layouts/AdminLayout/AdminLayout';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { RequireAuth, RequireAdmin, RequireShop } from './guards';
import { PageLoader } from '@/shared/ui';
import { startPageViewTracking } from './providers/PageViewTracker';
import { startSessionExpiryHandling } from './providers/SessionExpiryHandler';

function withSuspense(Component: ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

// Every page is its own slice; the import goes through the slice's public API
// (`index.ts`) — package-architecture §5, "Chỉ qua cổng".
const page = <T extends Record<string, ComponentType>>(factory: () => Promise<T>, name: keyof T) =>
  lazy(async () => ({ default: (await factory())[name] }));

// Base Customer Experience Pages
const HomePage = page(() => import('@/pages/base/home'), 'HomePage');
const CatalogPage = page(() => import('@/pages/base/catalog'), 'CatalogPage');
const ProductDetailPage = page(() => import('@/pages/base/product-detail'), 'ProductDetailPage');
const CartPage = page(() => import('@/pages/base/cart'), 'CartPage');
const CheckoutPage = page(() => import('@/pages/base/checkout'), 'CheckoutPage');
const PaymentResultPage = page(() => import('@/pages/base/payment-result'), 'PaymentResultPage');
const BulkHubPage = page(() => import('@/pages/base/bulk'), 'BulkHubPage');
const NewQuoteRequestPage = page(
  () => import('@/pages/base/new-quote-request'),
  'NewQuoteRequestPage',
);
const VendorsListPage = page(() => import('@/pages/base/vendors'), 'VendorsListPage');
const VendorDetailPage = page(() => import('@/pages/base/vendor-detail'), 'VendorDetailPage');
const DirectQuoteRequestPage = page(
  () => import('@/pages/base/direct-quote-request'),
  'DirectQuoteRequestPage',
);
const SellIntroPage = page(() => import('@/pages/base/sell-intro'), 'SellIntroPage');
const SellRegisterPage = page(() => import('@/pages/base/sell-register'), 'SellRegisterPage');
const PolicyPage = page(() => import('@/pages/base/policy'), 'PolicyPage');
const NotificationsPage = page(() => import('@/pages/base/notifications'), 'NotificationsPage');

// Auth Pages
const LoginPage = page(() => import('@/pages/auth/login'), 'LoginPage');
const RegisterPage = page(() => import('@/pages/auth/register'), 'RegisterPage');
const RegisterConfirmPage = page(() => import('@/pages/auth/confirm'), 'RegisterConfirmPage');
const ForgotPasswordPage = page(() => import('@/pages/auth/forgot-password'), 'ForgotPasswordPage');
const ResetPasswordPage = page(() => import('@/pages/auth/reset-password'), 'ResetPasswordPage');

// System Pages
const NotFoundPage = page(() => import('@/pages/system/not-found'), 'NotFoundPage');

// Account Pages
const AccountOverviewPage = page(() => import('@/pages/account/overview'), 'AccountOverviewPage');
const OrdersListPage = page(() => import('@/pages/account/orders'), 'OrdersListPage');
const OrderDetailPage = page(() => import('@/pages/account/order-detail'), 'OrderDetailPage');
const OrderDisputePage = page(() => import('@/pages/account/order-dispute'), 'OrderDisputePage');
const RequestsListPage = page(() => import('@/pages/account/requests'), 'RequestsListPage');
const RequestComparePage = page(
  () => import('@/pages/account/request-compare'),
  'RequestComparePage',
);
const DepositPaymentPage = page(
  () => import('@/pages/account/deposit-payment'),
  'DepositPaymentPage',
);
const AddressesPage = page(() => import('@/pages/account/addresses'), 'AddressesPage');
const AddressFormPage = page(() => import('@/pages/account/address-form'), 'AddressFormPage');
const NfcVerifyPage = page(() => import('@/pages/account/nfc-verify'), 'NfcVerifyPage');
const ProfilePage = page(() => import('@/pages/account/profile'), 'ProfilePage');
const MessagesPage = page(() => import('@/pages/account/messages'), 'MessagesPage');

// Gateway Pages

// Vendor Pages
const VendorOverviewPage = page(() => import('@/pages/vendor/overview'), 'VendorOverviewPage');
const VendorFeePage = page(() => import('@/pages/vendor/fee'), 'VendorFeePage');
const VendorOrdersPage = page(() => import('@/pages/vendor/orders'), 'VendorOrdersPage');
const VendorMessagesPage = page(() => import('@/pages/vendor/messages'), 'VendorMessagesPage');
const VendorOrderDetailPage = page(
  () => import('@/pages/vendor/order-detail'),
  'VendorOrderDetailPage',
);
const VendorRequestsPage = page(() => import('@/pages/vendor/requests'), 'VendorRequestsPage');
const VendorRequestDetailPage = page(
  () => import('@/pages/vendor/request-detail'),
  'VendorRequestDetailPage',
);
const VendorProductsPage = page(() => import('@/pages/vendor/products'), 'VendorProductsPage');
const VendorProductFormPage = page(
  () => import('@/pages/vendor/product-form'),
  'VendorProductFormPage',
);
const VendorMoneyPage = page(() => import('@/pages/vendor/money'), 'VendorMoneyPage');
const VendorReconciliationPage = page(
  () => import('@/pages/vendor/reconciliation'),
  'VendorReconciliationPage',
);
const VendorDisbursementsPage = page(
  () => import('@/pages/vendor/disbursements'),
  'VendorDisbursementsPage',
);
const VendorSettingsPage = page(() => import('@/pages/vendor/settings'), 'VendorSettingsPage');
const VendorLegalSettingsPage = page(
  () => import('@/pages/vendor/legal-settings'),
  'VendorLegalSettingsPage',
);
const VendorZonesSettingsPage = page(
  () => import('@/pages/vendor/zones-settings'),
  'VendorZonesSettingsPage',
);
const VendorBulkTermsSettingsPage = page(
  () => import('@/pages/vendor/bulk-terms-settings'),
  'VendorBulkTermsSettingsPage',
);
const VendorCapacityPage = page(() => import('@/pages/vendor/capacity'), 'VendorCapacityPage');

// Admin Pages
const AdminOverviewPage = page(() => import('@/pages/admin/overview'), 'AdminOverviewPage');
const AdminVendorsPage = page(() => import('@/pages/admin/vendors'), 'AdminVendorsPage');
const AdminVendorDetailPage = page(
  () => import('@/pages/admin/vendor-detail'),
  'AdminVendorDetailPage',
);
const AdminProductsPage = page(() => import('@/pages/admin/products'), 'AdminProductsPage');
const AdminMoneyPage = page(() => import('@/pages/admin/money'), 'AdminMoneyPage');
const AdminDisbursementsPage = page(
  () => import('@/pages/admin/disbursements'),
  'AdminDisbursementsPage',
);
const AdminPayoutsPage = page(() => import('@/pages/admin/payouts'), 'AdminPayoutsPage');
const AdminReconciliationPage = page(
  () => import('@/pages/admin/reconciliation'),
  'AdminReconciliationPage',
);
const AdminDisputesPage = page(() => import('@/pages/admin/disputes'), 'AdminDisputesPage');
const AdminDisputeDetailPage = page(
  () => import('@/pages/admin/dispute-detail'),
  'AdminDisputeDetailPage',
);
const AdminConfigPage = page(() => import('@/pages/admin/config'), 'AdminConfigPage');
const AdminInterprovinceFeePage = page(
  () => import('@/pages/admin/interprovince-fee'),
  'AdminInterprovinceFeePage',
);
const AdminOpeningFeePage = page(() => import('@/pages/admin/opening-fee'), 'AdminOpeningFeePage');
const AdminCakeCatalogPage = page(
  () => import('@/pages/admin/cake-catalog'),
  'AdminCakeCatalogPage',
);
const AdminVouchersPage = page(() => import('@/pages/admin/vouchers'), 'AdminVouchersPage');

// Bảng route của ứng dụng. Tách ra thành hằng riêng để có thể tham chiếu
// từ nơi khác (ví dụ kiểm thử) mà không phải export toàn bộ module.
const ROUTE_TABLE = [
  // Base Customer Experience (Zone M & Base)
  {
    path: '/',
    element: <BaseLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: withSuspense(HomePage) },
      { path: 'san-pham', element: withSuspense(CatalogPage) },
      { path: 'san-pham/:id', element: withSuspense(ProductDetailPage) },
      { path: 'dat-so-luong-lon', element: withSuspense(BulkHubPage) },
      {
        path: 'dat-so-luong-lon/yeu-cau-moi',
        element: withSuspense(NewQuoteRequestPage),
      },
      { path: 'don-vi-cung-cap', element: withSuspense(VendorsListPage) },
      { path: 'don-vi-cung-cap/:id', element: withSuspense(VendorDetailPage) },
      {
        path: 'don-vi-cung-cap/:id/yeu-cau',
        element: withSuspense(DirectQuoteRequestPage),
      },
      { path: 'gio-hang', element: withSuspense(CartPage) },
      { path: 'thanh-toan', element: withSuspense(CheckoutPage) },
      { path: 'thanh-toan/ket-qua', element: withSuspense(PaymentResultPage) },
      { path: 'thong-bao', element: withSuspense(NotificationsPage) },
      { path: 'ban-hang/gioi-thieu', element: withSuspense(SellIntroPage) },
      { path: 'ban-hang/dang-ky', element: withSuspense(SellRegisterPage) },
      { path: 'chinh-sach', element: withSuspense(PolicyPage) },
      { path: 'dang-nhap', element: withSuspense(LoginPage) },
      { path: 'dang-ky', element: withSuspense(RegisterPage) },
      { path: 'dang-ky/xac-nhan', element: withSuspense(RegisterConfirmPage) },
      { path: 'quen-mat-khau', element: withSuspense(ForgotPasswordPage) },
      { path: 'dat-lai-mat-khau', element: withSuspense(ResetPasswordPage) },

      // Nested Buyer Account Zone
      {
        path: 'tai-khoan',
        element: (
          <RequireAuth>
            <AccountLayout />
          </RequireAuth>
        ),
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: withSuspense(AccountOverviewPage) },
          { path: 'don-hang', element: withSuspense(OrdersListPage) },
          { path: 'don-hang/:id', element: withSuspense(OrderDetailPage) },
          {
            path: 'don-hang/:id/khieu-nai',
            element: withSuspense(OrderDisputePage),
          },
          { path: 'yeu-cau', element: withSuspense(RequestsListPage) },
          { path: 'yeu-cau/:id', element: withSuspense(RequestComparePage) },
          {
            path: 'yeu-cau/:id/dat-coc',
            element: withSuspense(DepositPaymentPage),
          },
          { path: 'dia-chi', element: withSuspense(AddressesPage) },
          { path: 'dia-chi/moi', element: withSuspense(AddressFormPage) },
          { path: 'dia-chi/:id', element: withSuspense(AddressFormPage) },
          { path: 'xac-minh', element: withSuspense(NfcVerifyPage) },
          { path: 'thong-tin', element: withSuspense(ProfilePage) },
          { path: 'tin-nhan', element: withSuspense(MessagesPage) },
        ],
      },
    ],
  },

  // Vendor Portal (Zone B)
  {
    path: '/kenh-ban',
    element: (
      <RequireAuth>
        <RequireShop>
          <VendorLayout />
        </RequireShop>
      </RequireAuth>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: withSuspense(VendorOverviewPage) },
      { path: 'phi-mo-ban', element: withSuspense(VendorFeePage) },
      { path: 'don-hang', element: withSuspense(VendorOrdersPage) },
      { path: 'don-hang/:id', element: withSuspense(VendorOrderDetailPage) },
      { path: 'tin-nhan', element: withSuspense(VendorMessagesPage) },
      { path: 'yeu-cau', element: withSuspense(VendorRequestsPage) },
      { path: 'yeu-cau/:id', element: withSuspense(VendorRequestDetailPage) },
      {
        path: 'yeu-cau/:id/bao-gia',
        element: withSuspense(VendorRequestDetailPage),
      },
      { path: 'san-pham', element: withSuspense(VendorProductsPage) },
      { path: 'san-pham/moi', element: withSuspense(VendorProductFormPage) },
      { path: 'san-pham/:id', element: withSuspense(VendorProductFormPage) },
      { path: 'tien', element: withSuspense(VendorMoneyPage) },
      {
        path: 'tien/doi-soat',
        element: withSuspense(VendorReconciliationPage),
      },
      {
        path: 'tien/giai-ngan',
        element: withSuspense(VendorDisbursementsPage),
      },
      { path: 'cai-dat', element: withSuspense(VendorSettingsPage) },
      {
        path: 'cai-dat/phap-ly',
        element: withSuspense(VendorLegalSettingsPage),
      },
      {
        path: 'cai-dat/vung-giao',
        element: withSuspense(VendorZonesSettingsPage),
      },
      {
        path: 'cai-dat/nhan-dat-hang',
        element: withSuspense(VendorBulkTermsSettingsPage),
      },
      { path: 'cai-dat/cong-suat', element: withSuspense(VendorCapacityPage) },
    ],
  },

  // Admin Portal (Zone Q)
  {
    path: '/quan-tri',
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: withSuspense(AdminOverviewPage) },
      { path: 'nguoi-ban', element: withSuspense(AdminVendorsPage) },
      { path: 'nguoi-ban/:id', element: withSuspense(AdminVendorDetailPage) },
      { path: 'san-pham', element: withSuspense(AdminProductsPage) },
      { path: 'tien', element: withSuspense(AdminMoneyPage) },
      { path: 'tien/giai-ngan', element: withSuspense(AdminDisbursementsPage) },
      { path: 'tien/chuyen-tien', element: withSuspense(AdminPayoutsPage) },
      { path: 'tien/doi-soat', element: withSuspense(AdminReconciliationPage) },
      { path: 'khieu-nai', element: withSuspense(AdminDisputesPage) },
      { path: 'khieu-nai/:id', element: withSuspense(AdminDisputeDetailPage) },
      { path: 'cau-hinh', element: withSuspense(AdminConfigPage) },
      {
        path: 'cau-hinh/phi-lien-tinh',
        element: withSuspense(AdminInterprovinceFeePage),
      },
      {
        path: 'cau-hinh/phi-mo-ban',
        element: withSuspense(AdminOpeningFeePage),
      },
      { path: 'cau-hinh/vo-nhan', element: withSuspense(AdminCakeCatalogPage) },
      { path: 'cau-hinh/voucher', element: withSuspense(AdminVouchersPage) },
    ],
  },

  // Fallback 404 (Không tìm thấy trang)
  {
    path: '*',
    element: <BaseLayout>{withSuspense(NotFoundPage)}</BaseLayout>,
  },
];

const router = createBrowserRouter(ROUTE_TABLE);

// Gửi sự kiện `page_view` cho analytics mỗi khi router điều hướng xong.
//
// Đăng ký ở đây (ngoài cây React) vì `useLocation` / `useMatches` của React
// Router chỉ dùng được **bên trong** `<RouterProvider>` — mà `AppProviders`
// lại là cha của nó. Dùng `router.subscribe` thì không bị ràng buộc vị trí
// render nào, và vẫn nhận đúng mẫu route (`/san-pham/:id`) từ `matches`.
startPageViewTracking(router);

// Hết phiên (401 không cứu được) → về trang đăng nhập, rồi quay lại trang cũ.
startSessionExpiryHandling(router);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

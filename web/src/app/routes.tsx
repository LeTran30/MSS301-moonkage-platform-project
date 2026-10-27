import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/entities/user';
import { legacyRoutes, routes } from '@/shared/config/routes';
import { AccountLayout, AdminLayout, AuthLayout, BaseLayout, VendorLayout } from './layouts';
import { page } from './lazyPage';
import { RouteErrorBoundary } from './RouteErrorBoundary';

const guarded = (element: ReactNode) => <RequireAuth>{element}</RequireAuth>;
/** Route pattern of a path that carries a query string: the router matches the path alone. */
const pattern = (path: string) => path.split('?')[0];

/* Base, auth and account areas (M) */
const HomePage = page(() => import('@/pages/base/home'), 'HomePage');
const ProductListPage = page(() => import('@/pages/base/products'), 'ProductListPage');
const ProductDetailPage = page(() => import('@/pages/base/product-detail'), 'ProductDetailPage');
const CustomOrderPage = page(() => import('@/pages/base/custom-order'), 'CustomOrderPage');
const NewQuoteRequestPage = page(() => import('@/pages/base/new-quote-request'), 'NewQuoteRequestPage');
const VendorDirectoryPage = page(() => import('@/pages/base/vendor-directory'), 'VendorDirectoryPage');
const VendorStorefrontPage = page(() => import('@/pages/base/vendor-storefront'), 'VendorStorefrontPage');
const DirectRequestPage = page(() => import('@/pages/base/direct-request'), 'DirectRequestPage');
const CartPage = page(() => import('@/pages/base/cart'), 'CartPage');
const CheckoutPage = page(() => import('@/pages/base/checkout'), 'CheckoutPage');
const VnpayPage = page(() => import('@/pages/gateway/vnpay'), 'VnpayPage');
const PaymentResultPage = page(() => import('@/pages/base/payment-result'), 'PaymentResultPage');
const LoginPage = page(() => import('@/pages/auth/login'), 'LoginPage');
const RegisterPage = page(() => import('@/pages/auth/register'), 'RegisterPage');
const ConfirmAccountPage = page(() => import('@/pages/auth/confirm-account'), 'ConfirmAccountPage');
const ForgotPasswordPage = page(() => import('@/pages/auth/forgot-password'), 'ForgotPasswordPage');
const ResetPasswordPage = page(() => import('@/pages/auth/reset-password'), 'ResetPasswordPage');
const AccountOverviewPage = page(() => import('@/pages/account/overview'), 'AccountOverviewPage');
const OrdersPage = page(() => import('@/pages/account/orders'), 'OrdersPage');
const OrderDetailPage = page(() => import('@/pages/account/order-detail'), 'OrderDetailPage');
const OrderComplaintPage = page(() => import('@/pages/account/order-complaint'), 'OrderComplaintPage');
const QuoteRequestsPage = page(() => import('@/pages/account/quote-requests'), 'QuoteRequestsPage');
const QuoteRequestPage = page(() => import('@/pages/account/quote-request-detail'), 'QuoteRequestPage');
const AcceptQuotePage = page(() => import('@/pages/account/accept-quote'), 'AcceptQuotePage');
const AddressesPage = page(() => import('@/pages/account/addresses'), 'AddressesPage');
const AddressFormPage = page(() => import('@/pages/account/address-form'), 'AddressFormPage');
const VerifyNfcPage = page(() => import('@/pages/account/verify-nfc'), 'VerifyNfcPage');
const ProfilePage = page(() => import('@/pages/account/profile'), 'ProfilePage');
const NotificationsPage = page(() => import('@/pages/account/notifications'), 'NotificationsPage');
const SellIntroPage = page(() => import('@/pages/base/sell-intro'), 'SellIntroPage');
const ApplyToSellPage = page(() => import('@/pages/account/apply-to-sell'), 'ApplyToSellPage');
const PolicyPage = page(() => import('@/pages/base/policy'), 'PolicyPage');
/* Kênh người bán (B) */
const VendorOverviewPage = page(() => import('@/pages/vendor/overview'), 'VendorOverviewPage');
const VendorFeePage = page(() => import('@/pages/vendor/fee'), 'VendorFeePage');
const VendorOrdersPage = page(() => import('@/pages/vendor/orders'), 'VendorOrdersPage');
const VendorOrderPage = page(() => import('@/pages/vendor/order-detail'), 'VendorOrderPage');
const VendorRequestsPage = page(() => import('@/pages/vendor/requests'), 'VendorRequestsPage');
const VendorRequestPage = page(() => import('@/pages/vendor/request-detail'), 'VendorRequestPage');
const VendorQuotePage = page(() => import('@/pages/vendor/quote'), 'VendorQuotePage');
const VendorProductsPage = page(() => import('@/pages/vendor/products'), 'VendorProductsPage');
const VendorProductPage = page(() => import('@/pages/vendor/product-detail'), 'VendorProductPage');
const VendorMoneyPage = page(() => import('@/pages/vendor/money'), 'VendorMoneyPage');
const VendorSettlementsPage = page(() => import('@/pages/vendor/settlements'), 'VendorSettlementsPage');
const VendorDisbursementsPage = page(() => import('@/pages/vendor/disbursements'), 'VendorDisbursementsPage');
const VendorSettingsPage = page(() => import('@/pages/vendor/settings'), 'VendorSettingsPage');
const VendorLegalPage = page(() => import('@/pages/vendor/legal'), 'VendorLegalPage');
const VendorZonesPage = page(() => import('@/pages/vendor/zones'), 'VendorZonesPage');
const VendorTermsPage = page(() => import('@/pages/vendor/terms'), 'VendorTermsPage');
const VendorCapacityPage = page(() => import('@/pages/vendor/capacity'), 'VendorCapacityPage');
const VendorNotificationsPage = page(() => import('@/pages/vendor/notifications'), 'VendorNotificationsPage');

/* Quản trị (Q) */
const AdminOverviewPage = page(() => import('@/pages/admin/overview'), 'AdminOverviewPage');
const AdminVendorsPage = page(() => import('@/pages/admin/vendors'), 'AdminVendorsPage');
const AdminVendorPage = page(() => import('@/pages/admin/vendor-detail'), 'AdminVendorPage');
const AdminProductsPage = page(() => import('@/pages/admin/products'), 'AdminProductsPage');
const AdminMoneyPage = page(() => import('@/pages/admin/money'), 'AdminMoneyPage');
const AdminDisbursementsPage = page(() => import('@/pages/admin/disbursements'), 'AdminDisbursementsPage');
const AdminPayoutsPage = page(() => import('@/pages/admin/payouts'), 'AdminPayoutsPage');
const AdminReconciliationPage = page(() => import('@/pages/admin/reconciliation'), 'AdminReconciliationPage');
const AdminDisputesPage = page(() => import('@/pages/admin/disputes'), 'AdminDisputesPage');
const AdminDisputePage = page(() => import('@/pages/admin/dispute-detail'), 'AdminDisputePage');
const AdminConfigPage = page(() => import('@/pages/admin/config'), 'AdminConfigPage');
const AdminProvinceFeesPage = page(() => import('@/pages/admin/province-fees'), 'AdminProvinceFeesPage');
const AdminVendorFeePage = page(() => import('@/pages/admin/vendor-fee'), 'AdminVendorFeePage');
const AdminVouchersPage = page(() => import('@/pages/admin/vouchers'), 'AdminVouchersPage');
const AdminTaxonomyPage = page(() => import('@/pages/admin/taxonomy'), 'AdminTaxonomyPage');
const NotFoundPage = page(() => import('@/pages/system/not-found'), 'NotFoundPage');

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: routes.auth.login, element: LoginPage },
      { path: routes.auth.register, element: RegisterPage },
      { path: routes.auth.confirmAccount, element: ConfirmAccountPage },
      { path: routes.auth.forgotPassword, element: ForgotPasswordPage },
      { path: routes.auth.resetPassword, element: ResetPasswordPage },
    ],
  },
  { path: routes.gateway.vnpay(':paymentId'), element: guarded(VnpayPage) },
  { path: legacyRoutes.login, element: <Navigate to={routes.auth.login} replace /> },
  {
    path: routes.vendor.overview,
    element: guarded(<VendorLayout />),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: VendorOverviewPage },
      { path: routes.vendor.fee, element: VendorFeePage },
      { path: routes.vendor.orders, element: VendorOrdersPage },
      { path: routes.vendor.order(':orderId'), element: VendorOrderPage },
      { path: routes.vendor.requests, element: VendorRequestsPage },
      { path: routes.vendor.request(':requestId'), element: VendorRequestPage },
      { path: routes.vendor.quote(':requestId'), element: VendorQuotePage },
      { path: routes.vendor.products, element: VendorProductsPage },
      { path: routes.vendor.product(':productId'), element: VendorProductPage },
      { path: routes.vendor.money, element: VendorMoneyPage },
      { path: routes.vendor.settlements, element: VendorSettlementsPage },
      { path: routes.vendor.disbursements, element: VendorDisbursementsPage },
      { path: routes.vendor.settings, element: VendorSettingsPage },
      { path: routes.vendor.legal, element: VendorLegalPage },
      { path: routes.vendor.zones, element: VendorZonesPage },
      { path: routes.vendor.terms, element: VendorTermsPage },
      { path: routes.vendor.capacity, element: VendorCapacityPage },
      { path: routes.vendor.notifications, element: VendorNotificationsPage },
      { path: '*', element: NotFoundPage },
    ],
  },
  {
    path: routes.admin.overview,
    element: guarded(<AdminLayout />),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: AdminOverviewPage },
      { path: routes.admin.vendors, element: AdminVendorsPage },
      { path: routes.admin.vendor(':vendorId'), element: AdminVendorPage },
      { path: routes.admin.products, element: AdminProductsPage },
      { path: routes.admin.money, element: AdminMoneyPage },
      { path: routes.admin.disbursements, element: AdminDisbursementsPage },
      { path: routes.admin.payouts, element: AdminPayoutsPage },
      { path: routes.admin.reconciliation, element: AdminReconciliationPage },
      { path: routes.admin.disputes, element: AdminDisputesPage },
      { path: routes.admin.dispute(':disputeId'), element: AdminDisputePage },
      { path: routes.admin.config, element: AdminConfigPage },
      { path: routes.admin.provinceFees, element: AdminProvinceFeesPage },
      { path: routes.admin.vendorFee, element: AdminVendorFeePage },
      { path: routes.admin.vouchers, element: AdminVouchersPage },
      { path: routes.admin.taxonomy, element: AdminTaxonomyPage },
      { path: '*', element: NotFoundPage },
    ],
  },
  {
    element: <BaseLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: HomePage },
      { path: routes.base.products, element: ProductListPage },
      { path: routes.base.product(':productId'), element: ProductDetailPage },
      { path: routes.base.customOrder, element: CustomOrderPage },
      { path: routes.base.newQuoteRequest, element: guarded(NewQuoteRequestPage) },
      { path: routes.base.vendorDirectory, element: VendorDirectoryPage },
      { path: routes.base.vendorStorefront(':vendorId'), element: VendorStorefrontPage },
      { path: routes.base.directRequest(':vendorId'), element: guarded(DirectRequestPage) },
      { path: routes.base.cart, element: guarded(CartPage) },
      { path: routes.base.checkout, element: guarded(CheckoutPage) },
      { path: routes.base.paymentResult(':paymentId'), element: guarded(PaymentResultPage) },
      { path: routes.base.sellIntro, element: SellIntroPage },
      { path: routes.base.policy, element: PolicyPage },
      {
        path: routes.account.overview,
        element: guarded(<AccountLayout />),
        children: [
          { index: true, element: AccountOverviewPage },
          { path: routes.account.orders, element: OrdersPage },
          { path: routes.account.order(':orderId'), element: OrderDetailPage },
          { path: routes.account.orderComplaint(':orderId'), element: OrderComplaintPage },
          { path: routes.account.quoteRequests, element: QuoteRequestsPage },
          { path: routes.account.quoteRequest(':requestId'), element: QuoteRequestPage },
          { path: pattern(routes.account.acceptQuote(':requestId', '')), element: AcceptQuotePage },
          { path: routes.account.addresses, element: AddressesPage },
          { path: routes.account.address(':addressId'), element: AddressFormPage },
          { path: routes.account.verifyNfc, element: VerifyNfcPage },
          { path: routes.account.profile, element: ProfilePage },
          { path: routes.account.notifications, element: NotificationsPage },
          { path: routes.account.applyToSell, element: ApplyToSellPage },
        ],
      },
      { path: '*', element: NotFoundPage },
    ],
  },
]);

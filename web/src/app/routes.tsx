import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from '../features/auth';
import { legacyRoutes, routes } from '../shared/config/routes';
import { AccountLayout } from './layouts/AccountLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { SellerLayout } from './layouts/SellerLayout';
import { ShopLayout } from './layouts/ShopLayout';
import { page } from './lazyPage';

const guarded = (element: ReactNode) => <RequireAuth>{element}</RequireAuth>;

/* Buying area (M) */
const HomePage = page(() => import('../pages/home/HomePage'), 'HomePage');
const ProductListPage = page(() => import('../pages/products/ProductListPage'), 'ProductListPage');
const ProductDetailPage = page(() => import('../pages/product-detail/ProductDetailPage'), 'ProductDetailPage');
const CustomOrderPage = page(() => import('../pages/custom-order/CustomOrderPage'), 'CustomOrderPage');
const NewQuoteRequestPage = page(() => import('../pages/new-quote-request/NewQuoteRequestPage'), 'NewQuoteRequestPage');
const SupplierListPage = page(() => import('../pages/suppliers/SupplierListPage'), 'SupplierListPage');
const SupplierPage = page(() => import('../pages/supplier/SupplierPage'), 'SupplierPage');
const SupplierRequestPage = page(() => import('../pages/supplier-request/SupplierRequestPage'), 'SupplierRequestPage');
const CartPage = page(() => import('../pages/cart/CartPage'), 'CartPage');
const CheckoutPage = page(() => import('../pages/checkout/CheckoutPage'), 'CheckoutPage');
const VnpayPage = page(() => import('../pages/vnpay/VnpayPage'), 'VnpayPage');
const PaymentResultPage = page(() => import('../pages/payment-result/PaymentResultPage'), 'PaymentResultPage');
const LoginPage = page(() => import('../pages/login/LoginPage'), 'LoginPage');
const RegisterPage = page(() => import('../pages/register/RegisterPage'), 'RegisterPage');
const ConfirmAccountPage = page(() => import('../pages/confirm-account/ConfirmAccountPage'), 'ConfirmAccountPage');
const ForgotPasswordPage = page(() => import('../pages/forgot-password/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = page(() => import('../pages/reset-password/ResetPasswordPage'), 'ResetPasswordPage');
const AccountOverviewPage = page(() => import('../pages/account/AccountOverviewPage'), 'AccountOverviewPage');
const OrdersPage = page(() => import('../pages/orders/OrdersPage'), 'OrdersPage');
const OrderDetailPage = page(() => import('../pages/order-detail/OrderDetailPage'), 'OrderDetailPage');
const OrderComplaintPage = page(() => import('../pages/order-complaint/OrderComplaintPage'), 'OrderComplaintPage');
const QuoteRequestsPage = page(() => import('../pages/quote-requests/QuoteRequestsPage'), 'QuoteRequestsPage');
const QuoteRequestPage = page(() => import('../pages/quote-request/QuoteRequestPage'), 'QuoteRequestPage');
const AcceptQuotePage = page(() => import('../pages/accept-quote/AcceptQuotePage'), 'AcceptQuotePage');
const AddressesPage = page(() => import('../pages/addresses/AddressesPage'), 'AddressesPage');
const AddressFormPage = page(() => import('../pages/address-form/AddressFormPage'), 'AddressFormPage');
const VerifyNfcPage = page(() => import('../pages/verify-nfc/VerifyNfcPage'), 'VerifyNfcPage');
const ProfilePage = page(() => import('../pages/profile/ProfilePage'), 'ProfilePage');
const NotificationsPage = page(() => import('../pages/notifications/NotificationsPage'), 'NotificationsPage');
const SellIntroPage = page(() => import('../pages/sell-intro/SellIntroPage'), 'SellIntroPage');
const SellApplyPage = page(() => import('../pages/sell-apply/SellApplyPage'), 'SellApplyPage');
const PolicyPage = page(() => import('../pages/policy/PolicyPage'), 'PolicyPage');
/* Kênh người bán (B): one module, one lazy chunk */
const seller = () => import('../pages/seller/SellerPages');
const SellerOverviewPage = page(seller, 'SellerOverviewPage');
const SellerFeePage = page(seller, 'SellerFeePage');
const SellerOrdersPage = page(seller, 'SellerOrdersPage');
const SellerOrderPage = page(seller, 'SellerOrderPage');
const SellerRequestsPage = page(seller, 'SellerRequestsPage');
const SellerRequestPage = page(seller, 'SellerRequestPage');
const SellerQuotePage = page(seller, 'SellerQuotePage');
const SellerProductsPage = page(seller, 'SellerProductsPage');
const SellerProductPage = page(seller, 'SellerProductPage');
const SellerMoneyPage = page(seller, 'SellerMoneyPage');
const SellerSettlementsPage = page(seller, 'SellerSettlementsPage');
const SellerDisbursementsPage = page(seller, 'SellerDisbursementsPage');
const SellerSettingsPage = page(seller, 'SellerSettingsPage');
const SellerLegalPage = page(seller, 'SellerLegalPage');
const SellerZonesPage = page(seller, 'SellerZonesPage');
const SellerTermsPage = page(seller, 'SellerTermsPage');
const SellerCapacityPage = page(seller, 'SellerCapacityPage');
const SellerNotificationsPage = page(seller, 'SellerNotificationsPage');

/* Quản trị (Q): one module, one lazy chunk */
const admin = () => import('../pages/admin/AdminPages');
const AdminOverviewPage = page(admin, 'AdminOverviewPage');
const AdminSellersPage = page(admin, 'AdminSellersPage');
const AdminSellerPage = page(admin, 'AdminSellerPage');
const AdminProductsPage = page(admin, 'AdminProductsPage');
const AdminMoneyPage = page(admin, 'AdminMoneyPage');
const AdminDisbursementsPage = page(admin, 'AdminDisbursementsPage');
const AdminPayoutsPage = page(admin, 'AdminPayoutsPage');
const AdminReconciliationPage = page(admin, 'AdminReconciliationPage');
const AdminDisputesPage = page(admin, 'AdminDisputesPage');
const AdminDisputePage = page(admin, 'AdminDisputePage');
const AdminConfigPage = page(admin, 'AdminConfigPage');
const AdminProvinceFeesPage = page(admin, 'AdminProvinceFeesPage');
const AdminSellerFeePage = page(admin, 'AdminSellerFeePage');
const AdminVouchersPage = page(admin, 'AdminVouchersPage');
const AdminTaxonomyPage = page(admin, 'AdminTaxonomyPage');
const NotFoundPage = page(() => import('../pages/not-found/NotFoundPage'), 'NotFoundPage');

export const router = createBrowserRouter([
  { path: routes.login, element: LoginPage },
  { path: routes.register, element: RegisterPage },
  { path: routes.confirmAccount, element: ConfirmAccountPage },
  { path: routes.forgotPassword, element: ForgotPasswordPage },
  { path: routes.resetPassword, element: ResetPasswordPage },
  { path: '/vnpay/:paymentId', element: guarded(VnpayPage) },
  { path: legacyRoutes.login, element: <Navigate to={routes.login} replace /> },
  { path: legacyRoutes.verifyNfc, element: <Navigate to={routes.verifyNfc} replace /> },
  {
    path: routes.sellerChannel,
    element: guarded(<SellerLayout />),
    children: [
      { index: true, element: SellerOverviewPage },
      { path: 'phi-mo-ban', element: SellerFeePage },
      { path: 'don-hang', element: SellerOrdersPage },
      { path: 'don-hang/:orderId', element: SellerOrderPage },
      { path: 'yeu-cau', element: SellerRequestsPage },
      { path: 'yeu-cau/:requestId', element: SellerRequestPage },
      { path: 'yeu-cau/:requestId/bao-gia', element: SellerQuotePage },
      { path: 'san-pham', element: SellerProductsPage },
      { path: 'san-pham/:productId', element: SellerProductPage },
      { path: 'tien', element: SellerMoneyPage },
      { path: 'tien/doi-soat', element: SellerSettlementsPage },
      { path: 'tien/giai-ngan', element: SellerDisbursementsPage },
      { path: 'cai-dat', element: SellerSettingsPage },
      { path: 'cai-dat/phap-ly', element: SellerLegalPage },
      { path: 'cai-dat/vung-giao', element: SellerZonesPage },
      { path: 'cai-dat/nhan-dat-hang', element: SellerTermsPage },
      { path: 'cai-dat/cong-suat', element: SellerCapacityPage },
      { path: 'thong-bao', element: SellerNotificationsPage },
      { path: '*', element: NotFoundPage },
    ],
  },
  {
    path: routes.admin,
    element: guarded(<AdminLayout />),
    children: [
      { index: true, element: AdminOverviewPage },
      { path: 'nguoi-ban', element: AdminSellersPage },
      { path: 'nguoi-ban/:applicationId', element: AdminSellerPage },
      { path: 'san-pham', element: AdminProductsPage },
      { path: 'tien', element: AdminMoneyPage },
      { path: 'tien/giai-ngan', element: AdminDisbursementsPage },
      { path: 'tien/chuyen-tien', element: AdminPayoutsPage },
      { path: 'tien/doi-soat', element: AdminReconciliationPage },
      { path: 'khieu-nai', element: AdminDisputesPage },
      { path: 'khieu-nai/:disputeId', element: AdminDisputePage },
      { path: 'cau-hinh', element: AdminConfigPage },
      { path: 'cau-hinh/phi-lien-tinh', element: AdminProvinceFeesPage },
      { path: 'cau-hinh/phi-mo-ban', element: AdminSellerFeePage },
      { path: 'cau-hinh/voucher', element: AdminVouchersPage },
      { path: 'cau-hinh/vo-nhan', element: AdminTaxonomyPage },
      { path: '*', element: NotFoundPage },
    ],
  },
  {
    element: <ShopLayout />,
    children: [
      { index: true, element: HomePage },
      { path: routes.products, element: ProductListPage },
      { path: '/san-pham/:productId', element: ProductDetailPage },
      { path: routes.customOrder, element: CustomOrderPage },
      { path: routes.newQuoteRequest, element: guarded(NewQuoteRequestPage) },
      { path: routes.suppliers, element: SupplierListPage },
      { path: '/don-vi-cung-cap/:supplierId', element: SupplierPage },
      { path: '/don-vi-cung-cap/:supplierId/yeu-cau', element: guarded(SupplierRequestPage) },
      { path: routes.cart, element: guarded(CartPage) },
      { path: routes.checkout, element: guarded(CheckoutPage) },
      { path: '/thanh-toan/ket-qua/:paymentId', element: guarded(PaymentResultPage) },
      { path: routes.notifications, element: guarded(NotificationsPage) },
      { path: routes.sellIntro, element: SellIntroPage },
      { path: routes.sellApply, element: guarded(SellApplyPage) },
      { path: routes.policy, element: PolicyPage },
      {
        path: routes.account,
        element: guarded(<AccountLayout />),
        children: [
          { index: true, element: AccountOverviewPage },
          { path: 'don-hang', element: OrdersPage },
          { path: 'don-hang/:orderId', element: OrderDetailPage },
          { path: 'don-hang/:orderId/khieu-nai', element: OrderComplaintPage },
          { path: 'yeu-cau', element: QuoteRequestsPage },
          { path: 'yeu-cau/:requestId', element: QuoteRequestPage },
          { path: 'yeu-cau/:requestId/dat-coc', element: AcceptQuotePage },
          { path: 'dia-chi', element: AddressesPage },
          { path: 'dia-chi/:addressId', element: AddressFormPage },
          { path: 'xac-minh', element: VerifyNfcPage },
          { path: 'thong-tin', element: ProfilePage },
        ],
      },
      { path: '*', element: NotFoundPage },
    ],
  },
]);

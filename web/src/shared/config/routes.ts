/** Query parameter of the accept-quote path that names the chosen vendor. */
export const acceptQuoteVendorParam = 'vendor';

/** Path segment that opens a create form in place of an item id. */
export const newItemSlug = 'new';

/**
 * Paths of every screen, one group per area, like `src/pages/<area>/<slice>`.
 * Each area has one layout and one URL prefix; the base area is mounted at the root.
 */
export const routes = {
  base: {
    home: '/',
    products: '/products',
    product: (productId: string) => `/products/${productId}`,
    customOrder: '/custom-order',
    newQuoteRequest: '/custom-order/new',
    vendorDirectory: '/vendors',
    vendorStorefront: (vendorId: string) => `/vendors/${vendorId}`,
    directRequest: (vendorId: string) => `/vendors/${vendorId}/request`,
    cart: '/cart',
    checkout: '/checkout',
    paymentResult: (paymentId: string) => `/checkout/result/${paymentId}`,
    sellIntro: '/sell',
    policy: '/policy',
  },
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    confirmAccount: '/auth/register/confirm',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  account: {
    overview: '/account',
    orders: '/account/orders',
    order: (orderId: string) => `/account/orders/${orderId}`,
    orderComplaint: (orderId: string) => `/account/orders/${orderId}/complaint`,
    quoteRequests: '/account/quote-requests',
    quoteRequest: (requestId: string) => `/account/quote-requests/${requestId}`,
    acceptQuote: (requestId: string, vendorId: string) =>
      `/account/quote-requests/${requestId}/deposit?${new URLSearchParams({ [acceptQuoteVendorParam]: vendorId })}`,
    addresses: '/account/addresses',
    address: (addressId: string) => `/account/addresses/${addressId}`,
    newAddress: `/account/addresses/${newItemSlug}`,
    verifyNfc: '/account/verify-nfc',
    profile: '/account/profile',
    notifications: '/account/notifications',
    applyToSell: '/account/apply-to-sell',
  },
  vendor: {
    overview: '/vendor',
    fee: '/vendor/fee',
    orders: '/vendor/orders',
    order: (orderId: string) => `/vendor/orders/${orderId}`,
    requests: '/vendor/requests',
    request: (requestId: string) => `/vendor/requests/${requestId}`,
    quote: (requestId: string) => `/vendor/requests/${requestId}/quote`,
    products: '/vendor/products',
    product: (productId: string) => `/vendor/products/${productId}`,
    newProduct: `/vendor/products/${newItemSlug}`,
    money: '/vendor/money',
    settlements: '/vendor/money/settlements',
    disbursements: '/vendor/money/disbursements',
    settings: '/vendor/settings',
    legal: '/vendor/settings/legal',
    zones: '/vendor/settings/zones',
    terms: '/vendor/settings/terms',
    capacity: '/vendor/settings/capacity',
    notifications: '/vendor/notifications',
  },
  admin: {
    overview: '/admin',
    vendors: '/admin/vendors',
    vendor: (vendorId: string) => `/admin/vendors/${vendorId}`,
    products: '/admin/products',
    money: '/admin/money',
    disbursements: '/admin/money/disbursements',
    payouts: '/admin/money/payouts',
    reconciliation: '/admin/money/reconciliation',
    disputes: '/admin/disputes',
    dispute: (disputeId: string) => `/admin/disputes/${disputeId}`,
    config: '/admin/config',
    provinceFees: '/admin/config/province-fees',
    vendorFee: '/admin/config/vendor-fee',
    vouchers: '/admin/config/vouchers',
    taxonomy: '/admin/config/taxonomy',
  },
  /** Screens of external actors, mocked for the demo; in production they live on the actor's own domain. */
  gateway: {
    vnpay: (paymentId: string) => `/gateway/vnpay/${paymentId}`,
  },
};

/** Paths used before the current paths; they redirect so old bookmarks keep working. */
export const legacyRoutes = {
  login: '/login',
};

/** Where login returns to when no page was asked for. */
export const homeRoute = routes.base.home;

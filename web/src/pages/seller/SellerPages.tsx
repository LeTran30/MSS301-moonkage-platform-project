import { useNavigate, useParams } from 'react-router-dom';
import { ProductCard } from '../../features/catalog';
import { startPayment } from '../../features/payments';
import {
  CapacityDeferred,
  CustomTermsForm,
  DeliveryZonesForm,
  LegalInfo,
  QuoteComposer,
  SELLER_FEE,
  SellerCustomOrderView,
  SellerDisbursements,
  SellerFee,
  SellerMoneyOverview,
  SellerOrders,
  SellerOverview,
  SellerProductEditor,
  SellerProductList,
  SellerReadyOrderView,
  SellerRequestDetail,
  SellerRequestList,
  SellerSettlements,
  SettingsHub,
  ShopNotifications,
  useIncomingRequest,
  useIncomingRequests,
  useInterProvinceFees,
  useSellerOrder,
  useSellerOrders,
  useSellerProduct,
  useTerms,
  useZones,
} from '../../features/seller';
import { routes } from '../../shared/config/routes';
import { EmptyState, LoadingState } from '../../shared/ui';
import { OpenOnly } from './OpenOnly';
import { useSellerContext, useSellerReload } from './useSellerContext';

/* One route = one page; the Kênh người bán pages are small enough to sit together. */

/** B1.0 */
export function SellerOverviewPage() {
  const profile = useSellerContext();
  const reload = useSellerReload();
  const orders = useSellerOrders();
  const requests = useIncomingRequests();
  if (orders.kind === 'loading' || requests.kind === 'loading') return <LoadingState />;
  return (
    <SellerOverview
      profile={profile}
      orders={orders.kind === 'loaded' ? orders.data : []}
      newRequests={requests.kind === 'loaded' ? requests.data.filter((r) => r.state === 'new').length : 0}
      onChanged={reload}
    />
  );
}

/** B1.1 */
export function SellerFeePage() {
  const profile = useSellerContext();
  const navigate = useNavigate();
  if (profile.state !== 'approved') return <EmptyState title={profile.state === 'open' ? 'Đã đóng phí mở bán' : 'Đóng phí sau khi hồ sơ được duyệt'} />;
  return (
    <SellerFee
      profile={profile}
      onLater={() => navigate(routes.sellerChannel)}
      onPay={async () => {
        const payment = await startPayment('seller-fee', SELLER_FEE, `Phí mở bán · ${profile.shopName}`);
        navigate(routes.vnpay(payment.id));
      }}
    />
  );
}

/** B2.0 */
export function SellerOrdersPage() {
  return (
    <OpenOnly>
      <SellerOrders />
    </OpenOnly>
  );
}

/** B2.1 / B2.2 */
export function SellerOrderPage() {
  const { orderId = '' } = useParams();
  const order = useSellerOrder(orderId);
  if (order.kind === 'loading') return <LoadingState />;
  if (order.kind !== 'loaded' || !order.data) return <EmptyState title={`Không có đơn ${orderId}`} />;
  return (
    <OpenOnly>
      {order.data.kind === 'ready' ? (
        <SellerReadyOrderView order={order.data} onChanged={order.reload} />
      ) : (
        <SellerCustomOrderView order={order.data} onChanged={order.reload} />
      )}
    </OpenOnly>
  );
}

/** B3.0 */
export function SellerRequestsPage() {
  return (
    <OpenOnly>
      <SellerRequestList />
    </OpenOnly>
  );
}

/** B3.1 */
export function SellerRequestPage() {
  const { requestId = '' } = useParams();
  const request = useIncomingRequest(requestId);
  if (request.kind === 'loading') return <LoadingState />;
  if (request.kind !== 'loaded' || !request.data) return <EmptyState title={`Không có yêu cầu ${requestId}`} />;
  return (
    <OpenOnly>
      <SellerRequestDetail request={request.data} onChanged={request.reload} />
    </OpenOnly>
  );
}

/** B3.2 */
export function SellerQuotePage() {
  const { requestId = '' } = useParams();
  const navigate = useNavigate();
  const request = useIncomingRequest(requestId);
  const terms = useTerms();
  if (request.kind === 'loading' || terms.kind === 'loading') return <LoadingState />;
  if (request.kind !== 'loaded' || !request.data || terms.kind !== 'loaded') return <EmptyState title={`Không có yêu cầu ${requestId}`} />;
  return (
    <OpenOnly>
      <QuoteComposer
        request={request.data}
        terms={terms.data}
        onCancel={() => navigate(routes.sellerRequest(requestId))}
        onSent={() => navigate(routes.sellerRequest(requestId))}
      />
    </OpenOnly>
  );
}

/** B4.0 */
export function SellerProductsPage() {
  return (
    <OpenOnly>
      <SellerProductList />
    </OpenOnly>
  );
}

/** B4.1: `moi` adds a product. */
export function SellerProductPage() {
  const { productId = 'moi' } = useParams();
  const navigate = useNavigate();
  const profile = useSellerContext();
  const product = useSellerProduct(productId === 'moi' ? '' : productId);
  if (productId !== 'moi' && product.kind === 'loading') return <LoadingState />;
  const current = product.kind === 'loaded' ? product.data : null;
  return (
    <OpenOnly>
      <SellerProductEditor
        key={productId}
        product={current}
        shopName={profile.shopName}
        onSaved={() => navigate(routes.sellerProducts)}
        onCancel={() => navigate(routes.sellerProducts)}
        preview={(v) => (
          <ProductCard
            product={{
              id: current?.id ?? 'preview',
              name: v.name,
              shopId: 'preview',
              shopName: profile.shopName,
              district: null,
              brand: profile.shopName,
              crust: 'nuong',
              fillings: [],
              price: v.price,
              rating: null,
              reviewCount: 0,
              deliverTo: [],
              pack: 'Quy cách theo mô tả',
              stock: current?.stock ?? 0,
              images: [],
            }}
          />
        )}
      />
    </OpenOnly>
  );
}

/** B5.0 */
export function SellerMoneyPage() {
  const profile = useSellerContext();
  return (
    <OpenOnly>
      <SellerMoneyOverview takesCustom={profile.ways.custom} />
    </OpenOnly>
  );
}

/** B5.1 */
export function SellerSettlementsPage() {
  return (
    <OpenOnly>
      <SellerSettlements />
    </OpenOnly>
  );
}

/** B5.2 */
export function SellerDisbursementsPage() {
  return (
    <OpenOnly>
      <SellerDisbursements />
    </OpenOnly>
  );
}

/** B6.0 */
export function SellerSettingsPage() {
  return <SettingsHub profile={useSellerContext()} />;
}

/** B6.1 */
export function SellerLegalPage() {
  return <LegalInfo profile={useSellerContext()} onChanged={useSellerReload()} />;
}

/** B6.2 */
export function SellerZonesPage() {
  const zones = useZones();
  const fees = useInterProvinceFees();
  if (zones.kind !== 'loaded' || fees.kind !== 'loaded') return <LoadingState />;
  return (
    <OpenOnly>
      <DeliveryZonesForm zones={zones.data} fees={fees.data} onSaved={() => undefined} />
    </OpenOnly>
  );
}

/** B6.3 */
export function SellerTermsPage() {
  const terms = useTerms();
  if (terms.kind !== 'loaded') return <LoadingState />;
  return (
    <OpenOnly>
      <CustomTermsForm terms={terms.data} onSaved={() => undefined} />
    </OpenOnly>
  );
}

/** B6.4 */
export function SellerCapacityPage() {
  return <CapacityDeferred />;
}

/** B7.0 */
export function SellerNotificationsPage() {
  return <ShopNotifications shopName={useSellerContext().shopName} />;
}

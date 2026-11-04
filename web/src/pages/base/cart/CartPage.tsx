import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { useDeliveryProvinceCode } from '@/entities/region';
import { AsyncState, Button, ButtonLink, Card, EmptyState, Icon } from '@/shared/ui';
import { useCart, updateCartQuantity, clearCart, useCartFor, syncCart } from '@/entities/cart';
import { syncCartLineToBackend } from '@/features/add-to-cart';
import { useRemoveCartItem } from '@/features/remove-cart-item';
import styles from './CartPage.module.css';

export function CartPage() {
  const localCart = useCart();
  const provinceCode = useDeliveryProvinceCode();
  const asyncCart = useCartFor(provinceCode);
  const navigate = useNavigate();
  const removeCartItem = useRemoveCartItem();

  const remoteCart = asyncCart.kind === 'loaded' ? asyncCart.data : null;

  /** Đồng bộ giỏ hàng từ backend (FR-08, BR-28): server là nguồn sự thật. */
  useEffect(() => {
    if (remoteCart) {
      syncCart(remoteCart);
    }
  }, [remoteCart]);

  /** Đổi số lượng cục bộ rồi đồng bộ lên backend (BR-28). */
  function changeQuantity(productId: string, quantity: number) {
    const change = updateCartQuantity(productId, quantity);
    syncCartLineToBackend(change.itemId, change.quantity);
  }

  /** Xóa một món khỏi giỏ (FR-08): DELETE /api/carts/me/items/{itemId}. */
  function handleRemove(productId: string, itemId?: string) {
    updateCartQuantity(productId, 0);
    if (itemId) {
      void removeCartItem(itemId);
    }
  }

  // Đồng bộ với localCart khi có cập nhật
  const cart = localCart;

  const subtotal = cart.groups.reduce(
    (acc, g) => acc + g.items.reduce((s, it) => s + it.price * it.quantity, 0),
    0
  );
  const totalShipping = cart.groups.reduce((acc, g) => acc + g.shippingFee, 0);
  const total = subtotal + totalShipping;

  return (
    <div className={styles.container}>
      <AsyncState
        state={asyncCart}
        onRetry={asyncCart.reload}
        isEmpty={() => cart.groups.length === 0}
        empty={
          <div className={styles.emptyContainer}>
            <EmptyState
              icon="cart"
              title="Giỏ hàng của bạn đang trống"
              description="Hãy chọn những hương vị bánh thơm ngon cho đêm trăng rằm này."
              action={
                <ButtonLink to={routes.base.catalog} variant="primary">
                  Khám phá bánh ngon
                </ButtonLink>
              }
            />
          </div>
        }
      >
        {() => (
          <>
            <h1 className={styles.title}>Giỏ hàng của bạn (M4.0, Flow 1)</h1>
            <p className={styles.subtitle}>
              Đơn hàng được chia theo từng hiệu bánh để đảm bảo thời gian nướng và vận chuyển chuẩn xác nhất.
            </p>

            <div className={styles.grid}>
              {/* Nhóm hàng theo Shop (FR-08) */}
              <div className={styles.shopGroups}>
          {cart.groups.map((group) => {
            const groupSubtotal = group.items.reduce((s, it) => s + it.price * it.quantity, 0);
            return (
              <Card key={group.vendorId} padding="none" className={styles.shopCard}>
                <div className={styles.shopHeader}>
                  <div className={styles.shopTitle}>
                    <Icon name="store" size={18} />
                    <strong>{group.vendorName}</strong>
                  </div>
                  <span className={styles.shopShipFee}>
                    Phí giao shop: <strong>{formatCurrency(group.shippingFee)}</strong>
                  </span>
                </div>

                <div className={styles.itemList}>
                  {group.items.map((item) => (
                    <div key={item.productId} className={styles.itemRow}>
                      <img src={item.image} alt={item.name} className={styles.itemImg} />
                      <div className={styles.itemInfo}>
                        <Link to={routes.base.product(item.productId)} className={styles.itemName}>
                          {item.name}
                        </Link>
                        <div className={styles.itemPrice}>{formatCurrency(item.price)}</div>

                        {/* Cảnh báo vượt ngưỡng sỉ -> Gợi ý chuyển sang F3 (M3.4) */}
                        {item.bulkQuoteThreshold && item.quantity >= item.bulkQuoteThreshold && (
                          <div className={styles.bulkThresholdAlert}>
                            <Icon name="sparkle" size={13} /> Đặt {item.quantity} hộp đã đạt ngưỡng sỉ.
                            <Link to={routes.base.vendorRequest(item.vendorId)}>
                              Gửi yêu cầu báo giá cho shop này →
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Stepper số lượng */}
                      <div className={styles.stepperWrap}>
                        <div className={styles.stepper}>
                          <button
                            type="button"
                            className={styles.stepperBtn}
                            onClick={() => changeQuantity(item.productId, item.quantity - 1)}
                          >
                            <Icon name="minus" size={13} />
                          </button>
                          <span className={styles.stepperVal}>{item.quantity}</span>
                          <button
                            type="button"
                            className={styles.stepperBtn}
                            onClick={() => changeQuantity(item.productId, item.quantity + 1)}
                          >
                            <Icon name="plus" size={13} />
                          </button>
                        </div>
                      </div>

                      <div className={styles.itemTotal}>
                        {formatCurrency(item.price * item.quantity)}
                      </div>

                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => handleRemove(item.productId, item.itemId)}
                        title="Xóa khỏi giỏ"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.shopFooter}>
                  <span>Tổng tiền tiệm này: <strong>{formatCurrency(groupSubtotal + group.shippingFee)}</strong></span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Cột tóm tắt thanh toán */}
        <aside className={styles.summaryCol}>
          <Card padding="md" className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Tóm tắt đơn hàng</h3>

            <div className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <span>Tiền bánh ({cart.groups.reduce((acc, g) => acc + g.items.reduce((s, it) => s + it.quantity, 0), 0)} hộp):</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Phí giao hàng ({cart.groups.length} tiệm):</span>
                <span>{formatCurrency(totalShipping)}</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.totalRow}>
                <span>Tổng thanh toán:</span>
                <span className={styles.totalVal}>{formatCurrency(total)}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              block
              iconRight="arrowRight"
              onClick={() => navigate(routes.base.checkout)}
            >
              Tiến hành thanh toán
            </Button>

            <Button variant="ghost" size="sm" block onClick={clearCart} className={styles.clearBtn}>
              Xóa sạch giỏ hàng
            </Button>

            <div className={styles.guaranteeBox}>
              <Icon name="shield" size={16} />
              <span>Thanh toán ký quỹ an toàn qua cổng VNPay. Tiền chỉ chuyển cho người bán sau khi bạn nhận bánh nguyên vẹn.</span>
            </div>
          </Card>
        </aside>
      </div>
          </>
        )}
      </AsyncState>
    </div>
  );
}

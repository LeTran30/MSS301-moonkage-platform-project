import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { EmptyState, PageHeader, Steps } from '../../../shared/ui';
import { formatVnd } from '../../../shared/utils/money';
import { CHECKOUT_STEPS, cartTotals, groupByShop, type CartItem } from '../model/cartModel';
import { useCart } from '../model/useCart';

/** M4.0: the cart grouped by shop; one payment makes one order per shop. */
export function CartView({ items, onContinue }: { items: CartItem[]; onContinue: () => void }) {
  const { setQuantity, remove } = useCart();
  const groups = groupByShop(items);
  const totals = cartTotals(groups);

  return (
    <div className="page">
      <PageHeader title="Giỏ hàng" />
      <Steps label="Các bước thanh toán" steps={CHECKOUT_STEPS} current={0} />
      {items.length === 0 ? (
        <EmptyState title="Giỏ hàng trống" body="Thêm bánh từ Mua hàng có sẵn, rồi quay lại đây để thanh toán.">
          <Link to={routes.products} className="mk-btn mk-btn--primary">
            Xem hàng có sẵn
          </Link>
        </EmptyState>
      ) : (
        <div className="detail-layout">
          <div className="stack">
            {groups.map((g) => (
              <section key={g.shopId} className="panel panel--wide" aria-labelledby={`shop-${g.shopId}`}>
                <div className="row-between">
                  <h2 id={`shop-${g.shopId}`} className="card-title-text">
                    {g.shopName}
                  </h2>
                  <span className="muted mk-num">Phí giao: {formatVnd(g.shippingFee)}</span>
                </div>
                <ul className="cart-lines">
                  {g.items.map((i) => (
                    <li key={i.productId} className="cart-line">
                      <div className="cart-line__photo" aria-hidden="true" />
                      <div className="cart-line__info">
                        <Link to={routes.product(i.productId)} className="body-strong-text">
                          {i.name}
                        </Link>
                        <p className="muted mk-num">
                          {formatVnd(i.price)} / hộp · còn {i.stock} hộp
                        </p>
                        {i.quantity >= i.stock && i.shopTakesCustom && (
                          <p className="notice">
                            Cần nhiều hơn {i.stock} hộp? Shop này nhận đặt theo yêu cầu.{' '}
                            <Link to={routes.supplierRequest(i.shopId)} className="mk-btn mk-btn--text">
                              Gửi yêu cầu cho Shop này
                            </Link>
                          </p>
                        )}
                      </div>
                      <div className="mk-field cart-line__qty">
                        <label htmlFor={`q-${i.productId}`} className="mk-sr">
                          Số lượng {i.name}
                        </label>
                        <input
                          id={`q-${i.productId}`}
                          className="mk-num"
                          type="number"
                          min={1}
                          max={i.stock}
                          value={i.quantity}
                          onChange={(e) => setQuantity(i.productId, Math.max(1, Math.min(i.stock, Number(e.target.value) || 1)))}
                        />
                      </div>
                      <span className="mk-price">{formatVnd(i.price * i.quantity)}</span>
                      <button type="button" className="mk-btn mk-btn--text" onClick={() => remove(i.productId)} aria-label={`Xóa ${i.name} khỏi giỏ`}>
                        Xóa
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <Link to={routes.products} className="mk-btn mk-btn--text">
              ‹ Tiếp tục mua
            </Link>
          </div>
          <aside className="action-box" aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="card-title-text">
              Tóm tắt
            </h2>
            <ul className="lines">
              <li className="lines__row">
                <span>Tiền hàng ({totals.lines} món)</span>
                <span />
                <span className="mk-num">{formatVnd(totals.goods)}</span>
              </li>
              <li className="lines__row">
                <span>Phí giao ({groups.length} Shop)</span>
                <span />
                <span className="mk-num">{formatVnd(totals.shipping)}</span>
              </li>
              <li className="lines__row lines__row--total">
                <span>Tổng cộng</span>
                <span />
                <span className="mk-num">{formatVnd(totals.total)}</span>
              </li>
            </ul>
            <p className="muted">
              Thanh toán một lần, tạo {groups.length} đơn – mỗi Shop một đơn.
            </p>
            <button type="button" className="mk-btn mk-btn--primary mk-btn--block" onClick={onContinue}>
              Tiếp tục
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

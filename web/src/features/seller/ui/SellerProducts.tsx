import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, Tabs } from '../../../shared/ui';
import { formatVnd } from '../../../shared/utils/money';
import { saveProduct, setProductVisible, useSellerProducts, type SellerProduct } from '../model/useSeller';
import styles from './SellerProducts.module.css';

const LOW_STOCK = 5;

/** B4.0: products by visibility; a removed product is read-only with the admin's reason. */
export function SellerProductList() {
  const state = useSellerProducts();
  const [tab, setTab] = useState<'visible' | 'hidden' | 'removed'>('visible');
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  const of = (t: typeof tab) => state.data.filter((p) => (t === 'removed' ? p.removed : !p.removed && p.visible === (t === 'visible')));
  const list = of(tab);
  return (
    <div className="page">
      <PageHeader
        title="Sản phẩm"
        actions={
          <Link to={routes.sellerProduct('moi')} className="mk-btn mk-btn--primary">
            Đăng sản phẩm
          </Link>
        }
      />
      <Tabs
        label="Trạng thái"
        current={tab}
        onChange={setTab}
        tabs={[
          { key: 'visible', label: 'Đang bán', count: of('visible').length },
          { key: 'hidden', label: 'Đang ẩn', count: of('hidden').length },
          { key: 'removed', label: 'Bị gỡ', count: of('removed').length },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState title="Không có sản phẩm ở đây" />
      ) : tab === 'removed' ? (
        <ul className={styles.rowList}>
          {list.map((p) => (
            <li key={p.id} className={styles.rowItem}>
              <StatusBadge tone="warn">Bị gỡ</StatusBadge>
              <div className={styles.rowMain}>
                <p className={styles.rowTitle}>{p.name}</p>
                <p className="muted">
                  Gỡ {p.removed?.at}: "{p.removed?.reason}"
                </p>
              </div>
              <Link to={routes.sellerProduct(p.id)} className="mk-btn mk-btn--quiet mk-btn--sm">
                Xem
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th scope="col">Sản phẩm</th>
              <th scope="col" className={styles.num}>
                Giá
              </th>
              <th scope="col" className={styles.num}>
                Tồn
              </th>
              <th scope="col">Hiện trên Moonkage</th>
              <th scope="col">
                <span className="mk-sr">Sửa</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="row">
                    <span className={styles.thumbSm} aria-hidden="true" />
                    <span>
                      <strong>{p.name}</strong>
                      <br />
                      <span className="muted">
                        {p.crusts.join(', ')} · {p.fillings.join(', ').toLowerCase()}
                      </span>
                    </span>
                  </div>
                </td>
                <td className={`${styles.num} mk-num`}>{formatVnd(p.price)}</td>
                <td className={`${styles.num} mk-num`}>
                  {p.stock} {p.stock <= LOW_STOCK && <StatusBadge tone="warn">Sắp hết</StatusBadge>}
                </td>
                <td>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={p.visible}
                      onChange={async (e) => {
                        await setProductVisible(p.id, e.target.checked);
                        state.reload();
                      }}
                    />{' '}
                    {p.visible ? 'Đang hiện' : 'Đang ẩn'}
                  </label>
                </td>
                <td className={styles.actions}>
                  <Link to={routes.sellerProduct(p.id)} className="mk-btn mk-btn--quiet mk-btn--sm">
                    Sửa
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const CRUSTS = ['Nướng', 'Dẻo', 'Than tre'];
const FILLINGS = ['Thập cẩm', 'Hạt sen', 'Đậu xanh', 'Trà xanh'];

/** B4.1: add or edit a product; `preview` is the buyer's card the page renders from the form values. */
export function SellerProductEditor({
  product,
  shopName,
  onSaved,
  onCancel,
  preview,
}: {
  product: SellerProduct | null;
  shopName: string;
  onSaved: () => void;
  onCancel: () => void;
  preview: (values: { name: string; price: number }) => ReactNode;
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState(String(product?.price ?? ''));
  const [stock, setStock] = useState(String(product?.stock ?? ''));
  const [crusts, setCrusts] = useState(product?.crusts ?? []);
  const [fillings, setFillings] = useState(product?.fillings ?? []);
  const [error, setError] = useState<string | null>(null);
  const readOnly = Boolean(product?.removed);
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !Number(price) || stock === '') return setError('Nhập tên, giá và tồn kho.');
    if (!crusts.length || !fillings.length) return setError('Chọn ít nhất một vỏ và một nhân.');
    await saveProduct({ id: product?.id, name: name.trim(), price: Number(price), stock: Number(stock), crusts, fillings });
    onSaved();
  };

  return (
    <div className="page">
      {product?.removed && (
        <p className="notice">
          <StatusBadge tone="warn">Bị gỡ</StatusBadge> Quản trị gỡ sản phẩm này ngày {product.removed.at}: "{product.removed.reason}". Chỉ xem, không sửa được.
        </p>
      )}
      <PageHeader title={product ? 'Sửa sản phẩm' : 'Đăng sản phẩm'} />
      <div className={styles.formLayout}>
        <form className={styles.form} onSubmit={submit} noValidate>
          <fieldset className={styles.formSection} disabled={readOnly}>
            <legend>1. Ảnh</legend>
            <div className={styles.photoSlots}>
              <div className={styles.mockupFrame}>Ảnh chính</div>
              <div className={styles.mockupFrame}>Ảnh 2</div>
              <label className={`${styles.mockupFrame} ${styles.photoSlotsAdd}`}>
                + Thêm
                <input type="file" accept="image/*" className="mk-sr" />
              </label>
            </div>
          </fieldset>
          <fieldset className={styles.formSection} disabled={readOnly}>
            <legend>2. Thông tin</legend>
            <div className="mk-field">
              <label htmlFor="p-name">Tên sản phẩm</label>
              <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="mk-field">
              <label htmlFor="p-brand">Thương hiệu</label>
              <input id="p-brand" value={brand} placeholder={shopName} onChange={(e) => setBrand(e.target.value)} aria-describedby="p-brand-hint" />
              <span className="mk-hint" id="p-brand-hint">
                Để trống thì dùng tên đơn vị của bạn.
              </span>
            </div>
            <div className={styles.fieldRow}>
              <div className="mk-field">
                <label htmlFor="p-price">Giá (đ)</label>
                <input id="p-price" className="mk-num" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} />
              </div>
              <div className="mk-field">
                <label htmlFor="p-stock">Tồn kho</label>
                <input id="p-stock" className="mk-num" type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
              </div>
            </div>
          </fieldset>
          <fieldset className={styles.formSection} disabled={readOnly}>
            <legend>3. Vỏ và nhân</legend>
            <p className="muted">Chọn ít nhất một vỏ và một nhân. Danh mục do Moonkage quản lý.</p>
            <div className={styles.checkGroup}>
              <span className={styles.checkGroupLabel}>Vỏ</span>
              {CRUSTS.map((c) => (
                <label key={c} className="check">
                  <input type="checkbox" checked={crusts.includes(c)} onChange={() => setCrusts(toggle(crusts, c))} /> {c}
                </label>
              ))}
            </div>
            <div className={styles.checkGroup}>
              <span className={styles.checkGroupLabel}>Nhân</span>
              {FILLINGS.map((f) => (
                <label key={f} className="check">
                  <input type="checkbox" checked={fillings.includes(f)} onChange={() => setFillings(toggle(fillings, f))} /> {f}
                </label>
              ))}
            </div>
          </fieldset>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <div className={styles.formActions}>
            <button type="button" className="mk-btn mk-btn--quiet" onClick={onCancel}>
              {readOnly ? 'Quay lại' : 'Hủy'}
            </button>
            {!readOnly && (
              <button type="submit" className="mk-btn mk-btn--primary">
                Lưu
              </button>
            )}
          </div>
        </form>
        <aside className={styles.sideNote}>
          <h2 className="card-title-text">Người mua sẽ thấy</h2>
          {preview({ name: name || 'Tên sản phẩm', price: Number(price) || 0 })}
        </aside>
      </div>
    </div>
  );
}

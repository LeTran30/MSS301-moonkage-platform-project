import { Input } from '@/shared/ui';
import styles from './productFormUi.module.css';

export type SupplySource = 'SELF_PRODUCED' | 'RESELL' | 'BOTH';

interface ProductSupplyFieldsProps {
  /** The shop's supply source decides whether the owner chooses (AC-29.2). */
  supplySource: SupplySource | undefined;
  resold: boolean;
  brand: string;
  origin: string;
  onResoldChange: (value: boolean) => void;
  onBrandChange: (value: string) => void;
  onOriginChange: (value: string) => void;
}

/**
 * Hàng tự làm hay bán lại (AC-29.2), thương hiệu và xuất xứ (BR-12, AC-33.2).
 *
 * Shop BOTH chọn cho từng sản phẩm; RESELL luôn là bán lại, SELF_PRODUCED
 * không bao giờ. Hàng bán lại bắt buộc ghi thương hiệu và xuất xứ; hàng tự làm
 * để trống thương hiệu thì máy chủ lấy tên doanh nghiệp.
 */
export function ProductSupplyFields({
  supplySource,
  resold,
  brand,
  origin,
  onResoldChange,
  onBrandChange,
  onOriginChange,
}: ProductSupplyFieldsProps) {
  return (
    <>
      {supplySource === 'BOTH' && (
        <fieldset className={styles.fieldset}>
          <legend className={styles.label}>Nguồn hàng *</legend>
          <label className={styles.radio}>
            <input type="radio" name="product-resold" checked={!resold} onChange={() => onResoldChange(false)} />
            Bánh tự sản xuất
          </label>
          <label className={styles.radio}>
            <input type="radio" name="product-resold" checked={resold} onChange={() => onResoldChange(true)} />
            Bánh nhập về bán lại
          </label>
        </fieldset>
      )}

      <div className={styles.gridTwo}>
        <div>
          <label className={styles.label} htmlFor="product-brand">
            Thương hiệu{resold ? ' *' : ''}
          </label>
          <Input
            id="product-brand"
            value={brand}
            onChange={(e) => onBrandChange(e.target.value)}
            placeholder={resold ? 'Ví dụ: Kinh Đô' : 'Để trống sẽ dùng tên doanh nghiệp'}
            required={resold}
          />
        </div>
        <div>
          <label className={styles.label} htmlFor="product-origin">
            Xuất xứ{resold ? ' *' : ''}
          </label>
          <Input
            id="product-origin"
            value={origin}
            onChange={(e) => onOriginChange(e.target.value)}
            placeholder="Ví dụ: Sản xuất tại TP Hồ Chí Minh"
            required={resold}
          />
        </div>
      </div>
    </>
  );
}

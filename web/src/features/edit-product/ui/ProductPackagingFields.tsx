import { Input } from '@/shared/ui';
import styles from './productFormUi.module.css';

interface ProductPackagingFieldsProps {
  /** `yyyy-MM-dd`, the value of a date input. */
  expiryDate: string;
  piecesPerBox: string;
  onExpiryDateChange: (value: string) => void;
  onPiecesPerBoxChange: (value: string) => void;
}

/** Hạn sử dụng (bắt buộc) và số bánh mỗi hộp của sản phẩm (FR-29). */
export function ProductPackagingFields({
  expiryDate,
  piecesPerBox,
  onExpiryDateChange,
  onPiecesPerBoxChange,
}: ProductPackagingFieldsProps) {
  return (
    <div className={styles.gridTwo}>
      <div>
        <label className={styles.label} htmlFor="product-expiry">
          Hạn sử dụng *
        </label>
        <Input
          id="product-expiry"
          type="date"
          value={expiryDate}
          onChange={(e) => onExpiryDateChange(e.target.value)}
          required
        />
      </div>
      <div>
        <label className={styles.label} htmlFor="product-pieces">
          Số bánh mỗi hộp
        </label>
        <Input
          id="product-pieces"
          type="number"
          min={1}
          value={piecesPerBox}
          onChange={(e) => onPiecesPerBoxChange(e.target.value)}
          placeholder="4"
        />
      </div>
    </div>
  );
}

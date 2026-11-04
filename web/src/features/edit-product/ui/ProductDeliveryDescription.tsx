import styles from './productFormUi.module.css';

interface ProductDeliveryDescriptionProps {
  deliveryLabel: 'LOCAL' | 'NATIONWIDE';
  description: string;
  onDeliveryLabelChange: (value: 'LOCAL' | 'NATIONWIDE') => void;
  onDescriptionChange: (value: string) => void;
}

/** Phương thức giao nhận + mô tả hương vị, nguyên liệu & chứng nhận VSATTP. */
export function ProductDeliveryDescription({
  deliveryLabel,
  description,
  onDeliveryLabelChange,
  onDescriptionChange,
}: ProductDeliveryDescriptionProps) {
  return (
    <>
      <div>
        <label className={styles.label} htmlFor="product-delivery">
          Phương thức giao nhận
        </label>
        <select
          id="product-delivery"
          value={deliveryLabel}
          onChange={(e) => onDeliveryLabelChange(e.target.value as 'LOCAL' | 'NATIONWIDE')}
          className={styles.input}
        >
          <option value="NATIONWIDE">Giao toàn quốc</option>
          <option value="LOCAL">Chỉ giao nội thành (Bánh tươi/Bánh lạnh)</option>
        </select>
      </div>

      <div>
        <label className={styles.label} htmlFor="product-desc">
          Mô tả hương vị, nguyên liệu &amp; chứng nhận VSATTP
        </label>
        <textarea
          id="product-desc"
          rows={4}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Ghi rõ xuất xứ nguyên liệu, hạn sử dụng, hướng dẫn bảo quản..."
          className={styles.textarea}
        />
      </div>
    </>
  );
}

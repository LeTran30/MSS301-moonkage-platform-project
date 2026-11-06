import { Input } from '@/shared/ui';
import styles from './productFormUi.module.css';

interface ProductBasicsFieldsProps {
  name: string;
  price: number;
  stock: number;
  bulkThreshold: number;
  onNameChange: (value: string) => void;
  onPriceChange: (value: number) => void;
  onStockChange: (value: number) => void;
  onBulkThresholdChange: (value: number) => void;
}

/** FR-54 / B4.1: tên, giá lẻ, tồn kho và ngưỡng sỉ của sản phẩm bánh. */
export function ProductBasicsFields({
  name,
  price,
  stock,
  bulkThreshold,
  onNameChange,
  onPriceChange,
  onStockChange,
  onBulkThresholdChange,
}: ProductBasicsFieldsProps) {
  return (
    <>
      <div>
        <label className={styles.label} htmlFor="product-name">
          Tên sản phẩm bánh Trung Thu *
        </label>
        <Input
          id="product-name"
          type="text"
          placeholder="Ví dụ: Bánh Nướng Thập Cẩm Gà Quay 2 Trứng Muối"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
        />
      </div>

      <div className={styles.gridThree}>
        <div>
          <label className={styles.label} htmlFor="product-price">
            Giá bán lẻ (VNĐ) *
          </label>
          <Input
            id="product-price"
            type="number"
            value={price}
            onChange={(e) => onPriceChange(Number(e.target.value))}
            min={10000}
            step={5000}
            required
          />
        </div>
        <div>
          <label className={styles.label} htmlFor="product-stock">
            Tồn kho sẵn có (hộp) *
          </label>
          <Input
            id="product-stock"
            type="number"
            value={stock}
            onChange={(e) => onStockChange(Number(e.target.value))}
            min={0}
            required
          />
        </div>
        <div>
          <label className={styles.label} htmlFor="product-moq">
            Ngưỡng sỉ báo giá (MOQ)
          </label>
          <Input
            id="product-moq"
            type="number"
            value={bulkThreshold}
            onChange={(e) => onBulkThresholdChange(Number(e.target.value))}
            min={5}
          />
        </div>
      </div>
    </>
  );
}

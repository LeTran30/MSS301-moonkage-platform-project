import type { CakeCrust, CakeFilling } from '@/entities/product';
import styles from './productFormUi.module.css';

interface TaxonomyOption {
  code: string;
  name: string;
  isActive: boolean;
}

interface ProductTaxonomyPickerProps {
  /** Danh mục Vỏ bánh (FR-06). */
  crusts: TaxonomyOption[];
  /** Danh mục Nhân bánh (FR-06). */
  fillings: TaxonomyOption[];
  selectedCrusts: CakeCrust[];
  selectedFillings: CakeFilling[];
  onToggleCrust: (code: CakeCrust) => void;
  onToggleFilling: (code: CakeFilling) => void;
}

/**
 * FR-54 / BR-34: chọn Vỏ và Nhân theo taxonomy chuẩn.
 *
 * Bắt buộc chọn ít nhất 1 Vỏ và 1 Nhân — component hiển thị trạng thái
 * chọn để người bán thấy ngay mình đã gắn đủ chưa.
 */
export function ProductTaxonomyPicker({
  crusts,
  fillings,
  selectedCrusts,
  selectedFillings,
  onToggleCrust,
  onToggleFilling,
}: ProductTaxonomyPickerProps) {
  return (
    <>
      <div>
        <span className={styles.blockLabel}>
          Phân loại loại vỏ bánh (Taxonomy Crusts - FR-06) *
        </span>
        <div className={styles.chipRow}>
          {crusts
            .filter((c) => c.isActive)
            .map((c) => {
              const crustCode = c.code as CakeCrust;
              const active = selectedCrusts.includes(crustCode);
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => onToggleCrust(crustCode)}
                  className={`${styles.taxonomyChip} ${active ? styles.taxonomyChipActive : ''}`}
                  aria-pressed={active}
                >
                  {c.name}
                </button>
              );
            })}
        </div>
      </div>

      <div>
        <span className={styles.blockLabel}>
          Phân loại vị nhân bánh (Taxonomy Fillings - FR-06) *
        </span>
        <div className={styles.chipRow}>
          {fillings
            .filter((f) => f.isActive)
            .map((f) => {
              const fillingCode = f.code as CakeFilling;
              const active = selectedFillings.includes(fillingCode);
              return (
                <button
                  key={f.code}
                  type="button"
                  onClick={() => onToggleFilling(fillingCode)}
                  className={`${styles.taxonomyChip} ${active ? styles.taxonomyChipGold : ''}`}
                  aria-pressed={active}
                >
                  {f.name}
                </button>
              );
            })}
        </div>
      </div>
    </>
  );
}

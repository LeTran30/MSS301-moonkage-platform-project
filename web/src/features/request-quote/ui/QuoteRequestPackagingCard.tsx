import { Card, Icon } from '@/shared/ui';
import { CUSTOM_TYPES, CUSTOM_TYPE_LABELS, type CustomType } from '@/entities/request';
import styles from './QuoteRequestCards.module.css';

interface QuoteRequestPackagingCardProps {
  customLogoName: string;
  customTypes: CustomType[];
  onToggleCustomType: (type: CustomType) => void;
  customRequirements: string;
  onCustomRequirementsChange: (value: string) => void;
}

/**
 * Step 3 of the quote request form: the packaging customisations (BR-14).
 */
export function QuoteRequestPackagingCard({
  customLogoName,
  customTypes,
  onToggleCustomType,
  customRequirements,
  onCustomRequirementsChange,
}: QuoteRequestPackagingCardProps) {
  return (
    <Card padding="lg" className={styles.card}>
      <h3 className={styles.cardTitle}>3. Yêu cầu tùy chỉnh bao bì &amp; in ấn (Custom Logo)</h3>

      <div className={styles.uploadBox}>
        <Icon name="upload" size={28} />
        <div>
          <strong>Tải lên logo doanh nghiệp / Bản vẽ phác thảo</strong>
          <p>Hỗ trợ định dạng PDF, AI, PNG, JPG tối đa 20MB</p>
        </div>
        <div className={styles.filePill}>
          <Icon name="file" size={14} /> {customLogoName}
        </div>
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>Loại tùy chỉnh cần làm (BR-14)</legend>
        <div className={styles.chipRow}>
          {CUSTOM_TYPES.map((type) => {
            const active = customTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                aria-pressed={active}
                onClick={() => onToggleCustomType(type)}
              >
                {CUSTOM_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="custom-requirements">
          Mô tả quy cách in ấn &amp; thiệp chúc mừng
        </label>
        <textarea
          id="custom-requirements"
          className={styles.textarea}
          rows={3}
          value={customRequirements}
          onChange={(e) => onCustomRequirementsChange(e.target.value)}
        />
      </div>
    </Card>
  );
}

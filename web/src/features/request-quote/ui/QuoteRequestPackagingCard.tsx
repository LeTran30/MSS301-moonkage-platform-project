import { Card, Icon, Textarea } from '@/shared/ui';
import { CUSTOM_TYPES, CUSTOM_TYPE_LABELS, type CustomType } from '@/entities/request';
import styles from './QuoteRequestCards.module.css';

interface QuoteRequestPackagingCardProps {
  customTypes: CustomType[];
  onToggleCustomType: (type: CustomType) => void;
  customRequirements: string;
  onCustomRequirementsChange: (value: string) => void;
  /**
   * The custom work the buyer may pick. A direct request offers only what the Shop makes (AC-15.4); an open request
   * offers all of it.
   */
  availableTypes?: readonly CustomType[];
}

/**
 * Step 3 of the quote request form: the packaging customisations (BR-14).
 */
export function QuoteRequestPackagingCard({
  customTypes,
  onToggleCustomType,
  customRequirements,
  onCustomRequirementsChange,
  availableTypes = CUSTOM_TYPES,
}: QuoteRequestPackagingCardProps) {
  return (
    <Card padding="lg" className={styles.card}>
      <h3 className={styles.cardTitle}>3. Yêu cầu tùy chỉnh bao bì &amp; in ấn (Custom Logo)</h3>

      {/*
        `CreateQuoteRequestRequest` không có trường tệp logo, và
        `quotation-service` chưa có endpoint tải tệp lên cho yêu cầu báo giá.
        Trước đây khối này hiện một "tệp" cứng là "logo_aurora_vector.pdf" —
        một tệp không tồn tại, khiến người mua tin rằng logo đã được gửi kèm.
        Nay khối upload chỉ nói rõ điều gì thật sự có thể làm.
      */}
      <div className={styles.uploadBox}>
        <Icon name="upload" size={28} />
        <div>
          <strong>Tệp logo doanh nghiệp</strong>
          <p>
            Yêu cầu báo giá hiện chưa nhận kèm tệp. Bạn mô tả quy cách in ấn ở ô bên dưới;
            xưởng sẽ dựng maket và gửi lại để bạn duyệt trước khi sản xuất.
          </p>
        </div>
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>Loại tùy chỉnh cần làm</legend>
        {availableTypes.length === 0 && (
          <p className={styles.hintLine}>Đơn vị này chưa nhận làm bao bì hay in ấn riêng.</p>
        )}
        <div className={styles.chipRow}>
          {availableTypes.map((type) => {
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
        <Textarea
          id="custom-requirements"
          label="Mô tả quy cách in ấn & thiệp chúc mừng"
          rows={3}
          value={customRequirements}
          onChange={(e) => onCustomRequirementsChange(e.target.value)}
        />
      </div>
    </Card>
  );
}

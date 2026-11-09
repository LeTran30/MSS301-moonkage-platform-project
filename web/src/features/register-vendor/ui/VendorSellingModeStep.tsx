import { Button, Icon } from '@/shared/ui';
import { OWNER_DOCUMENT_KINDS, type SellingMode, type VendorDocumentKind } from '@/entities/vendor';
import {
  SELLING_MODE_LABELS,
  type VendorRegistrationForm,
  type VendorSourceType,
} from '../model/vendorRegistrationForm';
import { VendorDocumentUploadField } from './VendorDocumentUploadField';
import styles from './VendorSellingModeStep.module.css';

interface VendorSellingModeStepProps {
  form: VendorRegistrationForm;
  /** Lỗi của từng giấy tờ (thiếu tệp, hoặc máy chủ từ chối). */
  errors?: Partial<Record<VendorDocumentKind, string>>;
  onChange: (patch: Partial<VendorRegistrationForm>) => void;
  onBack: () => void;
  onNext: () => void;
}

const SOURCE_OPTIONS: VendorSourceType[] = ['Tự sản xuất', 'Bán lại', 'Cả hai'];

/** Bước 3: nguồn hàng, cách thức bán và tài liệu pháp lý (BR-21, FR-26). */
export function VendorSellingModeStep({
  form,
  errors = {},
  onChange,
  onBack,
  onNext,
}: VendorSellingModeStepProps) {
  return (
    <div className={styles.stepContent}>
      <h3>Bước 3: Nguồn hàng &amp; Cách thức bán hàng trên sàn</h3>

      <div className={styles.field}>
        <div className={styles.label} id="source-type-label">
          Nguồn gốc bánh cung cấp:
        </div>
        <div className={styles.optionRow} role="group" aria-labelledby="source-type-label">
          {SOURCE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.radioPill} ${form.sourceType === s ? styles.radioSelected : ''}`}
              onClick={() => onChange({ sourceType: s })}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <div className={styles.label} id="selling-mode-label">
          Hình thức bán hàng trên Moonkage:
        </div>
        <div className={styles.optionRow} role="group" aria-labelledby="selling-mode-label">
          {(Object.keys(SELLING_MODE_LABELS) as SellingMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`${styles.radioPill} ${form.sellingMode === mode ? styles.radioSelected : ''}`}
              onClick={() => onChange({ sellingMode: mode })}
            >
              {SELLING_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.feeNotice}>
        <Icon name="info" size={16} />
        <span>
          <strong>Lưu ý phí mở bán:</strong> Sau khi hồ sơ được Đội vận hành kiểm duyệt thông qua,
          bạn sẽ thanh toán phí mở bán 200.000đ (thanh toán 1 lần qua VNPay) để chính thức kích hoạt
          gian hàng.
        </span>
      </div>

      <div className={styles.field}>
        <div className={styles.label} id="documents-label">
          Giấy tờ pháp lý (ảnh chụp rõ nét hoặc PDF):
        </div>
        <div className={styles.documentGrid} role="group" aria-labelledby="documents-label">
          {OWNER_DOCUMENT_KINDS.map((kind) => (
            <VendorDocumentUploadField
              key={kind}
              kind={kind}
              value={form.documents[kind]}
              error={errors[kind]}
              onUploaded={(document) =>
                onChange({ documents: { ...form.documents, [kind]: document } })
              }
            />
          ))}
        </div>
      </div>

      <div className={styles.actionRow}>
        <Button variant="secondary" onClick={onBack}>
          Quay lại
        </Button>
        <Button variant="primary" onClick={onNext}>
          Tiếp tục: Xem lại hồ sơ
        </Button>
      </div>
    </div>
  );
}

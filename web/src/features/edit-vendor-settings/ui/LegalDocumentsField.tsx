import { Icon } from '@/shared/ui';
import { DOCUMENT_LABELS } from '@/entities/vendor';
import type { VendorDocumentKind } from '@/entities/vendor';
import styles from './vendorSettingsUi.module.css';

interface LegalDocumentsFieldProps {
  documents: Array<{ id: string; kind: string; uploadedAt?: string }>;
  tempKeys: Partial<Record<VendorDocumentKind, string>>;
  onUpload: (kind: VendorDocumentKind, file: File | undefined) => void;
}

/**
 * The documents of the legal profile (AC-27.2).
 *
 * A kind without a new file keeps the document on file; a new one is uploaded
 * first and only its `tempKey` is sent with the resubmission.
 */
export function LegalDocumentsField({
  documents,
  tempKeys,
  onUpload,
}: LegalDocumentsFieldProps) {
  return (
    <div className={styles.documentCard}>
      <span className={styles.documentLabel}>
        Hình ảnh giấy phép kinh doanh &amp; Giấy chứng nhận VSATTP:
      </span>
      <div className={styles.actions}>
        {(['BUSINESS_LICENSE', 'FOOD_SAFETY'] as const).map((kind) => {
          const current = documents.find((d) => d.kind === kind);
          return (
            <label key={kind} className={styles.uploadBox}>
              <Icon name="file" size={20} />
              <span className={styles.uploadName}>{DOCUMENT_LABELS[kind]}</span>
              <span className={styles.uploadState}>
                {tempKeys[kind]
                  ? 'Tệp mới, chờ nộp lại'
                  : current
                    ? 'Đã nộp, giữ nguyên nếu không chọn tệp mới'
                    : 'Chưa có tài liệu'}
              </span>
              <input
                type="file"
                className={styles.fileInput}
                accept="image/*,application/pdf"
                onChange={(e) => onUpload(kind, e.target.files?.[0])}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

import { provinceNameOf } from '@/shared/config';
import { Button, Icon } from '@/shared/ui';
import { DOCUMENT_LABELS, OWNER_DOCUMENT_KINDS } from '@/entities/vendor';
import { SELLING_MODE_LABELS, type VendorRegistrationForm } from '../model/vendorRegistrationForm';
import styles from './VendorReviewStep.module.css';

interface VendorReviewStepProps {
  form: VendorRegistrationForm;
  /** Chưa xác minh NFC thì không được nộp hồ sơ. */
  isNfcVerified: boolean;
  busy: boolean;
  /** Lỗi máy chủ trả về khi nộp mà không gắn được vào ô nào. */
  error?: string | null;
  onBack: () => void;
  onSubmit: () => void;
}

/** Bước 4: xem lại hồ sơ trước khi nộp (M7.1). */
export function VendorReviewStep({
  form,
  isNfcVerified,
  busy,
  error,
  onBack,
  onSubmit,
}: VendorReviewStepProps) {
  return (
    <div className={styles.stepContent}>
      <h3>Bước 4: Kiểm tra lại hồ sơ trước khi nộp</h3>

      <div className={styles.reviewBox}>
        <div>
          <strong>Đơn vị:</strong> {form.legalName} (
          {form.businessType === 'HKD' ? 'Hộ kinh doanh' : 'Doanh nghiệp tư nhân'}) · MST:{' '}
          {form.taxCode}
        </div>
        <div>
          <strong>Đại diện:</strong> {form.representativeName} · CCCD: {form.idCardNumber}
        </div>
        <div>
          <strong>Trụ sở:</strong> {form.address} ({provinceNameOf(form.provinceCode) || 'Hà Nội'})
        </div>
        <div>
          <strong>Ngân hàng:</strong> {form.bankName} · {form.bankAccountNumber} ·{' '}
          {form.bankAccountHolder}
        </div>
        <div>
          <strong>Nguồn hàng:</strong> {form.sourceType} · Hình thức:{' '}
          {SELLING_MODE_LABELS[form.sellingMode]}
        </div>
        {OWNER_DOCUMENT_KINDS.map((kind) => (
          <div key={kind}>
            <strong>{DOCUMENT_LABELS[kind]}:</strong>{' '}
            {form.documents[kind]?.fileName ?? 'Chưa tải lên'}
          </div>
        ))}
      </div>

      {!isNfcVerified && (
        <div className={styles.nfcWarn}>
          <Icon name="shield" size={18} />
          <span>Bạn cần hoàn tất bước xác minh NFC CCCD để nộp hồ sơ đăng ký người bán.</span>
        </div>
      )}

      {error && (
        <p role="alert" className={styles.submitError}>
          {error}
        </p>
      )}

      <div className={styles.actionRow}>
        <Button variant="secondary" onClick={onBack}>
          Quay lại sửa
        </Button>
        <Button
          variant="primary"
          size="lg"
          iconLeft={busy ? undefined : 'check'}
          disabled={busy}
          onClick={onSubmit}
        >
          {busy ? 'Đang nộp hồ sơ xét duyệt...' : 'Nộp hồ sơ xét duyệt'}
        </Button>
      </div>
    </div>
  );
}

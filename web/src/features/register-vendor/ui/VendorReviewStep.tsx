import { provinceNameOf } from '@/shared/config';
import { Button, Icon } from '@/shared/ui';
import type { VendorRegistrationForm } from '../model/vendorRegistrationForm';
import styles from './VendorReviewStep.module.css';

interface VendorReviewStepProps {
  form: VendorRegistrationForm;
  /** Chưa xác minh NFC thì không được nộp hồ sơ. */
  isNfcVerified: boolean;
  busy: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

/** Bước 4: xem lại hồ sơ trước khi nộp (M7.1). */
export function VendorReviewStep({
  form,
  isNfcVerified,
  busy,
  onBack,
  onSubmit,
}: VendorReviewStepProps) {
  return (
    <div className={styles.stepContent}>
      <h3>Bước 4: Kiểm tra lại hồ sơ trước khi nộp</h3>

      <div className={styles.reviewBox}>
        <div>
          <strong>Tên Shop:</strong> {form.shopName} (
          {form.businessType === 'HKD' ? 'Hộ kinh doanh' : 'Doanh nghiệp tư nhân'})
        </div>
        <div>
          <strong>Pháp lý:</strong> {form.legalName} · MST: {form.taxCode}
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
          <strong>Nguồn hàng:</strong> {form.sourceType} · Hình thức: {form.sellingMode}
        </div>
      </div>

      {!isNfcVerified && (
        <div className={styles.nfcWarn}>
          <Icon name="shield" size={18} />
          <span>Bạn cần hoàn tất bước xác minh NFC CCCD để nộp hồ sơ đăng ký người bán.</span>
        </div>
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

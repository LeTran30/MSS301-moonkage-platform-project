import { Button, Checkbox, Modal, Icon, Textarea } from '@/shared/ui';
import type { VendorDetailDto } from '@/entities/vendor';
import styles from './reviewApplicationsUi.module.css';

interface VendorReviewModalProps {
  open: boolean;
  /** Hồ sơ chi tiết đã tải từ `GET /api/vendors/{vendorId}`. */
  vendor: VendorDetailDto | null;
  licenseChecked: boolean;
  registryChecked: boolean;
  rejectReason: string;
  busy: boolean;
  error?: string | null;
  onLicenseCheckedChange: (checked: boolean) => void;
  onRegistryCheckedChange: (checked: boolean) => void;
  onRejectReasonChange: (value: string) => void;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

/**
 * Thẩm định hồ sơ người bán (Q2.1, FR-45).
 *
 * AC-45.5: phê duyệt cần đã đối chiếu giấy phép kinh doanh; với doanh
 * nghiệp tư nhân cần thêm mã doanh nghiệp trên cổng ĐKKD quốc gia (A-14).
 */
export function VendorReviewModal({
  open,
  vendor,
  licenseChecked,
  registryChecked,
  rejectReason,
  busy,
  error,
  onLicenseCheckedChange,
  onRegistryCheckedChange,
  onRejectReasonChange,
  onClose,
  onApprove,
  onReject,
}: VendorReviewModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Thẩm định hồ sơ: ${vendor?.businessName ?? ''}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
          <Button variant="danger" loading={busy} onClick={onReject}>
            Từ chối hồ sơ
          </Button>
          <Button variant="primary" loading={busy} onClick={onApprove} iconLeft="check">
            Phê duyệt mở bán
          </Button>
        </>
      }
    >
      <div className={styles.modalBody}>
        {error && (
          <p role="alert" className={styles.formError}>
            {error}
          </p>
        )}

        <div className={styles.checklist}>
          <h4>Bộ kiểm tra tiêu chuẩn pháp lý sàn Moonkage:</h4>
          <ul>
            <li>
              <Icon name="check" size={16} /> Loại hình doanh nghiệp đúng quy định:{' '}
              <strong>{vendor?.entityType}</strong>.
            </li>
            <li>
              <Icon name="check" size={16} /> Người đại diện pháp luật:{' '}
              <strong>{vendor?.representativeName}</strong> — CCCD đã che:{' '}
              <strong>{vendor?.representativeIdMasked}</strong>.
            </li>
            <li>
              <Icon name="check" size={16} /> Giấy chứng nhận cơ sở đủ điều kiện An toàn Vệ sinh Thực
              phẩm: Đã đính kèm bản sao hợp lệ.
            </li>
            <li>
              <Icon name="check" size={16} /> Cam kết không bán hàng nhái, hàng giả mạo nhãn hiệu cổ
              truyền.
            </li>
          </ul>
        </div>

        <div className={styles.rejectGroup}>
          <Checkbox
            id="license-checked"
            label="Đã đối chiếu Giấy phép kinh doanh (bắt buộc để phê duyệt)"
            checked={licenseChecked}
            onChange={(e) => onLicenseCheckedChange(e.target.checked)}
          />

          {vendor?.entityType === 'SOLE_PROPRIETORSHIP' && (
            <Checkbox
              id="registry-checked"
              label="Đã tra mã doanh nghiệp trên cổng ĐKKD quốc gia"
              checked={registryChecked}
              onChange={(e) => onRegistryCheckedChange(e.target.checked)}
            />
          )}
        </div>

        <div className={styles.rejectGroup}>
          <Textarea
            id="reject-reason"
            label="Ghi chú hoặc lý do nếu từ chối (Gửi thông báo cho người bán):"
            rows={3}
            value={rejectReason}
            onChange={(e) => onRejectReasonChange(e.target.value)}
            placeholder="VD: Bản scan giấy ĐKKD bị mờ, vui lòng tải lại bản chụp rõ nét..."
          />
        </div>
      </div>
    </Modal>
  );
}

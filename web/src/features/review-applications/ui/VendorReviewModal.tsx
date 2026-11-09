import { Button, Checkbox, Modal, Textarea } from '@/shared/ui';
import type { OwnerCheckDto, VendorDetailDto } from '@/entities/vendor';
import { VendorDocumentLinks } from './VendorDocumentLinks';
import styles from './reviewApplicationsUi.module.css';

/** Tên loại hình đơn vị (BR-33). */
const ENTITY_TYPE_LABELS: Record<NonNullable<VendorDetailDto['entityType']>, string> = {
  HOUSEHOLD_BUSINESS: 'Hộ kinh doanh',
  SOLE_PROPRIETORSHIP: 'Doanh nghiệp tư nhân',
};

/** Kết quả máy chủ so số CCCD và họ tên khai báo với thẻ NFC của chủ tài khoản (AC-26.8). */
function ownerCheckText(check: OwnerCheckDto | null | undefined): string {
  if (!check) return 'Chưa có kết quả';
  const id = check.idMatch ? 'số CCCD khớp' : 'số CCCD không khớp';
  const name =
    check.nameMatch === 'MATCH'
      ? 'họ tên khớp'
      : `họ tên không khớp (thẻ: ${check.ownerLegalName ?? '—'})`;
  return `${id}, ${name}`;
}

interface VendorReviewModalProps {
  open: boolean;
  /** Hồ sơ chi tiết đã tải từ `GET /api/vendors/{vendorId}`. */
  vendor: VendorDetailDto | null;
  licenseChecked: boolean;
  registryChecked: boolean;
  /** Lý do gửi người bán khi yêu cầu bổ sung hoặc từ chối (AC-45.2). */
  reason: string;
  busy: boolean;
  error?: string | null;
  onLicenseCheckedChange: (checked: boolean) => void;
  onRegistryCheckedChange: (checked: boolean) => void;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onApprove: () => void;
  /** Trả hồ sơ cho người bán sửa rồi nộp lại (NEEDS_INFO). */
  onRequestInfo: () => void;
  onReject: () => void;
}

/**
 * Thẩm định hồ sơ người bán (Q2.1, FR-45).
 *
 * AC-45.5: phê duyệt cần đã đối chiếu giấy phép kinh doanh; với doanh
 * nghiệp tư nhân cần thêm mã doanh nghiệp trên cổng ĐKKD quốc gia (A-14).
 * AC-45.2: yêu cầu bổ sung và từ chối đều cần lý do để người bán đọc.
 */
export function VendorReviewModal({
  open,
  vendor,
  licenseChecked,
  registryChecked,
  reason,
  busy,
  error,
  onLicenseCheckedChange,
  onRegistryCheckedChange,
  onReasonChange,
  onClose,
  onApprove,
  onRequestInfo,
  onReject,
}: VendorReviewModalProps) {
  // Chỉ hồ sơ đang chờ mới nhận quyết định (PENDING → APPROVED / NEEDS_INFO / REJECTED).
  const decidable = vendor?.status === 'PENDING';

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
          {decidable && (
            <>
              <Button variant="danger" loading={busy} onClick={onReject}>
                Từ chối hồ sơ
              </Button>
              <Button variant="outline" loading={busy} onClick={onRequestInfo}>
                Yêu cầu bổ sung
              </Button>
              <Button variant="primary" loading={busy} onClick={onApprove} iconLeft="check">
                Phê duyệt mở bán
              </Button>
            </>
          )}
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
          <h4>Thông tin cần đối chiếu</h4>
          <div className={styles.checkRow}>
            <span>Loại hình</span>
            <strong>{vendor?.entityType ? ENTITY_TYPE_LABELS[vendor.entityType] : '—'}</strong>
          </div>
          <div className={styles.checkRow}>
            <span>Mã số thuế</span>
            <strong>{vendor?.taxCode ?? '—'}</strong>
          </div>
          <div className={styles.checkRow}>
            <span>Người đại diện</span>
            <strong>
              {vendor?.representativeName ?? '—'} · CCCD {vendor?.representativeIdMasked ?? '—'}
            </strong>
          </div>
          <div className={styles.checkRow}>
            <span>So với CCCD đã xác minh NFC</span>
            <strong>{ownerCheckText(vendor?.ownerCheck)}</strong>
          </div>
        </div>

        <div className={styles.checklist}>
          <h4>Giấy tờ đã nộp</h4>
          {vendor ? (
            <VendorDocumentLinks vendorId={vendor.id} documents={vendor.documents ?? []} />
          ) : (
            <p className={styles.documentNote}>Đang tải hồ sơ…</p>
          )}
        </div>

        {decidable ? (
          <>
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
                id="review-reason"
                label="Lý do yêu cầu bổ sung hoặc từ chối (người bán sẽ đọc):"
                rows={3}
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder="VD: Bản scan giấy ĐKKD bị mờ, vui lòng tải lại bản chụp rõ nét..."
              />
            </div>
          </>
        ) : (
          vendor?.statusReason && (
            <p className={styles.documentNote}>
              Ghi chú lần thẩm định trước: {vendor.statusReason}
            </p>
          )
        )}
      </div>
    </Modal>
  );
}

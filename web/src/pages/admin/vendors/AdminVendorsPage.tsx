import { useState } from 'react';
import { Tabs, toast, AsyncState, Icon } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useVendorSearch, type VendorDetailDto, type VendorResponseDto } from '@/entities/vendor';
import { VendorApplicationCard, VENDOR_STATUS_LABELS, type VendorStatus } from '@/entities/vendor';
import {
  useLoadVendorDetail,
  useReviewApplication,
  VendorReviewModal,
} from '@/features/review-applications';
import { AttachVendorDocumentModal } from '@/features/attach-vendor-document';
import styles from './AdminVendorsPage.module.css';

type AdminVendorTab = VendorStatus | 'ALL';

/** Q2.0: một tab cho mỗi trạng thái hồ sơ, theo thứ tự việc admin cần làm. */
const TAB_STATUSES: VendorStatus[] = ['PENDING', 'NEEDS_INFO', 'APPROVED', 'LOCKED', 'REJECTED'];

export function AdminVendorsPage() {
  const [activeTab, setActiveTab] = useState<AdminVendorTab>('PENDING');
  const [selectedVendor, setSelectedVendor] = useState<VendorDetailDto | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [licenseChecked, setLicenseChecked] = useState(false);
  const [registryChecked, setRegistryChecked] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [feeInvoiceVendor, setFeeInvoiceVendor] = useState<VendorResponseDto | null>(null);

  // FR-45: the admin list of registered vendors, filtered by status.
  const listQuery = useVendorSearch(
    activeTab === 'ALL' ? undefined : { status: activeTab as VendorStatus },
  );

  const { busy, run, error } = useAction();
  const reviewApplication = useReviewApplication();
  const loadVendorDetail = useLoadVendorDetail();

  const handleOpenReview = (vendor: VendorResponseDto) => {
    setSelectedVendor(null);
    setReviewReason('');
    setLicenseChecked(false);
    setRegistryChecked(false);
    setReviewModalOpen(true);
    // The list answers summaries only; the legal profile, the documents and the
    // owner check come from the vendor detail.
    void loadVendorDetail(vendor.id).then((detail) => {
      if (detail) setSelectedVendor(detail);
    });
  };

  const handleApprove = () => {
    if (!selectedVendor) return;
    void run(async () => {
      // AC-45.5: approving needs the licence checked, and the registry checked
      // for a sole proprietorship.
      const review = await reviewApplication(selectedVendor.id, {
        decision: 'APPROVE',
        licenseChecked,
        registryChecked:
          selectedVendor.entityType === 'SOLE_PROPRIETORSHIP' ? registryChecked : false,
      });
      if (!review) return;
      setSuccessMsg(`Đã phê duyệt hồ sơ người bán "${selectedVendor.businessName}" thành công!`);
      toast.success('Đã phê duyệt hồ sơ người bán!');
      setReviewModalOpen(false);
      listQuery.reload();
    });
  };

  const handleSendBack = (decision: 'NEEDS_INFO' | 'REJECT') => {
    if (!selectedVendor) return;
    const reason = reviewReason.trim();
    if (!reason) {
      toast.warning('Vui lòng nhập lý do để người bán biết cần sửa gì.');
      return;
    }
    void run(async () => {
      // AC-45.2: NEEDS_INFO and REJECT both need a reason the owner reads.
      const review = await reviewApplication(selectedVendor.id, {
        decision,
        reason,
        licenseChecked,
      });
      if (!review) return;
      const verb = decision === 'NEEDS_INFO' ? 'yêu cầu bổ sung' : 'từ chối';
      setSuccessMsg(`Đã ${verb} hồ sơ "${selectedVendor.businessName}". Lý do: ${reason}`);
      toast.success('Đã gửi kết quả thẩm định tới người bán.');
      setReviewModalOpen(false);
      listQuery.reload();
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý &amp; Duyệt hồ sơ người bán</h1>
          <p className={styles.desc}>
            Thẩm định tính pháp lý Hộ kinh doanh / DNTN, đối chiếu dữ liệu định danh sinh trắc CCCD
            chip NFC.
          </p>
        </div>
        <div className={styles.ruleBadge}>
          <Icon name="shield" size={16} /> Quy định : Bắt buộc mô hình HKD hoặc DNTN
        </div>
      </div>

      {successMsg && (
        <div className={styles.alertSuccess}>
          <Icon name="check" size={16} /> {successMsg}
        </div>
      )}

      <Tabs<AdminVendorTab>
        items={[
          ...TAB_STATUSES.map((status) => ({ id: status, label: VENDOR_STATUS_LABELS[status] })),
          { id: 'ALL' as const, label: 'Tất cả' },
        ]}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      <AsyncState
        state={listQuery}
        loadingMessage="Đang tải danh sách người bán..."
        onRetry={listQuery.reload}
        isEmpty={(data) => data.length === 0}
        empty={<p className={styles.desc}>Không có hồ sơ nào trong trạng thái này.</p>}
      >
        {(vendors) => (
          <div className={styles.vendorList}>
            {vendors.map((vendor) => (
              <VendorApplicationCard
                key={vendor.id}
                vendor={vendor}
                onReview={handleOpenReview}
                onAttachFeeInvoice={setFeeInvoiceVendor}
              />
            ))}
          </div>
        )}
      </AsyncState>

      {/* Modal Review */}
      <VendorReviewModal
        open={reviewModalOpen}
        vendor={selectedVendor}
        licenseChecked={licenseChecked}
        registryChecked={registryChecked}
        reason={reviewReason}
        busy={busy}
        error={error}
        onLicenseCheckedChange={setLicenseChecked}
        onRegistryCheckedChange={setRegistryChecked}
        onReasonChange={setReviewReason}
        onClose={() => setReviewModalOpen(false)}
        onApprove={handleApprove}
        onRequestInfo={() => handleSendBack('NEEDS_INFO')}
        onReject={() => handleSendBack('REJECT')}
      />

      {/* Modal gắn hoá đơn phí đăng ký (Q-36) */}
      <AttachVendorDocumentModal
        open={feeInvoiceVendor !== null}
        vendorId={feeInvoiceVendor?.id ?? null}
        vendorName={feeInvoiceVendor?.businessName}
        onClose={() => setFeeInvoiceVendor(null)}
        onAttached={listQuery.reload}
      />
    </div>
  );
}

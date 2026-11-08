import styles from './AdminVendorDetailPage.module.css';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { routes } from '@/shared/config';
import { provinceNameOf } from '@/shared/config';
import { AsyncState, Badge, Button, ButtonLink, Card, Breadcrumbs, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useVendorDetail } from '@/entities/vendor';
import { useReviewApplication, VendorReviewModal } from '@/features/review-applications';
import { DOCUMENT_LABELS } from '@/features/edit-vendor-settings';

/**
 * Q2.1 — thẩm định một hồ sơ người bán.
 *
 * Dữ liệu đọc từ máy chủ:
 * - `GET /api/vendors/{vendorId}` — hồ sơ pháp lý đầy đủ (FR-27).
 * - `POST /api/vendors/{vendorId}/reviews` — quyết định thẩm định (FR-45).
 *
 * Trước đây trang này hiển thị dữ liệu mô phỏng và nút bấm chỉ hiện một
 * thông báo giả — người bán không bao giờ nhận được quyết định thật.
 */
export function AdminVendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vendorId = id ?? '';
  const asyncVendor = useVendorDetail(vendorId || null);
  const { busy, run, error } = useAction();
  const reviewApplication = useReviewApplication();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [licenseChecked, setLicenseChecked] = useState(false);
  const [registryChecked, setRegistryChecked] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const vendor = asyncVendor.kind === 'loaded' ? asyncVendor.data : null;

  function handleApprove() {
    if (!vendor) return;
    void run(async () => {
      // AC-45.5: phê duyệt cần đã đối chiếu giấy phép kinh doanh; với DNTN
      // cần thêm mã doanh nghiệp trên cổng ĐKKD quốc gia (A-14).
      const review = await reviewApplication(vendor.id, {
        decision: 'APPROVE',
        licenseChecked,
        registryChecked: vendor.entityType === 'SOLE_PROPRIETORSHIP' ? registryChecked : false,
      });
      if (!review) return;
      toast.success(`Đã phê duyệt hồ sơ "${vendor.businessName ?? vendor.id}" thành công!`);
      setReviewModalOpen(false);
      asyncVendor.reload();
    });
  }

  function handleReject() {
    if (!vendor) return;
    if (!rejectReason.trim()) {
      toast.warning('Vui lòng nhập lý do từ chối hồ sơ để người bán bổ sung.');
      return;
    }
    void run(async () => {
      // AC-45.2: NEEDS_INFO và REJECT đều cần lý do để chủ Shop đọc và
      // bổ sung hồ sơ.
      const review = await reviewApplication(vendor.id, {
        decision: 'REJECT',
        reason: rejectReason.trim(),
        licenseChecked,
      });
      if (!review) return;
      toast.success(`Đã gửi kết quả thẩm định tới "${vendor.businessName ?? vendor.id}".`);
      setReviewModalOpen(false);
      asyncVendor.reload();
    });
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Quản Trị', to: routes.admin.overview },
          { label: 'Người bán & Xưởng bánh', to: routes.admin.vendors },
          { label: vendor?.businessName ?? vendorId },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Thẩm định xưởng bánh: {vendor?.businessName ?? vendorId}</h1>
          <p className={styles.subtitle}>
            Mã định danh: {vendor?.id ?? vendorId}
            {vendor?.provinceCode ? ` · Địa bàn: ${provinceNameOf(vendor.provinceCode)}` : ''}
          </p>
        </div>
        <div className={styles.actions}>
          {vendor && vendor.status !== 'APPROVED' && (
            <>
              <Button variant="primary" onClick={() => setReviewModalOpen(true)}>
                Phê Duyệt Đạt Chuẩn
              </Button>
              <Button variant="outline" onClick={() => setReviewModalOpen(true)}>
                Yêu Cầu Bổ Sung Hồ Sơ
              </Button>
            </>
          )}
          {vendor?.status === 'APPROVED' && (
            <Badge tone="green" size="md">
              Hồ sơ đã được phê duyệt
            </Badge>
          )}
        </div>
      </div>

      <AsyncState
        state={asyncVendor}
        onRetry={asyncVendor.reload}
        loadingMessage="Đang tải hồ sơ người bán..."
        isEmpty={(v) => !v}
        empty={
          <div>
            <p>Không tìm thấy nghệ nhân / xưởng bánh.</p>
            <ButtonLink to={routes.admin.vendors}>Về danh sách người bán</ButtonLink>
          </div>
        }
      >
        {(detail) =>
          detail ? (
            <>
            <div className={styles.gridTwo}>
              <Card padding="lg" className={styles.cardBody}>
                <h2 className={styles.sectionTitle}>Hồ sơ năng lực và nguồn gốc</h2>
                <div className={styles.keyValueList}>
                  <div className={styles.keyValueRow}>
                    <span className={styles.keyValueLabel}>Đại diện pháp luật:</span>
                    <strong>{detail.representativeName || '—'}</strong>
                  </div>
                  <div className={styles.keyValueRow}>
                    <span className={styles.keyValueLabel}>CCCD đã che:</span>
                    <strong>{detail.representativeIdMasked || '—'}</strong>
                  </div>
                  <div className={styles.keyValueRow}>
                    <span className={styles.keyValueLabel}>Mã số thuế / ĐKKD:</span>
                    <strong>
                      {detail.taxCode || '—'}
                      {detail.provinceCode ? ` (${provinceNameOf(detail.provinceCode)})` : ''}
                    </strong>
                  </div>
                  <div className={styles.keyValueRow}>
                    <span className={styles.keyValueLabel}>Hình thức đăng ký:</span>
                    <span>
                      {detail.entityType === 'SOLE_PROPRIETORSHIP'
                        ? 'Doanh nghiệp tư nhân (DNTN)'
                        : 'Hộ kinh doanh (HKD)'}
                    </span>
                  </div>
                  <div className={styles.keyValueRow}>
                    <span className={styles.keyValueLabel}>Nguồn cung:</span>
                    <span>
                      {detail.supplySource === 'RESELL'
                        ? 'Bán lại'
                        : detail.supplySource === 'BOTH'
                          ? 'Cả tự sản xuất và bán lại'
                          : 'Tự sản xuất'}
                    </span>
                  </div>
                  <div className={styles.keyValueRow}>
                    <span className={styles.keyValueLabel}>Trạng thái hồ sơ:</span>
                    <Badge tone={detail.status === 'APPROVED' ? 'green' : 'amber'} size="sm">
                      {detail.status ?? 'PENDING'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className={styles.captionLabel}>Địa chỉ cơ sở:</span>
                  <p className={styles.bodyText}>{detail.address || '—'}</p>
                </div>
              </Card>

              <Card padding="lg" className={styles.cardBody}>
                <h2 className={styles.sectionTitle}>Chứng nhận và tài liệu hồ sơ</h2>
                {detail.documents && detail.documents.length > 0 ? (
                  <div className={styles.certificateList}>
                    {detail.documents.map((doc) => (
                      <div key={doc.id} className={styles.certificateCard}>
                        <div className={styles.certificateHeader}>
                          <strong className={styles.certificateTitle}>
                            {DOCUMENT_LABELS[doc.kind as keyof typeof DOCUMENT_LABELS] ?? doc.kind}
                          </strong>
                          <Badge tone="green">Đã đính kèm</Badge>
                        </div>
                        <p className={styles.certificateNote}>
                          {doc.uploadedAt
                            ? `Tải lên lúc ${new Date(doc.uploadedAt).toLocaleString('vi-VN')}`
                            : 'Tài liệu đã được người bán gửi kèm hồ sơ.'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.bodyText}>
                    Người bán chưa đính kèm chứng nhận nào. Phê duyệt hồ sơ cần ít nhất một tài liệu
                    (Giấy phép kinh doanh hoặc VSATTP).
                  </p>
                )}
              </Card>
            </div>

            <VendorReviewModal
              open={reviewModalOpen}
              vendor={detail}
              licenseChecked={licenseChecked}
              registryChecked={registryChecked}
              rejectReason={rejectReason}
              busy={busy}
              error={error}
              onLicenseCheckedChange={setLicenseChecked}
              onRegistryCheckedChange={setRegistryChecked}
              onRejectReasonChange={setRejectReason}
              onClose={() => setReviewModalOpen(false)}
              onApprove={handleApprove}
              onReject={handleReject}
            />
            </>
          ) : null
        }
      </AsyncState>
    </div>
  );
}

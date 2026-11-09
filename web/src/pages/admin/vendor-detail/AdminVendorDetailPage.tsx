import styles from './AdminVendorDetailPage.module.css';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { routes } from '@/shared/config';
import { provinceNameOf } from '@/shared/config';
import { AsyncState, Badge, Button, ButtonLink, Card, Breadcrumbs, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useVendorDetail, VENDOR_STATUS_LABELS } from '@/entities/vendor';
import {
  useReviewApplication,
  VendorDocumentLinks,
  VendorReviewModal,
} from '@/features/review-applications';

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
  const [reviewReason, setReviewReason] = useState('');

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

  function handleSendBack(decision: 'NEEDS_INFO' | 'REJECT') {
    if (!vendor) return;
    const reason = reviewReason.trim();
    if (!reason) {
      toast.warning('Vui lòng nhập lý do để người bán biết cần sửa gì.');
      return;
    }
    void run(async () => {
      // AC-45.2: NEEDS_INFO và REJECT đều cần lý do để chủ Shop đọc và
      // bổ sung hồ sơ.
      const review = await reviewApplication(vendor.id, {
        decision,
        reason,
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
            <Button variant="primary" onClick={() => setReviewModalOpen(true)}>
              Thẩm định hồ sơ
            </Button>
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
                      {detail.status ? VENDOR_STATUS_LABELS[detail.status] : '—'}
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
                <VendorDocumentLinks vendorId={detail.id} documents={detail.documents ?? []} />
              </Card>
            </div>

            <VendorReviewModal
              open={reviewModalOpen}
              vendor={detail}
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
            </>
          ) : null
        }
      </AsyncState>
    </div>
  );
}

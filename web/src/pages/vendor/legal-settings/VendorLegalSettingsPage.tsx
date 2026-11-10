import { routes } from '@/shared/config';
import { Badge, Breadcrumbs, AsyncState } from '@/shared/ui';
import { useMyVendorDetail, useMyVendorId, VENDOR_STATUS_LABELS } from '@/entities/vendor';
import { LegalProfileForm } from '@/features/edit-vendor-settings';
import styles from './VendorLegalSettingsPage.module.css';

export function VendorLegalSettingsPage() {
  const asyncVendorId = useMyVendorId();
  const vendorId = asyncVendorId.kind === 'loaded' ? asyncVendorId.data : null;
  const asyncProfile = useMyVendorDetail(vendorId);

  const detail = asyncProfile.kind === 'loaded' ? asyncProfile.data : null;

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Kênh người bán', to: routes.vendor.overview },
          { label: 'Cài đặt gian hàng', to: routes.vendor.settings },
          { label: 'Hồ sơ pháp lý & VSATTP' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Hồ sơ pháp lý và an toàn thực phẩm</h1>
          <p className={styles.subtitle}>
            Thông tin bắt buộc để duy trì tích xanh kiểm định và phân phối bánh ra toàn quốc
          </p>
        </div>
        {detail?.status && (
          <Badge tone={detail.status === 'APPROVED' ? 'green' : 'amber'} size="md">
            {VENDOR_STATUS_LABELS[detail.status]}
          </Badge>
        )}
      </div>

      {detail?.statusReason && (detail.status === 'NEEDS_INFO' || detail.status === 'REJECTED') && (
        <p role="status" className={styles.reviewReason}>
          <strong>Đội vận hành ghi chú:</strong> {detail.statusReason}
        </p>
      )}

      <AsyncState
        state={asyncProfile}
        onRetry={asyncProfile.reload}
        loadingMessage="Đang tải hồ sơ pháp lý..."
      >
        {(detail) =>
          detail ? (
            <LegalProfileForm
              key={vendorId ?? ''}
              vendorId={vendorId ?? ''}
              detail={detail}
              onSaved={asyncProfile.reload}
            />
          ) : null
        }
      </AsyncState>
    </div>
  );
}

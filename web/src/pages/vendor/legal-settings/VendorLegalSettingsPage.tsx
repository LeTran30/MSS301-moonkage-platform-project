import { routes } from '@/shared/config';
import { Badge, Breadcrumbs, AsyncState } from '@/shared/ui';
import { useMyVendorDetail, useMyVendorId } from '@/entities/vendor';
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
          { label: 'Kênh Xưởng', to: routes.vendor.overview },
          { label: 'Cài đặt gian hàng', to: routes.vendor.settings },
          { label: 'Hồ sơ pháp lý & VSATTP' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Hồ Sơ Pháp Lý &amp; An Toàn Thực Phẩm</h1>
          <p className={styles.subtitle}>
            Thông tin bắt buộc để duy trì tích xanh kiểm định và phân phối bánh ra toàn quốc
          </p>
        </div>
        <Badge tone={detail?.status === 'APPROVED' ? 'green' : 'amber'} size="md">
          {detail?.status === 'APPROVED' ? 'Đã kiểm duyệt đạt chuẩn' : 'Hồ sơ chờ duyệt'}
        </Badge>
      </div>

      <AsyncState
        state={asyncProfile}
        onRetry={asyncProfile.reload}
        loadingMessage="Đang tải hồ sơ pháp lý..."
      >
        {(detail) =>
          detail ? (
            <LegalProfileForm key={vendorId ?? ''} vendorId={vendorId ?? ''} detail={detail} />
          ) : null
        }
      </AsyncState>
    </div>
  );
}

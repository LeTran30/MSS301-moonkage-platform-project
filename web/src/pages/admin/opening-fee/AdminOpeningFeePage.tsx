import styles from './AdminOpeningFeePage.module.css';
import { useState } from 'react';
import { routes } from '@/shared/config';
import { Button, ButtonLink, Card, Breadcrumbs, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useRegistrationFeeConfig } from '@/entities/vendor';
import { useChangeRegistrationFee } from '@/features/configure-registration-fee';

export function AdminOpeningFeePage() {
  // FR-53: the one registration fee level in effect, read from the backend.
  const asyncConfig = useRegistrationFeeConfig();
  const [commissionRate, setCommissionRate] = useState(5);
  const { busy, run, error } = useAction();
  const changeRegistrationFee = useChangeRegistrationFee();

  const currentAmount = asyncConfig.kind === 'loaded' ? asyncConfig.data?.amount ?? 200000 : 200000;
  const [seasonalFee, setSeasonalFee] = useState<number | null>(null);
  const feeAmount = seasonalFee ?? currentAmount;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    void run(async () => {
      // `PUT /api/registration-fee-config` — the admin sets a new level, in
      // effect from now on; it never changes a level already paid.
      await changeRegistrationFee(feeAmount);
      toast.success('Đã lưu cấu hình phí mở bán và tỷ lệ hoa hồng sàn!');
    });
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Quản Trị', to: routes.admin.overview },
          { label: 'Cấu hình hệ thống', to: routes.admin.config },
          { label: 'Phí mở bán & Hoa hồng' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Cấu Hình Phí Mở Bán & Hoa Hồng Sàn (Q6.2)
          </h1>
          <p className={styles.subtitle}>
            Thiết lập mức phí kích hoạt gian hàng và tỷ lệ trích hoa hồng nền tảng trên mỗi đơn hàng thành công
          </p>
        </div>
      </div>

      <Card padding="lg" className={styles.form}>
        <form onSubmit={handleSave} className={styles.stack}>
          <div>
            <label className={styles.label}>
              Phí mở bán gian hàng hiện hành (VNĐ)
            </label>
            <input
              type="number"
              value={feeAmount}
              onChange={(e) => setSeasonalFee(Number(e.target.value))}
              className={styles.input}
            />
          </div>

          <div>
            <label className={styles.label}>
              Tỷ lệ hoa hồng nền tảng Escrow (%)
            </label>
            <input
              type="number"
              value={commissionRate}
              onChange={(e) => setCommissionRate(Number(e.target.value))}
              min={1}
              max={20}
              className={styles.input}
            />
          </div>

          {error && <p role="alert">{error}</p>}

          <div className={styles.actions}>
            <Button type="submit" variant="primary" loading={busy}>
              Lưu Cấu Hình Doanh Thu
            </Button>
            <ButtonLink to={routes.admin.config} variant="outline">
              Quay Lại
            </ButtonLink>
          </div>
        </form>
      </Card>
    </div>
  );
}


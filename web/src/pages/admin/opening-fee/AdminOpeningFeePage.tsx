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
  const { busy, run, error } = useAction();
  const changeRegistrationFee = useChangeRegistrationFee();

  /*
   * Chỉ có một mức phí trên máy chủ (`RegistrationFeeConfigResponse.amount`).
   * Trước đây form còn có ô "Tỷ lệ hoa hồng" nhưng BE không lưu mục đó: người
   * dùng tưởng đã đặt tỷ lệ hoa hồng trong khi thực ra sàn không thu hoa
   * hồng (BR-10). Ô đó đã bị gỡ khỏi form.
   *
   * Giá trị hiển thị lấy từ máy chủ; khi chưa tải xong thì để trống chứ không
   * điền số mặc định bịa ra.
   */
  const [editedAmount, setEditedAmount] = useState<number | null>(null);
  const serverAmount = asyncConfig.kind === 'loaded' ? (asyncConfig.data?.amount ?? null) : null;
  const feeAmount = editedAmount ?? serverAmount;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (feeAmount === null) return;
    void run(async () => {
      // `PUT /api/registration-fee-config` — the admin sets a new level, in
      // effect from now on; it never changes a level already paid.
      await changeRegistrationFee(feeAmount);
      setEditedAmount(null);
      toast.success('Đã lưu cấu hình phí mở bán!');
    });
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Quản Trị', to: routes.admin.overview },
          { label: 'Cấu hình hệ thống', to: routes.admin.config },
          { label: 'Phí mở bán' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cấu Hình Phí Mở Bán Gian Hàng</h1>
          <p className={styles.subtitle}>
            Thiết lập mức phí kích hoạt gian hàng. Mức mới có hiệu lực từ thời điểm lưu và không
            thay đổi các mức đã thu.
          </p>
        </div>
      </div>

      <Card padding="lg" className={styles.form}>
        <form onSubmit={handleSave} className={styles.stack}>
          <div>
            <label className={styles.label} htmlFor="opening-fee-amount">
              Phí mở bán gian hàng hiện hành (VNĐ)
            </label>
            <input
              id="opening-fee-amount"
              type="number"
              placeholder="Ví dụ: 500000"
              value={feeAmount ?? ''}
              onChange={(e) => setEditedAmount(Number(e.target.value))}
              className={styles.input}
              disabled={feeAmount === null}
            />
            {feeAmount === null && (
              <span className={styles.hint}>Đang tải mức phí hiện hành từ máy chủ…</span>
            )}
          </div>

          {/*
            Sàn không thu hoa hồng trên mỗi đơn (BR-10), và máy chủ không có
            endpoint nào để đặt tỷ lệ hoa hồng — nên form này chỉ còn một
            mức phí duy nhất là thật.
          */}
          <p className={styles.hint}>
            Moonkage không thu hoa hồng trên đơn hàng; khoản giữ lại trong ký quỹ là toàn bộ
            số tiền người mua đã thanh toán cho người bán.
          </p>

          {error && <p role="alert">{error}</p>}

          <div className={styles.actions}>
            <Button type="submit" variant="primary" loading={busy} disabled={feeAmount === null}>
              Lưu Cấu Hình Phí Mở Bán
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

import styles from './VendorZonesSettingsPage.module.css';
import { useState } from 'react';
import { routes, PROVINCE_ITEMS } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Button, ButtonLink, Card, Breadcrumbs, Input, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useCurrentUser } from '@/entities/user';
import { useDeliveryAreas, useMyVendorDetail, useOwnVendorId } from '@/entities/vendor';
import { useSaveDeliveryAreas, useUpdateVendor } from '@/features/edit-vendor-settings';

export function VendorZonesSettingsPage() {
  const user = useCurrentUser();
  const vendorId = useOwnVendorId(user.vendorId);

  /*
   * Vùng giao và phí giao nội thành đọc từ máy chủ
   * (`GET /api/vendors/{vendorId}/delivery-areas` và `GET /api/vendors/{vendorId}`).
   * Trước đây form tự điền 4 tỉnh và phí 25.000đ — đó là cấu hình bịa, và
   * người dùng có thể lưu nguyên xi mà không hề biết mình đang giao tới
   * những tỉnh khác.
   */
  const asyncAreas = useDeliveryAreas(vendorId);
  const asyncDetail = useMyVendorDetail(vendorId);

  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [localDeliveryFee, setLocalDeliveryFee] = useState('');
  const { busy, run, error } = useAction();
  const saveDeliveryAreas = useSaveDeliveryAreas();
  const updateVendor = useUpdateVendor();

  // Nạp giá trị thật từ máy chủ vào form, một lần duy nhất.
  const [areasLoaded, setAreasLoaded] = useState(false);
  const serverAreas = asyncAreas.kind === 'loaded' ? asyncAreas.data : null;
  if (serverAreas && !areasLoaded) {
    setAreasLoaded(true);
    setSelectedCodes(serverAreas);
  }

  const [feeLoaded, setFeeLoaded] = useState(false);
  const serverFee = asyncDetail.kind === 'loaded' ? asyncDetail.data?.localDeliveryFee : undefined;
  if (serverFee !== undefined && !feeLoaded) {
    setFeeLoaded(true);
    setLocalDeliveryFee(String(serverFee));
  }

  function toggleProvince(code: string) {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    void run(async () => {
      // FR-28: `PUT /api/vendors/{vendorId}/delivery-areas` replaces the whole
      // list of provinces the vendor delivers to, and
      // `PATCH /api/vendors/{vendorId}` sets the local delivery fee.
      await saveDeliveryAreas(vendorId, selectedCodes);
      await updateVendor(vendorId, {
        localDeliveryFee: Number(localDeliveryFee) || 0,
      });
      toast.success('Đã lưu cấu hình vùng giao hàng và biểu phí vận chuyển!');
    });
  }

  return (
    <div className={styles.container}>
      <Breadcrumbs
        items={[
          { label: 'Kênh Xưởng', to: routes.vendor.overview },
          { label: 'Cài đặt gian hàng', to: routes.vendor.settings },
          { label: 'Cấu hình vùng giao hàng' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vùng giao hàng và phí vận chuyển</h1>
          <p className={styles.subtitle}>
            Chọn các tỉnh xưởng giao hàng đến và đặt phí giao nội thành
          </p>
        </div>
      </div>

      <Card padding="lg" className={styles.card}>
        <form onSubmit={handleSave} className={styles.form}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.fieldLabel}>Tỉnh / Thành phố giao hàng đến</legend>
            <div className={styles.provinceGrid}>
              {PROVINCE_ITEMS.map((p) => {
                const active = selectedCodes.includes(p.code);
                return (
                  <button
                    key={p.code}
                    type="button"
                    className={`${styles.provinceChip} ${active ? styles.provinceChipActive : ''}`}
                    aria-pressed={active}
                    onClick={() => toggleProvince(p.code)}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
            <p className={styles.hint}>
              Đã chọn <strong>{selectedCodes.length}</strong> tỉnh / thành phố.
            </p>
          </fieldset>

          <div>
            <label className={styles.fieldLabel} htmlFor="local-fee">
              Phí giao nội thành cơ bản (VNĐ)
            </label>
            <Input
              id="local-fee"
              type="number"
              value={localDeliveryFee}
              onChange={(e) => setLocalDeliveryFee(e.target.value)}
              min={0}
              required
            />
            <span className={styles.hint}>
              Phí giao nội thành hiện tại:{' '}
              <strong>
                {localDeliveryFee === '' ? 'Chưa khai báo' : formatCurrency(Number(localDeliveryFee) || 0)}
              </strong>
            </span>
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <Button type="submit" variant="primary" loading={busy}>
              Lưu Cấu Hình
            </Button>
            <ButtonLink to={routes.vendor.settings} variant="outline">
              Quay Lại
            </ButtonLink>
          </div>
        </form>
      </Card>
    </div>
  );
}

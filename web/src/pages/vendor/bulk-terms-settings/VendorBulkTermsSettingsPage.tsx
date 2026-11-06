import styles from './VendorBulkTermsSettingsPage.module.css';
import { useState } from 'react';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Button, ButtonLink, Card, Breadcrumbs, Input, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useCurrentUser } from '@/entities/user';
import { useOwnVendorId, useOrderProfile } from '@/entities/vendor';
import { useSaveOrderProfile } from '@/features/edit-vendor-settings';

export function VendorBulkTermsSettingsPage() {
  const user = useCurrentUser();
  const vendorId = useOwnVendorId(user.vendorId);

  // FR-35: `GET /api/vendors/{vendorId}/order-profile` — điều kiện nhận đặt hàng.
  const asyncProfile = useOrderProfile(vendorId);
  const profile = asyncProfile.kind === 'loaded' ? asyncProfile.data : null;

  const [tier1Qty, setTier1Qty] = useState('50');
  const [tier1Price, setTier1Price] = useState('160000');
  const [tier2Qty, setTier2Qty] = useState('100');
  const [tier2Price, setTier2Price] = useState('145000');
  const [tier3Qty, setTier3Qty] = useState('300');
  const [tier3Price, setTier3Price] = useState('130000');
  const [leadTimeDays, setLeadTimeDays] = useState('5');
  const [earlyBirdOffer, setEarlyBirdOffer] = useState('');
  const { busy, run, error } = useAction();
  const saveOrderProfile = useSaveOrderProfile();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    void run(async () => {
      // FR-35: `PUT /api/vendors/{vendorId}/order-profile` — the server replaces
      // the whole profile, so the tiers are sent as a list.
      await saveOrderProfile(vendorId, {
        minQty: Number(tier1Qty) || undefined,
        leadTimeDays: Number(leadTimeDays) || 0,
        priceTiers: [
          { fromQty: Number(tier1Qty) || 0, unitPrice: Number(tier1Price) || 0 },
          { fromQty: Number(tier2Qty) || 0, unitPrice: Number(tier2Price) || 0 },
          { fromQty: Number(tier3Qty) || 0, unitPrice: Number(tier3Price) || 0 },
        ].filter((t) => t.fromQty > 0),
        earlyBirdOffer: earlyBirdOffer || undefined,
      });
      toast.success('Đã lưu chính sách nhận đặt hàng số lượng lớn của xưởng!');
      asyncProfile.reload();
    });
  }

  const tiers = profile?.priceTiers ?? [];

  return (
    <div className={styles.container}>
      <Breadcrumbs
        items={[
          { label: 'Kênh Xưởng', to: routes.vendor.overview },
          { label: 'Cài đặt gian hàng', to: routes.vendor.settings },
          { label: 'Chính sách đặt sỉ doanh nghiệp' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Chính Sách Báo Giá Sỉ & Chiết Khấu Doanh Nghiệp (B6.3)</h1>
          <p className={styles.subtitle}>
            Thiết lập bảng giá theo số lượng để gợi ý khi doanh nghiệp gửi yêu cầu RFQ
          </p>
        </div>
      </div>

      <Card padding="lg" className={styles.card}>
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.tierGrid}>
            <div>
              <span className={styles.fieldLabel}>Từ số lượng (hộp)</span>
              <Input type="number" value={tier1Qty} onChange={(e) => setTier1Qty(e.target.value)} required />
              <span className={styles.fieldHint}>
                Đơn giá: {formatCurrency(Number(tier1Price) || 0)}
              </span>
            </div>
            <div>
              <span className={styles.fieldLabel}>Đơn giá (VNĐ)</span>
              <Input type="number" value={tier1Price} onChange={(e) => setTier1Price(e.target.value)} required />
            </div>
            <div>
              <span className={styles.fieldLabel}>Từ số lượng (hộp)</span>
              <Input type="number" value={tier2Qty} onChange={(e) => setTier2Qty(e.target.value)} required />
              <span className={styles.fieldHint}>
                Đơn giá: {formatCurrency(Number(tier2Price) || 0)}
              </span>
            </div>
            <div>
              <span className={styles.fieldLabel}>Đơn giá (VNĐ)</span>
              <Input type="number" value={tier2Price} onChange={(e) => setTier2Price(e.target.value)} required />
            </div>
            <div>
              <span className={styles.fieldLabel}>Từ số lượng (hộp)</span>
              <Input type="number" value={tier3Qty} onChange={(e) => setTier3Qty(e.target.value)} required />
              <span className={styles.fieldHint}>
                Đơn giá: {formatCurrency(Number(tier3Price) || 0)}
              </span>
            </div>
            <div>
              <span className={styles.fieldLabel}>Đơn giá (VNĐ)</span>
              <Input type="number" value={tier3Price} onChange={(e) => setTier3Price(e.target.value)} required />
            </div>
          </div>

          <div className={styles.row2}>
            <div>
              <span className={styles.fieldLabel}>Thời gian nướng & hoàn tất mẻ bánh (ngày)</span>
              <Input
                type="number"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                min={0}
                required
              />
            </div>
            <div>
              <span className={styles.fieldLabel}>Ưu đãi dành cho khách đặt sớm</span>
              <Input
                type="text"
                value={earlyBirdOffer}
                onChange={(e) => setEarlyBirdOffer(e.target.value)}
                placeholder="VD: Giảm 5% cho đơn đặt trước 7 ngày"
              />
            </div>
          </div>

          {tiers.length > 0 && (
            <p className={styles.hint}>
              Hồ sơ hiện tại trên máy chủ:{' '}
              {tiers.map((t) => `${t.fromQty}+ hộp → ${formatCurrency(t.unitPrice)}`).join(' · ')}
            </p>
          )}

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <Button type="submit" variant="primary" loading={busy}>
              Lưu Chính Sách Báo Giá Sỉ
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


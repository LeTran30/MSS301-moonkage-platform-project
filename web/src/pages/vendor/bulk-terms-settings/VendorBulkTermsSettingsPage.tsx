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

  /*
   * Bảng giá theo bậc đọc từ hồ sơ nhận đặt hàng trên máy chủ
   * (`GET /api/vendors/{vendorId}/order-profile`). Trước đây form điền sẵn
   * 160.000đ / 145.000đ / 130.000đ — người dùng có thể lưu nguyên bảng giá bịa
   * mà không nhập gì.
   */
  const [tier1Qty, setTier1Qty] = useState('');
  const [tier1Price, setTier1Price] = useState('');
  const [tier2Qty, setTier2Qty] = useState('');
  const [tier2Price, setTier2Price] = useState('');
  const [tier3Qty, setTier3Qty] = useState('');
  const [tier3Price, setTier3Price] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState('');
  const [earlyBirdOffer, setEarlyBirdOffer] = useState('');
  const { busy, run, error } = useAction();
  const saveOrderProfile = useSaveOrderProfile();

  // Nạp giá trị thật từ máy chủ vào form, một lần duy nhất.
  const [tiersLoaded, setTiersLoaded] = useState(false);
  if (profile && !tiersLoaded) {
    setTiersLoaded(true);
    const tiers = profile.priceTiers ?? [];
    const t1 = tiers[0];
    const t2 = tiers[1];
    const t3 = tiers[2];
    setTier1Qty(t1 ? String(t1.fromQty) : '');
    setTier1Price(t1 ? String(t1.unitPrice) : '');
    setTier2Qty(t2 ? String(t2.fromQty) : '');
    setTier2Price(t2 ? String(t2.unitPrice) : '');
    setTier3Qty(t3 ? String(t3.fromQty) : '');
    setTier3Price(t3 ? String(t3.unitPrice) : '');
    setLeadTimeDays(
      profile.leadTimeDays === undefined ? '' : String(profile.leadTimeDays),
    );
    setEarlyBirdOffer(profile.earlyBirdOffer ?? '');
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    /*
     * Máy chủ yêu cầu ít nhất một bậc giá (`@NotEmpty priceTiers`), và mỗi bậc
     * phải có số lượng lẫn đơn giá thật. Bậc giá để trống thì không gửi lên,
     * thay vì gửi `unitPrice: 0` — giá 0 là một mức giá bịa.
     */
    const draft = [
      { fromQty: Number(tier1Qty) || 0, unitPrice: Number(tier1Price) || 0 },
      { fromQty: Number(tier2Qty) || 0, unitPrice: Number(tier2Price) || 0 },
      { fromQty: Number(tier3Qty) || 0, unitPrice: Number(tier3Price) || 0 },
    ];
    const priceTiers = draft.filter((t) => t.fromQty > 0 && t.unitPrice > 0);

    if (priceTiers.length === 0) {
      toast.error('Cần ít nhất một bậc giá có số lượng và đơn giá.');
      return;
    }

    void run(async () => {
      // FR-35: `PUT /api/vendors/{vendorId}/order-profile` — the server replaces
      // the whole profile, so the tiers are sent as a list.
      await saveOrderProfile(vendorId, {
        minQty: Number(tier1Qty) || undefined,
        leadTimeDays: Number(leadTimeDays) || 0,
        priceTiers,
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
          <h1 className={styles.title}>Chính Sách Báo Giá Sỉ & Chiết Khấu Doanh Nghiệp</h1>
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
              <Input
                type="number"
                value={tier1Qty}
                onChange={(e) => setTier1Qty(e.target.value)}
                required
              />
              <span className={styles.fieldHint}>
                Đơn giá:{' '}
                {tier1Price ? formatCurrency(Number(tier1Price) || 0) : 'chưa nhập'}
              </span>
            </div>
            <div>
              <span className={styles.fieldLabel}>Đơn giá (VNĐ)</span>
              <Input
                type="number"
                value={tier1Price}
                onChange={(e) => setTier1Price(e.target.value)}
                required
              />
            </div>
            <div>
              <span className={styles.fieldLabel}>Từ số lượng (hộp)</span>
              {/* Bậc 2 và bậc 3 là tuỳ chọn: máy chủ chỉ cần ít nhất một bậc giá. */}
              <Input
                type="number"
                value={tier2Qty}
                onChange={(e) => setTier2Qty(e.target.value)}
              />
              <span className={styles.fieldHint}>
                Đơn giá:{' '}
                {tier2Price ? formatCurrency(Number(tier2Price) || 0) : 'chưa nhập'}
              </span>
            </div>
            <div>
              <span className={styles.fieldLabel}>Đơn giá (VNĐ)</span>
              <Input
                type="number"
                value={tier2Price}
                onChange={(e) => setTier2Price(e.target.value)}
              />
            </div>
            <div>
              <span className={styles.fieldLabel}>Từ số lượng (hộp)</span>
              <Input
                type="number"
                value={tier3Qty}
                onChange={(e) => setTier3Qty(e.target.value)}
              />
              <span className={styles.fieldHint}>
                Đơn giá:{' '}
                {tier3Price ? formatCurrency(Number(tier3Price) || 0) : 'chưa nhập'}
              </span>
            </div>
            <div>
              <span className={styles.fieldLabel}>Đơn giá (VNĐ)</span>
              <Input
                type="number"
                value={tier3Price}
                onChange={(e) => setTier3Price(e.target.value)}
              />
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

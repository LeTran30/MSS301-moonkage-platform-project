import { useState, type FormEvent } from 'react';
import { Tabs, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import {
  VendorConditionsSettingsTab,
  VendorLegalSettingsTab,
  VendorShippingSettingsTab,
  type VendorSellingMode,
} from '@/features/edit-vendor-settings';
import { useMyVendorId, useOrderProfile, useDeliveryAreas } from '@/entities/vendor';
import { useSaveDeliveryAreas, useSaveOrderProfile } from '@/features/edit-vendor-settings';
import { routes } from '@/shared/config';
import { Badge, ButtonLink, Card } from '@/shared/ui';
import styles from './VendorSettingsPage.module.css';

type SettingsTab = 'LEGAL' | 'SHIPPING' | 'CONDITIONS' | 'CAPACITY';

/**
 * B6.1 — B6.3 — the settings of the shop.
 *
 * The two tabs that change what the shop sells are written to the backend:
 * B6.2 replaces the provinces the shop delivers to
 * (`PUT /api/vendors/{vendorId}/delivery-areas`, FR-28) and B6.3 replaces the
 * order terms it accepts custom orders on
 * (`PUT /api/vendors/{vendorId}/order-profile`, FR-35).
 */
export function VendorSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('LEGAL');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const { busy, run } = useAction();

  const myVendorId = useMyVendorId();
  const vendorId = myVendorId.kind === 'loaded' ? myVendorId.data : null;
  const orderProfile = useOrderProfile(vendorId ?? '');
  const deliveryAreas = useDeliveryAreas(vendorId);

  const saveDeliveryAreas = useSaveDeliveryAreas();
  const saveOrderProfile = useSaveOrderProfile();

  // B6.1 Pháp lý
  const [businessType, setBusinessType] = useState('HKD'); // HKD or DNTN per BR-33
  const [businessName, setBusinessName] = useState('Hộ kinh doanh Bánh Cổ Truyền Đông Phương');
  const [taxCode, setTaxCode] = useState('0201199281');
  const [representative, setRepresentative] = useState('Bà Phạm Thị Lan');
  const [representativeCccd] = useState('031182001928');
  const [address, setAddress] = useState('172 Cầu Đất, Ngô Quyền, Hải Phòng');

  // B6.2 Vùng giao hàng — FR-28: vùng giao là danh sách tỉnh.
  const [provinceCodes, setProvinceCodes] = useState<string[]>([]);

  // B6.3 Điều kiện nhận đặt hàng (BR-21, Flow 3)
  const [sellingMode, setSellingMode] = useState<VendorSellingMode>('BOTH');
  const [minBulkQuantity, setMinBulkQuantity] = useState('50');
  const [minLeadTimeDays, setMinLeadTimeDays] = useState('7');
  const [defaultDepositPercent, setDefaultDepositPercent] = useState('40');
  const [customBoxService, setCustomBoxService] = useState(true);

  function toggleProvince(code: string) {
    setProvinceCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function handleShippingSave(e: FormEvent) {
    e.preventDefault();
    if (!vendorId) {
      toast.error('Chưa tìm thấy gian hàng của bạn.');
      return;
    }
    if (provinceCodes.length === 0) {
      toast.error('Chọn ít nhất một tỉnh để có vùng giao hàng.');
      return;
    }
    void run(async () => {
      await saveDeliveryAreas(vendorId, provinceCodes);
      setSavedSuccess(true);
      toast.success('Đã lưu vùng giao hàng của gian hàng!');
    });
  }

  function handleConditionsSave(e: FormEvent) {
    e.preventDefault();
    if (!vendorId) {
      toast.error('Chưa tìm thấy gian hàng của bạn.');
      return;
    }
    void run(async () => {
      // FR-35: the backend replaces the whole order profile; `priceTiers` is
      // required and the deposit rate belongs to the quote, not to the profile,
      // so the tier the seller set here is the one shown to the buyer.
      await saveOrderProfile(vendorId, {
        minQty: Number(minBulkQuantity) || 0,
        leadTimeDays: Number(minLeadTimeDays) || 0,
        priceTiers: [{ fromQty: Number(minBulkQuantity) || 1, unitPrice: 0 }],
      });
      setSavedSuccess(true);
      toast.success('Đã lưu điều kiện nhận đơn của gian hàng!');
    });
  }

  const loadedProfile = orderProfile.kind === 'loaded' ? orderProfile.data : null;
  const loadedAreas = deliveryAreas.kind === 'loaded' ? deliveryAreas.data : [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cài đặt gian hàng (B6.1 - B6.3)</h1>
          <p className={styles.desc}>
            Thông tin pháp lý Hộ kinh doanh/DNTN (BR-33), vùng phục vụ giao hàng và điều kiện nhận đơn đặt hàng doanh nghiệp.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className={styles.alertSuccess} role="status">
          ✓ Đã lưu thay đổi cấu hình gian hàng thành công!
        </div>
      )}

      <Tabs
        items={[
          { id: 'LEGAL', label: '1. Pháp lý & Gian hàng (B6.1)' },
          { id: 'SHIPPING', label: '2. Vùng giao hàng (B6.2)' },
          { id: 'CONDITIONS', label: '3. Điều kiện nhận đặt hàng (B6.3)' },
          { id: 'CAPACITY', label: '4. Lịch công suất (B6.4)' },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as SettingsTab)}
      />

      {activeTab === 'LEGAL' && (
        <VendorLegalSettingsTab
          businessType={businessType}
          businessName={businessName}
          taxCode={taxCode}
          representative={representative}
          representativeCccd={representativeCccd}
          address={address}
          onBusinessTypeChange={setBusinessType}
          onBusinessNameChange={setBusinessName}
          onTaxCodeChange={setTaxCode}
          onRepresentativeChange={setRepresentative}
          onAddressChange={setAddress}
        />
      )}

      {activeTab === 'SHIPPING' && (
        <VendorShippingSettingsTab
          provinceCodes={provinceCodes.length > 0 ? provinceCodes : loadedAreas}
          onProvinceToggle={toggleProvince}
          onSave={handleShippingSave}
          busy={busy}
        />
      )}

      {activeTab === 'CONDITIONS' && (
        <VendorConditionsSettingsTab
          sellingMode={sellingMode}
          minBulkQuantity={minBulkQuantity}
          minLeadTimeDays={minLeadTimeDays}
          defaultDepositPercent={defaultDepositPercent}
          customBoxService={customBoxService}
          onSellingModeChange={setSellingMode}
          onMinBulkQuantityChange={setMinBulkQuantity}
          onMinLeadTimeDaysChange={setMinLeadTimeDays}
          onDefaultDepositPercentChange={setDefaultDepositPercent}
          onCustomBoxServiceChange={setCustomBoxService}
          onSave={handleConditionsSave}
          busy={busy}
        />
      )}

      {activeTab === 'CAPACITY' && (
        <Card padding="lg" className={styles.deferredCard}>
          <div className={styles.deferredHeader}>
            <h2 className={styles.deferredTitle}>Lịch công suất nhận đặt hàng</h2>
            <Badge tone="amber" size="md">
              Hoãn trong bản demo
            </Badge>
          </div>
          <p className={styles.desc}>
            FR-37 (xem công suất còn lại) thuộc nhóm hoãn của bản demo, nên chưa có màn hình khai báo
            lịch theo tuần. Mã trang B6.4 vẫn được giữ trong bản đồ giao diện.
          </p>
          <div className={styles.deferredActions}>
            <ButtonLink to={routes.vendor.capacity} variant="outline">
              Mở trang Lịch công suất (B6.4)
            </ButtonLink>
          </div>
        </Card>
      )}

      {loadedProfile && (
        <p className={styles.desc}>
          Hồ sơ nhận đặt hàng hiện tại: MOQ {loadedProfile.minQty ?? 0}, thời gian chuẩn bị{' '}
          {loadedProfile.leadTimeDays ?? 0} ngày.
        </p>
      )}
    </div>
  );
}

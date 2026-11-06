import { useState, type FormEvent } from 'react';
import { Tabs, toast, Icon } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import {
  LegalProfileForm,
  VendorConditionsSettingsTab,
  VendorShippingSettingsTab,
  type VendorSellingMode,
} from '@/features/edit-vendor-settings';
import {
  useMyVendorDetail,
  useMyVendorId,
  useOrderProfile,
  useDeliveryAreas,
} from '@/entities/vendor';
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
  // B6.1 Pháp lý: hồ sơ thật của gian hàng (`GET /api/vendors/{vendorId}`).
  const vendorDetail = useMyVendorDetail(vendorId);

  const saveDeliveryAreas = useSaveDeliveryAreas();
  const saveOrderProfile = useSaveOrderProfile();

  /*
   * B6.1 Pháp lý: hồ sơ thật của gian hàng (`GET /api/vendors/{vendorId}`) được
   * nạp vào form bên dưới, nên trang này không giữ bản sao của các ô pháp lý.
   */
  const loadedDetail = vendorDetail.kind === 'loaded' ? vendorDetail.data : null;

  // B6.2 Vùng giao hàng — FR-28: vùng giao là danh sách tỉnh.
  const [provinceCodes, setProvinceCodes] = useState<string[]>([]);

  // Nạp vùng giao thật từ máy chủ vào form, một lần duy nhất. Nếu không nạp,
  // người dùng không thể bỏ chọn một tỉnh đang có (danh sách rỗng sẽ bị thay
  // bằng danh sách cũ khi hiển thị).
  const [areasLoaded, setAreasLoaded] = useState(false);
  const serverAreas = deliveryAreas.kind === 'loaded' ? deliveryAreas.data : null;
  if (serverAreas && !areasLoaded) {
    setAreasLoaded(true);
    setProvinceCodes(serverAreas);
  }

  // B6.3 Điều kiện nhận đặt hàng (BR-21, Flow 3)
  const [sellingMode, setSellingMode] = useState<VendorSellingMode>('BOTH');
  const [minBulkQuantity, setMinBulkQuantity] = useState('');
  const [minLeadTimeDays, setMinLeadTimeDays] = useState('');

  // Nạp điều kiện nhận đặt hàng từ hồ sơ nhận đặt hàng trên máy chủ.
  const [conditionsLoaded, setConditionsLoaded] = useState(false);
  const loadedProfile = orderProfile.kind === 'loaded' ? orderProfile.data : null;
  if (loadedProfile && !conditionsLoaded) {
    setConditionsLoaded(true);
    setMinBulkQuantity(loadedProfile.minQty ? String(loadedProfile.minQty) : '');
    setMinLeadTimeDays(
      loadedProfile.leadTimeDays === undefined ? '' : String(loadedProfile.leadTimeDays),
    );
  }

  function toggleProvince(code: string) {
    setProvinceCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
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
      //
      // Bậc giá được giữ nguyên những gì đang có trên máy chủ: form này chỉ
      // sửa MOQ và thời gian chuẩn bị, nên không được ghi đè bằng `unitPrice: 0`
      // (đó là một bậc giá bịa, và sẽ xoá bảng giá thật của xưởng).
      await saveOrderProfile(vendorId, {
        minQty: Number(minBulkQuantity) || 0,
        leadTimeDays: Number(minLeadTimeDays) || 0,
        priceTiers:
          loadedProfile?.priceTiers && loadedProfile.priceTiers.length > 0
            ? loadedProfile.priceTiers
            : [{ fromQty: Number(minBulkQuantity) || 1, unitPrice: 0 }],
      });
      setSavedSuccess(true);
      toast.success('Đã lưu điều kiện nhận đơn của gian hàng!');
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cài đặt gian hàng</h1>
          <p className={styles.desc}>
            Thông tin pháp lý Hộ kinh doanh/DNTN, vùng phục vụ giao hàng và điều kiện nhận đơn đặt
            hàng doanh nghiệp.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className={styles.alertSuccess} role="status">
          <Icon name="check" size={16} /> Đã lưu thay đổi cấu hình gian hàng thành công!
        </div>
      )}

      <Tabs
        items={[
          { id: 'LEGAL', label: '1. Pháp lý & Gian hàng' },
          { id: 'SHIPPING', label: '2. Vùng giao hàng' },
          { id: 'CONDITIONS', label: '3. Điều kiện nhận đặt hàng' },
          { id: 'CAPACITY', label: '4. Lịch công suất' },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as SettingsTab)}
      />

      {activeTab === 'LEGAL' && (
        /*
          B6.1 dùng `LegalProfileForm` — form đọc và ghi hồ sơ pháp lý qua
          `GET/PUT /api/vendors/{vendorId}`. Trước đây tab này dùng một bản sao
          riêng (`VendorLegalSettingsTab`) chỉ hiển thị dữ liệu giả và nút
          "Lưu" không hề gọi máy chủ; bản sao đó đã bị gỡ bỏ.
        */
        loadedDetail && vendorId ? (
          <LegalProfileForm key={vendorId} vendorId={vendorId} detail={loadedDetail} />
        ) : (
          <Card padding="lg" className={styles.deferredCard}>
            <p className={styles.desc}>Đang tải hồ sơ pháp lý của gian hàng…</p>
          </Card>
        )
      )}

      {activeTab === 'SHIPPING' && (
        <VendorShippingSettingsTab
          provinceCodes={provinceCodes}
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
          onSellingModeChange={setSellingMode}
          onMinBulkQuantityChange={setMinBulkQuantity}
          onMinLeadTimeDaysChange={setMinLeadTimeDays}
          onSave={handleConditionsSave}
          busy={busy}
        />
      )}

      {activeTab === 'CAPACITY' && (
        <Card padding="lg" className={styles.deferredCard}>
          <div className={styles.deferredHeader}>
            <h2 className={styles.deferredTitle}>Lịch công suất nhận đặt hàng</h2>
            <Badge tone="amber" size="md">
              Chưa có trong phiên bản này
            </Badge>
          </div>
          <p className={styles.desc}>
            Tính năng xem công suất còn lại thuộc nhóm hoãn của phiên bản này, nên chưa có màn hình
            khai báo lịch theo tuần.
          </p>
          <div className={styles.deferredActions}>
            <ButtonLink to={routes.vendor.capacity} variant="outline">
              Mở trang Lịch công suất
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

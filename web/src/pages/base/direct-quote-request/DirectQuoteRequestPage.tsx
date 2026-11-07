import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { routes, PROVINCE_ITEMS, provinceNameOf } from '@/shared/config';
import { Button, ButtonLink, Card, Icon, Input, Select, Textarea, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useVendor } from '@/entities/vendor';
import { useCurrentUser } from '@/entities/user';
import { CUSTOM_TYPES, CUSTOM_TYPE_LABELS, type CustomType } from '@/entities/request';
import { useCreateQuoteRequest } from '@/features/request-quote';
import styles from './DirectQuoteRequestPage.module.css';
import { useDeliveryProvinceCode } from '@/entities/region';

export function DirectQuoteRequestPage() {
  const { id } = useParams<{ id: string }>();
  const vendor = useVendor(id || '');
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { busy, run, error } = useAction();
  const createQuoteRequest = useCreateQuoteRequest();

  // Người mua đã xác minh NFC. Chủ của người bán không thấy lối vào.
  const isOwner = Boolean(user.vendorId && user.vendorId === vendor?.id);
  const isNfcVerified = user.nfcStatus === 'VERIFIED';

  /*
   * Yêu cầu báo giá phải do người mua tự điền. Trước đây form điền sẵn 80 hộp,
   * hạn giao 05/11/2026, địa chỉ "88 Đường Nguyễn Đình Chiểu" và yêu cầu dán
   * sticker — người mua có thể gửi yêu cầu mà không hề nhập gì.
   */
  const [quantity, setQuantity] = useState('');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [recipientName, setRecipientName] = useState(user.name);
  const [recipientPhone, setRecipientPhone] = useState(user.phone);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  // Bắt đầu từ tỉnh giao người mua đang chọn ở header; người mua đổi được ở bước địa chỉ.
  const deliveryProvinceCode = useDeliveryProvinceCode();
  const [provinceCode, setProvinceCode] = useState(() => deliveryProvinceCode);
  const [requirements, setRequirements] = useState('');
  const [customTypes, setCustomTypes] = useState<CustomType[]>([]);

  const provinceOptions = useMemo(
    () => PROVINCE_ITEMS.map((p) => ({ value: p.code, label: p.name })),
    [],
  );

  function toggleCustomType(type: CustomType) {
    setCustomTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendor) return;
    if (!isNfcVerified) {
      toast.warning('Vui lòng hoàn thành bước xác minh NFC trước khi gửi yêu cầu báo giá.');
      navigate(routes.account.verify, { state: { returnUrl: routes.base.vendorRequest(vendor.id) } });
      return;
    }

    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      toast.error('Vui lòng nhập số lượng hộp cần đặt.');
      return;
    }
    if (!deliveryDeadline) {
      toast.error('Vui lòng chọn hạn giao hàng mong muốn.');
      return;
    }
    if (!deliveryAddress.trim()) {
      toast.error('Vui lòng nhập địa chỉ giao hàng.');
      return;
    }

    run(async () => {
      // `POST /api/quote-requests` với `type = DIRECT` và xưởng được chọn.
      const created = await createQuoteRequest({
        type: 'DIRECT',
        targetVendorId: vendor.id,
        quantity: qty,
        customTypes: customTypes.length > 0 ? customTypes : undefined,
        customSpec: requirements,
        deliveryDeadline,
        delivery: {
          recipientName,
          recipientPhone,
          provinceCode,
          addressDetail: deliveryAddress,
        },
      });
      toast.success(`Đã gửi yêu cầu báo giá riêng tới ${vendor.name}.`);
      navigate(routes.account.request(created.id));
    });
  }

  if (isOwner) {
    return (
      <div className={styles.container}>
        <Card padding="lg" tone="gold" className={styles.ownerCard}>
          <Icon name="alert" size={32} />
          <h2>Bạn là chủ của đơn vị này</h2>
          <p>Hệ thống không cho phép người bán tự gửi yêu cầu báo giá cho chính mình.</p>
          <ButtonLink to={routes.vendor.overview} variant="primary">
            Về Kênh người bán
          </ButtonLink>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>GỬI YÊU CẦU TRỰC TIẾP</div>
        <h1 className={styles.title}>Gửi Yêu Cầu Đặt Hàng Riêng Cho {vendor?.name}</h1>
        <p className={styles.lead}>
          Yêu cầu này chỉ gửi độc quyền tới đơn vị này. Xưởng sẽ phản hồi bảng báo giá và liên hệ với bạn trong vòng 24h.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Card padding="lg" className={styles.card}>
          <div className={styles.grid2}>
            <Input
              label="Số lượng hộp cần đặt"
              type="number"
              min={vendor?.bulkMinQuantity || 1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              placeholder="Ví dụ: 200"
              hint={
                vendor?.bulkMinQuantity
                  ? `Tối thiểu từ ${vendor.bulkMinQuantity} hộp theo quy định của xưởng`
                  : 'Xưởng chưa khai báo số lượng tối thiểu · nhập số lượng bạn cần đặt.'
              }
            />
            <Input
              label="Ngày cần nhận bánh"
              type="date"
              value={deliveryDeadline}
              onChange={(e) => setDeliveryDeadline(e.target.value)}
              required
            />
          </div>

          <div className={styles.grid2}>
            <Input
              label="Người nhận"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              required
              placeholder="Ví dụ: Nguyễn Thị Mai"
            />
            <Input
              label="Số điện thoại người nhận"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              required
              placeholder="0912 345 678"
              hint="10 số, bắt đầu bằng 0"
            />
          </div>

          <div className={styles.grid2}>
            <Input
              label="Địa chỉ giao hàng"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              required
              placeholder="Ví dụ: 88 Đường Nguyễn Đình Chiểu, Quận 1"
            />
            <Select
              label="Tỉnh / Thành phố"
              options={provinceOptions}
              value={provinceCode}
              onChange={(v) => setProvinceCode(v)}
              required
            />
          </div>
          <p className={styles.hintLine}>
            Khu vực giao: <strong>{provinceNameOf(provinceCode) || 'Hà Nội'}</strong> — phí liên tỉnh tính theo tỉnh này.
          </p>

          <fieldset className={styles.fieldset}>
            <legend className={styles.label}>Loại tùy chỉnh cần làm</legend>
            <div className={styles.chipRow}>
              {CUSTOM_TYPES.map((type) => {
                const active = customTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                    aria-pressed={active}
                    onClick={() => toggleCustomType(type)}
                  >
                    {CUSTOM_TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Textarea
            id="direct-requirements"
            label="Chi tiết yêu cầu về bánh, in ấn logo và đóng gói"
            rows={4}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Ví dụ: 200 hộp bánh nướng thập cẩm và hạt sen, có in logo thương hiệu quà tặng lên hộp."
            required
          />

          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <ButtonLink to={routes.base.vendor(vendor?.id || id || '')} variant="secondary">
              Quay lại hồ sơ xưởng
            </ButtonLink>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              iconRight={busy ? undefined : 'arrowRight'}
              disabled={busy}
            >
              {busy ? 'Đang gửi yêu cầu báo giá...' : 'Gửi yêu cầu báo giá cho xưởng'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

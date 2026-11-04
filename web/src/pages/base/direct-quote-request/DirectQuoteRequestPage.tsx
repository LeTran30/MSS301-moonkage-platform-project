import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { routes, PROVINCE_ITEMS, provinceCodeOf, provinceNameOf } from '@/shared/config';
import { Button, ButtonLink, Card, Icon, Input, Select, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useVendor } from '@/entities/vendor';
import { useCurrentUser } from '@/entities/user';
import { CUSTOM_TYPES, CUSTOM_TYPE_LABELS, type CustomType } from '@/entities/request';
import { useCreateQuoteRequest } from '@/features/request-quote';
import styles from './DirectQuoteRequestPage.module.css';

export function DirectQuoteRequestPage() {
  const { id } = useParams<{ id: string }>();
  const vendor = useVendor(id || 'ven_hoa');
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { busy, run, error } = useAction();
  const createQuoteRequest = useCreateQuoteRequest();

  // FR-15 cond: Người mua đã xác minh NFC. Chủ của người bán không thấy lối vào (BR-22)
  const isOwner = Boolean(user.vendorId && user.vendorId === vendor?.id);
  const isNfcVerified = user.nfcStatus === 'VERIFIED';

  const [quantity, setQuantity] = useState('80');
  const [deliveryDeadline, setDeliveryDeadline] = useState('2026-11-05');
  const [recipientName, setRecipientName] = useState(user.name);
  const [recipientPhone, setRecipientPhone] = useState(user.phone);
  const [deliveryAddress, setDeliveryAddress] = useState('88 Đường Nguyễn Đình Chiểu, Quận 1');
  const [provinceCode, setProvinceCode] = useState(() => provinceCodeOf('TP Hồ Chí Minh'));
  const [requirements, setRequirements] = useState(
    'Cần 80 hộp bánh nướng thập cẩm và hạt sen, dán sticker thương hiệu quà tặng của tiệm lên hộp.'
  );
  const [customTypes, setCustomTypes] = useState<CustomType[]>(['STICKER']);

  const provinceOptions = useMemo(
    () => PROVINCE_ITEMS.map((p) => ({ value: p.code, label: p.name })),
    []
  );

  function toggleCustomType(type: CustomType) {
    setCustomTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
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

    run(async () => {
      // FR-15: `POST /api/quote-requests` with `type = DIRECT` and the target vendor.
      const created = await createQuoteRequest({
        type: 'DIRECT',
        targetVendorId: vendor.id,
        quantity: parseInt(quantity, 10) || 50,
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
          <h2>Bạn là chủ của đơn vị này (BR-22)</h2>
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
        <div className={styles.eyebrow}>GỬI YÊU CẦU TRỰC TIẾP (M3.4, FLOW 3, FR-15)</div>
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
              min={vendor?.bulkMinQuantity || 10}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              hint={`Tối thiểu từ ${vendor?.bulkMinQuantity || 20} hộp theo quy định của xưởng`}
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
            />
            <Input
              label="Số điện thoại người nhận"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              required
              hint="10 số, bắt đầu bằng 0"
            />
          </div>

          <div className={styles.grid2}>
            <Input
              label="Địa chỉ giao hàng"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              required
            />
            <Select
              label="Tỉnh / Thành phố"
              options={provinceOptions}
              value={provinceCode}
              onChange={(e) => setProvinceCode(e.target.value)}
              required
            />
          </div>
          <p className={styles.hintLine}>
            Khu vực giao: <strong>{provinceNameOf(provinceCode) || 'Hà Nội'}</strong> — phí liên tỉnh tính theo tỉnh này (BR-30).
          </p>

          <fieldset className={styles.fieldset}>
            <legend className={styles.label}>Loại tùy chỉnh cần làm (BR-14)</legend>
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

          <div className={styles.field}>
            <label className={styles.label} htmlFor="direct-requirements">
              Chi tiết yêu cầu về bánh, in ấn logo và đóng gói
            </label>
            <textarea
              id="direct-requirements"
              className={styles.textarea}
              rows={4}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <ButtonLink to={routes.base.vendor(vendor?.id || 'ven_hoa')} variant="secondary">
              Quay lại hồ sơ xưởng
            </ButtonLink>
            <Button type="submit" variant="primary" size="lg" iconRight={busy ? undefined : 'arrowRight'} disabled={busy}>
              {busy ? 'Đang gửi yêu cầu báo giá...' : 'Gửi yêu cầu báo giá cho xưởng'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

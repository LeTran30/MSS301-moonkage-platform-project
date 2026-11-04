import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes, PROVINCE_ITEMS, provinceCodeOf } from '@/shared/config';
import { Button, ButtonLink, toast } from '@/shared/ui';
import { useAction, validators } from '@/shared/lib';
import { useCurrentUser } from '@/entities/user';
import type { CustomType } from '@/entities/request';
import {
  NfcVerifyNotice,
  QuoteRequestBasicsCard,
  QuoteRequestDeliveryCard,
  QuoteRequestFlavorCard,
  QuoteRequestPackagingCard,
  useCreateQuoteRequest,
} from '@/features/request-quote';
import styles from './NewQuoteRequestPage.module.css';

/** Tên các trường có thể báo lỗi trong form yêu cầu báo giá. */
type QuoteFormErrors = Partial<
  Record<
    'quantity' | 'deliveryDeadline' | 'recipientName' | 'recipientPhone' | 'deliveryAddress',
    string
  >
>;

export function NewQuoteRequestPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { busy, run, error } = useAction();
  const createQuoteRequest = useCreateQuoteRequest();

  // FR-16 & Sitemap cond: Người mua đã xác minh NFC. Chưa xác minh -> M6.4 rồi quay lại
  const isNfcVerified = user.nfcStatus === 'VERIFIED';

  const [quantity, setQuantity] = useState('150');
  const [deliveryDeadline, setDeliveryDeadline] = useState('2026-11-10');
  const [recipientName, setRecipientName] = useState(user.name);
  const [recipientPhone, setRecipientPhone] = useState(user.phone);
  const [deliveryAddress, setDeliveryAddress] = useState(
    'Tòa tháp Capital Place, 29 Liễu Giai, Ba Đình'
  );
  const [provinceCode, setProvinceCode] = useState(() => provinceCodeOf('Hà Nội'));
  const [budget, setBudget] = useState('160000');
  const [customLogoName] = useState('logo_aurora_vector.pdf');
  const [customRequirements, setCustomRequirements] = useState(
    'In logo ép kim mặt trước hộp và trên phong bì thiệt, tặng kèm túi giấy quai lụa đỏ.'
  );
  const [customTypes, setCustomTypes] = useState<CustomType[]>(['BAG', 'CARD']);
  const [crustPreference, setCrustPreference] = useState('Bánh nướng truyền thống');
  const [fillingPreference, setFillingPreference] = useState('Thập cẩm bát bửu, Hạt sen trà xanh');
  const [fieldErrors, setFieldErrors] = useState<QuoteFormErrors>({});

  const provinceOptions = useMemo(
    () => PROVINCE_ITEMS.map((p) => ({ value: p.code, label: p.name })),
    []
  );

  function toggleCustomType(type: CustomType) {
    setCustomTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  /**
   * Xoá lỗi của một trường khi người dùng sửa lại (giống login form).
   */
  function clearError(field: keyof QuoteFormErrors) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  /**
   * Kiểm tra dữ liệu form phía client trước khi gọi API (FR-16).
   *
   * Trước đây form gửi thẳng lên API: một yêu cầu thiếu số lượng hoặc thiếu
   * địa chỉ vẫn tạo ra một yêu cầu rác ở phía server. Giờ form chặn ở client
   * và báo lỗi ngay cạnh ô nhập.
   */
  function validate(): QuoteFormErrors {
    const next: QuoteFormErrors = {};

    const quantityNum = parseInt(quantity, 10);
    if (!quantity.trim() || Number.isNaN(quantityNum)) {
      next.quantity = 'Số lượng hộp cần đặt không được để trống';
    } else if (quantityNum < 20) {
      next.quantity = 'Số lượng tối thiểu từ 20 hộp để các xưởng nhận báo giá sỉ';
    }

    if (!deliveryDeadline.trim()) {
      next.deliveryDeadline = 'Hạn giao hàng mong muốn không được để trống';
    }

    if (!recipientName.trim()) {
      next.recipientName = 'Người nhận không được để trống';
    }

    const phoneErr = validators.phoneVN(recipientPhone);
    if (phoneErr) {
      next.recipientPhone = phoneErr;
    }

    if (!deliveryAddress.trim()) {
      next.deliveryAddress = 'Địa chỉ nhận hàng chi tiết không được để trống';
    }

    return next;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isNfcVerified) {
      toast.warning(
        'Bạn cần xác minh danh tính bằng CCCD gắn chip (NFC) trước khi gửi yêu cầu báo giá.'
      );
      navigate(routes.account.verify, { state: { returnUrl: routes.base.quoteRequestNew } });
      return;
    }

    const validation = validate();
    setFieldErrors(validation);
    if (Object.keys(validation).length > 0) {
      return;
    }

    run(async () => {
      // FR-16: `POST /api/quote-requests` — the server needs the delivery address
      // as a nested object and the 2-digit `provinceCode` (BR-30).
      const created = await createQuoteRequest({
        type: 'OPEN',
        quantity: parseInt(quantity, 10) || 100,
        budget: budget ? parseInt(budget, 10) : undefined,
        customTypes: customTypes.length > 0 ? customTypes : undefined,
        customSpec: [customRequirements, `Vỏ: ${crustPreference}`, `Nhân: ${fillingPreference}`]
          .filter(Boolean)
          .join(' | '),
        deliveryDeadline,
        delivery: {
          recipientName,
          recipientPhone,
          provinceCode,
          addressDetail: deliveryAddress,
        },
      });
      toast.success('Đã gửi yêu cầu báo giá tới các xưởng.');
      navigate(routes.account.request(created.id));
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>TẠO YÊU CẦU BÁO GIÁ MỞ (M3.1, FLOW 2, FR-16)</div>
        <h1 className={styles.title}>Gửi Yêu Cầu Đặt Bánh Cho Nhiều Xưởng</h1>
        <p className={styles.lead}>
          Yêu cầu sẽ được gửi tới các xưởng bánh và tiệm bánh đạt chuẩn trên hệ thống để gửi bảng
          báo giá cạnh tranh.
        </p>
      </div>

      {/* Cảnh báo cổng NFC (M6.4) */}
      {!isNfcVerified && <NfcVerifyNotice />}

      {/* `noValidate`: để validate phía client của form chạy trước, thay vì để
          trình duyệt chặn submit bằng thông báo rợp không kèm `role="alert"`. */}
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <QuoteRequestBasicsCard
          quantity={quantity}
          onQuantityChange={(value) => {
            setQuantity(value);
            clearError('quantity');
          }}
          deliveryDeadline={deliveryDeadline}
          onDeliveryDeadlineChange={(value) => {
            setDeliveryDeadline(value);
            clearError('deliveryDeadline');
          }}
          budget={budget}
          onBudgetChange={setBudget}
          errors={fieldErrors}
        />

        <QuoteRequestDeliveryCard
          recipientName={recipientName}
          onRecipientNameChange={(value) => {
            setRecipientName(value);
            clearError('recipientName');
          }}
          recipientPhone={recipientPhone}
          onRecipientPhoneChange={(value) => {
            setRecipientPhone(value);
            clearError('recipientPhone');
          }}
          deliveryAddress={deliveryAddress}
          onDeliveryAddressChange={(value) => {
            setDeliveryAddress(value);
            clearError('deliveryAddress');
          }}
          provinceCode={provinceCode}
          onProvinceCodeChange={setProvinceCode}
          provinceOptions={provinceOptions}
          errors={fieldErrors}
        />

        <QuoteRequestPackagingCard
          customLogoName={customLogoName}
          customTypes={customTypes}
          onToggleCustomType={toggleCustomType}
          customRequirements={customRequirements}
          onCustomRequirementsChange={setCustomRequirements}
        />

        <QuoteRequestFlavorCard
          crustPreference={crustPreference}
          onCrustPreferenceChange={setCrustPreference}
          fillingPreference={fillingPreference}
          onFillingPreferenceChange={setFillingPreference}
        />

        {error && (
          <p className={styles.errorText} role="alert">
            {error}
          </p>
        )}

        <div className={styles.submitRow}>
          <ButtonLink to={routes.base.bulk} variant="secondary">
            Hủy &amp; Quay lại
          </ButtonLink>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            iconRight={busy ? undefined : 'arrowRight'}
            disabled={busy}
          >
            {busy ? 'Đang gửi yêu cầu báo giá...' : 'Gửi yêu cầu báo giá cho các xưởng'}
          </Button>
        </div>
      </form>
    </div>
  );
}

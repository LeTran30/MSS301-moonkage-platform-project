import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes, PROVINCE_ITEMS } from '@/shared/config';
import { Button, ButtonLink, toast } from '@/shared/ui';
import { focusFirstInvalidField, useAction } from '@/shared/lib';
import { useCurrentUser } from '@/entities/user';
import type { CustomType } from '@/entities/request';
import {
  NfcVerifyNotice,
  OPEN_REQUEST_MIN_QUANTITY,
  QuoteRequestBasicsCard,
  QuoteRequestDeliveryCard,
  QuoteRequestFlavorCard,
  QuoteRequestPackagingCard,
  joinCustomSpec,
  useCreateQuoteRequest,
  validateQuoteForm,
  type QuoteFormErrors,
} from '@/features/request-quote';
import styles from './NewQuoteRequestPage.module.css';
import { useDeliveryProvinceCode } from '@/entities/region';

const OPEN_MIN_HINT = `Tối thiểu từ ${OPEN_REQUEST_MIN_QUANTITY} hộp để các xưởng nhận báo giá sỉ`;
const BELOW_OPEN_MIN = `Số lượng tối thiểu từ ${OPEN_REQUEST_MIN_QUANTITY} hộp để các xưởng nhận báo giá sỉ`;

export function NewQuoteRequestPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { busy, run, error } = useAction();
  const createQuoteRequest = useCreateQuoteRequest();

  // FR-16 & Sitemap cond: Người mua đã xác minh NFC. Chưa xác minh -> M6.4 rồi quay lại
  const isNfcVerified = user.nfcStatus === 'VERIFIED';

  /*
   * Yêu cầu báo giá phải do người mua tự điền. Trước đây form điền sẵn 150
   * hộp, hạn giao 10/11/2026, ngân sách 160.000đ, địa chỉ "Tòa tháp Capital
   * Place", tên tệp logo "logo_aurora_vector.pdf" và yêu cầu in logo ép kim —
   * tức là một yêu cầu hoàn chỉnh có thể gửi đi mà không ai nhập gì, và tệp
   * logo được nói tới thì không hề tồn tại trên máy chủ.
   */
  const [quantity, setQuantity] = useState('');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [recipientName, setRecipientName] = useState(user.name);
  const [recipientPhone, setRecipientPhone] = useState(user.phone);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  // Bắt đầu từ tỉnh giao người mua đang chọn ở header; người mua đổi được ở bước địa chỉ.
  const deliveryProvinceCode = useDeliveryProvinceCode();
  const [provinceCode, setProvinceCode] = useState(() => deliveryProvinceCode);
  const [budget, setBudget] = useState('');
  const [customRequirements, setCustomRequirements] = useState('');
  const [customTypes, setCustomTypes] = useState<CustomType[]>([]);
  const [crustPreference, setCrustPreference] = useState('');
  const [fillingPreference, setFillingPreference] = useState('');
  const [fieldErrors, setFieldErrors] = useState<QuoteFormErrors>({});

  const provinceOptions = useMemo(
    () => PROVINCE_ITEMS.map((p) => ({ value: p.code, label: p.name })),
    [],
  );

  function toggleCustomType(type: CustomType) {
    setCustomTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  /**
   * Xoá lỗi của một trường khi người dùng sửa lại (giống login form).
   */
  function clearError(field: keyof QuoteFormErrors) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    /*
     * Kiểm tra trường bắt buộc **trước** khi kiểm tra NFC.
     *
     * Nếu kiểm tra NFC trước, người dùng thiếu thông tin bị đưa sang trang
     * xác minh mà không ai báo họ thiếu gì — và mất toàn bộ những gì đã điền.
     * Báo lỗi thiếu thông tin trước là hành trình tự nhiên hơn.
     */
    const validation = validateQuoteForm(
      { quantity, deliveryDeadline, recipientName, recipientPhone, deliveryAddress },
      OPEN_REQUEST_MIN_QUANTITY,
      BELOW_OPEN_MIN,
    );
    setFieldErrors(validation);
    if (Object.keys(validation).length > 0) {
      focusFirstInvalidField(e.currentTarget);
      return;
    }

    if (!isNfcVerified) {
      toast.warning(
        'Bạn cần xác minh danh tính bằng CCCD gắn chip (NFC) trước khi gửi yêu cầu báo giá.',
      );
      navigate(routes.account.verify, {
        state: { returnUrl: routes.base.quoteRequestNew },
      });
      return;
    }

    run(async () => {
      // FR-16: `POST /api/quote-requests` — the server needs the delivery address
      // as a nested object and the 2-digit `provinceCode` (BR-30).
      const created = await createQuoteRequest({
        type: 'OPEN',
        quantity: parseInt(quantity, 10),
        budget: budget ? parseInt(budget, 10) : undefined,
        customTypes: customTypes.length > 0 ? customTypes : undefined,
        customSpec: joinCustomSpec(customRequirements, crustPreference, fillingPreference),
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
        <div className={styles.eyebrow}>TẠO YÊU CẦU BÁO GIÁ MỞ</div>
        <h1 className={styles.title}>Gửi Yêu Cầu Đặt Bánh Cho Nhiều Xưởng</h1>
        <p className={styles.lead}>
          Yêu cầu sẽ được gửi tới các xưởng bánh và tiệm bánh đạt chuẩn trên hệ thống để gửi bảng
          báo giá cạnh tranh.
        </p>
      </div>

      {/* Cảnh báo cổng NFC */}
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
          minQuantity={OPEN_REQUEST_MIN_QUANTITY}
          quantityHint={OPEN_MIN_HINT}
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

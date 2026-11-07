import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { routes, PROVINCE_ITEMS } from '@/shared/config';
import { AsyncState, Button, ButtonLink, Card, EmptyState, Icon, toast } from '@/shared/ui';
import { focusFirstInvalidField, useAction } from '@/shared/lib';
import { useSupplier, type Vendor } from '@/entities/vendor';
import { useCurrentUser } from '@/entities/user';
import { toCustomTypes, type CustomType } from '@/entities/request';
import { useDeliveryProvinceCode } from '@/entities/region';
import {
  NfcVerifyNotice,
  QuoteRequestBasicsCard,
  QuoteRequestDeliveryCard,
  QuoteRequestFlavorCard,
  QuoteRequestPackagingCard,
  joinCustomSpec,
  useCreateQuoteRequest,
  validateQuoteForm,
  type QuoteFormErrors,
} from '@/features/request-quote';
import styles from './DirectQuoteRequestPage.module.css';

/** A Shop that has not set a minimum takes any quantity. */
const NO_VENDOR_MINIMUM = 1;

/**
 * M3.4: a quote request sent to one Shop only (FR-15, `type = DIRECT`).
 *
 * It is the open request form of M3.1 with the Shop fixed, so the buyer fills the same cards and sees the same
 * errors. Two rules come from the Shop instead of the platform: its minimum quantity (AC-15.2) and the custom work it
 * makes (AC-15.4). The server checks both again.
 */
export function DirectQuoteRequestPage() {
  const { id } = useParams<{ id: string }>();
  const asyncVendor = useSupplier(id || null);

  return (
    <div className={styles.container}>
      <AsyncState
        state={asyncVendor}
        onRetry={asyncVendor.reload}
        loadingMessage="Đang tải thông tin đơn vị..."
      >
        {(vendor) =>
          vendor ? (
            <DirectQuoteRequestForm vendor={vendor} />
          ) : (
            <EmptyState
              title="Đơn vị này không nhận đặt hàng"
              description="Đơn vị không tồn tại hoặc đang tạm ngừng nhận đặt hàng số lượng lớn."
              action={
                <ButtonLink to={routes.base.vendors} variant="primary">
                  Về danh sách đơn vị
                </ButtonLink>
              }
            />
          )
        }
      </AsyncState>
    </div>
  );
}

function DirectQuoteRequestForm({ vendor }: { vendor: Vendor }) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { busy, run, error } = useAction();
  const createQuoteRequest = useCreateQuoteRequest();

  // Người bán không gửi yêu cầu cho chính Shop của mình (BR-22).
  const isOwner = Boolean(user.vendorId && user.vendorId === vendor.id);
  const isNfcVerified = user.nfcStatus === 'VERIFIED';

  const minQuantity = vendor.bulkMinQuantity ?? NO_VENDOR_MINIMUM;
  const quantityHint = vendor.bulkMinQuantity
    ? `Tối thiểu từ ${vendor.bulkMinQuantity} hộp theo quy định của đơn vị`
    : 'Đơn vị chưa khai báo số lượng tối thiểu';
  const availableTypes = useMemo(
    () => toCustomTypes(vendor.supportedCustomOptions),
    [vendor.supportedCustomOptions],
  );

  const [quantity, setQuantity] = useState('');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [budget, setBudget] = useState('');
  const [recipientName, setRecipientName] = useState(user.name);
  const [recipientPhone, setRecipientPhone] = useState(user.phone);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  // Bắt đầu từ tỉnh giao người mua đang chọn ở header; người mua đổi được ở bước địa chỉ.
  const deliveryProvinceCode = useDeliveryProvinceCode();
  const [provinceCode, setProvinceCode] = useState(() => deliveryProvinceCode);
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

  function clearError(field: keyof QuoteFormErrors) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Báo thiếu thông tin trước, rồi mới đưa sang xác minh NFC: người mua không mất những gì đã điền.
    const validation = validateQuoteForm(
      { quantity, deliveryDeadline, recipientName, recipientPhone, deliveryAddress },
      minQuantity,
      `Đơn vị này nhận đặt từ ${minQuantity} hộp trở lên`,
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
        state: { returnUrl: routes.base.vendorRequest(vendor.id) },
      });
      return;
    }

    run(async () => {
      // `POST /api/quote-requests` với `type = DIRECT` và đơn vị được chọn.
      const created = await createQuoteRequest({
        type: 'DIRECT',
        targetVendorId: vendor.id,
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
      toast.success(`Đã gửi yêu cầu báo giá riêng tới ${vendor.name}.`);
      navigate(routes.account.request(created.id));
    });
  }

  if (isOwner) {
    return (
      <Card padding="lg" tone="gold" className={styles.ownerCard}>
        <Icon name="alert" size={32} />
        <h2>Bạn là chủ của đơn vị này</h2>
        <p>Hệ thống không cho phép người bán tự gửi yêu cầu báo giá cho chính mình.</p>
        <ButtonLink to={routes.vendor.overview} variant="primary">
          Về Kênh người bán
        </ButtonLink>
      </Card>
    );
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.eyebrow}>GỬI YÊU CẦU TRỰC TIẾP</div>
        <h1 className={styles.title}>Gửi yêu cầu đặt hàng riêng cho {vendor.name}</h1>
        <p className={styles.lead}>
          Chỉ đơn vị này nhận được yêu cầu. Đơn vị gửi lại báo giá, bạn xem và chấp nhận trong mục Yêu cầu báo
          giá của tài khoản.
          {vendor.bulkLeadTimeDays
            ? ` Thời gian chuẩn bị của đơn vị: ${vendor.bulkLeadTimeDays} ngày.`
            : ''}
        </p>
      </div>

      {!isNfcVerified && <NfcVerifyNotice />}

      {/* `noValidate`: lỗi hiện ngay dưới ô nhập, thay cho bong bóng của trình duyệt. */}
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
          minQuantity={minQuantity}
          quantityHint={quantityHint}
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
          availableTypes={availableTypes}
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

        <div className={styles.actions}>
          <ButtonLink to={routes.base.vendor(vendor.id)} variant="secondary">
            Quay lại hồ sơ đơn vị
          </ButtonLink>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            iconRight={busy ? undefined : 'arrowRight'}
            disabled={busy}
          >
            {busy ? 'Đang gửi yêu cầu báo giá...' : 'Gửi yêu cầu báo giá cho đơn vị'}
          </Button>
        </div>
      </form>
    </>
  );
}

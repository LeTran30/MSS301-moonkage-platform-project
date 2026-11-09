import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes, DEFAULT_PROVINCE_CODE } from '@/shared/config';
import { ApiError } from '@/shared/api';
import { Card, toast } from '@/shared/ui';
import { useAction, validators } from '@/shared/lib';
import { useCurrentUser } from '@/entities/user';
import { OWNER_DOCUMENT_KINDS, type VendorDocumentKind } from '@/entities/vendor';
import {
  useRegisterVendor,
  VendorBusinessTypeStep,
  VendorCompanyInfoStep,
  VendorRegisterSteps,
  VendorReviewStep,
  VendorSellingModeStep,
  toEntityType,
  toSupplySource,
  type VendorRegistrationForm,
} from '@/features/register-vendor';
import styles from './SellRegisterPage.module.css';

/** Ô của form và bước chứa nó, ứng với từng trường lỗi máy chủ trả về (FR-26). */
type FormFieldKey = keyof VendorRegistrationForm | VendorDocumentKind;

const SERVER_FIELDS: Record<string, { field: FormFieldKey; step: number }> = {
  entityType: { field: 'businessType', step: 1 },
  businessName: { field: 'legalName', step: 2 },
  taxCode: { field: 'taxCode', step: 2 },
  address: { field: 'address', step: 2 },
  provinceCode: { field: 'provinceCode', step: 2 },
  representativeName: { field: 'representativeName', step: 2 },
  representativeIdNumber: { field: 'idCardNumber', step: 2 },
  bankName: { field: 'bankName', step: 2 },
  bankAccountNumber: { field: 'bankAccountNumber', step: 2 },
  bankAccountHolder: { field: 'bankAccountHolder', step: 2 },
  documents: { field: 'BUSINESS_LICENSE', step: 3 },
};

/** Họ tên trên CCCD: chữ cái không dấu và khoảng trắng (như máy chủ kiểm, VENDOR_102). */
const UNACCENTED_NAME = /^[A-Za-z ]+$/;
/** Số định danh: đúng 12 chữ số (VENDOR_103). */
const ID_NUMBER = /^\d{12}$/;

export function SellRegisterPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { busy, run, error, setError } = useAction();
  const registerVendor = useRegisterVendor();

  // BR-33, M7.1: Form khai hồ sơ người bán nhiều bước:
  // Bước: loại hình (HKD/DNTN) -> đơn vị -> chủ hộ -> giấy tờ -> nguồn hàng, cách bán -> xem lại
  const [step, setStep] = useState<number>(1);
  /** Lỗi validate theo tên trường, để mỗi ô nhập tự hiện thông báo. */
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormFieldKey, string>>>({});

  const [form, setForm] = useState<VendorRegistrationForm>(() => ({
    businessType: 'HKD',
    /*
     * Chỉ những trường mà máy chủ / hồ sơ tài khoản đã có mới được điền sẵn.
     * Trước đây form tự điền tên shop, MST, CCCD, số tài khoản ngân hàng và
     * địa chỉ giả — người dùng có thể submit nguyên xi hồ sơ bịa mà không
     * hề biết. Nay mọi trường phải do người dùng tự nhập.
     */
    legalName: '',
    taxCode: '',
    // Họ tên và số CCCD phải khớp thẻ đã xác minh NFC: tên tài khoản có dấu,
    // còn số đã che thì máy chủ không đối chiếu được, nên để người bán tự nhập.
    representativeName: '',
    idCardNumber: '',
    phone: user.phone,
    address: '',
    sellingMode: 'BOTH',
    sourceType: 'Tự sản xuất',
    /*
     * Tỉnh mặc định của sàn (`DEFAULT_PROVINCE_CODE`), không phải dữ liệu ảo:
     * người bán chọn tỉnh thật ở bước 2.
     */
    provinceCode: DEFAULT_PROVINCE_CODE,
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: user.name,
    documents: {},
  }));

  /** Cập nhật một phần form, giữ nguyên các trường còn lại. */
  const patchForm = useCallback((patch: Partial<VendorRegistrationForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    // Sửa một ô thì lỗi của ô đó biến mất, để thông báo không bị lỗi thời.
    const touched: FormFieldKey[] = Object.keys(patch) as (keyof VendorRegistrationForm)[];
    if (patch.documents) touched.push(...(Object.keys(patch.documents) as VendorDocumentKind[]));
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const key of touched) delete next[key];
      return next;
    });
    setError(null);
  }, [setError]);

  const validateStep2 = useCallback(() => {
    const legalErr = validators.required(form.legalName);
    const taxErr = validators.taxCode(form.taxCode);
    const phoneErr = validators.phoneVN(form.phone);
    const nameErr = UNACCENTED_NAME.test(form.representativeName.trim())
      ? null
      : 'Viết không dấu, chỉ gồm chữ cái và khoảng trắng.';
    const idErr = ID_NUMBER.test(form.idCardNumber.trim()) ? null : 'Số CCCD phải gồm đúng 12 chữ số.';
    const bankErr = validators.required(form.bankAccountNumber);

    setFieldErrors({
      legalName: legalErr ?? undefined,
      taxCode: taxErr ?? undefined,
      phone: phoneErr ?? undefined,
      representativeName: nameErr ?? undefined,
      idCardNumber: idErr ?? undefined,
      bankAccountNumber: bankErr ?? undefined,
    });

    if (legalErr) {
      toast.error(`Tên ĐKKD: ${legalErr}`);
      return false;
    }
    if (taxErr) {
      toast.error(`Mã số thuế: ${taxErr}`);
      return false;
    }
    if (phoneErr) {
      toast.error(`Số điện thoại: ${phoneErr}`);
      return false;
    }
    if (nameErr || idErr || bankErr) {
      toast.error('Vui lòng sửa các ô đang báo lỗi.');
      return false;
    }
    return true;
  }, [
    form.legalName,
    form.taxCode,
    form.phone,
    form.representativeName,
    form.idCardNumber,
    form.bankAccountNumber,
  ]);

  /** AC-26.1: cả hai giấy tờ đều phải có trước khi xem lại. */
  const validateStep3 = useCallback(() => {
    const missing = OWNER_DOCUMENT_KINDS.filter((kind) => !form.documents[kind]);
    setFieldErrors(
      Object.fromEntries(missing.map((kind) => [kind, 'Vui lòng tải lên giấy tờ này.'])),
    );
    return missing.length === 0;
  }, [form.documents]);

  /** Lỗi theo ô từ máy chủ: gắn vào ô đó và đưa người bán về bước chứa nó. */
  const showServerFieldErrors = useCallback((e: unknown) => {
    if (!(e instanceof ApiError) || !e.errors?.length) return;
    const next: Partial<Record<FormFieldKey, string>> = {};
    let firstStep: number | null = null;
    for (const { field, message } of e.errors) {
      const target = SERVER_FIELDS[field];
      if (!target) continue;
      next[target.field] = message;
      firstStep = firstStep === null ? target.step : Math.min(firstStep, target.step);
    }
    setFieldErrors(next);
    if (firstStep !== null) setStep(firstStep);
  }, []);

  // Điều kiện kiểm tra NFC trước khi nộp
  const isNfcVerified = user.nfcStatus === 'VERIFIED';

  function handleCompleteRegistration() {
    if (!isNfcVerified) {
      toast.warning('Bạn cần hoàn tất bước xác minh NFC CCCD để nộp hồ sơ đăng ký người bán.');
      return;
    }

    void run(async () => {
      // FR-26: `POST /api/vendors` — `SubmitVendorRequest`. `entityType` is
      // HOUSEHOLD_BUSINESS / SOLE_PROPRIETORSHIP (BR-33); the documents carry
      // the `tempKey` of the files uploaded at step 3.
      const submitted = registerVendor({
        businessName: form.legalName,
        entityType: toEntityType(form.businessType),
        taxCode: form.taxCode,
        address: form.address,
        provinceCode: form.provinceCode,
        representativeName: form.representativeName,
        representativeIdNumber: form.idCardNumber,
        supplySource: toSupplySource(form.sourceType),
        sellsShop: form.sellingMode !== 'CUSTOM_ORDER',
        acceptsOrders: form.sellingMode !== 'RETAIL_SHOP',
        bankName: form.bankName,
        bankAccountNumber: form.bankAccountNumber,
        bankAccountHolder: form.bankAccountHolder,
        documents: OWNER_DOCUMENT_KINDS.flatMap((kind) => {
          const document = form.documents[kind];
          return document ? [{ kind, objectKey: document.tempKey }] : [];
        }),
      });
      // A field the server refuses goes back to its own input and step; the
      // message also stays at step 4 through `run`.
      await submitted.catch((e: unknown) => {
        showServerFieldErrors(e);
        throw e;
      });

      // Chuyển tới B1.0: Kênh bán hàng (Trạng thái đang chờ duyệt hồ sơ)
      toast.success('Hồ sơ đăng ký người bán đã được nộp! Đội vận hành sẽ đối chiếu và phê duyệt.');
      navigate(routes.vendor.overview);
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Khai hồ sơ pháp lý đơn vị kinh doanh</h1>
        <p className={styles.lead}>
          Hồ sơ chỉ áp dụng cho Hộ kinh doanh cá thể và Doanh nghiệp tư nhân. Doanh nghiệp lớn vui
          lòng liên hệ đội vận hành sàn.
        </p>
      </div>

      {/* Stepper Wizard */}
      <VendorRegisterSteps step={step} />

      <Card padding="lg" className={styles.formCard}>
        {/* Bước 1: Loại hình */}
        {step === 1 && (
          <VendorBusinessTypeStep
            value={form.businessType}
            onChange={(businessType) => patchForm({ businessType })}
            onNext={() => setStep(2)}
          />
        )}

        {/* Bước 2: Thông tin đơn vị & đại diện */}
        {step === 2 && (
          <VendorCompanyInfoStep
            form={form}
            errors={fieldErrors}
            onChange={patchForm}
            onBack={() => setStep(1)}
            onNext={() => {
              if (validateStep2()) setStep(3);
            }}
          />
        )}

        {/* Bước 3: Nguồn hàng & Cách bán */}
        {step === 3 && (
          <VendorSellingModeStep
            form={form}
            errors={fieldErrors}
            onChange={patchForm}
            onBack={() => setStep(2)}
            onNext={() => {
              if (validateStep3()) setStep(4);
            }}
          />
        )}

        {/* Bước 4: Xem lại & Nộp hồ sơ */}
        {step === 4 && (
          <VendorReviewStep
            form={form}
            isNfcVerified={isNfcVerified}
            busy={busy}
            error={error}
            onBack={() => setStep(3)}
            onSubmit={handleCompleteRegistration}
          />
        )}
      </Card>
    </div>
  );
}

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes, provinceCodeOf, provinceNameOf, isDemoMode } from '@/shared/config';
import { generateEntityId } from '@/shared/utils';
import { Card, toast } from '@/shared/ui';
import { useAction, validators } from '@/shared/lib';
import { useCurrentUser } from '@/entities/user';
import { vendorStore, type Vendor } from '@/entities/vendor';
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

export function SellRegisterPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { busy, run } = useAction();
  const registerVendor = useRegisterVendor();

  // BR-33, M7.1: Form khai hồ sơ người bán nhiều bước:
  // Bước: loại hình (HKD/DNTN) -> đơn vị -> chủ hộ -> giấy tờ -> nguồn hàng, cách bán -> xem lại
  const [step, setStep] = useState<number>(1);
  /** Lỗi validate theo tên trường, để mỗi ô nhập tự hiện thông báo. */
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof VendorRegistrationForm, string>>
  >({});

  const [form, setForm] = useState<VendorRegistrationForm>(() => ({
    businessType: 'HKD',
    shopName: 'Tiệm Bánh Thủ Công Hương Xưa',
    legalName: 'Hộ Kinh Doanh Bánh Thủ Công Hương Xưa',
    taxCode: '0109988112',
    representativeName: user.name,
    idCardNumber: user.idCardNumberMasked || '079203009988',
    phone: user.phone,
    address: 'Phố Cổ, Quận Hoàn Kiếm, Hà Nội',
    sellingMode: 'BOTH',
    sourceType: 'Tự sản xuất',
    provinceCode: provinceCodeOf('Hà Nội'),
    bankName: 'MB Bank',
    bankAccountNumber: '0123456789',
    bankAccountHolder: user.name,
    businessLicenseKey: '',
    foodSafetyKey: '',
  }));

  /** Cập nhật một phần form, giữ nguyên các trường còn lại. */
  const patchForm = useCallback((patch: Partial<VendorRegistrationForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    // Sửa một ô thì lỗi của ô đó biến mất, để thông báo không bị lỗi thời.
    const touched = Object.keys(patch) as (keyof VendorRegistrationForm)[];
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const key of touched) delete next[key];
      return next;
    });
  }, []);

  const validateStep2 = useCallback(() => {
    const shopErr = validators.required(form.shopName);
    const legalErr = validators.required(form.legalName);
    const taxErr = validators.taxCode(form.taxCode);
    const phoneErr = validators.phoneVN(form.phone);

    setFieldErrors({
      shopName: shopErr ?? undefined,
      legalName: legalErr ?? undefined,
      taxCode: taxErr ?? undefined,
      phone: phoneErr ?? undefined,
    });

    if (shopErr) {
      toast.error(`Tên shop: ${shopErr}`);
      return false;
    }
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
    return true;
  }, [form.shopName, form.legalName, form.taxCode, form.phone]);

  // Điều kiện kiểm tra NFC trước khi nộp
  const isNfcVerified = user.nfcStatus === 'VERIFIED';

  function handleCompleteRegistration() {
    if (!isNfcVerified) {
      toast.warning('Bạn cần hoàn tất bước xác minh NFC CCCD để nộp hồ sơ đăng ký người bán.');
      return;
    }

    run(async () => {
      // FR-26: `POST /api/vendors` — `SubmitVendorRequest`. `entityType` is
      // HOUSEHOLD_BUSINESS / SOLE_PROPRIETORSHIP (BR-33); the documents carry
      // the `objectKey` of the files uploaded first.
      await registerVendor({
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
        documents: [
          ...(form.businessLicenseKey
            ? [{ kind: 'BUSINESS_LICENSE' as const, objectKey: form.businessLicenseKey }]
            : []),
          ...(form.foodSafetyKey
            ? [{ kind: 'FOOD_SAFETY' as const, objectKey: form.foodSafetyKey }]
            : []),
        ],
      });

      // Chỉ trong chế độ demo mới giữ bản ghi cục bộ; ở chế độ API thật,
      // màn hình đọc lại từ `GET /api/vendors` sau khi nộp hồ sơ.
      if (isDemoMode()) {
        const newVendorId = generateEntityId('ven');
        const newVendor: Vendor = {
          id: newVendorId,
          name: form.shopName,
          legalName: form.legalName,
          businessType: form.businessType,
          taxCode: form.taxCode,
          representativeName: form.representativeName,
          idCardNumberMasked: form.idCardNumber,
          address: form.address,
          province: provinceNameOf(form.provinceCode) || 'Hà Nội',
          phone: form.phone,
          email: user.email,
          sellingMode: form.sellingMode,
          sourceType: form.sourceType,
          status: 'PENDING', // Đang chờ quản trị duyệt (FR-27)
          hasOpeningFeePaid: false, // Chưa nộp phí mở bán 200.000đ (FR-53)
          rating: 5.0,
          reviewCount: 0,
          introduction: 'Bánh trung thu truyền thống chuẩn hương vị phố cổ.',
          deliveryProvinces: [provinceNameOf(form.provinceCode) || 'Hà Nội'],
        };

        vendorStore.set((prev) => [newVendor, ...prev]);
      }

      // Chuyển tới B1.0: Kênh bán hàng (Trạng thái đang chờ duyệt hồ sơ)
      toast.success('Hồ sơ đăng ký người bán đã được nộp! Đội vận hành sẽ đối chiếu và phê duyệt.');
      navigate(routes.vendor.overview);
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>ĐĂNG KÝ BÁN HÀNG TRÊN MOONKAGE (M7.1, FLOW 4, FR-26)</div>
        <h1 className={styles.title}>Khai Hồ Sơ Pháp Lý Đơn Vị Kinh Doanh</h1>
        <p className={styles.lead}>
          Hồ sơ chỉ áp dụng cho Hộ kinh doanh cá thể và Doanh nghiệp tư nhân (BR-33). Doanh nghiệp
          lớn vui lòng liên hệ đội vận hành sàn.
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

        {/* Bước 3: Nguồn hàng & Cách bán (BR-21, FR-26) */}
        {step === 3 && (
          <VendorSellingModeStep
            form={form}
            onChange={patchForm}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {/* Bước 4: Xem lại & Nộp hồ sơ */}
        {step === 4 && (
          <VendorReviewStep
            form={form}
            isNfcVerified={isNfcVerified}
            busy={busy}
            onBack={() => setStep(3)}
            onSubmit={handleCompleteRegistration}
          />
        )}
      </Card>
    </div>
  );
}

import styles from './AddressFormPage.module.css';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { routes, PROVINCE_ITEMS, DEFAULT_PROVINCE_CODE } from '@/shared/config';
import { Button, Card, Checkbox, Input, Breadcrumbs, Select, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { validators } from '@/shared/lib';
import { addressApi } from '@/entities/address';
import { useCreateAddress, useUpdateAddress } from '@/features/edit-address';

/**
 * M6.3.1 — create or edit one delivery address (FR-03).
 *
 * The form writes to identity-service: `POST /api/addresses` to create and
 * `PUT /api/addresses/{addressId}` to replace. The backend replaces the whole
 * address, so every field of the form is sent every time.
 */
export function AddressFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'moi');

  const { busy, run } = useAction();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();

  const [label, setLabel] = useState('');
  const [recipient, setRecipient] = useState('');
  const [phone, setPhone] = useState('');
  // Tỉnh mặc định của sàn (`DEFAULT_PROVINCE_CODE`); người dùng chọn tỉnh thật.
  const [provinceCode, setProvinceCode] = useState(DEFAULT_PROVINCE_CODE);
  const [wardName, setWardName] = useState('');
  const [street, setStreet] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sửa địa chỉ: nạp địa chỉ đang sửa để điền sẵn form.
  useEffect(() => {
    if (!isEdit || !id) return;
    let current = true;
    void addressApi
      .list()
      .then((addresses) => {
        if (!current) return;
        const found = addresses.find((a) => a.id === id);
        if (!found) return;
        setLabel(found.label ?? '');
        setRecipient(found.recipientName);
        setPhone(found.recipientPhone);
        setProvinceCode(found.provinceCode);
        setWardName(found.wardName);
        setStreet(found.detail);
        setIsDefault(found.isDefault);
      })
      .catch(() => {
        /* danh sách lỗi thì để người dùng tự điền, không chặn form */
      });
    return () => {
      current = false;
    };
  }, [id, isEdit]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!recipient.trim()) next.recipient = 'Vui lòng nhập tên người nhận hàng.';
    if (validators.phoneVN(phone)) {
      next.phone = 'Số điện thoại không hợp lệ. Ví dụ: 0912345678.';
    }
    if (!provinceCode) next.provinceCode = 'Vui lòng chọn tỉnh / thành phố.';
    if (!wardName.trim()) next.wardName = 'Vui lòng nhập phường / xã.';
    if (!street.trim()) next.street = 'Vui lòng nhập số nhà, tên đường.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const provinceItem = PROVINCE_ITEMS.find((p) => p.code === provinceCode);
    const payload = {
      recipientName: recipient.trim(),
      recipientPhone: phone.trim(),
      provinceCode,
      provinceName: provinceItem?.name ?? '',
      wardName: wardName.trim(),
      detail: street.trim(),
      label: label.trim() || undefined,
      isDefault,
    };

    void run(async () => {
      if (isEdit && id) {
        await updateAddress(id, payload);
        toast.success('Đã cập nhật địa chỉ thành công!');
      } else {
        await createAddress(payload);
        toast.success('Đã thêm địa chỉ giao bánh mới!');
      }
      navigate(routes.account.addresses);
    });
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Tài khoản', to: routes.account.overview },
          { label: 'Sổ địa chỉ', to: routes.account.addresses },
          { label: isEdit ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới' },
        ]}
      />

      <div className={styles.header}>
        <h1 className={styles.title}>
          {isEdit ? 'Cập Nhật Địa Chỉ Nhận Hàng' : 'Thêm Địa Chỉ Nhận Hàng Mới'}
        </h1>
      </div>

      <Card padding="lg" className={styles.lead}>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div>
            <label className={styles.label} htmlFor="address-label">
              Nhãn gợi nhớ (Ví dụ: Nhà riêng, Văn phòng, Kho xưởng)
            </label>
            <Input
              id="address-label"
              type="text"
              placeholder="Văn phòng công ty"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className={styles.gridTwo}>
            <div>
              <label className={styles.label} htmlFor="address-recipient">
                Tên người nhận hàng *
              </label>
              <Input
                id="address-recipient"
                type="text"
                placeholder="Nguyễn Văn A"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                aria-invalid={Boolean(errors.recipient)}
                aria-describedby={errors.recipient ? 'err-recipient' : undefined}
              />
              {errors.recipient && (
                <p id="err-recipient" role="alert" className={styles.error}>
                  {errors.recipient}
                </p>
              )}
            </div>
            <div>
              <label className={styles.label} htmlFor="address-phone">
                Số điện thoại liên hệ *
              </label>
              <Input
                id="address-phone"
                type="tel"
                placeholder="0912 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'err-phone' : undefined}
              />
              {errors.phone && (
                <p id="err-phone" role="alert" className={styles.error}>
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          <div className={styles.gridTwo}>
            <div>
              <Select
                label="Tỉnh / Thành phố"
                required
                options={PROVINCE_ITEMS.map((p) => ({ value: p.code, label: p.officialName }))}
                value={provinceCode}
                onChange={(v) => setProvinceCode(v)}
                error={errors.provinceCode}
                placeholder="Chọn tỉnh / thành phố"
              />
            </div>
            <div>
              <label className={styles.label} htmlFor="address-ward">
                Phường / Xã *
              </label>
              <Input
                id="address-ward"
                type="text"
                placeholder="Phường Ba Đình"
                value={wardName}
                onChange={(e) => setWardName(e.target.value)}
                aria-invalid={Boolean(errors.wardName)}
                aria-describedby={errors.wardName ? 'err-ward' : undefined}
              />
              {errors.wardName && (
                <p id="err-ward" role="alert" className={styles.error}>
                  {errors.wardName}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className={styles.label} htmlFor="address-street">
              Số nhà, tên đường, tòa nhà *
            </label>
            <Input
              id="address-street"
              type="text"
              placeholder="Tầng 18, Tòa Capital Place, 29 Liễu Giai"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              aria-invalid={Boolean(errors.street)}
              aria-describedby={errors.street ? 'err-street' : undefined}
            />
            {errors.street && (
              <p id="err-street" role="alert" className={styles.error}>
                {errors.street}
              </p>
            )}
          </div>

          <label className={styles.checkboxRow}>
            <Checkbox
              inputClassName={styles.checkboxInput}
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            <span className={styles.checkboxLabel}>Đặt làm địa chỉ nhận hàng mặc định</span>
          </label>

          <div className={styles.actions}>
            <Button type="submit" variant="primary" loading={busy}>
              {isEdit ? 'Lưu Thay Đổi' : 'Thêm Địa Chỉ'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(routes.account.addresses)}>
              Hủy
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { routes } from '@/shared/config';
import { Button, ButtonLink, Card, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useCurrentUser } from '@/entities/user';
import type { VendorDetailDto, VendorDocumentKind } from '@/entities/vendor';
import { uploadFile } from '@/shared/api';
import { DOCUMENT_LABELS } from '../model/documentLabels';
import { useResubmitVendorProfile } from '../model/useVendorSettingsActions';
import { LegalBankFields } from './LegalBankFields';
import { LegalDocumentsField } from './LegalDocumentsField';
import { LegalIdentityFields } from './LegalIdentityFields';
import styles from './vendorSettingsUi.module.css';

interface LegalProfileFormProps {
  vendorId: string;
  detail: VendorDetailDto;
}

/**
 * B6.1 (FR-26, NFR-02) — the legal profile of the Shop.
 *
 * `GET /api/vendors/{vendorId}` reads it; `PUT /api/vendors/{vendorId}` sends it
 * back (AC-27.2, only while NEEDS_INFO or REJECTED). The documents keep their
 * current `objectKey`; a new file is uploaded first and its `tempKey` sent.
 */
export function LegalProfileForm({ vendorId, detail }: LegalProfileFormProps) {
  const user = useCurrentUser();
  const { busy, run } = useAction();
  const resubmitVendorProfile = useResubmitVendorProfile();

  // Khởi tạo form trực tiếp từ hồ sơ đã tải (không dùng effect để setState).
  const [businessName, setBusinessName] = useState(detail.businessName ?? '');
  const [taxCode, setTaxCode] = useState(detail.taxCode ?? '');
  const [address, setAddress] = useState(detail.address ?? '');
  const [provinceCode, setProvinceCode] = useState(detail.provinceCode ?? '');
  const [representativeName, setRepresentativeName] = useState(detail.representativeName ?? '');
  const [bankName, setBankName] = useState(detail.bankAccount?.bankName ?? '');
  const [bankAccountHolder, setBankAccountHolder] = useState(detail.bankAccount?.holder ?? '');
  const [supplySource, setSupplySource] = useState<'SELF_PRODUCED' | 'RESELL' | 'BOTH'>(
    detail.supplySource ?? 'SELF_PRODUCED'
  );
  const [entityType, setEntityType] = useState<'HOUSEHOLD_BUSINESS' | 'SOLE_PROPRIETORSHIP'>(
    detail.entityType ?? 'HOUSEHOLD_BUSINESS'
  );
  const [sellsShop] = useState(detail.sellsShop ?? true);
  const [acceptsOrders] = useState(detail.acceptsOrders ?? true);
  const [tempKeys, setTempKeys] = useState<Partial<Record<VendorDocumentKind, string>>>({});

  const documents = detail.documents ?? [];

  const handleUpload = (kind: VendorDocumentKind, file: File | undefined) => {
    if (!file) return;
    void run(async () => {
      const uploaded = await uploadFile('VENDOR', file);
      if (!uploaded) {
        toast.info('Chế độ demo: bỏ qua bước tải tệp lên.');
        return;
      }
      setTempKeys((prev) => ({ ...prev, [kind]: uploaded }));
      toast.success(`Đã tải lên ${DOCUMENT_LABELS[kind]}.`);
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      // AC-27.2: the whole profile again, with the documents that stay as they
      // are (their current `objectKey`) and the new ones (their `tempKey`).
      const payload: Array<{ kind: VendorDocumentKind; objectKey: string }> = [];

      for (const kind of ['BUSINESS_LICENSE', 'FOOD_SAFETY'] as const) {
        const uploaded = tempKeys[kind];
        if (uploaded) {
          payload.push({ kind, objectKey: uploaded });
          continue;
        }
        const current = documents.find((d) => d.kind === kind);
        // The backend only accepts a temp key or the key of a current document;
        // without either one the resubmission is refused (DOCUMENT_NOT_ACCEPTED).
        if (current) {
          payload.push({ kind, objectKey: current.id });
        }
      }

      if (payload.length === 0) {
        toast.error('Hồ sơ cần ít nhất một tài liệu (Giấy phép kinh doanh hoặc VSATTP).');
        return;
      }

      await resubmitVendorProfile(vendorId, {
        businessName,
        entityType,
        taxCode,
        address,
        provinceCode,
        representativeName,
        // The backend masks the ID number on read; it needs the full one to check
        // it against the identity card. The owner retypes it when needed.
        representativeIdNumber: user.idCardNumberMasked ?? '',
        supplySource,
        sellsShop,
        acceptsOrders,
        bankName,
        bankAccountNumber: detail.bankAccount?.maskedNumber ?? '',
        bankAccountHolder,
        documents: payload,
      });

      toast.success('Đã lưu thông tin hồ sơ pháp lý và chứng nhận VSATTP!');
    });
  };

  return (
    <Card padding="lg" className={styles.form}>
      <form onSubmit={handleSave} className={styles.stack}>
        <LegalIdentityFields
          businessName={businessName}
          onBusinessNameChange={setBusinessName}
          taxCode={taxCode}
          onTaxCodeChange={setTaxCode}
          entityType={entityType}
          onEntityTypeChange={setEntityType}
          address={address}
          onAddressChange={setAddress}
          provinceCode={provinceCode}
          onProvinceCodeChange={setProvinceCode}
          representativeName={representativeName}
          onRepresentativeNameChange={setRepresentativeName}
          supplySource={supplySource}
          onSupplySourceChange={setSupplySource}
        />

        <LegalBankFields
          bankName={bankName}
          onBankNameChange={setBankName}
          bankAccountHolder={bankAccountHolder}
          onBankAccountHolderChange={setBankAccountHolder}
        />

        <LegalDocumentsField documents={documents} tempKeys={tempKeys} onUpload={handleUpload} />

        <div className={styles.actions}>
          <Button type="submit" variant="primary" loading={busy}>
            Lưu Thông Tin Pháp Lý
          </Button>
          <ButtonLink to={routes.vendor.settings} variant="outline">
            Quay Lại Cài Đặt
          </ButtonLink>
        </div>
      </form>
    </Card>
  );
}

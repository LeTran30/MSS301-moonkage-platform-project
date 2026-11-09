import { useState } from 'react';
import { routes } from '@/shared/config';
import { Button, ButtonLink, Card, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import type { VendorDetailDto, VendorDocumentKind } from '@/entities/vendor';
import { DOCUMENT_LABELS, OWNER_DOCUMENT_KINDS, uploadVendorDocument } from '@/entities/vendor';
import { useResubmitVendorProfile } from '../model/useVendorSettingsActions';
import { LegalBankFields } from './LegalBankFields';
import { LegalDocumentsField } from './LegalDocumentsField';
import { LegalIdentityFields } from './LegalIdentityFields';
import styles from './vendorSettingsUi.module.css';

interface LegalProfileFormProps {
  vendorId: string;
  detail: VendorDetailDto;
  /** Gọi sau khi nộp lại thành công, để trang đọc lại trạng thái hồ sơ. */
  onSaved?: () => void;
}

/**
 * B6.1 (FR-26, NFR-02) — the legal profile of the Shop.
 *
 * `GET /api/vendors/{vendorId}` reads it; `PUT /api/vendors/{vendorId}` sends it
 * back (AC-27.2, only while NEEDS_INFO or REJECTED). Only the documents the
 * owner replaces are sent (their `tempKey`); every other kind stays on file.
 * The ID number and the bank account number come back masked, so the owner
 * types them in full again.
 */
export function LegalProfileForm({ vendorId, detail, onSaved }: LegalProfileFormProps) {
  const { busy, run, error } = useAction();
  const resubmitVendorProfile = useResubmitVendorProfile();

  // Khởi tạo form trực tiếp từ hồ sơ đã tải (không dùng effect để setState).
  const [businessName, setBusinessName] = useState(detail.businessName ?? '');
  const [taxCode, setTaxCode] = useState(detail.taxCode ?? '');
  const [address, setAddress] = useState(detail.address ?? '');
  const [provinceCode, setProvinceCode] = useState(detail.provinceCode ?? '');
  const [representativeName, setRepresentativeName] = useState(detail.representativeName ?? '');
  const [representativeIdNumber, setRepresentativeIdNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState(detail.bankAccount?.bankName ?? '');
  const [bankAccountHolder, setBankAccountHolder] = useState(detail.bankAccount?.holder ?? '');
  const [supplySource, setSupplySource] = useState<'SELF_PRODUCED' | 'RESELL' | 'BOTH'>(
    detail.supplySource ?? 'SELF_PRODUCED',
  );
  const [entityType, setEntityType] = useState<'HOUSEHOLD_BUSINESS' | 'SOLE_PROPRIETORSHIP'>(
    detail.entityType ?? 'HOUSEHOLD_BUSINESS',
  );
  const [sellsShop] = useState(detail.sellsShop ?? true);
  const [acceptsOrders] = useState(detail.acceptsOrders ?? true);
  const [tempKeys, setTempKeys] = useState<Partial<Record<VendorDocumentKind, string>>>({});

  const documents = detail.documents ?? [];

  const handleUpload = (kind: VendorDocumentKind, file: File | undefined) => {
    if (!file) return;
    void run(async () => {
      const uploaded = await uploadVendorDocument(file);
      setTempKeys((prev) => ({ ...prev, [kind]: uploaded }));
      toast.success(`Đã tải lên ${DOCUMENT_LABELS[kind]}.`);
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      // AC-27.2: the whole profile again; only the replaced documents are
      // sent, every other kind keeps the document on file.
      const replaced = OWNER_DOCUMENT_KINDS.flatMap((kind) => {
        const objectKey = tempKeys[kind];
        return objectKey ? [{ kind, objectKey }] : [];
      });

      await resubmitVendorProfile(vendorId, {
        businessName,
        entityType,
        taxCode,
        address,
        provinceCode,
        representativeName,
        // The backend masks the ID number on read; it needs the full one to check
        // it against the identity card (BR-27).
        representativeIdNumber: representativeIdNumber.trim(),
        supplySource,
        sellsShop,
        acceptsOrders,
        bankName,
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountHolder,
        documents: replaced,
      });

      toast.success('Đã nộp lại hồ sơ. Đội vận hành sẽ thẩm định lại.');
      setTempKeys({});
      onSaved?.();
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
          representativeIdNumber={representativeIdNumber}
          onRepresentativeIdNumberChange={setRepresentativeIdNumber}
          supplySource={supplySource}
          onSupplySourceChange={setSupplySource}
        />

        <LegalBankFields
          bankName={bankName}
          onBankNameChange={setBankName}
          bankAccountNumber={bankAccountNumber}
          onBankAccountNumberChange={setBankAccountNumber}
          maskedBankAccountNumber={detail.bankAccount?.maskedNumber}
          bankAccountHolder={bankAccountHolder}
          onBankAccountHolderChange={setBankAccountHolder}
        />

        <LegalDocumentsField documents={documents} tempKeys={tempKeys} onUpload={handleUpload} />

        {error && (
          <p role="alert" className={styles.formError}>
            {error}
          </p>
        )}

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

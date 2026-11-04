import { Input } from '@/shared/ui';
import styles from './vendorSettingsUi.module.css';

interface LegalBankFieldsProps {
  bankName: string;
  onBankNameChange: (value: string) => void;
  bankAccountHolder: string;
  onBankAccountHolderChange: (value: string) => void;
}

/** The settlement account of the legal profile (FR-26). */
export function LegalBankFields({
  bankName,
  onBankNameChange,
  bankAccountHolder,
  onBankAccountHolderChange,
}: LegalBankFieldsProps) {
  return (
    <div className={styles.gridTwo}>
      <div>
        <label className={styles.label}>Tên ngân hàng *</label>
        <Input
          type="text"
          value={bankName}
          onChange={(e) => onBankNameChange(e.target.value)}
          required
        />
      </div>
      <div>
        <label className={styles.label}>Chủ tài khoản *</label>
        <Input
          type="text"
          value={bankAccountHolder}
          onChange={(e) => onBankAccountHolderChange(e.target.value)}
          required
        />
      </div>
    </div>
  );
}

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
        <label className={styles.label} htmlFor="legal-bank-name">
          Tên ngân hàng *
        </label>
        <Input
          id="legal-bank-name"
          type="text"
          placeholder="Ví dụ: Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)"
          value={bankName}
          onChange={(e) => onBankNameChange(e.target.value)}
          required
        />
      </div>
      <div>
        <label className={styles.label} htmlFor="legal-bank-holder">
          Chủ tài khoản *
        </label>
        <Input
          id="legal-bank-holder"
          type="text"
          placeholder="Ví dụ: Công ty TNHH ABC"
          value={bankAccountHolder}
          onChange={(e) => onBankAccountHolderChange(e.target.value)}
          required
        />
      </div>
    </div>
  );
}

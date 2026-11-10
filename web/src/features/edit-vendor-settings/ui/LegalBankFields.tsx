import { Input } from '@/shared/ui';
import styles from './vendorSettingsUi.module.css';

interface LegalBankFieldsProps {
  bankName: string;
  onBankNameChange: (value: string) => void;
  /** Số tài khoản đầy đủ; máy chủ chỉ trả bản đã che (`maskedNumber`). */
  bankAccountNumber: string;
  onBankAccountNumberChange: (value: string) => void;
  maskedBankAccountNumber?: string;
  bankAccountHolder: string;
  onBankAccountHolderChange: (value: string) => void;
}

/** The settlement account of the legal profile (FR-26). */
export function LegalBankFields({
  bankName,
  onBankNameChange,
  bankAccountNumber,
  onBankAccountNumberChange,
  maskedBankAccountNumber,
  bankAccountHolder,
  onBankAccountHolderChange,
}: LegalBankFieldsProps) {
  return (
    <>
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
    <div>
      <label className={styles.label} htmlFor="legal-bank-account-number">
        Số tài khoản nhận tiền *
      </label>
      <Input
        id="legal-bank-account-number"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={bankAccountNumber}
        onChange={(e) => onBankAccountNumberChange(e.target.value)}
        hint={
          maskedBankAccountNumber
            ? `Nhập lại số đầy đủ (đang lưu: ${maskedBankAccountNumber})`
            : undefined
        }
        required
      />
    </div>
    </>
  );
}

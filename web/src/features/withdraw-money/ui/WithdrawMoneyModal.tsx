import { useState } from 'react';
import { Button, Input, Modal, Select, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { formatCurrency } from '@/shared/utils';
import { useBanks } from '@/entities/payment';
import { requestWithdrawal } from '../api/withdrawMoneyApi';
import { toAccountName } from '../model/accountName';
import styles from './WithdrawMoneyModal.module.css';

/** The smallest withdrawal (CreateWithdrawalRequest.MIN_AMOUNT). */
const MIN_AMOUNT = 10_000;

type Props = {
  open: boolean;
  balance: number;
  onClose: () => void;
  /** After the request was accepted: reload the wallet and the requests. */
  onDone: () => void;
};

/**
 * Rút tiền từ ví Moonkage về tài khoản ngân hàng (Q-01).
 *
 * Danh sách ngân hàng là danh sách VietQR. Tiền rời ví ngay khi gửi yêu cầu;
 * quản trị viên chuyển khoản rồi xác nhận, người mua nhận email.
 */
export function WithdrawMoneyModal({ open, balance, onClose, onDone }: Props) {
  const banks = useBanks({ enabled: open });
  const { busy, run } = useAction();
  const [bankBin, setBankBin] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): Record<string, string> {
    const found: Record<string, string> = {};
    const value = Number(amount);
    if (!bankBin) found.bank = 'Hãy chọn ngân hàng.';
    if (!/^\d{6,19}$/.test(accountNumber)) found.accountNumber = 'Số tài khoản gồm 6 đến 19 chữ số.';
    if (!accountName.trim()) found.accountName = 'Hãy nhập tên chủ tài khoản.';
    if (!Number.isInteger(value) || value < MIN_AMOUNT) {
      found.amount = `Số tiền rút tối thiểu ${formatCurrency(MIN_AMOUNT)}.`;
    } else if (value > balance) {
      found.amount = `Số dư hiện có ${formatCurrency(balance)}.`;
    }
    return found;
  }

  function handleSubmit() {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    void run(async () => {
      await requestWithdrawal({
        amount: Number(amount),
        bankBin,
        accountNumber,
        accountName: accountName.trim(),
      });
      toast.success('Đã gửi yêu cầu rút tiền. Bạn sẽ nhận email khi tiền được chuyển.');
      setAccountNumber('');
      setAmount('');
      onDone();
      onClose();
    });
  }

  const bankOptions =
    banks.kind === 'loaded'
      ? banks.data.map((b) => ({ value: b.bin, label: `${b.shortName} - ${b.name}` }))
      : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rút tiền về ngân hàng"
      description="Tiền được trừ khỏi ví ngay khi gửi yêu cầu. Moonkage chuyển khoản trong 1-2 ngày làm việc và báo cho bạn qua email."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" loading={busy} onClick={handleSubmit}>
            Gửi yêu cầu rút tiền
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <Select
          label="Ngân hàng"
          required
          placeholder={banks.kind === 'loading' ? 'Đang tải danh sách ngân hàng…' : 'Chọn ngân hàng'}
          options={bankOptions}
          value={bankBin}
          onChange={setBankBin}
          error={banks.kind === 'error' ? banks.message : errors.bank}
        />
        <Input
          label="Số tài khoản"
          required
          inputMode="numeric"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
          error={errors.accountNumber}
        />
        <Input
          label="Tên chủ tài khoản"
          required
          hint="Viết hoa không dấu, đúng như trên thẻ ngân hàng."
          value={accountName}
          onChange={(e) => setAccountName(toAccountName(e.target.value))}
          error={errors.accountName}
        />
        <Input
          label="Số tiền rút"
          required
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
          hint={`Số dư hiện có ${formatCurrency(balance)}`}
          error={errors.amount}
          actionRight={
            <Button variant="link" size="sm" onClick={() => setAmount(String(balance))}>
              Rút hết
            </Button>
          }
        />
      </div>
    </Modal>
  );
}

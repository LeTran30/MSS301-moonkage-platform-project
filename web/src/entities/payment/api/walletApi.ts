import { apiClient, GATEWAY, unwrap, unwrapList, unwrapPage } from '@/shared/api';

/** One line of `com.moonkage.payment.dto.response.WalletResponse.Entry`. */
export interface WalletEntryDto {
  id: string;
  kind: 'CREDIT' | 'DEBIT';
  /**
   * ORDER_REJECTED: a Shop refused a paid order (reference = orderId).
   * PAYMENT: a checkout paid from the wallet. REFUND: a refund of a wallet payment.
   * WITHDRAWAL / WITHDRAWAL_RETURNED: money sent to the bank, or given back when refused.
   */
  reason: 'ORDER_REJECTED' | 'PAYMENT' | 'REFUND' | 'WITHDRAWAL' | 'WITHDRAWAL_RETURNED';
  amount: number;
  referenceId: string;
  createdAt: string;
}

export interface WalletDto {
  balance: number;
  entries: WalletEntryDto[];
}

/** `com.moonkage.payment.dto.response.BankResponse`: a bank of the VietQR list. */
export interface BankDto {
  bin: string;
  shortName: string;
  name: string;
}

export type WithdrawalStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';

/** `com.moonkage.payment.dto.response.WithdrawalResponse`. */
export interface WithdrawalDto {
  id: string;
  accountId: string;
  amount: number;
  bankBin: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: WithdrawalStatus;
  rejectReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

/** `com.moonkage.payment.dto.response.WalletSummaryResponse` (admin). */
export interface WalletSummaryDto {
  totalBalance: number;
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
}

/**
 * The read side of the buyer's wallet (Q-01): money a Shop refused comes back
 * here, a checkout can be paid from it, and it can be sent to a bank account.
 */
export const walletApi = {
  async mine(): Promise<WalletDto> {
    const res = await apiClient.get<unknown>(`${GATEWAY.PAYMENT.WALLET_ME}?size=50`);
    const data = unwrap<{ balance: number; entries?: { content?: WalletEntryDto[] } }>(res);
    return { balance: data?.balance ?? 0, entries: data?.entries?.content ?? [] };
  },

  async banks(): Promise<BankDto[]> {
    return unwrapList<BankDto>(await apiClient.get<unknown>(GATEWAY.PAYMENT.WALLET_BANKS));
  },

  async myWithdrawals(): Promise<WithdrawalDto[]> {
    return unwrapList<WithdrawalDto>(await apiClient.get<unknown>(GATEWAY.PAYMENT.WALLET_MY_WITHDRAWALS));
  },

  /** Admin: the requests in one status, oldest first. */
  async withdrawals(status: WithdrawalStatus): Promise<WithdrawalDto[]> {
    const res = await apiClient.get<unknown>(`${GATEWAY.PAYMENT.WALLET_WITHDRAWALS}?status=${status}&size=100`);
    return unwrapPage<WithdrawalDto>(res);
  },

  /** Admin: what buyers hold and what is still to transfer. */
  async summary(): Promise<WalletSummaryDto | null> {
    return unwrap<WalletSummaryDto>(await apiClient.get<unknown>(GATEWAY.PAYMENT.WALLET_SUMMARY));
  },
};

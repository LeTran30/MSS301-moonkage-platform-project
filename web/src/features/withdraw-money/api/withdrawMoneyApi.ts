import { apiClient, GATEWAY, unwrapOrThrow } from '@/shared/api';
import type { WithdrawalDto } from '@/entities/payment';

/** Wire shape of `com.moonkage.payment.dto.request.CreateWithdrawalRequest`. */
export interface WithdrawPayload {
  amount: number;
  bankBin: string;
  accountNumber: string;
  /** Upper case without accents, as on the bank account. */
  accountName: string;
}

/**
 * The buyer sends wallet money to a bank account (Q-01). The money leaves the
 * wallet at once; an admin transfers it and the buyer is emailed.
 */
export async function requestWithdrawal(payload: WithdrawPayload): Promise<WithdrawalDto> {
  const res = await apiClient.post<unknown>(GATEWAY.PAYMENT.WALLET_MY_WITHDRAWALS, payload);
  return unwrapOrThrow<WithdrawalDto>(res);
}

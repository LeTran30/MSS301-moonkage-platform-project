import { apiClient, GATEWAY, unwrapOrThrow } from '@/shared/api';
import type { WithdrawalDto } from '@/entities/payment';

/**
 * The admin closes a withdrawal (Q-01): COMPLETED once the bank transfer is
 * done, or REJECTED with a reason the buyer reads (the money goes back to the
 * wallet). The buyer is emailed either way.
 */
export async function reviewWithdrawal(
  withdrawalId: string,
  decision: { status: 'COMPLETED' } | { status: 'REJECTED'; reason: string },
): Promise<WithdrawalDto> {
  const res = await apiClient.patch<unknown>(GATEWAY.PAYMENT.WALLET_WITHDRAWAL(withdrawalId), decision);
  return unwrapOrThrow<WithdrawalDto>(res);
}

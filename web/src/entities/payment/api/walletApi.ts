import { apiClient, GATEWAY, unwrap } from '@/shared/api';

/** One line of `com.moonkage.payment.dto.response.WalletResponse.Entry`. */
export interface WalletEntryDto {
  id: string;
  kind: 'CREDIT' | 'DEBIT';
  /** ORDER_REJECTED: a Shop refused a paid order (reference = orderId). PAYMENT: a checkout paid from the wallet. */
  reason: 'ORDER_REJECTED' | 'PAYMENT';
  amount: number;
  referenceId: string;
  createdAt: string;
}

export interface WalletDto {
  balance: number;
  entries: WalletEntryDto[];
}

/**
 * The buyer's wallet (Q-01): money a Shop refused comes back here, and a
 * checkout can be paid from it.
 */
export const walletApi = {
  async mine(): Promise<WalletDto> {
    const res = await apiClient.get<unknown>(`${GATEWAY.PAYMENT.WALLET_ME}?size=50`);
    const data = unwrap<{ balance: number; entries?: { content?: WalletEntryDto[] } }>(res);
    return { balance: data?.balance ?? 0, entries: data?.entries?.content ?? [] };
  },
};

import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { walletApi } from '../api/walletApi';

/** The logged-in buyer's balance and history (Q-01). */
export function useMyWallet(options?: { enabled?: boolean }) {
  return useQueryData(queryKeys.wallet.mine(), () => walletApi.mine(), options);
}

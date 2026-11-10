import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { walletApi, type WithdrawalStatus } from '../api/walletApi';

/** The logged-in buyer's balance and history (Q-01). */
export function useMyWallet(options?: { enabled?: boolean }) {
  return useQueryData(queryKeys.wallet.mine(), () => walletApi.mine(), options);
}

/** The banks a withdrawal can go to (VietQR list). */
export function useBanks(options?: { enabled?: boolean }) {
  return useQueryData(queryKeys.wallet.banks(), () => walletApi.banks(), options);
}

export function useMyWithdrawals() {
  return useQueryData(queryKeys.wallet.myWithdrawals(), () => walletApi.myWithdrawals());
}

/** Admin. */
export function useWithdrawals(status: WithdrawalStatus) {
  return useQueryData(queryKeys.wallet.withdrawals(status), () => walletApi.withdrawals(status));
}

/** Admin. */
export function useWalletSummary() {
  return useQueryData(queryKeys.wallet.summary(), () => walletApi.summary());
}

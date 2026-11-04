import { useCallback } from 'react';
import { login } from '../api/loginApi';
import { nfcApi, userStore, type NfcStatusDto, type User } from '@/entities/user';
import { vendorCatalogApi } from '@/entities/vendor';
import { isDemoMode } from '@/shared/config';

const NFC_STATUS: Record<NfcStatusDto['nfcStatus'], User['nfcStatus']> = {
  NOT_VERIFIED: 'UNVERIFIED',
  VERIFIED: 'VERIFIED',
  LOCKED: 'LOCKED',
};

/**
 * What the login answer does not carry: the shop the member owns (FR-27) and
 * the NFC status (FR-04). The seller screens need `vendorId`, the buyer flows
 * check `nfcStatus` (BR-23). Either read failing leaves the session usable.
 */
async function withShopAndNfc(user: User): Promise<User> {
  const [vendorId, nfc] = await Promise.allSettled([
    vendorCatalogApi.getMyVendorId(),
    nfcApi.getMyStatus(),
  ]);
  return {
    ...user,
    ...(vendorId.status === 'fulfilled' && vendorId.value
      ? { vendorId: vendorId.value, hasShop: true }
      : {}),
    ...(nfc.status === 'fulfilled' ? { nfcStatus: NFC_STATUS[nfc.value.nfcStatus] ?? user.nfcStatus } : {}),
  };
}

/**
 * Sign in and start the session.
 *
 * The page owns the form; this model owns the write, so the page never calls
 * an API directly (package-architecture §3, "Tầng 1: pages").
 */
export function useLogin() {
  return useCallback(async (phone: string, password: string) => {
    const signedIn = await login(phone, password);
    const user = isDemoMode() ? signedIn : await withShopAndNfc(signedIn);
    userStore.set(user);
    return user;
  }, []);
}

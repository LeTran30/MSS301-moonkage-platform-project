import { createStore, useStore } from '@/shared/lib';
import { GUEST_USER, type User } from './types';

/**
 * The signed-in account.
 *
 * The store starts as a guest and is filled by the sign-in flow
 * (`useLogin`) or by the session restore (`sessionApi.getMyAccount`).
 */
export const userStore = createStore<User>(GUEST_USER);

export function useCurrentUser(): User {
  return useStore(userStore);
}

export function setNfcVerified() {
  userStore.set((prev) => ({
    ...prev,
    nfcStatus: 'VERIFIED',
  }));
}

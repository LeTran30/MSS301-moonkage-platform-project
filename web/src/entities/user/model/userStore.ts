import { createStore, useStore } from '@/shared/lib';
import { DEMO_ACTORS, type User } from './types';

export const userStore = createStore<User>(DEMO_ACTORS.lan, 'moonkage_current_user');

export function useCurrentUser(): User {
  return useStore(userStore);
}

export function switchDemoActor(actorKey: keyof typeof DEMO_ACTORS) {
  const actor = DEMO_ACTORS[actorKey];
  if (actor) {
    userStore.set(actor);
  }
}

export function setNfcVerified() {
  userStore.set((prev) => ({
    ...prev,
    nfcStatus: 'VERIFIED',
  }));
}

import { apiClient, GATEWAY } from '@/shared/api';
import { userStore } from '@/entities/user';

/** Same limit as identity-service ProfileConstant.MAX_FULL_NAME_LENGTH. */
export const MAX_FULL_NAME_LENGTH = 100;

/** FR-02: `PATCH /api/accounts/me/profile`, then the header and every screen show the new name. */
export async function updateFullName(fullName: string): Promise<void> {
  const name = fullName.trim();
  await apiClient.patch(GATEWAY.IDENTITY.UPDATE_PROFILE, { fullName: name });
  userStore.set((prev) => ({ ...prev, name }));
}

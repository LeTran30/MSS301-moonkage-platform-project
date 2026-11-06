import { useCallback } from 'react';
import { changeRegistrationFee } from '../api/changeRegistrationFeeApi';
import type { RegistrationFeeConfig } from '@/entities/vendor';

/**
 * The admin sets the registration fee level in effect (FR-53, Q6.2).
 *
 * A level already paid is never changed by a new one.
 */
export function useChangeRegistrationFee() {
  return useCallback(
    (amount: number): Promise<RegistrationFeeConfig | null> => changeRegistrationFee(amount),
    [],
  );
}

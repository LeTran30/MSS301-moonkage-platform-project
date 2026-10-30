import { useAsync } from '@/shared/lib';
import { fetchRegistrationFeeConfig } from '../api/registrationFeeApi';

export function useRegistrationFee() {
  return useAsync(fetchRegistrationFeeConfig, []);
}

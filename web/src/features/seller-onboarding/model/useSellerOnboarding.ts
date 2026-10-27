import { useAsync } from '../../../shared/ui';
import {
  fetchRegistrationFeeConfig,
  submitVendorApplication,
  type SubmitSellerInput,
} from '../api/onboardingApi';

export type { SubmitSellerInput };

export function useRegistrationFee() {
  return useAsync(fetchRegistrationFeeConfig, []);
}

export function submitSellerOnboarding(input: SubmitSellerInput): Promise<void> {
  return submitVendorApplication(input);
}

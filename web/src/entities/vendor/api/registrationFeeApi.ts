import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';

/**
 * Wire shape of `com.moonkage.vendor.registrationfee.dto.RegistrationFeeConfigResponse`.
 *
 * The one registration fee level in effect (AC-26.9, FR-53). The endpoint is
 * open to guests so the profile form shows the fee before anyone registers.
 */
export interface RegistrationFeeConfig {
  amount: number;
  effectiveFrom?: string;
}

/** Wire shape of `com.moonkage.vendor.vendor.dto.response.RegistrationFeePaymentLinkResponse`. */
export interface RegistrationFeePaymentLink {
  paymentId: string;
  amount: number;
  paymentUrl: string;
}

export const registrationFeeApi = {
  /** The registration fee level in effect. */
  async getConfig(): Promise<RegistrationFeeConfig | null> {
    if (isDemoMode()) {
      return { amount: 200000, effectiveFrom: new Date().toISOString() };
    }
    const res = await apiClient.get<unknown>(GATEWAY.VENDOR.REGISTRATION_FEE_CONFIG);
    return unwrap<RegistrationFeeConfig>(res);
  },
};

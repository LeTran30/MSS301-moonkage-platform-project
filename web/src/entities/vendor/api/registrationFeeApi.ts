import { apiClient, type ApiResponse } from '@/shared/api/client';
import { registrationFeeConfigApi } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { VENDOR_FEE } from '../model/vendorFee';

interface RegistrationFeeConfigDto {
  amount: number;
  effectiveFrom: string;
}

export async function fetchRegistrationFeeConfig(): Promise<number> {
  if (config.demoMode) return mockResponse(VENDOR_FEE);
  try {
    const res = await apiClient.get<ApiResponse<RegistrationFeeConfigDto>>(registrationFeeConfigApi);
    return res.data.data?.amount ?? VENDOR_FEE;
  } catch {
    return VENDOR_FEE;
  }
}

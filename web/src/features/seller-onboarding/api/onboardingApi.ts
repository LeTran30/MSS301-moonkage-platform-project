import { apiClient, type ApiResponse } from '../../../shared/api/client';
import { demoStore } from '../../../shared/api/demo';
import { registrationFeeConfigApi, vendorsApi } from '../../../shared/api/gateway';
import { mockResponse } from '../../../shared/api/mock';
import { demoUploadLink, uploadToPresignedUrl, type PresignedUploadLink } from '../../../shared/api/upload';
import { config } from '../../../shared/config/env';
import { provinceCodeOf } from '../../../shared/config/provinces';

export interface SubmitSellerInput {
  kind: string;
  name: string;
  address: string;
  province: string;
  regNo: string;
  phone: string;
  representativeName: string;
  representativeIdNumber: string;
  source: string;
  ways: string[];
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  licenseFile?: File | null;
  foodSafetyFile?: File | null;
}

interface RegistrationFeeConfigDto {
  amount: number;
  effectiveFrom: string;
}

export async function fetchRegistrationFeeConfig(): Promise<number> {
  if (config.demoMode) return mockResponse(200000);
  try {
    const res = await apiClient.get<ApiResponse<RegistrationFeeConfigDto>>(registrationFeeConfigApi);
    return res.data.data?.amount ?? 200000;
  } catch {
    return 200000;
  }
}

export async function uploadVendorDocument(file: File): Promise<string> {
  if (config.demoMode) {
    return demoUploadLink('vendor-docs').tempKey;
  }
  const linkRes = await apiClient.post<ApiResponse<PresignedUploadLink>>(`${vendorsApi}/uploads`, {
    contentType: file.type || 'application/pdf',
    sizeBytes: file.size || 1,
  });
  const link = linkRes.data.data;
  await uploadToPresignedUrl(link, file);
  return link.tempKey;
}

export async function submitVendorApplication(input: SubmitSellerInput): Promise<void> {
  if (config.demoMode) {
    const account = demoStore.get<string>('account', '');
    if (account) {
      demoStore.set(`seller-state:${account}`, { state: 'pending' });
    }
    await mockResponse(true);
    return;
  }

  const documents: { kind: 'BUSINESS_LICENSE' | 'FOOD_SAFETY'; objectKey: string }[] = [];
  if (input.licenseFile) {
    const key = await uploadVendorDocument(input.licenseFile);
    documents.push({ kind: 'BUSINESS_LICENSE', objectKey: key });
  }
  if (input.foodSafetyFile) {
    const key = await uploadVendorDocument(input.foodSafetyFile);
    documents.push({ kind: 'FOOD_SAFETY', objectKey: key });
  }

  const supplySource = input.source.includes('Bán lại') ? 'RESELL' : 'SELF_PRODUCED';
  const payload = {
    businessName: input.name.trim(),
    entityType: input.kind.includes('Doanh nghiệp') ? 'SOLE_PROPRIETORSHIP' : 'HOUSEHOLD_BUSINESS',
    taxCode: input.regNo.replace(/\s+/g, ''),
    address: input.address.trim(),
    provinceCode: provinceCodeOf(input.province),
    representativeName: input.representativeName.trim(),
    representativeIdNumber: input.representativeIdNumber.replace(/\D/g, ''),
    supplySource,
    sellsShop: input.ways.some((w) => w.includes('Shop')),
    acceptsOrders: input.ways.some((w) => w.includes('Nhận đặt')),
    bankName: input.bankName.trim(),
    bankAccountNumber: input.bankAccountNumber.replace(/\s+/g, ''),
    bankAccountHolder: input.bankAccountHolder.trim().toUpperCase(),
    documents,
  };

  await apiClient.post(vendorsApi, payload);
}

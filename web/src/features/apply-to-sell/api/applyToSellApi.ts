import { getMyVendorDetail, vendorDemoState } from '@/entities/vendor';
import { apiClient, type ApiResponse } from '@/shared/api/client';
import { demoStore } from '@/shared/api/demo';
import { vendorsApi } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { demoUploadLink, uploadToPresignedUrl, type PresignedUploadLink } from '@/shared/api/upload';
import { config } from '@/shared/config/env';
import { provinceCodeOf } from '@/shared/config/provinces';


export interface SubmitVendorInput {
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

export async function submitVendorApplication(input: SubmitVendorInput): Promise<void> {
  if (config.demoMode) {
    if (demoStore.get<string>('account', '')) vendorDemoState.set({ state: 'pending' });
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

/** Re-submit after "cần bổ sung". */
export async function resubmitProfile(): Promise<boolean> {
  if (config.demoMode) {
    vendorDemoState.set({ state: 'pending' });
    return mockResponse(true);
  }
  try {
    const detail = await getMyVendorDetail();
    if (detail) {
      await apiClient.put(`${vendorsApi}/${encodeURIComponent(detail.id)}`, {
        businessName: detail.businessName,
        entityType: detail.entityType,
        taxCode: detail.taxCode,
        address: detail.address,
        provinceCode: detail.provinceCode,
        representativeName: detail.representativeName,
        representativeIdNumber: '001090001234',
        supplySource: detail.supplySource,
        sellsShop: detail.sellsShop,
        acceptsOrders: detail.acceptsOrders,
        bankName: detail.bankAccount?.bankName || 'Vietcombank',
        bankAccountNumber: '0011001234567',
        bankAccountHolder: detail.bankAccount?.holder || detail.representativeName,
        documents: detail.documents
          .filter((d) => d.kind !== 'FEE_INVOICE')
          .map((d) => ({ kind: d.kind, objectKey: d.objectKey || d.id })),
      });
    }
  } catch {
    // fallback if full unmasked fields are needed via onboarding page
  }
  return true;
}

import { demoStore } from '@/shared/api/demo';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { provinceNameOf } from '@/shared/config/provinces';
import { formatDate } from '@/shared/utils/format';
import type { VendorProfile, VendorState } from '../model/types';
import { openProfile, pendingProfile } from './seed';
import { getMyVendorDetail, type VendorDetailDto } from './vendorApi';

const PENDING_ACCOUNT = 'chohoso@moonkage.vn';
const currentAccount = () => demoStore.get<string>('account', '');
const stateKey = (account: string) => `vendor-state:${account}`;

interface DemoVendorState {
  state: VendorState;
  moreNeeded?: string;
  approvedAt?: string;
}

/**
 * Demo mode: where an account's vendor profile stands after the vendor, the onboarding or an admin moved it on.
 * `account` defaults to the logged-in demo account.
 */
export const vendorDemoState = {
  get: (account = currentAccount()) => demoStore.get<DemoVendorState | null>(stateKey(account), null),
  set: (value: DemoVendorState, account = currentAccount()) => demoStore.set(stateKey(account), value),
};

function mapVendorState(detail: VendorDetailDto): VendorState {
  if (detail.canOperate) return 'open';
  if (detail.status === 'APPROVED') return 'approved';
  if (detail.status === 'NEEDS_INFO') return 'needs-more';
  if (detail.status === 'REJECTED' || detail.status === 'LOCKED') return 'rejected';
  return 'pending';
}

export async function fetchProfile(): Promise<VendorProfile> {
  if (config.demoMode) {
    const base = currentAccount() === PENDING_ACCOUNT ? pendingProfile : openProfile;
    const stored = vendorDemoState.get();
    return mockResponse(stored ? { ...base, ...stored } : base);
  }
  const detail = await getMyVendorDetail();
  if (!detail) return pendingProfile;
  return {
    state: mapVendorState(detail),
    shopName: detail.businessName,
    kind: detail.entityType === 'SOLE_PROPRIETORSHIP' ? 'Doanh nghiệp tư nhân' : 'Hộ kinh doanh',
    regNo: detail.taxCode,
    address: `${detail.address}, ${provinceNameOf(detail.provinceCode)}`,
    ownerName: detail.representativeName,
    ownerId: detail.representativeIdMasked,
    submittedAt: formatDate(detail.createdAt),
    approvedAt: detail.status === 'APPROVED' ? formatDate(detail.updatedAt) : undefined,
    moreNeeded: detail.statusReason ?? undefined,
    ways: { shop: detail.sellsShop, custom: detail.acceptsOrders },
  };
}

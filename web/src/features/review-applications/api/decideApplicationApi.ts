import { applicationStore, fetchApplication, vendorDemoState, type ApplicationState, type VendorApplication } from '@/entities/vendor';
import { apiClient } from '@/shared/api/client';
import { vendorsApi } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { today } from '@/shared/utils/format';

/**
 * Decide on a vendor profile.
 */
export async function decideApplication(
  id: string,
  state: ApplicationState,
  note?: string,
): Promise<VendorApplication | null> {
  if (config.demoMode) {
    const labels: Record<ApplicationState, string> = {
      approved: 'Quản trị duyệt hồ sơ',
      'needs-more': `Quản trị yêu cầu bổ sung: ${note ?? ''}`,
      rejected: `Quản trị từ chối hồ sơ: ${note ?? ''}`,
      locked: 'Quản trị khóa người bán',
      pending: 'Chờ duyệt',
    };
    const next = applicationStore.update((list) =>
      list.map((a) => (a.id === id ? { ...a, state, history: [{ label: labels[state], at: today() }, ...a.history] } : a)),
    );
    const app = next.find((a) => a.id === id) ?? null;
    if (app?.account) {
      const vendorState = state === 'approved' ? 'approved' : state === 'locked' ? 'rejected' : state;
      vendorDemoState.set(
        { state: vendorState, moreNeeded: note, approvedAt: state === 'approved' ? today() : undefined },
        app.account,
      );
    }
    return mockResponse(app);
  }

  if (state === 'locked') {
    await apiClient.patch(`${vendorsApi}/${encodeURIComponent(id)}`, {
      status: 'LOCKED',
      statusReason: note || 'Khóa bởi quản trị',
    });
  } else {
    const decision = state === 'approved' ? 'APPROVE' : state === 'needs-more' ? 'NEEDS_INFO' : 'REJECT';
    await apiClient.post(`${vendorsApi}/${encodeURIComponent(id)}/reviews`, {
      decision,
      reason: note || undefined,
      licenseChecked: true,
      registryChecked: true,
    });
  }
  return fetchApplication(id);
}


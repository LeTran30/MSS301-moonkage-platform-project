import { toIsoDate } from '@/entities/quote';
import { fetchIncomingRequest, getMyVendorDetail, incomingRequestStore, type IncomingRequest, type VendorQuoteDto } from '@/entities/vendor';
import { apiClient, type ApiResponse } from '@/shared/api/client';
import { quoteRequestsApi } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';

export async function sendQuote(id: string, quote: NonNullable<IncomingRequest['quote']>): Promise<boolean> {
  if (config.demoMode) {
    incomingRequestStore.update((list) => list.map((r) => (r.id === id ? { ...r, state: 'quoted', quote } : r)));
    return mockResponse(true);
  }
  const req = await fetchIncomingRequest(id);
  const boxes = req?.boxes ?? 1;
  await apiClient.post(`${quoteRequestsApi}/${encodeURIComponent(id)}/quotes`, {
    items: [
      {
        description: `Hộp bánh trung thu (${boxes} hộp)`,
        quantity: boxes,
        unitPrice: quote.unitPrice,
      },
    ],
    customItems: [],
    shippingFee: 0,
    depositRate: quote.depositPercent,
    deliveryDate: toIsoDate(quote.deliverBy),
    deliveryMethod: 'Giao tận nơi',
    validDays: 7,
    notes: quote.note || undefined,
  });
  return true;
}

export async function withdrawQuote(id: string): Promise<boolean> {
  if (config.demoMode) {
    incomingRequestStore.update((list) => list.map((r) => (r.id === id ? { ...r, state: 'new', quote: undefined } : r)));
    return mockResponse(true);
  }
  const qRes = await apiClient.get<ApiResponse<VendorQuoteDto[]>>(
    `${quoteRequestsApi}/${encodeURIComponent(id)}/quotes`,
  );
  const activeQuote = (qRes.data.data ?? []).find((q) => q.status === 'SUBMITTED');
  if (activeQuote) {
    await apiClient.patch(
      `${quoteRequestsApi}/${encodeURIComponent(id)}/quotes/${encodeURIComponent(activeQuote.id)}`,
      { status: 'WITHDRAWN' },
    );
  }
  return true;
}

export async function declineRequest(id: string, reason = 'Không kịp hạn giao'): Promise<boolean> {
  if (config.demoMode) {
    incomingRequestStore.update((list) => list.map((r) => (r.id === id ? { ...r, state: 'declined' } : r)));
    return mockResponse(true);
  }
  const detail = await getMyVendorDetail();
  if (!detail) return false;
  await apiClient.patch(
    `${quoteRequestsApi}/${encodeURIComponent(id)}/invitations/${encodeURIComponent(detail.id)}`,
    { status: 'DECLINED', declineReason: reason },
  );
  return true;
}

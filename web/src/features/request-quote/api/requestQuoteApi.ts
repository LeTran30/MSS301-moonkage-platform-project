import { mapRequestDto, quoteRequestStore, toIsoDate, type QuoteRequest, type QuoteRequestDto } from '@/entities/quote';
import { apiClient, type ApiResponse } from '@/shared/api/client';
import { quoteRequestsApi } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { provinceCodeOf } from '@/shared/config/provinces';
import { today } from '@/shared/utils/format';

export type NewRequest = Omit<QuoteRequest, 'id' | 'createdAt' | 'quotes' | 'status' | 'acceptedVendorId'>;

export async function createRequest(input: NewRequest): Promise<QuoteRequest> {
  if (config.demoMode) {
    const request: QuoteRequest = { ...input, id: `YC-${105 + quoteRequestStore.get().length}`, createdAt: today(), quotes: [], status: 'waiting' };
    quoteRequestStore.update((list) => [request, ...list]);
    return mockResponse(request);
  }
  const customTypes: ('BAG' | 'CARD' | 'STICKER' | 'TEMPLATE_BOX')[] = ['TEMPLATE_BOX'];
  if (input.custom.toLowerCase().includes('thiệp')) customTypes.push('CARD');
  const specParts = [
    `Quy cách: ${input.perBox}`,
    `Vỏ: ${input.crusts.join(', ')}`,
    `Nhân: ${input.fillings.join(', ')}`,
    `Làm riêng: ${input.custom}`,
    ...(input.note ? [`Ghi chú: ${input.note}`] : []),
  ];
  const payload = {
    type: input.kind === 'direct' ? 'DIRECT' : 'OPEN',
    targetVendorId: input.kind === 'direct' ? input.invited[0]?.vendorId : undefined,
    quantity: input.boxes,
    customTypes,
    customSpec: specParts.join(' · '),
    deliveryDeadline: toIsoDate(input.deliverBy),
    delivery: {
      recipientName: 'Người nhận hàng',
      recipientPhone: '0901234567',
      provinceCode: provinceCodeOf(input.deliverTo),
      addressDetail: input.deliverTo || 'Hà Nội',
    },
  };
  const res = await apiClient.post<ApiResponse<QuoteRequestDto>>(quoteRequestsApi, payload);
  return mapRequestDto(res.data.data);
}

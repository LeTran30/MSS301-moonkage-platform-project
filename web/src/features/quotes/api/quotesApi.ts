import { mockResponse, seedStore } from '../../../shared/api/mock';
import type { Quote, QuoteRequest } from './types';

/** Buyer requests from the wireframe (m6-2, m6-2-1); the quote endpoints do not exist yet. */
const seedRequests: QuoteRequest[] = [
  {
    id: 'YC-104', kind: 'open', boxes: 150, perBox: '4 bánh', crusts: ['Nướng'], fillings: ['Thập cẩm', 'Hạt sen'],
    custom: 'In logo lên hộp', deliverTo: 'Cầu Giấy, Hà Nội', deliverBy: '15/11/2026', createdAt: '20/10/2026', status: 'new-quotes',
    invited: [
      { supplierId: 'nghe-nhan', supplierName: 'Xưởng Bánh Nghệ Nhân' },
      { supplierId: 'trang-vang', supplierName: 'Bánh Cổ Truyền Trăng Vàng' },
      { supplierId: 'minh-hoa', supplierName: 'Xưởng Minh Hòa' },
    ],
    quotes: [
      { supplierId: 'nghe-nhan', supplierName: 'Xưởng Bánh Nghệ Nhân', total: 18000000, boxes: 150, depositPercent: 50, deliverBy: '10/11/2026', custom: 'Khắc laser nắp gỗ', rating: 4.9, customOrders: 42 },
      { supplierId: 'trang-vang', supplierName: 'Bánh Cổ Truyền Trăng Vàng', total: 16500000, boxes: 150, depositPercent: 50, deliverBy: '14/11/2026', custom: 'In logo nắp giấy', rating: 4.8, customOrders: 28 },
    ],
  },
  {
    id: 'YC-098', kind: 'direct', directTo: 'Xưởng Bánh Nghệ Nhân', boxes: 120, perBox: 'Hộp gỗ 4 bánh', crusts: ['Nướng'], fillings: ['Thập cẩm', 'Hạt sen'],
    custom: 'Khắc laser logo công ty lên nắp hộp gỗ', deliverTo: 'Cầu Giấy, Hà Nội', deliverBy: '15/11/2026', createdAt: '15/10/2026', status: 'waiting',
    invited: [{ supplierId: 'nghe-nhan', supplierName: 'Xưởng Bánh Nghệ Nhân' }], quotes: [],
  },
  {
    id: 'YC-090', kind: 'direct', directTo: 'Bánh Cổ Truyền Trăng Vàng', boxes: 80, perBox: '4 bánh', crusts: ['Nướng'], fillings: ['Đậu xanh'],
    custom: 'Hộp sơn mài in tên công ty', deliverTo: 'Ba Đình, Hà Nội', deliverBy: '20/10/2026', createdAt: '01/10/2026', status: 'accepted',
    acceptedSupplierId: 'trang-vang', invited: [{ supplierId: 'trang-vang', supplierName: 'Bánh Cổ Truyền Trăng Vàng' }],
    quotes: [{ supplierId: 'trang-vang', supplierName: 'Bánh Cổ Truyền Trăng Vàng', total: 12000000, boxes: 80, depositPercent: 50, deliverBy: '20/10/2026', custom: 'Hộp sơn mài in tên', rating: 4.8, customOrders: 28 }],
  },
];

const requests = seedStore<QuoteRequest[]>('buyer-requests', seedRequests);
const today = () => new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function fetchRequests(): Promise<QuoteRequest[]> {
  return mockResponse(requests.get());
}

export function fetchRequest(requestId: string): Promise<QuoteRequest | null> {
  return mockResponse(requests.get().find((r) => r.id === requestId) ?? null);
}

export type NewRequest = Omit<QuoteRequest, 'id' | 'createdAt' | 'quotes' | 'status' | 'acceptedSupplierId'>;

export function createRequest(input: NewRequest): Promise<QuoteRequest> {
  const request: QuoteRequest = { ...input, id: `YC-${105 + requests.get().length}`, createdAt: today(), quotes: [], status: 'waiting' };
  requests.update((list) => [request, ...list]);
  return mockResponse(request);
}

export function closeRequest(requestId: string): Promise<QuoteRequest | null> {
  const next = requests.update((list) => list.map((r) => (r.id === requestId ? { ...r, status: 'closed' } : r)));
  return mockResponse(next.find((r) => r.id === requestId) ?? null);
}

/** Accepting one quote is binding: the other quotes of the request close (BR-17). */
export function acceptQuote(requestId: string, supplierId: string): Promise<{ request: QuoteRequest; quote: Quote } | null> {
  const next = requests.update((list) => list.map((r) => (r.id === requestId ? { ...r, status: 'accepted', acceptedSupplierId: supplierId } : r)));
  const request = next.find((r) => r.id === requestId);
  const quote = request?.quotes.find((q) => q.supplierId === supplierId);
  return mockResponse(request && quote ? { request, quote } : null);
}

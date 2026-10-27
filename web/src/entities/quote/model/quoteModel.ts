import { routes } from '@/shared/config/routes';
import type { Task, Tone } from '@/shared/ui';
import type { Quote, QuoteRequest, RequestStatus } from './types';

export const requestStatusLabel: Record<RequestStatus, { label: string; tone: Tone }> = {
  waiting: { label: 'Chờ báo giá', tone: 'soft' },
  'new-quotes': { label: 'Có báo giá mới', tone: 'warn' },
  accepted: { label: 'Đã chốt', tone: 'ok' },
  closed: { label: 'Đã đóng', tone: 'muted' },
};

export const deposit = (q: Quote) => Math.round((q.total * q.depositPercent) / 100);
export const perBox = (q: Quote) => Math.round(q.total / q.boxes);

/** The best value in each row of the comparison, so it can be marked (DS QuoteCompare `mk-best`). */
export function bestOf(quotes: Quote[]) {
  const live = quotes.filter((q) => !q.expired);
  const toDate = (d: string) => d.split('/').reverse().join('');
  return {
    total: Math.min(...live.map((q) => q.total)),
    deliverBy: live.map((q) => q.deliverBy).sort((a, b) => toDate(a).localeCompare(toDate(b)))[0],
  };
}

export const requestTitle = (r: QuoteRequest) => `${r.boxes} hộp${r.custom ? ` · ${r.custom.toLowerCase()}` : ''}`;

/** Requests with quotes waiting for the buyer's choice (account overview). */
export function requestTasks(requests: QuoteRequest[]): Task[] {
  return requests
    .filter((r) => r.status === 'new-quotes')
    .map((r) => ({
      id: r.id,
      tag: 'Báo giá',
      title: `${r.quotes.length} báo giá mới · Yêu cầu ${r.id} · ${requestTitle(r)}`,
      meta: `Giao trước ${r.deliverBy}`,
      to: routes.account.quoteRequest(r.id),
      action: 'So sánh',
    }));
}

export const openRequestCount = (requests: QuoteRequest[]) => requests.filter((r) => r.status === 'waiting' || r.status === 'new-quotes').length;

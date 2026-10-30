import { disputeStore, type Dispute } from '@/entities/dispute';
import { mockResponse } from '@/shared/api/mock';
import { today } from '@/shared/utils/format';

export function decideDispute(id: string, kind: string, amount: number, note: string): Promise<Dispute | null> {
  const next = disputeStore.update((list) =>
    list.map((d) =>
      d.id === id
        ? { ...d, state: 'decided', decision: { kind, amount, note, at: today() }, history: [{ label: 'Quản trị quyết định', at: today() }, ...d.history] }
        : d,
    ),
  );
  return mockResponse(next.find((d) => d.id === id) ?? null);
}


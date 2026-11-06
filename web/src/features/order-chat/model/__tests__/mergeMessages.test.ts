import { describe, expect, it } from 'vitest';
import { mergeMessages } from '../useOrderChat';

type ChatMessage = Parameters<typeof mergeMessages>[0][number];

const msg = (seq: number, body = `tin ${seq}`): ChatMessage => ({
  id: `m${seq}`,
  seq,
  orderId: 'o1',
  senderAccountId: 'a',
  senderParty: 'BUYER',
  body,
  attachmentName: null,
  attachmentContentType: null,
  attachmentUrl: null,
  createdAt: '2026-11-06T10:00:00Z',
});

describe('mergeMessages', () => {
  it('keeps each message once, in thread order', () => {
    const merged = mergeMessages([msg(1), msg(3)], [msg(2), msg(3)]);
    expect(merged.map((m) => m.seq)).toEqual([1, 2, 3]);
  });

  it('a pushed copy replaces the one already shown', () => {
    const merged = mergeMessages([msg(1, 'cũ')], [msg(1, 'mới')]);
    expect(merged).toHaveLength(1);
    expect(merged[0].body).toBe('mới');
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { paymentApi, type PaymentDto } from '@/entities/payment';
import { usePaymentPoll } from '../usePaymentPoll';

const FEE_PAYMENT = {
  paymentId: 'pay-1',
  purpose: 'REGISTRATION_FEE',
  referenceId: 'vendor-1',
  status: 'SUCCEEDED',
  amount: 200000,
} as PaymentDto;

/** Let the pending promise settle, then run the next poll timer. */
async function nextPoll() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });
}

describe('Feature checkout - usePaymentPoll (BR-25)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('đọc lại sau một lần lỗi thay vì đứng mãi ở "đang chờ" với số tiền 0', async () => {
    vi.spyOn(paymentApi, 'getById')
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(FEE_PAYMENT);

    const { result } = renderHook(() => usePaymentPoll('pay-1', null));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.kind).toBe('pending');

    await nextPoll();
    expect(result.current.kind).toBe('succeeded');
    expect(result.current.amount).toBe(200000);
  });

  it('báo không đọc được khi máy chủ không trả lời suốt các lượt hỏi', async () => {
    vi.spyOn(paymentApi, 'getById').mockRejectedValue(new Error('401'));

    const { result } = renderHook(() => usePaymentPoll('pay-1', null));
    for (let i = 0; i < 30; i += 1) await nextPoll();

    expect(result.current.kind).toBe('unreadable');
  });
});

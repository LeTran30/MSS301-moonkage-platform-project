import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminMoneyPage } from '../AdminMoneyPage';

const mocks = vi.hoisted(() => ({
  approve: vi.fn(),
  payout: vi.fn(),
  reload: vi.fn(),
}));

vi.mock('@/entities/payment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/payment')>();
  const ledger = {
    orderId: 'order-1',
    vendorId: 'vendor-1',
    kind: 'CUSTOM_ORDER' as const,
    held: 2_000_000,
    depositCollected: 2_000_000,
    disbursed: 0,
    paidOut: 0,
    toReceive: 2_000_000,
    disputeOpen: false,
    payable: false,
  };
  const payableLedger = {
    ...ledger,
    orderId: 'order-2',
    held: 1_250_000,
    depositCollected: 500_000,
    disbursed: 500_000,
    payable: true,
  };
  return {
    ...actual,
    useDisbursementRequests: () => ({
      kind: 'loaded' as const,
      data: {
        ledgers: [ledger, payableLedger],
        requests: [
          {
            requestId: 'request-1',
            orderId: ledger.orderId,
            amount: 500_000,
            purpose: 'MATERIALS',
            status: 'PENDING',
            createdAt: '2026-11-13T01:00:00Z',
            ledger,
          },
        ],
      },
      reload: mocks.reload,
    }),
  };
});

vi.mock('@/entities/vendor', () => ({
  useVendorSearch: () => ({
    kind: 'loaded' as const,
    data: [{ id: 'vendor-1', businessName: 'Moon Shop' }],
  }),
}));

vi.mock('@/features/approve-disbursement', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/approve-disbursement')>();
  return {
    ...actual,
    useApproveDisbursement: () => mocks.approve,
  };
});

vi.mock('@/features/pay-out', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/pay-out')>();
  return {
    ...actual,
    // Kept as a regression spy: approving an early disbursement must not call
    // the separate final-order payout operation.
    usePayOut: () => mocks.payout,
  };
});

describe('AdminMoneyPage disbursement approval', () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute('open');
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.approve.mockResolvedValue({ requestId: 'request-1', status: 'APPROVED' });
    mocks.payout.mockResolvedValue({
      payoutId: 'payout-1',
      orderId: 'order-2',
      vendorId: 'vendor-1',
      amount: 1_250_000,
    });
  });

  it('approves the deposit request without paying out the remaining order balance', async () => {
    const user = userEvent.setup();
    render(<AdminMoneyPage />);

    await user.click(screen.getByRole('button', { name: /Xét duyệt/i }));
    await user.click(screen.getByRole('button', { name: /Xác nhận duyệt/i }));

    await waitFor(() =>
      expect(mocks.approve).toHaveBeenCalledWith('order-1', 'request-1', {
        status: 'APPROVED',
        approvedAmount: null,
      }),
    );
    expect(mocks.payout).not.toHaveBeenCalled();
    expect(mocks.reload).toHaveBeenCalledOnce();
  });

  it('pays the final balance only from the dedicated payout tab', async () => {
    const user = userEvent.setup();
    render(<AdminMoneyPage />);

    await user.click(screen.getByRole('tab', { name: /Payout cuối đơn/i }));
    await user.click(screen.getByRole('button', { name: /Payout phần còn lại/i }));
    await user.click(screen.getByRole('button', { name: /Xác nhận payout/i }));

    await waitFor(() => expect(mocks.payout).toHaveBeenCalledWith('order-2'));
    expect(mocks.approve).not.toHaveBeenCalled();
    expect(mocks.reload).toHaveBeenCalledOnce();
  });
});

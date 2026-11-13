import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VendorDisbursementsPage } from '../VendorDisbursementsPage';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  reload: vi.fn(),
}));

vi.mock('@/entities/user', () => ({
  useCurrentUser: () => ({ id: 'owner-1', vendorId: 'vendor-1' }),
}));

vi.mock('@/entities/payment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/payment')>();
  const depositLedger = {
    orderId: 'custom-order-1',
    vendorId: 'vendor-1',
    kind: 'CUSTOM_ORDER' as const,
    held: 2_000_000,
    depositCollected: 500_000,
    remainingDisbursable: 500_000,
    disbursementEligible: true,
    // Early deposit disbursement is intentionally available before final payout.
    payable: false,
  };
  const payoutOnlyLedger = {
    orderId: 'retail-order-1',
    vendorId: 'vendor-1',
    kind: 'BUY_NOW' as const,
    held: 3_000_000,
    remainingDisbursable: 0,
    disbursementEligible: false,
    payable: true,
  };
  return {
    ...actual,
    useDisbursementRequests: () => ({
      kind: 'loaded' as const,
      data: {
        ledgers: [depositLedger, payoutOnlyLedger],
        requests: [
          {
            requestId: 'request-rejected',
            orderId: depositLedger.orderId,
            amount: 200_000,
            purpose: 'MATERIALS',
            status: 'REJECTED',
            reason: 'Thiếu chứng từ nguyên liệu',
            createdAt: '2026-11-12T03:00:00Z',
            ledger: depositLedger,
          },
        ],
      },
      reload: mocks.reload,
    }),
  };
});

vi.mock('@/features/request-disbursement', () => ({
  useRequestDisbursement: () => mocks.request,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <VendorDisbursementsPage />
    </MemoryRouter>,
  );
}

describe('VendorDisbursementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue({ requestId: 'request-new', status: 'PENDING' });
  });

  it('uses per-order deposit eligibility and shows the real request status', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText('Bị từ chối')).toBeInTheDocument();
    expect(screen.getByText(/Thiếu chứng từ nguyên liệu/)).toBeInTheDocument();

    const orderSelect = screen.getByRole('combobox', { name: /Đơn hàng cần giải ngân/i });
    await user.click(orderSelect);
    expect(screen.getByRole('option', { name: /custom-order-1/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /retail-order-1/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: /custom-order-1/i }));

    const amount = screen.getByRole('spinbutton', { name: /Số tiền muốn giải ngân/i });
    expect(amount).toHaveAttribute('max', '500000');
    await user.clear(amount);
    await user.type(amount, '400000');
    await user.click(screen.getByRole('button', { name: /Gửi Yêu Cầu Giải Ngân/i }));

    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith('custom-order-1', {
        amount: 400_000,
        purpose: 'MATERIALS',
      }),
    );
    expect(mocks.reload).toHaveBeenCalledOnce();
  });
});

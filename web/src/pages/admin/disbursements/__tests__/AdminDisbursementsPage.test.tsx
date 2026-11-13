import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminDisbursementsPage } from '../AdminDisbursementsPage';

const mocks = vi.hoisted(() => ({
  review: vi.fn(),
  reload: vi.fn(),
}));

vi.mock('@/entities/payment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/payment')>();
  const ledger = {
    orderId: 'order-1',
    vendorId: 'vendor-1',
    kind: 'CUSTOM_ORDER' as const,
    depositCollected: 2_000_000,
    held: 1_500_000,
    disbursed: 500_000,
    pendingDisbursement: 300_000,
  };
  return {
    ...actual,
    useDisbursementRequests: () => ({
      kind: 'loaded' as const,
      data: {
        ledgers: [ledger],
        requests: [
          {
            requestId: 'request-1',
            orderId: 'order-1',
            amount: 300_000,
            purpose: 'PACKAGING',
            status: 'PENDING',
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
    useApproveDisbursement: () => mocks.review,
  };
});

describe('AdminDisbursementsPage', () => {
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
    mocks.review.mockResolvedValue({ requestId: 'request-1', status: 'REJECTED' });
  });

  it('shows the ledger context and rejects with a mandatory reason', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminDisbursementsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Bao bì')).toBeInTheDocument();
    expect(screen.getByText('1.500.000đ')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Xét duyệt/i }));
    await user.click(screen.getByRole('radio', { name: /Từ chối yêu cầu/i }));
    await user.type(screen.getByRole('textbox', { name: /Lý do từ chối/i }), 'Thiếu chứng từ');
    await user.click(screen.getByRole('button', { name: /Xác nhận từ chối/i }));

    await waitFor(() =>
      expect(mocks.review).toHaveBeenCalledWith('order-1', 'request-1', {
        status: 'REJECTED',
        reason: 'Thiếu chứng từ',
      }),
    );
    expect(mocks.reload).toHaveBeenCalledOnce();
  });
});

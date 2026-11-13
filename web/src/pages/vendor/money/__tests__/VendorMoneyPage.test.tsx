import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { VendorMoneyPage } from '../VendorMoneyPage';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  reload: vi.fn(),
}));

vi.mock('@/entities/user', () => ({
  useCurrentUser: () => ({ id: 'owner-1', vendorId: 'vendor-1' }),
}));

vi.mock('@/entities/payment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/payment')>();
  return {
    ...actual,
    useLedgerList: () => ({
      kind: 'loaded' as const,
      data: [
        {
          orderId: 'custom-order-1',
          vendorId: 'vendor-1',
          kind: 'CUSTOM_ORDER' as const,
          held: 2_000_000,
          remainingDisbursable: 500_000,
          disbursementEligible: true,
          payable: false,
        },
        {
          orderId: 'retail-order-1',
          vendorId: 'vendor-1',
          kind: 'BUY_NOW' as const,
          held: 3_000_000,
          remainingDisbursable: 0,
          disbursementEligible: false,
          payable: true,
        },
      ],
      reload: mocks.reload,
    }),
  };
});

vi.mock('@/features/request-disbursement', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/request-disbursement')>();
  return {
    ...actual,
    useRequestDisbursement: () => mocks.request,
  };
});

describe('VendorMoneyPage deposit disbursement', () => {
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
    mocks.request.mockResolvedValue({ requestId: 'request-new', status: 'PENDING' });
  });

  it('opens the early-deposit order and applies its own remaining limit', async () => {
    const user = userEvent.setup();
    render(<VendorMoneyPage />);

    await user.click(screen.getByRole('button', { name: /Yêu cầu giải ngân tiền cọc/i }));

    expect(screen.getByRole('combobox', { name: /Đơn hàng cần giải ngân/i })).toHaveTextContent(
      'custom-order-1',
    );
    const amount = screen.getByRole('spinbutton', { name: /Số tiền muốn giải ngân/i });
    expect(amount).toHaveAttribute('max', '500000');
    await user.clear(amount);
    await user.type(amount, '400000');
    await user.click(screen.getByRole('button', { name: /Gửi yêu cầu giải ngân/i }));

    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith('custom-order-1', {
        amount: 400_000,
        purpose: 'MATERIALS',
      }),
    );
  });
});

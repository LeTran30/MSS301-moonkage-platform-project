import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { PayoutRequest } from '@/entities/payment';
import { DisbursementReviewModal } from '../DisbursementReviewModal';

function request(overrides: Partial<PayoutRequest> = {}): PayoutRequest {
  return {
    requestId: 'request-1',
    orderId: 'order-1',
    vendorId: 'vendor-1',
    vendorName: 'Moon Shop',
    amount: 500_000,
    purpose: 'MATERIALS',
    status: 'PENDING',
    depositCollected: 1_000_000,
    held: 900_000,
    disbursed: 100_000,
    pendingDisbursement: 500_000,
    approvalCapacity: 900_000,
    ...overrides,
  };
}

function renderModal(onSubmit = vi.fn(), item = request()) {
  render(
    <DisbursementReviewModal
      open
      request={item}
      vendorName="Moon Shop"
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />,
  );
  return onSubmit;
}

describe('DisbursementReviewModal', () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute('open');
    };
  });

  it('approves the whole requested amount', async () => {
    const onSubmit = renderModal();

    await userEvent.click(screen.getByRole('button', { name: /Xác nhận duyệt/i }));

    expect(onSubmit).toHaveBeenCalledWith({ status: 'APPROVED', approvedAmount: null });
  });

  it('approves only the amount entered by the admin', async () => {
    const user = userEvent.setup();
    const onSubmit = renderModal();

    await user.click(screen.getByRole('radio', { name: /Duyệt một phần/i }));
    const amount = screen.getByRole('spinbutton', { name: /Số tiền duyệt/i });
    await user.clear(amount);
    await user.type(amount, '300000');
    await user.click(screen.getByRole('button', { name: /Xác nhận duyệt/i }));

    expect(onSubmit).toHaveBeenCalledWith({ status: 'APPROVED', approvedAmount: 300_000 });
  });

  it('blocks an approval above the deposit still held', async () => {
    const user = userEvent.setup();
    const onSubmit = renderModal(vi.fn(), request({ amount: 800_000, approvalCapacity: 500_000 }));

    await user.click(screen.getByRole('button', { name: /Xác nhận duyệt/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/vượt phần tiền cọc còn giữ/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires a reason before rejecting and sends the normalized reason', async () => {
    const user = userEvent.setup();
    const onSubmit = renderModal();

    await user.click(screen.getByRole('radio', { name: /Từ chối yêu cầu/i }));
    await user.click(screen.getByRole('button', { name: /Xác nhận từ chối/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/nhập lý do từ chối/i);
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(screen.getByRole('textbox', { name: /Lý do từ chối/i }), '  Thiếu hóa đơn  ');
    await user.click(screen.getByRole('button', { name: /Xác nhận từ chối/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      status: 'REJECTED',
      reason: 'Thiếu hóa đơn',
    });
  });
});

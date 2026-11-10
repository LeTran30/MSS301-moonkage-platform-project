import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Dispute } from '@/entities/dispute';
import { VendorDisputePanel } from '../VendorDisputePanel';

const RESOLVED: Dispute = {
  id: 'dispute-1',
  orderId: 'order-1',
  buyerName: 'Phan Quốc Bảo',
  vendorName: 'Bánh Dẻo Chợ Lớn',
  reason: 'DAMAGED',
  description: 'Một hộp bị móp',
  evidences: [{ party: 'BUYER', downloadUrl: 'https://img/buyer.png', note: 'Ảnh hộp móp' }],
  createdAt: '2026-11-09T08:17:40Z',
  status: 'RESOLVED',
  orderTotalAmount: 250000,
  escrowHoldingAmount: 175000,
  maxRefundableAmount: 175000,
  decision: 'PARTIAL_REFUND',
  refundAmount: 75000,
  adminNote: 'Hoàn giá 1 hộp',
};

describe('B2.1 - VendorDisputePanel (FR-12, FR-49)', () => {
  it('khiếu nại đã phân xử: Shop thấy phán quyết, không còn form gửi bằng chứng', () => {
    render(<VendorDisputePanel dispute={RESOLVED} onChanged={() => {}} />);

    expect(screen.getByText('Đã có phán quyết')).toBeTruthy();
    expect(screen.getByText('Ảnh hộp móp')).toBeTruthy();
    expect(screen.getByText('Shop chưa gửi bằng chứng nào.')).toBeTruthy();
    expect(screen.getByText('Hoàn cho người mua: 75.000đ')).toBeTruthy();
    expect(screen.getByText('Căn cứ: Hoàn giá 1 hộp')).toBeTruthy();
    expect(screen.queryByText('Gửi bằng chứng của Shop')).toBeNull();
  });

  it('bác khiếu nại: không nói tới khoản hoàn', () => {
    render(
      <VendorDisputePanel
        dispute={{
          ...RESOLVED,
          decision: 'REJECTED',
          refundAmount: undefined,
          adminNote: undefined,
        }}
        onChanged={() => {}}
      />,
    );

    expect(screen.getByText(/Bác khiếu nại/)).toBeTruthy();
    expect(screen.queryByText(/Hoàn cho người mua/)).toBeNull();
    expect(screen.queryByText(/Căn cứ/)).toBeNull();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DisputeCaseCard } from '../DisputeCaseCard';
import { DisputeEvidenceList } from '../DisputeEvidenceList';
import { DisputeResolutionCard } from '../DisputeResolutionCard';

type Dispute = Parameters<typeof DisputeCaseCard>[0]['dispute'];

const OPEN: Dispute = {
  id: '654ef5af-a8f8-4e20-b58b-864ebb9cbf0c',
  orderId: '00000000-0000-4000-8000-000500000038',
  buyerName: 'Phan Quốc Bảo',
  vendorName: 'Bánh Dẻo Chợ Lớn',
  reason: 'DAMAGED',
  description: 'Một hộp bị móp',
  evidences: [
    { party: 'BUYER', downloadUrl: 'https://img/buyer.png', note: 'Ảnh hộp móp' },
    {
      party: 'VENDOR',
      downloadUrl: 'https://img/vendor.png',
      note: 'Ảnh đóng gói',
      createdAt: '2026-11-09T08:33:00Z',
    },
  ],
  createdAt: '2026-11-09T08:17:40Z',
  status: 'OPEN',
  orderTotalAmount: 250000,
  escrowHoldingAmount: 250000,
  maxRefundableAmount: 250000,
};

describe('Entities - DisputeEvidenceList (AC-49.1)', () => {
  it('chỉ hiện bằng chứng của bên được chọn, kèm ghi chú', () => {
    render(<DisputeEvidenceList evidences={OPEN.evidences} party="VENDOR" />);

    expect(screen.getByText('Ảnh đóng gói')).toBeTruthy();
    expect(screen.queryByText('Ảnh hộp móp')).toBeNull();
    expect(screen.getByRole('link').getAttribute('href')).toBe('https://img/vendor.png');
  });

  it('hiện câu báo trống khi bên đó chưa gửi gì', () => {
    render(
      <DisputeEvidenceList
        evidences={[OPEN.evidences[0]]}
        party="VENDOR"
        emptyText="Shop chưa gửi bằng chứng."
      />,
    );

    expect(screen.getByText('Shop chưa gửi bằng chứng.')).toBeTruthy();
  });

  it('không hiện gì khi trống và không có câu báo', () => {
    const { container } = render(<DisputeEvidenceList evidences={[]} />);

    expect(container.innerHTML).toBe('');
  });
});

describe('Entities - DisputeCaseCard (Q5.0)', () => {
  it('hiện mã ngắn, hai bên, bằng chứng của từng bên và mở phán quyết', () => {
    const onResolve = vi.fn();
    render(<DisputeCaseCard dispute={OPEN} onResolve={onResolve} />);

    expect(screen.getByText('Khiếu nại #BB9CBF0C')).toBeTruthy();
    expect(screen.getByText('Đơn #00000038')).toBeTruthy();
    expect(screen.getByText('Phan Quốc Bảo')).toBeTruthy();
    expect(screen.getByText('Bánh Dẻo Chợ Lớn')).toBeTruthy();
    expect(screen.getByText('Ảnh hộp móp')).toBeTruthy();
    expect(screen.getByText('Ảnh đóng gói')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Ra phán quyết' }));
    expect(onResolve).toHaveBeenCalledOnce();
  });

  it('báo khi chưa bên nào gửi ảnh', () => {
    render(<DisputeCaseCard dispute={{ ...OPEN, evidences: [] }} onResolve={() => {}} />);

    expect(screen.getByText('Người mua không gửi ảnh.')).toBeTruthy();
    expect(screen.getByText('Shop chưa gửi bằng chứng.')).toBeTruthy();
  });
});

describe('Entities - DisputeResolutionCard (FR-49)', () => {
  const RESOLVED: Dispute = {
    ...OPEN,
    status: 'RESOLVED',
    decision: 'PARTIAL_REFUND',
    refundAmount: 75000,
    adminNote: 'Hoàn giá 1 hộp',
    resolvedAt: '2026-11-09T08:34:00Z',
  };

  function valueOf(term: string): string {
    return screen.getByText(term).nextElementSibling?.textContent ?? '';
  }

  it('hoàn một phần: số hoàn và phần còn lại về Shop', () => {
    render(<DisputeResolutionCard dispute={RESOLVED} />);

    expect(valueOf('Hoàn cho người mua')).toBe('75.000đ');
    expect(valueOf('Phần còn lại của đơn về Shop')).toBe('175.000đ');
    expect(screen.getByText('Căn cứ: Hoàn giá 1 hộp')).toBeTruthy();
    expect(screen.getByText('Phân xử lúc')).toBeTruthy();
  });

  it('bác khiếu nại: không hoàn gì, cả đơn về Shop', () => {
    render(
      <DisputeResolutionCard
        dispute={{
          ...RESOLVED,
          decision: 'REJECTED',
          refundAmount: undefined,
          adminNote: undefined,
          resolvedAt: undefined,
          buyerName: '',
          vendorName: '',
        }}
      />,
    );

    expect(valueOf('Hoàn cho người mua')).toBe('0đ');
    expect(valueOf('Phần còn lại của đơn về Shop')).toBe('250.000đ');
    expect(screen.queryByText('Phân xử lúc')).toBeNull();
    expect(screen.getByText(/^Người mua · /)).toBeTruthy();
  });

  it('chưa có phán quyết thì hiện gạch ngang', () => {
    render(<DisputeResolutionCard dispute={{ ...RESOLVED, decision: undefined }} />);

    expect(valueOf('Phán quyết')).toBe('—');
  });
});

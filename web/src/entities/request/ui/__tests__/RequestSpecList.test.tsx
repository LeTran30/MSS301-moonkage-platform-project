import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RequestSpecList } from '../RequestSpecList';

type QuoteRequest = Parameters<typeof RequestSpecList>[0]['request'];

const BASE_REQUEST: QuoteRequest = {
  id: 'req-1',
  type: 'DIRECT',
  buyerId: 'buyer-1',
  buyerName: 'Người mua',
  quantity: 120,
  deliveryDeadline: '',
  deliveryAddress: '12 Lê Lợi',
  deliveryProvince: 'TP. Hồ Chí Minh',
  createdAt: '2026-11-07T00:00:00Z',
  status: 'OPEN',
  invitedVendorsCount: 1,
  quotes: [],
};

function valueOf(term: string): string {
  return screen.getByText(term).nextElementSibling?.textContent ?? '';
}

describe('Entities - RequestSpecList', () => {
  it('hiện "Không có" và bỏ các dòng tùy chọn khi yêu cầu chỉ có số lượng', () => {
    render(<RequestSpecList request={BASE_REQUEST} />);

    expect(valueOf('Số lượng')).toBe('120 hộp');
    expect(valueOf('Hạn nhận bánh')).toBe('—');
    expect(valueOf('Tùy chỉnh')).toBe('Không có');
    expect(valueOf('Yêu cầu riêng')).toBe('Không có');
    expect(screen.queryByText('Ngân sách')).not.toBeInTheDocument();
    expect(screen.queryByText('Logo')).not.toBeInTheDocument();
    expect(screen.queryByText('Giao tới')).not.toBeInTheDocument();
  });

  it('hiện tùy chỉnh, ngân sách, logo, nơi giao và tách từng phần yêu cầu riêng', () => {
    render(
      <RequestSpecList
        withDelivery
        request={{
          ...BASE_REQUEST,
          deliveryDeadline: '2026-12-01',
          customTypes: ['BAG', 'CARD'],
          budgetPerBox: 150000,
          customLogoFileName: 'logo.png',
          customRequirements: 'In tên công ty | Vỏ: Trà xanh | ',
        }}
      />,
    );

    expect(valueOf('Hạn nhận bánh')).not.toBe('—');
    expect(valueOf('Tùy chỉnh')).toBe('Túi giấy, Thiệp chúc mừng');
    expect(valueOf('Ngân sách')).toContain('/ hộp');
    expect(valueOf('Logo')).toBe('logo.png');
    expect(valueOf('Giao tới')).toBe('12 Lê Lợi, TP. Hồ Chí Minh');
    expect(screen.getByText('In tên công ty')).toBeInTheDocument();
    expect(screen.getByText('Vỏ: Trà xanh')).toBeInTheDocument();
  });
});

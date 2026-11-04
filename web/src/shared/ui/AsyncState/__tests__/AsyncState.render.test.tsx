import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AsyncState, LoadingState, ErrorState } from '../AsyncState';

describe('Shared UI - AsyncState (rendered)', () => {
  it('hiển thị trạng thái loading kèm role=status và aria-busy', () => {
    render(<LoadingState />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent(/đang tải/i);
  });

  it('hiển thị trạng thái error kèm role=alert và nút thử lại', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Máy chủ đang lỗi." onRetry={onRetry} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Máy chủ đang lỗi.');

    await userEvent.click(screen.getByRole('button', { name: /thử lại/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('AsyncState hiển thị loading thay vì nội dung', () => {
    render(
      <AsyncState state={{ kind: 'loading' }}>
        {(data: string[]) => <div>{data.join(',')}</div>}
      </AsyncState>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(/a, b/)).not.toBeInTheDocument();
  });

  it('AsyncState hiển thị error kèm nút thử lại khi tải lỗi', () => {
    const onRetry = vi.fn();
    render(
      <AsyncState state={{ kind: 'error', message: 'Không kết nối được máy chủ.' }} onRetry={onRetry}>
        {() => <div>Nội dung</div>}
      </AsyncState>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Không kết nối được máy chủ.');
  });

  it('AsyncState hiển thị nội dung khi tải thành công', () => {
    render(
      <AsyncState state={{ kind: 'loaded', data: ['a', 'b'] }}>
        {(data: string[]) => <div>{data.join(',')}</div>}
      </AsyncState>,
    );
    expect(screen.getByText('a,b')).toBeInTheDocument();
  });

  it('AsyncState hiển thị empty thay vì nội dung khi mảng rỗng', () => {
    render(
      <AsyncState state={{ kind: 'loaded', data: [] }} empty={<div>Chưa có sản phẩm</div>}>
        {(data: string[]) => <div>{data.join(',')}</div>}
      </AsyncState>,
    );
    expect(screen.getByText('Chưa có sản phẩm')).toBeInTheDocument();
  });

  it('AsyncState nhận diện empty với đối tượng phân trang rỗng', () => {
    render(
      <AsyncState
        state={{ kind: 'loaded', data: { content: [] } }}
        empty={<div>Chưa có kết quả</div>}
      >
        {() => <div>Nội dung</div>}
      </AsyncState>,
    );
    expect(screen.getByText('Chưa có kết quả')).toBeInTheDocument();
  });

  it('AsyncState dùng isEmpty tùy biến khi được truyền vào', () => {
    render(
      <AsyncState
        state={{ kind: 'loaded', data: { count: 0 } }}
        isEmpty={(data: { count: number }) => data.count === 0}
        empty={<div>Hết dữ liệu</div>}
      >
        {() => <div>Nội dung</div>}
      </AsyncState>,
    );
    expect(screen.getByText('Hết dữ liệu')).toBeInTheDocument();
  });
});

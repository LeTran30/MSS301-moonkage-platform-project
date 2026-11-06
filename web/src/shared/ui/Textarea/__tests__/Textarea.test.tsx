import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../Textarea';

describe('Shared UI - Textarea', () => {
  it('gắn nhãn với vùng nhập bằng htmlFor và tự sinh id', () => {
    render(<Textarea label="Ghi chú cho xưởng" />);

    const textarea = screen.getByLabelText('Ghi chú cho xưởng');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea.id).toBeTruthy();
  });

  it('gọi onChange khi người dùng nhập', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea label="Ghi chú" onChange={onChange} />);

    await user.type(screen.getByLabelText('Ghi chú'), 'abc');

    expect(onChange).toHaveBeenCalled();
  });

  it('gắn aria-invalid và aria-describedby khi có lỗi', () => {
    render(<Textarea label="Ghi chú" error="Vui lòng nhập nội dung" />);

    const textarea = screen.getByLabelText(/Ghi chú/);
    expect(textarea).toHaveAttribute('aria-invalid', 'true');

    const message = screen.getByRole('alert');
    expect(textarea.getAttribute('aria-describedby')).toBe(message.id);
  });

  it('hiển thị gợi ý khi không có lỗi', () => {
    render(<Textarea label="Ghi chú" hint="Tối đa 500 ký tự" />);

    const textarea = screen.getByLabelText(/Ghi chú/);
    expect(textarea.getAttribute('aria-describedby')).toBeTruthy();
    expect(screen.getByText('Tối đa 500 ký tự')).toBeInTheDocument();
  });

  it('giữ số dòng mặc định và cho phép tuỳ chỉnh', () => {
    const { rerender } = render(<Textarea label="Ghi chú" />);
    expect(screen.getByLabelText('Ghi chú')).toHaveAttribute('rows', '4');

    rerender(<Textarea label="Ghi chú" rows={8} />);
    expect(screen.getByLabelText('Ghi chú')).toHaveAttribute('rows', '8');
  });

  it('vô hiệu hoá khi disabled', () => {
    render(<Textarea label="Ghi chú" disabled />);

    expect(screen.getByLabelText(/Ghi chú/)).toBeDisabled();
  });
});

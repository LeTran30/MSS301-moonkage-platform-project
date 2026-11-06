import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Radio } from '../Radio';

describe('Shared UI - Radio', () => {
  it('gắn nhãn với nút chọn bằng htmlFor và tự sinh id', () => {
    render(<Radio label="Giao trước khi thanh toán" />);

    const input = screen.getByLabelText('Giao trước khi thanh toán');
    expect(input).toBeInTheDocument();
    expect(input.id).toBeTruthy();
    expect(input).toHaveAttribute('type', 'radio');
  });

  it('giữ input native để hành vi nhóm radio không bị hỏng', () => {
    render(<Radio label="Chọn" name="payment" defaultChecked />);

    const input = screen.getByRole('radio', { name: 'Chọn' });
    expect(input.tagName).toBe('INPUT');
    expect(input).toBeChecked();
    expect(input).toHaveAttribute('name', 'payment');
  });

  it('gọi onChange khi người dùng chọn', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Radio label="Chọn" onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'Chọn' }));

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('gắn aria-invalid và aria-describedby khi có lỗi', () => {
    render(<Radio label="Chọn" error="Vui lòng chọn một phương thức" />);

    const input = screen.getByRole('radio', { name: /Chọn/ });
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const message = screen.getByRole('alert');
    expect(input.getAttribute('aria-describedby')).toBe(message.id);
  });

  it('hỗ trợ ẩn nhãn nhưng vẫn giữ nhãn cho trình đọc màn hình', () => {
    render(<Radio label="Chọn" hideLabel />);

    expect(screen.getByRole('radio', { name: 'Chọn' })).toBeInTheDocument();
  });

  it('vô hiệu hoá khi disabled', () => {
    render(<Radio label="Chọn" disabled />);

    expect(screen.getByRole('radio', { name: /Chọn/ })).toBeDisabled();
  });
});

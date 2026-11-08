import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '../Checkbox';

describe('Shared UI - Checkbox', () => {
  it('gắn nhãn với ô chọn bằng htmlFor và tự sinh id', () => {
    render(<Checkbox label="Yêu cầu xuất hóa đơn" />);

    const input = screen.getByLabelText('Yêu cầu xuất hóa đơn');
    expect(input).toBeInTheDocument();
    expect(input.id).toBeTruthy();
    expect(input).toHaveAttribute('type', 'checkbox');
  });

  it('giữ input native để form submit và autofill không bị hỏng', () => {
    render(<Checkbox label="Chọn" name="agree" defaultChecked />);

    const input = screen.getByRole('checkbox', { name: 'Chọn' });
    expect(input.tagName).toBe('INPUT');
    expect(input).toBeChecked();
    expect(input).toHaveAttribute('name', 'agree');
  });

  it('gọi onChange khi người dùng bật/tắt', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Chọn" onChange={onChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Chọn' }));

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('gắn aria-invalid và aria-describedby khi có lỗi', () => {
    render(<Checkbox label="Chọn" error="Bạn chưa đồng ý" />);

    const input = screen.getByRole('checkbox', { name: /Chọn/ });
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const message = screen.getByRole('alert');
    expect(message).toHaveTextContent('Bạn chưa đồng ý');
    expect(input.getAttribute('aria-describedby')).toBe(message.id);
  });

  it('hiển thị gợi ý khi không có lỗi', () => {
    render(<Checkbox label="Chọn" hint="Không bắt buộc" />);

    const input = screen.getByRole('checkbox', { name: /Chọn/ });
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
    expect(screen.getByText('Không bắt buộc')).toBeInTheDocument();
  });

  it('không gắn aria-describedby khi không có thông báo', () => {
    render(<Checkbox label="Chọn" />);

    expect(screen.getByRole('checkbox', { name: /Chọn/ })).not.toHaveAttribute('aria-describedby');
  });

  it('hỗ trợ ẩn nhãn nhưng vẫn giữ nhãn cho trình đọc màn hình', () => {
    render(<Checkbox label="Chọn" hideLabel />);

    expect(screen.getByRole('checkbox', { name: 'Chọn' })).toBeInTheDocument();
  });

  it('vô hiệu hoá khi disabled', () => {
    render(<Checkbox label="Chọn" disabled />);

    expect(screen.getByRole('checkbox', { name: /Chọn/ })).toBeDisabled();
  });
});

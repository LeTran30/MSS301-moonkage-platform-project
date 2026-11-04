import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '../Input';

describe('Shared UI - Input (accessibility)', () => {
  it('gắn label với ô nhập bằng htmlFor', () => {
    render(<Input id="ho-ten" label="Họ và tên" />);

    const input = screen.getByLabelText('Họ và tên');
    expect(input).toHaveAttribute('id', 'ho-ten');
  });

  it('tự sinh id khi không truyền id', () => {
    render(<Input label="Email" />);

    const input = screen.getByLabelText('Email');
    expect(input.id).toBeTruthy();
  });

  it('khi có lỗi thì gắn aria-invalid và trỏ aria-describedby tới thông báo', () => {
    render(<Input id="email" label="Email" error="Email không hợp lệ." />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const message = document.getElementById(describedBy as string);
    expect(message).toHaveTextContent('Email không hợp lệ.');
    expect(message).toHaveAttribute('role', 'alert');
  });

  it('không gắn aria-invalid khi không có lỗi', () => {
    render(<Input id="email" label="Email" />);

    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
  });

  it('gắn aria-describedby tới gợi ý khi có hint', () => {
    render(<Input id="email" label="Email" hint="Dùng email công ty." />);

    const input = screen.getByLabelText('Email');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent('Dùng email công ty.');
  });

  it('không gắn aria-describedby khi không có lỗi lẫn hint', () => {
    render(<Input id="email" label="Email" />);

    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-describedby');
  });

  it('đánh dấu trường bắt buộc', () => {
    render(<Input id="email" label="Email" required />);

    expect(screen.getByLabelText(/Email/)).toBeRequired();
  });
});

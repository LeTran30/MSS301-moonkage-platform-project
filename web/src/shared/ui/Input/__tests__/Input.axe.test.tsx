import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Input } from '../Input';

describe('Shared UI - Input (a11e tự động bằng axe)', () => {
  it('ô nhập có nhãn không vi phạm accessibility', async () => {
    const { container } = render(<Input id="email" label="Email" />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ô nhập có lỗi không vi phạm accessibility', async () => {
    const { container } = render(<Input id="email" label="Email" error="Email không hợp lệ." />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ô nhập có gợi ý không vi phạm accessibility', async () => {
    const { container } = render(<Input id="email" label="Email" hint="Dùng email công ty." />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('trường bắt buộc không vi phạm accessibility', async () => {
    const { container } = render(<Input id="email" label="Email" required />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('nhãn gắn đúng với ô nhập (kiểm tra bổ sung)', () => {
    render(<Input id="ho-ten" label="Họ và tên" />);
    expect(screen.getByLabelText('Họ và tên')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { VendorBusinessTypeStep } from '../VendorBusinessTypeStep';

/** `ButtonLink` cần Router context (dùng `Link` của react-router). */
function renderStep(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Register vendor - VendorBusinessTypeStep (a11e)', () => {
  it('nhóm chọn mô hình pháp lý không vi phạm accessibility', async () => {
    const { container } = renderStep(
      <VendorBusinessTypeStep value="HKD" onChange={() => {}} onNext={() => {}} />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('dùng radio thật, chọn được bằng bàn phím', async () => {
    const onChange = vi.fn();
    renderStep(<VendorBusinessTypeStep value="HKD" onChange={onChange} onNext={() => {}} />);

    const hkd = screen.getByRole('radio', { name: /Hộ Kinh Doanh/i });
    const dntn = screen.getByRole('radio', { name: /Doanh Nghiệp Tư Nhân/i });

    expect(hkd).toBeChecked();
    expect(dntn).not.toBeChecked();

    await userEvent.click(dntn);
    expect(onChange).toHaveBeenCalledWith('DNTN');
  });

  it('mũi tên phải chuyển lựa chọn giữa hai radio', async () => {
    const onChange = vi.fn();
    renderStep(<VendorBusinessTypeStep value="HKD" onChange={onChange} onNext={() => {}} />);

    const hkd = screen.getByRole('radio', { name: /Hộ Kinh Doanh/i });
    hkd.focus();

    await userEvent.keyboard('{ArrowDown}');
    expect(onChange).toHaveBeenCalledWith('DNTN');
  });

  it('nhóm radio có nhãn cho trình đọc màn hình', () => {
    renderStep(<VendorBusinessTypeStep value="HKD" onChange={() => {}} onNext={() => {}} />);

    expect(screen.getByRole('radiogroup', { name: /Bước 1/i })).toBeInTheDocument();
  });
});

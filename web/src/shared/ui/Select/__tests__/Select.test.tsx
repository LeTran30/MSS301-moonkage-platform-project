import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select';

const OPTIONS = [
  { value: 'A', label: 'Hộ kinh doanh' },
  { value: 'B', label: 'Doanh nghiệp tư nhân' },
];

describe('Shared UI - Select (listbox tự dựng)', () => {
  it('gắn label với trigger bằng htmlFor và tạo id khi không truyền', () => {
    render(<Select label="Loại hình pháp lý" options={OPTIONS} />);

    const trigger = screen.getByLabelText('Loại hình pháp lý');
    expect(trigger.id).toBeTruthy();
    expect(trigger).toHaveAttribute('role', 'combobox');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('hiện placeholder khi chưa chọn giá trị nào', () => {
    render(<Select label="Tỉnh" options={[]} placeholder="Chọn tỉnh / thành phố" />);

    expect(screen.getByRole('combobox')).toHaveTextContent('Chọn tỉnh / thành phố');
  });

  it('mở listbox khi bấm và hiển thị đầy đủ option', async () => {
    const user = userEvent.setup();
    render(<Select label="Loại hình pháp lý" options={OPTIONS} />);

    await user.click(screen.getByRole('combobox'));

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(within(listbox).getAllByRole('option')).toHaveLength(2);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
  });

  it('gọi onChange với giá trị của option được chọn', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select label="Loại hình pháp lý" options={OPTIONS} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Doanh nghiệp tư nhân' }));

    expect(onChange).toHaveBeenCalledWith('B');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('điều hướng bằng bàn phím và chọn bằng Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select label="Loại hình pháp lý" options={OPTIONS} onChange={onChange} />);

    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('B');
  });

  it('đóng dropdown bằng Escape mà không đổi giá trị', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select label="Loại hình pháp lý" options={OPTIONS} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('bỏ qua option bị vô hiệu hoá khi điều hướng', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select
        label="Loại hình pháp lý"
        options={[{ value: 'A', label: 'Hộ kinh doanh', disabled: true }, ...OPTIONS.slice(1)]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('B');
  });

  it('gắn aria-invalid và aria-describedby khi có lỗi', () => {
    render(<Select id="loai-hinh" label="Loại hình pháp lý" options={OPTIONS} error="Bắt buộc." />);

    const trigger = screen.getByLabelText('Loại hình pháp lý');
    expect(trigger).toHaveAttribute('aria-invalid', 'true');

    const describedBy = trigger.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent('Bắt buộc.');
  });

  it('hỗ trợ nhóm tuỳ chọn (optgroup)', async () => {
    const user = userEvent.setup();
    render(
      <Select
        label="Tỉnh"
        groups={[
          { label: 'Miền Bắc', options: [{ value: '01', label: 'Hà Nội' }] },
          { label: 'Miền Trung', options: [{ value: '08', label: 'Bình Định' }] },
        ]}
      />,
    );

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('group', { name: 'Miền Bắc' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Miền Trung' })).toBeInTheDocument();
  });

  it('giữ trạng thái điều khiển khi value được đặt từ bên ngoài', () => {
    const { rerender } = render(<Select label="Loại hình pháp lý" options={OPTIONS} value="A" />);

    expect(screen.getByRole('combobox')).toHaveTextContent('Hộ kinh doanh');

    rerender(<Select label="Loại hình pháp lý" options={OPTIONS} value="B" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Doanh nghiệp tư nhân');
  });
});

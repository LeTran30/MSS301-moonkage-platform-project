import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuickPersonaSelector } from '../QuickPersonaSelector';
import { DEMO_ACTORS } from '@/entities/user';

/**
 * Hồi quy: `QuickPersonaSelector` từng dùng khoá không tồn tại trong
 * `DEMO_ACTORS` (`alpha`, `linh`), khiến `DEMO_ACTORS[key].id` ném lỗi
 * `Cannot read properties of undefined`.
 *
 * Hậu quả nặng hơn vẻ ngoài: selector này nằm trong **mọi** màn hình, nên
 * lỗi làm hỏng toàn bộ ứng dụng — mọi route chỉ hiện khung, không hiện nội dung.
 */
describe('Switch persona - QuickPersonaSelector', () => {
  it('không ném lỗi khi render (mọi khoá phải tồn tại trong DEMO_ACTORS)', () => {
    expect(() => render(<QuickPersonaSelector />)).not.toThrow();
  });

  it('hiện đủ 4 nút chọn vai', () => {
    render(<QuickPersonaSelector />);

    expect(screen.getByRole('button', { name: /Nguyễn Thị Lan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Alpha/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Trần Văn Quân/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quản trị/i })).toBeInTheDocument();
  });

  it('mọi nhân vật trong DEMO_ACTORS đều có id', () => {
    Object.entries(DEMO_ACTORS).forEach(([key, actor]) => {
      expect(actor, `nhân vật "${key}" phải tồn tại`).toBeDefined();
      expect(actor.id, `nhân vật "${key}" phải có id`).toBeTruthy();
    });
  });

  it('không render nút cho khoá không tồn tại', () => {
    // Nếu một khoá sai lọt vào, component phải bỏ qua chứ không làm hỏng trang.
    render(<QuickPersonaSelector />);
    const buttons = screen.getAllByRole('button');
    const personaButtons = buttons.filter((b) => /Khách lẻ M1|Doanh nghiệp M5|Chủ xưởng|Admin sàn/.test(b.textContent ?? ''));

    expect(personaButtons).toHaveLength(4);
  });
});

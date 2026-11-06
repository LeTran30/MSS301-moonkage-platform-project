import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidebarDrawer } from '../SidebarDrawer';

describe('Widgets - SidebarDrawer', () => {
  it('ẩn panel cho tới khi bấm nút mở', () => {
    render(
      <SidebarDrawer title="Kênh người bán" panelId="test-drawer">
        {() => <nav>Mục 1</nav>}
      </SidebarDrawer>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mở menu kênh người bán/i })).toBeInTheDocument();
  });

  it('mở panel với vai trò dialog và khoá cuộn trang', async () => {
    const user = userEvent.setup();
    render(
      <SidebarDrawer title="Kênh người bán" panelId="test-drawer">
        {() => <nav>Mục 1</nav>}
      </SidebarDrawer>,
    );

    await user.click(screen.getByRole('button', { name: /mở menu kênh người bán/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Kênh người bán');
    expect(dialog.id).toBe('test-drawer');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('đóng bằng phím Escape và trả tiêu điểm về nút mở', async () => {
    const user = userEvent.setup();
    render(
      <SidebarDrawer title="Kênh người bán" panelId="test-drawer">
        {() => <nav>Mục 1</nav>}
      </SidebarDrawer>,
    );

    const trigger = screen.getByRole('button', { name: /mở menu kênh người bán/i });
    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).not.toBe('hidden');
    expect(trigger).toHaveFocus();
  });

  it('đóng bằng nút X', async () => {
    const user = userEvent.setup();
    render(
      <SidebarDrawer title="Kênh người bán" panelId="test-drawer">
        {() => <nav>Mục 1</nav>}
      </SidebarDrawer>,
    );

    await user.click(screen.getByRole('button', { name: /mở menu kênh người bán/i }));
    await user.click(screen.getByRole('button', { name: /đóng menu kênh người bán/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('đóng drawer khi nội dung gọi hàm đóng được truyền vào', async () => {
    const user = userEvent.setup();
    render(
      <SidebarDrawer title="Kênh người bán" panelId="test-drawer">
        {(close) => (
          <button type="button" onClick={close}>
            Mục 1
          </button>
        )}
      </SidebarDrawer>,
    );

    await user.click(screen.getByRole('button', { name: /mở menu kênh người bán/i }));
    await user.click(screen.getByRole('button', { name: 'Mục 1' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

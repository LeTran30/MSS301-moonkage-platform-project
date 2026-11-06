import type { RefObject } from 'react';
import { Icon } from '@/shared/ui';
import type { CommandItem } from '../model/commandTypes';
import styles from './CommandPalette.module.css';

interface CommandPaletteViewProps {
  query: string;
  activeIndex: number;
  commands: CommandItem[];
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSelect: (command: CommandItem) => void;
  onHover: (index: number) => void;
  onClose: () => void;
}

/** Phần hiển thị thuần của Command Palette (không chứa state). */
export function CommandPaletteView({
  query,
  activeIndex,
  commands,
  inputRef,
  onQueryChange,
  onKeyDown,
  onSelect,
  onHover,
  onClose,
}: CommandPaletteViewProps) {
  const activeCommandId = commands[activeIndex]?.id;

  return (
    <div className={styles.backdrop}>
      {/*
        Lớp nền là một nút thật: bấm ra ngoài để đóng vẫn hoạt động với chuột,
        nhưng người dùng bàn phím cũng đóng được bằng Tab + Enter, thay vì
        một `div` có onClick không có vai trò.
      */}
      <button
        type="button"
        className={styles.backdropClose}
        aria-label="Đóng tìm kiếm nhanh"
        onClick={onClose}
      />
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Tìm kiếm nhanh và lệnh hệ thống"
      >
        <div className={styles.searchBar}>
          <Icon name="search" size={20} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Gõ lệnh, tìm trang, bật dark mode..."
            value={query}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="cmd-listbox"
            aria-activedescendant={activeCommandId ? `cmd-opt-${activeCommandId}` : undefined}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <span className={styles.shortcutBadge}>ESC</span>
        </div>

        <div
          className={styles.resultsList}
          id="cmd-listbox"
          role="listbox"
          aria-label="Danh sách kết quả lệnh"
        >
          {commands.length === 0 ? (
            <div className={styles.emptyState}>
              Không tìm thấy lệnh hoặc trang nào khớp với "<strong>{query}</strong>"
            </div>
          ) : (
            commands.map((cmd, idx) => (
              <button
                key={cmd.id}
                id={`cmd-opt-${cmd.id}`}
                type="button"
                role="option"
                aria-selected={idx === activeIndex}
                className={`${styles.resultItem} ${idx === activeIndex ? styles.active : ''}`}
                onClick={() => onSelect(cmd)}
                onMouseEnter={() => onHover(idx)}
              >
                <div className={styles.itemLeft}>
                  <div className={styles.itemIcon}>
                    <Icon name={cmd.icon} size={18} />
                  </div>
                  <div>
                    <div className={styles.itemTitle}>{cmd.title}</div>
                    {cmd.description && <div className={styles.itemDesc}>{cmd.description}</div>}
                  </div>
                </div>
                {cmd.shortcut && <span className={styles.itemRight}>{cmd.shortcut}</span>}
              </button>
            ))
          )}
        </div>

        <div className={styles.footerBar}>
          <div className={styles.kbdGuide}>
            <span>
              <kbd className={styles.kbd}>↑</kbd> <kbd className={styles.kbd}>↓</kbd> Di chuyển
            </span>
            <span>
              <kbd className={styles.kbd}>Enter</kbd> Chọn
            </span>
            <span>
              <kbd className={styles.kbd}>Esc</kbd> Đóng
            </span>
          </div>
          <span>Moonkage Command v1.0</span>
        </div>
      </div>
    </div>
  );
}

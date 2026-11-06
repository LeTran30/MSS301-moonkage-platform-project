import { describe, it, expect, beforeEach } from 'vitest';
import { getTheme, applyTheme, toggleTheme } from '../themeStore';

describe('ThemeStore - Quản lý giao diện Sáng / Tối', () => {
  beforeEach(() => {
    applyTheme('light');
  });

  it('khởi tạo với theme light mặc định', () => {
    expect(getTheme()).toBe('light');
  });

  it('chuyển theme từ light sang dark qua toggleTheme()', () => {
    const next = toggleTheme();
    expect(next).toBe('dark');
    expect(getTheme()).toBe('dark');
  });

  it('chuyển theme từ dark trở lại light qua toggleTheme()', () => {
    toggleTheme(); // sang dark
    const next = toggleTheme(); // về light
    expect(next).toBe('light');
    expect(getTheme()).toBe('light');
  });

  it('áp dụng theme chỉ định trực tiếp qua applyTheme()', () => {
    applyTheme('dark');
    expect(getTheme()).toBe('dark');

    applyTheme('light');
    expect(getTheme()).toBe('light');
  });
});

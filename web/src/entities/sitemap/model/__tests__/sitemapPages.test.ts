import { describe, it, expect } from 'vitest';
import { ALL_PAGES } from '../sitemapPages';
import { FLOWS } from '../sitemapFlows';

/**
 * Bảo vệ **tính đầy đủ của bản đồ giao diện (IA)**.
 *
 * Bản đồ là hợp đồng giữa tài liệu IA và mã nguồn: mỗi mã trang trong IA
 * (`M1.0`…`V5.0`) phải có đúng một ô trong lưới. Nếu ai đó xoá một dòng,
 * bản đồ sẽ âm thầm thiếu mã và không ai hay biết.
 */

/** Toàn bộ mã trang IA theo đặc tả (`midfi-content-spec.md` + `03_Sitemap_va_luong.html`). */
const IA_CODES = [
  'M1.0', 'M1.1', 'M2.0', 'M2.1', 'M3.0', 'M3.1', 'M3.2', 'M3.3', 'M3.4',
  'M4.0', 'M4.1', 'M4.2', 'M4.3', 'M5.1', 'M5.2', 'M5.3', 'M5.4', 'M5.5',
  'M6.0', 'M6.1', 'M6.1.1', 'M6.1.2', 'M6.1.3', 'M6.2', 'M6.2.1', 'M6.2.2',
  'M6.3', 'M6.3.1', 'M6.3.2', 'M6.4', 'M6.5', 'M6.6', 'M7.0', 'M7.1', 'M8.0',
  'B1.0', 'B1.1', 'B2.0', 'B2.1', 'B2.2', 'B3.0', 'B3.1', 'B3.2', 'B4.0', 'B4.1',
  'B5.0', 'B5.1', 'B5.2', 'B6.0', 'B6.1', 'B6.2', 'B6.3', 'B6.4',
  'Q1.0', 'Q2.0', 'Q2.1', 'Q3.0', 'Q4.0', 'Q4.1', 'Q4.2', 'Q4.3', 'Q5.0', 'Q5.1',
  'Q6.0', 'Q6.1', 'Q6.2', 'Q6.3', 'Q6.4',
  'V1.0', 'V2.0', 'V3.0', 'V4.0', 'V5.0',
];

describe('Bản đồ giao diện — tính đầy đủ của IA', () => {
  it('có đúng 73 mã trang như đặc tả', () => {
    expect(ALL_PAGES).toHaveLength(73);
  });

  it('không mã trang nào bị thiếu', () => {
    const actual = new Set(ALL_PAGES.map((p) => p.code));
    const missing = IA_CODES.filter((code) => !actual.has(code));
    expect(missing).toEqual([]);
  });

  it('không mã trang nào bị lặp', () => {
    const codes = ALL_PAGES.map((p) => p.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('mọi trang đều có đường dẫn và tên', () => {
    for (const page of ALL_PAGES) {
      expect(page.route, `thiếu route cho ${page.code}`).toBeTruthy();
      expect(page.name, `thiếu tên cho ${page.code}`).toBeTruthy();
    }
  });

  it('hai mã hoãn (B6.4, Q6.3) được đánh dấu là hoãn', () => {
    const deferred = ALL_PAGES.filter((p) => p.deferred).map((p) => p.code);
    expect(deferred.sort()).toEqual(['B6.4', 'Q6.3']);
  });

  it('mọi luồng trong sitemap đều trỏ tới mã trang có thật', () => {
    const codes = new Set(ALL_PAGES.map((p) => p.code));
    for (const flow of FLOWS) {
      for (const step of flow.steps) {
        expect(codes.has(step.code), `luồng ${flow.id} trỏ tới mã không tồn tại: ${step.code}`).toBe(true);
      }
    }
  });
});

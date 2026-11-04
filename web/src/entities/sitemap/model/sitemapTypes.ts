/** Mã trang theo bản đồ thông tin (IA) của Moonkage. */
export type PageCode = string;

export interface SitemapPageNode {
  code: PageCode;
  name: string;
  route: string;
  desc: string;
  zone: 'M' | 'B' | 'Q' | 'V';
  frList?: string[];
  brList?: string[];
  /**
   * Mã trang được đặc tả hoãn cho bản demo (`requirements.md` mục 4.3).
   * Trang vẫn tồn tại để bản đồ không thiếu mã, nhưng nội dung chỉ giải thích
   * tính năng sẽ tới.
   */
  deferred?: boolean;
}

export interface SitemapFlowStep {
  code: PageCode;
  title: string;
  link: string;
}

export interface SitemapFlow {
  id: string;
  name: string;
  steps: SitemapFlowStep[];
}

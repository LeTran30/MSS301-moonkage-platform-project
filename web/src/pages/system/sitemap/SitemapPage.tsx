import { useState } from 'react';
import { Tabs } from '@/shared/ui';
import {
  ALL_PAGES,
  SitemapFlowInspector,
  SitemapPageGrid,
  TOTAL_PAGE_COUNT,
} from '@/entities/sitemap';
import styles from './SitemapPage.module.css';

type ZoneFilter = 'ALL' | 'M' | 'B' | 'Q' | 'V';

export function SitemapPage() {
  const [activeZone, setActiveZone] = useState<ZoneFilter>('ALL');
  const [selectedFlow, setSelectedFlow] = useState<string>('F1');

  const filteredPages = ALL_PAGES.filter((p) => {
    if (activeZone === 'ALL') return true;
    return p.zone === activeZone;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.superBadge}>SƠ ĐỒ KIẾN TRÚC THÔNG TIN (IA) & BẢN ĐỒ GIAO DIỆN</span>
          <h1 className={styles.title}>Bản đồ điều hướng 4 Khu vực & 7 Luồng người dùng (F1 - F7)</h1>
          <p className={styles.desc}>
            Toàn bộ 4 Khu vực (Zone M, B, Q, V) và các kịch bản tương tác đều được hiện thực hóa đầy đủ,
            sẵn sàng kiểm thử trực tiếp trên prototype Moonkage.
          </p>
        </div>
      </div>

      <SitemapFlowInspector selectedFlowId={selectedFlow} onSelectFlow={setSelectedFlow} />

      <div className={styles.matrixHeader}>
        <h2 className={styles.matrixTitle}>
          Ma trận toàn bộ các màn hình hệ thống ({filteredPages.length} trang)
        </h2>
        <Tabs<ZoneFilter>
          items={[
            { id: 'ALL', label: `Tất cả (${TOTAL_PAGE_COUNT})` },
            { id: 'M', label: 'Khu vực M - Khách hàng (M1 - M8)' },
            { id: 'B', label: 'Khu vực B - Người bán (B1 - B6)' },
            { id: 'Q', label: 'Khu vực Q - Quản trị sàn (Q1 - Q6)' },
            { id: 'V', label: 'Khu vực V - App NFC CCCD (V1 - V5)' },
          ]}
          activeId={activeZone}
          onChange={setActiveZone}
        />
      </div>

      <SitemapPageGrid pages={filteredPages} />
    </div>
  );
}

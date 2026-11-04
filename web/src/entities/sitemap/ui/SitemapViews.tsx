import { Card } from '@/shared/ui';
import { ALL_PAGES, ZONE_LABELS } from '../model/sitemapPages';
import { FLOWS } from '../model/sitemapFlows';
import type { SitemapPageNode } from '../model/sitemapTypes';
import styles from './sitemapUi.module.css';

interface SitemapFlowInspectorProps {
  selectedFlowId: string;
  onSelectFlow: (id: string) => void;
}

/** Trình kiểm tra luồng tương tác (F1 - F7). */
export function SitemapFlowInspector({ selectedFlowId, onSelectFlow }: SitemapFlowInspectorProps) {
  const currentFlow = FLOWS.find((f) => f.id === selectedFlowId) ?? FLOWS[0];

  return (
    <Card className={styles.flowCard}>
      <div className={styles.flowCardHeader}>
        <div className={styles.flowHeaderTitle}>
          <span className={styles.flowIcon}>🧭</span>
          <div>
            <h3>Trình kiểm tra luồng tương tác (Flow Inspector F1 - F7)</h3>
            <p>Chọn một luồng để xem chuỗi màn hình liên kết và nhấp trực tiếp vào từng bước để trải nghiệm:</p>
          </div>
        </div>

        <div className={styles.flowButtons}>
          {FLOWS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`${styles.flowBtn} ${selectedFlowId === f.id ? styles.flowBtnActive : ''}`}
              onClick={() => onSelectFlow(f.id)}
            >
              {f.id}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.flowTrackContainer}>
        <div className={styles.flowTitleRow}>
          <strong>{currentFlow.name}</strong>
          <span className={styles.stepCount}>{currentFlow.steps.length} màn hình liên kết</span>
        </div>

        <div className={styles.flowStepper}>
          {currentFlow.steps.map((st, idx) => (
            <a key={`${st.code}-${idx}`} href={st.link} className={styles.stepBox}>
              <div className={styles.stepIndex}>{idx + 1}</div>
              <div className={styles.stepInfo}>
                <span className={styles.stepCode}>{st.code}</span>
                <strong className={styles.stepTitle}>{st.title}</strong>
              </div>
              {idx < currentFlow.steps.length - 1 && <span className={styles.stepArrow}>➔</span>}
            </a>
          ))}
        </div>
      </div>
    </Card>
  );
}

interface SitemapPageGridProps {
  pages: SitemapPageNode[];
}

/** Ma trận toàn bộ màn hình hệ thống của 4 khu vực. */
export function SitemapPageGrid({ pages }: SitemapPageGridProps) {
  return (
    <div className={styles.pagesGrid}>
      {pages.map((page) => (
        <a key={page.code} href={page.route} className={styles.pageCard}>
          <div className={styles.pageCardTop}>
            <span className={`${styles.codeBadge} ${styles[`zone_${page.zone}`]}`}>{page.code}</span>
            <span className={styles.zoneTag}>{ZONE_LABELS[page.zone]}</span>
            {page.deferred && <span className={styles.deferredTag}>Hoãn</span>}
          </div>

          <h3 className={styles.cardName}>{page.name}</h3>
          <p className={styles.cardDesc}>{page.desc}</p>

          <div className={styles.rulesList}>
            {page.frList?.map((fr) => (
              <span key={fr} className={styles.frChip}>{fr}</span>
            ))}
            {page.brList?.map((br) => (
              <span key={br} className={styles.brChip}>{br}</span>
            ))}
          </div>

          <span className={styles.linkArrow}>Mở trang này ↗</span>
        </a>
      ))}
    </div>
  );
}

/** Tổng số màn hình của toàn bộ bản đồ. */
export const TOTAL_PAGE_COUNT = ALL_PAGES.length;

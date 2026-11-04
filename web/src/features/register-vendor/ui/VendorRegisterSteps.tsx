import styles from './VendorRegisterSteps.module.css';

interface VendorRegisterStepsProps {
  /** Bước hiện tại của wizard (1 -> 4). */
  step: number;
}

const STEP_LABELS: Array<{ idx: number; label: string }> = [
  { idx: 1, label: '1. Loại hình kinh doanh' },
  { idx: 2, label: '2. Thông tin đơn vị' },
  { idx: 3, label: '3. Cách bán & Nguồn hàng' },
  { idx: 4, label: '4. Xem lại & Nộp hồ sơ' },
];

/** Thanh tiến trình 4 bước của form khai hồ sơ người bán (M7.1). */
export function VendorRegisterSteps({ step }: VendorRegisterStepsProps) {
  return (
    <div className={styles.wizardSteps}>
      {STEP_LABELS.map((s) => (
        <div
          key={s.idx}
          className={`${styles.stepPill} ${step === s.idx ? styles.stepActive : step > s.idx ? styles.stepDone : ''}`}
        >
          {s.label}
        </div>
      ))}
    </div>
  );
}

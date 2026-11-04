import { useState, type FormEvent } from 'react';
import { Button, Card, CardHeader, Input } from '@/shared/ui';
import styles from './AdminTaxonomyTab.module.css';

/**
 * Q6.2 — the platform fee policy.
 *
 * The opening fee is charged once when a shop is approved; the commission is
 * a percent of each order, lower for the bulk channel.
 */
export function AdminFeesTab() {
  const [vendorOpeningFee, setVendorOpeningFee] = useState('500000');
  const [retailCommissionRate, setRetailCommissionRate] = useState('5');
  const [bulkCommissionRate, setBulkCommissionRate] = useState('3.5');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <Card className={styles.configCard}>
      <CardHeader
        title="Phí kích hoạt mở bán & Tỷ lệ chiết khấu sàn (Q6.2)"
        description="Chính sách tài chính minh bạch cho các xưởng bánh gia nhập Moonkage"
      />

      <form onSubmit={handleSubmit} className={styles.formBody}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Phí mở bán gian hàng 1 lần (VNĐ) * (Q6.2)</label>
          <Input
            type="number"
            value={vendorOpeningFee}
            onChange={(e) => setVendorOpeningFee(e.target.value)}
          />
          <span className={styles.inputSub}>
            Khoản thu một lần khi hồ sơ người bán được duyệt để kích hoạt gian hàng lên sàn (thanh
            toán qua VNPAY)
          </span>
        </div>

        <div className={styles.formRow}>
          <div className={styles.col}>
            <label className={styles.label}>Phí hoa hồng đơn bán lẻ (%)</label>
            <Input
              type="number"
              value={retailCommissionRate}
              onChange={(e) => setRetailCommissionRate(e.target.value)}
            />
            <span className={styles.inputSub}>Mặc định: 5% trên giá trị đơn</span>
          </div>
          <div className={styles.col}>
            <label className={styles.label}>Phí hoa hồng đơn đặt hàng B2B (%)</label>
            <Input
              type="number"
              value={bulkCommissionRate}
              onChange={(e) => setBulkCommissionRate(e.target.value)}
            />
            <span className={styles.inputSub}>Ưu đãi cho đơn số lượng lớn: 3.5%</span>
          </div>
        </div>

        <div className={styles.formActions}>
          <Button type="submit" variant="primary">
            Lưu chính sách phí
          </Button>
        </div>
      </form>
    </Card>
  );
}

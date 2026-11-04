import { useState, type FormEvent } from 'react';
import { Button, Card, CardHeader, Input } from '@/shared/ui';
import styles from './AdminTaxonomyTab.module.css';

/**
 * Q6.1 — the interprovincial shipping fee table.
 *
 * The base fee applies to a standard parcel under 2kg; the express surcharge
 * covers the soft cakes that need a cold chain.
 */
export function AdminShippingTab() {
  const [baseInterprovincialFee, setBaseInterprovincialFee] = useState('35000');
  const [expressSurcharge, setExpressSurcharge] = useState('25000');
  const [platformSubsidyPercent, setPlatformSubsidyPercent] = useState('20');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <Card className={styles.configCard}>
      <CardHeader
        title="Biểu phí vận chuyển liên tỉnh & Trợ giá (Q6.1)"
        description="Áp dụng khi người mua và người bán ở khác tỉnh thành"
      />

      <form onSubmit={handleSubmit} className={styles.formBody}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Cước phí vận chuyển liên tỉnh cơ bản (VNĐ) *</label>
          <Input
            type="number"
            value={baseInterprovincialFee}
            onChange={(e) => setBaseInterprovincialFee(e.target.value)}
          />
          <span className={styles.inputSub}>
            Áp dụng cho gói tiêu chuẩn dưới 2kg qua đơn vị vận chuyển ViettelPost/GHTK
          </span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Phụ phí hỏa tốc / bảo quản mát (VNĐ)</label>
          <Input
            type="number"
            value={expressSurcharge}
            onChange={(e) => setExpressSurcharge(e.target.value)}
          />
          <span className={styles.inputSub}>
            Dành cho bánh dẻo tươi hoặc bánh kem lạnh hạn ngắn
          </span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Mức trợ giá vận chuyển từ ngân sách sàn (%)</label>
          <Input
            type="number"
            value={platformSubsidyPercent}
            onChange={(e) => setPlatformSubsidyPercent(e.target.value)}
          />
        </div>

        <div className={styles.formActions}>
          <Button type="submit" variant="primary">
            Lưu biểu phí vận chuyển
          </Button>
        </div>
      </form>
    </Card>
  );
}

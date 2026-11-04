import { useState } from 'react';
import { Button, Card, CardHeader, Input } from '@/shared/ui';
import { INITIAL_CRUSTS, INITIAL_FILLINGS } from '@/entities/product';
import styles from './AdminTaxonomyTab.module.css';

/**
 * Q6.4 (FR-54, BR-34) — the catalogue of crusts and fillings.
 *
 * A seller must pick at least one crust and one filling of this catalogue when
 * they publish a product, so the admin owns the values here.
 */
export function AdminTaxonomyTab() {
  const [crusts, setCrusts] = useState<string[]>(INITIAL_CRUSTS.map((c) => c.name));
  const [fillings, setFillings] = useState<string[]>(INITIAL_FILLINGS.map((f) => f.name));
  const [newCrust, setNewCrust] = useState('');
  const [newFilling, setNewFilling] = useState('');

  function handleAddCrust() {
    const name = newCrust.trim();
    if (name && !crusts.includes(name)) {
      setCrusts((prev) => [...prev, name]);
      setNewCrust('');
    }
  }

  function handleAddFilling() {
    const name = newFilling.trim();
    if (name && !fillings.includes(name)) {
      setFillings((prev) => [...prev, name]);
      setNewFilling('');
    }
  }

  return (
    <div className={styles.taxonomyContainer}>
      <div className={styles.ruleAlert}>
        📜 <strong>Quy định cốt lõi FR-54 & BR-34:</strong> Quản trị viên khởi tạo và quản lý danh
        mục Vỏ và Nhân. Người bán bắt buộc phải chọn ít nhất một Vỏ và một Nhân thuộc danh mục
        này khi đăng bán sản phẩm.
      </div>

      <div className={styles.taxonomyGrid}>
        <Card className={styles.taxCard}>
          <CardHeader
            title={`Danh mục Vỏ bánh (${crusts.length} loại)`}
            description="Các loại vỏ bánh tiêu chuẩn toàn sàn"
          />
          <div className={styles.addWrap}>
            <Input
              value={newCrust}
              onChange={(e) => setNewCrust(e.target.value)}
              placeholder="Thêm loại vỏ mới (VD: Vỏ than tre)..."
            />
            <Button variant="secondary" size="sm" onClick={handleAddCrust}>
              + Thêm
            </Button>
          </div>

          <div className={styles.chipCloud}>
            {crusts.map((c) => (
              <span key={c} className={styles.taxChip}>
                {c}
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => setCrusts((prev) => prev.filter((x) => x !== c))}
                  title="Xóa"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </Card>

        <Card className={styles.taxCard}>
          <CardHeader
            title={`Danh mục Nhân bánh (${fillings.length} loại)`}
            description="Các loại nhân ngọt, thập cẩm, hiện đại"
          />
          <div className={styles.addWrap}>
            <Input
              value={newFilling}
              onChange={(e) => setNewFilling(e.target.value)}
              placeholder="Thêm nhân mới (VD: Yến sào đông trùng)..."
            />
            <Button variant="secondary" size="sm" onClick={handleAddFilling}>
              + Thêm
            </Button>
          </div>

          <div className={styles.chipCloud}>
            {fillings.map((f) => (
              <span key={f} className={styles.taxChip}>
                {f}
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => setFillings((prev) => prev.filter((x) => x !== f))}
                  title="Xóa"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

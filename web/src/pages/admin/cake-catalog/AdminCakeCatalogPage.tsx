import styles from './AdminCakeCatalogPage.module.css';
import { useState } from 'react';
import { routes } from '@/shared/config';
import { AsyncState, Badge, Button, Card, Breadcrumbs, Input, Modal, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useCakeAttributes, type CakeAttributeDto } from '@/entities/vendor';
import { useCreateCakeAttribute, useUpdateCakeAttribute } from '@/features/manage-cake-attributes';

export function AdminCakeCatalogPage() {
  const { busy, run, error } = useAction();
  // FR-54: `GET /api/cake-attributes` — danh mục vỏ và nhân do vendor-service sở hữu.
  const listQuery = useCakeAttributes({ includeHidden: true });
  const createAttribute = useCreateCakeAttribute();
  const updateAttribute = useUpdateCakeAttribute();

  const [createOpen, setCreateOpen] = useState(false);
  const [group, setGroup] = useState<'CRUST' | 'FILLING'>('CRUST');
  const [label, setLabel] = useState('');

  const attributes = listQuery.kind === 'loaded' ? listQuery.data : [];
  const crusts = attributes.filter((a) => a.group === 'CRUST');
  const fillings = attributes.filter((a) => a.group === 'FILLING');

  function handleCreate() {
    if (!label.trim()) {
      toast.warning('Vui lòng nhập tên giá trị.');
      return;
    }
    void run(async () => {
      // AC-54.1: admin thêm một giá trị; `code` và thứ tự do backend sinh từ nhãn.
      await createAttribute({ group, label: label.trim() });
      toast.success(`Đã thêm giá trị "${label.trim()}" vào danh mục.`);
      setLabel('');
      setCreateOpen(false);
      listQuery.reload();
    });
  }

  function handleToggleActive(attribute: CakeAttributeDto) {
    void run(async () => {
      // AC-54.3: chỉ đổi nhãn / thứ tự / trạng thái; `code` không bao giờ đổi.
      await updateAttribute(attribute.id, { active: !attribute.active });
      toast.success(
        attribute.active
          ? `Đã ẩn "${attribute.label}" khỏi bộ lọc của khách hàng.`
          : `Đã hiện "${attribute.label}" trong bộ lọc.`,
      );
      listQuery.reload();
    });
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Quản Trị', to: routes.admin.overview },
          { label: 'Cấu hình hệ thống', to: routes.admin.config },
          { label: 'Từ điển vỏ & nhân bánh' },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Danh mục vỏ và nhân bánh</h1>
          <p className={styles.subtitle}>
            Chuẩn hóa danh mục phân loại để khách hàng lọc chính xác hương vị bánh trên toàn sàn
          </p>
        </div>
        <Button variant="primary" iconLeft="plus" onClick={() => setCreateOpen(true)}>
          Thêm giá trị
        </Button>
      </div>

      {error && (
        <p role="alert" className={styles.errorText}>
          {error}
        </p>
      )}

      <AsyncState
        state={listQuery}
        onRetry={listQuery.reload}
        loadingMessage="Đang tải danh mục vỏ & nhân..."
        isEmpty={(data) => data.length === 0}
        empty={<p className={styles.subtitle}>Danh mục chưa có giá trị nào.</p>}
      >
        {() => (
          <div className={styles.gridTwo}>
            <Card padding="lg" className={styles.cardBody}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Loại vỏ bánh</h2>
                <Button
                  size="sm"
                  variant="outline"
                  iconLeft="plus"
                  onClick={() => {
                    setGroup('CRUST');
                    setCreateOpen(true);
                  }}
                >
                  Thêm Vỏ
                </Button>
              </div>
              <div className={styles.attributeList}>
                {crusts.map((c) => (
                  <div key={c.id} className={styles.attributeRow}>
                    <div>
                      <strong className={styles.attributeName}>{c.label}</strong>
                      <div className={styles.attributeCode}>
                        code: {c.code} · thứ tự: {c.sortOrder}
                      </div>
                    </div>
                    <div className={styles.rowActions}>
                      <Badge tone={c.active ? 'gold' : 'neutral'}>
                        {c.active ? 'Đang hiện' : 'Đang ẩn'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={busy}
                        onClick={() => handleToggleActive(c)}
                      >
                        {c.active ? 'Ẩn' : 'Hiện'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="lg" className={styles.cardBody}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Vị nhân bánh</h2>
                <Button
                  size="sm"
                  variant="outline"
                  iconLeft="plus"
                  onClick={() => {
                    setGroup('FILLING');
                    setCreateOpen(true);
                  }}
                >
                  Thêm Nhân
                </Button>
              </div>
              <div className={styles.attributeList}>
                {fillings.map((f) => (
                  <div key={f.id} className={styles.attributeRow}>
                    <div>
                      <strong className={styles.attributeName}>{f.label}</strong>
                      <div className={styles.attributeCode}>
                        code: {f.code} · thứ tự: {f.sortOrder}
                      </div>
                    </div>
                    <div className={styles.rowActions}>
                      <Badge tone={f.active ? 'green' : 'neutral'}>
                        {f.active ? 'Đang hiện' : 'Đang ẩn'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={busy}
                        onClick={() => handleToggleActive(f)}
                      >
                        {f.active ? 'Ẩn' : 'Hiện'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </AsyncState>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={`Thêm ${group === 'CRUST' ? 'loại vỏ' : 'vị nhân'} mới`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={busy} onClick={handleCreate}>
              Thêm giá trị
            </Button>
          </>
        }
      >
        <div className={styles.modalBody}>
          <p className={styles.modalSub}>
            Mã giá trị (<code>code</code>) và thứ tự hiển thị do hệ thống sinh từ tên này. Tên trùng
            sẽ bị từ chối (409 VENDOR_020).
          </p>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="attribute-label">
              Tên hiển thị *
            </label>
            <Input
              id="attribute-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={group === 'CRUST' ? 'VD: Bánh nướng' : 'VD: Thập cẩm'}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

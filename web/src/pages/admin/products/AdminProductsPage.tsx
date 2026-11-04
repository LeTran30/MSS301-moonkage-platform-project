import { useMemo, useState } from 'react';
import { AsyncState, Badge, Button, Modal, toast } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils';
import { useAction } from '@/shared/lib';
import { useChangeProductStatus } from '@/features/edit-product';
import { usePlatformProducts, type AdminProductRow } from '@/features/moderate-products';
import styles from './AdminProductsPage.module.css';

type AdminProductTab = 'ALL' | 'ACTIVE' | 'FLAGGED';

export function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState<AdminProductTab>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<AdminProductRow | null>(null);
  const [takeDownModalOpen, setTakeDownModalOpen] = useState(false);
  const [takeDownReason, setTakeDownReason] = useState(
    'Vi phạm quy định thông tin nguyên liệu hoặc nhãn hiệu chưa được cấp phép.'
  );
  const { busy, run, error } = useAction();
  const changeProductStatus = useChangeProductStatus();

  /**
   * FR-46: quản trị viên gỡ sản phẩm vi phạm vĩnh viễn (REMOVED, kèm lý do).
   *
   * `catalog-service` chỉ công khai sản phẩm `ON_SALE`; mọi trạng thái nằm ở
   * `vendor-service` (`GET /api/vendors/{vendorId}/products`). Admin lấy danh sách
   * xưởng trước, rồi đọc sản phẩm của từng xưởng.
   */
  const listQuery = usePlatformProducts();

  const filteredProducts = useMemo(() => {
    const products = listQuery.kind === 'loaded' ? listQuery.data : [];
    if (activeTab === 'ACTIVE') return products.filter((p) => p.status === 'ON_SALE');
    if (activeTab === 'FLAGGED') {
      return products.filter((p) => p.status === 'HIDDEN' || p.status === 'REMOVED');
    }
    return products;
  }, [listQuery, activeTab]);

  const handleOpenTakeDown = (p: AdminProductRow) => {
    setSelectedProduct(p);
    setTakeDownModalOpen(true);
  };

  const handleConfirmTakeDown = () => {
    if (!selectedProduct) return;
    if (!takeDownReason.trim()) {
      toast.warning('Vui lòng nhập lý do gỡ sản phẩm.');
      return;
    }
    void run(async () => {
      // FR-46: admin gỡ sản phẩm vĩnh viễn kèm lý do (BR-24: không xóa dữ liệu).
      await changeProductStatus(selectedProduct.vendorId ?? '', selectedProduct.id, {
        status: 'REMOVED',
        removedReason: takeDownReason.trim(),
      });
      toast.success(`Đã gỡ sản phẩm "${selectedProduct.name}" khỏi sàn.`);
      setTakeDownModalOpen(false);
      listQuery.reload();
    });
  };

  const handleRestore = (p: AdminProductRow) => {
    void run(async () => {
      // Không thể khôi phục sản phẩm đã REMOVED (BR-24); chỉ mở lại sản phẩm HIDDEN.
      if (p.status === 'REMOVED') {
        toast.warning('Sản phẩm đã bị gỡ vĩnh viễn nên không thể khôi phục (BR-24).');
        return;
      }
      await changeProductStatus(p.vendorId ?? '', p.id, { status: 'ON_SALE' });
      toast.success(`Đã khôi phục mở bán cho sản phẩm "${p.name}".`);
      listQuery.reload();
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Kiểm duyệt sản phẩm toàn sàn (Q3.0)</h1>
          <p className={styles.desc}>
            Giám sát danh mục bánh trung thu niêm yết, kiểm tra tiêu chuẩn phân loại Vỏ & Nhân (FR-54), gỡ bỏ sản phẩm vi phạm.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className={styles.modalError}>
          {error}
        </p>
      )}

      <div className={styles.ruleNotice}>
        ℹ️ <strong>BR-24:</strong> gỡ bỏ sản phẩm là trạng thái <strong>REMOVED</strong> có lý do, không phải
        xóa vĩnh viễn — dữ liệu đối soát và lịch sử đơn hàng vẫn giữ nguyên.
      </div>

      <AsyncState
        state={listQuery}
        onRetry={listQuery.reload}
        loadingMessage="Đang tải danh sách sản phẩm toàn sàn..."
        isEmpty={(data) => data.length === 0}
        empty={<p className={styles.desc}>Chưa có sản phẩm nào trên sàn.</p>}
      >
        {() => (
          <>
            <div className={styles.tabRow}>
              {(
                [
                  { id: 'ALL', label: `Tất cả sản phẩm (${listQuery.kind === 'loaded' ? listQuery.data.length : 0})` },
                  { id: 'ACTIVE', label: 'Đang hiển thị bán' },
                  { id: 'FLAGGED', label: 'Bị gỡ / Tạm dừng' },
                ] as Array<{ id: AdminProductTab; label: string }>
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={activeTab === tab.id}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Hình ảnh & Tên bánh</th>
                    <th>Xưởng sản xuất</th>
                    <th>Giá niêm yết</th>
                    <th>Phân loại Vỏ (FR-54)</th>
                    <th>Phân loại Nhân (FR-54)</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className={styles.prodCell}>
                          <img
                            src={p.images?.[0]?.url || '/images/banh-nuong.jpg'}
                            alt={p.name ?? ''}
                            loading="lazy"
                            decoding="async"
                            className={styles.prodThumb}
                          />
                          <div>
                            <strong className={styles.prodName}>{p.name}</strong>
                            <span className={styles.prodSlug}>Hạn sử dụng: {p.expiryDate ?? '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.vendorName}>{p.vendorName || p.vendorId}</span>
                      </td>
                      <td>
                        <strong className={styles.price}>{formatCurrency(p.listPrice ?? 0)}</strong>
                      </td>
                      <td>
                        <div className={styles.chipList}>
                          {(p.crustCodes ?? []).map((c) => (
                            <span key={c} className={styles.chip}>{c}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className={styles.chipList}>
                          {(p.fillingCodes ?? []).map((f) => (
                            <span key={f} className={styles.chip}>{f}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <Badge tone={p.status === 'ON_SALE' ? 'green' : 'red'}>
                          {p.status === 'ON_SALE' ? 'Đang mở bán' : p.status === 'HIDDEN' ? 'Đang ẩn' : 'Đã bị gỡ'}
                        </Badge>
                      </td>
                      <td>
                        {p.status === 'ON_SALE' ? (
                          <Button variant="danger" size="sm" onClick={() => handleOpenTakeDown(p)}>
                            Gỡ bỏ
                          </Button>
                        ) : (
                          <Button variant="secondary" size="sm" loading={busy} onClick={() => handleRestore(p)}>
                            Khôi phục
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AsyncState>

      {/* Modal Take Down (Q3.0) */}
      <Modal
        open={takeDownModalOpen}
        onClose={() => setTakeDownModalOpen(false)}
        title={`Gỡ sản phẩm vi phạm: ${selectedProduct?.name ?? ''}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTakeDownModalOpen(false)}>Hủy</Button>
            <Button variant="danger" loading={busy} onClick={handleConfirmTakeDown}>Xác nhận gỡ sản phẩm</Button>
          </>
        }
      >
        <div className={styles.modalBody}>
          <p className={styles.modalSub}>
            Sản phẩm bị gỡ sẽ ngay lập tức biến mất khỏi trang chủ và kết quả tìm kiếm.
            Một thông báo lý do sẽ được gửi tự động tới gian hàng <strong>{selectedProduct?.vendorName}</strong>.
          </p>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="take-down-reason">Lý do gỡ sản phẩm *</label>
            <textarea
              id="take-down-reason"
              className={styles.textarea}
              rows={3}
              value={takeDownReason}
              onChange={(e) => setTakeDownReason(e.target.value)}
              placeholder="Nhập lý do chi tiết..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

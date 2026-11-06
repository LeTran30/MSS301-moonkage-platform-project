import { useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { AsyncState, Button, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useTaxonomy } from '@/entities/product';
import { useCurrentUser } from '@/entities/user';
import { useOwnVendorId, useVendorProducts, type VendorProductDto } from '@/entities/vendor';
import { VendorProductCard } from '@/entities/vendor';
import { useChangeProductStatus } from '@/features/edit-product';
import styles from './VendorProductsPage.module.css';

/**
 * B4.0 — sản phẩm của gian hàng (FR-30, FR-34). Thêm và sửa mở form B4.1.
 */
export function VendorProductsPage() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  // FR-29: `vendorId` là id gian hàng của chủ Shop; backend tự lấy từ token,
  // nên ta hỏi `GET /api/vendors/by-owner` để có id thật.
  const vendorId = useOwnVendorId(user.vendorId);
  const { busy, run, error } = useAction();
  const changeProductStatus = useChangeProductStatus();
  const { crusts, fillings } = useTaxonomy();
  const attributeName = (code: string) =>
    [...crusts, ...fillings].find((item) => item.code === code)?.name ?? code;

  // FR-30: `GET /api/vendors/{vendorId}/products` — mọi trạng thái, mới nhất trước.
  const listQuery = useVendorProducts(vendorId);

  const handleToggleVisibility = (product: VendorProductDto) => {
    void run(async () => {
      // FR-34: chủ Shop chỉ đổi được ON_SALE <-> HIDDEN, không xóa vĩnh viễn (BR-24).
      const next = product.status === 'ON_SALE' ? 'HIDDEN' : 'ON_SALE';
      await changeProductStatus(vendorId, product.id, { status: next });
      toast.success(
        next === 'ON_SALE'
          ? `Đã bật hiển thị sản phẩm "${product.name}".`
          : `Đã ẩn sản phẩm "${product.name}".`
      );
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý sản phẩm (B4.0, B4.1)</h1>
          <p className={styles.desc}>
            Đăng bán sản phẩm bán sẵn, cấu hình danh mục Vỏ &amp; Nhân (FR-54), bật/tắt hiển thị gian
            hàng.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate(routes.vendor.productNew)} disabled={!vendorId}>
          + Thêm sản phẩm mới
        </Button>
      </div>

      {error && (
        <p role="alert" className={styles.modalError}>
          {error}
        </p>
      )}

      <div className={styles.ruleNotice}>
        ℹ️ <strong>Quy định sàn Moonkage:</strong> Nhằm bảo đảm tính minh bạch và lịch sử đối soát,
        sản phẩm không thể xóa vĩnh viễn khỏi hệ thống mà chỉ có thể <strong>Ẩn / Tạm dừng bán</strong>{' '}
        (BR-24).
      </div>

      <AsyncState
        state={listQuery}
        onRetry={listQuery.reload}
        loadingMessage="Đang tải sản phẩm của gian hàng..."
        isEmpty={(data) => data.length === 0}
        empty={
          <p className={styles.desc}>
            Gian hàng chưa có sản phẩm nào. Bấm “Thêm sản phẩm mới” để đăng bán món đầu tiên.
          </p>
        }
      >
        {(products) => (
          <div className={styles.productsGrid}>
            {products.map((p) => (
              <VendorProductCard
                key={p.id}
                product={p}
                busy={busy}
                onToggleVisibility={handleToggleVisibility}
                onEdit={(product) => navigate(routes.vendor.product(product.id))}
                attributeName={attributeName}
              />
            ))}
          </div>
        )}
      </AsyncState>
    </div>
  );
}

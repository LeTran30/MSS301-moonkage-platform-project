import { useState } from 'react';
import { AsyncState, Button, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useCurrentUser } from '@/entities/user';
import { useMyVendorId, useVendorProducts, type VendorProductDto } from '@/entities/vendor';
import { VendorProductCard } from '@/entities/vendor';
import { useTaxonomy, type CakeCrust, type CakeFilling } from '@/entities/product';
import {
  ProductFormModal,
  useChangeProductStatus,
  useLoadVendorProduct,
  useSaveProduct,
} from '@/features/edit-product';
import { useUploadProductImage } from '@/features/upload-product-image';
import styles from './VendorProductsPage.module.css';

export function VendorProductsPage() {
  const user = useCurrentUser();
  // FR-29: `vendorId` là id gian hàng của chủ Shop; backend tự lấy từ token,
  // nên ta hỏi `GET /api/vendors/by-owner` để có id thật.
  const myVendorId = useMyVendorId();
  const vendorId = user.vendorId || (myVendorId.kind === 'loaded' ? myVendorId.data ?? '' : '');
  const { crusts, fillings } = useTaxonomy();
  const { busy, run, error } = useAction();
  const saveProduct = useSaveProduct();
  const changeProductStatus = useChangeProductStatus();
  const loadVendorProduct = useLoadVendorProduct();
  const uploadProductImage = useUploadProductImage();

  // FR-30: `GET /api/vendors/{vendorId}/products` — mọi trạng thái, mới nhất trước.
  const listQuery = useVendorProducts(vendorId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VendorProductDto | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('135000');
  const [stock, setStock] = useState('100');
  const [selectedCrusts, setSelectedCrusts] = useState<CakeCrust[]>([]);
  const [selectedFillings, setSelectedFillings] = useState<CakeFilling[]>([]);
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // FR-29: ảnh của sản phẩm — `tempKey` của file vừa tải lên, hoặc key đã lưu.
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleOpenAdd = () => {
    setEditing(null);
    setName('');
    setPrice('135000');
    setStock('150');
    setSelectedCrusts([]);
    setSelectedFillings([]);
    setDescription('Bánh trung thu nướng truyền thống chuẩn vị cổ truyền.');
    setErrorMessage(null);
    setImageKeys([]);
    setModalOpen(true);
  };

  const handleOpenEdit = async (product: VendorProductDto) => {
    setErrorMessage(null);
    // FR-30: đọc phiên bản trước khi sửa; gửi lại khi thay thế (409 VENDOR_027 nếu có người sửa trước).
    const full = (await loadVendorProduct(vendorId, product.id)) ?? product;
    setEditing(full);
    setName(full.name ?? '');
    setPrice(String(full.listPrice ?? 0));
    setStock(String(full.stock ?? 0));
    setSelectedCrusts((full.crustCodes ?? []) as CakeCrust[]);
    setSelectedFillings((full.fillingCodes ?? []) as CakeFilling[]);
    setDescription(full.description ?? '');
    // FR-29: giữ lại key của ảnh đã có, để không mất ảnh khi thay thế sản phẩm.
    setImageKeys((full.images ?? []).map((image) => image.key));
    setModalOpen(true);
  };

  /** FR-29: tải ảnh lên kho lưu trữ rồi giữ `tempKey` để gửi kèm sản phẩm. */
  const handleUploadImage = async (file: File) => {
    setUploadingImage(true);
    setErrorMessage(null);
    try {
      const key = await uploadProductImage(vendorId, file);
      if (!key) {
        setErrorMessage('Máy chủ không trả về khóa ảnh. Vui lòng thử lại.');
        return;
      }
      setImageKeys((prev) => [...prev, key]);
      toast.success('Đã tải ảnh lên. Nhớ bấm "Lưu sản phẩm" để gắn ảnh vào sản phẩm.');
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Không tải được ảnh lên.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (key: string) => {
    setImageKeys((prev) => prev.filter((k) => k !== key));
  };

  const handleToggleCrust = (c: CakeCrust) => {
    setSelectedCrusts((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const handleToggleFilling = (f: CakeFilling) => {
    setSelectedFillings((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

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
      listQuery.reload();
    });
  };

  const handleSaveProduct = () => {
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên sản phẩm.');
      return;
    }
    if (selectedCrusts.length === 0) {
      setErrorMessage('Quy định FR-54: Sản phẩm bắt buộc phải gắn ít nhất 1 loại Vỏ bánh.');
      return;
    }
    if (selectedFillings.length === 0) {
      setErrorMessage('Quy định FR-54: Sản phẩm bắt buộc phải gắn ít nhất 1 loại Nhân bánh.');
      return;
    }

    void run(async () => {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        listPrice: Number(price),
        stock: Number(stock),
        crustCodes: selectedCrusts,
        fillingCodes: selectedFillings,
        // FR-29: `imageKeys` là `tempKey` của file vừa tải lên, không phải URL.
        imageKeys,
      };

      if (editing) {
        // FR-30, FR-32, FR-33: thay thế cả sản phẩm kèm phiên bản đã đọc.
        await saveProduct(vendorId, editing.id, {
          ...payload,
          version: editing.version,
        });
        toast.success(`Đã cập nhật sản phẩm "${name}" thành công!`);
      } else {
        // FR-29: sản phẩm mới đã mở bán ngay (BR-24).
        await saveProduct(vendorId, null, payload);
        toast.success(`Đã thêm mới sản phẩm "${name}" vào danh mục shop!`);
      }

      setModalOpen(false);
      listQuery.reload();
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
        <Button variant="primary" onClick={handleOpenAdd} disabled={!vendorId}>
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
                onEdit={(product) => void handleOpenEdit(product)}
              />
            ))}
          </div>
        )}
      </AsyncState>

      {/* Modal Add / Edit (B4.1, FR-54) */}
      <ProductFormModal
        open={modalOpen}
        editingName={editing?.name}
        name={name}
        price={price}
        stock={stock}
        description={description}
        selectedCrusts={selectedCrusts}
        selectedFillings={selectedFillings}
        crusts={crusts}
        fillings={fillings}
        imageKeys={imageKeys}
        uploadingImage={uploadingImage}
        busy={busy}
        errorMessage={errorMessage}
        onNameChange={setName}
        onPriceChange={setPrice}
        onStockChange={setStock}
        onDescriptionChange={setDescription}
        onToggleCrust={handleToggleCrust}
        onToggleFilling={handleToggleFilling}
        onUploadImage={(file) => void handleUploadImage(file)}
        onRemoveImage={handleRemoveImage}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveProduct}
      />
    </div>
  );
}

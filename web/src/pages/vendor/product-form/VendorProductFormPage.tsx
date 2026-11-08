import styles from './VendorProductFormPage.module.css';
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Button, Card, Breadcrumbs, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useCurrentUser } from '@/entities/user';
import {
  useMyVendorDetail,
  useOwnVendorId,
  useVendorProduct,
  type SaveVendorProductPayload,
} from '@/entities/vendor';
import {
  MAX_PRODUCT_IMAGES,
  ProductBasicsFields,
  ProductDeliveryDescription,
  ProductImagesField,
  ProductPackagingFields,
  ProductSupplyFields,
  ProductTaxonomyPicker,
  useSaveProduct,
} from '@/features/edit-product';
import { useUploadProductImage } from '@/features/upload-product-image';
import { useTaxonomy, type CakeCrust, type CakeFilling } from '@/entities/product';

/**
 * B4.1 — đăng sản phẩm mới hoặc thay thế một sản phẩm (FR-29 đến FR-33, FR-54).
 *
 * Đây là form sản phẩm duy nhất của kênh bán; danh sách B4.0 mở trang này để
 * thêm và sửa. Các trường bắt buộc khớp `ProductDetails` của vendor-service.
 */
export function VendorProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'moi');
  const user = useCurrentUser();
  const vendorId = useOwnVendorId(user.vendorId);
  const vendorDetail = useMyVendorDetail(vendorId || null);
  const supplySource = vendorDetail.kind === 'loaded' ? vendorDetail.data?.supplySource : undefined;
  const { busy, run, error } = useAction();
  const saveProduct = useSaveProduct();
  const uploadProductImage = useUploadProductImage();

  const { crusts: taxonomyCrusts, fillings: taxonomyFillings } = useTaxonomy();

  // FR-30: đọc sản phẩm kèm `version` để gửi lại khi thay thế (409 VENDOR_027).
  const asyncProduct = useVendorProduct(vendorId, isEdit ? (id as string) : null);
  const existing = asyncProduct.kind === 'loaded' ? asyncProduct.data : null;

  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [bulkThreshold, setBulkThreshold] = useState<number>(30);
  const [deliveryLabel, setDeliveryLabel] = useState<'LOCAL' | 'NATIONWIDE'>('NATIONWIDE');
  const [description, setDescription] = useState('');
  const [selectedCrusts, setSelectedCrusts] = useState<CakeCrust[]>([]);
  const [selectedFillings, setSelectedFillings] = useState<CakeFilling[]>([]);
  const [resold, setResold] = useState(false);
  const [brand, setBrand] = useState('');
  const [origin, setOrigin] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [piecesPerBox, setPiecesPerBox] = useState('');
  // FR-29: `key` là tempKey của ảnh vừa tải lên hoặc key của ảnh đã lưu.
  const [images, setImages] = useState<Array<{ key: string; url?: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Nạp giá trị của sản phẩm đang sửa vào form (một lần khi tải xong).
  if (existing && !hydrated) {
    setHydrated(true);
    setName(existing.name ?? '');
    setPrice(existing.listPrice ?? 0);
    setStock(existing.stock ?? 0);
    setBulkThreshold(existing.quoteThreshold ?? 30);
    setDeliveryLabel(existing.deliveryLabel === 'LOCAL' ? 'LOCAL' : 'NATIONWIDE');
    setDescription(existing.description ?? '');
    setSelectedCrusts((existing.crustCodes ?? []) as CakeCrust[]);
    setSelectedFillings((existing.fillingCodes ?? []) as CakeFilling[]);
    setResold(Boolean(existing.resold));
    setBrand(existing.brand ?? '');
    setOrigin(existing.origin ?? '');
    setExpiryDate(existing.expiryDate ?? '');
    setPiecesPerBox(existing.piecesPerBox ? String(existing.piecesPerBox) : '');
    setImages(
      (existing.images ?? []).map((image) => ({
        key: image.key,
        url: image.url,
      })),
    );
  }

  // RESELL luôn là bán lại, SELF_PRODUCED không bao giờ; BOTH do chủ Shop chọn (AC-29.2).
  const isResold = supplySource === 'RESELL' || (supplySource === 'BOTH' && resold);

  function toggleCrust(code: CakeCrust) {
    setSelectedCrusts((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function toggleFilling(code: CakeFilling) {
    setSelectedFillings((prev) =>
      prev.includes(code) ? prev.filter((f) => f !== code) : [...prev, code],
    );
  }

  async function handleUploadImage(file: File) {
    setUploading(true);
    try {
      const key = await uploadProductImage(vendorId, file);
      if (!key) {
        toast.error('Máy chủ không trả về khóa ảnh. Vui lòng thử lại.');
        return;
      }
      setImages((prev) => [...prev, { key }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không tải được ảnh lên.');
    } finally {
      setUploading(false);
    }
  }

  /** The first rule the form breaks, in the order the fields appear; null when it can be sent. */
  function firstProblem(): string | null {
    if (!name.trim()) return 'Vui lòng nhập tên sản phẩm.';
    if (price <= 0) return 'Vui lòng nhập giá bán lẻ.';
    if (stock < 0) return 'Tồn kho không được âm.';
    if (isResold && (!brand.trim() || !origin.trim())) {
      return 'Bánh bán lại cần ghi rõ thương hiệu và xuất xứ.';
    }
    if (!expiryDate) return 'Vui lòng chọn hạn sử dụng.';
    if (selectedCrusts.length === 0) return ': Sản phẩm bắt buộc gắn ít nhất 1 loại Vỏ bánh.';
    if (selectedFillings.length === 0) return ': Sản phẩm bắt buộc gắn ít nhất 1 loại Nhân bánh.';
    if (images.length === 0) return `Sản phẩm cần ít nhất 1 ảnh (tối đa ${MAX_PRODUCT_IMAGES}).`;
    if (!description.trim()) return 'Vui lòng nhập mô tả sản phẩm.';
    return null;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const problem = firstProblem();
    if (problem) {
      toast.warning(problem);
      return;
    }

    void run(async () => {
      const payload: SaveVendorProductPayload = {
        // Only a BOTH shop sends `resold`; the others have one value only.
        ...(supplySource === 'BOTH' ? { resold } : {}),
        name: name.trim(),
        description: description.trim(),
        ...(brand.trim() ? { brand: brand.trim() } : {}),
        ...(origin.trim() ? { origin: origin.trim() } : {}),
        ...(piecesPerBox ? { piecesPerBox: Number(piecesPerBox) } : {}),
        listPrice: price,
        stock,
        expiryDate,
        deliveryLabel,
        quoteThreshold: bulkThreshold,
        imageKeys: images.map((image) => image.key),
        crustCodes: selectedCrusts,
        fillingCodes: selectedFillings,
      };

      if (isEdit && existing) {
        await saveProduct(vendorId, existing.id, {
          ...payload,
          version: existing.version,
        });
      } else {
        await saveProduct(vendorId, null, payload);
      }

      toast.success(
        isEdit
          ? 'Đã cập nhật thông tin sản phẩm bánh thành công!'
          : 'Đã đăng bán sản phẩm mới lên sàn Moonkage!',
      );
      navigate(routes.vendor.products);
    });
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Kênh Xưởng', to: routes.vendor.overview },
          { label: 'Quản lý sản phẩm', to: routes.vendor.products },
          { label: isEdit ? 'Chỉnh sửa sản phẩm' : 'Đăng sản phẩm mới' },
        ]}
      />

      <div className={styles.header}>
        <h1 className={styles.title}>
          {isEdit ? `Cập nhật: ${existing?.name ?? ''}` : 'Đăng sản phẩm mới'}
        </h1>
      </div>

      {error && (
        <p role="alert" className={styles.errorText}>
          {error}
        </p>
      )}

      <Card padding="lg" className={styles.lead}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <ProductBasicsFields
            name={name}
            price={price}
            stock={stock}
            bulkThreshold={bulkThreshold}
            onNameChange={setName}
            onPriceChange={setPrice}
            onStockChange={setStock}
            onBulkThresholdChange={setBulkThreshold}
          />

          <ProductSupplyFields
            supplySource={supplySource}
            resold={isResold}
            brand={brand}
            origin={origin}
            onResoldChange={setResold}
            onBrandChange={setBrand}
            onOriginChange={setOrigin}
          />

          <ProductPackagingFields
            expiryDate={expiryDate}
            piecesPerBox={piecesPerBox}
            onExpiryDateChange={setExpiryDate}
            onPiecesPerBoxChange={setPiecesPerBox}
          />

          <ProductTaxonomyPicker
            crusts={taxonomyCrusts}
            fillings={taxonomyFillings}
            selectedCrusts={selectedCrusts}
            selectedFillings={selectedFillings}
            onToggleCrust={toggleCrust}
            onToggleFilling={toggleFilling}
          />

          <ProductImagesField
            images={images}
            uploading={uploading}
            onUpload={(file) => void handleUploadImage(file)}
            onRemove={(key) => setImages((prev) => prev.filter((image) => image.key !== key))}
          />

          <ProductDeliveryDescription
            deliveryLabel={deliveryLabel}
            description={description}
            onDeliveryLabelChange={setDeliveryLabel}
            onDescriptionChange={setDescription}
          />

          <div className={styles.actions}>
            <Button
              type="submit"
              variant="primary"
              loading={busy}
              disabled={!vendorId || uploading}
            >
              {isEdit ? 'Lưu Thay Đổi Sản Phẩm' : 'Đăng Bán Ngay'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(routes.vendor.products)}
            >
              Hủy
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

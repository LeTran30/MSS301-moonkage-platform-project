import styles from './VendorProductFormPage.module.css';
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Button, Card, Breadcrumbs, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useCurrentUser } from '@/entities/user';
import { useVendorProduct } from '@/entities/vendor';
import {
  ProductBasicsFields,
  ProductDeliveryDescription,
  ProductTaxonomyPicker,
  useSaveProduct,
} from '@/features/edit-product';
import { useTaxonomy, type CakeCrust, type CakeFilling } from '@/entities/product';

export function VendorProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'moi');
  const user = useCurrentUser();
  const vendorId = user.vendorId || '';
  const { busy, run, error } = useAction();
  const saveProduct = useSaveProduct();

  const { crusts: taxonomyCrusts, fillings: taxonomyFillings } = useTaxonomy();

  // FR-30: đọc sản phẩm kèm `version` để gửi lại khi thay thế (409 VENDOR_027).
  const asyncProduct = useVendorProduct(vendorId, isEdit ? (id as string) : null);

  const existing = asyncProduct.kind === 'loaded' ? asyncProduct.data : null;

  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(120000);
  const [stock, setStock] = useState<number>(50);
  const [bulkThreshold, setBulkThreshold] = useState<number>(30);
  const [deliveryLabel, setDeliveryLabel] = useState<'LOCAL' | 'NATIONWIDE'>('NATIONWIDE');
  const [description, setDescription] = useState('');
  const [selectedCrusts, setSelectedCrusts] = useState<CakeCrust[]>([]);
  const [selectedFillings, setSelectedFillings] = useState<CakeFilling[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Nạp giá trị của sản phẩm đang sửa vào form (một lần khi tải xong).
  if (existing && !hydrated) {
    setHydrated(true);
    setName(existing.name ?? '');
    setPrice(existing.listPrice ?? 120000);
    setStock(existing.stock ?? 50);
    setBulkThreshold(existing.quoteThreshold ?? 30);
    setDeliveryLabel(existing.deliveryLabel === 'LOCAL' ? 'LOCAL' : 'NATIONWIDE');
    setDescription(existing.description ?? '');
    setSelectedCrusts((existing.crustCodes ?? []) as CakeCrust[]);
    setSelectedFillings((existing.fillingCodes ?? []) as CakeFilling[]);
  }

  function toggleCrust(code: CakeCrust) {
    setSelectedCrusts((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  function toggleFilling(code: CakeFilling) {
    setSelectedFillings((prev) => (prev.includes(code) ? prev.filter((f) => f !== code) : [...prev, code]));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Vui lòng nhập tên sản phẩm.');
      return;
    }
    if (selectedCrusts.length === 0 || selectedFillings.length === 0) {
      toast.warning('FR-54: Sản phẩm bắt buộc phải gắn ít nhất 1 loại Vỏ và 1 loại Nhân.');
      return;
    }

    void run(async () => {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        listPrice: price,
        stock,
        quoteThreshold: bulkThreshold,
        deliveryLabel,
        crustCodes: selectedCrusts,
        fillingCodes: selectedFillings,
      };

      if (isEdit && existing) {
        await saveProduct(vendorId, existing.id, { ...payload, version: existing.version });
      } else {
        await saveProduct(vendorId, null, payload);
      }

      toast.success(
        isEdit
          ? 'Đã cập nhật thông tin sản phẩm bánh thành công!'
          : 'Đã đăng bán sản phẩm mới lên sàn Moonkage!'
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
          {isEdit
            ? `Cập Nhật Bánh #${existing?.id ?? id}`
            : 'Đăng Sản Phẩm Bánh Trung Thu Mới (B4.1)'}
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

          <ProductTaxonomyPicker
            crusts={taxonomyCrusts}
            fillings={taxonomyFillings}
            selectedCrusts={selectedCrusts}
            selectedFillings={selectedFillings}
            onToggleCrust={toggleCrust}
            onToggleFilling={toggleFilling}
          />

          <ProductDeliveryDescription
            deliveryLabel={deliveryLabel}
            description={description}
            onDeliveryLabelChange={setDeliveryLabel}
            onDescriptionChange={setDescription}
          />

          <div className={styles.actions}>
            <Button type="submit" variant="primary" loading={busy}>
              {isEdit ? 'Lưu Thay Đổi Sản Phẩm' : 'Đăng Bán Ngay'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(routes.vendor.products)}>
              Hủy
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

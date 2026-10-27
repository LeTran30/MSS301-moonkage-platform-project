import { useNavigate, useParams } from 'react-router-dom';
import { ProductCard } from '@/entities/product';
import { useVendorContext } from '@/entities/vendor';
import { OpenOnly } from '@/entities/vendor';
import { useVendorProduct } from '@/entities/vendor';
import { VendorProductEditor } from '@/features/edit-product';
import { newItemSlug, routes } from '@/shared/config/routes';
import { LoadingState } from '@/shared/ui';

/** B4.1: `new` adds a product. */
export function VendorProductPage() {
  const { productId = newItemSlug } = useParams();
  const navigate = useNavigate();
  const profile = useVendorContext();
  const product = useVendorProduct(productId === newItemSlug ? '' : productId);
  if (productId !== newItemSlug && product.kind === 'loading') return <LoadingState />;
  const current = product.kind === 'loaded' ? product.data : null;
  return (
    <OpenOnly>
      <VendorProductEditor
        key={productId}
        product={current}
        shopName={profile.shopName}
        onSaved={() => navigate(routes.vendor.products)}
        onCancel={() => navigate(routes.vendor.products)}
        preview={(v) => (
          <ProductCard
            product={{
              id: current?.id ?? 'preview',
              name: v.name,
              shopId: 'preview',
              shopName: profile.shopName,
              district: null,
              brand: profile.shopName,
              crust: 'nuong',
              fillings: [],
              price: v.price,
              rating: null,
              reviewCount: 0,
              deliverTo: [],
              pack: 'Quy cách theo mô tả',
              stock: current?.stock ?? 0,
              images: [],
            }}
          />
        )}
      />
    </OpenOnly>
  );
}

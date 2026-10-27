import { ProductGrid, productStrings, useFeaturedProducts } from '@/entities/product';
import { useCurrentUser } from '@/entities/user';
import { vendorDirectoryStrings, useFeaturedVendors, VendorTile } from '@/entities/vendor';
import { AddToCartButton } from '@/features/add-to-cart';
import { AreaPicker, areaStrings, useDeliveryArea } from '@/features/choose-delivery-area';
import { QuickFilters } from '@/features/filter-products';
import { useLoginRedirect } from '@/features/login';
import { routes } from '@/shared/config/routes';
import { ErrorState, LoadingState, SectionHeader } from '@/shared/ui';
import { HomeHero, MoneyFlow } from '@/widgets/buying-guide';
import styles from './HomePage.module.css';

/**
 * M1.0, five blocks: hero photo · quick search · available in [area] · vendors taking custom orders ·
 * where your money goes.
 */
export function HomePage() {
  const session = useCurrentUser();
  const { area, chosen } = useDeliveryArea();
  const products = useFeaturedProducts(area);
  const vendors = useFeaturedVendors();
  const toLogin = useLoginRedirect();

  return (
    <div className="home">
      <HomeHero
        area={area}
        areaPrompt={
          !chosen && (
            <div className="home-hero__prompt">
              {areaStrings.prompt} <AreaPicker variant="link" /> {areaStrings.promptTail}
            </div>
          )
        }
      />

      <div className={`shop__inner ${styles.homeBody}`}>
        <QuickFilters />

        {/* the whole block is hidden when nothing is delivered to the area (wireframe M1.0) */}
        {!(products.kind === 'loaded' && products.data.length === 0) && (
        <section aria-labelledby="available-heading">
          <SectionHeader id="available-heading" title={productStrings.homeSection(area)} linkTo={routes.base.products} linkLabel={productStrings.seeAll} />
          {products.kind === 'loading' && <LoadingState />}
          {products.kind === 'error' && <ErrorState message={products.message} onRetry={products.reload} />}
          {products.kind === 'loaded' && (
            <ProductGrid
              labelledBy="available-heading"
              products={products.data}
              renderAction={(p) => (
                <AddToCartButton productId={p.id} productName={p.name} size="sm" loggedIn={Boolean(session)} onNeedLogin={toLogin} />
              )}
            />
          )}
        </section>
        )}

        <section aria-labelledby="vendors-heading">
          <SectionHeader id="vendors-heading" title={vendorDirectoryStrings.homeSection} linkTo={routes.base.vendorDirectory} linkLabel={vendorDirectoryStrings.seeAll} />
          {vendors.kind === 'loading' && <LoadingState />}
          {vendors.kind === 'error' && <ErrorState message={vendors.message} onRetry={vendors.reload} />}
          {vendors.kind === 'loaded' && (
            <ul className={styles.vendorGrid}>
              {vendors.data.map((s) => (
                <li key={s.id}>
                  <VendorTile vendor={s} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <MoneyFlow />
      </div>
    </div>
  );
}

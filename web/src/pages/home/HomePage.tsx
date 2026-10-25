import { useAuth } from '../../features/auth';
import { HomeHero, MoneyFlow } from '../../features/buying-guide';
import { AddToCartButton } from '../../features/cart';
import { catalogStrings, ProductGrid, QuickFilters, useFeaturedProducts } from '../../features/catalog';
import { AreaPicker, areaStrings, useDeliveryArea } from '../../features/delivery-area';
import { supplierStrings, useFeaturedSuppliers, VendorTile } from '../../features/suppliers';
import { routes } from '../../shared/config/routes';
import { ErrorState, LoadingState, SectionHeader } from '../../shared/ui';
import { useLoginRedirect } from '../useLoginRedirect';

/**
 * M1.0, five blocks: hero photo · quick search · available in [area] · suppliers taking custom orders ·
 * where your money goes.
 */
export function HomePage() {
  const { session } = useAuth();
  const { area, chosen } = useDeliveryArea();
  const products = useFeaturedProducts(area);
  const suppliers = useFeaturedSuppliers();
  const toLogin = useLoginRedirect();

  return (
    <div className="home">
      <HomeHero
        area={area}
        areaPrompt={
          !chosen && (
            <p className="home-hero__prompt">
              {areaStrings.prompt} <AreaPicker variant="link" /> {areaStrings.promptTail}
            </p>
          )
        }
      />

      <div className="shop__inner home__body">
        <QuickFilters />

        {/* the whole block is hidden when nothing is delivered to the area (wireframe M1.0) */}
        {!(products.kind === 'loaded' && products.data.length === 0) && (
        <section aria-labelledby="available-heading">
          <SectionHeader id="available-heading" title={catalogStrings.homeSection(area)} linkTo={routes.products} linkLabel={catalogStrings.seeAll} />
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

        <section aria-labelledby="suppliers-heading">
          <SectionHeader id="suppliers-heading" title={supplierStrings.homeSection} linkTo={routes.suppliers} linkLabel={supplierStrings.seeAll} />
          {suppliers.kind === 'loading' && <LoadingState />}
          {suppliers.kind === 'error' && <ErrorState message={suppliers.message} onRetry={suppliers.reload} />}
          {suppliers.kind === 'loaded' && (
            <ul className="vendor-grid">
              {suppliers.data.map((s) => (
                <li key={s.id}>
                  <VendorTile supplier={s} />
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

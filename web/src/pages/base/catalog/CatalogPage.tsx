import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { routes } from '@/shared/config';
import { useDeliveryProvinceCode } from '@/entities/region';
import { AsyncState, Button, ButtonLink, EmptyState, Icon, Select } from '@/shared/ui';
import { useProgressiveList } from '@/shared/lib';
import {
  ProductCard,
  useTaxonomy,
  filterProducts,
  type CakeCrust,
  type CakeFilling,
  useProductCatalogFor,
} from '@/entities/product';
import styles from './CatalogPage.module.css';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawQ = searchParams.get('q') || '';
  const provinceCode = useDeliveryProvinceCode();
  const asyncProducts = useProductCatalogFor(provinceCode);
  const products = useMemo(() => {
    if (asyncProducts.kind !== 'loaded') return [];
    return asyncProducts.data.filter((p) => p.status === 'ACTIVE');
  }, [asyncProducts]);
  const { crusts, fillings } = useTaxonomy();

  const [selectedCrusts, setSelectedCrusts] = useState<CakeCrust[]>([]);
  const [selectedFillings, setSelectedFillings] = useState<CakeFilling[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<'price_asc' | 'price_desc' | 'rating'>('rating');

  // Lọc theo FR-06, AC-06.2 qua hàm dùng chung trong entities/product
  const filteredProducts = useMemo(() => {
    return filterProducts(products, {
      searchQuery: rawQ,
      crusts: selectedCrusts,
      fillings: selectedFillings,
      brand: selectedBrand,
      sortOption,
    });
  }, [products, rawQ, selectedCrusts, selectedFillings, selectedBrand, sortOption]);

  const brands = Array.from(new Set(products.map((p) => p.brand)));

  // Danh mục có thể dài: dựng DOM dần thay vì đổ tất cả một lúc.
  const { visibleItems, hasMore, loadMore, sentinelRef } = useProgressiveList(filteredProducts, 24);

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

  function resetFilters() {
    setSelectedCrusts([]);
    setSelectedFillings([]);
    setSelectedBrand('ALL');
    setSearchParams({});
  }

  return (
    <div className={styles.container}>
      {/* Breadcrumb & Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Bánh trung thu mua lẻ, giao tận nơi</h1>
        <p className={styles.lead}>
          Lựa chọn các hương vị bánh truyền thống và sáng tạo từ nhiều tiệm bánh uy tín.
          {rawQ && (
            <span>
              {' '}
              Kết quả tìm kiếm cho: <strong>"{rawQ}"</strong>
            </span>
          )}
        </p>
      </div>

      <div className={styles.layout}>
        {/* Bộ lọc phân mặt (Taxonomy) */}
        <aside className={styles.filterSidebar}>
          <div className={styles.filterHeader}>
            <span className={styles.filterTitle}>
              <Icon name="filter" size={16} /> Bộ lọc bánh
            </span>
            {(selectedCrusts.length > 0 ||
              selectedFillings.length > 0 ||
              selectedBrand !== 'ALL' ||
              rawQ) && (
              <button type="button" className={styles.clearBtn} onClick={resetFilters}>
                Bỏ chọn tất cả
              </button>
            )}
          </div>

          {/* Vỏ bánh */}
          <div className={styles.filterGroup}>
            <div className={styles.filterGroupTitle}>Vỏ bánh (Chọn nhiều)</div>
            <div className={styles.chipList}>
              {crusts
                .filter((c) => c.isActive)
                .map((c) => {
                  const isChecked = selectedCrusts.includes(c.code as CakeCrust);
                  return (
                    <button
                      key={c.code}
                      type="button"
                      className={`${styles.filterChip} ${isChecked ? styles.chipActive : ''}`}
                      onClick={() => toggleCrust(c.code as CakeCrust)}
                    >
                      {isChecked && <Icon name="check" size={13} />} {c.name}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Nhân bánh */}
          <div className={styles.filterGroup}>
            <div className={styles.filterGroupTitle}>Vị nhân (Chọn nhiều)</div>
            <div className={styles.chipList}>
              {fillings
                .filter((f) => f.isActive)
                .map((f) => {
                  const isChecked = selectedFillings.includes(f.code as CakeFilling);
                  return (
                    <button
                      key={f.code}
                      type="button"
                      className={`${styles.filterChip} ${isChecked ? styles.chipActive : ''}`}
                      onClick={() => toggleFilling(f.code as CakeFilling)}
                    >
                      {isChecked && <Icon name="check" size={13} />} {f.name}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Thương hiệu */}
          <div className={styles.filterGroup}>
            <div className={styles.filterGroupTitle}>Thương hiệu / Hiệu bánh</div>
            <Select
              options={[
                { value: 'ALL', label: 'Tất cả thương hiệu' },
                ...brands.map((b) => ({ value: b, label: b })),
              ]}
              value={selectedBrand}
              onChange={(v) => setSelectedBrand(v)}
            />
          </div>
        </aside>

        {/* Danh sách sản phẩm & Sắp xếp */}
        <section className={styles.mainContent}>
          <AsyncState
            state={asyncProducts}
            onRetry={asyncProducts.reload}
            loadingMessage="Đang tải danh sách bánh trung thu..."
          >
            {() => (
              <>
                <div className={styles.toolbar}>
                  <span className={styles.resultCount}>
                    Tìm thấy <strong>{filteredProducts.length}</strong> sản phẩm
                  </span>
                  <div className={styles.sortWrap}>
                    <span className={styles.sortLabel}>Sắp xếp:</span>
                    <Select
                      hideLabel
                      label="Sắp xếp sản phẩm"
                      options={[
                        { value: 'rating', label: 'Đánh giá cao nhất' },
                        { value: 'price_asc', label: 'Giá: Thấp đến Cao' },
                        { value: 'price_desc', label: 'Giá: Cao đến Thấp' },
                      ]}
                      value={sortOption}
                      onChange={(v) => setSortOption(v as 'price_asc' | 'price_desc' | 'rating')}
                    />
                  </div>
                </div>

                {filteredProducts.length > 0 ? (
                  <>
                    <div className={styles.productGrid}>
                      {visibleItems.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>

                    {hasMore && (
                      <div className={styles.loadMoreWrap}>
                        <div ref={sentinelRef} aria-hidden="true" />
                        <Button variant="secondary" onClick={loadMore}>
                          Xem thêm sản phẩm ({filteredProducts.length - visibleItems.length} còn
                          lại)
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  // Không có kết quả -> Gợi ý bỏ lọc + lối Tạo yêu cầu báo giá (M2.0 note)
                  <EmptyState
                    icon="sparkle"
                    title="Không tìm thấy sản phẩm phù hợp bộ lọc"
                    description="Bạn có thể thử bỏ bớt bộ lọc, hoặc tạo ngay yêu cầu đặt số lượng lớn để các xưởng liên hệ tư vấn."
                    action={
                      <div className={styles.emptyActions}>
                        <Button variant="secondary" onClick={resetFilters}>
                          Bỏ chọn lọc
                        </Button>
                        <ButtonLink to={routes.base.quoteRequestNew} variant="gold">
                          Tạo yêu cầu báo giá
                        </ButtonLink>
                      </div>
                    }
                  />
                )}
              </>
            )}
          </AsyncState>
        </section>
      </div>
    </div>
  );
}

export default CatalogPage;

import { routes } from '@/shared/config';
import { Badge, ButtonLink, Card, Icon, ProductImage } from '@/shared/ui';
import { ProductCard, useProducts } from '@/entities/product';
import { useVendors } from '@/entities/vendor';
import styles from './HomePage.module.css';

export function HomePage() {
  const products = useProducts().filter((p) => p.status === 'ACTIVE');
  const vendors = useVendors().filter((v) => v.status === 'APPROVED');

  return (
    <div className={styles.home}>
      {/* Hero Banner (FR-05, M1.0) */}
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Thưởng thức tinh hoa bánh trung thu thủ công</h1>
            <p className={styles.heroLead}>
              Moonkage kết nối trực tiếp bạn với các nghệ nhân bánh phố cổ, xưởng bánh gia truyền và xưởng sản xuất hộp quà doanh nghiệp in logo riêng.
            </p>

            <div className={styles.heroActions}>
              <ButtonLink to={routes.base.catalog} variant="primary" size="lg" iconRight="arrowRight">
                Mua lẻ cho gia đình
              </ButtonLink>
              <ButtonLink to={routes.base.bulk} variant="secondary" size="lg">
                Đặt số lượng lớn cho doanh nghiệp
              </ButtonLink>
            </div>

          </div>

          <div className={styles.heroMedia}>
            <div className={styles.imageFrame}>
              <img
                src="/images/hero.jpg"
                alt="Bánh trung thu Moonkage"
                className={styles.heroImage}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Entry Choice Banner: Mua lẻ vs Đặt số lượng lớn (BR-01, M3.0) */}
      <section className={styles.choiceSection}>
        <div className={styles.choiceGrid}>
          <Card padding="lg" className={styles.choiceCard}>
            <div className={styles.choiceText}>
              <h2 className={styles.choiceTitle}>Mua vài hộp thưởng thức &amp; biếu tặng</h2>
              <p className={styles.choiceDesc}>
                Chọn từng vị bánh yêu thích, lọc theo nhân và vỏ, giỏ hàng tự tách theo từng tiệm, thanh toán nhanh nhận trong ngày.
              </p>
              <ButtonLink to={routes.base.catalog} variant="secondary" iconRight="chevronRight">
                Xem sản phẩm đang bán
              </ButtonLink>
            </div>
          </Card>

          <Card padding="lg" className={styles.choiceCard}>
            <div className={styles.choiceText}>
              <h2 className={styles.choiceTitle}>Yêu cầu báo giá in logo doanh nghiệp</h2>
              <p className={styles.choiceDesc}>
                Gửi 1 yêu cầu để nhiều xưởng cạnh tranh báo giá, duyệt maket thiết kế trực tuyến, thanh toán cọc an toàn giữ qua sàn.
              </p>
              <ButtonLink to={routes.base.quoteRequestNew} variant="secondary" iconRight="chevronRight">
                Tạo yêu cầu báo giá ngay
              </ButtonLink>
            </div>
          </Card>
        </div>
      </section>

      {/* Featured Products Grid (M1.0, M2.0) */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Bánh ngon được yêu thích nhất</h2>
          </div>
          <ButtonLink to={routes.base.catalog} variant="ghost" iconRight="chevronRight">
            Xem tất cả bánh
          </ButtonLink>
        </div>

        <div className={styles.productGrid}>
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Featured Vendors (M1.0, M3.2) */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Các hiệu bánh và xưởng làm bánh tiêu biểu</h2>
          </div>
          <ButtonLink to={routes.base.vendors} variant="ghost" iconRight="chevronRight">
            Xem toàn bộ đơn vị
          </ButtonLink>
        </div>

        <div className={styles.vendorGrid}>
          {vendors.map((v) => (
            <Card key={v.id} padding="md" interactive className={styles.vendorCard}>
              <div className={styles.vendorBannerWrap}>
                <ProductImage src={v.bannerImage} alt={v.name} className={styles.vendorBanner} fallbackIcon="factory" />
                <div className={styles.vendorModeBadge}>
                  <Badge tone={v.sellingMode === 'CUSTOM_ORDER' ? 'gold' : 'green'} size="sm">
                    {v.sellingMode === 'CUSTOM_ORDER'
                      ? 'Chỉ nhận đặt hàng'
                      : v.sellingMode === 'BOTH'
                      ? 'Có hàng sẵn & Nhận đặt'
                      : 'Có hàng sẵn'}
                  </Badge>
                </div>
              </div>

              <div className={styles.vendorBody}>
                <h3 className={styles.vendorName}>{v.name}</h3>
                <div className={styles.vendorMeta}>
                  <span><Icon name="mapPin" size={13} /> {v.province}</span>
                  {/*
                    `quotation-service` chưa trả điểm đánh giá của người bán, nên
                    khi thiếu dữ liệu thì không hiện "0 sao (0 đánh giá)" — đó là
                    con số bịa, không phải dữ liệu thật.
                  */}
                  {(v.rating > 0 || v.reviewCount > 0) && (
                    <>
                      <span>•</span>
                      <span><Icon name="star" size={13} className={styles.star} /> {v.rating} ({v.reviewCount} đánh giá)</span>
                    </>
                  )}
                </div>
                <p className={styles.vendorIntro}>{v.introduction}</p>

                {v.bulkMinQuantity && (
                  <p className={styles.vendorBulkInfo}>
                    Nhận đặt từ <strong>{v.bulkMinQuantity} hộp</strong>, chuẩn bị trong {v.bulkLeadTimeDays} ngày
                  </p>
                )}

                <div className={styles.vendorActionRow}>
                  <ButtonLink to={routes.base.vendor(v.id)} variant="secondary" size="sm" block>
                    Xem xưởng &amp; hồ sơ
                  </ButtonLink>
                  {v.sellingMode !== 'RETAIL_SHOP' && (
                    <ButtonLink to={routes.base.vendorRequest(v.id)} variant="primary" size="sm" block>
                      Gửi yêu cầu riêng
                    </ButtonLink>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}


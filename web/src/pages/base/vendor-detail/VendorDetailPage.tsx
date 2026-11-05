import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Badge, ButtonLink, Card, Icon, ProductImage, Tabs } from '@/shared/ui';
import { useVendor } from '@/entities/vendor';
import { ProductCard, useProducts } from '@/entities/product';
import styles from './VendorDetailPage.module.css';

export function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vendor = useVendor(id ?? '');
  const products = useProducts().filter((p) => p.vendorId === (id ?? '') && p.status === 'ACTIVE');

  // IA Note M3.3: Gộp "trang Shop" và "hồ sơ nhận đặt hàng" vào một trang hai tab
  // Tab "Hàng có sẵn" chỉ khi có Shop (sellingMode != CUSTOM_ORDER)
  // Tab "Nhận đặt hàng" chỉ khi nhận đặt hàng (sellingMode != RETAIL_SHOP)
  const hasShop = vendor?.sellingMode === 'RETAIL_SHOP' || vendor?.sellingMode === 'BOTH';
  const acceptsCustom = vendor?.sellingMode === 'CUSTOM_ORDER' || vendor?.sellingMode === 'BOTH';

  const [activeTab, setActiveTab] = useState<string>(acceptsCustom && !hasShop ? 'custom' : 'shop');

  if (!vendor) {
    return (
      <div className={styles.notFound}>
        <h2>Không tìm thấy đơn vị cung cấp</h2>
        <ButtonLink to={routes.base.vendors} variant="primary">
          Về danh sách đơn vị
        </ButtonLink>
      </div>
    );
  }

  const tabItems = [
    ...(hasShop ? [{ id: 'shop', label: `Hàng có sẵn tại Shop (${products.length})` }] : []),
    ...(acceptsCustom ? [{ id: 'custom', label: 'Hồ sơ nhận đặt hàng (Doanh nghiệp)' }] : []),
  ];

  return (
    <div className={styles.container}>
      {/* Banner & Profile Header */}
      <div className={styles.profileHeader}>
        <div className={styles.bannerWrap}>
          <ProductImage
            src={vendor.bannerImage}
            alt={vendor.name}
            className={styles.banner}
            fallbackIcon="factory"
          />
        </div>

        <div className={styles.headerInfo}>
          <div className={styles.vendorIdentity}>
            <div className={styles.badges}>
              <Badge tone={vendor.sellingMode === 'CUSTOM_ORDER' ? 'gold' : 'green'}>
                {vendor.sellingMode === 'CUSTOM_ORDER'
                  ? 'Chỉ nhận đặt hàng'
                  : vendor.sellingMode === 'BOTH'
                    ? 'Có Shop & Nhận đặt'
                    : 'Có hàng sẵn'}
              </Badge>
              <Badge tone="neutral">Nguồn: {vendor.sourceType}</Badge>
            </div>
            <h1 className={styles.vendorName}>{vendor.name}</h1>
            <p className={styles.legalName}>
              {vendor.legalName} · MST: {vendor.taxCode}
            </p>
          </div>

          <div className={styles.headerActions}>
            {acceptsCustom && (
              <ButtonLink
                to={routes.base.vendorRequest(vendor.id)}
                variant="primary"
                iconLeft="sparkle"
              >
                Gửi yêu cầu báo giá riêng
              </ButtonLink>
            )}
          </div>
        </div>
      </div>

      {/* Thông số giới thiệu nhanh */}
      <div className={styles.metaCards}>
        <Card padding="sm" className={styles.metaCard}>
          <Icon name="mapPin" size={18} />
          <div>
            <div className={styles.metaLabel}>Địa chỉ xưởng:</div>
            <div className={styles.metaVal}>
              {/* Địa chỉ có thể trống nếu hồ sơ người bán chưa điền — không ghép dấu phẩy lơ lửng. */}
              {vendor.address ? `${vendor.address}, ${vendor.province}` : vendor.province || 'Chưa cập nhật'}
            </div>
          </div>
        </Card>
        {/*
          `quotation-service` chưa trả điểm đánh giá của người bán. Hiện "0 sao
          (0 đánh giá)" là dữ liệu bịa, nên khi thiếu thì nói rõ là chưa có.
        */}
        {(vendor.rating > 0 || vendor.reviewCount > 0) && (
          <Card padding="sm" className={styles.metaCard}>
            <Icon name="star" size={18} />
            <div>
              <div className={styles.metaLabel}>Uy tín:</div>
              <div className={styles.metaVal}>
                {vendor.rating} sao ({vendor.reviewCount} đánh giá)
              </div>
            </div>
          </Card>
        )}
        <Card padding="sm" className={styles.metaCard}>
          <Icon name="truck" size={18} />
          <div>
            <div className={styles.metaLabel}>Vùng giao hàng:</div>
            <div className={styles.metaVal}>{vendor.deliveryProvinces.join(', ')}</div>
          </div>
        </Card>
      </div>

      {/* Tabs: Hàng có sẵn vs Nhận đặt hàng */}
      <div className={styles.tabsWrap}>
        <Tabs items={tabItems} activeId={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'shop' && (
        <div className={styles.tabContent}>
          {products.length > 0 ? (
            <div className={styles.productGrid}>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} showVendor={false} />
              ))}
            </div>
          ) : (
            <Card padding="lg" className={styles.emptyCard}>
              <p>Hiện tiệm chưa cập nhật sản phẩm bán lẻ sẵn có.</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'custom' && (
        <div className={styles.customTabContent}>
          <div className={styles.customGrid}>
            <Card padding="md" className={styles.customCard}>
              <h3 className={styles.cardHeading}>Điều kiện nhận đặt số lượng lớn (US-35)</h3>
              <div className={styles.conditionList}>
                <div className={styles.condRow}>
                  <span>Số lượng đặt tối thiểu:</span>
                  {/*
                    Trước đây khi thiếu dữ liệu, UI tự điền "20 hộp" / "5 ngày" —
                    đó là số bịa ra. Nay chỉ hiện những gì máy chủ thật sự trả về.
                  */}
                  <strong>
                    {vendor.bulkMinQuantity
                      ? `${vendor.bulkMinQuantity} hộp`
                      : 'Chưa khai báo'}
                  </strong>
                </div>
                <div className={styles.condRow}>
                  <span>Thời gian sản xuất &amp; chuẩn bị:</span>
                  <strong>
                    {vendor.bulkLeadTimeDays ? `${vendor.bulkLeadTimeDays} ngày` : 'Chưa khai báo'}
                  </strong>
                </div>
                <div className={styles.condRow}>
                  <span>Quy cách tùy chỉnh hỗ trợ:</span>
                  <div className={styles.optionsWrap}>
                    {vendor.supportedCustomOptions?.map((opt) => (
                      <Badge key={opt} tone="gold" size="sm">
                        {opt}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card padding="md" className={styles.customCard}>
              <h3 className={styles.cardHeading}>Bậc giá tham khảo</h3>
              <p className={styles.tierNote}>
                * Báo giá chính xác sẽ phụ thuộc vào vị nhân, bao bì và ngày giao hàng.
              </p>
              <div className={styles.tierTable}>
                {vendor.bulkSamplePriceTiers?.map((tier) => (
                  <div key={tier.min} className={styles.tierRow}>
                    <span>
                      Từ {tier.min} – {tier.max} hộp:
                    </span>
                    <strong>{formatCurrency(tier.price)} / hộp</strong>
                  </div>
                ))}
              </div>

              <div className={styles.customCta}>
                <ButtonLink
                  to={routes.base.vendorRequest(vendor.id)}
                  variant="gold"
                  size="lg"
                  block
                  iconRight="arrowRight"
                >
                  Gửi yêu cầu báo giá cho xưởng này
                </ButtonLink>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

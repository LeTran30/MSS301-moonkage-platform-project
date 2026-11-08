import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { provinceNameOf, routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { AsyncState, Badge, ButtonLink, Card, EmptyState, Icon, ProductImage, Tabs } from '@/shared/ui';
import { useCurrentUser } from '@/entities/user';
import { useSupplier, type Vendor } from '@/entities/vendor';
import { CUSTOM_TYPE_LABELS, toCustomTypes } from '@/entities/request';
import { ProductCard, useProducts } from '@/entities/product';
import styles from './VendorDetailPage.module.css';

/**
 * M3.3: one Shop's page, its ready-made products and its terms for custom orders, in two tabs.
 *
 * The Shop is read on its own (`GET /api/suppliers/{id}`), so a shared link opens without waiting for the list of
 * Shops, and the page says it is loading instead of "not found" meanwhile.
 */
export function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const asyncVendor = useSupplier(id || null);

  return (
    <div className={styles.container}>
      <AsyncState
        state={asyncVendor}
        onRetry={asyncVendor.reload}
        loadingMessage="Đang tải hồ sơ đơn vị..."
      >
        {(vendor) =>
          vendor ? (
            <VendorProfile vendor={vendor} />
          ) : (
            <EmptyState
              title="Không tìm thấy đơn vị cung cấp"
              description="Đơn vị không tồn tại hoặc đang tạm ngừng nhận đặt hàng."
              action={
                <ButtonLink to={routes.base.vendors} variant="primary">
                  Về danh sách đơn vị
                </ButtonLink>
              }
            />
          )
        }
      </AsyncState>
    </div>
  );
}

function VendorProfile({ vendor }: { vendor: Vendor }) {
  const user = useCurrentUser();
  const products = useProducts().filter((p) => p.vendorId === vendor.id && p.status === 'ACTIVE');

  // Tab "Hàng có sẵn" chỉ khi có Shop, tab "Nhận đặt hàng" chỉ khi nhận đặt hàng (IA M3.3).
  const hasShop = vendor.sellingMode === 'RETAIL_SHOP' || vendor.sellingMode === 'BOTH';
  const acceptsCustom = vendor.sellingMode === 'CUSTOM_ORDER' || vendor.sellingMode === 'BOTH';
  const [activeTab, setActiveTab] = useState<string>(acceptsCustom && !hasShop ? 'custom' : 'shop');

  const customTypes = toCustomTypes(vendor.supportedCustomOptions);
  const deliveryNames = vendor.deliveryProvinces.map((code) => provinceNameOf(code) || code);
  const priceTiers = vendor.bulkSamplePriceTiers ?? [];
  // Tên pháp lý và MST chỉ hiện khi máy chủ thật sự trả về, không để "MST:" trống.
  const showLegalLine = Boolean(vendor.taxCode) || (vendor.legalName && vendor.legalName !== vendor.name);

  const tabItems = [
    ...(hasShop ? [{ id: 'shop', label: `Hàng có sẵn tại Shop (${products.length})` }] : []),
    ...(acceptsCustom ? [{ id: 'custom', label: 'Hồ sơ nhận đặt hàng (Doanh nghiệp)' }] : []),
  ];

  return (
    <>
      <div className={styles.profileHeader}>
        {/* Chưa có ảnh bìa thì không chừa một khung trống chiếm nửa màn hình. */}
        {vendor.bannerImage && (
          <div className={styles.bannerWrap}>
            <ProductImage
              src={vendor.bannerImage}
              alt={vendor.name}
              className={styles.banner}
              fallbackIcon="factory"
            />
          </div>
        )}

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
            {showLegalLine && (
              <p className={styles.legalName}>
                {vendor.legalName}
                {vendor.taxCode ? ` · MST: ${vendor.taxCode}` : ''}
              </p>
            )}
            {vendor.introduction && <p className={styles.legalName}>{vendor.introduction}</p>}
          </div>

          <div className={styles.headerActions}>
            {user.vendorId !== vendor.id && (
              <ButtonLink
                to={routes.account.messagesWithShop(vendor.id)}
                variant="outline"
                iconLeft="message"
              >
                Nhắn shop
              </ButtonLink>
            )}
            {acceptsCustom && user.vendorId !== vendor.id && (
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

      <div className={styles.metaCards}>
        <Card padding="sm" className={styles.metaCard}>
          <Icon name="mapPin" size={18} />
          <div>
            <div className={styles.metaLabel}>Địa chỉ xưởng:</div>
            <div className={styles.metaVal}>
              {/* Địa chỉ có thể trống nếu hồ sơ người bán chưa điền — không ghép dấu phẩy lơ lửng. */}
              {vendor.address
                ? `${vendor.address}, ${vendor.province}`
                : vendor.province || 'Chưa cập nhật'}
            </div>
          </div>
        </Card>
        {/* Chưa có điểm đánh giá của người bán thì ẩn hẳn, không hiện "0 sao". */}
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
            <div className={styles.metaLabel}>Nhận giao đơn đặt hàng tới:</div>
            <div className={styles.metaVal}>
              {deliveryNames.length > 0 ? deliveryNames.join(', ') : 'Chưa khai báo'}
            </div>
          </div>
        </Card>
      </div>

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
              <h3 className={styles.cardHeading}>Điều kiện nhận đặt số lượng lớn</h3>
              <div className={styles.conditionList}>
                <div className={styles.condRow}>
                  <span>Số lượng đặt tối thiểu:</span>
                  <strong>
                    {vendor.bulkMinQuantity ? `${vendor.bulkMinQuantity} hộp` : 'Chưa khai báo'}
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
                  {customTypes.length > 0 ? (
                    <div className={styles.optionsWrap}>
                      {customTypes.map((type) => (
                        <Badge key={type} tone="gold" size="sm">
                          {CUSTOM_TYPE_LABELS[type]}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <strong>Không nhận tùy chỉnh</strong>
                  )}
                </div>
              </div>
            </Card>

            <Card padding="md" className={styles.customCard}>
              <h3 className={styles.cardHeading}>Bậc giá tham khảo</h3>
              {priceTiers.length > 0 ? (
                <>
                  <p className={styles.tierNote}>
                    * Báo giá chính xác sẽ phụ thuộc vào vị nhân, bao bì và ngày giao hàng.
                  </p>
                  <div className={styles.tierTable}>
                    {priceTiers.map((tier) => (
                      <div key={tier.min} className={styles.tierRow}>
                        <span>Từ {tier.min} hộp:</span>
                        <strong>{formatCurrency(tier.price)} / hộp</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className={styles.tierNote}>
                  Đơn vị chưa công bố bảng giá tham khảo. Giá chính xác có trong báo giá đơn vị gửi
                  lại cho yêu cầu của bạn.
                </p>
              )}

              {user.vendorId !== vendor.id && (
                <div className={styles.customCta}>
                  <ButtonLink
                    to={routes.base.vendorRequest(vendor.id)}
                    variant="gold"
                    size="lg"
                    block
                    iconRight="arrowRight"
                  >
                    Gửi yêu cầu báo giá cho đơn vị này
                  </ButtonLink>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

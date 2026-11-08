import { useState } from 'react';
import { routes } from '@/shared/config';
import { Badge, ButtonLink, Card, Icon, ProductImage } from '@/shared/ui';
import { useVendors } from '@/entities/vendor';
import styles from './VendorsListPage.module.css';

export function VendorsListPage() {
  const vendors = useVendors().filter((v) => v.status === 'APPROVED');
  const [filterMode, setFilterMode] = useState<string>('ALL');

  const filteredVendors = vendors.filter((v) => {
    if (filterMode === 'CUSTOM_ONLY') return v.sellingMode === 'CUSTOM_ORDER';
    if (filterMode === 'SHOP_ONLY')
      return v.sellingMode === 'RETAIL_SHOP' || v.sellingMode === 'BOTH';
    return true;
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Nghệ nhân, xưởng bánh và tiệm gia truyền</h1>
        <p className={styles.lead}>
          Bao gồm cả các nghệ nhân chỉ nhận sản xuất hợp đồng (nhãn "Chỉ nhận đặt hàng") và các tiệm
          có bán lẻ sẵn.
        </p>
      </div>

      {/* Toolbar / Tabs lọc */}
      <div className={styles.toolbar}>
        <div className={styles.tabFilters}>
          <button
            type="button"
            className={`${styles.tabBtn} ${filterMode === 'ALL' ? styles.tabActive : ''}`}
            onClick={() => setFilterMode('ALL')}
          >
            Tất cả đơn vị ({vendors.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${filterMode === 'CUSTOM_ONLY' ? styles.tabActive : ''}`}
            onClick={() => setFilterMode('CUSTOM_ONLY')}
          >
            Chỉ nhận đặt hàng số lượng lớn
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${filterMode === 'SHOP_ONLY' ? styles.tabActive : ''}`}
            onClick={() => setFilterMode('SHOP_ONLY')}
          >
            Có cửa hàng bán lẻ (Shop)
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {filteredVendors.map((vendor) => (
          <Card key={vendor.id} padding="none" interactive className={styles.vendorCard}>
            <div className={styles.bannerWrap}>
              <ProductImage
                src={vendor.bannerImage}
                alt={vendor.name}
                className={styles.banner}
                fallbackIcon="factory"
              />
              <div className={styles.badgesWrap}>
                <Badge tone={vendor.sellingMode === 'CUSTOM_ORDER' ? 'gold' : 'green'} size="sm">
                  {vendor.sellingMode === 'CUSTOM_ORDER'
                    ? 'Chỉ nhận đặt hàng'
                    : vendor.sellingMode === 'BOTH'
                      ? 'Có hàng sẵn & Nhận đặt'
                      : 'Có hàng sẵn'}
                </Badge>
                <Badge tone="neutral" size="sm">
                  Nguồn: {vendor.sourceType}
                </Badge>
              </div>
            </div>

            <div className={styles.cardBody}>
              <h3 className={styles.vendorName}>{vendor.name}</h3>
              <div className={styles.metaRow}>
                <span>
                  <Icon name="mapPin" size={13} /> {vendor.province}
                </span>
                {/*
                  `quotation-service` chưa trả điểm đánh giá của người bán: thiếu
                  dữ liệu thì ẩn hẳn, không hiện "0 sao (0 đánh giá)".
                */}
                {(vendor.rating > 0 || vendor.reviewCount > 0) && (
                  <>
                    <span>•</span>
                    <span>
                      <Icon name="star" size={13} className={styles.star} /> {vendor.rating} (
                      {vendor.reviewCount} đánh giá)
                    </span>
                  </>
                )}
              </div>

              <p className={styles.intro}>{vendor.introduction}</p>

              {vendor.bulkMinQuantity && (
                <div className={styles.bulkBox}>
                  <div className={styles.bulkRow}>
                    <span>Nhận đặt tối thiểu:</span>
                    <strong>{vendor.bulkMinQuantity} hộp</strong>
                  </div>
                  <div className={styles.bulkRow}>
                    <span>Thời gian chuẩn bị:</span>
                    <strong>{vendor.bulkLeadTimeDays} ngày</strong>
                  </div>
                </div>
              )}

              <div className={styles.actionRow}>
                <ButtonLink to={routes.base.vendor(vendor.id)} variant="secondary" size="sm" block>
                  Xem chi tiết xưởng
                </ButtonLink>
                {vendor.sellingMode !== 'RETAIL_SHOP' && (
                  <ButtonLink
                    to={routes.base.vendorRequest(vendor.id)}
                    variant="primary"
                    size="sm"
                    block
                  >
                    Gửi yêu cầu riêng
                  </ButtonLink>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { useDeliveryProvinceCode } from '@/entities/region';
import { AsyncState, Badge, Button, ButtonLink, Card, Icon, Breadcrumbs, toast } from '@/shared/ui';
import { type Product, useProductDetail, useProductReviews, useTaxonomy } from '@/entities/product';
import { ProductReviewList } from '@/entities/product';
import { AddToCartButton, useCartSync } from '@/features/add-to-cart';
import { useCurrentUser } from '@/entities/user';
import styles from './ProductDetailPage.module.css';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const provinceCode = useDeliveryProvinceCode();
  const asyncProduct = useProductDetail(id ?? '', provinceCode);
  const asyncReviews = useProductReviews(id ?? '');
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { crusts: crustTypes } = useTaxonomy();
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const { addLine } = useCartSync();

  // Mua ngay = thêm vào giỏ rồi sang giỏ để thanh toán; chỉ chuyển trang khi đã thêm được
  async function handleBuyNow(product: Product) {
    setBuying(true);
    try {
      await addLine(product.id, quantity);
      navigate(routes.base.cart);
    } catch {
      toast.error('Không thêm vào giỏ hàng được. Vui lòng thử lại.');
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className={styles.container}>
      <AsyncState<Product | null>
        state={asyncProduct}
        onRetry={asyncProduct.reload}
        loadingMessage="Đang tải thông tin chi tiết sản phẩm..."
        isEmpty={(p) => !p}
        empty={
          <div className={styles.notFound}>
            <h2>Không tìm thấy sản phẩm</h2>
            <ButtonLink to={routes.base.catalog} variant="primary">
              Về danh mục bánh
            </ButtonLink>
          </div>
        }
      >
        {(product) => {
          if (!product) return null;
          // BR-22: Nếu là chủ Shop của sản phẩm này: hiện nhãn "Sản phẩm của bạn", không có nút mua
          const isOwner = user.vendorId && user.vendorId === product.vendorId;

          return (
            <>
              {/* Breadcrumbs */}
              <Breadcrumbs
                items={[
                  { label: 'Trang chủ', path: routes.base.home },
                  { label: 'Danh mục bánh', path: routes.base.catalog },
                  { label: product.name },
                ]}
              />

              <div className={styles.grid}>
                {/* Gallery */}
                <div className={styles.gallery}>
                  <div className={styles.mainImageWrap}>
                    <img src={product.images[0]} alt={product.name} className={styles.mainImage} />
                    <div className={styles.tagWrap}>
                      <Badge tone="gold" size="sm">
                        <Icon name="truck" size={13} /> {product.deliveryTag}
                      </Badge>
                      {product.bulkQuoteThreshold && (
                        <Badge tone="red" size="sm">
                          Ngưỡng sỉ: &gt;{product.bulkQuoteThreshold} hộp
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details & Purchase Actions (FR-07, FR-08) */}
                <div className={styles.details}>
                  <div className={styles.brandRow}>
                    <span className={styles.brandBadge}>Thương hiệu: {product.brand}</span>
                    <Link to={routes.base.vendor(product.vendorId)} className={styles.vendorLink}>
                      <Icon name="store" size={14} /> {product.vendorName}
                    </Link>
                    {!isOwner && (
                      <ButtonLink
                        to={routes.account.messagesWithShop(product.vendorId)}
                        variant="outline"
                        size="sm"
                        iconLeft="message"
                      >
                        Nhắn shop
                      </ButtonLink>
                    )}
                  </div>

                  <h1 className={styles.title}>{product.name}</h1>

                  {/*
                    Điểm đánh giá và số đã bán chỉ hiện khi máy chủ có dữ liệu:
                    `catalog-service` chưa trả `soldCount`, hiện "Đã bán 0 hộp"
                    là con số bịa ra. Thiếu dữ liệu thì ẩn hẳn.
                  */}
                  {(product.rating > 0 || product.reviewCount > 0 || product.soldCount > 0) && (
                    <div className={styles.metaRow}>
                      {product.rating > 0 && (
                        <div className={styles.rating}>
                          <Icon name="star" size={16} className={styles.starIcon} />
                          <strong>{product.rating}</strong>
                          {product.reviewCount > 0 && (
                            <span className={styles.reviewCount}>
                              ({product.reviewCount} đánh giá từ khách mua)
                            </span>
                          )}
                        </div>
                      )}
                      {product.soldCount > 0 && (
                        <span className={styles.soldCount}>Đã bán {product.soldCount} hộp</span>
                      )}
                    </div>
                  )}

                  <div className={styles.priceBox}>
                    <div className={styles.priceRow}>
                      <span className={styles.priceLabel}>Giá niêm yết:</span>
                      <span className={styles.priceValue}>{formatCurrency(product.price)}</span>
                    </div>
                    <div className={styles.vatNote}>Đã bao gồm thuế GTGT (VAT)</div>
                  </div>

                  {/* BR-22 Check */}
                  {isOwner ? (
                    <Card padding="md" tone="gold" className={styles.ownerNotice}>
                      <Icon name="store" size={20} />
                      <div>
                        <strong>Sản phẩm của bạn</strong>
                        <p>
                          Bạn là chủ cửa hàng sở hữu sản phẩm này. Hãy quản lý tại Kênh người bán.
                        </p>
                      </div>
                      <ButtonLink to={routes.vendor.product(product.id)} variant="gold" size="sm">
                        Sửa sản phẩm
                      </ButtonLink>
                    </Card>
                  ) : (
                    <>
                      {/* Selector Số lượng */}
                      <div className={styles.qtyRow}>
                        <span className={styles.qtyLabel}>Số lượng:</span>
                        <div className={styles.stepper}>
                          <button
                            type="button"
                            className={styles.stepperBtn}
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                          >
                            <Icon name="minus" size={14} />
                          </button>
                          <span className={styles.stepperVal}>{quantity}</span>
                          <button
                            type="button"
                            className={styles.stepperBtn}
                            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                            disabled={quantity >= product.stock}
                          >
                            <Icon name="plus" size={14} />
                          </button>
                        </div>
                        <span className={styles.stockText}>Còn {product.stock} hộp sẵn có</span>
                      </div>

                      {/* Lối gửi yêu cầu báo giá nếu đặt nhiều (AC-08.2, FR-08) */}
                      {product.bulkQuoteThreshold && quantity >= product.bulkQuoteThreshold && (
                        <div className={styles.bulkThresholdNotice}>
                          <Icon name="info" size={16} />
                          <div>
                            Số lượng chọn ({quantity} hộp) đã đạt ngưỡng báo giá sỉ! Bạn có thể đặt
                            hàng trực tiếp hoặc gửi yêu cầu báo giá riêng để có chiết khấu tốt hơn.
                          </div>
                          <ButtonLink
                            to={routes.base.vendorRequest(product.vendorId)}
                            variant="gold"
                            size="sm"
                          >
                            Gửi yêu cầu giá sỉ
                          </ButtonLink>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className={styles.actions}>
                        <AddToCartButton
                          product={product}
                          quantity={quantity}
                          size="lg"
                          variant="secondary"
                        />
                        <Button
                          variant="primary"
                          size="lg"
                          loading={buying}
                          disabled={buying || product.stock === 0}
                          onClick={() => void handleBuyNow(product)}
                          block
                        >
                          Mua ngay
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Lối vào : Gửi yêu cầu cho Shop này nếu người bán nhận đặt hàng.
              Cờ `acceptsCustomOrder` đến từ backend (BE-04) — không suy ra từ ngưỡng báo giá,
              vì ngưỡng báo giá nói "từ bao nhiêu hộp thì cần báo giá", không phải "có nhận đơn riêng". */}
                  {product.acceptsCustomOrder === true && (
                    <Card padding="md" className={styles.customOrderBox}>
                      <div className={styles.customOrderText}>
                        <h4>Cần đặt số lượng lớn cho công ty hoặc in logo riêng?</h4>
                        <p>
                          Hiệu bánh nhận đơn đặt hàng theo yêu cầu riêng
                          {product.bulkQuoteThreshold
                            ? ` từ ${product.bulkQuoteThreshold} hộp`
                            : ''}
                          .
                        </p>
                      </div>
                      <ButtonLink
                        to={routes.base.vendorRequest(product.vendorId)}
                        variant="secondary"
                        size="sm"
                      >
                        Gửi yêu cầu cho tiệm này
                      </ButtonLink>
                    </Card>
                  )}

                  {/* Description */}
                  <div className={styles.descSection}>
                    <h3 className={styles.descTitle}>Mô tả sản phẩm</h3>
                    <p className={styles.descText}>{product.description}</p>
                    <div className={styles.specList}>
                      <div className={styles.specItem}>
                        <span className={styles.specLabel}>Vỏ bánh:</span>
                        <span>
                          {product.crusts
                            .map((code) => crustTypes.find((c) => c.code === code)?.name ?? code)
                            .join(', ')}
                        </span>
                      </div>
                      <div className={styles.specItem}>
                        <span className={styles.specLabel}>Hạn sử dụng:</span>
                        <span>{product.expiryDate}</span>
                      </div>
                      {product.manufactureLocation && (
                        <div className={styles.specItem}>
                          <span className={styles.specLabel}>Xuất xứ:</span>
                          <span>{product.manufactureLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Đánh giá sản phẩm (AC-11.3) — nguồn: catalog-service */}
              <ProductReviewList
                reviews={asyncReviews.kind === 'loaded' ? asyncReviews.data : []}
                state={asyncReviews.kind}
                errorMessage={asyncReviews.kind === 'error' ? asyncReviews.message : undefined}
              />
            </>
          );
        }}
      </AsyncState>
    </div>
  );
}

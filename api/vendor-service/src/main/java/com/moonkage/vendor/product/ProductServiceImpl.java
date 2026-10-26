package com.moonkage.vendor.product;

import com.moonkage.storage.ObjectStorage;
import com.moonkage.storage.PresignedUploadLink;
import com.moonkage.vendor.cakeattribute.CakeAttributeCodes;
import com.moonkage.vendor.cakeattribute.CakeAttributeGroup;
import com.moonkage.vendor.cakeattribute.CakeAttributeRef;
import com.moonkage.vendor.cakeattribute.CakeAttributeService;
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.Price;
import com.moonkage.vendor.common.vo.PriceTier;
import com.moonkage.vendor.common.vo.PriceTiers;
import com.moonkage.vendor.common.vo.Quantity;
import com.moonkage.vendor.product.dto.request.ProductImageUploadRequest;
import com.moonkage.vendor.product.dto.request.SaveProductRequest;
import com.moonkage.vendor.product.dto.request.UpdateProductRequest;
import com.moonkage.vendor.product.dto.response.ProductResponse;
import com.moonkage.vendor.security.CurrentUserInfo;
import com.moonkage.vendor.vendor.VendorService;
import com.moonkage.vendor.vendor.VendorView;
import com.moonkage.vendor.vendor.dto.response.PresignedUploadLinkResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.OptimisticLockException;
import java.util.List;
import java.util.Set;
import java.util.function.Supplier;
import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
class ProductServiceImpl implements ProductService {

    private static final String FIELD_VERSION = "version";

    private final ProductRepository productRepository;
    private final VendorService vendorService;
    private final CakeAttributeService cakeAttributeService;
    private final ProductImages productImages;
    private final ProductSnapshotPublisher snapshotPublisher;
    private final ObjectStorage objectStorage;
    private final ProductImageProperties imageProperties;
    private final EntityManager entityManager;

    @Override
    public PresignedUploadLinkResponse createImageUploadLink(
            CurrentUserInfo caller, String vendorId, ProductImageUploadRequest request) {
        getSellingVendor(caller, vendorId);
        PresignedUploadLink link = objectStorage.createPresignedUploadLink(
                request.contentType(), request.sizeBytes(), imageProperties.toFileLimit());
        return new PresignedUploadLinkResponse(link.tempKey(), link.uploadUrl(), link.formFields(), link.expiresAt());
    }

    @Override
    @Transactional
    public ProductResponse createProduct(CurrentUserInfo caller, String vendorId, SaveProductRequest request) {
        VendorView vendor = getSellingVendor(caller, vendorId);
        ProductDetails details = toDetails(vendor, request, Set.of());
        Product product = Product.create(
                vendorId, details.withImageKeys(productImages.place(vendorId, details.imageKeys(), List.of())));
        productRepository.saveAndFlush(product);
        snapshotPublisher.announceUpserted(product);
        return toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getProducts(CurrentUserInfo caller, String vendorId) {
        getVisibleVendor(caller, vendorId);
        return productRepository.findByVendorIdOrderByCreatedAtDesc(vendorId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProduct(CurrentUserInfo caller, String vendorId, String productId) {
        getVisibleVendor(caller, vendorId);
        return toResponse(get(vendorId, productId));
    }

    @Override
    @Transactional
    public ProductResponse replaceProduct(
            CurrentUserInfo caller, String vendorId, String productId, SaveProductRequest request) {
        if (request.version() == null) {
            throw new AppException(ErrorCode.FIELD_REQUIRED).atField(FIELD_VERSION);
        }
        VendorView vendor = getSellingVendor(caller, vendorId);
        Product product = getForChange(vendorId, productId, request.version());
        product.checkEditable();
        ProductDetails details = toDetails(vendor, request, product.getCakeAttributeIds());
        product.replace(details.withImageKeys(
                productImages.place(vendorId, details.imageKeys(), List.copyOf(product.getImageKeys()))));
        productRepository.saveAndFlush(product);
        snapshotPublisher.announceUpserted(product);
        return toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(
            CurrentUserInfo caller, String vendorId, String productId, UpdateProductRequest request) {
        if (request.status() == ProductStatus.REMOVED) {
            if (!caller.isAdmin()) {
                throw new AppException(ErrorCode.ACCESS_DENIED);
            }
            vendorService.getView(vendorId);
            Product product = getForChange(vendorId, productId, null);
            product.remove(request.removedReason(), caller.accountId());
            productRepository.saveAndFlush(product);
            snapshotPublisher.announceRemoved(product);
            return toResponse(product);
        }
        getSellingVendor(caller, vendorId);
        Product product = getForChange(vendorId, productId, null);
        if (request.status() == ProductStatus.HIDDEN) {
            product.hide();
        } else {
            product.show();
        }
        productRepository.saveAndFlush(product);
        snapshotPublisher.announceUpserted(product);
        return toResponse(product);
    }

    /** Its owner, while the vendor may operate and sells in the Shop (BR-20, BR-21, BR-31). */
    private VendorView getSellingVendor(CurrentUserInfo caller, String vendorId) {
        VendorView vendor = vendorService.getView(vendorId);
        if (!vendor.isOwnedBy(caller.accountId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        if (!vendor.canOperate()) {
            throw new AppException(ErrorCode.VENDOR_NOT_OPERATING);
        }
        if (!vendor.sellsShop()) {
            throw new AppException(ErrorCode.VENDOR_NOT_SELLING_SHOP);
        }
        return vendor;
    }

    private void getVisibleVendor(CurrentUserInfo caller, String vendorId) {
        VendorView vendor = vendorService.getView(vendorId);
        if (!caller.isAdmin() && !vendor.isOwnedBy(caller.accountId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
    }

    private Product get(String vendorId, String productId) {
        return productRepository
                .findByIdAndVendorId(productId, vendorId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
    }

    /**
     * The product with its version raised now, so a change of a price tier alone still gives the event a newer
     * version, and two changes at once cannot both pass: the second gets PRODUCT_CHANGED.
     *
     * @param expectedVersion the version the caller edited; null when the change does not depend on it
     */
    private Product getForChange(String vendorId, String productId, Long expectedVersion) {
        Product product = get(vendorId, productId);
        if (expectedVersion != null && expectedVersion != product.getVersion()) {
            throw new AppException(ErrorCode.PRODUCT_CHANGED).atField(FIELD_VERSION);
        }
        try {
            entityManager.lock(product, LockModeType.PESSIMISTIC_FORCE_INCREMENT);
        } catch (OptimisticLockException | ObjectOptimisticLockingFailureException e) {
            throw new AppException(ErrorCode.PRODUCT_CHANGED);
        }
        return product;
    }

    /**
     * @param linkedIds the crusts and fillings the product links now; a hidden one among them may stay (AC-54.4)
     */
    private ProductDetails toDetails(VendorView vendor, SaveProductRequest request, Set<String> linkedIds) {
        return ProductDetails.of(
                vendor.supplySource(),
                vendor.businessName(),
                request.resold(),
                request.name(),
                request.description(),
                request.brand(),
                request.origin(),
                optionalQuantity(ProductDetails.PIECES_PER_BOX, request.piecesPerBox()),
                request.listPrice() == null
                        ? null
                        : atField(ProductDetails.LIST_PRICE, () -> Price.of(request.listPrice())),
                request.stock(),
                request.expiryDate(),
                request.deliveryLabel(),
                optionalQuantity(ProductDetails.QUOTE_THRESHOLD, request.quoteThreshold()),
                toPriceTiers(request.priceTiers()),
                request.imageKeys(),
                select(ProductDetails.CRUST_CODES, CakeAttributeGroup.CRUST, request.crustCodes(), linkedIds),
                select(ProductDetails.FILLING_CODES, CakeAttributeGroup.FILLING, request.fillingCodes(), linkedIds));
    }

    private static PriceTiers toPriceTiers(List<SaveProductRequest.PriceTier> tiers) {
        if (tiers == null) {
            return null;
        }
        return atField(
                ProductDetails.PRICE_TIERS,
                () -> PriceTiers.of(tiers.stream()
                        .map(tier -> PriceTier.of(tier.fromQty(), tier.unitPrice()))
                        .toList()));
    }

    private List<CakeAttributeRef> select(
            String field, CakeAttributeGroup group, List<String> codes, Set<String> linkedIds) {
        return atField(field, () -> cakeAttributeService.select(group, codes, linkedIds));
    }

    private static Quantity optionalQuantity(String field, Integer value) {
        return value == null ? null : atField(field, () -> Quantity.of(value));
    }

    private static <T> T atField(String field, Supplier<T> valueObject) {
        try {
            return valueObject.get();
        } catch (AppException e) {
            throw e.atField(field);
        }
    }

    private ProductResponse toResponse(Product product) {
        CakeAttributeCodes codes = CakeAttributeCodes.of(cakeAttributeService.getRefs(product.getCakeAttributeIds()));
        return new ProductResponse(
                product.getId(),
                product.getVendorId(),
                product.getName(),
                product.getDescription(),
                product.getBrand(),
                product.getOrigin(),
                product.isResold(),
                valueOf(product.getPiecesPerBox()),
                product.getListPrice().value(),
                product.getStock(),
                product.getExpiryDate(),
                product.getDeliveryLabel(),
                valueOf(product.getQuoteThreshold()),
                product.toPriceTiers().tiers().stream()
                        .map(tier -> new ProductResponse.PriceTier(
                                tier.fromQty().value(), tier.unitPrice().value()))
                        .toList(),
                product.getImageKeys().stream()
                        .map(key -> new ProductResponse.Image(key, productImages.urlOf(key)))
                        .toList(),
                codes.crusts(),
                codes.fillings(),
                product.getStatus(),
                product.getRemovedReason(),
                product.getVersion(),
                product.getCreatedAt(),
                product.getUpdatedAt());
    }

    private static Integer valueOf(Quantity quantity) {
        return quantity == null ? null : quantity.value();
    }
}

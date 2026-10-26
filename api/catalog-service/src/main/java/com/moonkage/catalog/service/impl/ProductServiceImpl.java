package com.moonkage.catalog.service.impl;

import com.moonkage.catalog.client.VendorClient;
import com.moonkage.catalog.common.exception.CustomException;
import com.moonkage.catalog.config.ProductImageProperties;
import com.moonkage.catalog.dto.client.VendorInfo;
import com.moonkage.catalog.dto.request.CreateProductRequest;
import com.moonkage.catalog.dto.request.ImageUploadRequest;
import com.moonkage.catalog.dto.request.PriceTierRequest;
import com.moonkage.catalog.dto.request.UpdateProductRequest;
import com.moonkage.catalog.dto.response.PageResponse;
import com.moonkage.catalog.dto.response.PresignedUploadLinkResponse;
import com.moonkage.catalog.dto.response.ProductResponse;
import com.moonkage.catalog.entity.Product;
import com.moonkage.catalog.entity.ProductPriceTier;
import com.moonkage.catalog.enums.ProductStatus;
import com.moonkage.catalog.mapper.ProductMapper;
import com.moonkage.catalog.messaging.AuditEvent;
import com.moonkage.catalog.repository.ProductRepository;
import com.moonkage.catalog.service.ProductService;
import com.moonkage.storage.BucketAccess;
import com.moonkage.storage.ObjectStorage;
import com.moonkage.storage.PresignedUploadLink;
import feign.FeignException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

@Service
@Profile("legacy-writer")
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private static final int MAX_PAGE_SIZE = 100;
    /** Key prefix of product images in the public bucket; infra/minio/init.sh grants catalog's user only this one. */
    private static final String IMAGE_KEY_PREFIX = "products";

    private final ProductRepository productRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final VendorClient vendorClient;
    private final ObjectStorage objectStorage;
    private final ProductImageProperties productImageProperties;

    @Override
    public PresignedUploadLinkResponse createImageUploadLink(String accountId, ImageUploadRequest request) {
        requireShop(accountId);
        PresignedUploadLink uploadLink = objectStorage.createPresignedUploadLink(
                request.contentType(), request.sizeBytes(), productImageProperties.toFileLimit());
        return new PresignedUploadLinkResponse(
                uploadLink.tempKey(), uploadLink.uploadUrl(), uploadLink.formFields(), uploadLink.expiresAt());
    }

    @Override
    @Transactional
    public ProductResponse createProduct(String accountId, CreateProductRequest request) {
        VendorInfo vendor = requireShop(accountId);
        requireResaleInfo(vendor, request.getBrand(), request.getOrigin());
        validateTiers(request.getPriceTiers());

        Product product = new Product();
        product.setVendorId(vendor.id());
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription().trim());
        replaceImages(product, request.getImageKeys());
        product.setCakeType(trimToNull(request.getCakeType()));
        product.setBrand(trimToNull(request.getBrand()));
        product.setOrigin(trimToNull(request.getOrigin()));
        product.setPiecesPerBox(request.getPiecesPerBox());
        product.setListPrice(request.getListPrice());
        product.setStock(request.getStock());
        product.setExpiryDate(request.getExpiryDate());
        // AC-30.3 (LOCAL only until packaging standard is met) waits for Q-11: any label is accepted for now
        product.setDeliveryLabel(request.getDeliveryLabel());
        product.setQuoteThreshold(request.getQuoteThreshold());
        product.setStatus(ProductStatus.ON_SALE);
        replaceTiers(product, request.getPriceTiers());

        return toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(String accountId, String productId, UpdateProductRequest req) {
        VendorInfo vendor = requireShop(accountId);
        Product product = requireOwnProduct(vendor, productId);
        requireNotRemoved(product);

        Long oldPrice = product.getListPrice();
        Integer oldStock = product.getStock();

        // missing / null / blank = keep the old value, so the client can send just the field it changes
        if (StringUtils.hasText(req.getName())) {
            product.setName(req.getName().trim());
        }
        if (StringUtils.hasText(req.getDescription())) {
            product.setDescription(req.getDescription().trim());
        }
        if (req.getImageKeys() != null && !req.getImageKeys().isEmpty()) {
            replaceImages(product, req.getImageKeys());
        }
        if (StringUtils.hasText(req.getCakeType())) {
            product.setCakeType(req.getCakeType().trim());
        }
        if (StringUtils.hasText(req.getBrand())) {
            product.setBrand(req.getBrand().trim());
        }
        if (StringUtils.hasText(req.getOrigin())) {
            product.setOrigin(req.getOrigin().trim());
        }
        if (req.getPiecesPerBox() != null) {
            product.setPiecesPerBox(req.getPiecesPerBox());
        }
        if (req.getListPrice() != null) {
            product.setListPrice(req.getListPrice());
        }
        if (req.getStock() != null) {
            product.setStock(req.getStock());
        }
        if (req.getExpiryDate() != null) {
            product.setExpiryDate(req.getExpiryDate());
        }
        if (req.getDeliveryLabel() != null) {
            product.setDeliveryLabel(req.getDeliveryLabel());
        }
        if (req.getQuoteThreshold() != null) {
            product.setQuoteThreshold(req.getQuoteThreshold());
        }
        if (req.getPriceTiers() != null) {
            validateTiers(req.getPriceTiers());
            replaceTiers(product, req.getPriceTiers());
        }
        requireResaleInfo(vendor, product.getBrand(), product.getOrigin());

        // AC-31.2: paid orders keep their own copied price, so changing it here never touches them
        audit(accountId, "PRODUCT_PRICE_CHANGED", product.getId(), oldPrice, product.getListPrice());
        audit(accountId, "PRODUCT_STOCK_CHANGED", product.getId(), oldStock, product.getStock());

        // flush now so the response carries the new updatedAt
        return toResponse(productRepository.saveAndFlush(product));
    }

    @Override
    @Transactional
    public ProductResponse setVisibility(String accountId, String productId, boolean visible) {
        VendorInfo vendor = requireShop(accountId);
        Product product = requireOwnProduct(vendor, productId);
        requireNotRemoved(product);
        product.setStatus(visible ? ProductStatus.ON_SALE : ProductStatus.HIDDEN);
        return toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public void deleteProduct(String accountId, String productId) {
        VendorInfo vendor = requireShop(accountId);
        Product product = requireOwnProduct(vendor, productId);
        product.setDeleted(true);
        productRepository.save(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getMyProducts(String accountId, ProductStatus status) {
        VendorInfo vendor = requireShop(accountId);
        List<Product> products = status == null
                ? productRepository.findByVendorIdAndDeletedFalseOrderByCreatedAtDesc(vendor.id())
                : productRepository.findByVendorIdAndStatusAndDeletedFalseOrderByCreatedAtDesc(vendor.id(), status);
        return products.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getMyProduct(String accountId, String productId) {
        VendorInfo vendor = requireShop(accountId);
        return toResponse(requireOwnProduct(vendor, productId));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> searchOnSale(String vendorId, String keyword, int page, int size) {
        PageRequest pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(productRepository
                .searchOnSale(trimToNull(vendorId), trimToNull(keyword), pageable)
                .map(this::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getOnSaleProduct(String productId) {
        return productRepository
                .findByIdAndStatusAndDeletedFalse(productId, ProductStatus.ON_SALE)
                .map(this::toResponse)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm"));
    }

    /**
     * An APPROVED vendor that opened a Shop (FR-27, FR-30). Owning a vendor is not a role (D-19): it is looked up by
     * account id.
     */
    private VendorInfo requireShop(String accountId) {
        VendorInfo vendor;
        try {
            vendor = vendorClient.getVendorByOwnerAccountId(accountId);
        } catch (FeignException.NotFound e) {
            throw new CustomException(HttpStatus.FORBIDDEN, "Tài khoản chưa đăng ký người bán");
        }
        if (!"APPROVED".equals(vendor.status())) {
            throw new CustomException(HttpStatus.FORBIDDEN, "Người bán chưa được duyệt hoặc đang bị khóa");
        }
        if (!vendor.sellsShop()) {
            throw new CustomException(HttpStatus.FORBIDDEN, "Người bán chưa mở Shop");
        }
        return vendor;
    }

    private Product requireOwnProduct(VendorInfo vendor, String productId) {
        Product product = productRepository
                .findByIdAndDeletedFalse(productId)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm"));
        if (!product.getVendorId().equals(vendor.id())) {
            // same answer as "not found": do not reveal other shops' product ids
            throw new CustomException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm");
        }
        return product;
    }

    private static void requireNotRemoved(Product product) {
        if (product.getStatus() == ProductStatus.REMOVED) {
            throw new CustomException("Sản phẩm đã bị quản trị viên gỡ, không thể chỉnh sửa");
        }
    }

    /** AC-30.2. A BOTH vendor may also sell its own cakes, so only a pure reseller is forced. */
    private static void requireResaleInfo(VendorInfo vendor, String brand, String origin) {
        if ("RESELL".equals(vendor.supplySource()) && (!StringUtils.hasText(brand) || !StringUtils.hasText(origin))) {
            throw new CustomException("Sản phẩm bán lại bắt buộc có thương hiệu và nơi sản xuất");
        }
    }

    /** AC-32.1: several (fromQty, unitPrice) tiers that do not overlap, i.e. no two share a fromQty. */
    private static void validateTiers(List<PriceTierRequest> tiers) {
        if (tiers == null) {
            return;
        }
        Set<Integer> seen = new HashSet<>();
        for (PriceTierRequest t : tiers) {
            if (!seen.add(t.getFromQty())) {
                throw new CustomException("Bậc giá bị trùng số lượng từ " + t.getFromQty());
            }
        }
    }

    /**
     * Sets the product's images to requestedKeys, in that order: keys it already has stay, new uploads are checked and
     * moved to the public bucket. MinIO is brought in line with the database once the transaction ends.
     */
    private void replaceImages(Product product, List<String> requestedKeys) {
        List<String> currentKeys = List.copyOf(product.getImageKeys());
        validateImageKeys(requestedKeys, currentKeys);
        List<String> finalKeys = moveNewUploads(requestedKeys, currentKeys);

        List<String> addedKeys =
                finalKeys.stream().filter(k -> !currentKeys.contains(k)).toList();
        List<String> droppedKeys =
                currentKeys.stream().filter(k -> !finalKeys.contains(k)).toList();
        deleteImagesAfterTransaction(droppedKeys, addedKeys);
        product.setImageKeys(new ArrayList<>(finalKeys));
    }

    private void validateImageKeys(List<String> requestedKeys, List<String> currentKeys) {
        if (new HashSet<>(requestedKeys).size() != requestedKeys.size()) {
            throw new CustomException("Danh sách ảnh bị trùng");
        }
        for (String key : requestedKeys) {
            if (!currentKeys.contains(key) && !objectStorage.isTempKey(key)) {
                // a key of another product, or made up: never let one Shop attach another's image
                throw new CustomException("Ảnh không hợp lệ: " + key);
            }
        }
    }

    /**
     * Returns requestedKeys with every new upload replaced by its key in the public bucket. All or nothing: if one
     * upload is rejected, the ones already moved are deleted again.
     */
    private List<String> moveNewUploads(List<String> requestedKeys, List<String> currentKeys) {
        List<String> finalKeys = new ArrayList<>();
        try {
            for (String key : requestedKeys) {
                finalKeys.add(
                        currentKeys.contains(key)
                                ? key
                                : objectStorage.moveUploadedFile(
                                        key,
                                        productImageProperties.toFileLimit(),
                                        BucketAccess.PUBLIC,
                                        IMAGE_KEY_PREFIX));
            }
        } catch (RuntimeException e) {
            finalKeys.stream()
                    .filter(k -> !currentKeys.contains(k))
                    .forEach(k -> objectStorage.deleteQuietly(BucketAccess.PUBLIC, k));
            throw e;
        }
        return finalKeys;
    }

    /** Commit: delete images the product no longer has. Rollback: delete the ones just added. */
    private void deleteImagesAfterTransaction(List<String> droppedKeys, List<String> addedKeys) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                List<String> keysToDelete = status == STATUS_COMMITTED ? droppedKeys : addedKeys;
                keysToDelete.forEach(k -> objectStorage.deleteQuietly(BucketAccess.PUBLIC, k));
            }
        });
    }

    private static void replaceTiers(Product product, List<PriceTierRequest> tiers) {
        product.getPriceTiers().clear();
        if (tiers == null) {
            return;
        }
        tiers.stream()
                .sorted((a, b) -> Integer.compare(a.getFromQty(), b.getFromQty()))
                .forEach(t -> {
                    ProductPriceTier tier = new ProductPriceTier();
                    tier.setProduct(product);
                    tier.setFromQty(t.getFromQty());
                    tier.setUnitPrice(t.getUnitPrice());
                    product.getPriceTiers().add(tier);
                });
    }

    private void audit(String accountId, String action, String productId, Object before, Object after) {
        if (Objects.equals(before, after)) {
            return;
        }
        // NFR-07: stored by orchestrator-service; AuditPublisher sends it once this transaction commits
        eventPublisher.publishEvent(new AuditEvent(
                "catalog-service",
                accountId,
                action,
                "PRODUCT",
                productId,
                String.valueOf(before),
                String.valueOf(after),
                null,
                Instant.now()));
    }

    private ProductResponse toResponse(Product product) {
        return ProductMapper.toResponse(product, objectStorage::toPublicUrl);
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}

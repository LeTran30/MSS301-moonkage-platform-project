package com.moonkage.catalog.service.impl;

import com.moonkage.catalog.client.IdentityClient;
import com.moonkage.catalog.common.exception.CustomException;
import com.moonkage.catalog.dto.client.VendorInfo;
import com.moonkage.catalog.dto.request.CreateProductRequest;
import com.moonkage.catalog.dto.request.PriceTierRequest;
import com.moonkage.catalog.dto.request.UpdateProductRequest;
import com.moonkage.catalog.dto.response.PageResponse;
import com.moonkage.catalog.dto.response.ProductResponse;
import com.moonkage.catalog.entity.AuditLog;
import com.moonkage.catalog.entity.Product;
import com.moonkage.catalog.entity.ProductPriceTier;
import com.moonkage.catalog.enums.ProductStatus;
import com.moonkage.catalog.repository.AuditLogRepository;
import com.moonkage.catalog.repository.ProductRepository;
import com.moonkage.catalog.service.ProductService;
import feign.FeignException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private static final String SELLER = "SELLER";
    private static final int MAX_PAGE_SIZE = 100;

    private final ProductRepository productRepository;
    private final AuditLogRepository auditLogRepository;
    private final IdentityClient identityClient;

    @Override
    @Transactional
    public ProductResponse createProduct(String userId, String role, CreateProductRequest request) {
        VendorInfo vendor = requireShop(userId, role);
        requireResaleInfo(vendor, request.getBrand(), request.getOrigin());
        validateTiers(request.getPriceTiers());

        Product product = new Product();
        product.setVendorId(vendor.id());
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription().trim());
        product.setImageUrls(new ArrayList<>(request.getImageUrls()));
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

        return ProductResponse.from(productRepository.save(product));
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(String userId, String role, String productId, UpdateProductRequest req) {
        VendorInfo vendor = requireShop(userId, role);
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
        if (req.getImageUrls() != null && !req.getImageUrls().isEmpty()) {
            product.setImageUrls(new ArrayList<>(req.getImageUrls()));
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
        audit(userId, "PRODUCT_PRICE_CHANGED", product.getId(), oldPrice, product.getListPrice());
        audit(userId, "PRODUCT_STOCK_CHANGED", product.getId(), oldStock, product.getStock());

        // flush now so the response carries the new updatedAt
        return ProductResponse.from(productRepository.saveAndFlush(product));
    }

    @Override
    @Transactional
    public ProductResponse setVisibility(String userId, String role, String productId, boolean visible) {
        VendorInfo vendor = requireShop(userId, role);
        Product product = requireOwnProduct(vendor, productId);
        requireNotRemoved(product);
        product.setStatus(visible ? ProductStatus.ON_SALE : ProductStatus.HIDDEN);
        return ProductResponse.from(productRepository.save(product));
    }

    @Override
    @Transactional
    public void deleteProduct(String userId, String role, String productId) {
        VendorInfo vendor = requireShop(userId, role);
        Product product = requireOwnProduct(vendor, productId);
        product.setDeleted(true);
        productRepository.save(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getMyProducts(String userId, String role, ProductStatus status) {
        VendorInfo vendor = requireShop(userId, role);
        List<Product> products = status == null
                ? productRepository.findByVendorIdAndDeletedFalseOrderByCreatedAtDesc(vendor.id())
                : productRepository.findByVendorIdAndStatusAndDeletedFalseOrderByCreatedAtDesc(vendor.id(), status);
        return products.stream().map(ProductResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getMyProduct(String userId, String role, String productId) {
        VendorInfo vendor = requireShop(userId, role);
        return ProductResponse.from(requireOwnProduct(vendor, productId));
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
                .map(ProductResponse::from));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getOnSaleProduct(String productId) {
        return productRepository
                .findByIdAndStatusAndDeletedFalse(productId, ProductStatus.ON_SALE)
                .map(ProductResponse::from)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm"));
    }

    /** Role SELLER (from the token) plus an APPROVED vendor that opened a Shop (FR-27, FR-30). */
    private VendorInfo requireShop(String userId, String role) {
        if (!SELLER.equals(role)) {
            throw new CustomException(HttpStatus.FORBIDDEN, "Chỉ người bán mới được quản lý sản phẩm");
        }
        VendorInfo vendor;
        try {
            vendor = identityClient.getVendorByOwnerUserId(userId);
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

    private void audit(String userId, String action, String productId, Object before, Object after) {
        if (Objects.equals(before, after)) {
            return;
        }
        AuditLog log = new AuditLog();
        log.setActorUserId(userId);
        log.setAction(action);
        log.setTargetType("PRODUCT");
        log.setTargetId(productId);
        log.setBeforeValue(String.valueOf(before));
        log.setAfterValue(String.valueOf(after));
        auditLogRepository.save(log);
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}

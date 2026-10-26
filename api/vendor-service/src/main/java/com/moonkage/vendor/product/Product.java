package com.moonkage.vendor.product;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.Price;
import com.moonkage.vendor.common.vo.PriceTier;
import com.moonkage.vendor.common.vo.PriceTiers;
import com.moonkage.vendor.common.vo.Quantity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.util.StringUtils;

/**
 * A ready-made product a Shop sells (FR-29), written here only (L-18); catalog keeps a copy built from
 * product.upserted. Its fields only change through {@link ProductDetails}, which are always complete, so a product
 * shown again is always sellable (AC-34.4). Never deleted (AC-34.6).
 */
@Entity
@Table(name = "products")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, updatable = false)
    private String vendorId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    /** Never empty (BR-12): typed by the Shop, or its business name (AC-29.4). */
    @Column(nullable = false)
    private String brand;

    private String origin;

    @Column(nullable = false)
    private boolean resold;

    private Quantity piecesPerBox;

    /** VAT included (AC-29.1); an order copies it, so a change never touches an order made (AC-30.2). */
    @Column(nullable = false)
    private Price listPrice;

    /** 0 means not for sale now (AC-30.1). */
    @Column(nullable = false)
    private int stock;

    @Column(nullable = false)
    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryLabel deliveryLabel;

    private Quantity quoteThreshold;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus status;

    /** Why an admin removed it (BR-24). */
    @Column(columnDefinition = "TEXT")
    private String removedReason;

    /** The admin account that removed it. */
    @Column(length = 36)
    private String removedBy;

    @ElementCollection
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "position")
    @Column(name = "object_key", nullable = false)
    private List<String> imageKeys = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductPriceTier> priceTiers = new ArrayList<>();

    /** Crusts and fillings (BR-34), ids of the FR-54 catalogue; a hidden one stays until the Shop drops it. */
    @ElementCollection
    @CollectionTable(name = "product_cake_attributes", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "attribute_id", nullable = false)
    private Set<String> cakeAttributeIds = new HashSet<>();

    @Version
    private long version;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    /** On sale at once, without review (BR-24). */
    static Product create(String vendorId, ProductDetails details) {
        Product product = new Product();
        product.vendorId = vendorId;
        product.status = ProductStatus.ON_SALE;
        product.apply(details);
        return product;
    }

    /** FR-30, FR-33: anything but a removed product. */
    void replace(ProductDetails details) {
        checkEditable();
        apply(details);
    }

    /** A removed product is no longer the Shop's to change (BR-24, AC-34.5). */
    void checkEditable() {
        if (status == ProductStatus.REMOVED) {
            throw new AppException(ErrorCode.PRODUCT_REMOVED);
        }
    }

    /** FR-34: leaves the buyer's search and Shop page; orders already made go on (AC-34.3). */
    void hide() {
        moveTo(ProductStatus.HIDDEN);
    }

    void show() {
        moveTo(ProductStatus.ON_SALE);
    }

    /** FR-46, BR-24: by an admin, with a reason, for good. */
    void remove(String reason, String adminAccountId) {
        if (!StringUtils.hasText(reason)) {
            throw new AppException(ErrorCode.REMOVED_REASON_REQUIRED);
        }
        moveTo(ProductStatus.REMOVED);
        removedReason = reason.trim();
        removedBy = adminAccountId;
    }

    PriceTiers toPriceTiers() {
        return PriceTiers.of(
                priceTiers.stream().map(ProductPriceTier::toPriceTier).toList());
    }

    private void moveTo(ProductStatus target) {
        checkEditable();
        if (!status.canTransitionTo(target)) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        }
        status = target;
    }

    private void apply(ProductDetails details) {
        name = details.name();
        description = details.description();
        brand = details.brand();
        origin = details.origin();
        resold = details.resold();
        piecesPerBox = details.piecesPerBox();
        listPrice = details.listPrice();
        stock = details.stock();
        expiryDate = details.expiryDate();
        deliveryLabel = details.deliveryLabel();
        quoteThreshold = details.quoteThreshold();
        imageKeys.clear();
        imageKeys.addAll(details.imageKeys());
        cakeAttributeIds.clear();
        details.cakeAttributes().forEach(value -> cakeAttributeIds.add(value.id()));
        replacePriceTiers(details.priceTiers());
    }

    /**
     * Keeps the row of a tier whose start stays, so no insert meets the unique (product_id, from_qty) of a row still
     * waiting to be deleted (Hibernate inserts before it deletes).
     */
    private void replacePriceTiers(PriceTiers tiers) {
        Map<Quantity, PriceTier> wanted =
                tiers.tiers().stream().collect(Collectors.toMap(PriceTier::fromQty, Function.identity()));
        priceTiers.removeIf(existing -> !wanted.containsKey(existing.getFromQty()));
        Set<Quantity> kept = new HashSet<>();
        for (ProductPriceTier existing : priceTiers) {
            existing.changeUnitPrice(wanted.get(existing.getFromQty()).unitPrice());
            kept.add(existing.getFromQty());
        }
        wanted.values().stream()
                .filter(tier -> !kept.contains(tier.fromQty()))
                .forEach(tier -> priceTiers.add(ProductPriceTier.of(this, tier)));
    }
}

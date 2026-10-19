package com.moonkage.catalog.entity;

import com.moonkage.catalog.enums.DeliveryLabel;
import com.moonkage.catalog.enums.ProductStatus;
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
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Ready-to-sell Shop product (FR-30 - FR-32).
 */
@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String vendorId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    /** Cake type, used as filter (FR-05). */
    private String cakeType;

    /** Required for resold products (BR-12). */
    private String brand;

    /** Place of manufacture; required for resold products (BR-12). */
    private String origin;

    /** Number of cakes per box, shown in comparison (AC-06.2). */
    private Integer piecesPerBox;

    /** VAT-inclusive listed price, VND (BR-06). */
    @Column(nullable = false)
    private Long listPrice;

    @Column(nullable = false)
    private Integer stock;

    @Column(nullable = false)
    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryLabel deliveryLabel;

    /** Qty at/above which buyer must send a request; only effective if vendor accepts orders (FR-32). */
    private Integer quoteThreshold;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus status = ProductStatus.ON_SALE;

    @Column(columnDefinition = "TEXT")
    private String removedReason;

    /** Seller deleted it; kept so carts and order history that reference the id stay valid. */
    @Column(nullable = false)
    private boolean deleted = false;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("fromQty ASC")
    private List<ProductPriceTier> priceTiers = new ArrayList<>();

    /** MinIO object keys in the public bucket; the URL is built when reading, so the host can change. */
    @ElementCollection
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "object_key", nullable = false)
    private List<String> imageKeys = new ArrayList<>();

    /** Optimistic lock: two buyers racing for the last box must not both succeed (FR-09). */
    @Version
    private Long version;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

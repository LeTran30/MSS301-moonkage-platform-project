package com.bake2b.tender.entity;

import com.bake2b.tender.enums.CustomType;
import com.bake2b.tender.enums.RequestStatus;
import com.bake2b.tender.enums.RequestType;
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
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Buyer request for a quote, direct or open (FR-15, FR-16). Delivery address is copied in.
 */
@Entity
@Table(name = "tender_requests")
@Getter
@Setter
@NoArgsConstructor
public class TenderRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String buyerUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestType type;

    /** Required when type = DIRECT. */
    private String targetVendorId;

    private String productId;

    @Column(nullable = false)
    private Integer quantity;

    /** VND; open requests only. */
    private Long budget;

    @Column(nullable = false)
    private LocalDate deliveryDeadline;

    @Column(nullable = false)
    private String deliveryAddressDetail;

    @Column(nullable = false)
    private String deliveryAreaCode;

    @ElementCollection
    @CollectionTable(name = "tender_request_custom_types", joinColumns = @JoinColumn(name = "tender_request_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "custom_type", nullable = false)
    private Set<CustomType> customTypes = new HashSet<>();

    @Column(columnDefinition = "TEXT")
    private String customSpec;

    @ElementCollection
    @CollectionTable(name = "tender_request_logos", joinColumns = @JoinColumn(name = "tender_request_id"))
    @Column(name = "file_url", nullable = false)
    private List<String> logoFileUrls = new ArrayList<>();

    /** Set when created via 're-order' (FR-23). */
    private String sourceOrderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.OPEN;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

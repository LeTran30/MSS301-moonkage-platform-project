package com.moonkage.tender.entity;

import com.moonkage.tender.enums.InvitationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/**
 * A vendor's slot on a request; direct requests get one for the target vendor (FR-16, FR-36).
 */
@Entity
@Table(
        name = "tender_invitations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"tender_request_id", "vendorId"}))
@Getter
@Setter
@NoArgsConstructor
public class TenderInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tender_request_id", nullable = false)
    private TenderRequest tenderRequest;

    @Column(nullable = false)
    private String vendorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvitationStatus status = InvitationStatus.PENDING;

    /** Mandatory when declined (AC-36.3). */
    @Column(columnDefinition = "TEXT")
    private String declineReason;

    private LocalDateTime respondedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

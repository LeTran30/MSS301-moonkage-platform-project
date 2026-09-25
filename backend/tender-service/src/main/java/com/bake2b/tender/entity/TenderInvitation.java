package com.bake2b.tender.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Represents an invitation sent to a vendor to participate in a tender.
 */
@Entity
@Table(name = "tender_invitations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TenderInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String tenderRequestId;

    @Column(nullable = false)
    private String vendorId;

    private String status;

    private LocalDateTime sentAt;

    private LocalDateTime respondedAt;

    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
    }
}

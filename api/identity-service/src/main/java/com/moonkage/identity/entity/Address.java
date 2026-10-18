package com.moonkage.identity.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Saved delivery address of an account (FR-03). At most one default per account. Timestamps come from BaseEntity
 * (Instant, so the API returns them with a time zone, Software Design 5.1 rule 7).
 */
@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
public class Address extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(nullable = false)
    private String detail;

    /** Delivery-area key used for area matching; unit (province/district/ward) still open (Q-12). */
    @Column(nullable = false)
    private String areaCode;

    @Column(nullable = false)
    private boolean isDefault;
}
